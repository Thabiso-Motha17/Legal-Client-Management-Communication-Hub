import { Card, CardContent, CardHeader, CardTitle } from '../ui/Cards';
import { Badge } from '../ui/Badges';
import { Building, Users, User, TrendingUp, ChevronUp, ChevronDown, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts';

// Mock data for growth statistics
const monthlyGrowthData = [
  { month: 'Jul', companies: 45, attorneys: 320, clients: 4200 },
  { month: 'Aug', companies: 52, attorneys: 380, clients: 4800 },
  { month: 'Sep', companies: 58, attorneys: 420, clients: 5200 },
  { month: 'Oct', companies: 64, attorneys: 480, clients: 5800 },
  { month: 'Nov', companies: 70, attorneys: 520, clients: 6300 },
  { month: 'Dec', companies: 78, attorneys: 580, clients: 7000 },
  { month: 'Jan', companies: 85, attorneys: 620, clients: 7500 },
];

const companyDistributionData = [
  { category: 'Small (1-10)', count: 35, percentage: 41 },
  { category: 'Medium (11-50)', count: 28, percentage: 33 },
  { category: 'Large (51-200)', count: 17, percentage: 20 },
  { category: 'Enterprise (200+)', count: 5, percentage: 6 },
];

const clientGrowthData = [
  { month: 'Jul', clients: 4200 },
  { month: 'Aug', clients: 4800 },
  { month: 'Sep', clients: 5200 },
  { month: 'Oct', clients: 5800 },
  { month: 'Nov', clients: 6300 },
  { month: 'Dec', clients: 7000 },
  { month: 'Jan', clients: 7500 },
];

const stats = [
  {
    title: 'Total Companies',
    value: '85',
    change: '+7 this month',
    icon: Building,
    trend: 'up',
    percentage: '12%',
    description: 'Law firms on the platform'
  },
  {
    title: 'Total Attorneys',
    value: '620',
    change: '+40 this month',
    icon: User,
    trend: 'up',
    percentage: '7%',
    description: 'Across all companies'
  },
  {
    title: 'Total Clients',
    value: '7,500',
    change: '+500 this month',
    icon: Users,
    trend: 'up',
    percentage: '7%',
    description: 'Managed by all firms'
  }
];

const recentSignups = [
  {
    id: '1',
    name: 'Morgan & Associates',
    type: 'Corporate Law',
    attorneys: 24,
    clients: 180,
    signupDate: 'Jan 5, 2026',
    plan: 'Enterprise'
  },
  {
    id: '2',
    name: 'Blackwood Legal',
    type: 'Intellectual Property',
    attorneys: 12,
    clients: 95,
    signupDate: 'Jan 3, 2026',
    plan: 'Professional'
  },
  {
    id: '3',
    name: 'Carter & Partners',
    type: 'Family Law',
    attorneys: 8,
    clients: 120,
    signupDate: 'Dec 29, 2025',
    plan: 'Professional'
  },
  {
    id: '4',
    name: 'Nelson Legal Group',
    type: 'Real Estate',
    attorneys: 6,
    clients: 85,
    signupDate: 'Dec 26, 2025',
    plan: 'Starter'
  },
];

export function Dashboard() {
  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-foreground mb-1">Admin Dashboard</h1>
        <p className="text-muted-foreground text-sm">System overview and growth analytics</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat) => {
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
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="month" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937',
                      border: '1px solid #374151',
                      borderRadius: '8px'
                    }}
                    formatter={(value, name) => {
                      const metricNames: Record<string, string> = {
                        companies: 'Companies',
                        attorneys: 'Attorneys',
                        clients: 'Clients',
                        count: 'Number of Companies',
                        percentage: 'Percentage'
                      };
                       const displayName = typeof name === 'string' ? metricNames[name] || name : String(name);
                       return [value, displayName];
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="companies" 
                    name="Companies" 
                    stroke="#8B5CF6" 
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="attorneys" 
                    name="Attorneys" 
                    stroke="#3B82F6" 
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="clients" 
                    name="Clients" 
                    stroke="#10B981" 
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
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
                <BarChart data={companyDistributionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="category" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937',
                      border: '1px solid #374151',
                      borderRadius: '8px'
                    }}
                    formatter={(value, name) => {
                      if (name === 'count') return [value, 'Companies'];
                      if (name === 'percentage') return [`${value}%`, 'Percentage'];
                      return value;
                    }}
                  />
                  <Legend />
                  <Bar 
                    dataKey="count" 
                    name="Number of Companies" 
                    fill="#8B5CF6" 
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar 
                    dataKey="percentage" 
                    name="Percentage" 
                    fill="#3B82F6" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Charts and Recent Signups */}
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
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="month" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937',
                      border: '1px solid #374151',
                      borderRadius: '8px'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="clients" 
                    name="Total Clients" 
                    stroke="#10B981" 
                    fill="#10B981"
                    fillOpacity={0.2}
                    strokeWidth={2}
                  />
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
                12% growth
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">Latest law firms joining the platform</p>
          </CardHeader>
          <CardContent className="p-0">
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
                        <Badge 
                          variant={
                            company.plan === 'Enterprise' ? 'default' : 
                            company.plan === 'Professional' ? 'secondary' : 
                            'default'
                          }
                        >
                          {company.plan}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">Joined {company.signupDate}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-4xl font-bold text-primary mb-2">85</p>
              <p className="text-sm text-muted-foreground">Active Companies</p>
              <div className="flex items-center justify-center gap-2 mt-2">
                <ChevronUp className="w-4 h-4 text-success" />
                <span className="text-sm text-success">12% growth this month</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-4xl font-bold text-blue-500 mb-2">620</p>
              <p className="text-sm text-muted-foreground">Total Attorneys</p>
              <div className="flex items-center justify-center gap-2 mt-2">
                <ChevronUp className="w-4 h-4 text-success" />
                <span className="text-sm text-success">7% growth this month</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-4xl font-bold text-emerald-500 mb-2">7.5K</p>
              <p className="text-sm text-muted-foreground">Total Clients</p>
              <div className="flex items-center justify-center gap-2 mt-2">
                <ChevronUp className="w-4 h-4 text-success" />
                <span className="text-sm text-success">7% growth this month</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}