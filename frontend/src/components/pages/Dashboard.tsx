import { Card, CardContent, CardHeader, CardTitle } from '../ui/Cards';
import { Badge } from '../ui/Badges';
import { Building, Users, TrendingUp, ChevronUp, ChevronDown, Calendar, Loader2, HardDrive } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { useEffect, useState } from 'react';
import type { LawFirm, User, Document } from '../../types/Types';
import { apiRequest } from '../lib/api';

interface MonthlyGrowthData {
  month: string;
  companies: number;
  attorneys: number;
}

interface CompanyDistributionData {
  category: string;
  count: number;
  percentage: number;
}

interface RecentSignup {
  id: number;
  name: string;
  type: string;
  attorneys: number;
  signupDate: string;
  plan: string;
}

interface CompanyStorage {
  id: number;
  name: string;
  storageUsed: number; // MB
  documentCount: number;
  plan: string;
}

export function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCompanies: 0,
    totalAttorneys: 0,
    companiesGrowth: 0,
    attorneysGrowth: 0,
    totalStorageUsed: 0,
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
    { month: 'Jul', companies: 45, attorneys: 320 },
    { month: 'Aug', companies: 52, attorneys: 380 },
    { month: 'Sep', companies: 58, attorneys: 420 },
    { month: 'Oct', companies: 64, attorneys: 480 },
    { month: 'Nov', companies: 70, attorneys: 520 },
    { month: 'Dec', companies: 78, attorneys: 580 },
    { month: 'Jan', companies: 85, attorneys: 620 },
  ]);

  const [companyStorage, setCompanyStorage] = useState<CompanyStorage[]>([]);
  const [storageSummary, setStorageSummary] = useState({
    totalStorageGB: 0,
    avgStorageGB: 0,
    topConsumer: '',
    topStorageGB: 0,
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch all law firms
      const lawFirmsRes = await apiRequest<LawFirm[]>('/api/law-firms');
      const lawFirms = lawFirmsRes.data || [];

      // Fetch all users
      const usersRes = await apiRequest<User[]>('/api/users');
      const users = usersRes.data || [];

      // Fetch all documents
      const documentsRes = await apiRequest<Document[]>('/api/documents');
      const documents = documentsRes.data || [];

      // ---- Basic counts ----
      const totalCompanies = lawFirms.length;
      const totalAttorneys = users.filter(u => u.role === 'admin' || u.role === 'associate').length;

      // ---- Growth calculations (based on last 30 days) ----
      const now = new Date();
      const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));

      const newCompanies = lawFirms.filter(f => new Date(f.joined_date) >= thirtyDaysAgo).length;
      const newAttorneys = users.filter(u => (u.role === 'admin' || u.role === 'associate') && new Date(u.created_at) >= thirtyDaysAgo).length;

      const companiesGrowth = totalCompanies ? Math.round((newCompanies / totalCompanies) * 100) : 0;
      const attorneysGrowth = totalAttorneys ? Math.round((newAttorneys / totalAttorneys) * 100) : 0;

      // ---- Company distribution by attorney count ----
      const attorneysPerFirm = new Map<number, number>();
      users.forEach(u => {
        if ((u.role === 'admin' || u.role === 'associate') && u.law_firm_id) {
          attorneysPerFirm.set(u.law_firm_id, (attorneysPerFirm.get(u.law_firm_id) || 0) + 1);
        }
      });

      const distribution = [
        { category: 'Small (1-10)', count: 0, percentage: 0 },
        { category: 'Medium (11-50)', count: 0, percentage: 0 },
        { category: 'Large (51-200)', count: 0, percentage: 0 },
        { category: 'Enterprise (200+)', count: 0, percentage: 0 },
      ];

      lawFirms.forEach(firm => {
        const count = attorneysPerFirm.get(firm.id) || firm.member_count || 0;
        if (count <= 10) distribution[0].count++;
        else if (count <= 50) distribution[1].count++;
        else if (count <= 200) distribution[2].count++;
        else distribution[3].count++;
      });

      const total = lawFirms.length;
      distribution.forEach(item => {
        item.percentage = total > 0 ? Math.round((item.count / total) * 100) : 0;
      });
      setCompanyDistribution(distribution);

      // ---- Recent signups ----
      const recent = lawFirms
        .sort((a, b) => new Date(b.joined_date).getTime() - new Date(a.joined_date).getTime())
        .slice(0, 4)
        .map(firm => {
          const attorneyCount = attorneysPerFirm.get(firm.id) || firm.member_count || 0;
          const plan = getPlan(attorneyCount);
          return {
            id: firm.id,
            name: firm.name,
            type: getFirmType(firm),
            attorneys: attorneyCount,
            signupDate: formatDate(firm.joined_date),
            plan,
          };
        });
      setRecentSignups(recent);

      // ---- Storage data from documents ----
      const storagePerFirm = new Map<number, { storageUsed: number; documentCount: number }>();
      documents.forEach(doc => {
        if (!doc.law_firm_id) return;
        const current = storagePerFirm.get(doc.law_firm_id) || { storageUsed: 0, documentCount: 0 };
        const fileSizeMB = (doc.file_size || 0) / (1024 * 1024);
        storagePerFirm.set(doc.law_firm_id, {
          storageUsed: current.storageUsed + fileSizeMB,
          documentCount: current.documentCount + 1,
        });
      });

      const firmStorage: CompanyStorage[] = [];
      storagePerFirm.forEach((value, lawFirmId) => {
        const firm = lawFirms.find(f => f.id === lawFirmId);
        if (firm) {
          firmStorage.push({
            id: lawFirmId,
            name: firm.name,
            storageUsed: Math.round(value.storageUsed * 100) / 100,
            documentCount: value.documentCount,
            plan: getPlan(attorneysPerFirm.get(lawFirmId) || firm.member_count || 0),
          });
        }
      });

      firmStorage.sort((a, b) => b.storageUsed - a.storageUsed);
      setCompanyStorage(firmStorage.slice(0, 10));

      const totalStorageUsed = firmStorage.reduce((sum, f) => sum + f.storageUsed, 0);
      const totalDocuments = firmStorage.reduce((sum, f) => sum + f.documentCount, 0);
      const avgStorage = totalCompanies ? totalStorageUsed / totalCompanies : 0;
      const topCompany = firmStorage[0] || { storageUsed: 0, name: '' };

      setStats({
        totalCompanies,
        totalAttorneys,
        companiesGrowth,
        attorneysGrowth,
        totalStorageUsed,
        totalDocuments,
      });

      setStorageSummary({
        totalStorageGB: totalStorageUsed / 1024,
        avgStorageGB: avgStorage / 1024,
        topConsumer: topCompany.name,
        topStorageGB: topCompany.storageUsed / 1024,
      });

      // Update chart last month with real totals
      const updatedGrowth = [...monthlyGrowthData];
      const lastIdx = updatedGrowth.length - 1;
      updatedGrowth[lastIdx] = {
        ...updatedGrowth[lastIdx],
        companies: totalCompanies,
        attorneys: totalAttorneys,
      };
      setMonthlyGrowthData(updatedGrowth);

    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      alert('Error loading dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Helper functions
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
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const statItems = [
    {
      title: 'Total Companies',
      value: formatNumber(stats.totalCompanies),
      change: `+${Math.round(stats.totalCompanies * (stats.companiesGrowth / 100))} this month`,
      icon: Building,
      trend: 'up' as const,
      percentage: `${stats.companiesGrowth}%`,
      description: 'Law firms on the platform'
    },
    {
      title: 'Total Attorneys',
      value: formatNumber(stats.totalAttorneys),
      change: `+${Math.round(stats.totalAttorneys * (stats.attorneysGrowth / 100))} this month`,
      icon: Users,
      trend: 'up' as const,
      percentage: `${stats.attorneysGrowth}%`,
      description: 'Across all companies'
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
      {/* Header and Refresh */}
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

      {/* Stats Cards (now only two) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                        {stat.trend === 'up' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
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
        {/* Monthly Growth Chart (now only companies and attorneys) */}
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
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                  <Legend />
                  <Line type="monotone" dataKey="companies" name="Companies" stroke="#8B5CF6" strokeWidth={2} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="attorneys" name="Attorneys" stroke="#3B82F6" strokeWidth={2} dot={{ r: 4 }} />
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
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                  <Legend />
                  <Bar dataKey="count" name="Number of Companies" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="percentage" name="Percentage" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Signups (now without client count) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                            <Users className="w-3.5 h-3.5 text-muted-foreground" />
                            <span className="text-foreground">{company.attorneys}</span>
                            <span className="text-muted-foreground">attorneys</span>
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

        {/* Storage Statistics Card (unchanged) */}
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

      {/* Storage Usage Table (unchanged) */}
      <Card>
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

      {/* Summary Stats (now only two cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
      </div>
    </div>
  );
}