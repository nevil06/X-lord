from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, List
from datetime import datetime

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
    # Basic deterministic heuristic for demo purposes:
    # If document length > 1000 base64 chars, pretend it's a good scan
    doc_len = len(req.document_base64)
    score = 0.95 if doc_len > 1000 else 0.65
    is_valid = score > 0.8
    
    return {
        "is_valid": is_valid,
        "confidence_score": round(score, 4),
        "extracted_data": {
            "survey_number": req.metadata.get("survey_number", "Simulated Extracted Value"),
            "owner_name": req.metadata.get("owner_name", "Simulated Extracted Name")
        },
        "anomalies_detected": [] if is_valid else ["Low resolution or truncated document", "Signature extraction failed"]
    }

@app.post("/api/v1/fraud-score")
def calculate_fraud_score(req: FraudScoreRequest):
    """
    Real heuristic-based fraud scoring.
    Evaluates risk based on transaction velocity, missing hashes, and inheritance patterns.
    """
    flags = []
    total_risk = 0.1 # Base risk
    
    txs = req.transaction_history
    
    if len(txs) == 0:
        return {
            "parcel_id": req.parcel_id,
            "fraud_risk_score": 0.1,
            "risk_level": "LOW",
            "flags": []
        }

    # 1. Velocity Anomaly: Rapid resale after inheritance
    if len(txs) >= 2:
        # Sort by date descending
        try:
            sorted_txs = sorted(txs, key=lambda x: datetime.fromisoformat(x.get('date', '1970-01-01').replace('Z', '+00:00')), reverse=True)
            latest = sorted_txs[0]
            previous = sorted_txs[1]
            
            if previous.get('type') == 'INHERITANCE' and latest.get('type') == 'SALE':
                t1 = datetime.fromisoformat(latest.get('date').replace('Z', '+00:00'))
                t2 = datetime.fromisoformat(previous.get('date').replace('Z', '+00:00'))
                days_diff = (t1 - t2).days
                if days_diff < 90:
                    total_risk += 0.4
                    flags.append(f"Rapid resale ({days_diff} days) following inheritance")
        except Exception:
            pass

    # 2. Velocity Anomaly: Multiple pending mutations
    pending_count = sum(1 for tx in txs if tx.get('status') == 'PENDING')
    if pending_count > 1:
        total_risk += 0.3
        flags.append("Multiple overlapping pending mutations detected")

    # 3. Missing inheritance hashes
    for tx in txs:
        if tx.get('type') == 'INHERITANCE' and not tx.get('documentHash'):
            total_risk += 0.25
            flags.append("Missing cryptographic hash for inheritance document")
            break

    # 4. Check for high volume overall
    if len(txs) > 5:
        # 5 transactions in a short period is unusual for land
        total_risk += 0.2
        flags.append("High overall transaction volume")
        
    total_risk = min(1.0, total_risk)
    
    return {
        "parcel_id": req.parcel_id,
        "fraud_risk_score": round(total_risk, 4),
        "risk_level": "HIGH" if total_risk >= 0.7 else ("MEDIUM" if total_risk >= 0.4 else "LOW"),
        "flags": flags
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
