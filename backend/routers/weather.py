from fastapi import APIRouter, HTTPException
from models import WeatherResponse, Location
from services.aggregator import aggregate_current, aggregate_hourly, aggregate_daily
from services.ai_summary import generate_summary
from services.cache import get_cached, set_cache
from config import DEFAULT_NAME, TIMEZONE
from datetime import datetime
import pytz

router = APIRouter(prefix="/api/weather", tags=["weather"])


def _get_location_name(lat: float, lon: float) -> str:
    """Returneaza numele locatiei (default Nadlac daca e locatia implicita)."""
    if abs(lat - 46.194) < 0.01 and abs(lon - 21.233) < 0.01:
        return DEFAULT_NAME
    return f"{lat:.3f}°N, {lon:.3f}°E"


@router.get("/{latitude}/{longitude}", response_model=WeatherResponse)
async def get_weather(latitude: float, longitude: float):
    """Meteo complet: curent + orar + 7 zile + comparatie + AI."""
    if not (-90 <= latitude <= 90) or not (-180 <= longitude <= 180):
        raise HTTPException(status_code=400, detail="Coordonate invalide")

    # Verifica cache
    cached = await get_cached(latitude, longitude, "full")
    if cached:
        return WeatherResponse(**cached, cache_hit=True)

    try:
        current, comparison, agreement, avg_confidence = await aggregate_current(latitude, longitude)
        hourly = await aggregate_hourly(latitude, longitude)
        daily = await aggregate_daily(latitude, longitude)

        # AI Summary
        ai_data = {
            "current": current.model_dump(),
            "hourly": [h.model_dump() for h in hourly[:6]],
        }
        ai_summary = await generate_summary(ai_data)

        tz = pytz.timezone(TIMEZONE)
        now = datetime.now(tz)

        response = WeatherResponse(
            location=Location(
                name=_get_location_name(latitude, longitude),
                latitude=latitude,
                longitude=longitude,
                timezone=TIMEZONE,
            ),
            timestamp=now.isoformat(),
            current=current,
            forecast_hourly=hourly,
            forecast_7days=daily,
            comparison=comparison,
            agreement=agreement,
            aggregated_confidence=avg_confidence,
            ai_summary=ai_summary,
            cache_hit=False,
        )

        # Salveaza in cache
        await set_cache(latitude, longitude, response.model_dump(), "full")

        return response

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Eroare la obtinerea datelor meteo: {str(e)}")


@router.get("/{latitude}/{longitude}/hourly")
async def get_hourly(latitude: float, longitude: float):
    """Prognoza orara detaliata (24h)."""
    cached = await get_cached(latitude, longitude, "hourly")
    if cached:
        return {"hourly": cached, "cache_hit": True}

    hourly = await aggregate_hourly(latitude, longitude)
    data = [h.model_dump() for h in hourly]
    await set_cache(latitude, longitude, data, "hourly")
    return {"hourly": data, "cache_hit": False}


@router.get("/{latitude}/{longitude}/comparison")
async def get_comparison(latitude: float, longitude: float):
    """Comparatie detaliata intre surse."""
    current, comparison, agreement, avg_confidence = await aggregate_current(latitude, longitude)
    return {
        "comparison": [s.model_dump() for s in comparison],
        "agreement": agreement.model_dump(),
        "aggregated_confidence": avg_confidence,
    }
