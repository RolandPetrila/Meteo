import json
from datetime import datetime, timedelta
import aiosqlite
from config import DATABASE_PATH, CACHE_TTL_SECONDS


async def get_cached(lat: float, lon: float, data_type: str = "full") -> dict | None:
    cache_key = f"{round(lat, 3)}:{round(lon, 3)}:{data_type}"
    async with aiosqlite.connect(DATABASE_PATH) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute(
            "SELECT data FROM weather_cache WHERE cache_key = ? AND expires_at > ?",
            (cache_key, datetime.utcnow().isoformat()),
        )
        row = await cursor.fetchone()
        if row:
            return json.loads(row["data"])
    return None


async def set_cache(lat: float, lon: float, data: dict, data_type: str = "full", ttl: int = CACHE_TTL_SECONDS):
    cache_key = f"{round(lat, 3)}:{round(lon, 3)}:{data_type}"
    expires_at = (datetime.utcnow() + timedelta(seconds=ttl)).isoformat()
    data_json = json.dumps(data, ensure_ascii=False)

    async with aiosqlite.connect(DATABASE_PATH) as db:
        await db.execute(
            """INSERT OR REPLACE INTO weather_cache (cache_key, data, created_at, expires_at)
               VALUES (?, ?, ?, ?)""",
            (cache_key, data_json, datetime.utcnow().isoformat(), expires_at),
        )
        await db.commit()


async def cleanup_expired():
    async with aiosqlite.connect(DATABASE_PATH) as db:
        await db.execute(
            "DELETE FROM weather_cache WHERE expires_at < ?",
            (datetime.utcnow().isoformat(),),
        )
        await db.commit()
