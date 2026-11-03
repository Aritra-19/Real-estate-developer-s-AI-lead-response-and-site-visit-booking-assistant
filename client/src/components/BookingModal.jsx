import React, { useState, useEffect } from 'react';
import { 
  X, Calendar, Clock, MapPin, User, CheckCircle2, AlertCircle, 
  ExternalLink, Download, ShieldCheck, MessageSquare, Phone
} from 'lucide-react';
import api from '../services/api';

export default function BookingModal({
  isOpen,
  onClose,
  project,
  lead,
  onBookingComplete
}) {
  const [slots, setSlots] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [bookingResult, setBookingResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  // Form details if lead not pre-filled
  const [formData, setFormData] = useState({
    name: lead?.name || '',
    phone: lead?.phone || '',
    wants: lead?.wants || '3 BHK'
  });

  useEffect(() => {
    if (lead) {
      setFormData({
        name: lead.name || '',
        phone: lead.phone || '',
        wants: lead.wants || '3 BHK'
      });
    }
  }, [lead]);

  // Fetch slots on open
  useEffect(() => {
    if (!isOpen) return;
    setBookingResult(null);
    setErrorMessage(null);

    async function fetchSlots() {
      try {
        setLoadingSlots(true);
        const res = await api.getSlots({ project_id: project.id, status: 'active' });
        if (res.success) {
          setSlots(res.data);
          // Default to first date with available slots
          const firstAvailable = res.data.find((s) => !s.is_full);
          if (firstAvailable) {
            setSelectedDate(firstAvailable.slot_date);
          } else if (res.data.length > 0) {
            setSelectedDate(res.data[0].slot_date);
          }
        }
      } catch (err) {
        console.error('Failed to load slots:', err);
      } finally {
        setLoadingSlots(false);
      }
    }

    fetchSlots();
  }, [isOpen, project.id]);

  // Unique dates from slots
  const dates = Array.from(new Set(slots.map((s) => s.slot_date)));
  const slotsForSelectedDate = slots.filter((s) => s.slot_date === selectedDate);

  const handleBook = async (e) => {
    e.preventDefault();
    if (!selectedSlot) return;

    setSubmitting(true);
    setErrorMessage(null);

    try {
      let activeLeadId = lead?.id;

      // If lead doesn't exist yet, create or find lead first
      if (!activeLeadId) {
        const leadRes = await api.createLead({
          name: formData.name,
          phone: formData.phone,
          source: 'Website',
          project_id: project.id,
          wants: formData.wants,
          dpdp_consent: 1
        });
        if (leadRes.success) {
          activeLeadId = leadRes.lead.id;
        } else {
          throw new Error('Failed to create lead profile');
        }
      }

      // Perform atomic slot booking with ACID concurrency
      const bookRes = await api.bookSlot({
        lead_id: activeLeadId,
        slot_id: selectedSlot.id,
        project_id: project.id
      });

      if (bookRes.success) {
        setBookingResult(bookRes.booking);
        if (onBookingComplete) {
          onBookingComplete(bookRes.booking);
        }
      } else {
        setErrorMessage(bookRes.error || 'Failed to book slot');
      }
    } catch (err) {
      console.error('Booking error:', err);
      setErrorMessage(err.message || 'Slot booking failed due to a race condition. Please select an alternate slot.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadICS = () => {
    if (!bookingResult) return;
    const icsData = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Company A Ahmedabad//Real Estate Site Walkthrough//EN
BEGIN:VEVENT
SUMMARY:Site Visit: ${project.name}
DESCRIPTION:VIP Walkthrough for ${project.name}. Host: ${bookingResult.executive_name}. RERA: ${project.rera_number}
LOCATION:${project.location}
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `Site_Visit_${project.slug}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-stone-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-stone-900 text-white flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-400" />
              <h3 className="font-serif font-medium text-lg">Schedule Site Walkthrough</h3>
            </div>
            <p className="text-xs text-stone-300">{project.name} • Experiential Show Flat</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6">
          {bookingResult ? (
            /* Confirmation View */
            <div className="text-center py-4 space-y-6">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-emerald-800 font-bold block mb-1">
                  Visit Confirmed • Real-Time Slot Reserved
                </span>
                <h4 className="text-2xl font-serif text-stone-900 font-medium">
                  We look forward to hosting you!
                </h4>
                <p className="text-sm text-stone-600 mt-1">
                  {bookingResult.slot_date} at {bookingResult.slot_time}
                </p>
              </div>

              {/* Host & Location Card */}
              <div className="bg-stone-50 rounded-xl p-4 border border-stone-200 text-left text-sm space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-stone-200/80">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-emerald-800 text-white flex items-center justify-center font-bold text-xs">
                      {bookingResult.executive_name[0]}
                    </div>
                    <div>
                      <span className="text-xs text-stone-400 block">Dedicated Sales Host</span>
                      <span className="font-medium text-stone-900">{bookingResult.executive_name}</span>
                    </div>
                  </div>
                  <span className="text-xs text-emerald-800 bg-emerald-50 px-2 py-1 rounded border border-emerald-200 font-mono">
                    {bookingResult.executive_phone || '+91 98251 11223'}
                  </span>
                </div>

                <div className="flex items-start gap-2 pt-1 text-xs text-stone-600">
                  <MapPin className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium text-stone-800 block">{project.location}</span>
                    <a
                      href={`https://maps.google.com/?q=${project.coordinates}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-700 hover:underline flex items-center gap-1 mt-0.5"
                    >
                      <span>Open GPS Pin in Google Maps</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Simulated WhatsApp Notification Notice */}
              <div className="p-3 bg-emerald-50 border border-emerald-200/80 rounded-xl text-left text-xs text-emerald-950 flex items-start gap-2.5">
                <MessageSquare className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold block">Simulated WhatsApp Confirmation Sent:</span>
                  <p className="text-[11px] text-emerald-800 mt-0.5">
                    "Visit confirmed with location pin & entry barcode. Reminders will be sent 1 day and 2 hours prior to your visit. Reply STOP to opt out."
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={handleDownloadICS}
                  className="flex-1 py-2.5 px-4 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-medium flex items-center justify-center gap-2 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Add to Calendar (.ics)</span>
                </button>
                <button
                  onClick={onClose}
                  className="py-2.5 px-6 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-medium transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            /* Booking Selection Form */
            <form onSubmit={handleBook} className="space-y-6">
              {errorMessage && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Visitor Contact details (if not preset) */}
              {!lead && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-stone-100">
                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1">Your Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Hardik Patel"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-stone-50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1">Phone (WhatsApp) *</label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. +91 98250 11001"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-stone-50"
                    />
                  </div>
                </div>
              )}

              {/* Date Selector Pills */}
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-2">1. Select Walkthrough Date</label>
                <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                  {dates.map((d) => {
                    const isSelected = selectedDate === d;
                    const dateObj = new Date(d);
                    const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
                    const monthDay = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => {
                          setSelectedDate(d);
                          setSelectedSlot(null);
                        }}
                        className={`px-3 py-2 rounded-xl text-center border transition-all shrink-0 ${
                          isSelected
                            ? 'bg-stone-900 text-white border-stone-900 shadow-sm'
                            : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                        }`}
                      >
                        <span className="block text-[10px] font-mono uppercase opacity-75">{dayName}</span>
                        <span className="block text-xs font-semibold">{monthDay}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time Slots Grid with Capacity Badges */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-medium text-stone-700">2. Select Available Slot</label>
                  <span className="text-[11px] text-stone-500 font-mono">Live capacity tracked</span>
                </div>

                {loadingSlots ? (
                  <div className="text-center py-6 text-xs text-stone-400">Loading live slot capacities...</div>
                ) : slotsForSelectedDate.length === 0 ? (
                  <div className="text-center py-6 text-xs text-stone-400 bg-stone-50 rounded-xl border border-dashed border-stone-200">
                    No active slots scheduled for this date.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {slotsForSelectedDate.map((slot) => {
                      const isFull = slot.is_full;
                      const isSelected = selectedSlot?.id === slot.id;

                      return (
                        <button
                          key={slot.id}
                          type="button"
                          disabled={isFull}
                          onClick={() => setSelectedSlot(slot)}
                          className={`p-3 rounded-xl border text-left transition-all relative ${
                            isFull
                              ? 'bg-stone-100/70 border-stone-200 text-stone-400 cursor-not-allowed opacity-60'
                              : isSelected
                              ? 'bg-emerald-50 border-emerald-600 ring-2 ring-emerald-600/30 text-emerald-950 font-medium'
                              : 'bg-white border-stone-200 hover:border-emerald-300 hover:bg-stone-50/50 text-stone-800'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 text-xs font-semibold">
                            <Clock className="w-3.5 h-3.5 text-stone-500" />
                            <span>{slot.slot_time}</span>
                          </div>

                          <div className="mt-1.5 flex items-center justify-between">
                            <span
                              className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                                isFull
                                  ? 'bg-stone-200 text-stone-600'
                                  : slot.remaining === 1
                                  ? 'bg-amber-100 text-amber-800 font-semibold'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {isFull ? 'FULL' : `${slot.remaining} left`}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* RERA and DPDP Notice */}
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/80 text-[11px] text-stone-600 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <span>
                  <strong>Strict RERA Compliance:</strong> No token payments or allotment letters on chat. Site visit booking does not constitute an agreement for sale.
                </span>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!selectedSlot || submitting}
                className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-all shadow-md shadow-emerald-900/20 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <span>Checking capacity & locking slot...</span>
                ) : (
                  <>
                    <Calendar className="w-4 h-4" />
                    <span>Confirm Site Walkthrough Reservation</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
