import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader } from '../ui/Cards';
import { Badge } from '../ui/Badges';
import { Button } from '../ui/Buttons';
import { 
  Search, 
  Plus, 
  Eye, 
  Mail, 
  Phone, 
  Briefcase,
  User,  
  Building, 
  Calendar,
  UserPlus,
  X,
  Shield,
  Users,
  Folder,
  Eye as EyeIcon,
  Building as BuildingIcon,
  MoreVertical,
  Pencil,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Hash
} from 'lucide-react';
import type { Client, CreateClientData, Case } from '../../types/Types';
import { apiRequest } from '../lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

type ModalMode = 'view' | 'edit' | 'delete' | null;

// ─── Sub-component: Action Menu ───────────────────────────────────────────────

function ActionMenu({
  onView,
  onEdit,
  onDelete,
}: {
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
        aria-label="Client actions"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {open && (
        <div className="absolute right-0 top-8 z-50 w-44 bg-background border border-border rounded-xl shadow-lg overflow-hidden">
          <button
            onClick={() => { onView(); setOpen(false); }}
            className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-muted transition-colors"
          >
            <Eye className="w-4 h-4 text-primary" />
            View Details
          </button>
          <button
            onClick={() => { onEdit(); setOpen(false); }}
            className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-muted transition-colors"
          >
            <Pencil className="w-4 h-4 text-blue-500" />
            Edit Client
          </button>
          <div className="border-t border-border" />
          <button
            onClick={() => { onDelete(); setOpen(false); }}
            className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Delete Client
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Sub-component: View Modal ────────────────────────────────────────────────

function ViewClientModal({
  client,
  cases,
  currentUserId,
  onClose,
  onEdit,
  onDelete,
  formatDate,
  formatRelativeTime,
}: {
  client: Client;
  cases: Case[];
  currentUserId: number;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  formatDate: (d: string) => string;
  formatRelativeTime: (d: string) => string;
}) {
  const clientCases = cases.filter((c) => c.client_id === client.id);
  const activeCases = clientCases.filter((c) => c.status === 'Active').length;
  const isMyClient = client.assigned_associate_id === currentUserId;

  const getInitials = (name: string) =>
    name.split(' ').map((n) => n[0]).join('').toUpperCase();

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-2xl bg-background border border-border rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-border">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary flex-shrink-0">
              {getInitials(client.name)}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">{client.name}</h2>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <Badge variant={client.client_type === 'business' ? 'secondary' : 'default'}>
                  {client.client_type === 'business' ? (
                    <><Building className="w-3 h-3 mr-1" />Business</>
                  ) : (
                    <><User className="w-3 h-3 mr-1" />Individual</>
                  )}
                </Badge>
                <Badge variant={client.status === 'active' ? 'success' : 'warning'}>
                  {client.status === 'active' ? 'Active' : 'Inactive'}
                </Badge>
                {isMyClient && (
                  <Badge variant="default" className="gap-1 text-xs">
                    <Shield className="w-3 h-3" />
                    Your Client
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Contact Info */}
          <section>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Contact Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoRow icon={<Mail className="w-4 h-4" />} label="Email">
                <a href={`mailto:${client.email}`} className="text-primary hover:underline break-all">
                  {client.email}
                </a>
              </InfoRow>
              <InfoRow icon={<Phone className="w-4 h-4" />} label="Phone">
                {client.phone || <span className="text-muted-foreground italic">Not provided</span>}
              </InfoRow>
              {client.company && (
                <InfoRow icon={<Briefcase className="w-4 h-4" />} label="Company">
                  {client.company}
                </InfoRow>
              )}
              <InfoRow icon={<Hash className="w-4 h-4" />} label="Client ID">
                #{client.id}
              </InfoRow>
            </div>
          </section>

          {/* Assignment */}
          <section>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Assignment & Timeline
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoRow icon={<Users className="w-4 h-4" />} label="Assigned To">
                {client.assigned_associate_name
                  ? `${client.assigned_associate_name}${isMyClient ? ' (You)' : ''}`
                  : <span className="text-muted-foreground italic">Unassigned</span>}
              </InfoRow>
              <InfoRow icon={<Calendar className="w-4 h-4" />} label="Client Since">
                {formatDate(client.joined_date)}
              </InfoRow>
              <InfoRow icon={<Clock className="w-4 h-4" />} label="Last Updated">
                {client.updated_at ? formatRelativeTime(client.updated_at) : 'Never'}
              </InfoRow>
            </div>
          </section>

          {/* Case Stats */}
          <section>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Case Overview
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <StatBox label="Total Cases" value={clientCases.length} />
              <StatBox label="Active" value={activeCases} highlight={activeCases > 0} />
              <StatBox label="Closed" value={clientCases.filter((c) => c.status === 'Closed').length} />
            </div>
          </section>

          {/* Cases List */}
          {clientCases.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Cases
              </h3>
              <div className="space-y-2">
                {clientCases.map((c) => (
                  <div key={c.id} className="flex items-center justify-between p-3 bg-muted/40 rounded-xl">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{c.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          variant={c.status === 'Active' ? 'success' : c.status === 'On Hold' ? 'warning' : 'secondary'}
                          className="text-xs"
                        >
                          {c.status}
                        </Badge>
                        <Badge
                          variant={c.priority === 'high' ? 'error' : c.priority === 'medium' ? 'warning' : 'success'}
                          className="text-xs"
                        >
                          {c.priority}
                        </Badge>
                        {c.assigned_to_user_id === currentUserId && (
                          <Badge variant="default" className="text-xs">Your case</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-border bg-muted/20">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
            onClick={onDelete}
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
            <Button size="sm" className="gap-2" onClick={onEdit}>
              <Pencil className="w-4 h-4" />
              Edit Client
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-component: Edit Modal ────────────────────────────────────────────────

function EditClientModal({
  client,
  onClose,
  onSave,
}: {
  client: Client;
  onClose: () => void;
  onSave: (updated: Partial<Client>) => Promise<void>;
}) {
  const [form, setForm] = useState({
    name: client.name,
    email: client.email,
    phone: client.phone || '',
    company: client.company || '',
    client_type: client.client_type,
    status: client.status,
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email address';
    if (form.client_type === 'business' && !form.company.trim()) e.company = 'Company is required for business clients';
    return e;
  };

  const handleSave = async () => {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    setSaving(true);
    try {
      await onSave(form);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-xl bg-background border border-border rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950 flex items-center justify-center">
              <Pencil className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Edit Client</h2>
              <p className="text-xs text-muted-foreground">Update information for {client.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-5">
          {/* Client Type */}
          <div>
            <label className="text-sm font-medium mb-3 block">Client Type</label>
            <div className="grid grid-cols-2 gap-3">
              {(['individual', 'business'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setForm({ ...form, client_type: type })}
                  className={`p-3 border rounded-xl text-left transition-all ${
                    form.client_type === type
                      ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                      : 'border-border hover:border-primary/30'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      {type === 'individual' ? (
                        <User className="w-4 h-4 text-primary" />
                      ) : (
                        <Building className="w-4 h-4 text-primary" />
                      )}
                    </div>
                    <span className="text-sm font-medium capitalize text-foreground">{type}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="text-sm font-medium mb-3 block">Status</label>
            <div className="grid grid-cols-2 gap-3">
              {(['active', 'inactive'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setForm({ ...form, status: s })}
                  className={`p-3 border rounded-xl text-left transition-all ${
                    form.status === s
                      ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                      : 'border-border hover:border-primary/30'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`w-2.5 h-2.5 rounded-full ${s === 'active' ? 'bg-green-500' : 'bg-gray-400'}`} />
                    <span className="text-sm font-medium capitalize text-foreground">{s}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              label="Full Name *"
              error={errors.name}
            >
              <input
                type="text"
                value={form.name}
                onChange={(e) => { setForm({ ...form, name: e.target.value }); setErrors({ ...errors, name: '' }); }}
                className={fieldClass(!!errors.name)}
                placeholder="John Smith"
              />
            </FormField>
            <FormField label="Email Address *" error={errors.email}>
              <input
                type="email"
                value={form.email}
                onChange={(e) => { setForm({ ...form, email: e.target.value }); setErrors({ ...errors, email: '' }); }}
                className={fieldClass(!!errors.email)}
                placeholder="john@example.com"
              />
            </FormField>
          </div>

          {form.client_type === 'business' && (
            <FormField label="Company Name *" error={errors.company}>
              <input
                type="text"
                value={form.company}
                onChange={(e) => { setForm({ ...form, company: e.target.value }); setErrors({ ...errors, company: '' }); }}
                className={fieldClass(!!errors.company)}
                placeholder="ABC Corporation"
              />
            </FormField>
          )}

          <FormField label="Phone Number">
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className={fieldClass(false)}
              placeholder="(555) 123-4567"
            />
          </FormField>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-border">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving} className="gap-2 min-w-[120px]">
            {saving ? (
              <><div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />Saving...</>
            ) : (
              <><CheckCircle2 className="w-4 h-4" />Save Changes</>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-component: Delete Confirmation Modal ─────────────────────────────────

function DeleteConfirmModal({
  client,
  onClose,
  onConfirm,
}: {
  client: Client;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}) {
  const [deleting, setDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const required = 'DELETE';

  const handleConfirm = async () => {
    if (confirmText !== required) return;
    setDeleting(true);
    try {
      await onConfirm();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-md bg-background border border-border rounded-2xl shadow-2xl">
        <div className="p-6">
          {/* Icon */}
          <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/50 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>

          <h2 className="text-lg font-semibold text-foreground text-center mb-1">Delete Client</h2>
          <p className="text-sm text-muted-foreground text-center mb-6">
            This will permanently delete <span className="font-semibold text-foreground">{client.name}</span> and all associated data. This action cannot be undone.
          </p>

          {/* Warning box */}
          <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-xl mb-5">
            <div className="flex items-start gap-2">
              <Folder className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-red-700 dark:text-red-400">
                All cases, documents, and records linked to this client will also be removed.
              </p>
            </div>
          </div>

          {/* Confirm input */}
          <div className="space-y-2 mb-6">
            <label className="text-sm font-medium text-foreground">
              Type <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-red-600">{required}</span> to confirm
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 transition-colors ${
                confirmText === required
                  ? 'border-red-400 focus:ring-red-300'
                  : 'border-border focus:ring-ring'
              }`}
              placeholder="Type DELETE to confirm"
              autoFocus
            />
          </div>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={onClose} disabled={deleting}>
              Cancel
            </Button>
            <button
              onClick={handleConfirm}
              disabled={confirmText !== required || deleting}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                confirmText === required && !deleting
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-red-200 dark:bg-red-950/30 text-red-400 cursor-not-allowed'
              }`}
            >
              {deleting ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Deleting...</>
              ) : (
                <><Trash2 className="w-4 h-4" />Delete Client</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function InfoRow({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 p-3 bg-muted/40 rounded-xl">
      <span className="text-muted-foreground mt-0.5">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
        <div className="text-sm text-foreground">{children}</div>
      </div>
    </div>
  );
}

function StatBox({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className={`p-4 rounded-xl text-center border ${highlight && value > 0 ? 'border-green-300 bg-green-50 dark:bg-green-950/30' : 'border-border bg-muted/40'}`}>
      <p className={`text-2xl font-bold ${highlight && value > 0 ? 'text-green-600' : 'text-foreground'}`}>{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{label}</p>
    </div>
  );
}

function FormField({ label, children, error }: { label: string; children: React.ReactNode; error?: string }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />{error}</p>}
    </div>
  );
}

function fieldClass(hasError: boolean) {
  return `w-full px-3 py-2 bg-input-background border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
    hasError ? 'border-red-400 focus:ring-red-300' : 'border-border focus:ring-ring'
  }`;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function AssociateClients() {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'my-clients' | 'all-clients'>('my-clients');
  const [clients, setClients] = useState<Client[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddClientForm, setShowAddClientForm] = useState(false);
  const [newClient, setNewClient] = useState<CreateClientData>({
    name: '',
    email: '',
    phone: '',
    company: '',
    client_type: 'individual',
    assigned_associate_id: 0,
    user_account_id: undefined
  });

  // Modal state
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [modalMode, setModalMode] = useState<ModalMode>(null);

  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => { fetchCurrentUser(); }, []);
  useEffect(() => { if (currentUser) fetchData(); }, [currentUser, viewMode]);

  const fetchCurrentUser = async () => {
    try {
      const response = await apiRequest<{ user: any }>(`/api/auth/me`);
      if (response.data?.user) {
        setCurrentUser(response.data.user);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  };

  const fetchData = async () => {
    if (!currentUser) return;
    try {
      setLoading(true);
      let clientsUrl = '/api/clients';
      if (viewMode === 'my-clients') clientsUrl += `?assigned_to=${currentUser.id}`;
      const clientsResponse = await apiRequest<Client[]>(clientsUrl);
      if (clientsResponse.data) setClients(clientsResponse.data);
      const casesResponse = await apiRequest<Case[]>(`/api/cases`);
      if (casesResponse.data) setCases(casesResponse.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // ── Modal openers ──────────────────────────────────────────────────────────

  const openView = (client: Client) => { setSelectedClient(client); setModalMode('view'); };
  const openEdit = (client: Client) => { setSelectedClient(client); setModalMode('edit'); };
  const openDelete = (client: Client) => { setSelectedClient(client); setModalMode('delete'); };
  const closeModal = () => { setSelectedClient(null); setModalMode(null); };

  // From view → edit / delete
  const switchToEdit = () => setModalMode('edit');
  const switchToDelete = () => setModalMode('delete');

  // ── CRUD handlers ──────────────────────────────────────────────────────────

  const handleEditSave = async (updated: Partial<Client>) => {
    if (!selectedClient) return;
    try {
      const response = await apiRequest<Client>(`/api/clients/${selectedClient.id}`, {
        method: 'PUT',
        body: JSON.stringify(updated),
      });
      if (response.data) {
        setClients(clients.map((c) => (c.id === selectedClient.id ? { ...c, ...response.data } : c)));
        closeModal();
        fetchData();
      } else if (response.error) {
        alert(`Error updating client: ${response.error}`);
      }
    } catch (error) {
      console.error('Error updating client:', error);
      alert('Failed to update client. Please try again.');
    }
  };

  const handleDelete = async () => {
    if (!selectedClient) return;
    try {
      const response = await apiRequest(`/api/clients/${selectedClient.id}`, { method: 'DELETE' });
      if (!response.error) {
        setClients(clients.filter((c) => c.id !== selectedClient.id));
        closeModal();
      } else {
        alert(`Error deleting client: ${response.error}`);
      }
    } catch (error) {
      console.error('Error deleting client:', error);
      alert('Failed to delete client. Please try again.');
    }
  };

  // ── Helpers ────────────────────────────────────────────────────────────────

  const getCasesForClient = (clientId: number) => cases.filter((c) => c.client_id === clientId);
  const getActiveCasesForClient = (clientId: number) =>
    getCasesForClient(clientId).filter((c) => c.status === 'Active').length;

  const myClients = clients.filter((client) => client.assigned_associate_id === currentUser?.id);

  const filteredClients = clients.filter((client) => {
    const matchesSearch =
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (client.company && client.company.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = typeFilter === 'all' || client.client_type === typeFilter;
    return matchesSearch && matchesType;
  });

  const totalClients = viewMode === 'my-clients' ? myClients.length : clients.length;
  const activeAssignedCases = clients.reduce((sum, client) => sum + getActiveCasesForClient(client.id), 0);
  const individualClients = clients.filter((c) => c.client_type === 'individual').length;
  const businessClients = clients.filter((c) => c.client_type === 'business').length;

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const formatRelativeTime = (dateString: string) => {
    if (!dateString) return 'Never';
    const diffDays = Math.floor((Date.now() - new Date(dateString).getTime()) / 86400000);
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  const getInitials = (name: string) => name.split(' ').map((n) => n[0]).join('').toUpperCase();

  // ── Add Client handler ─────────────────────────────────────────────────────

  const handleAddClient = async () => {
    if (!newClient.name || !newClient.email) { alert('Please fill in required fields (Name and Email)'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newClient.email)) { alert('Please enter a valid email address'); return; }
    if (newClient.client_type === 'business' && !newClient.company) { alert('Company name is required for business clients'); return; }
    try {
      const response = await apiRequest<Client>(`/api/clients`, {
        method: 'POST',
        body: JSON.stringify({ ...newClient, assigned_associate_id: currentUser.id }),
      });
      if (response.data) {
        setClients([...clients, response.data]);
        resetForm();
        setShowAddClientForm(false);
        fetchData();
        alert(`Client "${response.data.name}" added successfully!`);
      } else if (response.error) {
        alert(`Error adding client: ${response.error}`);
      }
    } catch (error) {
      alert('Failed to add client. Please try again.');
    }
  };

  const resetForm = () => {
    setNewClient({ name: '', email: '', phone: '', company: '', client_type: 'individual', assigned_associate_id: currentUser?.id || 0, user_account_id: undefined });
  };

  // ── Loading state ──────────────────────────────────────────────────────────

  if (loading || !currentUser) {
    return (
      <div className="p-6 md:p-8 space-y-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading clients...</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* ── Modals ── */}
      {selectedClient && modalMode === 'view' && (
        <ViewClientModal
          client={selectedClient}
          cases={cases}
          currentUserId={currentUser.id}
          onClose={closeModal}
          onEdit={switchToEdit}
          onDelete={switchToDelete}
          formatDate={formatDate}
          formatRelativeTime={formatRelativeTime}
        />
      )}

      {selectedClient && modalMode === 'edit' && (
        <EditClientModal
          client={selectedClient}
          onClose={closeModal}
          onSave={handleEditSave}
        />
      )}

      {selectedClient && modalMode === 'delete' && (
        <DeleteConfirmModal
          client={selectedClient}
          onClose={closeModal}
          onConfirm={handleDelete}
        />
      )}

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-foreground mb-1">Clients</h1>
          <p className="text-muted-foreground text-sm">
            {viewMode === 'my-clients'
              ? `Clients assigned to you (${currentUser.full_name})`
              : 'All clients in the company'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-1">
            <Button variant={viewMode === 'my-clients' ? 'primary' : 'ghost'} size="sm" onClick={() => setViewMode('my-clients')} className="gap-2">
              <EyeIcon className="w-4 h-4" />My Clients
            </Button>
            <Button variant={viewMode === 'all-clients' ? 'primary' : 'ghost'} size="sm" onClick={() => setViewMode('all-clients')} className="gap-2">
              <BuildingIcon className="w-4 h-4" />All Clients
            </Button>
          </div>
          <Badge variant="default" className="gap-1">
            <Users className="w-3 h-3" />
            {viewMode === 'my-clients' ? myClients.length : clients.length} Clients
          </Badge>
          <Button variant="primary" className="gap-2" onClick={() => setShowAddClientForm(true)}>
            <Plus className="w-4 h-4" />Add Client
          </Button>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card><CardContent className="p-6"><p className="text-sm text-muted-foreground mb-1">{viewMode === 'my-clients' ? 'My Clients' : 'Total Clients'}</p><p className="text-2xl font-semibold text-foreground">{totalClients}</p></CardContent></Card>
        <Card><CardContent className="p-6"><p className="text-sm text-muted-foreground mb-1">{viewMode === 'my-clients' ? 'My Active Cases' : 'Active Cases'}</p><p className="text-2xl font-semibold text-foreground">{activeAssignedCases}</p></CardContent></Card>
        <Card><CardContent className="p-6"><p className="text-sm text-muted-foreground mb-1">Individual Clients</p><p className="text-2xl font-semibold text-foreground">{individualClients}</p></CardContent></Card>
        <Card><CardContent className="p-6"><p className="text-sm text-muted-foreground mb-1">Business Clients</p><p className="text-2xl font-semibold text-foreground">{businessClients}</p></CardContent></Card>
      </div>

      {/* ── Add Client Modal ── */}
      {showAddClientForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <UserPlus className="w-6 h-6 text-primary" />
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Add New Client</h2>
                    <p className="text-sm text-muted-foreground">This client will be automatically assigned to you</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => { setShowAddClientForm(false); resetForm(); }}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="text-sm font-medium mb-3 block">Client Type *</label>
                <div className="grid grid-cols-2 gap-4">
                  {(['individual', 'business'] as const).map((type) => (
                    <button key={type} type="button" onClick={() => setNewClient({ ...newClient, client_type: type })}
                      className={`p-4 border rounded-lg text-left transition-all ${newClient.client_type === type ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : 'border-border hover:border-primary/30'}`}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          {type === 'individual' ? <User className="w-5 h-5 text-primary" /> : <Building className="w-5 h-5 text-primary" />}
                        </div>
                        <div>
                          <h4 className="font-medium text-foreground capitalize">{type}</h4>
                          <p className="text-xs text-muted-foreground">{type === 'individual' ? 'Single person client' : 'Company or organization'}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                {newClient.client_type !== 'business' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Full Name *</label>
                      <input type="text" value={newClient.name} onChange={(e) => setNewClient({ ...newClient, name: e.target.value })} className="w-full px-3 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring" placeholder="John Smith" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Email Address *</label>
                      <input type="email" value={newClient.email} onChange={(e) => setNewClient({ ...newClient, email: e.target.value })} className="w-full px-3 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring" placeholder="john@example.com" />
                    </div>
                  </div>
                )}
                {newClient.client_type === 'business' && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Company Name *</label>
                    <input type="text" value={newClient.company || ''} onChange={(e) => setNewClient({ ...newClient, company: e.target.value })} className="w-full px-3 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring" placeholder="ABC Corporation" />
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Phone Number</label>
                  <input type="tel" value={newClient.phone || ''} onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })} className="w-full px-3 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring" placeholder="(555) 123-4567" />
                </div>
              </div>
              <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-foreground mb-1">Automatically Assigned to You</h4>
                    <p className="text-xs text-muted-foreground">This client will be automatically assigned to <span className="font-medium">{currentUser.full_name}</span>.</p>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <Button variant="outline" onClick={() => { setShowAddClientForm(false); resetForm(); }}>Cancel</Button>
                <Button onClick={handleAddClient} className="gap-2"><UserPlus className="w-4 h-4" />Add Client</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Filters ── */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder={`Search ${viewMode === 'my-clients' ? 'my' : 'all'} clients...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="flex gap-2">
              {(['all', 'individual', 'business'] as const).map((f) => (
                <button key={f} onClick={() => setTypeFilter(f)}
                  className={`px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 ${typeFilter === f ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
                  {f === 'individual' && <User className="w-4 h-4" />}
                  {f === 'business' && <Building className="w-4 h-4" />}
                  <span className="capitalize">{f}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">View:</span>
              <Badge variant="default">{viewMode === 'my-clients' ? 'My Clients Only' : 'All Company Clients'}</Badge>
            </div>
            <div className="text-muted-foreground">
              Showing {filteredClients.length} of {viewMode === 'my-clients' ? myClients.length : clients.length} clients
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {filteredClients.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground mb-2">
                {viewMode === 'my-clients' ? 'No clients assigned to you.' : 'No clients found.'}
              </p>
              {searchQuery || typeFilter !== 'all' ? (
                <p className="text-sm text-muted-foreground">Try adjusting your search or filter</p>
              ) : viewMode === 'my-clients' ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">Start by adding your first client.</p>
                  <Button variant="outline" className="gap-2" onClick={() => setShowAddClientForm(true)}>
                    <Plus className="w-4 h-4" />Add Your First Client
                  </Button>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-border">
              {filteredClients.map((client) => {
                const clientCases = getCasesForClient(client.id);
                const activeCases = getActiveCasesForClient(client.id);
                const isMyClient = client.assigned_associate_id === currentUser.id;

                return (
                  <Card key={client.id} className="border-0 rounded-none">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start gap-3">
                          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-lg font-medium text-primary flex-shrink-0">
                            {getInitials(client.name)}
                          </div>
                          <div>
                            <h4 className="text-foreground mb-1">{client.name}</h4>
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant={client.client_type === 'business' ? 'secondary' : 'default'}>
                                {client.client_type === 'business' ? 'Business' : 'Individual'}
                              </Badge>
                              <Badge variant={client.status === 'active' ? 'success' : 'warning'}>
                                {client.status === 'active' ? 'Active' : 'Inactive'}
                              </Badge>
                              {isMyClient && (
                                <Badge variant="default" className="text-xs gap-1">
                                  <User className="w-3 h-3" />Your Client
                                </Badge>
                              )}
                              {clientCases.length > 0 && (
                                <Badge variant="default" className="text-xs gap-1">
                                  <Folder className="w-3 h-3" />{clientCases.length} case{clientCases.length !== 1 ? 's' : ''}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* ── Action menu replaces old eye button ── */}
                        <ActionMenu
                          onView={() => openView(client)}
                          onEdit={() => openEdit(client)}
                          onDelete={() => openDelete(client)}
                        />
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          <a href={`mailto:${client.email}`} className="text-foreground hover:text-primary">{client.email}</a>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          <span className="text-foreground">{client.phone || 'Not provided'}</span>
                        </div>
                        {client.company && (
                          <div className="flex items-center gap-2 text-sm">
                            <Briefcase className="w-4 h-4 text-muted-foreground" />
                            <span className="text-foreground">{client.company}</span>
                          </div>
                        )}
                        {client.assigned_associate_name && (
                          <div className="flex items-center gap-2 text-sm">
                            <Users className="w-4 h-4 text-muted-foreground" />
                            <span className="text-foreground">
                              Assigned to: {client.assigned_associate_name}{isMyClient && ' (You)'}
                            </span>
                          </div>
                        )}
                      </div>

                      {clientCases.length > 0 && (
                        <div className="mb-4 pt-3 border-t border-border">
                          <h5 className="text-sm font-medium text-foreground mb-2">Client's Cases:</h5>
                          <div className="space-y-2">
                            {clientCases.slice(0, 3).map((caseItem) => (
                              <div key={caseItem.id} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                                <div className="flex-1">
                                  <p className="text-sm text-foreground">{caseItem.title}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge variant={caseItem.status === 'Active' ? 'success' : caseItem.status === 'On Hold' ? 'warning' : 'secondary'} className="text-xs">{caseItem.status}</Badge>
                                    <Badge variant={caseItem.priority === 'high' ? 'error' : caseItem.priority === 'medium' ? 'warning' : 'success'} className="text-xs">{caseItem.priority}</Badge>
                                    {caseItem.assigned_to_user_id === currentUser.id && <Badge variant="default" className="text-xs">Your case</Badge>}
                                  </div>
                                </div>
                              </div>
                            ))}
                            {clientCases.length > 3 && (
                              <button
                                onClick={() => openView(client)}
                                className="text-xs text-primary hover:underline text-center w-full mt-1"
                              >
                                +{clientCases.length - 3} more cases — view all
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Active Cases</p>
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${activeCases > 0 ? 'bg-green-500' : 'bg-gray-300'}`} />
                            <p className="text-lg font-semibold text-foreground">{activeCases}</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Total Cases</p>
                          <p className="text-lg font-semibold text-foreground">{clientCases.length}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Client Since</p>
                          <p className="text-sm text-foreground flex items-center gap-1">
                            <Calendar className="w-3 h-3" />{formatDate(client.joined_date)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Last Updated</p>
                          <p className="text-sm text-foreground">{client.updated_at ? formatRelativeTime(client.updated_at) : 'Never'}</p>
                        </div>
                      </div>

                      {/* Quick action bar */}
                      <div className="flex gap-2 mt-4 pt-4 border-t border-border">
                        <button
                          onClick={() => openView(client)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />View
                        </button>
                        <button
                          onClick={() => openEdit(client)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-950/50 text-blue-600 transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" />Edit
                        </button>
                        <button
                          onClick={() => openDelete(client)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-950/50 text-red-600 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />Delete
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {filteredClients.length > 0 && (
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Showing {filteredClients.length} client{filteredClients.length !== 1 ? 's' : ''}
            {viewMode === 'my-clients' ? ` assigned to ${currentUser.full_name}` : ' in the company'}
          </p>
        </div>
      )}
    </div>
  );
}