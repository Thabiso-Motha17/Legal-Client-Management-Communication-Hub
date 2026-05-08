export type AuditEventType =
  | 'user_login'
  | 'user_logout'
  | 'case_created'
  | 'case_updated'
  | 'case_deleted'
  | 'case_viewed'
  | 'client_created'
  | 'client_updated'
  | 'client_deleted'
  | 'client_viewed'
  | 'document_uploaded'
  | 'document_accessed'
  | 'document_deleted'
  | 'document_downloaded'
  | 'message_sent'
  | 'message_read'
  | 'payment_processed'
  | 'payment_updated'
  | 'invoice_created'
  | 'settings_updated'
  | 'user_created'
  | 'user_updated'
  | 'calendar_event_created'
  | 'calendar_event_updated'
  | 'calendar_event_deleted'
  | 'report_generated'
  | 'profile_updated'
  | 'password_changed'
  | 'security_alert';

export type AuditSeverity = 'info' | 'warning' | 'critical';

export interface AuditLog {
  id: string;
  timestamp: string;
  eventType: AuditEventType;
  severity: AuditSeverity;
  user: string;
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  ipAddress: string;
  details: string;
  metadata?: Record<string, any>;
}

class AuditLogService {
  private static instance: AuditLogService;
  private readonly STORAGE_KEY = 'legalhub_audit_logs';
  private readonly MAX_LOGS = 1000; // Keep only last 1000 logs
  private currentUser: { id: string; name: string } | null = null;

  private constructor() {
    // Initialize with some sample data if empty
    if (!this.getLogs().length) {
      this.initializeSampleData();
    }
  }

  public static getInstance(): AuditLogService {
    if (!AuditLogService.instance) {
      AuditLogService.instance = new AuditLogService();
    }
    return AuditLogService.instance;
  }

  public setCurrentUser(userId: string, userName: string): void {
    this.currentUser = { id: userId, name: userName };
  }

  public clearCurrentUser(): void {
    this.currentUser = null;
  }

  private generateId(): string {
    return `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private getClientIp(): string {
    // In a real application, this would come from the server
    // For demo purposes, we'll use a simulated IP
    return '192.168.1.' + Math.floor(Math.random() * 255);
  }

  public log(
    eventType: AuditEventType,
    action: string,
    resource: string,
    details: string,
    options: {
      severity?: AuditSeverity;
      resourceId?: string;
      metadata?: Record<string, any>;
      userId?: string;
      userName?: string;
    } = {}
  ): void {
    const log: AuditLog = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      eventType,
      severity: options.severity || this.inferSeverity(eventType),
      user: options.userName || this.currentUser?.name || 'System',
      userId: options.userId || this.currentUser?.id || 'system',
      action,
      resource,
      resourceId: options.resourceId,
      ipAddress: this.getClientIp(),
      details,
      metadata: options.metadata,
    };

    const logs = this.getLogs();
    logs.unshift(log); // Add to beginning

    // Keep only the most recent logs
    const trimmedLogs = logs.slice(0, this.MAX_LOGS);

    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(trimmedLogs));
    } catch (error) {
      console.error('Failed to save audit log:', error);
    }
  }

  private inferSeverity(eventType: AuditEventType): AuditSeverity {
    const criticalEvents: AuditEventType[] = [
      'security_alert',
      'case_deleted',
      'document_deleted',
    ];

    const warningEvents: AuditEventType[] = [
      'settings_updated',
      'password_changed',
      'user_created',
      'user_updated',
    ];

    if (criticalEvents.includes(eventType)) return 'critical';
    if (warningEvents.includes(eventType)) return 'warning';
    return 'info';
  }

  public getLogs(): AuditLog[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return [];
      return JSON.parse(stored);
    } catch (error) {
      console.error('Failed to load audit logs:', error);
      return [];
    }
  }

  public getLogsByDateRange(startDate: Date, endDate: Date): AuditLog[] {
    const logs = this.getLogs();
    return logs.filter(log => {
      const logDate = new Date(log.timestamp);
      return logDate >= startDate && logDate <= endDate;
    });
  }

  public getLogsByUser(userId: string): AuditLog[] {
    return this.getLogs().filter(log => log.userId === userId);
  }

  public getLogsByEventType(eventType: AuditEventType): AuditLog[] {
    return this.getLogs().filter(log => log.eventType === eventType);
  }

  public getLogsBySeverity(severity: AuditSeverity): AuditLog[] {
    return this.getLogs().filter(log => log.severity === severity);
  }

  public clearLogs(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  public exportLogs(format: 'json' | 'csv' = 'json'): string {
    const logs = this.getLogs();

    if (format === 'json') {
      return JSON.stringify(logs, null, 2);
    } else {
      // CSV format
      const headers = ['ID', 'Timestamp', 'Event Type', 'Severity', 'User', 'User ID', 'Action', 'Resource', 'Resource ID', 'IP Address', 'Details'];
      const rows = logs.map(log => [
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

      return [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');
    }
  }

  private initializeSampleData(): void {
    const sampleLogs: Omit<AuditLog, 'id' | 'timestamp' | 'ipAddress'>[] = [
      {
        eventType: 'case_created',
        severity: 'info',
        user: 'Sarah Johnson',
        userId: 'usr-001',
        action: 'Created case',
        resource: 'Case #2024-1847',
        resourceId: 'case-1847',
        details: 'New corporate litigation case created for client TechCo Industries',
        metadata: { caseType: 'Corporate Law', clientId: 'client-123' }
      },
      {
        eventType: 'document_accessed',
        severity: 'info',
        user: 'Michael Chen',
        userId: 'usr-002',
        action: 'Accessed document',
        resource: 'Contract_TechCo_2024.pdf',
        resourceId: 'doc-445',
        details: 'Downloaded confidential contract document',
        metadata: { caseId: 'case-1847', fileSize: '2.4 MB' }
      },
      {
        eventType: 'settings_updated',
        severity: 'warning',
        user: 'Sarah Johnson',
        userId: 'usr-001',
        action: 'Updated settings',
        resource: 'Security Settings',
        details: 'Modified two-factor authentication requirements',
        metadata: { setting: '2FA_required', previousValue: 'optional', newValue: 'required' }
      },
    ];

    // Add sample logs with timestamps going back
    sampleLogs.forEach((logData, index) => {
      const log: AuditLog = {
        ...logData,
        id: this.generateId(),
        timestamp: new Date(Date.now() - index * 600000).toISOString(), // 10 min intervals
        ipAddress: this.getClientIp(),
      };

      const logs = this.getLogs();
      logs.unshift(log);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(logs));
    });
  }
}

export const auditLogService = AuditLogService.getInstance();
