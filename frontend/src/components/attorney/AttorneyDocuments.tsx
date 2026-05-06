import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Cards';
import { Badge } from '../ui/Badges';
import { Button } from '../ui/Buttons';
import {
  FileText,
  Upload,
  Download,
  Eye,
  Search,
  Filter,
  Calendar,
  User,
  Briefcase,
  X,
  ChevronDown,
  ChevronUp,
  Trash2,
  ExternalLink
} from 'lucide-react';
import type { Document, CreateDocumentData, Case } from '../../types/Types';
import { API_URL } from '../../api';

// Categorized document types
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


export function AssociateDocuments() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCase, setFilterCase] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // New states for View and Download
  const [viewingDocument, setViewingDocument] = useState<Document | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [downloadingDocumentId, setDownloadingDocumentId] = useState<number | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  // New filter states
  const [filterMyDocuments, setFilterMyDocuments] = useState(false);
  const [filterDateFrom, setFilterDateFrom] = useState<string>('');
  const [filterDateTo, setFilterDateTo] = useState<string>('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const [newDocument, setNewDocument] = useState<{
    name: string;
    case_id: number;
    document_category: string;
    document_type: string;
    description: string;
    status: string;
    version: number;
    file: File | null;
    file_data: string;
    file_name: string;
    file_size: number;
    file_type: string;
    mime_type: string;
    year: string | number;
  }>({
    name: '',
    case_id: 0,
    document_category: '',
    document_type: '',
    description: '',
    status: 'Draft',
    version: 1,
    file: null,
    file_data: '',
    file_name: '',
    file_size: 0,
    file_type: '',
    mime_type: '',
    year: 0,
  });

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  // Fetch initial data
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please login to continue');
        window.location.href = '/login';
        return;
      }

      const docsResponse = await fetch(`${API_URL}/api/documents`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (docsResponse.ok) {
        const docsData = await docsResponse.json();
        setDocuments(docsData);
      } else {
        console.error('Failed to fetch documents:', docsResponse.status);
      }

      const casesResponse = await fetch(`${API_URL}/api/cases`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (casesResponse.ok) {
        const casesData = await casesResponse.json();
        setCases(casesData);
      } else {
        console.error('Failed to fetch cases:', casesResponse.status);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Subtypes available for the selected category in the upload form
  const availableSubTypes =
    newDocument.document_category
      ? documentCategories[newDocument.document_category] ?? []
      : [];

  const filteredDocuments = useMemo(() => {
    return documents.filter(doc => {
      const matchesSearch =
        doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (doc.case_title?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (doc.uploaded_by_name?.toLowerCase() || '').includes(searchQuery.toLowerCase());

      const matchesCase = filterCase === 'all' || doc.case_id.toString() === filterCase;
      const matchesType = filterType === 'all' || doc.document_type === filterType;

      // Category filter — stored as "Category > SubType" or fall back to checking prefix
      const matchesCategory =
        filterCategory === 'all' ||
        (doc.document_type?.startsWith(filterCategory) ?? false);

      const matchesUser = !filterMyDocuments || doc.uploaded_by_user_id === currentUser.id;

      let matchesDate = true;
      if (filterDateFrom || filterDateTo) {
        const docDate = new Date(doc.uploaded_at);
        if (filterDateFrom) {
          const fromDate = new Date(filterDateFrom);
          fromDate.setHours(0, 0, 0, 0);
          if (docDate < fromDate) matchesDate = false;
        }
        if (filterDateTo) {
          const toDate = new Date(filterDateTo);
          toDate.setHours(23, 59, 59, 999);
          if (docDate > toDate) matchesDate = false;
        }
      }

      return matchesSearch && matchesCase && matchesType && matchesCategory && matchesUser && matchesDate;
    });
  }, [documents, searchQuery, filterCase, filterType, filterCategory, filterMyDocuments, filterDateFrom, filterDateTo, currentUser.id]);

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'Approved': return 'success';
      case 'Under Review': return 'warning';
      case 'Draft': return 'secondary';
      case 'Reference': return 'default';
      case 'Rejected': return 'error';
      default: return 'default';
    }
  };

  const stats = {
    total: documents.length,
    myDocuments: documents.filter(d => d.uploaded_by_user_id === currentUser.id).length,
    underReview: documents.filter(d => d.status === 'Under Review').length,
    approved: documents.filter(d => d.status === 'Approved').length
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      if (file.size > 25 * 1024 * 1024) {
        alert('File size must be under 25MB');
        event.target.value = '';
        return;
      }

      const base64 = await convertFileToBase64(file);
      const documentName = newDocument.name || file.name.replace(/\.[^/.]+$/, '');

      setNewDocument({
        ...newDocument,
        name: documentName,
        file: file,
        file_data: base64,
        file_name: file.name,
        file_size: file.size,
        file_type: file.name.split('.').pop()?.toLowerCase() || '',
        mime_type: file.type,
      });
    } catch (error) {
      console.error('Error converting file to base64:', error);
      alert('Failed to process file. Please try again.');
    }
  };

  const handleUploadDocument = async () => {
    if (!newDocument.case_id || !newDocument.document_category || !newDocument.document_type || !newDocument.file) {
      alert('Please select a case, category, document type, and file');
      return;
    }

    if (!newDocument.name.trim()) {
      alert('Please enter a document name');
      return;
    }

    try {
      setUploading(true);

      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please login to continue');
        window.location.href = '/login';
        return;
      }

      // Store category + subtype as "Category > SubType" so it's recoverable
      const documentData: CreateDocumentData = {
        name: newDocument.name.trim(),
        case_id: newDocument.case_id,
        document_type: `${newDocument.document_category} > ${newDocument.document_type}`,
        description: newDocument.description,
        status: newDocument.status as 'Draft' | 'Under Review' | 'Approved' | 'Rejected' | 'Reference',
        version: newDocument.version,
        file_data: newDocument.file_data,
        file_name: newDocument.file_name,
        file_size: newDocument.file_size,
        file_type: newDocument.file_type,
        mime_type: newDocument.mime_type,
        year: newDocument.year,
      };

      const response = await fetch(`${API_URL}/api/documents`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(documentData),
      });

      if (response.ok) {
        const data = await response.json();
        setDocuments([...documents, data]);
        resetUploadForm();
        setShowUploadModal(false);
        fetchData();
        alert('Document uploaded successfully!');
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Failed to upload document' }));
        alert(`Error uploading document: ${errorData.error || `HTTP error! status: ${response.status}`}`);
      }
    } catch (error: any) {
      console.error('Error uploading document:', error);
      alert(error.message || 'Failed to upload document. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const resetUploadForm = () => {
    setNewDocument({
      name: '',
      case_id: 0,
      document_category: '',
      document_type: '',
      description: '',
      status: 'Draft',
      version: 1,
      file: null,
      file_data: '',
      file_name: '',
      file_size: 0,
      file_type: '',
      mime_type: '',
      year: 0,
    });

    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const handleViewDocument = async (document: Document) => {
    try {
      setViewingDocument(document);

      const viewableTypes = ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'txt'];
      const fileExtension = document.file_name.split('.').pop()?.toLowerCase() || '';
      const isViewable =
        viewableTypes.includes(fileExtension) ||
        document.mime_type?.includes('pdf') ||
        document.mime_type?.includes('image');

      if (isViewable) {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/api/documents/${document.id}/download`, {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);

        if (document.mime_type?.includes('image')) {
          setImagePreviewUrl(url);
          setShowViewModal(true);
        } else {
          window.open(url, '_blank');
          setTimeout(() => { try { window.URL.revokeObjectURL(url); } catch (e) {} }, 30000);
        }
      } else {
        setShowViewModal(true);
      }
    } catch (error: any) {
      console.error('Error viewing document:', error);
      setShowViewModal(true);
    }
  };

  const handleDownloadDocument = async (documentId: number, fileName: string) => {
    try {
      setDownloadingDocumentId(documentId);

      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/documents/${documentId}/download`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to download document' }));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const contentDisposition = response.headers.get('Content-Disposition');
      let downloadFileName = fileName;

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename\*?=["']?([^"';]+)["']?/);
        if (filenameMatch?.[1]) {
          downloadFileName = decodeURIComponent(filenameMatch[1]);
        } else {
          const simpleMatch = contentDisposition.match(/filename=["']?([^"';]+)["']?/);
          if (simpleMatch?.[1]) downloadFileName = simpleMatch[1];
        }
      }

      const blob = await response.blob();
      if (blob.size === 0) throw new Error('Received empty file');

      const isPDF = blob.type === 'application/pdf' || downloadFileName.toLowerCase().endsWith('.pdf');

      if (isPDF) {
        const userWantsToOpen = window.confirm('Do you want to open the PDF in a new tab instead of downloading?');
        if (userWantsToOpen) {
          const url = window.URL.createObjectURL(blob);
          window.open(url, '_blank');
          setTimeout(() => window.URL.revokeObjectURL(url), 10000);
          setDownloadingDocumentId(null);
          return;
        }
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = downloadFileName;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error: any) {
      console.error('Error downloading document:', error);
      alert(error.message || 'Failed to download document. Please try again.');
    } finally {
      setDownloadingDocumentId(null);
    }
  };

  const handleDeleteDocument = async (documentId: number, documentName: string) => {
    if (!window.confirm(`Are you sure you want to delete "${documentName}"? This action cannot be undone.`)) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/documents/${documentId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setDocuments(documents.filter(doc => doc.id !== documentId));
        alert('Document deleted successfully!');
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Failed to delete document' }));
        alert(`Error deleting document: ${errorData.error || `HTTP error! status: ${response.status}`}`);
      }
    } catch (error: any) {
      console.error('Error deleting document:', error);
      alert(error.message || 'Failed to delete document');
    }
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setFilterCase('all');
    setFilterType('all');
    setFilterCategory('all');
    setFilterMyDocuments(false);
    setFilterDateFrom('');
    setFilterDateTo('');
  };

  const getFileIcon = (fileName: string, mimeType?: string | null) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    if (mimeType?.includes('pdf')) return '📄';
    if (mimeType?.includes('word') || extension === 'doc' || extension === 'docx') return '📝';
    if (mimeType?.includes('excel') || extension === 'xls' || extension === 'xlsx') return '📊';
    if (mimeType?.includes('image')) return '🖼️';
    if (extension === 'txt') return '📃';
    return '📎';
  };

  const getCaseTitle = (caseId: number) => {
    const caseItem = cases.find(c => c.id === caseId);
    return caseItem ? `${caseItem.case_number} - ${caseItem.title}` : `Case ${caseId}`;
  };

  // Helper: split stored "Category > SubType" for display
  const parseDocumentType = (raw: string) => {
    if (raw?.includes(' > ')) {
      const [cat, sub] = raw.split(' > ');
      return { category: cat, subType: sub };
    }
    return { category: '', subType: raw };
  };

  if (loading) {
    return (
      <div className="p-6 md:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-foreground mb-2">Documents</h1>
            <p className="text-muted-foreground">Loading documents...</p>
          </div>
        </div>
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading documents...</p>
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
          <h1 className="text-foreground mb-2">Company Documents</h1>
          <p className="text-muted-foreground">Manage all company documents and work product</p>
        </div>
        <Button variant="primary" onClick={() => setShowUploadModal(true)} className="gap-2">
          <Upload className="w-4 h-4" />
          Upload Document
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground mb-1">Total Documents</p>
            <p className="text-2xl font-semibold text-foreground">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground mb-1">My Documents</p>
            <p className="text-2xl font-semibold text-primary">{stats.myDocuments}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground mb-1">Under Review</p>
            <p className="text-2xl font-semibold text-warning">{stats.underReview}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground mb-1">Approved</p>
            <p className="text-2xl font-semibold text-success">{stats.approved}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-4">
            {/* Basic Filters Row */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search documents by name, case, or uploader..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
                />
              </div>
              <div className="flex gap-2 items-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className="gap-2"
                >
                  <Filter className="w-4 h-4" />
                  Advanced Filters
                  {showAdvancedFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllFilters}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Clear All
                </Button>
              </div>
            </div>

            {/* Advanced Filters */}
            {showAdvancedFilters && (
              <div className="border-t pt-4 mt-4 border-border">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Case Filter */}
                  <div>
                    <label className="block mb-2 text-sm text-foreground">Case</label>
                    <select
                      value={filterCase}
                      onChange={(e) => setFilterCase(e.target.value)}
                      className="w-full px-4 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
                    >
                      <option value="all">All Cases</option>
                      {cases.map(c => (
                        <option key={c.id} value={c.id.toString()}>
                          {c.case_number} - {c.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Category Filter */}
                  <div>
                    <label className="block mb-2 text-sm text-foreground">Category</label>
                    <select
                      value={filterCategory}
                      onChange={(e) => { setFilterCategory(e.target.value); setFilterType('all'); }}
                      className="w-full px-4 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
                    >
                      <option value="all">All Categories</option>
                      {Object.keys(documentCategories).map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  {/* Document Type Filter */}
                  <div>
                    <label className="block mb-2 text-sm text-foreground">Document Type</label>
                    <select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                      className="w-full px-4 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
                    >
                      <option value="all">All Types</option>
                      {filterCategory !== 'all'
                        ? documentCategories[filterCategory].map(type => (
                            <option key={type} value={type}>{type}</option>
                          ))
                        : Object.entries(documentCategories).map(([cat, types]) => (
                            <optgroup key={cat} label={cat}>
                              {types.map(type => (
                                <option key={`${cat}-${type}`} value={type}>{type}</option>
                              ))}
                            </optgroup>
                          ))
                      }
                    </select>
                  </div>

                  {/* Date From */}
                  <div>
                    <label className="block mb-2 text-sm text-foreground">From Date</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="date"
                        value={filterDateFrom}
                        onChange={(e) => setFilterDateFrom(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
                      />
                    </div>
                  </div>

                  {/* Date To */}
                  <div>
                    <label className="block mb-2 text-sm text-foreground">To Date</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="date"
                        value={filterDateTo}
                        onChange={(e) => setFilterDateTo(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
                      />
                    </div>
                  </div>
                </div>

                {/* Checkbox Filters Row */}
                <div className="flex flex-wrap gap-6 mt-4 pt-4 border-t border-border">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filterMyDocuments}
                      onChange={(e) => setFilterMyDocuments(e.target.checked)}
                      className="rounded border-border text-primary focus:ring-primary"
                    />
                    <span className="text-sm text-foreground">Show Only My Documents</span>
                  </label>
                </div>
              </div>
            )}

            {/* Active Filters Display */}
            {(searchQuery || filterCase !== 'all' || filterType !== 'all' || filterCategory !== 'all' || filterMyDocuments || filterDateFrom || filterDateTo) && (
              <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
                <span className="text-sm text-muted-foreground self-center">Active filters:</span>
                {searchQuery && (
                  <Badge variant="default" className="gap-1">
                    Search: {searchQuery}
                    <button onClick={() => setSearchQuery('')} className="ml-1 hover:text-destructive">
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}
                {filterCase !== 'all' && (
                  <Badge variant="default" className="gap-1">
                    Case: {cases.find(c => c.id.toString() === filterCase)?.case_number || filterCase}
                    <button onClick={() => setFilterCase('all')} className="ml-1 hover:text-destructive">
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}
                {filterCategory !== 'all' && (
                  <Badge variant="default" className="gap-1">
                    Category: {filterCategory}
                    <button onClick={() => { setFilterCategory('all'); setFilterType('all'); }} className="ml-1 hover:text-destructive">
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}
                {filterType !== 'all' && (
                  <Badge variant="default" className="gap-1">
                    Type: {filterType}
                    <button onClick={() => setFilterType('all')} className="ml-1 hover:text-destructive">
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}
                {filterMyDocuments && (
                  <Badge variant="default" className="gap-1">
                    My Documents
                    <button onClick={() => setFilterMyDocuments(false)} className="ml-1 hover:text-destructive">
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}
                {filterDateFrom && (
                  <Badge variant="default" className="gap-1">
                    From: {new Date(filterDateFrom).toLocaleDateString()}
                    <button onClick={() => setFilterDateFrom('')} className="ml-1 hover:text-destructive">
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}
                {filterDateTo && (
                  <Badge variant="default" className="gap-1">
                    To: {new Date(filterDateTo).toLocaleDateString()}
                    <button onClick={() => setFilterDateTo('')} className="ml-1 hover:text-destructive">
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Upload New Document</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setShowUploadModal(false); resetUploadForm(); }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Case */}
                <div>
                  <label className="block mb-2 text-sm text-foreground">Case *</label>
                  <select
                    className="w-full px-4 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                    value={newDocument.case_id}
                    onChange={(e) => setNewDocument({ ...newDocument, case_id: parseInt(e.target.value) })}
                    required
                  >
                    <option value="0">Select a case...</option>
                    {cases.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.case_number} - {c.title}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Category */}
                <div>
                  <label className="block mb-2 text-sm text-foreground">Category *</label>
                  <select
                    className="w-full px-4 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                    value={newDocument.document_category}
                    onChange={(e) =>
                      setNewDocument({ ...newDocument, document_category: e.target.value, document_type: '' })
                    }
                    required
                  >
                    <option value="">Select a category...</option>
                    {Object.keys(documentCategories).map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Document Type — only shown after category is chosen */}
                {newDocument.document_category && (
                  <div>
                    <label className="block mb-2 text-sm text-foreground">Document Type *</label>
                    <select
                      className="w-full px-4 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                      value={newDocument.document_type}
                      onChange={(e) => setNewDocument({ ...newDocument, document_type: e.target.value })}
                      required
                    >
                      <option value="">Select document type...</option>
                      {availableSubTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Document Name */}
                <div>
                  <label className="block mb-2 text-sm text-foreground">Document Name *</label>
                  <select
                    className="w-full px-4 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                    value={newDocument.name}
                    onChange={(e) => setNewDocument({ ...newDocument, name: e.target.value })}
                    required
                  >
                    <option value="">Select document name</option>
                    <option value="Payment to sheriff">Payment to sheriff</option>
                    <option value="Payment from Client">Payment from Client</option>
                  </select>
                  <small className="text-xs text-muted-foreground mt-1">Will default to filename if left empty</small>
                </div>

                {/* Year */}
                <div>
                  <label className="block mb-2 text-sm text-foreground">Year</label>
                  <input
                    type="number"
                    className="w-full px-4 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                    value={newDocument.year}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '' || (value.length <= 4 && /^\d+$/.test(value))) {
                        setNewDocument({ ...newDocument, year: value === '' ? '' : parseInt(value) });
                      }
                    }}
                    max="9999"
                    min="1000"
                  />
                </div>

                {/* File Upload */}
                <div>
                  <label className="block mb-2 text-sm text-foreground">File *</label>
                  <input
                    type="file"
                    onChange={handleFileSelect}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.jpg,.jpeg,.png"
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload">
                    <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer">
                      <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                      {newDocument.file ? (
                        <>
                          <p className="text-sm text-foreground mb-1">{newDocument.file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(newDocument.file_size)} • Click to change
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="text-sm text-foreground mb-1">Click to upload or drag and drop</p>
                          <p className="text-xs text-muted-foreground">
                            PDF, DOC, DOCX, XLS, XLSX, TXT, JPG, PNG (max 25MB)
                          </p>
                        </>
                      )}
                    </div>
                  </label>
                </div>

                {/* Description */}
                <div>
                  <label className="block mb-2 text-sm text-foreground">Description (Optional)</label>
                  <textarea
                    placeholder="Add notes about this document..."
                    rows={3}
                    className="w-full px-4 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                    value={newDocument.description}
                    onChange={(e) => setNewDocument({ ...newDocument, description: e.target.value })}
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="primary"
                    className="gap-2"
                    onClick={handleUploadDocument}
                    disabled={uploading || !newDocument.file}
                  >
                    {uploading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        Upload Document
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => { setShowUploadModal(false); resetUploadForm(); }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* View Document Modal */}
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
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setShowViewModal(false); setViewingDocument(null); setImagePreviewUrl(null); }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {imagePreviewUrl && (
                <div className="border border-border rounded-lg p-4">
                  <div className="text-sm text-muted-foreground mb-2">Image Preview:</div>
                  <div className="flex justify-center bg-gray-50 rounded-lg p-4">
                    <img
                      src={imagePreviewUrl}
                      alt={viewingDocument.name}
                      className="max-w-full max-h-[400px] object-contain"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Category + Type */}
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
                    <Badge variant={getStatusVariant(viewingDocument.status)}>
                      {viewingDocument.status}
                    </Badge>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Case</label>
                  <div className="px-3 py-2 bg-input-background rounded border border-border">
                    {viewingDocument.case_title || getCaseTitle(viewingDocument.case_id)}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Version</label>
                  <div className="px-3 py-2 bg-input-background rounded border border-border">
                    {viewingDocument.version}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Uploaded By</label>
                  <div className="px-3 py-2 bg-input-background rounded border border-border">
                    {viewingDocument.uploaded_by_name || 'Unknown'}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Year</label>
                  <div className="px-3 py-2 bg-input-background rounded border border-border">
                    {viewingDocument.year || 'Unknown'}
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
                <Button
                  variant="primary"
                  className="gap-2"
                  onClick={() => handleDownloadDocument(viewingDocument.id, viewingDocument.file_name)}
                >
                  <Download className="w-4 h-4" />
                  Download Document
                </Button>
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => handleViewDocument(viewingDocument)}
                >
                  <ExternalLink className="w-4 h-4" />
                  Open in New Tab
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => { setShowViewModal(false); setViewingDocument(null); setImagePreviewUrl(null); }}
                >
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Documents List */}
      <Card>
        <CardHeader>
          <CardTitle>
            Company Documents ({filteredDocuments.length})
            <span className="text-sm font-normal text-muted-foreground ml-2">
              Showing {filteredDocuments.length} of {documents.length} total
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filteredDocuments.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No documents found</p>
              {searchQuery || filterCase !== 'all' || filterType !== 'all' || filterCategory !== 'all' || filterMyDocuments || filterDateFrom || filterDateTo ? (
                <p className="text-sm text-muted-foreground mt-1">Try adjusting your search or filter</p>
              ) : (
                <Button variant="outline" className="mt-4 gap-2" onClick={() => setShowUploadModal(true)}>
                  <Upload className="w-4 h-4" />
                  Upload Your First Document
                </Button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredDocuments.map((doc) => {
                const { category, subType } = parseDocumentType(doc.document_type);
                return (
                  <div key={doc.id} className="px-6 py-4 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-xl">{getFileIcon(doc.file_name, doc.mime_type)}</span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="text-sm font-medium text-foreground truncate">{doc.name}</h3>
                          <Badge variant={getStatusVariant(doc.status)}>{doc.status}</Badge>
                          {doc.uploaded_by_user_id === currentUser.id && (
                            <Badge variant="default" className="text-xs">My Upload</Badge>
                          )}
                          {doc.version > 1 && (
                            <span className="text-xs text-muted-foreground">v{doc.version}</span>
                          )}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-1 text-xs text-muted-foreground mb-2">
                          <div className="flex items-center gap-1">
                            <Briefcase className="w-3 h-3" />
                            <span className="truncate">{doc.case_title || getCaseTitle(doc.case_id)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>{formatDate(doc.uploaded_at)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            <span className={doc.uploaded_by_user_id === currentUser.id ? 'text-primary font-medium' : ''}>
                              {doc.uploaded_by_name || 'Unknown'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span>Year: {doc.year || 'N/A'}</span>
                          </div>
                          <div>
                            <span>{formatFileSize(doc.file_size)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs flex-wrap">
                          {category && (
                            <span className="px-2 py-0.5 bg-primary/10 text-primary rounded font-medium">
                              {category}
                            </span>
                          )}
                          <span className="px-2 py-0.5 bg-muted rounded text-muted-foreground">
                            {subType || doc.document_type}
                          </span>
                          <span className="text-muted-foreground">
                            {doc.file_type || doc.mime_type?.split('/')[1] || 'Unknown'}
                          </span>
                          {doc.reviewer_user_id && (
                            <span className="text-muted-foreground">• Reviewer: {doc.reviewer_user_id}</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Button variant="outline" size="sm" className="gap-2" onClick={() => handleViewDocument(doc)}>
                          <Eye className="w-4 h-4" />
                          View
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownloadDocument(doc.id, doc.file_name)}
                          disabled={downloadingDocumentId === doc.id}
                        >
                          {downloadingDocumentId === doc.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                          ) : (
                            <Download className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDeleteDocument(doc.id, doc.name)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Document Guidelines */}
      <Card className="bg-gradient-to-br from-accent/5 to-transparent border-accent/20">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h3 className="text-foreground font-medium mb-1">Document Management Guidelines</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• <strong>View:</strong> Click View to see document details. PDFs open in a new tab.</li>
                <li>• <strong>Download:</strong> Click the download icon to save the file to your computer.</li>
                <li>• <strong>Delete:</strong> Only delete documents uploaded by mistake.</li>
                <li>• All company work product must be uploaded to the appropriate case file</li>
                <li>• Use clear, descriptive file names with version numbers</li>
                <li>• Documents under review cannot be edited until approved or returned</li>
                <li>• File size must be under 25MB</li>
                <li>• Use the "My Documents" filter to quickly find your uploads</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}