import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '../ui/Cards';
import { Badge } from '../ui/Badges';
import { Button } from '../ui/Buttons';
import { Search, Filter, Eye, Plus, Calendar, User, X, FileDigit, Hash, Tag, AlertCircle, Users, CalendarCheck } from 'lucide-react';
import { CaseDetail } from './CaseDetail';

interface Case {
  id: string;
  FileNo: string;
  caseNumber: string;
  title: string;
  client: string;
  type: string;
  status: 'active' | 'pending' | 'closed' | 'on-hold';
  priority: 'high' | 'medium' | 'low';
  assignedTo: string;
  dateOpened: string;
  nextDeadline?: string;
}

export function Cases() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [showAddCaseForm, setShowAddCaseForm] = useState(false);
  const [cases, setCases] = useState<Case[]>([]);
  
  // Simulate current logged in user
  const currentUser = 'David Wilson';
  
  const [newCase, setNewCase] = useState({
    fileNo: '',
    caseNumber: '',
    title: '',
    client: '',
    type: '',
    status: 'active' as 'active' | 'pending' | 'closed' | 'on-hold',
    priority: 'medium' as 'high' | 'medium' | 'low',
    assignedTo: currentUser,
    nextDeadline: ''
  });

  // Initial mock cases
  const initialCases: Case[] = [
    {
      id: '1',
      FileNo: 'FIL-2026-001',
      caseNumber: 'CAS-2026-001',
      title: 'Henderson v. State Corp',
      client: 'James Henderson',
      type: 'Corporate Litigation',
      status: 'active',
      priority: 'high',
      assignedTo: 'Sarah Mitchell',
      dateOpened: 'Dec 15, 2025',
      nextDeadline: 'Jan 10, 2026'
    },
    {
      id: '2',
      FileNo: 'FIL-2026-002',
      caseNumber: 'CAS-2026-002',
      title: 'Martinez Estate Planning',
      client: 'Maria Martinez',
      type: 'Estate Planning',
      status: 'active',
      priority: 'medium',
      assignedTo: 'Michael Chen',
      dateOpened: 'Jan 2, 2026',
      nextDeadline: 'Jan 12, 2026'
    },
    {
      id: '3',
      FileNo: 'FIL-2025-089',
      caseNumber: 'CAS-2025-089',
      title: 'Thompson Contract Dispute',
      client: 'Thompson Industries LLC',
      type: 'Contract Law',
      status: 'active',
      priority: 'medium',
      assignedTo: 'Sarah Mitchell',
      dateOpened: 'Nov 20, 2025',
      nextDeadline: 'Jan 15, 2026'
    },
    {
      id: '4',
      FileNo: 'FIL-2025-078',
      caseNumber: 'CAS-2025-078',
      title: 'Wilson v. Metro Insurance',
      client: 'Robert Wilson',
      type: 'Insurance Claims',
      status: 'pending',
      priority: 'low',
      assignedTo: 'Jennifer Lee',
      dateOpened: 'Oct 5, 2025',
      nextDeadline: 'Feb 15, 2026'
    },
    {
      id: '5',
      FileNo: 'FIL-2025-067',
      caseNumber: 'CAS-2025-067',
      title: 'Anderson Real Estate Transaction',
      client: 'Anderson Family Trust',
      type: 'Real Estate',
      status: 'on-hold',
      priority: 'low',
      assignedTo: 'Michael Chen',
      dateOpened: 'Sep 12, 2025'
    },
    {
      id: '6',
      FileNo: 'FIL-2025-023',
      caseNumber: 'CAS-2025-023',
      title: 'Parker Intellectual Property',
      client: 'Parker Technologies Inc',
      type: 'IP Law',
      status: 'closed',
      priority: 'medium',
      assignedTo: 'Sarah Mitchell',
      dateOpened: 'Mar 8, 2025'
    }
  ];

  useEffect(() => {
    setCases(initialCases);
  }, []);

  const filteredCases = cases.filter(c => {
    const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         c.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         c.caseNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         c.FileNo.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Helper functions
  const getTodayDate = () => {
    const today = new Date();
    return today.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getDefaultDeadline = () => {
    const today = new Date();
    today.setDate(today.getDate() + 30);
    return today.toISOString().split('T')[0];
  };

  const handleAddCase = () => {
    if (!newCase.title || !newCase.client || !newCase.type || !newCase.fileNo || !newCase.caseNumber) {
      alert('Please fill in all required fields (Title, Client, Type, File Number, Case Number)');
      return;
    }

    // Check if File Number already exists
    if (cases.some(c => c.FileNo === newCase.fileNo)) {
      alert(`File Number "${newCase.fileNo}" already exists. Please use a unique File Number.`);
      return;
    }

    // Check if Case Number already exists
    if (cases.some(c => c.caseNumber === newCase.caseNumber)) {
      alert(`Case Number "${newCase.caseNumber}" already exists. Please use a unique Case Number.`);
      return;
    }

    const newCaseObj: Case = {
      id: (cases.length + 1).toString(),
      FileNo: newCase.fileNo,
      caseNumber: newCase.caseNumber,
      title: newCase.title,
      client: newCase.client,
      type: newCase.type,
      status: newCase.status,
      priority: newCase.priority,
      assignedTo: newCase.assignedTo,
      dateOpened: getTodayDate(),
      nextDeadline: newCase.nextDeadline ? formatDateDisplay(newCase.nextDeadline) : undefined
    };

    setCases([...cases, newCaseObj]);
    resetNewCaseForm();
    setShowAddCaseForm(false);
    
    alert(`Case "${newCaseObj.title}" added successfully!`);
  };

  const resetNewCaseForm = () => {
    setNewCase({
      fileNo: '',
      caseNumber: '',
      title: '',
      client: '',
      type: '',
      status: 'active',
      priority: 'medium',
      assignedTo: currentUser,
      nextDeadline: getDefaultDeadline()
    });
  };

  const formatDateDisplay = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const caseTypes = [
    'Corporate Litigation',
    'Estate Planning',
    'Contract Law',
    'Insurance Claims',
    'Real Estate',
    'IP Law',
    'Family Law',
    'Criminal Defense',
    'Personal Injury',
    'Employment Law',
    'Tax Law',
    'Bankruptcy',
    'Immigration Law',
    'Environmental Law'
  ];

  const teamMembers = [
    'Sarah Mitchell',
    'Michael Chen',
    'Jennifer Lee',
    'David Wilson',
    'Emma Roberts',
    'Robert Chen',
    'Lisa Wang',
    'James Miller',
    'Alex Johnson'
  ];

  if (selectedCase) {
    return <CaseDetail case={selectedCase} onBack={() => setSelectedCase(null)} />;
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'pending': return 'warning';
      case 'on-hold': return 'secondary';
      case 'closed': return 'default';
      default: return 'default';
    }
  };

  const getPriorityVariant = (priority: string) => {
    switch (priority) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-foreground mb-1">Cases</h1>
          <p className="text-muted-foreground text-sm">Manage and track all legal cases</p>
        </div>
        <Button 
          variant="primary" 
          className="gap-2"
          onClick={() => setShowAddCaseForm(true)}
        >
          <Plus className="w-4 h-4" />
          New Case
        </Button>
      </div>

      {/* Add Case Modal */}
      {showAddCaseForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <Plus className="w-6 h-6 text-primary" />
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Add New Case</h2>
                    <p className="text-sm text-muted-foreground">Create a new case in the system</p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    setShowAddCaseForm(false);
                    resetNewCaseForm();
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Case Numbers */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* File Number */}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <FileDigit className="w-4 h-4" />
                    File Number *
                  </label>
                  <input
                    type="text"
                    value={newCase.fileNo}
                    onChange={(e) => setNewCase({...newCase, fileNo: e.target.value})}
                    className="w-full px-3 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="FIL-2026-001"
                    required
                  />
                  <p className="text-xs text-muted-foreground">Internal file reference number</p>
                </div>
                
                {/* Case Number */}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Hash className="w-4 h-4" />
                    Case Number *
                  </label>
                  <input
                    type="text"
                    value={newCase.caseNumber}
                    onChange={(e) => setNewCase({...newCase, caseNumber: e.target.value})}
                    className="w-full px-3 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="CAS-2026-001"
                    required
                  />
                  <p className="text-xs text-muted-foreground">Public-facing case identifier</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Title */}
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
                  <label className="text-sm font-medium">Status</label>
                  <select
                    value={newCase.status}
                    onChange={(e) => setNewCase({...newCase, status: e.target.value as any})}
                    className="w-full px-3 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                    <option value="on-hold">On Hold</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
                
                {/* Priority */}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Priority
                  </label>
                  <select
                    value={newCase.priority}
                    onChange={(e) => setNewCase({...newCase, priority: e.target.value as any})}
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
                  <select
                    value={newCase.assignedTo}
                    onChange={(e) => setNewCase({...newCase, assignedTo: e.target.value})}
                    className="w-full px-3 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {teamMembers.map((member) => (
                      <option key={member} value={member}>{member}</option>
                    ))}
                  </select>
                </div>
                
                {/* Next Deadline */}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <CalendarCheck className="w-4 h-4" />
                    Next Deadline
                  </label>
                  <input
                    type="date"
                    value={newCase.nextDeadline}
                    onChange={(e) => setNewCase({...newCase, nextDeadline: e.target.value})}
                    className="w-full px-3 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>

              

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowAddCaseForm(false);
                    resetNewCaseForm();
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleAddCase}
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Case
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search cases by number, title, or client..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="pl-10 pr-8 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring appearance-none cursor-pointer"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="on-hold">On Hold</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-y border-border">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Case Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Title & Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Assigned To
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Next Deadline
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredCases.map((caseItem) => (
                  <tr key={caseItem.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <span className="text-sm font-mono text-foreground">{caseItem.caseNumber}</span>
                        <p className="text-xs text-muted-foreground">{caseItem.FileNo}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-foreground">{caseItem.title}</p>
                        <p className="text-sm text-muted-foreground">{caseItem.client}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-foreground">{caseItem.type}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={getStatusVariant(caseItem.status)}>
                        {caseItem.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={getPriorityVariant(caseItem.priority)}>
                        {caseItem.priority}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-foreground">{caseItem.assignedTo}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {caseItem.nextDeadline ? (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm text-foreground">{caseItem.nextDeadline}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedCase(caseItem)}
                        className="gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {filteredCases.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No cases found matching your search criteria.</p>
          {searchQuery || statusFilter !== 'all' ? (
            <p className="text-sm text-muted-foreground mt-1">Try adjusting your search or filter</p>
          ) : (
            <Button 
              variant="outline" 
              className="mt-4 gap-2"
              onClick={() => setShowAddCaseForm(true)}
            >
              <Plus className="w-4 h-4" />
              Add Your First Case
            </Button>
          )}
        </div>
      )}
    </div>
  );
}