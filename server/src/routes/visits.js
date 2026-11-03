import express from 'express';

export function createVisitsRouter(db) {
  const router = express.Router();

  // 1. List site visits with lead and project details
  router.get('/', (req, res) => {
    try {
      const { status, project_id, executive_id } = req.query;

      let query = `
        SELECT v.*, l.name AS lead_name, l.phone AS lead_phone, l.email AS lead_email,
               l.source AS lead_source, l.wants AS lead_wants, l.budget_range AS lead_budget,
               p.name AS project_name, p.location AS project_location, p.coordinates AS project_coordinates,
               p.rera_number AS project_rera, u.name AS executive_name, u.phone AS executive_phone,
               s.slot_date, s.slot_time
        FROM site_visits v
        JOIN leads l ON v.lead_id = l.id
        JOIN projects p ON v.project_id = p.id
        LEFT JOIN users u ON v.executive_id = u.id
        LEFT JOIN slots s ON v.slot_id = s.id
        WHERE 1=1
      `;
      const params = [];

      if (status) {
        query += ' AND v.status = ?';
        params.push(status);
      }
      if (project_id) {
        query += ' AND v.project_id = ?';
        params.push(project_id);
      }
      if (executive_id) {
        query += ' AND v.executive_id = ?';
        params.push(executive_id);
      }

      query += ' ORDER BY v.visit_datetime DESC';

      const visits = db.prepare(query).all(...params);
      res.json({ success: true, count: visits.length, data: visits });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 2. Update visit status (e.g. Visited, No-show, Rescheduled)
  router.patch('/:id/status', (req, res) => {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;

      if (!status) {
        return res.status(400).json({ success: false, error: 'status is required' });
      }

      const visit = db.prepare('SELECT * FROM site_visits WHERE id = ?').get(id);
      if (!visit) {
        return res.status(404).json({ success: false, error: 'Site visit not found' });
      }

      const updateVisitTx = db.transaction(() => {
        db.prepare(`
          UPDATE site_visits
          SET status = ?,
              notes = COALESCE(?, notes),
              updated_at = datetime('now')
          WHERE id = ?
        `).run(status, notes || null, id);

        // Also update lead's visit status
        db.prepare(`
          UPDATE leads
          SET visit_status = ?,
              updated_at = datetime('now')
          WHERE id = ?
        `).run(status, visit.lead_id);
      });

      updateVisitTx();

      const updated = db.prepare('SELECT * FROM site_visits WHERE id = ?').get(id);
      res.json({ success: true, visit: updated });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 3. Trigger / simulate reminder notification (1 day or 2 hours before)
  router.post('/:id/reminder', (req, res) => {
    try {
      const { id } = req.params;
      const { type } = req.body; // 'reminder_24h' or 'reminder_2h'

      const visit = db.prepare(`
        SELECT v.*, l.name AS lead_name, l.phone AS lead_phone, p.name AS project_name,
               p.coordinates AS project_coordinates, p.rera_number AS project_rera,
               u.name AS executive_name
        FROM site_visits v
        JOIN leads l ON v.lead_id = l.id
        JOIN projects p ON v.project_id = p.id
        LEFT JOIN users u ON v.executive_id = u.id
        WHERE v.id = ?
      `).get(id);

      if (!visit) {
        return res.status(404).json({ success: false, error: 'Site visit not found' });
      }

      let content = '';
      if (type === 'reminder_2h') {
        content = `⏰ Reminder: Your VIP site visit to ${visit.project_name} is in 2 hours (${visit.visit_datetime.replace('T', ' ')}). Location pin: https://maps.google.com/?q=${visit.project_coordinates}. Host: ${visit.executive_name}. RERA: ${visit.project_rera}. Need directions? Reply HELP. (DPDP Opt-out: Reply STOP)`;
        db.prepare('UPDATE site_visits SET reminder_2h_sent = 1 WHERE id = ?').run(id);
      } else {
        content = `📅 Friendly Reminder: Your site walkthrough for ${visit.project_name} is scheduled for tomorrow at ${visit.visit_datetime.split('T')[1]}. Dedicated parking is reserved for you. Host: ${visit.executive_name}. RERA: ${visit.project_rera}. (DPDP Opt-out: Reply STOP)`;
        db.prepare('UPDATE site_visits SET reminder_24h_sent = 1 WHERE id = ?').run(id);
      }

      const notifId = 'notif-' + Date.now();
      db.prepare(`
        INSERT INTO notifications (id, lead_id, site_visit_id, type, channel, recipient, content, status)
        VALUES (?, ?, ?, ?, 'whatsapp', ?, ?, 'sent')
      `).run(notifId, visit.lead_id, id, type || 'reminder_24h', visit.lead_phone, content);

      const notification = db.prepare('SELECT * FROM notifications WHERE id = ?').get(notifId);
      res.json({ success: true, notification });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 4. Get notification log for a visit or lead
  router.get('/:id/notifications', (req, res) => {
    try {
      const { id } = req.params;
      const notifs = db.prepare('SELECT * FROM notifications WHERE site_visit_id = ? ORDER BY sent_at DESC').all(id);
      res.json({ success: true, data: notifs });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  return router;
}

export default createVisitsRouter;
