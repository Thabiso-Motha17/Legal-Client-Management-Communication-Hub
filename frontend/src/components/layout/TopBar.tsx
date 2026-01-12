import { Search, Bell, User, ChevronDown, LogOut, Settings as SettingsIcon } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface TopBarProps {
  onNavigate?: (page: string) => void;
  onLogout?: () => void;
}

export function TopBar({ onNavigate, onLogout }: TopBarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleProfileClick = () => {
    setShowUserMenu(false);
    onNavigate?.('profile');
  };

  const handleSettingsClick = () => {
    setShowUserMenu(false);
    onNavigate?.('settings');
  };

  const handleLogoutClick = () => {
    setShowUserMenu(false);
    onLogout?.();
  };

  return (
    <header className="bg-card border-b border-border sticky top-0 z-10">
      <div className="flex items-center justify-between px-6 h-16">
        <div className="flex-1 max-w-xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search cases, clients, documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-4 ml-6">
          <button className="relative p-2 text-foreground hover:bg-muted rounded-lg transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full"></span>
          </button>
          
          <div className="relative pl-4 border-l border-border" ref={menuRef}>
            <button 
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-3 hover:bg-muted rounded-lg px-2 py-1 transition-colors"
            >
              <div className="text-right">
                <div className="text-sm font-medium text-foreground">Sarah Mitchell</div>
                <div className="text-xs text-muted-foreground">Senior Partner</div>
              </div>
              <div className="w-9 h-9 bg-primary text-primary-foreground rounded-full flex items-center justify-center">
                <User className="w-5 h-5" />
              </div>
              <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-card border border-border rounded-lg shadow-lg overflow-hidden">
                <div className="px-4 py-3 border-b border-border">
                  <p className="text-sm font-medium text-foreground">Sarah Mitchell</p>
                  <p className="text-xs text-muted-foreground">sarah.mitchell@lawfirm.com</p>
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
                    onClick={handleLogoutClick}
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