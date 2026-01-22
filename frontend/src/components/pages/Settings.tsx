import { Card, CardContent, CardHeader, CardTitle } from '../ui/Cards';
import { Badge } from '../ui/Badges';
import { Button } from '../ui/Buttons';
import { Building, Shield, Bell, Users, AlertCircle, MapPin, Phone, Globe, Plus, Edit, MoreVertical } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { LawFirm, CreateLawFirmData, UpdateLawFirmData } from '../../types/Types';
import { apiRequest } from '../lib/api';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { AddLawFirmModal } from './AddLawFirmModal';
import { EditLawFirmModal } from './EditLawFirmModal';

const useToast = () => {
   const toast = (options: { title: string, description: string, variant?: string }) => {
     if (options.variant === 'destructive') {
       alert(`Error: ${options.title}\n${options.description}`);
     } else {
       alert(`Success: ${options.title}\n${options.description}`);
     }
   };
   return { toast };
 };

export function Settings() {
  const [lawFirms, setLawFirms] = useState<LawFirm[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingFirm, setEditingFirm] = useState<LawFirm | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchLawFirms();
  }, []);

  const fetchLawFirms = async () => {
    try {
      setLoading(true);
      const result = await apiRequest<LawFirm[]>('/api/law-firms');
      if (result.data) {
        setLawFirms(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch law firms:', error);
      toast({
        title: 'Error',
        description: 'Failed to load law firms',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddLawFirm = async (firmData: CreateLawFirmData) => {
    try {
      const result = await apiRequest<LawFirm>('/api/law-firms', {
        method: 'POST',
        body: JSON.stringify(firmData),
      });

      if (result.error) {
        toast({
          title: 'Error',
          description: result.error,
          variant: 'destructive',
        });
        return false;
      }

      toast({
        title: 'Success',
        description: 'Law firm created successfully',
      });
      fetchLawFirms();
      return true;
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create law firm',
        variant: 'destructive',
      });
      return false;
    }
  };

  const handleUpdateLawFirm = async (firmId: number, updateData: UpdateLawFirmData) => {
    try {
      const result = await apiRequest<LawFirm>(`/api/law-firms/${firmId}`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });

      if (result.error) {
        toast({
          title: 'Error',
          description: result.error,
          variant: 'destructive',
        });
        return false;
      }

      toast({
        title: 'Success',
        description: 'Law firm updated successfully',
      });
      fetchLawFirms();
      return true;
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update law firm',
        variant: 'destructive',
      });
      return false;
    }
  };

  const formatLocation = (firm: LawFirm) => {
    const parts = [];
    if (firm.city) parts.push(firm.city);
    if (firm.country) parts.push(firm.country);
    return parts.join(', ') || 'Location not set';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatLastActive = (dateString: string) => {
    const lastActive = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - lastActive.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  const calculatePlan = (firm: LawFirm) => {
    if (firm.member_count >= 30) return 'Enterprise';
    if (firm.member_count >= 15) return 'Professional';
    return 'Starter';
  };

  const planColors = {
    'Enterprise': 'bg-purple-500/10 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300',
    'Professional': 'bg-blue-500/10 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300',
    'Starter': 'bg-green-500/10 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300'
  };

  const getStatus = (firm: LawFirm) => {
    const lastActive = new Date(firm.last_active_at);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays > 30) return { status: 'inactive', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300' };
    if (diffDays > 7) return { status: 'warning', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' };
    return { status: 'active', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' };
  };

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Firm Management</h1>
        <p className="text-muted-foreground text-sm">Manage law firms and their subscription settings</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="hover:border-primary/50 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Building className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Total Firms</h3>
            </div>
            <p className="text-2xl font-bold text-foreground">{lawFirms.length}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {lawFirms.filter(f => getStatus(f).status === 'active').length} active firms
            </p>
          </CardContent>
        </Card>

        <Card className="hover:border-accent/50 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-accent" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Total Members</h3>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {lawFirms.reduce((sum, firm) => sum + (firm.member_count || 0), 0)}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Across all law firms
            </p>
          </CardContent>
        </Card>

        <Card className="hover:border-warning/50 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <Bell className="w-5 h-5 text-warning" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Active Cases</h3>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {lawFirms.reduce((sum, firm) => sum + (firm.case_count || 0), 0)}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Total cases across all firms
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Law Firms Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Law Firms Management</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Manage law firms and their subscription plans
              </p>
            </div>
            <Button 
              onClick={() => setShowAddModal(true)}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Add New Firm
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground mt-4">Loading law firms...</p>
            </div>
          ) : lawFirms.length === 0 ? (
            <div className="p-8 text-center">
              <Building className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No law firms found</h3>
              <p className="text-muted-foreground mb-4">Start by adding your first law firm</p>
              <Button onClick={() => setShowAddModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Firm
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50 border-y border-border">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Firm Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Plan
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Metrics
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Joined Date
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {lawFirms.map((firm) => {
                    const plan = calculatePlan(firm);
                    const status = getStatus(firm);
                    
                    return (
                      <tr key={firm.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                              {firm.logo_url ? (
                                <img 
                                  src={firm.logo_url} 
                                  alt={firm.name}
                                  className="w-8 h-8 rounded object-cover"
                                />
                              ) : (
                                <Building className="w-5 h-5 text-primary" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">{firm.name}</p>
                              <div className="flex flex-col gap-1 mt-1">
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <Globe className="w-3 h-3 flex-shrink-0" />
                                  <span className="truncate">{firm.email}</span>
                                </div>
                                {firm.phone && (
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Phone className="w-3 h-3 flex-shrink-0" />
                                    <span>{firm.phone}</span>
                                  </div>
                                )}
                                {(firm.city || firm.country) && (
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <MapPin className="w-3 h-3 flex-shrink-0" />
                                    <span>{formatLocation(firm)}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge
                            className={`border ${planColors[plan as keyof typeof planColors]}`}
                          >
                            {plan}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm font-medium text-foreground">{firm.member_count || 0}</span>
                              <span className="text-xs text-muted-foreground">members</span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {firm.case_count || 0} cases
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {firm.storage_used_mb?.toFixed(1) || '0'} MB used
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge className={status.color}>
                            {status.status === 'active' ? 'Active' : 
                             status.status === 'warning' ? 'Warning' : 'Inactive'}
                          </Badge>
                          {firm.last_active_at && (
                            <div className="text-xs text-muted-foreground mt-1">
                              Last active {formatLastActive(firm.last_active_at)}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-foreground">
                            {formatDate(firm.joined_date)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => setEditingFirm(firm)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Firm
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-red-600">
                                View Analytics
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600">
                                Deactivate Firm
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Compliance Notice */}
      <Card className="border-warning/50 bg-warning/5">
        <CardContent className="p-6">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-foreground mb-1">Compliance & Security Guidelines</h4>
              <p className="text-sm text-muted-foreground">
                • All law firms must maintain compliance with local bar association rules and data protection regulations.<br/>
                • Regular security audits are required for firms handling sensitive client data.<br/>
                • Ensure that all member attorneys have valid licenses and that the firm maintains
                adequate malpractice insurance as required by jurisdiction.<br/>
                • Monitor storage usage and case activity regularly to ensure optimal performance.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      {showAddModal && (
        <AddLawFirmModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAddLawFirm}
        />
      )}

      {editingFirm && (
        <EditLawFirmModal
          isOpen={!!editingFirm}
          onClose={() => setEditingFirm(null)}
          firm={editingFirm}
          onSubmit={handleUpdateLawFirm}
        />
      )}
    </div>
  );
}