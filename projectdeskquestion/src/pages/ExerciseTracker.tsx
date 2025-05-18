import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/layout/Navbar';
import * as tf from '@tensorflow/tfjs';
import { initPoseDetection, detectPose, disposePoseDetector } from '../services/poseDetection';
import { 
  ExerciseState,
  initExerciseState,
  detectPushup,
  detectSquat,
  detectJumpingJack,
  detectPlank,
  detectArmRaises
} from '../services/exerciseDetection';
import { 
  Play, 
  Pause, 
  RotateCw, 
  Camera,
  CheckCircle
} from 'lucide-react';

interface WorkoutSummary {
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

type ExerciseType = 'pushup' | 'squat' | 'jumpingJack' | 'plank' | 'armRaise';

const ExerciseTracker: React.FC = () => {
  const { currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [exerciseType, setExerciseType] = useState<ExerciseType>('pushup');
  const [exerciseState, setExerciseState] = useState<ExerciseState>(initExerciseState());
  const [workoutStartTime, setWorkoutStartTime] = useState<number | null>(null);
  const [workoutDuration, setWorkoutDuration] = useState(0);
  const [showCameraAccess, setShowCameraAccess] = useState(false);
  const [showWorkoutComplete, setShowWorkoutComplete] = useState(false);
  const [workoutSummary, setWorkoutSummary] = useState<WorkoutSummary | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestAnimationRef = useRef<number | null>(null);

  // Exercise detection function map
  const detectionFunctions = {
    pushup: detectPushup,
    squat: detectSquat,
    jumpingJack: detectJumpingJack,
    plank: detectPlank,
    armRaise: detectArmRaises
  };

  // Initialize camera and TensorFlow models
  useEffect(() => {
    const setupCamera = async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError('Your browser does not support camera access. Please try a different browser.');
        setIsLoading(false);
        return;
      }

      try {
        // Initialize TensorFlow.js
        await tf.ready();
        
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: 640, height: 480 }
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await new Promise<void>((resolve) => {
            if (videoRef.current) {
              videoRef.current.onloadedmetadata = () => {
                resolve();
              };
            }
          });
        }

        await initPoseDetection();
        setIsLoading(false);
      } catch (err) {
        console.error('Error setting up camera:', err);
        setError('Could not access your camera. Please check permissions.');
        setShowCameraAccess(true);
        setIsLoading(false);
      }
    };

    setupCamera();

    return () => {
      // Cleanup
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop());
      }
      
      if (requestAnimationRef.current) {
        cancelAnimationFrame(requestAnimationRef.current);
      }
      
      disposePoseDetector();
    };
  }, []);

  // Update workout duration timer
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isActive && workoutStartTime) {
      interval = setInterval(() => {
        setWorkoutDuration(Math.floor((Date.now() - workoutStartTime) / 1000));
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, workoutStartTime]);

  // Main detection loop
  const runDetection = async () => {
    if (!videoRef.current || !isActive) return;
    
    const poses = await detectPose(videoRef.current);
    
    if (poses && poses.length > 0) {
      const pose = poses[0];
      
      // Update exercise state based on selected exercise type
      const detectFunction = detectionFunctions[exerciseType];
      const newState = detectFunction(pose, exerciseState);
      setExerciseState(newState);
      
      // Render pose keypoints on canvas if available
      if (canvasRef.current && videoRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          // Clear canvas
          ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          
          // Draw keypoints and connections
          drawPose(ctx, pose);
        }
      }
    }
    
    // Continue detection loop
    requestAnimationRef.current = requestAnimationFrame(runDetection);
  };

  // Helper function to draw pose keypoints on canvas
  const drawPose = (ctx: CanvasRenderingContext2D, pose: poseDetection.Pose) => {
    // Set canvas dimensions to match video
    if (videoRef.current && canvasRef.current) {
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
    }
    
    // Draw keypoints
    ctx.fillStyle = '#00FFFF';
    ctx.strokeStyle = '#0000FF';
    ctx.lineWidth = 2;
    
    pose.keypoints.forEach(keypoint => {
      if (keypoint.score && keypoint.score > 0.3) {
        ctx.beginPath();
        ctx.arc(keypoint.x, keypoint.y, 4, 0, 2 * Math.PI);
        ctx.fill();
      }
    });
    
    // Draw connections between keypoints
    const connections = [
      ['nose', 'left_eye'], ['nose', 'right_eye'],
      ['left_eye', 'left_ear'], ['right_eye', 'right_ear'],
      ['left_shoulder', 'right_shoulder'],
      ['left_shoulder', 'left_elbow'], ['right_shoulder', 'right_elbow'],
      ['left_elbow', 'left_wrist'], ['right_elbow', 'right_wrist'],
      ['left_shoulder', 'left_hip'], ['right_shoulder', 'right_hip'],
      ['left_hip', 'right_hip'],
      ['left_hip', 'left_knee'], ['right_hip', 'right_knee'],
      ['left_knee', 'left_ankle'], ['right_knee', 'right_ankle']
    ];
    
    connections.forEach(([p1Name, p2Name]) => {
      const p1 = pose.keypoints.find(kp => kp.name === p1Name);
      const p2 = pose.keypoints.find(kp => kp.name === p2Name);
      
      if (p1 && p2 && p1.score && p2.score && p1.score > 0.3 && p2.score > 0.3) {
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }
    });
  };

  // Start or stop exercise tracking
  const toggleExercise = () => {
    if (isActive) {
      // Stop tracking
      if (requestAnimationRef.current) {
        cancelAnimationFrame(requestAnimationRef.current);
        requestAnimationRef.current = null;
      }
      setIsActive(false);
    } else {
      // Start tracking
      if (!workoutStartTime) {
        setWorkoutStartTime(Date.now());
      }
      setIsActive(true);
      requestAnimationRef.current = requestAnimationFrame(runDetection);
    }
  };

  // Change exercise type
  const handleExerciseChange = (type: ExerciseType) => {
    setExerciseType(type);
    setExerciseState(initExerciseState());
  };

  // Reset current exercise
  const resetExercise = () => {
    setExerciseState(initExerciseState());
  };

  // Complete workout and save data
  const completeWorkout = () => {
    if (!currentUser?.id) return;
    
    // Calculate workout summary
    const summary: WorkoutSummary = {
      date: new Date().toISOString(),
      duration: workoutDuration,
      exercises: {
        pushups: exerciseType === 'pushup' ? exerciseState.count : 0,
        squats: exerciseType === 'squat' ? exerciseState.count : 0,
        jumpingJacks: exerciseType === 'jumpingJack' ? exerciseState.count : 0,
        planks: exerciseType === 'plank' ? exerciseState.count : 0,
        armRaises: exerciseType === 'armRaise' ? exerciseState.count : 0
      }
    };
    
    // Get existing history or initialize new array
    const existingHistory = localStorage.getItem(`workoutHistory_${currentUser.id}`)
      ? JSON.parse(localStorage.getItem(`workoutHistory_${currentUser.id}`) || '[]')
      : [];
    
    // Add new workout to beginning of array (most recent first)
    const updatedHistory = [summary, ...existingHistory];
    
    // Save to localStorage
    localStorage.setItem(`workoutHistory_${currentUser.id}`, JSON.stringify(updatedHistory));
    
    // Update state to show completion screen
    setWorkoutSummary(summary);
    setShowWorkoutComplete(true);
    
    // Stop exercise tracking
    if (isActive) {
      if (requestAnimationRef.current) {
        cancelAnimationFrame(requestAnimationRef.current);
        requestAnimationRef.current = null;
      }
      setIsActive(false);
    }
  };

  // Reset all workout data
  const startNewWorkout = () => {
    setWorkoutStartTime(null);
    setWorkoutDuration(0);
    setExerciseState(initExerciseState());
    setShowWorkoutComplete(false);
    setWorkoutSummary(null);
  };

  // Retry camera access
  const retryCameraAccess = () => {
    setShowCameraAccess(false);
    setIsLoading(true);
    setError(null);
    
    // Re-initialize everything
    window.location.reload();
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary-600 mb-4"></div>
          <p className="text-lg text-gray-600">Loading AI Fitness Tracker...</p>
          <p className="text-sm text-gray-500 mt-2">This may take a few seconds as we initialize the pose detection model.</p>
        </div>
      </div>
    );
  }

  // Render camera access prompt
  if (showCameraAccess) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="bg-white rounded-lg shadow-md p-8 max-w-2xl mx-auto">
            <div className="flex justify-center mb-6">
              <Camera className="h-16 w-16 text-primary-600" />
            </div>
            <h2 className="text-2xl font-bold text-center mb-4">Camera Access Needed</h2>
            <p className="text-gray-600 mb-6 text-center">
              This fitness tracker requires access to your camera to detect and count your exercises.
              Please allow camera access when prompted by your browser.
            </p>
            {error && (
              <div className="bg-error-50 border border-error-500 text-error-700 px-4 py-3 rounded mb-6" role="alert">
                <p className="font-bold">Error</p>
                <p>{error}</p>
              </div>
            )}
            <div className="flex justify-center">
              <button
                onClick={retryCameraAccess}
                className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <RotateCw className="w-5 h-5 mr-2" />
                Retry Camera Access
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render workout complete screen
  if (showWorkoutComplete && workoutSummary) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="bg-white rounded-lg shadow-md p-8 max-w-2xl mx-auto">
            <div className="flex justify-center mb-6">
              <CheckCircle className="h-16 w-16 text-success-500" />
            </div>
            <h2 className="text-2xl font-bold text-center mb-4">Workout Complete!</h2>
            <p className="text-gray-600 mb-6 text-center">
              Great job! You've completed your workout. Here's your summary:
            </p>
            
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Duration</p>
                  <p className="text-lg font-semibold">{Math.floor(workoutSummary.duration / 60)}m {workoutSummary.duration % 60}s</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date</p>
                  <p className="text-lg font-semibold">{new Date(workoutSummary.date).toLocaleDateString()}</p>
                </div>
                {workoutSummary.exercises.pushups > 0 && (
                  <div>
                    <p className="text-sm text-gray-500">Push-ups</p>
                    <p className="text-lg font-semibold">{workoutSummary.exercises.pushups}</p>
                  </div>
                )}
                {workoutSummary.exercises.squats > 0 && (
                  <div>
                    <p className="text-sm text-gray-500">Squats</p>
                    <p className="text-lg font-semibold">{workoutSummary.exercises.squats}</p>
                  </div>
                )}
                {workoutSummary.exercises.jumpingJacks > 0 && (
                  <div>
                    <p className="text-sm text-gray-500">Jumping Jacks</p>
                    <p className="text-lg font-semibold">{workoutSummary.exercises.jumpingJacks}</p>
                  </div>
                )}
                {workoutSummary.exercises.planks > 0 && (
                  <div>
                    <p className="text-sm text-gray-500">Plank (seconds)</p>
                    <p className="text-lg font-semibold">{workoutSummary.exercises.planks}</p>
                  </div>
                )}
                {workoutSummary.exercises.armRaises > 0 && (
                  <div>
                    <p className="text-sm text-gray-500">Arm Raises</p>
                    <p className="text-lg font-semibold">{workoutSummary.exercises.armRaises}</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <button
                onClick={startNewWorkout}
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Start New Workout
              </button>
              <Link to="/history" className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-base font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                View Workout History
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main exercise tracking interface
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="md:flex md:items-center md:justify-between mb-6">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              Exercise Tracker
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Track your exercises with AI-powered rep counting
            </p>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4">
            <button
              onClick={completeWorkout}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-success-600 hover:bg-success-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-success-500"
            >
              <CheckCircle className="h-5 w-5 mr-2" />
              Complete Workout
            </button>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="md:grid md:grid-cols-3 md:gap-6">
            <div className="md:col-span-2">
              <div className="relative">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full rounded-l-lg"
                  style={{ transform: 'scaleX(-1)' }}
                />
                <canvas
                  ref={canvasRef}
                  className="absolute top-0 left-0 w-full h-full"
                  style={{ transform: 'scaleX(-1)' }}
                />
                
                <div className="absolute bottom-4 left-4 right-4 flex justify-between">
                  <div className="bg-black bg-opacity-60 text-white px-4 py-2 rounded-lg">
                    <div className="text-sm">Count: <span className="text-lg font-semibold">{exerciseState.count}</span></div>
                  </div>
                  <div className="bg-black bg-opacity-60 text-white px-4 py-2 rounded-lg">
                    <div className="text-sm">
                      Time: <span className="text-lg font-semibold">
                        {Math.floor(workoutDuration / 60)}:{(workoutDuration % 60).toString().padStart(2, '0')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 md:border-t-0 md:border-l">
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900">Select Exercise</h3>
                <div className="mt-4 grid grid-cols-1 gap-3">
                  <button
                    onClick={() => handleExerciseChange('pushup')}
                    className={`px-4 py-3 border rounded-md text-left ${
                      exerciseType === 'pushup'
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-300 text-gray-700'
                    }`}
                  >
                    Push-ups
                  </button>
                  <button
                    onClick={() => handleExerciseChange('squat')}
                    className={`px-4 py-3 border rounded-md text-left ${
                      exerciseType === 'squat'
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-300 text-gray-700'
                    }`}
                  >
                    Squats
                  </button>
                  <button
                    onClick={() => handleExerciseChange('jumpingJack')}
                    className={`px-4 py-3 border rounded-md text-left ${
                      exerciseType === 'jumpingJack'
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-300 text-gray-700'
                    }`}
                  >
                    Jumping Jacks
                  </button>
                  <button
                    onClick={() => handleExerciseChange('plank')}
                    className={`px-4 py-3 border rounded-md text-left ${
                      exerciseType === 'plank'
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-300 text-gray-700'
                    }`}
                  >
                    Plank
                  </button>
                  <button
                    onClick={() => handleExerciseChange('armRaise')}
                    className={`px-4 py-3 border rounded-md text-left ${
                      exerciseType === 'armRaise'
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-300 text-gray-700'
                    }`}
                  >
                    Arm Raises
                  </button>
                </div>
              </div>
              
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900">Feedback</h3>
                <div className="mt-2 p-4 bg-gray-50 rounded-md">
                  <p className="text-gray-700">{exerciseState.feedback}</p>
                </div>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={toggleExercise}
                  className={`flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                    isActive
                      ? 'bg-amber-600 hover:bg-amber-700'
                      : 'bg-primary-600 hover:bg-primary-700'
                  } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500`}
                >
                  {isActive ? (
                    <>
                      <Pause className="h-5 w-5 mr-2" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="h-5 w-5 mr-2" />
                      Start
                    </>
                  )}
                </button>
                <button
                  onClick={resetExercise}
                  className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  <RotateCw className="h-5 w-5 mr-2" />
                  Reset
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-6 bg-primary-50 rounded-lg overflow-hidden shadow">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Exercise Tips: {
                exerciseType === 'pushup' ? 'Push-ups' :
                exerciseType === 'squat' ? 'Squats' :
                exerciseType === 'jumpingJack' ? 'Jumping Jacks' :
                exerciseType === 'plank' ? 'Plank' :
                'Arm Raises'
              }
            </h3>
            <div className="mt-2 max-w-xl text-sm text-gray-500">
              {exerciseType === 'pushup' && (
                <ul className="list-disc pl-5 space-y-1">
                  <li>Keep your body straight in a plank position</li>
                  <li>Lower your chest close to the ground</li>
                  <li>Push back up with your arms fully extended</li>
                  <li>Keep your elbows at a 45-degree angle from your body</li>
                  <li>Maintain a steady breathing pattern</li>
                </ul>
              )}
              {exerciseType === 'squat' && (
                <ul className="list-disc pl-5 space-y-1">
                  <li>Stand with feet shoulder-width apart</li>
                  <li>Lower your body as if sitting in a chair</li>
                  <li>Keep your back straight and chest up</li>
                  <li>Make sure your knees don't extend past your toes</li>
                  <li>Push through your heels to stand back up</li>
                </ul>
              )}
              {exerciseType === 'jumpingJack' && (
                <ul className="list-disc pl-5 space-y-1">
                  <li>Start with feet together and arms at your sides</li>
                  <li>Jump while spreading legs and raising arms above head</li>
                  <li>Jump again to return to starting position</li>
                  <li>Maintain a steady rhythm</li>
                  <li>Keep your movements controlled</li>
                </ul>
              )}
              {exerciseType === 'plank' && (
                <ul className="list-disc pl-5 space-y-1">
                  <li>Position your forearms on the ground, elbows under shoulders</li>
                  <li>Extend your legs with toes on the ground</li>
                  <li>Keep your body in a straight line from head to heels</li>
                  <li>Engage your core muscles throughout the hold</li>
                  <li>Avoid letting your hips sag or pike up</li>
                </ul>
              )}
              {exerciseType === 'armRaise' && (
                <ul className="list-disc pl-5 space-y-1">
                  <li>Stand with feet shoulder-width apart</li>
                  <li>Begin with arms at your sides</li>
                  <li>Raise both arms out to the sides and up above your head</li>
                  <li>Lower arms back to starting position</li>
                  <li>Keep your movements controlled and smooth</li>
                </ul>
              )}
            </div>
          </div>
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

export default ExerciseTracker;