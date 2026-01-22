import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Cards';
import { Badge } from '../ui/Badges';
import { Button } from '../ui/Buttons';
import {  
  Mail, 
  Phone,  
  Shield, 
  Calendar,
  Edit,
  Camera,
  Key,
  Bell,
  Loader2,
  Save,
  X,
  User as UserIcon,
  Building,
  Briefcase,
  MapPin,
  Globe
} from 'lucide-react';
import { apiRequest } from '../lib/api';
import type{ User, UpdateUserData } from '../../types/Types';
import { authService } from '../services/api';

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

export function Profile() {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userData, setUserData] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: '',
    bio: '',
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const result = await authService.getMe();
      
      if (result && result.user) {
        setUserData(result.user);
        setFormData({
          full_name: result.user.full_name || '',
          email: result.user.email || '',
          phone: result.user.phone || '',
          address: '',
          city: '',
          country: '',
          bio: '',
        });
      }
    } catch (error) {
      console.error('Failed to fetch user data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load profile data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      if (!userData) {
        toast({
          title: 'Error',
          description: 'No user data found',
          variant: 'destructive',
        });
        return;
      }

      const updateData: UpdateUserData = {
        full_name: formData.full_name,
        phone: formData.phone,
      };

      const result = await apiRequest<User>(`/api/users/${userData.id}`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });

      if (result.error) {
        throw new Error(result.error);
      }

      toast({
        title: 'Success',
        description: 'Profile updated successfully',
      });
      
      setIsEditing(false);
      fetchUserData(); // Refresh user data
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update profile',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (userData) {
      setFormData({
        full_name: userData.full_name || '',
        email: userData.email || '',
        phone: userData.phone || '',
        address: '',
        city: '',
        country: '',
        bio: '',
      });
    }
    setIsEditing(false);
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    const names = name.split(' ');
    const initials = names.map(n => n[0]).join('').toUpperCase();
    return initials.slice(0, 2);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
    });
  };

  const getRoleDisplay = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrator';
      case 'associate': return 'Associate';
      case 'client': return 'Client';
      default: return role;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'associate': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'client': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="p-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">My Profile</h1>
          <p className="text-muted-foreground text-sm">Manage your account settings and preferences</p>
        </div>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading profile data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="p-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">My Profile</h1>
          <p className="text-muted-foreground text-sm">Manage your account settings and preferences</p>
        </div>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <UserIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">User not found</h3>
            <p className="text-muted-foreground mb-4">Unable to load profile data</p>
            <Button onClick={fetchUserData}>
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">My Profile</h1>
          <p className="text-muted-foreground text-sm">Manage your account settings and preferences</p>
        </div>
        {!isEditing && (
          <Button variant="outline" onClick={() => setIsEditing(true)} className="gap-2">
            <Edit className="w-4 h-4" />
            Edit Profile
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="p-6">
              <div className="text-center mb-6">
                <div className="relative inline-block mb-4">
                  <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-medium text-primary">
                    {getInitials(userData.full_name)}
                  </div>
                  {/* Note: For actual avatar upload, you'd need a separate endpoint */}
                  <button 
                    className="absolute bottom-0 right-0 w-8 h-8 bg-accent text-accent-foreground rounded-full flex items-center justify-center hover:bg-accent/90 transition-colors"
                    onClick={() => toast({
                      title: 'Coming soon',
                      description: 'Avatar upload feature is under development',
                    })}
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-1">{userData.full_name}</h3>
                <p className="text-sm text-muted-foreground mb-3">{getRoleDisplay(userData.role)}</p>
                <div className="flex gap-2 justify-center">
                  <Badge className={getRoleColor(userData.role)}>
                    {userData.role}
                  </Badge>
                  <Badge variant={userData.is_active ? 'success' : 'secondary'}>
                    {userData.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>

              <div className="space-y-3 pt-6 border-t border-border">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-foreground truncate">{userData.email}</span>
                </div>
                {userData.phone && (
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-foreground">{userData.phone}</span>
                  </div>
                )}
                {userData.law_firm_id && (
                  <div className="flex items-center gap-3 text-sm">
                    <Building className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-foreground">Law Firm #{userData.law_firm_id}</span>
                  </div>
                )}
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-foreground">Joined {formatDate(userData.created_at)}</span>
                </div>
                {userData.last_login_at && (
                  <div className="flex items-center gap-3 text-sm">
                    <Globe className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-foreground">Last login: {formatDate(userData.last_login_at)}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Account Security */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-base">Account Security</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <Key className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-foreground text-sm">Password</p>
                    <p className="text-xs text-muted-foreground">Change your password</p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => toast({
                    title: 'Coming soon',
                    description: 'Password change feature is under development',
                  })}
                >
                  Change
                </Button>
              </div>

              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-foreground text-sm">Two-Factor Authentication</p>
                    <p className="text-xs text-muted-foreground">Add an extra layer of security</p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => toast({
                    title: 'Coming soon',
                    description: '2FA feature is under development',
                  })}
                >
                  Enable
                </Button>
              </div>

              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-foreground text-sm">Email Notifications</p>
                    <p className="text-xs text-muted-foreground">Manage notification preferences</p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => toast({
                    title: 'Coming soon',
                    description: 'Notification settings feature is under development',
                  })}
                >
                  Configure
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Personal Information</CardTitle>
                {isEditing && (
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleCancel}
                      disabled={saving}
                    >
                      <X className="w-4 h-4 mr-1" />
                      Cancel
                    </Button>
                    <Button 
                      variant="primary" 
                      size="sm" 
                      onClick={handleSave}
                      disabled={saving}
                    >
                      {saving ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-1" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground">Full Name</label>
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    disabled={!isEditing}
                    className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring disabled:bg-muted/50 disabled:cursor-not-allowed"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground">Email Address</label>
                  <input
                    type="email"
                    value={formData.email}
                    disabled
                    className="w-full px-4 py-2 bg-muted/50 border border-input rounded-lg cursor-not-allowed"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground">Phone Number</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    disabled={!isEditing}
                    className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring disabled:bg-muted/50 disabled:cursor-not-allowed"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground">Role</label>
                  <div className="flex items-center gap-3 px-4 py-2 bg-muted/50 border border-input rounded-lg">
                    <Briefcase className="w-4 h-4 text-muted-foreground" />
                    <span className="text-foreground">{getRoleDisplay(userData.role)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Role is assigned by administrator</p>
                </div>
                {userData.law_firm_id && (
                  <div className="md:col-span-2 space-y-2">
                    <label className="block text-sm font-medium text-foreground">Law Firm</label>
                    <div className="flex items-center gap-3 px-4 py-2 bg-muted/50 border border-input rounded-lg">
                      <Building className="w-4 h-4 text-muted-foreground" />
                      <span className="text-foreground">
                        {userData.law_firm_id ? `Law Firm #${userData.law_firm_id}` : 'Not assigned'}
                      </span>
                    </div>
                  </div>
                )}
                <div className="md:col-span-2 space-y-2">
                  <label className="block text-sm font-medium text-foreground">Account Status</label>
                  <div className="flex items-center gap-3">
                    <Badge variant={userData.is_active ? 'success' : 'secondary'} className="gap-1">
                      {userData.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {userData.is_active 
                        ? 'Your account is active and accessible' 
                        : 'Your account is currently deactivated'}
                    </span>
                  </div>
                </div>
              </div>

              {!isEditing && (
                <div className="mt-6 pt-6 border-t border-border">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsEditing(true)}
                    className="gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    Edit Personal Information
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Activity Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Activity Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Last Login</span>
                    </div>
                    <span className="text-sm font-medium text-foreground">
                      {userData.last_login_at ? formatDate(userData.last_login_at) : 'Never'}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center gap-2">
                      <UserIcon className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Account Created</span>
                    </div>
                    <span className="text-sm font-medium text-foreground">
                      {formatDate(userData.created_at)}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Law Firm ID</span>
                    </div>
                    <span className="text-sm font-medium text-foreground">
                      {userData.law_firm_id || 'Not assigned'}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Actions */}
          <Card className="border-warning/50 bg-warning/5">
            <CardHeader>
              <CardTitle className="text-warning">Account Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-background border border-warning/20 rounded-lg">
                <div>
                  <p className="font-medium text-foreground text-sm">Request Data Export</p>
                  <p className="text-xs text-muted-foreground">Download all your personal data</p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => toast({
                    title: 'Coming soon',
                    description: 'Data export feature is under development',
                  })}
                >
                  Request
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 bg-background border border-destructive/20 rounded-lg">
                <div>
                  <p className="font-medium text-foreground text-sm">Deactivate Account</p>
                  <p className="text-xs text-muted-foreground">Temporarily disable your account</p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="text-destructive border-destructive/20 hover:bg-destructive/10"
                  onClick={() => toast({
                    title: 'Coming soon',
                    description: 'Account deactivation feature is under development',
                  })}
                >
                  Deactivate
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}