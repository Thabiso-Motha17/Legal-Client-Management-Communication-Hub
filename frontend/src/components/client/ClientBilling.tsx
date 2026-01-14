import { useState, useRef, type ChangeEvent } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Cards';
import { Badge } from '../ui/Badges';
import { Button } from '../ui/Buttons';
import {
  Download,
  Calendar,
  CheckCircle,
  Clock,
  FileText,
  TrendingUp,
  Upload,
  FileCheck,
  AlertCircle,
  Eye
} from 'lucide-react';
import { FaMoneyBillAlt, FaUniversity } from 'react-icons/fa';

export function ClientBilling() {
  const [selectedInvoice, setSelectedInvoice] = useState<number | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<{ [key: number]: File | null }>({});
  const [uploadStatus, setUploadStatus] = useState<{ [key: number]: 'idle' | 'uploading' | 'success' | 'error' }>({});
  const [uploadMessage, setUploadMessage] = useState<{ [key: number]: string }>({});
  const fileInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});

  const billingOverview = {
    totalBilled: 12850.00,
    totalPaid: 10400.00,
    currentBalance: 2450.00,
    nextDueDate: 'Jan 20, 2026'
  };

  const invoices = [
    {
      id: 1,
      invoiceNumber: 'INV-2026-001',
      date: 'Jan 1, 2026',
      dueDate: 'Jan 20, 2026',
      amount: 2450.00,
      status: 'Outstanding',
      description: 'Estate planning services - January 2026',
      items: [
        { description: 'Trust agreement drafting', hours: 8.5, rate: 250, amount: 2125.00 },
        { description: 'Document review and consultation', hours: 1.3, rate: 250, amount: 325.00 }
      ]
    },
    {
      id: 2,
      invoiceNumber: 'INV-2025-012',
      date: 'Dec 1, 2025',
      dueDate: 'Dec 20, 2025',
      amount: 3250.00,
      status: 'Paid',
      paidDate: 'Dec 15, 2025',
      description: 'Estate planning services - December 2025',
      items: [
        { description: 'Will preparation', hours: 6.0, rate: 250, amount: 1500.00 },
        { description: 'Healthcare directive preparation', hours: 3.5, rate: 250, amount: 875.00 },
        { description: 'Power of attorney documents', hours: 3.5, rate: 250, amount: 875.00 }
      ]
    },
    {
      id: 3,
      invoiceNumber: 'INV-2025-011',
      date: 'Nov 15, 2025',
      dueDate: 'Dec 5, 2025',
      amount: 1875.00,
      status: 'Paid',
      paidDate: 'Nov 28, 2025',
      description: 'Estate planning consultation',
      items: [
        { description: 'Initial consultation (2 hours)', hours: 2.0, rate: 250, amount: 500.00 },
        { description: 'Asset review and planning', hours: 5.5, rate: 250, amount: 1375.00 }
      ]
    },
    {
      id: 4,
      invoiceNumber: 'INV-2025-010',
      date: 'Nov 1, 2025',
      dueDate: 'Nov 20, 2025',
      amount: 3275.00,
      status: 'Paid',
      paidDate: 'Nov 18, 2025',
      description: 'Initial case setup and research',
      items: [
        { description: 'Case intake and analysis', hours: 4.0, rate: 250, amount: 1000.00 },
        { description: 'Legal research', hours: 6.5, rate: 250, amount: 1625.00 },
        { description: 'Client questionnaire review', hours: 2.6, rate: 250, amount: 650.00 }
      ]
    }
  ];

  const paymentHistory = [
    {
      id: 1,
      date: 'Dec 15, 2025',
      amount: 3250.00,
      method: 'Bank Transfer',
      invoice: 'INV-2025-012',
      status: 'Verified',
      proofUploaded: true
    },
    {
      id: 2,
      date: 'Nov 28, 2025',
      amount: 1875.00,
      method: 'Bank Transfer',
      invoice: 'INV-2025-011',
      status: 'Verified',
      proofUploaded: true
    },
    {
      id: 3,
      date: 'Nov 18, 2025',
      amount: 3275.00,
      method: 'Bank Transfer',
      invoice: 'INV-2025-010',
      status: 'Verified',
      proofUploaded: true
    }
  ];

  const bankDetails = {
    accountHolder: 'Smith & Associates Legal Firm',
    bankName: 'First National Bank',
    accountNumber: '1234 5678 9012',
    branchCode: '250655',
    reference: 'Your invoice number'
  };

  const getStatusVariant = (status: string) => {
    return status === 'Paid' ? 'success' : status === 'Verified' ? 'success' : 'warning';
  };

  const handleFileUpload = (invoiceId: number, event: ChangeEvent<HTMLInputElement>) => {
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
    setUploadMessage({ ...uploadMessage, [invoiceId]: 'Uploading file...' });

    // Simulate upload process
    setTimeout(() => {
      setUploadStatus({ ...uploadStatus, [invoiceId]: 'success' });
      setUploadMessage({ ...uploadMessage, [invoiceId]: 'Proof of payment uploaded successfully! Our team will verify it shortly.' });

      // In a real app, you would upload to your server here
      console.log('Uploading file for invoice', invoiceId, file);
    }, 1500);
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
      case 'success': return <CheckCircle className="w-4 h-4 text-success" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-destructive" />;
      case 'uploading': return <Clock className="w-4 h-4 text-warning animate-spin" />;
      default: return null;
    }
  };

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
              <div className="w-12 h-12 rounded-lg bg-warning/10 flex items-center justify-center">
                <FaMoneyBillAlt className="w-6 h-6 text-warning" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-1">Current Balance</p>
            <p className="text-2xl font-semibold text-foreground">R{billingOverview.currentBalance.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-2">Due: {billingOverview.nextDueDate}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-1">Total Billed</p>
            <p className="text-2xl font-semibold text-foreground">R{billingOverview.totalBilled.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-success" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-1">Total Paid</p>
            <p className="text-2xl font-semibold text-foreground">R{billingOverview.totalPaid.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <FaUniversity className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Bank Transfer</p>
                <p className="text-xs text-muted-foreground">Preferred Payment Method</p>
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => setSelectedInvoice(invoices.find(inv => inv.status === 'Outstanding')?.id || null)}
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
                      onClick={() => setSelectedInvoice(selectedInvoice === invoice.id ? null : invoice.id)}
                      className="w-full px-6 py-4 hover:bg-muted/30 transition-colors text-left"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4 flex-1">
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${invoice.status === 'Paid'
                              ? 'bg-success/10'
                              : 'bg-warning/10'
                            }`}>
                            <FileText className={`w-6 h-6 ${invoice.status === 'Paid'
                                ? 'text-success'
                                : 'text-warning'
                              }`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-sm font-medium text-foreground">{invoice.invoiceNumber}</p>
                              <Badge variant={getStatusVariant(invoice.status)}>{invoice.status}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground truncate">{invoice.description}</p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                Issued: {invoice.date}
                              </span>
                              {invoice.status === 'Paid' && invoice.paidDate ? (
                                <span className="flex items-center gap-1 text-success">
                                  <CheckCircle className="w-3 h-3" />
                                  Paid: {invoice.paidDate}
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 text-warning">
                                  <Clock className="w-3 h-3" />
                                  Due: {invoice.dueDate}
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
                          <Button variant="ghost" size="sm">
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
                          {invoice.items.map((item, index) => (
                            <div key={index} className="flex justify-between items-start text-sm py-2">
                              <div className="flex-1">
                                <p className="text-foreground">{item.description}</p>
                                <p className="text-xs text-muted-foreground">
                                  {item.hours} hours × R{item.rate}/hour
                                </p>
                              </div>
                              <p className="font-medium text-foreground">R{item.amount.toLocaleString()}</p>
                            </div>
                          ))}
                          <div className="flex justify-between items-center pt-3 border-t border-border">
                            <p className="font-medium text-foreground">Total</p>
                            <p className="text-lg font-semibold text-foreground">
                              R{invoice.amount.toLocaleString()}
                            </p>
                          </div>
                        </div>

                        {invoice.status === 'Outstanding' && (
                          <div className="pt-4 border-t border-border">
                            <div className="space-y-4">
                              <div className="bg-warning/5 border border-warning/20 rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                  <AlertCircle className="w-5 h-5 text-warning mt-0.5" />
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
                                  <Upload className="w-4 h-4 text-primary" />
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
                                        <span className="text-xl">{getFileIcon(uploadedFiles[invoice.id]?.name || '')}</span>
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
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => uploadedFiles[invoice.id] && window.URL.createObjectURL(uploadedFiles[invoice.id]!)}
                                        >
                                          <Eye className="w-4 h-4" />
                                        </Button>
                                      </div>
                                    </div>

                                    {uploadStatus[invoice.id] && (
                                      <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${uploadStatus[invoice.id] === 'success'
                                          ? 'bg-success/10 text-success'
                                          : uploadStatus[invoice.id] === 'error'
                                            ? 'bg-destructive/10 text-destructive'
                                            : 'bg-warning/10 text-warning'
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
                                      <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-lg text-sm text-destructive">
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
          <Card className="bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <FaUniversity className="w-5 h-5 text-primary" />
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
                  <span className="text-sm font-medium text-foreground font-mono">{bankDetails.accountNumber}</span>
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
                {paymentHistory.map((payment) => (
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
                        <span className="flex items-center gap-1 text-success">
                          <FileCheck className="w-3 h-3" />
                          Proof uploaded
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                  <FaMoneyBillAlt className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <h3 className="text-foreground font-medium mb-1">Payment Instructions</h3>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li className="flex items-start gap-2">
                      <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs">1</span>
                      </div>
                      Make payment via bank transfer using the details provided
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs">2</span>
                      </div>
                      Use your invoice number as payment reference
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs">3</span>
                      </div>
                      Upload proof of payment (screenshot or receipt)
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
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