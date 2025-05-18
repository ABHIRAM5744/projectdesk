import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/layout/Navbar';
import { Calendar, Clock, Dumbbell } from 'lucide-react';

interface WorkoutData {
  date: string;
  duration: number;
  exercises: {
    pushups: number;
    squats: number;
    jumpingJacks: number;
    planks: number;
    armRaises: number;
  };
}

const WorkoutHistory: React.FC = () => {
  const { currentUser } = useAuth();
  const [workouts, setWorkouts] = useState<WorkoutData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser) {
      // Get workout history from localStorage
      const history = localStorage.getItem(`workoutHistory_${currentUser.id}`)
        ? JSON.parse(localStorage.getItem(`workoutHistory_${currentUser.id}`) || '[]')
        : [];
      
      setWorkouts(history);
      setLoading(false);
    }
  }, [currentUser]);

  // Format date for display
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Format duration for display
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  // Calculate total exercises in a workout
  const getTotalExercises = (workout: WorkoutData) => {
    return (
      workout.exercises.pushups +
      workout.exercises.squats +
      workout.exercises.jumpingJacks +
      workout.exercises.planks +
      workout.exercises.armRaises
    );
  };

  // Calculate totals for all workouts
  const calculateTotals = () => {
    let totalDuration = 0;
    let totalPushups = 0;
    let totalSquats = 0;
    let totalJumpingJacks = 0;
    let totalPlanks = 0;
    let totalArmRaises = 0;
    
    workouts.forEach(workout => {
      totalDuration += workout.duration;
      totalPushups += workout.exercises.pushups;
      totalSquats += workout.exercises.squats;
      totalJumpingJacks += workout.exercises.jumpingJacks;
      totalPlanks += workout.exercises.planks;
      totalArmRaises += workout.exercises.armRaises;
    });
    
    return {
      workouts: workouts.length,
      duration: totalDuration,
      pushups: totalPushups,
      squats: totalSquats,
      jumpingJacks: totalJumpingJacks,
      planks: totalPlanks,
      armRaises: totalArmRaises
    };
  };

  const totals = calculateTotals();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="md:flex md:items-center md:justify-between mb-6">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              Workout History
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Track your fitness progress over time
            </p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Calendar className="h-6 w-6 text-primary-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Workouts
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {totals.workouts}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Clock className="h-6 w-6 text-primary-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Time
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {Math.floor(totals.duration / 60)}m {totals.duration % 60}s
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Dumbbell className="h-6 w-6 text-primary-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Most Common Exercise
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {totals.pushups >= totals.squats && 
                       totals.pushups >= totals.jumpingJacks && 
                       totals.pushups >= totals.planks && 
                       totals.pushups >= totals.armRaises
                        ? 'Push-ups'
                        : totals.squats >= totals.jumpingJacks && 
                          totals.squats >= totals.planks && 
                          totals.squats >= totals.armRaises
                          ? 'Squats'
                          : totals.jumpingJacks >= totals.planks && 
                            totals.jumpingJacks >= totals.armRaises
                            ? 'Jumping Jacks'
                            : totals.planks >= totals.armRaises
                              ? 'Planks'
                              : 'Arm Raises'}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Dumbbell className="h-6 w-6 text-primary-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Exercises
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {totals.pushups + totals.squats + totals.jumpingJacks + totals.planks + totals.armRaises}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Workout List */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {loading ? (
              <li className="p-4">
                <div className="animate-pulse flex space-x-4">
                  <div className="rounded-full bg-gray-200 h-12 w-12"></div>
                  <div className="flex-1 space-y-4 py-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded"></div>
                      <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                    </div>
                  </div>
                </div>
              </li>
            ) : workouts.length === 0 ? (
              <li className="px-4 py-5 sm:px-6">
                <div className="text-center py-6">
                  <Dumbbell className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No workouts yet</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Start tracking your first workout to see your history here.
                  </p>
                  <div className="mt-6">
                    <Link
                      to="/workout"
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      Start Workout
                    </Link>
                  </div>
                </div>
              </li>
            ) : (
              workouts.map((workout, index) => (
                <li key={index}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="sm:flex sm:items-center">
                        <div className="text-sm font-medium text-primary-600 truncate">
                          Workout on {new Date(workout.date).toLocaleDateString()}
                        </div>
                        <div className="mt-2 flex sm:mt-0 sm:ml-4">
                          <div className="mr-6 flex items-center text-sm text-gray-500">
                            <Clock className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                            {formatDuration(workout.duration)}
                          </div>
                          <div className="flex items-center text-sm text-gray-500">
                            <Dumbbell className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                            {getTotalExercises(workout)} exercises
                          </div>
                        </div>
                      </div>
                      <div className="ml-5 flex-shrink-0">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-primary-100 text-primary-800">
                          {new Date(workout.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </div>
                    </div>
                    <div className="mt-4 sm:flex sm:justify-between">
                      <div className="sm:flex">
                        {workout.exercises.pushups > 0 && (
                          <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:mr-6">
                            <span className="bg-primary-50 text-primary-700 px-2 py-1 rounded-md text-xs">
                              Push-ups: {workout.exercises.pushups}
                            </span>
                          </div>
                        )}
                        {workout.exercises.squats > 0 && (
                          <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:mr-6">
                            <span className="bg-primary-50 text-primary-700 px-2 py-1 rounded-md text-xs">
                              Squats: {workout.exercises.squats}
                            </span>
                          </div>
                        )}
                        {workout.exercises.jumpingJacks > 0 && (
                          <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:mr-6">
                            <span className="bg-primary-50 text-primary-700 px-2 py-1 rounded-md text-xs">
                              Jumping Jacks: {workout.exercises.jumpingJacks}
                            </span>
                          </div>
                        )}
                        {workout.exercises.planks > 0 && (
                          <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:mr-6">
                            <span className="bg-primary-50 text-primary-700 px-2 py-1 rounded-md text-xs">
                              Planks: {workout.exercises.planks}s
                            </span>
                          </div>
                        )}
                        {workout.exercises.armRaises > 0 && (
                          <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:mr-6">
                            <span className="bg-primary-50 text-primary-700 px-2 py-1 rounded-md text-xs">
                              Arm Raises: {workout.exercises.armRaises}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      </main>
    </div>
  );
};

// For TypeScript compatibility
interface Link {
  to: string;
  className?: string;
  children: React.ReactNode;
}

const Link: React.FC<Link> = ({ to, className, children }) => {
  return (
    <a href={to} className={className}>
      {children}
    </a>
  );
};

export default WorkoutHistory;