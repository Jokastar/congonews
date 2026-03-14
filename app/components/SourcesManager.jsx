"use client"
import { useState, useEffect } from "react"

const EMPTY_FORM = { url: "", start_date: "", end_date: "" }

export default function SourcesManager() {
  const [sources, setSources] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Add form state
  const [addForm, setAddForm] = useState(EMPTY_FORM)
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState(null)

  // Inline edit state: { [id]: { url, start_date, end_date } }
  const [editing, setEditing] = useState({})
  const [saving, setSaving] = useState({})

  // ── Fetch all sources ──────────────────────────────────────────────
  const loadSources = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/sources")
      if (!res.ok) throw new Error("Failed to load sources")
      setSources(await res.json())
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadSources() }, [])

  // ── Add ───────────────────────────────────────────────────────────
  const handleAdd = async (e) => {
    e.preventDefault()
    setAdding(true)
    setAddError(null)
    try {
      const res = await fetch("/api/sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addForm),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to add source")
      setAddForm(EMPTY_FORM)
      setSources((prev) => [...prev, data])
    } catch (e) {
      setAddError(e.message)
    } finally {
      setAdding(false)
    }
  }

  // ── Delete ────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this source?")) return
    const res = await fetch(`/api/sources/${id}`, { method: "DELETE" })
    if (res.ok) setSources((prev) => prev.filter((s) => s.id !== id))
  }

  // ── Edit helpers ──────────────────────────────────────────────────
  const startEdit = (source) =>
    setEditing((prev) => ({
      ...prev,
      [source.id]: { url: source.url, start_date: source.start_date || "", end_date: source.end_date || "" },
    }))

  const cancelEdit = (id) =>
    setEditing((prev) => { const n = { ...prev }; delete n[id]; return n })

  const handleEditChange = (id, field, value) =>
    setEditing((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } }))

  const handleSave = async (id) => {
    setSaving((prev) => ({ ...prev, [id]: true }))
    try {
      const res = await fetch(`/api/sources/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editing[id]),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to update source")
      setSources((prev) => prev.map((s) => (s.id === id ? data : s)))
      cancelEdit(id)
    } catch (e) {
      alert(e.message)
    } finally {
      setSaving((prev) => { const n = { ...prev }; delete n[id]; return n })
    }
  }

  // ── Render ────────────────────────────────────────────────────────
  return (
    <div className="rounded-lg p-4 bg-white">
      <h2 className="fs-section font-semibold mb-3">Sources</h2>

      {/* Error banner */}
      {error && <p className="text-red-500 fs-body mb-2">{error}</p>}

      {/* Source list */}
      <div className="mb-4 space-y-2">
        {loading ? (
          <p className="fs-body text-gray-400">Loading…</p>
        ) : sources.length === 0 ? (
          <p className="fs-body text-gray-400">No sources yet.</p>
        ) : (
          sources.map((source) => {
            const isEditing = Boolean(editing[source.id])
            const isSaving = Boolean(saving[source.id])
            const draft = editing[source.id] || {}

            return (
              <div key={source.id} className="flex flex-col gap-1 bg-gray-50 rounded p-2 fs-body">
                {isEditing ? (
                  // ── Edit row ──
                  <div className="flex flex-col gap-1">
                    <input
                      className="border rounded px-2 py-1 fs-body"
                      value={draft.url}
                      onChange={(e) => handleEditChange(source.id, "url", e.target.value)}
                      placeholder="URL"
                    />
                    <div className="flex gap-2">
                      <input
                        className="border rounded px-2 py-1 fs-body flex-1"
                        value={draft.start_date}
                        onChange={(e) => handleEditChange(source.id, "start_date", e.target.value)}
                        placeholder="Start date"
                      />
                      <input
                        className="border rounded px-2 py-1 fs-body flex-1"
                        value={draft.end_date}
                        onChange={(e) => handleEditChange(source.id, "end_date", e.target.value)}
                        placeholder="End date"
                      />
                    </div>
                    <div className="flex gap-2 mt-1">
                      <button
                        onClick={() => handleSave(source.id)}
                        disabled={isSaving}
                        className="bg-black text-white fs-caption px-3 py-1 rounded disabled:opacity-50"
                      >
                        {isSaving ? "Saving…" : "Save"}
                      </button>
                      <button
                        onClick={() => cancelEdit(source.id)}
                        className="fs-caption px-3 py-1 rounded border"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  // ── Display row ──
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex flex-col min-w-0">
                      <span className="truncate font-medium">{source.url}</span>
                      {(source.start_date || source.end_date) && (
                        <span className="fs-caption text-gray-400">
                          {source.start_date || "—"} → {source.end_date || "—"}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <span className={`fs-caption px-2 py-0.5 rounded ${source.active ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-500"}`}>
                        {source.active ? "active" : "inactive"}
                      </span>
                      <button
                        onClick={() => startEdit(source)}
                        className="fs-caption px-2 py-1 border rounded hover:bg-gray-100"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(source.id)}
                        className="fs-caption px-2 py-1 border border-red-300 text-red-500 rounded hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Add form */}
      <form onSubmit={handleAdd} className="border-t pt-3 space-y-2">
        <p className="fs-caption font-medium text-gray-500 uppercase tracking-wide">Add source</p>
        <input
          required
          className="w-full border rounded px-2 py-1 fs-body"
          placeholder="https://x.com/handle"
          value={addForm.url}
          onChange={(e) => setAddForm((f) => ({ ...f, url: e.target.value }))}
        />
        <div className="flex gap-2">
          <input
            className="flex-1 border rounded px-2 py-1 fs-body"
            placeholder="Start date (optional)"
            value={addForm.start_date}
            onChange={(e) => setAddForm((f) => ({ ...f, start_date: e.target.value }))}
          />
          <input
            className="flex-1 border rounded px-2 py-1 fs-body"
            placeholder="End date (optional)"
            value={addForm.end_date}
            onChange={(e) => setAddForm((f) => ({ ...f, end_date: e.target.value }))}
          />
        </div>
        {addError && <p className="text-red-500 fs-caption">{addError}</p>}
        <button
          type="submit"
          disabled={adding}
          className="bg-black text-white fs-body px-4 py-1.5 rounded disabled:opacity-50"
        >
          {adding ? "Adding…" : "Add source"}
        </button>
      </form>
    </div>
  )
}
