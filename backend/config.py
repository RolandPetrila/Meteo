import os
from dotenv import load_dotenv

load_dotenv()

# Locatie implicita: Nadlac
DEFAULT_LAT = 46.194
DEFAULT_LON = 21.233
DEFAULT_NAME = "Nădlac"

# Timezone
TIMEZONE = "Europe/Bucharest"

# Cache
CACHE_TTL_SECONDS = 900  # 15 minute

# Timeout per sursa meteo (secunde)
SOURCE_TIMEOUT = 30

# API Keys
OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY", "")
WEATHERAPI_KEY = os.getenv("WEATHERAPI_KEY", "")

# AI (placeholder - se configureaza ulterior)
AI_API_KEY = os.getenv("AI_API_KEY", "")
AI_MODEL = os.getenv("AI_MODEL", "")
AI_ENABLED = bool(AI_API_KEY)

# Database
DATABASE_PATH = os.getenv("DATABASE_PATH", "weather.db")

# Server
PORT = int(os.getenv("PORT", "8000"))

# CORS - origini permise
ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:3001",
    "https://*.vercel.app",
]
