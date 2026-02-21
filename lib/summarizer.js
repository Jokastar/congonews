import { readDB, writeDB } from './db.js'
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Summarize a group of texts using Gemini LLM with thoughts
export async function summarizeTextsGemini(texts, theme) {
  const prompt = `As a news journalist, write a clear, factual summary of today's news about "${theme}". Use the following sources:\n\n${texts.join('\n\n')}`;
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      thinkingConfig: { includeThoughts: true }
    }
  });
  let summary = "";
  let thoughts = "";
  for (const part of response.candidates[0].content.parts) {
    if (part.thought) thoughts += part.text + "\n";
    else if (part.text) summary += part.text + "\n";
  }
  return { summary: summary.trim(), thoughts: thoughts.trim() };
}

// Summarize all themes and store in DB
export async function summarizeByThemeAndStore() {
  const db = await readDB()
  // Group by theme
  const byTheme = {}
  for (const item of db) {
    if (!item.theme) continue
    if (!byTheme[item.theme]) byTheme[item.theme] = []
    const text = [item.text, item.article?.text].filter(Boolean).join('\n')
    if (text) byTheme[item.theme].push({ id: item.id, text })
  }
  // Summarize each theme and store
  const themeSummaries = []
  for (const [theme, items] of Object.entries(byTheme)) {
    const texts = items.map(i => i.text)
    const { summary, thoughts } = await summarizeTextsGemini(texts, theme)
    themeSummaries.push({
      theme,
      summary,
      thoughts,
      sourceIds: items.map(i => i.id)
    })
  }
  // Write summaries to DB (as a new file or field)
  await writeDB([...db, ...themeSummaries.map(s => ({
    id: `summary:${s.theme}`,
    type: 'theme_summary',
    theme: s.theme,
    summary: s.summary,
    thoughts: s.thoughts,
    sourceIds: s.sourceIds
  }))])
  return themeSummaries
}
