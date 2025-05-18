import * as poseDetection from '@tensorflow-models/pose-detection';
import '@tensorflow/tfjs-backend-webgl';

// Model and detector constants
const modelType = poseDetection.SupportedModels.MoveNet;
const modelConfig = {
  modelType: 'thunder', // or 'lightning' for faster but less accurate detection
  enableSmoothing: true,
};

// Initialize the detector
let detector: poseDetection.PoseDetector | null = null;

export const initPoseDetection = async (): Promise<poseDetection.PoseDetector> => {
  if (!detector) {
    await tf.ready();
    await tf.setBackend('webgl');
    detector = await poseDetection.createDetector(modelType, modelConfig);
  }
  return detector;
};

export const detectPose = async (
  video: HTMLVideoElement | null
): Promise<poseDetection.Pose[] | null> => {
  if (!detector || !video) return null;
  
  try {
    const poses = await detector.estimatePoses(video, {
      flipHorizontal: false,
      maxPoses: 1,
    });
    
    return poses;
  } catch (error) {
    console.error('Error detecting pose:', error);
    return null;
  }
};

// Helper functions to get specific keypoints
export const getKeypoint = (
  pose: poseDetection.Pose | null, 
  name: string
): { x: number; y: number; score?: number } | null => {
  if (!pose || !pose.keypoints) return null;
  
  const keypoint = pose.keypoints.find(kp => kp.name === name);
  return keypoint || null;
};

// Calculate angle between three points (in degrees)
export const calculateAngle = (
  p1: { x: number; y: number } | null,
  p2: { x: number; y: number } | null,
  p3: { x: number; y: number } | null
): number | null => {
  if (!p1 || !p2 || !p3) return null;
  
  const radians = Math.atan2(p3.y - p2.y, p3.x - p2.x) - 
                 Math.atan2(p1.y - p2.y, p1.x - p2.x);
  
  let angle = Math.abs(radians * 180.0 / Math.PI);
  
  if (angle > 180.0) {
    angle = 360.0 - angle;
  }
  
  return angle;
};

// Calculate distance between two points
export const calculateDistance = (
  p1: { x: number; y: number } | null,
  p2: { x: number; y: number } | null
): number | null => {
  if (!p1 || !p2) return null;
  
  return Math.sqrt(
    Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2)
  );
};

// Check if pose exists and has good confidence
export const isPoseValid = (pose: poseDetection.Pose | null): boolean => {
  if (!pose || !pose.keypoints) return false;
  
  // Calculate average confidence score of keypoints
  const confidenceSum = pose.keypoints.reduce((sum, keypoint) => {
    return sum + (keypoint.score || 0);
  }, 0);
  
  const avgConfidence = confidenceSum / pose.keypoints.length;
  return avgConfidence > 0.3; // Consider valid if average confidence > 30%
};

// Release the detector resources
export const disposePoseDetector = async (): Promise<void> => {
  if (detector) {
    detector.dispose();
    detector = null;
  }
};