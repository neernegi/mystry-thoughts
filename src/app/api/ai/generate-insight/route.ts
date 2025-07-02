import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";
import dbConnect from "@/lib/dbConnect";
import AIInsightCache from "@/model/AIInsightCache";

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Initialize Groq AI
let groq: Groq | null = null;
if (process.env.GROQ_API_KEY) {
  groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1",
  });
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const { content, type } = await request.json();

    if (!content || !type) {
      return NextResponse.json(
        { error: "Content and type are required" },
        { status: 400 }
      );
    }

    // Check cache first
    const cachedInsight = await AIInsightCache.findOne({
      content,
      type,
    });

    if (cachedInsight) {
      return NextResponse.json({ slides: cachedInsight.slides });
    }

    const prompt =
      type === "thought"
        ? createThoughtPrompt(content)
        : createConfessionPrompt(content);

    let aiResponseText: string;

    try {
      // Primary API: Try Gemini first
      console.log("Attempting to generate insight with Gemini...");
      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash-latest",
      });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      aiResponseText = response.text();
      console.log("Successfully generated insight with Gemini.");
    } catch (geminiError: any) {
      console.warn("Gemini API call failed:", geminiError.message);

      const isRateLimitError =
        geminiError.status === 429 ||
        (geminiError.message && geminiError.message.includes("429"));

      if (isRateLimitError) {
        // Fallback API: If Gemini is rate-limited, switch to Groq
        console.log("Gemini rate limit hit. Switching to Groq as a fallback.");
        try {
          if (!groq) {
            throw new Error("Groq API key is not configured.");
          }
          const chatCompletion = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "llama-3.3-70b-versatile",
          });
          aiResponseText = chatCompletion.choices[0]?.message?.content || "";
          if (!aiResponseText) {
            throw new Error("Groq returned an empty response.");
          }
          console.log("Successfully generated insight with Groq.");
        } catch (groqError: any) {
          console.error("Groq API call also failed:", groqError.message);
          return NextResponse.json(
            {
              error: "Failed to generate AI insight from both Gemini and Groq.",
            },
            { status: 500 }
          );
        }
      } else {
        // Handle other Gemini errors
        console.error(
          "A non-rate-limit error occurred with the Gemini API:",
          geminiError
        );
        return NextResponse.json(
          {
            error: "Failed to generate AI insight due to a primary API error.",
          },
          { status: 500 }
        );
      }
    }

    const slides = parseAIResponse(aiResponseText);

    // Cache the new insight
    await AIInsightCache.create({
      content,
      type,
      slides,
    });

    return NextResponse.json({ slides });
  } catch (error) {
    console.error("Final catch block:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}

// --- Helper Functions (No changes needed for these) ---

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

  // Ensure we have exactly 3 slides
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
