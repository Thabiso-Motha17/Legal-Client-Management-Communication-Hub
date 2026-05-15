import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Cards';
import { Badge } from '../ui/Badges';
import { Button } from '../ui/Buttons';
import {
  Shield,
  Search,
  Filter,
  Download,
  Calendar,
  Eye,
  User,
  Briefcase,
  FileText,
  Settings,
  DollarSign,
  MessageSquare,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  X,
  RefreshCw,
  LogIn,
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { toast } from 'sonner';

// ─── Backend shape ────────────────────────────────────────────────────────────
interface BackendAuditLog {
  id: number;
  user_id: number | null;
  action: string;          // 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'DOWNLOAD'
  entity_type: string;     // 'USER' | 'CLIENT' | 'CASE' | 'DOCUMENT' | 'NOTE' | 'INVOICE' | 'EVENT' | 'LAW_FIRM'
  entity_id: number | null;
  description: string | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
  // joined fields
  actor_username: string | null;
  actor_full_name: string | null;
  actor_email: string | null;
  actor_role: string | null;
}

// ─── Normalised shape used by the UI ─────────────────────────────────────────
interface AuditLog {
  id: string;
  timestamp: string;
  eventType: EventType;
  severity: 'info' | 'warning' | 'critical';
  user: string;
  userId: string;
  action: string;
  resource: string;
  resourceId: string;
  ipAddress: string;
  details: string;
  metadata: Record<string, unknown>;
}

// ─── Mapping helpers ──────────────────────────────────────────────────────────

type EventType =
  | 'user_login' | 'user_created' | 'user_updated'
  | 'case_created' | 'case_updated' | 'case_deleted'
  | 'client_created' | 'client_updated' | 'client_deleted'
  | 'document_uploaded' | 'document_updated' | 'document_deleted' | 'document_downloaded'
  | 'note_created' | 'note_updated' | 'note_deleted'
  | 'invoice_created' | 'invoice_updated'
  | 'calendar_event_created' | 'calendar_event_updated' | 'calendar_event_deleted'
  | 'law_firm_created' | 'law_firm_deleted'
  | 'settings_updated';

function toEventType(action: string, entityType: string): EventType {
  const a = action.toUpperCase();
  const e = entityType.toUpperCase();

  if (a === 'LOGIN')    return 'user_login';
  if (a === 'DOWNLOAD') return 'document_downloaded';

  const map: Record<string, Record<string, EventType>> = {
    USER:     { CREATE: 'user_created',            UPDATE: 'user_updated' },
    CLIENT:   { CREATE: 'client_created',          UPDATE: 'client_updated',          DELETE: 'client_deleted' },
    CASE:     { CREATE: 'case_created',            UPDATE: 'case_updated',            DELETE: 'case_deleted' },
    DOCUMENT: { CREATE: 'document_uploaded',       UPDATE: 'document_updated',        DELETE: 'document_deleted' },
    NOTE:     { CREATE: 'note_created',            UPDATE: 'note_updated',            DELETE: 'note_deleted' },
    INVOICE:  { CREATE: 'invoice_created',         UPDATE: 'invoice_updated' },
    EVENT:    { CREATE: 'calendar_event_created',  UPDATE: 'calendar_event_updated',  DELETE: 'calendar_event_deleted' },
    LAW_FIRM: { CREATE: 'law_firm_created',                                           DELETE: 'law_firm_deleted' },
  };

  return map[e]?.[a] ?? 'settings_updated';
}

function toSeverity(action: string, entityType: string): 'info' | 'warning' | 'critical' {
  const a = action.toUpperCase();
  if (a === 'DELETE') return 'critical';
  if (['LAW_FIRM', 'USER'].includes(entityType.toUpperCase()) && a === 'UPDATE') return 'warning';
  if (a === 'LOGIN' && entityType.toUpperCase() === 'USER') return 'info';
  return 'info';
}

function toResourceLabel(entityType: string): string {
  const labels: Record<string, string> = {
    USER: 'User', CLIENT: 'Client', CASE: 'Case', DOCUMENT: 'Document',
    NOTE: 'Note', INVOICE: 'Invoice', EVENT: 'Calendar Event', LAW_FIRM: 'Law Firm',
  };
  return labels[entityType.toUpperCase()] ?? entityType;
}

function normalise(raw: BackendAuditLog): AuditLog {
  const eventType = toEventType(raw.action, raw.entity_type);
  const severity  = toSeverity(raw.action, raw.entity_type);
  const userName  = raw.actor_full_name ?? raw.actor_username ?? raw.actor_email ?? `User #${raw.user_id}`;

  return {
    id:         String(raw.id),
    timestamp:  raw.created_at,
    eventType,
    severity,
    user:       userName,
    userId:     String(raw.user_id ?? ''),
    action:     `${raw.action} ${raw.entity_type}`,
    resource:   toResourceLabel(raw.entity_type),
    resourceId: raw.entity_id != null ? String(raw.entity_id) : '',
    ipAddress:  raw.ip_address ?? '—',
    details:    raw.description ?? `${raw.action} on ${raw.entity_type}`,
    metadata: {
      ...(raw.old_values ? { before: raw.old_values } : {}),
      ...(raw.new_values ? { after:  raw.new_values } : {}),
      actor_role: raw.actor_role,
    },
  };
}

// ─── API call ─────────────────────────────────────────────────────────────────
const API_BASE = import.meta.env.VITE_API_URL ?? '';

async function fetchAuditLogs(params: {
  action?: string;
  entity_type?: string;
  user_id?: string;
  from_date?: string;
  to_date?: string;
  limit?: number;
  offset?: number;
}): Promise<{ data: BackendAuditLog[]; pagination: { total: number; limit: number; offset: number } }> {
  const token = localStorage.getItem('token');
  const qs = new URLSearchParams();
  if (params.action && params.action !== 'all')           qs.set('action',      params.action);
  if (params.entity_type && params.entity_type !== 'all') qs.set('entity_type', params.entity_type);
  if (params.user_id && params.user_id !== 'all')         qs.set('user_id',     params.user_id);
  if (params.from_date)                                   qs.set('from_date',   params.from_date);
  if (params.to_date)                                     qs.set('to_date',     params.to_date);
  qs.set('limit',  String(params.limit  ?? 200));
  qs.set('offset', String(params.offset ?? 0));

  const res = await fetch(`${API_BASE}/api/audit-logs?${qs}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Failed to fetch audit logs: ${res.status}`);
  return res.json();
}

// ─── Event-type display config ────────────────────────────────────────────────
const eventTypeConfig: Record<EventType, { icon: React.ElementType; label: string; color: string }> = {
  user_login:              { icon: LogIn,         label: 'User Login',           color: 'text-success' },
  user_created:            { icon: User,          label: 'User Created',         color: 'text-accent' },
  user_updated:            { icon: User,          label: 'User Updated',         color: 'text-primary' },
  case_created:            { icon: Briefcase,     label: 'Case Created',         color: 'text-accent' },
  case_updated:            { icon: Briefcase,     label: 'Case Updated',         color: 'text-primary' },
  case_deleted:            { icon: Briefcase,     label: 'Case Deleted',         color: 'text-destructive' },
  client_created:          { icon: User,          label: 'Client Created',       color: 'text-accent' },
  client_updated:          { icon: User,          label: 'Client Updated',       color: 'text-primary' },
  client_deleted:          { icon: User,          label: 'Client Deleted',       color: 'text-destructive' },
  document_uploaded:       { icon: FileText,      label: 'Document Uploaded',    color: 'text-success' },
  document_updated:        { icon: FileText,      label: 'Document Updated',     color: 'text-primary' },
  document_deleted:        { icon: FileText,      label: 'Document Deleted',     color: 'text-destructive' },
  document_downloaded:     { icon: Download,      label: 'Document Downloaded',  color: 'text-primary' },
  note_created:            { icon: MessageSquare, label: 'Note Created',         color: 'text-accent' },
  note_updated:            { icon: MessageSquare, label: 'Note Updated',         color: 'text-primary' },
  note_deleted:            { icon: MessageSquare, label: 'Note Deleted',         color: 'text-destructive' },
  invoice_created:         { icon: DollarSign,    label: 'Invoice Created',      color: 'text-accent' },
  invoice_updated:         { icon: DollarSign,    label: 'Invoice Updated',      color: 'text-primary' },
  calendar_event_created:  { icon: Calendar,      label: 'Event Created',        color: 'text-accent' },
  calendar_event_updated:  { icon: Calendar,      label: 'Event Updated',        color: 'text-primary' },
  calendar_event_deleted:  { icon: Calendar,      label: 'Event Deleted',        color: 'text-destructive' },
  law_firm_created:        { icon: Settings,      label: 'Law Firm Created',     color: 'text-accent' },
  law_firm_deleted:        { icon: Settings,      label: 'Law Firm Deleted',     color: 'text-destructive' },
  settings_updated:        { icon: Settings,      label: 'Settings Updated',     color: 'text-warning' },
};

const severityConfig = {
  info:     { icon: CheckCircle,  label: 'Info',     variant: 'default'  as const },
  warning:  { icon: AlertCircle,  label: 'Warning',  variant: 'warning'  as const },
  critical: { icon: XCircle,      label: 'Critical', variant: 'error'    as const },
};

// ─── Component ────────────────────────────────────────────────────────────────
export function AuditLogs() {
  const [searchQuery,       setSearchQuery]       = useState('');
  const [selectedAction,    setSelectedAction]    = useState('all');
  const [selectedEntity,    setSelectedEntity]    = useState('all');
  const [selectedSeverity,  setSelectedSeverity]  = useState('all');
  const [selectedUser,      setSelectedUser]      = useState('all');
  const [showFilters,       setShowFilters]       = useState(false);
  const [selectedLog,       setSelectedLog]       = useState<AuditLog | null>(null);
  const [showDetailDialog,  setShowDetailDialog]  = useState(false);
  const [showDateDialog,    setShowDateDialog]    = useState(false);
  const [auditLogs,         setAuditLogs]         = useState<AuditLog[]>([]);
  const [loading,           setLoading]           = useState(true);
  const [total,             setTotal]             = useState(0);
  const [dateRange, setDateRange] = useState<{ from: Date | null; to: Date | null; preset: string }>({
    from: null, to: null, preset: 'all',
  });

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchAuditLogs({
        action:      selectedAction  !== 'all' ? selectedAction  : undefined,
        entity_type: selectedEntity  !== 'all' ? selectedEntity  : undefined,
        user_id:     selectedUser    !== 'all' ? selectedUser    : undefined,
        from_date:   dateRange.from  ? format(dateRange.from, "yyyy-MM-dd'T'HH:mm:ss") : undefined,
        to_date:     dateRange.to    ? format(dateRange.to,   "yyyy-MM-dd'T'HH:mm:ss") : undefined,
        limit:  200,
        offset: 0,
      });
      setAuditLogs(result.data.map(normalise));
      setTotal(result.pagination.total);
    } catch (err) {
      toast.error('Failed to load audit logs');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [selectedAction, selectedEntity, selectedUser, dateRange]);

  useEffect(() => { loadLogs(); }, [loadLogs]);

  // ── Client-side search + severity filter (fast, no extra request) ──────────
  const filteredLogs = auditLogs.filter(log => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q ||
      log.action.toLowerCase().includes(q)  ||
      log.user.toLowerCase().includes(q)    ||
      log.resource.toLowerCase().includes(q)||
      log.details.toLowerCase().includes(q);

    const matchesSeverity = selectedSeverity === 'all' || log.severity === selectedSeverity;
    return matchesSearch && matchesSeverity;
  });

  // ── Unique users for filter dropdown ──────────────────────────────────────
  const uniqueUsers = Array.from(
    new Map(auditLogs.map(l => [l.userId, l.user])).entries()
  ).map(([id, name]) => ({ id, name }));

  // ── Helpers ────────────────────────────────────────────────────────────────
  const formatTimestamp = (ts: string) => {
    const d = new Date(ts);
    return {
      date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    };
  };

  const handleExport = () => {
    if (filteredLogs.length === 0) { toast.error('No logs to export'); return; }

    const headers = ['ID', 'Timestamp', 'Event Type', 'Severity', 'User', 'User ID', 'Action', 'Resource', 'Resource ID', 'IP Address', 'Details'];
    const rows = filteredLogs.map(l => [
      l.id, l.timestamp, l.eventType, l.severity, l.user, l.userId,
      l.action, l.resource, l.resourceId, l.ipAddress, l.details,
    ]);

    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(new Blob([csv], { type: 'text/csv' })),
      download: `audit-logs-${dateRange.preset !== 'all' ? dateRange.preset : format(new Date(), 'yyyy-MM-dd')}.csv`,
    });
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    toast.success(`Exported ${filteredLogs.length} log${filteredLogs.length === 1 ? '' : 's'}`);
  };

  const applyDatePreset = (preset: string) => {
    const now = new Date();
    const presets: Record<string, [Date | null, Date | null]> = {
      today:       [startOfDay(now),           endOfDay(now)],
      yesterday:   [startOfDay(subDays(now,1)), endOfDay(subDays(now,1))],
      last7days:   [startOfDay(subDays(now,7)), endOfDay(now)],
      last30days:  [startOfDay(subDays(now,30)),endOfDay(now)],
      all:         [null, null],
    };
    const [from, to] = presets[preset] ?? [null, null];
    setDateRange({ from, to, preset });
    setShowDateDialog(false);
  };

  const getDateRangeLabel = () => {
    const labels: Record<string, string> = { today: 'Today', yesterday: 'Yesterday', last7days: 'Last 7 Days', last30days: 'Last 30 Days', all: 'All Time' };
    if (dateRange.preset !== 'custom') return labels[dateRange.preset] ?? 'All Time';
    if (dateRange.from && dateRange.to) return `${format(dateRange.from,'MMM d, yyyy')} – ${format(dateRange.to,'MMM d, yyyy')}`;
    if (dateRange.from) return `From ${format(dateRange.from,'MMM d, yyyy')}`;
    if (dateRange.to)   return `Until ${format(dateRange.to,'MMM d, yyyy')}`;
    return 'All Time';
  };

  const clearFilters = () => {
    setSearchQuery(''); setSelectedAction('all'); setSelectedEntity('all');
    setSelectedSeverity('all'); setSelectedUser('all');
    setDateRange({ from: null, to: null, preset: 'all' });
  };

  const activeFilterCount = [
    selectedAction   !== 'all',
    selectedEntity   !== 'all',
    selectedSeverity !== 'all',
    selectedUser     !== 'all',
    dateRange.preset !== 'all',
  ].filter(Boolean).length;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 md:p-8 space-y-6 bg-background">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-foreground">Audit Logs</h1>
          </div>
          <p className="text-muted-foreground">
            Track all system activities and user actions for compliance and security
            {total > 0 && <span className="ml-1 text-xs">({total.toLocaleString()} total records)</span>}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2" onClick={() => setShowDateDialog(true)}>
            <Calendar className="w-4 h-4" />
            <span className="hidden sm:inline">{getDateRangeLabel()}</span>
          </Button>
          <Button variant="outline" className="gap-2" onClick={loadLogs} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          <Button variant="primary" onClick={handleExport} className="gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { icon: Clock,        color: 'primary',     count: filteredLogs.length,                             label: dateRange.preset === 'all' ? 'Total Events' : 'Filtered Events' },
          { icon: CheckCircle,  color: 'success',     count: filteredLogs.filter(l=>l.severity==='info').length,     label: 'Info Events' },
          { icon: AlertCircle,  color: 'warning',     count: filteredLogs.filter(l=>l.severity==='warning').length,  label: 'Warnings' },
          { icon: XCircle,      color: 'destructive', count: filteredLogs.filter(l=>l.severity==='critical').length, label: 'Critical Events' },
        ].map(({ icon: Icon, color, count, label }) => (
          <Card key={label}>
            <CardContent className="p-6">
              <div className={`w-10 h-10 rounded-lg bg-${color}/10 flex items-center justify-center mb-3`}>
                <Icon className={`w-5 h-5 text-${color}`} />
              </div>
              <h3 className="text-2xl font-semibold text-foreground mb-1">{count}</h3>
              <p className="text-sm text-muted-foreground">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by action, user, resource, or details..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-input-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <Button
              variant={showFilters ? 'primary' : 'outline'}
              onClick={() => setShowFilters(v => !v)}
              className="gap-2"
            >
              <Filter className="w-4 h-4" />
              Filters
              {activeFilterCount > 0 && (
                <Badge variant="default" className="ml-1 px-1.5 py-0 text-xs min-w-[20px] h-5">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
            {activeFilterCount > 0 && (
              <Button variant="ghost" onClick={clearFilters} className="gap-2">
                <X className="w-4 h-4" /> Clear
              </Button>
            )}
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-border">
              {/* Action filter — sent to server */}
              <div className="space-y-2">
                <label className="text-sm text-foreground">Action</label>
                <Select value={selectedAction} onValueChange={setSelectedAction}>
                  <SelectTrigger><SelectValue placeholder="All actions" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All actions</SelectItem>
                    {['CREATE','UPDATE','DELETE','LOGIN','DOWNLOAD'].map(a => (
                      <SelectItem key={a} value={a}>{a.charAt(0) + a.slice(1).toLowerCase()}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Entity filter — sent to server */}
              <div className="space-y-2">
                <label className="text-sm text-foreground">Entity Type</label>
                <Select value={selectedEntity} onValueChange={setSelectedEntity}>
                  <SelectTrigger><SelectValue placeholder="All entities" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All entities</SelectItem>
                    {['USER','CLIENT','CASE','DOCUMENT','NOTE','INVOICE','EVENT','LAW_FIRM'].map(e => (
                      <SelectItem key={e} value={e}>{toResourceLabel(e)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Severity — client-side only */}
              <div className="space-y-2">
                <label className="text-sm text-foreground">Severity</label>
                <Select value={selectedSeverity} onValueChange={setSelectedSeverity}>
                  <SelectTrigger><SelectValue placeholder="All severities" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All severities</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* User — sent to server */}
              <div className="space-y-2">
                <label className="text-sm text-foreground">User</label>
                <Select value={selectedUser} onValueChange={setSelectedUser}>
                  <SelectTrigger><SelectValue placeholder="All users" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All users</SelectItem>
                    {uniqueUsers.map(u => (
                      <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Recent Activity ({filteredLogs.length}{filteredLogs.length < total ? ` of ${total.toLocaleString()}` : ''} events)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">Timestamp</TableHead>
                  <TableHead className="w-[200px]">Event Type</TableHead>
                  <TableHead className="w-[100px]">Severity</TableHead>
                  <TableHead className="w-[150px]">User</TableHead>
                  <TableHead className="w-[160px]">Resource</TableHead>
                  <TableHead className="min-w-[280px]">Details</TableHead>
                  <TableHead className="w-[130px]">IP Address</TableHead>
                  <TableHead className="w-[60px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" />
                      Loading audit logs…
                    </TableCell>
                  </TableRow>
                ) : filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                      No audit logs found matching your filters
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map(log => {
                    const evtCfg = eventTypeConfig[log.eventType] ?? eventTypeConfig.settings_updated;
                    const sevCfg = severityConfig[log.severity];
                    const EventIcon    = evtCfg.icon;
                    const SeverityIcon = sevCfg.icon;
                    const ts = formatTimestamp(log.timestamp);

                    return (
                      <TableRow key={log.id} className="group">
                        <TableCell>
                          <div className="text-sm">
                            <div className="text-foreground">{ts.date}</div>
                            <div className="text-muted-foreground">{ts.time}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <EventIcon className={`w-4 h-4 flex-shrink-0 ${evtCfg.color}`} />
                            <span className="text-sm text-foreground">{evtCfg.label}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={sevCfg.variant} className="gap-1">
                            <SeverityIcon className="w-3 h-3" />
                            {sevCfg.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-foreground truncate max-w-[140px]" title={log.user}>
                            {log.user}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-foreground">
                            {log.resource}
                            {log.resourceId && (
                              <span className="ml-1 text-xs text-muted-foreground">#{log.resourceId}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-muted-foreground line-clamp-2">{log.details}</div>
                        </TableCell>
                        <TableCell>
                          <code className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                            {log.ipAddress}
                          </code>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => { setSelectedLog(log); setShowDetailDialog(true); }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Date Range Dialog */}
      <Dialog open={showDateDialog} onOpenChange={setShowDateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Select Date Range</DialogTitle>
            <DialogDescription>Filter audit logs by date range</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm text-foreground">Quick Select</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: 'today',      label: 'Today' },
                  { key: 'yesterday',  label: 'Yesterday' },
                  { key: 'last7days',  label: 'Last 7 Days' },
                  { key: 'last30days', label: 'Last 30 Days' },
                ].map(({ key, label }) => (
                  <Button
                    key={key}
                    variant={dateRange.preset === key ? 'primary' : 'outline'}
                    onClick={() => applyDatePreset(key)}
                    className="w-full"
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-border">
              <label className="text-sm text-foreground">Custom Range</label>
              {(['from', 'to'] as const).map(field => (
                <div key={field} className="space-y-1">
                  <label className="text-xs text-muted-foreground capitalize">{field === 'from' ? 'From' : 'To'} Date</label>
                  <input
                    type="date"
                    value={dateRange[field] ? format(dateRange[field]!, 'yyyy-MM-dd') : ''}
                    onChange={e => {
                      const d = e.target.value ? new Date(e.target.value) : null;
                      setDateRange(prev => ({ ...prev, [field]: d, preset: 'custom' }));
                    }}
                    className="w-full px-3 py-2 bg-input-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              ))}
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => { setDateRange({ from: null, to: null, preset: 'all' }); setShowDateDialog(false); }}
                className="flex-1"
              >
                Clear
              </Button>
              <Button variant="primary" onClick={() => setShowDateDialog(false)} className="flex-1">
                Apply
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Audit Log Details</DialogTitle>
            <DialogDescription>Complete information about this audit event</DialogDescription>
          </DialogHeader>

          {selectedLog && (() => {
            const evtCfg = eventTypeConfig[selectedLog.eventType] ?? eventTypeConfig.settings_updated;
            const sevCfg = severityConfig[selectedLog.severity];
            const EventIcon = evtCfg.icon;
            const { before, after, actor_role, ...extraMeta } = selectedLog.metadata as any;

            const rows: { label: string; value: React.ReactNode }[] = [
              { label: 'Timestamp',   value: new Date(selectedLog.timestamp).toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'long' }) },
              { label: 'User',        value: selectedLog.user },
              { label: 'User ID',     value: <code className="text-xs bg-muted px-2 py-1 rounded">{selectedLog.userId}</code> },
              { label: 'Role',        value: actor_role ?? '—' },
              { label: 'Resource',    value: `${selectedLog.resource}${selectedLog.resourceId ? ` #${selectedLog.resourceId}` : ''}` },
              { label: 'IP Address',  value: <code className="text-xs bg-muted px-2 py-1 rounded">{selectedLog.ipAddress}</code> },
              { label: 'Details',     value: selectedLog.details },
            ];

            return (
              <div className="space-y-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <EventIcon className={`w-6 h-6 ${evtCfg.color}`} />
                    <div>
                      <h3 className="text-foreground">{evtCfg.label}</h3>
                      <p className="text-sm text-muted-foreground">{selectedLog.action}</p>
                    </div>
                  </div>
                  <Badge variant={sevCfg.variant}>{sevCfg.label}</Badge>
                </div>

                <div className="border-t border-border pt-4 space-y-3">
                  {rows.map(({ label, value }) => (
                    <div key={label} className="grid grid-cols-3 gap-4">
                      <div className="text-sm text-muted-foreground">{label}</div>
                      <div className="col-span-2 text-sm text-foreground">{value}</div>
                    </div>
                  ))}
                </div>

                {/* Before / After diff */}
                {(before || after) && (
                  <div className="border-t border-border pt-4 space-y-3">
                    <p className="text-sm font-medium text-foreground">Changes</p>
                    <div className="grid grid-cols-2 gap-3">
                      {before && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Before</p>
                          <div className="bg-muted rounded-lg p-3 space-y-1">
                            {Object.entries(before as Record<string, unknown>).map(([k, v]) => (
                              <div key={k} className="flex gap-2 text-xs">
                                <span className="text-muted-foreground min-w-[80px] shrink-0">{k}:</span>
                                <code className="text-foreground break-all">{JSON.stringify(v)}</code>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {after && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">After</p>
                          <div className="bg-muted rounded-lg p-3 space-y-1">
                            {Object.entries(after as Record<string, unknown>).map(([k, v]) => (
                              <div key={k} className="flex gap-2 text-xs">
                                <span className="text-muted-foreground min-w-[80px] shrink-0">{k}:</span>
                                <code className="text-foreground break-all">{JSON.stringify(v)}</code>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Extra metadata */}
                {Object.keys(extraMeta).length > 0 && (
                  <div className="border-t border-border pt-4">
                    <p className="text-sm font-medium text-foreground mb-2">Additional Metadata</p>
                    <div className="bg-muted rounded-lg p-3 space-y-1">
                      {Object.entries(extraMeta).map(([k, v]) => (
                        <div key={k} className="flex gap-2 text-xs">
                          <span className="text-muted-foreground min-w-[120px] shrink-0">{k}:</span>
                          <code className="text-foreground break-all">{JSON.stringify(v)}</code>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="border-t border-border pt-4 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Event ID:</span>
                  <code className="text-foreground bg-muted px-2 py-1 rounded">{selectedLog.id}</code>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}