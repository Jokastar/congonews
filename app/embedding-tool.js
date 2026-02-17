"use client";
import { useState } from "react";

export default function EmbeddingTool() {
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const getEmbedding = async () => {
    setError(null);
    setResult(null);
    const res = await fetch("/api/embed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    const data = await res.json();
    if (data.embedding) setResult(data.embedding);
    else setError(data.error || "Unknown error");
  };
  return (
    <div className="p-4">
      <textarea
        className="border p-2 w-full text-black"
        onChange={(e) => setText(e.target.value)}
        value={text}
        rows={4}
        placeholder="Enter text to embed..."
      />
      <button
        onClick={getEmbedding}
        className="bg-blue-500 text-white px-4 py-2 mt-2 rounded"
      >
        Generate Embedding
      </button>
      {result && (
        <div className="mt-4">
          <p>Vector length: {result.length}</p>
          <p className="truncate text-xs text-gray-500">
            {JSON.stringify(result)}
          </p>
        </div>
      )}
      {error && <div className="text-red-500 mt-2">{error}</div>}
    </div>
  );
}
