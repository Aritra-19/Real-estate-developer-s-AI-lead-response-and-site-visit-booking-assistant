import test from 'node:test';
import assert from 'node:assert/strict';
import { initDatabase } from '../src/db/schema.js';
import { RealEstateAIAgent } from '../src/ai/agent.js';

test('Atomic Slot Booking prevents double booking under concurrent requests', async (t) => {
  const db = initDatabase();
  const agent = new RealEstateAIAgent(db);

  // Create a dedicated test slot with capacity 1 and a unique date/time
  const testSlotId = 'test-slot-concurrency-' + Date.now();
  const testTime = '09:' + String(Math.floor(10 + Math.random() * 49));
  const testDate = '2099-01-01';

  db.prepare(`
    INSERT INTO slots (id, project_id, slot_date, slot_time, capacity, booked_count, status)
    VALUES (?, 'proj-1', ?, ?, 1, 0, 'active')
  `).run(testSlotId, testDate, testTime);

  // Create two distinct test leads
  const lead1Id = 'LD-TEST-1-' + Date.now();
  const lead2Id = 'LD-TEST-2-' + Date.now();

  db.prepare(`
    INSERT INTO leads (id, name, phone, source, project_id, wants, visit_status, dpdp_consent)
    VALUES (?, 'Tester One', '+91 99999 11111', 'Website', 'proj-1', '3 BHK', 'Not booked', 1)
  `).run(lead1Id);

  db.prepare(`
    INSERT INTO leads (id, name, phone, source, project_id, wants, visit_status, dpdp_consent)
    VALUES (?, 'Tester Two', '+91 99999 22222', 'Property portal', 'proj-1', '3 BHK', 'Not booked', 1)
  `).run(lead2Id);

  // Attempt simultaneous booking
  let successCount = 0;
  let failureCount = 0;
  const errors = [];

  const attemptBooking = (leadId) => {
    try {
      agent.bookSlotAtomically({
        leadId,
        slotId: testSlotId,
        projectId: 'proj-1'
      });
      successCount++;
    } catch (err) {
      failureCount++;
      errors.push(err.message);
    }
  };

  // Simulate concurrent bookings
  attemptBooking(lead1Id);
  attemptBooking(lead2Id);

  assert.equal(successCount, 1, 'Exactly one booking must succeed');
  assert.equal(failureCount, 1, 'The competing booking must fail');
  assert.equal(errors[0], 'SLOT_CAPACITY_EXCEEDED', 'Failure reason must be capacity exceeded');

  // Verify final slot booked_count
  const finalSlot = db.prepare('SELECT booked_count, capacity FROM slots WHERE id = ?').get(testSlotId);
  assert.equal(finalSlot.booked_count, 1, 'Booked count must not exceed capacity of 1');
});
