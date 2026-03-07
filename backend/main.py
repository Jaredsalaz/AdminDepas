from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import edificios, tickets, inquilinos, contratos, pagos, auth, empresas, cobranza, superadmin
from contextlib import asynccontextmanager
import os
from dotenv import load_dotenv
from scheduler import crear_scheduler, check_and_send_rent_reminders

load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: iniciar el scheduler al arrancar FastAPI
    scheduler = crear_scheduler()
    scheduler.start()
    print("✅ Scheduler de recordatorios de renta iniciado.")
    yield
    # Shutdown: detener el scheduler al apagar
    scheduler.shutdown()
    print("🛑 Scheduler detenido.")

app = FastAPI(
    title="DepaAdmin PMS API",
    description="Property Management System API para administrar departamentos",
    version="1.0.0",
    lifespan=lifespan
)

# Configurar CORS
frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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
app.include_router(empresas.router)
app.include_router(cobranza.router)
app.include_router(superadmin.router)

@app.get("/")
def read_root():
    return {"message": "Bienvenido al API de DepaAdmin PMS"}

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.post("/test-email-recordatorio")
def test_email_recordatorio():
    """
    Endpoint de PRUEBA para disparar manualmente los recordatorios de renta.
    Útil para verificar que el sistema de email funciona correctamente.
    """
    check_and_send_rent_reminders()
    return {"message": "Proceso de recordatorios ejecutado. Revisa la consola del servidor para ver los resultados."}
