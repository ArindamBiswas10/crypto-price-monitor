import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../services/api';
import { useForm } from 'react-hook-form';
import { User } from '../types';
import toast from 'react-hot-toast';

interface ProfileFormData {
  firstName: string;
  lastName: string;
  preferences: {
    defaultCurrency: string;
    emailNotifications: boolean;
    pushNotifications: boolean;
    theme: 'light' | 'dark' | 'system';
  };
}

interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');
  const [isLoading, setIsLoading] = useState(false);

  const profileForm = useForm<ProfileFormData>({
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      preferences: user?.preferences || {
        defaultCurrency: 'USD',
        emailNotifications: true,
        pushNotifications: false,
        theme: 'system',
      },
    },
  });

  const passwordForm = useForm<PasswordFormData>();

  const handleProfileSubmit = async (data: ProfileFormData) => {
    setIsLoading(true);
    try {
      await updateUser(data);
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async (data: PasswordFormData) => {
    if (data.newPassword !== data.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      await authAPI.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      toast.success('Password changed successfully');
      passwordForm.reset();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    try {
      await authAPI.resendVerification();
      toast.success('Verification email sent');
    } catch (error) {
      toast.error('Failed to send verification email');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="px-4 py-5 sm:p-6">
          <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage your account settings and preferences
          </p>
        </div>
      </div>

      {/* Email verification banner */}
      {!user?.isEmailVerified && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-medium text-yellow-800">
                Email not verified
              </h3>
              <p className="mt-1 text-sm text-yellow-700">
                Please verify your email address to receive notifications.
              </p>
            </div>
            <button
              onClick={handleResendVerification}
              className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-md text-sm font-medium hover:bg-yellow-200"
            >
              Resend verification
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            <button
              onClick={() => setActiveTab('profile')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'profile'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Profile Information
            </button>
            <button
              onClick={() => setActiveTab('password')}
              className={`ml-8 py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'password'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Change Password
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'profile' && (
            <form onSubmit={profileForm.handleSubmit(handleProfileSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    First Name
                  </label>
                  <input
                    {...profileForm.register('firstName', { required: 'First name is required' })}
                    type="text"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                  {profileForm.formState.errors.firstName && (
                    <p className="mt-1 text-sm text-red-600">
                      {profileForm.formState.errors.firstName.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Last Name
                  </label>
                  <input
                    {...profileForm.register('lastName', { required: 'Last name is required' })}
                    type="text"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                  {profileForm.formState.errors.lastName && (
                    <p className="mt-1 text-sm text-red-600">
                      {profileForm.formState.errors.lastName.message}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <input
                  type="email"
                  value={user?.email}
                  disabled
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500 sm:text-sm"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Email address cannot be changed
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Default Currency
                </label>
                <select
                  {...profileForm.register('preferences.defaultCurrency')}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="GBP">GBP - British Pound</option>
                  <option value="JPY">JPY - Japanese Yen</option>
                  <option value="BTC">BTC - Bitcoin</option>
                  <option value="ETH">ETH - Ethereum</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Preferences
                </label>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <input
                      {...profileForm.register('preferences.emailNotifications')}
                      type="checkbox"
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-900">
                      Email notifications for price alerts
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      {...profileForm.register('preferences.pushNotifications')}
                      type="checkbox"
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-900">
                      Push notifications (coming soon)
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Theme Preference
                </label>
                <select
                  {...profileForm.register('preferences.theme')}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="system">System</option>
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          )}

          {activeTab === 'password' && (
            <form onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Current Password
                </label>
                <input
                  {...passwordForm.register('currentPassword', { required: 'Current password is required' })}
                  type="password"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
                {passwordForm.formState.errors.currentPassword && (
                  <p className="mt-1 text-sm text-red-600">
                    {passwordForm.formState.errors.currentPassword.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  New Password
                </label>
                <input
                  {...passwordForm.register('newPassword', {
                    required: 'New password is required',
                    minLength: {
                      value: 8,
                      message: 'Password must be at least 8 characters',
                    },
                    pattern: {
                      value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
                      message: 'Password must contain uppercase, lowercase, number, and special character',
                    },
                  })}
                  type="password"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
                {passwordForm.formState.errors.newPassword && (
                  <p className="mt-1 text-sm text-red-600">
                    {passwordForm.formState.errors.newPassword.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Confirm New Password
                </label>
                <input
                  {...passwordForm.register('confirmPassword', {
                    required: 'Please confirm your password',
                    validate: (value) =>
                      value === passwordForm.watch('newPassword') || 'Passwords do not match',
                  })}
                  type="password"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
                {passwordForm.formState.errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">
                    {passwordForm.formState.errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {isLoading ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;