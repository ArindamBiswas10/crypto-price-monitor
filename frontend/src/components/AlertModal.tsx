import React from 'react';
import { useForm } from 'react-hook-form';
import { Dialog } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Alert } from '../types';

interface AlertFormData {
  symbol: string;
  condition: 'above' | 'below' | 'percent_increase' | 'percent_decrease';
  targetPrice?: number;
  percentageChange?: number;
}

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: AlertFormData) => Promise<void>;
  initialSymbol?: string;
  editingAlert?: Alert;
}

const AlertModal: React.FC<AlertModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialSymbol,
  editingAlert,
}) => {
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AlertFormData>({
    defaultValues: editingAlert
      ? {
          symbol: editingAlert.symbol,
          condition: editingAlert.condition,
          targetPrice: editingAlert.targetPrice,
          percentageChange: editingAlert.percentageChange,
        }
      : {
          symbol: initialSymbol?.toUpperCase() || '',
          condition: 'above',
        },
  });

  const condition = watch('condition');

  const handleFormSubmit = async (data: AlertFormData) => {
    await onSubmit(data);
    reset();
    onClose();
  };

  React.useEffect(() => {
    if (!isOpen) {
      reset();
    }
  }, [isOpen, reset]);

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-md w-full bg-white rounded-lg shadow-lg">
          <div className="flex items-center justify-between p-6 border-b">
            <Dialog.Title className="text-lg font-medium">
              {editingAlert ? 'Edit Alert' : 'Create Price Alert'}
            </Dialog.Title>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Cryptocurrency Symbol
              </label>
              <input
                {...register('symbol', { required: 'Symbol is required' })}
                type="text"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="BTC, ETH, etc."
                style={{ textTransform: 'uppercase' }}
              />
              {errors.symbol && (
                <p className="mt-1 text-sm text-red-600">{errors.symbol.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Condition
              </label>
              <select
                {...register('condition', { required: 'Condition is required' })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="above">Price goes above</option>
                <option value="below">Price goes below</option>
                <option value="percent_increase">Percentage increase</option>
                <option value="percent_decrease">Percentage decrease</option>
              </select>
            </div>

            {(condition === 'above' || condition === 'below') && (
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Target Price ($)
                </label>
                <input
                  {...register('targetPrice', {
                    required: 'Target price is required',
                    min: { value: 0, message: 'Price must be positive' },
                  })}
                  type="number"
                  step="0.000001"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="0.00"
                />
                {errors.targetPrice && (
                  <p className="mt-1 text-sm text-red-600">{errors.targetPrice.message}</p>
                )}
              </div>
            )}

            {(condition === 'percent_increase' || condition === 'percent_decrease') && (
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Percentage Change (%)
                </label>
                <input
                  {...register('percentageChange', {
                    required: 'Percentage change is required',
                    min: { value: 0, message: 'Percentage must be positive' },
                    max: { value: 1000, message: 'Percentage cannot exceed 1000%' },
                  })}
                  type="number"
                  step="0.1"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="5.0"
                />
                {errors.percentageChange && (
                  <p className="mt-1 text-sm text-red-600">{errors.percentageChange.message}</p>
                )}
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : editingAlert ? 'Update Alert' : 'Create Alert'}
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default AlertModal;