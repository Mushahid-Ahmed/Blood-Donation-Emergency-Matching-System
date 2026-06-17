"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Heart, Loader2 } from 'lucide-react';
import { Role, BloodGroup } from '@prisma/client';
import { formatBloodGroup, getAllBloodGroups } from '@/lib/blood-compatibility';

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState<Role>(Role.DONOR);
  
  // Common Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');

  // Donor-specific Fields
  const [bloodGroup, setBloodGroup] = useState<BloodGroup>(BloodGroup.O_POS);
  const [city, setCity] = useState('');
  const [area, setArea] = useState('');
  const [lastDonationDate, setLastDonationDate] = useState('');
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [eligibilityWarning, setEligibilityWarning] = useState<string | null>(null);

  const handleLastDonationChange = (dateStr: string) => {
    setLastDonationDate(dateStr);
    if (!dateStr) {
      setEligibilityWarning(null);
      return;
    }

    const selectedDate = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - selectedDate.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 56) {
      setEligibilityWarning(`Note: Since your last donation was ${diffDays} days ago (less than the 56-day cooldown), you will be registered but marked as "Currently Ineligible" until the cooldown expires.`);
    } else {
      setEligibilityWarning(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const isDonor = role === Role.DONOR;
      const endpoint = isDonor ? '/api/donors' : '/api/auth/register';

      const payload = isDonor
        ? { name, email, password, phone, role, bloodGroup, city, area, lastDonationDate: lastDonationDate || null, notes }
        : { name, email, password, phone, role };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to register account.');
      }

      // Automatically redirect to login page after successful registration
      router.push('/login?registered=true');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-0 left-0 w-full h-full z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-red-500/10 blur-[120px] dark:bg-red-900/10" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-rose-500/10 blur-[100px] dark:bg-rose-950/10" />
      </div>

      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl border shadow-xl p-8 z-10 animate-in fade-in zoom-in duration-200">
        <div className="flex flex-col items-center mb-6">
          <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center mb-3 text-red-600 dark:text-red-400">
            <Heart className="h-6 w-6 fill-current animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">Create Account</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Register on Pakistan's emergency matching system
          </p>
        </div>

        {error && (
          <div className="p-3 mb-4 rounded-lg bg-red-50 border border-red-200 text-xs font-semibold text-red-600 dark:bg-red-950/30 dark:border-red-900/50 dark:text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Role Selection Tabs */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
              Select Your Role
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[Role.DONOR, Role.ATTENDANT, Role.VERIFIER, Role.COORDINATOR].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`py-2 px-3 text-xs font-bold rounded-lg border transition-all ${
                    role === r
                      ? 'bg-red-600 border-red-600 text-white shadow-md'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-700'
                  }`}
                >
                  {r === Role.DONOR ? 'Donor' : r === Role.ATTENDANT ? 'Attendant' : r === Role.VERIFIER ? 'Verifier' : 'Coordinator'}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ali Khan"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                Contact Phone
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="03001234567"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ali@example.com"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 4 characters"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 transition-colors"
              />
            </div>
          </div>

          {/* Donor Dynamic Section */}
          {role === Role.DONOR && (
            <div className="border-t pt-4 space-y-4 animate-in fade-in duration-200">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-2">Donor Details</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                    Blood Group
                  </label>
                  <select
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value as BloodGroup)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 transition-colors"
                  >
                    {getAllBloodGroups().map((bg) => (
                      <option key={bg} value={bg}>{formatBloodGroup(bg)}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Karachi"
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 transition-colors"
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
                    placeholder="Gulshan"
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                  Last Donation Date (Optional)
                </label>
                <input
                  type="date"
                  value={lastDonationDate}
                  onChange={(e) => handleLastDonationChange(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 transition-colors"
                />
                {eligibilityWarning && (
                  <p className="text-[11px] text-yellow-600 font-semibold mt-1 bg-yellow-50 p-2 border border-yellow-100 rounded-lg dark:bg-yellow-950/20 dark:border-yellow-900/50">
                    {eligibilityWarning}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                  Health Notes / Remarks (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any active health status or medication comments"
                  rows={2}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 transition-colors"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-red-600 to-rose-500 text-white font-bold py-2.5 px-4 rounded-lg hover:from-red-700 hover:to-rose-600 transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-red-500/10 focus:outline-none disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating account...
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <div className="mt-6 border-t pt-4 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Already have an account?{' '}
            <Link 
              href="/login" 
              className="font-bold text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
