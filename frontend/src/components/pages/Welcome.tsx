import { useNavigate } from 'react-router-dom';
import {
  Shield,
  FileText,
  Users,
  Lock,
  Clock,
  CheckCircle,
  ArrowRight,
  Briefcase
} from 'lucide-react';

const features = [
  {
    icon: Briefcase,
    title: 'Case Management',
    description: 'Organize and track all legal cases with comprehensive timeline and milestone tracking'
  },
  {
    icon: FileText,
    title: 'Document Control',
    description: 'Secure document storage with version control and e-signature status tracking'
  },
  {
    icon: Users,
    title: 'Client Portal',
    description: 'Provide clients with secure access to case updates, documents, and communication'
  },
  {
    icon: Shield,
    title: 'Enterprise Security',
    description: 'Bank-level encryption, role-based access control, and comprehensive audit logs'
  },
  {
    icon: Clock,
    title: 'Time & Billing',
    description: 'Streamlined invoicing and payment tracking with automated reminders'
  },
  {
    icon: Lock,
    title: 'Compliance Ready',
    description: 'Built with legal industry standards and data privacy regulations in mind'
  }
];

const benefits = [
  'Centralized case and client information',
  'Secure client communication',
  'Automated deadline tracking',
  'Comprehensive reporting and analytics',
  'Role-based team collaboration',
  'Mobile-responsive access'
];

const useToast = () => {
  const toast = (options: { title: string; description: string; variant?: string }) => {
    if (options.variant === 'destructive') {
      alert(`Error: ${options.title}\n${options.description}`);
    } else {
      alert(`Success: ${options.title}\n${options.description}`);
    }
  };
  return { toast };
};

export function Welcome() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleGetStarted = () => navigate('/login');

  const handlePrivacyPolicy = () =>
    toast({ title: 'Privacy Policy', description: 'Privacy policy details coming soon.' });

  const handleTermsOfService = () =>
    toast({ title: 'Terms of Service', description: 'Terms of service details coming soon.' });

  const handleContactSupport = () =>
    toast({ title: 'Contact Support', description: 'Please contact support@standfirm.com for assistance.' });

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#060818] to-[#0d1023] text-white">

      {/* ── Navbar ── */}
      <div className="border-b border-[#1f2130] bg-[#090b13]/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-semibold bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-600 bg-clip-text text-transparent">
              Dolamo Attorneys INC.
            </span>
          </div>
          <button
            onClick={handleGetStarted}
            className="flex items-center gap-2 px-5 py-2 rounded-lg font-medium text-white bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600 hover:from-yellow-300 hover:via-amber-400 hover:to-yellow-500 shadow-lg shadow-amber-500/25 transition-all text-sm"
          >
            Sign In
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Hero ── */}
      <div className="max-w-7xl mx-auto px-6 py-20 lg:py-32 text-center">
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-600 flex items-center justify-center shadow-xl shadow-amber-500/30">
            <Shield className="w-11 h-11 text-white" />
          </div>
        </div>
        <h1 className="text-5xl lg:text-6xl font-bold mb-4 bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-600 bg-clip-text text-transparent">
          Stand Firm
        </h1>
        <p className="text-xl lg:text-2xl font-medium text-amber-400 mb-4">
          Professional Legal Client Management
        </p>
        <p className="text-lg text-gray-400 mb-10 max-w-2xl mx-auto">
          A secure, enterprise-grade platform designed specifically for law firms to manage cases,
          clients, documents, and communications with complete confidence.
        </p>
        <button
          onClick={handleGetStarted}
          className="inline-flex items-center gap-2 px-8 py-3 rounded-lg font-medium text-white text-base bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600 hover:from-yellow-300 hover:via-amber-400 hover:to-yellow-500 shadow-lg shadow-amber-500/25 transition-all"
        >
          Get Started
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>

      {/* ── Features ── */}
      <div className="max-w-7xl mx-auto px-6 py-16 lg:py-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold mb-3 bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-600 bg-clip-text text-transparent">
            Built for Legal Professionals
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Everything your law firm needs to operate efficiently and serve clients with excellence
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="bg-[#0d1023] border border-[#1f2130] rounded-xl p-6 hover:border-amber-500/40 hover:shadow-lg hover:shadow-amber-500/5 transition-all"
              >
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-600 flex items-center justify-center mb-4 shadow-md shadow-amber-500/20">
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-amber-400 font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{feature.description}</p>
              </div>
            );
          })}
        </div>

        {/* ── Benefits + Security ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-2xl font-bold text-amber-400 mb-4">Why Law Firms Choose Stand Firm</h2>
            <p className="text-gray-400 mb-6 leading-relaxed">
              Stand Firm streamlines your practice management with tools specifically designed
              for the legal industry. From intake to invoicing, manage every aspect of your
              firm with confidence and efficiency.
            </p>
            <div className="space-y-3">
              {benefits.map((benefit) => (
                <div key={benefit} className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300">{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#0d1023] border border-[#1f2130] rounded-xl p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/30">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-amber-400 font-semibold text-lg mb-2">Enterprise Security</h3>
              <p className="text-gray-400 text-sm">
                Your clients trust you with their most sensitive matters. We protect that trust.
              </p>
            </div>
            <div className="space-y-3 bg-[#090b13] border border-[#1f2130] rounded-lg p-5">
              {['256-bit AES encryption', 'Two-factor authentication', 'Role-based access control', 'Complete audit trails', 'SOC 2 Type II compliant'].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0"></div>
                  <span className="text-gray-300 text-sm">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── CTA ── */}
      <div className="border-t border-[#1f2130] bg-[#090b13]/60">
        <div className="max-w-4xl mx-auto px-6 py-20 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Transform Your Practice?</h2>
          <p className="text-gray-400 mb-8 text-lg">
            Join thousands who trust Stand Firm to manage their practices securely and efficiently.
          </p>
          <button
            onClick={handleGetStarted}
            className="inline-flex items-center gap-2 px-8 py-3 rounded-lg font-medium text-white text-base bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600 hover:from-yellow-300 hover:via-amber-400 hover:to-yellow-500 shadow-lg shadow-amber-500/25 transition-all"
          >
            Get Started Today
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="border-t border-[#1f2130] bg-[#090b13]/50">
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-amber-500" />
            <span>© 2026 Dolamo Attorneys INC. All rights reserved.</span>
          </div>
          <div className="flex gap-6">
            {[
              { label: 'Privacy Policy', handler: handlePrivacyPolicy },
              { label: 'Terms of Service', handler: handleTermsOfService },
              { label: 'Contact Support', handler: handleContactSupport },
            ].map(({ label, handler }) => (
              <button
                key={label}
                onClick={handler}
                className="hover:text-amber-400 transition-colors"
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}