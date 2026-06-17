"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/shared/PageHeader';
import { Loader2, Send, AlertTriangle } from 'lucide-react';
import { BloodGroup, UrgencyLevel } from '@prisma/client';
import { getAllBloodGroups, formatBloodGroup } from '@/lib/blood-compatibility';

export default function NewBloodRequestPage() {
  const router = useRouter();
  
  // Form Fields
  const [bloodGroup, setBloodGroup] = useState<BloodGroup>(BloodGroup.O_POS);
  const [unitsNeeded, setUnitsNeeded] = useState('1');
  const [hospitalName, setHospitalName] = useState('');
  const [hospitalCity, setHospitalCity] = useState('');
  const [hospitalArea, setHospitalArea] = useState('');
  const [urgency, setUrgency] = useState<UrgencyLevel>(UrgencyLevel.STANDARD);
  const [description, setDescription] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');

  // States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [bypassDuplicateCheck, setBypassDuplicateCheck] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bloodGroup,
          unitsNeeded,
          hospitalName,
          hospitalCity,
          hospitalArea,
          urgency,
          description,
          contactName,
          contactPhone,
          bypassDuplicateCheck,
        }),
      });

      const data = await res.json();

      if (res.status === 409 && data.duplicateDetected) {
        // Duplicate request detected, prompt warning
        setDuplicateWarning(data.message);
        setBypassDuplicateCheck(true); // Allow bypass next time
        setLoading(false);
        return;
      }

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit blood request.');
      }

      // Redirect to list of requests
      router.push('/attendant/my-requests');
    } catch (err: any) {
      setError(err.message || 'Something went wrong.');
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader 
        title="Submit Blood Request" 
        description="Fill out the emergency details. Your request will be verified by a hospital administrator before matching."
      />

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm font-semibold text-red-700 dark:bg-red-950/20 dark:border-red-900/50 dark:text-red-400">
          {error}
        </div>
      )}

      {duplicateWarning && (
        <div className="p-4 rounded-xl bg-yellow-50 border border-yellow-200 text-sm text-yellow-800 dark:bg-yellow-950/20 dark:border-yellow-900/50 dark:text-yellow-400 space-y-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
            <div className="font-semibold">{duplicateWarning}</div>
          </div>
          <p className="text-xs text-yellow-600">
            If this is a separate patient or you are certain it is not a duplicate, click the "Submit Request" button again to force broadcast.
          </p>
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 border rounded-xl shadow-sm p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                Required Blood Group
              </label>
              <select
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value as BloodGroup)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 transition-colors text-sm"
              >
                {getAllBloodGroups().map((bg) => (
                  <option key={bg} value={bg}>{formatBloodGroup(bg)}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                Units Needed (Bottles)
              </label>
              <input
                type="number"
                min="1"
                max="10"
                required
                value={unitsNeeded}
                onChange={(e) => setUnitsNeeded(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 transition-colors text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                Hospital Name
              </label>
              <input
                type="text"
                required
                value={hospitalName}
                onChange={(e) => setHospitalName(e.target.value)}
                placeholder="Aga Khan Hospital"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 transition-colors text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                Urgency Level
              </label>
              <select
                value={urgency}
                onChange={(e) => setUrgency(e.target.value as UrgencyLevel)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 transition-colors text-sm"
              >
                <option value={UrgencyLevel.STANDARD}>Standard (Elective)</option>
                <option value={UrgencyLevel.URGENT}>Urgent (Within 24h)</option>
                <option value={UrgencyLevel.CRITICAL}>Critical (Immediate ICU)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                Hospital City
              </label>
              <input
                type="text"
                required
                value={hospitalCity}
                onChange={(e) => setHospitalCity(e.target.value)}
                placeholder="Karachi"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 transition-colors text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                Hospital Area / Locality
              </label>
              <input
                type="text"
                required
                value={hospitalArea}
                onChange={(e) => setHospitalArea(e.target.value)}
                placeholder="Gulshan"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 transition-colors text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t pt-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                Contact Person Name
              </label>
              <input
                type="text"
                required
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="Muhammad Ali"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 transition-colors text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                Contact Phone Number
              </label>
              <input
                type="tel"
                required
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="03001234567"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 transition-colors text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
              Case Description & Medical Context
            </label>
            <textarea
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Please provide details (e.g. bypass operation scheduled, dengue patient, internal bleeding)."
              rows={4}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 transition-colors text-sm"
            />
          </div>

          <div className="flex justify-end pt-3">
            <button
              type="submit"
              disabled={loading}
              className="bg-primary hover:bg-primary/95 text-white font-bold py-2.5 px-5 rounded-lg transition-all flex items-center gap-2 shadow-md disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Submit Request
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
