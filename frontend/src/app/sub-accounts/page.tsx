'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, UserPlus, Mail, RefreshCw, PowerOff } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';

interface SubAccount {
  zoho_contact_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  title: string;
  is_activated: boolean;
  portal_user_id: string | null;
  is_active: boolean;
  created_at: string;
  activated_at: string | null;
}

export default function SubAccountsPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [subAccounts, setSubAccounts] = useState<SubAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [resendingEmail, setResendingEmail] = useState<string | null>(null);
  const [togglingActive, setTogglingActive] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    // Only admins can access sub-accounts page
    if (user?.role !== 'admin') {
      toast.error('Access denied', {
        description: 'Only main partners can manage sub-accounts'
      });
      router.push('/dashboard');
      return;
    }

    // Initial load - show toast
    const loadInitialData = async () => {
      await fetchSubAccounts(true);
    };
    loadInitialData();
  }, [isAuthenticated, user, router]);

  const fetchSubAccounts = async (showToast = false) => {
    try {
      setLoading(true);
      if (showToast) {
        toast.loading('Loading sub-accounts...', { id: 'fetch-subaccounts' });
      }
      const response = await api.get('/api/partners/sub-accounts');
      
      if (response.data.success) {
        setSubAccounts(response.data.data || []);
        if (showToast) {
          toast.success('Sub-accounts loaded successfully', { 
            id: 'fetch-subaccounts',
            description: `Found ${response.data.data?.length || 0} sub-account(s)`
          });
        }
      }
    } catch (error: any) {
      console.error('Error fetching sub-accounts:', error);
      toast.error('Failed to load sub-accounts', {
        id: 'fetch-subaccounts',
        description: error.response?.data?.message || 'Please try again'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async (zohoContactId: string, email: string, name: string) => {
    try {
      setActivating(zohoContactId);
      toast.loading('Activating sub-account...', { id: `activate-${zohoContactId}` });
      
      const response = await api.post(`/api/partners/sub-accounts/${zohoContactId}/activate`);
      
      if (response.data.success) {
        toast.success('Sub-account activated successfully!', {
          id: `activate-${zohoContactId}`,
          description: `${name} can now access the portal. Activation email sent to ${email}`
        });
        // Refresh the list
        await fetchSubAccounts();
      }
    } catch (error: any) {
      console.error('Error activating sub-account:', error);
      toast.error('Failed to activate sub-account', {
        id: `activate-${zohoContactId}`,
        description: error.response?.data?.message || 'Please try again'
      });
    } finally {
      setActivating(null);
    }
  };

  const handleResendEmail = async (email: string, name: string) => {
    try {
      setResendingEmail(email);
      toast.loading('Sending password reset email...', { id: `resend-${email}` });
      
      // Call the password reset endpoint
      const response = await api.post('/api/auth/reset-password', { email });
      
      toast.success('Password reset email sent!', {
        id: `resend-${email}`,
        description: `${name} will receive instructions at ${email}`
      });
    } catch (error: any) {
      console.error('Error sending email:', error);
      toast.error('Failed to send password reset email', {
        id: `resend-${email}`,
        description: error.response?.data?.message || 'Please try again'
      });
    } finally {
      setResendingEmail(null);
    }
  };

  const handleToggleActive = async (userId: string, currentStatus: boolean, name: string) => {
    try {
      setTogglingActive(userId);
      const newStatus = !currentStatus;
      
      toast.loading(`Deactivating sub-account...`, { id: `toggle-${userId}` });
      
      await api.put(`/api/partners/sub-accounts/${userId}`, {
        is_active: newStatus
      });
      
      toast.success(`Sub-account ${newStatus ? 'activated' : 'deactivated'} successfully!`, {
        id: `toggle-${userId}`,
        description: `${name} ${newStatus ? 'can now' : 'can no longer'} access the portal`
      });
      
      // Refresh the list
      await fetchSubAccounts();
    } catch (error: any) {
      console.error('Error toggling sub-account status:', error);
      toast.error('Failed to update sub-account status', {
        id: `toggle-${userId}`,
        description: error.response?.data?.message || 'Please try again'
      });
    } finally {
      setTogglingActive(null);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      toast.loading('Refreshing sub-accounts...', { id: 'refresh-subaccounts' });
      await fetchSubAccounts();
      toast.success('Sub-accounts refreshed successfully!', {
        id: 'refresh-subaccounts',
        description: 'Your list is up to date'
      });
    } catch (error: any) {
      toast.error('Failed to refresh sub-accounts', {
        id: 'refresh-subaccounts',
        description: 'Please try again'
      });
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
      <DashboardLayout>
        <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
            <div>
            <h1 className="text-2xl font-semibold tracking-tight">Sub-Accounts</h1>
              <p className="text-sm text-muted-foreground mt-1">
              Manage sub-accounts for your organization
              </p>
            </div>
          <Button onClick={handleRefresh} disabled={refreshing} variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
              </Button>
            </div>

        {/* Info Banner */}
        <Card className="border">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-muted p-2">
                <UserPlus className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold">
                  Sub-accounts are managed in Zoho CRM
                </h3>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                  To add new sub-accounts, create Contacts in Zoho CRM and link them to your partner account.
                  They will appear here automatically and you can activate their portal access.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sub-Accounts List */}
          <Card>
            <CardHeader>
            <CardTitle className="text-base">Sub-Account List</CardTitle>
              <CardDescription>
              {subAccounts.length === 0 
                ? 'No sub-accounts found. Create contacts in Zoho CRM to get started.'
                : `Showing ${subAccounts.length} sub-account${subAccounts.length !== 1 ? 's' : ''}`
              }
              </CardDescription>
            </CardHeader>
            <CardContent>
            {subAccounts.length === 0 ? (
              <div className="text-center py-12">
                <UserPlus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-base font-semibold mb-2">No sub-accounts yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                  Create contacts in Zoho CRM to add sub-accounts
                  </p>
                </div>
              ) : (
              <div className="space-y-2">
                      {subAccounts.map((subAccount) => (
                  <div
                    key={subAccount.zoho_contact_id}
                    className="flex flex-col gap-3 border rounded-lg px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">
                        {subAccount.first_name} {subAccount.last_name}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">{subAccount.email}</div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                      {subAccount.is_activated ? (
                        <>
                              <Button
                                size="sm"
                            variant="outline"
                            onClick={() => handleResendEmail(subAccount.email, `${subAccount.first_name} ${subAccount.last_name}`)}
                            disabled={resendingEmail === subAccount.email}
                            className="h-8 text-xs transition-colors hover:bg-accent"
                              >
                            {resendingEmail === subAccount.email ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Sending...
                              </>
                            ) : (
                              <>
                                <Mail className="h-4 w-4 mr-2" />
                                Send password reset
                              </>
                            )}
                              </Button>
                              {subAccount.is_active && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleToggleActive(
                                    subAccount.portal_user_id!,
                                    subAccount.is_active,
                                    `${subAccount.first_name} ${subAccount.last_name}`
                                  )}
                                  disabled={togglingActive === subAccount.portal_user_id}
                                  className="h-8 text-xs transition-colors hover:bg-accent"
                                >
                                  {togglingActive === subAccount.portal_user_id ? (
                                    <>
                                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                      Deactivating...
                                    </>
                                  ) : (
                                    <>
                                      <PowerOff className="h-4 w-4 mr-2" />
                                      Deactivate
                                    </>
                                  )}
                                </Button>
                              )}
                        </>
                      ) : (
                        <>
                              <Button
                                size="sm"
                            variant="outline"
                            onClick={() => handleActivate(
                              subAccount.zoho_contact_id, 
                              subAccount.email,
                              `${subAccount.first_name} ${subAccount.last_name}`
                            )}
                            disabled={activating === subAccount.zoho_contact_id}
                            className="h-8 text-xs transition-colors hover:bg-accent"
                          >
                            {activating === subAccount.zoho_contact_id ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Activating...
                              </>
                            ) : (
                              <>
                                <UserPlus className="h-4 w-4 mr-2" />
                                Activate Portal Access
                              </>
                            )}
                              </Button>
                        </>
                      )}
                    </div>
                            </div>
                      ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
  );
}

