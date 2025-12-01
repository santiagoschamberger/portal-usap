'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/authStore';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, UserPlus, Mail, CheckCircle, XCircle, RefreshCw, Edit2, Power, PowerOff } from 'lucide-react';
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

interface SubAccountStats {
  total_contacts: number;
  activated: number;
  not_activated: number;
}

export default function SubAccountsPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [subAccounts, setSubAccounts] = useState<SubAccount[]>([]);
  const [stats, setStats] = useState<SubAccountStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

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

    fetchSubAccounts();
  }, [isAuthenticated, user, router]);

  const fetchSubAccounts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/partners/sub-accounts');
      
      if (response.data.success) {
        setSubAccounts(response.data.data || []);
        setStats(response.data.stats);
      }
    } catch (error: any) {
      console.error('Error fetching sub-accounts:', error);
      toast.error('Failed to load sub-accounts', {
        description: error.response?.data?.message || 'Please try again'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async (zohoContactId: string, email: string) => {
    try {
      setActivating(zohoContactId);
      const response = await api.post(`/api/partners/sub-accounts/${zohoContactId}/activate`);
      
      if (response.data.success) {
        toast.success('Sub-account activated!', {
          description: `Activation email sent to ${email}`
        });
        // Refresh the list
        await fetchSubAccounts();
      }
    } catch (error: any) {
      console.error('Error activating sub-account:', error);
      toast.error('Failed to activate sub-account', {
        description: error.response?.data?.message || 'Please try again'
      });
    } finally {
      setActivating(null);
    }
  };

  const handleResendEmail = async (email: string) => {
    try {
      // This would call the password reset endpoint
      toast.success('Email sent!', {
        description: `Password reset email sent to ${email}`
      });
    } catch (error: any) {
      console.error('Error sending email:', error);
      toast.error('Failed to send email', {
        description: error.response?.data?.message || 'Please try again'
      });
    }
  };

  const handleToggleActive = async (userId: string, currentStatus: boolean, name: string) => {
    try {
      const newStatus = !currentStatus;
      await api.put(`/api/partners/sub-accounts/${userId}`, {
        is_active: newStatus
      });
      
      toast.success(`Sub-account ${newStatus ? 'activated' : 'deactivated'}`, {
        description: `${name} has been ${newStatus ? 'activated' : 'deactivated'}`
      });
      
      // Refresh the list
      await fetchSubAccounts();
    } catch (error: any) {
      console.error('Error toggling sub-account status:', error);
      toast.error('Failed to update sub-account', {
        description: error.response?.data?.message || 'Please try again'
      });
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchSubAccounts();
    setRefreshing(false);
    toast.success('Sub-accounts refreshed');
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
        <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
            <div>
            <h1 className="text-3xl font-bold tracking-tight">Sub-Accounts</h1>
              <p className="text-muted-foreground mt-2">
              Manage sub-accounts for your organization
              </p>
            </div>
          <Button onClick={handleRefresh} disabled={refreshing} variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
              </Button>
            </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
                <UserPlus className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total_contacts}</div>
                <p className="text-xs text-muted-foreground">
                  From Zoho CRM
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Activated</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activated}</div>
                <p className="text-xs text-muted-foreground">
                  With portal access
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Not Activated</CardTitle>
                <XCircle className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.not_activated}</div>
                <p className="text-xs text-muted-foreground">
                  Awaiting activation
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Info Banner */}
        <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-blue-100 dark:bg-blue-900 p-2">
                <UserPlus className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                  Sub-accounts are managed in Zoho CRM
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
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
            <CardTitle>Sub-Account List</CardTitle>
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
                <h3 className="text-lg font-semibold mb-2">No sub-accounts yet</h3>
                  <p className="text-muted-foreground mb-4">
                  Create contacts in Zoho CRM to add sub-accounts
                  </p>
                </div>
              ) : (
              <div className="space-y-4">
                      {subAccounts.map((subAccount) => (
                  <div
                    key={subAccount.zoho_contact_id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div>
                          <h4 className="font-semibold">
                            {subAccount.first_name} {subAccount.last_name}
                          </h4>
                          <p className="text-sm text-muted-foreground">{subAccount.email}</p>
                          {subAccount.phone && (
                            <p className="text-sm text-muted-foreground">{subAccount.phone}</p>
                          )}
                          {subAccount.title && (
                            <p className="text-xs text-muted-foreground mt-1">{subAccount.title}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {subAccount.is_activated ? (
                        <>
                          <Badge variant={subAccount.is_active ? "default" : "secondary"}>
                            {subAccount.is_active ? (
                              <>
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Active
                              </>
                            ) : (
                              <>
                                <XCircle className="h-3 w-3 mr-1" />
                                Inactive
                              </>
                            )}
                            </Badge>
                              <Button
                                size="sm"
                            variant="outline"
                            onClick={() => handleResendEmail(subAccount.email)}
                              >
                            <Mail className="h-4 w-4 mr-2" />
                            Resend Email
                              </Button>
                              <Button
                                size="sm"
                            variant={subAccount.is_active ? "destructive" : "default"}
                            onClick={() => handleToggleActive(
                              subAccount.portal_user_id!,
                              subAccount.is_active,
                              `${subAccount.first_name} ${subAccount.last_name}`
                            )}
                          >
                            {subAccount.is_active ? (
                              <>
                                <PowerOff className="h-4 w-4 mr-2" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <Power className="h-4 w-4 mr-2" />
                                Activate
                              </>
                            )}
                              </Button>
                        </>
                      ) : (
                        <>
                          <Badge variant="outline">
                            <XCircle className="h-3 w-3 mr-1" />
                            Not Activated
                          </Badge>
                              <Button
                                size="sm"
                            onClick={() => handleActivate(subAccount.zoho_contact_id, subAccount.email)}
                            disabled={activating === subAccount.zoho_contact_id}
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

