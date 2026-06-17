"use client";

import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Heart, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        // Customize error message for better UX
        if (res.error.includes('Read decrypter') || res.error.includes('CredentialsSignin')) {
          setError('Invalid email or password.');
        } else {
          setError(res.error);
        }
        setLoading(false);
      } else {
        // Successful login, fetch user session to redirect based on role
        const sessionRes = await fetch('/api/auth/session');
        const session = await sessionRes.json();
        
        if (session?.user?.role) {
          const role = session.user.role.toLowerCase();
          router.push(`/${role}`);
          router.refresh();
        } else {
          router.push('/');
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center items-center px-4 relative overflow-hidden">
      {/* Dynamic Background Gradients */}
      <div className="absolute top-0 left-0 w-full h-full z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-red-500/10 blur-[120px] dark:bg-red-900/10" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-orange-500/10 blur-[100px] dark:bg-orange-950/10" />
      </div>

      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border shadow-xl p-8 z-10 animate-in fade-in zoom-in duration-200">
        <div className="flex flex-col items-center mb-8">
          <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center mb-3 text-red-600 dark:text-red-400">
            <Heart className="h-6 w-6 fill-current animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">Welcome Back</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Emergency Blood Matching System
          </p>
        </div>

        {error && (
          <div className="p-3 mb-4 rounded-lg bg-red-50 border border-red-200 text-xs font-semibold text-red-600 dark:bg-red-950/30 dark:border-red-900/50 dark:text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 transition-colors"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Password
              </label>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 transition-colors pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 focus:outline-none"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-red-600 to-rose-500 text-white font-bold py-2.5 px-4 rounded-lg hover:from-red-700 hover:to-rose-600 transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-red-500/10 focus:outline-none disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="mt-6 border-t pt-4 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Don't have an account?{' '}
            <Link 
              href="/register" 
              className="font-bold text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
            >
              Register here
            </Link>
          </p>
          <div className="mt-4 text-xs text-slate-400">
            <span className="font-semibold">Demo Credentials:</span> admin@bloodmatch.com / admin123
          </div>
        </div>
      </div>
    </div>
  );
}
