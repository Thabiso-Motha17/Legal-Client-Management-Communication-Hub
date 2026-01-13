import { useState } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { TopBar } from './components/layout/TopBar';
import { Welcome } from './components/pages/Welcome';
import { Login } from './components/pages/Login';
import { ClientLogin } from './components/client/ClientLogin';
import { ClientLayout } from './components/client/ClientLayout';
import { Dashboard } from './components/pages/Dashboard';
import { Cases } from './components/pages/Cases';
import { Clients } from './components/pages/Clients';
import { Messages } from './components/pages/Messages';
import { Documents } from './components/pages/Documents';
import { Billing } from './components/pages/Billing';
import { Settings } from './components/pages/Settings';
import { Profile } from './components/pages/Profile';

type AppView = 'welcome' | 'attorney-login' | 'client-login' | 'attorney-app' | 'client-app';

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>('welcome');
  const [currentPage, setCurrentPage] = useState('dashboard');

  const handleAttorneyLogout = () => {
    setCurrentView('welcome');
    setCurrentPage('dashboard');
  };

  const handleClientLogout = () => {
    setCurrentView('welcome');
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'cases':
        return <Cases />;
      case 'clients':
        return <Clients />;
      case 'messages':
        return <Messages />;
      case 'documents':
        return <Documents />;
      case 'billing':
        return <Billing />;
      case 'settings':
        return <Settings />;
      case 'profile':
        return <Profile />;
      default:
        return <Dashboard />;
    }
  };

  // Show welcome page
  if (currentView === 'welcome') {
    return (
      <Welcome 
        onGetStarted={() => setCurrentView('attorney-login')}
        onClientPortal={() => setCurrentView('client-login')}
      />
    );
  }

  // Show attorney login page
  if (currentView === 'attorney-login') {
    return (
      <Login 
        onLogin={() => setCurrentView('attorney-app')} 
        onBackToWelcome={() => setCurrentView('welcome')}
      />
    );
  }

  // Show client login page
  if (currentView === 'client-login') {
    return (
      <ClientLogin 
        onLogin={() => setCurrentView('client-app')} 
        onBackToWelcome={() => setCurrentView('welcome')}
      />
    );
  }

  // Show client portal
  if (currentView === 'client-app') {
    return <ClientLayout onLogout={handleClientLogout} />;
  }

  // Show attorney application
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar onNavigate={setCurrentPage} onLogout={handleAttorneyLogout} />
        <main className="flex-1 overflow-y-auto">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}