// Scene.js - Handles scene, camera, lighting, and environment setup

// Initialize scene and environment variables
let scene;
let camera;
let dirLight;
let hemiLight;
let shadowGenerator;
let ground;
let hdrTexture;
let hdrSkybox;
let hdrRotation = 0;

// Create Scene
function createScene(engine, canvas) {
  canvas = document.getElementById("renderCanvas");
  engine.clear(new BABYLON.Color3(0, 0, 0), true, true);
  scene = new BABYLON.Scene(engine);
  return scene;
}

// Create ArcRotateCamera
function createCamera(canvas) {
  camera = new BABYLON.ArcRotateCamera(
    "camera",
    BABYLON.Tools.ToRadians(-90),
    BABYLON.Tools.ToRadians(65),
    6,
    BABYLON.Vector3.Zero(),
    scene
  );
  
  camera.position.z = 10;
  camera.setTarget(new BABYLON.Vector3(0, 1, 0));
  camera.allowUpsideDown = false;
  camera.panningSensibility = 0;
  camera.lowerRadiusLimit = 2;
  camera.upperRadiusLimit = 16;
  camera.lowerBetaLimit = 0.75;
  camera.upperBetaLimit = Math.PI / 2;
  camera.panningSensibility = 0;
  camera.pinchDeltaPercentage = 0.0005;
  camera.wheelPrecision = 60;
  camera.useBouncingBehavior = false;
  camera.useAutoRotationBehavior = true;
  camera.autoRotationBehavior.idleRotationSpeed = 0.15;
  camera.radius = 5;
  camera.attachControl(canvas, true);
  
  return camera;
}

// Initialize lighting
function setupLighting() {
  // Create directional light
  dirLight = new BABYLON.DirectionalLight(
    "dirLight",
    new BABYLON.Vector3(0, 0, 0),
    scene
  );
  dirLight.intensity = 1.5;
  dirLight.position = new BABYLON.Vector3(0, 30, 10);
  dirLight.direction = new BABYLON.Vector3(-2, -4, -5);
  
  // Create hemispheric light
  hemiLight = new BABYLON.HemisphericLight(
    "hemiLight",
    new BABYLON.Vector3(0, 1, 0),
    scene
  );
  hemiLight.intensity = 0.1;
  
  // Create shadow generator
  shadowGenerator = new BABYLON.ShadowGenerator(2048, dirLight, true);
  shadowGenerator.darkness = 0.1;
  shadowGenerator.bias = 0.00001;
  shadowGenerator.useBlurExponentialShadowMap = true;
  
  return { dirLight, hemiLight, shadowGenerator };
}

// Create ground
function setupGround() {
  ground = BABYLON.MeshBuilder.CreateCylinder(
    "ground",
    { diameter: 7, height: 0.2, tessellation: 80 },
    scene
  );
  ground.position.y = -0.1;
  ground.isPickable = false;
  
  const groundMat = new BABYLON.PBRMaterial("groundMaterial", scene);
  groundMat.albedoColor = new BABYLON.Color3(0.95, 0.95, 0.95);
  groundMat.roughness = 0.15;
  groundMat.metallic = 0;
  groundMat.specularIntensity = 0;
  ground.material = groundMat;
  ground.receiveShadows = true;
  
  return ground;
}

// Set up environment lighting
function setLighting() {
  hdrTexture = BABYLON.CubeTexture.CreateFromPrefilteredData(
    "./resources/env/environment_19.env",
    scene
  );
  hdrTexture.rotationY = BABYLON.Tools.ToRadians(hdrRotation);
  hdrSkybox = BABYLON.MeshBuilder.CreateBox("skybox", { size: 1024 }, scene);
  const hdrSkyboxMaterial = new BABYLON.PBRMaterial("skybox", scene);
  hdrSkyboxMaterial.backFaceCulling = false;
  hdrSkyboxMaterial.reflectionTexture = hdrTexture.clone();
  hdrSkyboxMaterial.reflectionTexture.coordinatesMode =
    BABYLON.Texture.SKYBOX_MODE;
  hdrSkyboxMaterial.microSurface = 0.4;
  hdrSkyboxMaterial.disableLighting = true;
  hdrSkybox.material = hdrSkyboxMaterial;
  hdrSkybox.infiniteDistance = true;
}

// Apply shadows to meshes
function setShadows(meshes) {
  if (meshes) {
    // Apply to specific meshes
    meshes.forEach(function (mesh) {
      if (mesh.name != "skybox" && mesh.name != "ground") {
        shadowGenerator.addShadowCaster(mesh);
      }
    });
  } else {
    // Apply to all scene meshes
    scene.meshes.forEach(function (mesh) {
      if (mesh.name != "skybox" && mesh.name != "ground") {
        shadowGenerator.addShadowCaster(mesh);
      }
    });
  }
}

// Apply reflections to materials
function setReflections() {
  scene.materials.forEach(function (material) {
    if (material.name != "skybox") {
      material.reflectionTexture = hdrTexture;
      material.reflectionTexture.level = 0.9;
      material.environmentIntensity = 0.7;
      material.disableLighting = false;
    }
  });
}

// Reset camera to default position
function resetCamera() {
  camera.alpha = BABYLON.Tools.ToRadians(-90);
  camera.beta = BABYLON.Tools.ToRadians(65);
  camera.radius = 6;
  camera.target = BABYLON.Vector3.Zero();
}

// Export the module
window.SceneModule = {
  createScene,
  createCamera,
  setupLighting,
  setupGround,
  setLighting,
  setShadows,
  setReflections,
  resetCamera,
  getCamera: () => camera,
  getScene: () => scene,
  getShadowGenerator: () => shadowGenerator
}; 