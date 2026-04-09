"""
Modul AI Summary — placeholder cu template-uri in romana.
Cand se va configura un serviciu AI, functia generate_summary va fi inlocuita
cu un apel real catre API-ul AI ales.
"""

from config import AI_ENABLED
from models import AISummary


# Mapare conditii -> descrieri naturale in romana
CONDITION_DESCRIPTIONS = {
    "senin": "cer senin",
    "predominant_senin": "predominant senin",
    "partial_noros": "parțial noros",
    "noros": "cer noros",
    "ceata": "ceață",
    "ceata_chiciura": "ceață cu chiciură",
    "burinta_usoara": "burniță ușoară",
    "burinta_moderata": "burniță moderată",
    "burinta_puternica": "burniță puternică",
    "ploaie_usoara": "ploaie ușoară",
    "ploaie_moderata": "ploaie moderată",
    "ploaie_puternica": "ploaie puternică",
    "ploaie_inghet": "ploaie cu îngheț",
    "ninsoare_usoara": "ninsoare ușoară",
    "ninsoare_moderata": "ninsoare moderată",
    "ninsoare_puternica": "ninsoare puternică",
    "averse_usoare": "averse ușoare",
    "averse_moderate": "averse moderate",
    "averse_puternice": "averse puternice",
    "furtuna": "furtună",
    "furtuna_grindina": "furtună cu grindină",
}


def _describe_condition(condition: str) -> str:
    return CONDITION_DESCRIPTIONS.get(condition, condition.replace("_", " "))


def _generate_recommendation(temp: float, condition: str, wind: float) -> str:
    parts = []

    if temp < -10:
        parts.append("Îmbracă-te foarte gros, temperaturi periculoase")
    elif temp < 0:
        parts.append("Îmbracă-te gros, e sub zero grade")
    elif temp < 10:
        parts.append("Ia o geacă, e răcoare")
    elif temp < 20:
        parts.append("Temperatură plăcută, o jachetă ușoară e suficientă")
    elif temp < 30:
        parts.append("Vreme caldă, ideală pentru activități în aer liber")
    else:
        parts.append("Caniculă, stai la umbră și hidratează-te")

    if "ploaie" in condition or "averse" in condition or "burinta" in condition:
        parts.append("Ia umbrela")
    if "ninsoare" in condition:
        parts.append("Drumuri alunecoase, fii precaut")
    if "furtuna" in condition:
        parts.append("Evită deplasările dacă nu e necesar")
    if wind > 40:
        parts.append("Vânt puternic, atenție la obiecte nesecurizate")

    return ". ".join(parts) + "."


def _check_alerts(temp: float, wind: float, condition: str) -> str | None:
    alerts = []
    if temp < -10:
        alerts.append(f"Temperatură extrem de scăzută: {temp}°C. Pericol de hipotermie")
    if temp > 35:
        alerts.append(f"Caniculă: {temp}°C. Pericol de insolație")
    if wind > 60:
        alerts.append(f"Vânt foarte puternic: {wind} km/h")
    if "furtuna" in condition:
        alerts.append("Furtună în zonă. Rămâi în interior")
    if "inghet" in condition:
        alerts.append("Pericol de îngheț pe drumuri")

    return ". ".join(alerts) + "." if alerts else None


async def generate_summary(weather_data: dict) -> AISummary:
    """
    Genereaza rezumatul meteo.
    Momentan foloseste template-uri. Cand AI_ENABLED=True, va folosi API-ul AI.
    """
    current = weather_data.get("current", {})
    temp = current.get("temperature", 0)
    humidity = current.get("humidity", 0)
    wind = current.get("wind_speed", 0)
    condition = current.get("condition", "necunoscut")

    if AI_ENABLED:
        # TODO: Integreaza API-ul AI ales (Gemini, Claude, etc.)
        # Placeholder — se va inlocui cu apel real
        pass

    # Template-based summary in romana
    cond_text = _describe_condition(condition)
    summary = f"{cond_text.capitalize()}, {temp}°C. Umiditate {humidity}%, vânt {wind} km/h."

    recommendation = _generate_recommendation(temp, condition, wind)
    alert = _check_alerts(temp, wind, condition)

    return AISummary(
        summary=summary,
        recommendation=recommendation,
        alert=alert,
    )
