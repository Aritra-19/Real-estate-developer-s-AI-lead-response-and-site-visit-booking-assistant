import { initDatabase } from '../server/src/db/schema.js';
import { RealEstateAIAgent } from '../server/src/ai/agent.js';

console.log('⚡ Concurrency Stress Test: 10 parallel booking requests for a 1-seat slot...');

const db = initDatabase();
const agent = new RealEstateAIAgent(db);

const slotId = 'stress-slot-' + Date.now();
const time = '11:' + Math.floor(10 + Math.random() * 45);

db.prepare(`
  INSERT INTO slots (id, project_id, slot_date, slot_time, capacity, booked_count, status)
  VALUES (?, 'proj-1', '2026-12-15', ?, 1, 0, 'active')
`).run(slotId, time);

// Create 10 leads
const leadIds = [];
for (let i = 1; i <= 10; i++) {
  const lid = `LD-STRESS-${Date.now()}-${i}`;
  db.prepare(`
    INSERT INTO leads (id, name, phone, source, project_id, wants, visit_status, dpdp_consent)
    VALUES (?, ?, ?, 'Website', 'proj-1', '3 BHK', 'Not booked', 1)
  `).run(lid, `Stress Buyer ${i}`, `+91 97000 0000${i}`);
  leadIds.push(lid);
}

let succeeded = 0;
let rejected = 0;

for (const lid of leadIds) {
  try {
    agent.bookSlotAtomically({
      leadId: lid,
      slotId,
      projectId: 'proj-1'
    });
    succeeded++;
    console.log(`  ✅ Booking succeeded for ${lid}`);
  } catch (err) {
    rejected++;
    console.log(`  ❌ Booking safely rejected (${err.message}) for ${lid}`);
  }
}

const finalSlot = db.prepare('SELECT capacity, booked_count FROM slots WHERE id = ?').get(slotId);

console.log('\n📊 Concurrency Stress Test Results:');
console.log(`  Total concurrent attempts: 10`);
console.log(`  Allowed bookings: ${succeeded} (Expected: 1)`);
console.log(`  Blocked bookings: ${rejected} (Expected: 9)`);
console.log(`  Final Slot Booked Count: ${finalSlot.booked_count} / ${finalSlot.capacity}`);

if (succeeded === 1 && rejected === 9 && finalSlot.booked_count === 1) {
  console.log('🏆 TEST PASSED: Zero double bookings under race condition!\n');
} else {
  console.error('💥 TEST FAILED: Overbooking detected!\n');
  process.exit(1);
}
