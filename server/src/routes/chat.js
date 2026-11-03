import express from 'express';
import { RealEstateAIAgent } from '../ai/agent.js';

export function createChatRouter(db) {
  const router = express.Router();
  const agent = new RealEstateAIAgent(db);

  // 1. Start or resume a conversation
  router.post('/start', (req, res) => {
    try {
      const { lead_id, project_id, language } = req.body;
      if (!project_id) {
        return res.status(400).json({ success: false, error: 'project_id is required' });
      }

      // Check if open conversation exists for this lead and project
      let conv = null;
      if (lead_id) {
        conv = db.prepare(`
          SELECT * FROM conversations
          WHERE lead_id = ? AND project_id = ?
          ORDER BY last_activity DESC LIMIT 1
        `).get(lead_id, project_id);
      }

      if (!conv) {
        const convId = 'conv-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
        db.prepare(`
          INSERT INTO conversations (id, lead_id, project_id, language)
          VALUES (?, ?, ?, ?)
        `).run(convId, lead_id || null, project_id, language || 'en');

        // Initial welcome message from assistant
        const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(project_id);
        const welcomeText = language === 'gu'
          ? `નમસ્તે! ${project?.name} માં આપનું સ્વાગત છે. હું આપનો AI આસિસ્ટન્ટ છું. આજે આપના સપનાના ઘરની શોધમાં હું આપને કેવી રીતે મદદ કરી શકું?`
          : (language === 'hi'
            ? `नमस्ते! ${project?.name} में आपका स्वागत है। मैं आपका AI सहायक हूँ। आज आपके घर की खोज में मैं आपकी क्या सहायता कर सकता हूँ?`
            : `Namaste! Welcome to ${project?.name}. I am your dedicated AI concierge. How may I assist with your home search today?`);

        db.prepare(`
          INSERT INTO messages (id, conversation_id, sender, text, language, created_at)
          VALUES (?, ?, 'assistant', ?, ?, datetime('now'))
        `).run('msg-init-' + Date.now(), convId, welcomeText, language || 'en');

        conv = db.prepare('SELECT * FROM conversations WHERE id = ?').get(convId);
      }

      const messages = db.prepare('SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC').all(conv.id);

      res.json({
        success: true,
        conversation: conv,
        messages
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 2. Send message and get AI response
  router.post('/message', async (req, res) => {
    try {
      const { conversation_id, lead_id, project_id, text, language } = req.body;

      if (!conversation_id || !text) {
        return res.status(400).json({ success: false, error: 'conversation_id and text are required' });
      }

      // Fetch conversation info
      const conv = db.prepare('SELECT * FROM conversations WHERE id = ?').get(conversation_id);
      if (!conv) {
        return res.status(404).json({ success: false, error: 'Conversation not found' });
      }

      const projId = project_id || conv.project_id;
      const effectiveLeadId = lead_id || conv.lead_id;

      // Process with AI agent
      const reply = await agent.processMessage({
        conversationId: conversation_id,
        leadId: effectiveLeadId,
        projectId: projId,
        text,
        requestedLanguage: language || conv.language
      });

      // Fetch updated conversation state
      const updatedConv = db.prepare('SELECT * FROM conversations WHERE id = ?').get(conversation_id);

      res.json({
        success: true,
        reply,
        conversation: updatedConv
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 3. Get full conversation history
  router.get('/conversations/:id', (req, res) => {
    try {
      const { id } = req.params;
      const conv = db.prepare(`
        SELECT c.*, p.name AS project_name, l.name AS lead_name, l.phone AS lead_phone,
               u.name AS assigned_to_name
        FROM conversations c
        LEFT JOIN projects p ON c.project_id = p.id
        LEFT JOIN leads l ON c.lead_id = l.id
        LEFT JOIN users u ON l.assigned_to_id = u.id
        WHERE c.id = ?
      `).get(id);

      if (!conv) {
        return res.status(404).json({ success: false, error: 'Conversation not found' });
      }

      const messages = db.prepare('SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC').all(id);

      res.json({
        success: true,
        conversation: conv,
        messages
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 4. Explicit manual human handoff request
  router.post('/handoff', (req, res) => {
    try {
      const { conversation_id, lead_id, reason } = req.body;
      const conv = db.prepare('SELECT * FROM conversations WHERE id = ?').get(conversation_id);
      if (!conv) {
        return res.status(404).json({ success: false, error: 'Conversation not found' });
      }

      const exec = agent.assignSalesExecutive(lead_id || conv.lead_id);
      const handoffNote = reason || 'Buyer requested human sales executive via quick action.';

      db.prepare(`
        UPDATE conversations
        SET handoff_requested = 1,
            handoff_reason = ?,
            flagged_for_review = 1,
            ai_summary = COALESCE(ai_summary, '') || '\n- ' || ?
        WHERE id = ?
      `).run(handoffNote, `Manual handoff triggered: ${handoffNote}`, conversation_id);

      // Record system/assistant response
      const lang = conv.language || 'en';
      const text = lang === 'gu'
        ? `આપની વિનંતી સ્વીકારવામાં આવી છે. અમારા સિનિયર સેલ્સ સ્પેશિયાલિસ્ટ ${exec.name} ટૂંક સમયમાં આપનો સંપર્ક કરશે.`
        : (lang === 'hi'
          ? `आपका अनुरोध स्वीकार कर लिया गया है। हमारे सीनियर सेल्स स्पेशलिस्ट ${exec.name} शीघ्र ही आपसे संपर्क करेंगे।`
          : `Your request has been forwarded. Senior Sales Specialist ${exec.name} will connect with you shortly.`);

      db.prepare(`
        INSERT INTO messages (id, conversation_id, sender, text, language, tool_called, tool_result, created_at)
        VALUES (?, ?, 'assistant', ?, ?, 'request_human_handoff', ?, datetime('now'))
      `).run(
        'msg-handoff-' + Date.now(),
        conversation_id,
        text,
        lang,
        JSON.stringify({ assigned_to: exec.name, phone: exec.phone, manual: true })
      );

      res.json({
        success: true,
        assigned_to: exec,
        message: text
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 5. Flagged chats list for Sales Head daily review
  router.get('/flagged', (req, res) => {
    try {
      const flagged = db.prepare(`
        SELECT c.*, p.name AS project_name, l.name AS lead_name, l.phone AS lead_phone,
               u.name AS assigned_to_name,
               (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id) AS message_count
        FROM conversations c
        LEFT JOIN projects p ON c.project_id = p.id
        LEFT JOIN leads l ON c.lead_id = l.id
        LEFT JOIN users u ON l.assigned_to_id = u.id
        WHERE c.flagged_for_review = 1 OR c.handoff_requested = 1
        ORDER BY c.last_activity DESC
      `).all();

      res.json({ success: true, count: flagged.length, data: flagged });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  return router;
}

export default createChatRouter;
