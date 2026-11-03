import React from 'react';
import { Building2, ShieldCheck, UserCheck, BarChart3, Users, BookOpen, Calendar, MessageSquare, AlertCircle } from 'lucide-react';

export default function Navbar({
  currentRole,
  onRoleChange,
  activeView,
  onViewChange,
  projects,
  selectedProject,
  onProjectChange,
  flaggedCount
}) {
  return (
    <header className="sticky top-0 z-40 bg-stone-900 text-stone-100 border-b border-stone-800 shadow-md">
      {/* Top micro bar for RERA & Compliance */}
      <div className="bg-stone-950 text-stone-400 text-xs py-1 px-4 border-b border-stone-800/80 flex flex-wrap justify-between items-center">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>AUDA & GujRERA Registered Developer • Ahmedabad</span>
          <span className="hidden md:inline text-stone-600">|</span>
          <span className="hidden md:inline text-stone-400">DPDP Act 2023 Consent Protected</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-amber-400/90 font-medium">Ahmedabad • 2 Live Projects (420 Units)</span>
        </div>
      </div>

      {/* Main navigation row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Company branding */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-800/80 border border-emerald-600/50 flex items-center justify-center text-emerald-200 font-serif font-bold text-xl shadow-inner">
              A
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif font-semibold text-lg text-stone-100 tracking-wide">COMPANY A</span>
                <span className="text-xs bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-800">AI Concierge</span>
              </div>
              <p className="text-[11px] text-stone-400 tracking-wider">RESIDENTIAL DEVELOPER • AHMEDABAD</p>
            </div>
          </div>

          {/* Project Switcher */}
          <div className="hidden lg:flex items-center bg-stone-800/90 rounded-lg p-1 border border-stone-700">
            {projects.map((p) => (
              <button
                key={p.id}
                onClick={() => onProjectChange(p)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  selectedProject?.id === p.id
                    ? 'bg-emerald-700 text-white shadow-sm'
                    : 'text-stone-300 hover:text-white hover:bg-stone-700/60'
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>

          {/* Role selector dropdown / pills */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-stone-400 hidden sm:inline">Role:</span>
            <div className="inline-flex rounded-lg bg-stone-800 p-1 border border-stone-700">
              <button
                onClick={() => onRoleChange('buyer')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 ${
                  currentRole === 'buyer'
                    ? 'bg-amber-600 text-white shadow'
                    : 'text-stone-300 hover:text-white'
                }`}
                title="Public Home Buyer Experience"
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Buyer</span>
              </button>
              <button
                onClick={() => onRoleChange('sales_executive')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 ${
                  currentRole === 'sales_executive'
                    ? 'bg-emerald-600 text-white shadow'
                    : 'text-stone-300 hover:text-white'
                }`}
                title="Sales Executive Portal"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Executive</span>
              </button>
              <button
                onClick={() => onRoleChange('sales_head')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 ${
                  currentRole === 'sales_head'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-stone-300 hover:text-white'
                }`}
                title="Sales Head & Director Admin"
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Sales Head</span>
                {flaggedCount > 0 && (
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Sub-navigation for Staff roles */}
        {currentRole !== 'buyer' && (
          <div className="flex items-center space-x-1 border-t border-stone-800 py-2 overflow-x-auto text-xs">
            {currentRole === 'sales_head' && (
              <>
                <button
                  onClick={() => onViewChange('analytics')}
                  className={`px-3 py-1.5 rounded flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                    activeView === 'analytics'
                      ? 'bg-stone-800 text-emerald-400 font-medium'
                      : 'text-stone-300 hover:bg-stone-800/60'
                  }`}
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  Dashboard & ROI
                </button>
                <button
                  onClick={() => onViewChange('leads')}
                  className={`px-3 py-1.5 rounded flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                    activeView === 'leads'
                      ? 'bg-stone-800 text-emerald-400 font-medium'
                      : 'text-stone-300 hover:bg-stone-800/60'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  Unified Leads & Duplicate Check
                </button>
                <button
                  onClick={() => onViewChange('factsheet')}
                  className={`px-3 py-1.5 rounded flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                    activeView === 'factsheet'
                      ? 'bg-stone-800 text-emerald-400 font-medium'
                      : 'text-stone-300 hover:bg-stone-800/60'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  Fact Sheet Knowledge Base
                </button>
                <button
                  onClick={() => onViewChange('slots')}
                  className={`px-3 py-1.5 rounded flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                    activeView === 'slots'
                      ? 'bg-stone-800 text-emerald-400 font-medium'
                      : 'text-stone-300 hover:bg-stone-800/60'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  Slots & Capacity
                </button>
              </>
            )}

            {currentRole === 'sales_executive' && (
              <>
                <button
                  onClick={() => onViewChange('executive')}
                  className={`px-3 py-1.5 rounded flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                    activeView === 'executive'
                      ? 'bg-stone-800 text-emerald-400 font-medium'
                      : 'text-stone-300 hover:bg-stone-800/60'
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  My Leads & Scheduled Visits
                </button>
                <button
                  onClick={() => onViewChange('leads')}
                  className={`px-3 py-1.5 rounded flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                    activeView === 'leads'
                      ? 'bg-stone-800 text-emerald-400 font-medium'
                      : 'text-stone-300 hover:bg-stone-800/60'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  All Inbound Leads
                </button>
              </>
            )}

            <button
              onClick={() => onViewChange('buyer')}
              className="ml-auto px-2.5 py-1 text-stone-400 hover:text-stone-200 text-xs flex items-center gap-1"
            >
              <Building2 className="w-3.5 h-3.5" />
              Preview Buyer View
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
