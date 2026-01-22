import { useState, useEffect } from 'react';
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
import { dashboardService, authService, caseService } from '../services/api';
import type{ Case, Document, User as UserType } from '../../types/Types';

interface AssociateDashboardProps {
  onNavigate: (page: string) => void;
}

interface DashboardStats {
  assignedCases: number;
  recentDocuments: number;
  clientCommunications: number;
  upcomingDeadlines: number;
}


interface DeadlineItem {
  case: string;
  caseTitle: string;
  event: string;
  date: string;
  daysLeft: number;
  client: string;
  status: 'preparation' | 'review' | 'pending';
}

export function AssociateDashboard({ onNavigate }: AssociateDashboardProps) {
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    assignedCases: 0,
    recentDocuments: 0,
    clientCommunications: 0,
    upcomingDeadlines: 0
  });
  const [assignedCases, setAssignedCases] = useState<Case[]>([]);
  const [recentDocuments, setRecentDocuments] = useState<Document[]>([]);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState<DeadlineItem[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Get current user
      const meData = await authService.getMe();
      if (meData?.user) {
        setCurrentUser(meData.user);
        
        // Get dashboard data if user has a law firm
        if (meData.user.law_firm_id) {
          await Promise.all([
            fetchStats(meData.user.law_firm_id),
            fetchAssignedCases(meData.user.id),
            fetchRecentDocuments(),
            fetchUpcomingDeadlines()
          ]);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async (lawFirmId: number) => {
    try {
      const statsData = await dashboardService.getStats(lawFirmId);
      setStats({
        assignedCases: statsData.active_cases || 0,
        recentDocuments: 0, // This would need a separate endpoint
        clientCommunications: 0, // This would need a separate endpoint
        upcomingDeadlines: 5 // Default value, would need calculation
      });
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const fetchAssignedCases = async (userId: number) => {
    try {
      const casesData = await caseService.getAll();
      // Filter cases assigned to current user and active
      const myCases = casesData.filter(c => 
        c.assigned_to_user_id === userId && c.status === 'Active'
      );
      setAssignedCases(myCases.slice(0, 3));
      setStats(prev => ({ ...prev, assignedCases: myCases.length }));
    } catch (err) {
      console.error('Error fetching assigned cases:', err);
    }
  };

  const fetchRecentDocuments = async () => {
    try {
      const documents = await dashboardService.getRecentDocuments(4);
      setRecentDocuments(documents);
      setStats(prev => ({ ...prev, recentDocuments: documents.length }));
    } catch (err) {
      console.error('Error fetching recent documents:', err);
    }
  };

  const fetchUpcomingDeadlines = async () => {
    try {
      const upcomingCases = await dashboardService.getUpcomingDeadlines(3);
      
      const deadlines: DeadlineItem[] = upcomingCases.map((c: any) => {
        const deadlineDate = new Date(c.deadline!);
        const today = new Date();
        const daysLeft = Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
        
        return {
          case: c.case_number,
          caseTitle: c.title,
          event: `Deadline: ${c.case_type}`,
          date: formatDate(c.deadline!),
          daysLeft,
          client: c.client_name || 'Client',
          status: daysLeft <= 7 ? 'preparation' : daysLeft <= 14 ? 'review' : 'pending'
        };
      });
      
      setUpcomingDeadlines(deadlines);
      setStats(prev => ({ ...prev, upcomingDeadlines: deadlines.length }));
    } catch (err) {
      console.error('Error fetching upcoming deadlines:', err);
    }
  };

  const timeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    let interval = Math.floor(seconds / 31536000);
    if (interval > 1) return interval + ' years ago';
    
    interval = Math.floor(seconds / 2592000);
    if (interval > 1) return interval + ' months ago';
    
    interval = Math.floor(seconds / 86400);
    if (interval > 1) return interval + ' days ago';
    
    interval = Math.floor(seconds / 3600);
    if (interval > 1) return interval + ' hours ago';
    
    interval = Math.floor(seconds / 60);
    if (interval > 1) return interval + ' minutes ago';
    
    return Math.floor(seconds) + ' seconds ago';
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'Active': return 'success';
      case 'On Hold': return 'warning';
      case 'Closed': return 'secondary';
      default: return 'default';
    }
  };
  if (loading) {
    return (
      <div className="p-6 md:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-muted rounded animate-pulse"></div>
            <div className="h-4 w-64 bg-muted rounded animate-pulse"></div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 md:p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error: {error}</p>
          <Button 
            variant="outline" 
            className="mt-2"
            onClick={fetchDashboardData}
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-foreground mb-2">Welcome back, {currentUser?.full_name?.split(' ')[0] || 'Associate'}</h1>
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
              <Badge variant="default" className="text-xs">
                +{Math.floor(Math.random() * 5)} this month
              </Badge>
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
              <Badge variant="default" className="text-xs">
                +{Math.floor(Math.random() * 3)} today
              </Badge>
            </div>
            <h3 className="text-2xl font-semibold text-foreground mb-1">{stats.recentDocuments}</h3>
            <p className="text-sm text-muted-foreground">Recent Documents</p>
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
                {assignedCases.map((caseItem) => {
                  const lastActivity = caseItem.updated_at ? timeAgo(caseItem.updated_at) : 'Recently';
                  
                  return (
                    <div 
                      key={caseItem.id} 
                      className="px-6 py-4 hover:bg-muted/30 transition-colors cursor-pointer group"
                      onClick={() => onNavigate(`cases/${caseItem.id}`)}
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
                            <span>{caseItem.case_number}</span>
                            <span>•</span>
                            <span>{caseItem.client_name || 'Client'}</span>
                            <span>•</span>
                            <span className="text-accent">{caseItem.case_type}</span>
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div className="flex items-center gap-2">
                          <User className="w-3 h-3 text-muted-foreground" />
                          <span className="text-muted-foreground">Assigned: {caseItem.assigned_to_name || 'You'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <FileText className="w-3 h-3 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            {caseItem.documents?.length } documents
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3 h-3 text-muted-foreground" />
                          <span className="text-muted-foreground">Updated {lastActivity}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            caseItem.status === 'Active' ? 'bg-success' : 
                            caseItem.status === 'On Hold' ? 'bg-warning' : 'bg-muted'
                          }`}></div>
                          <span className="text-muted-foreground">{caseItem.status}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {assignedCases.length === 0 && (
                  <div className="px-6 py-8 text-center">
                    <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">No active cases assigned</p>
                  </div>
                )}
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
                    onClick={() => onNavigate(`documents/${doc.id}`)}
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
                            <span>{doc.case_title || 'No case'}</span>
                            <span>•</span>
                            <span>{doc.document_type}</span>
                            <span>•</span>
                            <span>{timeAgo(doc.uploaded_at)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <div className="text-xs text-muted-foreground">
                          {(doc.file_size / 1024 / 1024).toFixed(2)} MB
                        </div>
                        <div className="text-xs text-accent">{doc.uploaded_by_name || 'Unknown'}</div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {recentDocuments.length === 0 && (
                  <div className="px-6 py-8 text-center">
                    <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">No recent documents</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar */}
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
                        <p className="text-sm font-medium text-foreground mb-1 truncate">
                          {deadline.event}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {deadline.case} - {deadline.caseTitle}
                        </p>
                      </div>
                      <Badge variant={deadline.daysLeft <= 7 ? 'error' : 'warning'} className="text-xs">
                        {deadline.daysLeft}d
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="truncate" title={deadline.client}>
                        {deadline.client}
                      </span>
                      <span>{deadline.date}</span>
                    </div>
                    <div className="mt-2">
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all ${
                            deadline.status === 'preparation' ? 'bg-warning' :
                            deadline.status === 'review' ? 'bg-accent' : 'bg-primary'
                          }`}
                          style={{ 
                            width: `${Math.min(Math.max(100 - (deadline.daysLeft * 3), 10), 100)}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {upcomingDeadlines.length === 0 && (
                  <div className="px-6 py-4 text-center">
                    <Calendar className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">No upcoming deadlines</p>
                  </div>
                )}
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
                onClick={() => onNavigate('notes')}
              >
                <MessageSquare className="w-4 h-4" />
                Notes & Communications
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}