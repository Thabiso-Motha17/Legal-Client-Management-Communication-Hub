import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '../ui/Cards';
import { Badge } from '../ui/Badges';
import { Button } from '../ui/Buttons';
import { Search, Filter, Download, Eye, Send, Plus, X, User, Calendar, FileText } from 'lucide-react';
import { FaMoneyBillAlt } from 'react-icons/fa';

interface Invoice {
  id: string;
  invoiceNumber: string;
  client: string;
  case: string;
  caseTitle: string;
  amount: number;
  issueDate: string;
  dueDate: string;
  status: 'paid' | 'pending' | 'overdue' | 'draft';
  paidDate?: string;
  createdBy: string; // Track who created the invoice
  assignedTo: string; // Track which associate the invoice is assigned to
}

// Case interface for reference
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

export function Billing() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateInvoiceForm, setShowCreateInvoiceForm] = useState(false);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
  
  // Simulate current logged in user
  const currentUser = 'David Wilson';
  
  const [newInvoice, setNewInvoice] = useState({
    client: '',
    caseNumber: '',
    amount: '',
    description: '',
    dueDate: ''
  });

  // Mock cases data (same as in other components)
  const mockCases: Case[] = [
    {
      id: '1',
      FileNo: 'FIL-2026-001',
      caseNumber: 'CAS-2026-001',
      title: 'Johnson Estate Planning',
      client: 'John Johnson',
      type: 'Estate Planning',
      status: 'active',
      priority: 'high',
      assignedTo: 'David Wilson',
      dateOpened: 'Nov 15, 2025',
      nextDeadline: 'Jan 25, 2026'
    },
    {
      id: '2',
      FileNo: 'FIL-2026-002',
      caseNumber: 'CAS-2026-002',
      title: 'Corporate Merger - TechCo',
      client: 'TechCo Industries',
      type: 'Corporate',
      status: 'active',
      priority: 'high',
      assignedTo: 'David Wilson',
      dateOpened: 'Dec 1, 2025',
      nextDeadline: 'Feb 1, 2026'
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
      assignedTo: 'Sarah Mitchell', // Not assigned to current user
      dateOpened: 'Nov 20, 2025',
      nextDeadline: 'Jan 15, 2026'
    },
    {
      id: '4',
      FileNo: 'FIL-2025-078',
      caseNumber: 'CAS-2025-078',
      title: 'Williams Trademark Filing',
      client: 'Williams Brands Inc',
      type: 'Intellectual Property',
      status: 'active',
      priority: 'low',
      assignedTo: 'David Wilson',
      dateOpened: 'Sep 15, 2025',
      nextDeadline: 'Feb 15, 2026'
    },
    {
      id: '5',
      FileNo: 'FIL-2025-067',
      caseNumber: 'CAS-2025-067',
      title: 'Davis Employment Agreement',
      client: 'Davis Consulting',
      type: 'Employment',
      status: 'on-hold',
      priority: 'medium',
      assignedTo: 'James Miller', // Not assigned to current user
      dateOpened: 'Aug 10, 2025',
      nextDeadline: 'Mar 1, 2026'
    }
  ];

  // Initial invoices - only for cases assigned to current user
  const initialInvoices: Invoice[] = [
    {
      id: '1',
      invoiceNumber: 'INV-2026-001',
      client: 'John Johnson',
      case: 'CAS-2026-001',
      caseTitle: 'Johnson Estate Planning',
      amount: 8500,
      issueDate: 'Jan 1, 2026',
      dueDate: 'Jan 31, 2026',
      status: 'pending',
      createdBy: currentUser,
      assignedTo: currentUser
    },
    {
      id: '2',
      invoiceNumber: 'INV-2026-002',
      client: 'TechCo Industries',
      case: 'CAS-2026-002',
      caseTitle: 'Corporate Merger - TechCo',
      amount: 3200,
      issueDate: 'Jan 5, 2026',
      dueDate: 'Feb 5, 2026',
      status: 'pending',
      createdBy: currentUser,
      assignedTo: currentUser
    },
    {
      id: '3',
      invoiceNumber: 'INV-2025-078',
      client: 'Williams Brands Inc',
      case: 'CAS-2025-078',
      caseTitle: 'Williams Trademark Filing',
      amount: 12750,
      issueDate: 'Dec 15, 2025',
      dueDate: 'Jan 15, 2026',
      status: 'paid',
      paidDate: 'Dec 28, 2025',
      createdBy: currentUser,
      assignedTo: currentUser
    },
    {
      id: '4',
      invoiceNumber: 'INV-2026-003',
      client: 'John Johnson',
      case: 'CAS-2026-001',
      caseTitle: 'Johnson Estate Planning',
      amount: 5600,
      issueDate: 'Dec 1, 2025',
      dueDate: 'Jan 1, 2026',
      status: 'overdue',
      createdBy: currentUser,
      assignedTo: currentUser
    },
    {
      id: '5',
      invoiceNumber: 'DRAFT-001',
      client: 'TechCo Industries',
      case: 'CAS-2026-002',
      caseTitle: 'Corporate Merger - TechCo',
      amount: 4200,
      issueDate: 'Jan 8, 2026',
      dueDate: 'Feb 8, 2026',
      status: 'draft',
      createdBy: currentUser,
      assignedTo: currentUser
    }
  ];

  useEffect(() => {
    setCases(mockCases);
    setInvoices(initialInvoices);
  }, []);

  // Filter invoices to show only those created by current user
  const myInvoices = invoices.filter(invoice => invoice.createdBy === currentUser);

  const filteredInvoices = myInvoices.filter(invoice => {
    const matchesSearch = invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         invoice.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         invoice.case.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate statistics based on user's invoices
  const totalOutstanding = myInvoices
    .filter(inv => inv.status === 'pending' || inv.status === 'overdue')
    .reduce((sum, inv) => sum + inv.amount, 0);

  const overdueAmount = myInvoices
    .filter(inv => inv.status === 'overdue')
    .reduce((sum, inv) => sum + inv.amount, 0);

  const paidThisMonth = myInvoices
    .filter(inv => inv.status === 'paid')
    .reduce((sum, inv) => sum + inv.amount, 0);

  const pendingCount = myInvoices.filter(inv => inv.status === 'pending').length;
  const overdueCount = myInvoices.filter(inv => inv.status === 'overdue').length;
  const paidCount = myInvoices.filter(inv => inv.status === 'paid').length;

  const stats = [
    {
      label: 'Total Outstanding',
      value: `R${totalOutstanding.toLocaleString()}`,
      description: `${pendingCount} pending invoice${pendingCount !== 1 ? 's' : ''}`,
      variant: 'warning' as const
    },
    {
      label: 'Overdue Amount',
      value: `R${overdueAmount.toLocaleString()}`,
      description: `${overdueCount} overdue invoice${overdueCount !== 1 ? 's' : ''}`,
      variant: 'error' as const
    },
    {
      label: 'Paid This Month',
      value: `R${paidThisMonth.toLocaleString()}`,
      description: `${paidCount} invoice${paidCount !== 1 ? 's' : ''} paid`,
      variant: 'success' as const
    },
    {
      label: 'My Invoices',
      value: myInvoices.length.toString(),
      description: `Created by ${currentUser}`,
      variant: 'default' as const
    }
  ];

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'paid': return 'success';
      case 'pending': return 'warning';
      case 'overdue': return 'error';
      case 'draft': return 'secondary';
      default: return 'default';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'ZAR',
    }).format(amount);
  };

  const formatDate = () => {
    const today = new Date();
    return today.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const generateInvoiceNumber = () => {
    const currentYear = new Date().getFullYear();
    const maxId = invoices.reduce((max, inv) => {
      const match = inv.invoiceNumber.match(/INV-\d{4}-(\d+)/);
      return match ? Math.max(max, parseInt(match[1])) : max;
    }, 0);
    return `INV-${currentYear}-${(maxId + 1).toString().padStart(3, '0')}`;
  };

  const handleCreateInvoice = () => {
    if (!newInvoice.client || !newInvoice.caseNumber || !newInvoice.amount) {
      alert('Please fill in required fields (Client, Case, Amount)');
      return;
    }

    // Get case details
    const caseDetails = cases.find(c => c.caseNumber === newInvoice.caseNumber);
    if (!caseDetails) {
      alert('Selected case not found');
      return;
    }

    // Check if case is assigned to current user
    if (caseDetails.assignedTo !== currentUser) {
      alert('You can only create invoices for cases assigned to you');
      return;
    }

    const newInvoiceObj: Invoice = {
      id: (invoices.length + 1).toString(),
      invoiceNumber: generateInvoiceNumber(),
      client: newInvoice.client,
      case: newInvoice.caseNumber,
      caseTitle: caseDetails.title,
      amount: parseFloat(newInvoice.amount),
      issueDate: formatDate(),
      dueDate: newInvoice.dueDate || formatDefaultDueDate(),
      status: 'draft',
      createdBy: currentUser,
      assignedTo: currentUser
    };

    setInvoices([...invoices, newInvoiceObj]);
    resetNewInvoiceForm();
    setShowCreateInvoiceForm(false);
    
    alert(`Invoice "${newInvoiceObj.invoiceNumber}" created successfully!`);
  };

  const resetNewInvoiceForm = () => {
    setNewInvoice({
      client: '',
      caseNumber: '',
      amount: '',
      description: '',
      dueDate: ''
    });
  };

  const formatDefaultDueDate = () => {
    const today = new Date();
    today.setDate(today.getDate() + 30);
    return today.toISOString().split('T')[0];
  };

  // Get cases assigned to current user
  const myCases = cases.filter(c => c.assignedTo === currentUser);

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-foreground mb-1">My Billing</h1>
          <p className="text-muted-foreground text-sm">Invoices created by {currentUser} for assigned clients</p>
        </div>
        <Button 
          variant="primary" 
          className="gap-2"
          onClick={() => setShowCreateInvoiceForm(true)}
        >
          <Plus className="w-4 h-4" />
          Create Invoice
        </Button>
      </div>

      {/* Create Invoice Modal */}
      {showCreateInvoiceForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <FileText className="w-6 h-6 text-primary" />
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Create New Invoice</h2>
                    <p className="text-sm text-muted-foreground">Create invoice for your assigned cases</p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    setShowCreateInvoiceForm(false);
                    resetNewInvoiceForm();
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Client Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Client *</label>
                  <select
                    value={newInvoice.client}
                    onChange={(e) => {
                      setNewInvoice({...newInvoice, client: e.target.value});
                      // Auto-select the first case for this client
                      const clientCases = myCases.filter(c => c.client === e.target.value);
                      if (clientCases.length > 0) {
                        setNewInvoice(prev => ({...prev, caseNumber: clientCases[0].caseNumber}));
                      }
                    }}
                    className="w-full px-3 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                    required
                  >
                    <option value="">Select client...</option>
                    {Array.from(new Set(myCases.map(c => c.client))).map((client) => (
                      <option key={client} value={client}>{client}</option>
                    ))}
                  </select>
                </div>
                
                {/* Case Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Case *</label>
                  <select
                    value={newInvoice.caseNumber}
                    onChange={(e) => setNewInvoice({...newInvoice, caseNumber: e.target.value})}
                    className="w-full px-3 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                    required
                    disabled={!newInvoice.client}
                  >
                    <option value="">Select case...</option>
                    {myCases
                      .filter(c => !newInvoice.client || c.client === newInvoice.client)
                      .map((caseItem) => (
                        <option key={caseItem.id} value={caseItem.caseNumber}>
                          {caseItem.caseNumber} - {caseItem.title}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Selected Case Info */}
              {newInvoice.caseNumber && (
                <div className="p-4 bg-muted/30 rounded-lg border border-border">
                  <div className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-foreground mb-2">Case Information</h4>
                      {(() => {
                        const selectedCase = cases.find(c => c.caseNumber === newInvoice.caseNumber);
                        if (!selectedCase) return null;
                        
                        return (
                          <div className="grid grid-cols-2 gap-3 text-xs">
                            <div>
                              <p className="text-muted-foreground">Case Title</p>
                              <p className="font-medium text-foreground">{selectedCase.title}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">File Number</p>
                              <p className="font-medium text-foreground">{selectedCase.FileNo}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Case Type</p>
                              <p className="font-medium text-foreground">{selectedCase.type}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Status</p>
                              <Badge variant={
                                selectedCase.status === 'active' ? 'success' : 
                                selectedCase.status === 'on-hold' ? 'warning' : 
                                'secondary'
                              } className="text-xs">
                                {selectedCase.status}
                              </Badge>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Amount */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Amount (ZAR) *</label>
                  <div className="relative">
                    <p className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R</p>
                    <input
                      type="number"
                      value={newInvoice.amount}
                      onChange={(e) => setNewInvoice({...newInvoice, amount: e.target.value})}
                      className="w-full pl-10 pr-4 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                </div>
                
                {/* Due Date */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Due Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="date"
                      value={newInvoice.dueDate}
                      onChange={(e) => setNewInvoice({...newInvoice, dueDate: e.target.value})}
                      className="w-full pl-10 pr-4 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <textarea
                  value={newInvoice.description}
                  onChange={(e) => setNewInvoice({...newInvoice, description: e.target.value})}
                  className="w-full px-3 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring min-h-[80px]"
                  placeholder="Invoice description or notes..."
                />
              </div>

              {/* Auto-generated info */}
              <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-foreground mb-1">Invoice Information</h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <p className="text-muted-foreground">Invoice Number</p>
                        <p className="font-medium text-foreground">{generateInvoiceNumber()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Issue Date</p>
                        <p className="font-medium text-foreground">{formatDate()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Created By</p>
                        <p className="font-medium text-foreground">{currentUser}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Status</p>
                        <Badge variant="secondary" className="text-xs">Draft</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowCreateInvoiceForm(false);
                    resetNewInvoiceForm();
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateInvoice}
                  className="gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Create Invoice
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="py-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                  <p className="text-2xl font-semibold text-foreground mb-1">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.description}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <FaMoneyBillAlt className="w-5 h-5 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search my invoices..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-10 pr-8 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring appearance-none cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-y border-border">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Invoice Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Client & Case
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Issue Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredInvoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-mono font-medium text-foreground">
                        {invoice.invoiceNumber}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-foreground">{invoice.client}</p>
                        <p className="text-sm text-muted-foreground">{invoice.case} - {invoice.caseTitle}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-foreground">
                        {formatCurrency(invoice.amount)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                      {invoice.issueDate}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                      {invoice.dueDate}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={getStatusVariant(invoice.status)}>
                        {invoice.status}
                      </Badge>
                      {invoice.paidDate && (
                        <p className="text-xs text-muted-foreground mt-1">Paid {invoice.paidDate}</p>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" aria-label="View Invoice">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" aria-label="Download">
                          <Download className="w-4 h-4" />
                        </Button>
                        {invoice.status === 'pending' && (
                          <Button variant="ghost" size="sm" aria-label="Send Reminder">
                            <Send className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {filteredInvoices.length === 0 && (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No invoices found matching your criteria.</p>
          {searchQuery || statusFilter !== 'all' ? (
            <p className="text-sm text-muted-foreground mt-1">Try adjusting your search or filter</p>
          ) : (
            <Button 
              variant="outline" 
              className="mt-4 gap-2"
              onClick={() => setShowCreateInvoiceForm(true)}
            >
              <Plus className="w-4 h-4" />
              Create Your First Invoice
            </Button>
          )}
        </div>
      )}
    </div>
  );
}