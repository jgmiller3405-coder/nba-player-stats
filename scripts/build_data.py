"""Build the small data files the site loads from the raw NBA player box-score CSV.

Run from ~/fda-python:
    uv run python ~/nba-player-stats/scripts/build_data.py [path/to/PlayerStatistics.csv]

Outputs (in ../data):
    cube.csv         season x franchise x role x home x result sums (dashboard)
    report_data.js   every number and chart series used on the report page
"""
import json
import sys
from pathlib import Path

import numpy as np
import pandas as pd

RAW = Path(sys.argv[1]) if len(sys.argv) > 1 else Path.home() / "Project 1" / "PlayerStatistics.csv"
OUT = Path(__file__).resolve().parent.parent / "data"

FRANCHISE = {
    "Charlotte Bobcats": "Charlotte Hornets",
    "New Jersey Nets": "Brooklyn Nets",
    "Seattle SuperSonics": "Oklahoma City Thunder",
    "Vancouver Grizzlies": "Memphis Grizzlies",
    "Washington Bullets": "Washington Wizards",
    "LA Clippers": "Los Angeles Clippers",
    "New Orleans Hornets": "New Orleans Pelicans",
    "Oklahoma City Hornets": "New Orleans Pelicans",
}

df = pd.read_csv(RAW, low_memory=False)
n_raw = len(df)

# --- clean ---------------------------------------------------------------
df["date"] = pd.to_datetime(df["game_date_time_est"])
df["season"] = np.where(df.date.dt.month >= 9, df.date.dt.year, df.date.dt.year - 1)

team = df.player_team_city + " " + df.player_team_name
# The original Charlotte Hornets (to 2002) became the Pelicans; the name returned in 2014.
orig_hornets = (team == "Charlotte Hornets") & (df.season < 2010)
df["franchise"] = team.replace(FRANCHISE)
df.loc[orig_hornets, "franchise"] = "New Orleans Pelicans"

played = df.mpg.notna() & (df.mpg > 0)
n_dnp_nan = int(df.mpg.isna().sum())
n_zero = int((df.mpg == 0).sum())
df = df[played].copy()
n_kept = len(df)

df["role"] = df.starting_position.map({"G": "Starting guard", "F": "Starting forward", "C": "Starting center"}).fillna("Bench")
df["venue"] = np.where(df.home == 1, "Home", "Away")
df["result"] = np.where(df.win == 1, "Win", "Loss")
df["player"] = df.first_name + " " + df.last_name

df = df.rename(columns={"ppg": "pts", "apg": "ast", "bpg": "blk", "spg": "stl", "mpg": "min",
                        "3pa": "tpa", "3pm": "tpm", "rebounds_o": "oreb", "rebounds_total": "reb",
                        "fouls_personal": "pf", "turnovers": "tov"})
SUMS = ["min", "pts", "ast", "reb", "oreb", "stl", "blk", "tov", "pf", "fgm", "fga", "tpm", "tpa", "ftm", "fta"]

# --- dashboard cube -------------------------------------------------------
keys = ["season", "franchise", "role", "venue", "result"]
cube = df.groupby(keys)[SUMS].sum().round(1)
cube.insert(0, "games", df.groupby(keys).size())
cube.reset_index().to_csv(OUT / "cube.csv", index=False)
print("cube rows", len(cube))

# --- report numbers -------------------------------------------------------
def rates(g):
    """Per-player-game averages and shooting rates from summed columns."""
    out = pd.DataFrame(index=g.index)
    n = g["games"]
    for c in ["min", "pts", "ast", "reb", "oreb", "stl", "blk", "tov", "tpa", "fta", "fga"]:
        out[c] = g[c] / n
    out["fgp"] = g.fgm / g.fga
    out["tpp"] = g.tpm / g.tpa
    out["ftp"] = g.ftm / g.fta
    out["ts"] = g.pts / (2 * (g.fga + 0.44 * g.fta))
    out["tpar"] = g.tpa / g.fga            # share of shots from three
    out["games"] = n
    return out

def agg(by):
    g = df.groupby(by)[SUMS].sum()
    g.insert(0, "games", df.groupby(by).size())
    return g

R = {}
r = lambda s, d=2: [None if pd.isna(v) else round(float(v), d) for v in s]

season = agg("season")
sr = rates(season)
R["seasons"] = [int(x) for x in season.index]
R["season_labels"] = [f"{s}-{str(s + 1)[2:]}" for s in season.index]
for k, d in [("tpa", 2), ("tpp", 4), ("pts", 2), ("fta", 2), ("ftp", 4), ("ast", 2), ("tov", 2),
             ("oreb", 2), ("reb", 2), ("stl", 2), ("blk", 2), ("ts", 4), ("tpar", 4), ("fgp", 4), ("min", 2), ("fga", 2)]:
    R["s_" + k] = r(sr[k], d)
R["s_games"] = [int(x) for x in season.games]
R["s_players"] = [int(x) for x in df.groupby("season").person_id.nunique()]

# rows dropped per season (DNP share) from the raw file
raw = pd.read_csv(RAW, usecols=["game_date_time_est", "mpg"], low_memory=False)
rd = pd.to_datetime(raw.game_date_time_est)
raw["season"] = np.where(rd.dt.month >= 9, rd.dt.year, rd.dt.year - 1)
R["s_dnp_share"] = r(raw.groupby("season").apply(lambda g: ((g.mpg.isna()) | (g.mpg == 0)).mean()), 4)

# starters vs bench
role = agg("role")
rr = rates(role)
R["role_labels"] = list(role.index)
for k in ["pts", "ast", "reb", "stl", "blk", "tov", "min", "tpa", "ts"]:
    R["role_" + k] = r(rr[k], 3)
R["role_games"] = [int(x) for x in role.games]
R["role_pts36"] = r(role.pts / role["min"] * 36, 2)

# home vs away by season
ha = df.groupby(["season", "venue"]).agg(win=("win", "mean"), pts=("pts", "mean")).unstack()
R["home_win"] = r(ha["win"]["Home"], 4)
R["home_pts"] = r(ha["pts"]["Home"], 3)
R["away_pts"] = r(ha["pts"]["Away"], 3)
overall_home = df[df.venue == "Home"].win.mean()

# franchises in the three-point era (last 5 full seasons 2021-2025)
recent = df[df.season.between(2021, 2025)]
fr = rates(recent.groupby("franchise")[SUMS].sum().assign(games=recent.groupby("franchise").size()))
fr = fr.sort_values("tpa", ascending=False)
R["fr_labels"] = list(fr.index)
R["fr_tpa"] = r(fr.tpa, 3)
R["fr_tpp"] = r(fr.tpp, 4)
R["fr_pts"] = r(fr.pts, 3)
wins = recent.groupby("franchise").win.mean()
R["fr_win"] = r(wins.loc[fr.index], 4)
R["fr_corr_tpa_win"] = round(float(np.corrcoef(fr.tpa, wins.loc[fr.index])[0, 1]), 3)

# franchise win share vs 3PA (whole dataset per season for correlation)
# career leaders (points, in dataset)
cl = df.groupby("player").agg(pts=("pts", "sum"), games=("pts", "size"), tpm=("tpm", "sum"), ast=("ast", "sum"))
top = cl.sort_values("pts", ascending=False).head(10)
R["lead_labels"] = list(top.index)
R["lead_pts"] = [int(x) for x in top.pts]
R["lead_games"] = [int(x) for x in top.games]
R["lead_ppg"] = r(top.pts / top.games, 2)
tp = cl.sort_values("tpm", ascending=False).head(10)
R["tp_labels"] = list(tp.index)
R["tp_vals"] = [int(x) for x in tp.tpm]

# single-game scoring: 50+ point games per season
R["g50"] = [int(x) for x in df[df.pts >= 50].groupby("season").size().reindex(season.index, fill_value=0)]
R["g40"] = [int(x) for x in df[df.pts >= 40].groupby("season").size().reindex(season.index, fill_value=0)]
R["g3x10"] = [int(x) for x in df[df.tpm >= 10].groupby("season").size().reindex(season.index, fill_value=0)]
top_games = df.sort_values("pts", ascending=False).head(5)[["player", "pts", "franchise", "date"]]
R["top_games"] = [[p, int(pt), f, d.strftime("%Y-%m-%d")] for p, pt, f, d in top_games.itertuples(index=False)]

# headline numbers
R["head"] = {
    "raw_rows": n_raw, "kept_rows": n_kept, "dropped_nan": n_dnp_nan, "dropped_zero": n_zero,
    "players": int(df.person_id.nunique()), "games": int(df.game_id.nunique()),
    "franchises": int(df.franchise.nunique()),
    "first_date": str(df.date.min().date()), "last_date": str(df.date.max().date()),
    "tpa_first": R["s_tpa"][1], "tpa_last": R["s_tpa"][-1],
    "tpar_first": R["s_tpar"][1], "tpar_last": R["s_tpar"][-1],
    "fta_first": R["s_fta"][1], "fta_last": R["s_fta"][-1],
    "oreb_first": R["s_oreb"][1], "oreb_last": R["s_oreb"][-1],
    "home_win": round(float(overall_home), 4),
    "total_tpm": int(df.tpm.sum()), "total_pts": int(df.pts.sum()),
}

OUT.joinpath("report_data.js").write_text("window.REPORT = " + json.dumps(R, separators=(",", ":")) + ";\n", encoding="utf-8")
print(json.dumps(R["head"], indent=1))
print({k: v for k, v in R.items() if k in ("top_games", "lead_labels", "lead_pts", "fr_corr_tpa_win")})
print("tpa", R["s_tpa"][:3], R["s_tpa"][-3:], "\nts", R["s_ts"][::6], "\nfta", R["s_fta"][::6], "\noreb", R["s_oreb"][::6])
print("role", R["role_labels"], R["role_pts"], R["role_pts36"], R["role_ast"], R["role_reb"], R["role_blk"])
print("homewin", R["home_win"][::6], "\ndnp", R["s_dnp_share"][::6], "\nseason games", R["s_games"][::6])
print("g50", R["g50"]); print("fr", list(zip(fr.index, R["fr_tpa"], R["fr_win"]))[:5])
