import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Cards';
import { Badge } from '../ui/Badges';
import { Button } from '../ui/Buttons';
import { 
  FileText, 
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
  Folder,
  Loader2,
  Clock
} from 'lucide-react';
import { FaMoneyBillAlt } from 'react-icons/fa';
import { 
  clientDashboardService, 
  caseService, 
  authService 
} from '../services/api';
import type{ Case, Document, User as UserType } from '../../types/Types';

interface ClientDashboardProps {
  onNavigate: (page: string) => void;
}

export function ClientDashboard({ onNavigate }: ClientDashboardProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [clientStats, setClientStats] = useState({
    totalCases: 0,
    activeCases: 0,
    completedCases: 0,
    totalDocuments: 0,
    outstandingBalance: 0,
    totalBilled: 0
  });
  const [cases, setCases] = useState<Case[]>([]);
  const [recentDocuments, setRecentDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);

  // Fetch data on component mount
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
      }

      // Get dashboard stats
      const stats = await clientDashboardService.getClientStats();
      setClientStats(stats);

      // Get client's cases
      const casesData = await caseService.getAll();
      setCases(casesData);

      // Get recent documents
      const recentDocs = await clientDashboardService.getRecentDocuments(4);
      setRecentDocuments(recentDocs);

    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredCases = cases.filter(caseItem => {
    const matchesSearch = 
      caseItem.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      caseItem.case_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      caseItem.file_number.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'Active' && caseItem.status === 'Active') ||
      (filterStatus === 'On Hold' && caseItem.status === 'On Hold') ||
      (filterStatus === 'Completed' && caseItem.status === 'Closed');
    
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

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'Active': return 'Active';
      case 'Closed': return 'Completed';
      case 'On Hold': return 'On Hold';
      default: return status;
    }
  };

  const getCaseTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'estate planning':
      case 'wills & trusts':
        return <FileText className="w-5 h-5 text-blue-500" />;
      case 'real estate':
      case 'property':
        return <Calendar className="w-5 h-5 text-green-500" />;
      case 'business':
      case 'corporate':
      case 'contract':
        return <Folder className="w-5 h-5 text-yellow-500" />;
      default:
        return <FileText className="w-5 h-5 text-gray-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const calculateProgress = (caseItem: Case): number => {
    // Simple progress calculation based on case age and status
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

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  if (loading) {
    return (
      <div className="p-6 md:p-8 space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
            <p className="text-muted-foreground">Loading your dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 md:p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="w-6 h-6 text-red-500" />
            <h2 className="text-lg font-semibold text-red-800">Error Loading Dashboard</h2>
          </div>
          <p className="text-red-700 mb-4">{error}</p>
          <Button 
            variant="outline" 
            onClick={fetchDashboardData}
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-foreground mb-2">
          Welcome back, {currentUser?.full_name?.split(' ')[0] || 'Client'}
        </h1>
        <p className="text-muted-foreground">Overview of all your cases and recent activity</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card 
          className="cursor-pointer hover:border-blue-500/50 transition-colors" 
          onClick={() => onNavigate('cases')}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Folder className="w-5 h-5 text-blue-500" />
              </div>
              <TrendingUp className="w-4 h-4 text-green-500" />
            </div>
            <p className="text-sm text-muted-foreground mb-1">Total Cases</p>
            <p className="text-2xl font-semibold text-foreground">{clientStats.totalCases}</p>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:border-green-500/50 transition-colors" 
          onClick={() => onNavigate('documents')}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-green-500" />
              </div>
              <AlertCircle className="w-4 h-4 text-yellow-500" />
            </div>
            <p className="text-sm text-muted-foreground mb-1">Pending Review</p>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:border-blue-500/50 transition-colors" 
          onClick={() => onNavigate('documents')}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-500" />
              </div>
              <BarChart3 className="w-4 h-4 text-gray-400" />
            </div>
            <p className="text-sm text-muted-foreground mb-1">Total Documents</p>
            <p className="text-2xl font-semibold text-foreground">{clientStats.totalDocuments}</p>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:border-yellow-500/50 transition-colors" 
          onClick={() => onNavigate('billing')}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                <FaMoneyBillAlt className="w-5 h-5 text-yellow-500" />
              </div>
              <BarChart3 className="w-4 h-4 text-gray-400" />
            </div>
            <p className="text-sm text-muted-foreground mb-1">Outstanding Balance</p>
            <p className="text-2xl font-semibold text-foreground">
              R{clientStats.outstandingBalance.toLocaleString()}
            </p>
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
                className="w-full pl-10 pr-4 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
              >
                <option value="all">All Status</option>
                <option value="Active">Active</option>
                <option value="On Hold">On Hold</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
            <Button 
              variant="primary" 
              onClick={() => onNavigate('cases')} 
              className="gap-2"
            >
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
              <Folder className="w-5 h-5 text-blue-500" />
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
              <p className="text-muted-foreground mb-2">
                {cases.length === 0 ? 'You don\'t have any cases yet' : 'No cases found'}
              </p>
              <p className="text-sm text-muted-foreground">
                {cases.length === 0 ? 'Contact your attorney to get started' : 'Try adjusting your search or filter'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
              {filteredCases.map((caseItem) => {
                const progress = calculateProgress(caseItem);
                const dueDate = caseItem.deadline ? formatDate(caseItem.deadline) : 'No deadline';
                const lastUpdate = caseItem.updated_at ? formatDate(caseItem.updated_at) : 'Never';
                
                return (
                  <div 
                    key={caseItem.id}
                    className="border border-border rounded-lg p-4 hover:border-blue-500/50 hover:shadow-md transition-all cursor-pointer group"
                    onClick={() => onNavigate(`cases/${caseItem.id}`)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {getCaseTypeIcon(caseItem.case_type)}
                        <div>
                          <h3 className="text-sm font-medium text-foreground truncate">
                            {caseItem.title}
                          </h3>
                          <p className="text-xs text-muted-foreground">Case #{caseItem.case_number}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Badge variant={getStatusVariant(caseItem.status)} className="text-xs">
                          {getStatusDisplay(caseItem.status)}
                        </Badge>
                        {caseItem.priority === 'high' && (
                          <AlertCircle className="w-4 h-4 text-red-500" />
                        )}
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {caseItem.description || 'No description available'}
                    </p>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Attorney</p>
                        <p className="text-sm font-medium text-foreground truncate">
                          {caseItem.assigned_to_name || 'Not assigned'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Due Date</p>
                        <p className="text-sm font-medium text-foreground truncate">{dueDate}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Progress</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 transition-all duration-500" 
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          {caseItem.documents?.length || 0} docs
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Updated: {lastUpdate}
                        </span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-blue-500 transition-colors" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid w-full grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Documents */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-500" />
                Recent Documents
              </div>
              <Button variant="ghost" size="sm" onClick={() => onNavigate('documents')}>
                View All
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {recentDocuments.length > 0 ? (
                recentDocuments.map((doc) => (
                  <div 
                    key={doc.id} 
                    className="px-6 py-4 hover:bg-muted/30 transition-colors flex items-center justify-between group"
                    onClick={() => onNavigate(`documents/${doc.id}`)}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5 text-blue-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{doc.name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{formatDate(doc.uploaded_at)}</span>
                          <span>•</span>
                          <span>{formatFileSize(doc.file_size || 0)}</span>
                          {doc.case_title && (
                            <>
                              <span>•</span>
                              <span className="text-blue-500 truncate">
                                {doc.case_title}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          onNavigate(`documents/${doc.id}`);
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Handle download - you would implement this
                          alert(`Downloading ${doc.name}`);
                        }}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-6 py-8 text-center">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No documents yet</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Deadlines */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-500" />
                Upcoming Deadlines
              </div>
              <Button variant="ghost" size="sm" onClick={() => onNavigate('cases')}>
                View All
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {cases
                .filter(c => c.deadline && new Date(c.deadline) > new Date())
                .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())
                .slice(0, 4)
                .map((caseItem) => {
                  const deadlineDate = new Date(caseItem.deadline!);
                  const today = new Date();
                  const daysLeft = Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
                  
                  return (
                    <div 
                      key={caseItem.id} 
                      className="px-6 py-4 hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={() => onNavigate(`cases/${caseItem.id}`)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-sm font-medium text-foreground truncate mb-1">
                            {caseItem.title}
                          </p>
                          <p className="text-xs text-muted-foreground">Case #{caseItem.case_number}</p>
                        </div>
                        <Badge 
                          variant={daysLeft <= 7 ? 'error' : daysLeft <= 14 ? 'warning' : 'success'} 
                          className="text-xs"
                        >
                          {daysLeft}d
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Due: {formatDate(caseItem.deadline!)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {caseItem.assigned_to_name || 'Attorney'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              {cases.filter(c => c.deadline && new Date(c.deadline) > new Date()).length === 0 && (
                <div className="px-6 py-8 text-center">
                  <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No upcoming deadlines</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="bg-gradient-to-br from-blue-500/5 to-transparent border-blue-500/20">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-foreground font-medium mb-2">Quick Actions</h3>
              <p className="text-sm text-muted-foreground">
                Need assistance? Here are some quick actions you can take.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button 
                variant="primary" 
                onClick={() => onNavigate('documents')} 
                className="gap-2"
              >
                <FileText className="w-4 h-4" />
                View Documents
              </Button>
              <Button 
                variant="outline" 
                onClick={() => onNavigate('documents')} 
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                Upload Document
              </Button>
              <Button 
                variant="outline" 
                onClick={() => onNavigate('billing')} 
                className="gap-2"
              >
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