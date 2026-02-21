import { readDB } from './db.js'
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Compose a daily digest from theme summaries
export async function composeDailyDigest() {
  const db = await readDB()
  // Get all theme summaries
  const summaries = db.filter(x => x.type === 'theme_summary')
  if (!summaries.length) throw new Error('No theme summaries found. Run summarization first.')

  // Compose a digest intro using Gemini
  const themes = summaries.map(s => s.theme)
  const introPrompt = `You are a news presenter. Write a short, engaging introduction for a daily news digest covering these themes: ${themes.join(', ')}. Keep it factual, neutral, and inviting for a general audience.`
  const introResp = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: introPrompt
  })
  const intro = introResp.candidates[0].content.parts.map(p => p.text).join('\n').trim()

  // Compose the digest
  let digest = intro + '\n\n'
  for (const s of summaries) {
    digest += `---\n# ${s.theme.charAt(0).toUpperCase() + s.theme.slice(1)}\n` + s.summary + '\n\n'
  }
  return digest.trim()
}
