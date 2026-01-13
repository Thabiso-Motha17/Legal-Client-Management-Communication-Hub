import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Cards';
import { Badge } from '../ui/Badges';
import { Button } from '../ui/Buttons';
import { 
  Download, 
  CreditCard,
  Calendar,
  CheckCircle,
  Clock,
  FileText,
  TrendingUp
} from 'lucide-react';
import { FaMoneyBillAlt } from 'react-icons/fa';

export function ClientBilling() {
  const [selectedInvoice, setSelectedInvoice] = useState<number | null>(null);

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
      method: 'Credit Card (****4532)',
      invoice: 'INV-2025-012',
      status: 'Completed'
    },
    {
      id: 2,
      date: 'Nov 28, 2025',
      amount: 1875.00,
      method: 'Credit Card (****4532)',
      invoice: 'INV-2025-011',
      status: 'Completed'
    },
    {
      id: 3,
      date: 'Nov 18, 2025',
      amount: 3275.00,
      method: 'Credit Card (****4532)',
      invoice: 'INV-2025-010',
      status: 'Completed'
    }
  ];

  const getStatusVariant = (status: string) => {
    return status === 'Paid' ? 'success' : 'warning';
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-foreground mb-2">Billing & Payments</h1>
        <p className="text-muted-foreground">View invoices and manage payments</p>
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

        <Card className="bg-gradient-to-br from-accent/5 to-transparent border-accent/20">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-3">Quick Payment</p>
            <Button variant="primary" className="w-full gap-2">
              <CreditCard className="w-4 h-4" />
              Pay Balance
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
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                            invoice.status === 'Paid' 
                              ? 'bg-success/10' 
                              : 'bg-warning/10'
                          }`}>
                            <FileText className={`w-6 h-6 ${
                              invoice.status === 'Paid' 
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
                      <div className="px-6 py-4 bg-muted/30 border-t border-border">
                        <h4 className="text-sm font-medium text-foreground mb-3">Invoice Details</h4>
                        <div className="space-y-2">
                          {invoice.items.map((item, index) => (
                            <div key={index} className="flex justify-between items-start text-sm py-2">
                              <div className="flex-1">
                                <p className="text-foreground">{item.description}</p>
                                <p className="text-xs text-muted-foreground">
                                  {item.hours} hours × ${item.rate}/hour
                                </p>
                              </div>
                              <p className="font-medium text-foreground">${item.amount.toLocaleString()}</p>
                            </div>
                          ))}
                          <div className="flex justify-between items-center pt-3 border-t border-border">
                            <p className="font-medium text-foreground">Total</p>
                            <p className="text-lg font-semibold text-foreground">
                              ${invoice.amount.toLocaleString()}
                            </p>
                          </div>
                        </div>
                        {invoice.status === 'Outstanding' && (
                          <div className="flex gap-3 mt-4 pt-4 border-t border-border">
                            <Button variant="primary" className="gap-2">
                              <CreditCard className="w-4 h-4" />
                              Pay Now
                            </Button>
                            <Button variant="outline" className="gap-2">
                              <Download className="w-4 h-4" />
                              Download PDF
                            </Button>
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
          {/* Payment Methods */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Methods</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-4 bg-muted/30 rounded-lg border border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">Visa ****4532</p>
                    <p className="text-xs text-muted-foreground">Expires 12/2027</p>
                  </div>
                  <Badge variant="secondary">Primary</Badge>
                </div>
              </div>
              <Button variant="outline" className="w-full">
                Add Payment Method
              </Button>
            </CardContent>
          </Card>

          {/* Payment History */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Payments</CardTitle>
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
                      <Badge variant="success" className="text-xs">
                        {payment.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{payment.method}</p>
                    <p className="text-xs text-muted-foreground">Invoice: {payment.invoice}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Billing Info */}
          <Card className="bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <FaMoneyBillAlt className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-foreground font-medium mb-1">Billing Information</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Invoices are issued monthly based on time and services provided.
                  </p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Payment due within 20 days of invoice date</li>
                    <li>• Multiple payment methods accepted</li>
                    <li>• All charges itemized by service</li>
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
