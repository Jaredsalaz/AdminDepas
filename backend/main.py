from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import edificios, tickets, inquilinos, contratos, pagos, auth
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(
    title="DepaAdmin PMS API",
    description="Property Management System API para administrar departamentos",
    version="1.0.0"
)

# Configurar CORS para que el frontend React y la app Flutter puedan conectarse
frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_url, "http://127.0.0.1:5173", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(edificios.router)
app.include_router(tickets.router)
app.include_router(inquilinos.router)
app.include_router(contratos.router)
app.include_router(pagos.router)
app.include_router(auth.router)

@app.get("/")
def read_root():
    return {"message": "Bienvenido al API de DepaAdmin PMS"}

@app.get("/health")
def health_check():
    return {"status": "ok"}
