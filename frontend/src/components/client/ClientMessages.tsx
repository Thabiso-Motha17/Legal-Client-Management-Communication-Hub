import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Cards';
import { Badge } from '../ui/Badges';
import { Button } from '../ui/Buttons';
import { 
  MessageSquare, 
  Send, 
  Paperclip,
  Search,
  MoreVertical
} from 'lucide-react';

export function ClientMessages() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedThread, setSelectedThread] = useState(1);
  const [messageText, setMessageText] = useState('');

  const messageThreads = [
    {
      id: 1,
      sender: 'Sarah Mitchell',
      subject: 'Trust agreement review needed',
      preview: 'Hi John, I\'ve uploaded the second revision of your trust agreement...',
      date: 'Jan 10, 2026',
      time: '10:30 AM',
      unread: true,
      messageCount: 5
    },
    {
      id: 2,
      sender: 'Sarah Mitchell',
      subject: 'Upcoming meeting confirmation',
      preview: 'Looking forward to our meeting on January 25th at 2:00 PM...',
      date: 'Jan 8, 2026',
      time: '3:45 PM',
      unread: false,
      messageCount: 3
    },
    {
      id: 3,
      sender: 'Legal Assistant',
      subject: 'Document upload confirmation',
      preview: 'We\'ve received your property valuation documents. Thank you...',
      date: 'Jan 7, 2026',
      time: '11:20 AM',
      unread: false,
      messageCount: 2
    },
    {
      id: 4,
      sender: 'Sarah Mitchell',
      subject: 'Will signing appointment',
      preview: 'Your will has been prepared and is ready for signing...',
      date: 'Jan 5, 2026',
      time: '2:15 PM',
      unread: false,
      messageCount: 4
    }
  ];

  const messages = [
    {
      id: 1,
      sender: 'Sarah Mitchell',
      isClient: false,
      content: 'Hi John, I hope this message finds you well. I\'ve uploaded the second revision of your trust agreement based on our last conversation. Please review it at your earliest convenience.',
      timestamp: 'Jan 10, 2026 - 10:30 AM',
      attachments: ['Trust Agreement - Draft v2.pdf']
    },
    {
      id: 2,
      sender: 'You',
      isClient: true,
      content: 'Thank you, Sarah. I\'ll review it this week. Just to confirm - this includes the changes we discussed regarding the family trust provisions?',
      timestamp: 'Jan 10, 2026 - 11:45 AM',
      attachments: []
    },
    {
      id: 3,
      sender: 'Sarah Mitchell',
      isClient: false,
      content: 'Yes, absolutely. The family trust provisions have been updated as per our discussion. I\'ve also added the charitable giving clause you mentioned. Let me know if you have any questions.',
      timestamp: 'Jan 10, 2026 - 2:20 PM',
      attachments: []
    },
    {
      id: 4,
      sender: 'You',
      isClient: true,
      content: 'Perfect. I should have feedback by Friday. One quick question - when do we need to finalize this?',
      timestamp: 'Jan 10, 2026 - 3:10 PM',
      attachments: []
    },
    {
      id: 5,
      sender: 'Sarah Mitchell',
      isClient: false,
      content: 'Great! We\'re targeting to have everything finalized by the end of the month. Take your time with the review - accuracy is more important than speed here.',
      timestamp: 'Jan 10, 2026 - 4:05 PM',
      attachments: []
    }
  ];

  const filteredThreads = messageThreads.filter(thread =>
    thread.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    thread.sender.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSendMessage = () => {
    if (messageText.trim()) {
      // In a real app, this would send the message to the backend
      setMessageText('');
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-foreground mb-2">Messages</h1>
        <p className="text-muted-foreground">Communicate securely with your legal team</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-280px)]">
        {/* Message List */}
        <Card className="lg:col-span-1 flex flex-col">
          <CardHeader className="flex-shrink-0">
            <CardTitle className="flex items-center justify-between">
              <span>Conversations</span>
              <Badge variant="error">{messageThreads.filter(t => t.unread).length}</Badge>
            </CardTitle>
          </CardHeader>
          <div className="px-6 pb-4 flex-shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search messages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring transition-shadow text-sm"
              />
            </div>
          </div>
          <CardContent className="p-0 flex-1 overflow-y-auto">
            <div className="divide-y divide-border">
              {filteredThreads.map((thread) => (
                <button
                  key={thread.id}
                  onClick={() => setSelectedThread(thread.id)}
                  className={`w-full px-6 py-4 text-left hover:bg-muted/30 transition-colors ${
                    selectedThread === thread.id ? 'bg-muted/50' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 text-sm">
                        {thread.sender.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-foreground truncate">{thread.sender}</p>
                          {thread.unread && (
                            <div className="w-2 h-2 bg-accent rounded-full flex-shrink-0"></div>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{thread.date}</p>
                      </div>
                    </div>
                  </div>
                  <p className={`text-sm mb-1 truncate ${thread.unread ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
                    {thread.subject}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{thread.preview}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Message Thread */}
        <Card className="lg:col-span-2 flex flex-col">
          <CardHeader className="flex-shrink-0 border-b border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm">
                  SM
                </div>
                <div>
                  <CardTitle className="text-base">Sarah Mitchell</CardTitle>
                  <p className="text-xs text-muted-foreground">Senior Partner • Online</p>
                </div>
              </div>
              <Button variant="ghost" size="sm">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>

          {/* Messages */}
          <CardContent className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.isClient ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[80%] ${message.isClient ? 'order-2' : 'order-1'}`}>
                  {!message.isClient && (
                    <p className="text-xs text-muted-foreground mb-1 ml-1">{message.sender}</p>
                  )}
                  <div
                    className={`rounded-lg p-4 ${
                      message.isClient
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{message.content}</p>
                    {message.attachments.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-border/20 space-y-2">
                        {message.attachments.map((attachment, index) => (
                          <div
                            key={index}
                            className={`flex items-center gap-2 p-2 rounded ${
                              message.isClient
                                ? 'bg-primary-foreground/10'
                                : 'bg-background'
                            }`}
                          >
                            <Paperclip className="w-4 h-4 flex-shrink-0" />
                            <span className="text-xs truncate flex-1">{attachment}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 ml-1">{message.timestamp}</p>
                </div>
              </div>
            ))}
          </CardContent>

          <Card className="bg-gradient-to-br from-accent/5 to-transparent border-accent/20">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
              <MessageSquare className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h3 className="text-foreground font-medium mb-1">Secure Communication</h3>
              <p className="text-sm text-muted-foreground">
                All messages are encrypted and confidential. Your attorney typically responds within 24 hours during business days.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

          {/* Message Input */}
          <div className="flex-shrink-0 border-t border-border p-4">
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Type your message..."
                  rows={3}
                  className="w-full px-4 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring transition-shadow resize-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                />
                <div className="flex items-center justify-between mt-2">
                  <Button variant="ghost" size="sm" className="gap-2">
                    <Paperclip className="w-4 h-4" />
                    Attach File
                  </Button>
                  <p className="text-xs text-muted-foreground">Press Enter to send, Shift+Enter for new line</p>
                </div>
              </div>
              <Button
                variant="primary"
                onClick={handleSendMessage}
                disabled={!messageText.trim()}
                className="gap-2 self-end"
              >
                <Send className="w-4 h-4" />
                Send
              </Button>
            </div>
          </div>
        </Card>
      </div>

    </div>
  );
}
