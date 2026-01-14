import { Card, CardContent, CardHeader, CardTitle } from '../ui/Cards';
import { Badge } from '../ui/Badges';
import { Button } from '../ui/Buttons';
import { 
  ArrowLeft, 
  Calendar, 
  User, 
  FileText, 
  MessageSquare, 
  Edit,
  MoreVertical
} from 'lucide-react';

interface Case {
  id: string;
  FileNo: string;
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

interface CaseDetailProps {
  case: Case;
  onBack: () => void;
}

const timeline = [
  {
    id: 1,
    date: 'Jan 5, 2026',
    title: 'Discovery Phase Initiated',
    description: 'Submitted discovery requests to opposing counsel',
    user: 'Sarah Mitchell'
  },
  {
    id: 2,
    date: 'Dec 28, 2025',
    title: 'Initial Hearing Completed',
    description: 'Court hearing held, case proceeding to discovery',
    user: 'Court System'
  },
  {
    id: 3,
    date: 'Dec 20, 2025',
    title: 'Complaint Filed',
    description: 'Official complaint filed with county court',
    user: 'Michael Chen'
  },
  {
    id: 4,
    date: 'Dec 15, 2025',
    title: 'Case Opened',
    description: 'Initial consultation completed, case officially opened',
    user: 'Sarah Mitchell'
  }
];

const documents = [
  { id: 1, name: 'Complaint - Final.pdf', type: 'Legal Filing', date: 'Dec 20, 2025', status: 'Final' },
  { id: 2, name: 'Discovery Request.pdf', type: 'Discovery', date: 'Jan 5, 2026', status: 'Sent' },
  { id: 3, name: 'Client Agreement.pdf', type: 'Contract', date: 'Dec 15, 2025', status: 'Signed' },
  { id: 4, name: 'Evidence Summary.docx', type: 'Internal', date: 'Jan 3, 2026', status: 'Draft' }
];

const team = [
  { name: 'Sarah Mitchell', role: 'Lead Attorney', initials: 'SM' },
  { name: 'Michael Chen', role: 'Associate Attorney', initials: 'MC' },
  { name: 'Jennifer Lee', role: 'Paralegal', initials: 'JL' }
];

const notes = [
  {
    id: 1,
    author: 'Sarah Mitchell',
    date: 'Jan 6, 2026 - 2:30 PM',
    content: 'Client meeting scheduled for Jan 10 to review discovery responses. Need to prepare summary of key findings.'
  },
  {
    id: 2,
    author: 'Michael Chen',
    date: 'Jan 4, 2026 - 10:15 AM',
    content: 'Opposing counsel requested extension on discovery deadline. Recommend approval with conditions.'
  }
];

export function CaseDetail({ case: caseData, onBack }: CaseDetailProps) {
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
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Cases
        </Button>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-foreground">{caseData.title}</h1>
            <Badge variant={getStatusVariant(caseData.status)}>{caseData.status}</Badge>
            <Badge variant={getPriorityVariant(caseData.priority)}>{caseData.priority} priority</Badge>
          </div>
          <p className="text-muted-foreground">Case {caseData.caseNumber}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Edit className="w-4 h-4" />
            Edit Case
          </Button>
          <Button variant="ghost" size="sm">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Case Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="py-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Client</p>
                <p className="font-medium text-foreground">{caseData.client}</p>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Type</span>
                <span className="text-foreground">{caseData.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date Opened</span>
                <span className="text-foreground">{caseData.dateOpened}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Next Deadline</p>
                <p className="font-medium text-foreground">{caseData.nextDeadline || 'None scheduled'}</p>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Deadline Type</span>
                <span className="text-foreground">Motion Filing</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Days Remaining</span>
                <span className="text-foreground font-medium">2 days</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-6">
            <div className="mb-4">
              <p className="text-xs text-muted-foreground mb-3">Legal Team</p>
              <div className="space-y-2">
                {team.map((member) => (
                  <div key={member.name} className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                      {member.initials}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{member.name}</p>
                      <p className="text-xs text-muted-foreground">{member.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Case Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {timeline.map((event, index) => (
                <div key={event.id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-2 h-2 rounded-full bg-primary"></div>
                    {index < timeline.length - 1 && (
                      <div className="w-0.5 h-full bg-border mt-1"></div>
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <div className="flex items-start justify-between mb-1">
                      <p className="font-medium text-foreground text-sm">{event.title}</p>
                      <span className="text-xs text-muted-foreground">{event.date}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">{event.description}</p>
                    <p className="text-xs text-muted-foreground">by {event.user}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Documents */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Related Documents</CardTitle>
              <Button variant="ghost" size="sm" className="gap-2">
                <FileText className="w-4 h-4" />
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {documents.map((doc) => (
                <div key={doc.id} className="px-6 py-3 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium text-foreground">{doc.name}</p>
                        <p className="text-xs text-muted-foreground">{doc.type} • {doc.date}</p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-xs">{doc.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Internal Notes */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Internal Notes & Comments</CardTitle>
            <Button variant="outline" size="sm" className="gap-2">
              <MessageSquare className="w-4 h-4" />
              Add Note
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {notes.map((note) => (
              <div key={note.id} className="bg-muted/30 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                      {note.author.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{note.author}</p>
                      <p className="text-xs text-muted-foreground">{note.date}</p>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-foreground">{note.content}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
