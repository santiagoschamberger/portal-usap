'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/authStore';
import { apiClient } from '@/lib/api-client';
import DashboardLayout from '@/components/layout/DashboardLayout';

interface SubAccount {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  is_active: boolean;
  created_at: string;
  lead_stats?: {
    total_leads: number;
    new_leads: number;
    contacted: number;
    qualified: number;
    proposal: number;
    closed_won: number;
    closed_lost: number;
  };
}

export default function SubAccountsPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [subAccounts, setSubAccounts] = useState<SubAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activatingId, setActivatingId] = useState<string | null>(null);
  const [newSubAccount, setNewSubAccount] = useState({
    email: '',
    first_name: '',
    last_name: ''
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    // Only admins can manage sub-accounts
    if (user?.role !== 'admin') {
      router.push('/dashboard');
      return;
    }

    fetchSubAccounts();
  }, [isAuthenticated, user, router]);

  const fetchSubAccounts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get('/api/partners/sub-accounts');
      setSubAccounts(response.data.data || []);
    } catch (err: any) {
      console.error('Error fetching sub-accounts:', err);
      setError(err.response?.data?.message || 'Failed to load sub-accounts');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      await apiClient.post('/api/partners/sub-accounts', newSubAccount);
      setShowCreateModal(false);
      setNewSubAccount({ email: '', first_name: '', last_name: '' });
      fetchSubAccounts();
      alert('Sub-account created successfully! Activation email sent.');
    } catch (err: any) {
      console.error('Error creating sub-account:', err);
      setError(err.response?.data?.message || 'Failed to create sub-account');
    }
  };

  const handleActivateAccess = async (subAccountId: string, email: string) => {
    if (!confirm(`Send activation email to ${email}?`)) {
      return;
    }

    try {
      setActivatingId(subAccountId);
      setError(null);
      await apiClient.post(`/api/partners/sub-accounts/${subAccountId}/activate`);
      alert(`Activation email sent to ${email}`);
    } catch (err: any) {
      console.error('Error sending activation email:', err);
      setError(err.response?.data?.message || 'Failed to send activation email');
    } finally {
      setActivatingId(null);
    }
  };

  const handleDeactivate = async (subAccountId: string) => {
    if (!confirm('Are you sure you want to deactivate this sub-account?')) {
      return;
    }

    try {
      setError(null);
      await apiClient.delete(`/api/partners/sub-accounts/${subAccountId}`);
      fetchSubAccounts();
      alert('Sub-account deactivated successfully');
    } catch (err: any) {
      console.error('Error deactivating sub-account:', err);
      setError(err.response?.data?.message || 'Failed to deactivate sub-account');
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Sub-Accounts</h1>
            <p className="text-gray-600 mt-1">
              Manage sub-accounts for your organization
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            + Create Sub-Account
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : subAccounts.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500 mb-4">No sub-accounts yet</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Your First Sub-Account
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Leads
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {subAccounts.map((subAccount) => (
                  <tr key={subAccount.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {subAccount.first_name} {subAccount.last_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{subAccount.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          subAccount.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {subAccount.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {subAccount.lead_stats?.total_leads || 0} total
                      </div>
                      <div className="text-xs text-gray-500">
                        {subAccount.lead_stats?.closed_won || 0} won
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleActivateAccess(subAccount.id, subAccount.email)}
                        disabled={activatingId === subAccount.id}
                        className="text-blue-600 hover:text-blue-900 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {activatingId === subAccount.id ? 'Sending...' : 'Activate Access'}
                      </button>
                      <button
                        onClick={() => handleDeactivate(subAccount.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Deactivate
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Create Sub-Account Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">Create Sub-Account</h2>
              <form onSubmit={handleCreateSubAccount}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={newSubAccount.first_name}
                      onChange={(e) =>
                        setNewSubAccount({ ...newSubAccount, first_name: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={newSubAccount.last_name}
                      onChange={(e) =>
                        setNewSubAccount({ ...newSubAccount, last_name: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={newSubAccount.email}
                      onChange={(e) =>
                        setNewSubAccount({ ...newSubAccount, email: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setNewSubAccount({ email: '', first_name: '', last_name: '' });
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Create & Send Activation
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

