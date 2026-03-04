from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
import models, schemas

router = APIRouter(
    prefix="/api/tickets",
    tags=["tickets"]
)

@router.get("/", response_model=List[schemas.TicketDetalle])
def read_tickets(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    # Join manual para poder construir el esquema detallado fácilmente
    db_tickets = db.query(models.TicketMantenimiento).offset(skip).limit(limit).all()
    
    resultados = []
    for t in db_tickets:
        resultados.append({
            "id": t.id,
            "departamento_id": t.departamento_id,
            "descripcion": t.descripcion,
            "estado": t.estado,
            "costo_reparacion": t.costo_reparacion,
            "fecha_reporte": t.fecha_reporte,
            "departamento_numero": t.departamento.numero,
            "edificio_nombre": t.departamento.edificio.nombre
        })
    return resultados

@router.get("/{ticket_id}", response_model=schemas.TicketDetalle)
def read_ticket(ticket_id: int, db: Session = Depends(get_db)):
    t = db.query(models.TicketMantenimiento).filter(models.TicketMantenimiento.id == ticket_id).first()
    if t is None:
        raise HTTPException(status_code=404, detail="Ticket no encontrado")
    
    return {
        "id": t.id,
        "departamento_id": t.departamento_id,
        "descripcion": t.descripcion,
        "estado": t.estado,
        "costo_reparacion": t.costo_reparacion,
        "fecha_reporte": t.fecha_reporte,
        "departamento_numero": t.departamento.numero,
        "edificio_nombre": t.departamento.edificio.nombre
    }

@router.post("/", response_model=schemas.TicketMantenimiento)
def create_ticket(ticket: schemas.TicketMantenimientoCreate, db: Session = Depends(get_db)):
    departamento = db.query(models.Departamento).filter(models.Departamento.id == ticket.departamento_id).first()
    if not departamento:
        raise HTTPException(status_code=404, detail="Departamento no encontrado")
        
    db_ticket = models.TicketMantenimiento(**ticket.model_dump())
    db.add(db_ticket)
    db.commit()
    db.refresh(db_ticket)
    return db_ticket

@router.put("/{ticket_id}", response_model=schemas.TicketMantenimiento)
def update_ticket(ticket_id: int, ticket_update: schemas.TicketMantenimientoBase, db: Session = Depends(get_db)):
    db_ticket = db.query(models.TicketMantenimiento).filter(models.TicketMantenimiento.id == ticket_id).first()
    if not db_ticket:
        raise HTTPException(status_code=404, detail="Ticket no encontrado")
        
    # Actualizar solo los campos proporcionados y que estén en Update
    for var, value in ticket_update.model_dump(exclude_unset=True).items():
        setattr(db_ticket, var, value)
        
    db.commit()
    db.refresh(db_ticket)
    return db_ticket
