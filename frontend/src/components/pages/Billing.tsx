import { useState } from 'react';
import { Card, CardContent, CardHeader } from '../ui/Cards';
import { Badge } from '../ui/Badges';
import { Button } from '../ui/Buttons';
import { Search, Filter, Download, Eye, Send, Plus } from 'lucide-react';
import { FaMoneyBillAlt } from 'react-icons/fa';

interface Invoice {
  id: string;
  invoiceNumber: string;
  client: string;
  case: string;
  amount: number;
  issueDate: string;
  dueDate: string;
  status: 'paid' | 'pending' | 'overdue' | 'draft';
  paidDate?: string;
}

const mockInvoices: Invoice[] = [
  {
    id: '1',
    invoiceNumber: 'INV-2026-001',
    client: 'James Henderson',
    case: 'CAS-2026-001',
    amount: 8500,
    issueDate: 'Jan 1, 2026',
    dueDate: 'Jan 31, 2026',
    status: 'pending'
  },
  {
    id: '2',
    invoiceNumber: 'INV-2026-002',
    client: 'Maria Martinez',
    case: 'CAS-2026-002',
    amount: 3200,
    issueDate: 'Jan 5, 2026',
    dueDate: 'Feb 5, 2026',
    status: 'pending'
  },
  {
    id: '3',
    invoiceNumber: 'INV-2025-089',
    client: 'Thompson Industries LLC',
    case: 'CAS-2025-089',
    amount: 12750,
    issueDate: 'Dec 15, 2025',
    dueDate: 'Jan 15, 2026',
    status: 'paid',
    paidDate: 'Dec 28, 2025'
  },
  {
    id: '4',
    invoiceNumber: 'INV-2025-078',
    client: 'Robert Wilson',
    case: 'CAS-2025-078',
    amount: 5600,
    issueDate: 'Dec 1, 2025',
    dueDate: 'Jan 1, 2026',
    status: 'overdue'
  },
  {
    id: '5',
    invoiceNumber: 'INV-2025-067',
    client: 'Anderson Family Trust',
    case: 'CAS-2025-067',
    amount: 4200,
    issueDate: 'Nov 20, 2025',
    dueDate: 'Dec 20, 2025',
    status: 'paid',
    paidDate: 'Dec 18, 2025'
  },
  {
    id: '6',
    invoiceNumber: 'DRAFT-001',
    client: 'Parker Technologies Inc',
    case: 'CAS-2025-023',
    amount: 9800,
    issueDate: 'Jan 8, 2026',
    dueDate: 'Feb 8, 2026',
    status: 'draft'
  }
];

const stats = [
  {
    label: 'Total Outstanding',
    value: 'R42,750',
    description: '5 pending invoices',
    variant: 'warning' as const
  },
  {
    label: 'Overdue Amount',
    value: 'R5,600',
    description: '1 overdue invoice',
    variant: 'error' as const
  },
  {
    label: 'Paid This Month',
    value: 'R16,950',
    description: '2 invoices paid',
    variant: 'success' as const
  },
  {
    label: 'Average Payment Time',
    value: '18 days',
    description: 'Last 30 days',
    variant: 'default' as const
  }
];

export function Billing() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredInvoices = mockInvoices.filter(invoice => {
    const matchesSearch = invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         invoice.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         invoice.case.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-foreground mb-1">Billing & Payments</h1>
          <p className="text-muted-foreground text-sm">Track invoices and payment status</p>
        </div>
        <Button variant="primary" className="gap-2">
          <Plus className="w-4 h-4" />
          Create Invoice
        </Button>
      </div>

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
                placeholder="Search invoices..."
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
                        <p className="text-sm text-muted-foreground">{invoice.case}</p>
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
          <p className="text-muted-foreground">No invoices found matching your search criteria.</p>
        </div>
      )}
    </div>
  );
}
