import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../services/api';
import { AdminUser } from '../types';
import { Users, Search, RefreshCw, Mail, Calendar, Target, Award } from 'lucide-react';

export const AdminUsersPage: React.FC = () => {
  const { t } = useTranslation();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getAdminUsers();
      setUsers(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load learners list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter((u) => {
    const q = search.toLowerCase();
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Users className="w-8 h-8 text-indigo-600" />
            {t('admin.usersTitle')}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Registered students, their practice attempts, and average Confidence Gap.
          </p>
        </div>
        <button
          onClick={fetchUsers}
          className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 shadow-sm transition"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-6 relative max-w-md">
        <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search learners by name or email..."
          className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
        />
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 mb-6 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="bg-white rounded-2xl p-12 border border-gray-200 text-center shadow-sm">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 text-sm">Loading learners data...</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-gray-200 text-center shadow-sm">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-gray-900 mb-1">No learners found</h3>
          <p className="text-sm text-gray-500">
            {search ? 'Try adjusting your search criteria.' : 'When learners sign up, they will appear here.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3.5 text-left font-semibold text-gray-900">
                    {t('admin.userName')}
                  </th>
                  <th scope="col" className="px-6 py-3.5 text-left font-semibold text-gray-900">
                    {t('admin.userEmail')}
                  </th>
                  <th scope="col" className="px-6 py-3.5 text-left font-semibold text-gray-900">
                    Preferred Language
                  </th>
                  <th scope="col" className="px-6 py-3.5 text-left font-semibold text-gray-900">
                    {t('admin.joinedDate')}
                  </th>
                  <th scope="col" className="px-6 py-3.5 text-center font-semibold text-gray-900">
                    {t('admin.attempts')}
                  </th>
                  <th scope="col" className="px-6 py-3.5 text-center font-semibold text-gray-900">
                    {t('admin.avgUserGap')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {filteredUsers.map((user) => {
                  const gap = user.average_gap;
                  const isCalibrated = Math.abs(gap) <= 15;
                  const isOverconfident = gap > 15;

                  return (
                    <tr key={user.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs uppercase">
                            {user.name.charAt(0)}
                          </div>
                          <span>{user.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                        <span className="flex items-center gap-2">
                          <Mail className="w-3.5 h-3.5 text-gray-400" />
                          {user.email}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600 uppercase text-xs font-semibold">
                        <span className="px-2 py-0.5 bg-gray-100 rounded text-gray-700">
                          {user.language || 'en'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500 text-xs">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="inline-flex items-center gap-1 font-semibold text-gray-700 px-2.5 py-1 bg-gray-50 rounded-full text-xs">
                          <Target className="w-3 h-3 text-indigo-500" />
                          {user.attempts_count}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {user.attempts_count > 0 ? (
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                              isCalibrated
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : isOverconfident
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-blue-50 text-blue-700 border border-blue-200'
                            }`}
                          >
                            <Award className="w-3 h-3" />
                            {gap > 0 ? `+${gap}%` : `${gap}%`}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
