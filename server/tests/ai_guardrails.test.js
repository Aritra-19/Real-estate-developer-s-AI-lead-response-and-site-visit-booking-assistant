import test from 'node:test';
import assert from 'node:assert/strict';
import { initDatabase } from '../src/db/schema.js';
import { RealEstateAIAgent } from '../src/ai/agent.js';
import { checkGuardrails } from '../src/ai/guardrails.js';
import { detectLanguage } from '../src/ai/multilingual.js';

test('AI Assistant detects Gujarati and Hindi languages correctly', () => {
  assert.equal(detectLanguage('નમસ્તે, મારે 3 BHK ફ્લેટ જોવો છે'), 'gu');
  assert.equal(detectLanguage('नमस्ते, मुझे 2 BHK फ्लैट की जानकारी चाहिए'), 'hi');
  assert.equal(detectLanguage('Hello, what is the price for 3 BHK?'), 'en');
});

test('AI Guardrails strictly block unauthorized price discounts', () => {
  const g1 = checkGuardrails('Can you give me 10% discount on 3 BHK?', 'en');
  assert.equal(g1.triggered, true);
  assert.equal(g1.type, 'DISCOUNT_NEGOTIATION_REFUSAL');

  const g2 = checkGuardrails('શું ભાવમાં કંઈક ડિસ્કાઉન્ટ મળશે?', 'gu');
  assert.equal(g2.triggered, true);
  assert.equal(g2.type, 'DISCOUNT_NEGOTIATION_REFUSAL');
});

test('AI Guardrails immediately trigger human handoff when requested', () => {
  const g = checkGuardrails('I want to talk to a human salesperson', 'en');
  assert.equal(g.triggered, true);
  assert.equal(g.type, 'HUMAN_HANDOFF_REQUESTED');
});

test('AI Assistant queries facts from project fact sheet and refuses missing facts', async () => {
  const db = initDatabase();
  const agent = new RealEstateAIAgent(db);

  const convId = 'test-conv-' + Date.now();
  db.prepare(`
    INSERT INTO conversations (id, project_id, language) VALUES (?, 'proj-1', 'en')
  `).run(convId);

  // 1. Valid Fact Sheet Query: Price
  const priceRes = await agent.processMessage({
    conversationId: convId,
    projectId: 'proj-1',
    text: 'What is the price of 3 BHK?'
  });
  assert.ok(priceRes.text.includes('₹95 Lakh') || priceRes.text.includes('1.20 Crore'));
  assert.ok(priceRes.text.includes('RERA'));

  // 2. Missing Fact Query: Demolishing internal walls
  const missingRes = await agent.processMessage({
    conversationId: convId,
    projectId: 'proj-1',
    text: 'Can I break the RCC shear wall to join flat 301 and 302 together?'
  });
  assert.equal(missingRes.tool_called, 'request_human_handoff');
  assert.ok(missingRes.text.includes('not specified in the sales head’s approved fact sheet'));

  // Verify conversation was flagged for review
  const conv = db.prepare('SELECT flagged_for_review, handoff_requested FROM conversations WHERE id = ?').get(convId);
  assert.equal(conv.flagged_for_review, 1);
  assert.equal(conv.handoff_requested, 1);
});
