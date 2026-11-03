import React, { useState } from 'react';
import { ShieldCheck, Lock, X } from 'lucide-react';

export default function DPDPConsentBanner({ consented, onConsentChange }) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <aside aria-label="Privacy & DPDP Compliance" className="bg-stone-100 border-b border-stone-200/80 px-4 py-2.5 text-xs text-stone-700">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>
            <strong>Digital Personal Data Protection (DPDP) Act 2023 Notice:</strong> We collect contact information strictly with your explicit consent for site visit coordination and verified RERA updates. Never shared with third-party brokers.
          </span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <label className="flex items-center gap-1.5 cursor-pointer text-emerald-800 font-medium">
            <input
              type="checkbox"
              checked={consented}
              onChange={(e) => onConsentChange(e.target.checked)}
              className="rounded border-stone-300 text-emerald-700 focus:ring-emerald-600 w-3.5 h-3.5"
            />
            <span>I consent to receive site visit coordinates via WhatsApp/SMS</span>
          </label>
          <button
            onClick={() => setDismissed(true)}
            className="text-stone-400 hover:text-stone-600 p-0.5"
            title="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
