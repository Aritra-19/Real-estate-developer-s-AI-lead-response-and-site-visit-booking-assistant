/**
 * Multilingual resources and helpers for English, Hindi, and Gujarati.
 */

export const STRINGS = {
  en: {
    welcome: (projectName) => `Namaste! Welcome to ${projectName}. I am your AI concierge. How can I help you find your dream home today?`,
    ask_needs: 'Are you looking for a 2 BHK or a 3 BHK residence?',
    ask_budget: 'What budget range do you have in mind for your investment?',
    handoff_confirmation: (execName) => `I have connected you with ${execName}, our Senior Sales Specialist. They will review our chat history and reach out to you shortly.`,
    missing_fact: 'This specific detail is not specified in the sales head’s approved fact sheet. A sales executive will confirm this with you directly.',
    slot_header: 'Here are the upcoming open site-visit slots at our project experience center:',
    booking_success: (date, time, exec) => `🎉 Your site visit has been booked for ${date} at ${time}. Sales Executive ${exec} will personally guide your walkthrough. Location pin and calendar invite have been sent!`,
    rera_tag: (rera) => `[RERA: ${rera}]`,
    dpdp_notice: 'Your contact details are protected under the Digital Personal Data Protection (DPDP) Act 2023 and will only be used for site visit coordination.'
  },
  hi: {
    welcome: (projectName) => `नमस्ते! ${projectName} में आपका स्वागत है। मैं आपका AI सहायक हूँ। आज आपके सपनों के घर की खोज में मैं आपकी क्या मदद कर सकता हूँ?`,
    ask_needs: 'क्या आप 2 BHK या 3 BHK घर की तलाश में हैं?',
    ask_budget: 'आपके मन में निवेश के लिए क्या बजट सीमा है?',
    handoff_confirmation: (execName) => `मैंने आपको हमारे सीनियर सेल्स स्पेशलिस्ट ${execName} से जोड़ दिया है। वे हमारे चैट इतिहास की समीक्षा करके शीघ्र ही आपसे संपर्क करेंगे।`,
    missing_fact: 'यह विशिष्ट विवरण स्वीकृत फैक्ट शीट में उपलब्ध नहीं है। हमारे सेल्स एग्जीक्यूटिव सीधे आपसे पुष्टि करेंगे।',
    slot_header: 'हमारे प्रोजेक्ट एक्सपीरियंस सेंटर के लिए आगामी उपलब्ध साइट-विज़िट स्लॉट निम्नलिखित हैं:',
    booking_success: (date, time, exec) => `🎉 आपकी साइट विज़िट ${date} को ${time} बजे के लिए सफलतापूर्वक बुक कर दी गई है। सेल्स एग्जीक्यूटिव ${exec} व्यक्तिगत रूप से आपका मार्गदर्शन करेंगे। लोकेशन पिन भेज दिया गया है!`,
    rera_tag: (rera) => `[RERA: ${rera}]`,
    dpdp_notice: 'आपका संपर्क विवरण DPDP अधिनियम 2023 के तहत सुरक्षित है और इसका उपयोग केवल साइट विज़िट समन्वय के लिए किया जाएगा।'
  },
  gu: {
    welcome: (projectName) => `નમસ્તે! ${projectName} માં આપનું હાર્દિક સ્વાગત છે. હું આપનો AI આસિસ્ટન્ટ છું. આજે આપના સપનાના ઘરની શોધમાં હું આપને કેવી રીતે મદદ કરી શકું?`,
    ask_needs: 'આપ 2 BHK કે 3 BHK ઘર શોધી રહ્યા છો?',
    ask_budget: 'આપનું અંદાજિત બજેટ કેટલું છે?',
    handoff_confirmation: (execName) => `મેં આપને અમારા સિનિયર સેલ્સ સ્પેશિયાલિસ્ટ ${execName} સાથે જોડી દીધા છે. તેઓ આપણી ચેટ જોઈને ટૂંક સમયમાં આપનો સંપર્ક કરશે.`,
    missing_fact: 'આ વિગત સત્તાવાર ફેક્ટ શીટમાં ઉપલબ્ધ નથી. અમારા સેલ્સ એક્ઝિક્યુટિવ આપની સાથે સીધી પુષ્ટિ કરશે.',
    slot_header: 'અમારા પ્રોજેક્ટ એક્સપિરિયન્સ સેન્ટર માટે ઉપલબ્ધ સાઇટ વિઝિટ સ્લોટ્સ નીચે મુજબ છે:',
    booking_success: (date, time, exec) => `🎉 આપની સાઇટ વિઝિટ ${date} ના રોજ ${time} વાગ્યે સફળતાપૂર્વક બુક થઈ ગઈ છે. સેલ્સ એક્ઝિક્યુટિવ ${exec} આપનું સ્વાગત કરશે. લોકેશન પિન મોકલી દેવામાં આવ્યો છે!`,
    rera_tag: (rera) => `[RERA: ${rera}]`,
    dpdp_notice: 'આપની સંપર્ક વિગતો DPDP એક્ટ 2023 હેઠળ સુરક્ષિત છે અને ફક્ત સાઇટ વિઝિટ માટે જ ઉપયોગમાં લેવાશે.'
  }
};

export function detectLanguage(text) {
  if (!text) return 'en';
  // Check for Gujarati script range (\u0A80-\u0AFF)
  if (/[\u0A80-\u0AFF]/.test(text)) {
    return 'gu';
  }
  // Check for Devanagari / Hindi script range (\u0900-\u097F)
  if (/[\u0900-\u097F]/.test(text)) {
    return 'hi';
  }
  return 'en';
}
