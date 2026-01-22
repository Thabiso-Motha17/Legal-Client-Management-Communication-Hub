import { 
  LayoutDashboard, 
  Settings, 
  Users,
  LogOut
} from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';

const useToast = () => {
   const toast = (options: { title: string, description: string, variant?: string }) => {
     if (options.variant === 'destructive') {
       alert(`Error: ${options.title}\n${options.description}`);
     } else {
       alert(`Success: ${options.title}\n${options.description}`);
     }
   };
   return { toast };
 };

interface SidebarProps {
  onLogout?: () => void;
}

const navigation = [
  { 
    id: 'dashboard', 
    label: 'Dashboard', 
    icon: LayoutDashboard, 
    path: '/admin/dashboard' 
  },
  { 
    id: 'users', 
    label: 'Manage Users', 
    icon: Users, 
    path: '/admin/users' 
  },
  { 
    id: 'companies', 
    label: 'Manage Firms', 
    icon: Settings, 
    path: '/admin/companies' 
  },
];

export function Sidebar({ onLogout }: SidebarProps) {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = () => {
    // Clear authentication data
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Show logout message
    toast({
      title: 'Logged out',
      description: 'You have been successfully logged out.',
    });
    
    // Call onLogout prop if provided
    if (onLogout) {
      onLogout();
    } else {
      // Navigate to welcome page
      navigate('/');
    }
  };

  const handleProfile = () => {
    navigate('/profile');
  };

  const getCurrentUser = () => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (error) {
        return null;
      }
    }
    return null;
  };

  const user = getCurrentUser();

  return (
    <aside className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <h1 className="text-xl font-bold tracking-tight bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-600 bg-clip-text text-transparent">
          Stand Firm
        </h1>
        <p className="text-stone-500 text-xs mt-1">Law Firm Management</p>
      </div>
      
      {/* User Profile */}
      {user && (
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-600 flex items-center justify-center text-sm font-medium text-white">
              {user.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {user.full_name}
              </p>
              <p className="text-xs text-stone-500 truncate">
                {user.role === 'admin' ? 'Administrator' : 
                 user.role === 'associate' ? 'Associate' : 'Client'}
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const Icon = item.icon;
          
          return (
            <NavLink
              key={item.id}
              to={item.path}
              end={item.path === '/admin/dashboard'}
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2.5 rounded-md transition-all text-sm font-medium
                ${isActive 
                  ? 'bg-gradient-to-br from-yellow-300 via-amber-400 to-amber-600 text-white shadow-md' 
                  : 'text-stone-700 hover:bg-amber-50 hover:text-amber-600'
                }
              `}
            >
              <Icon className={`w-5 h-5 flex-shrink-0`} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      
      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="text-xs text-stone-500 text-center">
          © 2026 Stand Firm
        </div>
        <div className="text-xs text-stone-400 text-center mt-1">
          v3.2.1
        </div>
      </div>
    </aside>
  );
}