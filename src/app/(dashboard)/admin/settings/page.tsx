"use client";

import React, { useState, useEffect, useCallback } from 'react';
import PageHeader from '@/components/shared/PageHeader';
import {
  Settings,
  Clock,
  CalendarDays,
  Shield,
  Save,
  Loader2,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Info,
} from 'lucide-react';

interface ConfigEntry {
  value: string;
  description: string;
}

interface ConfigMap {
  [key: string]: ConfigEntry;
}

// Descriptive metadata for each config key
const CONFIG_META: Record<string, { label: string; icon: any; unit: string; min: number; max: number; color: string }> = {
  COOLDOWN_DAYS: {
    label: 'Donor Cooldown Period',
    icon: CalendarDays,
    unit: 'days',
    min: 1,
    max: 180,
    color: 'text-amber-600',
  },
  REQUEST_EXPIRY_HOURS: {
    label: 'Request Auto-Expiry',
    icon: Clock,
    unit: 'hours',
    min: 1,
    max: 720,
    color: 'text-blue-600',
  },
};

export default function AdminSettingsPage() {
  const [config, setConfig] = useState<ConfigMap>({});
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ key: string; type: 'success' | 'error'; message: string } | null>(null);

  const fetchConfig = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/config');
      if (!res.ok) throw new Error('Failed to fetch configuration');
      const data: ConfigMap = await res.json();
      setConfig(data);
      // Initialize edit values
      const initial: Record<string, string> = {};
      Object.entries(data).forEach(([key, entry]) => {
        initial[key] = entry.value;
      });
      setEditValues(initial);
    } catch (err) {
      console.error('Failed to fetch system config:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const handleSave = async (key: string) => {
    const newValue = editValues[key];
    const meta = CONFIG_META[key];

    // Validation
    const numVal = Number(newValue);
    if (isNaN(numVal) || numVal < (meta?.min ?? 0) || numVal > (meta?.max ?? Infinity)) {
      setFeedback({
        key,
        type: 'error',
        message: `Value must be a number between ${meta?.min ?? 0} and ${meta?.max ?? '∞'}`,
      });
      return;
    }

    // Don't save if value hasn't changed
    if (config[key]?.value === newValue) {
      setFeedback({ key, type: 'success', message: 'No changes to save' });
      setTimeout(() => setFeedback(null), 2000);
      return;
    }

    setSavingKey(key);
    setFeedback(null);

    try {
      const res = await fetch('/api/admin/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value: newValue }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update');
      }

      // Update local state
      setConfig(prev => ({
        ...prev,
        [key]: { ...prev[key], value: newValue },
      }));

      setFeedback({
        key,
        type: 'success',
        message: key === 'COOLDOWN_DAYS'
          ? 'Saved! Donor eligibility is being recalculated...'
          : 'Configuration updated successfully',
      });

      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      setFeedback({ key, type: 'error', message: err.message || 'Update failed' });
    } finally {
      setSavingKey(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const configKeys = Object.keys(config);

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader
        title="System Settings"
        description="Configure global parameters that govern the Blood Match platform's matching rules, eligibility criteria, and request lifecycle."
      />

      {/* Info Banner */}
      <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl">
        <Info className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
        <div className="text-sm text-blue-800 dark:text-blue-200">
          <p className="font-semibold">Changes take effect immediately.</p>
          <p className="text-blue-600 dark:text-blue-300 mt-0.5">
            Modifying the cooldown period will trigger a background recalculation of all donor eligibility statuses.
          </p>
        </div>
      </div>

      {/* Config Cards */}
      <div className="space-y-4">
        {configKeys.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border rounded-xl p-12 text-center">
            <Settings className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm font-semibold text-muted-foreground">No configuration parameters found.</p>
            <p className="text-xs text-muted-foreground mt-1">Run the seed script to initialize default values.</p>
          </div>
        ) : (
          configKeys.map((key) => {
            const entry = config[key];
            const meta = CONFIG_META[key] || {
              label: key,
              icon: Settings,
              unit: '',
              min: 0,
              max: 9999,
              color: 'text-slate-600',
            };
            const Icon = meta.icon;
            const isSaving = savingKey === key;
            const hasFeedback = feedback?.key === key;
            const hasChanged = editValues[key] !== entry.value;

            return (
              <div
                key={key}
                className="bg-white dark:bg-slate-900 border rounded-xl p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                {/* Header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className={`h-10 w-10 rounded-lg bg-slate-50 dark:bg-slate-950 flex items-center justify-center ${meta.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                      {meta.label}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{entry.description}</p>
                  </div>
                </div>

                {/* Value Editor */}
                <div className="flex items-end gap-3">
                  <div className="flex-1">
                    <label
                      htmlFor={`config-${key}`}
                      className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5"
                    >
                      Current Value
                    </label>
                    <div className="relative">
                      <input
                        id={`config-${key}`}
                        type="number"
                        min={meta.min}
                        max={meta.max}
                        value={editValues[key] ?? ''}
                        onChange={(e) =>
                          setEditValues(prev => ({ ...prev, [key]: e.target.value }))
                        }
                        className="w-full px-3 py-2.5 text-sm font-semibold border rounded-lg bg-slate-50 dark:bg-slate-950 
                                   focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all
                                   text-slate-800 dark:text-slate-100"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
                        {meta.unit}
                      </span>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-[10px] text-muted-foreground">
                        Min: {meta.min} {meta.unit}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        Max: {meta.max} {meta.unit}
                      </span>
                    </div>
                  </div>

                  {/* Save Button */}
                  <button
                    onClick={() => handleSave(key)}
                    disabled={isSaving || !hasChanged}
                    className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold rounded-lg transition-all
                      ${hasChanged
                        ? 'bg-primary text-white hover:bg-primary/90 shadow-md shadow-primary/10'
                        : 'bg-slate-100 dark:bg-slate-800 text-muted-foreground cursor-not-allowed'
                      }
                      ${isSaving ? 'opacity-60' : ''}
                    `}
                  >
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    {isSaving ? 'Saving...' : 'Save'}
                  </button>
                </div>

                {/* Feedback Toast */}
                {hasFeedback && (
                  <div
                    className={`mt-3 flex items-center gap-2 p-2.5 rounded-lg text-xs font-semibold
                      ${feedback.type === 'success'
                        ? 'bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800'
                        : 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
                      }
                    `}
                  >
                    {feedback.type === 'success' ? (
                      <CheckCircle className="h-4 w-4 shrink-0" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 shrink-0" />
                    )}
                    {feedback.message}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Security Notice */}
      <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl">
        <Shield className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
        <div className="text-xs text-amber-800 dark:text-amber-200">
          <p className="font-semibold">Audit Trail Active</p>
          <p className="text-amber-600 dark:text-amber-300 mt-0.5">
            All configuration changes are logged with your admin credentials and timestamp for accountability.
          </p>
        </div>
      </div>

      {/* Refresh Button */}
      <div className="flex justify-end">
        <button
          onClick={fetchConfig}
          className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-muted-foreground 
                     hover:text-foreground border rounded-lg hover:bg-muted/50 transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh Configuration
        </button>
      </div>
    </div>
  );
}
