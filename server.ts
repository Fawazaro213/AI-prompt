import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  app.post('/api/optimize', async (req, res) => {
    try {
      const { draft } = req.body;
      if (!process.env.GEMINI_API_KEY) {
        throw new Error('GEMINI_API_KEY environment variable is missing.');
      }
      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: { 'User-Agent': 'aistudio-build' }
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
      res.json(JSON.parse(response.text!));
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: error.message || 'Failed to optimize prompt' });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
