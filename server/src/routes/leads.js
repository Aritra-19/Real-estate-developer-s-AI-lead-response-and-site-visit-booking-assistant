import express from 'express';

export function createLeadsRouter(db) {
  const router = express.Router();

  // 1. List leads with filtering, search, and duplicate identification
  router.get('/', (req, res) => {
    try {
      const { source, project_id, status, search, duplicates_only } = req.query;

      let query = `
        SELECT l.*, p.name AS project_name, u.name AS assigned_to_name,
               (SELECT COUNT(*) FROM messages m JOIN conversations c ON m.conversation_id = c.id WHERE c.lead_id = l.id) AS message_count
        FROM leads l
        LEFT JOIN projects p ON l.project_id = p.id
        LEFT JOIN users u ON l.assigned_to_id = u.id
        WHERE 1=1
      `;
      const params = [];

      if (source) {
        query += ' AND l.source = ?';
        params.push(source);
      }
      if (project_id) {
        query += ' AND l.project_id = ?';
        params.push(project_id);
      }
      if (status) {
        query += ' AND l.visit_status = ?';
        params.push(status);
      }
      if (duplicates_only === 'true') {
        query += ' AND l.is_duplicate = 1';
      }
      if (search) {
        query += ' AND (l.name LIKE ? OR l.phone LIKE ? OR l.email LIKE ? OR l.id LIKE ?)';
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm, searchTerm, searchTerm);
      }

      query += ' ORDER BY l.created_at DESC';

      const leads = db.prepare(query).all(...params);
      res.json({ success: true, count: leads.length, data: leads });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 2. Check for duplicate lead by phone or email
  router.post('/check-duplicate', (req, res) => {
    try {
      const { phone, email } = req.body;
      if (!phone && !email) {
        return res.status(400).json({ success: false, error: 'Phone or email required' });
      }

      const cleanPhone = phone ? phone.replace(/[^\d+]/g, '') : null;
      let existingLead = null;

      if (cleanPhone) {
        existingLead = db.prepare(`
          SELECT l.*, p.name AS project_name, u.name AS assigned_to_name
          FROM leads l
          LEFT JOIN projects p ON l.project_id = p.id
          LEFT JOIN users u ON l.assigned_to_id = u.id
          WHERE l.phone = ? AND l.is_duplicate = 0
          ORDER BY l.created_at ASC
          LIMIT 1
        `).get(cleanPhone);
      }

      if (!existingLead && email) {
        existingLead = db.prepare(`
          SELECT l.*, p.name AS project_name, u.name AS assigned_to_name
          FROM leads l
          LEFT JOIN projects p ON l.project_id = p.id
          LEFT JOIN users u ON l.assigned_to_id = u.id
          WHERE l.email = ? AND l.is_duplicate = 0
          ORDER BY l.created_at ASC
          LIMIT 1
        `).get(email.trim().toLowerCase());
      }

      res.json({
        success: true,
        is_duplicate: !!existingLead,
        matched_lead: existingLead || null
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 3. Create a new lead (with automatic duplicate detection & source tagging)
  router.post('/', (req, res) => {
    try {
      const { name, phone, email, source, project_id, wants, budget_range, dpdp_consent } = req.body;

      if (!name || !phone || !source || !project_id) {
        return res.status(400).json({ success: false, error: 'Name, phone, source, and project_id are required' });
      }

      const cleanPhone = phone.replace(/[^\d+]/g, '');

      // Check duplicate
      const originalLead = db.prepare(`
        SELECT id FROM leads
        WHERE (phone = ? OR (email IS NOT NULL AND email = ?)) AND is_duplicate = 0
        ORDER BY created_at ASC
        LIMIT 1
      `).get(cleanPhone, email ? email.toLowerCase() : null);

      const isDuplicate = !!originalLead;
      const duplicateOfId = originalLead ? originalLead.id : null;

      // Assign sales executive
      const defaultExec = db.prepare(`
        SELECT id FROM users WHERE role = 'sales_executive' ORDER BY active_leads_count ASC LIMIT 1
      `).get();

      const newId = 'LD-' + Math.floor(10000 + Math.random() * 90000);
      const firstResponseSeconds = Math.floor(25 + Math.random() * 60); // AI responds within 25-85 seconds

      db.prepare(`
        INSERT INTO leads (
          id, name, phone, email, source, project_id, wants, budget_range,
          visit_status, assigned_to_id, first_response_time_seconds,
          is_duplicate, duplicate_of_id, dpdp_consent, notes
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?,
          'Not booked', ?, ?,
          ?, ?, ?, ?
        )
      `).run(
        newId,
        name,
        cleanPhone,
        email ? email.toLowerCase() : null,
        source,
        project_id,
        wants || 'Not specified',
        budget_range || 'Not specified',
        defaultExec?.id || 'usr-exec-1',
        firstResponseSeconds,
        isDuplicate ? 1 : 0,
        duplicateOfId,
        dpdp_consent ? 1 : 0,
        isDuplicate ? `Duplicate enquiry from ${source}. Original lead is ${duplicateOfId}.` : `New inbound enquiry via ${source}.`
      );

      const createdLead = db.prepare('SELECT * FROM leads WHERE id = ?').get(newId);
      res.status(201).json({
        success: true,
        lead: createdLead,
        is_duplicate: isDuplicate,
        duplicate_of: duplicateOfId
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 4. Merge duplicate lead into primary lead
  router.post('/merge', (req, res) => {
    try {
      const { primary_id, duplicate_id } = req.body;
      if (!primary_id || !duplicate_id) {
        return res.status(400).json({ success: false, error: 'Both primary_id and duplicate_id are required' });
      }

      const primary = db.prepare('SELECT * FROM leads WHERE id = ?').get(primary_id);
      const duplicate = db.prepare('SELECT * FROM leads WHERE id = ?').get(duplicate_id);

      if (!primary || !duplicate) {
        return res.status(404).json({ success: false, error: 'One or both leads not found' });
      }

      // Transactionally re-link conversations and site visits from duplicate to primary
      const mergeTx = db.transaction(() => {
        // Re-link conversations
        db.prepare('UPDATE conversations SET lead_id = ? WHERE lead_id = ?').run(primary_id, duplicate_id);

        // Re-link site visits
        db.prepare('UPDATE site_visits SET lead_id = ? WHERE lead_id = ?').run(primary_id, duplicate_id);

        // Append notes to primary
        const updatedNotes = `${primary.notes || ''}\n[Merged on ${new Date().toISOString()}] Merged enquiry from duplicate ${duplicate_id} (${duplicate.source}). Original notes: ${duplicate.notes || 'None'}`;

        db.prepare(`
          UPDATE leads
          SET notes = ?,
              updated_at = datetime('now')
          WHERE id = ?
        `).run(updatedNotes, primary_id);

        // Mark duplicate record as merged
        db.prepare(`
          UPDATE leads
          SET is_duplicate = 1,
              duplicate_of_id = ?,
              notes = '[Merged into ' || ? || ']'
          WHERE id = ?
        `).run(primary_id, primary_id, duplicate_id);
      });

      mergeTx();

      res.json({
        success: true,
        message: `Successfully merged lead ${duplicate_id} into primary lead ${primary_id}`
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 5. Update lead details (status, assigned executive, notes)
  router.patch('/:id', (req, res) => {
    try {
      const { id } = req.params;
      const { visit_status, assigned_to_id, notes, wants, budget_range } = req.body;

      const updates = [];
      const params = [];

      if (visit_status) {
        updates.push('visit_status = ?');
        params.push(visit_status);
      }
      if (assigned_to_id) {
        updates.push('assigned_to_id = ?');
        params.push(assigned_to_id);
      }
      if (notes !== undefined) {
        updates.push('notes = ?');
        params.push(notes);
      }
      if (wants) {
        updates.push('wants = ?');
        params.push(wants);
      }
      if (budget_range) {
        updates.push('budget_range = ?');
        params.push(budget_range);
      }

      if (updates.length === 0) {
        return res.status(400).json({ success: false, error: 'No fields provided for update' });
      }

      updates.push("updated_at = datetime('now')");
      params.push(id);

      db.prepare(`UPDATE leads SET ${updates.join(', ')} WHERE id = ?`).run(...params);
      const updated = db.prepare('SELECT * FROM leads WHERE id = ?').get(id);

      res.json({ success: true, lead: updated });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  return router;
}

export default createLeadsRouter;
