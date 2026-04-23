# Smart Dairy Farm Management System

A Flask web application for complete dairy farm operations management.

## Features
- **Cattle Management** – Register cattle with QR code identification
- **Milk Production** – Daily tracking (morning & evening) per cattle
- **Health Records** – Vet visits, diagnoses, treatments
- **Vaccination Management** – Schedules with upcoming reminders
- **Inventory** – Feed, medicines, supplies with low-stock alerts
- **Sales & Revenue** – Milk sales tracking with payment status
- **Analytics** – Charts for production, revenue, health trends
- **Community Forum** – Posts and comments between farm workers
- **Automated Alerts** – Low inventory, upcoming vaccinations

## Setup

```bash
# 1. Create virtual environment
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Run
python app.py
```

Visit: http://localhost:5000

## Database
Uses SQLite3 (`dairy_farm.db`), auto-created on first run with sample data.

## Project Structure
```
dairy_farm/
├── app.py              # Main Flask application
├── requirements.txt
├── dairy_farm.db       # Auto-generated SQLite database
└── templates/
    ├── base.html
    ├── dashboard.html
    ├── cattle.html
    ├── cattle_detail.html
    ├── cattle_form.html
    ├── milk.html
    ├── health.html
    ├── vaccinations.html
    ├── inventory.html
    ├── sales.html
    ├── community.html
    ├── post_detail.html
    ├── alerts.html
    └── analytics.html
```
