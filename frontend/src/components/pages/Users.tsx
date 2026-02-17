import { Card, CardContent, CardHeader, CardTitle } from '../ui/Cards';
import { Badge } from '../ui/Badges';
import { Button } from '../ui/Buttons';
import { User, Shield, Bell, Users, AlertCircle, Edit, Trash2, MoreVertical } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { User as UserType, UpdateUserData } from '../../types/Types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'; 
import { AddUserModal } from './AddUserModal';
import { EditUserModal } from './EditUserModal';
import { API_URL } from '../../api';

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

export function UserSettings() {
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
    getCurrentUser();
  }, []);

  const getCurrentUser = () => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        setCurrentUser(JSON.parse(userStr));
      } catch (error) {
        console.error('Failed to parse current user:', error);
      }
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        toast({
          title: 'Error',
          description: 'Authentication token not found',
          variant: 'destructive',
        });
        return;
      }

      console.log('Fetching users from API...');
      const response = await fetch(`${API_URL}/api/users`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to fetch users' }));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const usersData = await response.json();
      console.log('Users data received:', usersData);
      
      const filteredUsers = usersData.filter((user: UserType) => 
        user.role === 'associate' || user.role === 'admin' // OR: user.role !== 'client' for both admins and associates
      );
      
      console.log('Filtered users (associates only):', filteredUsers);
      setUsers(filteredUsers);
    } catch (error: any) {
      console.error('Failed to fetch users:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load users',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (userData: any) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast({
          title: 'Error',
          description: 'Authentication token not found',
          variant: 'destructive',
        });
        return false;
      }

      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to create user' }));
        toast({
          title: 'Error',
          description: errorData.error || `HTTP error! status: ${response.status}`,
          variant: 'destructive',
        });
        return false;
      }

      const newUser = await response.json();
      console.log('User created successfully:', newUser);
      
      toast({
        title: 'Success',
        description: 'User created successfully',
      });
      
      // Refresh the users list
      await fetchUsers();
      return true;
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create user',
        variant: 'destructive',
      });
      return false;
    }
  };

  const handleUpdateUser = async (userId: number, updateData: UpdateUserData) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast({
          title: 'Error',
          description: 'Authentication token not found',
          variant: 'destructive',
        });
        return false;
      }

      const response = await fetch(`${API_URL}/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to update user' }));
        toast({
          title: 'Error',
          description: errorData.error || `HTTP error! status: ${response.status}`,
          variant: 'destructive',
        });
        return false;
      }

      const updatedUser = await response.json();
      console.log('User updated successfully:', updatedUser);
      
      toast({
        title: 'Success',
        description: 'User updated successfully',
      });
      
      await fetchUsers();
      return true;
    } catch (error: any) {
      console.error('Error updating user:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update user',
        variant: 'destructive',
      });
      return false;
    }
  };

  const handleToggleUserStatus = async (user: UserType) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast({
          title: 'Error',
          description: 'Authentication token not found',
          variant: 'destructive',
        });
        return;
      }

      const response = await fetch(`${API_URL}/api/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_active: !user.is_active }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to update user status' }));
        toast({
          title: 'Error',
          description: errorData.error || `HTTP error! status: ${response.status}`,
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Success',
        description: `User ${!user.is_active ? 'activated' : 'deactivated'} successfully`,
      });
      await fetchUsers();
    } catch (error: any) {
      console.error('Error toggling user status:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update user status',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteUser = async (user: UserType) => {
    if (!window.confirm(`Are you sure you want to delete ${user.full_name}? This action cannot be undone.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast({
          title: 'Error',
          description: 'Authentication token not found',
          variant: 'destructive',
        });
        return;
      }

      const response = await fetch(`${API_URL}/api/users/${user.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to delete user' }));
        toast({
          title: 'Error',
          description: errorData.error || `HTTP error! status: ${response.status}`,
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Success',
        description: 'User deleted successfully',
      });
      await fetchUsers();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete user',
        variant: 'destructive',
      });
    }
  };

  const getRoleBadgeColor = (role: UserType['role']) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      case 'associate':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusBadgeColor = (isActive: boolean) => {
    return isActive 
      ? 'bg-green-100 text-green-800'
      : 'bg-gray-100 text-gray-800';
  };

  const formatLastLogin = (lastLoginAt: string | null) => {
    if (!lastLoginAt) return 'Never';
    
    try {
      const lastLogin = new Date(lastLoginAt);
      const now = new Date();
      const diffMs = now.getTime() - lastLogin.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      
      return lastLogin.toLocaleDateString();
    } catch (error) {
      return 'Invalid date';
    }
  };

  const getPermissionBadges = (user: UserType) => {
    if (user.role === 'admin') return ['Full System Access', 'User Management', 'All Data Access'];
    if (user.role === 'associate') return ['Case Management', 'Document Access', 'Client Communication'];
    return [];
  };

  const getUserInitials = (fullName: string | null | undefined) => {
    if (!fullName) return 'U';
    return fullName
      .split(' ')
      .map(name => name[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Calculate stats
  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.is_active).length;
  const recentActiveUsers = users.filter(u => {
    if (!u.last_login_at) return false;
    try {
      const lastLogin = new Date(u.last_login_at);
      const now = new Date();
      const diffMs = now.getTime() - lastLogin.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      return diffHours < 24;
    } catch {
      return false;
    }
  }).length;

  // Prevent row click when clicking on dropdown
  const handleRowClick = (e: React.MouseEvent, user: UserType) => {
    // Don't trigger row click if clicking on dropdown or button
    if ((e.target as HTMLElement).closest('button, .dropdown-menu')) {
      return;
    }
    setEditingUser(user);
  };

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Associate Management</h1>
        <p className="text-muted-foreground text-sm">Manage associate users and permissions</p>
      </div>

      {/* Quick Settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="hover:border-primary/50 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Total Associates</h3>
            </div>
            <p className="text-2xl font-bold text-foreground">{totalUsers}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {activeUsers} active associates
            </p>
          </CardContent>
        </Card>

        <Card className="hover:border-accent/50 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-accent" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Active Associates</h3>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {activeUsers}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {activeUsers} out of {totalUsers} associates active
            </p>
          </CardContent>
        </Card>

        <Card className="hover:border-warning/50 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <Bell className="w-5 h-5 text-warning" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Recent Activity</h3>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {recentActiveUsers}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Associates logged in last 24h
            </p>
          </CardContent>
        </Card>
      </div>

      {/* User Management Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Associate Roles & Permissions</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Manage associate access and permissions. Click on any associate to edit.
              </p>
            </div>
            <Button 
              onClick={() => setShowAddModal(true)}
              className="gap-2"
            >
              <Users className="w-4 h-4" />
              Add New Associate
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground mt-4">Loading associates...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No associates found</h3>
              <p className="text-muted-foreground mb-4">Start by adding your first associate</p>
              <Button onClick={() => setShowAddModal(true)}>
                <Users className="w-4 h-4 mr-2" />
                Add Associate
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50 border-y border-border">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Associate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Permissions
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Last Active
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {users.map((user) => (
                    <tr 
                      key={user.id} 
                      className="hover:bg-muted/30 transition-colors"
                      onClick={(e) => handleRowClick(e, user)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-600 flex items-center justify-center text-sm font-medium text-white">
                            {getUserInitials(user.full_name)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{user.full_name || 'Unnamed User'}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                            {user.phone && (
                              <p className="text-xs text-muted-foreground">{user.phone}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={`${getRoleBadgeColor(user.role)} capitalize`}>
                          {user.role}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {getPermissionBadges(user).map((permission, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {permission}
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={`${getStatusBadgeColor(user.is_active)}`}>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                        {formatLastLogin(user.last_login_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => setEditingUser(user)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Associate
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleUserStatus(user)}>
                              {user.is_active ? (
                                <>
                                  <Shield className="mr-2 h-4 w-4" />
                                  Deactivate Associate
                                </>
                              ) : (
                                <>
                                  <User className="mr-2 h-4 w-4" />
                                  Activate Associate
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-red-600"
                              onClick={() => handleDeleteUser(user)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Associate
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security Notice */}
      <Card className="border-warning/50 bg-warning/5">
        <CardContent className="p-6">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-foreground mb-1">Security Best Practices</h4>
              <p className="text-sm text-muted-foreground">
                • Ensure all associates use strong passwords and enable two-factor authentication<br/>
                • Review associate permissions regularly and audit system logs for unusual activity<br/>
                • Only grant admin access to trusted associates who require full system control<br/>
                • Deactivate associate accounts immediately when they leave the firm<br/>
                • This system is designed for legal practice management only and should not be used 
                to store highly sensitive personal information or protected health data.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      {showAddModal && (
        <AddUserModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAddUser}
          currentUserLawFirmId={currentUser?.law_firm_id}
        />
      )}

      {editingUser && (
        <EditUserModal
          isOpen={!!editingUser}
          onClose={() => setEditingUser(null)}
          user={editingUser}
          onSubmit={handleUpdateUser}
        />
      )}
    </div>
  );
}