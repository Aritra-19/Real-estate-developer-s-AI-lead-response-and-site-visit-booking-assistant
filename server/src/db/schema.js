import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, '../../data/company_a.db');

export function initDatabase() {
  const db = new Database(dbPath);
  // Enable WAL mode for high concurrency
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    -- Projects table
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      tagline TEXT,
      location TEXT NOT NULL,
      coordinates TEXT NOT NULL,
      rera_number TEXT NOT NULL,
      rera_validity TEXT,
      price_range TEXT NOT NULL,
      units_total INTEGER NOT NULL,
      configurations TEXT NOT NULL, -- JSON array
      carpet_area TEXT NOT NULL,
      possession_date TEXT NOT NULL,
      overview TEXT NOT NULL,
      hero_image TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Fact Sheets (Strict ground truth for AI)
    CREATE TABLE IF NOT EXISTS fact_sheets (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL UNIQUE,
      pricing_policy TEXT NOT NULL,
      approved_amenities TEXT NOT NULL, -- JSON array
      specifications TEXT NOT NULL, -- JSON object
      payment_plans TEXT NOT NULL, -- JSON array
      prohibited_claims TEXT NOT NULL,
      frequently_asked TEXT NOT NULL, -- JSON array
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );

    -- Users / Staff table
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      role TEXT NOT NULL CHECK(role IN ('admin', 'sales_head', 'sales_executive', 'telecaller')),
      phone TEXT,
      avatar TEXT,
      active_leads_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Leads table
    CREATE TABLE IF NOT EXISTS leads (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT,
      source TEXT NOT NULL CHECK(source IN ('Property portal', 'Social media ad', 'Website', 'Hoarding call')),
      project_id TEXT NOT NULL,
      wants TEXT NOT NULL, -- '2 BHK', '3 BHK', etc.
      budget_range TEXT,
      visit_status TEXT NOT NULL DEFAULT 'Not booked' CHECK(visit_status IN ('Not booked', 'Booked', 'Visited', 'No-show', 'Rescheduled', 'Cancelled')),
      assigned_to_id TEXT,
      first_response_time_seconds INTEGER DEFAULT 60,
      is_duplicate INTEGER DEFAULT 0,
      duplicate_of_id TEXT,
      dpdp_consent INTEGER DEFAULT 1,
      dpdp_consent_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id),
      FOREIGN KEY (assigned_to_id) REFERENCES users(id)
    );

    -- Visit Slots table
    CREATE TABLE IF NOT EXISTS slots (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      slot_date TEXT NOT NULL, -- YYYY-MM-DD
      slot_time TEXT NOT NULL, -- HH:MM (e.g., 10:00, 11:30, 14:00, 16:00, 17:30)
      capacity INTEGER NOT NULL DEFAULT 2,
      booked_count INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'disabled')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id),
      UNIQUE(project_id, slot_date, slot_time)
    );

    -- Site Visit Bookings table
    CREATE TABLE IF NOT EXISTS site_visits (
      id TEXT PRIMARY KEY,
      lead_id TEXT NOT NULL,
      slot_id TEXT NOT NULL,
      project_id TEXT NOT NULL,
      executive_id TEXT NOT NULL,
      visit_datetime TEXT NOT NULL, -- ISO timestamp
      status TEXT NOT NULL DEFAULT 'Confirmed' CHECK(status IN ('Confirmed', 'Visited', 'No-show', 'Rescheduled', 'Cancelled')),
      reminder_24h_sent INTEGER DEFAULT 0,
      reminder_2h_sent INTEGER DEFAULT 0,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
      FOREIGN KEY (slot_id) REFERENCES slots(id),
      FOREIGN KEY (project_id) REFERENCES projects(id),
      FOREIGN KEY (executive_id) REFERENCES users(id)
    );

    -- Chat Conversations
    CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY,
      lead_id TEXT,
      project_id TEXT NOT NULL,
      language TEXT NOT NULL DEFAULT 'en' CHECK(language IN ('en', 'hi', 'gu')),
      handoff_requested INTEGER DEFAULT 0,
      handoff_reason TEXT,
      ai_summary TEXT,
      flagged_for_review INTEGER DEFAULT 0,
      last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE SET NULL,
      FOREIGN KEY (project_id) REFERENCES projects(id)
    );

    -- Chat Messages
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL,
      sender TEXT NOT NULL CHECK(sender IN ('buyer', 'assistant', 'system', 'executive')),
      text TEXT NOT NULL,
      language TEXT NOT NULL DEFAULT 'en',
      tool_called TEXT,
      tool_result TEXT, -- JSON
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
    );

    -- Notification / Reminders simulation queue
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      lead_id TEXT NOT NULL,
      site_visit_id TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('booking_confirmation', 'reminder_24h', 'reminder_2h', 'executive_handoff', 'whatsapp_optin')),
      channel TEXT NOT NULL CHECK(channel IN ('whatsapp', 'sms', 'email')),
      recipient TEXT NOT NULL,
      content TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'sent' CHECK(status IN ('queued', 'sent', 'failed')),
      sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (lead_id) REFERENCES leads(id),
      FOREIGN KEY (site_visit_id) REFERENCES site_visits(id)
    );

    -- Indexes for fast queries
    CREATE INDEX IF NOT EXISTS idx_leads_phone ON leads(phone);
    CREATE INDEX IF NOT EXISTS idx_leads_source ON leads(source);
    CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(visit_status);
    CREATE INDEX IF NOT EXISTS idx_slots_lookup ON slots(project_id, slot_date, status);
    CREATE INDEX IF NOT EXISTS idx_messages_conv ON messages(conversation_id);
    CREATE INDEX IF NOT EXISTS idx_visits_lead ON site_visits(lead_id);
  `);

  return db;
}

export default initDatabase;
