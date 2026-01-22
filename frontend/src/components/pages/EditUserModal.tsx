import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '../ui/Buttons';
import type { User as UserType, UpdateUserData } from '../../types/Types';

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserType;
  onSubmit: (userId: number, updateData: UpdateUserData) => Promise<boolean>;
}

 // Remove the import of useToast
 // Define a mock useToast hook

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

export function EditUserModal({ isOpen, onClose, user, onSubmit }: EditUserModalProps) {
  const [formData, setFormData] = useState<UpdateUserData>({
    full_name: user.full_name,
    phone: user.phone || undefined,
    role: user.role,
    is_active: user.is_active,
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setLoading(true);
    const success = await onSubmit(user.id, formData);
    
    setLoading(false);
    if (success) {
      onClose();
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    try {
      // Note: You'll need to add a DELETE endpoint in your backend
      // For now, just deactivate the user
      const success = await onSubmit(user.id, { is_active: false });
      if (success) {
        toast({
          title: 'Success',
          description: 'User deactivated successfully',
        });
        onClose();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to deactivate user',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Edit User</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {user.email}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Full Name *</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm"
                  value={formData.full_name || ''}
                  onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Role *</label>
                <select
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm"
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value as any})}
                >
                  <option value="associate">Associate</option>
                  <option value="admin">Admin</option>
                  <option value="client">Client</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Email</label>
              <input
                type="email"
                disabled
                className="w-full px-3 py-2 border border-input rounded-md bg-muted text-muted-foreground text-sm"
                value={user.email}
              />
              <p className="text-xs text-muted-foreground">Email cannot be changed</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Phone</label>
              <input
                type="tel"
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm"
                value={formData.phone || ''}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                placeholder="+1 (555) 123-4567"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                className="rounded border-gray-300"
              />
              <label htmlFor="is_active" className="text-sm font-medium text-foreground">
                Active Account
              </label>
            </div>
          </div>

          <div className="flex justify-between p-6 border-t border-border">
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={loading}
            >
              Deactivate User
            </Button>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}