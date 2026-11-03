import React, { useState, useEffect } from 'react';
import { 
  UserCheck, MessageSquare, Phone, Calendar, Clock, MapPin, 
  CheckCircle2, XCircle, AlertCircle, Send, Sparkles, Bell
} from 'lucide-react';
import api from '../services/api';

export default function SalesExecutiveView({ activeLead, onSelectLead }) {
  const [assignedLeads, setAssignedLeads] = useState([]);
  const [selectedLead, setSelectedLead] = useState(activeLead || null);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [siteVisits, setSiteVisits] = useState([]);
  const [salesNotes, setSalesNotes] = useState('');
  const [updating, setUpdating] = useState(false);
  const [notificationStatus, setNotificationStatus] = useState(null);

  // Fetch leads assigned to sales executives
  useEffect(() => {
    async function load() {
      try {
        const res = await api.getLeads();
        if (res.success) {
          // Show leads assigned to executive (or all leads if not filtered)
          setAssignedLeads(res.data);
          if (!selectedLead && res.data.length > 0) {
            setSelectedLead(res.data[0]);
          }
        }
      } catch (err) {
        console.error('Failed to load executive leads:', err);
      }
    }
    load();
  }, []);

  // When selected lead changes, load their conversation & visit records
  useEffect(() => {
    if (!selectedLead) return;

    setSalesNotes(selectedLead.notes || '');

    async function loadLeadDetails() {
      try {
        // Fetch visits
        const visitsRes = await api.getVisits();
        if (visitsRes.success) {
          const leadVisits = visitsRes.data.filter((v) => v.lead_id === selectedLead.id);
          setSiteVisits(leadVisits);
        }

        // Fetch conversation if available
        const convRes = await api.startChat({
          lead_id: selectedLead.id,
          project_id: selectedLead.project_id
        });
        if (convRes.success) {
          setConversation(convRes.conversation);
          setMessages(convRes.messages || []);
        }
      } catch (err) {
        console.error('Error loading lead detail:', err);
      }
    }

    loadLeadDetails();
  }, [selectedLead?.id]);

  const handleUpdateStatus = async (newStatus) => {
    if (!selectedLead) return;
    setUpdating(true);
    try {
      await api.updateLead(selectedLead.id, { visit_status: newStatus });
      setSelectedLead((prev) => ({ ...prev, visit_status: newStatus }));

      // Also update matching site visit if exists
      if (siteVisits.length > 0) {
        await api.updateVisitStatus(siteVisits[0].id, newStatus, salesNotes);
        setSiteVisits((prev) => prev.map((v) => ({ ...v, status: newStatus })));
      }
    } catch (err) {
      console.error('Update status error:', err);
    } finally {
      setUpdating(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedLead) return;
    setUpdating(true);
    try {
      await api.updateLead(selectedLead.id, { notes: salesNotes });
      setSelectedLead((prev) => ({ ...prev, notes: salesNotes }));
    } catch (err) {
      console.error('Save notes error:', err);
    } finally {
      setUpdating(false);
    }
  };

  const handleTriggerReminder = async (type) => {
    if (siteVisits.length === 0) return;
    try {
      const res = await api.triggerReminder(siteVisits[0].id, type);
      if (res.success) {
        setNotificationStatus(`Simulated ${type === 'reminder_2h' ? '2-Hour' : '24-Hour'} WhatsApp reminder sent to ${selectedLead.phone}!`);
        setTimeout(() => setNotificationStatus(null), 5000);
      }
    } catch (err) {
      console.error('Reminder error:', err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-stone-200">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-emerald-800 font-semibold block">
            Sales Executive Cockpit • Host Portal
          </span>
          <h2 className="text-3xl font-serif text-stone-900 font-normal">
            Assigned Leads & Scheduled Walkthroughs
          </h2>
          <p className="text-stone-500 text-xs mt-0.5">
            Active Host: <strong>Rajesh Mehta</strong> (Senior Sales Executive)
          </p>
        </div>
      </div>

      {notificationStatus && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center gap-2">
          <Bell className="w-4 h-4 text-emerald-700" />
          <span>{notificationStatus}</span>
        </div>
      )}

      {/* Main 2 Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Assigned Leads List */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden flex flex-col h-[750px]">
          <div className="p-4 border-b border-stone-200 bg-stone-50 text-xs font-mono uppercase text-stone-600 flex justify-between items-center">
            <span>MY ASSIGNED LEADS ({assignedLeads.length})</span>
            <span className="text-[10px] text-emerald-700 font-bold">SORTED BY URGENCY</span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-stone-100">
            {assignedLeads.map((lead) => {
              const isSelected = selectedLead?.id === lead.id;
              return (
                <button
                  key={lead.id}
                  onClick={() => setSelectedLead(lead)}
                  className={`w-full p-4 text-left transition-colors flex flex-col gap-1.5 ${
                    isSelected ? 'bg-emerald-50/80 border-l-4 border-emerald-600' : 'hover:bg-stone-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-stone-900 text-sm">{lead.name}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-mono font-medium ${
                        lead.visit_status === 'Visited'
                          ? 'bg-teal-100 text-teal-800'
                          : lead.visit_status === 'Booked'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-stone-100 text-stone-600'
                      }`}
                    >
                      {lead.visit_status}
                    </span>
                  </div>

                  <div className="text-xs text-stone-500 font-mono flex items-center gap-2">
                    <span>{lead.phone}</span>
                    <span>•</span>
                    <span className="text-stone-700">{lead.wants}</span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-stone-400 mt-1">
                    <span>{lead.source}</span>
                    <span className="text-emerald-700 font-medium">AI responded in {lead.first_response_time_seconds || 45}s</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right 2 Columns: Lead Intelligence, AI Summary & Chat Transcript */}
        {selectedLead ? (
          <div className="lg:col-span-2 space-y-6">
            {/* Lead Profile & Quick Actions Card */}
            <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-stone-100">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-serif font-medium text-stone-900">{selectedLead.name}</h3>
                    <span className="text-xs font-mono bg-stone-100 px-2 py-0.5 rounded text-stone-600">
                      {selectedLead.id}
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Source: <strong>{selectedLead.source}</strong> • Project: <strong>{selectedLead.project_name || 'Project 1'}</strong>
                  </p>
                </div>

                {/* Direct WhatsApp Call Link */}
                <div className="flex items-center gap-2">
                  <a
                    href={`https://wa.me/${selectedLead.phone.replace(/[^\d]/g, '')}?text=Hello%20${encodeURIComponent(selectedLead.name)},%20this%20is%20Rajesh%20Mehta%20from%20Company%20A.%20Following%20up%20on%20your%20site%20walkthrough%20enquiry.`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>WhatsApp Direct</span>
                  </a>
                </div>
              </div>

              {/* AI-Generated Lead Qualification Summary */}
              <div className="bg-emerald-950 text-emerald-100 rounded-xl p-4 border border-emerald-900/60 space-y-2">
                <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 uppercase font-semibold">
                  <Sparkles className="w-4 h-4" />
                  <span>AI Executive Summary of Inbound Conversation</span>
                </div>
                <p className="text-xs text-emerald-200/90 leading-relaxed font-light whitespace-pre-line">
                  {conversation?.ai_summary ||
                    `• Buyer expressed serious interest in ${selectedLead.wants}. Budget: ${selectedLead.budget_range || '₹1.0 - ₹1.2 Cr'}.\n• Inquired regarding possession date, bank loan approvals, and sample flat.\n• First response completed within ${selectedLead.first_response_time_seconds || 45} seconds.`}
                </p>
              </div>

              {/* Site Visit Status Action Toolbar */}
              <div>
                <label className="block text-xs font-mono uppercase text-stone-500 mb-2 font-medium">
                  Update Walkthrough Status
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  {['Booked', 'Visited', 'No-show', 'Rescheduled'].map((st) => (
                    <button
                      key={st}
                      disabled={updating}
                      onClick={() => handleUpdateStatus(st)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        selectedLead.visit_status === st
                          ? 'bg-stone-900 text-white shadow-sm'
                          : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                      }`}
                    >
                      {st}
                    </button>
                  ))}

                  {/* Trigger Reminder button */}
                  {siteVisits.length > 0 && (
                    <div className="ml-auto flex items-center gap-2">
                      <button
                        onClick={() => handleTriggerReminder('reminder_24h')}
                        className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-medium"
                      >
                        Send 24h Reminder
                      </button>
                      <button
                        onClick={() => handleTriggerReminder('reminder_2h')}
                        className="px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-lg text-xs font-medium"
                      >
                        Send 2h Reminder
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Executive Notes */}
              <div>
                <label className="block text-xs font-mono uppercase text-stone-500 mb-1 font-medium">
                  Sales Meeting Notes
                </label>
                <div className="flex gap-2">
                  <textarea
                    rows={2}
                    value={salesNotes}
                    onChange={(e) => setSalesNotes(e.target.value)}
                    placeholder="Enter walkthrough observations, buyer family size, financing preference..."
                    className="flex-1 px-3 py-2 text-xs rounded-lg border border-stone-300 bg-stone-50 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                  <button
                    onClick={handleSaveNotes}
                    disabled={updating}
                    className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-medium self-end"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>

            {/* Chat Transcript Panel */}
            <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-emerald-700" />
                  <h4 className="font-serif font-medium text-base text-stone-900">
                    Full Inbound Chat Transcript
                  </h4>
                </div>
                <span className="text-xs font-mono text-stone-400">
                  Language: {conversation?.language?.toUpperCase() || 'EN'}
                </span>
              </div>

              <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1 text-xs">
                {messages.length === 0 ? (
                  <div className="text-center py-8 text-stone-400">No chat messages recorded yet.</div>
                ) : (
                  messages.map((m) => (
                    <div
                      key={m.id}
                      className={`p-3 rounded-xl leading-relaxed ${
                        m.sender === 'buyer'
                          ? 'bg-emerald-50 text-emerald-950 border border-emerald-200/80 ml-8'
                          : 'bg-stone-50 text-stone-800 border border-stone-200/80 mr-8'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] text-stone-400 mb-1">
                        <span className="font-semibold uppercase tracking-wider text-stone-600">
                          {m.sender === 'buyer' ? 'Prospective Home Buyer' : 'Company A AI Assistant'}
                        </span>
                        <span className="font-mono">
                          {m.created_at ? new Date(m.created_at).toLocaleTimeString() : ''}
                        </span>
                      </div>
                      <div className="whitespace-pre-line text-xs font-light">{m.text}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-2 bg-white rounded-2xl p-12 text-center text-stone-400 border border-stone-200">
            Select an assigned lead to inspect chat transcript and update site visit status.
          </div>
        )}
      </div>
    </div>
  );
}
