from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import edificios, tickets, inquilinos, contratos, pagos, auth

app = FastAPI(
    title="DepaAdmin PMS API",
    description="Property Management System API para administrar departamentos",
    version="1.0.0"
)

# Configurar CORS para que el frontend React y la app Flutter puedan conectarse
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Modificar en producción
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
