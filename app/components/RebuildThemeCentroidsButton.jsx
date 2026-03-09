'use client'

import { useState } from 'react'

export default function RebuildThemeCentroidsButton() {
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState(null)
  const [error, setError] = useState(null)

  const handleRebuild = async () => {
    setIsLoading(true)
    setStatus(null)
    setError(null)

    try {
      const response = await fetch('/api/themes/centroids', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to rebuild centroids')
      }

      setStatus(data.message)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="mb-4">
      <button
        onClick={handleRebuild}
        disabled={isLoading}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
      >
        {isLoading ? 'Rebuilding Theme Centroids...' : 'Rebuild Theme Centroids'}
      </button>

      {status && (
        <div className="mt-2 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
          ✓ {status}
        </div>
      )}

      {error && (
        <div className="mt-2 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          ✗ {error}
        </div>
      )}
    </div>
  )
}
