import React, { useState, useEffect } from 'react';
import { useWebSocket } from '../contexts/WebSocketContext';
import { priceAPI } from '../services/api';
import PriceCard from '../components/PriceCard';
import AlertModal from '../components/AlertModal';
import LoadingSpinner from '../components/LoadingSpinner';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { alertAPI } from '../services/api';

const PricesPage: React.FC = () => {
  const { prices, isConnected } = useWebSocket();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'change'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [selectedSymbol, setSelectedSymbol] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const filteredPrices = prices
    .filter((price) =>
      price.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      price.symbol.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      let aValue, bValue;
      switch (sortBy) {
        case 'name':
          aValue = a.name;
          bValue = b.name;
          break;
        case 'price':
          aValue = a.current_price;
          bValue = b.current_price;
          break;
        case 'change':
          aValue = a.price_change_percentage_24h;
          bValue = b.price_change_percentage_24h;
          break;
        default:
          aValue = a.name;
          bValue = b.name;
      }

      if (typeof aValue === 'string') {
        return sortOrder === 'asc' 
          ? aValue.localeCompare(bValue as string)
          : (bValue as string).localeCompare(aValue);
      } else {
        return sortOrder === 'asc' 
          ? (aValue as number) - (bValue as number)
          : (bValue as number) - (aValue as number);
      }
    });

  const handleCreateAlert = (symbol: string) => {
    setSelectedSymbol(symbol);
    setIsAlertModalOpen(true);
  };

  const handleAlertSubmit = async (alertData: any) => {
    try {
      await alertAPI.createAlert({ ...alertData, isActive: true });
      toast.success('Alert created successfully');
    } catch (error) {
      toast.error('Failed to create alert');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Cryptocurrency Prices
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Real-time cryptocurrency price monitoring
              </p>
            </div>
            <div className="mt-4 sm:mt-0 flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm text-gray-600">
                {isConnected ? 'Live Updates' : 'Disconnected'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Search cryptocurrencies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'name' | 'price' | 'change')}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="name">Sort by Name</option>
              <option value="price">Sort by Price</option>
              <option value="change">Sort by Change</option>
            </select>
          </div>

          <div>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results */}
      <div>
        <div className="mb-4 text-sm text-gray-600">
          Showing {filteredPrices.length} of {prices.length} cryptocurrencies
        </div>

        {filteredPrices.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No cryptocurrencies found matching your search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredPrices.map((price) => (
              <PriceCard
                key={price.id}
                price={price}
                onCreateAlert={handleCreateAlert}
              />
            ))}
          </div>
        )}
      </div>

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

export default PricesPage;