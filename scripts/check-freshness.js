// Check the published marker, not whether stock values changed.
function isFresh(marker, now = Date.now(), maxAgeMs = 24 * 60 * 60 * 1000) {
  if (!marker || marker.recordCount !== 8 || typeof marker.fetchedAt !== "string") return false
  const fetched = Date.parse(marker.fetchedAt)
  return Number.isFinite(fetched) && fetched <= now && now - fetched < maxAgeMs
}
if (require.main === module) {
  const fs = require("node:fs")
  try {
    const marker = JSON.parse(fs.readFileSync(process.argv[2] || "scrape-status.json", "utf8"))
    if (!isFresh(marker)) throw new Error("No validated scrape in the past 24 hours")
    console.log(`Last validated scrape: ${marker.fetchedAt}`)
  } catch (error) {
    console.error(error.message)
    process.exitCode = 1
  }
}
module.exports = { isFresh }
