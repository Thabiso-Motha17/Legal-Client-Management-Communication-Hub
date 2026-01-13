import { Card, CardContent, CardHeader, CardTitle } from '../ui/Cards';
import { Badge } from '../ui/Badges';
import { Button } from '../ui/Buttons';
import { 
  User, 
  Calendar, 
  FileText, 
  CheckCircle, 
  Clock,
  MapPin,
  Phone,
  Mail,
  Briefcase
} from 'lucide-react';

export function ClientCase() {
  const caseDetails = {
    caseNumber: 'CAS-2026-001',
    title: 'Johnson Estate Planning',
    type: 'Estate Planning',
    status: 'Active',
    filingDate: 'Nov 15, 2025',
    lastUpdate: 'Jan 10, 2026',
    attorney: {
      name: 'Sarah Mitchell',
      title: 'Senior Partner',
      phone: '(555) 987-6543',
      email: 'sarah.mitchell@lawfirm.com'
    },
    nextEvent: {
      title: 'Final Review Meeting',
      date: 'Jan 25, 2026',
      time: '2:00 PM',
      location: '123 Legal Plaza, Suite 400'
    }
  };

  const timeline = [
    {
      id: 1,
      date: 'Jan 10, 2026',
      title: 'Trust Agreement Draft Submitted',
      description: 'Second revision of trust agreement prepared and uploaded for your review',
      status: 'completed',
      type: 'document'
    },
    {
      id: 2,
      date: 'Jan 8, 2026',
      title: 'Property Deed Transfer Filed',
      description: 'Property deed transfer documentation filed with county recorder',
      status: 'completed',
      type: 'filing'
    },
    {
      id: 3,
      date: 'Jan 5, 2026',
      title: 'Will Finalized',
      description: 'Last will and testament signed and notarized',
      status: 'completed',
      type: 'milestone'
    },
    {
      id: 4,
      date: 'Dec 20, 2025',
      title: 'Initial Consultation Completed',
      description: 'Estate planning goals and objectives discussed',
      status: 'completed',
      type: 'meeting'
    },
    {
      id: 5,
      date: 'Nov 15, 2025',
      title: 'Case Opened',
      description: 'Estate planning case initiated',
      status: 'completed',
      type: 'milestone'
    }
  ];

  const milestones = [
    { title: 'Case Initiated', completed: true },
    { title: 'Document Collection', completed: true },
    { title: 'Will Preparation', completed: true },
    { title: 'Trust Agreement', completed: false },
    { title: 'Final Review', completed: false },
    { title: 'Case Closure', completed: false }
  ];

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-foreground">{caseDetails.title}</h1>
          <Badge variant="success">{caseDetails.status}</Badge>
        </div>
        <p className="text-muted-foreground">Case #{caseDetails.caseNumber}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Case Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Case Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Case Type</p>
                  <p className="text-foreground font-medium">{caseDetails.type}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Status</p>
                  <Badge variant="success">{caseDetails.status}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Filing Date</p>
                  <p className="text-foreground font-medium">{caseDetails.filingDate}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Last Update</p>
                  <p className="text-foreground font-medium">{caseDetails.lastUpdate}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Progress Milestones */}
          <Card>
            <CardHeader>
              <CardTitle>Case Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {milestones.map((milestone, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      milestone.completed 
                        ? 'bg-success/10 text-success' 
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {milestone.completed ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <Clock className="w-5 h-5" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${
                        milestone.completed ? 'text-foreground' : 'text-muted-foreground'
                      }`}>
                        {milestone.title}
                      </p>
                    </div>
                    {!milestone.completed && index === milestones.findIndex(m => !m.completed) && (
                      <Badge variant="secondary">Current</Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Case Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {timeline.map((event, index) => (
                  <div key={event.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        event.type === 'milestone' ? 'bg-primary/10 text-primary' :
                        event.type === 'document' ? 'bg-accent/10 text-accent' :
                        event.type === 'meeting' ? 'bg-success/10 text-success' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {event.type === 'document' ? (
                          <FileText className="w-5 h-5" />
                        ) : event.type === 'meeting' ? (
                          <User className="w-5 h-5" />
                        ) : (
                          <CheckCircle className="w-5 h-5" />
                        )}
                      </div>
                      {index < timeline.length - 1 && (
                        <div className="w-0.5 h-full min-h-[40px] bg-border mt-2"></div>
                      )}
                    </div>
                    <div className="flex-1 pb-6">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium text-foreground">{event.title}</p>
                        <Badge variant="secondary" className="text-xs">{event.date}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{event.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Attorney Info */}
          <Card>
            <CardHeader>
              <CardTitle>Your Attorney</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center mb-4">
                <div className="w-20 h-20 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-3 text-xl font-medium">
                  {caseDetails.attorney.name.split(' ').map(n => n[0]).join('')}
                </div>
                <h3 className="text-foreground font-medium mb-1">{caseDetails.attorney.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">{caseDetails.attorney.title}</p>
              </div>
              
              <div className="space-y-3 pt-4 border-t border-border">
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <a href={`tel:${caseDetails.attorney.phone}`} className="text-sm text-foreground hover:text-accent transition-colors">
                    {caseDetails.attorney.phone}
                  </a>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <a href={`mailto:${caseDetails.attorney.email}`} className="text-sm text-foreground hover:text-accent transition-colors truncate">
                    {caseDetails.attorney.email}
                  </a>
                </div>
              </div>

              <Button variant="primary" className="w-full mt-4 gap-2">
                <Mail className="w-4 h-4" />
                Send Message
              </Button>
            </CardContent>
          </Card>

          {/* Next Event */}
          <Card className="border-2 border-accent/20 bg-gradient-to-br from-accent/5 to-transparent">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-accent" />
                Next Event
              </CardTitle>
            </CardHeader>
            <CardContent>
              <h3 className="text-foreground font-medium mb-3">{caseDetails.nextEvent.title}</h3>
              
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Calendar className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-foreground">{caseDetails.nextEvent.date}</p>
                    <p className="text-xs text-muted-foreground">{caseDetails.nextEvent.time}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-foreground">{caseDetails.nextEvent.location}</p>
                </div>
              </div>

              <Button variant="outline" className="w-full mt-4">
                Add to Calendar
              </Button>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start gap-2">
                <FileText className="w-4 h-4" />
                View Documents
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2">
                <Mail className="w-4 h-4" />
                Message Attorney
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2">
                <Briefcase className="w-4 h-4" />
                Upload Documents
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
