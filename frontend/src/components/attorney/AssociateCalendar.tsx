import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Cards';
import { Badge } from '../ui/Badges';
import { Button } from '../ui/Buttons';
import { Calendar } from '../ui/calendar';
import { API_URL } from '../../api';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin,
  User,
  Video,
  Plus,
  Search,
  X,
  Edit,
  Trash,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, parseISO, isPast, isToday } from 'date-fns';


// Interface matching backend structure
interface Event {
  id: number;
  title: string;
  description?: string;
  event_type: 'meeting' | 'deadline' | 'hearing' | 'court_date' | 'filing' | 'consultation' | 'other';
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'postponed';
  priority: 'low' | 'medium' | 'high';
  start_time: string; // ISO string
  end_time: string; // ISO string
  all_day: boolean;
  location?: string;
  meeting_link?: string;
  address?: string;
  case_id: number;
  case_title?: string;
  case_number?: string;
  client_name?: string;
  assigned_to_user_id?: number;
  assigned_to_name?: string;
  client_invited: boolean;
  client_confirmed: boolean;
  reminder_sent: boolean;
  reminder_minutes_before: number;
  is_recurring: boolean;
  recurrence_pattern?: string;
  document_id?: number;
  document_name?: string;
  created_at: string;
  updated_at: string;
}

interface CreateEventData {
  title: string;
  description?: string;
  event_type: Event['event_type'];
  status?: Event['status'];
  priority?: Event['priority'];
  start_time: string;
  end_time: string;
  all_day?: boolean;
  location?: string;
  meeting_link?: string;
  address?: string;
  case_id: number;
  assigned_to_user_id?: number;
  client_invited?: boolean;
  client_confirmed?: boolean;
  reminder_minutes_before?: number;
  is_recurring?: boolean;
  recurrence_pattern?: string;
  recurrence_end_date?: string;
  document_id?: number;
}

export function AssociateCalendar() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [selectedEventDetail, setSelectedEventDetail] = useState<Event | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    event_type: '',
    assigned_to: '',
  });

  const [newEvent, setNewEvent] = useState<CreateEventData>({
    title: '',
    event_type: 'meeting',
    status: 'scheduled',
    priority: 'medium',
    start_time: format(selectedDate, "yyyy-MM-dd'T'HH:mm"),
    end_time: format(new Date(selectedDate.getTime() + 60 * 60 * 1000), "yyyy-MM-dd'T'HH:mm"), // 1 hour later
    all_day: false,
    location: '',
    meeting_link: '',
    address: '',
    case_id: 0,
    assigned_to_user_id: undefined,
    client_invited: false,
    client_confirmed: false,
    reminder_minutes_before: 30,
    is_recurring: false,
    recurrence_pattern: undefined,
  });

  // Fetch events from backend
  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Build query parameters
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.event_type) params.append('event_type', filters.event_type);
      if (filters.assigned_to) params.append('assigned_to_user_id', filters.assigned_to);
      if (searchQuery) params.append('search', searchQuery);
      
      // Add date range filters for current view
      if (viewMode === 'week') {
        const weekStart = startOfWeek(selectedDate);
        const weekEnd = endOfWeek(selectedDate);
        params.append('start_date', format(weekStart, 'yyyy-MM-dd'));
        params.append('end_date', format(weekEnd, 'yyyy-MM-dd'));
      } else if (viewMode === 'day') {
        params.append('start_date', format(selectedDate, 'yyyy-MM-dd'));
        params.append('end_date', format(selectedDate, 'yyyy-MM-dd'));
      } else if (viewMode === 'month') {
        // For month view, fetch all events and filter client-side
        // Could implement server-side month filtering if needed
      }

      const response = await fetch(`${API_URL}/api/events?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch events: ${response.statusText}`);
      }

      const data = await response.json();
      setEvents(data);
    } catch (err) {
      console.error('Error fetching events:', err);
      setError(err instanceof Error ? err.message : 'Failed to load events');
      alert(err instanceof Error ? err.message : 'Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  // Fetch cases for dropdown
  const fetchCases = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${API_URL}/api/cases`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCases(data);
      }
    } catch (err) {
      console.error('Error fetching cases:', err);
    }
  };

  // Fetch events on component mount and when dependencies change
  useEffect(() => {
    fetchEvents();
    fetchCases();
  }, [selectedDate, viewMode, filters, searchQuery]);

  // Helper functions
  const getEventsForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return events.filter(event => 
      format(parseISO(event.start_time), 'yyyy-MM-dd') === dateStr
    );
  };

  const getWeekEvents = () => {
    const weekStart = startOfWeek(selectedDate);
    const weekEnd = endOfWeek(selectedDate);
    return events.filter(event => {
      const eventDate = parseISO(event.start_time);
      return eventDate >= weekStart && eventDate <= weekEnd;
    });
  };

  const getEventTypeColor = (type: Event['event_type']) => {
    switch (type) {
      case 'meeting':
        return 'bg-primary/10 text-primary border-primary/20';
      case 'hearing':
      case 'court_date':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'deadline':
      case 'filing':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'consultation':
        return 'bg-accent/10 text-accent border-accent/20';
      case 'other':
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getEventTypeBadge = (type: Event['event_type']) => {
    switch (type) {
      case 'meeting':
        return 'Meeting';
      case 'hearing':
        return 'Hearing';
      case 'court_date':
        return 'Court Date';
      case 'deadline':
        return 'Deadline';
      case 'filing':
        return 'Filing';
      case 'consultation':
        return 'Consultation';
      case 'other':
        return 'Other';
    }
  };

  const getPriorityColor = (priority: Event['priority']) => {
    switch (priority) {
      case 'high':
        return 'bg-destructive/10 text-destructive';
      case 'medium':
        return 'bg-warning/10 text-warning';
      case 'low':
        return 'bg-muted/10 text-muted-foreground';
    }
  };

  const formatEventTime = (startTime: string, endTime: string, allDay: boolean) => {
    if (allDay) {
      return 'All Day';
    }
    const start = parseISO(startTime);
    const end = parseISO(endTime);
    return `${format(start, 'h:mm a')} - ${format(end, 'h:mm a')}`;
  };

  // CRUD Operations
  const handleCreateEvent = async () => {
    try {
      setIsSubmitting(true);
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token');

      // Validate required fields
      if (!newEvent.title || !newEvent.case_id) {
        alert('Title and Case are required');
        return;
      }

      const response = await fetch(`${API_URL}/api/events`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newEvent),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to create event: ${response.statusText}`);
      }

      const createdEvent = await response.json();
      
      // Update local state
      setEvents(prev => [createdEvent, ...prev]);
      
      // Reset and close dialog
      resetNewEvent();
      setShowEventDialog(false);
      
      alert('Event created successfully');
    } catch (err) {
      console.error('Error creating event:', err);
      alert(err instanceof Error ? err.message : 'Failed to create event');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateEvent = async () => {
    if (!editingEvent) return;

    try {
      setIsSubmitting(true);
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token');

      const updateData = {
        title: editingEvent.title,
        description: editingEvent.description,
        event_type: editingEvent.event_type,
        status: editingEvent.status,
        priority: editingEvent.priority,
        start_time: editingEvent.start_time,
        end_time: editingEvent.end_time,
        all_day: editingEvent.all_day,
        location: editingEvent.location,
        meeting_link: editingEvent.meeting_link,
        address: editingEvent.address,
        assigned_to_user_id: editingEvent.assigned_to_user_id,
        client_invited: editingEvent.client_invited,
        client_confirmed: editingEvent.client_confirmed,
        reminder_minutes_before: editingEvent.reminder_minutes_before,
        is_recurring: editingEvent.is_recurring,
        recurrence_pattern: editingEvent.recurrence_pattern,
        document_id: editingEvent.document_id,
      };

      const response = await fetch(`${API_URL}/api/events/${editingEvent.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to update event: ${response.statusText}`);
      }

      const updatedEvent = await response.json();
      
      // Update local state
      setEvents(prev => prev.map(e => e.id === editingEvent.id ? updatedEvent : e));
      
      // Reset and close dialog
      setEditingEvent(null);
      setShowEventDialog(false);
      setSelectedEventDetail(null);
      
      alert('Event updated successfully');
    } catch (err) {
      console.error('Error updating event:', err);
      alert(err instanceof Error ? err.message : 'Failed to update event');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEvent = async (id: number) => {
    if (!confirm('Are you sure you want to delete this event?')) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token');

      const response = await fetch(`${API_URL}/api/events/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to delete event: ${response.statusText}`);
      }

      // Update local state
      setEvents(prev => prev.filter(e => e.id !== id));
      setSelectedEventDetail(null);
      
      alert('Event deleted successfully');
    } catch (err) {
      console.error('Error deleting event:', err);
      alert(err instanceof Error ? err.message : 'Failed to delete event');
    }
  };

  const handleSendReminder = async (id: number) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token');

      const response = await fetch(`${API_URL}/api/events/${id}/send-reminder`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to send reminder: ${response.statusText}`);
      }

      const data = await response.json();
      data.event
      // Update local state
      setEvents(prev => prev.map(e => 
        e.id === id ? { ...e, reminder_sent: true, last_reminder_sent_at: new Date().toISOString() } : e
      ));
      
      alert('Reminder sent successfully');
    } catch (err) {
      console.error('Error sending reminder:', err);
      alert(err instanceof Error ? err.message : 'Failed to send reminder');
    }
  };

  const resetNewEvent = () => {
    setNewEvent({
      title: '',
      event_type: 'meeting',
      status: 'scheduled',
      priority: 'medium',
      start_time: format(selectedDate, "yyyy-MM-dd'T'HH:mm"),
      end_time: format(new Date(selectedDate.getTime() + 60 * 60 * 1000), "yyyy-MM-dd'T'HH:mm"),
      all_day: false,
      location: '',
      meeting_link: '',
      address: '',
      case_id: 0,
      assigned_to_user_id: undefined,
      client_invited: false,
      client_confirmed: false,
      reminder_minutes_before: 30,
      is_recurring: false,
    });
  };

  const todayEvents = getEventsForDate(selectedDate);
  const weekEvents = getWeekEvents();
  weekEvents.sort((a, b) => parseISO(a.start_time).getTime() - parseISO(b.start_time).getTime());
  const upcomingEvents = events
    .filter(e => parseISO(e.start_time) >= new Date() && e.status === 'scheduled')
    .sort((a, b) => parseISO(a.start_time).getTime() - parseISO(b.start_time).getTime())
    .slice(0, 5);

  const eventStats = {
    total: events.length,
    hearings: events.filter(e => e.event_type === 'hearing').length,
    courtDates: events.filter(e => e.event_type === 'court_date').length,
    deadlines: events.filter(e => e.event_type === 'deadline').length,
    meetings: events.filter(e => e.event_type === 'meeting').length,
    consultations: events.filter(e => e.event_type === 'consultation').length,
    scheduled: events.filter(e => e.status === 'scheduled').length,
    confirmed: events.filter(e => e.status === 'confirmed').length,
    completed: events.filter(e => e.status === 'completed').length,
  };

  const renderDayView = () => {
    const hours = Array.from({ length: 12 }, (_, i) => i + 8); // 8 AM to 7 PM
    
    return (
      <Card>
        <CardHeader>
          <CardTitle>{format(selectedDate, 'EEEE, MMMM d, yyyy')}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-2">
              {hours.map(hour => {
                const hourEvents = todayEvents.filter(e => {
                  if (e.all_day) return false;
                  const eventHour = parseISO(e.start_time).getHours();
                  return eventHour === hour;
                });

                return (
                  <div key={hour} className="flex gap-4 min-h-[60px] border-b border-border pb-2">
                    <div className="w-20 text-sm text-muted-foreground font-medium">
                      {hour > 12 ? hour - 12 : hour}:00 {hour >= 12 ? 'PM' : 'AM'}
                    </div>
                    <div className="flex-1 space-y-2">
                      {hourEvents.map(event => (
                        <div
                          key={event.id}
                          className={`p-3 rounded-lg border ${getEventTypeColor(event.event_type)} cursor-pointer`}
                          onClick={() => setSelectedEventDetail(event)}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <p className="font-medium text-sm">{event.title}</p>
                              <p className="text-xs opacity-70">
                                {formatEventTime(event.start_time, event.end_time, event.all_day)}
                              </p>
                            </div>
                            <Badge variant="default" className="text-xs">
                              {getEventTypeBadge(event.event_type)}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderWeekView = () => {
    const weekStart = startOfWeek(selectedDate);
    const weekDays = eachDayOfInterval({ start: weekStart, end: endOfWeek(selectedDate) });

    return (
      <Card>
        <CardHeader>
          <CardTitle>
            {format(weekStart, 'MMM d')} - {format(endOfWeek(selectedDate), 'MMM d, yyyy')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-2">
              {weekDays.map(day => {
                const dayEvents = getEventsForDate(day);
                const isTodayDay = isToday(day);
                const isSelected = format(day, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');

                return (
                  <div
                    key={day.toString()}
                    className={`border rounded-lg p-3 min-h-[120px] cursor-pointer transition-colors ${
                      isSelected ? 'border-primary bg-primary/5' : 
                      isTodayDay ? 'border-accent bg-accent/5' : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedDate(day)}
                  >
                    <div className={`text-center mb-2 font-medium ${isTodayDay ? 'text-accent' : 'text-foreground'}`}>
                      <div className="text-xs">{format(day, 'EEE')}</div>
                      <div className="text-lg">{format(day, 'd')}</div>
                    </div>
                    <div className="space-y-1">
                      {dayEvents.slice(0, 3).map(event => (
                        <div
                          key={event.id}
                          className={`text-xs p-1 rounded truncate ${getEventTypeColor(event.event_type)}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEventDetail(event);
                          }}
                        >
                          {event.title}
                        </div>
                      ))}
                      {dayEvents.length > 3 && (
                        <div className="text-xs text-muted-foreground">+{dayEvents.length - 3} more</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderEventDialog = () => {
    const event = editingEvent || newEvent;
    
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{editingEvent ? 'Edit Event' : 'Create New Event'}</CardTitle>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  setShowEventDialog(false);
                  setEditingEvent(null);
                  resetNewEvent();
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground block mb-2">Event Title *</label>
              <input
                type="text"
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Enter event title"
                value={event.title}
                onChange={(e) => editingEvent 
                  ? setEditingEvent({...editingEvent, title: e.target.value})
                  : setNewEvent({...newEvent, title: e.target.value})
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground block mb-2">Event Type *</label>
                <select
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  value={event.event_type}
                  onChange={(e) => editingEvent
                    ? setEditingEvent({...editingEvent, event_type: e.target.value as Event['event_type']})
                    : setNewEvent({...newEvent, event_type: e.target.value as Event['event_type']})
                  }
                >
                  <option value="meeting">Meeting</option>
                  <option value="hearing">Hearing</option>
                  <option value="court_date">Court Date</option>
                  <option value="deadline">Deadline</option>
                  <option value="filing">Filing</option>
                  <option value="consultation">Consultation</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground block mb-2">Priority *</label>
                <select
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  value={event.priority}
                  onChange={(e) => editingEvent
                    ? setEditingEvent({...editingEvent, priority: e.target.value as Event['priority']})
                    : setNewEvent({...newEvent, priority: e.target.value as Event['priority']})
                  }
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground block mb-2">Start Date & Time *</label>
                <input
                  type="datetime-local"
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  value={event.start_time ? format(new Date(event.start_time), "yyyy-MM-dd'T'HH:mm") : ''}
                  onChange={(e) => editingEvent
                    ? setEditingEvent({...editingEvent, start_time: e.target.value})
                    : setNewEvent({...newEvent, start_time: e.target.value})
                  }
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground block mb-2">End Date & Time *</label>
                <input
                  type="datetime-local"
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  value={event.end_time ? format(new Date(event.end_time), "yyyy-MM-dd'T'HH:mm") : ''}
                  onChange={(e) => editingEvent
                    ? setEditingEvent({...editingEvent, end_time: e.target.value})
                    : setNewEvent({...newEvent, end_time: e.target.value})
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground block mb-2">Case *</label>
                <select
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  value={event.case_id}
                  onChange={(e) => editingEvent
                    ? setEditingEvent({...editingEvent, case_id: parseInt(e.target.value)})
                    : setNewEvent({...newEvent, case_id: parseInt(e.target.value)})
                  }
                >
                  <option value="0">Select a case...</option>
                  {cases.map(caseItem => (
                    <option key={caseItem.id} value={caseItem.id}>
                      {caseItem.case_number} - {caseItem.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground block mb-2">Status</label>
                <select
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  value={event.status}
                  onChange={(e) => editingEvent
                    ? setEditingEvent({...editingEvent, status: e.target.value as Event['status']})
                    : setNewEvent({...newEvent, status: e.target.value as Event['status']})
                  }
                >
                  <option value="scheduled">Scheduled</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="postponed">Postponed</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground block mb-2">Location</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Conference Room A or Virtual"
                  value={event.location || ''}
                  onChange={(e) => editingEvent
                    ? setEditingEvent({...editingEvent, location: e.target.value})
                    : setNewEvent({...newEvent, location: e.target.value})
                  }
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground block mb-2">Meeting Link</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="https://meet.example.com/room"
                  value={event.meeting_link || ''}
                  onChange={(e) => editingEvent
                    ? setEditingEvent({...editingEvent, meeting_link: e.target.value})
                    : setNewEvent({...newEvent, meeting_link: e.target.value})
                  }
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground block mb-2">Description</label>
              <textarea
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary min-h-[100px]"
                placeholder="Event description..."
                value={event.description || ''}
                onChange={(e) => editingEvent
                  ? setEditingEvent({...editingEvent, description: e.target.value})
                  : setNewEvent({...newEvent, description: e.target.value})
                }
              />
            </div>

            <div className="flex items-center gap-4 pt-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={event.all_day}
                  onChange={(e) => editingEvent
                    ? setEditingEvent({...editingEvent, all_day: e.target.checked})
                    : setNewEvent({...newEvent, all_day: e.target.checked})
                  }
                  className="w-4 h-4"
                />
                <span className="text-sm">All Day Event</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={event.client_invited}
                  onChange={(e) => editingEvent
                    ? setEditingEvent({...editingEvent, client_invited: e.target.checked})
                    : setNewEvent({...newEvent, client_invited: e.target.checked})
                  }
                  className="w-4 h-4"
                />
                <span className="text-sm">Client Invited</span>
              </label>
            </div>

            <div className="flex items-center gap-3 pt-4">
              <Button 
                variant="primary" 
                className="flex-1"
                onClick={editingEvent ? handleUpdateEvent : handleCreateEvent}
                disabled={isSubmitting}
              >
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingEvent ? 'Update Event' : 'Create Event'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowEventDialog(false);
                  setEditingEvent(null);
                  resetNewEvent();
                }}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  if (error && events.length === 0) {
    return (
      <div className="p-6 md:p-8 space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Failed to Load Calendar</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button variant="primary" onClick={fetchEvents}>
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-foreground mb-2">Calendar</h1>
          <p className="text-muted-foreground">Manage your schedule and upcoming events</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSearch(!showSearch)}
          >
            <Search className="w-4 h-4" />
          </Button>
          <div className="hidden sm:flex items-center gap-2 border border-border rounded-lg p-1">
            <Button
              variant={viewMode === 'month' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('month')}
            >
              Month
            </Button>
            <Button
              variant={viewMode === 'week' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('week')}
            >
              Week
            </Button>
            <Button
              variant={viewMode === 'day' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('day')}
            >
              Day
            </Button>
          </div>
          <Button variant="primary" onClick={() => setShowEventDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Event
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      {showSearch && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search events by title or case number..."
                className="flex-1 bg-transparent border-none outline-none text-foreground"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <Button variant="ghost" size="sm" onClick={() => setSearchQuery('')}>
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
            <div className="flex items-center gap-4 mt-4">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Status</label>
                <select
                  className="text-sm bg-transparent border-none outline-none text-foreground"
                  value={filters.status}
                  onChange={(e) => setFilters({...filters, status: e.target.value})}
                >
                  <option value="">All Status</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="postponed">Postponed</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Type</label>
                <select
                  className="text-sm bg-transparent border-none outline-none text-foreground"
                  value={filters.event_type}
                  onChange={(e) => setFilters({...filters, event_type: e.target.value})}
                >
                  <option value="">All Types</option>
                  <option value="meeting">Meeting</option>
                  <option value="hearing">Hearing</option>
                  <option value="court_date">Court Date</option>
                  <option value="deadline">Deadline</option>
                  <option value="filing">Filing</option>
                  <option value="consultation">Consultation</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Widget */}
        <div className="lg:col-span-2 space-y-6">
          {viewMode === 'month' && (
            <>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <CalendarIcon className="w-5 h-5" />
                      {format(selectedDate, 'MMMM yyyy')}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedDate(new Date())}
                      >
                        Today
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    className="rounded-md border"
                  />
                </CardContent>
              </Card>

              {/* Events for Selected Date */}
              <Card>
                <CardHeader>
                  <CardTitle>
                    Events for {format(selectedDate, 'MMMM d, yyyy')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : todayEvents.length === 0 ? (
                    <div className="text-center py-8">
                      <CalendarIcon className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground">No events scheduled for this day</p>
                      <Button 
                        variant="primary" 
                        size="sm" 
                        className="mt-4"
                        onClick={() => setShowEventDialog(true)}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Event
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {todayEvents.map((event) => (
                        <div
                          key={event.id}
                          className={`p-4 rounded-lg border ${getEventTypeColor(event.event_type)} transition-colors hover:shadow-sm`}
                        >
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-medium">{event.title}</h3>
                                <Badge variant="default" className="text-xs">
                                  {getEventTypeBadge(event.event_type)}
                                </Badge>
                                {event.priority === 'high' && (
                                  <Badge variant="warning" className="text-xs">High Priority</Badge>
                                )}
                                {event.client_invited && (
                                  <Badge variant="default" className="text-xs">Client Invited</Badge>
                                )}
                              </div>
                              {event.case_number && (
                                <p className="text-xs opacity-70 mb-2">
                                  Case: {event.case_number} - {event.case_title}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              {event.status === 'scheduled' && !event.reminder_sent && !isPast(parseISO(event.start_time)) && (
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleSendReminder(event.id)}
                                >
                                  <Clock className="w-4 h-4" />
                                </Button>
                              )}
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => {
                                  setEditingEvent(event);
                                  setShowEventDialog(true);
                                }}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleDeleteEvent(event.id)}
                              >
                                <Trash className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>

                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 opacity-70" />
                              <span>{formatEventTime(event.start_time, event.end_time, event.all_day)}</span>
                              <span className={`px-2 py-1 rounded text-xs ${getPriorityColor(event.priority)}`}>
                                {event.priority}
                              </span>
                              <span className={`px-2 py-1 rounded text-xs ${
                                event.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                                event.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                event.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                                event.status === 'cancelled' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {event.status}
                              </span>
                            </div>
                            {(event.location || event.meeting_link) && (
                              <div className="flex items-center gap-2">
                                {event.meeting_link ? (
                                  <>
                                    <Video className="w-4 h-4 opacity-70" />
                                    <a 
                                      href={event.meeting_link} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-primary hover:underline"
                                    >
                                      Join Virtual Meeting
                                    </a>
                                  </>
                                ) : (
                                  <>
                                    <MapPin className="w-4 h-4 opacity-70" />
                                    <span>{event.location}</span>
                                  </>
                                )}
                              </div>
                            )}
                            {event.assigned_to_name && (
                              <div className="flex items-center gap-2">
                                <User className="w-4 h-4 opacity-70" />
                                <span>Assigned to: {event.assigned_to_name}</span>
                              </div>
                            )}
                            {event.description && (
                              <p className="text-sm opacity-80 mt-2">{event.description}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}

          {viewMode === 'week' && renderWeekView()}
          {viewMode === 'day' && renderDayView()}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <Card className="bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div>
                  <p className="text-2xl font-semibold text-foreground">{eventStats.total}</p>
                  <p className="text-sm text-muted-foreground">Total Events</p>
                </div>
                <div className="pt-4 border-t border-border">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="font-medium text-foreground">{eventStats.hearings + eventStats.courtDates}</p>
                      <p className="text-xs text-muted-foreground">Court Events</p>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{eventStats.deadlines}</p>
                      <p className="text-xs text-muted-foreground">Deadlines</p>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{eventStats.meetings}</p>
                      <p className="text-xs text-muted-foreground">Meetings</p>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{eventStats.consultations}</p>
                      <p className="text-xs text-muted-foreground">Consultations</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Events */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Upcoming Events</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {upcomingEvents.map((event) => (
                  <div 
                    key={event.id} 
                    className="px-6 py-4 hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => setSelectedEventDetail(event)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                        event.priority === 'high' ? 'bg-destructive' :
                        event.priority === 'medium' ? 'bg-warning' : 'bg-muted-foreground'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-foreground mb-1">{event.title}</h4>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">
                            {format(parseISO(event.start_time), 'MMM d, yyyy')} at {format(parseISO(event.start_time), 'h:mm a')}
                          </p>
                          {event.case_number && (
                            <p className="text-xs text-muted-foreground">{event.case_number}</p>
                          )}
                          <div className="flex items-center gap-2">
                            <Badge variant="default" className="text-xs">
                              {getEventTypeBadge(event.event_type)}
                            </Badge>
                            {event.client_invited && (
                              <Badge variant="default" className="text-xs">Client Invited</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Event Type Legend */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Event Types</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 rounded bg-destructive/20 border border-destructive/20" />
                <span className="text-foreground">Court Events</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 rounded bg-warning/20 border border-warning/20" />
                <span className="text-foreground">Deadlines & Filings</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 rounded bg-accent/20 border border-accent/20" />
                <span className="text-foreground">Client Consultations</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 rounded bg-primary/20 border border-primary/20" />
                <span className="text-foreground">Meetings</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Event Creation/Edit Dialog */}
      {showEventDialog && renderEventDialog()}

      {/* Event Detail Dialog */}
      {selectedEventDetail && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Event Details</CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setSelectedEventDetail(null)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{selectedEventDetail.title}</h3>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="default">{getEventTypeBadge(selectedEventDetail.event_type)}</Badge>
                  {selectedEventDetail.priority === 'high' && (
                    <Badge variant="warning">High Priority</Badge>
                  )}
                  {selectedEventDetail.client_invited && (
                    <Badge variant="default">Client Invited</Badge>
                  )}
                  {selectedEventDetail.client_confirmed && (
                    <Badge variant="success">Client Confirmed</Badge>
                  )}
                  <Badge variant={
                    selectedEventDetail.status === 'scheduled' ? 'default' :
                    selectedEventDetail.status === 'confirmed' ? 'success' :
                    selectedEventDetail.status === 'completed' ? 'secondary' :
                    selectedEventDetail.status === 'cancelled' ? 'warning' : 'warning'
                  }>
                    {selectedEventDetail.status}
                  </Badge>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                  <span className="text-foreground">{format(parseISO(selectedEventDetail.start_time), 'EEEE, MMMM d, yyyy')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-foreground">
                    {formatEventTime(selectedEventDetail.start_time, selectedEventDetail.end_time, selectedEventDetail.all_day)}
                  </span>
                </div>
                {(selectedEventDetail.location || selectedEventDetail.meeting_link) && (
                  <div className="flex items-center gap-2">
                    {selectedEventDetail.meeting_link ? (
                      <>
                        <Video className="w-4 h-4 text-muted-foreground" />
                        <a 
                          href={selectedEventDetail.meeting_link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          Join Virtual Meeting
                        </a>
                      </>
                    ) : (
                      <>
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span className="text-foreground">{selectedEventDetail.location}</span>
                      </>
                    )}
                  </div>
                )}
                {selectedEventDetail.case_number && (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Case:</span>
                    <span className="text-foreground font-medium">
                      {selectedEventDetail.case_number} - {selectedEventDetail.case_title}
                    </span>
                  </div>
                )}
                {selectedEventDetail.assigned_to_name && (
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="text-foreground">Assigned to: {selectedEventDetail.assigned_to_name}</span>
                  </div>
                )}
                {selectedEventDetail.client_name && (
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="text-foreground">Client: {selectedEventDetail.client_name}</span>
                  </div>
                )}
                {selectedEventDetail.description && (
                  <div className="pt-2">
                    <p className="text-muted-foreground text-xs mb-1">Description:</p>
                    <p className="text-foreground">{selectedEventDetail.description}</p>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 pt-4 border-t border-border">
                <Button 
                  variant="primary" 
                  className="flex-1 gap-2"
                  onClick={() => {
                    setEditingEvent(selectedEventDetail);
                    setSelectedEventDetail(null);
                    setShowEventDialog(true);
                  }}
                >
                  <Edit className="w-4 h-4" />
                  Edit Event
                </Button>
                {selectedEventDetail.status === 'scheduled' && !selectedEventDetail.reminder_sent && (
                  <Button 
                    variant="outline"
                    onClick={() => handleSendReminder(selectedEventDetail.id)}
                  >
                    Send Reminder
                  </Button>
                )}
                <Button 
                  variant="destructive" 
                  onClick={() => handleDeleteEvent(selectedEventDetail.id)}
                >
                  <Trash className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}