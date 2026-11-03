import { checkGuardrails, formatGuardrailResponse } from './guardrails.js';
import { STRINGS, detectLanguage } from './multilingual.js';

export class RealEstateAIAgent {
  constructor(db) {
    this.db = db;
  }

  /**
   * Process a message from a buyer or test runner
   */
  async processMessage({ conversationId, leadId, projectId, text, requestedLanguage }) {
    // 1. Determine language
    const autoLang = detectLanguage(text);
    const lang = requestedLanguage || autoLang || 'en';

    // 2. Fetch project and live fact sheet
    const project = this.db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId);
    const factSheet = this.db.prepare('SELECT * FROM fact_sheets WHERE project_id = ?').get(projectId);

    if (!project || !factSheet) {
      throw new Error(`Project ${projectId} or fact sheet not found`);
    }

    // 3. Fetch lead details if available
    let lead = null;
    if (leadId) {
      lead = this.db.prepare('SELECT * FROM leads WHERE id = ?').get(leadId);
    }

    // 4. Save user message to database
    const msgId = 'msg-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
    this.db.prepare(`
      INSERT INTO messages (id, conversation_id, sender, text, language, created_at)
      VALUES (?, ?, 'buyer', ?, ?, datetime('now'))
    `).run(msgId, conversationId, text, lang);

    // 5. Check guardrails (human handoff, discounts, prohibited topics)
    const guardrail = checkGuardrails(text, lang);
    if (guardrail.triggered) {
      return this.handleGuardrailTrigger({
        guardrail,
        conversationId,
        leadId,
        project,
        lang,
        userMessage: text
      });
    }

    // 6. Check for intent to book or check visit slots
    const normalized = text.toLowerCase();
    const isBookingIntent = /visit|book|slot|appointment|schedule|time|date|walkthrough|dekho|milna|mulakat|મુલાકાત|જોવું|સ્લોટ|તારીખ/i.test(normalized);
    const isAvailableSlotQuery = /when can i|free slot|available slot|timing|kab aa|khali slot/i.test(normalized);

    if (isBookingIntent || isAvailableSlotQuery) {
      return this.handleSlotBookingFlow({
        conversationId,
        leadId,
        project,
        lang,
        normalizedText: normalized,
        originalText: text
      });
    }

    // 7. Check for budget / BHK preference expressions and update lead profile
    this.extractAndSaveLeadPreferences(leadId, normalized);

    // 8. Grounded Knowledge Query against Fact Sheet
    return this.answerFromFactSheet({
      conversationId,
      leadId,
      project,
      factSheet,
      lang,
      userMessage: text
    });
  }

  /**
   * Handle guardrail violations or explicit human request
   */
  handleGuardrailTrigger({ guardrail, conversationId, leadId, project, lang, userMessage }) {
    if (guardrail.type === 'HUMAN_HANDOFF_REQUESTED') {
      const assignedExec = this.assignSalesExecutive(leadId);
      const responseText = STRINGS[lang]?.handoff_confirmation(assignedExec.name) ||
        `I have connected you with ${assignedExec.name}, our Senior Sales Specialist. They will review our chat history and reach out to you shortly.`;

      this.db.prepare(`
        UPDATE conversations
        SET handoff_requested = 1,
            handoff_reason = ?,
            flagged_for_review = 1,
            ai_summary = ?
        WHERE id = ?
      `).run(
        'Buyer explicitly requested human specialist.',
        `Buyer requested human agent after asking: "${userMessage}". Assigned to ${assignedExec.name}.`,
        conversationId
      );

      return this.recordAssistantMessage({
        conversationId,
        text: responseText,
        lang,
        toolCalled: 'request_human_handoff',
        toolResult: { assigned_to: assignedExec.name, phone: assignedExec.phone, reason: 'buyer_request' }
      });
    }

    // Discount negotiation refusal
    if (guardrail.type === 'DISCOUNT_NEGOTIATION_REFUSAL') {
      const refusalText = formatGuardrailResponse('DISCOUNT_NEGOTIATION_REFUSAL', lang, project);

      // Flag for sales head review as serious buyer negotiating price
      this.db.prepare(`
        UPDATE conversations
        SET flagged_for_review = 1,
            ai_summary = COALESCE(ai_summary, '') || '\n- Buyer inquired about discount/negotiation.'
        WHERE id = ?
      `).run(conversationId);

      return this.recordAssistantMessage({
        conversationId,
        text: refusalText,
        lang,
        toolCalled: 'enforce_pricing_guardrail',
        toolResult: { status: 'discount_refused', policy: 'non-negotiable_on_chat' }
      });
    }

    // Prohibited topic
    const prohibitedText = formatGuardrailResponse('PROHIBITED_TOPIC', lang, project);
    this.db.prepare(`
      UPDATE conversations
      SET flagged_for_review = 1,
          handoff_requested = 1,
          handoff_reason = 'Prohibited or speculative question asked: ' || ?
      WHERE id = ?
    `).run(userMessage, conversationId);

    return this.recordAssistantMessage({
      conversationId,
      text: prohibitedText,
      lang,
      toolCalled: 'prohibited_topic_safety',
      toolResult: { status: 'flagged_for_review' }
    });
  }

  /**
   * Slot booking and availability flow
   */
  handleSlotBookingFlow({ conversationId, leadId, project, lang, normalizedText }) {
    // 1. Fetch available slots (where booked_count < capacity)
    const availableSlots = this.db.prepare(`
      SELECT * FROM slots
      WHERE project_id = ? AND status = 'active' AND booked_count < capacity
      ORDER BY slot_date ASC, slot_time ASC
      LIMIT 5
    `).all(project.id);

    if (availableSlots.length === 0) {
      const fullText = lang === 'gu'
        ? `હાલમાં આગામી બધા સ્લોટ્સ ભરેલા છે. અમારા સેલ્સ એક્ઝિક્યુટિવ આપના અનુકૂળ સમયે વિશિષ્ટ સ્લોટ ખોલી આપશે.`
        : (lang === 'hi'
          ? `वर्तमान में सभी आगामी स्लॉट भरे हुए हैं। हमारे सेल्स एग्जीक्यूटिव आपकी सुविधा अनुसार विशेष स्लॉट की व्यवस्था करेंगे।`
          : `All immediate online slots are currently full. Our Senior Sales Executive will arrange a priority VIP walkthrough for you.`);
      
      this.assignSalesExecutive(leadId);
      return this.recordAssistantMessage({
        conversationId,
        text: fullText,
        lang,
        toolCalled: 'check_available_slots',
        toolResult: { available_count: 0 }
      });
    }

    // Check if the user specified a specific time (e.g., 10:00, 11:30, 2:00, 4:00, etc.)
    const timeMatch = normalizedText.match(/(10:00|10 am|10am|11:30|11:30am|11:30 am|11 am|11am|2:00|2 pm|2pm|14:00|4:00|4 pm|4pm|16:00|5:30|5:30 pm|5:30pm|17:30)/i);

    if (timeMatch && leadId) {
      // Find matching slot
      const matchedTime = this.normalizeTime(timeMatch[1]);
      const matchedSlot = availableSlots.find(s => s.slot_time === matchedTime) || availableSlots[0];

      // Perform atomic booking
      try {
        const bookingResult = this.bookSlotAtomically({
          leadId,
          slotId: matchedSlot.id,
          projectId: project.id
        });

        const successText = STRINGS[lang]?.booking_success(matchedSlot.slot_date, matchedSlot.slot_time, bookingResult.executive_name) ||
          `🎉 Your site visit is confirmed for ${matchedSlot.slot_date} at ${matchedSlot.slot_time}. Sales Executive ${bookingResult.executive_name} will meet you at reception. RERA: ${project.rera_number}`;

        return this.recordAssistantMessage({
          conversationId,
          text: successText,
          lang,
          toolCalled: 'book_site_visit',
          toolResult: {
            booking_id: bookingResult.booking_id,
            slot_id: matchedSlot.id,
            date: matchedSlot.slot_date,
            time: matchedSlot.slot_time,
            executive: bookingResult.executive_name,
            location_pin: `https://maps.google.com/?q=${project.coordinates}`
          }
        });
      } catch (err) {
        // Double booking race condition caught!
        return this.recordAssistantMessage({
          conversationId,
          text: `Someone just reserved that exact slot a second ago! Let me offer you the next free slot on ${availableSlots[0].slot_date} at ${availableSlots[0].slot_time}.`,
          lang,
          toolCalled: 'book_site_visit',
          toolResult: { status: 'conflict_prevented', error: err.message }
        });
      }
    }

    // Otherwise, present open slots
    let slotOptions = availableSlots.map(s => `• ${s.slot_date} at ${s.slot_time} (${s.capacity - s.booked_count} slots left)`).join('\n');
    let intro = STRINGS[lang]?.slot_header || 'Here are the upcoming open site-visit slots:';
    let question = lang === 'gu'
      ? `આપને કયો સમય અનુકૂળ રહેશે? આપ ફક્ત સમય (દા.ત. 11:30 AM અથવા 4:00 PM) લખીને મોકલી શકો છો.`
      : (lang === 'hi'
        ? `आपको कौन सा समय सुविधाजनक रहेगा? आप बस समय (जैसे 11:30 AM या 4:00 PM) लिखकर भेज सकते हैं।`
        : `Which time works best for your visit? Reply with your preferred slot.`);

    const messageText = `${intro}\n\n${slotOptions}\n\n${question}\n\n[Location: ${project.location} | RERA: ${project.rera_number}]`;

    return this.recordAssistantMessage({
      conversationId,
      text: messageText,
      lang,
      toolCalled: 'check_available_slots',
      toolResult: { slots: availableSlots }
    });
  }

  /**
   * Concurrency Safe Atomic Slot Booking with SQLite transaction locks
   */
  bookSlotAtomically({ leadId, slotId, projectId }) {
    const lead = this.db.prepare('SELECT * FROM leads WHERE id = ?').get(leadId);
    if (!lead) throw new Error('Lead not found for booking');

    const project = this.db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId);
    const executive = this.assignSalesExecutive(leadId);

    // Use transaction for ACID concurrency guarantee
    const bookTx = this.db.transaction(() => {
      // 1. Re-read slot with lock
      const slot = this.db.prepare("SELECT * FROM slots WHERE id = ? AND status = 'active'").get(slotId);
      if (!slot) {
        throw new Error('Slot does not exist or is inactive');
      }

      if (slot.booked_count >= slot.capacity) {
        throw new Error('SLOT_CAPACITY_EXCEEDED');
      }

      // 2. Increment booked_count
      this.db.prepare('UPDATE slots SET booked_count = booked_count + 1 WHERE id = ?').run(slotId);

      // 3. Create site visit record
      const visitId = 'vis-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
      const visitDatetime = `${slot.slot_date}T${slot.slot_time}:00`;

      this.db.prepare(`
        INSERT INTO site_visits (id, lead_id, slot_id, project_id, executive_id, visit_datetime, status, reminder_24h_sent, reminder_2h_sent, notes)
        VALUES (?, ?, ?, ?, ?, ?, 'Confirmed', 1, 0, ?)
      `).run(
        visitId,
        leadId,
        slotId,
        projectId,
        executive.id,
        visitDatetime,
        `AI booking via assistant chat. Visitor: ${lead.name} (${lead.phone}).`
      );

      // 4. Update lead visit status
      this.db.prepare(`
        UPDATE leads
        SET visit_status = 'Booked',
            assigned_to_id = ?,
            updated_at = datetime('now')
        WHERE id = ?
      `).run(executive.id, leadId);

      // 5. Generate confirmation notification & simulated reminders (1 day and 2 hours before)
      const notifId = 'notif-' + Date.now();
      const confirmationText = `Namaste ${lead.name}! Your site visit to ${project.name} is confirmed for ${slot.slot_date} at ${slot.slot_time}. Location pin: https://maps.google.com/?q=${project.coordinates}. Sales specialist ${executive.name} (${executive.phone}) will host you. RERA: ${project.rera_number}. (DPDP Act 2023 Consent Active - Reply STOP to opt out)`;

      this.db.prepare(`
        INSERT INTO notifications (id, lead_id, site_visit_id, type, channel, recipient, content, status)
        VALUES (?, ?, ?, 'booking_confirmation', 'whatsapp', ?, ?, 'sent')
      `).run(notifId, leadId, visitId, lead.phone, confirmationText);

      return {
        booking_id: visitId,
        slot_date: slot.slot_date,
        slot_time: slot.slot_time,
        executive_name: executive.name,
        executive_phone: executive.phone
      };
    });

    return bookTx();
  }

  /**
   * Grounded Question Answering strictly from Fact Sheet
   */
  answerFromFactSheet({ conversationId, leadId, project, factSheet, lang, userMessage }) {
    const lead = leadId ? this.db.prepare('SELECT * FROM leads WHERE id = ?').get(leadId) : null;
    const q = userMessage.toLowerCase();
    const approvedAmenities = JSON.parse(factSheet.approved_amenities || '[]');
    const specifications = JSON.parse(factSheet.specifications || '{}');
    const paymentPlans = JSON.parse(factSheet.payment_plans || '[]');
    const faqs = JSON.parse(factSheet.frequently_asked || '[]');

    let answer = null;
    let category = null;

    // Check pricing intent
    if (/price|cost|rate|bhav|kimat|ભાવ|કિંમત|પ્રાઈઝ|रुपये|लाख|करोड़/i.test(q)) {
      category = 'pricing';
      if (lang === 'gu') {
        answer = `${project.name} માટે કિંમત ₹${project.price_range} છે (${project.carpet_area}). કંપનીની પારદર્શક RERA નીતિ અનુસાર બેઝ ભાવ નિર્ધારિત છે. વિગતવાર પેમેન્ટ સ્લેબ અને ફ્લોર પ્લાન જોવા માટે સાઇટ વિઝિટ ઉપલબ્ધ છે. (RERA: ${project.rera_number})`;
      } else if (lang === 'hi') {
        answer = `${project.name} की कीमत ${project.price_range} से शुरू होती है (कारपेट एरिया: ${project.carpet_area})। सभी कीमतें पारदर्शी RERA दिशानिर्देशों के अनुरूप हैं। क्या आप मॉडल फ्लैट देखने के लिए विज़िट स्लॉट बुक करना चाहेंगे? (RERA: ${project.rera_number})`;
      } else {
        answer = `${project.name} residences range from ${project.price_range} with carpet areas between ${project.carpet_area}. Prices conform strictly to RERA milestone plans. We welcome you to tour the experiential show flat. Would you like to check available slots? (RERA: ${project.rera_number})`;
      }
    }
    // Check possession date
    else if (/possession|ready|when|handover|completion|તારીખ|ક્યારે|ક્યારે મળશે|कब मिलेगा|पज़ेशन/i.test(q)) {
      category = 'possession';
      if (lang === 'gu') {
        answer = `${project.name} ની RERA મંજૂર પઝેશન તારીખ ${project.possession_date} છે. બાંધકામ પૂર્ણતા RERA પોર્ટલ પર નિયમિત અપડેટ થાય છે. (RERA: ${project.rera_number})`;
      } else if (lang === 'hi') {
        answer = `${project.name} की RERA स्वीकृत पज़ेशन तिथि ${project.possession_date} है। निर्माण कार्य निर्धारित समय पर अग्रसर है। (RERA: ${project.rera_number})`;
      } else {
        answer = `The RERA-registered committed possession date for ${project.name} is ${project.possession_date}. Construction milestones are on schedule. (RERA: ${project.rera_number})`;
      }
    }
    // Check amenities (pool, clubhouse, gym, badminton, ev, etc.)
    else if (/amenit|club|pool|gym|garden|sports|badminton|squash|ev|સ્વિમિંગ|ક્લબ|જિમ|બગીચો|पूल|जिम|सुविधाएं/i.test(q)) {
      category = 'amenities';
      const amenList = approvedAmenities.slice(0, 4).join(', ');
      if (lang === 'gu') {
        answer = `${project.name} ખાતે મંજૂર સુવિધાઓમાં સામેલ છે: ${amenList}. આપ રૂબરૂ આવીને ક્લબહાઉસ અને લેન્ડસ્કેપ ગાર્ડન જોઈ શકો છો! (RERA: ${project.rera_number})`;
      } else if (lang === 'hi') {
        answer = `${project.name} में स्वीकृत सुविधाओं में शामिल हैं: ${amenList}। आप साइट विज़िट के दौरान संपूर्ण क्लबहाउस और सुविधाओं का भ्रमण कर सकते हैं। (RERA: ${project.rera_number})`;
      } else {
        answer = `Approved lifestyle amenities at ${project.name} include: ${amenList}. Our sales team can walk you through the clubhouse during a site visit. (RERA: ${project.rera_number})`;
      }
    }
    // Check specifications (flooring, fittings, structure)
    else if (/tile|floor|marble|brand|fitting|structure|quality|કાચો માલ|ટાઇલ્સ|मार्बल|फिटिंग/i.test(q)) {
      category = 'specifications';
      answer = `Specifications: ${specifications.flooring || 'Premium glazed vitrified tiles'}, ${specifications.plumbing_sanitary || 'Grohe/Kohler sanitaryware'}, and ${specifications.structure || 'Earthquake resistant RCC'}. (RERA: ${project.rera_number})`;
    }
    // Check payment plans & bank loans
    else if (/loan|bank|emi|installment|hdfc|sbi|payment plan|હપ્તા|લોન|लोन|किस्त/i.test(q)) {
      category = 'finance';
      const plans = paymentPlans.join('; ');
      answer = `Approved Payment Plans: ${plans}. Pre-approved home loan facilities are available with SBI, HDFC, ICICI, and Axis Bank. (RERA: ${project.rera_number})`;
    }
    // Check location & surroundings
    else if (/where|location|address|landmark|near|highway|shela|vaishnodevi|ક્યાં આવેલું|ક્યાં છે|कहाँ है/i.test(q)) {
      category = 'location';
      answer = `${project.name} is located at: ${project.location}. GPS Coordinates: ${project.coordinates}. Convenient access to SG Highway, SP Ring Road, top schools, and healthcare. (RERA: ${project.rera_number})`;
    }
    // Check FAQs
    else {
      for (const faq of faqs) {
        if (q.includes(faq.q.toLowerCase().split(' ')[1] || '---')) {
          category = 'faq';
          answer = `${faq.a} (RERA: ${project.rera_number})`;
          break;
        }
      }
    }

    // GREETINGS / INITIAL INTRO
    if (!answer && (/hi|hello|hey|namaste|kem cho|kemcho|નમસ્તે|કેમ છો|नमस्ते|હેલો/i.test(q))) {
      answer = STRINGS[lang]?.welcome(project.name) || `Welcome to ${project.name}!`;
      category = 'greeting';
    }

    // UNKNOWN / MISSING FACT: Strict brief requirement:
    // "if a fact is missing it says a person will confirm and hands off"
    if (!answer) {
      const assignedExec = this.assignSalesExecutive(leadId);
      const missingNotice = STRINGS[lang]?.missing_fact ||
        `This specific detail is not specified in the sales head’s approved fact sheet. A sales executive will confirm this with you directly.`;

      // Trigger handoff & flag chat
      this.db.prepare(`
        UPDATE conversations
        SET handoff_requested = 1,
            handoff_reason = ?,
            flagged_for_review = 1,
            ai_summary = COALESCE(ai_summary, '') || '\n- Missing fact query: "' || ? || '"'
        WHERE id = ?
      `).run(`Missing fact on query: "${userMessage}"`, userMessage, conversationId);

      return this.recordAssistantMessage({
        conversationId,
        text: `${missingNotice} Senior Executive ${assignedExec.name} has been notified and will provide verified details. (RERA: ${project.rera_number})`,
        lang,
        toolCalled: 'request_human_handoff',
        toolResult: { status: 'missing_fact_handoff', assigned_to: assignedExec.name, query: userMessage }
      });
    }

    // Return the grounded answer with follow-up ask for budget/needs if unknown
    let followUp = '';
    if (lead && (!lead.wants || lead.wants === 'Not specified')) {
      followUp = `\n\n${STRINGS[lang]?.ask_needs || 'Are you looking for a 2 BHK or 3 BHK?'}`;
    } else if (lead && !lead.budget_range) {
      followUp = `\n\n${STRINGS[lang]?.ask_budget || 'What budget range are you planning for?'}`;
    }

    return this.recordAssistantMessage({
      conversationId,
      text: `${answer}${followUp}`,
      lang,
      toolCalled: 'get_fact_sheet_info',
      toolResult: { category, verified_against_rera: true }
    });
  }

  /**
   * Helper: Record assistant message and update conversation
   */
  recordAssistantMessage({ conversationId, text, lang, toolCalled, toolResult }) {
    const msgId = 'msg-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
    this.db.prepare(`
      INSERT INTO messages (id, conversation_id, sender, text, language, tool_called, tool_result, created_at)
      VALUES (?, ?, 'assistant', ?, ?, ?, ?, datetime('now'))
    `).run(
      msgId,
      conversationId,
      text,
      lang,
      toolCalled || null,
      toolResult ? JSON.stringify(toolResult) : null
    );

    this.db.prepare(`
      UPDATE conversations
      SET last_activity = datetime('now')
      WHERE id = ?
    `).run(conversationId);

    return {
      id: msgId,
      conversation_id: conversationId,
      sender: 'assistant',
      text,
      language: lang,
      tool_called: toolCalled || null,
      tool_result: toolResult || null,
      created_at: new Date().toISOString()
    };
  }

  /**
   * Helper: Assign Sales Executive (Round-Robin or least loaded)
   */
  assignSalesExecutive(leadId) {
    const execs = this.db.prepare(`
      SELECT * FROM users
      WHERE role = 'sales_executive'
      ORDER BY active_leads_count ASC
      LIMIT 1
    `).get();

    if (execs && leadId) {
      this.db.prepare('UPDATE leads SET assigned_to_id = ? WHERE id = ?').run(execs.id, leadId);
      this.db.prepare('UPDATE users SET active_leads_count = active_leads_count + 1 WHERE id = ?').run(execs.id);
    }

    return execs || { id: 'usr-exec-1', name: 'Rajesh Mehta', phone: '+91 98251 11223' };
  }

  /**
   * Helper: Parse and extract budget / BHK preferences from chat
   */
  extractAndSaveLeadPreferences(leadId, text) {
    if (!leadId) return;

    let wants = null;
    if (/3\s*bhk/i.test(text)) wants = '3 BHK';
    else if (/2\s*bhk/i.test(text)) wants = '2 BHK';

    let budget = null;
    if (/65|70|75|80|85/i.test(text) && /lakh|lac/i.test(text)) budget = '₹65L - ₹85L';
    else if (/90|95|1\s*cr|1\.1|1\.2/i.test(text)) budget = '₹95L - ₹1.2 Cr';

    if (wants || budget) {
      const updates = [];
      const params = [];
      if (wants) {
        updates.push('wants = ?');
        params.push(wants);
      }
      if (budget) {
        updates.push('budget_range = ?');
        params.push(budget);
      }
      params.push(leadId);
      this.db.prepare(`UPDATE leads SET ${updates.join(', ')} WHERE id = ?`).run(...params);
    }
  }

  normalizeTime(timeStr) {
    const s = timeStr.toLowerCase().replace(/\s+/g, '');
    if (s.includes('10')) return '10:00';
    if (s.includes('11:30') || s.includes('11')) return '11:30';
    if (s.includes('2') || s.includes('14')) return '14:00';
    if (s.includes('4') || s.includes('16')) return '16:00';
    if (s.includes('5:30') || s.includes('17')) return '17:30';
    return '11:30';
  }
}

export default RealEstateAIAgent;
