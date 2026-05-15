from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="PokerLedger API",
    version="0.1.0",
    description="API para gestión de mesas de póker entre amigos",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "pokerledger-backend"}


@app.get("/")
def root():
    return {"message": "PokerLedger API running"}