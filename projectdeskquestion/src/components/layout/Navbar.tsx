import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Activity, User, LineChart, Home, Video, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const Navbar: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!currentUser) return null;

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/dashboard" className="flex items-center">
                <Activity className="h-8 w-8 text-primary-600" />
                <span className="ml-2 text-xl font-bold text-gray-900">ABHIRAM</span>
              </Link>
            </div>
          </div>
          <div className="flex items-center">
            <div className="hidden md:ml-6 md:flex md:space-x-8">
              <Link 
                to="/dashboard" 
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium 
                  ${location.pathname === '/dashboard' 
                    ? 'border-primary-500 text-gray-900' 
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}`}
              >
                <Home className="h-5 w-5 mr-1" />
                Dashboard
              </Link>
              <Link 
                to="/workout" 
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium 
                  ${location.pathname === '/workout' 
                    ? 'border-primary-500 text-gray-900' 
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}`}
              >
                <Video className="h-5 w-5 mr-1" />
                Workout
              </Link>
              <Link 
                to="/history" 
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium 
                  ${location.pathname === '/history' 
                    ? 'border-primary-500 text-gray-900' 
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}`}
              >
                <LineChart className="h-5 w-5 mr-1" />
                History
              </Link>
              <Link 
                to="/profile" 
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium 
                  ${location.pathname === '/profile' 
                    ? 'border-primary-500 text-gray-900' 
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}`}
              >
                <User className="h-5 w-5 mr-1" />
                Profile
              </Link>
            </div>
            <button
              onClick={handleLogout}
              className="ml-4 flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <LogOut className="h-4 w-4 mr-1" />
              Logout
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      <div className="md:hidden border-t border-gray-200">
        <div className="grid grid-cols-4 text-xs">
          <Link 
            to="/dashboard" 
            className={`flex flex-col items-center py-3 ${
              location.pathname === '/dashboard' ? 'text-primary-600' : 'text-gray-600'
            }`}
          >
            <Home className="h-6 w-6" />
            <span className="mt-1">Home</span>
          </Link>
          <Link 
            to="/workout" 
            className={`flex flex-col items-center py-3 ${
              location.pathname === '/workout' ? 'text-primary-600' : 'text-gray-600'
            }`}
          >
            <Video className="h-6 w-6" />
            <span className="mt-1">Workout</span>
          </Link>
          <Link 
            to="/history" 
            className={`flex flex-col items-center py-3 ${
              location.pathname === '/history' ? 'text-primary-600' : 'text-gray-600'
            }`}
          >
            <LineChart className="h-6 w-6" />
            <span className="mt-1">History</span>
          </Link>
          <Link 
            to="/profile" 
            className={`flex flex-col items-center py-3 ${
              location.pathname === '/profile' ? 'text-primary-600' : 'text-gray-600'
            }`}
          >
            <User className="h-6 w-6" />
            <span className="mt-1">Profile</span>
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;