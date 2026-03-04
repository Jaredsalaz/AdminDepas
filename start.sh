#!/bin/bash
cd backend
pip install -r requirements.txt
gunicorn -k uvicorn.workers.UvicornWorker main:app --bind 0.0.0.0:$PORT
