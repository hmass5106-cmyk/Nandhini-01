import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
dotenv.config();
const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.use(express.json({ limit: '20kb' }));
app.use(express.static(__dirname));
app.post('/api/chat', async (req, res) => {
  const message = String(req.body?.message || '').trim();
  const language = String(req.body?.language || 'ta-IN');
  if (!message) return res.status(400).json({ error: 'Message is required' });
  if (!process.env.OPENAI_API_KEY) return res.status(503).json({ error: 'AI is not configured. Set OPENAI_API_KEY on the server.' });
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: `You are Nandhini, a warm, friendly AI companion. Reply naturally and conversationally, preferably in Tamil written in Tamil script when the user writes Tamil, or in Tamil-English transliteration when they use that. Current selected speech language: ${language}. Be honest that you are an AI, not a human. Keep answers clear and reasonably concise.` },
          { role: 'user', content: message }
        ], temperature: 0.8, max_tokens: 500
      })
    });
    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data.error?.message || 'AI provider request failed' });
    res.json({ reply: data.choices?.[0]?.message?.content || 'Sorry, I could not make a reply.' });
  } catch (e) { res.status(500).json({ error: 'Could not reach AI service' }); }
});
const port = Number(process.env.PORT || 3000);
app.listen(port, () => console.log(`Nandhini AI running on http://localhost:${port}`));
