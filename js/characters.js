// Characters.js - Handles character selection and video compilation

// Character variables
let availableCharacters = [];
let selectedCharacters = [];
let currentCharacterIndex = -1;
let isPlayingCompilation = false;
let currentZoomAnimation = null;

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
  // Stop any ongoing compilation
  stopVideoCompilation();

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
  getAvailableCharacters: () => availableCharacters,
  getSelectedCharacters: () => selectedCharacters,
  isCompilationPlaying: () => isPlayingCompilation
}; 