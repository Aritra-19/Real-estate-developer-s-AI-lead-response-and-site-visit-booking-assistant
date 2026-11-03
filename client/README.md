# AI Lead Response & Site Visit Booking Assistant

An end-to-end platform that helps a residential real estate developer respond to every inbound lead within seconds and book site visits without double-booking. Built for **Company A, Ahmedabad**, a developer with two live projects (*Aarav Sky Greens* and *Vantara Heights*), 420 apartments, priced ₹65 Lakh – ₹1.20 Crore.

## 📚 Documentation

| Document | What's inside |
|---|---|
| [**Technical Design Document**](https://github.com/Aritra-19/Real-estate-developer-s-AI-lead-response-and-site-visit-booking-assistant/blob/main/Technical_Design_Document.md) | Business problem, assumptions, architecture, data model, AI guardrails, booking flow, UI decisions, scope cuts and roadmap |
| [**Deployment Guide**](https://github.com/Aritra-19/Real-estate-developer-s-AI-lead-response-and-site-visit-booking-assistant/blob/main/deployment.md) | Step-by-step local setup, environment variables, production deployment, demo logins and reviewer test cases |

## The Problem

Inbound leads (about 3,000 a month from property portals, Meta ads, the website and hoarding phone lines) were collected in an inbox and an Excel sheet, then followed up manually the next morning. That meant a median first response time of about 14 hours, roughly 35% of leads never contacted within 48 hours, and only 6% of leads reaching a site visit. See [Technical Design Document §1](Technical_Design_Document.md) for the full breakdown.

## Key Features

- **Multilingual AI concierge** in English, Hindi and Gujarati, grounded strictly in the sales head's approved fact sheet.
- **Guardrails**: refuses discount negotiation, never invents facts, and hands off to a human executive on request or when it lacks an answer.
- **Concurrency-safe site visit booking**: slot capacity is enforced inside a SQLite transaction, so there is no overbooking. Includes `.ics` calendar export and simulated WhatsApp reminders.
- **Lead deduplication**: detects duplicates by phone number and offers a one-click merge.
- **Role-based views** for Home Buyer, Sales Executive and Sales Head.
- **Source ROI dashboard** showing cost per visit by lead source.
- **Fact sheet and slot managers** so the Sales Head can edit content and capacity live.
- **Compliance-minded**: RERA registration numbers surfaced, DPDP Act 2023 consent banner and opt-out support.

## Tech Stack

| Layer | Technology |
|---|---|
| Client | React 19, Vite, Tailwind CSS, Lucide icons (plain JavaScript) |
| Server | Node.js, Express (ESM) |
| Database | SQLite via `better-sqlite3` (WAL mode) |
| AI | Built-in deterministic fact sheet engine (works offline); optional Gemini / OpenAI keys |
| Tests | Node's built-in test runner |

## Quick Start

**Prerequisites:** Node.js 18, 20 or 22, npm 9+, Git.

```bash
# 1. Clone
git clone https://github.com/Aritra-19/Real-estate-developer-s-AI-lead-response-and-site-visit-booking-assistant.git
cd Real-estate-developer-s-AI-lead-response-and-site-visit-booking-assistant

# 2. Install root, server and client dependencies
npm install

# 3. Seed the database
npm run seed

# 4. Run tests (optional)
npm test

# 5. Start client and server together
npm run dev
```

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:5000 |
| Health check | http://localhost:5000/api/health |

The app runs fully offline with no API keys. For optional LLM configuration and production deployment, see the [Deployment Guide](deployment.md).

## Demo Roles

Use the role switcher in the top navigation bar. No sign-up is needed.

| Role | Access |
|---|---|
| Home Buyer | Project discovery, AI concierge, site visit booking |
| Sales Executive (Rajesh Mehta) | Assigned leads, AI conversation summaries, visit status updates |
| Sales Head (Vikram Singhania) | Analytics, unified leads and merge, fact sheet editor, slot manager |

Seeded test scenarios (duplicate merge, discount refusal, missing-fact handoff, booking concurrency) are listed in the [Deployment Guide §5](deployment.md).

## Project Structure

```
.
├── client/                      # React + Vite frontend
│   └── src/components/          # BuyerPortal, AIChatDrawer, BookingModal, dashboards...
├── server/
│   ├── src/
│   │   ├── ai/                  # agent, guardrails, multilingual engine
│   │   ├── db/                  # schema and seed data
│   │   ├── routes/              # auth, chat, leads, slots, visits, factsheet, analytics
│   │   └── index.js
│   └── tests/                   # guardrails, concurrency and lead tests
├── scripts/                     # dev runner, concurrency stress test
├── Technical_Design_Document.md
├── deployment.md
└── README.md
```

## API Overview

| Area | Endpoints |
|---|---|
| Auth | `GET /api/auth/profiles`, `POST /api/auth/login` |
| Chat | `POST /api/chat/start`, `POST /api/chat/message`, `POST /api/chat/handoff`, `GET /api/chat/flagged` |
| Leads | `GET /api/leads`, `POST /api/leads`, `POST /api/leads/check-duplicate`, `POST /api/leads/merge` |
| Slots | `GET /api/slots`, `POST /api/slots/book`, `POST /api/slots`, `PATCH /api/slots/:id` |
| Visits | `GET /api/visits`, `PATCH /api/visits/:id/status`, `POST /api/visits/:id/reminder` |
| Fact sheet | `GET /api/factsheet/:projectId`, `PUT /api/factsheet/:projectId` |
| Analytics | `GET /api/analytics/dashboard` |

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Run server and client together |
| `npm run seed` | Seed the SQLite database |
| `npm test` | Run server tests |
| `node scripts/test-concurrency.js` | Parallel double-booking stress test |
| `npm run build` | Build the client for production |
| `npm start` | Start the production server |

## Scope and Roadmap

Full CRM replacement, live WhatsApp Business API, and payment or allotment flows were deliberately left out. WhatsApp messaging is simulated. Planned next steps include WhatsApp Cloud API integration, missed-call IVR, smarter executive routing, and CRM sync adapters. Details are in [Technical Design Document §7](Technical_Design_Document.md).

## License

MIT
