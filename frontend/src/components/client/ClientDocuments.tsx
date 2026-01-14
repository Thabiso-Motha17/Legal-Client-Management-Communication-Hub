import { useState, useRef, type ChangeEvent } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Cards';
import { Badge } from '../ui/Badges';
import { Button } from '../ui/Buttons';
import { 
  FileText, 
  Download, 
  Search,
  Filter,
  Eye,
  Calendar,
  File,
  Upload,
  X,
  User,
  AlertCircle,
  CheckCircle,
  Trash2
} from 'lucide-react';

export function ClientDocuments() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [uploadedByFilter, setUploadedByFilter] = useState('all');
  const [clientDocuments, setClientDocuments] = useState([
    {
      id: 101,
      name: 'Bank Statement - Jan 2026.pdf',
      category: 'Financial',
      uploadDate: 'Jan 12, 2026',
      size: '1.2 MB',
      uploadedBy: 'You',
      status: 'Uploaded',
      description: 'Bank statement for account verification'
    },
    {
      id: 102,
      name: 'Property Photos.zip',
      category: 'Evidence',
      uploadDate: 'Jan 9, 2026',
      size: '4.5 MB',
      uploadedBy: 'You',
      status: 'Reviewed',
      description: 'Photos of property for estate planning'
    },
    {
      id: 103,
      name: 'ID Document.jpg',
      category: 'Identification',
      uploadDate: 'Dec 22, 2025',
      size: '850 KB',
      uploadedBy: 'You',
      status: 'Verified',
      description: 'Scanned copy of identification'
    }
  ]);
  const [uploading, setUploading] = useState(false);
  const [newDocument, setNewDocument] = useState({
    name: '',
    category: 'Financial',
    description: ''
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const attorneyDocuments = [
    {
      id: 1,
      name: 'Trust Agreement - Draft v2.pdf',
      category: 'Agreements',
      uploadDate: 'Jan 10, 2026',
      size: '2.4 MB',
      uploadedBy: 'Sarah Mitchell',
      status: 'Review Required'
    },
    {
      id: 2,
      name: 'Property Deed Transfer.pdf',
      category: 'Legal Documents',
      uploadDate: 'Jan 8, 2026',
      size: '1.8 MB',
      uploadedBy: 'Sarah Mitchell',
      status: 'Completed'
    },
    {
      id: 3,
      name: 'Will - Final Version.pdf',
      category: 'Wills',
      uploadDate: 'Jan 5, 2026',
      size: '856 KB',
      uploadedBy: 'Sarah Mitchell',
      status: 'Signed'
    },
    {
      id: 4,
      name: 'Asset Inventory.xlsx',
      category: 'Financial',
      uploadDate: 'Dec 28, 2025',
      size: '124 KB',
      uploadedBy: 'John Johnson',
      status: 'Completed'
    },
    {
      id: 5,
      name: 'Healthcare Directive.pdf',
      category: 'Legal Documents',
      uploadDate: 'Dec 20, 2025',
      size: '675 KB',
      uploadedBy: 'Sarah Mitchell',
      status: 'Signed'
    },
    {
      id: 6,
      name: 'Power of Attorney - Financial.pdf',
      category: 'Legal Documents',
      uploadDate: 'Dec 18, 2025',
      size: '892 KB',
      uploadedBy: 'Sarah Mitchell',
      status: 'Signed'
    },
    {
      id: 7,
      name: 'Trust Agreement - Draft v1.pdf',
      category: 'Agreements',
      uploadDate: 'Dec 15, 2025',
      size: '2.2 MB',
      uploadedBy: 'Sarah Mitchell',
      status: 'Superseded'
    },
    {
      id: 8,
      name: 'Estate Planning Questionnaire.pdf',
      category: 'Forms',
      uploadDate: 'Nov 20, 2025',
      size: '458 KB',
      uploadedBy: 'John Johnson',
      status: 'Completed'
    }
  ];

  const categories = ['all', 'Receipt', 'Letter', 'Pleadings', 'Correspondences'];

  const allDocuments = [...attorneyDocuments, ...clientDocuments];

  const filteredDocuments = allDocuments.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase()) 
                         
    const matchesCategory = filterCategory === 'all' || doc.category === filterCategory;
    const matchesUploader = uploadedByFilter === 'all' || 
                           (uploadedByFilter === 'attorney' && doc.uploadedBy !== 'You') ||
                           (uploadedByFilter === 'client' && doc.uploadedBy === 'You');
    return matchesSearch && matchesCategory && matchesUploader;
  });

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'Review Required':
      case 'Uploaded':
        return 'warning';
      case 'Signed':
      case 'Completed':
      case 'Verified':
      case 'Reviewed':
        return 'success';
      case 'Superseded':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const getFileIcon = (filename: string) => {
    if (filename.endsWith('.pdf')) {
      return <FileText className="w-5 h-5 text-destructive" />;
    } else if (filename.endsWith('.xlsx') || filename.endsWith('.xls')) {
      return <File className="w-5 h-5 text-success" />;
    } else if (filename.endsWith('.zip')) {
      return <File className="w-5 h-5 text-warning" />;
    } else if (filename.endsWith('.jpg') || filename.endsWith('.jpeg') || filename.endsWith('.png')) {
      return <File className="w-5 h-5 text-primary" />;
    } else {
      return <FileText className="w-5 h-5 text-primary" />;
    }
  };

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ['.pdf', '.jpg', '.jpeg', '.png', '.xlsx', '.xls', '.doc', '.docx', '.zip'];
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      
      if (!validTypes.includes(fileExtension)) {
        alert('Please select a valid file type (PDF, images, documents, or ZIP)');
        return;
      }

      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
      }

      setSelectedFile(file);
      setNewDocument({
        ...newDocument,
        name: file.name,
        category: getCategoryFromFile(file)
      });
    }
  };

  const getCategoryFromFile = (file: File): string => {
    const name = file.name.toLowerCase();
    if (name.includes('bank') || name.includes('statement') || name.includes('financial')) return 'Financial';
    if (name.includes('id') || name.includes('passport') || name.includes('license')) return 'Identification';
    if (name.includes('photo') || name.includes('image') || name.includes('evidence')) return 'Evidence';
    if (name.endsWith('.pdf')) return 'Legal Documents';
    return 'Financial';
  };

  const handleUpload = () => {
    if (!selectedFile) {
      alert('Please select a file to upload');
      return;
    }

    if (!newDocument.description.trim()) {
      alert('Please add a description for the document');
      return;
    }

    setUploading(true);

    // Simulate upload process
    setTimeout(() => {
      const newDoc = {
        id: Date.now(),
        name: selectedFile.name,
        category: newDocument.category,
        uploadDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
        size: formatFileSize(selectedFile.size),
        uploadedBy: 'You',
        status: 'Uploaded',
        description: newDocument.description
      };

      setClientDocuments(prev => [newDoc, ...prev]);
      setUploading(false);
      setSelectedFile(null);
      setNewDocument({
        name: '',
        category: 'Financial',
        description: ''
      });
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }, 1500);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleDeleteDocument = (id: number) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      setClientDocuments(prev => prev.filter(doc => doc.id !== id));
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Uploaded':
        return <AlertCircle className="w-3 h-3 text-warning" />;
      case 'Verified':
      case 'Reviewed':
      case 'Signed':
      case 'Completed':
        return <CheckCircle className="w-3 h-3 text-success" />;
      default:
        return null;
    }
  };

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
            <p className="text-2xl font-semibold text-foreground">{allDocuments.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground mb-1">Your Uploads</p>
            <p className="text-2xl font-semibold text-primary">{clientDocuments.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground mb-1">Pending Review</p>
            <p className="text-2xl font-semibold text-warning">
              {allDocuments.filter(d => d.status === 'Review Required' || d.status === 'Uploaded').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground mb-1">Verified/Signed</p>
            <p className="text-2xl font-semibold text-success">
              {allDocuments.filter(d => d.status === 'Signed' || d.status === 'Verified' || d.status === 'Reviewed').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground mb-1">Total Size</p>
            <p className="text-2xl font-semibold text-foreground">~15.5 MB</p>
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
              <p className="text-sm text-muted-foreground">Upload files for your attorney to review (PDF)</p>
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
                accept=".pdf"
                className="hidden"
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:bg-muted/30 transition-colors"
              >
                {selectedFile ? (
                  <div className="space-y-2">
                    <FileText className="w-8 h-8 text-primary mx-auto" />
                    <p className="text-sm font-medium text-foreground truncate">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e:any) => {
                        e.stopPropagation();
                        setSelectedFile(null);
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
                    <p className="text-xs text-muted-foreground">Max 10MB • PDF Only</p>
                  </>
                )}
              </div>
            </div>

            {/* Document Details */}
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Category</label>
                <select
                  value={newDocument.category}
                  onChange={(e) => setNewDocument({...newDocument, category: e.target.value})}
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
                disabled={!selectedFile || uploading}
                className="w-full gap-2"
              >
                {uploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
              <p className="text-muted-foreground">No documents found</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredDocuments.map((doc) => (
                <div key={doc.id} className="px-6 py-4 hover:bg-muted/30 transition-colors group">
                  <div className="flex items-start gap-4">
                    {/* File Icon */}
                    <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 mt-1">
                      {getFileIcon(doc.name)}
                    </div>

                    {/* Document Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-medium text-foreground truncate">{doc.name}</h3>
                          <Badge variant={getStatusVariant(doc.status)} className="flex-shrink-0 gap-1">
                            {getStatusIcon(doc.status)}
                            {doc.status}
                          </Badge>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${
                          doc.uploadedBy === 'You' 
                            ? 'bg-primary/10 text-primary' 
                            : 'bg-secondary/10 text-secondary'
                        }`}>
                          {doc.uploadedBy === 'You' ? <User className="w-3 h-3" /> : null}
                          {doc.uploadedBy}
                        </span>
                      </div>
                      
                      {(doc as any).description && (
                        <p className="text-sm text-muted-foreground mb-2">{(doc as any).description}</p>
                      )}
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {doc.uploadDate}
                        </span>
                        <span>{doc.size}</span>
                        <span>{doc.category}</span>
                        {doc.uploadedBy !== 'You' && <span>Uploaded by {doc.uploadedBy}</span>}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button variant="outline" size="sm" className="gap-2">
                        <Eye className="w-4 h-4" />
                        View
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Download className="w-4 h-4" />
                      </Button>
                      {doc.uploadedBy === 'You' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
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
                  {clientDocuments.filter(d => d.status === 'Uploaded').length}
                </p>
              </div>
              <div className="bg-success/5 rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-1">Reviewed/Verified</p>
                <p className="text-2xl font-semibold text-success">
                  {clientDocuments.filter(d => d.status === 'Reviewed' || d.status === 'Verified').length}
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
                    <FileText className="w-4 h-4 text-secondary" />
                    Attorney Documents
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Documents from your attorney are read-only</li>
                    <li>• "Review Required" means your attention is needed</li>
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