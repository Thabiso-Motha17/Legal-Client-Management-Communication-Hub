import { useState, useEffect, type ChangeEvent } from 'react';
import { X, Building } from 'lucide-react';
import { Button } from '../ui/Buttons';
import { apiRequest } from '../lib/api';

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (userData: any) => Promise<boolean>;
  currentUserLawFirmId?: number | null;
}

interface LawFirm {
  id: number;
  name: string;
  email: string;
}

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

type UserRole = 'admin' | 'associate' | 'client';
type PermissionLevel = 'full access' | 'limited access' | 'no access';

interface FormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  full_name: string;
  phone: string;
  role: UserRole;
  permissions: PermissionLevel;
  law_firm_id: number | undefined;
}

export function AddUserModal({ isOpen, onClose, onSubmit, currentUserLawFirmId }: AddUserModalProps) {
  const [formData, setFormData] = useState<FormData>({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    phone: '',
    role: 'associate',
    permissions: 'limited access',
    law_firm_id: currentUserLawFirmId || undefined,
  });
  
  const [loading, setLoading] = useState(false);
  const [loadingFirms, setLoadingFirms] = useState(false);
  const [lawFirms, setLawFirms] = useState<LawFirm[]>([]);
  const { toast } = useToast();

  // Fetch law firms when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchLawFirms();
    }
  }, [isOpen]);

  const fetchLawFirms = async () => {
  try {
    setLoadingFirms(true);
    const token = localStorage.getItem('token');
    const result = await apiRequest<LawFirm[]>('/api/law-firms', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (result.data) {
      const firms = result.data;
      setLawFirms(firms);
      // If there's only one law firm, auto-select it
      if (firms.length === 1 && !formData.law_firm_id) {
        setFormData(prev => ({ 
          ...prev, 
          law_firm_id: firms[0].id 
        }));
      }
    }
  } catch (error) {
    console.error('Failed to fetch law firms:', error);
    toast({
      title: 'Error',
      description: 'Failed to load law firms',
      variant: 'destructive',
    });
  } finally {
    setLoadingFirms(false);
  }
};

  if (!isOpen) return null;

  const handleRoleChange = (role: UserRole) => {
    
    const newData: FormData = {
      ...formData,
    };
    
    // If role is client, clear law firm ID
    if (role === 'client') {
      newData.law_firm_id = undefined;
    } else if (!newData.law_firm_id && lawFirms.length > 0) {
      // If switching to admin/associate and no law firm selected, select the first one
      newData.law_firm_id = lawFirms[0].id;
    }
    
    setFormData(newData);
  };

  const handlePermissionsChange = (permissions: PermissionLevel) => {
    setFormData(prev => ({ ...prev, permissions }));
  };

  const handleLawFirmChange = (lawFirmId: string) => {
    const id = lawFirmId ? parseInt(lawFirmId) : undefined;
    setFormData(prev => ({ ...prev, law_firm_id: id }));
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: 'Error',
        description: 'Passwords do not match',
        variant: 'destructive',
      });
      return false;
    }

    if (formData.password.length < 8) {
      toast({
        title: 'Error',
        description: 'Password must be at least 8 characters',
        variant: 'destructive',
      });
      return false;
    }

    if (!formData.email.includes('@') || !formData.email.includes('.')) {
      toast({
        title: 'Error',
        description: 'Please enter a valid email address',
        variant: 'destructive',
      });
      return false;
    }

    if (formData.username.length < 3) {
      toast({
        title: 'Error',
        description: 'Username must be at least 3 characters',
        variant: 'destructive',
      });
      return false;
    }

    // Validate law firm for admin and associate roles
    if ((formData.role === 'admin' || formData.role === 'associate') && !formData.law_firm_id) {
      toast({
        title: 'Error',
        description: 'Please select a law firm for this role',
        variant: 'destructive',
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    const success = await onSubmit({
      username: formData.username,
      email: formData.email,
      password: formData.password,
      full_name: formData.full_name,
      phone: formData.phone || undefined,
      role: formData.role,
      permissions: formData.permissions,
      law_firm_id: formData.law_firm_id,
    });

    setLoading(false);
    if (success) {
      onClose();
      // Reset form
      setFormData({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        full_name: '',
        phone: '',
        role: 'associate',
        permissions: 'limited access',
        law_firm_id: currentUserLawFirmId || undefined,
      });
    }
  };

  // Get role description
  const getRoleDescription = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'Full system access and user management';
      case 'associate':
        return 'Case management and client interaction';
      case 'client':
        return 'View own cases and documents only';
      default:
        return '';
    }
  };

  // Get permission description
  const getPermissionDescription = (permission: PermissionLevel) => {
    switch (permission) {
      case 'full access':
        return 'settings incl.';
      case 'limited access':
        return 'no settings';
      case 'no access':
        return 'Cannot access system features';
      default:
        return '';
    }
  };

  // Get selected law firm name
  const getSelectedFirmName = () => {
    if (!formData.law_firm_id) return 'Not selected';
    const firm = lawFirms.find(f => f.id === formData.law_firm_id);
    return firm ? firm.name : 'Not selected';
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-background">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Add New User</h2>
            <p className="text-sm text-muted-foreground mt-1">Create a new user account</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none hover:bg-muted p-1 rounded-full"
            disabled={loading}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-6">
            {/* Role & Permissions Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-foreground border-b pb-2">Access Settings</h3>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-foreground">Role *</label>
                    <span className="text-xs text-muted-foreground">
                      {getRoleDescription(formData.role)}
                    </span>
                  </div>
                  <select
                    className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm focus:ring-2 focus:ring-ring"
                    value={formData.role}
                    onChange={(e) => handleRoleChange(e.target.value as UserRole)}
                    disabled={loading}
                  >
                    <option value="associate">Associate</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-foreground">Permissions *</label>
                    <span className="text-xs text-muted-foreground">
                      {getPermissionDescription(formData.permissions)}
                    </span>
                  </div>
                  <select
                    className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm focus:ring-2 focus:ring-ring"
                    value={formData.permissions}
                    onChange={(e) => handlePermissionsChange(e.target.value as PermissionLevel)}
                    disabled={loading}
                  >
                    <option value="limited access">Limited Access</option>
                    <option value="full access">Full Access</option>
                    <option value="no access">No Access</option>
                  </select>
                </div>

                {/* Law Firm Selection - Only for Admin and Associate */}
                {(formData.role === 'admin' || formData.role === 'associate') && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-foreground">Law Firm *</label>
                      <span className="text-xs text-muted-foreground">
                        Required for this role
                      </span>
                    </div>
                    {loadingFirms ? (
                      <div className="flex items-center justify-center h-10">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                        <span className="ml-2 text-sm text-muted-foreground">Loading firms...</span>
                      </div>
                    ) : (
                      <div className="relative">
                        <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <select
                          className="w-full pl-10 pr-3 py-2 border border-input rounded-md bg-background text-foreground text-sm focus:ring-2 focus:ring-ring"
                          value={formData.law_firm_id || ''}
                          onChange={(e) => handleLawFirmChange(e.target.value)}
                          disabled={loading || loadingFirms}
                          required={(formData.role === 'admin' || formData.role === 'associate')}
                        >
                          <option value="">Select a law firm</option>
                          {lawFirms.map((firm) => (
                            <option key={firm.id} value={firm.id}>
                              {firm.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Basic Information Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-foreground border-b pb-2">Basic Information</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Username *</label>
                  <input
                    type="text"
                    name="username"
                    required
                    className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm focus:ring-2 focus:ring-ring transition-shadow"
                    value={formData.username}
                    onChange={handleInputChange}
                    placeholder="johndoe"
                    disabled={loading}
                    minLength={3}
                  />
                  <p className="text-xs text-muted-foreground">Minimum 3 characters, letters and numbers only</p>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm focus:ring-2 focus:ring-ring transition-shadow"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+1 (555) 123-4567"
                    disabled={loading}
                  />
                  <p className="text-xs text-muted-foreground">Optional contact number</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Full Name *</label>
                <input
                  type="text"
                  name="full_name"
                  required
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm focus:ring-2 focus:ring-ring transition-shadow"
                  value={formData.full_name}
                  onChange={handleInputChange}
                  placeholder="John Doe"
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground">User's full legal name</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Email Address *</label>
                <input
                  type="email"
                  name="email"
                  required
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm focus:ring-2 focus:ring-ring transition-shadow"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="john@example.com"
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground">Will be used for login and notifications</p>
              </div>
            </div>

            {/* Security Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-foreground border-b pb-2">Security</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Password *</label>
                  <input
                    type="password"
                    name="password"
                    required
                    className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm focus:ring-2 focus:ring-ring transition-shadow"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="••••••••"
                    disabled={loading}
                    minLength={8}
                  />
                  <p className="text-xs text-muted-foreground">Minimum 8 characters</p>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Confirm Password *</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    required
                    className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm focus:ring-2 focus:ring-ring transition-shadow"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="••••••••"
                    disabled={loading}
                  />
                  <p className="text-xs text-muted-foreground">Must match password</p>
                </div>
              </div>

              {/* Password Requirements */}
              <div className="bg-muted/30 rounded-lg p-4 space-y-2">
                <h4 className="text-sm font-medium text-foreground">Password Requirements:</h4>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li className={`flex items-center gap-2 ${formData.password.length >= 8 ? 'text-green-600' : ''}`}>
                    <div className={`w-2 h-2 rounded-full ${formData.password.length >= 8 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    At least 8 characters
                  </li>
                  <li className={`flex items-center gap-2 ${/[A-Z]/.test(formData.password) ? 'text-green-600' : ''}`}>
                    <div className={`w-2 h-2 rounded-full ${/[A-Z]/.test(formData.password) ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    At least one uppercase letter
                  </li>
                  <li className={`flex items-center gap-2 ${/[a-z]/.test(formData.password) ? 'text-green-600' : ''}`}>
                    <div className={`w-2 h-2 rounded-full ${/[a-z]/.test(formData.password) ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    At least one lowercase letter
                  </li>
                  <li className={`flex items-center gap-2 ${/\d/.test(formData.password) ? 'text-green-600' : ''}`}>
                    <div className={`w-2 h-2 rounded-full ${/\d/.test(formData.password) ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    At least one number
                  </li>
                </ul>
              </div>
            </div>

            {/* Access Summary */}
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <h4 className="text-sm font-medium text-primary mb-2">Access Summary</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-muted-foreground">Role:</span>
                    <span className="font-medium capitalize text-foreground">{formData.role}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-muted-foreground">Permissions:</span>
                    <span className="font-medium capitalize text-foreground">{formData.permissions}</span>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-muted-foreground">Law Firm:</span>
                    <span className="font-medium text-foreground">
                      {formData.role === 'client' ? 'Not applicable' : getSelectedFirmName()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Email:</span>
                    <span className="font-medium text-foreground truncate ml-2">{formData.email || 'Not set'}</span>
                  </div>
                </div>
              </div>
              
              {formData.role === 'client' && (
                <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-md">
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5"></div>
                    <div>
                      <p className="text-sm font-medium text-amber-800">Client Account Note</p>
                      <p className="text-xs text-amber-700 mt-1">
                        Client accounts must be linked to a specific client profile after creation. 
                        They will only have access to their own cases and documents.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {(formData.role === 'admin' || formData.role === 'associate') && !formData.law_firm_id && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5"></div>
                    <div>
                      <p className="text-sm font-medium text-red-800">Action Required</p>
                      <p className="text-xs text-red-700 mt-1">
                        Please select a law firm for this {formData.role} account before creating.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 p-6 border-t border-border sticky bottom-0 bg-background">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="px-6"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading || (formData.role !== 'client' && !formData.law_firm_id)}
              className="gap-2 px-6"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Creating...
                </>
              ) : (
                'Create User'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}