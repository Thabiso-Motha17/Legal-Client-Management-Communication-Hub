import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Cards';
import { Badge } from '../ui/Badges';
import { Button } from '../ui/Buttons';
import { 
  Search, 
  Filter, 
  Upload, 
  FileText, 
  Folder, 
  Download, 
  Eye,
  MoreVertical,
  ChevronRight,
  Calendar
} from 'lucide-react';

interface Document {
  id: string;
  name: string;
  type: string;
  size: string;
  status: 'draft' | 'final' | 'signed' | 'pending-review';
  case: string;
  uploadedBy: string;
  uploadedDate: string;
  folder: string;
}

const mockDocuments: Document[] = [
  {
    id: '1',
    name: 'Complaint - Final.pdf',
    type: 'PDF',
    size: '2.4 MB',
    status: 'final',
    case: 'CAS-2026-001',
    uploadedBy: 'Sarah Mitchell',
    uploadedDate: 'Dec 20, 2025',
    folder: 'Legal Filings'
  },
  {
    id: '2',
    name: 'Discovery Request.pdf',
    type: 'PDF',
    size: '1.8 MB',
    status: 'signed',
    case: 'CAS-2026-001',
    uploadedBy: 'Michael Chen',
    uploadedDate: 'Jan 5, 2026',
    folder: 'Discovery'
  },
  {
    id: '3',
    name: 'Client Agreement - Henderson.pdf',
    type: 'PDF',
    size: '856 KB',
    status: 'signed',
    case: 'CAS-2026-001',
    uploadedBy: 'Jennifer Lee',
    uploadedDate: 'Dec 15, 2025',
    folder: 'Contracts'
  },
  {
    id: '4',
    name: 'Estate Plan - Martinez.docx',
    type: 'DOCX',
    size: '124 KB',
    status: 'draft',
    case: 'CAS-2026-002',
    uploadedBy: 'Michael Chen',
    uploadedDate: 'Jan 7, 2026',
    folder: 'Estate Planning'
  },
  {
    id: '5',
    name: 'Evidence Summary.pdf',
    type: 'PDF',
    size: '3.2 MB',
    status: 'pending-review',
    case: 'CAS-2026-001',
    uploadedBy: 'Sarah Mitchell',
    uploadedDate: 'Jan 3, 2026',
    folder: 'Internal Documents'
  },
  {
    id: '6',
    name: 'Witness Statement - Johnson.pdf',
    type: 'PDF',
    size: '645 KB',
    status: 'final',
    case: 'CAS-2025-089',
    uploadedBy: 'Jennifer Lee',
    uploadedDate: 'Dec 28, 2025',
    folder: 'Evidence'
  }
];

const folders = [
  { name: 'Legal Filings', count: 1, icon: Folder },
  { name: 'Contracts', count: 1, icon: Folder },
  { name: 'Discovery', count: 1, icon: Folder },
  { name: 'Estate Planning', count: 1, icon: Folder },
  { name: 'Evidence', count: 1, icon: Folder },
  { name: 'Internal Documents', count: 1, icon: Folder }
];

export function Documents() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);

  const filteredDocuments = mockDocuments.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         doc.case.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || doc.status === statusFilter;
    const matchesFolder = !selectedFolder || doc.folder === selectedFolder;
    return matchesSearch && matchesStatus && matchesFolder;
  });

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'signed': return 'success';
      case 'final': return 'success';
      case 'pending-review': return 'warning';
      case 'draft': return 'secondary';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'signed': return 'Signed';
      case 'final': return 'Final';
      case 'pending-review': return 'Pending Review';
      case 'draft': return 'Draft';
      default: return status;
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-foreground mb-1">Document Management</h1>
          <p className="text-muted-foreground text-sm">Organize and manage case documents securely</p>
        </div>
        <Button variant="primary" className="gap-2">
          <Upload className="w-4 h-4" />
          Upload Document
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Folders Sidebar */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Folders</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="space-y-1 p-2">
              <button
                onClick={() => setSelectedFolder(null)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors ${
                  selectedFolder === null
                    ? 'bg-muted text-foreground'
                    : 'text-muted-foreground hover:bg-muted/50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Folder className="w-4 h-4" />
                  <span>All Documents</span>
                </div>
                <ChevronRight className="w-4 h-4" />
              </button>
              {folders.map((folder) => (
                <button
                  key={folder.name}
                  onClick={() => setSelectedFolder(folder.name)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors ${
                    selectedFolder === folder.name
                      ? 'bg-muted text-foreground'
                      : 'text-muted-foreground hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Folder className="w-4 h-4" />
                    <span>{folder.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">{folder.count}</Badge>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Documents List */}
        <div className="lg:col-span-3 space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search documents..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="pl-10 pr-8 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring appearance-none cursor-pointer"
                  >
                    <option value="all">All Status</option>
                    <option value="draft">Draft</option>
                    <option value="final">Final</option>
                    <option value="signed">Signed</option>
                    <option value="pending-review">Pending Review</option>
                  </select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50 border-y border-border">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Document Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Size
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Case
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Uploaded
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredDocuments.map((doc) => (
                      <tr key={doc.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                            <div>
                              <p className="text-sm font-medium text-foreground">{doc.name}</p>
                              <p className="text-xs text-muted-foreground">{doc.folder}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant="secondary" className="text-xs">{doc.type}</Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                          {doc.size}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant={getStatusVariant(doc.status)}>
                            {getStatusLabel(doc.status)}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                          {doc.case}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm text-foreground">{doc.uploadedDate}</p>
                              <p className="text-xs text-muted-foreground">{doc.uploadedBy}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Download className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {filteredDocuments.length === 0 && (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No documents found matching your criteria.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
