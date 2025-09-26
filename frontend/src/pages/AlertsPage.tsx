import React, { useState, useEffect } from 'react';
import { alertAPI } from '../services/api';
import { Alert } from '../types';
import AlertModal from '../components/AlertModal';
import LoadingSpinner from '../components/LoadingSpinner';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import clsx from 'clsx';

const AlertsPage: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [editingAlert, setEditingAlert] = useState<Alert | undefined>();

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      setIsLoading(true);
      const response = await alertAPI.getUserAlerts();
      setAlerts(response.data.data || []);
    } catch (error) {
      toast.error('Failed to load alerts');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAlert = () => {
    setEditingAlert(undefined);
    setIsAlertModalOpen(true);
  };

  const handleEditAlert = (alert: Alert) => {
    setEditingAlert(alert);
    setIsAlertModalOpen(true);
  };

  const handleDeleteAlert = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this alert?')) {
      try {
        await alertAPI.deleteAlert(id);
        toast.success('Alert deleted successfully');
        fetchAlerts();
      } catch (error) {
        toast.error('Failed to delete alert');
      }
    }
  };

  const handleToggleAlert = async (alert: Alert) => {
    try {
      await alertAPI.updateAlert(alert._id, { isActive: !alert.isActive });
      toast.success(`Alert ${alert.isActive ? 'deactivated' : 'activated'}`);
      fetchAlerts();
    } catch (error) {
      toast.error('Failed to update alert');
    }
  };

  const handleAlertSubmit = async (alertData: any) => {
    try {
      if (editingAlert) {
        await alertAPI.updateAlert(editingAlert._id, alertData);
        toast.success('Alert updated successfully');
      } else {
        await alertAPI.createAlert({ ...alertData, isActive: true });
        toast.success('Alert created successfully');
      }
      fetchAlerts();
    } catch (error) {
      toast.error('Failed to save alert');
    }
  };

  const formatCondition = (alert: Alert) => {
    switch (alert.condition) {
      case 'above':
        return `Price goes above ${alert.targetPrice?.toLocaleString()}`;
      case 'below':
        return `Price goes below ${alert.targetPrice?.toLocaleString()}`;
      case 'percent_increase':
        return `Increases by ${alert.percentageChange}%`;
      case 'percent_decrease':
        return `Decreases by ${alert.percentageChange}%`;
      default:
        return alert.condition;
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Price Alerts</h1>
              <p className="mt-1 text-sm text-gray-600">
                Manage your cryptocurrency price alerts
              </p>
            </div>
            <button
              onClick={handleCreateAlert}
              className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Create Alert
            </button>
          </div>
        </div>
      </div>

      {/* Alerts List */}
      {alerts.length === 0 ? (
        <div className="bg-white shadow rounded-lg">
          <div className="text-center py-12">
            <div className="mx-auto h-12 w-12 text-gray-400">
              <svg
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-5 5-5-5h5v-12h5v12z"
                />
              </svg>
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No alerts</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating your first price alert.
            </p>
            <div className="mt-6">
              <button
                onClick={handleCreateAlert}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Create Alert
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {alerts.map((alert) => (
              <li key={alert._id}>
                <div className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-medium text-gray-900">
                          {alert.symbol.toUpperCase()}
                        </h3>
                        <span className={clsx(
                          'inline-flex px-2 py-1 text-xs font-semibold rounded-full',
                          alert.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        )}>
                          {alert.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-gray-600">
                        {formatCondition(alert)}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        Created {format(new Date(alert.createdAt), 'PPp')}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleToggleAlert(alert)}
                        className={clsx(
                          'inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2',
                          alert.isActive
                            ? 'text-red-700 bg-red-100 hover:bg-red-200 focus:ring-red-500'
                            : 'text-green-700 bg-green-100 hover:bg-green-200 focus:ring-green-500'
                        )}
                      >
                        {alert.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleEditAlert(alert)}
                        className="text-gray-400 hover:text-gray-500"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteAlert(alert._id)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Alert Modal */}
      <AlertModal
        isOpen={isAlertModalOpen}
        onClose={() => setIsAlertModalOpen(false)}
        onSubmit={handleAlertSubmit}
        editingAlert={editingAlert}
      />
    </div>
  );
};

export default AlertsPage;