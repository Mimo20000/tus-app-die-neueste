import base64
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Response

from db import db
from models import FileChunk, FileFinalize, FileInit

router = APIRouter()

MAX_FILE_BYTES = 15 * 1024 * 1024  # 15 MB cap


@router.post("/files/init")
async def files_init(body: FileInit):
    upload_id = "UP" + uuid.uuid4().hex[:12]
    await db.uploads.insert_one({
        "upload_id": upload_id,
        "filename": body.filename,
        "mime": body.mime,
        "kind": body.kind,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    return {"upload_id": upload_id}


@router.post("/files/chunk")
async def files_chunk(body: FileChunk):
    up = await db.uploads.find_one({"upload_id": body.upload_id})
    if not up:
        raise HTTPException(status_code=404, detail="Upload nicht gefunden")
    await db.upload_chunks.update_one(
        {"upload_id": body.upload_id, "index": body.index},
        {"$set": {"data": body.data}},
        upsert=True,
    )
    return {"ok": True}


@router.post("/files/finalize")
async def files_finalize(body: FileFinalize):
    up = await db.uploads.find_one({"upload_id": body.upload_id})
    if not up:
        raise HTTPException(status_code=404, detail="Upload nicht gefunden")
    chunks = await db.upload_chunks.find({"upload_id": body.upload_id}).sort("index", 1).to_list(100000)
    b64 = "".join(c["data"] for c in chunks)
    try:
        raw = base64.b64decode(b64)
    except Exception:
        await db.upload_chunks.delete_many({"upload_id": body.upload_id})
        await db.uploads.delete_one({"upload_id": body.upload_id})
        raise HTTPException(status_code=400, detail="Ungültige Datei")
    if len(raw) == 0:
        raise HTTPException(status_code=400, detail="Leere Datei")
    if len(raw) > MAX_FILE_BYTES:
        await db.upload_chunks.delete_many({"upload_id": body.upload_id})
        await db.uploads.delete_one({"upload_id": body.upload_id})
        raise HTTPException(status_code=413, detail="Datei zu groß (max. 15 MB)")
    file_id = "F" + uuid.uuid4().hex[:14]
    await db.files.insert_one({
        "id": file_id,
        "filename": up["filename"],
        "mime": up["mime"],
        "kind": up["kind"],
        "data_b64": b64,
        "size": len(raw),
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    await db.upload_chunks.delete_many({"upload_id": body.upload_id})
    await db.uploads.delete_one({"upload_id": body.upload_id})
    return {
        "file_id": file_id,
        "mime": up["mime"],
        "filename": up["filename"],
        "kind": up["kind"],
        "size": len(raw),
    }


@router.get("/files/{file_id}/meta")
async def files_meta(file_id: str):
    f = await db.files.find_one({"id": file_id}, {"_id": 0, "data_b64": 0})
    if not f:
        raise HTTPException(status_code=404, detail="Datei nicht gefunden")
    return f


@router.get("/files/{file_id}/raw")
async def files_raw(file_id: str):
    f = await db.files.find_one({"id": file_id}, {"_id": 0})
    if not f:
        raise HTTPException(status_code=404, detail="Datei nicht gefunden")
    raw = base64.b64decode(f["data_b64"])
    headers = {
        "Cache-Control": "public, max-age=31536000",
        "Content-Disposition": f'inline; filename="{f.get("filename", "datei")}"',
    }
    return Response(content=raw, media_type=f.get("mime") or "application/octet-stream", headers=headers)
