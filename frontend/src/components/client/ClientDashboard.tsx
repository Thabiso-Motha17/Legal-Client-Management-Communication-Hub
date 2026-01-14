import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Cards';
import { Badge } from '../ui/Badges';
import { Button } from '../ui/Buttons';
import { 
  FileText, 
  MessageSquare, 
  Calendar,
  Download,
  AlertCircle,
  Search,
  Filter,
  Plus,
  BarChart3,
  TrendingUp,
  Eye,
  ChevronRight,
  Folder
} from 'lucide-react';
import { FaMoneyBillAlt } from 'react-icons/fa';

interface ClientDashboardProps {
  onNavigate: (page: string) => void;
}

export function ClientDashboard({ onNavigate }: ClientDashboardProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const clientStats = {
    totalCases: 4,
    activeCases: 2,
    completedCases: 1,
    pendingTasks: 7,
    totalDocuments: 28,
    unreadMessages: 3,
    outstandingBalance: 2450,
    totalBilled: 12850
  };

  const cases = [
    {
      id: 'CAS-2026-001',
      title: 'Johnson Estate Planning',
      type: 'Estate Planning',
      status: 'Active',
      filingDate: 'Nov 15, 2025',
      lastUpdate: 'Jan 10, 2026',
      attorney: 'Sarah Mitchell',
      nextEvent: 'Jan 25, 2026',
      progress: 65,
      priority: 'High',
      description: 'Comprehensive estate planning including will, trust, and power of attorney preparation.',
      documents: 12,
      unreadMessages: 1
    },
    {
      id: 'CAS-2025-045',
      title: 'Property Transfer - Downtown Condo',
      type: 'Real Estate',
      status: 'Active',
      filingDate: 'Sep 10, 2025',
      lastUpdate: 'Dec 20, 2025',
      attorney: 'Michael Chen',
      nextEvent: 'Feb 15, 2026',
      progress: 40,
      priority: 'Medium',
      description: 'Condominium title transfer and closing process.',
      documents: 8,
      unreadMessages: 0
    },
    {
      id: 'CAS-2025-032',
      title: 'Business Contract Review',
      type: 'Business Law',
      status: 'On Hold',
      filingDate: 'Jul 22, 2025',
      lastUpdate: 'Oct 15, 2025',
      attorney: 'Robert Johnson',
      nextEvent: 'Pending',
      progress: 60,
      priority: 'Medium',
      description: 'Review of vendor contracts and service agreements.',
      documents: 6,
      unreadMessages: 2
    },
    {
      id: 'CAS-2024-128',
      title: 'Will & Testament - Smith Family',
      type: 'Estate Planning',
      status: 'Completed',
      filingDate: 'Mar 5, 2024',
      lastUpdate: 'Jun 30, 2024',
      attorney: 'Sarah Mitchell',
      nextEvent: 'N/A',
      progress: 100,
      priority: 'Low',
      description: 'Last will and testament preparation and notarization.',
      documents: 5,
      unreadMessages: 0
    }
  ];

  const recentDocuments = [
    { id: 1, name: 'Trust Agreement - Draft v2.pdf', date: 'Jan 10, 2026', size: '2.4 MB', caseId: 'CAS-2026-001' },
    { id: 2, name: 'Property Deed Transfer.pdf', date: 'Jan 8, 2026', size: '1.8 MB', caseId: 'CAS-2025-045' },
    { id: 3, name: 'Will - Final Version.pdf', date: 'Jan 5, 2026', size: '856 KB', caseId: 'CAS-2024-128' },
    { id: 4, name: 'Business Contract - Vendor A.pdf', date: 'Oct 10, 2025', size: '1.2 MB', caseId: 'CAS-2025-032' }
  ];

  const recentMessages = [
    { id: 1, from: 'Sarah Mitchell', subject: 'Trust agreement review needed', date: 'Jan 10, 2026', unread: true, caseId: 'CAS-2026-001' },
    { id: 2, from: 'Michael Chen', subject: 'Property transfer update', date: 'Jan 8, 2026', unread: false, caseId: 'CAS-2025-045' },
    { id: 3, from: 'Robert Johnson', subject: 'Contract review delayed', date: 'Jan 7, 2026', unread: false, caseId: 'CAS-2025-032' }
  ];

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


  const getCaseTypeIcon = (type: string) => {
    switch (type) {
      case 'Estate Planning': return <FileText className="w-5 h-5 text-primary" />;
      case 'Real Estate': return <Calendar className="w-5 h-5 text-success" />;
      case 'Business Law': return <Folder className="w-5 h-5 text-warning" />;
      default: return <FileText className="w-5 h-5 text-muted-foreground" />;
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-foreground mb-2">Welcome back, John</h1>
        <p className="text-muted-foreground">Overview of all your cases and recent activity</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => onNavigate('cases')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Folder className="w-5 h-5 text-primary" />
              </div>
              <TrendingUp className="w-4 h-4 text-success" />
            </div>
            <p className="text-sm text-muted-foreground mb-1">Total Cases</p>
            <p className="text-2xl font-semibold text-foreground">{clientStats.totalCases}</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:border-success/50 transition-colors" onClick={() => onNavigate('documents')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-success" />
              </div>
              <AlertCircle className="w-4 h-4 text-warning" />
            </div>
            <p className="text-sm text-muted-foreground mb-1">Pending Review</p>
            <p className="text-2xl font-semibold text-foreground">{clientStats.pendingTasks}</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:border-accent/50 transition-colors" onClick={() => onNavigate('messages')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-accent" />
              </div>
              <Badge variant="error">{clientStats.unreadMessages} New</Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-1">Unread Messages</p>
            <p className="text-2xl font-semibold text-foreground">{clientStats.unreadMessages}</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:border-warning/50 transition-colors" onClick={() => onNavigate('billing')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <FaMoneyBillAlt className="w-5 h-5 text-warning" />
              </div>
              <BarChart3 className="w-4 h-4 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground mb-1">Outstanding Balance</p>
            <p className="text-2xl font-semibold text-foreground">R{clientStats.outstandingBalance.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
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
                className="w-full pl-10 pr-4 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-shadow"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-shadow"
              >
                <option value="all">All Status</option>
                <option value="Active">Active</option>
                <option value="On Hold">On Hold</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
            <Button variant="primary" onClick={() => onNavigate('cases')} className="gap-2">
              <Eye className="w-4 h-4" />
              View All Cases
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Cases Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Folder className="w-5 h-5 text-primary" />
              Your Cases ({filteredCases.length})
            </div>
            <Button variant="ghost" size="sm" onClick={() => onNavigate('cases')}>
              View All <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
              {filteredCases.map((caseItem) => (
                <div 
                  key={caseItem.id}
                  className="border border-border rounded-lg p-4 hover:border-primary/50 hover:shadow-md transition-all cursor-pointer group"
                  onClick={() => onNavigate(`case-${caseItem.id}`)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {getCaseTypeIcon(caseItem.type)}
                      <div>
                        <h3 className="text-sm font-medium text-foreground">{caseItem.title}</h3>
                        <p className="text-xs text-muted-foreground">Case #{caseItem.id}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Badge variant={getStatusVariant(caseItem.status)} className="text-xs">
                        {caseItem.status}
                      </Badge>
                      {caseItem.priority === 'High' && (
                        <AlertCircle className="w-4 h-4 text-destructive" />
                      )}
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{caseItem.description}</p>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Attorney</p>
                      <p className="text-sm font-medium text-foreground">{caseItem.attorney}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Next Event</p>
                      <p className="text-sm font-medium text-foreground">{caseItem.nextEvent}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Progress</span>
                      <span>{caseItem.progress}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all duration-500" 
                        style={{ width: `${caseItem.progress}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        {caseItem.documents} docs
                      </span>
                      {caseItem.unreadMessages > 0 && (
                        <span className="flex items-center gap-1 text-accent">
                          <MessageSquare className="w-3 h-3" />
                          {caseItem.unreadMessages} new
                        </span>
                      )}
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid w-full grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Documents */}
        <Card className='w-257'>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Recent Documents
              </div>
              <Button variant="ghost" size="sm" onClick={() => onNavigate('documents')}>
                View All
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {recentDocuments.map((doc) => (
                <div key={doc.id} className="px-6 py-4 hover:bg-muted/30 transition-colors flex items-center justify-between group">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{doc.name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{doc.date}</span>
                        <span>•</span>
                        <span>{doc.size}</span>
                        <span>•</span>
                        <span className="text-primary">Case #{doc.caseId}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Messages */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-accent" />
              Recent Messages
            </div>
            <Button variant="ghost" size="sm" onClick={() => onNavigate('messages')}>
              View All
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {recentMessages.map((message) => (
              <div 
                key={message.id} 
                className="px-6 py-4 hover:bg-muted/30 transition-colors cursor-pointer group"
                onClick={() => onNavigate('messages')}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      message.unread ? 'bg-accent/10 text-accent' : 'bg-muted text-muted-foreground'
                    }`}>
                      {message.from.split(' ').map((n: string) => n[0]).join('')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium text-foreground">{message.from}</p>
                        {message.unread && (
                          <Badge variant="error" className="text-xs">New</Badge>
                        )}
                      </div>
                      <p className="text-sm text-foreground truncate mb-1">{message.subject}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{message.date}</span>
                        <span>•</span>
                        <span className="text-primary">Case #{message.caseId}</span>
                      </div>
                    </div>
                  </div>
                  <MessageSquare className="w-5 h-5 text-muted-foreground group-hover:text-accent transition-colors" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-foreground font-medium mb-2">Quick Actions</h3>
              <p className="text-sm text-muted-foreground">
                Need assistance? Here are some quick actions you can take.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="primary" onClick={() => onNavigate('messages')} className="gap-2">
                <MessageSquare className="w-4 h-4" />
                Message Attorney
              </Button>
              <Button variant="outline" onClick={() => onNavigate('documents')} className="gap-2">
                <Plus className="w-4 h-4" />
                Upload Document
              </Button>
              <Button variant="outline" onClick={() => onNavigate('billing')} className="gap-2">
                <FaMoneyBillAlt className="w-4 h-4" />
                Make Payment
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}