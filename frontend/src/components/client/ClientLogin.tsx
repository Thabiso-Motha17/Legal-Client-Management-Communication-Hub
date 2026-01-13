import { useState } from 'react';
import { Button } from '../ui/Buttons';
import { Card, CardContent } from '../ui/Cards';
import { Shield, Eye, EyeOff, AlertCircle, ArrowLeft } from 'lucide-react';

interface ClientLoginProps {
  onLogin: () => void;
  onBackToWelcome: () => void;
}

export function ClientLogin({ onLogin, onBackToWelcome }: ClientLoginProps) {
  const [caseNumber, setCaseNumber] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [showAccessCode, setShowAccessCode] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!caseNumber || !accessCode) {
      setError('Please enter both case number and access code');
      return;
    }

    onLogin();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 flex items-center justify-center shadow-sm">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-semibold bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 bg-clip-text text-transparent">
              Dolamo Attorneys
            </span>
          </div>

          <Button
            variant="ghost"
            onClick={onBackToWelcome}
            className="gap-2 text-amber-600 hover:text-amber-700"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </div>
      </div>

      {/* Client Login Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2 bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 bg-clip-text text-transparent">
              Client Access
            </h1>
            <p className="text-stone-600">
              Access your case information and communicate with your legal team
            </p>
          </div>

          <Card>
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                    <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-destructive">{error}</p>
                  </div>
                )}

                <div>
                  <label className="block mb-2 text-stone-700">
                    Case Number
                  </label>
                  <input
                    type="text"
                    value={caseNumber}
                    onChange={(e) => setCaseNumber(e.target.value)}
                    placeholder="CAS-2026-001"
                    className="w-full px-4 py-3 bg-input-background border border-border rounded-lg
                               focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                  <p className="text-xs text-stone-500 mt-1">
                    Provided in your welcome email
                  </p>
                </div>

                <div>
                  <label className="block mb-2 text-stone-700">
                    Access Code
                  </label>
                  <div className="relative">
                    <input
                      type={showAccessCode ? 'text' : 'password'}
                      value={accessCode}
                      onChange={(e) => setAccessCode(e.target.value)}
                      placeholder="Enter your access code"
                      className="w-full px-4 py-3 pr-12 bg-input-background border border-border rounded-lg
                                 focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAccessCode(!showAccessCode)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
                    >
                      {showAccessCode ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-stone-500 mt-1">
                    Secure code sent to your email
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full py-3 text-white
                             bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600
                             hover:from-amber-500 hover:via-amber-600 hover:to-amber-700
                             shadow-md shadow-amber-500/30 transition-all"
                >
                  Access My Portal
                </Button>
              </form>

              <div className="mt-6 pt-6 border-t border-border">
                <p className="text-sm text-center text-stone-600">
                  Need help accessing your portal?{' '}
                  <button className="text-amber-600 hover:text-amber-700 font-medium">
                    Contact support
                  </button>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Security Notice */}
          <div className="mt-6 p-4 rounded-lg bg-muted/30 border border-border">
            <div className="flex gap-3">
              <Shield className="w-5 h-5 text-amber-400 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-stone-700 mb-1">
                  Secure & Private
                </p>
                <p className="text-xs text-stone-500">
                  Your information is protected with bank-level encryption.
                  Your attorney will be notified when you access the portal.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-border bg-card">
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-stone-500">
          <span>© 2026 LegalHub. All rights reserved.</span>
          <div className="flex gap-6">
            <button className="hover:text-amber-600 transition-colors">Privacy Policy</button>
            <button className="hover:text-amber-600 transition-colors">Terms of Service</button>
            <button className="hover:text-amber-600 transition-colors">Support</button>
          </div>
        </div>
      </div>
    </div>
  );
}
