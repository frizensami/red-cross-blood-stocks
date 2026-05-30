const fs = require("node:fs/promises")
const path = require("node:path")
const cheerio = require("cheerio")
const got = require("got")

const REDCROSS_HOST = "https://redcross.sg"
const OUTPUT_FILE = path.join(__dirname, "..", "blood-stocks.json")
const BLOOD_GROUPS = [
  { className: "a_group" },
  { className: "b_group" },
  { className: "o_group" },
  { className: "ab_group" },
]

function textOrThrow($element, selector, label) {
  const value = $element.find(selector).first().text().trim()
  if (!value) {
    throw new Error(`Could not find ${label}`)
  }
  return value
}

function fillLevelOrThrow($element) {
  const comment = $element
    .find(".blood-grp-hover")
    .first()
    .contents()
    .toArray()
    .find((node) => node.type === "comment")

  const fillLevel = comment?.data?.trim().replace(/%$/, "")
  if (!fillLevel) {
    throw new Error("Could not find fill level")
  }
  return fillLevel
}

async function fetchBloodStocks(url = REDCROSS_HOST) {
  const response = await got(url, {
    timeout: { request: 30000 },
  })
  const $ = cheerio.load(response.body)
  const state = []

  for (const group of BLOOD_GROUPS) {
    $(`.${group.className}`).each(function () {
      const $group = $(this)
      state.push({
        bloodType: textOrThrow($group, "h3", "blood type"),
        status: textOrThrow($group, ".blood-grp-text h5", "status"),
        fillLevel: fillLevelOrThrow($group),
      })
    })
  }

  if (state.length !== 8) {
    throw new Error(`Expected 8 blood stock records, found ${state.length}`)
  }

  return state
}

async function main() {
  const state = await fetchBloodStocks()
  await fs.writeFile(OUTPUT_FILE, `${JSON.stringify(state, null, 2)}\n`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
