const fs = require("node:fs/promises")
const path = require("node:path")
const cheerio = require("cheerio")
const got = require("got")

const SOURCE = "https://www.redcross.sg/"
const ROOT = path.join(__dirname, "..")
const TYPES = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"]
const STATUSES = new Map([["healthy", "Healthy"], ["moderate", "Moderate"], ["low", "Low"]])

function parsePage(html) {
  const $ = cheerio.load(html)
  const cards = $(".blood-level-card")
  if (cards.length !== 8) throw new Error(`Expected 8 blood stock cards, found ${cards.length}`)
  const byType = new Map()
  cards.each((_, card) => {
    const type = ($(card).attr("blood-type") || "").trim().toUpperCase()
    const rawStatus = ($(card).attr("blood-level") || "").trim().toLowerCase()
    if (!TYPES.includes(type)) throw new Error(`Invalid blood type: ${type}`)
    if (byType.has(type)) throw new Error(`Duplicate blood type: ${type}`)
    if (!STATUSES.has(rawStatus)) throw new Error(`Invalid status for ${type}: ${rawStatus}`)
    byType.set(type, { bloodType: type, status: STATUSES.get(rawStatus) })
  })
  const dateText = $(".blood-stock-last-update-text").text().trim()
  const match = /^Last blood stock update:\s*(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{4})$/i.exec(dateText)
  if (!match) throw new Error(`Invalid source update date: ${dateText}`)
  const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"]
  const month = months.indexOf(match[2].toLowerCase())
  const date = new Date(Date.UTC(Number(match[3]), month, Number(match[1])))
  if (date.getUTCFullYear() !== Number(match[3]) || date.getUTCMonth() !== month || date.getUTCDate() !== Number(match[1])) throw new Error(`Invalid source update date: ${dateText}`)
  return { stocks: TYPES.map(type => byType.get(type)), sourceUpdatedAt: date.toISOString().slice(0, 10) }
}

async function main() {
  const response = await got(SOURCE, { timeout: { request: 30000 }, retry: 0 })
  const { stocks, sourceUpdatedAt } = parsePage(response.body)
  const metadata = { source: SOURCE, sourceUpdatedAt, fetchedAt: new Date().toISOString(), recordCount: stocks.length }
  await fs.writeFile(path.join(ROOT, "blood-stocks.json"), `${JSON.stringify(stocks, null, 2)}\n`)
  await fs.writeFile(path.join(ROOT, "scrape-status.json"), `${JSON.stringify(metadata, null, 2)}\n`)
}

if (require.main === module) main().catch(error => { console.error(error); process.exitCode = 1 })
module.exports = { parsePage }
