# Red Cross Blood Stocks

This unofficial project retrieves Singapore Red Cross blood-stock categories from [redcross.sg](https://www.redcross.sg/). It is not affiliated with the Red Cross; consult the source for donation decisions.

## Data

`blood-stocks.json` is an array of eight objects with `bloodType` and `status` (Healthy, Moderate, or Low). The current source provides categories, not numerical fill levels. New records therefore omit `fillLevel`; historical commits retain the previously inferred numerical values. Consumers must handle missing `fillLevel` and must not present older numbers as current. The personal-site dashboard currently filters out these new rows and needs a category display and an explicit historical-data end date. The bloodstocks-gui history generator should skip rows without numeric levels.

`scrape-status.json` is published in the same commit as the data after every fully validated fetch, even when categories are unchanged. `fetchedAt` is the UTC scrape time; `sourceUpdatedAt` is the date displayed by the source (Singapore local date, with no time supplied); `recordCount` is eight. A failed fetch or failed push cannot publish a new success marker. The marker is absent until the first successful workflow run after this change is deployed. Before then the existing JSON is historical, not current.

The scraper validates all eight unique types, known categories, and the source date before writing. The workflow retries three times and does not publish on failure. It deliberately tolerates an individual failed run; a separate monitor should check the raw `main/scrape-status.json` marker and notify only after 24 hours without a validated success, deduplicating until recovery. `node scripts/check-freshness.js [marker-file]` implements the 24-hour check. A monitor must also treat a missing or unreadable marker as an error, and independently handle inability to access GitHub. No notification destination is configured by this repository.

Run `npm ci`, `npm test`, and `npm run fetch` with Node 22 or newer. Fetch writes both data files locally.

Historical data can be viewed in [Flat Data Viewer](https://flatgithub.com/frizensami/red-cross-blood-stocks?filename=blood-stocks.json). The [original writeup](https://sriramsami.com/bloodstocks/) describes the earlier numerical data.
