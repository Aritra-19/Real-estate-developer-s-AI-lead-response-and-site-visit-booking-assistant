import React, { useState } from 'react';
import { 
  Building2, MapPin, Calendar, CheckCircle2, Shield, Sparkles, 
  Phone, ArrowRight, Clock, Award, Layers, Compass, ExternalLink, MessageCircle
} from 'lucide-react';

export default function BuyerPortal({
  project,
  onOpenBooking,
  onOpenChat,
  dpdpConsented
}) {
  const [leadForm, setLeadForm] = useState({
    name: '',
    phone: '',
    email: '',
    source: 'Website',
    wants: '3 BHK'
  });
  const [submitting, setSubmitting] = useState(false);
  const [submittedLead, setSubmittedLead] = useState(null);

  const configurations = Array.isArray(project.configurations)
    ? project.configurations
    : [];

  const handleQuickEnquiry = async (e) => {
    e.preventDefault();
    if (!leadForm.name || !leadForm.phone) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...leadForm,
          project_id: project.id,
          dpdp_consent: dpdpConsented ? 1 : 0
        })
      });
      const data = await res.json();
      if (data.success) {
        setSubmittedLead(data.lead);
        // Automatically initiate chat for this lead
        onOpenChat({ lead: data.lead, initialQuestion: `Hi, I am interested in ${leadForm.wants} at ${project.name}. Could you share available site visit slots?` });
      }
    } catch (err) {
      console.error('Enquiry error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fbfaf8] text-stone-900 pb-24">
      {/* Hero Section */}
      <section className="relative bg-stone-900 text-white overflow-hidden">
        {/* Background Image with dark luxury gradient */}
        <div className="absolute inset-0 z-0 opacity-40">
          <img
            src={project.hero_image}
            alt={project.name}
            className="w-full h-full object-cover object-center scale-105 transition-transform duration-1000"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-900/80 to-transparent"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="max-w-3xl">
            {/* RERA Badge */}
            <div className="inline-flex items-center gap-2 bg-emerald-950/90 text-emerald-300 px-3 py-1 rounded-full text-xs font-mono border border-emerald-800/80 mb-6 backdrop-blur-sm">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>RERA Registered: {project.rera_number}</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-light text-stone-100 tracking-tight leading-tight mb-4">
              {project.name}
            </h1>

            <p className="text-xl sm:text-2xl text-stone-300 font-light mb-6">
              {project.tagline}
            </p>

            <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-sm text-stone-300 mb-8">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-emerald-400" />
                {project.location}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-amber-400" />
                Possession: {project.possession_date}
              </span>
              <span className="flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-emerald-400" />
                {project.units_total} Total Units
              </span>
            </div>

            {/* Price tag & CTA buttons */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-2">
              <div className="bg-stone-800/90 backdrop-blur-md px-5 py-3 rounded-xl border border-stone-700/80">
                <span className="text-xs text-stone-400 block font-mono">STARTING FROM</span>
                <span className="text-2xl font-serif font-semibold text-amber-300">{project.price_range}</span>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => onOpenBooking(project)}
                  className="px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm transition-all shadow-lg shadow-emerald-900/30 flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Book Site Walkthrough</span>
                </button>

                <button
                  onClick={() => onOpenChat({ project })}
                  className="px-6 py-3.5 rounded-xl bg-stone-800/90 hover:bg-stone-700/90 text-stone-200 font-medium text-sm transition-all border border-stone-600 backdrop-blur-sm flex items-center gap-2"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-400" />
                  <span>Ask AI Concierge</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left 2 Columns: Project Overview, Specs, Amenities */}
          <div className="lg:col-span-2 space-y-10">
            {/* Overview */}
            <section className="bg-white rounded-2xl p-6 sm:p-8 border border-stone-200/80 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-mono tracking-wider text-emerald-800 uppercase mb-2 font-semibold">
                <Building2 className="w-4 h-4" />
                <span>Architectural Overview</span>
              </div>
              <h2 className="text-2xl font-serif font-normal text-stone-900 mb-4">
                Thoughtfully crafted living spaces in Ahmedabad
              </h2>
              <p className="text-stone-600 leading-relaxed mb-6 font-light">
                {project.overview}
              </p>

              {/* Configurations Chips */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-stone-100">
                <div className="bg-[#fbfaf8] p-4 rounded-xl border border-stone-200/60">
                  <span className="text-xs text-stone-500 font-mono">CARPET AREA</span>
                  <div className="text-lg font-serif font-medium text-stone-800 mt-1">{project.carpet_area}</div>
                  <span className="text-xs text-emerald-700">RERA approved carpet area</span>
                </div>
                <div className="bg-[#fbfaf8] p-4 rounded-xl border border-stone-200/60">
                  <span className="text-xs text-stone-500 font-mono">CONFIGURATIONS</span>
                  <div className="text-lg font-serif font-medium text-stone-800 mt-1">{configurations.join(' & ')}</div>
                  <span className="text-xs text-emerald-700">Vastu-compliant layouts</span>
                </div>
              </div>
            </section>

            {/* Approved Amenities */}
            <section className="bg-white rounded-2xl p-6 sm:p-8 border border-stone-200/80 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <span className="text-xs font-mono tracking-wider text-emerald-800 uppercase font-semibold block">
                    Lifestyle Amenities
                  </span>
                  <h3 className="text-2xl font-serif font-normal text-stone-900">
                    Curated Club & Wellness Amenities
                  </h3>
                </div>
                <span className="text-xs bg-emerald-50 text-emerald-800 px-3 py-1 rounded-full border border-emerald-200 font-mono">
                  AUDA Approved
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {[
                  '30,000 sq.ft. Luxury Clubhouse & Spa',
                  'Temperature-controlled Indoor Lap Pool',
                  'Synthetic Surface Badminton & Squash Courts',
                  'EV Charging Bay allocated per parking slot',
                  'Triple-height Italian Marble Entrance Foyer',
                  'Rooftop Stargazing Observatory Deck & Lounge',
                  'High-speed 15-passenger Mitsubishi Elevators',
                  '100% DG Back-up for elevators and water pumps'
                ].map((amenity, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 rounded-lg bg-stone-50/70 border border-stone-200/60 text-sm text-stone-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{amenity}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Location & Experiential Center */}
            <section className="bg-white rounded-2xl p-6 sm:p-8 border border-stone-200/80 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-mono tracking-wider text-emerald-800 uppercase mb-2 font-semibold">
                <Compass className="w-4 h-4" />
                <span>Prime Connectivity</span>
              </div>
              <h3 className="text-2xl font-serif font-normal text-stone-900 mb-2">
                Experiential Sales Gallery & Site Coordinates
              </h3>
              <p className="text-stone-600 text-sm mb-4">
                Located with direct access to major economic hubs, educational institutes, and healthcare facilities.
              </p>

              <div className="p-4 bg-stone-900 text-stone-200 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <div className="text-xs text-stone-400 font-mono">COORDINATES & PIN</div>
                  <div className="text-sm font-medium text-emerald-300 font-mono">{project.coordinates}</div>
                  <div className="text-xs text-stone-300 mt-0.5">{project.location}</div>
                </div>
                <a
                  href={`https://maps.google.com/?q=${project.coordinates}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors shrink-0"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open in Google Maps</span>
                </a>
              </div>
            </section>
          </div>

          {/* Right Column: Instant Lead Response & AI Booking Widget */}
          <div className="space-y-6">
            {/* Quick Enquiry Card */}
            <div className="bg-white rounded-2xl p-6 border border-stone-200/80 shadow-sm sticky top-24">
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-amber-700 font-semibold mb-2">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>Instant AI Response</span>
              </div>
              <h3 className="text-xl font-serif font-normal text-stone-900 mb-2">
                Enquire in English, Hindi, or Gujarati
              </h3>
              <p className="text-xs text-stone-500 mb-5 leading-relaxed">
                Response within 2 minutes at any hour. Answers strictly verified against official AUDA fact sheets.
              </p>

              <form onSubmit={handleQuickEnquiry} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">Your Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Hardik Patel"
                    value={leadForm.name}
                    onChange={(e) => setLeadForm({ ...leadForm, name: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-stone-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">Mobile Phone (WhatsApp) *</label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. +91 98250 12345"
                    value={leadForm.phone}
                    onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-stone-50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1">Enquiry Source</label>
                    <select
                      value={leadForm.source}
                      onChange={(e) => setLeadForm({ ...leadForm, source: e.target.value })}
                      className="w-full px-2.5 py-2 text-xs rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-stone-50"
                    >
                      <option value="Website">Website</option>
                      <option value="Property portal">Property portal (99acres/Housing)</option>
                      <option value="Social media ad">Social media ad (Meta/IG)</option>
                      <option value="Hoarding call">Hoarding call</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1">Looking For</label>
                    <select
                      value={leadForm.wants}
                      onChange={(e) => setLeadForm({ ...leadForm, wants: e.target.value })}
                      className="w-full px-2.5 py-2 text-xs rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-stone-50"
                    >
                      <option value="2 BHK">2 BHK</option>
                      <option value="3 BHK">3 BHK</option>
                      <option value="3 BHK Grande">3 BHK Grande</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 px-4 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-sm font-medium transition-all shadow flex items-center justify-center gap-2 mt-2"
                >
                  {submitting ? (
                    <span>Submitting Enquiry...</span>
                  ) : (
                    <>
                      <span>Start Instant AI Chat</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <p className="text-[11px] text-stone-400 text-center pt-1 font-mono">
                  🔒 DPDP Act 2023 Protected • Instant Human Handoff Available
                </p>
              </form>

              {/* Direct Booking Shortcut Button */}
              <div className="mt-6 pt-5 border-t border-stone-100">
                <button
                  onClick={() => onOpenBooking(project)}
                  className="w-full py-2.5 px-4 bg-emerald-50 hover:bg-emerald-100/80 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-medium transition-all flex items-center justify-center gap-2"
                >
                  <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                  <span>View Available Visit Slots Directly</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
