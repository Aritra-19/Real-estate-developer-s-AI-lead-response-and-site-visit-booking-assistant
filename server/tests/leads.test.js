import test from 'node:test';
import assert from 'node:assert/strict';
import { initDatabase } from '../src/db/schema.js';

test('Lead duplicate detection identifies existing phone numbers', (t) => {
  const db = initDatabase();

  const rawPhone = '+91 98980 ' + Math.floor(10000 + Math.random() * 90000);
  const cleanPhone = rawPhone.replace(/[^\d+]/g, '');
  const originalLeadId = 'LD-ORIG-' + Date.now();

  // Insert original lead with normalized phone
  db.prepare(`
    INSERT INTO leads (id, name, phone, source, project_id, wants, is_duplicate, dpdp_consent)
    VALUES (?, 'Original Buyer', ?, 'Property portal', 'proj-1', '3 BHK', 0, 1)
  `).run(originalLeadId, cleanPhone);

  // Check duplicate via query
  const match = db.prepare(`
    SELECT * FROM leads WHERE phone = ? AND is_duplicate = 0 ORDER BY created_at ASC LIMIT 1
  `).get(cleanPhone);

  assert.ok(match, 'Must find matching original lead');
  assert.equal(match.id, originalLeadId);

  // Insert second lead with same phone
  const duplicateLeadId = 'LD-DUP-' + Date.now();
  db.prepare(`
    INSERT INTO leads (id, name, phone, source, project_id, wants, is_duplicate, duplicate_of_id, dpdp_consent)
    VALUES (?, 'Original Buyer (Meta)', ?, 'Social media ad', 'proj-1', '3 BHK', 1, ?, 1)
  `).run(duplicateLeadId, cleanPhone, originalLeadId);

  const duplicate = db.prepare('SELECT * FROM leads WHERE id = ?').get(duplicateLeadId);
  assert.equal(duplicate.is_duplicate, 1);
  assert.equal(duplicate.duplicate_of_id, originalLeadId);
});
