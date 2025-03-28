// Video.js - Handles video recording and export functionality

// Animation and capture variables
let isRecording = false;
let mediaRecorder = null;
let recordedChunks = [];
let selectedAnimation = null;
let progressCallback = null;
let animationDuration = 0;
let recordingStartTime = 0;
let ffmpegLoaded = false;
let ffmpeg = null;

// Initialize ffmpeg.wasm
async function initFFmpeg() {
  if (ffmpegLoaded) return;

  try {
    // Create a script element to load the local ffmpeg.wasm script
    const script = document.createElement('script');
    script.src = './resources/ffmpeg/ffmpeg.min.js';
    
    // Wait for the script to load
    await new Promise((resolve, reject) => {
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });

    // Initialize ffmpeg with local core files
    ffmpeg = FFmpeg.createFFmpeg({ 
      log: true,
      corePath: './resources/ffmpeg/ffmpeg-core.js'
    });
    
    await ffmpeg.load();
    ffmpegLoaded = true;
    console.log('FFmpeg loaded successfully');
    return true;
  } catch (error) {
    console.error('Failed to load FFmpeg:', error);
    return false;
  }
}

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
    
    // Configure the MediaRecorder
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
    
    // Attempt to load ffmpeg.wasm in background while recording
    initFFmpeg().then(success => {
      console.log("FFmpeg preloaded:", success);
    });
    
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
async function handleStop() {
  try {
    // Create WebM blob from recorded chunks
    const webmBlob = new Blob(recordedChunks, { type: 'video/webm' });
    
    // Get animation name for the file
    const animationName = selectedAnimation ? 
      (window.AnimationModule.getAnimationNameMap()[selectedAnimation.name] || selectedAnimation.name) : 
      'animation';
    
    const filename = `${animationName.replace(/[^\w\s]/gi, '')}_360_pan`;
    
    // Update progress
    if (progressCallback) {
      progressCallback(0.8, 'Creating video file...');
    }

    // Try to use ffmpeg to convert to MP4 if available
    if (ffmpegLoaded && ffmpeg) {
      try {
        // Update progress
        if (progressCallback) {
          progressCallback(0.85, 'Converting to MP4...');
        }
        
        // Convert WebM to MP4 using ffmpeg.wasm
        const { fetchFile } = FFmpeg;
        ffmpeg.FS('writeFile', 'input.webm', await fetchFile(webmBlob));
        
        // Run the conversion with optimal settings for web compatibility
        await ffmpeg.run(
          '-i', 'input.webm',
          '-c:v', 'libx264',
          '-preset', 'fast',
          '-crf', '23',
          '-pix_fmt', 'yuv420p',
          'output.mp4'
        );
        
        // Read the output MP4 file
        const data = ffmpeg.FS('readFile', 'output.mp4');
        const mp4Blob = new Blob([data.buffer], { type: 'video/mp4' });
        
        // Create download link for MP4
        downloadVideo(mp4Blob, `${filename}.mp4`);
        
        // Clean up
        ffmpeg.FS('unlink', 'input.webm');
        ffmpeg.FS('unlink', 'output.mp4');
      } catch (error) {
        console.error("Error converting to MP4:", error);
        // Fall back to WebM if conversion fails
        downloadVideo(webmBlob, `${filename}.webm`);
      }
    } else {
      // If ffmpeg is not available, just download the WebM
      console.log("FFmpeg not available, downloading WebM directly");
      downloadVideo(webmBlob, `${filename}.webm`);
    }
    
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

// Helper function to download a video blob
function downloadVideo(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
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
  // Try to preload ffmpeg.wasm
  initFFmpeg().then(success => {
    console.log("FFmpeg initialized:", success);
  });
}

// Export the module
window.VideoModule = {
  initializeVideoModule,
  startRecording,
  stopRecording,
  isRecording: () => isRecording
}; 