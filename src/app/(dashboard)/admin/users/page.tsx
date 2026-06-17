"use client";

import React, { useState, useEffect } from 'react';
import PageHeader from '@/components/shared/PageHeader';
import { Users, Search, ToggleLeft, ToggleRight, Loader2 } from 'lucide-react';
import BloodGroupBadge from '@/components/shared/BloodGroupBadge';

interface UserItem {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: 'DONOR' | 'ATTENDANT' | 'VERIFIER' | 'COORDINATOR' | 'ADMIN';
  isActive: boolean;
  donorProfile?: {
    bloodGroup: any;
    city: string;
    area: string;
  };
}

export default function ManageUsersPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const fetchUsers = async () => {
    try {
      const url = new URL('/api/admin/users', window.location.origin);
      if (roleFilter) url.searchParams.append('role', roleFilter);
      if (searchQuery) url.searchParams.append('search', searchQuery);

      const res = await fetch(url.toString());
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    fetchUsers();
  };

  const handleToggleActive = async (userId: string, currentStatus: boolean) => {
    setUpdatingId(userId);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, isActive: !currentStatus }),
      });

      if (res.ok) {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, isActive: !currentStatus } : u));
      }
    } catch (err) {
      console.error('Failed to toggle user activation:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading && users.length === 0) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="User Management" 
        description="Search registered accounts, regulate access permissions, and activate/deactivate users."
      />

      {/* Filter panel */}
      <div className="bg-white dark:bg-slate-900 border rounded-xl p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <form onSubmit={handleSearch} className="flex gap-2 w-full md:max-w-md">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-slate-800 dark:border-slate-700 text-sm"
          />
          <button
            type="submit"
            className="bg-primary hover:bg-primary/95 text-white font-bold py-2 px-4 rounded-lg text-xs flex items-center gap-1"
          >
            <Search className="h-3.5 w-3.5" /> Search
          </button>
        </form>

        <div className="flex gap-2 w-full md:w-auto shrink-0 justify-end">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-slate-50 border rounded-lg px-3 py-2 text-xs font-bold text-slate-800 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 cursor-pointer"
          >
            <option value="">All Roles</option>
            <option value="DONOR">Donors</option>
            <option value="ATTENDANT">Attendants</option>
            <option value="VERIFIER">Verifiers</option>
            <option value="COORDINATOR">Coordinators</option>
            <option value="ADMIN">Admins</option>
          </select>
        </div>
      </div>

      {/* Users table */}
      <div className="bg-white dark:bg-slate-900 border rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50 mb-4 flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Registered Users ({users.length})
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400">
            <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-800 dark:text-slate-300">
              <tr>
                <th scope="col" className="px-6 py-3 font-bold rounded-l-lg">User Name</th>
                <th scope="col" className="px-6 py-3 font-bold">Email</th>
                <th scope="col" className="px-6 py-3 font-bold">Phone</th>
                <th scope="col" className="px-6 py-3 font-bold">Role</th>
                <th scope="col" className="px-6 py-3 font-bold">Donor Type</th>
                <th scope="col" className="px-6 py-3 font-bold">Location</th>
                <th scope="col" className="px-6 py-3 font-bold rounded-r-lg text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-slate-800">
              {users.map((item) => (
                <tr key={item.id} className={`bg-white dark:bg-slate-900 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 ${!item.isActive ? 'opacity-60' : ''}`}>
                  <td className="px-6 py-4 font-semibold text-slate-900 dark:text-slate-100">
                    {item.name}
                  </td>
                  <td className="px-6 py-4 text-slate-800 dark:text-slate-300">
                    {item.email}
                  </td>
                  <td className="px-6 py-4 text-slate-800 dark:text-slate-300">
                    {item.phone || 'N/A'}
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-extrabold text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded tracking-wide">
                      {item.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {item.role === 'DONOR' && item.donorProfile ? (
                      <BloodGroupBadge group={item.donorProfile.bloodGroup} size="sm" />
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-xs">
                    {item.role === 'DONOR' && item.donorProfile ? (
                      <span>{item.donorProfile.area}, {item.donorProfile.city}</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => handleToggleActive(item.id, item.isActive)}
                      disabled={updatingId !== null}
                      className={`font-semibold text-xs flex items-center justify-center gap-1 mx-auto transition-colors focus:outline-none ${
                        item.isActive 
                          ? 'text-green-600 hover:text-green-700' 
                          : 'text-red-500 hover:text-red-600'
                      }`}
                    >
                      {updatingId === item.id ? (
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      ) : item.isActive ? (
                        <>
                          <ToggleRight className="h-6 w-6 text-green-600 shrink-0" />
                          <span>Active</span>
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="h-6 w-6 text-red-500 shrink-0" />
                          <span>Suspended</span>
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
