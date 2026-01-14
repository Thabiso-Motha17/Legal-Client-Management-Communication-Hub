import { useState } from 'react';
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
  AlertCircle
} from 'lucide-react';

export function ClientCases() {
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const cases = [
    {
      id: 'CAS-2026-001',
      title: 'Johnson Estate Planning',
      type: 'Estate Planning',
      status: 'Active',
      filingDate: 'Nov 15, 2025',
      lastUpdate: 'Jan 10, 2026',
      priority: 'High',
      attorney: 'Sarah Mitchell',
      nextEvent: 'Jan 25, 2026',
      progress: 75,
      description: 'Comprehensive estate planning including will, trust, and power of attorney preparation.'
    },
    {
      id: 'CAS-2025-045',
      title: 'Property Transfer - Downtown Condo',
      type: 'Real Estate',
      status: 'Active',
      filingDate: 'Sep 10, 2025',
      lastUpdate: 'Dec 20, 2025',
      priority: 'Medium',
      attorney: 'Michael Chen',
      nextEvent: 'Feb 15, 2026',
      progress: 40,
      description: 'Condominium title transfer and closing process.'
    },
    {
      id: 'CAS-2025-032',
      title: 'Business Contract Review',
      type: 'Business Law',
      status: 'On Hold',
      filingDate: 'Jul 22, 2025',
      lastUpdate: 'Oct 15, 2025',
      priority: 'Medium',
      attorney: 'Robert Johnson',
      nextEvent: 'Pending',
      progress: 60,
      description: 'Review of vendor contracts and service agreements.'
    },
    {
      id: 'CAS-2024-128',
      title: 'Will & Testament - Smith Family',
      type: 'Estate Planning',
      status: 'Completed',
      filingDate: 'Mar 5, 2024',
      lastUpdate: 'Jun 30, 2024',
      priority: 'Low',
      attorney: 'Sarah Mitchell',
      nextEvent: 'N/A',
      progress: 100,
      description: 'Last will and testament preparation and notarization.'
    },
    {
      id: 'CAS-2025-089',
      title: 'Employment Dispute Resolution',
      type: 'Employment Law',
      status: 'Active',
      filingDate: 'Oct 30, 2025',
      lastUpdate: 'Jan 5, 2026',
      priority: 'High',
      attorney: 'Jennifer Park',
      nextEvent: 'Jan 30, 2026',
      progress: 30,
      description: 'Workplace dispute mediation and resolution.'
    },
    {
      id: 'CAS-2024-095',
      title: 'Living Trust Setup',
      type: 'Estate Planning',
      status: 'Completed',
      filingDate: 'Feb 15, 2024',
      lastUpdate: 'May 10, 2024',
      priority: 'Low',
      attorney: 'Sarah Mitchell',
      nextEvent: 'N/A',
      progress: 100,
      description: 'Revocable living trust establishment and funding.'
    }
  ];

  const selectedCase = cases.find(c => c.id === selectedCaseId);

  const filteredCases = cases.filter(caseItem => {
    const matchesSearch = caseItem.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         caseItem.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || caseItem.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'Active': return 'success';
      case 'Completed': return 'secondary';
      case 'On Hold': return 'warning';
      default: return 'default';
    }
  };

  const getPriorityVariant = (priority: string) => {
    switch (priority) {
      case 'High': return 'error';
      case 'Medium': return 'warning';
      case 'Low': return 'success';
      default: return 'default';
    }
  };

  const getCaseTypeIcon = (type: string) => {
    switch (type) {
      case 'Estate Planning': return <FileText className="w-5 h-5 text-primary" />;
      case 'Real Estate': return <MapPin className="w-5 h-5 text-success" />;
      case 'Business Law': return <Briefcase className="w-5 h-5 text-warning" />;
      case 'Employment Law': return <Users className="w-5 h-5 text-destructive" />;
      default: return <Folder className="w-5 h-5 text-muted-foreground" />;
    }
  };

  // Case details component
  const CaseDetails = ({ caseData, onBack }: { caseData: any; onBack: () => void }) => {
    const timeline = [
      {
        id: 1,
        date: 'Jan 10, 2026',
        title: 'Trust Agreement Draft Submitted',
        description: 'Second revision of trust agreement prepared and uploaded for your review',
        status: 'completed',
        type: 'document'
      },
      {
        id: 2,
        date: 'Jan 8, 2026',
        title: 'Property Deed Transfer Filed',
        description: 'Property deed transfer documentation filed with county recorder',
        status: 'completed',
        type: 'filing'
      },
      {
        id: 3,
        date: 'Jan 5, 2026',
        title: 'Will Finalized',
        description: 'Last will and testament signed and notarized',
        status: 'completed',
        type: 'milestone'
      },
      {
        id: 4,
        date: 'Dec 20, 2025',
        title: 'Initial Consultation Completed',
        description: 'Estate planning goals and objectives discussed',
        status: 'completed',
        type: 'meeting'
      },
      {
        id: 5,
        date: 'Nov 15, 2025',
        title: 'Case Opened',
        description: 'Estate planning case initiated',
        status: 'completed',
        type: 'milestone'
      }
    ];

    const milestones = [
      { title: 'Case Initiated', completed: true },
      { title: 'Document Collection', completed: true },
      { title: 'Will Preparation', completed: true },
      { title: 'Trust Agreement', completed: false },
      { title: 'Final Review', completed: false },
      { title: 'Case Closure', completed: false }
    ];

    const caseDetails = {
      ...caseData,
      attorney: {
        name: 'Sarah Mitchell',
        title: 'Senior Partner',
        phone: '(555) 987-6543',
        email: 'sarah.mitchell@lawfirm.com'
      },
      nextEvent: {
        title: 'Final Review Meeting',
        date: 'Jan 25, 2026',
        time: '2:00 PM',
        location: '123 Legal Plaza, Suite 400'
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
            <div className="flex items-center gap-3">
              <h1 className="text-foreground">{caseDetails.title}</h1>
              <Badge variant={getStatusVariant(caseDetails.status)}>{caseDetails.status}</Badge>
              <Badge variant={getPriorityVariant(caseDetails.priority)}>{caseDetails.priority} Priority</Badge>
            </div>
            <p className="text-muted-foreground">Case #{caseDetails.id}</p>
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
                    <p className="text-foreground">{caseDetails.description}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Case Type</p>
                      <p className="text-foreground font-medium">{caseDetails.type}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Status</p>
                      <Badge variant={getStatusVariant(caseDetails.status)}>{caseDetails.status}</Badge>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Filing Date</p>
                      <p className="text-foreground font-medium">{caseDetails.filingDate}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Last Update</p>
                      <p className="text-foreground font-medium">{caseDetails.lastUpdate}</p>
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
                    <span className="text-sm font-medium text-foreground">{caseDetails.progress}% Complete</span>
                    <span className="text-xs text-muted-foreground">{milestones.filter(m => m.completed).length}/{milestones.length} milestones</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-500"
                      style={{ width: `${caseDetails.progress}%` }}
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
                  {timeline.map((event, index) => (
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
                        {index < timeline.length - 1 && (
                          <div className="w-0.5 h-full min-h-[40px] bg-border mt-2"></div>
                        )}
                      </div>
                      <div className="flex-1 pb-6">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium text-foreground">{event.title}</p>
                          <Badge variant="secondary" className="text-xs">{event.date}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{event.description}</p>
                      </div>
                    </div>
                  ))}
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
                    {caseDetails.attorney.name.split(' ').map((n: string) => n[0]).join('')}
                  </div>
                  <h3 className="text-foreground font-medium mb-1">{caseDetails.attorney.name}</h3>
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
                <Button variant="outline" className="w-full justify-start gap-2">
                  <FileText className="w-4 h-4" />
                  View Documents
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Mail className="w-4 h-4" />
                  Message Attorney
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Briefcase className="w-4 h-4" />
                  Upload Documents
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  };

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
                {cases.filter(c => c.status === 'Completed').length}
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
                  <option value="Completed">Completed</option>
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
                <p className="text-sm text-muted-foreground">Try adjusting your search or filter</p>
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
                        {getCaseTypeIcon(caseItem.type)}
                      </div>

                      {/* Case Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-medium text-foreground">{caseItem.title}</h3>
                          <Badge variant={getStatusVariant(caseItem.status)} className="flex-shrink-0">
                            {caseItem.status}
                          </Badge>
                          <Badge variant={getPriorityVariant(caseItem.priority)} className="flex-shrink-0">
                            {caseItem.priority}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground truncate mb-2">{caseItem.description}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Filed: {caseItem.filingDate}
                          </span>
                          <span>Case #{caseItem.id}</span>
                          <span>{caseItem.type}</span>
                          <span>Attorney: {caseItem.attorney}</span>
                        </div>
                      </div>

                      {/* Progress and Actions */}
                      <div className="text-right flex items-center gap-6">
                        <div className="hidden md:block">
                          <p className="text-xs text-muted-foreground mb-1">Progress</p>
                          <div className="w-32 bg-muted rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full"
                              style={{ width: `${caseItem.progress}%` }}
                            ></div>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{caseItem.progress}%</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-sm text-muted-foreground hidden md:inline">
                            Next: {caseItem.nextEvent}
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
                {Array.from(new Set(cases.map(c => c.type))).map(type => {
                  const count = cases.filter(c => c.type === type).length;
                  const percentage = (count / cases.length * 100).toFixed(0);
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
                        <span className="text-sm font-medium text-foreground min-w-[40px]">{count} ({percentage}%)</span>
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
                    <Button variant="outline" size="sm" className="gap-2">
                      <Briefcase className="w-4 h-4" />
                      New Case
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
  return <CaseDetails caseData={selectedCase} onBack={() => setSelectedCaseId(null)} />;
}