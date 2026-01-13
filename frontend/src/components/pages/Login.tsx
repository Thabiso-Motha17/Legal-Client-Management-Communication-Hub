import { useState } from 'react';
import { Button } from '../ui/Buttons';
import { Card, CardContent } from '../ui/Cards';
import { Shield, Eye, EyeOff, AlertCircle, ArrowLeft } from 'lucide-react';

interface LoginProps {
  onLogin: () => void;
  onBackToWelcome: () => void;
}

export function Login({ onLogin, onBackToWelcome }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    onLogin();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-600 flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-semibold bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-600 bg-clip-text text-transparent">
              Dolamo Attorneys
            </span>
          </div>
          <Button variant="ghost" onClick={onBackToWelcome} className="gap-2 text-amber-600 hover:text-amber-700">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </div>
      </div>

      {/* Login Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2 bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-600 bg-clip-text text-transparent">
              Welcome Back
            </h1>
            <p className="text-stone-600">
              Sign in to access your legal management platform
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
                  <label htmlFor="email" className="block mb-2 text-stone-700">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.email@lawfirm.com"
                    className="w-full px-4 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 transition-shadow"
                    autoComplete="email"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label htmlFor="password" className="text-stone-700">
                      Password
                    </label>
                    <button
                      type="button"
                      className="text-sm text-amber-600 hover:text-amber-700 transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full px-4 py-3 pr-12 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 transition-shadow"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-border text-amber-500 focus:ring-2 focus:ring-amber-400"
                    />
                    <span className="text-sm text-stone-700">Remember me</span>
                  </label>
                </div>

                <Button
                  type="submit"
                  className="w-full py-3 gap-2 text-white bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-600
                             hover:from-yellow-400 hover:via-amber-500 hover:to-yellow-700 shadow-md shadow-amber-500/30 transition-all"
                >
                  Sign In
                </Button>
              </form>

              <div className="mt-6 pt-6 border-t border-border">
                <p className="text-sm text-center text-stone-600">
                  Don't have an account?{' '}
                  <button className="text-amber-600 hover:text-amber-700 font-medium transition-colors">
                    Contact your administrator
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
                <p className="text-sm font-medium text-stone-700 mb-1">Secure Access</p>
                <p className="text-xs text-stone-500">
                  Your connection is encrypted with 256-bit SSL. All login attempts are monitored 
                  and logged for security purposes.
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
