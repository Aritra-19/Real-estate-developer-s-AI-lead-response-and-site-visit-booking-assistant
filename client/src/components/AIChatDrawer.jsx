import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Send, Bot, User, Phone, Sparkles, AlertTriangle, ShieldCheck, 
  Calendar, Check, UserCheck, Languages, ArrowDown
} from 'lucide-react';
import api from '../services/api';

export default function AIChatDrawer({
  isOpen,
  onClose,
  project,
  lead,
  initialQuestion,
  onVisitBooked
}) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversation, setConversation] = useState(null);
  const [language, setLanguage] = useState('en');
  const [isHandoff, setIsHandoff] = useState(false);
  const [assignedExecutive, setAssignedExecutive] = useState(null);
  const messagesEndRef = useRef(null);

  // Initialize conversation when opened
  useEffect(() => {
    if (!isOpen) return;

    async function init() {
      try {
        setLoading(true);
        const res = await api.startChat({
          lead_id: lead?.id || null,
          project_id: project.id,
          language
        });

        if (res.success) {
          setConversation(res.conversation);
          setMessages(res.messages || []);

          if (res.conversation.handoff_requested) {
            setIsHandoff(true);
          }

          // If there was an initial question from enquiry form, send it automatically!
          if (initialQuestion && (!res.messages || res.messages.length <= 1)) {
            setTimeout(() => {
              handleSend(initialQuestion, res.conversation.id);
            }, 400);
          }
        }
      } catch (err) {
        console.error('Failed to init chat:', err);
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [isOpen, project.id, lead?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (textToSend, convIdOverride) => {
    const text = textToSend || inputText;
    if (!text.trim() || loading) return;

    const convId = convIdOverride || conversation?.id;
    if (!convId) return;

    // Optimistically add buyer message
    const tempMsg = {
      id: 'temp-' + Date.now(),
      conversation_id: convId,
      sender: 'buyer',
      text,
      language,
      created_at: new Date().toISOString()
    };
    setMessages((prev) => [...prev, tempMsg]);
    setInputText('');
    setLoading(true);

    try {
      const res = await api.sendMessage({
        conversation_id: convId,
        lead_id: lead?.id || null,
        project_id: project.id,
        text,
        language
      });

      if (res.success) {
        setMessages((prev) => [...prev, res.reply]);
        if (res.conversation) {
          setConversation(res.conversation);
          if (res.conversation.handoff_requested) {
            setIsHandoff(true);
          }
        }

        // If a visit was booked via tool call, notify parent
        if (res.reply.tool_called === 'book_site_visit' && onVisitBooked) {
          onVisitBooked(res.reply.tool_result);
        }
      }
    } catch (err) {
      console.error('Send message error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: 'err-' + Date.now(),
          sender: 'assistant',
          text: 'We are experiencing high demand on the booking system. Please try again or tap Talk to Sales Executive.',
          created_at: new Date().toISOString()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleManualHandoff = async () => {
    if (!conversation) return;
    setLoading(true);
    try {
      const res = await api.requestHandoff({
        conversation_id: conversation.id,
        lead_id: lead?.id || null,
        reason: 'Buyer tapped Talk to Human Executive button.'
      });
      if (res.success) {
        setIsHandoff(true);
        setAssignedExecutive(res.assigned_to);
        setMessages((prev) => [
          ...prev,
          {
            id: 'handoff-' + Date.now(),
            sender: 'assistant',
            text: res.message,
            tool_called: 'request_human_handoff',
            tool_result: JSON.stringify(res.assigned_to),
            created_at: new Date().toISOString()
          }
        ]);
      }
    } catch (err) {
      console.error('Handoff error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLanguageChange = (newLang) => {
    setLanguage(newLang);
    let greeting = '';
    if (newLang === 'gu') {
      greeting = 'નમસ્તે! હવે આપ ગુજરાતીમાં પ્રશ્ન પૂછી શકો છો. કિંમત, ફ્લેટ સાઇઝ કે સાઇટ વિઝિટ વિશે પૂછો.';
    } else if (newLang === 'hi') {
      greeting = 'नमस्ते! अब आप हिंदी में पूछ सकते हैं। कीमत, फ्लैट के आकार या साइट विज़िट के बारे में पूछें।';
    } else {
      greeting = 'Welcome! You can now ask questions in English regarding pricing, amenities, or site visit bookings.';
    }

    setMessages((prev) => [
      ...prev,
      {
        id: 'lang-' + Date.now(),
        sender: 'assistant',
        text: greeting,
        language: newLang,
        created_at: new Date().toISOString()
      }
    ]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[480px] bg-stone-900 text-stone-100 shadow-2xl flex flex-col border-l border-stone-800 animate-in slide-in-from-right duration-300">
      {/* Drawer Header */}
      <div className="p-4 bg-stone-950 border-b border-stone-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-emerald-800/80 border border-emerald-600/50 flex items-center justify-center text-emerald-200">
              <Bot className="w-5 h-5 text-emerald-300" />
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 rounded-full ring-2 ring-stone-950"></span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h4 className="font-serif font-medium text-sm text-stone-100">{project.name} AI Concierge</h4>
              <span className="text-[10px] bg-emerald-950 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-800 font-mono">
                Verified Facts
              </span>
            </div>
            <p className="text-[11px] text-stone-400 flex items-center gap-1">
              <span>RERA: {project.rera_number.split('/')[4] || 'AUDA'}</span>
              <span>•</span>
              <span className="text-emerald-400">Response &lt; 2 min</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition-colors"
            title="Close Drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Language Switcher Bar */}
      <div className="px-4 py-2 bg-stone-900 border-b border-stone-800 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-stone-400">
          <Languages className="w-3.5 h-3.5 text-emerald-400" />
          <span>Language:</span>
        </div>
        <div className="flex items-center gap-1">
          {[
            { code: 'en', label: 'English' },
            { code: 'hi', label: 'हिंदी' },
            { code: 'gu', label: 'ગુજરાતી' }
          ].map((item) => (
            <button
              key={item.code}
              onClick={() => handleLanguageChange(item.code)}
              className={`px-2.5 py-1 rounded text-xs transition-colors ${
                language === item.code
                  ? 'bg-emerald-700 text-white font-medium'
                  : 'text-stone-400 hover:text-white hover:bg-stone-800'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Handoff Status Bar if human requested */}
      {isHandoff && (
        <div className="px-4 py-2 bg-amber-950/80 border-b border-amber-800/60 text-xs text-amber-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Routed to Sales Specialist with chat summary</span>
          </div>
          <span className="text-[10px] bg-amber-900 text-amber-100 px-2 py-0.5 rounded font-mono">PRIORITY</span>
        </div>
      )}

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-sm">
        {messages.map((msg) => {
          const isUser = msg.sender === 'buyer';
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 leading-relaxed ${
                  isUser
                    ? 'bg-emerald-700 text-white rounded-br-none shadow-md'
                    : 'bg-stone-800 text-stone-200 rounded-bl-none border border-stone-700/80 shadow-sm'
                }`}
              >
                {/* Text Content */}
                <div className="whitespace-pre-line">{msg.text}</div>

                {/* Tool Badges */}
                {msg.tool_called && (
                  <div className="mt-2.5 pt-2 border-t border-stone-700/60 text-[11px] font-mono flex items-center gap-1.5 text-emerald-400">
                    <Sparkles className="w-3 h-3 text-emerald-400" />
                    <span>
                      {msg.tool_called === 'check_available_slots' && 'Checked live slot availability'}
                      {msg.tool_called === 'book_site_visit' && 'Atomic site-visit reservation confirmed'}
                      {msg.tool_called === 'request_human_handoff' && 'Senior Executive assigned'}
                      {msg.tool_called === 'enforce_pricing_guardrail' && 'RERA pricing guardrail verified'}
                      {msg.tool_called === 'get_fact_sheet_info' && 'Ground truth fact sheet cited'}
                    </span>
                  </div>
                )}
              </div>

              {/* Timestamp */}
              <span className="text-[10px] text-stone-500 mt-1 px-1">
                {msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}
              </span>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-center gap-2 text-stone-400 text-xs py-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></div>
            <span>Checking official project fact sheet...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts Chips */}
      <div className="px-4 py-2 bg-stone-950/60 border-t border-stone-800 flex items-center gap-2 overflow-x-auto text-xs no-scrollbar">
        {[
          'What is the starting price?',
          'Book visit today at 11:30 AM',
          'Is sample flat ready?',
          'What is the RERA possession date?',
          'Can I get a discount?'
        ].map((chip, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(chip)}
            className="px-2.5 py-1 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700 whitespace-nowrap text-[11px] transition-colors"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Input Box & Action Bar */}
      <div className="p-3 bg-stone-950 border-t border-stone-800">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            placeholder={
              language === 'gu'
                ? 'અહીં પ્રશ્ન લખો (દા.ત. ભાવ, સ્લોટ બુકિંગ)...'
                : (language === 'hi'
                  ? 'यहाँ सवाल लिखें (जैसे कीमत, विज़िट स्लॉट)...'
                  : 'Ask about pricing, amenities, or site visit slots...')
            }
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 px-3.5 py-2.5 rounded-xl bg-stone-900 border border-stone-700 text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder-stone-500"
          />

          <button
            type="submit"
            disabled={!inputText.trim() || loading}
            className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white transition-colors"
            title="Send Message"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

        {/* Footer actions: Human Handoff button */}
        <div className="flex items-center justify-between pt-2 px-1 text-[11px] text-stone-400">
          <button
            type="button"
            onClick={handleManualHandoff}
            className="text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Connect to Sales Executive</span>
          </button>

          <span className="text-stone-500 font-mono">DPDP Consent Active</span>
        </div>
      </div>
    </div>
  );
}
