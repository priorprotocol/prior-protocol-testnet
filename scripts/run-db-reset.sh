#!/bin/bash

# Database Reset Script Runner
# This script runs the SQL reset script against the database

echo "Starting complete database reset..."

# Use the DATABASE_URL environment variable to connect to the database
if [ -z "$DATABASE_URL" ]; then
  echo "Error: DATABASE_URL environment variable is not set!"
  exit 1
fi

# Extract database connection details from DATABASE_URL
# Example format: postgres://username:password@hostname:port/database_name
DB_USER=$(echo $DATABASE_URL | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
DB_PASSWORD=$(echo $DATABASE_URL | sed -n 's/.*:\/\/[^:]*:\([^@]*\).*/\1/p')
DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
DB_PORT=$(echo $DATABASE_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\(.*\)/\1/p')

# Run the SQL reset script
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f scripts/db-reset.sql

if [ $? -eq 0 ]; then
  echo "Database reset completed successfully!"
else
  echo "Error: Database reset failed!"
  exit 1
fi

echo "The application is now ready with a clean database."