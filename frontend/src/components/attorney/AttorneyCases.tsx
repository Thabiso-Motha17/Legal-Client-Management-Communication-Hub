import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Cards';
import { Badge } from '../ui/Badges';
import { Button } from '../ui/Buttons';
import { 
  Briefcase, 
  Search,
  Filter,
  User,
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
  CalendarDays,
  CalendarCheck
} from 'lucide-react';

export function AssociateCases() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [selectedCase, setSelectedCase] = useState<number | null>(null);
  const [showAddCaseForm, setShowAddCaseForm] = useState(false);
  const [editingCase, setEditingCase] = useState<number | null>(null);
  
  // Simulate current logged in user
  const currentUser = 'David Wilson'; // This would come from authentication in real app
  
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0]; // Format: YYYY-MM-DD
  };

  const formatDateDisplay = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getDefaultDeadline = () => {
    const today = new Date();
    today.setDate(today.getDate() + 30); // Default deadline: 30 days from today
    return today.toISOString().split('T')[0];
  };

  const [newCase, setNewCase] = useState({
    fileNumber: '',
    caseNo: '',
    title: '',
    client: '',
    type: '',
    status: 'Active',
    priority: 'medium',
    assignedTo: currentUser, // Default to current user
    description: '',
    dateOpened: getTodayDate(),
    deadline: getDefaultDeadline() // Default deadline 30 days from today
  });

  // Update dateOpened when form opens
  useEffect(() => {
    if (showAddCaseForm && !editingCase) {
      setNewCase(prev => ({ 
        ...prev, 
        dateOpened: getTodayDate(),
        deadline: getDefaultDeadline(),
        assignedTo: currentUser // Always set to current user for new cases
      }));
    }
  }, [showAddCaseForm, editingCase]);

  // Initial cases - these would be loaded from an API in a real app
  const initialCases = [
    {
      id: 1,
      fileNumber: 'FN-2026-EST-001',
      caseNumber: 'CAS-2026-001',
      title: 'Johnson Estate Planning',
      client: 'John Johnson',
      partner: 'Sarah Mitchell',
      myRole: 'Lead Associate',
      type: 'Estate Planning',
      status: 'Active',
      priority: 'high',
      assignedTo: 'David Wilson',
      dateOpened: '2025-11-15',
      deadline: '2026-01-25',
      budget: 80,
      description: 'Comprehensive estate planning including trust agreements, wills, and property transfers',
      recentActivity: [
        { date: 'Jan 13', action: 'Uploaded trust agreement draft v2' },
        { date: 'Jan 12', action: 'Completed legal research on estate tax' },
        { date: 'Jan 10', action: 'Client consultation meeting' }
      ],
      addedBy: 'current-user',
      addedDate: 'Nov 15, 2025'
    },
    {
      id: 2,
      fileNumber: 'FN-2026-COR-003',
      caseNumber: 'CAS-2026-003',
      title: 'Corporate Merger - TechCo',
      client: 'TechCo Industries',
      partner: 'Sarah Mitchell',
      myRole: 'Associate',
      type: 'Corporate',
      status: 'Active',
      priority: 'high',
      assignedTo: 'Emma Roberts',
      dateOpened: '2025-12-01',
      deadline: '2026-02-01',
      budget: 120,
      description: 'Corporate merger and acquisition legal documentation and due diligence',
      recentActivity: [
        { date: 'Jan 13', action: 'Reviewed merger contract sections 4-7' },
        { date: 'Jan 11', action: 'Due diligence document review' },
        { date: 'Jan 9', action: 'Meeting with corporate counsel' }
      ],
      addedBy: 'current-user',
      addedDate: 'Dec 1, 2025'
    },
    {
      id: 3,
      fileNumber: 'FN-2025-LIT-087',
      caseNumber: 'CAS-2025-087',
      title: 'Smith Contract Dispute',
      client: 'Smith LLC',
      partner: 'Michael Chen',
      myRole: 'Associate',
      type: 'Litigation',
      status: 'Active',
      priority: 'medium',
      assignedTo: 'Robert Chen',
      dateOpened: '2025-10-20',
      deadline: '2026-01-30',
      budget: 40,
      description: 'Commercial contract dispute and negotiation support',
      recentActivity: [
        { date: 'Jan 12', action: 'Contract amendments drafted' },
        { date: 'Jan 8', action: 'Client meeting notes uploaded' },
        { date: 'Jan 5', action: 'Initial contract review completed' }
      ],
      addedBy: 'another-user',
      addedDate: 'Oct 20, 2025'
    },
    {
      id: 4,
      fileNumber: 'FN-2025-IP-072',
      caseNumber: 'CAS-2025-072',
      title: 'Williams Trademark Filing',
      client: 'Williams Brands Inc',
      partner: 'Michael Chen',
      myRole: 'Associate',
      type: 'Intellectual Property',
      status: 'Active',
      priority: 'low',
      assignedTo: 'Lisa Wang',
      dateOpened: '2025-09-15',
      deadline: '2026-02-15',
      budget: 30,
      description: 'Trademark registration and intellectual property protection',
      recentActivity: [
        { date: 'Jan 10', action: 'Filed trademark application' },
        { date: 'Jan 3', action: 'Trademark search completed' }
      ],
      addedBy: 'current-user',
      addedDate: 'Sep 15, 2025'
    },
    {
      id: 5,
      fileNumber: 'FN-2025-EMP-063',
      caseNumber: 'CAS-2025-063',
      title: 'Davis Employment Agreement',
      client: 'Davis Consulting',
      partner: 'Sarah Mitchell',
      myRole: 'Associate',
      type: 'Employment',
      status: 'On Hold',
      priority: 'medium',
      assignedTo: 'James Miller',
      dateOpened: '2025-08-10',
      deadline: '2026-03-01',
      budget: 25,
      description: 'Employment contract drafting and review',
      recentActivity: [
        { date: 'Dec 28', action: 'Contract draft submitted for review' }
      ],
      addedBy: 'another-user',
      addedDate: 'Aug 10, 2025'
    }
  ];

  const [cases, setCases] = useState(initialCases);

  // Filter to show only cases added by the current user
  const userCases = cases.filter(c => c.addedBy === 'current-user');

  const filteredCases = userCases.filter(c => {
    const matchesSearch = 
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.caseNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.fileNumber.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || c.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || c.priority === filterPriority;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const selectedCaseData = cases.find(c => c.id === selectedCase);

  const generateCaseNumber = () => {
    const currentYear = new Date().getFullYear();
    const maxId = cases.reduce((max, c) => {
      const idNum = parseInt(c.caseNumber.split('-')[2]) || 0;
      return Math.max(max, idNum);
    }, 0);
    return `CAS-${currentYear}-${(maxId + 1).toString().padStart(3, '0')}`;
  };

  const generateFileNumber = () => {
    const currentYear = new Date().getFullYear();
    const maxId = cases.reduce((max, c) => {
      const match = c.fileNumber.match(/FN-\d{4}-\w+-(\d+)/);
      return match ? Math.max(max, parseInt(match[1])) : max;
    }, 0);
    return `FN-${currentYear}-NEW-${(maxId + 1).toString().padStart(3, '0')}`;
  };

  const handleAddCase = () => {
    if (!newCase.title || !newCase.client || !newCase.type) {
      alert('Please fill in all required fields (Title, Client, Type)');
      return;
    }

    const newCaseObj = {
      id: cases.length + 1,
      fileNumber: newCase.fileNumber || generateFileNumber(),
      caseNumber: newCase.caseNo || generateCaseNumber(),
      title: newCase.title,
      client: newCase.client,
      partner: 'Not Assigned',
      myRole: 'Associate',
      type: newCase.type,
      status: newCase.status,
      priority: newCase.priority as 'high' | 'medium' | 'low',
      assignedTo: newCase.assignedTo, // Will be current user (uneditable)
      dateOpened: newCase.dateOpened,
      deadline: newCase.deadline,
      budget: 0,
      description: newCase.description,
      recentActivity: [
        { date: 'Today', action: 'Case created and assigned' }
      ],
      addedBy: 'current-user',
      addedDate: formatDateDisplay(newCase.dateOpened)
    };

    setCases([...cases, newCaseObj]);
    resetNewCaseForm();
    setShowAddCaseForm(false);
  };

  const handleDeleteCase = (id: number) => {
    if (window.confirm('Are you sure you want to delete this case?')) {
      setCases(cases.filter(c => c.id !== id));
      if (selectedCase === id) {
        setSelectedCase(null);
      }
    }
  };

  const handleEditCase = () => {
    if (!selectedCaseData || !editingCase) return;

    const updatedCases = cases.map(c => {
      if (c.id === editingCase) {
        return {
          ...c,
          fileNumber: newCase.fileNumber || c.fileNumber,
          caseNumber: newCase.caseNo || c.caseNumber,
          title: newCase.title || c.title,
          client: newCase.client || c.client,
          type: newCase.type || c.type,
          status: newCase.status || c.status,
          priority: newCase.priority as 'high' | 'medium' | 'low',
          // Assigned To remains unchanged (uneditable)
          description: newCase.description || c.description,
          // Date Opened remains unchanged (uneditable)
          deadline: newCase.deadline || c.deadline,
          recentActivity: [
            { date: 'Today', action: 'Case details updated' },
            ...c.recentActivity.slice(0, 2)
          ]
        };
      }
      return c;
    });

    setCases(updatedCases);
    resetNewCaseForm();
    setEditingCase(null);
  };

  const resetNewCaseForm = () => {
    setNewCase({
      fileNumber: '',
      caseNo: '',
      title: '',
      client: '',
      type: '',
      status: 'Active',
      priority: 'medium',
      assignedTo: currentUser, // Reset to current user
      description: '',
      dateOpened: getTodayDate(),
      deadline: getDefaultDeadline()
    });
  };

  const startEditing = (caseItem: any) => {
    setEditingCase(caseItem.id);
    setNewCase({
      fileNumber: caseItem.fileNumber,
      caseNo: caseItem.caseNumber,
      title: caseItem.title,
      client: caseItem.client,
      type: caseItem.type,
      status: caseItem.status,
      priority: caseItem.priority,
      assignedTo: caseItem.assignedTo, // Keep existing assignment
      description: caseItem.description,
      dateOpened: caseItem.dateOpened, // Keep existing date opened
      deadline: caseItem.deadline // Keep existing deadline
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

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Header with Add Case button */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-foreground mb-2">My Cases</h1>
          <p className="text-muted-foreground">Cases managed by you</p>
        </div>
        <Button 
          onClick={() => setShowAddCaseForm(true)}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Case
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-1">My Cases</p>
            <p className="text-2xl font-semibold text-foreground">{userCases.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-1">Active Cases</p>
            <p className="text-2xl font-semibold text-foreground">
              {userCases.filter(c => c.status === 'Active').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-1">High Priority</p>
            <p className="text-2xl font-semibold text-destructive">
              {userCases.filter(c => c.priority === 'high').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-1">Assigned to Me</p>
            <p className="text-2xl font-semibold text-primary">
              {cases.filter(c => c.assignedTo === currentUser).length}
            </p>
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
                placeholder="Search my cases by title, case number, or client..."
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
                <option value="Archived">Archived</option>
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
                    value={newCase.fileNumber}
                    onChange={(e) => setNewCase({...newCase, fileNumber: e.target.value})}
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
                    value={newCase.caseNo}
                    onChange={(e) => setNewCase({...newCase, caseNo: e.target.value})}
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
                
                {/* Client */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Client *</label>
                  <input
                    type="text"
                    value={newCase.client}
                    onChange={(e) => setNewCase({...newCase, client: e.target.value})}
                    className="w-full px-3 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Enter client name"
                    required
                  />
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
                    value={newCase.type}
                    onChange={(e) => setNewCase({...newCase, type: e.target.value})}
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
                    <option value="Archived">Archived</option>
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
                {/* Assigned To */}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Assigned To
                  </label>
                  <input
                    type="text"
                    value={newCase.assignedTo}
                    readOnly
                    className="w-full px-3 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring cursor-not-allowed bg-muted/30"
                  />
                  <p className="text-xs text-muted-foreground">
                    {!editingCase ? "Automatically assigned to you" : "Assignment cannot be changed"}
                  </p>
                </div>
                
                {/* Date Opened */}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <CalendarDays className="w-4 h-4" />
                    Date Opened
                  </label>
                  <input
                    type="date"
                    value={newCase.dateOpened}
                    readOnly
                    className="w-full px-3 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring cursor-not-allowed bg-muted/30"
                  />
                  <p className="text-xs text-muted-foreground">
                    {!editingCase ? "Set to today's date" : "Original opening date"}
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
                My Cases ({filteredCases.length})
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
                      : 'Get started by adding your first case'}
                  </p>
                  {!searchQuery && filterStatus === 'all' && filterPriority === 'all' && (
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
                <div className="divide-y divide-border">
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
                            {caseItem.fileNumber} • {caseItem.client}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {caseItem.caseNumber} • {caseItem.type}
                          </p>
                          {caseItem.addedBy === 'current-user' && (
                            <p className="text-xs text-primary mt-1">Managed by you</p>
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
                          <User className="w-3 h-3 text-muted-foreground" />
                          <span className="text-muted-foreground">Partner: {caseItem.partner}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-3 h-3 text-muted-foreground" />
                          <span className="text-muted-foreground">Assigned: {caseItem.assignedTo}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3 h-3 text-muted-foreground" />
                          <span className="text-muted-foreground">Opened: {formatDateDisplay(caseItem.dateOpened)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-3 h-3 text-muted-foreground" />
                          <span className="text-muted-foreground">Due: {formatDateDisplay(caseItem.deadline)}</span>
                        </div>
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
                      <span>{selectedCaseData.caseNumber}</span>
                      <span>•</span>
                      <span>{selectedCaseData.fileNumber}</span>
                      <span>•</span>
                      <span>{selectedCaseData.type}</span>
                    </div>
                    {selectedCaseData.addedBy === 'current-user' && (
                      <Badge variant="default" className="mt-2">
                        Managed by You
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedCaseData.addedBy === 'current-user' && (
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
                    <p className="text-sm text-muted-foreground mb-4">{selectedCaseData.description}</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Client</p>
                        <p className="text-sm font-medium text-foreground">{selectedCaseData.client}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Supervising Partner</p>
                        <p className="text-sm font-medium text-foreground">{selectedCaseData.partner}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">My Role</p>
                        <p className="text-sm font-medium text-foreground">{selectedCaseData.myRole}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Assigned To</p>
                        <p className="text-sm font-medium text-foreground">{selectedCaseData.assignedTo}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Case Type</p>
                        <p className="text-sm font-medium text-foreground">{selectedCaseData.type}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Date Opened</p>
                        <p className="text-sm font-medium text-foreground">{formatDateDisplay(selectedCaseData.dateOpened)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">File Number</p>
                        <p className="text-sm font-medium text-foreground">{selectedCaseData.fileNumber}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Deadline</p>
                        <p className="text-sm font-medium text-foreground">{formatDateDisplay(selectedCaseData.deadline)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Added By</p>
                        <p className="text-sm font-medium text-foreground">
                          {selectedCaseData.addedBy === 'current-user' ? 'You' : 'Another Associate'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div>
                    <h3 className="text-sm font-medium text-foreground mb-3">Recent Activity</h3>
                    <div className="space-y-2">
                      {selectedCaseData.recentActivity.map((activity, idx) => (
                        <div key={idx} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <FileText className="w-4 h-4 text-primary" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-foreground">{activity.action}</p>
                            <p className="text-xs text-muted-foreground">{activity.date}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="flex gap-2 pt-4 border-t border-border">
                    <Button variant="outline" className="gap-2">
                      <FileText className="w-4 h-4" />
                      View Documents
                    </Button>
                    <Button variant="outline" className="gap-2">
                      <MessageSquare className="w-4 h-4" />
                      Add Note
                    </Button>
                    {selectedCaseData.addedBy === 'current-user' && (
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
          </div>
        )}
      </div>
    </div>
  );
}