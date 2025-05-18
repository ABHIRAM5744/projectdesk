import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/layout/Navbar';

const Profile: React.FC = () => {
  const { currentUser, updateProfile } = useAuth();
  
  const [name, setName] = useState(currentUser?.name || '');
  const [age, setAge] = useState(currentUser?.age?.toString() || '');
  const [weight, setWeight] = useState(currentUser?.weight?.toString() || '');
  const [fitnessGoal, setFitnessGoal] = useState(currentUser?.fitnessGoal || '');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      updateProfile({
        name,
        age: age ? parseInt(age) : undefined,
        weight: weight ? parseFloat(weight) : undefined,
        fitnessGoal
      });
      
      setSuccess('Profile updated successfully');
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="md:flex md:items-center md:justify-between mb-6">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              Your Profile
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Manage your account information and fitness goals
            </p>
          </div>
        </div>

        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Personal Information
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Update your personal details and fitness goals
            </p>
          </div>
          
          {success && (
            <div className="mx-4 my-2 bg-success-50 border border-success-500 text-success-700 px-4 py-3 rounded" role="alert">
              <span className="block sm:inline">{success}</span>
            </div>
          )}
          
          {error && (
            <div className="mx-4 my-2 bg-error-50 border border-error-500 text-error-700 px-4 py-3 rounded" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}
          
          <div className="border-t border-gray-200">
            <form onSubmit={handleSubmit}>
              <dl>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">
                    <label htmlFor="email">Email address</label>
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    <input 
                      id="email"
                      type="email" 
                      value={currentUser?.email} 
                      disabled
                      className="bg-gray-100 shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    />
                  </dd>
                </div>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">
                    <label htmlFor="name">Full name</label>
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    <input 
                      id="name"
                      type="text" 
                      value={name} 
                      onChange={(e) => setName(e.target.value)} 
                      className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    />
                  </dd>
                </div>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">
                    <label htmlFor="age">Age</label>
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    <input 
                      id="age"
                      type="number" 
                      value={age} 
                      onChange={(e) => setAge(e.target.value)} 
                      className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      min="1"
                      max="120"
                    />
                  </dd>
                </div>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">
                    <label htmlFor="weight">Weight (kg)</label>
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    <input 
                      id="weight"
                      type="number" 
                      value={weight} 
                      onChange={(e) => setWeight(e.target.value)} 
                      className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      min="1"
                      step="0.1"
                    />
                  </dd>
                </div>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">
                    <label htmlFor="fitnessGoal">Fitness goal</label>
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    <select 
                      id="fitnessGoal"
                      value={fitnessGoal} 
                      onChange={(e) => setFitnessGoal(e.target.value)} 
                      className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    >
                      <option value="">Select a goal</option>
                      <option value="weightLoss">Weight loss</option>
                      <option value="muscleGain">Muscle gain</option>
                      <option value="stayFit">Stay fit</option>
                      <option value="improveEndurance">Improve endurance</option>
                      <option value="increaseStrength">Increase strength</option>
                    </select>
                  </dd>
                </div>
                <div className="bg-white px-4 py-5 sm:px-6">
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </dl>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Profile;