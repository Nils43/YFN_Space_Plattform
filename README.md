# YFN Space Plattform – Simple desk booking with a live weekly calendar

YFN Space Plattform is a lightweight web app for booking desks in Young Founders Network spaces. It combines a clean, responsive UI with a dynamic backend:

- Book a desk via a simple form
- See a weekly calendar showing free/occupied slots pulled from the backend
- Prevent overlapping bookings with a robust conflict check

Tech stack:
- Frontend: Static HTML/CSS + client-side JS (CSR via fetch) on Vercel
- Backend: Node/Express API on Render
- Database: Postgres (Neon)


## Installation (local)

Prerequisites: Node 18+, Postgres (or Neon URL), Git

1) Clone and install
```bash
git clone https://github.com/<your-username>/<your-repo>.git
cd <your-repo>
npm install
```

2) Environment variables  
Create a .env file (do not commit):
```
DATABASE_URL=postgresql://USER:PASS@HOST:5432/DB?sslmode=require
```

3) Database schema (Neon or local Postgres)
```bash
psql "postgresql://USER:PASS@HOST:5432/DB?sslmode=require" -f sql/schema.sql
psql "postgresql://USER:PASS@HOST:5432/DB?sslmode=require" -f sql/seed.sql  # optional
```

4) Run
```bash
node src/server.js
# open http://localhost:3000
```


## Usage

- Open the homepage: https://yfn-space-plattform.onrender.com/?ok=1
- Fill the booking form (name, resource, start, end) and submit
- View the weekly calendar (free/busy from backend)
- Success/validation states appear as toasts


## Credits

- Project: Young Founders Network (YFN) Space
- Lead: Nils Heck




