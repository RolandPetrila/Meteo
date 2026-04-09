from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import init_db
from routers import weather, locations
from config import ALLOWED_ORIGINS


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(
    title="Meteo API",
    description="API pentru monitorizare meteo multi-sursă",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS + ["*"],  # Dev permisiv, restrict in prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(weather.router)
app.include_router(locations.router)


@app.get("/")
async def root():
    return {
        "name": "Meteo API",
        "version": "1.0.0",
        "status": "activ",
        "endpoints": {
            "weather": "/api/weather/{lat}/{lon}",
            "hourly": "/api/weather/{lat}/{lon}/hourly",
            "comparison": "/api/weather/{lat}/{lon}/comparison",
            "locations": "/api/locations",
        },
    }


@app.get("/health")
async def health():
    return {"status": "ok"}
