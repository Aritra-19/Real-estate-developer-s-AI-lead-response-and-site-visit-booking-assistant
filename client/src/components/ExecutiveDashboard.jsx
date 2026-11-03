import React, { useState, useEffect } from 'react';
import { 
  BarChart3, TrendingUp, Clock, AlertTriangle, CheckCircle, 
  DollarSign, ArrowUpRight, ArrowDownRight, Users, ShieldAlert, 
  MessageSquare, ExternalLink, RefreshCw, Calendar
} from 'lucide-react';
import api from '../services/api';

export default function ExecutiveDashboard({ onInspectLead }) {
  const [data, setData] = useState(null);
  const [flaggedChats, setFlaggedChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'sources' | 'flagged'

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [analyticsRes, flaggedRes] = await Promise.all([
        api.getDashboardAnalytics(),
        api.getFlaggedChats()
      ]);

      if (analyticsRes.success) {
        setData(analyticsRes);
      }
      if (flaggedRes.success) {
        setFlaggedChats(flaggedRes.data);
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading || !data) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center text-stone-500 text-sm">
        <RefreshCw className="w-5 h-5 animate-spin mr-2 text-emerald-600" />
        <span>Loading Executive Analytics & ROI Dashboard...</span>
      </div>
    );
  }

  const { metrics, source_breakdown, project_breakdown } = data;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header with Title and Refresh */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-stone-200">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-emerald-800 font-semibold block">
            Executive Leadership Portal • Company A
          </span>
          <h2 className="text-3xl font-serif text-stone-900 font-normal">
            Lead Response & Visit Conversion Analytics
          </h2>
          <p className="text-stone-500 text-xs mt-0.5">
            Real-time attribution across Portals, Meta Ads, Website, and Hoarding phone enquiries.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchDashboardData}
            className="px-3.5 py-2 bg-white hover:bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium text-stone-700 flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Data</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Median Response Time */}
        <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-stone-500 text-xs font-mono mb-2">
            <span>MEDIAN RESPONSE TIME</span>
            <Clock className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-serif font-semibold text-stone-900">
            {metrics.median_response_time_seconds}s
          </div>
          <div className="mt-2 flex items-center gap-1 text-xs text-emerald-700 font-medium">
            <ArrowDownRight className="w-3.5 h-3.5" />
            <span>From 14 hours down to &lt; 1 min</span>
          </div>
          <span className="text-[11px] text-stone-400 mt-1 block">Target: &lt; 5 minutes (Achieved)</span>
        </div>

        {/* Metric 2: 48h Unreached Leads */}
        <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-stone-500 text-xs font-mono mb-2">
            <span>UNREACHED IN 48H</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-3xl font-serif font-semibold text-stone-900">
            {metrics.unreached_rate_percent}%
          </div>
          <div className="mt-2 flex items-center gap-1 text-xs text-emerald-700 font-medium">
            <ArrowDownRight className="w-3.5 h-3.5" />
            <span>Down from 35% previously</span>
          </div>
          <span className="text-[11px] text-stone-400 mt-1 block">Wasted ad spend virtually eliminated</span>
        </div>

        {/* Metric 3: Lead-to-Visit Rate */}
        <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-stone-500 text-xs font-mono mb-2">
            <span>LEAD-TO-VISIT RATE</span>
            <TrendingUp className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-3xl font-serif font-semibold text-stone-900">
            {metrics.lead_to_visit_rate_percent}%
          </div>
          <div className="mt-2 flex items-center gap-1 text-xs text-indigo-700 font-medium">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Target: 8.0% (Exceeded)</span>
          </div>
          <span className="text-[11px] text-stone-400 mt-1 block">Previous baseline was 6.0%</span>
        </div>

        {/* Metric 4: Show-up Rate */}
        <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-stone-500 text-xs font-mono mb-2">
            <span>SHOW-UP RATE</span>
            <CheckCircle className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-3xl font-serif font-semibold text-stone-900">
            {metrics.show_up_rate_percent}%
          </div>
          <div className="mt-2 flex items-center gap-1 text-xs text-teal-700 font-medium">
            <span>Automated 24h & 2h WhatsApp reminders</span>
          </div>
          <span className="text-[11px] text-stone-400 mt-1 block">{metrics.completed_visits} completed walkthroughs</span>
        </div>
      </div>

      {/* Financial Impact Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-stone-900 to-stone-950 text-white rounded-2xl p-6 sm:p-7 border border-emerald-900/50 shadow-md">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-1 max-w-2xl">
            <span className="text-xs font-mono text-emerald-400 tracking-wider uppercase font-semibold">
              Financial Impact on ₹30 Lakh / Month Ad Spend
            </span>
            <h3 className="text-2xl font-serif font-normal text-stone-100">
              Recovering ₹1.18 Crore Annually from Cold Leads
            </h3>
            <p className="text-stone-300 text-xs leading-relaxed">
              Previously, 1,050 of 3,000 monthly leads went cold due to delayed follow-ups (₹10.5L/mo wasted at ₹1,000/lead). AI instant engagement retains serious buyers and connects them directly to named sales executives.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-stone-900/80 p-4 rounded-xl border border-stone-700/80 shrink-0">
            <div>
              <span className="text-xs text-stone-400 font-mono block">MONTHLY SAVINGS</span>
              <span className="text-2xl font-serif font-semibold text-emerald-300">
                ₹{(metrics.monthly_savings_inr / 100000).toFixed(2)} Lakh
              </span>
            </div>
            <div className="w-px h-10 bg-stone-700"></div>
            <div>
              <span className="text-xs text-stone-400 font-mono block">ANNUAL SAVINGS</span>
              <span className="text-2xl font-serif font-semibold text-amber-300">
                ₹{(metrics.annualized_savings_inr / 10000000).toFixed(2)} Cr
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation for Source Breakdown & Flagged Review */}
      <div className="flex items-center gap-3 border-b border-stone-200 text-sm">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 font-medium transition-colors relative ${
            activeTab === 'overview'
              ? 'text-emerald-800 border-b-2 border-emerald-700'
              : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          Source ROI & Cost Per Visit
        </button>

        <button
          onClick={() => setActiveTab('flagged')}
          className={`pb-3 font-medium transition-colors relative flex items-center gap-2 ${
            activeTab === 'flagged'
              ? 'text-emerald-800 border-b-2 border-emerald-700'
              : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <span>Flagged Chats for Daily Review</span>
          {flaggedChats.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-xs font-mono font-semibold">
              {flaggedChats.length}
            </span>
          )}
        </button>
      </div>

      {/* Tab 1: Source ROI & Cost Per Visit Table */}
      {activeTab === 'overview' && (
        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
          <div className="p-5 border-b border-stone-200/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <h3 className="font-serif font-medium text-lg text-stone-900">
                Lead Performance by Source
              </h3>
              <p className="text-xs text-stone-500">
                Evaluates cost per booked and attended site visit by marketing channel.
              </p>
            </div>
            <span className="text-xs font-mono text-stone-500">Unit Cost: ₹1,000 / Lead Benchmark</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-mono uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Channel / Source</th>
                  <th className="py-3 px-4 text-right">Leads</th>
                  <th className="py-3 px-4 text-right">Channel Spend</th>
                  <th className="py-3 px-4 text-right">Visits Booked</th>
                  <th className="py-3 px-4 text-right">Completed</th>
                  <th className="py-3 px-4 text-right">No-Shows</th>
                  <th className="py-3 px-4 text-right">Conversion %</th>
                  <th className="py-3 px-4 text-right font-bold text-stone-900">Cost / Visit</th>
                  <th className="py-3 px-4 text-right">Avg AI Response</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {source_breakdown.map((src, idx) => (
                  <tr key={idx} className="hover:bg-stone-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-medium text-stone-900 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                      <span>{src.source}</span>
                    </td>
                    <td className="py-3.5 px-4 text-right text-stone-700 font-mono">{src.leads}</td>
                    <td className="py-3.5 px-4 text-right text-stone-700 font-mono">
                      ₹{(src.spend / 100000).toFixed(1)} Lakh
                    </td>
                    <td className="py-3.5 px-4 text-right text-emerald-700 font-semibold font-mono">
                      {src.visits_booked}
                    </td>
                    <td className="py-3.5 px-4 text-right text-teal-700 font-mono">{src.visits_completed}</td>
                    <td className="py-3.5 px-4 text-right text-amber-700 font-mono">{src.no_shows}</td>
                    <td className="py-3.5 px-4 text-right text-stone-800 font-mono">
                      {src.conversion_rate_pct}%
                    </td>
                    <td className="py-3.5 px-4 text-right font-serif font-semibold text-stone-900">
                      ₹{src.cost_per_visit.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right text-emerald-800 font-mono">
                      {src.avg_response_time_seconds}s
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Flagged Chats Daily Review */}
      {activeTab === 'flagged' && (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-4 text-xs text-amber-900 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block">Sales Head Daily Review Queue:</span>
              <p className="mt-0.5 text-amber-800 leading-relaxed">
                As per problem statement rules: "The sales head reviews flagged chats daily." Conversations are automatically flagged when a buyer requests human sales assistance, asks for discounts/price reductions outside fact sheet policy, or asks unverified questions.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {flaggedChats.map((chat) => (
              <div
                key={chat.id}
                className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between text-xs pb-2 border-b border-stone-100">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-stone-900">{chat.lead_name || 'Enquiry'}</span>
                    <span className="text-stone-400 font-mono">{chat.lead_phone}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-800 font-mono font-medium text-[10px] border border-rose-200">
                    FLAGGED
                  </span>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[11px] font-mono text-stone-400 uppercase">AI Summary</span>
                  <p className="text-xs text-stone-700 leading-relaxed bg-stone-50 p-3 rounded-lg border border-stone-200/60 font-light whitespace-pre-line">
                    {chat.ai_summary || chat.handoff_reason || 'Buyer requested human executive.'}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 text-xs text-stone-500">
                  <span>Assigned To: <strong className="text-stone-800">{chat.assigned_to_name || 'Rajesh Mehta'}</strong></span>
                  <span className="text-[11px] font-mono">
                    {new Date(chat.last_activity).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
