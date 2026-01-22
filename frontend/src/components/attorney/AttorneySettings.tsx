import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Cards';
import { Badge } from '../ui/Badges';
import { Button } from '../ui/Buttons';
import { User, Shield, Users, AlertCircle, Edit, Trash2, Save } from 'lucide-react';
import type { User as UserType, UpdateUserData } from '../../types/Types';
import { apiRequest } from '../lib/api';

export function AttorneySettings() {
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    password: '',
    full_name: '',
    phone: '',
    role: 'associate' as 'associate' | 'admin',
    permissions: 'limited access' as 'full access' | 'limited access' | 'no access'
  });

  // Fetch initial data
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch current user
      const meResponse = await apiRequest<{ user: UserType }>(`/api/auth/me`);
      if (meResponse.data?.user) {
        const user = meResponse.data.user;
        setCurrentUser(user);

        // Fetch users - this endpoint automatically filters by law firm for associates and admins
        const usersResponse = await apiRequest<UserType[]>(`/api/users`);
        if (usersResponse.data) {
          // Filter to only show associates and admins from the same law firm
          const lawFirmAssociates = usersResponse.data.filter(u =>
            u.law_firm_id === user.law_firm_id && 
            (u.role === 'associate')
          );
          setUsers(lawFirmAssociates);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle role change
  const handleRoleChange = (role: 'associate' ) => {
    setNewUser({
      ...newUser,
      role
    });
  };

  const formatLastActive = (lastLoginAt: string | null) => {
    if (!lastLoginAt) return 'Never';

    const now = new Date();
    const lastLogin = new Date(lastLoginAt);
    const diffMs = now.getTime() - lastLogin.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    return `${Math.floor(diffDays / 30)}mo ago`;
  };

  const getRoleDisplay = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Admin';
      case 'associate':
        return 'Associate Attorney';
      default:
        return role;
    }
  };

  const getPermissionsDisplay = (permissions?: string) => {
    if (!permissions) return ['Basic Access'];

    switch (permissions) {
      case 'full access':
        return ['Full Access'];
      case 'limited access':
        return ['limited access'];
      default:
        return [permissions];
    }
  };

  const handleEditUser = (user: UserType) => {
    setEditingUser(user);
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;

    try {
      const updateData: UpdateUserData = {
        full_name: editingUser.full_name,
        phone: editingUser.phone || '',
        role: editingUser.role,
        is_active: editingUser.is_active,
        permissions: editingUser.permissions
      };

      const response = await apiRequest<UserType>(`/api/users/${editingUser.id}`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });

      if (response.data) {
        setUsers(users.map(user =>
          user.id === editingUser.id ? response.data! : user
        ));
        setEditingUser(null);
        fetchData(); // Refresh data
      } else if (response.error) {
        alert(`Error updating user: ${response.error}`);
      }
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Failed to update user. Please try again.');
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        const response = await apiRequest(`/api/users/${id}`, {
          method: 'DELETE',
        });

        if (!response.error) {
          setUsers(users.filter(user => user.id !== id));
          fetchData(); // Refresh data
        } else {
          alert(`Error deleting user: ${response.error}`);
        }
      } catch (error) {
        console.error('Error deleting user:', error);
        alert('Failed to delete user. Please try again.');
      }
    }
  };

  const handleAddUser = async () => {
    // Validation
    if (!newUser.username || !newUser.email || !newUser.password || !newUser.full_name) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const requestData: any = {
        username: newUser.username,
        email: newUser.email,
        password: newUser.password,
        full_name: newUser.full_name,
        phone: newUser.phone,
        role: newUser.role,
        permissions: newUser.permissions,
        law_firm_id: currentUser?.law_firm_id // Always include law_firm_id for associates/admins
      };

      const response = await apiRequest<UserType>(`/api/auth/register`, {
        method: 'POST',
        body: JSON.stringify(requestData),
      });

      if (response.data) {
        setUsers([...users, response.data]);
        // Reset form
        setNewUser({
          username: '',
          email: '',
          password: '',
          full_name: '',
          phone: '',
          role: 'associate',
          permissions: 'limited access'
        });
        setShowAddUserModal(false);
        fetchData(); // Refresh data
      } else if (response.error) {
        alert(`Error adding user: ${response.error}`);
      }
    } catch (error) {
      console.error('Error adding user:', error);
      alert('Failed to add user. Please try again.');
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  if (loading) {
    return (
      <div className="p-8 space-y-8">
        <div>
          <h1 className="text-foreground mb-1">Team Management</h1>
          <p className="text-muted-foreground text-sm">Loading team settings...</p>
        </div>
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading team members...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-foreground mb-1">Team Management</h1>
        <p className="text-muted-foreground text-sm">Manage your law firm's associates and administrators</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Team Members</p>
                <p className="text-2xl font-semibold text-foreground">{users.length}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Active Members</p>
                <p className="text-2xl font-semibold text-foreground">
                  {users.filter(u => u.is_active).length}
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                <User className="w-5 h-5 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Admins</p>
                <p className="text-2xl font-semibold text-foreground">
                  {users.filter(u => u.role === 'admin').length}
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Team Members</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Manage associates and administrators in your law firm</p>
            </div>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => setShowAddUserModal(true)}
            >
              <Users className="w-4 h-4" />
              Add Team Member
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-y border-border">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    User
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
                  <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                          {getInitials(user.full_name)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{user.full_name}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={
                          user.role === 'associate' ? 'secondary' :
                            'default'
                      }>
                        {getRoleDisplay(user.role)}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {getPermissionsDisplay(user.permissions).map((permission, idx) => (
                          <Badge key={idx} variant="default" className="text-xs">
                            {permission}
                          </Badge>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={user.is_active ? 'success' : 'secondary'}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                      {formatLastActive(user.last_login_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditUser(user)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        {user.id !== currentUser?.id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteUser(user.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <Users className="w-12 h-12 text-muted-foreground mb-4" />
                        <p className="text-foreground font-medium mb-1">No team members found</p>
                        <p className="text-muted-foreground text-sm">Add your first team member to get started</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                Add New Team Member
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAddUserModal(false)}
                >
                  ×
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Role</label>
                  <select
                    value={newUser.role}
                    onChange={(e) => handleRoleChange(e.target.value as 'associate')}
                    className="w-full px-3 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="associate">Associate Attorney</option>
                  </select>
                  <p className="text-xs text-muted-foreground mt-1">
                    {newUser.role === 'admin' 
                      ? "Admins have full access to all firm data and settings" 
                      : "Associates have access to cases and clients assigned to them"}
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Permissions</label>
                  <select
                    value={newUser.permissions}
                    onChange={(e) => setNewUser({ ...newUser, permissions: e.target.value as 'full access' | 'limited access' | 'no access' })}
                    className="w-full px-3 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="limited access">Limited Access</option>
                    <option value="full access">Full Access</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Full Name *</label>
                  <input
                    type="text"
                    value={newUser.full_name}
                    onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                    className="w-full px-3 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="John Smith"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Email *</label>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    className="w-full px-3 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="john@example.com"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Phone</label>
                  <input
                    type="tel"
                    value={newUser.phone}
                    onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="(555) 123-4567"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Username *</label>
                  <input
                    type="text"
                    value={newUser.username}
                    onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                    className="w-full px-3 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="johnsmith"
                    required
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium">Password *</label>
                  <input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    className="w-full px-3 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="••••••••"
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Minimum 8 characters with letters and numbers
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-border">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAddUserModal(false);
                    // Reset form
                    setNewUser({
                      username: '',
                      email: '',
                      password: '',
                      full_name: '',
                      phone: '',
                      role: 'associate',
                      permissions: 'limited access'
                    });
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddUser}
                  className="gap-2"
                >
                  <Users className="w-4 h-4" />
                  Add Team Member
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                Edit Team Member: {editingUser.full_name}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingUser(null)}
                >
                  ×
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Full Name</label>
                  <input
                    type="text"
                    value={editingUser.full_name}
                    onChange={(e) => setEditingUser({ ...editingUser, full_name: e.target.value })}
                    className="w-full px-3 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Phone</label>
                  <input
                    type="tel"
                    value={editingUser.phone || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="(555) 123-4567"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Role</label>
                  <select
                    value={editingUser.role}
                    onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as 'associate'  })}
                    className="w-full px-3 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="associate">Associate</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Permissions</label>
                  <select
                    value={editingUser.permissions || 'limited access'}
                    onChange={(e) => setEditingUser({ ...editingUser, permissions: e.target.value as 'full access' | 'limited access' | 'no access' })}
                    className="w-full px-3 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="limited access">Limited Access</option>
                    <option value="full access">Full Access</option>
                    <option value="no access">No Access</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <select
                    value={editingUser.is_active ? 'active' : 'inactive'}
                    onChange={(e) => setEditingUser({ ...editingUser, is_active: e.target.value === 'active' })}
                    className="w-full px-3 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-border">
                <Button
                  variant="outline"
                  onClick={() => setEditingUser(null)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveUser}
                  className="gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Security Notice */}
      <Card className="border-warning/50 bg-warning/5">
        <CardContent className="p-6">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-warning flex-shrink-0" />
            <div>
              <h4 className="font-medium text-foreground mb-1">Team Management Best Practices</h4>
              <p className="text-sm text-muted-foreground">
                • Assign roles and permissions based on responsibilities<br/>
                • Regularly review team member access and activity<br/>
                • Ensure all team members use strong, unique passwords<br/>
                • Consider implementing two-factor authentication for additional security<br/>
                • Deactivate accounts when team members leave the firm
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}