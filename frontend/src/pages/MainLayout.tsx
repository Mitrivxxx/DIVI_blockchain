import React, { useState } from 'react';
import type { TabKey } from '../components/tabs';
import Sidebar from '../components/Sidebar';
import Dashboard from '../components/Dashboard';
import Upload from '../components/Upload';
import MyDocuments from '../components/MyDocuments';
import Verify from '../components/Verify';
import Profile from '../components/Profile';
import Help from '../components/Help';
import IssuerRole from '../components/IssuerRole';

const MainLayout: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');

  const renderContent = () => {
    switch(activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'issuerRole': return <IssuerRole />;
      case 'upload': return <Upload />;
      case 'myDocuments': return <MyDocuments />;
      case 'verify': return <Verify />;
      case 'profile': return <Profile />;
      case 'help': return <Help />;
      default: return <Dashboard />;
    }
  };

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div style={{ flex: 1, padding: '20px', background: '#fff', minHeight: '100vh' }}>
        {renderContent()}
      </div>
    </div>
  );
};

export default MainLayout;
