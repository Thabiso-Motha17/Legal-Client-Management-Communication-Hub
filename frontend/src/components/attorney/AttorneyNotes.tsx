import { useState, useEffect } from 'react';
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
  Filter
} from 'lucide-react';
import type{ Note, CreateNoteData, UpdateNoteData, Case } from '../../types/Types';
import { apiRequest } from '../lib/api';

export function AssociateNotes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTag, setSelectedTag] = useState('all');
  const [showArchived, setShowArchived] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  
  const [newNote, setNewNote] = useState<CreateNoteData>({
    title: '',
    content: '',
    category: 'Uncategorized',
    tags: [],
    is_private: false,
    case_id: undefined
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch notes for the current user
      const notesResponse = await apiRequest<Note[]>(`/api/notes`);
      if (notesResponse.data) {
        setNotes(notesResponse.data);
      }
      
      // Fetch cases for the current user
      const casesResponse = await apiRequest<Case[]>(`/api/cases`);
      if (casesResponse.data) {
        setCases(casesResponse.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get all unique categories and tags
  const categories = ['all', ...Array.from(new Set(notes.map(note => note.category)))];
  const allTags = notes.flatMap(note => note.tags || []);
  const uniqueTags = ['all', ...Array.from(new Set(allTags))];

  // Filter notes
  const filteredNotes = notes.filter(note => {
    const matchesSearch = searchQuery === '' || 
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || note.category === selectedCategory;
    const matchesTag = selectedTag === 'all' || (note.tags && note.tags.includes(selectedTag));
    const matchesArchived = showArchived ? true : !note.is_archived;
    
    return matchesSearch && matchesCategory && matchesTag && matchesArchived;
  });

  const pinnedNotes = filteredNotes.filter(note => note.is_pinned && !note.is_archived);
  const otherNotes = filteredNotes.filter(note => !note.is_pinned && !note.is_archived);
  const archivedNotes = filteredNotes.filter(note => note.is_archived);

  // Note statistics
  const noteStats = {
    total: notes.filter(n => !n.is_archived).length,
    pinned: notes.filter(n => n.is_pinned && !n.is_archived).length,
    archived: notes.filter(n => n.is_archived).length,
    byCategory: Object.entries(
      notes.reduce((acc, note) => {
        acc[note.category] = (acc[note.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    )
  };

  // Note actions
  const handleCreateNote = async () => {
    if (!newNote.title.trim() || !newNote.content.trim()) {
      alert('Please fill in title and content');
      return;
    }

    try {
      const noteData: CreateNoteData = {
        title: newNote.title,
        content: newNote.content,
        category: newNote.category || 'Uncategorized',
        tags: newNote.tags || [],
        is_private: newNote.is_private,
        case_id: newNote.case_id
        // law_firm_id is NOT included - backend gets it from the authenticated user
      };

      const response = await apiRequest<Note>(`/api/notes`, {
        method: 'POST',
        body: JSON.stringify(noteData),
      });

      if (response.data) {
        setNotes([response.data, ...notes]);
        setNewNote({
          title: '',
          content: '',
          category: 'Uncategorized',
          tags: [],
          is_private: false,
          case_id: undefined
        });
        setIsEditing(false);
        fetchData(); // Refresh data
      } else if (response.error) {
        alert(`Error creating note: ${response.error}`);
      }
    } catch (error) {
      console.error('Error creating note:', error);
      alert('Failed to create note. Please try again.');
    }
  };

  const handleEditNote = (note: Note) => {
    setEditingNote({ ...note });
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!editingNote) return;
    
    try {
      const updateData: UpdateNoteData = {
        title: editingNote.title,
        content: editingNote.content,
        category: editingNote.category,
        tags: editingNote.tags || [],
        is_pinned: editingNote.is_pinned,
        is_archived: editingNote.is_archived,
        is_private: editingNote.is_private
        // law_firm_id is NOT included in updates either
      };

      const response = await apiRequest<Note>(`/api/notes/${editingNote.id}`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });

      if (response.data) {
        setNotes(notes.map(note => 
          note.id === editingNote.id ? response.data! : note
        ));
        setEditingNote(null);
        setIsEditing(false);
        fetchData(); // Refresh data
      } else if (response.error) {
        alert(`Error updating note: ${response.error}`);
      }
    } catch (error) {
      console.error('Error updating note:', error);
      alert('Failed to update note. Please try again.');
    }
  };

  const handleDeleteNote = async (id: number) => {
  if (window.confirm('Are you sure you want to delete this note?')) {
    try {
      const response = await apiRequest(`/api/notes/${id}`, {
        method: 'DELETE',
      });

      // Check if response is valid JSON
      if (response && response.message) {
        setNotes(notes.filter(note => note.id !== id));
        fetchData(); // Refresh data
        alert('Note deleted successfully');
      } else if (response && response.error) {
        alert(`Error deleting note: ${response.error}`);
      } else {
         alert('Note deleted successfully,reload');
      }
    } catch (error: any) {
      console.error('Error deleting note:', error);
      
      // Handle different types of errors
      if (error.response && error.response.status === 404) {
        alert('Note not found or endpoint does not exist');
      } else if (error.response && error.response.status === 403) {
        alert('You do not have permission to delete this note');
      } else {
        alert('Failed to delete note. Please try again.');
      }
    }
  }
};

  const handleTogglePin = async (id: number) => {
    const note = notes.find(n => n.id === id);
    if (!note) return;

    try {
      const response = await apiRequest<Note>(`/api/notes/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ is_pinned: !note.is_pinned }),
      });

      if (response.data) {
        setNotes(notes.map(note => 
          note.id === id ? response.data! : note
        ));
        fetchData(); // Refresh data
      }
    } catch (error) {
      console.error('Error toggling pin:', error);
    }
  };

  const handleToggleArchive = async (id: number) => {
    const note = notes.find(n => n.id === id);
    if (!note) return;

    try {
      const response = await apiRequest<Note>(`/api/notes/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ is_archived: !note.is_archived }),
      });

      if (response.data) {
        setNotes(notes.map(note => 
          note.id === id ? response.data! : note
        ));
        fetchData(); // Refresh data
      }
    } catch (error) {
      console.error('Error toggling archive:', error);
    }
  };

  // Get current user to display in UI if needed
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  if (loading) {
    return (
      <div className="p-6 md:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">My Notes</h1>
            <p className="text-muted-foreground">Loading notes...</p>
          </div>
        </div>
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading notes...</p>
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
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-success/10 rounded-lg">
                <Tag className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Categories</p>
                <p className="text-2xl font-semibold text-success">{categories.length - 1}</p>
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
                      setNewNote({
                        title: '',
                        content: '',
                        category: 'Uncategorized',
                        tags: [],
                        is_private: false,
                        case_id: undefined
                      });
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
                    Related Case (Optional)
                  </label>
                  <select
                    value={editingNote?.case_id || newNote.case_id || ''}
                    onChange={(e) => {
                      const value = e.target.value ? parseInt(e.target.value) : undefined;
                      if (editingNote) {
                        setEditingNote({...editingNote, case_id: value || null});
                      } else {
                        setNewNote({...newNote, case_id: value});
                      }
                    }}
                    className="w-full px-4 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">Select a case (optional)...</option>
                    {cases.map(caseItem => (
                      <option key={caseItem.id} value={caseItem.id}>
                        {caseItem.case_number} - {caseItem.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingNote?.is_private || newNote.is_private}
                    onChange={(e) => {
                      if (editingNote) {
                        setEditingNote({...editingNote, is_private: e.target.checked});
                      } else {
                        setNewNote({...newNote, is_private: e.target.checked});
                      }
                    }}
                    className="w-4 h-4 rounded border-border text-primary focus:ring-2 focus:ring-ring"
                  />
                  <span className="text-sm text-foreground">Private Note (only visible to you)</span>
                </label>
              </div>
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
                currentUser={currentUser}
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
            <div className="flex items-center gap-4">
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
                currentUser={currentUser}
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
                currentUser={currentUser}
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
  currentUser: any;
}

function NoteCard({ note, onEdit, onDelete, onTogglePin, onToggleArchive, currentUser }: NoteCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const previewContent = note.content.length > 150 
    ? note.content.substring(0, 150) + '...'
    : note.content;

  const getNoteTags = () => {
    return note.tags || [];
  };

  // Check if current user created this note
  const isMyNote = note.user_id === currentUser.id;

  return (
    <Card className={`hover:shadow-lg transition-shadow ${note.is_pinned ? 'border-warning/30' : ''}`}>
      <CardContent className="p-5">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {note.is_pinned && (
                  <Pin className="w-4 h-4 text-warning" />
                )}
                {note.is_private && (
                  <Badge variant="default" className="text-xs">Private</Badge>
                )}
                {isMyNote && (
                  <Badge variant="default" className="text-xs">My Note</Badge>
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
                  {formatDate(note.updated_at)}
                </span>
                {note.case_title && (
                  <span className="flex items-center gap-1">
                    <Folder className="w-3 h-3" />
                    {note.case_title}
                  </span>
                )}
              </div>
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onTogglePin(note.id)}
              >
                {note.is_pinned ? (
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
          {getNoteTags().length > 0 && (
            <div className="flex flex-wrap gap-1">
              {getNoteTags().map((tag, idx) => (
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
              {note.word_count || 0} words • {note.character_count || 0} chars
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