import { Card, CardContent, CardHeader, CardTitle } from '../ui/Cards';
import { Badge } from '../ui/Badges';
import { Briefcase, Users, MessageSquare, Clock, AlertCircle, TrendingUp } from 'lucide-react';
import {FaMoneyBillAlt} from 'react-icons/fa';
const stats = [
  {
    title: 'Active Cases',
    value: '24',
    change: '+3 this week',
    icon: Briefcase,
    trend: 'up'
  },
  {
    title: 'Total Clients',
    value: '187',
    change: '+12 this month',
    icon: Users,
    trend: 'up'
  },
  {
    title: 'Outstanding Payments',
    value: 'R42,750',
    change: '5 invoices pending',
    icon: FaMoneyBillAlt,
    trend: 'neutral'
  }
];

const upcomingDeadlines = [
  {
    id: 1,
    case: 'Henderson v. State Corp',
    deadline: 'Motion Filing',
    date: 'Jan 10, 2026',
    daysLeft: 2,
    priority: 'high'
  },
  {
    id: 2,
    case: 'Martinez Estate Planning',
    deadline: 'Document Review',
    date: 'Jan 12, 2026',
    daysLeft: 4,
    priority: 'medium'
  },
  {
    id: 3,
    case: 'Thompson Contract Dispute',
    deadline: 'Discovery Response',
    date: 'Jan 15, 2026',
    daysLeft: 7,
    priority: 'medium'
  },
  {
    id: 4,
    case: 'Johnson Family Trust',
    deadline: 'Trust Amendment',
    date: 'Jan 20, 2026',
    daysLeft: 12,
    priority: 'low'
  }
];

const recentActivity = [
  {
    id: 1,
    type: 'case_update',
    title: 'Case status updated',
    description: 'Henderson v. State Corp - Discovery phase initiated',
    time: '2 hours ago',
    user: 'Michael Chen'
  },
  {
    id: 2,
    type: 'document',
    title: 'New document uploaded',
    description: 'Martinez Estate - Final Will and Testament (signed)',
    time: '4 hours ago',
    user: 'Sarah Mitchell'
  },
  {
    id: 3,
    type: 'payment',
    title: 'Payment received',
    description: 'R5,200 payment processed for Thompson Contract Dispute',
    time: '5 hours ago',
    user: 'System'
  },
  {
    id: 4,
    type: 'case_update',
    title: 'Court date scheduled',
    description: 'Wilson v. Metro Insurance - Hearing set for Feb 15, 2026',
    time: '1 day ago',
    user: 'Court System'
  }
];

export function Dashboard() {
  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-foreground mb-1">Dashboard</h1>
        <p className="text-muted-foreground text-sm">Welcome back, Sarah. Here's what's happening today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardContent className="py-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
                    <p className="text-3xl font-semibold text-foreground mb-1">{stat.value}</p>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      {stat.trend === 'up' && <TrendingUp className="w-3 h-3 text-success" />}
                      <span>{stat.change}</span>
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Deadlines */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Upcoming Deadlines</CardTitle>
              <Badge variant="warning" className="flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                2 Critical
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {upcomingDeadlines.map((item) => (
                <div key={item.id} className="px-6 py-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground text-sm mb-0.5">{item.case}</p>
                      <p className="text-sm text-muted-foreground">{item.deadline}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-sm text-foreground">{item.date}</span>
                      </div>
                      <Badge 
                        variant={
                          item.priority === 'high' ? 'error' : 
                          item.priority === 'medium' ? 'warning' : 
                          'secondary'
                        }
                      >
                        {item.daysLeft} days left
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="px-6 py-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                      {activity.type === 'case_update' && <Briefcase className="w-4 h-4 text-muted-foreground" />}
                      {activity.type === 'document' && <Clock className="w-4 h-4 text-muted-foreground" />}
                      {activity.type === 'payment' && <FaMoneyBillAlt className="w-4 h-4 text-success" />}
                      {activity.type === 'message' && <MessageSquare className="w-4 h-4 text-muted-foreground" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground text-sm mb-0.5">{activity.title}</p>
                      <p className="text-sm text-muted-foreground mb-1">{activity.description}</p>
                      <p className="text-xs text-muted-foreground">{activity.time} • {activity.user}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
