"use client"
import { useState } from "react"


export default function DeleteAllDataButton() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const handleDeleteAll = async () => {
    if (!window.confirm("Are you sure you want to delete all data in the database? This cannot be undone.")) return;
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch("/api/news", {
        method: "DELETE"
      })
      if (!res.ok) throw new Error("Failed to delete data")
      setResult("All data deleted.")
    } catch (e) {
      setError(e.message || "Error deleting data")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mb-4">
      <button
        onClick={handleDeleteAll}
        className="bg-red-600 text-white px-4 py-2 rounded disabled:opacity-50"
        disabled={loading}
      >
        {loading ? "Deleting..." : "Delete All Data"}
      </button>
      {error && <div className="text-red-500 mt-2">{error}</div>}
      {result && <div className="text-green-600 mt-2">{result}</div>}
    </div>
  )
}
