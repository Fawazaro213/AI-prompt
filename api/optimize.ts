import { GoogleGenAI, Type } from '@google/genai';

export default async function handler(req: any, res: any) {
  // Add CORS headers for Vercel
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { draft } = req.body;
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY environment variable is missing.');
    }
    
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: { 'User-Agent': 'prompt-lab-vercel' }
      }
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: `You are an expert prompt engineer. Please optimize the following prompt draft to make it highly effective for generative AI models. 
      It should include clear instructions, context, and any necessary constraints.
      
      Draft: ${draft}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "A concise title" },
            optimizedPrompt: { type: Type.STRING, description: "The expanded, optimized prompt text" },
            category: { 
              type: Type.STRING, 
              description: "One of: Code Assist, Image Gen, Data Parsing, Creative Writing, Agentic Workflows, General" 
            }
          },
          required: ["title", "optimizedPrompt", "category"]
        }
      }
    });
    
    res.status(200).json(JSON.parse(response.text!));
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message || 'Failed to optimize prompt' });
  }
}
