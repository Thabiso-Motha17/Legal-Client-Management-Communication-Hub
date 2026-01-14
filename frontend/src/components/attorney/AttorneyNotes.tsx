import { useState } from 'react';
import { Card, CardContent } from '../ui/Cards';
import { Badge } from '../ui/Badges';
import { Button } from '../ui/Buttons';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Save,
  X,
  Pin,
  PinOff,
  Folder,
  Tag,
  Calendar,
  FileText,
  BookOpen,
  Filter
} from 'lucide-react';

interface Note {
  id: number;
  title: string;
  content: string;
  category: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  lastAccessed: string;
  wordCount: number;
  isPinned: boolean;
  isArchived: boolean;
}

export function AssociateNotes() {
  const [notes, setNotes] = useState<Note[]>([
    {
      id: 1,
      title: 'Client Meeting Notes - Johnson Estate',
      content: 'Discussed trust amendments. Client wants to add grandchildren as beneficiaries. Need to review tax implications.\n\nAction Items:\n1. Draft amendment by Friday\n2. Schedule follow-up meeting\n3. Research estate tax thresholds',
      category: 'Client Meetings',
      tags: ['estate-planning', 'client', 'urgent'],
      createdAt: '2026-01-10',
      updatedAt: '2026-01-12',
      lastAccessed: '2026-01-13',
      wordCount: 85,
      isPinned: true,
      isArchived: false
    },
    {
      id: 2,
      title: 'Merger Agreement Research',
      content: 'Key points from merger agreement review:\n- Section 4.2 needs clarification on indemnification\n- Non-compete clauses are too broad\n- Need to negotiate termination clauses',
      category: 'Research',
      tags: ['corporate', 'merger', 'contract-review'],
      createdAt: '2026-01-08',
      updatedAt: '2026-01-09',
      lastAccessed: '2026-01-12',
      wordCount: 45,
      isPinned: true,
      isArchived: false
    },
    {
      id: 3,
      title: 'Legal Research - Data Privacy Laws',
      content: 'Summary of GDPR requirements:\n- Data minimization principle\n- Right to be forgotten\n- Cross-border data transfer restrictions\n\nApplicability to client\'s EU operations',
      category: 'Legal Research',
      tags: ['privacy', 'gdpr', 'international'],
      createdAt: '2026-01-05',
      updatedAt: '2026-01-07',
      lastAccessed: '2026-01-10',
      wordCount: 120,
      isPinned: false,
      isArchived: false
    },
    {
      id: 4,
      title: 'Case Strategy - Smith Contract',
      content: 'Initial strategy for contract dispute:\n1. Gather all communications\n2. Review termination clauses\n3. Assess damages\n4. Consider mediation vs litigation',
      category: 'Case Strategy',
      tags: ['dispute', 'strategy', 'contract'],
      createdAt: '2026-01-03',
      updatedAt: '2026-01-04',
      lastAccessed: '2026-01-09',
      wordCount: 65,
      isPinned: false,
      isArchived: false
    },
    {
      id: 5,
      title: 'Conference Takeaways',
      content: 'Key insights from LegalTech Conference 2026:\n- AI contract review tools maturing\n- Blockchain for smart contracts\n- New e-discovery best practices',
      category: 'Professional Development',
      tags: ['conference', 'tech', 'learning'],
      createdAt: '2025-12-15',
      updatedAt: '2025-12-20',
      lastAccessed: '2026-01-08',
      wordCount: 55,
      isPinned: false,
      isArchived: false
    },
    {
      id: 6,
      title: 'Template Library Ideas',
      content: 'Common templates needed:\n1. NDA agreements\n2. Engagement letters\n3. Settlement agreements\n4. Client intake forms',
      category: 'Templates',
      tags: ['templates', 'organization', 'efficiency'],
      createdAt: '2025-12-10',
      updatedAt: '2025-12-12',
      lastAccessed: '2026-01-05',
      wordCount: 40,
      isPinned: false,
      isArchived: false
    },
    {
      id: 7,
      title: 'Deposition Preparation',
      content: 'Questions for witness:\n1. Timeline of events\n2. Communication records\n3. Decision-making process\n4. Knowledge of agreements',
      category: 'Litigation',
      tags: ['deposition', 'preparation', 'witness'],
      createdAt: '2025-12-08',
      updatedAt: '2025-12-08',
      lastAccessed: '2026-01-04',
      wordCount: 75,
      isPinned: false,
      isArchived: false
    },
    {
      id: 8,
      title: 'Old Meeting Notes',
      content: 'Archived meeting notes from Q4 2025',
      category: 'Archived',
      tags: ['old', 'meeting'],
      createdAt: '2025-10-15',
      updatedAt: '2025-10-15',
      lastAccessed: '2025-12-30',
      wordCount: 20,
      isPinned: false,
      isArchived: true
    }
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTag, setSelectedTag] = useState('all');
  const [showArchived, setShowArchived] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [newNote, setNewNote] = useState({
    title: '',
    content: '',
    category: '',
    tags: [] as string[]
  });

  // Get all unique categories and tags
  const categories = ['all', ...Array.from(new Set(notes.map(note => note.category)))];
  const allTags = notes.flatMap(note => note.tags);
  const uniqueTags = ['all', ...Array.from(new Set(allTags))];

  // Filter notes
  const filteredNotes = notes.filter(note => {
    const matchesSearch = searchQuery === '' || 
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || note.category === selectedCategory;
    const matchesTag = selectedTag === 'all' || note.tags.includes(selectedTag);
    const matchesArchived = showArchived ? true : !note.isArchived;
    
    return matchesSearch && matchesCategory && matchesTag && matchesArchived;
  });

  const pinnedNotes = filteredNotes.filter(note => note.isPinned && !note.isArchived);
  const otherNotes = filteredNotes.filter(note => !note.isPinned && !note.isArchived);
  const archivedNotes = filteredNotes.filter(note => note.isArchived);

  // Note statistics
  const noteStats = {
    total: notes.filter(n => !n.isArchived).length,
    pinned: notes.filter(n => n.isPinned && !n.isArchived).length,
    archived: notes.filter(n => n.isArchived).length,
    byCategory: Object.entries(
      notes.reduce((acc, note) => {
        acc[note.category] = (acc[note.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    )
  };

  // Note actions
  const handleCreateNote = () => {
    if (!newNote.title.trim() || !newNote.content.trim()) return;
    
    const note: Note = {
      id: notes.length + 1,
      title: newNote.title,
      content: newNote.content,
      category: newNote.category || 'Uncategorized',
      tags: newNote.tags,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
      lastAccessed: new Date().toISOString().split('T')[0],
      wordCount: newNote.content.split(/\s+/).length,
      isPinned: false,
      isArchived: false
    };
    
    setNotes([note, ...notes]);
    setNewNote({ title: '', content: '', category: '', tags: [] });
    setIsEditing(false);
  };

  const handleEditNote = (note: Note) => {
    setEditingNote({ ...note });
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (!editingNote) return;
    
    setNotes(notes.map(note => 
      note.id === editingNote.id 
        ? { 
            ...editingNote, 
            updatedAt: new Date().toISOString().split('T')[0],
            wordCount: editingNote.content.split(/\s+/).length
          }
        : note
    ));
    
    setEditingNote(null);
    setIsEditing(false);
  };

  const handleDeleteNote = (id: number) => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      setNotes(notes.filter(note => note.id !== id));
    }
  };

  const handleTogglePin = (id: number) => {
    setNotes(notes.map(note => 
      note.id === id ? { ...note, isPinned: !note.isPinned } : note
    ));
  };

  const handleToggleArchive = (id: number) => {
    setNotes(notes.map(note => 
      note.id === id ? { ...note, isArchived: !note.isArchived } : note
    ));
  };

  const handleAddTag = (tag: string) => {
    if (tag && !newNote.tags.includes(tag)) {
      setNewNote({ ...newNote, tags: [...newNote.tags, tag] });
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setNewNote({ 
      ...newNote, 
      tags: newNote.tags.filter(tag => tag !== tagToRemove) 
    });
  };

  // Format date
  

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">My Notes</h1>
          <p className="text-muted-foreground">Capture, organize, and manage your legal notes</p>
        </div>
        <Button 
          variant="primary" 
          className="gap-2"
          onClick={() => setIsEditing(true)}
        >
          <Plus className="w-4 h-4" />
          New Note
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Notes</p>
                <p className="text-2xl font-semibold text-foreground">{noteStats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-warning/10 rounded-lg">
                <Pin className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Pinned</p>
                <p className="text-2xl font-semibold text-warning">{noteStats.pinned}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-muted rounded-lg">
                <BookOpen className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Categories</p>
                <p className="text-2xl font-semibold text-foreground">{noteStats.byCategory.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-muted/5 to-transparent border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-secondary/10 rounded-lg">
                <Folder className="w-5 h-5 text-secondary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Archived</p>
                <p className="text-2xl font-semibold text-secondary">{noteStats.archived}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Search className="w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search notes by title or content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent border-none focus:outline-none text-foreground placeholder:text-muted-foreground"
              />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="flex-1 text-sm bg-input-background border-none focus:outline-none text-foreground"
                >
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category === 'all' ? 'All Categories' : category}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-muted-foreground" />
                <select
                  value={selectedTag}
                  onChange={(e) => setSelectedTag(e.target.value)}
                  className="flex-1 text-sm bg-input-background border-none focus:outline-none text-foreground"
                >
                  {uniqueTags.map(tag => (
                    <option key={tag} value={tag}>
                      {tag === 'all' ? 'All Tags' : `#${tag}`}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create/Edit Note Form */}
      {(isEditing || editingNote) && (
        <Card className="border-2 border-primary/20">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">
                  {editingNote ? 'Edit Note' : 'Create New Note'}
                </h3>
                <div className="flex gap-2">
                  <Button
                    variant="primary"
                    onClick={editingNote ? handleSaveEdit : handleCreateNote}
                    className="gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {editingNote ? 'Save Changes' : 'Create Note'}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setIsEditing(false);
                      setEditingNote(null);
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              <Input
                placeholder="Note Title"
                value={editingNote?.title || newNote.title}
                onChange={(e) => editingNote 
                  ? setEditingNote({...editingNote, title: e.target.value})
                  : setNewNote({...newNote, title: e.target.value})
                }
                className="text-lg font-medium"
              />
              
              <Textarea
                placeholder="Start typing your note here..."
                value={editingNote?.content || newNote.content}
                onChange={(e) => editingNote
                  ? setEditingNote({...editingNote, content: e.target.value})
                  : setNewNote({...newNote, content: e.target.value})
                }
                rows={8}
                className="resize-none"
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Category
                  </label>
                  <Input
                    placeholder="e.g., Client Meetings, Research"
                    value={editingNote?.category || newNote.category}
                    onChange={(e) => editingNote
                      ? setEditingNote({...editingNote, category: e.target.value})
                      : setNewNote({...newNote, category: e.target.value})
                    }
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Tags (comma separated)
                  </label>
                  <Input
                    placeholder="e.g., urgent, client, research"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ',') {
                        e.preventDefault();
                        const input = e.currentTarget as HTMLInputElement;
                        const tag = input.value.trim();
                        if (tag) {
                          if (editingNote) {
                            setEditingNote({
                              ...editingNote,
                              tags: [...editingNote.tags, tag]
                            });
                          } else {
                            handleAddTag(tag);
                          }
                          input.value = '';
                        }
                      }
                    }}
                  />
                </div>
              </div>
              
              {(editingNote?.tags.length || newNote.tags.length) > 0 && (
                <div className="flex flex-wrap gap-2">
                  {(editingNote?.tags || newNote.tags).map((tag, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-1 px-3 py-1 bg-primary/10 rounded-full text-sm"
                    >
                      <span className="text-primary">#{tag}</span>
                      <button
                        onClick={() => editingNote
                          ? setEditingNote({
                              ...editingNote,
                              tags: editingNote.tags.filter(t => t !== tag)
                            })
                          : handleRemoveTag(tag)
                        }
                        className="ml-1 text-muted-foreground hover:text-destructive"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pinned Notes */}
      {pinnedNotes.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Pin className="w-5 h-5 text-warning" />
            <h2 className="text-xl font-semibold text-foreground">Pinned Notes</h2>
            <Badge variant="warning" className="ml-2">
              {pinnedNotes.length}
            </Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pinnedNotes.map(note => (
              <NoteCard
                key={note.id}
                note={note}
                onEdit={handleEditNote}
                onDelete={handleDeleteNote}
                onTogglePin={handleTogglePin}
                onToggleArchive={handleToggleArchive}
              />
            ))}
          </div>
        </div>
      )}

      {/* Other Notes */}
      {otherNotes.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-foreground">All Notes</h2>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showArchived}
                onChange={(e) => setShowArchived(e.target.checked)}
                className="w-4 h-4 rounded border-border text-primary focus:ring-2 focus:ring-ring"
              />
              <span className="text-sm text-foreground">Show archived notes</span>
            </label>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {otherNotes.map(note => (
              <NoteCard
                key={note.id}
                note={note}
                onEdit={handleEditNote}
                onDelete={handleDeleteNote}
                onTogglePin={handleTogglePin}
                onToggleArchive={handleToggleArchive}
              />
            ))}
          </div>
        </div>
      )}

      {/* Archived Notes */}
      {showArchived && archivedNotes.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Folder className="w-5 h-5 text-secondary" />
            <h2 className="text-xl font-semibold text-foreground">Archived Notes</h2>
            <Badge variant="secondary" className="ml-2">
              {archivedNotes.length}
            </Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {archivedNotes.map(note => (
              <NoteCard
                key={note.id}
                note={note}
                onEdit={handleEditNote}
                onDelete={handleDeleteNote}
                onTogglePin={handleTogglePin}
                onToggleArchive={handleToggleArchive}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredNotes.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-foreground mb-1">No notes found</p>
            <p className="text-sm text-muted-foreground mb-4">
              {searchQuery || selectedCategory !== 'all' || selectedTag !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Create your first note to get started'}
            </p>
            <Button variant="primary" onClick={() => setIsEditing(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create New Note
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Note Card Component
interface NoteCardProps {
  note: Note;
  onEdit: (note: Note) => void;
  onDelete: (id: number) => void;
  onTogglePin: (id: number) => void;
  onToggleArchive: (id: number) => void;
}

function NoteCard({ note, onEdit, onDelete, onTogglePin, onToggleArchive }: NoteCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };
  
  const previewContent = note.content.length > 150 
    ? note.content.substring(0, 150) + '...'
    : note.content;

  return (
    <Card className={`hover:shadow-lg transition-shadow ${note.isPinned ? 'border-warning/30' : ''}`}>
      <CardContent className="p-5">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {note.isPinned && (
                  <Pin className="w-4 h-4 text-warning" />
                )}
                <h3 className="text-sm font-semibold text-foreground truncate">
                  {note.title}
                </h3>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <Badge variant="default" className="text-xs">
                  {note.category}
                </Badge>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatDate(note.updatedAt)}
                </span>
              </div>
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onTogglePin(note.id)}
              >
                {note.isPinned ? (
                  <PinOff className="w-4 h-4" />
                ) : (
                  <Pin className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-2">
            <p className={`text-sm text-muted-foreground ${isExpanded ? '' : 'line-clamp-3'}`}>
              {isExpanded ? note.content : previewContent}
            </p>
            {note.content.length > 150 && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-xs text-primary hover:underline"
              >
                {isExpanded ? 'Show less' : 'Read more'}
              </button>
            )}
          </div>

          {/* Tags */}
          {note.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {note.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 bg-muted rounded text-xs text-muted-foreground"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <div className="text-xs text-muted-foreground">
              {note.wordCount} words • Last accessed: {formatDate(note.lastAccessed)}
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(note)}
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onToggleArchive(note.id)}
              >
                <Folder className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(note.id)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}