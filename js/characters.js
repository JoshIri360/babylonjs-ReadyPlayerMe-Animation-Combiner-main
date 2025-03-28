// Characters.js - Handles character selection and video compilation

// Character variables
let availableCharacters = [];
let selectedCharacters = [];
let currentCharacterIndex = -1;
let isPlayingCompilation = false;
let currentZoomAnimation = null;
let current360PanAnimation = null;
let isRecording360Pan = false;

// Load selected characters from localStorage
function loadSelectedCharacters() {
  const saved = localStorage.getItem("selectedCharacters");
  if (saved) {
    selectedCharacters = JSON.parse(saved);
  }
}

// Save selected characters to localStorage
function saveSelectedCharacters() {
  localStorage.setItem(
    "selectedCharacters",
    JSON.stringify(selectedCharacters)
  );
}

// Load available characters from the directory
function loadAvailableCharacters() {
  // This is a hardcoded list based on the ls output shown in the user's command
  // In a real application, you would dynamically load this list from the server
  availableCharacters = [
    { id: "barista", name: "Barista", filename: "barista.glb" },
    { id: "beardman", name: "Beard Man", filename: "beardman.glb" },
    { id: "businessman", name: "Business Man", filename: "businessman.glb" },
    { id: "caretaker", name: "Caretaker", filename: "caretaker.glb" },
    { id: "colleague", name: "Colleague", filename: "colleague.glb" },
    { id: "driver", name: "Driver", filename: "driver.glb" },
    { id: "event_staff", name: "Event Staff", filename: "event_staff.glb" },
    { id: "guardian", name: "Guardian", filename: "guardian.glb" },
    { id: "informant", name: "Informant", filename: "informant.glb" },
    { id: "jordan", name: "Jordan", filename: "jordan.glb" },
    { id: "lawyer", name: "Lawyer", filename: "lawyer.glb" },
    { id: "librarian", name: "Librarian", filename: "librarian.glb" },
    { id: "protagonist2", name: "Protagonist 2", filename: "protagonist2.glb" },
  ];

  if (window.UIModule) {
    window.UIModule.populateCharacterList();
  }
}

// Add character to selection
function addCharacterToSelection(character) {
  if (!selectedCharacters.some((c) => c.id === character.id)) {
    selectedCharacters.push(character);
    saveSelectedCharacters();
    if (window.UIModule) {
      window.UIModule.populateCharacterList();
    }
  }
}

// Remove character from selection
function removeCharacterFromSelection(character) {
  selectedCharacters = selectedCharacters.filter((c) => c.id !== character.id);
  saveSelectedCharacters();
  if (window.UIModule) {
    window.UIModule.populateCharacterList();
  }
}

// Preview a character by loading its model
function previewCharacter(character) {
  // Stop any ongoing compilation or animation
  stopVideoCompilation();
  stop360PanAnimation();

  // Load the character model
  loadCharacterModel(character);
}

// Load a specific character model
function loadCharacterModel(character, callback = null) {
  // Show loading screen
  document.getElementById("loadingDiv").style.display = "flex";

  // Dispose current character if exists
  const player = window.AnimationModule.getPlayer();
  if (player) {
    player.dispose();
  }

  // Load the new character model
  window.AnimationModule.importModel(`characters/${character.filename}`, callback);
}

// Update the create video button state based on selection
function updateCreateVideoButtonState() {
  const createVideoBtn = document.getElementById("create-video-btn");
  if (createVideoBtn) {
    createVideoBtn.disabled = selectedCharacters.length === 0;
  }
}

// Start the video compilation process
function startVideoCompilation() {
  if (selectedCharacters.length === 0) return;
  
  isPlayingCompilation = true;
  currentCharacterIndex = -1;
  
  // Disable UI controls during the compilation
  const createVideoBtn = document.getElementById("create-video-btn");
  if (createVideoBtn) {
    createVideoBtn.disabled = true;
    createVideoBtn.textContent = "Compilation Playing...";
  }
  
  // Start the compilation with the first character
  nextCharacterInCompilation();
}

// Stop the video compilation process
function stopVideoCompilation() {
  if (!isPlayingCompilation) return;
  
  isPlayingCompilation = false;
  currentCharacterIndex = -1;
  
  // If there's an active zoom animation, stop it
  if (currentZoomAnimation) {
    const scene = window.SceneModule.getScene();
    scene.stopAnimation(window.SceneModule.getCamera());
    currentZoomAnimation = null;
  }
  
  // Reset camera position
  window.SceneModule.resetCamera();
  
  // Re-enable UI controls
  const createVideoBtn = document.getElementById("create-video-btn");
  if (createVideoBtn) {
    createVideoBtn.disabled = selectedCharacters.length === 0;
    createVideoBtn.textContent = "Create Video Compilation";
  }
}

// Move to the next character in the compilation
function nextCharacterInCompilation() {
  if (!isPlayingCompilation) return;
  
  currentCharacterIndex++;
  
  // If we've gone through all characters, end the compilation
  if (currentCharacterIndex >= selectedCharacters.length) {
    stopVideoCompilation();
    return;
  }
  
  // Load the next character
  const character = selectedCharacters[currentCharacterIndex];
  loadCharacterModel(character, () => {
    // After character is loaded, perform the zoom animation
    performZoomAnimation();
  });
}

// Perform the zoom animation for dramatic effect
function performZoomAnimation() {
  if (!isPlayingCompilation) return;
  
  const scene = window.SceneModule.getScene();
  const camera = window.SceneModule.getCamera();
  
  // Reset camera position first
  window.SceneModule.resetCamera();
  
  // Store initial camera values
  const initialAlpha = camera.alpha;
  const initialBeta = camera.beta;
  const initialRadius = camera.radius;
  
  // Target zoom values (close-up face shot)
  const targetAlpha = initialAlpha;
  const targetBeta = Math.PI / 3; // Slightly above eye level
  const targetRadius = 1.5; // Close to the face
  
  // Create animation for alpha (horizontal rotation)
  const alphaAnimation = new BABYLON.Animation(
    "zoomAlpha",
    "alpha",
    30,
    BABYLON.Animation.ANIMATIONTYPE_FLOAT,
    BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
  );
  
  // Create animation for beta (vertical angle)
  const betaAnimation = new BABYLON.Animation(
    "zoomBeta",
    "beta",
    30,
    BABYLON.Animation.ANIMATIONTYPE_FLOAT,
    BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
  );
  
  // Create animation for radius (distance)
  const radiusAnimation = new BABYLON.Animation(
    "zoomRadius",
    "radius",
    30,
    BABYLON.Animation.ANIMATIONTYPE_FLOAT,
    BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
  );
  
  // Define keyframes
  const keyFrames = {
    alpha: [
      { frame: 0, value: initialAlpha },
      { frame: 30, value: targetAlpha }
    ],
    beta: [
      { frame: 0, value: initialBeta },
      { frame: 30, value: targetBeta }
    ],
    radius: [
      { frame: 0, value: initialRadius },
      { frame: 30, value: targetRadius },
      { frame: 60, value: initialRadius } // Zoom back out
    ]
  };
  
  // Set keyframes to animations
  alphaAnimation.setKeys(keyFrames.alpha);
  betaAnimation.setKeys(keyFrames.beta);
  radiusAnimation.setKeys(keyFrames.radius);
  
  // Add easing functions for smoother animation
  const easingFunction = new BABYLON.QuadraticEase();
  easingFunction.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEINOUT);
  
  alphaAnimation.setEasingFunction(easingFunction);
  betaAnimation.setEasingFunction(easingFunction);
  radiusAnimation.setEasingFunction(easingFunction);
  
  // Add animations to camera
  camera.animations = [alphaAnimation, betaAnimation, radiusAnimation];
  
  // Start animations and track them for cancellation if needed
  currentZoomAnimation = scene.beginAnimation(
    camera,
    0,
    60,
    false,
    1.0,
    () => {
      // Animation complete - move to next character after a short delay
      currentZoomAnimation = null;
      setTimeout(() => {
        nextCharacterInCompilation();
      }, 500); // Short delay between characters
    }
  );
}

// Start a 360° pan animation with export to MP4
function start360PanAnimation(animation, duration = 15) {
  // If already recording, don't start again
  if (isRecording360Pan || window.VideoModule?.isRecording()) return;
  
  isRecording360Pan = true;
  
  // Play the selected animation if provided
  if (animation) {
    window.AnimationModule.playAnimation(animation);
  }
  
  // Show recording indicator
  const infoText = document.getElementById("info-text");
  const originalInfoText = infoText.innerHTML;
  
  // Create progress display
  const progressContainer = document.createElement("div");
  progressContainer.id = "recording-progress-container";
  progressContainer.style.position = "absolute";
  progressContainer.style.top = "50%";
  progressContainer.style.left = "50%";
  progressContainer.style.transform = "translate(-50%, -50%)";
  progressContainer.style.padding = "20px";
  progressContainer.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
  progressContainer.style.borderRadius = "10px";
  progressContainer.style.color = "white";
  progressContainer.style.zIndex = "1000";
  progressContainer.style.display = "flex";
  progressContainer.style.flexDirection = "column";
  progressContainer.style.alignItems = "center";
  progressContainer.style.gap = "10px";
  
  const progressText = document.createElement("div");
  progressText.textContent = "Recording 360° animation video...";
  
  const progressNoteText = document.createElement("div");
  progressNoteText.style.fontSize = "12px";
  progressNoteText.style.opacity = "0.8";
  progressNoteText.style.marginTop = "5px";
  progressNoteText.textContent = "A WebM video will be created automatically when complete";
  
  const progressBarContainer = document.createElement("div");
  progressBarContainer.style.width = "300px";
  progressBarContainer.style.height = "20px";
  progressBarContainer.style.backgroundColor = "rgba(255, 255, 255, 0.2)";
  progressBarContainer.style.borderRadius = "10px";
  progressBarContainer.style.overflow = "hidden";
  
  const progressBar = document.createElement("div");
  progressBar.style.width = "0%";
  progressBar.style.height = "100%";
  progressBar.style.backgroundColor = "#4CAF50";
  progressBar.style.transition = "width 0.3s";
  
  progressBarContainer.appendChild(progressBar);
  progressContainer.appendChild(progressText);
  progressContainer.appendChild(progressNoteText);
  progressContainer.appendChild(progressBarContainer);
  document.body.appendChild(progressContainer);
  
  // Progress update callback function
  const updateProgress = (progress, message) => {
    progressBar.style.width = `${progress * 100}%`;
    if (message) {
      progressText.textContent = message;
    }
    
    // Remove progress container when done (progress = 0)
    if (progress === 0) {
      if (document.body.contains(progressContainer)) {
        document.body.removeChild(progressContainer);
      }
      isRecording360Pan = false;
      infoText.innerHTML = originalInfoText;
    }
  };
  
  // Perform the 360° pan animation
  perform360PanAnimation(animation, duration, (cameraAnimation) => {
    // Start recording when camera animation begins
    current360PanAnimation = cameraAnimation;
    
    // Start the video recording
    window.VideoModule.startRecording(animation, duration, updateProgress);
  });
}

// Stop ongoing 360° pan animation
function stop360PanAnimation() {
  if (!isRecording360Pan) return;
  
  isRecording360Pan = false;
  
  // Stop the camera animation
  if (current360PanAnimation) {
    const scene = window.SceneModule.getScene();
    scene.stopAnimation(window.SceneModule.getCamera());
    current360PanAnimation = null;
  }
  
  // Reset camera
  window.SceneModule.resetCamera();
  
  // Stop video recording if active
  if (window.VideoModule?.isRecording()) {
    window.VideoModule.stopRecording();
  }
  
  // Remove progress indicator if still present
  const progressContainer = document.getElementById("recording-progress-container");
  if (progressContainer && document.body.contains(progressContainer)) {
    document.body.removeChild(progressContainer);
  }
}

// Perform 360° pan animation around the character
function perform360PanAnimation(animation, duration = 10, callback) {
  const scene = window.SceneModule.getScene();
  const camera = window.SceneModule.getCamera();
  
  // Reset camera position first
  window.SceneModule.resetCamera();
  
  // Store initial camera values
  const initialAlpha = camera.alpha;
  const initialBeta = camera.beta;
  const initialRadius = camera.radius;
  
  // Target camera values for good view
  const targetBeta = Math.PI / 3; // Slightly above eye level
  const targetRadius = 5; // Distance that shows full character
  
  // Create animation for alpha (horizontal 360° rotation)
  const alphaAnimation = new BABYLON.Animation(
    "panAlpha",
    "alpha",
    60, // 60 fps
    BABYLON.Animation.ANIMATIONTYPE_FLOAT,
    BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
  );
  
  // Create animation for beta (vertical angle)
  const betaAnimation = new BABYLON.Animation(
    "panBeta",
    "beta",
    60,
    BABYLON.Animation.ANIMATIONTYPE_FLOAT,
    BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
  );
  
  // Create animation for radius (distance)
  const radiusAnimation = new BABYLON.Animation(
    "panRadius",
    "radius",
    60,
    BABYLON.Animation.ANIMATIONTYPE_FLOAT,
    BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
  );
  
  // Calculate number of frames based on duration (60 fps)
  const totalFrames = duration * 60;
  
  // Define keyframes for a complete 360° rotation
  const keyFrames = {
    alpha: [
      { frame: 0, value: initialAlpha },
      { frame: totalFrames, value: initialAlpha + Math.PI * 2 } // Full 360° rotation
    ],
    beta: [
      { frame: 0, value: initialBeta },
      { frame: totalFrames * 0.2, value: targetBeta }, // Smoothly move to target beta
      { frame: totalFrames * 0.8, value: targetBeta }, // Stay at target beta
      { frame: totalFrames, value: initialBeta } // Return to initial beta
    ],
    radius: [
      { frame: 0, value: initialRadius },
      { frame: totalFrames * 0.2, value: targetRadius }, // Smoothly zoom out
      { frame: totalFrames * 0.8, value: targetRadius }, // Stay at target radius
      { frame: totalFrames, value: initialRadius } // Return to initial radius
    ]
  };
  
  // Set keyframes to animations
  alphaAnimation.setKeys(keyFrames.alpha);
  betaAnimation.setKeys(keyFrames.beta);
  radiusAnimation.setKeys(keyFrames.radius);
  
  // Add easing functions for smoother animation
  const easingFunction = new BABYLON.SineEase();
  easingFunction.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEINOUT);
  
  betaAnimation.setEasingFunction(easingFunction);
  radiusAnimation.setEasingFunction(easingFunction);
  
  // Add animations to camera
  camera.animations = [alphaAnimation, betaAnimation, radiusAnimation];
  
  // Start animations and track them for cancellation if needed
  const cameraAnimation = scene.beginAnimation(
    camera,
    0,
    totalFrames,
    false,
    1.0,
    () => {
      // Animation complete
      current360PanAnimation = null;
      isRecording360Pan = false;
      
      // Reset camera position
      window.SceneModule.resetCamera();
    }
  );
  
  // Execute callback with animation object
  if (callback && typeof callback === 'function') {
    callback(cameraAnimation);
  }
  
  return cameraAnimation;
}

// Export the module
window.CharacterModule = {
  loadSelectedCharacters,
  saveSelectedCharacters,
  loadAvailableCharacters,
  addCharacterToSelection,
  removeCharacterFromSelection,
  previewCharacter,
  loadCharacterModel,
  updateCreateVideoButtonState,
  startVideoCompilation,
  stopVideoCompilation,
  start360PanAnimation,
  stop360PanAnimation,
  getAvailableCharacters: () => availableCharacters,
  getSelectedCharacters: () => selectedCharacters,
  isCompilationPlaying: () => isPlayingCompilation
}; 