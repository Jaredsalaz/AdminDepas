from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from jose import JWTError, jwt
import bcrypt
import os
from dotenv import load_dotenv
from typing import List

from database import get_db
import models, schemas

load_dotenv()

# SECURITY CONFIG
SECRET_KEY = os.getenv("SECRET_KEY", "super_secret_famesto_key_2026")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 60 * 24 * 7))

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

router = APIRouter(
    prefix="/api/auth",
    tags=["auth"]
)

# HELPER FUNCTIONS
def verify_password(plain_password, hashed_password):
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def get_password_hash(password):
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudieron validar las credenciales",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = schemas.TokenData(email=email)
    except JWTError:
        raise credentials_exception
        
    user = db.query(models.Usuario).filter(models.Usuario.email == token_data.email).first()
    if user is None:
        raise credentials_exception
    return user

def require_admin(current_user: models.Usuario = Depends(get_current_user)):
    if current_user.rol != "Administrador":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes los permisos de Administrador necesarios para esta acción"
        )
    return current_user

# ENDPOINTS

@router.post("/login", response_model=schemas.Token)
def login_for_access_token(db: Session = Depends(get_db), form_data: OAuth2PasswordRequestForm = Depends()):
    # Usamos email como username en OAuth2PasswordRequestForm
    user = db.query(models.Usuario).filter(models.Usuario.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Correo o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/register", response_model=schemas.UsuarioOut)
def register_user(user: schemas.UsuarioCreate, db: Session = Depends(get_db)):
    # Simple check for duplicates
    db_user = db.query(models.Usuario).filter(models.Usuario.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="El correo ya está registrado")
    
    hashed_password = get_password_hash(user.password)
    new_user = models.Usuario(
        nombre=user.nombre,
        email=user.email,
        hashed_password=hashed_password,
        rol=user.rol
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.get("/me", response_model=schemas.UsuarioOut)
def read_users_me(current_user: models.Usuario = Depends(get_current_user)):
    return current_user

@router.get("/usuarios", response_model=List[schemas.UsuarioOut])
def list_users(db: Session = Depends(get_db)):
    return db.query(models.Usuario).all()

class PasswordUpdate(schemas.BaseModel):
    new_password: str

@router.put("/usuarios/{user_id}/password")
def update_user_password(
    user_id: int, 
    payload: PasswordUpdate, 
    db: Session = Depends(get_db), 
    admin_user: models.Usuario = Depends(require_admin)
):
    target_user = db.query(models.Usuario).filter(models.Usuario.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
        
    hashed_password = get_password_hash(payload.new_password)
    target_user.hashed_password = hashed_password
    db.commit()
    
    return {"message": "Contraseña actualizada exitosamente"}
