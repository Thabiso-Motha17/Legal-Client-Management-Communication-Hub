import { Search, Bell, User, ChevronDown, LogOut, Settings as SettingsIcon } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../lib/api';
import type { User as UserType } from '../../types/Types';

interface TopBarProps {
  onNavigate?: (page: string) => void;
  onLogout?: () => void;
}

export function TopBar({ onNavigate, onLogout }: TopBarProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [notificationCount, setNotificationCount] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  // Fetch user data
  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.error('No token found');
        return;
      }

      const result = await apiRequest<{ user: UserType }>('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (result.data?.user) {
        setUser(result.data.user);
      }
    } catch (error) {
      console.error('Failed to fetch user data:', error);
      // If unauthorized, redirect to login
      if (error instanceof Error && error.message.includes('401')) {
        handleLogout();
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch notification count (placeholder)
  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      // This is a placeholder - implement actual notification endpoint
      // For now, we'll set a mock count
      onNavigate
      setNotificationCount(2); // Mock data
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Navigate to search results page or filter current view
      console.log('Searching for:', searchQuery);
      // Implement actual search logic here
    }
  };

  const handleProfileClick = () => {
    setShowUserMenu(false);
    navigate('/profile');
  };

  const handleSettingsClick = () => {
    setShowUserMenu(false);
    navigate('/settings');
  };

  const handleNotificationsClick = () => {
    setShowUserMenu(false);
    navigate('/notifications');
  };

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      // Default logout behavior
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('rememberMe');
      localStorage.removeItem('savedEmail');
      window.location.href = '/';
    }
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user?.full_name) return 'U';
    return user.full_name
      .split(' ')
      .map(name => name[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Map role to display title
  const getRoleTitle = (role: string | undefined) => {
    if (!role) return 'User';
    
    const roleMap: Record<string, string> = {
      'admin': 'Administrator',
      'associate': 'Associate',
      'client': 'Client'
    };
    
    return roleMap[role] || role.charAt(0).toUpperCase() + role.slice(1);
  };

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading) {
    return (
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="flex items-center justify-between px-6 h-16">
          <div className="flex items-center gap-4">
            <div className="h-8 w-48 bg-muted rounded-lg animate-pulse"></div>
          </div>
          <div className="flex items-center gap-4">
            <div className="h-8 w-24 bg-muted rounded-lg animate-pulse"></div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="bg-card border-b border-border sticky top-0 z-10">
      <div className="flex items-center justify-between px-6 h-16">
        <div className="flex-1 max-w-xl">
          <form onSubmit={handleSearch}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search cases, clients, documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
              />
              {searchQuery && (
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-primary hover:text-primary/80"
                >
                  Search
                </button>
              )}
            </div>
          </form>
        </div>
        
        <div className="flex items-center gap-4 ml-6">
          <div className="hidden md:block text-sm text-muted-foreground">
            {getGreeting()}, {user?.full_name?.split(' ')[0] || 'User'}
          </div>
          
          <button 
            onClick={handleNotificationsClick}
            className="relative p-2 text-foreground hover:bg-muted rounded-lg transition-colors"
          >
            <Bell className="w-5 h-5" />
            {notificationCount > 0 && (
              <span className="absolute top-1 right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
                {notificationCount > 9 ? '9+' : notificationCount}
              </span>
            )}
          </button>
          
          <div className="relative pl-4 border-l border-border" ref={menuRef}>
            <button 
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-3 hover:bg-muted rounded-lg px-2 py-1 transition-colors"
              disabled={!user}
            >
              <div className="text-right hidden md:block">
                <div className="text-sm font-medium text-foreground truncate max-w-[120px]">
                  {user?.full_name || 'Loading...'}
                </div>
                <div className="text-xs text-muted-foreground">
                  {getRoleTitle(user?.role)}
                </div>
              </div>
              <div className="w-9 h-9 bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-600 text-white rounded-full flex items-center justify-center font-medium">
                {getUserInitials()}
              </div>
              <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
            </button>

            {showUserMenu && user && (
              <div className="absolute right-0 mt-2 w-56 bg-card border border-border rounded-lg shadow-lg overflow-hidden z-50">
                <div className="px-4 py-3 border-b border-border">
                  <p className="text-sm font-medium text-foreground truncate">
                    {user.full_name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user.email}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {getRoleTitle(user.role)}
                  </p>
                </div>
                <div className="py-1">
                  <button
                    onClick={handleProfileClick}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                  >
                    <User className="w-4 h-4" />
                    My Profile
                  </button>
                  <button
                    onClick={handleSettingsClick}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                  >
                    <SettingsIcon className="w-4 h-4" />
                    Settings
                  </button>
                </div>
                <div className="border-t border-border py-1">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Log Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}