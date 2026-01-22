import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Cards';
import { Badge } from '../ui/Badges';
import { Button } from '../ui/Buttons';
import { 
  User, 
  Calendar, 
  FileText, 
  CheckCircle, 
  Clock,
  MapPin,
  Phone,
  Mail,
  Briefcase,
  Search,
  Filter,
  ArrowLeft,
  ChevronRight,
  Folder,
  Users,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { clientCaseService, authService } from '../services/api';
import type{ Case, User as UserType } from '../../types/Types';

interface TimelineEvent {
  id: number;
  date: string;
  title: string;
  description: string;
  type: 'milestone' | 'document' | 'meeting' | 'note';
}

interface ClientCase extends Omit<Case, 'client_name' | 'assigned_to_name'> {
  client_name?: string;
  assigned_to_name?: string;
  progress?: number;
  timeline?: TimelineEvent[];
}

export function ClientCases() {
  const [selectedCaseId, setSelectedCaseId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [cases, setCases] = useState<ClientCase[]>([]);
  const [selectedCase, setSelectedCase] = useState<ClientCase | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);

  // Fetch data on component mount
  useEffect(() => {
    fetchData();
  }, []);

  // Fetch data when selecting a case
  useEffect(() => {
    if (selectedCaseId) {
      fetchCaseDetails(selectedCaseId);
    }
  }, [selectedCaseId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Get current user
      const meData = await authService.getMe();
      if (meData?.user) {
        setCurrentUser(meData.user);
      }

      // Get client's cases
      const casesData = await clientCaseService.getMyCases();
      
      // Transform and add progress calculation
      const transformedCases = casesData.map(caseItem => ({
        ...caseItem,
        progress: calculateCaseProgress(caseItem),
        timeline: generateTimeline(caseItem)
      }));
      
      setCases(transformedCases);
    } catch (err: any) {
      setError(err.message || 'Failed to load cases');
      console.error('Error fetching cases:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCaseDetails = async (caseId: number) => {
    try {
      setLoading(true);
      const caseData = await clientCaseService.getCaseById(caseId);
      if (caseData) {
        const caseWithProgress: ClientCase = {
          ...caseData,
          progress: calculateCaseProgress(caseData),
          timeline: generateTimeline(caseData)
        };
        setSelectedCase(caseWithProgress);
      }
    } catch (err: any) {
      setError('Failed to load case details');
      console.error('Error fetching case details:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateCaseProgress = (caseItem: Case): number => {
    // Calculate progress based on case status and duration
    const statusWeights = {
      'Active': 60,
      'On Hold': 30,
      'Closed': 100
    };
    
    const baseProgress = statusWeights[caseItem.status] || 50;
    
    // Adjust based on time since opened
    if (caseItem.date_opened) {
      const openedDate = new Date(caseItem.date_opened);
      const now = new Date();
      const daysSinceOpened = Math.floor((now.getTime() - openedDate.getTime()) / (1000 * 3600 * 24));
      
      if (daysSinceOpened > 365) return Math.min(baseProgress + 20, 95);
      if (daysSinceOpened > 180) return Math.min(baseProgress + 10, 90);
    }
    
    return baseProgress;
  };

  const generateTimeline = (caseItem: Case): TimelineEvent[] => {
    const timeline: TimelineEvent[] = [];
    
    // Case opened event
    if (caseItem.date_opened) {
      timeline.push({
        id: 1,
        date: caseItem.date_opened,
        title: 'Case Opened',
        description: `Case ${caseItem.case_number} was opened`,
        type: 'milestone'
      });
    }
    
    // Last update event
    if (caseItem.updated_at && caseItem.updated_at !== caseItem.created_at) {
      timeline.push({
        id: 2,
        date: caseItem.updated_at,
        title: 'Case Updated',
        description: 'Case information was updated',
        type: 'milestone'
      });
    }
    
    // Notes (you could fetch real notes here)
    timeline.push({
      id: 3,
      date: new Date().toISOString().split('T')[0],
      title: 'Initial Consultation',
      description: 'Initial consultation with attorney completed',
      type: 'meeting'
    });
    
    // Sort by date descending
    return timeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const filteredCases = cases.filter(caseItem => {
    const matchesSearch = 
      caseItem.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      caseItem.case_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (caseItem.file_number?.toLowerCase() || '').includes(searchQuery.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || caseItem.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'Active': return 'success';
      case 'Closed': return 'secondary';
      case 'On Hold': return 'warning';
      default: return 'default';
    }
  };

  const getPriorityVariant = (priority: string) => {
    switch (priority) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const getCaseTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'estate planning':
      case 'wills & trusts':
        return <FileText className="w-5 h-5 text-primary" />;
      case 'real estate':
      case 'property':
        return <MapPin className="w-5 h-5 text-success" />;
      case 'business':
      case 'corporate':
      case 'contract':
        return <Briefcase className="w-5 h-5 text-warning" />;
      case 'employment':
      case 'labor':
        return <Users className="w-5 h-5 text-destructive" />;
      default:
        return <Folder className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const timeAgo = (dateString: string) => {
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
    
    return 'just now';
  };

  // Case details component
  const CaseDetails = ({ caseData, onBack }: { caseData: ClientCase; onBack: () => void }) => {
    const [milestones, setMilestones] = useState([
      { title: 'Case Initiated', completed: true },
      { title: 'Document Collection', completed: caseData.progress ? caseData.progress > 20 : false },
      { title: 'Initial Review', completed: caseData.progress ? caseData.progress > 40 : false },
      { title: 'Active Processing', completed: caseData.progress ? caseData.progress > 60 : false },
      { title: 'Final Review', completed: caseData.progress ? caseData.progress > 80 : false },
      { title: 'Case Closure', completed: caseData.status === 'Closed' }
    ]);

    const caseDetails = {
      ...caseData,
      attorney: {
        name: caseData.assigned_to_name || 'Assigned Attorney',
        title: 'Attorney',
        phone: '(555) 987-6543',
        email: 'attorney@lawfirm.com'
      },
      nextEvent: {
        title: caseData.deadline ? 'Upcoming Deadline' : 'Next Review',
        date: caseData.deadline ? formatDate(caseData.deadline) : 'TBD',
        time: caseData.deadline ? '9:00 AM' : 'TBD',
        location: 'Law Firm Office'
      }
    };

    return (
      <div className="p-6 md:p-8 space-y-6">
        {/* Header with back button */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Cases
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-foreground">{caseDetails.title}</h1>
              <Badge variant={getStatusVariant(caseDetails.status)}>
                {caseDetails.status}
              </Badge>
              <Badge variant={getPriorityVariant(caseDetails.priority)}>
                {caseDetails.priority.charAt(0).toUpperCase() + caseDetails.priority.slice(1)} Priority
              </Badge>
            </div>
            <p className="text-muted-foreground">Case #{caseDetails.case_number}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Case Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Case Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Description</p>
                    <p className="text-foreground">{caseDetails.description || 'No description available'}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Case Type</p>
                      <p className="text-foreground font-medium">{caseDetails.case_type}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Status</p>
                      <Badge variant={getStatusVariant(caseDetails.status)}>
                        {caseDetails.status}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Filing Date</p>
                      <p className="text-foreground font-medium">
                        {caseDetails.date_opened ? formatDate(caseDetails.date_opened) : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Last Update</p>
                      <p className="text-foreground font-medium">
                        {caseDetails.updated_at ? timeAgo(caseDetails.updated_at) : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Progress Milestones */}
            <Card>
              <CardHeader>
                <CardTitle>Case Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">
                      {caseDetails.progress || 0}% Complete
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {milestones.filter(m => m.completed).length}/{milestones.length} milestones
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-500"
                      style={{ width: `${caseDetails.progress || 0}%` }}
                    ></div>
                  </div>
                  <div className="space-y-3">
                    {milestones.map((milestone, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          milestone.completed 
                            ? 'bg-success/10 text-success' 
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          {milestone.completed ? (
                            <CheckCircle className="w-5 h-5" />
                          ) : (
                            <Clock className="w-5 h-5" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className={`text-sm font-medium ${
                            milestone.completed ? 'text-foreground' : 'text-muted-foreground'
                          }`}>
                            {milestone.title}
                          </p>
                        </div>
                        {!milestone.completed && index === milestones.findIndex(m => !m.completed) && (
                          <Badge variant="secondary">Current</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Case Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {caseDetails.timeline && caseDetails.timeline.length > 0 ? (
                    caseDetails.timeline.map((event, index) => (
                      <div key={event.id} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            event.type === 'milestone' ? 'bg-primary/10 text-primary' :
                            event.type === 'document' ? 'bg-accent/10 text-accent' :
                            event.type === 'meeting' ? 'bg-success/10 text-success' :
                            'bg-muted text-muted-foreground'
                          }`}>
                            {event.type === 'document' ? (
                              <FileText className="w-5 h-5" />
                            ) : event.type === 'meeting' ? (
                              <User className="w-5 h-5" />
                            ) : (
                              <CheckCircle className="w-5 h-5" />
                            )}
                          </div>
                          {index < caseDetails.timeline!.length - 1 && (
                            <div className="w-0.5 h-full min-h-[40px] bg-border mt-2"></div>
                          )}
                        </div>
                        <div className="flex-1 pb-6">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-medium text-foreground">{event.title}</p>
                            <Badge variant="secondary" className="text-xs">
                              {formatDate(event.date)}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{event.description}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-muted-foreground">No timeline events yet</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Attorney Info */}
            <Card>
              <CardHeader>
                <CardTitle>Your Attorney</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center mb-4">
                  <div className="w-20 h-20 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-3 text-xl font-medium">
                    {caseDetails.assigned_to_name?.split(' ').map(n => n[0]).join('') || 'AA'}
                  </div>
                  <h3 className="text-foreground font-medium mb-1">
                    {caseDetails.assigned_to_name || 'Assigned Attorney'}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">{caseDetails.attorney.title}</p>
                </div>
                
                <div className="space-y-3 pt-4 border-t border-border">
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <a href={`tel:${caseDetails.attorney.phone}`} className="text-sm text-foreground hover:text-accent transition-colors">
                      {caseDetails.attorney.phone}
                    </a>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <a href={`mailto:${caseDetails.attorney.email}`} className="text-sm text-foreground hover:text-accent transition-colors truncate">
                      {caseDetails.attorney.email}
                    </a>
                  </div>
                </div>

                <Button variant="primary" className="w-full mt-4 gap-2">
                  <Mail className="w-4 h-4" />
                  Send Message
                </Button>
              </CardContent>
            </Card>

            {/* Next Event */}
            <Card className="border-2 border-accent/20 bg-gradient-to-br from-accent/5 to-transparent">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-accent" />
                  Next Event
                </CardTitle>
              </CardHeader>
              <CardContent>
                <h3 className="text-foreground font-medium mb-3">{caseDetails.nextEvent.title}</h3>
                
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Calendar className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-foreground">{caseDetails.nextEvent.date}</p>
                      <p className="text-xs text-muted-foreground">{caseDetails.nextEvent.time}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-foreground">{caseDetails.nextEvent.location}</p>
                  </div>
                </div>

                <Button variant="outline" className="w-full mt-4">
                  Add to Calendar
                </Button>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full justify-start gap-2"
                  onClick={() => window.location.href = `/documents?case_id=${caseData.id}`}
                >
                  <FileText className="w-4 h-4" />
                  View Documents
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start gap-2"
                  onClick={() => window.location.href = `mailto:${caseDetails.attorney.email}`}
                >
                  <Mail className="w-4 h-4" />
                  Message Attorney
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  };

  // Loading state
  if (loading && !selectedCaseId) {
    return (
      <div className="p-6 md:p-8 space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
            <p className="text-muted-foreground">Loading your cases...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !selectedCaseId) {
    return (
      <div className="p-6 md:p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="w-6 h-6 text-red-500" />
            <h2 className="text-lg font-semibold text-red-800">Error Loading Cases</h2>
          </div>
          <p className="text-red-700 mb-4">{error}</p>
          <Button 
            variant="outline" 
            onClick={fetchData}
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // Cases list view
  if (!selectedCaseId) {
    return (
      <div className="p-6 md:p-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-foreground mb-2">My Cases</h1>
          <p className="text-muted-foreground">View and manage all your legal cases</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Folder className="w-5 h-5 text-primary" />
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-1">Total Cases</p>
              <p className="text-2xl font-semibold text-foreground">{cases.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-success" />
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-1">Active Cases</p>
              <p className="text-2xl font-semibold text-success">
                {cases.filter(c => c.status === 'Active').length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-warning" />
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-1">On Hold</p>
              <p className="text-2xl font-semibold text-warning">
                {cases.filter(c => c.status === 'On Hold').length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-secondary" />
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-1">Completed</p>
              <p className="text-2xl font-semibold text-secondary">
                {cases.filter(c => c.status === 'Closed').length}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search cases by title or case number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
                >
                  <option value="all">All Status</option>
                  <option value="Active">Active</option>
                  <option value="On Hold">On Hold</option>
                  <option value="Closed">Completed</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cases List */}
        <Card>
          <CardHeader>
            <CardTitle>
              All Cases
              <span className="text-sm font-normal text-muted-foreground ml-2">
                ({filteredCases.length} {filteredCases.length === 1 ? 'case' : 'cases'})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {filteredCases.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <Folder className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground mb-2">No cases found</p>
                {cases.length === 0 ? (
                  <p className="text-sm text-muted-foreground">You don't have any cases yet</p>
                ) : (
                  <p className="text-sm text-muted-foreground">Try adjusting your search or filter</p>
                )}
              </div>
            ) : (
              <div className="divide-y divide-border">
                {filteredCases.map((caseItem) => (
                  <div 
                    key={caseItem.id}
                    className="px-6 py-4 hover:bg-muted/30 transition-colors cursor-pointer group"
                    onClick={() => setSelectedCaseId(caseItem.id)}
                  >
                    <div className="flex items-center gap-4">
                      {/* Case Icon */}
                      <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                        {getCaseTypeIcon(caseItem.case_type)}
                      </div>

                      {/* Case Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="text-sm font-medium text-foreground">{caseItem.title}</h3>
                          <Badge variant={getStatusVariant(caseItem.status)} className="flex-shrink-0">
                            {caseItem.status}
                          </Badge>
                          <Badge variant={getPriorityVariant(caseItem.priority)} className="flex-shrink-0">
                            {caseItem.priority.charAt(0).toUpperCase() + caseItem.priority.slice(1)}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground truncate mb-2">
                          {caseItem.description || 'No description available'}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Filed: {caseItem.date_opened ? formatDate(caseItem.date_opened) : 'N/A'}
                          </span>
                          <span>Case #{caseItem.case_number}</span>
                          <span>{caseItem.case_type}</span>
                          <span>Attorney: {caseItem.assigned_to_name || 'Not assigned'}</span>
                        </div>
                      </div>

                      {/* Progress and Actions */}
                      <div className="text-right flex items-center gap-6">
                        <div className="hidden md:block">
                          <p className="text-xs text-muted-foreground mb-1">Progress</p>
                          <div className="w-32 bg-muted rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full"
                              style={{ width: `${caseItem.progress || 0}%` }}
                            ></div>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{caseItem.progress || 0}%</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-sm text-muted-foreground hidden md:inline">
                            {caseItem.deadline ? `Due: ${formatDate(caseItem.deadline)}` : 'No deadline'}
                          </span>
                          <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Case Types Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Array.from(new Set(cases.map(c => c.case_type))).map(type => {
                  const count = cases.filter(c => c.case_type === type).length;
                  const percentage = cases.length > 0 ? (count / cases.length * 100).toFixed(0) : '0';
                  return (
                    <div key={type} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getCaseTypeIcon(type)}
                        <span className="text-sm text-foreground">{type}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-24 bg-muted rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-foreground min-w-[40px]">
                          {count} ({percentage}%)
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-foreground font-medium mb-1">Need Help?</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Have questions about your cases or need to start a new one?
                  </p>
                  <div className="flex gap-3">
                    <Button variant="primary" size="sm" className="gap-2">
                      <Mail className="w-4 h-4" />
                      Contact Attorney
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Case details view
  if (!selectedCase) {
    return (
      <div className="p-6 md:p-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
          <p className="text-muted-foreground">Loading case details...</p>
        </div>
      </div>
    );
  }

  return <CaseDetails caseData={selectedCase} onBack={() => setSelectedCaseId(null)} />;
}