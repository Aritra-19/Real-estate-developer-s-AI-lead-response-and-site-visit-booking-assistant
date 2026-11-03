import React, { useState, useEffect } from 'react';
import { 
  Users, Search, Filter, Copy, GitMerge, AlertCircle, CheckCircle2, 
  Clock, Plus, Phone, Mail, Building, ArrowRight, ExternalLink, RefreshCw
} from 'lucide-react';
import api from '../services/api';

export default function LeadsManager({ onSelectLead }) {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [duplicatesOnly, setDuplicatesOnly] = useState(false);
  
  // Merge Modal state
  const [mergeTarget, setMergeTarget] = useState(null);
  const [merging, setMerging] = useState(false);

  // Inbound Simulator Modal state
  const [showSimulator, setShowSimulator] = useState(false);
  const [simForm, setSimForm] = useState({
    name: 'Hardik Patel',
    phone: '+91 98250 11001',
    email: 'hardik.patel@gujaratchem.com',
    source: 'Social media ad',
    project_id: 'proj-1',
    wants: '3 BHK'
  });
  const [duplicateCheckResult, setDuplicateCheckResult] = useState(null);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const filters = {};
      if (sourceFilter) filters.source = sourceFilter;
      if (statusFilter) filters.status = statusFilter;
      if (searchTerm) filters.search = searchTerm;
      if (duplicatesOnly) filters.duplicates_only = 'true';

      const res = await api.getLeads(filters);
      if (res.success) {
        setLeads(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch leads:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [sourceFilter, statusFilter, searchTerm, duplicatesOnly]);

  const handleDuplicateCheck = async (phone, email) => {
    if (!phone && !email) return;
    try {
      const res = await api.checkDuplicate(phone, email);
      if (res.success) {
        setDuplicateCheckResult(res);
      }
    } catch (err) {
      console.error('Check duplicate error:', err);
    }
  };

  const handleSimulateInbound = async (e) => {
    e.preventDefault();
    try {
      const res = await api.createLead({
        ...simForm,
        dpdp_consent: 1
      });
      if (res.success) {
        setShowSimulator(false);
        fetchLeads();
      }
    } catch (err) {
      console.error('Simulate lead error:', err);
    }
  };

  const handleMergeLeads = async (primaryId, duplicateId) => {
    setMerging(true);
    try {
      const res = await api.mergeLeads(primaryId, duplicateId);
      if (res.success) {
        setMergeTarget(null);
        fetchLeads();
      }
    } catch (err) {
      console.error('Merge error:', err);
    } finally {
      setMerging(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-stone-200">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-emerald-800 font-semibold block">
            Centralized Inbound CRM • Deduplication Engine
          </span>
          <h2 className="text-3xl font-serif text-stone-900 font-normal">
            Unified Leads Directory
          </h2>
          <p className="text-stone-500 text-xs mt-0.5">
            Single view for Property Portals, Meta Ads, Website, and Hoarding phone enquiries.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowSimulator(true)}
            className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-medium flex items-center gap-2 transition-all shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Simulate Inbound Webhook</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by buyer name, phone (+91...), ID, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-stone-50"
          />
        </div>

        {/* Source Dropdown */}
        <div className="flex items-center gap-2">
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-stone-300 bg-stone-50 focus:outline-none focus:ring-2 focus:ring-emerald-600"
          >
            <option value="">All Sources</option>
            <option value="Property portal">Property portal</option>
            <option value="Social media ad">Social media ad</option>
            <option value="Website">Website</option>
            <option value="Hoarding call">Hoarding call</option>
          </select>

          {/* Status Dropdown */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-stone-300 bg-stone-50 focus:outline-none focus:ring-2 focus:ring-emerald-600"
          >
            <option value="">All Visit Statuses</option>
            <option value="Booked">Booked</option>
            <option value="Visited">Visited</option>
            <option value="Not booked">Not booked</option>
            <option value="No-show">No-show</option>
          </select>

          {/* Duplicates Only Toggle */}
          <button
            onClick={() => setDuplicatesOnly(!duplicatesOnly)}
            className={`px-3 py-2 rounded-xl border flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              duplicatesOnly
                ? 'bg-amber-100 border-amber-300 text-amber-900 font-semibold'
                : 'bg-stone-50 border-stone-300 text-stone-700 hover:bg-stone-100'
            }`}
          >
            <GitMerge className="w-3.5 h-3.5" />
            <span>Duplicates Only</span>
          </button>
        </div>
      </div>

      {/* Leads Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-xs text-stone-400">Loading unified lead records...</div>
        ) : leads.length === 0 ? (
          <div className="py-12 text-center text-xs text-stone-400">No leads found matching current filter criteria.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-mono uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Lead ID</th>
                  <th className="py-3 px-4">Name & Contact</th>
                  <th className="py-3 px-4">Source Tag</th>
                  <th className="py-3 px-4">Project</th>
                  <th className="py-3 px-4">Preferences</th>
                  <th className="py-3 px-4">Visit Status</th>
                  <th className="py-3 px-4">Assigned To</th>
                  <th className="py-3 px-4">AI Response</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {leads.map((lead) => {
                  const isDup = lead.is_duplicate === 1;

                  return (
                    <tr
                      key={lead.id}
                      className={`hover:bg-stone-50/70 transition-colors ${
                        isDup ? 'bg-amber-50/40' : ''
                      }`}
                    >
                      {/* ID with Duplicate Badge */}
                      <td className="py-3.5 px-4 font-mono font-medium text-stone-900">
                        <div>{lead.id}</div>
                        {isDup && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded font-mono mt-0.5 font-semibold">
                            <GitMerge className="w-2.5 h-2.5" />
                            <span>Dup of {lead.duplicate_of_id}</span>
                          </span>
                        )}
                      </td>

                      {/* Name & Phone */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-stone-900">{lead.name}</div>
                        <div className="text-stone-500 font-mono text-[11px]">{lead.phone}</div>
                        {lead.email && <div className="text-stone-400 text-[10px]">{lead.email}</div>}
                      </td>

                      {/* Source */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-mono uppercase font-medium ${
                            lead.source === 'Property portal'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : lead.source === 'Social media ad'
                              ? 'bg-purple-50 text-purple-700 border border-purple-200'
                              : lead.source === 'Website'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {lead.source}
                        </span>
                      </td>

                      {/* Project */}
                      <td className="py-3.5 px-4 font-medium text-stone-800">
                        {lead.project_name || 'Project 1'}
                      </td>

                      {/* Wants / Budget */}
                      <td className="py-3.5 px-4">
                        <div className="text-stone-800">{lead.wants}</div>
                        <div className="text-stone-500 text-[11px] font-mono">{lead.budget_range || 'Standard'}</div>
                      </td>

                      {/* Visit Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium ${
                            lead.visit_status === 'Visited'
                              ? 'bg-teal-100 text-teal-800'
                              : lead.visit_status === 'Booked'
                              ? 'bg-emerald-100 text-emerald-800 font-semibold'
                              : lead.visit_status === 'No-show'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-stone-100 text-stone-600'
                          }`}
                        >
                          {lead.visit_status}
                        </span>
                      </td>

                      {/* Assigned Exec */}
                      <td className="py-3.5 px-4 text-stone-700 font-medium">
                        {lead.assigned_to_name || 'Rajesh Mehta'}
                      </td>

                      {/* AI Response Time */}
                      <td className="py-3.5 px-4 font-mono text-emerald-700 font-medium">
                        {lead.first_response_time_seconds ? `${lead.first_response_time_seconds}s` : 'Instant'}
                      </td>

                      {/* Action buttons */}
                      <td className="py-3.5 px-4 text-right space-x-1">
                        {isDup ? (
                          <button
                            onClick={() => setMergeTarget(lead)}
                            className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded text-[11px] font-medium transition-colors"
                          >
                            Merge Lead
                          </button>
                        ) : (
                          <button
                            onClick={() => onSelectLead(lead)}
                            className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded text-[11px] font-medium transition-colors"
                          >
                            View Details
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Merge Confirmation Modal */}
      {mergeTarget && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center gap-3 text-amber-700">
              <GitMerge className="w-6 h-6" />
              <h3 className="font-serif font-medium text-lg text-stone-900">Confirm Lead Merge</h3>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed">
              You are merging duplicate enquiry <strong>{mergeTarget.id}</strong> ({mergeTarget.source}) into primary lead <strong>{mergeTarget.duplicate_of_id}</strong>.
            </p>

            <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200 text-xs space-y-1 text-stone-700">
              <div>• Matched on Buyer Phone: <span className="font-mono">{mergeTarget.phone}</span></div>
              <div>• Transcripts & Site Walkthroughs will be consolidated</div>
              <div>• Duplicate record archived with audit note</div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setMergeTarget(null)}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-medium"
              >
                Cancel
              </button>
              <button
                disabled={merging}
                onClick={() => handleMergeLeads(mergeTarget.duplicate_of_id, mergeTarget.id)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-medium"
              >
                {merging ? 'Merging Records...' : 'Confirm & Merge'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inbound Simulator Modal */}
      {showSimulator && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-xs font-mono uppercase text-emerald-800 font-semibold block">Webhook Simulation</span>
                <h3 className="font-serif font-medium text-lg text-stone-900">Simulate Inbound Lead</h3>
              </div>
              <button onClick={() => setShowSimulator(false)} className="text-stone-400 hover:text-stone-600">
                ✕
              </button>
            </div>

            <p className="text-xs text-stone-500 leading-relaxed">
              Test how real estate portals (Housing.com, 99acres) or Meta Ads trigger real-time duplicate checks.
            </p>

            <form onSubmit={handleSimulateInbound} className="space-y-3 text-xs">
              <div>
                <label className="block text-stone-700 font-medium mb-1">Buyer Name</label>
                <input
                  type="text"
                  required
                  value={simForm.name}
                  onChange={(e) => setSimForm({ ...simForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-stone-50"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-medium mb-1">Phone Number</label>
                <div className="flex gap-2">
                  <input
                    type="tel"
                    required
                    value={simForm.phone}
                    onChange={(e) => {
                      setSimForm({ ...simForm, phone: e.target.value });
                      handleDuplicateCheck(e.target.value, simForm.email);
                    }}
                    className="flex-1 px-3 py-2 rounded-lg border border-stone-300 bg-stone-50 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => handleDuplicateCheck(simForm.phone, simForm.email)}
                    className="px-3 py-2 bg-stone-100 hover:bg-stone-200 rounded-lg text-stone-700 font-medium"
                  >
                    Check Dup
                  </button>
                </div>
              </div>

              {/* Duplicate Detection Alert Badge */}
              {duplicateCheckResult?.is_duplicate && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block">Duplicate Match Found!</span>
                    <span>
                      Matched existing lead #{duplicateCheckResult.matched_lead.id} ({duplicateCheckResult.matched_lead.name} from {duplicateCheckResult.matched_lead.source}).
                    </span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 font-medium mb-1">Source Channel</label>
                  <select
                    value={simForm.source}
                    onChange={(e) => setSimForm({ ...simForm, source: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-stone-50"
                  >
                    <option value="Property portal">Property portal</option>
                    <option value="Social media ad">Social media ad</option>
                    <option value="Website">Website</option>
                    <option value="Hoarding call">Hoarding call</option>
                  </select>
                </div>

                <div>
                  <label className="block text-stone-700 font-medium mb-1">Configuration</label>
                  <select
                    value={simForm.wants}
                    onChange={(e) => setSimForm({ ...simForm, wants: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-stone-50"
                  >
                    <option value="2 BHK">2 BHK</option>
                    <option value="3 BHK">3 BHK</option>
                    <option value="3 BHK Grande">3 BHK Grande</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowSimulator(false)}
                  className="px-4 py-2 bg-stone-100 text-stone-700 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-medium"
                >
                  Create & Run AI Pipeline
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
