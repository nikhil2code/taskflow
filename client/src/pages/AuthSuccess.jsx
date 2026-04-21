// src/pages/AuthSuccess.jsx
import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const AuthSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginWithToken } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    const error = params.get('error');
    
    if (token) {
      // Use the context's loginWithToken method
      loginWithToken(token)
        .then(() => {
          toast.success('Google login successful!');
          navigate('/dashboard');
        })
        .catch((err) => {
          console.error('Login error:', err);
          toast.error('Failed to authenticate. Please try again.');
          navigate('/login');
        });
    } else if (error) {
      toast.error('Google login failed. Please try again.');
      navigate('/login');
    } else {
      navigate('/login');
    }
  }, [location, loginWithToken, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h2 className="text-2xl font-semibold text-gray-700 mb-2">
          Processing Google Login...
        </h2>
        <p className="text-gray-500">Please wait while we redirect you.</p>
      </div>
    </div>
  );
};

export default AuthSuccess;