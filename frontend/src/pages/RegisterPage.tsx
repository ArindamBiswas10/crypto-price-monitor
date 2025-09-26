import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import RegisterForm from '../components/auth/RegisterForm';
import LoadingSpinner from '../components/LoadingSpinner';

const RegisterPage: React.FC = () => {
  const { register: registerUser, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <RegisterForm onSubmit={registerUser} />;
};

export default RegisterPage;