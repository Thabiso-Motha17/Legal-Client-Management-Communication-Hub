import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '../ui/Buttons';
import type{ LawFirm, UpdateLawFirmData } from '../../types/Types';

interface EditLawFirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  firm: LawFirm;
  onSubmit: (firmId: number, updateData: UpdateLawFirmData) => Promise<boolean>;
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

export function EditLawFirmModal({ isOpen, onClose, firm, onSubmit }: EditLawFirmModalProps) {
  const [formData, setFormData] = useState<UpdateLawFirmData>({
    name: firm.name,
    email: firm.email,
    phone: firm.phone || undefined,
    address: firm.address || undefined,
    city: firm.city || undefined,
    country: firm.country || undefined,
    logo_url: firm.logo_url || undefined,
    description: firm.description || undefined,
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email) {
      toast({
        title: 'Error',
        description: 'Name and email are required',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    const success = await onSubmit(firm.id, formData);
    
    setLoading(false);
    if (success) {
      onClose();
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this law firm? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    try {
      // Note: You'll need to add a DELETE endpoint in your backend
      toast({
        title: 'Warning',
        description: 'Delete endpoint not implemented yet',
        variant: 'destructive',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete law firm',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-background">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Edit Law Firm</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {firm.name}
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
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Firm Name *</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Email *</label>
                <input
                  type="email"
                  required
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Phone</label>
                <input
                  type="tel"
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm"
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Logo URL</label>
                <input
                  type="url"
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm"
                  value={formData.logo_url || ''}
                  onChange={(e) => setFormData({...formData, logo_url: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Address</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm"
                value={formData.address || ''}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">City</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm"
                  value={formData.city || ''}
                  onChange={(e) => setFormData({...formData, city: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Country</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm"
                  value={formData.country || ''}
                  onChange={(e) => setFormData({...formData, country: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Description</label>
              <textarea
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm min-h-[100px]"
                value={formData.description || ''}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
            </div>

            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="font-medium text-foreground mb-2">Firm Statistics</h4>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Members</p>
                  <p className="font-medium">{firm.member_count}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Cases</p>
                  <p className="font-medium">{firm.case_count}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Storage Used</p>
                  <p className="font-medium">{firm.storage_used_mb?.toFixed(1) || '0'} MB</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-between p-6 border-t border-border sticky bottom-0 bg-background">
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={loading}
            >
              Delete Firm
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