"use client";

import React, { useState, useEffect } from 'react';
import PageHeader from '@/components/shared/PageHeader';
import { Loader2, Save, User } from 'lucide-react';
import { BloodGroup } from '@prisma/client';
import { getAllBloodGroups, formatBloodGroup } from '@/lib/blood-compatibility';

export default function DonorProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form Fields
  const [userId, setUserId] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [bloodGroup, setBloodGroup] = useState<BloodGroup>(BloodGroup.O_POS);
  const [city, setCity] = useState('');
  const [area, setArea] = useState('');
  const [lastDonationDate, setLastDonationDate] = useState('');
  const [notes, setNotes] = useState('');

  const fetchProfile = async () => {
    try {
      const sessionRes = await fetch('/api/auth/session');
      const session = await sessionRes.json();
      if (!session?.user?.id) return;

      const profileRes = await fetch(`/api/donors/${session.user.id}`);
      if (profileRes.ok) {
        const data = await profileRes.json();
        setUserId(data.userId);
        setName(data.user.name);
        setPhone(data.user.phone || '');
        setBloodGroup(data.bloodGroup);
        setCity(data.city);
        setArea(data.area);
        setNotes(data.notes || '');

        if (data.lastDonationDate) {
          // Format date as YYYY-MM-DD for input
          setLastDonationDate(new Date(data.lastDonationDate).toISOString().split('T')[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load donor profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    setError(null);

    try {
      const res = await fetch(`/api/donors/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          city,
          area,
          notes,
          lastDonationDate: lastDonationDate || null,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to update profile.');
      }

      setSuccess(true);
      // Auto-hide success message
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader 
        title="Profile Settings" 
        description="Update your contact region, donor details, and view eligibility settings."
      />

      {success && (
        <div className="p-4 rounded-xl bg-green-50 border border-green-200 text-sm font-semibold text-green-700 dark:bg-green-950/20 dark:border-green-900/50 dark:text-green-400">
          Profile updated successfully!
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm font-semibold text-red-700 dark:bg-red-950/20 dark:border-red-900/50 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 border rounded-xl shadow-sm p-6">
        <form onSubmit={handleSave} className="space-y-5">
          {/* Static user info */}
          <div className="flex items-center gap-4 bg-muted/20 p-4 rounded-xl border mb-2">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <User className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-extrabold text-slate-800 dark:text-slate-200">{name}</p>
              <p className="text-xs text-muted-foreground">{phone || 'No phone registered'}</p>
            </div>
            <div className="ml-auto bg-red-50 dark:bg-red-950/30 px-3 py-1 border border-red-100 rounded-lg text-xs font-black text-red-600 dark:text-red-400">
              Blood Type: {formatBloodGroup(bloodGroup)}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                City
              </label>
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 transition-colors text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                Area / Locality
              </label>
              <input
                type="text"
                required
                value={area}
                onChange={(e) => setArea(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 transition-colors text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
              Last Donation Date
            </label>
            <input
              type="date"
              value={lastDonationDate}
              onChange={(e) => setLastDonationDate(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 transition-colors text-sm"
            />
            <span className="text-[10px] text-muted-foreground mt-1 block leading-normal">
              Changing this date will automatically update your active cooldown timer (56 days) and eligibility status. Leave blank if you have never donated blood.
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
              Remarks / Health History Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any comments regarding active medical conditions or medicines."
              rows={3}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 transition-colors text-sm"
            />
          </div>

          <div className="flex justify-end pt-3">
            <button
              type="submit"
              disabled={saving}
              className="bg-primary hover:bg-primary/95 text-white font-bold py-2 px-5 rounded-lg transition-all flex items-center gap-2 shadow-md disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
