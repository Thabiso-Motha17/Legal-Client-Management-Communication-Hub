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
  Upload,
  Clock,
} from 'lucide-react';
import { dashboardService, authService, caseService, eventsService } from '../services/api';
import type { Case, Document, User as UserType } from '../../types/Types';

interface AssociateDashboardProps {
  onNavigate: (page: string) => void;
}

interface DashboardStats {
  assignedCases: number;
  recentDocuments: number;
  clientCommunications: number;
  upcomingDeadlines: number;
  upcomingEvents: number;
  activeEvents: number;
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

interface DashboardEvent {
  id: number;
  title: string;
  event_type: 'meeting' | 'deadline' | 'hearing' | 'court_date' | 'filing' | 'consultation' | 'other';
  start_time: string;
  end_time: string;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'postponed';
  priority: 'low' | 'medium' | 'high';
  location?: string;
  meeting_link?: string;
  case_id?: number;
  case_title?: string;
  case_number?: string;
  assigned_to_name?: string;
  client_invited: boolean;
  client_confirmed: boolean;
}

export function AssociateDashboard({ onNavigate }: AssociateDashboardProps) {
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    assignedCases: 0,
    recentDocuments: 0,
    clientCommunications: 0,
    upcomingDeadlines: 0,
    upcomingEvents: 0,
    activeEvents: 0
  });
  const [assignedCases, setAssignedCases] = useState<Case[]>([]);
  const [recentDocuments, setRecentDocuments] = useState<Document[]>([]);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState<DeadlineItem[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<DashboardEvent[]>([]);
  const [todaysEvents, setTodaysEvents] = useState<DashboardEvent[]>([]);

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
            fetchUpcomingDeadlines(),
            fetchUpcomingDashboardEvents(),
            fetchTodaysEvents()
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
      setStats(prev => ({
        ...prev,
        assignedCases: statsData.active_cases || 0,
      }));
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

  const fetchUpcomingDashboardEvents = async () => {
    try {
      const eventsData = await eventsService.getUpcomingEvents(5);
      setStats(prev => ({ ...prev, upcomingEvents: eventsData.length }));
      
      // Transform events for dashboard display
      const dashboardEvents: DashboardEvent[] = eventsData.map((event: any) => ({
        id: event.id,
        title: event.title,
        event_type: event.event_type,
        start_time: event.start_time,
        end_time: event.end_time,
        status: event.status,
        priority: event.priority,
        location: event.location,
        meeting_link: event.meeting_link,
        case_id: event.case_id,
        case_title: event.case_title,
        case_number: event.case_number,
        assigned_to_name: event.assigned_to_name,
        client_invited: event.client_invited,
        client_confirmed: event.client_confirmed
      }));
      
      setUpcomingEvents(dashboardEvents);
    } catch (err) {
      console.error('Error fetching upcoming events:', err);
    }
  };

  const fetchTodaysEvents = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const eventsData = await eventsService.getAll({
        start_date: today,
        end_date: today,
      });
      
      setStats(prev => ({ ...prev, activeEvents: eventsData.length }));
      
      const todaysEventsData: DashboardEvent[] = eventsData.map((event: any) => ({
        id: event.id,
        title: event.title,
        event_type: event.event_type,
        start_time: event.start_time,
        end_time: event.end_time,
        status: event.status,
        priority: event.priority,
        location: event.location,
        meeting_link: event.meeting_link,
        case_id: event.case_id,
        case_title: event.case_title,
        case_number: event.case_number,
        assigned_to_name: event.assigned_to_name,
        client_invited: event.client_invited,
        client_confirmed: event.client_confirmed
      }));
      
      setTodaysEvents(todaysEventsData);
    } catch (err) {
      console.error('Error fetching today\'s events:', err);
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

  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  /*const getEventTypeColor = (type: DashboardEvent['event_type']) => {
    switch (type) {
      case 'meeting':
        return 'bg-primary/10 text-primary border-primary/20';
      case 'hearing':
      case 'court_date':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'deadline':
      case 'filing':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'consultation':
        return 'bg-accent/10 text-accent border-accent/20';
      case 'other':
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };*/

  const getEventTypeBadge = (type: DashboardEvent['event_type']) => {
    switch (type) {
      case 'meeting':
        return 'Meeting';
      case 'hearing':
        return 'Hearing';
      case 'court_date':
        return 'Court Date';
      case 'deadline':
        return 'Deadline';
      case 'filing':
        return 'Filing';
      case 'consultation':
        return 'Consultation';
      case 'other':
        return 'Other';
    }
  };

 /* const getPriorityColor = (priority: DashboardEvent['priority']) => {
    switch (priority) {
      case 'high':
        return 'bg-destructive/10 text-destructive';
      case 'medium':
        return 'bg-warning/10 text-warning';
      case 'low':
        return 'bg-muted/10 text-muted-foreground';
    }
  };*/

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

        <Card className="bg-gradient-to-br from-success/5 to-transparent border-success/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center">
                <Clock className="w-6 h-6 text-success" />
              </div>
              <Badge variant="default" className="text-xs">
                {stats.activeEvents} today
              </Badge>
            </div>
            <h3 className="text-2xl font-semibold text-foreground mb-1">{stats.upcomingEvents}</h3>
            <p className="text-sm text-muted-foreground">Upcoming Events</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Left Side */}
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
          {/* Search Bar */}
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

          {/* Today's Events */}
          {todaysEvents.length > 0 && (
            <Card className="bg-gradient-to-br from-success/5 to-transparent border-success/20">
              <CardHeader>
                <CardTitle className="text-base">Today's Events</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {todaysEvents.map((event) => (
                    <div 
                      key={event.id} 
                      className="px-6 py-4 hover:bg-success/5 transition-colors cursor-pointer"
                      onClick={() => onNavigate(`events/${event.id}`)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground mb-1 truncate">
                            {event.title}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Badge variant="default" className="text-xs">
                              {getEventTypeBadge(event.event_type)}
                            </Badge>
                            {event.priority === 'high' && (
                              <Badge variant="warning" className="text-xs">High</Badge>
                            )}
                            {event.client_invited && (
                              <Badge variant="default" className="text-xs">Client</Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-medium text-success">
                            {formatTime(event.start_time)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="truncate" title={event.case_title}>
                          {event.case_number || 'No case'}
                        </span>
                        <span className={`px-2 py-1 rounded ${
                          event.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                          event.status === 'scheduled' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {event.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

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

          {/* Upcoming Events */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Upcoming Events</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {upcomingEvents.map((event) => {
                  const eventDate = new Date(event.start_time);
                  const today = new Date();
                  const daysDiff = Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
                  
                  return (
                    <div 
                      key={event.id} 
                      className="px-6 py-4 hover:bg-muted/30 transition-colors cursor-pointer group"
                      onClick={() => onNavigate(`events/${event.id}`)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground mb-1 truncate group-hover:text-primary">
                            {event.title}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Badge variant="default" className="text-xs">
                              {getEventTypeBadge(event.event_type)}
                            </Badge>
                            {event.priority === 'high' && (
                              <Badge variant="warning" className="text-xs">High Priority</Badge>
                            )}
                          </div>
                        </div>
                        <Badge variant={daysDiff <= 1 ? 'error' : daysDiff <= 3 ? 'warning' : 'default'} className="text-xs">
                          {daysDiff === 0 ? 'Today' : daysDiff === 1 ? 'Tomorrow' : `${daysDiff}d`}
                        </Badge>
                      </div>
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDate(event.start_time)}</span>
                          <Clock className="w-3 h-3 ml-2" />
                          <span>{formatTime(event.start_time)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground truncate" title={event.case_title}>
                            {event.case_number || 'No case'}
                          </span>
                          {event.assigned_to_name && (
                            <span className="text-accent">{event.assigned_to_name}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {upcomingEvents.length === 0 && (
                  <div className="px-6 py-4 text-center">
                    <Clock className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">No upcoming events</p>
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
                onClick={() => onNavigate('calendar')}
              >
                <Calendar className="w-4 h-4" />
                Calendar & Events
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