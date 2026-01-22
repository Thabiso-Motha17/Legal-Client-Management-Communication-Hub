import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Cards';
import { Badge } from '../ui/Badges';
import { Button } from '../ui/Buttons';
import { 
  Briefcase, 
  Search,
  Filter,
  Calendar,
  FileText,
  MessageSquare,
  ChevronRight,
  Plus,
  Edit,
  Trash2,
  FileDigit,
  Hash,
  Tag,
  AlertCircle,
  Users,
  Clock,
  CalendarCheck,
  Building,
  Eye,
  StickyNote,
  ExternalLink,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import type { Case, CreateCaseData, UpdateCaseData, Client, User, Note } from '../../types/Types';
import { apiRequest } from '../lib/api';

interface AssociateCasesProps {
  onNavigate: (page: string) => void;
}

export function AssociateCases({ onNavigate }: AssociateCasesProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [viewMode, setViewMode] = useState<'my-cases' | 'all-cases'>('my-cases');
  const [selectedCase, setSelectedCase] = useState<number | null>(null);
  const [showAddCaseForm, setShowAddCaseForm] = useState(false);
  const [editingCase, setEditingCase] = useState<number | null>(null);
  
  const [cases, setCases] = useState<Case[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [caseNotes, setCaseNotes] = useState<Note[]>([]);
  const [showNotes, setShowNotes] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingNotes, setLoadingNotes] = useState(false);
  
  // Get current user from localStorage or context
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // Fetch initial data
  useEffect(() => {
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchData();
    }
  }, [currentUser]);

  const fetchCurrentUser = async () => {
    try {
      const response = await apiRequest<{ user: User }>('/api/auth/me');
      if (response.data?.user) {
        setCurrentUser(response.data.user);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  };

  const fetchData = async () => {
    if (!currentUser) return;
    
    try {
      setLoading(true);
      
      // Fetch ALL cases from the company
      const casesResponse = await apiRequest<Case[]>(`/api/cases`);
      if (casesResponse.data) {
        setCases(casesResponse.data);
      }
      
      // Fetch clients assigned to the current user for creating new cases
      const clientsResponse = await apiRequest<Client[]>(`/api/clients?assigned_to=${currentUser.id}`);
      if (clientsResponse.data) {
        setClients(clientsResponse.data);
      }
      
      // Fetch users (associates) for the current law firm
      const usersResponse = await apiRequest<User[]>(`/api/users`);
      if (usersResponse.data) {
        // Filter to show only associates from the same law firm
        const lawFirmAssociates = usersResponse.data.filter(user => 
          user.role === 'associate' && 
          user.law_firm_id === currentUser.law_firm_id
        );
        setUsers(lawFirmAssociates);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch notes for selected case
  const fetchCaseNotes = async (caseId: number) => {
    if (!caseId) return;
    
    try {
      setLoadingNotes(true);
      const response = await apiRequest<Note[]>(`/api/notes?case_id=${caseId}`);
      if (response.data) {
        setCaseNotes(response.data);
      }
    } catch (error) {
      console.error('Error fetching case notes:', error);
    } finally {
      setLoadingNotes(false);
    }
  };

  // When a case is selected, fetch its notes
  useEffect(() => {
    if (selectedCase) {
      fetchCaseNotes(selectedCase);
      setShowNotes(true);
    } else {
      setCaseNotes([]);
      setShowNotes(false);
    }
  }, [selectedCase]);

  // Filter cases based on view mode
  const filteredCases = cases.filter(c => {
    // Apply view mode filter
    const matchesViewMode = viewMode === 'all-cases' || 
      (viewMode === 'my-cases' && (c.assigned_to_user_id === currentUser?.id || c.added_by_user_id === currentUser?.id));
    
    // Apply search filter
    const matchesSearch = 
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.case_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.client_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      c.file_number.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Apply status filter
    const matchesStatus = filterStatus === 'all' || c.status === filterStatus;
    
    // Apply priority filter
    const matchesPriority = filterPriority === 'all' || c.priority === filterPriority;
    
    return matchesViewMode && matchesSearch && matchesStatus && matchesPriority;
  });

  const selectedCaseData = cases.find(c => c.id === selectedCase);

  const formatDateDisplay = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDefaultDeadline = () => {
    const today = new Date();
    today.setDate(today.getDate() + 30);
    return today.toISOString().split('T')[0];
  };

  const [newCase, setNewCase] = useState({
    file_number: '',
    case_number: '',
    title: '',
    client_id: 0,
    case_type: '',
    status: 'Active',
    priority: 'medium',
    assigned_to_user_id: 0,
    description: '',
    deadline: getDefaultDeadline(),
  });

  // Update assigned_to_user_id when form opens
  useEffect(() => {
    if (showAddCaseForm && !editingCase && currentUser) {
      setNewCase(prev => ({ 
        ...prev, 
        assigned_to_user_id: currentUser.id || 0
      }));
    }
  }, [showAddCaseForm, editingCase, currentUser]);

  const generateCaseNumber = async () => {
    try {
      const currentYear = new Date().getFullYear();
      const response = await apiRequest<any[]>(`/api/cases`);
      if (response.data) {
        const maxId = response.data.reduce((max, c) => {
          const idNum = parseInt(c.case_number.split('-')[2]) || 0;
          return Math.max(max, idNum);
        }, 0);
        return `CAS-${currentYear}-${(maxId + 1).toString().padStart(3, '0')}`;
      }
    } catch (error) {
      console.error('Error generating case number:', error);
    }
    return `CAS-${new Date().getFullYear()}-001`;
  };

  const generateFileNumber = async () => {
    try {
      const currentYear = new Date().getFullYear();
      const response = await apiRequest<any[]>(`/api/cases`);
      if (response.data) {
        const maxId = response.data.reduce((max, c) => {
          const match = c.file_number.match(/FN-\d{4}-\w+-(\d+)/);
          return match ? Math.max(max, parseInt(match[1])) : max;
        }, 0);
        return `FN-${currentYear}-NEW-${(maxId + 1).toString().padStart(3, '0')}`;
      }
    } catch (error) {
      console.error('Error generating file number:', error);
    }
    return `FN-${new Date().getFullYear()}-NEW-001`;
  };

  const handleAddCase = async () => {
    if (!newCase.title || !newCase.client_id || !newCase.case_type) {
      alert('Please fill in all required fields (Title, Client, Type)');
      return;
    }

    try {
      const caseData: CreateCaseData = {
        file_number: newCase.file_number || await generateFileNumber(),
        case_number: newCase.case_number || await generateCaseNumber(),
        title: newCase.title,
        client_id: newCase.client_id,
        case_type: newCase.case_type,
        status: newCase.status as 'Active' | 'On Hold' | 'Closed',
        priority: newCase.priority as 'low' | 'medium' | 'high',
        assigned_to_user_id: newCase.assigned_to_user_id,
        deadline: newCase.deadline,
        description: newCase.description,
      };

      const response = await apiRequest<Case>(`/api/cases`, {
        method: 'POST',
        body: JSON.stringify(caseData),
      });

      if (response.data) {
        setCases([...cases, response.data]);
        resetNewCaseForm();
        setShowAddCaseForm(false);
        fetchData(); // Refresh data
      } else if (response.error) {
        alert(`Error adding case: ${response.error}`);
      }
    } catch (error) {
      console.error('Error adding case:', error);
      alert('Failed to add case. Please try again.');
    }
  };

  const handleDeleteCase = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this case?')) {
      try {
        const response = await apiRequest(`/api/cases/${id}`, {
          method: 'DELETE',
        });

        if (!response.error) {
          setCases(cases.filter(c => c.id !== id));
          if (selectedCase === id) {
            setSelectedCase(null);
          }
          fetchData(); // Refresh data
        } else {
          alert(`Error deleting case: ${response.error}`);
        }
      } catch (error) {
        console.error('Error deleting case:', error);
        alert('Failed to delete case. Please try again.');
      }
    }
  };

  const handleEditCase = async () => {
    if (!selectedCaseData || !editingCase) return;

    try {
      const updateData: UpdateCaseData = {
        title: newCase.title || selectedCaseData.title,
        client_id: newCase.client_id || selectedCaseData.client_id,
        case_type: newCase.case_type || selectedCaseData.case_type,
        status: newCase.status as 'Active' | 'On Hold' | 'Closed' || selectedCaseData.status,
        priority: newCase.priority as 'low' | 'medium' | 'high' || selectedCaseData.priority,
        assigned_to_user_id: newCase.assigned_to_user_id || selectedCaseData.assigned_to_user_id,
        deadline: newCase.deadline || selectedCaseData.deadline || '',
        description: newCase.description || selectedCaseData.description || '',
      };

      const response = await apiRequest<Case>(`/api/cases/${editingCase}`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });

      if (response.data) {
        const updatedCases = cases.map(c => 
          c.id === editingCase ? response.data! : c
        );
        setCases(updatedCases);
        resetNewCaseForm();
        setEditingCase(null);
        fetchData(); // Refresh data
      } else if (response.error) {
        alert(`Error updating case: ${response.error}`);
      }
    } catch (error) {
      console.error('Error updating case:', error);
      alert('Failed to update case. Please try again.');
    }
  };

  const resetNewCaseForm = () => {
    setNewCase({
      file_number: '',
      case_number: '',
      title: '',
      client_id: 0,
      case_type: '',
      status: 'Active',
      priority: 'medium',
      assigned_to_user_id: currentUser?.id || 0,
      description: '',
      deadline: getDefaultDeadline(),
    });
  };

  const startEditing = (caseItem: Case) => {
    setEditingCase(caseItem.id);
    setNewCase({
      file_number: caseItem.file_number,
      case_number: caseItem.case_number,
      title: caseItem.title,
      client_id: caseItem.client_id,
      case_type: caseItem.case_type,
      status: caseItem.status,
      priority: caseItem.priority,
      assigned_to_user_id: caseItem.assigned_to_user_id,
      description: caseItem.description || '',
      deadline: caseItem.deadline || getDefaultDeadline(),
    });
  };

  const caseTypes = [
    'Estate Planning',
    'Corporate',
    'Litigation',
    'Intellectual Property',
    'Employment',
    'Real Estate',
    'Tax',
    'Bankruptcy',
    'Family Law',
    'Criminal Defense',
    'Personal Injury',
    'Immigration'
  ];

  const getClientName = (clientId: number) => {
    const client = clients.find(c => c.id === clientId);
    return client?.name || 'Unknown Client';
  };

  const getAssignedUserName = (userId: number) => {
    const user = users.find(u => u.id === userId);
    return user?.full_name || 'Unknown User';
  };

  // Calculate statistics
  const myCasesCount = cases.filter(c => 
    c.assigned_to_user_id === currentUser?.id || c.added_by_user_id === currentUser?.id
  ).length;

  const activeMyCasesCount = cases.filter(c => 
    (c.assigned_to_user_id === currentUser?.id || c.added_by_user_id === currentUser?.id) && 
    c.status === 'Active'
  ).length;

  const highPriorityMyCasesCount = cases.filter(c => 
    (c.assigned_to_user_id === currentUser?.id || c.added_by_user_id === currentUser?.id) && 
    c.priority === 'high'
  ).length;

  if (loading) {
    return (
      <div className="p-6 md:p-8 space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-foreground mb-2">Cases</h1>
            <p className="text-muted-foreground">Loading cases...</p>
          </div>
        </div>
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading cases...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-foreground mb-2">Cases</h1>
          <p className="text-muted-foreground">
            {viewMode === 'my-cases' ? 'Cases assigned to or created by you' : 'All cases in the company'}
          </p>
        </div>
        <div className="flex items-center gap-4">
          {/* View Mode Toggle */}
          <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-1">
            <Button
              variant={viewMode === 'my-cases' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('my-cases')}
              className="gap-2"
            >
              <Eye className="w-4 h-4" />
              My Cases
            </Button>
            <Button
              variant={viewMode === 'all-cases' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('all-cases')}
              className="gap-2"
            >
              <Building className="w-4 h-4" />
              All Cases
            </Button>
          </div>
          <Button 
            onClick={() => setShowAddCaseForm(true)}
            className="gap-2"
            disabled={clients.length === 0}
          >
            <Plus className="w-4 h-4" />
            Add Case
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-1">
              {viewMode === 'my-cases' ? 'My Cases' : 'Total Cases'}
            </p>
            <p className="text-2xl font-semibold text-foreground">
              {viewMode === 'my-cases' ? myCasesCount : cases.length}
            </p>
            <div className="flex items-center gap-1 mt-2">
              {viewMode === 'my-cases' ? (
                <Eye className="w-3 h-3 text-muted-foreground" />
              ) : (
                <Building className="w-3 h-3 text-muted-foreground" />
              )}
              <span className="text-xs text-muted-foreground">
                {viewMode === 'my-cases' ? 'Personal view' : 'Company view'}
              </span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-1">
              {viewMode === 'my-cases' ? 'My Active Cases' : 'Active Cases'}
            </p>
            <p className="text-2xl font-semibold text-foreground">
              {viewMode === 'my-cases' 
                ? activeMyCasesCount
                : cases.filter(c => c.status === 'Active').length
              }
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-1">
              {viewMode === 'my-cases' ? 'My High Priority' : 'High Priority'}
            </p>
            <p className="text-2xl font-semibold text-destructive">
              {viewMode === 'my-cases'
                ? highPriorityMyCasesCount
                : cases.filter(c => c.priority === 'high').length
              }
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-1">My Assigned Clients</p>
            <p className="text-2xl font-semibold text-primary">{clients.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-1">Currently Viewing</p>
            <p className="text-2xl font-semibold text-accent">{filteredCases.length}</p>
            <div className="flex items-center gap-1 mt-2">
              <Filter className="w-3 h-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                {filterStatus !== 'all' || filterPriority !== 'all' || searchQuery ? 'Filtered' : 'All'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder={`Search ${viewMode === 'my-cases' ? 'my' : 'all'} cases by title, case number, or client...`}
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
                <option value="Closed">Closed</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-muted-foreground" />
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="px-4 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
              >
                <option value="all">All Priority</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">View:</span>
              <Badge variant="default">
                {viewMode === 'my-cases' ? 'My Cases Only' : 'All Company Cases'}
              </Badge>
            </div>
            <div className="text-muted-foreground">
              Showing {filteredCases.length} of {viewMode === 'my-cases' ? myCasesCount : cases.length} cases
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Case Modal */}
      {(showAddCaseForm || editingCase) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                {editingCase ? 'Edit Case' : 'Add New Case'}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {
                    setShowAddCaseForm(false);
                    setEditingCase(null);
                    resetNewCaseForm();
                  }}
                >
                  ×
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* File Number */}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <FileDigit className="w-4 h-4" />
                    File Number
                  </label>
                  <input
                    type="text"
                    value={newCase.file_number}
                    onChange={(e) => setNewCase({...newCase, file_number: e.target.value})}
                    className="w-full px-3 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="FN-2026-EST-001"
                  />
                  <p className="text-xs text-muted-foreground">Internal file reference number</p>
                </div>
                
                {/* Case Number */}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Hash className="w-4 h-4" />
                    Case Number
                  </label>
                  <input
                    type="text"
                    value={newCase.case_number}
                    onChange={(e) => setNewCase({...newCase, case_number: e.target.value})}
                    className="w-full px-3 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="CAS-2026-001"
                  />
                  <p className="text-xs text-muted-foreground">Public-facing case identifier</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Case Title */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Case Title *</label>
                  <input
                    type="text"
                    value={newCase.title}
                    onChange={(e) => setNewCase({...newCase, title: e.target.value})}
                    className="w-full px-3 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Enter case title"
                    required
                  />
                </div>
                
                {/* Client - Only show clients assigned to current user */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Client *</label>
                  <select
                    value={newCase.client_id}
                    onChange={(e) => setNewCase({...newCase, client_id: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                    required
                  >
                    <option value="0">Select client...</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.name} {client.company ? `(${client.company})` : ''}
                      </option>
                    ))}
                  </select>
                  {clients.length === 0 && (
                    <p className="text-xs text-destructive">
                      No clients assigned to you. Please contact an admin to assign clients.
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Case Type */}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Tag className="w-4 h-4" />
                    Case Type *
                  </label>
                  <select
                    value={newCase.case_type}
                    onChange={(e) => setNewCase({...newCase, case_type: e.target.value})}
                    className="w-full px-3 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                    required
                  >
                    <option value="">Select type...</option>
                    {caseTypes.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                
                {/* Status */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status *</label>
                  <select
                    value={newCase.status}
                    onChange={(e) => setNewCase({...newCase, status: e.target.value})}
                    className="w-full px-3 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="Active">Active</option>
                    <option value="On Hold">On Hold</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>
                
                {/* Priority */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Priority</label>
                  <select
                    value={newCase.priority}
                    onChange={(e) => setNewCase({...newCase, priority: e.target.value})}
                    className="w-full px-3 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Assigned To - Can assign to any associate */}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Assigned To
                  </label>
                  <select
                    value={newCase.assigned_to_user_id}
                    onChange={(e) => setNewCase({...newCase, assigned_to_user_id: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value={currentUser?.id || 0}>Myself ({currentUser?.full_name || 'You'})</option>
                    {users.map((user) => (
                      user.id !== currentUser?.id && (
                        <option key={user.id} value={user.id}>
                          {user.full_name} ({user.role})
                        </option>
                      )
                    ))}
                  </select>
                  <p className="text-xs text-muted-foreground">
                    Assign case to yourself or another associate
                  </p>
                </div>
                
                {/* Deadline */}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <CalendarCheck className="w-4 h-4" />
                    Deadline
                  </label>
                  <input
                    type="date"
                    value={newCase.deadline}
                    onChange={(e) => setNewCase({...newCase, deadline: e.target.value})}
                    className="w-full px-3 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <p className="text-xs text-muted-foreground">Set case deadline</p>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <textarea
                  value={newCase.description}
                  onChange={(e) => setNewCase({...newCase, description: e.target.value})}
                  className="w-full px-3 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring min-h-[100px]"
                  placeholder="Enter case description, objectives, and key details..."
                />
              </div>
              
              <div className="flex justify-end gap-2 pt-4 border-t border-border">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowAddCaseForm(false);
                    setEditingCase(null);
                    resetNewCaseForm();
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={editingCase ? handleEditCase : handleAddCase}
                  className="gap-2"
                  disabled={!newCase.client_id}
                >
                  {editingCase ? 'Save Changes' : 'Add Case'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Cases Grid/Detail View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cases List */}
        <div className={selectedCase ? 'lg:col-span-1' : 'lg:col-span-3'}>
          <Card>
            <CardHeader>
              <CardTitle>
                {viewMode === 'my-cases' ? 'My Cases' : 'All Cases'} ({filteredCases.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {filteredCases.length === 0 ? (
                <div className="p-6 text-center">
                  <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No cases found</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchQuery || filterStatus !== 'all' || filterPriority !== 'all'
                      ? 'Try adjusting your search or filter' 
                      : (viewMode === 'my-cases' && clients.length === 0
                        ? 'You have no assigned clients. Contact an admin to get clients assigned to you.'
                        : viewMode === 'my-cases'
                        ? 'No cases assigned to or created by you'
                        : 'No cases in the company yet')}
                  </p>
                  {!searchQuery && filterStatus === 'all' && filterPriority === 'all' && clients.length > 0 && viewMode === 'my-cases' && (
                    <Button 
                      onClick={() => setShowAddCaseForm(true)}
                      variant="outline"
                      className="gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Add Your First Case
                    </Button>
                  )}
                </div>
              ) : (
                <div className="divide-y divide-border max-h-[600px] overflow-y-auto">
                  {filteredCases.map((caseItem) => (
                    <button
                      key={caseItem.id}
                      onClick={() => setSelectedCase(selectedCase === caseItem.id ? null : caseItem.id)}
                      className={`w-full px-6 py-4 text-left hover:bg-muted/30 transition-colors ${
                        selectedCase === caseItem.id ? 'bg-muted/50' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-sm font-medium text-foreground">{caseItem.title}</h3>
                            {caseItem.priority === 'high' && (
                              <Badge variant="error" className="text-xs">High</Badge>
                            )}
                            {caseItem.priority === 'medium' && (
                              <Badge variant="warning" className="text-xs">Medium</Badge>
                            )}
                            {caseItem.priority === 'low' && (
                              <Badge variant="success" className="text-xs">Low</Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mb-1">
                            {caseItem.file_number} • {caseItem.client_name || 'Unknown Client'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {caseItem.case_number} • {caseItem.case_type}
                          </p>
                          {(caseItem.added_by_user_id === currentUser?.id || caseItem.assigned_to_user_id === currentUser?.id) && (
                            <p className="text-xs text-primary mt-1">
                              {caseItem.added_by_user_id === currentUser?.id ? 'Created by you' : 
                               caseItem.assigned_to_user_id === currentUser?.id ? 'Assigned to you' : ''}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <Badge variant={
                            caseItem.status === 'Active' ? 'success' : 
                            caseItem.status === 'On Hold' ? 'warning' : 
                            'secondary'
                          }>
                            {caseItem.status}
                          </Badge>
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                        <div className="flex items-center gap-2">
                          <Users className="w-3 h-3 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            {caseItem.assigned_to_name || getAssignedUserName(caseItem.assigned_to_user_id)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3 h-3 text-muted-foreground" />
                          <span className="text-muted-foreground">Opened: {formatDateDisplay(caseItem.date_opened)}</span>
                        </div>
                        {caseItem.deadline && (
                          <div className="flex items-center gap-2">
                            <Clock className="w-3 h-3 text-muted-foreground" />
                            <span className="text-muted-foreground">Due: {formatDateDisplay(caseItem.deadline)}</span>
                          </div>
                        )}
                        {viewMode === 'all-cases' && (caseItem.added_by_user_id === currentUser?.id || caseItem.assigned_to_user_id === currentUser?.id) && (
                          <div className="col-span-2 flex items-center gap-2">
                            <span className="text-xs text-primary">
                              {caseItem.added_by_user_id === currentUser?.id ? 'Created by you' : 
                               caseItem.assigned_to_user_id === currentUser?.id ? 'Assigned to you' : ''}
                            </span>
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Case Details */}
        {selectedCase && selectedCaseData && (
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle>{selectedCaseData.title}</CardTitle>
                      <Badge variant={
                        selectedCaseData.status === 'Active' ? 'success' : 
                        selectedCaseData.status === 'On Hold' ? 'warning' : 
                        'secondary'
                      }>
                        {selectedCaseData.status}
                      </Badge>
                      <Badge variant={
                        selectedCaseData.priority === 'high' ? 'error' : 
                        selectedCaseData.priority === 'medium' ? 'warning' : 
                        'success'
                      }>
                        {selectedCaseData.priority} Priority
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                      <span>{selectedCaseData.case_number}</span>
                      <span>•</span>
                      <span>{selectedCaseData.file_number}</span>
                      <span>•</span>
                      <span>{selectedCaseData.case_type}</span>
                    </div>
                    {(selectedCaseData.added_by_user_id === currentUser?.id || selectedCaseData.assigned_to_user_id === currentUser?.id) && (
                      <Badge variant="default" className="mt-2">
                        {selectedCaseData.added_by_user_id === currentUser?.id ? 'Created by You' : 'Assigned to You'}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {(selectedCaseData.added_by_user_id === currentUser?.id || selectedCaseData.assigned_to_user_id === currentUser?.id) && (
                      <>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => startEditing(selectedCaseData)}
                          className="gap-1"
                        >
                          <Edit className="w-4 h-4" />
                          Edit
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeleteCase(selectedCaseData.id)}
                          className="gap-1 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </Button>
                      </>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => setSelectedCase(null)}>
                      Close
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Overview */}
                  <div>
                    <h3 className="text-sm font-medium text-foreground mb-3">Case Overview</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {selectedCaseData.description || 'No description provided.'}
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Client</p>
                        <p className="text-sm font-medium text-foreground">
                          {selectedCaseData.client_name || getClientName(selectedCaseData.client_id)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Assigned To</p>
                        <p className="text-sm font-medium text-foreground">
                          {selectedCaseData.assigned_to_name || getAssignedUserName(selectedCaseData.assigned_to_user_id)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Case Type</p>
                        <p className="text-sm font-medium text-foreground">{selectedCaseData.case_type}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Date Opened</p>
                        <p className="text-sm font-medium text-foreground">{formatDateDisplay(selectedCaseData.date_opened)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">File Number</p>
                        <p className="text-sm font-medium text-foreground">{selectedCaseData.file_number}</p>
                      </div>
                      {selectedCaseData.deadline && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Deadline</p>
                          <p className="text-sm font-medium text-foreground">{formatDateDisplay(selectedCaseData.deadline)}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Created By</p>
                        <p className="text-sm font-medium text-foreground">
                          {selectedCaseData.added_by_user_id === currentUser?.id ? 'You' : 
                           (selectedCaseData.added_by_name || getAssignedUserName(selectedCaseData.added_by_user_id))}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="flex flex-wrap gap-2 pt-4 border-t border-border">
                    <Button variant="outline" className="gap-2" onClick={() => onNavigate('documents')}>
                      <FileText className="w-4 h-4" />
                      View Documents
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                    <Button variant="outline" className="gap-2" onClick={() => onNavigate('notes')}>
                      <MessageSquare className="w-4 h-4" />
                      Add Note
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                    {(selectedCaseData.added_by_user_id === currentUser?.id || selectedCaseData.assigned_to_user_id === currentUser?.id) && (
                      <Button 
                        variant="outline" 
                        className="gap-2"
                        onClick={() => startEditing(selectedCaseData)}
                      >
                        <Edit className="w-4 h-4" />
                        Edit Case
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Case Notes Section */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <StickyNote className="w-5 h-5 text-primary" />
                    <CardTitle>Case Notes</CardTitle>
                    <Badge variant="default" className="ml-2">
                      {caseNotes.length}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowNotes(!showNotes)}
                    className="gap-1"
                  >
                    {showNotes ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    {showNotes ? 'Hide' : 'Show'}
                  </Button>
                </div>
              </CardHeader>
              
              {showNotes && (
                <CardContent>
                  {loadingNotes ? (
                    <div className="py-8 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                      <p className="text-sm text-muted-foreground">Loading notes...</p>
                    </div>
                  ) : caseNotes.length === 0 ? (
                    <div className="text-center py-8">
                      <StickyNote className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-foreground mb-1">No notes yet</p>
                      <p className="text-sm text-muted-foreground mb-4">Add your first note to this case</p>
                      <Button variant="outline" className="gap-2" onClick={() => onNavigate('notes')}>
                        <Plus className="w-4 h-4" />
                        Add Note
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-muted-foreground">
                          Showing {caseNotes.length} note{caseNotes.length !== 1 ? 's' : ''}
                        </p>
                        <Button variant="outline" size="sm" onClick={() => onNavigate('notes')} className="gap-1">
                          <Plus className="w-3 h-3" />
                          Add Note
                        </Button>
                      </div>
                      
                      <div className="divide-y divide-border">
                        {caseNotes.map((note) => (
                          <div key={note.id} className="py-4">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h4 className="text-sm font-medium text-foreground mb-1">{note.title}</h4>
                                <div className="flex items-center gap-2">
                                  <Badge variant="default" className="text-xs">
                                    {note.category || 'Uncategorized'}
                                  </Badge>
                                  {note.is_private && (
                                    <Badge variant="secondary" className="text-xs">Private</Badge>
                                  )}
                                </div>
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {formatDateTime(note.updated_at)}
                              </span>
                            </div>
                            
                            <p className="text-sm text-muted-foreground mb-3 line-clamp-3">
                              {note.content}
                            </p>
                            
                            {note.tags && note.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mb-3">
                                {note.tags.map((tag, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-0.5 bg-muted rounded text-xs text-muted-foreground"
                                  >
                                    #{tag}
                                  </span>
                                ))}
                              </div>
                            )}
                            
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <div className="flex items-center gap-4">
                                <span>Words: {note.word_count || 0}</span>
                                <span>Chars: {note.character_count || 0}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="pt-4 border-t border-border">
                        <Button 
                          variant="outline" 
                          className="w-full gap-2"
                          onClick={() => onNavigate('notes')}
                        >
                          <MessageSquare className="w-4 h-4" />
                          Add New Note to This Case
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}