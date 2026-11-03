/**
 * Guardrail definitions & checks for Company A Real Estate AI Assistant.
 * Strict compliance with:
 * - Sales head fact sheet ground truth
 * - Zero unauthorized discount quotation
 * - RERA registration disclosure
 * - DPDP Act 2023 consent & opt-out rules
 */

export const DISCOUNT_KEYWORDS = [
  'discount', 'reduce price', 'cheaper', 'bargain', 'best offer', 'special rate',
  'cash discount', 'concession', 'kam karo', 'chhoot', 'kitna kam hoga',
  'ડિસ્કાઉન્ટ', 'ઓછો ભાવ', 'કંઈક ઓછું કરો', 'ભાવ ઓછો કરો', 'ડિસ્કાઉન્ટ મળશે'
];

export const HUMAN_HANDOFF_KEYWORDS = [
  'talk to human', 'talk to person', 'agent', 'sales executive', 'call me',
  'human', 'representative', 'real person', 'salesperson', 'manager',
  'baat karni hai', 'insaan se baat', 'executive se baat',
  'માણસ સાથે વાત', 'કોઈ વ્યક્તિ સાથે વાત', 'સેલ્સમેન', 'કોલ કરો'
];

export const SENSITIVE_PROHIBITED_TOPICS = [
  'black money', 'cash component', 'unapproved construction', 'illegal',
  'guaranteed rent', 'assured return', 'roi guarantee', 'commercial entrance'
];

export function checkGuardrails(userMessage, language = 'en') {
  const normalized = userMessage.toLowerCase();

  // 1. Check for Human Handoff Request
  const wantsHuman = HUMAN_HANDOFF_KEYWORDS.some(kw => normalized.includes(kw));
  if (wantsHuman) {
    return {
      triggered: true,
      type: 'HUMAN_HANDOFF_REQUESTED',
      reason: 'Buyer explicitly requested to speak with a human executive.'
    };
  }

  // 2. Check for Discount / Negotiation Attempt
  const wantsDiscount = DISCOUNT_KEYWORDS.some(kw => normalized.includes(kw));
  if (wantsDiscount) {
    return {
      triggered: true,
      type: 'DISCOUNT_NEGOTIATION_REFUSAL',
      reason: 'Buyer asked for discount or price negotiation.'
    };
  }

  // 3. Check for Prohibited / Speculative Claims
  const isProhibited = SENSITIVE_PROHIBITED_TOPICS.some(kw => normalized.includes(kw));
  if (isProhibited) {
    return {
      triggered: true,
      type: 'PROHIBITED_TOPIC',
      reason: 'Buyer asked about an unauthorized or speculative topic outside RERA disclosures.'
    };
  }

  return { triggered: false };
}

export function formatGuardrailResponse(type, language, project) {
  const reraNum = project?.rera_number || 'AUDA/RERA Registered';

  if (type === 'DISCOUNT_NEGOTIATION_REFUSAL') {
    if (language === 'gu') {
      return `કંપનીની પારદર્શક RERA નીતિ મુજબ, ચેટ પર કોઈ વિશેષ ડિસ્કાઉન્ટ કે અનઅધિકૃત ભાવ ઘટાડાની ઓફર કરવામાં આવતી નથી. ${project.name} માટે બેઝ ભાવ ₹${project.price_range} છે. વિશેષ ફેસ્ટિવ ઓફર અથવા ફ્લેક્સિબલ પેમેન્ટ પ્લાન માટે અમારા સિનિયર સેલ્સ એક્ઝિક્યુટિવ આપની સાથે સીધી મુલાકાત વખતે ચર્ચા કરશે. શું હું આપની સાઇટ વિઝિટ બુક કરું? (RERA: ${reraNum})`;
    } else if (language === 'hi') {
      return `कंपनी की पारदर्शी RERA नीति के अनुसार, चैट पर किसी भी अनधिकृत डिस्काउंट या कीमत में कटौती की पेशकश नहीं की जाती है। ${project.name} की बेस कीमत ${project.price_range} है। किसी भी विशेष योजना या कस्टमाइज़्ड पेमेंट प्लान पर चर्चा के लिए हमारे सीनियर सेल्स एग्जीक्यूटिव साइट विज़िट के दौरान आपसे सीधे बात करेंगे। क्या मैं आपके लिए साइट विज़िट बुक करूँ? (RERA: ${reraNum})`;
    } else {
      return `Under company policy and RERA transparency guidelines, our AI assistant cannot negotiate prices or offer ad-hoc discounts on chat. Base pricing for ${project.name} is ${project.price_range}. For milestone-based payment schedules or authorized festive benefits, Senior Sales Executive will assist you directly during your site walkthrough. Would you like to reserve a visit slot? (RERA: ${reraNum})`;
    }
  }

  if (type === 'PROHIBITED_TOPIC') {
    if (language === 'gu') {
      return `માફ કરશો, RERA નિયમો હેઠળ અમે ફક્ત સત્તાવાર અને માન્ય વિગતો જ આપી શકીએ છીએ. આ અંગે વધુ સ્પષ્ટતા માટે સેલ્સ હેડ આપનો સંપર્ક કરશે. (RERA: ${reraNum})`;
    } else if (language === 'hi') {
      return `क्षमा करें, RERA नियमों के तहत हम केवल स्वीकृत और प्रमाणित विवरण ही प्रदान कर सकते हैं। अधिक स्पष्टता के लिए हमारे सेल्स हेड आपसे संपर्क करेंगे। (RERA: ${reraNum})`;
    } else {
      return `In compliance with RERA regulations, all project representations strictly conform to AUDA-approved filings. We do not provide speculative claims. A sales manager can discuss this in detail with you. (RERA: ${reraNum})`;
    }
  }

  return null;
}
