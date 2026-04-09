from fastapi import APIRouter, HTTPException
from models import LocationCreate, LocationResponse
from database import get_db

router = APIRouter(prefix="/api/locations", tags=["locations"])


@router.get("/", response_model=list[LocationResponse])
async def list_locations():
    """Lista locatii salvate."""
    db = await get_db()
    try:
        cursor = await db.execute("SELECT * FROM locations ORDER BY created_at DESC")
        rows = await cursor.fetchall()
        return [
            LocationResponse(
                id=row["id"],
                name=row["name"],
                latitude=row["latitude"],
                longitude=row["longitude"],
                timezone=row["timezone"],
                created_at=row["created_at"],
            )
            for row in rows
        ]
    finally:
        await db.close()


@router.post("/", response_model=LocationResponse)
async def create_location(location: LocationCreate):
    """Salveaza o locatie noua."""
    db = await get_db()
    try:
        cursor = await db.execute(
            "INSERT INTO locations (name, latitude, longitude) VALUES (?, ?, ?)",
            (location.name, location.latitude, location.longitude),
        )
        await db.commit()
        loc_id = cursor.lastrowid

        cursor = await db.execute("SELECT * FROM locations WHERE id = ?", (loc_id,))
        row = await cursor.fetchone()
        return LocationResponse(
            id=row["id"],
            name=row["name"],
            latitude=row["latitude"],
            longitude=row["longitude"],
            timezone=row["timezone"],
            created_at=row["created_at"],
        )
    finally:
        await db.close()


@router.delete("/{location_id}")
async def delete_location(location_id: int):
    """Sterge o locatie salvata."""
    db = await get_db()
    try:
        cursor = await db.execute("DELETE FROM locations WHERE id = ?", (location_id,))
        await db.commit()
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Locația nu a fost găsită")
        return {"message": "Locație ștearsă"}
    finally:
        await db.close()
