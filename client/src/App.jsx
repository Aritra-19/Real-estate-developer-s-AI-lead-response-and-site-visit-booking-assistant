import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import DPDPConsentBanner from './components/DPDPConsentBanner';
import BuyerPortal from './components/BuyerPortal';
import AIChatDrawer from './components/AIChatDrawer';
import BookingModal from './components/BookingModal';
import ExecutiveDashboard from './components/ExecutiveDashboard';
import LeadsManager from './components/LeadsManager';
import SalesExecutiveView from './components/SalesExecutiveView';
import FactSheetEditor from './components/FactSheetEditor';
import SlotManager from './components/SlotManager';
import { Bot, Calendar, Sparkles } from 'lucide-react';
import api from './services/api';

export default function App() {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [currentRole, setCurrentRole] = useState('buyer'); // 'buyer' | 'sales_executive' | 'sales_head'
  const [activeView, setActiveView] = useState('buyer'); // 'buyer' | 'analytics' | 'leads' | 'factsheet' | 'slots' | 'executive'
  const [dpdpConsented, setDpdpConsented] = useState(true);
  const [flaggedCount, setFlaggedCount] = useState(0);

  // Modals & Drawers
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [bookingProject, setBookingProject] = useState(null);
  const [bookingLead, setBookingLead] = useState(null);

  const [chatDrawerOpen, setChatDrawerOpen] = useState(false);
  const [chatLead, setChatLead] = useState(null);
  const [chatInitialQuestion, setChatInitialQuestion] = useState('');

  // Selected lead for Executive view
  const [selectedLeadForExec, setSelectedLeadForExec] = useState(null);

  // Fetch initial data
  useEffect(() => {
    async function init() {
      try {
        const [projRes, flaggedRes] = await Promise.all([
          api.getProjects(),
          api.getFlaggedChats()
        ]);

        if (projRes.success && projRes.data.length > 0) {
          setProjects(projRes.data);
          setSelectedProject(projRes.data[0]);
        }
        if (flaggedRes.success) {
          setFlaggedCount(flaggedRes.count || 0);
        }
      } catch (err) {
        console.error('Initialization error:', err);
      }
    }
    init();
  }, []);

  const handleRoleChange = (newRole) => {
    setCurrentRole(newRole);
    if (newRole === 'buyer') {
      setActiveView('buyer');
    } else if (newRole === 'sales_executive') {
      setActiveView('executive');
    } else if (newRole === 'sales_head') {
      setActiveView('analytics');
    }
  };

  const handleOpenBooking = (proj, lead = null) => {
    setBookingProject(proj || selectedProject);
    setBookingLead(lead);
    setBookingModalOpen(true);
  };

  const handleOpenChat = ({ project: proj, lead = null, initialQuestion = '' }) => {
    if (proj) setSelectedProject(proj);
    setChatLead(lead);
    setChatInitialQuestion(initialQuestion);
    setChatDrawerOpen(true);
  };

  const handleSelectLeadFromList = (lead) => {
    setSelectedLeadForExec(lead);
    if (currentRole === 'buyer') {
      setCurrentRole('sales_executive');
    }
    setActiveView('executive');
  };

  if (!selectedProject && projects.length === 0) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center text-stone-500 font-sans text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-600 animate-ping"></div>
          <span>Connecting to Company A Real Estate AI Platform...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fbfaf8] text-stone-900 flex flex-col font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {/* DPDP Act 2023 Consent Notice */}
      <DPDPConsentBanner
        consented={dpdpConsented}
        onConsentChange={setDpdpConsented}
      />

      {/* Main Navbar */}
      <Navbar
        currentRole={currentRole}
        onRoleChange={handleRoleChange}
        activeView={activeView}
        onViewChange={setActiveView}
        projects={projects}
        selectedProject={selectedProject}
        onProjectChange={setSelectedProject}
        flaggedCount={flaggedCount}
      />

      {/* View Switching */}
      <main className="flex-1">
        {activeView === 'buyer' && selectedProject && (
          <BuyerPortal
            project={selectedProject}
            onOpenBooking={(p) => handleOpenBooking(p)}
            onOpenChat={handleOpenChat}
            dpdpConsented={dpdpConsented}
          />
        )}

        {activeView === 'analytics' && (
          <ExecutiveDashboard
            onInspectLead={handleSelectLeadFromList}
          />
        )}

        {activeView === 'leads' && (
          <LeadsManager
            onSelectLead={handleSelectLeadFromList}
          />
        )}

        {activeView === 'executive' && (
          <SalesExecutiveView
            activeLead={selectedLeadForExec}
            onSelectLead={setSelectedLeadForExec}
          />
        )}

        {activeView === 'factsheet' && (
          <FactSheetEditor
            projects={projects}
            selectedProject={selectedProject}
            onProjectChange={setSelectedProject}
          />
        )}

        {activeView === 'slots' && (
          <SlotManager
            projects={projects}
            selectedProject={selectedProject}
          />
        )}
      </main>

      {/* Floating Action Button for AI Concierge (when on buyer view) */}
      {activeView === 'buyer' && !chatDrawerOpen && (
        <div className="fixed bottom-6 right-6 z-40 flex items-center gap-3">
          <button
            onClick={() => handleOpenBooking(selectedProject)}
            className="hidden sm:flex items-center gap-2 px-4 py-3 rounded-full bg-white text-stone-800 border border-stone-300 shadow-xl hover:bg-stone-50 text-xs font-semibold transition-all hover:scale-105"
          >
            <Calendar className="w-4 h-4 text-emerald-700" />
            <span>Book Visit</span>
          </button>

          <button
            onClick={() => handleOpenChat({ project: selectedProject })}
            className="flex items-center gap-2.5 px-5 py-3.5 rounded-full bg-stone-900 text-white shadow-2xl hover:bg-stone-800 text-sm font-medium transition-all hover:scale-105 border border-stone-700 group ring-4 ring-emerald-500/10"
          >
            <div className="w-6 h-6 rounded-full bg-emerald-600 flex items-center justify-center">
              <Bot className="w-3.5 h-3.5 text-white" />
            </div>
            <span>AI Concierge</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          </button>
        </div>
      )}

      {/* AI Chat Drawer */}
      <AIChatDrawer
        isOpen={chatDrawerOpen}
        onClose={() => setChatDrawerOpen(false)}
        project={selectedProject}
        lead={chatLead}
        initialQuestion={chatInitialQuestion}
        onVisitBooked={() => {
          // Re-fetch flagged count or visits if needed
        }}
      />

      {/* Site Walkthrough Booking Modal */}
      <BookingModal
        isOpen={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        project={bookingProject || selectedProject}
        lead={bookingLead}
        onBookingComplete={() => {
          // Booking confirmed callback
        }}
      />
    </div>
  );
}
