import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDatabase } from './schema.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.resolve(__dirname, '../../data');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = initDatabase();

export function seed() {
  console.log('🌱 Seeding database for Company A, Ahmedabad...');

  // Clear existing data
  db.exec(`
    DELETE FROM notifications;
    DELETE FROM messages;
    DELETE FROM conversations;
    DELETE FROM site_visits;
    DELETE FROM slots;
    DELETE FROM leads;
    DELETE FROM fact_sheets;
    DELETE FROM users;
    DELETE FROM projects;
  `);

  // 1. Projects
  const insertProject = db.prepare(`
    INSERT INTO projects (
      id, name, slug, tagline, location, coordinates, rera_number, rera_validity,
      price_range, units_total, configurations, carpet_area, possession_date, overview, hero_image
    ) VALUES (
      @id, @name, @slug, @tagline, @location, @coordinates, @rera_number, @rera_validity,
      @price_range, @units_total, @configurations, @carpet_area, @possession_date, @overview, @hero_image
    )
  `);

  const projects = [
    {
      id: 'proj-1',
      name: 'Aarav Sky Greens',
      slug: 'aarav-sky-greens',
      tagline: 'Ultra-Luxury 3 BHK Residences on SG Highway',
      location: 'SG Highway, Nr. Vaishnodevi Circle, Ahmedabad, Gujarat 382421',
      coordinates: '23.1365, 72.5358',
      rera_number: 'PR/GJ/AHMEDABAD/AHMEDABAD-CITY/AUDA/RAA10245/300424',
      rera_validity: 'Valid up to 31/12/2026',
      price_range: '₹95 Lakh – ₹1.20 Crore',
      units_total: 210,
      configurations: JSON.stringify(['3 BHK Luxury', '3 BHK Grande']),
      carpet_area: '1,650 – 2,100 sq.ft.',
      possession_date: 'December 2026',
      overview: 'Aarav Sky Greens is Company A’s flagship residential landmark on SG Highway. Featuring twin 22-storey towers with only 4 apartments per floor, expansive private decks, 30,000 sq.ft. clubhouse, temperature-controlled indoor pool, and zero-vehicular movement garden level.',
      hero_image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80'
    },
    {
      id: 'proj-2',
      name: 'Vantara Heights',
      slug: 'vantara-heights',
      tagline: 'Modern 2 & 3 BHK Living in Fast-Growing Shela',
      location: 'Club O7 Road, Shela, Ahmedabad, Gujarat 380058',
      coordinates: '22.9974, 72.4632',
      rera_number: 'PR/GJ/AHMEDABAD/SANAND/AUDA/RAA09872/150125',
      rera_validity: 'Valid up to 30/06/2026',
      price_range: '₹65 Lakh – ₹88 Lakh',
      units_total: 210,
      configurations: JSON.stringify(['2 BHK Smart', '3 BHK Comfort']),
      carpet_area: '1,120 – 1,580 sq.ft.',
      possession_date: 'June 2026',
      overview: 'Vantara Heights offers thoughtfully designed, Vastu-compliant 2 and 3 BHK homes in Ahmedabad’s most vibrant residential corridor. Equipped with smart home automation readiness, rooftop sky lounge, EV charging bays, and proximity to top international schools and retail hubs.',
      hero_image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80'
    }
  ];

  for (const p of projects) {
    insertProject.run(p);
  }

  // 2. Fact Sheets (Knowledge Ground Truth)
  const insertFactSheet = db.prepare(`
    INSERT INTO fact_sheets (
      id, project_id, pricing_policy, approved_amenities, specifications, payment_plans, prohibited_claims, frequently_asked
    ) VALUES (
      @id, @project_id, @pricing_policy, @approved_amenities, @specifications, @payment_plans, @prohibited_claims, @frequently_asked
    )
  `);

  const factSheets = [
    {
      id: 'fs-proj-1',
      project_id: 'proj-1',
      pricing_policy: '3 BHK base price starts at ₹95 Lakh (all-inclusive except statutory government stamp duty & registration). Unit prices scale up to ₹1.20 Crore depending on floor rise and view. Strict policy: Never quote ad-hoc discounts or unapproved reductions on chat. In-person negotiations must be directed to Rajesh Mehta during the site visit.',
      approved_amenities: JSON.stringify([
        '30,000 sq.ft. Luxury Clubhouse & Spa',
        'Temperature-controlled Indoor Lap Pool & Kids Splash Pool',
        'Two Synthetic Surface Badminton Courts & Squash Court',
        'EV Charging Bay allocated per parking slot',
        'Triple-height Italian Marble Air-conditioned Entrance Foyer',
        'Rooftop Stargazing Observatory Deck & Barbecue Zone',
        'High-speed 15-passenger Mitsubishi Elevators with ARD'
      ]),
      specifications: JSON.stringify({
        structure: 'Earthquake resistant RCC framed structure (Zone 3 compliance)',
        flooring: '1200x1800mm Italian look glazed vitrified tiles in Living & Dining; wooden finished master bedroom',
        plumbing_sanitary: 'Grohe / Kohler concealed diverters and sanitaryware',
        electrical: 'Schneider / Legrand modular switches, 3-phase power with smart meter',
        windows: 'Double glazed sound-insulating DGU aluminum sliding windows'
      }),
      payment_plans: JSON.stringify([
        'Construction Linked Plan (CLP): 10% on Booking, 10% on Agreement, balance across 10 milestone slabs',
        'Special 20:80 Bank Subvention with SBI / HDFC Bank approvals'
      ]),
      prohibited_claims: 'Never guarantee investment rental yields. Never make promises outside AUDA approved plans. Never claim early handover before December 2026 without written head office circular.',
      frequently_asked: JSON.stringify([
        { q: 'Is loan available?', a: 'Yes, pre-approved by SBI, HDFC, ICICI, and Axis Bank with instant sanction support.' },
        { q: 'What is the maintenance deposit?', a: '₹3.50 per sq.ft. per month for 2 years, collected at time of possession.' },
        { q: 'How many car parkings?', a: '2 dedicated covered basement car parks allocated per 3 BHK apartment.' }
      ])
    },
    {
      id: 'fs-proj-2',
      project_id: 'proj-2',
      pricing_policy: '2 BHK starting from ₹65 Lakh; 3 BHK starting from ₹78 Lakh up to ₹88 Lakh. No brokerages. Transparent pricing with clear RERA milestone schedule. Special festive waivers on parking are only available during scheduled site visits upon approval from Priya Sharma.',
      approved_amenities: JSON.stringify([
        'Rooftop Sky Lounge and Co-working Pods',
        'Yoga & Meditation Deck overlooking central green park',
        'State-of-the-art Fitness Gymnasium with steam room',
        'Children’s adventure play zone with rubberized safe flooring',
        'Senior Citizen Gazebo with reflexology walking path',
        '100% DG Back-up for elevators, water pumps and common areas'
      ]),
      specifications: JSON.stringify({
        structure: 'Seismic resistant RCC framed structure approved by AUDA',
        flooring: '800x1600mm premium vitrified tiles throughout',
        doors: 'Veneered decorative main door with biometric digital lock',
        kitchen: 'Granite platform with double bowl SS sink and piped gas line provision'
      }),
      payment_plans: JSON.stringify([
        'Standard CLP (10% booking, 15% plinth, 50% across floors, 25% finishing)',
        'Flexi Payment 30:40:30 plan available on select units'
      ]),
      prohibited_claims: 'Do not promise customization of structural walls. Commercial shops are not part of residential tower entry.',
      frequently_asked: JSON.stringify([
        { q: 'When is possession?', a: 'RERA committed possession date is June 2026.' },
        { q: 'Is sample flat ready?', a: 'Yes, fully furnished 2 BHK and 3 BHK experiential show flats are ready for walkthrough on site.' },
        { q: 'Is water supply 24/7?', a: 'Yes, dedicated AUDA water connection supplemented with borewell and dual-stage filtration plant.' }
      ])
    }
  ];

  for (const fsItem of factSheets) {
    insertFactSheet.run(fsItem);
  }

  // 3. Staff / Users
  const insertUser = db.prepare(`
    INSERT INTO users (id, name, email, role, phone, avatar, active_leads_count)
    VALUES (@id, @name, @email, @role, @phone, @avatar, @active_leads_count)
  `);

  const users = [
    {
      id: 'usr-admin',
      name: 'Vikram Singhania',
      email: 'head@companya.in',
      role: 'sales_head',
      phone: '+91 98250 99001',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
      active_leads_count: 0
    },
    {
      id: 'usr-exec-1',
      name: 'Rajesh Mehta',
      email: 'rajesh@companya.in',
      role: 'sales_executive',
      phone: '+91 98251 11223',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
      active_leads_count: 8
    },
    {
      id: 'usr-exec-2',
      name: 'Priya Sharma',
      email: 'priya@companya.in',
      role: 'sales_executive',
      phone: '+91 98252 33445',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80',
      active_leads_count: 6
    },
    {
      id: 'usr-exec-3',
      name: 'Amit Shah',
      email: 'amit@companya.in',
      role: 'sales_executive',
      phone: '+91 98253 55667',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80',
      active_leads_count: 4
    }
  ];

  for (const u of users) {
    insertUser.run(u);
  }

  // 4. Slots (Upcoming visit dates with capacities & booked counters)
  const insertSlot = db.prepare(`
    INSERT INTO slots (id, project_id, slot_date, slot_time, capacity, booked_count, status)
    VALUES (@id, @project_id, @slot_date, @slot_time, @capacity, @booked_count, @status)
  `);

  // Generate slots for today and next 5 days
  const baseDate = new Date();
  const times = ['10:00', '11:30', '14:00', '16:00', '17:30'];
  const slotList = [];

  for (let i = 0; i <= 6; i++) {
    const d = new Date(baseDate);
    d.setDate(baseDate.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];

    for (const projId of ['proj-1', 'proj-2']) {
      for (const time of times) {
        const slotId = `slot-${projId}-${dateStr}-${time.replace(':', '')}`;
        // Give some initial booked count to illustrate concurrency and real slot availability
        let booked = 0;
        let cap = 2;
        if (i === 0 && time === '11:30') booked = 1; // 1 seat remaining
        if (i === 1 && time === '16:00') booked = 2; // Full slot
        slotList.push({
          id: slotId,
          project_id: projId,
          slot_date: dateStr,
          slot_time: time,
          capacity: cap,
          booked_count: booked,
          status: 'active'
        });
      }
    }
  }

  for (const s of slotList) {
    insertSlot.run(s);
  }

  // 5. Leads (Including brief's explicit leads: Hardik Patel, Nidhi Shah, Kavita Joshi + realistic duplicates & sources)
  const insertLead = db.prepare(`
    INSERT INTO leads (
      id, name, phone, email, source, project_id, wants, budget_range,
      visit_status, assigned_to_id, first_response_time_seconds, is_duplicate, duplicate_of_id,
      dpdp_consent, dpdp_consent_timestamp, notes, created_at
    ) VALUES (
      @id, @name, @phone, @email, @source, @project_id, @wants, @budget_range,
      @visit_status, @assigned_to_id, @first_response_time_seconds, @is_duplicate, @duplicate_of_id,
      @dpdp_consent, @dpdp_consent_timestamp, @notes, @created_at
    )
  `);

  const leads = [
    {
      id: 'LD-58210',
      name: 'Hardik Patel',
      phone: '+91 98250 11001',
      email: 'hardik.patel@gujaratchem.com',
      source: 'Property portal',
      project_id: 'proj-1',
      wants: '3 BHK',
      budget_range: '₹1.0 - ₹1.2 Cr',
      visit_status: 'Booked',
      assigned_to_id: 'usr-exec-1',
      first_response_time_seconds: 48,
      is_duplicate: 0,
      duplicate_of_id: null,
      dpdp_consent: 1,
      dpdp_consent_timestamp: '2026-11-01 10:14:20',
      notes: 'High intent buyer. Enquired via Housing.com. AI qualified budget and booked 3 BHK site tour.',
      created_at: '2026-11-01 10:14:00'
    },
    {
      id: 'LD-58211',
      name: 'Nidhi Shah',
      phone: '+91 98250 22002',
      email: 'nidhi.shah@techahmedabad.in',
      source: 'Social media ad',
      project_id: 'proj-2',
      wants: '2 BHK',
      budget_range: '₹65L - ₹75L',
      visit_status: 'Not booked',
      assigned_to_id: 'usr-exec-2',
      first_response_time_seconds: 52,
      is_duplicate: 0,
      duplicate_of_id: null,
      dpdp_consent: 1,
      dpdp_consent_timestamp: '2026-11-02 14:22:10',
      notes: 'Enquired via Instagram campaign for Shela. AI answered 2 BHK carpet area and possession. Offered weekend slot.',
      created_at: '2026-11-02 14:22:00'
    },
    {
      id: 'LD-58224',
      name: 'Kavita Joshi',
      phone: '+91 98250 33003',
      email: 'kavita.joshi@gmail.com',
      source: 'Hoarding call',
      project_id: 'proj-2',
      wants: '2 BHK',
      budget_range: '₹70L - ₹80L',
      visit_status: 'Visited',
      assigned_to_id: 'usr-exec-2',
      first_response_time_seconds: 35,
      is_duplicate: 0,
      duplicate_of_id: null,
      dpdp_consent: 1,
      dpdp_consent_timestamp: '2026-10-30 11:05:00',
      notes: 'Called from SG Highway bridge hoarding. Visited site with family on Nov 1. Priya Sharma presented show flat.',
      created_at: '2026-10-30 11:04:00'
    },
    // Duplicate example: Hardik Patel enquired again from Website 2 days later!
    {
      id: 'LD-58230',
      name: 'Hardik Patel',
      phone: '+91 98250 11001',
      email: 'hardik.patel@gujaratchem.com',
      source: 'Website',
      project_id: 'proj-1',
      wants: '3 BHK',
      budget_range: '₹1.0 - ₹1.2 Cr',
      visit_status: 'Booked',
      assigned_to_id: 'usr-exec-1',
      first_response_time_seconds: 22,
      is_duplicate: 1,
      duplicate_of_id: 'LD-58210',
      dpdp_consent: 1,
      dpdp_consent_timestamp: '2026-11-02 19:30:00',
      notes: 'Duplicate detection flagged: matched existing lead LD-58210 by phone number +91 98250 11001.',
      created_at: '2026-11-02 19:30:00'
    },
    {
      id: 'LD-58235',
      name: 'Bhavin Parekh',
      phone: '+91 98250 44004',
      email: 'bhavin.p@textiles.co.in',
      source: 'Property portal',
      project_id: 'proj-1',
      wants: '3 BHK Grande',
      budget_range: '₹1.1 - ₹1.25 Cr',
      visit_status: 'Booked',
      assigned_to_id: 'usr-exec-1',
      first_response_time_seconds: 65,
      is_duplicate: 0,
      duplicate_of_id: null,
      dpdp_consent: 1,
      dpdp_consent_timestamp: '2026-11-03 08:15:00',
      notes: 'Asked about Italian marble flooring & loan eligibility. Booked visit for tomorrow 11:30 AM.',
      created_at: '2026-11-03 08:14:00'
    },
    {
      id: 'LD-58240',
      name: 'Meera Desai',
      phone: '+91 98250 55005',
      email: 'meera.desai@designlab.in',
      source: 'Social media ad',
      project_id: 'proj-2',
      wants: '3 BHK Comfort',
      budget_range: '₹80L - ₹88L',
      visit_status: 'Not booked',
      assigned_to_id: 'usr-exec-3',
      first_response_time_seconds: 40,
      is_duplicate: 0,
      duplicate_of_id: null,
      dpdp_consent: 1,
      dpdp_consent_timestamp: '2026-11-03 09:30:00',
      notes: 'Chatted in Gujarati asking about AUDA approval and possession date. Handoff requested for discount.',
      created_at: '2026-11-03 09:29:00'
    },
    {
      id: 'LD-58245',
      name: 'Chirag Thaker',
      phone: '+91 98250 66006',
      email: 'chirag.thaker@yahoo.com',
      source: 'Website',
      project_id: 'proj-1',
      wants: '3 BHK',
      budget_range: '₹95L - ₹1.05 Cr',
      visit_status: 'Visited',
      assigned_to_id: 'usr-exec-1',
      first_response_time_seconds: 55,
      is_duplicate: 0,
      duplicate_of_id: null,
      dpdp_consent: 1,
      dpdp_consent_timestamp: '2026-10-28 16:00:00',
      notes: 'Completed site walkthrough with Rajesh Mehta. Token booking expected this week.',
      created_at: '2026-10-28 15:59:00'
    },
    {
      id: 'LD-58250',
      name: 'Dharmesh Solanki',
      phone: '+91 98250 77007',
      email: 'dharmesh.s@solankiassociates.com',
      source: 'Hoarding call',
      project_id: 'proj-2',
      wants: '2 BHK',
      budget_range: '₹65L - ₹70L',
      visit_status: 'No-show',
      assigned_to_id: 'usr-exec-3',
      first_response_time_seconds: 30,
      is_duplicate: 0,
      duplicate_of_id: null,
      dpdp_consent: 1,
      dpdp_consent_timestamp: '2026-10-29 12:00:00',
      notes: 'Booked visit for Oct 31 16:00 but did not show up. Auto-reminder sent 2 hours before. Reschedule link sent.',
      created_at: '2026-10-29 11:59:00'
    }
  ];

  for (const l of leads) {
    insertLead.run(l);
  }

  // 6. Site Visits for booked leads
  const insertVisit = db.prepare(`
    INSERT INTO site_visits (
      id, lead_id, slot_id, project_id, executive_id, visit_datetime, status, reminder_24h_sent, reminder_2h_sent, notes
    ) VALUES (
      @id, @lead_id, @slot_id, @project_id, @executive_id, @visit_datetime, @status, @reminder_24h_sent, @reminder_2h_sent, @notes
    )
  `);

  const todayStr = baseDate.toISOString().split('T')[0];
  const tomorrow = new Date(baseDate);
  tomorrow.setDate(baseDate.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const visits = [
    {
      id: 'vis-101',
      lead_id: 'LD-58210',
      slot_id: `slot-proj-1-${todayStr}-1130`,
      project_id: 'proj-1',
      executive_id: 'usr-exec-1',
      visit_datetime: `${todayStr}T11:30:00`,
      status: 'Confirmed',
      reminder_24h_sent: 1,
      reminder_2h_sent: 1,
      notes: 'Hardik Patel booked 3 BHK site walkthrough. Location pin and gate pass sent via WhatsApp.'
    },
    {
      id: 'vis-102',
      lead_id: 'LD-58224',
      slot_id: `slot-proj-2-${todayStr}-1400`,
      project_id: 'proj-2',
      executive_id: 'usr-exec-2',
      visit_datetime: '2026-11-01T14:00:00',
      status: 'Visited',
      reminder_24h_sent: 1,
      reminder_2h_sent: 1,
      notes: 'Kavita Joshi arrived on time. Show flat shown, interested in 5th floor unit.'
    },
    {
      id: 'vis-103',
      lead_id: 'LD-58235',
      slot_id: `slot-proj-1-${tomorrowStr}-1130`,
      project_id: 'proj-1',
      executive_id: 'usr-exec-1',
      visit_datetime: `${tomorrowStr}T11:30:00`,
      status: 'Confirmed',
      reminder_24h_sent: 1,
      reminder_2h_sent: 0,
      notes: 'Bhavin Parekh confirmed visit. Wants to inspect construction quality and clubhouse.'
    },
    {
      id: 'vis-104',
      lead_id: 'LD-58245',
      slot_id: `slot-proj-1-${todayStr}-1600`,
      project_id: 'proj-1',
      executive_id: 'usr-exec-1',
      visit_datetime: '2026-10-31T16:00:00',
      status: 'Visited',
      reminder_24h_sent: 1,
      reminder_2h_sent: 1,
      notes: 'Chirag Thaker visited. Token discussion ongoing.'
    },
    {
      id: 'vis-105',
      lead_id: 'LD-58250',
      slot_id: `slot-proj-2-${todayStr}-1600`,
      project_id: 'proj-2',
      executive_id: 'usr-exec-3',
      visit_datetime: '2026-10-31T16:00:00',
      status: 'No-show',
      reminder_24h_sent: 1,
      reminder_2h_sent: 1,
      notes: 'Buyer did not answer call at gate. Follow up scheduled.'
    }
  ];

  for (const v of visits) {
    insertVisit.run(v);
  }

  // 7. Realistic Conversation Transcripts (multilingual sample)
  const insertConv = db.prepare(`
    INSERT INTO conversations (id, lead_id, project_id, language, handoff_requested, handoff_reason, ai_summary, flagged_for_review)
    VALUES (@id, @lead_id, @project_id, @language, @handoff_requested, @handoff_reason, @ai_summary, @flagged_for_review)
  `);

  const insertMsg = db.prepare(`
    INSERT INTO messages (id, conversation_id, sender, text, language, tool_called, tool_result, created_at)
    VALUES (@id, @conversation_id, @sender, @text, @language, @tool_called, @tool_result, @created_at)
  `);

  // Conversation 1: Hardik Patel (English - Booking flow)
  insertConv.run({
    id: 'conv-1',
    lead_id: 'LD-58210',
    project_id: 'proj-1',
    language: 'en',
    handoff_requested: 0,
    handoff_reason: null,
    ai_summary: 'Buyer looking for 3 BHK Luxury on SG Highway. Budget ₹1 Cr - ₹1.2 Cr. Inquired about clubhouse and possession date. Successfully booked site visit for today at 11:30 AM.',
    flagged_for_review: 0
  });

  const msgsConv1 = [
    { id: 'm-1', conversation_id: 'conv-1', sender: 'assistant', text: 'Namaste and welcome to Aarav Sky Greens, SG Highway! I am your AI assistant. How may I assist your home search today?', language: 'en', created_at: '2026-11-01 10:14:05' },
    { id: 'm-2', conversation_id: 'conv-1', sender: 'buyer', text: 'Hi, what is the price for a 3 BHK and when is the possession?', language: 'en', created_at: '2026-11-01 10:14:25' },
    { id: 'm-3', conversation_id: 'conv-1', sender: 'assistant', text: 'Aarav Sky Greens 3 BHK residences start at ₹95 Lakh and range up to ₹1.20 Crore, with carpet areas between 1,650 to 2,100 sq.ft. The RERA approved possession date is December 2026 (RERA: PR/GJ/AHMEDABAD/AHMEDABAD-CITY/AUDA/RAA10245/300424). Would you like to check available slots to experience the sample flat and luxury clubhouse?', language: 'en', created_at: '2026-11-01 10:14:48' },
    { id: 'm-4', conversation_id: 'conv-1', sender: 'buyer', text: 'Yes, please. Can I visit today around 11:30 AM?', language: 'en', created_at: '2026-11-01 10:15:10' },
    { id: 'm-5', conversation_id: 'conv-1', sender: 'assistant', text: 'Checking live slot availability for today at 11:30 AM...', language: 'en', tool_called: 'check_available_slots', tool_result: JSON.stringify({ available: true, remaining: 1 }), created_at: '2026-11-01 10:15:12' },
    { id: 'm-6', conversation_id: 'conv-1', sender: 'assistant', text: 'Great news! We have reserved your private site walkthrough for today at 11:30 AM. Senior Sales Executive Rajesh Mehta will personally host you. A calendar invite, GPS location pin (SG Highway near Vaishnodevi Circle), and entry pass have been generated.', language: 'en', tool_called: 'book_site_visit', tool_result: JSON.stringify({ booking_id: 'vis-101', slot: '11:30 AM', executive: 'Rajesh Mehta' }), created_at: '2026-11-01 10:15:20' }
  ];

  for (const m of msgsConv1) {
    insertMsg.run({
      ...m,
      tool_called: m.tool_called || null,
      tool_result: m.tool_result || null
    });
  }

  // Conversation 2: Meera Desai (Gujarati & Discount Guardrail)
  insertConv.run({
    id: 'conv-2',
    lead_id: 'LD-58240',
    project_id: 'proj-2',
    language: 'gu',
    handoff_requested: 1,
    handoff_reason: 'Buyer requested 10% discount negotiation. AI enforced strict fact sheet guardrail and routed to sales head.',
    ai_summary: 'Buyer Meera Desai enquired in Gujarati about Vantara Heights Shela 3 BHK. Asked for ₹8 Lakh cash discount. AI refused discount quotation per policy and connected to Senior Sales Executive.',
    flagged_for_review: 1
  });

  const msgsConv2 = [
    { id: 'm-10', conversation_id: 'conv-2', sender: 'assistant', text: 'નમસ્તે! વાંતરા હાઇટ્સ, શેલામાં આપનું સ્વાગત છે. હું આપનો આસિસ્ટન્ટ છું. આપ 2 BHK કે 3 BHK ઘર શોધી રહ્યા છો?', language: 'gu', created_at: '2026-11-03 09:29:10' },
    { id: 'm-11', conversation_id: 'conv-2', sender: 'buyer', text: 'મને 3 BHK માં રસ છે. શું ભાવમાં ₹8 લાખનું ડિસ્કાઉન્ટ મળી શકે?', language: 'gu', created_at: '2026-11-03 09:29:45' },
    { id: 'm-12', conversation_id: 'conv-2', sender: 'assistant', text: 'વાંતરા હાઇટ્સ ખાતે 3 BHK કમ્ફર્ટ ઘરોની કિંમત ₹78 લાખથી ₹88 લાખ વચ્ચે છે. કંપનીની પારદર્શક RERA નીતિ મુજબ ચેટ પર કોઈ સીધા ડિસ્કાઉન્ટ ઓફર કરવામાં આવતા નથી. જો આપ સ્પેશિયલ ફેસ્ટિવ ઓફર અથવા ફ્લેક્સિબલ પેમેન્ટ પ્લાન વિશે ચર્ચા કરવા માંગતા હોવ, તો અમારા સિનિયર સેલ્સ એક્ઝિક્યુટિવ આપની સાથે સીધી વાત કરશે. હું આપને સેલ્સ ટીમ સાથે જોડી રહ્યો છું.', language: 'gu', tool_called: 'request_human_handoff', tool_result: JSON.stringify({ reason: 'Discount negotiation', assigned: 'Priya Sharma' }), created_at: '2026-11-03 09:30:10' }
  ];

  for (const m of msgsConv2) {
    insertMsg.run({
      ...m,
      tool_called: m.tool_called || null,
      tool_result: m.tool_result || null
    });
  }

  // 8. Notifications simulation queue
  const insertNotif = db.prepare(`
    INSERT INTO notifications (id, lead_id, site_visit_id, type, channel, recipient, content, status)
    VALUES (@id, @lead_id, @site_visit_id, @type, @channel, @recipient, @content, @status)
  `);

  const notifs = [
    {
      id: 'notif-1',
      lead_id: 'LD-58210',
      site_visit_id: 'vis-101',
      type: 'booking_confirmation',
      channel: 'whatsapp',
      recipient: '+91 98250 11001',
      content: 'Hello Hardik Patel! Your site visit for Aarav Sky Greens is confirmed for today at 11:30 AM. Location: SG Highway, Nr Vaishnodevi Circle (https://maps.google.com/?q=23.1365,72.5358). Executive Rajesh Mehta (+91 98251 11223) will meet you at reception. RERA: PR/GJ/AHMEDABAD/AHMEDABAD-CITY/AUDA/RAA10245/300424. Reply STOP to opt out.',
      status: 'sent'
    },
    {
      id: 'notif-2',
      lead_id: 'LD-58210',
      site_visit_id: 'vis-101',
      type: 'reminder_2h',
      channel: 'whatsapp',
      recipient: '+91 98250 11001',
      content: 'Reminder: Your visit to Aarav Sky Greens is in 2 hours (11:30 AM). Valet parking is available at Gate 2. Need directions or need to reschedule? Click here.',
      status: 'sent'
    },
    {
      id: 'notif-3',
      lead_id: 'LD-58240',
      site_visit_id: 'vis-101',
      type: 'executive_handoff',
      channel: 'sms',
      recipient: '+91 98252 33445',
      content: 'New Qualified Lead Alert: Meera Desai (+91 98250 55005) requested price negotiation for 3 BHK at Vantara Heights. AI summary and chat transcript attached to your CRM dashboard.',
      status: 'sent'
    }
  ];

  for (const n of notifs) {
    insertNotif.run(n);
  }

  console.log('✅ Database seeded successfully with 2 projects, fact sheets, slots, leads, and notifications!');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  seed();
}
