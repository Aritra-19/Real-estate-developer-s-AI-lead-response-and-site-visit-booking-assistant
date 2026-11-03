import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDatabase } from './db/schema.js';
import { createLeadsRouter } from './routes/leads.js';
import { createChatRouter } from './routes/chat.js';
import { createSlotsRouter } from './routes/slots.js';
import { createVisitsRouter } from './routes/visits.js';
import { createAnalyticsRouter } from './routes/analytics.js';
import { createFactSheetRouter } from './routes/factsheet.js';
import { createAuthRouter } from './routes/auth.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Database
const db = initDatabase();

// Middlewares
app.use(cors());
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (req.originalUrl.startsWith('/api')) {
      console.log(`[${req.method}] ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

// Projects API
app.get('/api/projects', (req, res) => {
  try {
    const projects = db.prepare('SELECT * FROM projects ORDER BY name ASC').all();
    const enriched = projects.map(p => ({
      ...p,
      configurations: JSON.parse(p.configurations || '[]')
    }));
    res.json({ success: true, count: enriched.length, data: enriched });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/projects/:id', (req, res) => {
  try {
    const project = db.prepare('SELECT * FROM projects WHERE id = ? OR slug = ?').get(req.params.id, req.params.id);
    if (!project) return res.status(404).json({ success: false, error: 'Project not found' });
    project.configurations = JSON.parse(project.configurations || '[]');
    res.json({ success: true, project });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Register routers
app.use('/api/leads', createLeadsRouter(db));
app.use('/api/chat', createChatRouter(db));
app.use('/api/slots', createSlotsRouter(db));
app.use('/api/visits', createVisitsRouter(db));
app.use('/api/analytics', createAnalyticsRouter(db));
app.use('/api/factsheet', createFactSheetRouter(db));
app.use('/api/auth', createAuthRouter(db));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    client: 'Company A, Ahmedabad',
    timestamp: new Date().toISOString(),
    uptime_seconds: Math.floor(process.uptime())
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
});

app.listen(PORT, () => {
  console.log(`✨ Company A Real Estate AI Backend listening on http://localhost:${PORT}`);
});

export { app, db };
