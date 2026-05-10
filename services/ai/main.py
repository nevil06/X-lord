from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, List
import random

app = FastAPI(title="Land Trust AI Intelligence", version="1.0.0")

class DocumentRequest(BaseModel):
    document_base64: str
    metadata: Dict[str, Any]

class FraudScoreRequest(BaseModel):
    parcel_id: str
    owner_id: str
    transaction_history: List[Dict[str, Any]]

@app.get("/health")
def health_check():
    return {"status": "operational", "service": "Land Trust AI Intelligence"}

@app.post("/api/v1/verify-document")
def verify_document(req: DocumentRequest):
    # Simulated OCR and LLM verification of legal land document
    # In a real scenario, this would use Google Cloud Document AI or Gemini
    score = random.uniform(0.7, 0.99)
    is_valid = score > 0.8
    
    return {
        "is_valid": is_valid,
        "confidence_score": round(score, 4),
        "extracted_data": {
            "survey_number": "Simulated Extracted Value",
            "owner_name": "Simulated Extracted Name"
        },
        "anomalies_detected": [] if is_valid else ["Signature mismatch detected", "Timestamp irregular"]
    }

@app.post("/api/v1/fraud-score")
def calculate_fraud_score(req: FraudScoreRequest):
    # Simulated Fraud Scoring using anomaly detection (Isolation Forest simulation)
    # Checks velocity of transactions, missing lineage, etc.
    velocity_risk = 0.0
    if len(req.transaction_history) > 3:
        velocity_risk = 0.6  # High transaction volume risk
        
    base_score = random.uniform(0.1, 0.4)
    total_risk = min(1.0, base_score + velocity_risk)
    
    return {
        "parcel_id": req.parcel_id,
        "fraud_risk_score": round(total_risk, 4),
        "risk_level": "HIGH" if total_risk > 0.7 else ("MEDIUM" if total_risk > 0.4 else "LOW"),
        "flags": ["High transaction velocity"] if velocity_risk > 0 else []
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
