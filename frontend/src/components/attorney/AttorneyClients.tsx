import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '../ui/Cards';
import { Badge } from '../ui/Badges';
import { Button } from '../ui/Buttons';
import { 
  Search, 
  Plus, 
  Eye, 
  Mail, 
  Phone, 
  Briefcase, 
  User, 
  Building, 
  Calendar,
  UserPlus,
  X,
  Shield
} from 'lucide-react';

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
  assignedToMe: boolean;
  myCases: Array<{
    id: number;
    title: string;
    status: string;
    priority: string;
  }>;
}

export function AssociateClients() {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [clients, setClients] = useState<Client[]>([]);
  const [showAddClientForm, setShowAddClientForm] = useState(false);
  const [newClient, setNewClient] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    type: 'individual' as 'individual' | 'business',
    status: 'active' as 'active' | 'inactive'
  });
  
  const currentUser = 'David Wilson';

  const mockClients: Client[] = [
    {
      id: '1',
      name: 'John Johnson',
      email: 'john.johnson@email.com',
      phone: '(555) 123-4567',
      type: 'individual',
      activeCases: 1,
      totalCases: 1,
      status: 'active',
      joinedDate: 'Nov 15, 2025',
      lastContact: '2 hours ago',
      assignedToMe: true,
      myCases: [
        {
          id: 1,
          title: 'Johnson Estate Planning',
          status: 'Active',
          priority: 'high'
        }
      ]
    },
    {
      id: '2',
      name: 'TechCo Industries',
      email: 'legal@techco.com',
      phone: '(555) 234-5678',
      company: 'TechCo Industries',
      type: 'business',
      activeCases: 1,
      totalCases: 1,
      status: 'active',
      joinedDate: 'Dec 1, 2025',
      lastContact: '1 day ago',
      assignedToMe: true,
      myCases: [
        {
          id: 2,
          title: 'Corporate Merger - TechCo',
          status: 'Active',
          priority: 'high'
        }
      ]
    },
    {
      id: '3',
      name: 'Williams Brands Inc',
      email: 'contact@williamsbrands.com',
      phone: '(555) 345-6789',
      company: 'Williams Brands Inc',
      type: 'business',
      activeCases: 1,
      totalCases: 2,
      status: 'active',
      joinedDate: 'Sep 15, 2025',
      lastContact: '3 days ago',
      assignedToMe: true,
      myCases: [
        {
          id: 4,
          title: 'Williams Trademark Filing',
          status: 'Active',
          priority: 'low'
        }
      ]
    }
  ];

  useEffect(() => {
    setClients(mockClients);
  }, []);

  const myAssignedClients = clients.filter(client => client.assignedToMe);

  const filteredClients = myAssignedClients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (client.company && client.company.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = typeFilter === 'all' || client.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const totalAssignedClients = myAssignedClients.length;
  const activeAssignedCases = myAssignedClients.reduce((sum, client) => sum + client.activeCases, 0);
  const individualClients = myAssignedClients.filter(c => c.type === 'individual').length;
  const businessClients = myAssignedClients.filter(c => c.type === 'business').length;

  const formatDate = () => {
    const today = new Date();
    return today.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleAddClient = () => {
    if (!newClient.name || !newClient.email) {
      alert('Please fill in required fields (Name and Email)');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newClient.email)) {
      alert('Please enter a valid email address');
      return;
    }

    // If type is business, require company name
    if (newClient.type === 'business' && !newClient.company.trim()) {
      alert('Company name is required for business clients');
      return;
    }

    const newClientObj: Client = {
      id: (clients.length + 1).toString(),
      name: newClient.name,
      email: newClient.email,
      phone: newClient.phone || 'Not provided',
      company: newClient.type === 'business' ? newClient.company : undefined,
      type: newClient.type,
      activeCases: 0,
      totalCases: 0,
      status: newClient.status,
      joinedDate: formatDate(),
      lastContact: 'Just now',
      assignedToMe: true, // Automatically assigned to current user
      myCases: [] // Start with no cases
    };

    setClients([...clients, newClientObj]);
    
    // Reset form
    setNewClient({
      name: '',
      email: '',
      phone: '',
      company: '',
      type: 'individual',
      status: 'active'
    });
    
    setShowAddClientForm(false);
    
    // Show success message
    alert(`Client "${newClientObj.name}" added successfully!`);
  };

  const resetForm = () => {
    setNewClient({
      name: '',
      email: '',
      phone: '',
      company: '',
      type: 'individual',
      status: 'active'
    });
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Header with stats */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-foreground mb-1">My Clients</h1>
          <p className="text-muted-foreground text-sm">Clients with cases assigned to you ({currentUser})</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="default" className="gap-1">
            <User className="w-3 h-3" />
            {totalAssignedClients} Clients
          </Badge>
          <Button 
            variant="primary" 
            className="gap-2"
            onClick={() => setShowAddClientForm(true)}
          >
            <Plus className="w-4 h-4" />
            Add Client
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-1">Total Assigned Clients</p>
            <p className="text-2xl font-semibold text-foreground">{totalAssignedClients}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-1">Active Cases</p>
            <p className="text-2xl font-semibold text-foreground">{activeAssignedCases}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-1">Individual Clients</p>
            <p className="text-2xl font-semibold text-foreground">{individualClients}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-1">Business Clients</p>
            <p className="text-2xl font-semibold text-foreground">{businessClients}</p>
          </CardContent>
        </Card>
      </div>

      {/* Add Client Modal */}
      {showAddClientForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <UserPlus className="w-6 h-6 text-primary" />
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Add New Client</h2>
                    <p className="text-sm text-muted-foreground">This client will be automatically assigned to you</p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    setShowAddClientForm(false);
                    resetForm();
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Client Type Selection */}
              <div>
                <label className="text-sm font-medium mb-3 block">Client Type *</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setNewClient({...newClient, type: 'individual'})}
                    className={`p-4 border rounded-lg text-left transition-all ${
                      newClient.type === 'individual'
                        ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                        : 'border-border hover:border-primary/30'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-medium text-foreground">Individual</h4>
                        <p className="text-xs text-muted-foreground">Single person client</p>
                      </div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewClient({...newClient, type: 'business'})}
                    className={`p-4 border rounded-lg text-left transition-all ${
                      newClient.type === 'business'
                        ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                        : 'border-border hover:border-primary/30'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Building className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-medium text-foreground">Business</h4>
                        <p className="text-xs text-muted-foreground">Company or organization</p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Client Information */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Name */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Full Name *</label>
                    <input
                      type="text"
                      value={newClient.name}
                      onChange={(e) => setNewClient({...newClient, name: e.target.value})}
                      className="w-full px-3 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder="John Smith"
                      required
                    />
                  </div>
                  
                  {/* Email */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email Address *</label>
                    <input
                      type="email"
                      value={newClient.email}
                      onChange={(e) => setNewClient({...newClient, email: e.target.value})}
                      className="w-full px-3 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder="john@example.com"
                      required
                    />
                  </div>
                </div>

                {/* Company (only for business) */}
                {newClient.type === 'business' && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Company Name *</label>
                    <input
                      type="text"
                      value={newClient.company}
                      onChange={(e) => setNewClient({...newClient, company: e.target.value})}
                      className="w-full px-3 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder="ABC Corporation"
                      required
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Phone */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Phone Number</label>
                    <input
                      type="tel"
                      value={newClient.phone}
                      onChange={(e) => setNewClient({...newClient, phone: e.target.value})}
                      className="w-full px-3 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder="(555) 123-4567"
                    />
                  </div>
                  
                  {/* Status */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Status</label>
                    <select
                      value={newClient.status}
                      onChange={(e) => setNewClient({...newClient, status: e.target.value as 'active' | 'inactive'})}
                      className="w-full px-3 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Assignment Info */}
              <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-foreground mb-1">Automatically Assigned to You</h4>
                    <p className="text-xs text-muted-foreground">
                      This client will be automatically assigned to <span className="font-medium">{currentUser}</span>. 
                      You can create cases for this client from the Cases section.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowAddClientForm(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleAddClient}
                  className="gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  Add Client
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search my clients by name, email, or company..."
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
                All
              </button>
              <button
                onClick={() => setTypeFilter('individual')}
                className={`px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 ${
                  typeFilter === 'individual'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                <User className="w-4 h-4" />
                Individual
              </button>
              <button
                onClick={() => setTypeFilter('business')}
                className={`px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 ${
                  typeFilter === 'business'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                <Building className="w-4 h-4" />
                Business
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredClients.length === 0 ? (
            <div className="text-center py-12">
              <User className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No clients with cases assigned to you.</p>
              {searchQuery || typeFilter !== 'all' ? (
                <p className="text-sm text-muted-foreground mt-1">Try adjusting your search or filter</p>
              ) : (
                <Button 
                  variant="outline" 
                  className="mt-4 gap-2"
                  onClick={() => setShowAddClientForm(true)}
                >
                  <Plus className="w-4 h-4" />
                  Add Your First Client
                </Button>
              )}
            </div>
          ) : (
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
                            ) : client.status === 'inactive' ? (
                              <Badge variant="warning">On Hold</Badge>
                            ) : (
                              <Badge variant="secondary">Inactive</Badge>
                            )}
                            <Badge variant="default" className="text-xs">
                              {client.myCases.length} case{client.myCases.length !== 1 ? 's' : ''} assigned
                            </Badge>
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

                    {client.myCases.length > 0 && (
                      <div className="mb-4 pt-3 border-t border-border">
                        <h5 className="text-sm font-medium text-foreground mb-2">Cases assigned to you:</h5>
                        <div className="space-y-2">
                          {client.myCases.map((caseItem) => (
                            <div key={caseItem.id} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                              <div className="flex-1">
                                <p className="text-sm text-foreground">{caseItem.title}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant={
                                    caseItem.status === 'Active' ? 'success' : 
                                    caseItem.status === 'On Hold' ? 'warning' : 
                                    'secondary'
                                  } className="text-xs">
                                    {caseItem.status}
                                  </Badge>
                                  <Badge variant={
                                    caseItem.priority === 'high' ? 'error' : 
                                    caseItem.priority === 'medium' ? 'warning' : 
                                    'success'
                                  } className="text-xs">
                                    {caseItem.priority} priority
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

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
                        <p className="text-sm text-foreground flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {client.joinedDate}
                        </p>
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
          )}
        </CardContent>
      </Card>

      {filteredClients.length > 0 && (
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Showing {filteredClients.length} client{filteredClients.length !== 1 ? 's' : ''} with cases assigned to {currentUser}
          </p>
        </div>
      )}
    </div>
  );
}