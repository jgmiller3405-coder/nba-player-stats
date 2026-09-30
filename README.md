# The Three-Point Takeover: NBA player box scores, 1994-95 to 2025-26

A two-page website by Jason Miller: a written report with ten findings and an interactive dashboard, both built from
NBA regular-season player box scores.

Live site: https://jgmiller3405-coder.github.io/nba-player-stats/

## Files

| File | What it does |
|---|---|
| `index.html` | The report page: summary, headline numbers, ten findings with charts, and a closing section on the data. |
| `dashboard.html` | The dashboard page: filters, summary numbers, four charts, measure and breakdown switches, a table and a reset button. |
| `css/style.css` | Fonts, colors and layout shared by both pages. |
| `js/common.js` | Shared navigation bar and chart defaults, loaded by both pages. |
| `js/report.js` | Fills the report text with numbers from the data and draws the report charts. |
| `js/dashboard.js` | Loads `data/cube.csv`, applies filters, and recalculates the numbers, charts and table in the browser. |
| `data/cube.csv` | Summary table the dashboard reads: one row per season, franchise, role, venue and result, holding summed stats. |
| `data/report_data.js` | Every series and number used on the report page, written by the build script. |
| `scripts/build_data.py` | Reads the raw player file, cleans it, and writes both files in `data/`. |

## Where the data came from

`PlayerStatistics.csv`, an NBA player-level box-score file (one row per player per game) that I downloaded and trimmed to
regular-season games from December 1994 to April 2026 (922,756 rows). It is not in this repository because it is about 160 MB,
above GitHub's 100 MB file limit. The original download site is not recorded in the file itself.

To rebuild the summary files, run from the `~/fda-python` folder:

```
uv run python ~/nba-player-stats/scripts/build_data.py path/to/PlayerStatistics.csv
```

## Cleaning and definitions

The report's final section has the full list. In short: rows with missing or zero minutes (152,983 rows, mostly players who did not play) are dropped,
leaving 769,773 appearances. Rates are computed from summed totals (for example 3P% = threes made / threes attempted), and per-appearance
averages count each appearance once.

## Running locally

The dashboard loads a CSV with `fetch`, so open it through a web server, for example `python -m http.server` in this folder.
