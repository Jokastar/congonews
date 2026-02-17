import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export async function POST(req) {
  try {
    const { text } = await req.json();
    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }
    // Call the embedding model using Gemini documentation guidance
    const response = await ai.models.embedContent({
      model: "gemini-embedding-001",
      contents: text,
      taskType: "SEMANTIC_SIMILARITY"
    });
    const embedding = response.embeddings[0].values;
    return NextResponse.json({ embedding });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
