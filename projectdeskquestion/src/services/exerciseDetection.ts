import * as poseDetection from '@tensorflow-models/pose-detection';
import { getKeypoint, calculateAngle, calculateDistance, isPoseValid } from './poseDetection';

// Interface for exercise detection state
export interface ExerciseState {
  count: number;
  feedback: string;
  phase: 'up' | 'down' | 'neutral';
  timer: number;
  isInPosition: boolean;
}

// Initialize the state for an exercise
export const initExerciseState = (): ExerciseState => ({
  count: 0,
  feedback: 'Get ready...',
  phase: 'neutral',
  timer: 0,
  isInPosition: false,
});

// Push-up detection logic
export const detectPushup = (
  pose: poseDetection.Pose | null,
  prevState: ExerciseState
): ExerciseState => {
  if (!isPoseValid(pose)) {
    return {
      ...prevState,
      feedback: 'Position yourself so your shoulders and arms are visible'
    };
  }

  const leftShoulder = getKeypoint(pose, 'left_shoulder');
  const rightShoulder = getKeypoint(pose, 'right_shoulder');
  const leftElbow = getKeypoint(pose, 'left_elbow');
  const rightElbow = getKeypoint(pose, 'right_elbow');
  const leftWrist = getKeypoint(pose, 'left_wrist');
  const rightWrist = getKeypoint(pose, 'right_wrist');

  // Calculate angles
  const leftElbowAngle = calculateAngle(leftShoulder, leftElbow, leftWrist);
  const rightElbowAngle = calculateAngle(rightShoulder, rightElbow, rightWrist);

  // Use the average of both angles if both are detected
  let elbowAngle = 180;
  let anglesDetected = 0;
  
  if (leftElbowAngle !== null) {
    elbowAngle = leftElbowAngle;
    anglesDetected++;
  }
  
  if (rightElbowAngle !== null) {
    elbowAngle = anglesDetected === 1 ? rightElbowAngle : (elbowAngle + rightElbowAngle) / 2;
    anglesDetected++;
  }

  if (anglesDetected === 0) {
    return {
      ...prevState,
      feedback: 'Cannot detect elbows. Please adjust position.'
    };
  }

  let newState = { ...prevState };

  // Check phases
  if (elbowAngle > 160 && prevState.phase === 'down') {
    // Completed a push-up (moved from down to up)
    newState.count = prevState.count + 1;
    newState.phase = 'up';
    newState.feedback = 'Good job! Keep going!';
  } else if (elbowAngle < 90 && prevState.phase !== 'down') {
    // Moving down
    newState.phase = 'down';
    newState.feedback = 'Now push up!';
  } else if (elbowAngle > 160 && prevState.phase !== 'up' && prevState.phase !== 'down') {
    // Starting position
    newState.phase = 'up';
    newState.feedback = 'Lower your body by bending your elbows';
  } else if (elbowAngle > 90 && elbowAngle < 160) {
    newState.feedback = 'Keep going!';
  }

  return newState;
};

// Squat detection logic
export const detectSquat = (
  pose: poseDetection.Pose | null,
  prevState: ExerciseState
): ExerciseState => {
  if (!isPoseValid(pose)) {
    return {
      ...prevState,
      feedback: 'Position yourself so your hips and knees are visible'
    };
  }

  const leftHip = getKeypoint(pose, 'left_hip');
  const rightHip = getKeypoint(pose, 'right_hip');
  const leftKnee = getKeypoint(pose, 'left_knee');
  const rightKnee = getKeypoint(pose, 'right_knee');
  const leftAnkle = getKeypoint(pose, 'left_ankle');
  const rightAnkle = getKeypoint(pose, 'right_ankle');

  // Calculate angles
  const leftKneeAngle = calculateAngle(leftHip, leftKnee, leftAnkle);
  const rightKneeAngle = calculateAngle(rightHip, rightKnee, rightAnkle);

  // Use the average of both angles if both are detected
  let kneeAngle = 180;
  let anglesDetected = 0;
  
  if (leftKneeAngle !== null) {
    kneeAngle = leftKneeAngle;
    anglesDetected++;
  }
  
  if (rightKneeAngle !== null) {
    kneeAngle = anglesDetected === 1 ? rightKneeAngle : (kneeAngle + rightKneeAngle) / 2;
    anglesDetected++;
  }

  if (anglesDetected === 0) {
    return {
      ...prevState,
      feedback: 'Cannot detect knees. Please adjust position.'
    };
  }

  let newState = { ...prevState };

  // Check phases
  if (kneeAngle > 160 && prevState.phase === 'down') {
    // Completed a squat (moved from down to up)
    newState.count = prevState.count + 1;
    newState.phase = 'up';
    newState.feedback = 'Good job! Keep going!';
  } else if (kneeAngle < 120 && prevState.phase !== 'down') {
    // Moving down
    newState.phase = 'down';
    newState.feedback = 'Now stand up!';
  } else if (kneeAngle > 160 && prevState.phase !== 'up' && prevState.phase !== 'down') {
    // Starting position
    newState.phase = 'up';
    newState.feedback = 'Bend your knees to squat down';
  } else if (kneeAngle >= 120 && kneeAngle <= 160) {
    newState.feedback = 'Keep going!';
  }

  return newState;
};

// Jumping Jack detection logic
export const detectJumpingJack = (
  pose: poseDetection.Pose | null,
  prevState: ExerciseState
): ExerciseState => {
  if (!isPoseValid(pose)) {
    return {
      ...prevState,
      feedback: 'Position yourself so your full body is visible'
    };
  }

  const leftShoulder = getKeypoint(pose, 'left_shoulder');
  const rightShoulder = getKeypoint(pose, 'right_shoulder');
  const leftWrist = getKeypoint(pose, 'left_wrist');
  const rightWrist = getKeypoint(pose, 'right_wrist');
  const leftHip = getKeypoint(pose, 'left_hip');
  const rightHip = getKeypoint(pose, 'right_hip');
  const leftAnkle = getKeypoint(pose, 'left_ankle');
  const rightAnkle = getKeypoint(pose, 'right_ankle');

  // Calculate distances between arms and legs
  const shouldersDistance = calculateDistance(leftShoulder, rightShoulder);
  const wristsDistance = calculateDistance(leftWrist, rightWrist);
  const anklesDistance = calculateDistance(leftAnkle, rightAnkle);
  const hipsDistance = calculateDistance(leftHip, rightHip);

  if (!shouldersDistance || !wristsDistance || !hipsDistance || !anklesDistance) {
    return {
      ...prevState,
      feedback: 'Cannot detect limbs. Please adjust position.'
    };
  }

  // Normalize distances relative to shoulder width to account for different body sizes
  const normalizedWristsDistance = wristsDistance / shouldersDistance;
  const normalizedAnklesDistance = anklesDistance / hipsDistance;

  let newState = { ...prevState };

  // Check phases - arms and legs together is "down", spread apart is "up"
  if (normalizedWristsDistance > 2.5 && normalizedAnklesDistance > 2.0 && prevState.phase === 'down') {
    // Completed a jumping jack (moved from down to up)
    newState.count = prevState.count + 1;
    newState.phase = 'up';
    newState.feedback = 'Great! Now bring arms and legs back';
  } else if (normalizedWristsDistance < 1.5 && normalizedAnklesDistance < 1.5 && prevState.phase === 'up') {
    // Arms and legs back together
    newState.phase = 'down';
    newState.feedback = 'Jump and spread arms!';
  } else if (normalizedWristsDistance < 1.5 && normalizedAnklesDistance < 1.5 && prevState.phase !== 'down') {
    // Starting position
    newState.phase = 'down';
    newState.feedback = 'Jump and spread your arms and legs';
  } else if (normalizedWristsDistance > 2.5 && normalizedAnklesDistance > 2.0 && prevState.phase !== 'up') {
    // Arms and legs spread
    newState.phase = 'up';
    newState.feedback = 'Bring arms and legs back together';
  }

  return newState;
};

// Plank detection logic
export const detectPlank = (
  pose: poseDetection.Pose | null,
  prevState: ExerciseState
): ExerciseState => {
  if (!isPoseValid(pose)) {
    return {
      ...prevState,
      isInPosition: false,
      feedback: 'Position yourself in a plank pose'
    };
  }

  const leftShoulder = getKeypoint(pose, 'left_shoulder');
  const rightShoulder = getKeypoint(pose, 'right_shoulder');
  const leftHip = getKeypoint(pose, 'left_hip');
  const rightHip = getKeypoint(pose, 'right_hip');
  const leftAnkle = getKeypoint(pose, 'left_ankle');
  const rightAnkle = getKeypoint(pose, 'right_ankle');

  // Check if body is straight by calculating angles
  const leftBodyAngle = calculateAngle(leftShoulder, leftHip, leftAnkle);
  const rightBodyAngle = calculateAngle(rightShoulder, rightHip, rightAnkle);

  let bodyAngle = 180;
  let anglesDetected = 0;
  
  if (leftBodyAngle !== null) {
    bodyAngle = leftBodyAngle;
    anglesDetected++;
  }
  
  if (rightBodyAngle !== null) {
    bodyAngle = anglesDetected === 1 ? rightBodyAngle : (bodyAngle + rightBodyAngle) / 2;
    anglesDetected++;
  }

  if (anglesDetected === 0) {
    return {
      ...prevState,
      isInPosition: false,
      feedback: 'Cannot detect body alignment. Please adjust position.'
    };
  }

  let newState = { ...prevState };

  // Check if in plank position (body should be relatively straight)
  if (bodyAngle > 160 || bodyAngle < 20) {
    // In proper plank position
    newState.isInPosition = true;
    
    // Increment timer if in position
    newState.timer = prevState.timer + 1;
    
    if (newState.timer % 30 === 0) {
      // Update count every 30 frames (approx. 1 second at 30fps)
      newState.count = prevState.timer / 30;
    }
    
    // Feedback based on duration
    if (newState.timer < 90) {
      newState.feedback = 'Hold the plank position';
    } else {
      newState.feedback = 'Great job! Keep holding';
    }
  } else {
    // Not in proper plank position
    newState.isInPosition = false;
    newState.feedback = 'Keep your body straight in plank position';
  }

  return newState;
};

// Arm Raises detection logic
export const detectArmRaises = (
  pose: poseDetection.Pose | null,
  prevState: ExerciseState
): ExerciseState => {
  if (!isPoseValid(pose)) {
    return {
      ...prevState,
      feedback: 'Position yourself so your arms and shoulders are visible'
    };
  }

  const leftShoulder = getKeypoint(pose, 'left_shoulder');
  const rightShoulder = getKeypoint(pose, 'right_shoulder');
  const leftElbow = getKeypoint(pose, 'left_elbow');
  const rightElbow = getKeypoint(pose, 'right_elbow');
  const leftWrist = getKeypoint(pose, 'left_wrist');
  const rightWrist = getKeypoint(pose, 'right_wrist');

  if (!leftShoulder || !rightShoulder || !leftWrist || !rightWrist) {
    return {
      ...prevState,
      feedback: 'Cannot detect shoulders and arms. Please adjust position.'
    };
  }

  // Check if hands are above shoulders (y-coordinate is smaller)
  const leftHandAboveShoulder = leftWrist.y < leftShoulder.y - 20;
  const rightHandAboveShoulder = rightWrist.y < rightShoulder.y - 20;
  const handsAboveShoulders = leftHandAboveShoulder || rightHandAboveShoulder;
  
  // Check if hands are below shoulders
  const handsBelowShoulders = leftWrist.y > leftShoulder.y + 20 && rightWrist.y > rightShoulder.y + 20;

  let newState = { ...prevState };

  // Check phases
  if (handsAboveShoulders && prevState.phase === 'down') {
    // Completed an arm raise (moved from down to up)
    newState.count = prevState.count + 1;
    newState.phase = 'up';
    newState.feedback = 'Good! Now lower your arms';
  } else if (handsBelowShoulders && prevState.phase === 'up') {
    // Arms lowered
    newState.phase = 'down';
    newState.feedback = 'Raise your arms again';
  } else if (handsBelowShoulders && prevState.phase !== 'down') {
    // Starting position
    newState.phase = 'down';
    newState.feedback = 'Raise your arms above your shoulders';
  } else if (handsAboveShoulders && prevState.phase !== 'up') {
    // Arms raised
    newState.phase = 'up';
    newState.feedback = 'Good! Now lower your arms';
  }

  return newState;
};