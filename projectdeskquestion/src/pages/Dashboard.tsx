import React, { useEffect, useState } from 'react';
import { PlayCircle, Calendar, Trophy, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/layout/Navbar';

interface WorkoutSummary {
  totalWorkouts: number;
  totalExercises: number;
  pushups: number;
  squats: number;
  jumpingJacks: number;
  planks: number;
  armRaises: number;
  lastWorkoutDate: string | null;
}

const Dashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const [summary, setSummary] = useState<WorkoutSummary>({
    totalWorkouts: 0,
    totalExercises: 0,
    pushups: 0,
    squats: 0,
    jumpingJacks: 0,
    planks: 0,
    armRaises: 0,
    lastWorkoutDate: null
  });

  useEffect(() => {
    if (currentUser) {
      // Get workout history from localStorage
      const workoutHistory = localStorage.getItem(`workoutHistory_${currentUser.id}`)
        ? JSON.parse(localStorage.getItem(`workoutHistory_${currentUser.id}`) || '[]')
        : [];
      
      // Calculate stats
      const totalWorkouts = workoutHistory.length;
      
      let pushups = 0;
      let squats = 0;
      let jumpingJacks = 0;
      let planks = 0;
      let armRaises = 0;
      
      workoutHistory.forEach((workout: any) => {
        pushups += workout.exercises.pushups || 0;
        squats += workout.exercises.squats || 0;
        jumpingJacks += workout.exercises.jumpingJacks || 0;
        planks += workout.exercises.planks || 0;
        armRaises += workout.exercises.armRaises || 0;
      });
      
      const totalExercises = pushups + squats + jumpingJacks + planks + armRaises;
      const lastWorkoutDate = workoutHistory.length > 0 ? workoutHistory[0].date : null;
      
      setSummary({
        totalWorkouts,
        totalExercises,
        pushups,
        squats,
        jumpingJacks,
        planks,
        armRaises,
        lastWorkoutDate
      });
    }
  }, [currentUser]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="md:flex md:items-center md:justify-between mb-6">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              {currentUser?.name ? `Welcome, ${currentUser.name}` : 'Welcome'}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {summary.lastWorkoutDate 
                ? `Last workout: ${new Date(summary.lastWorkoutDate).toLocaleDateString()}`
                : 'No workouts yet. Start your fitness journey today!'}
            </p>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4">
            <Link
              to="/workout"
              className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <PlayCircle className="h-5 w-5 mr-2" />
              Start Workout
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-8">
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
                    <dd>
                      <div className="text-lg font-medium text-gray-900">
                        {summary.totalWorkouts}
                      </div>
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
                  <Trophy className="h-6 w-6 text-accent-500" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Exercises
                    </dt>
                    <dd>
                      <div className="text-lg font-medium text-gray-900">
                        {summary.totalExercises}
                      </div>
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
                  <TrendingUp className="h-6 w-6 text-success-500" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Fitness Progress
                    </dt>
                    <dd>
                      <div className="text-lg font-medium text-gray-900">
                        {summary.totalWorkouts === 0 ? 'Just Starting' : 
                          summary.totalWorkouts < 5 ? 'Beginner' : 
                          summary.totalWorkouts < 10 ? 'Intermediate' : 'Advanced'}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white shadow overflow-hidden sm:rounded-md mb-8">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Exercise Breakdown
            </h3>
          </div>
          <ul className="divide-y divide-gray-200">
            <li>
              <div className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-primary-600 truncate">
                    Push-ups
                  </div>
                  <div className="ml-2 flex-shrink-0 flex">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-primary-100 text-primary-800">
                      {summary.pushups} reps
                    </span>
                  </div>
                </div>
              </div>
            </li>
            <li>
              <div className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-primary-600 truncate">
                    Squats
                  </div>
                  <div className="ml-2 flex-shrink-0 flex">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-primary-100 text-primary-800">
                      {summary.squats} reps
                    </span>
                  </div>
                </div>
              </div>
            </li>
            <li>
              <div className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-primary-600 truncate">
                    Jumping Jacks
                  </div>
                  <div className="ml-2 flex-shrink-0 flex">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-primary-100 text-primary-800">
                      {summary.jumpingJacks} reps
                    </span>
                  </div>
                </div>
              </div>
            </li>
            <li>
              <div className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-primary-600 truncate">
                    Planks
                  </div>
                  <div className="ml-2 flex-shrink-0 flex">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-primary-100 text-primary-800">
                      {summary.planks} seconds
                    </span>
                  </div>
                </div>
              </div>
            </li>
            <li>
              <div className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-primary-600 truncate">
                    Arm Raises
                  </div>
                  <div className="ml-2 flex-shrink-0 flex">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-primary-100 text-primary-800">
                      {summary.armRaises} reps
                    </span>
                  </div>
                </div>
              </div>
            </li>
          </ul>
        </div>
        
        <div className="bg-primary-50 rounded-lg overflow-hidden shadow">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Quick Tips
            </h3>
            <div className="mt-2 max-w-xl text-sm text-gray-500">
              <ul className="list-disc pl-5 space-y-1">
                <li>Stay hydrated before, during, and after your workout</li>
                <li>Remember to warm up before starting intense exercises</li>
                <li>Consistent practice leads to better results</li>
                <li>Focus on proper form over number of repetitions</li>
                <li>Take rest days to allow your body to recover</li>
              </ul>
            </div>
            <div className="mt-5">
              <Link
                to="/workout"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Start Today's Workout
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;