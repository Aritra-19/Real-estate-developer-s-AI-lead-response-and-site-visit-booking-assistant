import express from 'express';
import { RealEstateAIAgent } from '../ai/agent.js';

export function createSlotsRouter(db) {
  const router = express.Router();
  const agent = new RealEstateAIAgent(db);

  // 1. Get available visit slots
  router.get('/', (req, res) => {
    try {
      const { project_id, date, status } = req.query;
      let query = 'SELECT * FROM slots WHERE 1=1';
      const params = [];

      if (project_id) {
        query += ' AND project_id = ?';
        params.push(project_id);
      }
      if (date) {
        query += ' AND slot_date = ?';
        params.push(date);
      }
      if (status) {
        query += ' AND status = ?';
        params.push(status);
      }

      query += ' ORDER BY slot_date ASC, slot_time ASC';

      const slots = db.prepare(query).all(...params);

      // Enhance with remaining seats
      const enriched = slots.map(s => ({
        ...s,
        remaining: Math.max(0, s.capacity - s.booked_count),
        is_full: s.booked_count >= s.capacity
      }));

      res.json({ success: true, count: enriched.length, data: enriched });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 2. Atomic Slot Booking with SQLite transaction to prevent double booking
  router.post('/book', (req, res) => {
    try {
      const { lead_id, slot_id, project_id } = req.body;
      if (!lead_id || !slot_id || !project_id) {
        return res.status(400).json({
          success: false,
          error: 'lead_id, slot_id, and project_id are required'
        });
      }

      const booking = agent.bookSlotAtomically({ leadId: lead_id, slotId: slot_id, projectId: project_id });

      res.status(201).json({
        success: true,
        message: 'Site visit booked successfully',
        booking
      });
    } catch (err) {
      if (err.message === 'SLOT_CAPACITY_EXCEEDED') {
        return res.status(409).json({
          success: false,
          code: 'SLOT_FULL',
          error: 'This slot has just reached full capacity. Please select an alternate free slot.'
        });
      }
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 3. Admin: Add a new slot
  router.post('/', (req, res) => {
    try {
      const { project_id, slot_date, slot_time, capacity } = req.body;
      if (!project_id || !slot_date || !slot_time) {
        return res.status(400).json({ success: false, error: 'project_id, slot_date, and slot_time are required' });
      }

      const slotId = `slot-${project_id}-${slot_date}-${slot_time.replace(':', '')}`;
      db.prepare(`
        INSERT INTO slots (id, project_id, slot_date, slot_time, capacity, booked_count, status)
        VALUES (?, ?, ?, ?, ?, 0, 'active')
      `).run(slotId, project_id, slot_date, slot_time, capacity || 2);

      const created = db.prepare('SELECT * FROM slots WHERE id = ?').get(slotId);
      res.status(201).json({ success: true, slot: created });
    } catch (err) {
      if (err.message.includes('UNIQUE constraint failed')) {
        return res.status(409).json({ success: false, error: 'A slot for this project, date, and time already exists.' });
      }
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 4. Admin: Update slot capacity or toggle status
  router.patch('/:id', (req, res) => {
    try {
      const { id } = req.params;
      const { capacity, status } = req.body;

      const updates = [];
      const params = [];

      if (capacity !== undefined) {
        updates.push('capacity = ?');
        params.push(capacity);
      }
      if (status) {
        updates.push('status = ?');
        params.push(status);
      }

      if (updates.length === 0) {
        return res.status(400).json({ success: false, error: 'No fields provided for update' });
      }

      params.push(id);
      db.prepare(`UPDATE slots SET ${updates.join(', ')} WHERE id = ?`).run(...params);

      const updated = db.prepare('SELECT * FROM slots WHERE id = ?').get(id);
      res.json({ success: true, slot: updated });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  return router;
}

export default createSlotsRouter;
