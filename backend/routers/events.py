import uuid
from datetime import datetime, timezone
from typing import List

from fastapi import APIRouter, HTTPException

from config import CLUB
from db import db
from models import Event, EventCreate, EventPatch, EventsSeenBody
from push import notify_event

router = APIRouter()


@router.get("/events", response_model=List[Event])
async def get_events():
    docs = await db.events.find({}, {"_id": 0}).to_list(500)
    docs.sort(key=lambda e: (e["date"], e["time"]))
    return docs


@router.post("/events", response_model=Event)
async def create_event(body: EventCreate):
    if body.type not in ("Spiel", "Training", "Treffen"):
        raise HTTPException(status_code=400, detail="Ungültiger Typ")
    if not body.date or not body.time:
        raise HTTPException(status_code=400, detail="Datum und Uhrzeit erforderlich")
    eid = "EV" + uuid.uuid4().hex[:8]
    if body.type == "Spiel":
        opp = (body.opponent or "").strip() or "Gegner"
        home = CLUB if body.home_game else opp
        away = opp if body.home_game else CLUB
        ev = Event(
            id=eid, type="Spiel", date=body.date, time=body.time,
            home=home, away=away, opponent=opp, location=body.location,
            title=f"{home} vs. {away}",
        )
    else:
        ev = Event(
            id=eid, type=body.type, date=body.date, time=body.time,
            location=body.location, title=body.type,
        )
    ev.created_at = datetime.now(timezone.utc).isoformat()
    ev.notify_at = ev.created_at
    await db.events.insert_one(ev.dict())
    await notify_event(ev.dict(), "Neuer Termin")
    return ev


@router.patch("/events/{event_id}")
async def update_event(event_id: str, body: EventPatch):
    ev = await db.events.find_one({"id": event_id})
    if not ev:
        raise HTTPException(status_code=404, detail="Termin nicht gefunden")
    now = datetime.now(timezone.utc).isoformat()
    upd = {"notify_at": now}
    if body.date:
        upd["date"] = body.date
    if body.time:
        upd["time"] = body.time
    if body.location is not None:
        upd["location"] = body.location.strip() or None
    if ev.get("type") == "Spiel" and (body.opponent is not None or body.home_game is not None):
        opp = (body.opponent.strip() if body.opponent else ev.get("opponent")) or "Gegner"
        home_game = body.home_game if body.home_game is not None else (ev.get("home") == CLUB)
        home = CLUB if home_game else opp
        away = opp if home_game else CLUB
        upd.update({"home": home, "away": away, "opponent": opp, "title": f"{home} vs. {away}"})
    await db.events.update_one({"id": event_id}, {"$set": upd})
    await notify_event({**ev, **upd}, "Termin geändert")
    return {"ok": True, **upd}


@router.post("/events/{event_id}/cancel")
async def cancel_event(event_id: str):
    ev = await db.events.find_one({"id": event_id})
    if not ev:
        raise HTTPException(status_code=404, detail="Termin nicht gefunden")
    now = datetime.now(timezone.utc).isoformat()
    await db.events.update_one({"id": event_id}, {"$set": {"cancelled": True, "notify_at": now}})
    await notify_event({**ev, "cancelled": True}, "Termin abgesagt")
    return {"ok": True}


@router.get("/events/{event_id}/overview")
async def event_overview(event_id: str):
    ev = await db.events.find_one({"id": event_id}, {"_id": 0})
    if not ev:
        raise HTTPException(status_code=404, detail="Termin nicht gefunden")
    players = await db.players.find({}, {"_id": 0, "password_hash": 0}).to_list(500)
    att = await db.attendance.find({"event_id": event_id}, {"_id": 0}).to_list(500)
    by_pid = {a["player_id"]: a for a in att}
    rows = []
    for p in players:
        a = by_pid.get(p["id"], {})
        rows.append({
            "id": p["id"],
            "name": p["name"],
            "position": p.get("position"),
            "status": p.get("status"),
            "jersey_number": p.get("jersey_number"),
            "email": p.get("email"),
            "rsvp": a.get("status"),
            "driving": bool(a.get("driving")),
            "beer": bool(a.get("beer")),
        })
    rows.sort(key=lambda r: r["name"])
    summary = {
        "zusagen": sum(1 for r in rows if r["rsvp"] == "zugesagt"),
        "absagen": sum(1 for r in rows if r["rsvp"] == "abgesagt"),
        "offen": sum(1 for r in rows if not r["rsvp"]),
        "fahrer": sum(1 for r in rows if r["driving"]),
        "bier": sum(1 for r in rows if r["beer"]),
    }
    return {"event": ev, "players": rows, "summary": summary}


@router.get("/events-unread")
async def events_unread(player_id: str):
    rd = await db.reads.find_one({"player_id": player_id, "conversation_id": "events"})
    last = rd["last_read"] if rd else ""
    n = await db.events.count_documents({"notify_at": {"$gt": last}})
    return {"total": n}


@router.post("/events-seen")
async def events_seen(body: EventsSeenBody):
    await db.reads.update_one(
        {"player_id": body.player_id, "conversation_id": "events"},
        {"$set": {"last_read": datetime.now(timezone.utc).isoformat()}},
        upsert=True,
    )
    return {"ok": True}
