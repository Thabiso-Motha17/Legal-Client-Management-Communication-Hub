import { Button } from '../ui/Buttons';
import { Card, CardContent } from '../ui/Cards';
import dolamo from '../../assets/law.png';
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

interface WelcomeProps {
  onGetStarted: () => void;
   onClientPortal: () => void;
}

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

export function Welcome({ onGetStarted, onClientPortal }: WelcomeProps) {
  return (
    <div  className="min-h-screen bg-cover bg-center bg-no-repeat absolute inset-0 bg-gradient-to-br from-white/70 via-white/60 to-white/50"
  style={{ backgroundImage: `url(${dolamo})` }}>
      {/* Hero Section */}
      <div className="border-b border-border bg-gradient-to-b from-primary/5 to-background">
        <div className="max-w-7xl mx-auto px-6 py-16 lg:py-24">
          <div className="text-center max-w-4xl mx-auto">
            <div className="flex items-center justify-center gap-3 mb-6">
             <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-600 flex items-center justify-center shadow-md">
  <Shield className="w-9 h-9 text-white" />
</div>
             <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-600 bg-clip-text text-transparent">Dolamo Attorneys</h1>

            </div>
            <p className="text-xl lg:text-2xl font-medium bg-gradient-to-r from-amber-600 to-amber-500 bg-clip-text text-transparent mb-4">
  Professional Legal Client Management
</p>

            <p className="text-lg text-stone-800 mb-8 max-w-2xl mx-auto">
  A secure, enterprise-grade platform designed specifically for law firms to manage cases, 
  clients, documents, and communications with complete confidence.
</p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
             <Button
  size="lg"
  onClick={onGetStarted}
  className="gap-2 text-base px-8 py-3 text-white 
             bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-600
             hover:from-yellow-400 hover:via-amber-500 hover:to-yellow-700
             shadow-md shadow-amber-500/30 transition-all"
>
  Get Started
  <ArrowRight className="w-5 h-5" />
</Button>

             <Button 
                variant="outline" 
                size="lg"
                onClick={onClientPortal}
                className="text-base px-8 py-3"
              >
                Client Portal
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-7xl mx-auto px-6 py-16 lg:py-24">
  <div className="text-center mb-12">
    <h2 className="text-3xl lg:text-4xl font-bold mb-3 
                   bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-600 
                   bg-clip-text text-transparent">
      Built for Legal Professionals
    </h2>
    <p className="text-lg text-stone-800 max-w-2xl mx-auto">
      Everything your law firm needs to operate efficiently and serve clients with excellence
    </p>
  </div>


         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card key={feature.title} className="hover:border-accent/50 transition-all hover:shadow-lg">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-yellow-200 via-amber-300 to-yellow-400 flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-amber-600 mb-2 font-semibold">{feature.title}</h3>
                  <p className="text-stone-600 text-sm leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-amber-600 mb-4 font-bold">Why Law Firms Choose LegalHub</h2>
            <p className="text-stone-600 mb-6 leading-relaxed">
              LegalHub streamlines your practice management with tools specifically designed 
              for the legal industry. From intake to invoicing, manage every aspect of your 
              firm with confidence and efficiency.
            </p>
            <div className="space-y-3">
              {benefits.map((benefit) => (
                <div key={benefit} className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <span className="text-stone-700">{benefit}</span>
                </div>
              ))}
            </div>
          </div>

         <Card className="border-2">
            <CardContent className="p-8">
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-600 flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-amber-600 mb-2">Enterprise Security</h3>
                <p className="text-stone-600 text-sm">
                  Your clients trust you with their most sensitive matters. We protect that trust.
                </p>
              </div>
              <div className="space-y-4 bg-muted/30 rounded-lg p-6">
                {['256-bit AES encryption','Two-factor authentication','Role-based access control','Complete audit trails','SOC 2 Type II compliant'].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                    <span className="text-stone-700 text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* CTA Section */}
      <div className="border-t border-border bg-muted/30">
        <div className="max-w-4xl mx-auto px-6 py-16 text-center">
          <h2 className="text-foreground mb-4">Ready to Transform Your Practice?</h2>
          <p className="text-muted-foreground mb-8 text-lg">
            Join leading law firms who trust LegalHub to manage their practice
          </p>
         <Button
  size="lg"
  onClick={onGetStarted}
  className="gap-2 text-base px-8 py-3 text-white 
             bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-600
             hover:from-yellow-400 hover:via-amber-500 hover:to-yellow-700
             shadow-md shadow-amber-500/30 transition-all"
>
  Get Started Today
  <ArrowRight className="w-5 h-5" />
</Button>

        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-border">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              <span className="text-sm text-muted-foreground">© 2026 LegalHub. All rights reserved.</span>
            </div>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <button className="hover:text-foreground transition-colors">Privacy Policy</button>
              <button className="hover:text-foreground transition-colors">Terms of Service</button>
              <button className="hover:text-foreground transition-colors">Contact Support</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
