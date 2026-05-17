from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.database import get_db
from app.routers import auth, users, groups, tables, debts, audit, stats

app = FastAPI(
    title="PokerLedger API",
    version="1.0.0",
    description="API para gestión de mesas de póker entre amigos",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(groups.router)
app.include_router(tables.router)
app.include_router(debts.router)
app.include_router(audit.router)
app.include_router(stats.router)


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "pokerledger-backend"}


@app.get("/health/db")
def health_check_db(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        return {"status": "ok", "database": "connected"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"DB error: {str(e)}")


@app.get("/")
def root():
    return {"message": "PokerLedger API running"}
