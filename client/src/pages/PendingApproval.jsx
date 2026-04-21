// src/pages/PendingApproval.jsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckSquare, Clock, Mail } from 'lucide-react';

const PendingApproval = () => {
  const navigate = useNavigate();
  const userEmail = localStorage.getItem('pendingEmail') || 'your email';

  useEffect(() => {
    // Check if user is already approved (polling)
    const checkApproval = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        navigate('/dashboard');
      }
    };
    
    const interval = setInterval(checkApproval, 5000);
    return () => clearInterval(interval);
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full text-center p-8">
        <div className="bg-yellow-50 rounded-full h-24 w-24 flex items-center justify-center mx-auto mb-6">
          <Clock className="h-12 w-12 text-yellow-600" />
        </div>
        
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Registration Pending Approval
        </h2>
        
        <p className="text-gray-600 mb-4">
          Thank you for registering! Your account is waiting for admin approval.
        </p>
        
        <div className="bg-gray-100 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-center gap-2 text-gray-700">
            <Mail className="h-4 w-4" />
            <span className="text-sm">{userEmail}</span>
          </div>
        </div>
        
        <p className="text-sm text-gray-500 mb-6">
          You will receive an email once your account is approved.
          You can close this page and check back later.
        </p>
        
        <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
          <div className="animate-pulse">●</div>
          <span>Waiting for admin approval...</span>
        </div>
      </div>
    </div>
  );
};

export default PendingApproval;