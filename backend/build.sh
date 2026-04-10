#!/bin/bash

# Exit on error
set -e

echo "Building project..."

# Ensure we have the latest pip
python3 -m pip install --upgrade pip

# Install dependencies in the build environment
echo "Installing dependencies..."
pip3 install -r requirements.txt

# Ensure the static directory exists
mkdir -p staticfiles

# Run migrations (Optional here as it can also be done via the API)
echo "Running migrations..."
python3 manage.py migrate --noinput

# Collect static files
echo "Collecting static files..."
python3 manage.py collectstatic --noinput --clear

echo "Build process completed successfully!"
