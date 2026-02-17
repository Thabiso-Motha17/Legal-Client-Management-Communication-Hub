import { Card, CardContent, CardHeader, CardTitle } from '../ui/Cards';
import { Badge } from '../ui/Badges';
import { Building, Users, User, TrendingUp, ChevronUp, ChevronDown, Calendar, Loader2, HardDrive } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts';
import { useEffect, useState } from 'react';
import type { LawFirm } from '../../types/Types';
import { apiRequest } from '../lib/api';

const useToast = () => {
  const toast = (options: { title: string, description: string, variant?: string }) => {
    if (options.variant === 'destructive') {
      alert(`Error: ${options.title}\n${options.description}`);
    } else {
      alert(`Success: ${options.title}\n${options.description}`);
    }
  };
  return { toast };
};

interface MonthlyGrowthData {
  month: string;
  companies: number;
  attorneys: number;
  clients: number;
}

interface CompanyDistributionData {
  category: string;
  count: number;
  percentage: number;
}

interface ClientGrowthData {
  month: string;
  clients: number;
}

interface RecentSignup {
  id: number;
  name: string;
  type: string;
  attorneys: number;
  clients: number;
  signupDate: string;
  plan: string;
}

// New type for storage data
interface CompanyStorage {
  id: number;
  name: string;
  storageUsed: number; // in MB
  documentCount: number;
  plan: string;
}

export function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCompanies: 0,
    totalAttorneys: 0,
    totalClients: 0,
    companiesGrowth: 0,
    attorneysGrowth: 0,
    clientsGrowth: 0,
    totalStorageUsed: 0,      // MB
    totalDocuments: 0,
  });
  const [recentSignups, setRecentSignups] = useState<RecentSignup[]>([]);
  const [companyDistribution, setCompanyDistribution] = useState<CompanyDistributionData[]>([
    { category: 'Small (1-10)', count: 0, percentage: 0 },
    { category: 'Medium (11-50)', count: 0, percentage: 0 },
    { category: 'Large (51-200)', count: 0, percentage: 0 },
    { category: 'Enterprise (200+)', count: 0, percentage: 0 },
  ]);
  const [monthlyGrowthData, setMonthlyGrowthData] = useState<MonthlyGrowthData[]>([
    { month: 'Jul', companies: 45, attorneys: 320, clients: 4200 },
    { month: 'Aug', companies: 52, attorneys: 380, clients: 4800 },
    { month: 'Sep', companies: 58, attorneys: 420, clients: 5200 },
    { month: 'Oct', companies: 64, attorneys: 480, clients: 5800 },
    { month: 'Nov', companies: 70, attorneys: 520, clients: 6300 },
    { month: 'Dec', companies: 78, attorneys: 580, clients: 7000 },
    { month: 'Jan', companies: 85, attorneys: 620, clients: 7500 },
  ]);
  const [clientGrowthData, setClientGrowthData] = useState<ClientGrowthData[]>([
    { month: 'Jul', clients: 4200 },
    { month: 'Aug', clients: 4800 },
    { month: 'Sep', clients: 5200 },
    { month: 'Oct', clients: 5800 },
    { month: 'Nov', clients: 6300 },
    { month: 'Dec', clients: 7000 },
    { month: 'Jan', clients: 7500 },
  ]);

  // New state for storage data
  const [companyStorage, setCompanyStorage] = useState<CompanyStorage[]>([]);
  const [storageSummary, setStorageSummary] = useState({
    totalStorageGB: 0,
    avgStorageGB: 0,
    topConsumer: '',
    topStorageGB: 0,
  });

  const { toast } = useToast();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch law firms
      const lawFirmsResult = await apiRequest<LawFirm[]>('/api/law-firms');
      const lawFirms = lawFirmsResult.data || [];

      // Fetch users
      const usersResult = await apiRequest<any[]>('/api/users');
      const users = usersResult.data || [];

      // Calculate statistics
      const totalCompanies = lawFirms.length;
      const totalAttorneys = users.filter(u => u.role === 'admin' || u.role === 'associate').length;
      const totalClients = users.filter(u => u.role === 'client').length;

      const companiesGrowth = 12;
      const attorneysGrowth = 7;
      const clientsGrowth = 7;

      // Company distribution
      const distribution = calculateCompanyDistribution(lawFirms);
      setCompanyDistribution(distribution);

      // Recent signups
      const recentSignupsData = getRecentSignups(lawFirms);
      setRecentSignups(recentSignupsData);

      // Generate storage data (mock, replace with real API call when available)
      const storageData = generateStorageData(lawFirms);
      setCompanyStorage(storageData);

      // Calculate storage totals
      const totalStorageUsed = storageData.reduce((sum, item) => sum + item.storageUsed, 0);
      const totalDocuments = storageData.reduce((sum, item) => sum + item.documentCount, 0);
      const avgStorage = totalCompanies > 0 ? totalStorageUsed / totalCompanies : 0;
      const topCompany = storageData.reduce((max, item) => item.storageUsed > max.storageUsed ? item : max, storageData[0] || { storageUsed: 0, name: '' });

      setStats({
        totalCompanies,
        totalAttorneys,
        totalClients,
        companiesGrowth,
        attorneysGrowth,
        clientsGrowth,
        totalStorageUsed,
        totalDocuments,
      });

      setStorageSummary({
        totalStorageGB: totalStorageUsed / 1024,
        avgStorageGB: avgStorage / 1024,
        topConsumer: topCompany.name || 'N/A',
        topStorageGB: topCompany.storageUsed / 1024,
      });

      // Update chart last month with real data
      const updatedGrowthData = [...monthlyGrowthData];
      const lastIndex = updatedGrowthData.length - 1;
      updatedGrowthData[lastIndex] = {
        ...updatedGrowthData[lastIndex],
        companies: totalCompanies,
        attorneys: totalAttorneys,
        clients: totalClients,
      };
      setMonthlyGrowthData(updatedGrowthData);

      const updatedClientGrowthData = [...clientGrowthData];
      updatedClientGrowthData[updatedClientGrowthData.length - 1] = {
        ...updatedClientGrowthData[updatedClientGrowthData.length - 1],
        clients: totalClients,
      };
      setClientGrowthData(updatedClientGrowthData);

    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Helper functions (calculateCompanyDistribution, getRecentSignups, getFirmType, getPlan, formatDate, formatNumber) remain the same
  const calculateCompanyDistribution = (firms: LawFirm[]): CompanyDistributionData[] => {
    const distribution = [
      { category: 'Small (1-10)', count: 0, percentage: 0 },
      { category: 'Medium (11-50)', count: 0, percentage: 0 },
      { category: 'Large (51-200)', count: 0, percentage: 0 },
      { category: 'Enterprise (200+)', count: 0, percentage: 0 },
    ];

    firms.forEach(firm => {
      const memberCount = firm.member_count || 0;
      if (memberCount <= 10) distribution[0].count++;
      else if (memberCount <= 50) distribution[1].count++;
      else if (memberCount <= 200) distribution[2].count++;
      else distribution[3].count++;
    });

    const total = firms.length;
    distribution.forEach(item => {
      item.percentage = total > 0 ? Math.round((item.count / total) * 100) : 0;
    });

    return distribution;
  };

  const getRecentSignups = (firms: LawFirm[]): RecentSignup[] => {
    const sortedFirms = [...firms]
      .sort((a, b) => new Date(b.joined_date).getTime() - new Date(a.joined_date).getTime())
      .slice(0, 4);

    return sortedFirms.map(firm => ({
      id: firm.id,
      name: firm.name,
      type: getFirmType(firm),
      attorneys: firm.member_count || 0,
      clients: firm.case_count || 0,
      signupDate: formatDate(firm.joined_date),
      plan: getPlan(firm.member_count || 0),
    }));
  };

  const getFirmType = (firm: LawFirm): string => {
    const types = ['Corporate Law', 'Intellectual Property', 'Family Law', 'Real Estate', 'Criminal Law', 'Immigration Law'];
    return types[firm.id % types.length];
  };

  const getPlan = (memberCount: number): string => {
    if (memberCount >= 200) return 'Enterprise';
    if (memberCount >= 50) return 'Large';
    if (memberCount >= 10) return 'Professional';
    return 'Starter';
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  // New function to generate mock storage data
  const generateStorageData = (firms: LawFirm[]): CompanyStorage[] => {
    return firms
      .map(firm => ({
        id: firm.id,
        name: firm.name,
        storageUsed: Math.floor(Math.random() * 5000) + 100, // 100–5100 MB
        documentCount: Math.floor(Math.random() * 2000) + 50,
        plan: getPlan(firm.member_count || 0),
      }))
      .sort((a, b) => b.storageUsed - a.storageUsed) // descending by storage
      .slice(0, 10); // show top 10
  };

  // Stat items for top cards
  const statItems = [
    {
      title: 'Total Companies',
      value: formatNumber(stats.totalCompanies),
      change: `+${Math.round(stats.totalCompanies * 0.12)} this month`,
      icon: Building,
      trend: 'up' as const,
      percentage: `${stats.companiesGrowth}%`,
      description: 'Law firms on the platform'
    },
    {
      title: 'Total Attorneys',
      value: formatNumber(stats.totalAttorneys),
      change: `+${Math.round(stats.totalAttorneys * 0.07)} this month`,
      icon: User,
      trend: 'up' as const,
      percentage: `${stats.attorneysGrowth}%`,
      description: 'Across all companies'
    },
    {
      title: 'Total Clients',
      value: formatNumber(stats.totalClients),
      change: `+${Math.round(stats.totalClients * 0.07)} this month`,
      icon: Users,
      trend: 'up' as const,
      percentage: `${stats.clientsGrowth}%`,
      description: 'Managed by all firms'
    }
  ];

  if (loading) {
    return (
      <div className="p-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground text-sm">System overview and growth analytics</p>
        </div>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading dashboard data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground text-sm">System overview and growth analytics</p>
        </div>
        <button
          onClick={fetchDashboardData}
          className="px-4 py-2 text-sm font-medium rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-colors"
        >
          Refresh Data
        </button>
      </div>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statItems.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="hover:shadow-md transition-shadow">
              <CardContent className="py-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground">{stat.title}</p>
                        <p className="text-3xl font-bold text-foreground mt-1">{stat.value}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-4">
                      <Badge variant={stat.trend === 'up' ? 'success' : 'error'} className="gap-1">
                        {stat.trend === 'up' ? (
                          <ChevronUp className="w-3 h-3" />
                        ) : (
                          <ChevronDown className="w-3 h-3" />
                        )}
                        {stat.percentage}
                      </Badge>
                      <span className="text-sm text-muted-foreground">{stat.change}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">{stat.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Growth Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Growth Chart */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Monthly Growth Overview</CardTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>Jul 2025 - Jan 2026</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-1">System growth across key metrics</p>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyGrowthData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" className="text-muted-foreground text-xs" stroke="currentColor" />
                  <YAxis className="text-muted-foreground text-xs" stroke="currentColor" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      color: 'hsl(var(--foreground))'
                    }}
                    formatter={(value: any, name: string | undefined) => {
                      const metricNames: Record<string, string> = { companies: 'Companies', attorneys: 'Attorneys', clients: 'Clients' };
                      return [value, metricNames[name as string] || name];
                    }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="companies" name="Companies" stroke="#8B5CF6" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="attorneys" name="Attorneys" stroke="#3B82F6" strokeWidth={2} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="clients" name="Clients" stroke="#10B981" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Company Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Company Size Distribution</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Breakdown of law firms by size</p>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={companyDistribution}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="category" className="text-muted-foreground text-xs" stroke="currentColor" />
                  <YAxis className="text-muted-foreground text-xs" stroke="currentColor" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      color: 'hsl(var(--foreground))'
                    }}
                    formatter={(value: any, name: string | undefined) => {
                      if (name === 'count') return [value, 'Companies'];
                      if (name === 'percentage') return [`${value}%`, 'Percentage'];
                      return [value, name || 'Unknown'];
                    }}
                  />
                  <Legend />
                  <Bar dataKey="count" name="Number of Companies" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="percentage" name="Percentage" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Client Growth and Recent Signups */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Client Growth Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Client Growth Trend</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Total clients across all law firms</p>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={clientGrowthData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" className="text-muted-foreground text-xs" stroke="currentColor" />
                  <YAxis className="text-muted-foreground text-xs" stroke="currentColor" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      color: 'hsl(var(--foreground))'
                    }}
                  />
                  <Area type="monotone" dataKey="clients" name="Total Clients" stroke="#10B981" fill="#10B981" fillOpacity={0.2} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Recent Signups */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Company Signups</CardTitle>
              <Badge variant="default" className="gap-1">
                <TrendingUp className="w-3 h-3" />
                {stats.companiesGrowth}% growth
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">Latest law firms joining the platform</p>
          </CardHeader>
          <CardContent className="p-0">
            {recentSignups.length === 0 ? (
              <div className="p-8 text-center">
                <Building className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No recent signups</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {recentSignups.map((company) => (
                  <div key={company.id} className="px-6 py-4 hover:bg-muted/30 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Building className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{company.name}</p>
                            <p className="text-sm text-muted-foreground">{company.type}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6 text-sm">
                          <div className="flex items-center gap-1">
                            <User className="w-3.5 h-3.5 text-muted-foreground" />
                            <span className="text-foreground">{company.attorneys}</span>
                            <span className="text-muted-foreground">attorneys</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-muted-foreground" />
                            <span className="text-foreground">{company.clients}</span>
                            <span className="text-muted-foreground">clients</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="mb-2">
                          <Badge variant={company.plan === 'Enterprise' ? 'default' : company.plan === 'Large' ? 'secondary' : company.plan === 'Professional' ? 'warning' : 'default'}>
                            {company.plan}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">Joined {company.signupDate}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* NEW ROW: Storage Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Storage Usage by Company Table (span 2 columns) */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Storage Usage by Company</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Top 10 companies by document storage consumption</p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Company</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Plan</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Documents</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Storage Used</th>
                  </tr>
                </thead>
                <tbody>
                  {companyStorage.map(company => (
                    <tr key={company.id} className="border-b border-border last:border-0">
                      <td className="py-3 px-4 text-sm text-foreground">{company.name}</td>
                      <td className="py-3 px-4 text-sm">
                        <Badge variant={company.plan === 'Enterprise' ? 'default' : company.plan === 'Large' ? 'secondary' : company.plan === 'Professional' ? 'warning' : 'default'}>
                          {company.plan}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-sm text-right text-foreground">{company.documentCount.toLocaleString()}</td>
                      <td className="py-3 px-4 text-sm text-right text-foreground">
                        {company.storageUsed >= 1024
                          ? `${(company.storageUsed / 1024).toFixed(1)} GB`
                          : `${company.storageUsed} MB`}
                      </td>
                    </tr>
                  ))}
                  {companyStorage.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-muted-foreground">No storage data available</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Storage Summary Card */}
        <Card>
          <CardHeader>
            <CardTitle>Storage Overview</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Aggregated storage metrics</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <HardDrive className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{storageSummary.totalStorageGB.toFixed(1)} GB</p>
                <p className="text-sm text-muted-foreground">Total storage used</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-muted/30 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Avg per company</p>
                <p className="text-xl font-semibold text-foreground">{storageSummary.avgStorageGB.toFixed(1)} GB</p>
              </div>
              <div className="bg-muted/30 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Total documents</p>
                <p className="text-xl font-semibold text-foreground">{stats.totalDocuments.toLocaleString()}</p>
              </div>
            </div>
            <div className="border-t border-border pt-4">
              <p className="text-sm text-muted-foreground mb-2">Top consumer</p>
              <p className="font-medium text-foreground">{storageSummary.topConsumer || 'N/A'}</p>
              <p className="text-sm text-muted-foreground">{storageSummary.topStorageGB.toFixed(1)} GB used</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-4xl font-bold text-primary mb-2">{stats.totalCompanies}</p>
              <p className="text-sm text-muted-foreground">Active Companies</p>
              <div className="flex items-center justify-center gap-2 mt-2">
                <ChevronUp className="w-4 h-4 text-success" />
                <span className="text-sm text-success">{stats.companiesGrowth}% growth this month</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-4xl font-bold text-blue-500 mb-2">{stats.totalAttorneys}</p>
              <p className="text-sm text-muted-foreground">Total Attorneys</p>
              <div className="flex items-center justify-center gap-2 mt-2">
                <ChevronUp className="w-4 h-4 text-success" />
                <span className="text-sm text-success">{stats.attorneysGrowth}% growth this month</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-4xl font-bold text-emerald-500 mb-2">{formatNumber(stats.totalClients)}</p>
              <p className="text-sm text-muted-foreground">Total Clients</p>
              <div className="flex items-center justify-center gap-2 mt-2">
                <ChevronUp className="w-4 h-4 text-success" />
                <span className="text-sm text-success">{stats.clientsGrowth}% growth this month</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}