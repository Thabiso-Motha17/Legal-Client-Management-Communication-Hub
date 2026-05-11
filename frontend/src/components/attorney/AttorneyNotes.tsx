import { useState, useEffect } from 'react';
import { Card, CardContent } from '../ui/Cards';
import { Badge } from '../ui/Badges';
import { Button } from '../ui/Buttons';
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
  Calendar,
  FileText,
} from 'lucide-react';
import type { Note, CreateNoteData, UpdateNoteData, Case } from '../../types/Types';
import { apiRequest } from '../lib/api';

export function AssociateNotes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  const emptyForm: CreateNoteData = {
    title: '',
    content: '',
    category: 'Uncategorized',
    tags: [],
    is_private: false,
    case_id: undefined,
  };
  const [newNote, setNewNote] = useState<CreateNoteData & { note_date?: string }>({
    ...emptyForm,
    note_date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const notesResponse = await apiRequest<Note[]>(`/api/notes`);
      if (notesResponse.data) setNotes(notesResponse.data);

      const casesResponse = await apiRequest<Case[]>(`/api/cases`);
      if (casesResponse.data) setCases(casesResponse.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter notes
  const filteredNotes = notes.filter(note => {
    const matchesSearch =
      searchQuery === '' ||
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesArchived = showArchived ? true : !note.is_archived;
    return matchesSearch && matchesArchived;
  });

  const pinnedNotes   = filteredNotes.filter(n => n.is_pinned && !n.is_archived);
  const otherNotes    = filteredNotes.filter(n => !n.is_pinned && !n.is_archived);
  const archivedNotes = filteredNotes.filter(n => n.is_archived);

  const noteStats = {
    total:    notes.filter(n => !n.is_archived).length,
    pinned:   notes.filter(n => n.is_pinned && !n.is_archived).length,
    archived: notes.filter(n => n.is_archived).length,
  };

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  // ── actions ────────────────────────────────────────────────────────────────
  const handleCreateNote = async () => {
    if (!newNote.content.trim()) {
      alert('Please enter note content');
      return;
    }
    try {
      // Use date as title fallback, or case name
      const caseItem = cases.find(c => c.id === newNote.case_id);
      const autoTitle = caseItem
        ? `${caseItem.case_number} — ${newNote.note_date}`
        : newNote.note_date ?? new Date().toISOString().split('T')[0];

      const noteData: CreateNoteData = {
        title:      autoTitle,
        content:    newNote.content,
        category:   'Uncategorized',
        tags:       [],
        is_private: false,
        case_id:    newNote.case_id,
      };

      const response = await apiRequest<Note>(`/api/notes`, {
        method: 'POST',
        body: JSON.stringify(noteData),
      });

      if (response.data) {
        setNotes([response.data, ...notes]);
        setNewNote({
          ...emptyForm,
          note_date: new Date().toISOString().split('T')[0],
        });
        setIsEditing(false);
        fetchData();
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
        title:       editingNote.title,
        content:     editingNote.content,
        category:    editingNote.category,
        tags:        editingNote.tags || [],
        is_pinned:   editingNote.is_pinned,
        is_archived: editingNote.is_archived,
        is_private:  editingNote.is_private,
      };

      const response = await apiRequest<Note>(`/api/notes/${editingNote.id}`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });

      if (response.data) {
        setNotes(notes.map(n => (n.id === editingNote.id ? response.data! : n)));
        setEditingNote(null);
        setIsEditing(false);
        fetchData();
      } else if (response.error) {
        alert(`Error updating note: ${response.error}`);
      }
    } catch (error) {
      console.error('Error updating note:', error);
      alert('Failed to update note. Please try again.');
    }
  };

  const handleDeleteNote = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this note?')) return;
    try {
      const response = await apiRequest(`/api/notes/${id}`, { method: 'DELETE' });
      if (response && response.message) {
        setNotes(notes.filter(n => n.id !== id));
        fetchData();
      } else if (response && response.error) {
        alert(`Error deleting note: ${response.error}`);
      } else {
        alert('Note deleted successfully, reload');
      }
    } catch (error: any) {
      console.error('Error deleting note:', error);
      if (error.response?.status === 404)      alert('Note not found or endpoint does not exist');
      else if (error.response?.status === 403) alert('You do not have permission to delete this note');
      else                                     alert('Failed to delete note. Please try again.');
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
        setNotes(notes.map(n => (n.id === id ? response.data! : n)));
        fetchData();
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
        setNotes(notes.map(n => (n.id === id ? response.data! : n)));
        fetchData();
      }
    } catch (error) {
      console.error('Error toggling archive:', error);
    }
  };

  const closeForm = () => {
    setIsEditing(false);
    setEditingNote(null);
    setNewNote({ ...emptyForm, note_date: new Date().toISOString().split('T')[0] });
  };

  // ── loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="p-6 md:p-8 space-y-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">My Notes</h1>
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading notes...</p>
          </div>
        </div>
      </div>
    );
  }

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 md:p-8 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">My Notes</h1>
          <p className="text-muted-foreground">Capture, organize, and manage your legal notes</p>
        </div>
        <Button variant="primary" className="gap-2" onClick={() => setIsEditing(true)}>
          <Plus className="w-4 h-4" /> New Note
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Notes', value: noteStats.total,    icon: FileText, color: 'text-primary',   bg: 'bg-primary/10'   },
          { label: 'Pinned',      value: noteStats.pinned,   icon: Pin,      color: 'text-warning',   bg: 'bg-warning/10'   },
          { label: 'Archived',    value: noteStats.archived, icon: Folder,   color: 'text-secondary', bg: 'bg-secondary/10' },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 ${s.bg} rounded-lg`}>
                  <s.icon className={`w-5 h-5 ${s.color}`} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{s.label}</p>
                  <p className={`text-2xl font-semibold ${s.color}`}>{s.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Search className="w-5 h-5 text-muted-foreground flex-shrink-0" />
            <input
              type="text"
              placeholder="Search notes by content or case..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent border-none focus:outline-none text-foreground placeholder:text-muted-foreground"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Create / Edit Note Form ─────────────────────────────────────────── */}
      {(isEditing || editingNote) && (
        <Card className="border-2 border-primary/20">
          <CardContent className="p-6">
            <div className="space-y-5">

              {/* Form header */}
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">
                  {editingNote ? 'Edit Note' : 'New Note'}
                </h3>
                <div className="flex gap-2">
                  <Button
                    variant="primary"
                    className="gap-2"
                    onClick={editingNote ? handleSaveEdit : handleCreateNote}
                  >
                    <Save className="w-4 h-4" />
                    {editingNote ? 'Save Changes' : 'Save Note'}
                  </Button>
                  <Button variant="ghost" onClick={closeForm}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* 1. Associated Case */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Associated Case
                </label>
                <select
                  value={editingNote ? (editingNote.case_id ?? '') : (newNote.case_id ?? '')}
                  onChange={e => {
                    const val = e.target.value ? parseInt(e.target.value) : undefined;
                    editingNote
                      ? setEditingNote({ ...editingNote, case_id: val ?? null })
                      : setNewNote({ ...newNote, case_id: val });
                  }}
                  className="w-full px-4 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Select a case</option>
                  {cases.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.case_number} - {c.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Date */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="date"
                    value={
                      editingNote
                        ? (editingNote.updated_at?.split('T')[0] ?? new Date().toISOString().split('T')[0])
                        : newNote.note_date
                    }
                    onChange={e => {
                      if (!editingNote) setNewNote({ ...newNote, note_date: e.target.value });
                    }}
                    readOnly={!!editingNote}
                    className="w-full pl-10 pr-4 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>

              {/* 3. Note Content */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Note
                </label>
                <Textarea
                  placeholder="Start typing your note here..."
                  value={editingNote?.content ?? newNote.content}
                  onChange={e =>
                    editingNote
                      ? setEditingNote({ ...editingNote, content: e.target.value })
                      : setNewNote({ ...newNote, content: e.target.value })
                  }
                  rows={10}
                  className="resize-none"
                />
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
            <Badge variant="warning" className="ml-2">{pinnedNotes.length}</Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pinnedNotes.map(note => (
              <NoteCard
                key={note.id}
                note={note}
                cases={cases}
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

      {/* All Notes */}
      {otherNotes.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-foreground">All Notes</h2>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showArchived}
                onChange={e => setShowArchived(e.target.checked)}
                className="w-4 h-4 rounded border-border text-primary focus:ring-2 focus:ring-ring"
              />
              <span className="text-sm text-foreground">Show archived</span>
            </label>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {otherNotes.map(note => (
              <NoteCard
                key={note.id}
                note={note}
                cases={cases}
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
            <Badge variant="secondary" className="ml-2">{archivedNotes.length}</Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {archivedNotes.map(note => (
              <NoteCard
                key={note.id}
                note={note}
                cases={cases}
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
              {searchQuery ? 'Try adjusting your search' : 'Create your first note to get started'}
            </p>
            <Button variant="primary" onClick={() => setIsEditing(true)}>
              <Plus className="w-4 h-4 mr-2" /> Create New Note
            </Button>
          </CardContent>
        </Card>
      )}

    </div>
  );
}

// ── NoteCard ──────────────────────────────────────────────────────────────────
interface NoteCardProps {
  note: Note;
  cases: Case[];
  onEdit: (note: Note) => void;
  onDelete: (id: number) => void;
  onTogglePin: (id: number) => void;
  onToggleArchive: (id: number) => void;
  currentUser: any;
}

function NoteCard({ note, cases, onEdit, onDelete, onTogglePin, onToggleArchive, currentUser }: NoteCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });

  const previewContent =
    note.content.length > 160 ? note.content.substring(0, 160) + '...' : note.content;

  const caseTitle =
    note.case_title ??
    cases.find(c => c.id === note.case_id)?.case_number ??
    null;

  const isMyNote = note.user_id === currentUser.id;

  return (
    <Card className={`hover:shadow-lg transition-shadow ${note.is_pinned ? 'border-warning/30' : ''}`}>
      <CardContent className="p-5">
        <div className="space-y-3">

          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0 space-y-1">
              {/* Case */}
              {caseTitle && (
                <div className="flex items-center gap-1 text-xs font-medium text-primary">
                  <Folder className="w-3 h-3" />
                  <span className="truncate">{caseTitle}</span>
                </div>
              )}
              {/* Date + badges */}
              <div className="flex items-center flex-wrap gap-2 text-xs text-muted-foreground">
                {note.is_pinned && <Pin className="w-3.5 h-3.5 text-warning" />}
                {isMyNote && <Badge variant="default" className="text-xs">My Note</Badge>}
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatDate(note.updated_at)}
                </span>
              </div>
            </div>
            {/* Pin toggle */}
            <Button variant="ghost" size="sm" onClick={() => onTogglePin(note.id)}>
              {note.is_pinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
            </Button>
          </div>

          {/* Note content */}
          <div className="space-y-1">
            <p className={`text-sm text-muted-foreground whitespace-pre-wrap ${isExpanded ? '' : 'line-clamp-4'}`}>
              {isExpanded ? note.content : previewContent}
            </p>
            {note.content.length > 160 && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-xs text-primary hover:underline"
              >
                {isExpanded ? 'Show less' : 'Read more'}
              </button>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <span className="text-xs text-muted-foreground">
              {note.word_count || 0} words
            </span>
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" onClick={() => onEdit(note)}>
                <Edit className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => onToggleArchive(note.id)}>
                <Folder className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => onDelete(note.id)}
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