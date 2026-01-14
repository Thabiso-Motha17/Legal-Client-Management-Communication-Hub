import { useState } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { TopBar } from './components/layout/TopBar';
import { Welcome } from './components/pages/Welcome';
import { Login } from './components/pages/Login';
import { ClientLayout } from './components/client/ClientLayout';
import { Dashboard } from './components/pages/Dashboard';
import { Cases } from './components/pages/Cases';
import { Clients } from './components/pages/Clients';
import { Documents } from './components/pages/Documents';
import { Billing } from './components/pages/Billing';
import { Settings } from './components/pages/Settings';
import { Profile } from './components/pages/Profile';
import { AssociateLayout } from './components/attorney/AttorneyLayout';

type AppView = 'welcome' | 'login' | 'attorney-app' | 'client-app' | 'associate-app';

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

  const handleAssociateLogout = () => {
    setCurrentView('welcome');
  };

  const handleLogin = (role: 'client' | 'associate' | 'admin') => {
    // Map the login role to the appropriate app view
    switch (role) {
      case 'admin':
        setCurrentView('attorney-app');
        break;
      case 'associate':
        setCurrentView('associate-app');
        break;
      case 'client':
        setCurrentView('client-app');
        break;
    }
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'cases':
        return <Cases />;
      case 'clients':
        return <Clients />;
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
        onGetStarted={() => setCurrentView('login')}
      />
    );
  }

  // Show unified login page
  if (currentView === 'login') {
    return (
      <Login 
        onLogin={handleLogin} 
        onBackToWelcome={() => setCurrentView('welcome')}
      />
    );
  }

  // Show client portal
  if (currentView === 'client-app') {
    return <ClientLayout onLogout={handleClientLogout} />;
  }

  // Show associate portal
  if (currentView === 'associate-app') {
    return <AssociateLayout onLogout={handleAssociateLogout} />;
  }

  // Show attorney portal (admin)
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