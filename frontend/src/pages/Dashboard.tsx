
import React, { useState, useEffect } from 'react';
import { useWebSocket } from '../contexts/WebSocketContext';
import { useAuth } from '../contexts/AuthContext';
import { alertAPI } from '../services/api';
import { Alert, AlertStats } from '../types';
import PriceCard from '../components/PriceCard';
import AlertModal from '../components/AlertModal';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { prices, isConnected } = useWebSocket();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [alertStats, setAlertStats] = useState<AlertStats | null>(null);
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [selectedSymbol, setSelectedSymbol] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [alertsResponse, statsResponse] = await Promise.all([
        alertAPI.getUserAlerts(),
        alertAPI.getAlertStats(),
      ]);
      
      setAlerts(alertsResponse.data.data || []);
      setAlertStats(statsResponse.data.data || null);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAlert = (symbol: string) => {
    setSelectedSymbol(symbol);
    setIsAlertModalOpen(true);
  };

  const handleAlertSubmit = async (alertData: any) => {
    try {
      await alertAPI.createAlert({ ...alertData, isActive: true });
      toast.success('Alert created successfully');
      fetchData();
    } catch (error) {
      toast.error('Failed to create alert');
    }
  };

  const topGainers = prices.slice().sort((a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h).slice(0, 3);
  const topLosers = prices.slice().sort((a, b) => a.price_change_percentage_24h - b.price_change_percentage_24h).slice(0, 3);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div>
      {/* Header */}
      <div className="card">
        <div className="card-header">
          <h1 className="card-title">Welcome back, {user?.firstName}!</h1>
          <p className="card-subtitle">Monitor your cryptocurrency portfolio and alerts</p>
        </div>
      </div>

      {/* Email verification warning */}
      {!user?.isEmailVerified && (
        <div className="alert alert-warning">
          <h3 className="font-semibold">Email Verification Required</h3>
          <p>Please verify your email address to receive alert notifications.</p>
        </div>
      )}

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-content">
            <div className="stat-icon">📊</div>
            <div className="stat-info">
              <h3>Total Cryptocurrencies</h3>
              <p>{prices.length}</p>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-content">
            <div className="stat-icon">🔔</div>
            <div className="stat-info">
              <h3>Active Alerts</h3>
              <p>{alertStats?.activeAlerts || 0}</p>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-content">
            <div className="stat-icon">📈</div>
            <div className="stat-info">
              <h3>Top Gainer</h3>
              <p>{topGainers[0]?.symbol.toUpperCase() || 'N/A'}</p>
              <div className="stat-change positive">
                +{topGainers[0]?.price_change_percentage_24h.toFixed(2) || '0.00'}%
              </div>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-content">
            <div className="stat-icon">📉</div>
            <div className="stat-info">
              <h3>Top Loser</h3>
              <p>{topLosers[0]?.symbol.toUpperCase() || 'N/A'}</p>
              <div className="stat-change negative">
                {topLosers[0]?.price_change_percentage_24h.toFixed(2) || '0.00'}%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Price Grid */}
      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 className="card-title">Live Prices</h2>
            <div className="connection-status">
              <div className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`} />
              <span className="status-text">
                {isConnected ? 'Live' : 'Disconnected'}
              </span>
            </div>
          </div>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-4">
            {prices.slice(0, 8).map((price) => (
              <PriceCard
                key={price.id}
                price={price}
                onCreateAlert={handleCreateAlert}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Recent Alerts */}
      {alerts.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Recent Alerts</h2>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {alerts.slice(0, 5).map((alert) => (
                <div key={alert._id} className="p-4 rounded-lg" style={{ border: '1px solid #e5e7eb' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p className="font-semibold">
                        {alert.symbol} {alert.condition.replace('_', ' ')}
                        {alert.targetPrice && ` $${alert.targetPrice}`}
                        {alert.percentageChange && ` ${alert.percentageChange}%`}
                      </p>
                      <p className="text-sm" style={{ color: '#6b7280' }}>
                        Created {new Date(alert.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-semibold rounded ${
                      alert.isActive 
                        ? 'alert-success'
                        : 'alert-error'
                    }`}>
                      {alert.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Alert Modal */}
      <AlertModal
        isOpen={isAlertModalOpen}
        onClose={() => setIsAlertModalOpen(false)}
        onSubmit={handleAlertSubmit}
        initialSymbol={selectedSymbol}
      />
    </div>
  );
};

export default Dashboard;