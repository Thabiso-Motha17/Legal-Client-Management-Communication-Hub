import { useState } from 'react';
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
import { AssociateMessages } from './AttorneyMessages';
import { FaMoneyBillAlt } from 'react-icons/fa';
import { Billing } from './AttorneyBilling';
import { AttorneySettings } from '../attorney/AttorneySettings';

interface AssociateLayoutProps {
  onLogout: () => void;
}

export function AssociateLayout({ onLogout }: AssociateLayoutProps) {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const navigation = [
    { id: 'dashboard', name: 'Dashboard', icon: Home },
    { id: 'cases', name: 'My Cases', icon: Briefcase },
    { id: 'documents', name: 'Documents', icon: FileText },
    { id: 'clients', name: 'Clients', icon: Users },
    { id: 'notes', name: 'Notes', icon: CheckCircle },
    { id: 'billing', name: 'Billing', icon: FaMoneyBillAlt },
    { id: 'settings', name: 'Settings', icon: Settings}
  ];

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <AssociateDashboard onNavigate={setCurrentPage} />;
      case 'cases':
        return <AssociateCases />;
      case 'clients':
        return <AssociateClients />;
      case 'notes':
        return <AssociateNotes />;
      case 'billing':
        return <Billing />;
      case 'documents':
        return <AssociateDocuments />;
      case 'messages':
        return <AssociateMessages/>;
      case 'settings':
        return <AttorneySettings />;
      default:
        return <AssociateDashboard onNavigate={setCurrentPage} />;
    }
  };

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
                    Stand Firm
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
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* User */}
          <div className="p-4 border-t border-stone-200">
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-stone-100 transition"
              >
                <div className="w-10 h-10 rounded-full bg-amber-500 text-white flex items-center justify-center text-sm font-semibold">
                  AR
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-stone-800">
                    Alex Rodriguez
                  </p>
                  <p className="text-xs text-stone-500">
                    Associate Attorney
                  </p>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-stone-500 transition-transform ${
                    showUserMenu ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {showUserMenu && (
                <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-stone-200 rounded-lg shadow-lg overflow-hidden">
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      onLogout();
                    }}
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
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto bg-stone-50">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}
