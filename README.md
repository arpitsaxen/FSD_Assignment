# School Vaccination Portal - Deployment Guide

## Table of Contents
1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Local Development Deployment](#local-development-deployment)
4. [Production Deployment](#production-deployment)
5. [Database Setup](#database-setup)
6. [Environment Variables](#environment-variables)
7. [CI/CD Pipeline](#cicd-pipeline)
8. [Troubleshooting](#troubleshooting)

## Overview

This document provides instructions for deploying the School Vaccination Portal, a full-stack web application for managing vaccination drives in schools. The application consists of a Django backend and a React frontend.

## Prerequisites

Before proceeding with deployment, ensure you have the following prerequisites installed:

### Backend Requirements
- Python 3.8 or higher
- pip (Python package manager)
- virtualenv or venv
- Django 4.2 or higher
- PostgreSQL (for production) or SQLite (for development)

### Frontend Requirements
- Node.js 16.x or higher
- npm 8.x or higher
- React 18.x

### General Requirements
- Git
- Basic knowledge of command line operations
- Network access to install packages

## Local Development Deployment

### Backend Setup

1. **Clone the Repository**
   ```bash
   git clone https://github.com/yourusername/school-vaccination-portal.git
   cd school-vaccination-portal
   ```

2. **Create and Activate Virtual Environment**
   ```bash
   # For Unix/Linux/macOS
   python -m venv venv
   source venv/bin/activate

   # For Windows
   python -m venv venv
   venv\Scripts\activate
   ```

3. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure Environment Variables**
   Create a `.env` file in the project root with the following variables:
   ```
   SECRET_KEY=your_secret_key_here
   DEBUG=True
   ALLOWED_HOSTS=localhost,127.0.0.1
   ```

5. **Run Migrations**
   ```bash
   python manage.py migrate
   ```

6. **Create Admin User**
   ```bash
   python manage.py setup_admin
   # This creates a default admin user (username: admin, password: admin)
   ```

7. **Generate Sample Data (Optional)**
   ```bash
   python manage.py generate_sample_students --per_grade 100
   ```

8. **Start Django Development Server**
   ```bash
   python manage.py runserver
   ```
   The backend will be available at http://localhost:8000/

### Frontend Setup

1. **Navigate to Frontend Directory**
   ```bash
   cd frontend
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   Create a `.env` file in the frontend directory:
   ```
   REACT_APP_API_URL=http://localhost:8000
   ```

4. **Start Development Server**
   ```bash
   npm start
   ```
   The frontend will be available at http://localhost:3000/

## Production Deployment

### Backend Production Setup

1. **Install Additional Dependencies**
   ```bash
   pip install gunicorn psycopg2-binary
   ```

2. **Configure Production Settings**
   Update `settings.py` or use environment variables:
   ```python
   DEBUG = False
   ALLOWED_HOSTS = ['yourdomain.com', 'www.yourdomain.com']
   ```

3. **Set Up PostgreSQL Database**
   ```bash
   # Install PostgreSQL if not already installed
   sudo apt-get update
   sudo apt-get install postgresql postgresql-contrib

   # Create database and user
   sudo -u postgres psql
   CREATE DATABASE vaccination_portal;
   CREATE USER portal_user WITH PASSWORD 'secure_password';
   GRANT ALL PRIVILEGES ON DATABASE vaccination_portal TO portal_user;
   \q

   # Update DATABASE settings in your .env or settings.py
   ```

4. **Configure Static Files**
   ```bash
   python manage.py collectstatic
   ```

5. **Set Up Gunicorn**
   Create a `gunicorn.conf.py` file:
   ```python
   bind = "0.0.0.0:8000"
   workers = 3
   timeout = 120
   ```

6. **Start Gunicorn**
   ```bash
   gunicorn school_vaccination_portal.wsgi:application -c gunicorn.conf.py
   ```

### Frontend Production Build

1. **Create Production Build**
   ```bash
   npm run build
   ```

2. **Serve with Nginx**
   Install Nginx:
   ```bash
   sudo apt-get install nginx
   ```

   Configure Nginx (`/etc/nginx/sites-available/vaccination-portal`):
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com www.yourdomain.com;

       location / {
           root /path/to/frontend/build;
           try_files $uri /index.html;
       }

       location /api {
           proxy_pass http://localhost:8000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }

       location /admin {
           proxy_pass http://localhost:8000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

   Enable site configuration:
   ```bash
   sudo ln -s /etc/nginx/sites-available/vaccination-portal /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

### Using Docker (Alternative)

1. **Create Dockerfile for Backend**
   ```dockerfile
   FROM python:3.9-slim

   WORKDIR /app

   COPY requirements.txt .
   RUN pip install --no-cache-dir -r requirements.txt

   COPY . .

   EXPOSE 8000

   CMD ["gunicorn", "school_vaccination_portal.wsgi:application", "--bind", "0.0.0.0:8000"]
   ```

2. **Create Dockerfile for Frontend**
   ```dockerfile
   FROM node:16-alpine as build

   WORKDIR /app

   COPY package*.json ./
   RUN npm install

   COPY . .
   RUN npm run build

   FROM nginx:alpine
   COPY --from=build /app/build /usr/share/nginx/html
   COPY nginx.conf /etc/nginx/conf.d/default.conf

   EXPOSE 80

   CMD ["nginx", "-g", "daemon off;"]
   ```

3. **Create Docker Compose Configuration**
   ```yaml
   version: '3'

   services:
     backend:
       build: ./backend
       restart: always
       ports:
         - "8000:8000"
       environment:
         - DEBUG=False
         - SECRET_KEY=your_secret_key_here
         - DATABASE_URL=postgresql://portal_user:secure_password@db:5432/vaccination_portal
       depends_on:
         - db

     frontend:
       build: ./frontend
       restart: always
       ports:
         - "80:80"
       depends_on:
         - backend

     db:
       image: postgres:13
       volumes:
         - postgres_data:/var/lib/postgresql/data/
       environment:
         - POSTGRES_PASSWORD=secure_password
         - POSTGRES_USER=portal_user
         - POSTGRES_DB=vaccination_portal

   volumes:
     postgres_data:
   ```

4. **Run with Docker Compose**
   ```bash
   docker-compose up -d
   ```

## Database Setup

### Development (SQLite)
The default configuration uses SQLite, which requires no additional setup for development.

### Production (PostgreSQL)

1. **Create PostgreSQL Database**
   ```bash
   sudo -u postgres psql
   CREATE DATABASE vaccination_portal;
   CREATE USER portal_user WITH PASSWORD 'secure_password';
   GRANT ALL PRIVILEGES ON DATABASE vaccination_portal TO portal_user;
   \q
   ```

2. **Configure Django to Use PostgreSQL**
   Update `settings.py`:
   ```python
   DATABASES = {
       'default': {
           'ENGINE': 'django.db.backends.postgresql',
           'NAME': 'vaccination_portal',
           'USER': 'portal_user',
           'PASSWORD': 'secure_password',
           'HOST': 'localhost',
           'PORT': '5432',
       }
   }
   ```

3. **Run Migrations**
   ```bash
   python manage.py migrate
   ```

## Environment Variables

### Backend Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| SECRET_KEY | Django secret key | 'your_random_string_here' |
| DEBUG | Debug mode (True/False) | False |
| ALLOWED_HOSTS | Comma-separated hosts | yourdomain.com,www.yourdomain.com |
| DATABASE_URL | Database connection string | postgresql://user:pass@host:port/db |
| CORS_ALLOWED_ORIGINS | Allowed CORS origins | https://yourdomain.com |

### Frontend Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| REACT_APP_API_URL | Backend API URL | https://api.yourdomain.com |
| REACT_APP_ENV | Environment | production |

## CI/CD Pipeline

For automated deployments, you can use GitHub Actions or another CI/CD provider.

### Sample GitHub Actions Workflow

Create a `.github/workflows/deploy.yml` file:

```yaml
name: Deploy

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Set up Python
        uses: actions/setup-python@v2
        with:
          python-version: '3.9'
          
      - name: Install dependencies
        run: |
          python -m pip install --upgrade pip
          pip install -r requirements.txt
          
      - name: Run tests
        run: |
          python manage.py test
          
      - name: Set up Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '16'
          
      - name: Install frontend dependencies
        run: |
          cd frontend
          npm install
          
      - name: Build frontend
        run: |
          cd frontend
          npm run build
          
      # Add deployment steps here (e.g., SSH to server, deploy to cloud)
```

## Troubleshooting

### Common Backend Issues

1. **Database Connection Errors**
   - Check database credentials
   - Ensure PostgreSQL service is running
   - Verify network connectivity between app and database

2. **Migration Errors**
   - Try running `python manage.py makemigrations` first
   - Check for conflicts in migration files
   - Consider resetting migrations if in development

3. **Static Files Not Loading**
   - Run `python manage.py collectstatic`
   - Check STATIC_ROOT and STATIC_URL in settings
   - Verify Nginx configuration for static files

### Common Frontend Issues

1. **API Connection Errors**
   - Verify API URL in environment variables
   - Check CORS settings in Django
   - Test API endpoints directly

2. **Build Failures**
   - Clear npm cache: `npm cache clean --force`
   - Delete node_modules and reinstall: `rm -rf node_modules && npm install`
   - Check for dependency conflicts

3. **Routing Issues**
   - Ensure Nginx is configured for React's client-side routing
   - Check for a proper `try_files $uri /index.html;` directive

### General Debugging

1. **Check Logs**
   - Django logs: `tail -f logs/django.log`
   - Nginx logs: `tail -f /var/log/nginx/error.log`
   - System logs: `journalctl -u gunicorn`

2. **Test Connectivity**
   - Backend API: `curl -I http://localhost:8000/api/students/`
   - Frontend: `curl -I http://localhost:3000`

3. **Verify Environment**
   - Check environment variables: `printenv | grep REACT` or `printenv | grep DJANGO`
   - Confirm correct Node and Python versions

---

For additional help or to report deployment issues, please open an issue in the GitHub repository.