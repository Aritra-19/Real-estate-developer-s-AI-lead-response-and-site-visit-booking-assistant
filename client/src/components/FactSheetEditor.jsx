import React, { useState, useEffect } from 'react';
import { 
  BookOpen, ShieldCheck, Save, Sparkles, CheckCircle2, AlertTriangle, 
  Plus, Trash2, Send, RefreshCw, HelpCircle
} from 'lucide-react';
import api from '../services/api';

export default function FactSheetEditor({ projects, selectedProject, onProjectChange }) {
  const [currentProject, setCurrentProject] = useState(selectedProject || projects[0]);
  const [factSheet, setFactSheet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form states
  const [pricingPolicy, setPricingPolicy] = useState('');
  const [approvedAmenities, setApprovedAmenities] = useState([]);
  const [prohibitedClaims, setProhibitedClaims] = useState('');
  const [paymentPlans, setPaymentPlans] = useState([]);
  const [newAmenity, setNewAmenity] = useState('');

  // Built-in Live AI Test Sandbox state
  const [testQuestion, setTestQuestion] = useState('What amenities are included in the project?');
  const [testResponse, setTestResponse] = useState(null);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    async function load() {
      if (!currentProject) return;
      try {
        setLoading(true);
        const res = await api.getFactSheet(currentProject.id);
        if (res.success) {
          setFactSheet(res.fact_sheet);
          setPricingPolicy(res.fact_sheet.pricing_policy || '');
          setApprovedAmenities(res.fact_sheet.approved_amenities || []);
          setProhibitedClaims(res.fact_sheet.prohibited_claims || '');
          setPaymentPlans(res.fact_sheet.payment_plans || []);
        }
      } catch (err) {
        console.error('Error loading fact sheet:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [currentProject?.id]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);

    try {
      const res = await api.updateFactSheet(currentProject.id, {
        pricing_policy: pricingPolicy,
        approved_amenities: approvedAmenities,
        prohibited_claims: prohibitedClaims,
        payment_plans: paymentPlans
      });

      if (res.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 4000);
      }
    } catch (err) {
      console.error('Save error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleAddAmenity = () => {
    if (!newAmenity.trim()) return;
    setApprovedAmenities([...approvedAmenities, newAmenity.trim()]);
    setNewAmenity('');
  };

  const handleRemoveAmenity = (index) => {
    setApprovedAmenities(approvedAmenities.filter((_, i) => i !== index));
  };

  const handleRunAiTest = async () => {
    if (!testQuestion.trim()) return;
    setTesting(true);
    try {
      // Create temporary test chat to verify facts
      const convRes = await api.startChat({ project_id: currentProject.id });
      if (convRes.success) {
        const replyRes = await api.sendMessage({
          conversation_id: convRes.conversation.id,
          project_id: currentProject.id,
          text: testQuestion,
          language: 'en'
        });
        if (replyRes.success) {
          setTestResponse(replyRes.reply);
        }
      }
    } catch (err) {
      console.error('AI Test error:', err);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-stone-200">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-emerald-800 font-semibold block">
            Sales Head Knowledge Base • Ground Truth Editor
          </span>
          <h2 className="text-3xl font-serif text-stone-900 font-normal">
            Project Fact Sheet & Guardrails
          </h2>
          <p className="text-stone-500 text-xs mt-0.5">
            The AI assistant answers strictly from this verified source of truth. Updates reflect in real time.
          </p>
        </div>

        {/* Project Switcher */}
        <div className="flex items-center gap-2">
          {projects.map((p) => (
            <button
              key={p.id}
              onClick={() => setCurrentProject(p)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                currentProject?.id === p.id
                  ? 'bg-stone-900 text-white shadow-sm'
                  : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-50'
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {saveSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>
            Fact sheet successfully updated! The AI assistant has instantly synced the new policies.
          </span>
        </div>
      )}

      {/* Main Grid: Editor on Left, Live AI Test Sandbox on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Editor Form (2 columns) */}
        <form onSubmit={handleSave} className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm space-y-5">
            {/* RERA Disclosure Box */}
            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/80 text-xs flex items-center justify-between">
              <div>
                <span className="text-stone-400 font-mono text-[10px] block">RERA REGISTRATION NUMBER</span>
                <span className="font-semibold text-stone-900 font-mono">{currentProject?.rera_number}</span>
              </div>
              <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[11px] font-mono">
                AUDA Compliant
              </span>
            </div>

            {/* Pricing Policy & Guardrail Rules */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-mono uppercase text-stone-700 font-semibold">
                  Official Pricing Policy & Discount Guardrail
                </label>
                <span className="text-[10px] text-rose-700 font-mono">Strict Rule: Zero Ad-hoc Discounts</span>
              </div>
              <textarea
                rows={3}
                value={pricingPolicy}
                onChange={(e) => setPricingPolicy(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-300 bg-stone-50 focus:outline-none focus:ring-2 focus:ring-emerald-600 font-light leading-relaxed"
                placeholder="Specify the exact pricing rules, starting price, and discount refusal instructions..."
              />
              <p className="text-[11px] text-stone-400 mt-1">
                If a buyer asks for discounts or cash reductions, AI strictly quotes base price and refuses chat negotiation.
              </p>
            </div>

            {/* Approved Amenities List */}
            <div>
              <label className="block text-xs font-mono uppercase text-stone-700 font-semibold mb-2">
                Approved Amenities List
              </label>

              <div className="space-y-2 mb-3">
                {approvedAmenities.map((amenity, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-stone-50 border border-stone-200 text-xs"
                  >
                    <span>{amenity}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveAmenity(idx)}
                      className="text-stone-400 hover:text-rose-600 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add Amenity Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Italian Marble entrance foyer, Solar powered common lights..."
                  value={newAmenity}
                  onChange={(e) => setNewAmenity(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs rounded-lg border border-stone-300 bg-stone-50"
                />
                <button
                  type="button"
                  onClick={handleAddAmenity}
                  className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-medium flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </div>
            </div>

            {/* Prohibited Topics / Negative Constraints */}
            <div>
              <div className="flex items-center gap-1.5 text-amber-800 text-xs font-mono uppercase font-semibold mb-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Prohibited Claims & Out-of-Scope Topics</span>
              </div>
              <textarea
                rows={2}
                value={prohibitedClaims}
                onChange={(e) => setProhibitedClaims(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-amber-300 bg-amber-50/40 focus:outline-none focus:ring-2 focus:ring-amber-600 font-light leading-relaxed"
                placeholder="Topics the AI must never confirm (e.g. Wall modifications, rental guarantees, commercial access)..."
              />
              <p className="text-[11px] text-stone-400 mt-1">
                If asked about missing or unapproved claims, the AI states: "A person will confirm" and triggers human handoff.
              </p>
            </div>

            {/* Save Button */}
            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-xl text-xs font-medium flex items-center gap-2 transition-colors shadow-sm"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Syncing to AI...' : 'Save & Sync Fact Sheet to AI'}</span>
              </button>
            </div>
          </div>
        </form>

        {/* Live AI Fact Sheet Verification Sandbox */}
        <div className="space-y-4">
          <div className="bg-stone-900 text-stone-100 rounded-2xl p-6 border border-stone-800 shadow-sm space-y-4 sticky top-24">
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 uppercase font-semibold">
              <Sparkles className="w-4 h-4" />
              <span>Live AI Fact Verification Sandbox</span>
            </div>

            <p className="text-xs text-stone-400 leading-relaxed">
              Test how the AI assistant interprets the fact sheet you just edited. Type any question below.
            </p>

            <div className="space-y-2">
              <input
                type="text"
                value={testQuestion}
                onChange={(e) => setTestQuestion(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg bg-stone-800 border border-stone-700 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Ask the bot a question..."
              />

              <button
                type="button"
                onClick={handleRunAiTest}
                disabled={testing}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{testing ? 'Querying Knowledge Base...' : 'Test AI Retrieval'}</span>
              </button>
            </div>

            {/* AI Test Output */}
            {testResponse && (
              <div className="p-3.5 rounded-xl bg-stone-800/80 border border-stone-700 space-y-2 text-xs">
                <div className="flex items-center justify-between text-[10px] text-stone-400 font-mono">
                  <span>AI VERIFIED OUTPUT</span>
                  <span className="text-emerald-400">Tool: {testResponse.tool_called || 'fact_retrieval'}</span>
                </div>
                <p className="text-stone-200 leading-relaxed font-light whitespace-pre-line">
                  {testResponse.text}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
