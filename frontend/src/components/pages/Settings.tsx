import { Card, CardContent, CardHeader, CardTitle } from '../ui/Cards';
import { Badge } from '../ui/Badges';
import { Button } from '../ui/Buttons';
import { User, Shield, Bell, Lock, Users, FileText, CreditCard, AlertCircle } from 'lucide-react';

const userRoles = [
  {
    id: '1',
    name: 'Sarah Mitchell',
    email: 'sarah.mitchell@lawfirm.com',
    role: 'Senior Partner',
    permissions: ['Full Access'],
    status: 'active',
    lastActive: '2 hours ago'
  },
  {
    id: '2',
    name: 'Michael Chen',
    email: 'michael.chen@lawfirm.com',
    role: 'Associate Attorney',
    permissions: ['Case Management', 'Document Access', 'Client Communication'],
    status: 'active',
    lastActive: '1 day ago'
  },
  {
    id: '3',
    name: 'Jennifer Lee',
    email: 'jennifer.lee@lawfirm.com',
    role: 'Paralegal',
    permissions: ['Document Access', 'Calendar Management', 'Limited Case Access'],
    status: 'active',
    lastActive: '3 hours ago'
  },
  {
    id: '4',
    name: 'David Park',
    email: 'david.park@lawfirm.com',
    role: 'Associate Attorney',
    permissions: ['Case Management', 'Document Access', 'Client Communication'],
    status: 'inactive',
    lastActive: '2 weeks ago'
  }
];

const auditLogs = [
  {
    id: '1',
    action: 'Case Created',
    user: 'Sarah Mitchell',
    details: 'Created case CAS-2026-001 - Henderson v. State Corp',
    timestamp: 'Jan 8, 2026 - 10:30 AM',
    category: 'case'
  },
  {
    id: '2',
    action: 'Document Uploaded',
    user: 'Michael Chen',
    details: 'Uploaded Discovery Request.pdf to CAS-2026-001',
    timestamp: 'Jan 8, 2026 - 9:15 AM',
    category: 'document'
  },
  {
    id: '3',
    action: 'User Login',
    user: 'Jennifer Lee',
    details: 'Successful login from IP 192.168.1.105',
    timestamp: 'Jan 8, 2026 - 8:00 AM',
    category: 'security'
  },
  {
    id: '4',
    action: 'Invoice Generated',
    user: 'Sarah Mitchell',
    details: 'Generated invoice INV-2026-002 for $3,200',
    timestamp: 'Jan 7, 2026 - 4:45 PM',
    category: 'billing'
  },
  {
    id: '5',
    action: 'Permission Changed',
    user: 'Sarah Mitchell',
    details: 'Updated permissions for David Park',
    timestamp: 'Jan 7, 2026 - 2:30 PM',
    category: 'security'
  }
];

export function Settings() {
  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-foreground mb-1">Settings</h1>
        <p className="text-muted-foreground text-sm">Manage system configuration and security settings</p>
      </div>

      {/* Quick Settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="hover:border-accent/50 transition-colors cursor-pointer">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-foreground">Profile Settings</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Update your personal information and preferences
            </p>
          </CardContent>
        </Card>

        <Card className="hover:border-accent/50 transition-colors cursor-pointer">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-accent" />
              </div>
              <h3 className="text-foreground">Security</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Configure two-factor authentication and password policies
            </p>
          </CardContent>
        </Card>

        <Card className="hover:border-accent/50 transition-colors cursor-pointer">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <Bell className="w-5 h-5 text-warning" />
              </div>
              <h3 className="text-foreground">Notifications</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Manage email and in-app notification preferences
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Role Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>User Roles & Permissions</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Manage team access and permissions</p>
            </div>
            <Button variant="outline" className="gap-2">
              <Users className="w-4 h-4" />
              Add User
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
                {userRoles.map((user) => (
                  <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                          {user.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{user.name}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant="secondary">{user.role}</Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {user.permissions.map((permission, idx) => (
                          <Badge key={idx} variant="default" className="text-xs">
                            {permission}
                          </Badge>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={user.status === 'active' ? 'success' : 'secondary'}>
                        {user.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                      {user.lastActive}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <Button variant="ghost" size="sm">
                        Edit
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Audit Logs</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Track system activity and user actions</p>
            </div>
            <Button variant="outline" className="gap-2">
              <FileText className="w-4 h-4" />
              Export Logs
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {auditLogs.map((log) => (
              <div key={log.id} className="px-6 py-4 hover:bg-muted/30 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                    {log.category === 'case' && <FileText className="w-4 h-4 text-muted-foreground" />}
                    {log.category === 'document' && <FileText className="w-4 h-4 text-muted-foreground" />}
                    {log.category === 'security' && <Lock className="w-4 h-4 text-accent" />}
                    {log.category === 'billing' && <CreditCard className="w-4 h-4 text-muted-foreground" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-1">
                      <p className="font-medium text-foreground text-sm">{log.action}</p>
                      <span className="text-xs text-muted-foreground flex-shrink-0">{log.timestamp}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">{log.details}</p>
                    <p className="text-xs text-muted-foreground">by {log.user}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Security Notice */}
      <Card className="border-warning/50 bg-warning/5">
        <CardContent className="p-6">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-warning flex-shrink-0" />
            <div>
              <h4 className="font-medium text-foreground mb-1">Security Best Practices</h4>
              <p className="text-sm text-muted-foreground">
                Ensure all team members use strong passwords and enable two-factor authentication. 
                Review user permissions regularly and audit system logs for unusual activity. 
                This system is designed for legal practice management only and should not be used 
                to store highly sensitive personal information or protected health data.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
