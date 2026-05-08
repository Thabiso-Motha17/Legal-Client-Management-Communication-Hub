import { useState, useEffect } from 'react';
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
  X
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
import { auditLogService, type AuditLog, type AuditEventType } from '../../services/auditLogService';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { toast } from 'sonner';

export function AuditLogs() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEventType, setSelectedEventType] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showDateRangeDialog, setShowDateRangeDialog] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [dateRange, setDateRange] = useState<{
    from: Date | null;
    to: Date | null;
    preset: string;
  }>({
    from: null,
    to: null,
    preset: 'all'
  });

  // Load audit logs from service
  useEffect(() => {
    const loadLogs = () => {
      const logs = auditLogService.getLogs();
      setAuditLogs(logs);
    };

    loadLogs();

    // Refresh logs every 5 seconds to catch new entries
    const interval = setInterval(loadLogs, 5000);
    return () => clearInterval(interval);
  }, []);

  const eventTypeConfig: Record<AuditEventType, { icon: any; label: string; color: string }> = {
    user_login: { icon: User, label: 'User Login', color: 'text-success' },
    user_logout: { icon: User, label: 'User Logout', color: 'text-muted-foreground' },
    case_created: { icon: Briefcase, label: 'Case Created', color: 'text-accent' },
    case_updated: { icon: Briefcase, label: 'Case Updated', color: 'text-primary' },
    case_deleted: { icon: Briefcase, label: 'Case Deleted', color: 'text-destructive' },
    case_viewed: { icon: Eye, label: 'Case Viewed', color: 'text-primary' },
    client_created: { icon: User, label: 'Client Created', color: 'text-accent' },
    client_updated: { icon: User, label: 'Client Updated', color: 'text-primary' },
    client_deleted: { icon: User, label: 'Client Deleted', color: 'text-destructive' },
    client_viewed: { icon: Eye, label: 'Client Viewed', color: 'text-primary' },
    document_uploaded: { icon: FileText, label: 'Document Uploaded', color: 'text-success' },
    document_accessed: { icon: Eye, label: 'Document Accessed', color: 'text-primary' },
    document_deleted: { icon: FileText, label: 'Document Deleted', color: 'text-destructive' },
    document_downloaded: { icon: Download, label: 'Document Downloaded', color: 'text-primary' },
    message_sent: { icon: MessageSquare, label: 'Message Sent', color: 'text-accent' },
    message_read: { icon: Eye, label: 'Message Read', color: 'text-primary' },
    payment_processed: { icon: DollarSign, label: 'Payment Processed', color: 'text-success' },
    payment_updated: { icon: DollarSign, label: 'Payment Updated', color: 'text-primary' },
    invoice_created: { icon: FileText, label: 'Invoice Created', color: 'text-accent' },
    settings_updated: { icon: Settings, label: 'Settings Updated', color: 'text-warning' },
    user_created: { icon: User, label: 'User Created', color: 'text-accent' },
    user_updated: { icon: User, label: 'User Updated', color: 'text-primary' },
    calendar_event_created: { icon: Calendar, label: 'Event Created', color: 'text-accent' },
    calendar_event_updated: { icon: Calendar, label: 'Event Updated', color: 'text-primary' },
    calendar_event_deleted: { icon: Calendar, label: 'Event Deleted', color: 'text-destructive' },
    report_generated: { icon: FileText, label: 'Report Generated', color: 'text-primary' },
    profile_updated: { icon: User, label: 'Profile Updated', color: 'text-primary' },
    password_changed: { icon: Shield, label: 'Password Changed', color: 'text-warning' },
    security_alert: { icon: AlertCircle, label: 'Security Alert', color: 'text-destructive' }
  };

  const severityConfig = {
    info: { icon: CheckCircle, label: 'Info', variant: 'default' as const },
    warning: { icon: AlertCircle, label: 'Warning', variant: 'warning' as const },
    critical: { icon: XCircle, label: 'Critical', variant: 'error' as const }
  };

  // Filter logic
  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch =
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.resource.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesEventType = selectedEventType === 'all' || log.eventType === selectedEventType;
    const matchesSeverity = selectedSeverity === 'all' || log.severity === selectedSeverity;
    const matchesUser = selectedUser === 'all' || log.userId === selectedUser;

    // Date range filter
    let matchesDateRange = true;
    if (dateRange.from || dateRange.to) {
      const logDate = new Date(log.timestamp);
      if (dateRange.from && dateRange.to) {
        const fromStart = startOfDay(dateRange.from);
        const toEnd = endOfDay(dateRange.to);
        matchesDateRange = logDate >= fromStart && logDate <= toEnd;
      } else if (dateRange.from) {
        matchesDateRange = logDate >= startOfDay(dateRange.from);
      } else if (dateRange.to) {
        matchesDateRange = logDate <= endOfDay(dateRange.to);
      }
    }

    return matchesSearch && matchesEventType && matchesSeverity && matchesUser && matchesDateRange;
  });

  const uniqueUsers = Array.from(new Set(auditLogs.map(log => ({ id: log.userId, name: log.user })).map(obj => JSON.stringify(obj)))).map((str) => JSON.parse(str));

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    };
  };

  const handleViewDetails = (log: AuditLog) => {
    setSelectedLog(log);
    setShowDetailDialog(true);
  };

  const handleExport = () => {
    // Export filtered logs, not all logs
    const logsToExport = filteredLogs;

    if (logsToExport.length === 0) {
      toast.error('No logs to export with current filters');
      return;
    }

    // Create CSV manually from filtered logs
    const headers = ['ID', 'Timestamp', 'Event Type', 'Severity', 'User', 'User ID', 'Action', 'Resource', 'Resource ID', 'IP Address', 'Details'];
    const rows = logsToExport.map(log => [
      log.id,
      log.timestamp,
      log.eventType,
      log.severity,
      log.user,
      log.userId,
      log.action,
      log.resource,
      log.resourceId || '',
      log.ipAddress,
      log.details,
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;

    // Include date range in filename if applicable
    let filename = 'audit-logs';
    if (dateRange.from && dateRange.to) {
      filename += `-${format(dateRange.from, 'yyyy-MM-dd')}-to-${format(dateRange.to, 'yyyy-MM-dd')}`;
    } else if (dateRange.preset !== 'all') {
      filename += `-${dateRange.preset}`;
    } else {
      filename += `-${format(new Date(), 'yyyy-MM-dd')}`;
    }
    a.download = `${filename}.csv`;

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success(`Exported ${logsToExport.length} audit log${logsToExport.length === 1 ? '' : 's'}`);
  };

  const applyDatePreset = (preset: string) => {
    const now = new Date();
    let from: Date | null = null;
    let to: Date | null = null;

    switch (preset) {
      case 'today':
        from = startOfDay(now);
        to = endOfDay(now);
        break;
      case 'yesterday':
        from = startOfDay(subDays(now, 1));
        to = endOfDay(subDays(now, 1));
        break;
      case 'last7days':
        from = startOfDay(subDays(now, 7));
        to = endOfDay(now);
        break;
      case 'last30days':
        from = startOfDay(subDays(now, 30));
        to = endOfDay(now);
        break;
      case 'all':
      default:
        from = null;
        to = null;
        break;
    }

    setDateRange({ from, to, preset });
    setShowDateRangeDialog(false);
  };

  const getDateRangeLabel = () => {
    if (!dateRange.from && !dateRange.to) {
      return 'All Time';
    }
    if (dateRange.preset !== 'all' && dateRange.preset !== 'custom') {
      const labels: Record<string, string> = {
        today: 'Today',
        yesterday: 'Yesterday',
        last7days: 'Last 7 Days',
        last30days: 'Last 30 Days'
      };
      return labels[dateRange.preset] || 'Custom Range';
    }
    if (dateRange.from && dateRange.to) {
      return `${format(dateRange.from, 'MMM d, yyyy')} - ${format(dateRange.to, 'MMM d, yyyy')}`;
    }
    if (dateRange.from) {
      return `From ${format(dateRange.from, 'MMM d, yyyy')}`;
    }
    if (dateRange.to) {
      return `Until ${format(dateRange.to, 'MMM d, yyyy')}`;
    }
    return 'All Time';
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedEventType('all');
    setSelectedSeverity('all');
    setSelectedUser('all');
    setDateRange({ from: null, to: null, preset: 'all' });
  };

  const activeFilterCount = [
    selectedEventType !== 'all',
    selectedSeverity !== 'all',
    selectedUser !== 'all',
    dateRange.preset !== 'all'
  ].filter(Boolean).length;

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
          <p className="text-muted-foreground">Track all system activities and user actions for compliance and security</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => setShowDateRangeDialog(true)}
          >
            <Calendar className="w-4 h-4" />
            <span className="hidden sm:inline">{getDateRangeLabel()}</span>
          </Button>
          <Button variant="primary" onClick={handleExport} className="gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-primary" />
              </div>
            </div>
            <h3 className="text-2xl font-semibold text-foreground mb-1">{filteredLogs.length}</h3>
            <p className="text-sm text-muted-foreground">
              {dateRange.preset === 'all' ? 'Total Events' : 'Filtered Events'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-success" />
              </div>
            </div>
            <h3 className="text-2xl font-semibold text-foreground mb-1">
              {filteredLogs.filter(l => l.severity === 'info').length}
            </h3>
            <p className="text-sm text-muted-foreground">Info Events</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-warning" />
              </div>
            </div>
            <h3 className="text-2xl font-semibold text-foreground mb-1">
              {filteredLogs.filter(l => l.severity === 'warning').length}
            </h3>
            <p className="text-sm text-muted-foreground">Warnings</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                <XCircle className="w-5 h-5 text-destructive" />
              </div>
            </div>
            <h3 className="text-2xl font-semibold text-foreground mb-1">
              {filteredLogs.filter(l => l.severity === 'critical').length}
            </h3>
            <p className="text-sm text-muted-foreground">Critical Events</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="flex items-center gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search by action, user, resource, or details..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-input-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <Button
                variant={showFilters ? "primary" : "outline"}
                onClick={() => setShowFilters(!showFilters)}
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
                  <X className="w-4 h-4" />
                  Clear
                </Button>
              )}
            </div>

            {/* Filter Options */}
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-border">
                <div className="space-y-2">
                  <label className="text-sm text-foreground">Event Type</label>
                  <Select value={selectedEventType} onValueChange={setSelectedEventType}>
                    <SelectTrigger>
                      <SelectValue placeholder="All event types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All event types</SelectItem>
                      {Object.entries(eventTypeConfig).map(([type, config]) => (
                        <SelectItem key={type} value={type}>{config.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-foreground">Severity</label>
                  <Select value={selectedSeverity} onValueChange={setSelectedSeverity}>
                    <SelectTrigger>
                      <SelectValue placeholder="All severities" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All severities</SelectItem>
                      <SelectItem value="info">Info</SelectItem>
                      <SelectItem value="warning">Warning</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-foreground">User</label>
                  <Select value={selectedUser} onValueChange={setSelectedUser}>
                    <SelectTrigger>
                      <SelectValue placeholder="All users" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All users</SelectItem>
                      {uniqueUsers.map(user => (
                        <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity ({filteredLogs.length} events)</CardTitle>
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
                  <TableHead className="w-[200px]">Resource</TableHead>
                  <TableHead className="min-w-[300px]">Details</TableHead>
                  <TableHead className="w-[120px]">IP Address</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                      No audit logs found matching your filters
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log) => {
                    const eventConfig = eventTypeConfig[log.eventType];
                    const severityInfo = severityConfig[log.severity];
                    const EventIcon = eventConfig.icon;
                    const SeverityIcon = severityInfo.icon;
                    const timestamp = formatTimestamp(log.timestamp);

                    return (
                      <TableRow key={log.id} className="group">
                        <TableCell>
                          <div className="text-sm">
                            <div className="text-foreground">{timestamp.date}</div>
                            <div className="text-muted-foreground">{timestamp.time}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <EventIcon className={`w-4 h-4 ${eventConfig.color}`} />
                            <span className="text-sm text-foreground">{eventConfig.label}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={severityInfo.variant} className="gap-1">
                            <SeverityIcon className="w-3 h-3" />
                            {severityInfo.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-foreground">{log.user}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-foreground">{log.resource}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-muted-foreground line-clamp-2">
                            {log.details}
                          </div>
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
                            onClick={() => handleViewDetails(log)}
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
      <Dialog open={showDateRangeDialog} onOpenChange={setShowDateRangeDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Select Date Range</DialogTitle>
            <DialogDescription>
              Filter audit logs by date range
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Preset Options */}
            <div className="space-y-2">
              <label className="text-sm text-foreground">Quick Select</label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={dateRange.preset === 'today' ? 'primary' : 'outline'}
                  onClick={() => applyDatePreset('today')}
                  className="w-full"
                >
                  Today
                </Button>
                <Button
                  variant={dateRange.preset === 'yesterday' ? 'primary' : 'outline'}
                  onClick={() => applyDatePreset('yesterday')}
                  className="w-full"
                >
                  Yesterday
                </Button>
                <Button
                  variant={dateRange.preset === 'last7days' ? 'primary' : 'outline'}
                  onClick={() => applyDatePreset('last7days')}
                  className="w-full"
                >
                  Last 7 Days
                </Button>
                <Button
                  variant={dateRange.preset === 'last30days' ? 'primary' : 'outline'}
                  onClick={() => applyDatePreset('last30days')}
                  className="w-full"
                >
                  Last 30 Days
                </Button>
              </div>
            </div>

            {/* Custom Date Range */}
            <div className="space-y-3 pt-4 border-t border-border">
              <label className="text-sm text-foreground">Custom Range</label>

              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">From Date</label>
                <input
                  type="date"
                  value={dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : ''}
                  onChange={(e) => {
                    const date = e.target.value ? new Date(e.target.value) : null;
                    setDateRange({ ...dateRange, from: date, preset: 'custom' });
                  }}
                  className="w-full px-3 py-2 bg-input-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">To Date</label>
                <input
                  type="date"
                  value={dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : ''}
                  onChange={(e) => {
                    const date = e.target.value ? new Date(e.target.value) : null;
                    setDateRange({ ...dateRange, to: date, preset: 'custom' });
                  }}
                  className="w-full px-3 py-2 bg-input-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setDateRange({ from: null, to: null, preset: 'all' });
                  setShowDateRangeDialog(false);
                }}
                className="flex-1"
              >
                Clear
              </Button>
              <Button
                variant="primary"
                onClick={() => setShowDateRangeDialog(false)}
                className="flex-1"
              >
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
            <DialogDescription>
              Complete information about this audit event
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-6">
              {/* Event Overview */}
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {(() => {
                      const EventIcon = eventTypeConfig[selectedLog.eventType].icon;
                      return <EventIcon className={`w-6 h-6 ${eventTypeConfig[selectedLog.eventType].color}`} />;
                    })()}
                    <div>
                      <h3 className="text-foreground">{eventTypeConfig[selectedLog.eventType].label}</h3>
                      <p className="text-sm text-muted-foreground">{selectedLog.action}</p>
                    </div>
                  </div>
                  <Badge variant={severityConfig[selectedLog.severity].variant}>
                    {severityConfig[selectedLog.severity].label}
                  </Badge>
                </div>
              </div>

              <div className="border-t border-border pt-4 space-y-4">
                {/* Timestamp */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-sm text-muted-foreground">Timestamp</div>
                  <div className="col-span-2 text-sm text-foreground">
                    {new Date(selectedLog.timestamp).toLocaleString('en-US', {
                      dateStyle: 'full',
                      timeStyle: 'long'
                    })}
                  </div>
                </div>

                {/* User */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-sm text-muted-foreground">User</div>
                  <div className="col-span-2 text-sm text-foreground">{selectedLog.user}</div>
                </div>

                {/* User ID */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-sm text-muted-foreground">User ID</div>
                  <div className="col-span-2">
                    <code className="text-xs text-foreground bg-muted px-2 py-1 rounded">{selectedLog.userId}</code>
                  </div>
                </div>

                {/* Resource */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-sm text-muted-foreground">Resource</div>
                  <div className="col-span-2 text-sm text-foreground">{selectedLog.resource}</div>
                </div>

                {/* Resource ID */}
                {selectedLog.resourceId && (
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-sm text-muted-foreground">Resource ID</div>
                    <div className="col-span-2">
                      <code className="text-xs text-foreground bg-muted px-2 py-1 rounded">{selectedLog.resourceId}</code>
                    </div>
                  </div>
                )}

                {/* IP Address */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-sm text-muted-foreground">IP Address</div>
                  <div className="col-span-2">
                    <code className="text-xs text-foreground bg-muted px-2 py-1 rounded">{selectedLog.ipAddress}</code>
                  </div>
                </div>

                {/* Details */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-sm text-muted-foreground">Details</div>
                  <div className="col-span-2 text-sm text-foreground">{selectedLog.details}</div>
                </div>

                {/* Metadata */}
                {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-sm text-muted-foreground">Metadata</div>
                    <div className="col-span-2">
                      <div className="bg-muted rounded-lg p-3 space-y-2">
                        {Object.entries(selectedLog.metadata).map(([key, value]) => (
                          <div key={key} className="flex items-start gap-2 text-xs">
                            <span className="text-muted-foreground min-w-[120px]">{key}:</span>
                            <code className="text-foreground">{JSON.stringify(value)}</code>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Event ID */}
              <div className="border-t border-border pt-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Event ID:</span>
                  <code className="text-foreground bg-muted px-2 py-1 rounded">{selectedLog.id}</code>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
