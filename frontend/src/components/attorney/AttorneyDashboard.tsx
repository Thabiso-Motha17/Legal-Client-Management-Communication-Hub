import { Card, CardContent, CardHeader, CardTitle } from '../ui/Cards';
import { Badge } from '../ui/Badges';
import { Button } from '../ui/Buttons';
import { 
  Briefcase, 
  FileText,
  User,
  Calendar,
  ChevronRight,
  Search,
  MessageSquare,
  Upload
} from 'lucide-react';

interface AssociateDashboardProps {
  onNavigate: (page: string) => void;
}

export function AssociateDashboard({ onNavigate }: AssociateDashboardProps) {
  const stats = {
    assignedCases: 5,
    recentDocuments: 8,
    clientCommunications: 23,
    upcomingDeadlines: 5
  };

  const assignedCases = [
    {
      id: 1,
      caseNumber: 'CAS-2026-001',
      title: 'Johnson Estate Planning',
      client: 'John Johnson',
      partner: 'Sarah Mitchell',
      status: 'Active',
      type: 'Estate Planning',
      clientSatisfaction: 92,
      lastActivity: '2 hours ago',
      documentCount: 8
    },
    {
      id: 2,
      caseNumber: 'CAS-2026-003',
      title: 'Corporate Merger - TechCo',
      client: 'TechCo Industries',
      partner: 'Sarah Mitchell',
      status: 'Active',
      type: 'Corporate M&A',
      clientSatisfaction: 88,
      lastActivity: 'Yesterday',
      documentCount: 12
    },
    {
      id: 3,
      caseNumber: 'CAS-2025-087',
      title: 'Smith Contract Review',
      client: 'Smith LLC',
      partner: 'Michael Chen',
      status: 'Active',
      type: 'Contract Law',
      clientSatisfaction: 95,
      lastActivity: '3 days ago',
      documentCount: 6
    }
  ];

  const recentDocuments = [
    {
      id: 1,
      name: 'Trust Agreement Draft v3',
      case: 'CAS-2026-001',
      type: 'Legal Document',
      modified: 'Today, 10:30 AM',
      size: '2.4 MB',
      modifiedBy: 'You'
    },
    {
      id: 2,
      name: 'Merger Analysis Report.pdf',
      case: 'CAS-2026-003',
      type: 'Analysis',
      modified: 'Yesterday, 4:15 PM',
      size: '3.1 MB',
      modifiedBy: 'Sarah Mitchell'
    },
    {
      id: 3,
      name: 'Client Meeting Notes - Jan 12',
      case: 'CAS-2026-001',
      type: 'Notes',
      modified: 'Jan 12, 2:30 PM',
      size: '0.8 MB',
      modifiedBy: 'You'
    },
    {
      id: 4,
      name: 'Contract Amendments Review',
      case: 'CAS-2025-087',
      type: 'Legal Document',
      modified: 'Jan 11, 11:20 AM',
      size: '1.9 MB',
      modifiedBy: 'You'
    }
  ];

  const recentCommunications = [
    { 
      id: 1, 
      client: 'John Johnson', 
      case: 'CAS-2026-001', 
      type: 'Email', 
      preview: 'Thanks for the draft, let me review and get back...', 
      time: '2 hours ago',
      unread: true
    },
    { 
      id: 2, 
      client: 'Sarah Mitchell', 
      case: 'CAS-2026-003', 
      type: 'Internal Message', 
      preview: 'Great work on the merger analysis. Let\'s schedule...', 
      time: '4 hours ago',
      unread: false
    },
    { 
      id: 3, 
      client: 'TechCo Industries', 
      case: 'CAS-2026-003', 
      type: 'Email', 
      preview: 'Looking forward to our meeting next week to discuss...', 
      time: 'Yesterday',
      unread: false
    }
  ];

  const upcomingDeadlines = [
    { 
      case: 'CAS-2026-001', 
      event: 'Trust finalization meeting', 
      date: 'Jan 25, 2026', 
      daysLeft: 12,
      client: 'John Johnson',
      status: 'preparation'
    },
    { 
      case: 'CAS-2026-003', 
      event: 'Merger document filing', 
      date: 'Feb 1, 2026', 
      daysLeft: 19,
      client: 'TechCo Industries',
      status: 'review'
    },
    { 
      case: 'CAS-2025-087', 
      event: 'Contract submission deadline', 
      date: 'Jan 30, 2026', 
      daysLeft: 17,
      client: 'Smith LLC',
      status: 'pending'
    }
  ];

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'Active': return 'success';
      case 'Pending': return 'warning';
      case 'Closed': return 'secondary';
      default: return 'default';
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-foreground mb-2">Welcome back, Alex</h1>
          <p className="text-muted-foreground">Your case overview and recent activities</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-2"
            onClick={() => onNavigate('documents')}
          >
            <Upload className="w-4 h-4" />
            Upload Document
          </Button>
          <Button 
            variant="primary" 
            size="sm" 
            className="gap-2"
            onClick={() => onNavigate('cases')}
          >
            View All Cases
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-primary" />
              </div>
              <Badge variant="default" className="text-xs">+2 this month</Badge>
            </div>
            <h3 className="text-2xl font-semibold text-foreground mb-1">{stats.assignedCases}</h3>
            <p className="text-sm text-muted-foreground">Active Cases</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
                <FileText className="w-6 h-6 text-accent" />
              </div>
              <Badge variant="default" className="text-xs">+5 today</Badge>
            </div>
            <h3 className="text-2xl font-semibold text-foreground mb-1">{stats.recentDocuments}</h3>
            <p className="text-sm text-muted-foreground">Recent Documents</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-success" />
              </div>
              <Badge variant="default" className="text-xs">3 unread</Badge>
            </div>
            <h3 className="text-2xl font-semibold text-foreground mb-1">{stats.clientCommunications}</h3>
            <p className="text-sm text-muted-foreground">Client Communications</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-warning/5 to-transparent border-warning/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-lg bg-warning/10 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-warning" />
              </div>
            </div>
            <h3 className="text-2xl font-semibold text-foreground mb-1">{stats.upcomingDeadlines}</h3>
            <p className="text-sm text-muted-foreground">Upcoming Deadlines</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Assigned Cases */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                My Active Cases
                <Button variant="ghost" size="sm" onClick={() => onNavigate('cases')}>
                  View All
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {assignedCases.map((caseItem) => (
                  <div 
                    key={caseItem.id} 
                    className="px-6 py-4 hover:bg-muted/30 transition-colors cursor-pointer group"
                    onClick={() => onNavigate('cases')}
                  >
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                            {caseItem.title}
                          </h3>
                          <Badge variant={getStatusVariant(caseItem.status)} className="text-xs">
                            {caseItem.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                          <span>{caseItem.caseNumber}</span>
                          <span>•</span>
                          <span>{caseItem.client}</span>
                          <span>•</span>
                          <span className="text-accent">{caseItem.type}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <div className="text-sm font-medium text-foreground">
                          {caseItem.clientSatisfaction}%
                        </div>
                        <div className="text-xs text-muted-foreground">Satisfaction</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div className="flex items-center gap-2">
                        <User className="w-3 h-3 text-muted-foreground" />
                        <span className="text-muted-foreground">Partner: {caseItem.partner}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FileText className="w-3 h-3 text-muted-foreground" />
                        <span className="text-muted-foreground">{caseItem.documentCount} documents</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3 h-3 text-muted-foreground" />
                        <span className="text-muted-foreground">Updated {caseItem.lastActivity}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-success"></div>
                        <span className="text-muted-foreground">Active</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Documents */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Recent Documents
                <Button variant="ghost" size="sm" onClick={() => onNavigate('documents')}>
                  View All
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {recentDocuments.map((doc) => (
                  <div 
                    key={doc.id} 
                    className="px-6 py-4 hover:bg-muted/30 transition-colors cursor-pointer group"
                    onClick={() => onNavigate('documents')}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 group-hover:bg-primary/10 transition-colors">
                          <FileText className="w-5 h-5 text-muted-foreground group-hover:text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-foreground mb-1 truncate">
                            {doc.name}
                          </h3>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span>{doc.case}</span>
                            <span>•</span>
                            <span>{doc.type}</span>
                            <span>•</span>
                            <span>{doc.modified}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <div className="text-xs text-muted-foreground">{doc.size}</div>
                        <div className="text-xs text-accent">{doc.modifiedBy}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

       
        <div className="space-y-6">
          <Card>
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search cases, documents, or clients..."
                  className="w-full pl-10 pr-4 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                />
              </div>
            </CardContent>
          </Card>

          {/* Recent Communications */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent Communications</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {recentCommunications.map((comm) => (
                  <div 
                    key={comm.id} 
                    className="px-6 py-4 hover:bg-muted/30 transition-colors cursor-pointer group"
                    onClick={() => onNavigate('communications')}
                  >
                    <div className="flex items-start gap-3">
                      {comm.unread && (
                        <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0"></div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-medium text-foreground">
                            {comm.client}
                          </h3>
                          <Badge variant="default" className="text-xs">
                            {comm.type}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2 truncate">
                          {comm.preview}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-accent">{comm.case}</span>
                          <span className="text-xs text-muted-foreground">{comm.time}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-6 py-3 border-t border-border">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full justify-center text-primary hover:text-primary/90"
                  onClick={() => onNavigate('messages')}
                >
                  View All Messages
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Deadlines */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Upcoming Deadlines</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {upcomingDeadlines.map((deadline, index) => (
                  <div key={index} className="px-6 py-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground mb-1">{deadline.event}</p>
                        <p className="text-xs text-muted-foreground">{deadline.case}</p>
                      </div>
                      <Badge variant={deadline.daysLeft <= 7 ? 'error' : 'warning'} className="text-xs">
                        {deadline.daysLeft}d
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{deadline.client}</span>
                      <span>{deadline.date}</span>
                    </div>
                    <div className="mt-2">
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all ${
                            deadline.status === 'preparation' ? 'bg-warning' :
                            deadline.status === 'review' ? 'bg-accent' : 'bg-primary'
                          }`}
                          style={{ width: `${Math.max(100 - (deadline.daysLeft * 3), 30)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Links */}
          <Card className="bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
            <CardHeader>
              <CardTitle className="text-base">Quick Links</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                variant="outline" 
                className="w-full justify-start gap-2" 
                onClick={() => onNavigate('documents')}
              >
                <FileText className="w-4 h-4" />
                Document Library
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start gap-2" 
                onClick={() => onNavigate('cases')}
              >
                <Briefcase className="w-4 h-4" />
                Case Management
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start gap-2" 
                onClick={() => onNavigate('messages')}
              >
                <MessageSquare className="w-4 h-4" />
                Client Communications
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}