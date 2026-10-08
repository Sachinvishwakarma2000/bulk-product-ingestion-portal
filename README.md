# Bulk Product Ingestion & Catalogue Operations Portal

An enterprise-ready catalogue operations portal and bulk product feed ingestion system built with **React (Vite)** and **Node.js (Express)**.

Designed for e-commerce operations teams to reliably upload, validate, and manage large product catalogues from CSV feeds with row-level error isolation and non-blocking imports.

---

## 🌟 Key Features

- **Drag-and-Drop CSV Ingestion**: Intuitive and responsive file uploader for product catalogue feeds.
- **Non-Blocking Row-Level Validation**: Invalid records (missing fields, duplicate SKUs, negative prices, malformed types) are isolated with granular error messages without halting valid product imports.
- **Real-Time Import Metrics**: Immediate feedback showing total processed, successful imports, and actionable row-by-row error logs.
- **Live Catalogue Viewer**: Interactive inventory management table featuring:
  - Real-time client-side search across SKU, Name, and Category
  - Category filters and inventory summary badges
  - Safe catalogue state reset
- **Robust Architecture & Security Audit**: Includes comprehensive PR security review (SQLi, IDOR, race condition mitigations), 100× scale distributed system blueprint (queues, chunking, streaming), and AI code auditing.

---

## 🏗️ Tech Stack

- **Frontend**: React 18, Vite, Modern CSS (Design Tokens & Responsive Layout)
- **Backend**: Node.js, Express, Multer (Multipart upload), CSV-Parser
- **Data Model**:
  - `sku` (String, Unique Identifier)
  - `name` (String, Product Title)
  - `price` (Number, Non-negative)
  - `stock` (Integer, Non-negative)
  - `category` (String)

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- npm or yarn

### 1. Backend Setup
```bash
cd starter/backend-node
npm install
npm run dev
# Server runs on http://localhost:3001
```

### 2. Frontend Setup
```bash
cd starter/frontend
npm install
npm run dev
# Vite dev server runs on http://localhost:5173
```

---

## 📡 API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/products/import` | Accepts `multipart/form-data` with CSV file. Returns import summary and error report. |
| `GET` | `/api/products` | Fetches the full product catalogue. |
| `DELETE` | `/api/products` | Resets the in-memory/persisted catalogue store. |

---

## 📁 Repository Structure

```
├── starter/
│   ├── backend-node/     # Express API server & CSV validation engine
│   ├── frontend/         # React + Vite operations portal dashboard
│   └── fixtures/         # Sample CSV files (valid & error test fixtures)
├── ANSWERS.md            # In-depth architectural writeup, PR review & scale design
├── PROMPTS.md            # AI interaction and engineering logs
├── assignment/           # Assessment briefs and specifications
└── critique/             # AI module critique source files
```

---

## 📄 License
MIT
