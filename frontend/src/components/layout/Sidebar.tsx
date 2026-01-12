import { 
  LayoutDashboard, 
  Briefcase, 
  Users, 
  MessageSquare, 
  FileText, 
  Calendar, 
  CreditCard, 
  BarChart3, 
  Settings 
} from 'lucide-react';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

const navigation = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'cases', label: 'Cases', icon: Briefcase },
  { id: 'clients', label: 'Clients', icon: Users },
  { id: 'messages', label: 'Messages', icon: MessageSquare },
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'calendar', label: 'Calendar', icon: Calendar },
  { id: 'billing', label: 'Billing & Payments', icon: CreditCard },
  { id: 'reports', label: 'Reports', icon: BarChart3 },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  return (
    <aside className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <h1 className="text-amber-500 text-xl font-bold tracking-tight bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-600 bg-clip-text text-transparent">
          Dolamo Attorneys
        </h1>
        <p className="text-stone-500 text-xs mt-1">Law Firm Management</p>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-all
                ${isActive 
                  ? 'bg-gradient-to-br from-yellow-300 via-amber-400 to-amber-600 text-white shadow-md' 
                  : 'text-stone-700 hover:bg-amber-50 hover:text-amber-600'
                }
              `}
            >
              <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-amber-500'}`} />
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>
      
      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="text-xs text-stone-500">
          © 2026 LegalHub
        </div>
      </div>
    </aside>
  );
}
