import { useState } from 'react';
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
  Briefcase
} from 'lucide-react';

export function AssociateDocuments() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCase, setFilterCase] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [showUploadModal, setShowUploadModal] = useState(false);

  const documents = [
    {
      id: 1,
      name: 'Trust Agreement - Draft v2.pdf',
      case: 'CAS-2026-001',
      caseTitle: 'Johnson Estate Planning',
      type: 'Legal Document',
      uploadedBy: 'Me',
      uploadDate: 'Jan 13, 2026',
      size: '2.4 MB',
      status: 'Under Review',
      reviewer: 'Sarah Mitchell',
      version: 2
    },
    {
      id: 2,
      name: 'Estate Tax Research Memo.docx',
      case: 'CAS-2026-001',
      caseTitle: 'Johnson Estate Planning',
      type: 'Research Memo',
      uploadedBy: 'Me',
      uploadDate: 'Jan 12, 2026',
      size: '156 KB',
      status: 'Approved',
      reviewer: 'Sarah Mitchell',
      version: 1
    },
    {
      id: 3,
      name: 'Merger Contract Review Notes.pdf',
      case: 'CAS-2026-003',
      caseTitle: 'Corporate Merger - TechCo',
      type: 'Internal Notes',
      uploadedBy: 'Me',
      uploadDate: 'Jan 13, 2026',
      size: '892 KB',
      status: 'Draft',
      reviewer: null,
      version: 1
    },
    {
      id: 4,
      name: 'Disclosure Schedule Template.xlsx',
      case: 'CAS-2026-003',
      caseTitle: 'Corporate Merger - TechCo',
      type: 'Template',
      uploadedBy: 'Sarah Mitchell',
      uploadDate: 'Jan 10, 2026',
      size: '245 KB',
      status: 'Reference',
      reviewer: null,
      version: 1
    },
    {
      id: 5,
      name: 'Client Meeting Notes - 01-10.pdf',
      case: 'CAS-2026-001',
      caseTitle: 'Johnson Estate Planning',
      type: 'Meeting Notes',
      uploadedBy: 'Me',
      uploadDate: 'Jan 10, 2026',
      size: '124 KB',
      status: 'Approved',
      reviewer: 'Sarah Mitchell',
      version: 1
    },
    {
      id: 6,
      name: 'Contract Amendments Draft.docx',
      case: 'CAS-2025-087',
      caseTitle: 'Smith Contract Review',
      type: 'Legal Document',
      uploadedBy: 'Me',
      uploadDate: 'Jan 12, 2026',
      size: '678 KB',
      status: 'Under Review',
      reviewer: 'Michael Chen',
      version: 3
    },
    {
      id: 7,
      name: 'Due Diligence Checklist.pdf',
      case: 'CAS-2026-003',
      caseTitle: 'Corporate Merger - TechCo',
      type: 'Checklist',
      uploadedBy: 'Sarah Mitchell',
      uploadDate: 'Dec 15, 2025',
      size: '89 KB',
      status: 'Reference',
      reviewer: null,
      version: 1
    },
    {
      id: 8,
      name: 'Case Summary - Johnson Estate.pdf',
      case: 'CAS-2026-001',
      caseTitle: 'Johnson Estate Planning',
      type: 'Case Summary',
      uploadedBy: 'Me',
      uploadDate: 'Jan 8, 2026',
      size: '456 KB',
      status: 'Approved',
      reviewer: 'Sarah Mitchell',
      version: 2
    }
  ];

  const cases = [
    { id: 'CAS-2026-001', title: 'Johnson Estate Planning' },
    { id: 'CAS-2026-003', title: 'Corporate Merger - TechCo' },
    { id: 'CAS-2025-087', title: 'Smith Contract Review' }
  ];

  const documentTypes = ['Receipt','Letter','Pleadings','Correspondences'];

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         doc.caseTitle.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCase = filterCase === 'all' || doc.case === filterCase;
    const matchesType = filterType === 'all' || doc.type === filterType;
    return matchesSearch && matchesCase && matchesType;
  });

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'Approved':
        return 'success';
      case 'Under Review':
        return 'warning';
      case 'Draft':
        return 'secondary';
      case 'Reference':
        return 'default';
      default:
        return 'default';
    }
  };

  const stats = {
    total: documents.length,
    myDocuments: documents.filter(d => d.uploadedBy === 'Me').length,
    underReview: documents.filter(d => d.status === 'Under Review').length,
    approved: documents.filter(d => d.status === 'Approved').length
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-foreground mb-2">Documents</h1>
          <p className="text-muted-foreground">Manage case documents and work product</p>
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
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
              />
            </div>
            <div className="flex gap-2 items-center">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <select
                value={filterCase}
                onChange={(e) => setFilterCase(e.target.value)}
                className="px-4 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
              >
                <option value="all">All Cases</option>
                {cases.map(c => (
                  <option key={c.id} value={c.id}>{c.id} - {c.title}</option>
                ))}
              </select>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
              >
                <option value="all">All Types</option>
                {documentTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upload Modal */}
      {showUploadModal && (
        <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Upload New Document</span>
              <Button variant="ghost" size="sm" onClick={() => setShowUploadModal(false)}>
                Cancel
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block mb-2 text-sm text-foreground">Case</label>
                <select className="w-full px-4 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring">
                  <option value="">Select a case...</option>
                  {cases.map(c => (
                    <option key={c.id} value={c.id}>{c.id} - {c.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block mb-2 text-sm text-foreground">Document Type</label>
                <select className="w-full px-4 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring">
                  <option value="">Select type...</option>
                  {documentTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block mb-2 text-sm text-foreground">File</label>
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer">
                  <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-foreground mb-1">Click to upload or drag and drop</p>
                  <p className="text-xs text-muted-foreground">PDF, DOC, DOCX, XLS, XLSX (max 25MB)</p>
                </div>
              </div>
              <div>
                <label className="block mb-2 text-sm text-foreground">Description (Optional)</label>
                <textarea
                  placeholder="Add notes about this document..."
                  rows={3}
                  className="w-full px-4 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                />
              </div>
              <div className="flex gap-2">
                <Button variant="primary" className="gap-2">
                  <Upload className="w-4 h-4" />
                  Upload Document
                </Button>
                <Button variant="outline" onClick={() => setShowUploadModal(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Documents List */}
      <Card>
        <CardHeader>
          <CardTitle>
            Documents ({filteredDocuments.length})
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
                <div key={doc.id} className="px-6 py-4 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-4">
                    {/* File Icon */}
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-6 h-6 text-primary" />
                    </div>

                    {/* Document Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="text-sm font-medium text-foreground truncate">{doc.name}</h3>
                        <Badge variant={getStatusVariant(doc.status)}>
                          {doc.status}
                        </Badge>
                        {doc.uploadedBy === 'Me' && (
                          <Badge variant="secondary" className="text-xs">My Upload</Badge>
                        )}
                        {doc.version > 1 && (
                          <span className="text-xs text-muted-foreground">v{doc.version}</span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-1 text-xs text-muted-foreground mb-2">
                        <div className="flex items-center gap-1">
                          <Briefcase className="w-3 h-3" />
                          <span className="truncate">{doc.caseTitle}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{doc.uploadDate}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          <span>{doc.uploadedBy}</span>
                        </div>
                        <div>
                          <span>{doc.size}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="px-2 py-0.5 bg-muted rounded text-muted-foreground">
                          {doc.type}
                        </span>
                        {doc.reviewer && (
                          <span className="text-muted-foreground">
                            Reviewer: {doc.reviewer}
                          </span>
                        )}
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
                    </div>
                  </div>
                </div>
              ))}
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
                <li>• All work product must be uploaded to the case file</li>
                <li>• Use clear, descriptive file names with version numbers</li>
                <li>• Documents under review cannot be edited until approved or returned</li>
                <li>• Reference materials and templates are read-only</li>
                <li>• Ensure all client-facing documents are reviewed before submission</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
