import { useState } from 'react';
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
  File
} from 'lucide-react';

export function ClientDocuments() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

  const documents = [
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

  const categories = ['all', 'Agreements', 'Legal Documents', 'Wills', 'Financial', 'Forms'];

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || doc.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'Review Required':
        return 'warning';
      case 'Signed':
      case 'Completed':
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
    } else {
      return <FileText className="w-5 h-5 text-primary" />;
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-foreground mb-2">Documents</h1>
        <p className="text-muted-foreground">Access and download your case documents</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground mb-1">Total Documents</p>
            <p className="text-2xl font-semibold text-foreground">{documents.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground mb-1">Pending Review</p>
            <p className="text-2xl font-semibold text-warning">
              {documents.filter(d => d.status === 'Review Required').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground mb-1">Signed</p>
            <p className="text-2xl font-semibold text-success">
              {documents.filter(d => d.status === 'Signed').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground mb-1">Total Size</p>
            <p className="text-2xl font-semibold text-foreground">9.2 MB</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
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
          </div>
        </CardContent>
      </Card>

      {/* Documents List */}
      <Card>
        <CardHeader>
          <CardTitle>
            {filterCategory === 'all' ? 'All Documents' : filterCategory}
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
                <div key={doc.id} className="px-6 py-4 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-4">
                    {/* File Icon */}
                    <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                      {getFileIcon(doc.name)}
                    </div>

                    {/* Document Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-medium text-foreground truncate">{doc.name}</h3>
                        <Badge variant={getStatusVariant(doc.status)} className="flex-shrink-0">
                          {doc.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {doc.uploadDate}
                        </span>
                        <span>{doc.size}</span>
                        <span>{doc.category}</span>
                        <span>Uploaded by {doc.uploadedBy}</span>
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

      {/* Info Card */}
      <Card className="bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-foreground font-medium mb-1">Document Access & Security</h3>
              <p className="text-sm text-muted-foreground mb-3">
                All documents are encrypted and securely stored. Download access is logged for security purposes.
              </p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Documents marked "Review Required" need your attention</li>
                <li>• You can download any document for your records</li>
                <li>• Contact your attorney if you have questions about any document</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
