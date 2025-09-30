# Live Demo

## ** [Click here to see the live demo ↗](https://data-visualisation-dashboard.chelseayang.work/) **

# Data Visualisation Dashboard (Next.js + Prisma)

A small web app that lets a retail client:

Upload an Excel file with procurement / sales / inventory data

Visualise per-day Inventory, Procurement Amount (qty × price), and Sales Amount (qty × price) on a line chart

Filter by date range (1–7 days inclusive) and selected products

Compare multiple products (single-metric mode) or dive into one product (multi-metric)

Log in with email + password (JWT httpOnly cookie)

## Stack: Next.js 14, TypeScript, Prisma (Postgres), Recharts, Jest (+ Husky pre-commit)

# Features

- Single chart with multiple series (by metric date and product)

- Product multi-select with client-side search

- Excel import (validates rows, upserts records, upload history)

- Basic auth (JWT cookie), protected API routes

- API tests (Jest)

# Trade-offs

## Strict upload schema vs real-world messiness: 
For the challenge, the Excel upload requires the **exact column schema** (simple, deterministic, easy to validate). In a real app, I may use an AI pre-processor to clean and normalize the file before saving—map headers, parse units/currency, standardize dates, and deduplicate—so the data is structured correctly before persistence.

# Prepare

Node Version: v22.1.0

## Setup environment variables for local env

```
cp .env.example .env
```

## Testing Account
| field                | value               |
| -------------------- | ------------------- |
| email                | `test@example.com`  |
| password             | `codingtest123`     |


## Testing sample files

- sample_data_01.xlsx
- sample_data_02.xlsx

## Commands

| name                 | commands       |
| -------------------- | -------------- |
| install dependencies | `npm install`  |
| run locally          | `npm run dev`  |
| run test             | `npm run test` |


