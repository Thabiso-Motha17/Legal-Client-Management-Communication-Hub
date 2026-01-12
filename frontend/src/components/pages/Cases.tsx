import { useState } from 'react';
import { Card, CardContent, CardHeader } from '../ui/Cards';
import { Badge } from '../ui/Badges';
import { Button } from '../ui/Buttons';
import { Search, Filter, Eye, Plus, Calendar, User } from 'lucide-react';
import { CaseDetail } from './CaseDetail';

interface Case {
  id: string;
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

const mockCases: Case[] = [
  {
    id: '1',
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

export function Cases() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);

  const filteredCases = mockCases.filter(c => {
    const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         c.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         c.caseNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
        <Button variant="primary" className="gap-2">
          <Plus className="w-4 h-4" />
          New Case
        </Button>
      </div>

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
                      <span className="text-sm font-mono text-foreground">{caseItem.caseNumber}</span>
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
        </div>
      )}
    </div>
  );
}
