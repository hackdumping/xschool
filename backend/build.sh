#!/bin/bash

# Exit on error
set -e

echo "Building project..."

# Create a virtual environment to isolate dependencies and avoid PEP 668 error
python3 -m venv venv
source venv/bin/activate

# Install dependencies in the virtual environment
echo "Installing dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Run migrations
echo "Running migrations..."
python manage.py migrate --noinput

# Collect static files
echo "Collecting static files..."
python manage.py collectstatic --noinput

echo "Build process completed successfully!"
