import React, { useState, useEffect, useCallback } from 'react';
import io from 'socket.io-client';

// Types
interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isEmailVerified: boolean;
  preferences: {
    defaultCurrency: string;
    emailNotifications: boolean;
    pushNotifications: boolean;
    theme: string;
  };
}

interface CryptoPrice {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h: number;
  market_cap: number;
  total_volume: number;
  image?: string;
}

interface Alert {
  _id: string;
  symbol: string;
  condition: 'above' | 'below' | 'percent_increase' | 'percent_decrease';
  targetPrice?: number;
  percentageChange?: number;
  isActive: boolean;
  createdAt: string;
}

// API Service
class ApiService {
  private baseURL = 'http://localhost:3001/api';
  private token: string | null = localStorage.getItem('token');

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, { ...options, headers });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Request failed');
    }

    return data;
  }

  // Auth endpoints
  async register(userData: any) {
    const data = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    this.token = data.token;
    localStorage.setItem('token', data.token);
    return data;
  }

  async login(credentials: any) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    this.token = data.token;
    localStorage.setItem('token', data.token);
    return data;
  }

  async logout() {
    await this.request('/auth/logout', { method: 'POST' });
    this.token = null;
    localStorage.removeItem('token');
  }

  async getMe() {
    return this.request('/auth/me');
  }

  // Price endpoints
  async getPrices() {
    return this.request('/prices');
  }

  // Alert endpoints
  async getAlerts() {
    return this.request('/alerts');
  }

  async createAlert(alertData: any) {
    return this.request('/alerts', {
      method: 'POST',
      body: JSON.stringify(alertData),
    });
  }

  async updateAlert(id: string, alertData: any) {
    return this.request(`/alerts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(alertData),
    });
  }

  async deleteAlert(id: string) {
    return this.request(`/alerts/${id}`, { method: 'DELETE' });
  }

  async getAlertStats() {
    return this.request('/alerts/stats');
  }
}

const api = new ApiService();

const App: React.FC = () => {
  // State
  const [user, setUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState<'login' | 'register' | 'dashboard' | 'alerts' | 'profile'>('login');
  const [prices, setPrices] = useState<CryptoPrice[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [alertStats, setAlertStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [socket, setSocket] = useState<any>(null);

  // Form states
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    confirmPassword: ''
  });

  // Alert form
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertForm, setAlertForm] = useState({
    symbol: '',
    condition: 'above' as 'above' | 'below' | 'percent_increase' | 'percent_decrease',
    targetPrice: '',
    percentageChange: ''
  });

  // Check if user is logged in on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Initialize WebSocket connection
  useEffect(() => {
    if (user) {
      const socketConnection = io('http://localhost:3001');
      setSocket(socketConnection);

      socketConnection.on('connect', () => {
        setIsConnected(true);
        showMessage('Connected to real-time updates', 'success');
      });

      socketConnection.on('disconnect', () => {
        setIsConnected(false);
        showMessage('Disconnected from real-time updates', 'error');
      });

      socketConnection.on('price-update', (data: CryptoPrice[]) => {
        setPrices(data);
      });

      socketConnection.on('alert-triggered', (alert: any) => {
        showMessage(`Alert triggered: ${alert.symbol} - $${alert.currentPrice}`, 'success');
      });

      return () => {
        socketConnection.close();
      };
    }
  }, [user]);

  // Load data when user logs in
  useEffect(() => {
    if (user && currentPage === 'dashboard') {
      loadDashboardData();
    }
  }, [user, currentPage]);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const response = await api.getMe();
        setUser(response.data);
        setCurrentPage('dashboard');
      }
    } catch (error) {
      localStorage.removeItem('token');
    }
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [pricesResponse, alertsResponse, statsResponse] = await Promise.all([
        api.getPrices(),
        api.getAlerts(),
        api.getAlertStats()
      ]);

      setPrices(pricesResponse.data || []);
      setAlerts(alertsResponse.data || []);
      setAlertStats(statsResponse.data || {});
    } catch (error) {
      showMessage('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    setMessage(`${type.toUpperCase()}: ${text}`);
    setTimeout(() => setMessage(''), 5000);
  };

  const handleAuth = async (isRegister: boolean) => {
    try {
      setLoading(true);
      
      if (isRegister) {
        if (formData.password !== formData.confirmPassword) {
          throw new Error('Passwords do not match');
        }
        const response = await api.register({
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName
        });
        setUser(response.data.user);
        showMessage('Account created successfully!', 'success');
      } else {
        const response = await api.login({
          email: formData.email,
          password: formData.password
        });
        setUser(response.data.user);
        showMessage('Welcome back!', 'success');
      }
      
      setCurrentPage('dashboard');
      setFormData({ email: '', password: '', firstName: '', lastName: '', confirmPassword: '' });
    } catch (error: any) {
      showMessage(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await api.logout();
      setUser(null);
      setCurrentPage('login');
      setPrices([]);
      setAlerts([]);
      if (socket) socket.close();
      showMessage('Logged out successfully', 'success');
    } catch (error: any) {
      showMessage(error.message, 'error');
    }
  };

  const handleCreateAlert = async () => {
    try {
      const alertData: any = {
        symbol: alertForm.symbol.toUpperCase(),
        condition: alertForm.condition,
        isActive: true
      };

      if (alertForm.condition === 'above' || alertForm.condition === 'below') {
        alertData.targetPrice = parseFloat(alertForm.targetPrice);
      } else {
        alertData.percentageChange = parseFloat(alertForm.percentageChange);
      }

      await api.createAlert(alertData);
      showMessage('Alert created successfully!', 'success');
      setShowAlertModal(false);
      setAlertForm({ symbol: '', condition: 'above', targetPrice: '', percentageChange: '' });
      
      if (currentPage === 'alerts') {
        loadAlertsData();
      }
    } catch (error: any) {
      showMessage(error.message, 'error');
    }
  };

  const loadAlertsData = async () => {
    try {
      setLoading(true);
      const [alertsResponse, statsResponse] = await Promise.all([
        api.getAlerts(),
        api.getAlertStats()
      ]);
      setAlerts(alertsResponse.data || []);
      setAlertStats(statsResponse.data || {});
    } catch (error: any) {
      showMessage('Failed to load alerts', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAlert = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this alert?')) {
      try {
        await api.deleteAlert(id);
        showMessage('Alert deleted successfully', 'success');
        loadAlertsData();
      } catch (error: any) {
        showMessage(error.message, 'error');
      }
    }
  };

  const handleToggleAlert = async (alert: Alert) => {
    try {
      await api.updateAlert(alert._id, { isActive: !alert.isActive });
      showMessage(`Alert ${alert.isActive ? 'deactivated' : 'activated'}`, 'success');
      loadAlertsData();
    } catch (error: any) {
      showMessage(error.message, 'error');
    }
  };

  // Render functions
  const renderAuthForm = (isRegister: boolean) => (
    <div className="auth-container">
      <div className="auth-form">
        <h1>{isRegister ? 'Create Account' : 'Sign In'}</h1>
        
        {isRegister && (
          <>
            <input
              type="text"
              placeholder="First Name"
              value={formData.firstName}
              onChange={(e) => setFormData({...formData, firstName: e.target.value})}
              className="form-input"
            />
            <input
              type="text"
              placeholder="Last Name"
              value={formData.lastName}
              onChange={(e) => setFormData({...formData, lastName: e.target.value})}
              className="form-input"
            />
          </>
        )}
        
        <input
          type="email"
          placeholder="Email"
          value={formData.email}
          onChange={(e) => setFormData({...formData, email: e.target.value})}
          className="form-input"
        />
        
        <input
          type="password"
          placeholder="Password"
          value={formData.password}
          onChange={(e) => setFormData({...formData, password: e.target.value})}
          className="form-input"
        />
        
        {isRegister && (
          <input
            type="password"
            placeholder="Confirm Password"
            value={formData.confirmPassword}
            onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
            className="form-input"
          />
        )}
        
        <button 
          onClick={() => handleAuth(isRegister)}
          disabled={loading}
          className="btn btn-primary btn-full"
        >
          {loading ? 'Please wait...' : (isRegister ? 'Create Account' : 'Sign In')}
        </button>
        
        <div className="auth-switch">
          {isRegister ? 'Already have an account?' : "Don't have an account?"}
          <button 
            onClick={() => setCurrentPage(isRegister ? 'login' : 'register')}
            className="link-btn"
          >
            {isRegister ? 'Sign In' : 'Sign Up'}
          </button>
        </div>
      </div>
    </div>
  );

  const renderNavigation = () => (
    <div className="navigation">
      <div className="nav-brand">
        <h2>Crypto Monitor</h2>
        <div className="connection-status">
          <div className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`}></div>
          <span>{isConnected ? 'Live' : 'Offline'}</span>
        </div>
      </div>
      
      <div className="nav-links">
        <button 
          onClick={() => setCurrentPage('dashboard')}
          className={`nav-btn ${currentPage === 'dashboard' ? 'active' : ''}`}
        >
          Dashboard
        </button>
        <button 
          onClick={() => {
            setCurrentPage('alerts');
            loadAlertsData();
          }}
          className={`nav-btn ${currentPage === 'alerts' ? 'active' : ''}`}
        >
          Alerts ({alerts.length})
        </button>
        <button 
          onClick={() => setCurrentPage('profile')}
          className={`nav-btn ${currentPage === 'profile' ? 'active' : ''}`}
        >
          Profile
        </button>
        <button onClick={handleLogout} className="nav-btn logout">
          Logout
        </button>
      </div>
    </div>
  );

  const renderDashboard = () => (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Welcome, {user?.firstName}!</h1>
        <button onClick={loadDashboardData} disabled={loading} className="btn btn-primary">
          {loading ? 'Loading...' : 'Refresh Data'}
        </button>
      </div>

      {!user?.isEmailVerified && (
        <div className="alert alert-warning">
          Your email is not verified. Please check your email and verify your account to receive alert notifications.
        </div>
      )}

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Cryptocurrencies</h3>
          <div className="stat-value">{prices.length}</div>
        </div>
        <div className="stat-card">
          <h3>Active Alerts</h3>
          <div className="stat-value">{alertStats?.activeAlerts || 0}</div>
        </div>
        <div className="stat-card">
          <h3>Top Gainer</h3>
          <div className="stat-value">
            {prices.length > 0 && 
              prices.reduce((max, p) => p.price_change_percentage_24h > max.price_change_percentage_24h ? p : max)?.symbol.toUpperCase()
            }
          </div>
        </div>
        <div className="stat-card">
          <h3>Connection Status</h3>
          <div className="stat-value">{isConnected ? 'Live' : 'Offline'}</div>
        </div>
      </div>

      {/* Prices */}
      <div className="section">
        <h2>Live Cryptocurrency Prices</h2>
        <div className="prices-grid">
          {prices.map((price) => (
            <div key={price.id} className="price-card">
              <div className="price-header">
                <div className="coin-icon">{price.symbol.toUpperCase()}</div>
                <div>
                  <div className="coin-name">{price.name}</div>
                  <div className="coin-price">${price.current_price.toLocaleString()}</div>
                </div>
                <div className={`price-change ${price.price_change_percentage_24h >= 0 ? 'positive' : 'negative'}`}>
                  {price.price_change_percentage_24h >= 0 ? '+' : ''}{price.price_change_percentage_24h.toFixed(2)}%
                </div>
              </div>
              <div className="price-stats">
                <div>
                  <span>Market Cap</span>
                  <span>${(price.market_cap / 1e9).toFixed(2)}B</span>
                </div>
                <div>
                  <span>Volume</span>
                  <span>${(price.total_volume / 1e6).toFixed(2)}M</span>
                </div>
              </div>
              <button 
                onClick={() => {
                  setAlertForm({...alertForm, symbol: price.symbol.toUpperCase()});
                  setShowAlertModal(true);
                }}
                className="btn btn-primary btn-small"
              >
                Create Alert
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderAlerts = () => (
    <div className="alerts-page">
      <div className="page-header">
        <h1>Price Alerts</h1>
        <button onClick={() => setShowAlertModal(true)} className="btn btn-primary">
          Create Alert
        </button>
      </div>

      {alertStats && (
        <div className="stats-row">
          <div className="stat-item">Total: {alertStats.totalAlerts}</div>
          <div className="stat-item">Active: {alertStats.activeAlerts}</div>
        </div>
      )}

      <div className="alerts-list">
        {alerts.length === 0 ? (
          <div className="empty-state">
            <p>No alerts created yet</p>
            <button onClick={() => setShowAlertModal(true)} className="btn btn-primary">
              Create Your First Alert
            </button>
          </div>
        ) : (
          alerts.map((alert) => (
            <div key={alert._id} className="alert-item">
              <div className="alert-info">
                <h3>{alert.symbol}</h3>
                <p>
                  {alert.condition === 'above' && `Price goes above $${alert.targetPrice}`}
                  {alert.condition === 'below' && `Price goes below $${alert.targetPrice}`}
                  {alert.condition === 'percent_increase' && `Increases by ${alert.percentageChange}%`}
                  {alert.condition === 'percent_decrease' && `Decreases by ${alert.percentageChange}%`}
                </p>
                <small>Created: {new Date(alert.createdAt).toLocaleDateString()}</small>
              </div>
              <div className="alert-actions">
                <span className={`alert-status ${alert.isActive ? 'active' : 'inactive'}`}>
                  {alert.isActive ? 'Active' : 'Inactive'}
                </span>
                <button 
                  onClick={() => handleToggleAlert(alert)}
                  className="btn btn-secondary btn-small"
                >
                  {alert.isActive ? 'Deactivate' : 'Activate'}
                </button>
                <button 
                  onClick={() => handleDeleteAlert(alert._id)}
                  className="btn btn-danger btn-small"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderProfile = () => (
    <div className="profile-page">
      <h1>Profile Settings</h1>
      <div className="profile-info">
        <div className="info-row">
          <strong>Name:</strong> {user?.firstName} {user?.lastName}
        </div>
        <div className="info-row">
          <strong>Email:</strong> {user?.email}
        </div>
        <div className="info-row">
          <strong>Email Verified:</strong> 
          <span className={user?.isEmailVerified ? 'verified' : 'unverified'}>
            {user?.isEmailVerified ? 'Yes' : 'No'}
          </span>
        </div>
        <div className="info-row">
          <strong>Email Notifications:</strong> 
          {user?.preferences.emailNotifications ? 'Enabled' : 'Disabled'}
        </div>
        <div className="info-row">
          <strong>Theme:</strong> {user?.preferences.theme}
        </div>
      </div>
    </div>
  );

  const renderAlertModal = () => (
    <div className="modal-overlay" onClick={() => setShowAlertModal(false)}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Create Price Alert</h3>
          <button onClick={() => setShowAlertModal(false)} className="modal-close">×</button>
        </div>
        <div className="modal-body">
          <input
            type="text"
            placeholder="Symbol (e.g., BTC)"
            value={alertForm.symbol}
            onChange={(e) => setAlertForm({...alertForm, symbol: e.target.value})}
            className="form-input"
          />
          
          <select
            value={alertForm.condition}
            onChange={(e) => setAlertForm({...alertForm, condition: e.target.value as any})}
            className="form-input"
          >
            <option value="above">Price goes above</option>
            <option value="below">Price goes below</option>
            <option value="percent_increase">Percentage increase</option>
            <option value="percent_decrease">Percentage decrease</option>
          </select>
          
          {(alertForm.condition === 'above' || alertForm.condition === 'below') && (
            <input
              type="number"
              placeholder="Target Price ($)"
              value={alertForm.targetPrice}
              onChange={(e) => setAlertForm({...alertForm, targetPrice: e.target.value})}
              className="form-input"
            />
          )}
          
          {(alertForm.condition === 'percent_increase' || alertForm.condition === 'percent_decrease') && (
            <input
              type="number"
              placeholder="Percentage (%)"
              value={alertForm.percentageChange}
              onChange={(e) => setAlertForm({...alertForm, percentageChange: e.target.value})}
              className="form-input"
            />
          )}
          
          <div className="modal-actions">
            <button onClick={() => setShowAlertModal(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button onClick={handleCreateAlert} className="btn btn-primary">
              Create Alert
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Main render
  return (
    <div className="app">
      {/* Toast messages */}
      {message && (
        <div className="toast" onClick={() => setMessage('')}>
          {message} ×
        </div>
      )}

      {/* Auth pages */}
      {!user && currentPage === 'login' && renderAuthForm(false)}
      {!user && currentPage === 'register' && renderAuthForm(true)}

      {/* Dashboard */}
      {user && (
        <>
          {renderNavigation()}
          <div className="main-content">
            {currentPage === 'dashboard' && renderDashboard()}
            {currentPage === 'alerts' && renderAlerts()}
            {currentPage === 'profile' && renderProfile()}
          </div>
        </>
      )}

      {/* Modals */}
      {showAlertModal && renderAlertModal()}
    </div>
  );
};

export default App;