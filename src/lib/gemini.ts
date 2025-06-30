import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function generateAIResponse(prompt: string) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Gemini API Error:', error);
    throw new Error('Failed to generate AI response');
  }
}

export async function generateKeyTerms(content: string, type: 'thought' | 'confession') {
  const prompt = `
    Analyze this ${type}: "${content}"
    
    Generate 2-3 key bullet points with good headings for this ${type}.
    Format as JSON:
    {
      "keyTerms": [
        {
          "heading": "Main Theme",
          "points": ["point 1", "point 2", "point 3"]
        }
      ]
    }
  `;
  
  const response = await generateAIResponse(prompt);
  try {
    return JSON.parse(response);
  } catch {
    return {
      keyTerms: [{
        heading: "Key Insights",
        points: ["Unable to parse response", "Please try again"]
      }]
    };
  }
}

export async function generateAIFeatures(content: string, type: 'thought' | 'confession') {
  const thoughtFeatures = [
    'AI Summary Generator',
    'Empathetic Response',
    'AI Coping Suggestion',
    'AI Tone Detector',
    'AI Thought Expander',
    'Creative Companion'
  ];
  
  const confessionFeatures = [
    'AI Listener (Non-judgmental Response)',
    'Confession Summary + Tag Generator',
    'Emotional Impact Level Detector',
    'Anonymous AI Discussion Thread',
    'Moral Compass Response',
    'If You Were Them Reflective Prompt'
  ];
  
  const features = type === 'thought' ? thoughtFeatures : confessionFeatures;
  const selectedFeatures = features.slice(0, 3); // Take first 3 features
  
  const responses = await Promise.all(
    selectedFeatures.map(async (feature) => {
      const prompt = `
        As an AI ${feature}, respond to this ${type}: "${content}"
        
        Provide a helpful, empathetic, and constructive response in 2-3 sentences.
      `;
      
      try {
        const response = await generateAIResponse(prompt);
        return {
          name: feature,
          description: `AI-generated ${feature.toLowerCase()}`,
          response: response
        };
      } catch {
        return {
          name: feature,
          description: `AI-generated ${feature.toLowerCase()}`,
          response: "Unable to generate response at this time."
        };
      }
    })
  );
  
  return responses;
}
