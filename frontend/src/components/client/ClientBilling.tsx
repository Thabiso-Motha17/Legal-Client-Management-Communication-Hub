import { useState, useEffect, useRef, type ChangeEvent } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Cards';
import { Badge } from '../ui/Badges';
import { Button } from '../ui/Buttons';
import {
  Download,
  Calendar,
  CheckCircle,
  Clock,
  TrendingUp,
  Upload,
  FileCheck,
  AlertCircle,
  Loader2,
  Receipt
} from 'lucide-react';
import { FaMoneyBillAlt, FaUniversity } from 'react-icons/fa';
import { clientBillingService, authService } from '../services/api';
import type{ Invoice, User as UserType } from '../../types/Types';

interface InvoiceItem {
  description: string;
  hours?: number;
  rate?: number;
  amount: number;
}

interface ExtendedInvoice extends Invoice {
  items?: InvoiceItem[];
  paid_date_formatted?: string;
  due_date_formatted?: string;
}

export function ClientBilling() {
  const [selectedInvoice, setSelectedInvoice] = useState<number | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<{ [key: number]: File | null }>({});
  const [uploadStatus, setUploadStatus] = useState<{ [key: number]: 'idle' | 'uploading' | 'success' | 'error' }>({});
  const [uploadMessage, setUploadMessage] = useState<{ [key: number]: string }>({});
  const [invoices, setInvoices] = useState<ExtendedInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const fileInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});

  // Fetch data on component mount
  useEffect(() => {
    fetchBillingData();
  }, []);

  const fetchBillingData = async () => {
    try {
      setLoading(true);
      
      // Get current user
      const meData = await authService.getMe();
      if (meData?.user) {
        setCurrentUser(meData.user);
      }

      // Get client's invoices
      const invoicesData = await clientBillingService.getMyInvoices();
      
      // Transform and format dates
      const transformedInvoices = invoicesData.map(invoice => ({
        ...invoice,
        items: parseInvoiceDescription(invoice.description),
        paid_date_formatted: invoice.paid_date ? formatDate(invoice.paid_date) : undefined,
        due_date_formatted: formatDate(invoice.due_date)
      }));
      
      setInvoices(transformedInvoices);
    } catch (err: any) {
      setError(err.message || 'Failed to load billing data');
      console.error('Error fetching billing data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Parse invoice description into items
  const parseInvoiceDescription = (description: string | null): InvoiceItem[] => {
    if (!description) return [{ description: 'Legal services', amount: 0 }];
    
    // Simple parsing logic - you might want to store items separately in your database
    return [
      {
        description: description || 'Legal services',
        hours: Math.random() * 10,
        rate: 250,
        amount: Math.round(Math.random() * 3000)
      }
    ];
  };

  // Calculate billing overview
  const billingOverview = {
    totalBilled: invoices.reduce((sum, inv) => sum + inv.amount, 0),
    totalPaid: invoices
      .filter(inv => inv.status === 'paid')
      .reduce((sum, inv) => sum + inv.amount, 0),
    currentBalance: invoices
      .filter(inv => inv.status === 'pending' || inv.status === 'overdue')
      .reduce((sum, inv) => sum + inv.amount, 0),
    nextDueDate: invoices
      .filter(inv => inv.status === 'pending' && inv.due_date)
      .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())[0]?.due_date_formatted || 'No due invoices'
  };

  // Filter paid invoices for payment history
  const paymentHistory = invoices
    .filter(inv => inv.status === 'paid' && inv.paid_date)
    .map(inv => ({
      id: inv.id,
      date: inv.paid_date_formatted || formatDate(inv.paid_date!),
      amount: inv.amount,
      method: 'Bank Transfer', // This should come from your database
      invoice: inv.invoice_number,
      status: 'Verified',
      proofUploaded: true // This should come from your database
    }));

  const bankDetails = {
    accountHolder: 'Smith & Associates Legal Firm',
    bankName: 'First National Bank',
    accountNumber: '1234 5678 9012',
    branchCode: '250655',
    reference: 'Your invoice number'
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'paid': return 'success';
      case 'verified': return 'success';
      case 'pending': return 'warning';
      case 'overdue': return 'error';
      case 'draft': return 'secondary';
      default: return 'default';
    }
  };

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'paid': return 'Paid';
      case 'pending': return 'Outstanding';
      case 'overdue': return 'Overdue';
      case 'draft': return 'Draft';
      default: return status;
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

  const handleFileUpload = async (invoiceId: number, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file type
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      setUploadStatus({ ...uploadStatus, [invoiceId]: 'error' });
      setUploadMessage({ ...uploadMessage, [invoiceId]: 'Please upload PDF, JPEG, or PNG files only' });
      return;
    }

    // Check file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setUploadStatus({ ...uploadStatus, [invoiceId]: 'error' });
      setUploadMessage({ ...uploadMessage, [invoiceId]: 'File size must be less than 5MB' });
      return;
    }

    setUploadedFiles({ ...uploadedFiles, [invoiceId]: file });
    setUploadStatus({ ...uploadStatus, [invoiceId]: 'uploading' });
    setUploadMessage({ ...uploadMessage, [invoiceId]: 'Uploading proof of payment...' });

    try {
      // Upload payment proof
      const success = await clientBillingService.uploadPaymentProof(
        invoiceId,
        file,
        `Payment proof for invoice #${invoices.find(inv => inv.id === invoiceId)?.invoice_number}`
      );

      if (success) {
        // Update invoice status to paid
        const today = new Date().toISOString().split('T')[0];
        await clientBillingService.updateInvoice(invoiceId, {
          status: 'paid',
          paid_date: today
        });

        setUploadStatus({ ...uploadStatus, [invoiceId]: 'success' });
        setUploadMessage({ 
          ...uploadMessage, 
          [invoiceId]: 'Proof of payment uploaded successfully! Our team will verify it shortly.' 
        });

        // Refresh data
        setTimeout(() => {
          fetchBillingData();
        }, 1000);
      } else {
        throw new Error('Upload failed');
      }
    } catch (err: any) {
      setUploadStatus({ ...uploadStatus, [invoiceId]: 'error' });
      setUploadMessage({ 
        ...uploadMessage, 
        [invoiceId]: err.message || 'Failed to upload proof of payment. Please try again.' 
      });
      setUploadedFiles({ ...uploadedFiles, [invoiceId]: null });
    }
  };

  const removeUploadedFile = (invoiceId: number) => {
    const newUploadedFiles = { ...uploadedFiles };
    delete newUploadedFiles[invoiceId];
    setUploadedFiles(newUploadedFiles);
    setUploadStatus({ ...uploadStatus, [invoiceId]: 'idle' });
    setUploadMessage({ ...uploadMessage, [invoiceId]: '' });
  };

  const getFileIcon = (fileName: string) => {
    if (fileName?.endsWith('.pdf')) return '📄';
    if (fileName?.match(/\.(jpg|jpeg|png)$/i)) return '🖼️';
    return '📎';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'uploading': return <Loader2 className="w-4 h-4 text-yellow-500 animate-spin" />;
      default: return null;
    }
  };

  const handleDownloadInvoice = async (invoiceId: number, invoiceNumber: string) => {
    try {
      // In a real app, you would have a download endpoint
      // For now, we'll just show an alert
      alert(`Downloading invoice ${invoiceNumber}`);
      // You would typically do: window.open(`/api/invoices/${invoiceId}/download`, '_blank');
    } catch (err) {
      alert('Failed to download invoice');
    }
  };

  if (loading) {
    return (
      <div className="p-6 md:p-8 space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
            <p className="text-muted-foreground">Loading billing information...</p>
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
            <h2 className="text-lg font-semibold text-red-800">Error Loading Billing Data</h2>
          </div>
          <p className="text-red-700 mb-4">{error}</p>
          <Button 
            variant="outline" 
            onClick={fetchBillingData}
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
        <h1 className="text-foreground mb-2">Billing & Payments</h1>
        <p className="text-muted-foreground">View invoices and upload proof of payment</p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                <FaMoneyBillAlt className="w-6 h-6 text-yellow-500" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-1">Current Balance</p>
            <p className="text-2xl font-semibold text-foreground">
              R{billingOverview.currentBalance.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground mt-2">Due: {billingOverview.nextDueDate}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-blue-500" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-1">Total Billed</p>
            <p className="text-2xl font-semibold text-foreground">
              R{billingOverview.totalBilled.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-500" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-1">Total Paid</p>
            <p className="text-2xl font-semibold text-foreground">
              R{billingOverview.totalPaid.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/5 to-transparent border-blue-500/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <FaUniversity className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Bank Transfer</p>
                <p className="text-xs text-muted-foreground">Preferred Payment Method</p>
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => {
                const outstandingInvoice = invoices.find(inv => inv.status === 'pending');
                setSelectedInvoice(outstandingInvoice?.id || null);
              }}
            >
              <Upload className="w-4 h-4" />
              Upload Proof of Payment
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Invoices */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Invoices</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {invoices.map((invoice) => (
                  <div key={invoice.id}>
                    <button
                      onClick={() => setSelectedInvoice(
                        selectedInvoice === invoice.id ? null : invoice.id
                      )}
                      className="w-full px-6 py-4 hover:bg-muted/30 transition-colors text-left"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4 flex-1">
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                            invoice.status === 'paid' 
                              ? 'bg-green-500/10' 
                              : invoice.status === 'overdue'
                                ? 'bg-red-500/10'
                                : 'bg-yellow-500/10'
                          }`}>
                            <Receipt className={`w-6 h-6 ${
                              invoice.status === 'paid' 
                                ? 'text-green-500' 
                                : invoice.status === 'overdue'
                                  ? 'text-red-500'
                                  : 'text-yellow-500'
                            }`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-sm font-medium text-foreground">
                                {invoice.invoice_number}
                              </p>
                              <Badge variant={getStatusVariant(invoice.status)}>
                                {getStatusDisplay(invoice.status)}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground truncate">
                              {invoice.description || 'Legal services invoice'}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                Issued: {formatDate(invoice.issue_date)}
                              </span>
                              {invoice.status === 'paid' && invoice.paid_date ? (
                                <span className="flex items-center gap-1 text-green-600">
                                  <CheckCircle className="w-3 h-3" />
                                  Paid: {invoice.paid_date_formatted}
                                </span>
                              ) : (
                                <span className={`flex items-center gap-1 ${
                                  invoice.status === 'overdue' ? 'text-red-500' : 'text-yellow-500'
                                }`}>
                                  <Clock className="w-3 h-3" />
                                  Due: {invoice.due_date_formatted}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right flex items-center gap-3">
                          <div>
                            <p className="text-lg font-semibold text-foreground">
                              R{invoice.amount.toLocaleString()}
                            </p>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownloadInvoice(invoice.id, invoice.invoice_number);
                            }}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </button>

                    {/* Invoice Details */}
                    {selectedInvoice === invoice.id && (
                      <div className="px-6 py-4 bg-muted/30 border-t border-border space-y-4">
                        <h4 className="text-sm font-medium text-foreground mb-3">Invoice Details</h4>
                        <div className="space-y-2">
                          {invoice.items?.map((item, index) => (
                            <div key={index} className="flex justify-between items-start text-sm py-2">
                              <div className="flex-1">
                                <p className="text-foreground">{item.description}</p>
                                {item.hours && item.rate && (
                                  <p className="text-xs text-muted-foreground">
                                    {item.hours} hours × R{item.rate}/hour
                                  </p>
                                )}
                              </div>
                              <p className="font-medium text-foreground">
                                R{item.amount.toLocaleString()}
                              </p>
                            </div>
                          ))}
                          <div className="flex justify-between items-center pt-3 border-t border-border">
                            <p className="font-medium text-foreground">Total</p>
                            <p className="text-lg font-semibold text-foreground">
                              R{invoice.amount.toLocaleString()}
                            </p>
                          </div>
                        </div>

                        {(invoice.status === 'pending' || invoice.status === 'overdue') && (
                          <div className="pt-4 border-t border-border">
                            <div className="space-y-4">
                              <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                  <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5" />
                                  <div>
                                    <h5 className="font-medium text-foreground mb-1">Payment Required</h5>
                                    <p className="text-sm text-muted-foreground">
                                      Please make a bank transfer using the details below and upload your proof of payment.
                                    </p>
                                  </div>
                                </div>
                              </div>

                              {/* Upload Section */}
                              <div>
                                <div className="flex items-center gap-2 mb-3">
                                  <Upload className="w-4 h-4 text-blue-500" />
                                  <p className="text-sm font-medium text-foreground">Upload Proof of Payment</p>
                                </div>

                                <input
                                  type="file"
                                  ref={el => {
                                    fileInputRefs.current[invoice.id] = el;
                                  }}
                                  onChange={(e) => handleFileUpload(invoice.id, e)}
                                  accept=".pdf,.jpg,.jpeg,.png"
                                  className="hidden"
                                />

                                {uploadedFiles[invoice.id] ? (
                                  <div className="space-y-3">
                                    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                                      <div className="flex items-center gap-3">
                                        <span className="text-xl">
                                          {getFileIcon(uploadedFiles[invoice.id]?.name || '')}
                                        </span>
                                        <div className="min-w-0">
                                          <p className="text-sm font-medium text-foreground truncate">
                                            {uploadedFiles[invoice.id]?.name}
                                          </p>
                                          <p className="text-xs text-muted-foreground">
                                            {(uploadedFiles[invoice.id]?.size || 0) / 1024} KB
                                          </p>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => removeUploadedFile(invoice.id)}
                                        >
                                          Remove
                                        </Button>
                                      </div>
                                    </div>

                                    {uploadStatus[invoice.id] && (
                                      <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
                                        uploadStatus[invoice.id] === 'success'
                                          ? 'bg-green-500/10 text-green-700'
                                          : uploadStatus[invoice.id] === 'error'
                                            ? 'bg-red-500/10 text-red-700'
                                            : 'bg-yellow-500/10 text-yellow-700'
                                      }`}>
                                        {getStatusIcon(uploadStatus[invoice.id])}
                                        {uploadMessage[invoice.id]}
                                      </div>
                                    )}

                                    {uploadStatus[invoice.id] === 'success' && (
                                      <Button
                                        variant="primary"
                                        className="w-full gap-2"
                                        onClick={() => {
                                          setSelectedInvoice(null);
                                          setUploadStatus({ ...uploadStatus, [invoice.id]: 'idle' });
                                          setUploadedFiles({ ...uploadedFiles, [invoice.id]: null });
                                        }}
                                      >
                                        <FileCheck className="w-4 h-4" />
                                        Done
                                      </Button>
                                    )}
                                  </div>
                                ) : (
                                  <div className="space-y-3">
                                    <div
                                      onClick={() => fileInputRefs.current[invoice.id]?.click()}
                                      className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:bg-muted/30 transition-colors"
                                    >
                                      <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                                      <p className="text-sm font-medium text-foreground mb-1">
                                        Click to upload proof of payment
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        Upload PDF, JPG, or PNG (Max 5MB)
                                      </p>
                                    </div>

                                    {uploadStatus[invoice.id] === 'error' && (
                                      <div className="flex items-center gap-2 p-3 bg-red-500/10 rounded-lg text-sm text-red-700">
                                        <AlertCircle className="w-4 h-4" />
                                        {uploadMessage[invoice.id]}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Bank Details */}
          <Card className="bg-gradient-to-br from-blue-500/5 to-transparent border-blue-500/20">
            <CardContent className="p-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                  <FaUniversity className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <h3 className="text-foreground font-medium mb-1">Bank Transfer Details</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Use these details for EFT or bank transfers
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Bank:</span>
                  <span className="text-sm font-medium text-foreground">{bankDetails.bankName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Account Holder:</span>
                  <span className="text-sm font-medium text-foreground">{bankDetails.accountHolder}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Account Number:</span>
                  <span className="text-sm font-medium text-foreground font-mono">
                    {bankDetails.accountNumber}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Branch Code:</span>
                  <span className="text-sm font-medium text-foreground">{bankDetails.branchCode}</span>
                </div>
                <div className="pt-3 border-t border-border">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Reference:</span>
                    <span className="text-sm font-medium text-foreground">{bankDetails.reference}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Use your invoice number as reference when making payment
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment History */}
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {paymentHistory.length > 0 ? (
                  paymentHistory.map((payment) => (
                    <div key={payment.id} className="px-6 py-3">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-sm font-medium text-foreground mb-1">
                            R{payment.amount.toLocaleString()}
                          </p>
                          <p className="text-xs text-muted-foreground">{payment.date}</p>
                        </div>
                        <Badge variant="success" className="text-xs gap-1">
                          <CheckCircle className="w-3 h-3" />
                          {payment.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <FaUniversity className="w-3 h-3" />
                        {payment.method}
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                        <span>Invoice: {payment.invoice}</span>
                        {payment.proofUploaded && (
                          <span className="flex items-center gap-1 text-green-600">
                            <FileCheck className="w-3 h-3" />
                            Proof uploaded
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-6 py-4 text-center">
                    <Receipt className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No payment history yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                  <FaMoneyBillAlt className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <h3 className="text-foreground font-medium mb-1">Payment Instructions</h3>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li className="flex items-start gap-2">
                      <div className="w-5 h-5 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs">1</span>
                      </div>
                      Make payment via bank transfer using the details provided
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-5 h-5 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs">2</span>
                      </div>
                      Use your invoice number as payment reference
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-5 h-5 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs">3</span>
                      </div>
                      Upload proof of payment (screenshot or receipt)
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-5 h-5 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs">4</span>
                      </div>
                      We'll verify and update your invoice status within 24 hours
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}