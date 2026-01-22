import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '../ui/Buttons';
import type{ CreateLawFirmData } from '../../types/Types';

interface AddLawFirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (firmData: CreateLawFirmData) => Promise<boolean>;
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

export function AddLawFirmModal({ isOpen, onClose, onSubmit }: AddLawFirmModalProps) {
  const [formData, setFormData] = useState<CreateLawFirmData>({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: '',
    logo_url: '',
    description: '',
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
    const success = await onSubmit(formData);
    
    setLoading(false);
    if (success) {
      onClose();
      setFormData({
        name: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        country: '',
        logo_url: '',
        description: '',
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-background">
          <h2 className="text-xl font-semibold text-foreground">Add New Law Firm</h2>
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
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Mitchell & Partners LLP"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Email *</label>
                <input
                  type="email"
                  required
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="contact@firm.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Phone</label>
                <input
                  type="tel"
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  placeholder="(555) 123-4567"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Logo URL</label>
                <input
                  type="url"
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm"
                  value={formData.logo_url}
                  onChange={(e) => setFormData({...formData, logo_url: e.target.value})}
                  placeholder="https://example.com/logo.png"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Address</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm"
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                placeholder="123 Main Street"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">City</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm"
                  value={formData.city}
                  onChange={(e) => setFormData({...formData, city: e.target.value})}
                  placeholder="New York"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Country</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm"
                  value={formData.country}
                  onChange={(e) => setFormData({...formData, country: e.target.value})}
                  placeholder="USA"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Description</label>
              <textarea
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm min-h-[100px]"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Description of the law firm..."
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 p-6 border-t border-border sticky bottom-0 bg-background">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Firm'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}