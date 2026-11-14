"""Internal aggregation service: no database or personal data in the response."""
import os
import secrets
from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel, Field
app = FastAPI(title="Nordhaus Insights", version="1.0.0")
class Lead(BaseModel):
    stage: str
    value: int = Field(ge=0)
class Payload(BaseModel):
    leads: list[Lead] = Field(max_length=10000)
def summarize(leads: list[Lead]) -> dict:
    won = [lead for lead in leads if lead.stage == "Umowa"]
    return {"count": len(leads), "pipeline": sum(lead.value for lead in leads), "won": sum(lead.value for lead in won), "conversion": round(len(won) / len(leads) * 100, 2) if leads else 0, "stages": {stage: sum(lead.stage == stage for lead in leads) for stage in ["Nowy", "Kontakt", "Oferta", "Umowa"]}}
@app.get("/health")
def health():
    return {"status": "ok"}
@app.post("/summary")
def summary(payload: Payload, x_service_key: str = Header(default="")):
    key = os.getenv("INSIGHTS_KEY", "")
    if not key or not secrets.compare_digest(key, x_service_key):
        raise HTTPException(status_code=401, detail="Invalid service key")
    return summarize(payload.leads)
