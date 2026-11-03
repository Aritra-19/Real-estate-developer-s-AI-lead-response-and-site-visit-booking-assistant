import React, { useState, useEffect } from 'react';
import { 
  Calendar, Clock, Plus, Users, CheckCircle2, AlertCircle, 
  Power, RefreshCw, Shield
} from 'lucide-react';
import api from '../services/api';

export default function SlotManager({ projects, selectedProject }) {
  const [currentProject, setCurrentProject] = useState(selectedProject || projects[0]);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddSlot, setShowAddSlot] = useState(false);
  const [newSlotDate, setNewSlotDate] = useState(new Date().toISOString().split('T')[0]);
  const [newSlotTime, setNewSlotTime] = useState('11:30');
  const [newSlotCapacity, setNewSlotCapacity] = useState(2);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState(null);

  const fetchSlots = async () => {
    if (!currentProject) return;
    try {
      setLoading(true);
      const res = await api.getSlots({ project_id: currentProject.id });
      if (res.success) {
        setSlots(res.data);
      }
    } catch (err) {
      console.error('Error fetching slots:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlots();
  }, [currentProject?.id]);

  const handleToggleStatus = async (slot) => {
    const newStatus = slot.status === 'active' ? 'disabled' : 'active';
    try {
      await api.updateSlot(slot.id, { status: newStatus });
      setSlots((prev) =>
        prev.map((s) => (s.id === slot.id ? { ...s, status: newStatus } : s))
      );
    } catch (err) {
      console.error('Toggle status error:', err);
    }
  };

  const handleCreateSlot = async (e) => {
    e.preventDefault();
    setCreating(true);
    setMessage(null);

    try {
      const res = await api.createSlot({
        project_id: currentProject.id,
        slot_date: newSlotDate,
        slot_time: newSlotTime,
        capacity: Number(newSlotCapacity)
      });

      if (res.success) {
        setShowAddSlot(false);
        setMessage('New site visit slot created successfully!');
        setTimeout(() => setMessage(null), 3000);
        fetchSlots();
      } else {
        setMessage(res.error || 'Failed to create slot');
      }
    } catch (err) {
      console.error('Create slot error:', err);
      setMessage(err.message || 'Failed to create slot');
    } finally {
      setCreating(false);
    }
  };

  // Group slots by date
  const groupedSlots = slots.reduce((acc, slot) => {
    if (!acc[slot.slot_date]) acc[slot.slot_date] = [];
    acc[slot.slot_date].push(slot);
    return acc;
  }, {});

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-stone-200">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-emerald-800 font-semibold block">
            Capacity & Slot Management • Real Free Slots Only
          </span>
          <h2 className="text-3xl font-serif text-stone-900 font-normal">
            Site Visit Slots & Walkthrough Capacity
          </h2>
          <p className="text-stone-500 text-xs mt-0.5">
            Strict ACID concurrency control guarantees no double booking across portal and web visitors.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddSlot(true)}
            className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-medium flex items-center gap-2 transition-all shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Visit Slot</span>
          </button>
        </div>
      </div>

      {message && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-700" />
          <span>{message}</span>
        </div>
      )}

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

      {/* Slots grouped by Date */}
      {loading ? (
        <div className="py-12 text-center text-xs text-stone-400">Loading visit slots...</div>
      ) : Object.keys(groupedSlots).length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-stone-200 text-stone-400 text-xs">
          No slots found. Click "Create Visit Slot" to add one.
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedSlots).map(([dateStr, dateSlots]) => {
            const dateObj = new Date(dateStr);
            const dateFormatted = dateObj.toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              year: 'numeric'
            });

            return (
              <div key={dateStr} className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-emerald-700" />
                    <h3 className="font-serif font-medium text-base text-stone-900">{dateFormatted}</h3>
                  </div>
                  <span className="text-xs font-mono text-stone-500">
                    {dateSlots.filter((s) => s.booked_count < s.capacity).length} of {dateSlots.length} slots open
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  {dateSlots.map((slot) => {
                    const isFull = slot.booked_count >= slot.capacity;
                    const isDisabled = slot.status === 'disabled';

                    return (
                      <div
                        key={slot.id}
                        className={`p-3.5 rounded-xl border transition-all ${
                          isDisabled
                            ? 'bg-stone-100/60 border-stone-200 text-stone-400'
                            : isFull
                            ? 'bg-amber-50/40 border-amber-200 text-stone-800'
                            : 'bg-white border-stone-200 hover:border-emerald-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-sm text-stone-900 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-stone-500" />
                            <span>{slot.slot_time}</span>
                          </span>

                          <button
                            onClick={() => handleToggleStatus(slot)}
                            className={`p-1 rounded transition-colors ${
                              isDisabled
                                ? 'text-stone-400 hover:text-emerald-600'
                                : 'text-emerald-700 hover:text-rose-600'
                            }`}
                            title={isDisabled ? 'Enable slot' : 'Disable slot'}
                          >
                            <Power className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="flex items-center justify-between text-xs pt-1 border-t border-stone-100">
                          <span className="text-stone-500 font-mono text-[11px]">
                            {slot.booked_count} / {slot.capacity} Booked
                          </span>

                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-medium ${
                              isDisabled
                                ? 'bg-stone-200 text-stone-600'
                                : isFull
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {isDisabled ? 'PAUSED' : isFull ? 'FULL' : `${slot.capacity - slot.booked_count} FREE`}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Slot Modal */}
      {showAddSlot && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-stone-200 space-y-4">
            <h3 className="font-serif font-medium text-lg text-stone-900">Add Site Walkthrough Slot</h3>

            <form onSubmit={handleCreateSlot} className="space-y-3 text-xs">
              <div>
                <label className="block text-stone-700 font-medium mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={newSlotDate}
                  onChange={(e) => setNewSlotDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-stone-50"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-medium mb-1">Time (24-hour)</label>
                <select
                  value={newSlotTime}
                  onChange={(e) => setNewSlotTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-stone-50"
                >
                  <option value="10:00">10:00 AM</option>
                  <option value="11:30">11:30 AM</option>
                  <option value="14:00">02:00 PM</option>
                  <option value="16:00">04:00 PM</option>
                  <option value="17:30">05:30 PM</option>
                  <option value="18:30">06:30 PM (Sunset View)</option>
                </select>
              </div>

              <div>
                <label className="block text-stone-700 font-medium mb-1">Max Visitor Capacity</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  required
                  value={newSlotCapacity}
                  onChange={(e) => setNewSlotCapacity(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-stone-50"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddSlot(false)}
                  className="px-4 py-2 bg-stone-100 text-stone-700 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-medium"
                >
                  {creating ? 'Saving...' : 'Create Slot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
