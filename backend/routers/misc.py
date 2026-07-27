import httpx
from fastapi import APIRouter, HTTPException

from config import HANDBALL_TEAM_ID
from bw_holidays import FERIEN_BW, feiertage_bw

router = APIRouter()


@router.get("/")
async def root():
    return {"message": "TuS Oberhausen Team API"}


@router.get("/holidays")
async def get_holidays():
    items = []
    for y in range(2026, 2033):
        for name, dt in feiertage_bw(y):
            items.append({"kind": "feiertag", "name": name, "date": dt, "end": None})
    for name, start, end in FERIEN_BW:
        items.append({"kind": "ferien", "name": name, "date": start, "end": end})
    items.sort(key=lambda x: x["date"])
    return items


@router.get("/league-table")
async def league_table():
    url = f"https://www.handball.net/a/sportdata/1/teams/{HANDBALL_TEAM_ID}/table"
    try:
        async with httpx.AsyncClient(timeout=12.0) as c:
            r = await c.get(url, headers={"Accept": "application/json"})
            r.raise_for_status()
            d = r.json().get("data", {}) or {}
    except Exception:
        raise HTTPException(status_code=502, detail="Tabelle konnte nicht geladen werden")
    rows = []
    for row in d.get("rows", []) or []:
        team = row.get("team", {}) or {}
        rows.append({
            "rank": row.get("rank"),
            "team": team.get("name"),
            "points": row.get("points"),
            "games": row.get("games"),
            "wins": row.get("wins"),
            "draws": row.get("draws"),
            "losses": row.get("losses"),
            "goals": row.get("goals"),
            "goals_against": row.get("goalsAgainst"),
            "goal_diff": row.get("goalDifference"),
            "is_own": team.get("id") == HANDBALL_TEAM_ID,
        })
    return {
        "tournament": (d.get("tournament", {}) or {}).get("name"),
        "updated_at": d.get("updatedAt"),
        "rows": rows,
    }
