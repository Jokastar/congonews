export async function mapWithConcurrency(items, mapper, concurrency = 4) {
  const results = new Array(items.length)
  let i = 0

  async function worker() {
    while (true) {
      const current = i
      if (current >= items.length) return
      i += 1
      try {
        results[current] = await mapper(items[current], current)
      } catch (err) {
        results[current] = { error: String(err) }
      }
    }
  }

  const workers = []
  for (let w = 0; w < Math.max(1, concurrency); w++) workers.push(worker())
  await Promise.all(workers)
  return results
}
