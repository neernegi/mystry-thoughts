import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(request: NextRequest) {
  try {
    const { content, type } = await request.json();

    if (!content || !type) {
      return NextResponse.json(
        { error: "Content and type are required" },
        { status: 400 }
      );
    }

    // SOLUTION 1: Use the model with more generous free tier limits
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

    const prompt =
      type === "thought"
        ? createThoughtPrompt(content)
        : createConfessionPrompt(content);

    // SOLUTION 2: Implement robust retry logic for rate limit errors
    let result;
    let retries = 3;
    let delay = 2000; // Start with 2 seconds

    while (retries > 0) {
        try {
            result = await model.generateContent(prompt);
            break; // Success! Exit the loop.
        } catch (error: any) {
            // Check if the error indicates a rate limit
            const isRateLimitError = error.status === 429 || (error.message && error.message.includes('429'));
            
            if (isRateLimitError && retries > 1) {
                console.warn(`Rate limit hit. Retrying in ${delay / 1000}s... (${retries - 1} retries left)`);
                await new Promise(resolve => setTimeout(resolve, delay));
                retries--;
                delay *= 2; // Exponentially increase delay
            } else {
                // If it's another type of error or the last retry, throw it
                console.error("Error generating AI insight:", error);
                return NextResponse.json(
                    { error: "Failed to generate AI insight due to API error or rate limits." },
                    { status: error.status || 500 }
                );
            }
        }
    }
    
    if (!result) {
        return NextResponse.json(
            { error: "Failed to generate AI insight after multiple retries." },
            { status: 500 }
        );
    }
    
    const response = await result.response;
    const text = response.text();
    const slides = parseAIResponse(text);

    return NextResponse.json({ slides });

  } catch (error) {
    console.error("Final catch block:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}

// ... (Your createThoughtPrompt, createConfessionPrompt, and parseAIResponse functions remain unchanged)
function createThoughtPrompt(thought: string): string {
  return `
Analyze this anonymous thought and create exactly 5 slides with insights. Each slide should have a heading and 3-4 bullet points.

Thought: "${thought}"

Create 4 slides with these themes:
1. **Summary & Key Themes** - Summarize the main points and identify key themes
2. **Emotional Analysis** - Analyze the emotions and feelings expressed
3. **Encouraging Response** - Offer supportive or motivational perspective

Format your response EXACTLY like this:

SLIDE 1: Summary & Key Themes
- Main point summarized in one clear sentence
- Core theme or topic identified
- Key message the person wants to convey


SLIDE 2: Emotional Analysis
- Primary emotion detected and explained
- Secondary emotions or feelings present



SLIDE 3: Encouraging Response
- Supportive message for the person
- Positive reframe if appropriate


Keep each bullet point concise but meaningful (8-10 words max).
`;
}

function createConfessionPrompt(confession: string): string {
  return `
Analyze this anonymous confession and create exactly 5 slides with insights. Each slide should have a heading and 3-4 bullet points.

Confession: "${confession}"

Create 5 slides with these themes:
1. **Summary & Understanding** - Summarize what they're confessing and show understanding
2. **Emotional Support** - Acknowledge their feelings and provide emotional validation
3. **Growth & Learning** - Focus on potential growth or lessons from this experience


Format your response EXACTLY like this:

SLIDE 1: Summary & Understanding
- What they're confessing summarized respectfully
- Understanding of why this matters to them

SLIDE 2: Emotional Support
- Validation of their feelings as normal
- Comfort in knowing they're not alone

SLIDE 3: Growth & Learning
- Potential lessons from this experience
- Opportunity for positive change


Keep each bullet point supportive and concise (8-10 words max).
Be compassionate and avoid being preachy or judgmental.
`;
}

function parseAIResponse(
  aiText: string
): Array<{ heading: string; bulletPoints: string[] }> {
  const slides = [];
  const slideRegex = /SLIDE \d+: (.+?)\n((?:- .+\n?)+)/g;

  let match;
  while ((match = slideRegex.exec(aiText)) !== null) {
    const heading = match[1].trim();
    const bulletText = match[2].trim();
    const bulletPoints = bulletText
      .split("\n")
      .map((line) => line.replace(/^- /, "").trim())
      .filter((line) => line.length > 0);

    slides.push({ heading, bulletPoints });
  }

  // Fallback parsing if regex doesn't work
  if (slides.length === 0) {
    const lines = aiText.split("\n").filter((line) => line.trim());
    let currentSlide: { heading: string; bulletPoints: string[] } | null = null;

    for (const line of lines) {
      if (line.startsWith("SLIDE") && line.includes(":")) {
        if (currentSlide) slides.push(currentSlide);
        currentSlide = {
          heading: line.split(":")[1].trim(),
          bulletPoints: [] as string[],
        };
      } else if (line.startsWith("-") && currentSlide) {
        currentSlide.bulletPoints.push(line.replace(/^- /, "").trim());
      }
    }

    if (currentSlide) slides.push(currentSlide);
  }

  // Ensure we have exactly 5 slides
  while (slides.length < 3) {
    slides.push({
      heading: "Additional Insight",
      bulletPoints: [
        "Processing additional insights...",
        "Please wait for complete analysis",
        "More details coming soon",
      ],
    });
  }

  return slides.slice(0, 3);
}