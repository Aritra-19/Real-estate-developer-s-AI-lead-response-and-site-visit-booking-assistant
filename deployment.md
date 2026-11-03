# Deployment Guide & Reviewer Instructions
**Company A, Ahmedabad — AI Lead Response & Site Visit Booking Platform**

---

## 1. Project Overview & Quick Demo Login

This repository delivers an end-to-end, production-grade AI lead response and site visit booking platform built specifically for **Company A**, a residential developer in Ahmedabad managing 2 live projects (*Aarav Sky Greens* and *Vantara Heights*, 420 apartments, ₹65L – ₹1.2 Cr).

### Reviewer Demo Access & Roles
The application includes a role-switching bar in the top navigation header for testing without needing complex sign-up:

| Role | Name & Email | Description / Access Permissions |
|---|---|---|
| **Home Buyer** | *Public / Prospective Buyer* | Project discovery, DPDP consent, multilingual AI concierge (EN, HI, GU), real-time site visit booking, instant human handoff. |
| **Sales Executive** | Rajesh Mehta (`rajesh@companya.in`) | Executive cockpit: assigned leads, AI conversation summaries, full transcripts, visit status toggles, simulated WhatsApp reminders. |
| **Sales Head / Admin** | Vikram Singhania (`head@companya.in`) | Executive analytics dashboard, source attribution ROI & cost per visit, unified lead list & duplicate merge, live fact sheet editor, slot manager. |

---

## 2. How to Run Locally (Step by Step)

### Prerequisites
- **Node.js**: v18.x, v20.x, or v22.x
- **npm**: v9.x or higher
- **Git**

### Step 1: Clone the Repository
```bash
git clone https://github.com/company-a-dev/real-estate-ai-assistant.git
cd real-estate-ai-assistant
```

### Step 2: Install Dependencies
Install all root, server, and client dependencies with a single command:
```bash
npm install
```
*(Alternatively, run `cd server && npm install` followed by `cd ../client && npm install`)*

### Step 3: Seed Database with Realistic Company A Ahmedabad Data
Initialize the SQLite database with 2 live projects, AUDA-approved fact sheets, real-time visit slots, and seeded leads (including *Hardik Patel*, *Nidhi Shah*, and *Kavita Joshi* from the brief):
```bash
npm run seed
```

### Step 4: Run Automated Tests
Verify slot concurrency double-booking prevention, lead duplicate detection, and AI fact sheet guardrails:
```bash
npm test
```
*Optional: Run the 10-thread parallel race-condition stress test:*
```bash
node scripts/test-concurrency.js
```

### Step 5: Start the Fullstack Application
Launch both backend and frontend concurrently:
```bash
npm run dev
```

- **Frontend Client**: [http://localhost:3000](http://localhost:3000)
- **Backend API Server**: [http://localhost:5000](http://localhost:5000)
- **API Health Check**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## 3. Environment Variables (Names Only)

The application works 100% offline out of the box using its built-in deterministic NLP fact sheet engine. Optionally, to connect to external LLM providers, create a `.env` file in the `server/` directory:

| Variable Name | Required | Purpose |
|---|---|---|
| `PORT` | Optional (default: `5000`) | Backend server listening port |
| `NODE_ENV` | Optional (`development` / `production`) | Node execution environment |
| `GEMINI_API_KEY` | Optional | Google Gemini API key for external LLM chat reasoning |
| `OPENAI_API_KEY` | Optional | OpenAI API key for external LLM reasoning |

> **Security Note:** In strict accordance with submission rules, no API secrets or production credentials are committed to this repository.

---

## 4. Production Deployment Instructions

### Option A: Unified Container / Docker Deployment
1. Build the production client bundle:
   ```bash
   npm run build
   ```
2. Serve static assets via Express in `server/src/index.js` or via NGINX reverse proxy.
3. Deploy to AWS ECS, Render, Railway, or Google Cloud Run using standard Node.js runtime.

### Option B: Cloud PaaS (e.g. Render / Railway / Vercel)
1. **Server (Web Service)**:
   - Root directory: `server`
   - Build command: `npm install && npm run seed`
   - Start command: `npm start`
   - Port: `5000`
2. **Client (Static Site / SPA)**:
   - Root directory: `client`
   - Build command: `npm install && npm run build`
   - Publish directory: `dist`
   - Proxy: Route `/api/*` to the deployed server URL.

---

## 5. Seeded Reviewer Test Cases

Reviewers can directly test all brief requirements:

1. **Duplicate Lead Detection & One-Click Merge**:
   - Go to **Unified Leads & Duplicate Check** in the top navigation.
   - Observe `LD-58230` flagged as a duplicate of `LD-58210` (Hardik Patel) matched on phone number `+91 98250 11001`.
   - Click **Merge Lead** to consolidate notes and chat history.
2. **AI Multilingual Concierge (EN, HI, GU)**:
   - Switch to **Buyer** view, open the AI Concierge drawer.
   - Switch language between **English**, **हिंदी**, and **ગુજરાતી**.
   - Ask: *"What is the starting price?"* or *"Can I get a ₹10 Lakh discount?"*. Observe strict adherence to base pricing and refusal to negotiate discounts.
3. **Missing Fact Hand-Off**:
   - Ask an off-sheet question: *"Can I break the shear wall to merge flat 101 and 102?"*
   - Observe AI response: states that this fact is not in the approved fact sheet, notifies Senior Sales Executive Rajesh Mehta, and flags the chat for Sales Head review.
4. **Site Visit Booking Concurrency**:
   - Open **Schedule Site Walkthrough**. Notice real-time slot remaining counters (`1 left`, `FULL`, etc.).
   - Book a slot to observe instant confirmation, location pin preview, Google Calendar export (.ics), and simulated WhatsApp reminders (1 day and 2 hours prior).
5. **Cost Per Visit by Source Dashboard**:
   - Switch to **Sales Head** role.
   - Review the **Source ROI & Cost Per Visit** table breaking down Property Portals, Meta Ads, Website, and Hoarding phone calls against the ₹30 Lakh monthly ad budget.
