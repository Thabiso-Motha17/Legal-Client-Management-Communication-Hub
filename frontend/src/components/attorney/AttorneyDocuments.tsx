import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Cards';
import { Badge } from '../ui/Badges';
import { Button } from '../ui/Buttons';
import {
  FileText,
  Upload,
  Eye,
  Search,
  Filter,
  Calendar,
  User,
  Briefcase,
  X,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Trash2,
  ExternalLink,
  FolderOpen,
  Folder,
} from 'lucide-react';
import type { Document, CreateDocumentData, Case } from '../../types/Types';
import { API_URL } from '../../api';

// ── Document category / subtype definitions ───────────────────────────────────
const documentCategories: Record<string, string[]> = {
  'Personal Injury': [
    'Hospital Record',
    'Expert Report',
    'Accident Report & Dockets',
    'RAF Forms',
    'Notices',
    'Pleadings',
    'Correspondences',
    'Client Information',
    'Court Orders',
    'Receipt',
  ],
  'Divorce': [
    'Client Information',
    'Pleadings',
    'Notices',
    'Correspondences',
    'Receipts',
    'Divorce Forms',
  ],
  'Estate': [
    'Estate Forms',
    'Correspondences',
    'Letter of Executorship',
    'Letter of Authority',
  ],
  'General Litigation': [
    'Pleadings',
    'Notices',
    'Correspondence',
    'Other Documents',
    'Receipts',
  ],
  'Local Government Matters': [
    'Pleadings',
    'Notices',
    'Correspondences',
    'Court Orders',
    'Receipts',
  ],
};

// Per-category colour tokens
const categoryStyle: Record<string, { border: string; bg: string; text: string; iconBg: string }> = {
  'Personal Injury':          { border: 'border-l-blue-500',   bg: 'bg-blue-50 dark:bg-blue-950/20',    text: 'text-blue-700 dark:text-blue-400',    iconBg: 'bg-blue-100 dark:bg-blue-900/40'    },
  'Divorce':                  { border: 'border-l-purple-500', bg: 'bg-purple-50 dark:bg-purple-950/20', text: 'text-purple-700 dark:text-purple-400', iconBg: 'bg-purple-100 dark:bg-purple-900/40' },
  'Estate':                   { border: 'border-l-amber-500',  bg: 'bg-amber-50 dark:bg-amber-950/20',   text: 'text-amber-700 dark:text-amber-400',   iconBg: 'bg-amber-100 dark:bg-amber-900/40'   },
  'General Litigation':       { border: 'border-l-rose-500',   bg: 'bg-rose-50 dark:bg-rose-950/20',    text: 'text-rose-700 dark:text-rose-400',    iconBg: 'bg-rose-100 dark:bg-rose-900/40'    },
  'Local Government Matters': { border: 'border-l-teal-500',   bg: 'bg-teal-50 dark:bg-teal-950/20',    text: 'text-teal-700 dark:text-teal-400',    iconBg: 'bg-teal-100 dark:bg-teal-900/40'    },
};
const fallbackStyle = { border: 'border-l-gray-400', bg: 'bg-gray-50 dark:bg-gray-900/20', text: 'text-gray-700 dark:text-gray-400', iconBg: 'bg-gray-100 dark:bg-gray-800' };

// ── Component ─────────────────────────────────────────────────────────────────
export function AssociateDocuments() {

  // ── state ──────────────────────────────────────────────────────────────────
  const [documents, setDocuments] = useState<Document[]>([]);
  const [cases, setCases]         = useState<Case[]>([]);
  const [loading, setLoading]     = useState(true);
  const [uploading, setUploading] = useState(false);

  // accordion open state — keyed by path string
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({});
  const [openTypes, setOpenTypes]           = useState<Record<string, boolean>>({});
  const [openCases, setOpenCases]           = useState<Record<string, boolean>>({});

  // filters
  const [searchQuery, setSearchQuery]             = useState('');
  const [filterCase, setFilterCase]               = useState('all');
  const [filterCategory, setFilterCategory]       = useState('all');
  const [filterType, setFilterType]               = useState('all');
  const [filterMyDocuments, setFilterMyDocuments] = useState(false);
  const [filterDateFrom, setFilterDateFrom]       = useState('');
  const [filterDateTo, setFilterDateTo]           = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // modals
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [viewingDocument, setViewingDocument] = useState<Document | null>(null);
  const [showViewModal, setShowViewModal]     = useState(false);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  // upload form
  const emptyForm = {
    name: '', case_id: 0, document_category: '', document_type: '',
    description: '', status: 'Draft', version: 1, file: null as File | null,
    file_data: '', file_name: '', file_size: 0, file_type: '', mime_type: '',
    year: 0 as string | number,
  };
  const [newDocument, setNewDocument] = useState({ ...emptyForm });

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  // ── data fetching ──────────────────────────────────────────────────────────
  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) { alert('Please login to continue'); window.location.href = '/login'; return; }
      const headers = { Authorization: `Bearer ${token}` };
      const [docsRes, casesRes] = await Promise.all([
        fetch(`${API_URL}/api/documents`, { headers }),
        fetch(`${API_URL}/api/cases`,     { headers }),
      ]);
      if (docsRes.ok)  setDocuments(await docsRes.json());
      if (casesRes.ok) setCases(await casesRes.json());
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  // ── helpers ────────────────────────────────────────────────────────────────
  const parseDocumentType = (raw: string) => {
    if (raw?.includes(' > ')) {
      const idx = raw.indexOf(' > ');
      return { category: raw.slice(0, idx).trim(), subType: raw.slice(idx + 3).trim() };
    }
    return { category: 'Uncategorised', subType: raw ?? '' };
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '0 Bytes';
    const k = 1024, sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const convertFileToBase64 = (file: File): Promise<string> =>
    new Promise((res, rej) => {
      const r = new FileReader();
      r.readAsDataURL(file);
      r.onload  = () => res(r.result as string);
      r.onerror = e => rej(e);
    });

  const getFileIcon = (fileName: string, mimeType?: string | null) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (mimeType?.includes('pdf'))   return '📄';
    if (mimeType?.includes('word')  || ext === 'doc'  || ext === 'docx') return '📝';
    if (mimeType?.includes('excel') || ext === 'xls'  || ext === 'xlsx') return '📊';
    if (mimeType?.includes('image')) return '🖼️';
    if (ext === 'txt') return '📃';
    return '📎';
  };

  const getCaseLabel = (caseId: number) => {
    const c = cases.find(c => c.id === caseId);
    return c ? `${c.case_number} - ${c.title}` : `Case ${caseId}`;
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'Approved':     return 'success';
      case 'Under Review': return 'warning';
      case 'Draft':        return 'secondary';
      case 'Reference':    return 'default';
      case 'Rejected':     return 'error';
      default:             return 'default';
    }
  };

  // ── stats ──────────────────────────────────────────────────────────────────
  const stats = {
    total:       documents.length,
    myDocuments: documents.filter(d => d.uploaded_by_user_id === currentUser.id).length,
    underReview: documents.filter(d => d.status === 'Under Review').length,
    approved:    documents.filter(d => d.status === 'Approved').length,
  };

  // ── filtered documents ─────────────────────────────────────────────────────
  const filteredDocuments = useMemo(() => {
    return documents.filter(doc => {
      const matchesSearch =
        doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (doc.case_title?.toLowerCase() ?? '').includes(searchQuery.toLowerCase()) ||
        (doc.uploaded_by_name?.toLowerCase() ?? '').includes(searchQuery.toLowerCase());
      const matchesCase     = filterCase === 'all' || doc.case_id.toString() === filterCase;
      const matchesCategory = filterCategory === 'all' || doc.document_type?.startsWith(filterCategory);
      const matchesType     = filterType === 'all' || doc.document_type?.includes(filterType);
      const matchesUser     = !filterMyDocuments || doc.uploaded_by_user_id === currentUser.id;
      let matchesDate = true;
      if (filterDateFrom || filterDateTo) {
        const d = new Date(doc.uploaded_at);
        if (filterDateFrom) { const f = new Date(filterDateFrom); f.setHours(0,0,0,0);      if (d < f) matchesDate = false; }
        if (filterDateTo)   { const t = new Date(filterDateTo);   t.setHours(23,59,59,999); if (d > t) matchesDate = false; }
      }
      return matchesSearch && matchesCase && matchesCategory && matchesType && matchesUser && matchesDate;
    });
  }, [documents, searchQuery, filterCase, filterCategory, filterType, filterMyDocuments, filterDateFrom, filterDateTo, currentUser.id]);

  // ── 4-level grouping: category → subType → caseId → docs[] ───────────────
  const grouped = useMemo(() => {
    // Pre-seed known categories so empty ones still appear
    const map: Record<string, Record<string, Record<string, Document[]>>> = {};
    Object.keys(documentCategories).forEach(cat => { map[cat] = {}; });

    filteredDocuments.forEach(doc => {
      const { category, subType } = parseDocumentType(doc.document_type);
      const caseLabel = doc.case_title ?? getCaseLabel(doc.case_id);

      if (!map[category])            map[category] = {};
      if (!map[category][subType])   map[category][subType] = {};
      if (!map[category][subType][caseLabel]) map[category][subType][caseLabel] = [];
      map[category][subType][caseLabel].push(doc);
    });

    return map;
  }, [filteredDocuments, cases]);

  // ── accordion toggles ──────────────────────────────────────────────────────
  const toggleCategory = (cat: string) =>
    setOpenCategories(prev => ({ ...prev, [cat]: !prev[cat] }));

  const toggleType = (cat: string, type: string) => {
    const key = `${cat}||${type}`;
    setOpenTypes(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleCase = (cat: string, type: string, caseLabel: string) => {
    const key = `${cat}||${type}||${caseLabel}`;
    setOpenCases(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // ── upload ─────────────────────────────────────────────────────────────────
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 25 * 1024 * 1024) { alert('File size must be under 25MB'); e.target.value = ''; return; }
    try {
      const base64 = await convertFileToBase64(file);
      setNewDocument(p => ({
        ...p,
        name: p.name || file.name.replace(/\.[^/.]+$/, ''),
        file, file_data: base64, file_name: file.name, file_size: file.size,
        file_type: file.name.split('.').pop()?.toLowerCase() ?? '',
        mime_type: file.type,
      }));
    } catch { alert('Failed to process file. Please try again.'); }
  };

  const handleUploadDocument = async () => {
    if (!newDocument.case_id || !newDocument.document_category || !newDocument.document_type || !newDocument.file) {
      alert('Please select a case, category, document type, and file'); return;
    }
    if (!newDocument.name.trim()) { alert('Please enter a document name'); return; }
    try {
      setUploading(true);
      const token = localStorage.getItem('token');
      if (!token) { alert('Please login to continue'); window.location.href = '/login'; return; }
      const documentData: CreateDocumentData = {
        name:          newDocument.name.trim(),
        case_id:       newDocument.case_id,
        document_type: `${newDocument.document_category} > ${newDocument.document_type}`,
        description:   newDocument.description,
        status:        newDocument.status as any,
        version:       newDocument.version,
        file_data:     newDocument.file_data,
        file_name:     newDocument.file_name,
        file_size:     newDocument.file_size,
        file_type:     newDocument.file_type,
        mime_type:     newDocument.mime_type,
        year:          newDocument.year,
      };
      const response = await fetch(`${API_URL}/api/documents`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(documentData),
      });
      if (response.ok) {
        resetUploadForm(); setShowUploadModal(false); fetchData();
        alert('Document uploaded successfully!');
      } else {
        const err = await response.json().catch(() => ({ error: 'Failed to upload document' }));
        alert(`Error uploading document: ${err.error ?? response.status}`);
      }
    } catch (err: any) {
      alert(err.message ?? 'Failed to upload document. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const resetUploadForm = () => {
    setNewDocument({ ...emptyForm });
    const fi = document.getElementById('file-upload') as HTMLInputElement;
    if (fi) fi.value = '';
  };

  // ── view ───────────────────────────────────────────────────────────────────
  const handleViewDocument = async (doc: Document) => {
    setViewingDocument(doc);
    try {
      const viewableTypes = ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'txt'];
      const ext = doc.file_name.split('.').pop()?.toLowerCase() ?? '';
      const isViewable = viewableTypes.includes(ext) || doc.mime_type?.includes('pdf') || doc.mime_type?.includes('image');
      if (isViewable) {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/api/documents/${doc.id}/download`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const blob = await res.blob();
        const url  = window.URL.createObjectURL(blob);
        if (doc.mime_type?.includes('image')) {
          setImagePreviewUrl(url); setShowViewModal(true);
        } else {
          window.open(url, '_blank');
          setTimeout(() => { try { window.URL.revokeObjectURL(url); } catch {} }, 30000);
        }
      } else {
        setShowViewModal(true);
      }
    } catch { setShowViewModal(true); }
  };

  // ── delete ─────────────────────────────────────────────────────────────────
  const handleDeleteDocument = async (documentId: number, documentName: string) => {
    if (!window.confirm(`Are you sure you want to delete "${documentName}"? This action cannot be undone.`)) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/documents/${documentId}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setDocuments(prev => prev.filter(d => d.id !== documentId));
        alert('Document deleted successfully!');
      } else {
        const err = await res.json().catch(() => ({ error: 'Failed to delete document' }));
        alert(`Error deleting document: ${err.error ?? res.status}`);
      }
    } catch (err: any) { alert(err.message ?? 'Failed to delete document'); }
  };

  const clearAllFilters = () => {
    setSearchQuery(''); setFilterCase('all'); setFilterCategory('all');
    setFilterType('all'); setFilterMyDocuments(false);
    setFilterDateFrom(''); setFilterDateTo('');
  };

  const hasActiveFilters = !!(searchQuery || filterCase !== 'all' || filterCategory !== 'all' ||
    filterType !== 'all' || filterMyDocuments || filterDateFrom || filterDateTo);

  const availableSubTypes = newDocument.document_category
    ? documentCategories[newDocument.document_category] ?? []
    : [];

  // ── loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="p-6 md:p-8 space-y-6">
        <h1 className="text-foreground mb-2">Documents</h1>
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading documents...</p>
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
          <h1 className="text-foreground mb-2">Company Documents</h1>
          <p className="text-muted-foreground">Manage all company documents and work product</p>
        </div>
        <Button variant="primary" onClick={() => setShowUploadModal(true)} className="gap-2">
          <Upload className="w-4 h-4" /> Upload Document
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Documents', value: stats.total,       color: 'text-foreground' },
          { label: 'My Documents',    value: stats.myDocuments, color: 'text-primary'    },
          { label: 'Under Review',    value: stats.underReview, color: 'text-warning'    },
          { label: 'Approved',        value: stats.approved,    color: 'text-success'    },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground mb-1">{s.label}</p>
              <p className={`text-2xl font-semibold ${s.color}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search documents by name, case, or uploader..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
              />
            </div>
            <div className="flex gap-2 items-center">
              <Button variant="outline" size="sm" onClick={() => setShowAdvancedFilters(v => !v)} className="gap-2">
                <Filter className="w-4 h-4" /> Advanced Filters
                {showAdvancedFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
              <Button variant="ghost" size="sm" onClick={clearAllFilters} className="text-muted-foreground hover:text-foreground">
                Clear All
              </Button>
            </div>
          </div>

          {showAdvancedFilters && (
            <div className="border-t pt-4 border-border space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block mb-2 text-sm text-foreground">Case</label>
                  <select value={filterCase} onChange={e => setFilterCase(e.target.value)}
                    className="w-full px-4 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring">
                    <option value="all">All Cases</option>
                    {cases.map(c => <option key={c.id} value={c.id.toString()}>{c.case_number} - {c.title}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block mb-2 text-sm text-foreground">Category</label>
                  <select value={filterCategory} onChange={e => { setFilterCategory(e.target.value); setFilterType('all'); }}
                    className="w-full px-4 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring">
                    <option value="all">All Categories</option>
                    {Object.keys(documentCategories).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block mb-2 text-sm text-foreground">Document Type</label>
                  <select value={filterType} onChange={e => setFilterType(e.target.value)}
                    className="w-full px-4 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring">
                    <option value="all">All Types</option>
                    {filterCategory !== 'all'
                      ? documentCategories[filterCategory].map(t => <option key={t} value={t}>{t}</option>)
                      : Object.entries(documentCategories).map(([cat, types]) => (
                          <optgroup key={cat} label={cat}>
                            {types.map(t => <option key={`${cat}-${t}`} value={t}>{t}</option>)}
                          </optgroup>
                        ))
                    }
                  </select>
                </div>
                <div>
                  <label className="block mb-2 text-sm text-foreground">From Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring" />
                  </div>
                </div>
                <div>
                  <label className="block mb-2 text-sm text-foreground">To Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring" />
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-6 pt-2 border-t border-border">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={filterMyDocuments} onChange={e => setFilterMyDocuments(e.target.checked)}
                    className="rounded border-border text-primary focus:ring-primary" />
                  <span className="text-sm text-foreground">Show Only My Documents</span>
                </label>
              </div>
            </div>
          )}

          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
              <span className="text-sm text-muted-foreground self-center">Active filters:</span>
              {searchQuery && (
                <Badge variant="default" className="gap-1">Search: {searchQuery}
                  <button onClick={() => setSearchQuery('')} className="ml-1 hover:text-destructive"><X className="w-3 h-3" /></button>
                </Badge>
              )}
              {filterCase !== 'all' && (
                <Badge variant="default" className="gap-1">
                  Case: {cases.find(c => c.id.toString() === filterCase)?.case_number ?? filterCase}
                  <button onClick={() => setFilterCase('all')} className="ml-1 hover:text-destructive"><X className="w-3 h-3" /></button>
                </Badge>
              )}
              {filterCategory !== 'all' && (
                <Badge variant="default" className="gap-1">Category: {filterCategory}
                  <button onClick={() => { setFilterCategory('all'); setFilterType('all'); }} className="ml-1 hover:text-destructive"><X className="w-3 h-3" /></button>
                </Badge>
              )}
              {filterType !== 'all' && (
                <Badge variant="default" className="gap-1">Type: {filterType}
                  <button onClick={() => setFilterType('all')} className="ml-1 hover:text-destructive"><X className="w-3 h-3" /></button>
                </Badge>
              )}
              {filterMyDocuments && (
                <Badge variant="default" className="gap-1">My Documents
                  <button onClick={() => setFilterMyDocuments(false)} className="ml-1 hover:text-destructive"><X className="w-3 h-3" /></button>
                </Badge>
              )}
              {filterDateFrom && (
                <Badge variant="default" className="gap-1">From: {new Date(filterDateFrom).toLocaleDateString()}
                  <button onClick={() => setFilterDateFrom('')} className="ml-1 hover:text-destructive"><X className="w-3 h-3" /></button>
                </Badge>
              )}
              {filterDateTo && (
                <Badge variant="default" className="gap-1">To: {new Date(filterDateTo).toLocaleDateString()}
                  <button onClick={() => setFilterDateTo('')} className="ml-1 hover:text-destructive"><X className="w-3 h-3" /></button>
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── 4-Level Hierarchical Browser ──────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>
            Company Documents
            <span className="text-sm font-normal text-muted-foreground ml-2">
              {filteredDocuments.length} of {documents.length} shown
            </span>
          </CardTitle>
        </CardHeader>

        <CardContent className="p-4 space-y-3">

          {filteredDocuments.length === 0 && (
            <div className="py-16 text-center">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground font-medium">No documents found</p>
              {hasActiveFilters
                ? <p className="text-sm text-muted-foreground mt-1">Try adjusting your search or filters</p>
                : (
                  <Button variant="outline" className="mt-4 gap-2" onClick={() => setShowUploadModal(true)}>
                    <Upload className="w-4 h-4" /> Upload Your First Document
                  </Button>
                )
              }
            </div>
          )}

          {/* ── LEVEL 1: Category ─────────────────────────────────────────── */}
          {Object.entries(grouped).map(([category, typeMap]) => {
            const totalInCat = Object.values(typeMap).flatMap(t => Object.values(t)).flat().length;
            const isCatOpen  = !!openCategories[category];
            const cs         = categoryStyle[category] ?? fallbackStyle;

            return (
              <div key={category} className={`rounded-xl border border-border border-l-4 ${cs.border} overflow-hidden shadow-sm`}>

                {/* Category header */}
                <button
                  onClick={() => toggleCategory(category)}
                  className={`w-full flex items-center justify-between px-5 py-4 text-left transition-colors ${isCatOpen ? cs.bg : 'hover:bg-muted/30'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg ${cs.iconBg} flex items-center justify-center flex-shrink-0`}>
                      {isCatOpen ? <FolderOpen className={`w-4 h-4 ${cs.text}`} /> : <Folder className={`w-4 h-4 ${cs.text}`} />}
                    </div>
                    <span className={`font-semibold text-base ${cs.text}`}>{category}</span>
                    <span className="text-xs text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-full">
                      {totalInCat} {totalInCat === 1 ? 'file' : 'files'}
                    </span>
                  </div>
                  {isCatOpen ? <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" /> : <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
                </button>

                {/* ── LEVEL 2: Document Type ──────────────────────────────── */}
                {isCatOpen && (
                  <div className="border-t border-border divide-y divide-border/60">
                    {Object.keys(typeMap).length === 0 ? (
                      <p className="text-sm text-muted-foreground italic px-14 py-4">No documents in this category yet</p>
                    ) : (
                      Object.entries(typeMap).map(([docType, caseMap]) => {
                        const typeKey    = `${category}||${docType}`;
                        const isTypeOpen = !!openTypes[typeKey];
                        const totalInType = Object.values(caseMap).flat().length;

                        return (
                          <div key={docType} className="bg-muted/5">

                            {/* Type header */}
                            <button
                              onClick={() => toggleType(category, docType)}
                              className="w-full flex items-center justify-between pl-14 pr-5 py-3 text-left hover:bg-muted/25 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                {isTypeOpen ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
                                <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                                <span className="text-sm font-medium text-foreground">{docType}</span>
                                <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                                  {totalInType} {totalInType === 1 ? 'file' : 'files'}
                                </span>
                              </div>
                            </button>

                            {/* ── LEVEL 3: Case ───────────────────────────── */}
                            {isTypeOpen && (
                              <div className="border-t border-border/40 divide-y divide-border/30">
                                {Object.entries(caseMap).map(([caseLabel, docs]) => {
                                  const caseKey    = `${category}||${docType}||${caseLabel}`;
                                  const isCaseOpen = !!openCases[caseKey];

                                  return (
                                    <div key={caseLabel} className="bg-muted/10">

                                      {/* Case header */}
                                      <button
                                        onClick={() => toggleCase(category, docType, caseLabel)}
                                        className="w-full flex items-center justify-between pl-20 pr-5 py-2.5 text-left hover:bg-muted/30 transition-colors"
                                      >
                                        <div className="flex items-center gap-3">
                                          {isCaseOpen ? <ChevronDown className="w-3 h-3 text-muted-foreground" /> : <ChevronRight className="w-3 h-3 text-muted-foreground" />}
                                          <Briefcase className="w-3.5 h-3.5 text-muted-foreground" />
                                          <span className="text-sm font-medium text-foreground">{caseLabel}</span>
                                          <span className="text-xs text-muted-foreground bg-muted/80 px-1.5 py-0.5 rounded-full">
                                            {docs.length} {docs.length === 1 ? 'file' : 'files'}
                                          </span>
                                        </div>
                                      </button>

                                      {/* ── LEVEL 4: Files ──────────────── */}
                                      {isCaseOpen && (
                                        <div className="border-t border-border/30 bg-background divide-y divide-border/20">
                                          {docs.map(doc => (
                                            <div
                                              key={doc.id}
                                              className="flex items-center gap-4 pl-28 pr-5 py-3 hover:bg-muted/15 transition-colors"
                                            >
                                              {/* File icon */}
                                              <span className="text-lg flex-shrink-0">
                                                {getFileIcon(doc.file_name, doc.mime_type)}
                                              </span>

                                              {/* File info */}
                                              <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                                  <span className="text-sm font-medium text-foreground truncate">
                                                    {doc.name}
                                                  </span>
                                                  <Badge variant={getStatusVariant(doc.status)}>
                                                    {doc.status}
                                                  </Badge>
                                                  {doc.uploaded_by_user_id === currentUser.id && (
                                                    <Badge variant="default" className="text-xs">My Upload</Badge>
                                                  )}
                                                  {doc.version > 1 && (
                                                    <span className="text-xs text-muted-foreground">v{doc.version}</span>
                                                  )}
                                                </div>
                                                <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                                                  <span className="flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {formatDate(doc.uploaded_at)}
                                                  </span>
                                                  <span className="flex items-center gap-1">
                                                    <User className="w-3 h-3" />
                                                    <span className={doc.uploaded_by_user_id === currentUser.id ? 'text-primary font-medium' : ''}>
                                                      {doc.uploaded_by_name ?? 'Unknown'}
                                                    </span>
                                                  </span>
                                                  {doc.year ? <span>Year: {doc.year}</span> : null}
                                                  <span>{formatFileSize(doc.file_size)}</span>
                                                </div>
                                              </div>

                                              {/* Actions */}
                                              <div className="flex items-center gap-2 flex-shrink-0">
                                                <Button variant="outline" size="sm" className="gap-1.5" onClick={() => handleViewDocument(doc)}>
                                                  <Eye className="w-3.5 h-3.5" /> View
                                                </Button>
                                                <Button
                                                  variant="ghost" size="sm"
                                                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                  onClick={() => handleDeleteDocument(doc.id, doc.name)}
                                                >
                                                  <Trash2 className="w-3.5 h-3.5" />
                                                </Button>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* ── Upload Modal (original field order) ───────────────────────────── */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Upload New Document</span>
                <Button variant="ghost" size="sm" onClick={() => { setShowUploadModal(false); resetUploadForm(); }}>
                  <X className="w-4 h-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">

                <div>
                  <label className="block mb-2 text-sm text-foreground">Case *</label>
                  <select
                    className="w-full px-4 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                    value={newDocument.case_id}
                    onChange={e => setNewDocument(p => ({ ...p, case_id: parseInt(e.target.value) }))}
                  >
                    <option value="0">Select a case...</option>
                    {cases.map(c => <option key={c.id} value={c.id}>{c.case_number} - {c.title}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block mb-2 text-sm text-foreground">Category *</label>
                  <select
                    className="w-full px-4 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                    value={newDocument.document_category}
                    onChange={e => setNewDocument(p => ({ ...p, document_category: e.target.value, document_type: '' }))}
                  >
                    <option value="">Select a category...</option>
                    {Object.keys(documentCategories).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>

                {newDocument.document_category && (
                  <div>
                    <label className="block mb-2 text-sm text-foreground">Document Type *</label>
                    <select
                      className="w-full px-4 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                      value={newDocument.document_type}
                      onChange={e => setNewDocument(p => ({ ...p, document_type: e.target.value }))}
                    >
                      <option value="">Select document type...</option>
                      {availableSubTypes.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block mb-2 text-sm text-foreground">Document Name *</label>
                  <input
                    type="text"
                    placeholder="Enter document name"
                    className="w-full px-4 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                    value={newDocument.name}
                    onChange={e => setNewDocument(p => ({ ...p, name: e.target.value }))}
                  />
                  <small className="text-xs text-muted-foreground mt-1">Will default to filename if left empty</small>
                </div>

                <div>
                  <label className="block mb-2 text-sm text-foreground">Year</label>
                  <input
                    type="number"
                    className="w-full px-4 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                    value={newDocument.year}
                    onChange={e => {
                      const v = e.target.value;
                      if (v === '' || (v.length <= 4 && /^\d+$/.test(v)))
                        setNewDocument(p => ({ ...p, year: v === '' ? '' : parseInt(v) }));
                    }}
                    max="9999" min="1000"
                  />
                </div>

                <div>
                  <label className="block mb-2 text-sm text-foreground">File *</label>
                  <input type="file" onChange={handleFileSelect}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.jpg,.jpeg,.png"
                    className="hidden" id="file-upload" />
                  <label htmlFor="file-upload">
                    <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer">
                      <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                      {newDocument.file ? (
                        <>
                          <p className="text-sm text-foreground mb-1">{newDocument.file.name}</p>
                          <p className="text-xs text-muted-foreground">{formatFileSize(newDocument.file_size)} • Click to change</p>
                        </>
                      ) : (
                        <>
                          <p className="text-sm text-foreground mb-1">Click to upload or drag and drop</p>
                          <p className="text-xs text-muted-foreground">PDF, DOC, DOCX, XLS, XLSX, TXT, JPG, PNG (max 25MB)</p>
                        </>
                      )}
                    </div>
                  </label>
                </div>

                <div>
                  <label className="block mb-2 text-sm text-foreground">Description (Optional)</label>
                  <textarea
                    placeholder="Add notes about this document..."
                    rows={3}
                    className="w-full px-4 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                    value={newDocument.description}
                    onChange={e => setNewDocument(p => ({ ...p, description: e.target.value }))}
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <Button variant="primary" className="gap-2" onClick={handleUploadDocument}
                    disabled={uploading || !newDocument.file}>
                    {uploading
                      ? <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> Uploading...</>
                      : <><Upload className="w-4 h-4" /> Upload Document</>}
                  </Button>
                  <Button variant="outline" onClick={() => { setShowUploadModal(false); resetUploadForm(); }}>
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── View Document Modal ────────────────────────────────────────────── */}
      {showViewModal && viewingDocument && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getFileIcon(viewingDocument.file_name, viewingDocument.mime_type)}</span>
                  <div>
                    <div className="text-lg">{viewingDocument.name}</div>
                    <div className="text-sm text-muted-foreground font-normal">{viewingDocument.file_name}</div>
                  </div>
                </div>
                <Button variant="ghost" size="sm"
                  onClick={() => { setShowViewModal(false); setViewingDocument(null); setImagePreviewUrl(null); }}>
                  <X className="w-4 h-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">

              {imagePreviewUrl && (
                <div className="border border-border rounded-lg p-4">
                  <div className="text-sm text-muted-foreground mb-2">Image Preview:</div>
                  <div className="flex justify-center bg-muted/20 rounded-lg p-4">
                    <img src={imagePreviewUrl} alt={viewingDocument.name} className="max-w-full max-h-[400px] object-contain" />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Category</label>
                  <div className="px-3 py-2 bg-input-background rounded border border-border">
                    {parseDocumentType(viewingDocument.document_type).category || '—'}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Document Type</label>
                  <div className="px-3 py-2 bg-input-background rounded border border-border">
                    {parseDocumentType(viewingDocument.document_type).subType || viewingDocument.document_type}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Status</label>
                  <div className="px-3 py-2">
                    <Badge variant={getStatusVariant(viewingDocument.status)}>{viewingDocument.status}</Badge>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Case</label>
                  <div className="px-3 py-2 bg-input-background rounded border border-border">
                    {viewingDocument.case_title ?? getCaseLabel(viewingDocument.case_id)}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Uploaded By</label>
                  <div className="px-3 py-2 bg-input-background rounded border border-border">
                    {viewingDocument.uploaded_by_name ?? 'Unknown'}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Year</label>
                  <div className="px-3 py-2 bg-input-background rounded border border-border">
                    {viewingDocument.year ?? 'Unknown'}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Upload Date</label>
                  <div className="px-3 py-2 bg-input-background rounded border border-border">
                    {formatDate(viewingDocument.uploaded_at)}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">File Size</label>
                  <div className="px-3 py-2 bg-input-background rounded border border-border">
                    {formatFileSize(viewingDocument.file_size)}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">File Type</label>
                  <div className="px-3 py-2 bg-input-background rounded border border-border">
                    {viewingDocument.file_type || viewingDocument.mime_type || 'Unknown'}
                  </div>
                </div>
                {viewingDocument.description && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-foreground mb-1">Description</label>
                    <div className="px-3 py-2 bg-input-background rounded border border-border min-h-[80px]">
                      {viewingDocument.description}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4 border-t border-border">
                <Button variant="outline" className="gap-2" onClick={() => handleViewDocument(viewingDocument)}>
                  <ExternalLink className="w-4 h-4" /> Open in New Tab
                </Button>
                <Button variant="ghost"
                  onClick={() => { setShowViewModal(false); setViewingDocument(null); setImagePreviewUrl(null); }}>
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Guidelines */}
      <Card className="bg-gradient-to-br from-accent/5 to-transparent border-accent/20">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h3 className="text-foreground font-medium mb-1">Document Management Guidelines</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• <strong>Browse:</strong> Click a category → document type → case to drill down to files.</li>
                <li>• <strong>View:</strong> Click View on any file to see details. PDFs and images open in a new tab.</li>
                <li>• <strong>Delete:</strong> Only delete documents uploaded by mistake.</li>
                <li>• All company work product must be uploaded to the appropriate case file.</li>
                <li>• File size must be under 25MB.</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}