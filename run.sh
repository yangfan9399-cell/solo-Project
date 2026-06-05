#!/bin/bash

source venv/bin/activate

echo "Creating database..."
createdb streetlight_inspection 2>/dev/null || echo "Database may already exist"

echo "Running migrations..."
python manage.py makemigrations
python manage.py migrate

echo "Seeding initial data..."
python manage.py seed_data

echo "Starting server..."
python manage.py runserver 0.0.0.0:8000
