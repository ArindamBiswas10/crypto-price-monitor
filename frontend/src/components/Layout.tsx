
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useWebSocket } from '../contexts/WebSocketContext';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const { isConnected } = useWebSocket();
  const location = useLocation();
  const navigate = useNavigate();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: '📊' },
    { name: 'Prices', href: '/prices', icon: '💰' },
    { name: 'Alerts', href: '/alerts', icon: '🔔' },
    { name: 'Profile', href: '/profile', icon: '👤' },
    { name: 'Settings', href: '/settings', icon: '⚙️' },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="app">
      {/* Desktop sidebar */}
      <div className="sidebar">
        <div className="sidebar-header">
          <h1 className="sidebar-title">Crypto Monitor</h1>
        </div>
        <nav className="sidebar-nav">
          {navigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={`nav-item ${location.pathname === item.href ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.name}
            </Link>
          ))}
        </nav>
      </div>

      {/* Main content */}
      <div className="main-content">
        {/* Top bar */}
        <div className="top-bar">
          <div className="connection-status">
            <div className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`} />
            <span className="status-text">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          <div className="user-info">
            <span className="user-name">
              {user?.firstName} {user?.lastName}
            </span>
            <button
              onClick={handleLogout}
              className="btn btn-secondary btn-sm"
              title="Logout"
            >
              🚪
            </button>
          </div>
        </div>

        <main className="main-section">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;