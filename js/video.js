// Video.js - Handles video recording and export functionality

// Animation and capture variables
let isRecording = false;
let mediaRecorder = null;
let recordedChunks = [];
let selectedAnimation = null;
let progressCallback = null;
let animationDuration = 0;
let recordingStartTime = 0;

// Start recording video
function startRecording(animation, duration, onProgress) {
  if (isRecording) return;
  
  selectedAnimation = animation;
  animationDuration = duration;
  progressCallback = onProgress;
  
  const canvas = document.getElementById("renderCanvas");
  
  try {
    // Create a media stream from the canvas
    const stream = canvas.captureStream(60); // 60 FPS
    
    // Configure the MediaRecorder with better quality
    const options = {
      mimeType: 'video/webm;codecs=vp9',
      videoBitsPerSecond: 5000000 // 5 Mbps for better quality
    };
    
    // Try to use the best available codec
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      options.mimeType = 'video/webm;codecs=vp8';
      
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options.mimeType = 'video/webm';
        
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
          options.mimeType = '';
        }
      }
    }
    
    // Create MediaRecorder
    mediaRecorder = new MediaRecorder(stream, options);
    
    // Set up event handlers
    mediaRecorder.ondataavailable = handleDataAvailable;
    mediaRecorder.onstop = handleStop;
    
    // Clear previous data
    recordedChunks = [];
    
    // Start recording
    mediaRecorder.start(100); // Capture in 100ms chunks
    isRecording = true;
    recordingStartTime = Date.now();
    
    // Update progress periodically
    updateRecordingProgress();
    
  } catch (error) {
    console.error("Failed to start recording:", error);
    alert("Could not start video recording. Please try a different browser.");
    
    if (progressCallback) {
      progressCallback(0, "Recording failed");
    }
  }
}

// Update recording progress
function updateRecordingProgress() {
  if (!isRecording) return;
  
  const elapsed = (Date.now() - recordingStartTime) / 1000;
  const progress = Math.min(elapsed / animationDuration, 1);
  
  if (progressCallback) {
    progressCallback(progress);
  }
  
  // Continue updating or stop if complete
  if (progress < 1) {
    requestAnimationFrame(updateRecordingProgress);
  } else {
    stopRecording();
  }
}

// Handle data available event
function handleDataAvailable(event) {
  if (event.data && event.data.size > 0) {
    recordedChunks.push(event.data);
  }
}

// Handle recording stop event
function handleStop() {
  // Get animation name for the file
  const animationName = selectedAnimation ? 
    (window.AnimationModule.getAnimationNameMap()[selectedAnimation.name] || selectedAnimation.name) : 
    'animation';
  
  const filename = `${animationName.replace(/[^\w\s]/gi, '')}_360_pan.webm`;
  
  // Update progress
  if (progressCallback) {
    progressCallback(0.9, 'Creating video file...');
  }
  
  try {
    // Create a blob from all chunks
    const blob = new Blob(recordedChunks, { type: 'video/webm' });
    const url = URL.createObjectURL(blob);
    
    // Create download link
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    
    // Clean up
    URL.revokeObjectURL(url);
    
    // Show success message
    if (progressCallback) {
      progressCallback(1, 'Video ready!');
      setTimeout(() => {
        progressCallback(0, '');
      }, 3000);
    }
  } catch (error) {
    console.error("Error creating video file:", error);
    if (progressCallback) {
      progressCallback(0, 'Error creating video');
      setTimeout(() => {
        progressCallback(0, '');
      }, 3000);
    }
  }
  
  // Reset recording state
  mediaRecorder = null;
  recordedChunks = [];
  isRecording = false;
}

// Stop recording and save the video
function stopRecording() {
  if (!isRecording || !mediaRecorder) return;
  
  // Update progress
  if (progressCallback) {
    progressCallback(0.8, 'Finalizing video...');
  }
  
  // Stop the media recorder - this will trigger the onstop event
  mediaRecorder.stop();
}

// Initialize video module
function initializeVideoModule() {
  // Check if MediaRecorder is available
  if (typeof MediaRecorder === 'undefined') {
    console.warn("MediaRecorder not supported in this browser. Video export may not work correctly.");
  } else {
    console.log("Video module initialized with MediaRecorder");
  }
}

// Export the module
window.VideoModule = {
  initializeVideoModule,
  startRecording,
  stopRecording,
  isRecording: () => isRecording
}; 