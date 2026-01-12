import { useState } from 'react';
import { Card, CardContent, CardHeader} from '../ui/Cards';
import { Badge } from '../ui/Badges';
import { Button } from '../ui/Buttons';
import { Search, Plus, Eye, Mail, Phone, Briefcase, User } from 'lucide-react';

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  company?: string;
  type: 'individual' | 'business';
  activeCases: number;
  totalCases: number;
  status: 'active' | 'inactive';
  joinedDate: string;
  lastContact: string;
}

const mockClients: Client[] = [
  {
    id: '1',
    name: 'James Henderson',
    email: 'james.henderson@email.com',
    phone: '(555) 123-4567',
    type: 'individual',
    activeCases: 1,
    totalCases: 1,
    status: 'active',
    joinedDate: 'Dec 15, 2025',
    lastContact: '2 hours ago'
  },
  {
    id: '2',
    name: 'Maria Martinez',
    email: 'maria.martinez@email.com',
    phone: '(555) 234-5678',
    type: 'individual',
    activeCases: 1,
    totalCases: 1,
    status: 'active',
    joinedDate: 'Jan 2, 2026',
    lastContact: '1 day ago'
  },
  {
    id: '3',
    name: 'Thompson Industries LLC',
    email: 'legal@thompsonind.com',
    phone: '(555) 345-6789',
    company: 'Thompson Industries',
    type: 'business',
    activeCases: 1,
    totalCases: 3,
    status: 'active',
    joinedDate: 'Mar 10, 2025',
    lastContact: '3 days ago'
  },
  {
    id: '4',
    name: 'Robert Wilson',
    email: 'r.wilson@email.com',
    phone: '(555) 456-7890',
    type: 'individual',
    activeCases: 1,
    totalCases: 2,
    status: 'active',
    joinedDate: 'Oct 5, 2025',
    lastContact: '2 days ago'
  },
  {
    id: '5',
    name: 'Anderson Family Trust',
    email: 'anderson.trust@email.com',
    phone: '(555) 567-8901',
    company: 'Anderson Family Trust',
    type: 'business',
    activeCases: 0,
    totalCases: 2,
    status: 'active',
    joinedDate: 'Sep 12, 2025',
    lastContact: '1 week ago'
  },
  {
    id: '6',
    name: 'Parker Technologies Inc',
    email: 'legal@parkertech.com',
    phone: '(555) 678-9012',
    company: 'Parker Technologies',
    type: 'business',
    activeCases: 0,
    totalCases: 1,
    status: 'inactive',
    joinedDate: 'Mar 8, 2025',
    lastContact: '3 months ago'
  }
];

export function Clients() {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const filteredClients = mockClients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         client.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || client.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-foreground mb-1">Clients</h1>
          <p className="text-muted-foreground text-sm">Manage client relationships and information</p>
        </div>
        <Button variant="primary" className="gap-2">
          <Plus className="w-4 h-4" />
          Add Client
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search clients by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setTypeFilter('all')}
                className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                  typeFilter === 'all'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                All Clients
              </button>
              <button
                onClick={() => setTypeFilter('individual')}
                className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                  typeFilter === 'individual'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                Individual
              </button>
              <button
                onClick={() => setTypeFilter('business')}
                className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                  typeFilter === 'business'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                Business
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-border">
            {filteredClients.map((client) => (
              <Card key={client.id} className="border-0 rounded-none">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-lg font-medium text-primary flex-shrink-0">
                        {client.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <h4 className="text-foreground mb-1">{client.name}</h4>
                        <div className="flex items-center gap-2">
                          <Badge variant={client.type === 'business' ? 'secondary' : 'default'}>
                            {client.type === 'business' ? 'Business' : 'Individual'}
                          </Badge>
                          {client.status === 'active' ? (
                            <Badge variant="success">Active</Badge>
                          ) : (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="gap-2">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <a href={`mailto:${client.email}`} className="text-foreground hover:text-accent">
                        {client.email}
                      </a>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span className="text-foreground">{client.phone}</span>
                    </div>
                    {client.company && (
                      <div className="flex items-center gap-2 text-sm">
                        <Briefcase className="w-4 h-4 text-muted-foreground" />
                        <span className="text-foreground">{client.company}</span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Active Cases</p>
                      <p className="text-lg font-semibold text-foreground">{client.activeCases}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Total Cases</p>
                      <p className="text-lg font-semibold text-foreground">{client.totalCases}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Client Since</p>
                      <p className="text-sm text-foreground">{client.joinedDate}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Last Contact</p>
                      <p className="text-sm text-foreground">{client.lastContact}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {filteredClients.length === 0 && (
        <div className="text-center py-12">
          <User className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No clients found matching your search criteria.</p>
        </div>
      )}
    </div>
  );
}
