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
  Shield,
  Users,
  Folder,
  Eye as EyeIcon,
  Building as BuildingIcon
} from 'lucide-react';
import type { Client, CreateClientData, Case } from '../../types/Types';
import { apiRequest } from '../lib/api';

export function AssociateClients() {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'my-clients' | 'all-clients'>('my-clients');
  const [clients, setClients] = useState<Client[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddClientForm, setShowAddClientForm] = useState(false);
  const [newClient, setNewClient] = useState<CreateClientData>({
    name: '',
    email: '',
    phone: '',
    company: '',
    client_type: 'individual',
    assigned_associate_id: 0,
    user_account_id: undefined
  });
  
  // Get current user from localStorage
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Fetch current user and initial data
  useEffect(() => {
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchData();
    }
  }, [currentUser, viewMode]);

  const fetchCurrentUser = async () => {
    try {
      const response = await apiRequest<{ user: any }>(`/api/auth/me`);
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
      
      // Fetch clients based on view mode
      let clientsUrl = '/api/clients';
      if (viewMode === 'my-clients') {
        clientsUrl += `?assigned_to=${currentUser.id}`;
      }
      
      const clientsResponse = await apiRequest<Client[]>(clientsUrl);
      if (clientsResponse.data) {
        setClients(clientsResponse.data);
      } else if (clientsResponse.error) {
        console.error('Error fetching clients:', clientsResponse.error);
      }
      
      // Fetch cases for the current user
      const casesResponse = await apiRequest<Case[]>(`/api/cases`);
      if (casesResponse.data) {
        setCases(casesResponse.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCasesForClient = (clientId: number) => {
    return cases.filter(c => c.client_id === clientId);
  };

  const getActiveCasesForClient = (clientId: number) => {
    return getCasesForClient(clientId).filter(c => c.status === 'Active').length;
  };

  // Get my clients count (clients assigned to current user)
  const myClients = clients.filter(client => 
    client.assigned_associate_id === currentUser?.id
  );

  const filteredClients = clients.filter(client => {
    const matchesSearch = 
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (client.company && client.company.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesType = typeFilter === 'all' || client.client_type === typeFilter;
    
    return matchesSearch && matchesType;
  });

  // Calculate statistics based on view mode
  const totalClients = viewMode === 'my-clients' ? myClients.length : clients.length;
  const activeAssignedCases = clients.reduce((sum, client) => 
    sum + getActiveCasesForClient(client.id), 0
  );
  const individualClients = clients.filter(c => c.client_type === 'individual').length;
  const businessClients = clients.filter(c => c.client_type === 'business').length;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatRelativeTime = (dateString: string) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  const handleAddClient = async () => {
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
    if (newClient.client_type === 'business' && !newClient.company) {
      alert('Company name is required for business clients');
      return;
    }

    try {
      const clientData: CreateClientData = {
        name: newClient.name,
        email: newClient.email,
        phone: newClient.phone || '',
        company: newClient.company || '',
        client_type: newClient.client_type,
        assigned_associate_id: currentUser.id,
        user_account_id: newClient.user_account_id
      };

      const response = await apiRequest<Client>(`/api/clients`, {
        method: 'POST',
        body: JSON.stringify(clientData),
      });

      if (response.data) {
        setClients([...clients, response.data]);
        resetForm();
        setShowAddClientForm(false);
        fetchData();
        alert(`Client "${response.data.name}" added successfully and assigned to you!`);
      } else if (response.error) {
        alert(`Error adding client: ${response.error}`);
      }
    } catch (error) {
      console.error('Error adding client:', error);
      alert('Failed to add client. Please try again.');
    }
  };

  const resetForm = () => {
    setNewClient({
      name: '',
      email: '',
      phone: '',
      company: '',
      client_type: 'individual',
      assigned_associate_id: currentUser?.id || 0,
      user_account_id: undefined
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  if (loading || !currentUser) {
    return (
      <div className="p-6 md:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-foreground mb-1">Clients</h1>
            <p className="text-muted-foreground text-sm">Loading clients...</p>
          </div>
        </div>
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading clients...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Header with stats */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-foreground mb-1">Clients</h1>
          <p className="text-muted-foreground text-sm">
            {viewMode === 'my-clients' 
              ? `Clients assigned to you (${currentUser.full_name})`
              : 'All clients in the company'
            }
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-1">
            <Button
              variant={viewMode === 'my-clients' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('my-clients')}
              className="gap-2"
            >
              <EyeIcon className="w-4 h-4" />
              My Clients
            </Button>
            <Button
              variant={viewMode === 'all-clients' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('all-clients')}
              className="gap-2"
            >
              <BuildingIcon className="w-4 h-4" />
              All Clients
            </Button>
          </div>
          <Badge variant="default" className="gap-1">
            <Users className="w-3 h-3" />
            {viewMode === 'my-clients' ? myClients.length : clients.length} Clients
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
            <p className="text-sm text-muted-foreground mb-1">
              {viewMode === 'my-clients' ? 'My Clients' : 'Total Clients'}
            </p>
            <p className="text-2xl font-semibold text-foreground">{totalClients}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-1">
              {viewMode === 'my-clients' ? 'My Active Cases' : 'Active Cases'}
            </p>
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
                    onClick={() => setNewClient({...newClient, client_type: 'individual'})}
                    className={`p-4 border rounded-lg text-left transition-all ${
                      newClient.client_type === 'individual'
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
                    onClick={() => setNewClient({...newClient, client_type: 'business'})}
                    className={`p-4 border rounded-lg text-left transition-all ${
                      newClient.client_type === 'business'
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
                {newClient.client_type === 'business' && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Company Name *</label>
                    <input
                      type="text"
                      value={newClient.company || ''}
                      onChange={(e) => setNewClient({...newClient, company: e.target.value})}
                      className="w-full px-3 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder="ABC Corporation"
                      required
                    />
                  </div>
                )}

                {/* Phone */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Phone Number</label>
                  <input
                    type="tel"
                    value={newClient.phone || ''}
                    onChange={(e) => setNewClient({...newClient, phone: e.target.value})}
                    className="w-full px-3 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>

              {/* Assignment Info */}
              <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-foreground mb-1">Automatically Assigned to You</h4>
                    <p className="text-xs text-muted-foreground">
                      This client will be automatically assigned to <span className="font-medium">{currentUser.full_name}</span>. 
                      You will be their primary point of contact and can manage all their cases.
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
                placeholder={`Search ${viewMode === 'my-clients' ? 'my' : 'all'} clients by name, email, or company...`}
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
          <div className="mt-3 flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">View:</span>
              <Badge variant="default">
                {viewMode === 'my-clients' ? 'My Clients Only' : 'All Company Clients'}
              </Badge>
            </div>
            <div className="text-muted-foreground">
              Showing {filteredClients.length} of {viewMode === 'my-clients' ? myClients.length : clients.length} clients
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredClients.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground mb-2">
                {viewMode === 'my-clients' ? 'No clients assigned to you.' : 'No clients found in the company.'}
              </p>
              {searchQuery || typeFilter !== 'all' ? (
                <p className="text-sm text-muted-foreground">Try adjusting your search or filter</p>
              ) : viewMode === 'my-clients' ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Start by adding your first client. They will be automatically assigned to you.
                  </p>
                  <Button 
                    variant="outline" 
                    className="gap-2"
                    onClick={() => setShowAddClientForm(true)}
                  >
                    <Plus className="w-4 h-4" />
                    Add Your First Client
                  </Button>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-border">
              {filteredClients.map((client) => {
                const clientCases = getCasesForClient(client.id);
                const activeCases = getActiveCasesForClient(client.id);
                const isMyClient = client.assigned_associate_id === currentUser.id;
                
                return (
                  <Card key={client.id} className="border-0 rounded-none">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start gap-3">
                          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-lg font-medium text-primary flex-shrink-0">
                            {getInitials(client.name)}
                          </div>
                          <div>
                            <h4 className="text-foreground mb-1">{client.name}</h4>
                            <div className="flex items-center gap-2">
                              <Badge variant={client.client_type === 'business' ? 'secondary' : 'default'}>
                                {client.client_type === 'business' ? 'Business' : 'Individual'}
                              </Badge>
                              <Badge variant={client.status === 'active' ? 'success' : 'warning'}>
                                {client.status === 'active' ? 'Active' : 'Inactive'}
                              </Badge>
                              {isMyClient && (
                                <Badge variant="default" className="text-xs gap-1">
                                  <User className="w-3 h-3" />
                                  Your Client
                                </Badge>
                              )}
                              {clientCases.length > 0 && (
                                <Badge variant="default" className="text-xs gap-1">
                                  <Folder className="w-3 h-3" />
                                  {clientCases.length} case{clientCases.length !== 1 ? 's' : ''}
                                </Badge>
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
                          <a href={`mailto:${client.email}`} className="text-foreground hover:text-primary">
                            {client.email}
                          </a>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          <span className="text-foreground">{client.phone || 'Not provided'}</span>
                        </div>
                        {client.company && (
                          <div className="flex items-center gap-2 text-sm">
                            <Briefcase className="w-4 h-4 text-muted-foreground" />
                            <span className="text-foreground">{client.company}</span>
                          </div>
                        )}
                        {client.assigned_associate_name && (
                          <div className="flex items-center gap-2 text-sm">
                            <Users className="w-4 h-4 text-muted-foreground" />
                            <span className="text-foreground">
                              Assigned to: {client.assigned_associate_name}
                              {isMyClient && ' (You)'}
                            </span>
                          </div>
                        )}
                      </div>

                      {clientCases.length > 0 && (
                        <div className="mb-4 pt-3 border-t border-border">
                          <h5 className="text-sm font-medium text-foreground mb-2">Client's Cases:</h5>
                          <div className="space-y-2">
                            {clientCases.slice(0, 3).map((caseItem) => (
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
                                      {caseItem.priority}
                                    </Badge>
                                    {caseItem.assigned_to_user_id === currentUser.id && (
                                      <Badge variant="default" className="text-xs">
                                        Your case
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                            {clientCases.length > 3 && (
                              <p className="text-xs text-muted-foreground text-center mt-2">
                                +{clientCases.length - 3} more cases
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Active Cases</p>
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${activeCases > 0 ? 'bg-green-500' : 'bg-gray-300'}`} />
                            <p className="text-lg font-semibold text-foreground">
                              {activeCases}
                            </p>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Total Cases</p>
                          <p className="text-lg font-semibold text-foreground">
                            {clientCases.length}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Client Since</p>
                          <p className="text-sm text-foreground flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(client.joined_date)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Last Updated</p>
                          <p className="text-sm text-foreground">
                            {client.updated_at ? formatRelativeTime(client.updated_at) : 'Never'}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {filteredClients.length > 0 && (
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Showing {filteredClients.length} client{filteredClients.length !== 1 ? 's' : ''} 
            {viewMode === 'my-clients' ? ` assigned to ${currentUser.full_name}` : ' in the company'}
          </p>
        </div>
      )}
    </div>
  );
}