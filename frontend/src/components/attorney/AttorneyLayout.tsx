import { useState, useEffect } from 'react';
import { 
  Home, 
  Briefcase,
  CheckCircle,
  FileText,
  LogOut,
  ChevronDown,
  Menu,
  X,
  Shield,
  Users,
  Settings
} from 'lucide-react';

import { AssociateDashboard } from './AttorneyDashboard';
import { AssociateCases } from './AttorneyCases';
import { AssociateNotes } from './AttorneyNotes';
import { AssociateDocuments } from './AttorneyDocuments';
import { AssociateClients } from './AttorneyClients';
import { AttorneySettings } from '../attorney/AttorneySettings';
import { authService } from '../services/api';
import type{ User } from '../../types/Types';
import { Badge } from '../ui/Badges';
import { Button } from '../ui/Buttons';

interface AssociateLayoutProps {
  onLogout: () => void;
}

export function AssociateLayout({ onLogout }: AssociateLayoutProps) {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch current user on component mount
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const meData = await authService.getMe();
        if (meData?.user) {
          setCurrentUser(meData.user);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentUser();
  }, []);

  // Define base navigation items
  const baseNavigation = [
    { id: 'dashboard', name: 'Dashboard', icon: Home },
    { id: 'cases', name: 'My Cases', icon: Briefcase },
    { id: 'documents', name: 'Documents', icon: FileText },
    { id: 'clients', name: 'Clients', icon: Users },
    { id: 'notes', name: 'Notes', icon: CheckCircle },
  ];

  // Add settings only if user has full access permission
  const fullAccessNavigation = [
    ...baseNavigation,
    { id: 'settings', name: 'Settings', icon: Settings }
  ];

  // Check if user has full access permission
  console.log('Current user permissions:', currentUser?.permissions);
  const hasFullAccess = currentUser?.permissions === 'full access';
  
  // Use appropriate navigation based on permission
  const navigation = hasFullAccess ? fullAccessNavigation : baseNavigation;

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <AssociateDashboard onNavigate={setCurrentPage} />;
      case 'cases':
        return <AssociateCases onNavigate={setCurrentPage}/>;
      case 'clients':
        return <AssociateClients />;
      case 'notes':
        return <AssociateNotes />;
      case 'documents':
        return <AssociateDocuments />;
      case 'settings':
        // Only render settings if user has full access
        if (hasFullAccess) {
          return <AttorneySettings />;
        } else {
          // Redirect to dashboard if unauthorized
          setCurrentPage('dashboard');
          return <AssociateDashboard onNavigate={setCurrentPage} />;
        }
      default:
        return <AssociateDashboard onNavigate={setCurrentPage} />;
    }
  };

  const handleLogout = () => {
    // Clear token from localStorage
    localStorage.removeItem('token');
    onLogout();
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!currentUser?.full_name) return 'AR';
    return currentUser.full_name
      .split(' ')
      .map(name => name[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Get user role display name
  const getUserRole = () => {
    if (!currentUser?.role) return 'Associate';
    return currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1);
  };

  if (loading) {
    return (
      <div className="flex h-screen overflow-hidden bg-stone-50">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto"></div>
            <p className="mt-4 text-stone-600">Loading your dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-stone-50">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-64 bg-white border-r border-stone-200
          transform transition-transform duration-200 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-stone-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-yellow-300 via-amber-400 to-amber-600 flex items-center justify-center shadow">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold bg-gradient-to-br from-yellow-300 via-amber-400 to-amber-600 bg-clip-text text-transparent">
                    Dolamo Attorneys
                  </h2>
                  <p className="text-xs text-stone-500">Associate Portal</p>
                </div>
              </div>

              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden text-stone-500 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 overflow-y-auto">
            <ul className="space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;

                return (
                  <li key={item.id}>
                    <button
                      onClick={() => {
                        setCurrentPage(item.id);
                        setSidebarOpen(false);
                      }}
                      className={`
                        w-full flex items-center gap-3 px-3 py-2.5 rounded-md
                        text-sm font-medium transition-all
                        ${
                          isActive
                            ? 'bg-gradient-to-br from-yellow-300 via-amber-400 to-amber-600 text-white shadow'
                            : 'text-stone-700 hover:bg-amber-50 hover:text-amber-600'
                        }
                      `}
                    >
                      <Icon
                        className={`w-5 h-5 ${
                          isActive ? 'text-white' : 'text-amber-500'
                        }`}
                      />
                      <span className="flex-1 text-left">{item.name}</span>
                      {/* Show lock icon for settings if no full access (just in case) */}
                      {item.id === 'settings' && !hasFullAccess && (
                        <Shield className="w-4 h-4 text-amber-400" />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
            
            {/* Permission Info (Optional - can be removed) */}
            {!hasFullAccess && (
              <div className="mt-6 px-3">
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
                  <p className="text-xs text-amber-800 font-medium mb-1">
                    Limited Access Mode
                  </p>
                  <p className="text-xs text-amber-700">
                    Settings access requires full permissions
                  </p>
                </div>
              </div>
            )}
          </nav>

          {/* User Info */}
          <div className="p-4 border-t border-stone-200">
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-stone-100 transition"
              >
                <div className="w-10 h-10 rounded-full bg-amber-500 text-white flex items-center justify-center text-sm font-semibold">
                  {getUserInitials()}
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-stone-800 truncate">
                    {currentUser?.full_name || 'Associate User'}
                  </p>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-stone-500">
                      {getUserRole()}
                    </p>
                    <span className="text-xs px-1.5 py-0.5 rounded bg-stone-200 text-stone-700">
                      {currentUser?.permissions?.replace(' access', '') || 'Limited'}
                    </span>
                  </div>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-stone-500 transition-transform ${
                    showUserMenu ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {showUserMenu && (
                <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-stone-200 rounded-lg shadow-lg overflow-hidden z-50">
                  <div className="p-3 border-b border-stone-100">
                    <p className="text-xs text-stone-500 mb-1">Current Permissions</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-stone-800">
                        {currentUser?.permissions || 'Limited access'}
                      </span>
                      <Badge 
                        variant={hasFullAccess ? 'success' : 'warning'}
                        className="text-xs"
                      >
                        {hasFullAccess ? 'Full Access' : 'Limited'}
                      </Badge>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition"
                  >
                    <LogOut className="w-4 h-4" />
                    Log Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white border-b border-stone-200">
          <div className="flex items-center justify-between px-4 lg:px-6 h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-stone-700 hover:text-stone-900"
              >
                <Menu className="w-6 h-6" />
              </button>

              <h1 className="text-lg font-semibold text-stone-800">
                {navigation.find(n => n.id === currentPage)?.name || 'Dashboard'}
              </h1>
              {currentPage === 'settings' && !hasFullAccess && (
                <span className="text-xs px-2 py-1 rounded bg-red-100 text-red-800">
                  Unauthorized
                </span>
              )}
            </div>
            
            {/* Top bar user info */}
            <div className="hidden lg:flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-medium text-stone-800">
                  {currentUser?.full_name || 'Associate User'}
                </p>
                <p className="text-xs text-stone-500 flex items-center gap-1">
                  {getUserRole()}
                  <span className={`w-2 h-2 rounded-full ${
                    hasFullAccess ? 'bg-green-500' : 'bg-amber-500'
                  }`}></span>
                  {currentUser?.permissions?.replace(' access', '') || 'Limited'}
                </p>
              </div>
              <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs font-semibold">
                {getUserInitials().slice(0, 1)}
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto bg-stone-50">
          {/* Show unauthorized message if trying to access settings without permission */}
          {currentPage === 'settings' && !hasFullAccess && (
            <div className="p-8">
              <div className="max-w-2xl mx-auto bg-red-50 border border-red-200 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Shield className="w-6 h-6 text-red-500" />
                  <h2 className="text-lg font-semibold text-red-800">Access Denied</h2>
                </div>
                <p className="text-red-700 mb-4">
                  You don't have permission to access the Settings page. This area requires <strong>Full Access</strong> permissions.
                </p>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setCurrentPage('dashboard')}
                  >
                    Back to Dashboard
                  </Button>
                  <p className="text-sm text-stone-600">
                    Current permissions: <strong>{currentUser?.permissions || 'Limited access'}</strong>
                  </p>
                </div>
              </div>
            </div>
          )}
          {renderPage()}
        </main>
      </div>
    </div>
  );
}
