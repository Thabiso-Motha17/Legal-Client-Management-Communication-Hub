import { useState } from 'react';
import { Button } from '../ui/Buttons';
import { Card, CardContent } from '../ui/Cards';
import { 
  Shield, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  ArrowLeft, 
  User, 
  Briefcase, 
  Lock,
  ChevronDown
} from 'lucide-react';

interface LoginProps {
  onLogin: (role: 'client' | 'associate' | 'admin') => void;
  onBackToWelcome: () => void;
}

type UserRole = 'client' | 'associate' | 'admin';

export function Login({ onLogin, onBackToWelcome }: LoginProps) {
  const [role, setRole] = useState<UserRole>('client');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const roleConfig = {
    client: {
      title: 'Client Portal',
      description: 'Access your case documents, billing, and communicate with your attorney',
      icon: User,
      placeholder: 'client.email@example.com',
      color: 'from-yellow-300 via-amber-400 to-yellow-600',
      badgeColor: 'bg-yellow-100 text-yellow-800'
    },
    associate: {
      title: 'Associate Portal',
      description: 'Manage client cases, track billable hours, and access legal resources',
      icon: Briefcase,
      placeholder: 'associate.name@lawfirm.com',
      color: 'from-yellow-300 via-amber-400 to-yellow-600',
      badgeColor: 'bg-yellow-100 text-yellow-800'
    },
    admin: {
      title: 'Administrator Portal',
      description: 'System administration, user management, and firm analytics',
      icon: Lock,
      placeholder: 'admin@lawfirm.com',
      color: 'from-yellow-300 via-amber-400 to-yellow-600',
      badgeColor: 'bg-yellow-100 text-yellow-800'
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!role) {
      setError('Please select a role');
      return;
    }

    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    // Validate email format based on role
    if (role === 'client' && !email.toLowerCase().includes('client')) {
      // In real app, this would be server-side validation
      setError('Please use a client email address');
      return;
    }

    if (role === 'associate' && !email.toLowerCase().endsWith('@lawfirm.com')) {
      setError('Associate accounts require @lawfirm.com email');
      return;
    }

    if (role === 'admin' && !email.toLowerCase().endsWith('@lawfirm.com')) {
      setError('Admin accounts require @lawfirm.com email');
      return;
    }

    // Simulate login process
    onLogin(role);
  };

  const handleRoleSelect = (selectedRole: UserRole) => {
    setRole(selectedRole);
    setIsDropdownOpen(false);
    setEmail(''); // Reset email when changing role
    setError('');
  };

  const currentConfig = roleConfig[role];
  const Icon = currentConfig.icon;

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
              Stand Firm
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
              Sign in to access your portal
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

                {/* Role Selection Dropdown */}
                <div>
                  <label htmlFor="role" className="block mb-2 text-stone-700">
                    Select Portal Type
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className="w-full px-4 py-3 bg-input-background border border-border rounded-lg flex items-center justify-between hover:border-stone-300 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${currentConfig.color} flex items-center justify-center`}>
                          <Icon className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-stone-900 font-medium">{currentConfig.title}</span>
                      </div>
                      <ChevronDown className={`w-5 h-5 text-stone-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {isDropdownOpen && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-border rounded-lg shadow-lg overflow-hidden">
                        {Object.entries(roleConfig).map(([roleKey, config]) => {
                          const RoleIcon = config.icon;
                          return (
                            <button
                              key={roleKey}
                              type="button"
                              onClick={() => handleRoleSelect(roleKey as UserRole)}
                              className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-stone-50 transition-colors ${
                                role === roleKey ? 'bg-stone-50' : ''
                              }`}
                            >
                              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${config.color} flex items-center justify-center`}>
                                <RoleIcon className="w-4 h-4 text-white" />
                              </div>
                              <div className="text-left">
                                <p className="font-medium text-stone-900">{config.title}</p>
                                <p className="text-xs text-stone-500 truncate max-w-[200px]">{config.description}</p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-stone-500 mt-2">
                    {role === 'client' && 'Access your personal case information and documents'}
                    {role === 'associate' && 'Manage client cases and track your work'}
                    {role === 'admin' && 'System administration and user management'}
                  </p>
                </div>

                {/* Email Field */}
                <div>
                  <label htmlFor="email" className="block mb-2 text-stone-700">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={currentConfig.placeholder}
                    className="w-full px-4 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 transition-shadow"
                    autoComplete="email"
                  />
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${currentConfig.badgeColor}`}>
                      {role === 'client' && 'Client Account'}
                      {role === 'associate' && 'Associate Account'}
                      {role === 'admin' && 'Admin Account'}
                    </span>
                    <span className="text-xs text-stone-500">
                      {role === 'client' && 'Use your registered client email'}
                      {role === 'associate' && 'Use your law firm email'}
                      {role === 'admin' && 'Use administrative account email'}
                    </span>
                  </div>
                </div>

                {/* Password Field */}
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

                {/* Remember Me */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-border text-amber-500 focus:ring-2 focus:ring-amber-400"
                    />
                    <span className="text-sm text-stone-700">Remember me on this device</span>
                  </label>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full py-3 gap-2 text-white bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-600
                             hover:from-yellow-400 hover:via-amber-500 hover:to-yellow-700 shadow-md shadow-amber-500/30 transition-all"
                >
                  <Icon className="w-4 h-4" />
                  Sign In to {currentConfig.title}
                </Button>
              </form>

              <div className="mt-6 pt-6 border-t border-border">
                <p className="text-sm text-center text-stone-600">
                  Need to access a different portal?{' '}
                  <button 
                    onClick={() => setIsDropdownOpen(true)}
                    className="text-amber-600 hover:text-amber-700 font-medium transition-colors"
                  >
                    Change portal type
                  </button>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Role Info Cards */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(roleConfig).map(([roleKey, config]) => {
              const RoleIcon = config.icon;
              return (
                <div 
                  key={roleKey}
                  className={`p-4 rounded-lg border ${role === roleKey ? 'border-amber-300 bg-amber-50/30' : 'border-stone-200 bg-white'}`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-6 h-6 rounded-md bg-gradient-to-br ${config.color} flex items-center justify-center`}>
                      <RoleIcon className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-xs font-medium text-stone-700">{config.title}</span>
                  </div>
                  <p className="text-xs text-stone-500">{config.description}</p>
                </div>
              );
            })}
          </div>

          {/* Security Notice */}
          <div className="mt-6 p-4 rounded-lg bg-muted/30 border border-border">
            <div className="flex gap-3">
              <Shield className="w-5 h-5 text-amber-400 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-stone-700 mb-1">Secure Multi-Portal Access</p>
                <p className="text-xs text-stone-500">
                  Each portal provides role-specific access with appropriate permissions. 
                  All activity is logged and monitored for security compliance.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-border bg-card">
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-stone-500">
          <div className="flex items-center gap-4">
            <span>© 2026 LegalHub. All rights reserved.</span>
            <span className="hidden md:inline">•</span>
            <span className="hidden md:inline">Version 3.2.1</span>
          </div>
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