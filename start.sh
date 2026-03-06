#!/bin/bash
cd backend
pip install -r requirements.txt
alembic upgrade head
gunicorn -k uvicorn.workers.UvicornWorker main:app --bind 0.0.0.0:$PORT
