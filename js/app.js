// App.js - Main application entry point

// Global BabylonJS Variables
var canvas;
var engine;
// Don't redeclare 'scene' as it's already defined in scene.js

// On Document Loaded - Start App
document.addEventListener("DOMContentLoaded", startApp);

// Application entry point
function startApp() {
  // Initialize canvas and engine
  canvas = document.getElementById("renderCanvas");
  engine = new BABYLON.Engine(canvas, true, { stencil: false }, true);
  
  // Create scene
  const scene = window.SceneModule.createScene(engine, canvas);
  
  // Set render loop
  engine.runRenderLoop(() => {
    scene.render();
  });
  
  // Handle window resize
  window.addEventListener("resize", () => {
    engine.resize();
  });
  
  // Initialize scene components
  initializeScene();
  
  // Load saved data
  window.AnimationModule.loadAnimationNames();
  window.CharacterModule.loadSelectedCharacters();
  
  // Initialize UI
  window.UIModule.initializeUI();
  
  // Load default model and animations
  // Load one of your character models instead
window.AnimationModule.importAnimationsAndModel("characters/barista.glb");
  
  // Load available character list
  window.CharacterModule.loadAvailableCharacters();
  
  // Uncomment to enable debug layer
  // scene.debugLayer.show({embedMode: true});
}

// Initialize scene with camera, lights, and ground
function initializeScene() {
  // Create camera
  const camera = window.SceneModule.createCamera(canvas);
  
  // Setup lighting
  const { dirLight, hemiLight, shadowGenerator } = window.SceneModule.setupLighting();
  
  // Create ground
  const ground = window.SceneModule.setupGround();
  
  // Set environment lighting
  window.SceneModule.setLighting();
}

// Helper function for random animations (connected to UI button)
function randomAnimation() {
  window.AnimationModule.randomAnimation();
}

// Export animation names (connected to UI button)
function exportAnimationNames() {
  window.UIModule.exportAnimationNames();
}

// Workaround to trigger zoom animation when model is loaded during compilation
const originalHideLoadingView = window.UIModule.hideLoadingView;
window.UIModule.hideLoadingView = function() {
  originalHideLoadingView();
  
  // If we're in compilation mode, let the model settle before continuing
  if (window.CharacterModule.isCompilationPlaying()) {
    // The actual zoom animation is triggered by the callback in loadCharacterModel
  }
}; 