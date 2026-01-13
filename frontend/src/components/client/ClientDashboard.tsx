import { Card, CardContent, CardHeader, CardTitle } from '../ui/Cards';
import { Badge } from '../ui/Badges';
import { Button } from '../ui/Buttons';
import { 
  FileText, 
  MessageSquare, 
  Calendar,
  Download,
  AlertCircle,
  CheckCircle,
  Clock,
  User,
  Phone,
  Mail,
  ArrowRight
} from 'lucide-react';
import { FaMoneyBillAlt } from 'react-icons/fa';

interface ClientDashboardProps {
  onNavigate: (page: string) => void;
}

export function ClientDashboard({ onNavigate }: ClientDashboardProps) {
  const caseInfo = {
    caseNumber: 'CAS-2026-001',
    title: 'Johnson Estate Planning',
    attorney: 'Sarah Mitchell',
    status: 'Active',
    nextHearing: 'Jan 25, 2026',
    progress: 65
  };

  const recentDocuments = [
    { id: 1, name: 'Trust Agreement - Draft v2.pdf', date: 'Jan 10, 2026', size: '2.4 MB' },
    { id: 2, name: 'Property Deed Transfer.pdf', date: 'Jan 8, 2026', size: '1.8 MB' },
    { id: 3, name: 'Will - Final Version.pdf', date: 'Jan 5, 2026', size: '856 KB' }
  ];

  const recentMessages = [
    { id: 1, from: 'Sarah Mitchell', subject: 'Trust agreement review needed', date: 'Jan 10, 2026', unread: true },
    { id: 2, from: 'Sarah Mitchell', subject: 'Upcoming meeting confirmation', date: 'Jan 8, 2026', unread: false },
    { id: 3, from: 'Legal Assistant', subject: 'Document upload confirmation', date: 'Jan 7, 2026', unread: false }
  ];

  const upcomingTasks = [
    { id: 1, task: 'Review and sign trust agreement', dueDate: 'Jan 15, 2026', priority: 'high' },
    { id: 2, task: 'Provide property valuation documents', dueDate: 'Jan 18, 2026', priority: 'medium' },
    { id: 3, task: 'Schedule follow-up meeting', dueDate: 'Jan 20, 2026', priority: 'low' }
  ];

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-foreground mb-2">Welcome back, John</h1>
        <p className="text-muted-foreground">Here's an overview of your case and recent activity</p>
      </div>

      {/* Case Status Card */}
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <h2 className="text-foreground">{caseInfo.title}</h2>
                <Badge variant="success">{caseInfo.status}</Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-4">Case #{caseInfo.caseNumber}</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Your Attorney</p>
                    <p className="text-sm font-medium text-foreground">{caseInfo.attorney}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Next Event</p>
                    <p className="text-sm font-medium text-foreground">{caseInfo.nextHearing}</p>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-foreground">Case Progress</span>
                  <span className="text-sm font-medium text-foreground">{caseInfo.progress}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-500" 
                    style={{ width: `${caseInfo.progress}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="flex lg:flex-col gap-3">
              <Button variant="primary" onClick={() => onNavigate('case')} className="gap-2">
                View Case Details
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button variant="outline" onClick={() => onNavigate('messages')} className="gap-2">
                <MessageSquare className="w-4 h-4" />
                Message Attorney
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div onClick={() => onNavigate('documents')} role="button" tabIndex={0} className="hover:border-accent/50 transition-colors cursor-pointer">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground" />
              </div>
              <h3 className="text-2xl font-semibold text-foreground mb-1">12</h3>
              <p className="text-sm text-muted-foreground">Documents Available</p>
            </CardContent>
          </Card>
        </div>

        <div onClick={() => onNavigate('messages')} role="button" tabIndex={0} className="hover:border-accent/50 transition-colors cursor-pointer">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-accent" />
                </div>
                <Badge variant="error">1 New</Badge>
              </div>
              <h3 className="text-2xl font-semibold text-foreground mb-1">8</h3>
              <p className="text-sm text-muted-foreground">Messages</p>
            </CardContent>
          </Card>
        </div>

        <div onClick={() => onNavigate('billing')} role="button" tabIndex={0} className="hover:border-accent/50 transition-colors cursor-pointer">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center">
                  <FaMoneyBillAlt className="w-6 h-6 text-success" />
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground" />
              </div>
              <h3 className="text-2xl font-semibold text-foreground mb-1">R2,450</h3>
              <p className="text-sm text-muted-foreground">Current Balance</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Action Items */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Action Items
              <Badge variant="warning">{upcomingTasks.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {upcomingTasks.map((task) => (
                <div key={task.id} className="px-6 py-4 hover:bg-muted/30 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      task.priority === 'high' ? 'bg-destructive/10' :
                      task.priority === 'medium' ? 'bg-warning/10' : 'bg-muted'
                    }`}>
                      {task.priority === 'high' ? (
                        <AlertCircle className="w-4 h-4 text-destructive" />
                      ) : task.priority === 'medium' ? (
                        <Clock className="w-4 h-4 text-warning" />
                      ) : (
                        <CheckCircle className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground mb-1">{task.task}</p>
                      <p className="text-xs text-muted-foreground">Due: {task.dueDate}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Documents */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Recent Documents
              <Button variant="ghost" size="sm" onClick={() => onNavigate('documents')}>
                View All
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {recentDocuments.map((doc) => (
                <div key={doc.id} className="px-6 py-4 hover:bg-muted/30 transition-colors flex items-center justify-between group">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{doc.name}</p>
                      <p className="text-xs text-muted-foreground">{doc.date} • {doc.size}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Messages */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Recent Messages
            <Button variant="ghost" size="sm" onClick={() => onNavigate('messages')}>
              View All
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {recentMessages.map((message) => (
              <div 
                key={message.id} 
                className="px-6 py-4 hover:bg-muted/30 transition-colors cursor-pointer"
                onClick={() => onNavigate('messages')}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0">
                      {message.from.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium text-foreground">{message.from}</p>
                        {message.unread && (
                          <div className="w-2 h-2 bg-accent rounded-full"></div>
                        )}
                      </div>
                      <p className="text-sm text-foreground truncate">{message.subject}</p>
                      <p className="text-xs text-muted-foreground mt-1">{message.date}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Contact Attorney */}
      <Card className="bg-gradient-to-br from-accent/5 to-transparent border-accent/20">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-foreground mb-2">Need to speak with your attorney?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Sarah Mitchell is available to discuss your case
              </p>
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-accent" />
                  <span className="text-foreground">(555) 987-6543</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-accent" />
                  <span className="text-foreground">sarah.mitchell@lawfirm.com</span>
                </div>
              </div>
            </div>
            <Button variant="primary" onClick={() => onNavigate('messages')} className="gap-2">
              Send Message
              <MessageSquare className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
