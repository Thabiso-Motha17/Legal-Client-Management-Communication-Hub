import { useState } from 'react';
import { Card } from '../ui/Cards';
import { Badge } from '../ui/Badges';
import { Button } from '../ui/Buttons';
import { Search, Send, Paperclip, MoreVertical, Circle } from 'lucide-react';

interface Message {
  id: string;
  sender: string;
  role: string;
  subject: string;
  preview: string;
  time: string;
  unread: boolean;
  case?: string;
}

interface ChatMessage {
  id: string;
  sender: string;
  content: string;
  time: string;
  isCurrentUser: boolean;
}

const mockThreads: Message[] = [
  {
    id: '1',
    sender: 'James Henderson',
    role: 'Client',
    subject: 'Question about discovery timeline',
    preview: 'Hi Sarah, I wanted to follow up on the timeline we discussed for the discovery phase...',
    time: '2 hours ago',
    unread: true,
    case: 'CAS-2026-001'
  },
  {
    id: '2',
    sender: 'Michael Chen',
    role: 'Associate Attorney',
    subject: 'Martinez Estate - Document Review',
    preview: 'I\'ve completed the review of the estate documents. There are a few items that need...',
    time: '4 hours ago',
    unread: true,
    case: 'CAS-2026-002'
  },
  {
    id: '3',
    sender: 'Maria Martinez',
    role: 'Client',
    subject: 'Thank you for the update',
    preview: 'Thank you for keeping me informed about the progress. I appreciate your attention to...',
    time: '1 day ago',
    unread: false,
    case: 'CAS-2026-002'
  },
  {
    id: '4',
    sender: 'Robert Wilson',
    role: 'Client',
    subject: 'Insurance claim documentation',
    preview: 'I have the additional documentation you requested. Should I upload it through the portal or...',
    time: '2 days ago',
    unread: false,
    case: 'CAS-2025-078'
  },
  {
    id: '5',
    sender: 'Jennifer Lee',
    role: 'Paralegal',
    subject: 'Court filing confirmation',
    preview: 'The motion was successfully filed with the court this morning. Confirmation number...',
    time: '3 days ago',
    unread: false,
    case: 'CAS-2026-001'
  }
];

const mockConversation: ChatMessage[] = [
  {
    id: '1',
    sender: 'James Henderson',
    content: 'Hi Sarah, I wanted to follow up on the timeline we discussed for the discovery phase. When should I expect to hear back from opposing counsel?',
    time: '2:15 PM',
    isCurrentUser: false
  },
  {
    id: '2',
    sender: 'Sarah Mitchell',
    content: 'Hi James, thank you for reaching out. Based on the court schedule, we should receive their response within the next 10-14 days. I\'ll keep you updated as soon as we hear anything.',
    time: '2:45 PM',
    isCurrentUser: true
  },
  {
    id: '3',
    sender: 'James Henderson',
    content: 'That sounds good. Also, I wanted to ask about the deposition scheduled for next month. Do I need to prepare anything specific?',
    time: '3:10 PM',
    isCurrentUser: false
  },
  {
    id: '4',
    sender: 'Sarah Mitchell',
    content: 'Good question. I\'ll schedule a preparation session with you next week to go over everything. We\'ll review potential questions and discuss best practices for depositions.',
    time: '3:25 PM',
    isCurrentUser: true
  }
];

export function Messages() {
  const [selectedThread, setSelectedThread] = useState<Message | null>(mockThreads[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [messageInput, setMessageInput] = useState('');

  const filteredThreads = mockThreads.filter(thread =>
    thread.sender.toLowerCase().includes(searchQuery.toLowerCase()) ||
    thread.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSendMessage = () => {
    if (messageInput.trim()) {
      // In a real app, this would send the message
      setMessageInput('');
    }
  };

  return (
    <div className="p-8 h-[calc(100vh-8rem)]">
      <div className="mb-6">
        <h1 className="text-foreground mb-1">Messages</h1>
        <p className="text-muted-foreground text-sm">Secure communication with clients and team members</p>
      </div>

      <Card className="h-[calc(100%-6rem)] flex">
        {/* Thread List */}
        <div className="w-96 border-r border-border flex flex-col">
          <div className="p-4 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search messages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredThreads.map((thread) => (
              <button
                key={thread.id}
                onClick={() => setSelectedThread(thread)}
                className={`w-full text-left p-4 border-b border-border transition-colors ${
                  selectedThread?.id === thread.id
                    ? 'bg-muted/50'
                    : 'hover:bg-muted/30'
                }`}
              >
                <div className="flex items-start justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary flex-shrink-0">
                      {thread.sender.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-foreground text-sm truncate">{thread.sender}</p>
                        {thread.unread && (
                          <Circle className="w-2 h-2 fill-accent text-accent flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{thread.role}</p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">{thread.time}</span>
                </div>
                <p className="font-medium text-sm text-foreground mb-1 truncate">{thread.subject}</p>
                <p className="text-sm text-muted-foreground line-clamp-2">{thread.preview}</p>
                {thread.case && (
                  <div className="mt-2">
                    <Badge variant="secondary" className="text-xs">{thread.case}</Badge>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Conversation View */}
        {selectedThread ? (
          <div className="flex-1 flex flex-col">
            <div className="p-4 border-b border-border">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                      {selectedThread.sender.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground">{selectedThread.sender}</h3>
                      <p className="text-sm text-muted-foreground">{selectedThread.role}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {selectedThread.case && (
                    <Badge variant="secondary">{selectedThread.case}</Badge>
                  )}
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <h4 className="mt-3 text-foreground">{selectedThread.subject}</h4>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {mockConversation.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.isCurrentUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[70%] ${msg.isCurrentUser ? 'order-2' : 'order-1'}`}>
                    <div
                      className={`rounded-lg px-4 py-3 ${
                        msg.isCurrentUser
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-foreground'
                      }`}
                    >
                      <p className="text-sm mb-1">{msg.content}</p>
                      <p className={`text-xs ${
                        msg.isCurrentUser ? 'text-primary-foreground/70' : 'text-muted-foreground'
                      }`}>
                        {msg.time}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-border">
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <textarea
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder="Type your message..."
                    rows={3}
                    className="w-full px-4 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Button variant="ghost" size="sm">
                    <Paperclip className="w-4 h-4" />
                  </Button>
                  <Button variant="primary" size="sm" onClick={handleSendMessage}>
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                All messages are encrypted and securely stored. Do not share sensitive personal information.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <p>Select a conversation to view messages</p>
          </div>
        )}
      </Card>
    </div>
  );
}
