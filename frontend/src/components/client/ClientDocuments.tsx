import { useState, useEffect, useRef, type ChangeEvent } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Cards';
import { Badge } from '../ui/Badges';
import { Button } from '../ui/Buttons';
import { 
  FileText, 
  Download, 
  Search,
  Filter,
  Calendar,
  File,
  Upload,
  X,
  User,
  AlertCircle,
  CheckCircle,
  Trash2,
  Loader2,
  Briefcase
} from 'lucide-react';
import { documentService, caseService, authService } from '../services/api';
import type{ Document, Case, User as UserType } from '../../types/Types';

interface DocumentWithMetadata extends Omit<Document, 'client_name'> {
  client_name?: string;
  isClientUpload?: boolean;
}

export function ClientDocuments() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [uploadedByFilter, setUploadedByFilter] = useState('all');
  const [documents, setDocuments] = useState<DocumentWithMetadata[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [newDocument, setNewDocument] = useState({
    name: '',
    case_id: 0,
    document_type: 'Receipt',
    description: '',
    file: null as File | null
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch data on component mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Get current user
      const meData = await authService.getMe();
      if (meData?.user) {
        setCurrentUser(meData.user);
      }

      // Get client's cases
      const casesData = await caseService.getAll();
      setCases(casesData);

      // Get client's documents
      const docsData = await documentService.getMyDocuments();
      
      // Add metadata for client/attorney identification
      const docsWithMetadata = docsData.map(doc => ({
        ...doc,
        isClientUpload: doc.uploaded_by_user_id === currentUser?.id
      }));
      
      setDocuments(docsWithMetadata);
    } catch (err: any) {
      setError(err.message || 'Failed to load documents');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = 
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.document_type.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = filterCategory === 'all' || doc.document_type === filterCategory;
    
    const matchesUploader = 
      uploadedByFilter === 'all' ||
      (uploadedByFilter === 'client' && doc.isClientUpload) ||
      (uploadedByFilter === 'attorney' && !doc.isClientUpload);
    
    return matchesSearch && matchesCategory && matchesUploader;
  });

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'Draft':
      case 'Under Review':
        return 'warning';
      case 'Approved':
      case 'Reference':
        return 'success';
      case 'Rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'Draft': return 'Draft';
      case 'Under Review': return 'Under Review';
      case 'Approved': return 'Approved';
      case 'Rejected': return 'Rejected';
      case 'Reference': return 'Reference';
      default: return status;
    }
  };

  const getFileIcon = (filename: string, mimeType?: string | null) => {
    if (filename.endsWith('.pdf') || mimeType?.includes('pdf')) {
      return <FileText className="w-5 h-5 text-red-500" />;
    } else if (filename.endsWith('.xlsx') || filename.endsWith('.xls') || mimeType?.includes('spreadsheet')) {
      return <File className="w-5 h-5 text-green-500" />;
    } else if (filename.endsWith('.zip') || mimeType?.includes('zip')) {
      return <File className="w-5 h-5 text-yellow-500" />;
    } else if (
      filename.endsWith('.jpg') || 
      filename.endsWith('.jpeg') || 
      filename.endsWith('.png') ||
      mimeType?.includes('image')
    ) {
      return <File className="w-5 h-5 text-blue-500" />;
    } else if (filename.endsWith('.doc') || filename.endsWith('.docx') || mimeType?.includes('word')) {
      return <FileText className="w-5 h-5 text-blue-600" />;
    } else {
      return <FileText className="w-5 h-5 text-gray-500" />;
    }
  };

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = [
        '.pdf', '.jpg', '.jpeg', '.png', 
        '.xlsx', '.xls', '.doc', '.docx', '.zip',
        'application/pdf',
        'image/jpeg',
        'image/png',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/zip'
      ];
      
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      const isValidType = validTypes.includes(fileExtension) || 
                         validTypes.includes(file.type) ||
                         file.type.startsWith('image/');
      
      if (!isValidType) {
        alert('Please select a valid file type (PDF, images, documents, or ZIP)');
        return;
      }

      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
      }

      setNewDocument({
        ...newDocument,
        file,
        name: file.name,
        document_type: getCategoryFromFile(file)
      });
    }
  };

  const getCategoryFromFile = (file: File): string => {
    const name = file.name.toLowerCase();
    if (name.includes('bank') || name.includes('statement') || name.includes('financial')) return 'Financial';
    if (name.includes('id') || name.includes('passport') || name.includes('license')) return 'Identification';
    if (name.includes('photo') || name.includes('image') || name.includes('evidence')) return 'Evidence';
    if (name.includes('receipt')) return 'Receipt';
    if (name.includes('letter')) return 'Letter';
    if (name.includes('pleading')) return 'Pleadings';
    if (name.includes('correspondence')) return 'Correspondences';
    if (file.type.includes('pdf')) return 'Legal Documents';
    return 'Other';
  };

  const handleUpload = async () => {
    if (!newDocument.file) {
      alert('Please select a file to upload');
      return;
    }

    if (!newDocument.case_id) {
      alert('Please select a case for this document');
      return;
    }

    if (!newDocument.name.trim()) {
      alert('Please enter a document name');
      return;
    }

    try {
      setUploading(true);

      // Prepare form data
      const formData = new FormData();
      formData.append('name', newDocument.name);
      formData.append('case_id', newDocument.case_id.toString());
      formData.append('document_type', newDocument.document_type);
      formData.append('description', newDocument.description);
      formData.append('file', newDocument.file);
      formData.append('version', '1');
      formData.append('status', 'Draft');

      // Upload document
      const uploadedDoc = await documentService.uploadDocument(formData);
      
      if (uploadedDoc) {
        // Refresh documents list
        await fetchData();
        
        // Reset form
        setNewDocument({
          name: '',
          case_id: 0,
          document_type: 'Receipt',
          description: '',
          file: null
        });
        
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        
        alert('Document uploaded successfully!');
      } else {
        alert('Failed to upload document');
      }
    } catch (err: any) {
      alert(`Error uploading document: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleDeleteDocument = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this document?')) {
      return;
    }

    try {
      const success = await documentService.deleteDocument(id);
      if (success) {
        // Remove document from state
        setDocuments(prev => prev.filter(doc => doc.id !== id));
        alert('Document deleted successfully');
      } else {
        alert('Failed to delete document');
      }
    } catch (err: any) {
      alert(`Error deleting document: ${err.message}`);
    }
  };

  const handleDownloadDocument = async (id: number, name: string) => {
    try {
      await documentService.downloadDocument(id);
    } catch (err: any) {
      alert(`Error downloading document:${name}: ${err.message} `);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Draft':
      case 'Under Review':
        return <AlertCircle className="w-3 h-3 text-yellow-500" />;
      case 'Approved':
      case 'Reference':
        return <CheckCircle className="w-3 h-3 text-green-500" />;
      case 'Rejected':
        return <X className="w-3 h-3 text-red-500" />;
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Calculate statistics
  const clientDocuments = documents.filter(doc => doc.isClientUpload);
  
  const stats = {
    totalDocuments: documents.length,
    clientUploads: clientDocuments.length,
    pendingReview: documents.filter(d => d.status === 'Draft' || d.status === 'Under Review').length,
    approvedDocuments: documents.filter(d => d.status === 'Approved' || d.status === 'Reference').length,
    totalSize: documents.reduce((sum, doc) => sum + (doc.file_size || 0), 0)
  };

  const categories = ['all', 'Receipt', 'Letter', 'Pleadings', 'Correspondences', 'Financial', 'Identification', 'Evidence', 'Legal Documents', 'Other'];

  if (loading && !uploading) {
    return (
      <div className="p-6 md:p-8 space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
            <p className="text-muted-foreground">Loading documents...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 md:p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="w-6 h-6 text-red-500" />
            <h2 className="text-lg font-semibold text-red-800">Error Loading Documents</h2>
          </div>
          <p className="text-red-700 mb-4">{error}</p>
          <Button 
            variant="outline" 
            onClick={fetchData}
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-foreground mb-2">Documents</h1>
        <p className="text-muted-foreground">Access, upload, and manage your case documents</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground mb-1">Total Documents</p>
            <p className="text-2xl font-semibold text-foreground">{stats.totalDocuments}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground mb-1">Your Uploads</p>
            <p className="text-2xl font-semibold text-primary">{stats.clientUploads}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground mb-1">Pending Review</p>
            <p className="text-2xl font-semibold text-warning">{stats.pendingReview}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground mb-1">Approved</p>
            <p className="text-2xl font-semibold text-success">{stats.approvedDocuments}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground mb-1">Total Size</p>
            <p className="text-2xl font-semibold text-foreground">
              {formatFileSize(stats.totalSize)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Upload Section */}
      <Card className="bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Upload className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-foreground font-medium mb-1">Upload New Document</h3>
              <p className="text-sm text-muted-foreground">Upload files for your attorney to review</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* File Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Select File</label>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept=".pdf,.jpg,.jpeg,.png,.xlsx,.xls,.doc,.docx,.zip"
                className="hidden"
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:bg-muted/30 transition-colors"
              >
                {newDocument.file ? (
                  <div className="space-y-2">
                    {getFileIcon(newDocument.file.name, newDocument.file.type)}
                    <p className="text-sm font-medium text-foreground truncate">{newDocument.file.name}</p>
                    <p className="text-xs text-muted-foreground">{formatFileSize(newDocument.file.size)}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setNewDocument({ ...newDocument, file: null });
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="mt-2"
                    >
                      <X className="w-3 h-3" /> Change File
                    </Button>
                  </div>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm font-medium text-foreground mb-1">Click to select file</p>
                    <p className="text-xs text-muted-foreground">Max 10MB • PDF, Images, Documents, ZIP</p>
                  </>
                )}
              </div>
            </div>

            {/* Document Details */}
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Case *</label>
                <select
                  value={newDocument.case_id}
                  onChange={(e) => setNewDocument({...newDocument, case_id: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                  required
                >
                  <option value="0">Select a case...</option>
                  {cases.map(caseItem => (
                    <option key={caseItem.id} value={caseItem.id}>
                      {caseItem.case_number} - {caseItem.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Category</label>
                <select
                  value={newDocument.document_type}
                  onChange={(e) => setNewDocument({...newDocument, document_type: e.target.value})}
                  className="w-full px-3 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {categories.filter(c => c !== 'all').map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Description</label>
                <textarea
                  value={newDocument.description}
                  onChange={(e) => setNewDocument({...newDocument, description: e.target.value})}
                  placeholder="Brief description of this document..."
                  rows={3}
                  className="w-full px-3 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                />
              </div>
            </div>

            {/* Upload Button */}
            <div className="flex flex-col justify-end">
              <Button
                variant="primary"
                onClick={handleUpload}
                disabled={!newDocument.file || !newDocument.case_id || uploading}
                className="w-full gap-2"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Upload Document
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Your attorney will be notified and review the document
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search documents by name or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-4 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              <select
                value={uploadedByFilter}
                onChange={(e) => setUploadedByFilter(e.target.value)}
                className="px-4 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
              >
                <option value="all">All Documents</option>
                <option value="attorney">Attorney Documents</option>
                <option value="client">Your Documents</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents List */}
      <Card>
        <CardHeader>
          <CardTitle>
            {uploadedByFilter === 'all' ? 'All Documents' : 
             uploadedByFilter === 'attorney' ? 'Attorney Documents' : 'Your Documents'}
            <span className="text-sm font-normal text-muted-foreground ml-2">
              ({filteredDocuments.length} {filteredDocuments.length === 1 ? 'document' : 'documents'})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filteredDocuments.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">
                {documents.length === 0 ? 'No documents found' : 'No documents match your filters'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredDocuments.map((doc) => (
                <div key={doc.id} className="px-6 py-4 hover:bg-muted/30 transition-colors group">
                  <div className="flex items-start gap-4">
                    {/* File Icon */}
                    <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 mt-1">
                      {getFileIcon(doc.file_name, doc.mime_type)}
                    </div>

                    {/* Document Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-medium text-foreground truncate">{doc.name}</h3>
                          <Badge variant={getStatusVariant(doc.status)} className="flex-shrink-0 gap-1">
                            {getStatusIcon(doc.status)}
                            {getStatusDisplay(doc.status)}
                          </Badge>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${
                          doc.isClientUpload 
                            ? 'bg-primary/10 text-primary' 
                            : 'bg-secondary/10 text-secondary'
                        }`}>
                          {doc.isClientUpload ? <User className="w-3 h-3" /> : <Briefcase className="w-3 h-3" />}
                          {doc.isClientUpload ? 'You' : 'Attorney'}
                        </span>
                      </div>
                      
                      {doc.description && (
                        <p className="text-sm text-muted-foreground mb-2">{doc.description}</p>
                      )}
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(doc.uploaded_at)}
                        </span>
                        <span>{formatFileSize(doc.file_size || 0)}</span>
                        <span>{doc.document_type}</span>
                        {doc.case_title && (
                          <span className="flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            {doc.case_title}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="gap-2"
                        onClick={() => handleDownloadDocument(doc.id, doc.name)}
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </Button>
                      {doc.isClientUpload && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDeleteDocument(doc.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Your Uploads Summary */}
      {clientDocuments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              Your Uploads Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-primary/5 rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-1">Total Uploaded</p>
                <p className="text-2xl font-semibold text-primary">{clientDocuments.length}</p>
              </div>
              <div className="bg-warning/5 rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-1">Awaiting Review</p>
                <p className="text-2xl font-semibold text-warning">
                  {clientDocuments.filter(d => d.status === 'Draft' || d.status === 'Under Review').length}
                </p>
              </div>
              <div className="bg-green-500/5 rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-1">Approved</p>
                <p className="text-2xl font-semibold text-green-600">
                  {clientDocuments.filter(d => d.status === 'Approved' || d.status === 'Reference').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info Card */}
      <Card className="bg-gradient-to-br from-secondary/5 to-transparent border-secondary/20">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5 text-secondary" />
            </div>
            <div>
              <h3 className="text-foreground font-medium mb-1">Document Management Guidelines</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                <div>
                  <h4 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                    <User className="w-4 h-4 text-primary" />
                    Your Uploads
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• You can upload documents for attorney review</li>
                    <li>• Maximum file size: 10MB per document</li>
                    <li>• Supported formats: PDF, images, documents, ZIP</li>
                    <li>• You can delete your own uploaded documents</li>
                    <li>• Status updates when attorney reviews your documents</li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-secondary" />
                    Attorney Documents
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Documents from your attorney are read-only</li>
                    <li>• "Under Review" means your attention is needed</li>
                    <li>• Download any document for your records</li>
                    <li>• Contact your attorney with questions</li>
                    <li>• All documents are securely encrypted</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}