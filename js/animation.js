// Animation.js - Handles animation loading, playing, and management

// Animation variables
let currentAnimation;
let animationNameMap = {};
let animationCategories = {};
let animationsGLB = [];
let player;
let playerSkeleton;

// Initialize from localStorage
function loadAnimationNames() {
  const saved = localStorage.getItem("animationNames");
  if (saved) {
    animationNameMap = JSON.parse(saved);
  }
}

// Save to localStorage
function saveAnimationNames() {
  localStorage.setItem("animationNames", JSON.stringify(animationNameMap));
}

// Import Animations
function importAnimations(animation) {
  const scene = window.SceneModule.getScene();
  
  return BABYLON.SceneLoader.ImportMeshAsync(
    null,
    "./resources/models/animations/" + animation,
    null,
    scene
  )
    .then((result) => {
      result.meshes.forEach((element) => {
        if (element) element.dispose();
      });

      if (result.animationGroups && result.animationGroups.length > 0) {
        // Store the original path for later reference
        result.animationGroups[0].metadata = {
          originalPath: animation,
        };
        animationsGLB.push(result.animationGroups[0]);
      } else {
        console.error("No animation groups found in:", animation);
      }
    })
    .catch((error) => {
      console.error("Error loading animation: " + animation, error);
    });
}

// Setup Animations & Player
async function importAnimationsAndModel(model) {
  // Male animations
  // Idle animations
  await importAnimations("masculine/idle/M_Standing_Idle_Variations_002.glb");
  await importAnimations("masculine/idle/M_Standing_Idle_Variations_001.glb");
  await importAnimations("masculine/idle/M_Standing_Idle_001.glb");

  // Dance animations
  for (let index = 1; index <= 9; index++) {
    const indexStr = index < 10 ? `00${index}` : `0${index}`;
    await importAnimations(`masculine/dance/M_Dances_${indexStr}.glb`);
  }
  await importAnimations("masculine/dance/M_Dances_011.glb");

  // Expression animations - use correct format with 3 digits
  const maleExpressions = [
    "001", "002", "004", "005", "006", "007", "008", "009", "010",
    "011", "012", "013", "014", "015", "016", "017", "018"
  ];

  for (const num of maleExpressions) {
    await importAnimations(
      `masculine/expression/M_Standing_Expressions_${num}.glb`
    );
  }

  // Talking variations - use correct format with 3 digits
  for (let index = 1; index <= 10; index++) {
    const indexStr = index < 10 ? `00${index}` : `0${index}`;
    await importAnimations(
      `masculine/expression/M_Talking_Variations_${indexStr}.glb`
    );
  }

  // Locomotion animations - select a subset to not overwhelm
  const maleLocomotions = [
    "M_Walk_001.glb",
    "M_Run_001.glb",
    "M_Jog_001.glb",
    "M_Walk_Jump_001.glb",
    "M_Run_Jump_001.glb",
    "M_Walk_Backwards_001.glb",
    "M_Run_Backwards_002.glb",
  ];

  for (const anim of maleLocomotions) {
    await importAnimations(`masculine/locomotion/${anim}`);
  }

  // Female animations
  // Idle animations
  await importAnimations("femenine/idle/F_Standing_Idle_Variations_001.glb");
  await importAnimations("femenine/idle/F_Standing_Idle_001.glb");
  await importAnimations("femenine/idle/F_Standing_Idle_Variations_002.glb");

  // Dance animations
  const femaleDanceAnimations = [1, 4, 5, 6, 7];
  for (let index of femaleDanceAnimations) {
    const indexStr = index < 10 ? `00${index}` : `0${index}`;
    await importAnimations(`femenine/dance/F_Dances_${indexStr}.glb`);
  }

  // Expression and talking animations - use correct format with 3 digits
  for (let index = 1; index <= 6; index++) {
    const indexStr = index < 10 ? `00${index}` : `0${index}`;
    await importAnimations(
      `femenine/expression/F_Talking_Variations_${indexStr}.glb`
    );
  }

  // Locomotion animations - select a subset to not overwhelm
  const femaleLocomotions = [
    "F_Walk_002.glb",
    "F_Run_001.glb",
    "F_Jog_001.glb",
    "F_Walk_Jump_001.glb",
    "F_Run_Jump_001.glb",
    "F_Walk_Backwards_001.glb",
    "F_Run_Backwards_001.glb",
  ];

  for (const anim of femaleLocomotions) {
    await importAnimations(`femenine/locomotion/${anim}`);
  }

  importModel(model);
}

// Import Model
function importModel(model, callback = null) {
  const scene = window.SceneModule.getScene();
  
  // Determine if this is a character model or the default model
  const isCharacterModel = model.includes("characters/");
  const modelPath = isCharacterModel
    ? "./resources/models/"
    : "./resources/models/";

  BABYLON.SceneLoader.ImportMeshAsync(null, modelPath, model, scene)
    .then((result) => {
      player = result.meshes[0];
      player.name = "Character";

      var modelTransformNodes = player.getChildTransformNodes();

      // Keep track of successful and failed animations
      let successfulAnimations = 0;
      let failedAnimations = 0;

      // Clear existing animations
      scene.animationGroups.forEach((animation) => animation.dispose());
      scene.animationGroups = [];

      // Clone animations for all models, both default and character models
      animationsGLB.forEach((animation) => {
        try {
          // Clone the animation for the model
          const modelAnimationGroup = animation.clone(
            model.replace(".glb", "_") + animation.name,
            (oldTarget) => {
              return modelTransformNodes.find(
                (node) => node.name === oldTarget.name
              );
            }
          );

          // Copy metadata to the new animation
          if (animation.metadata) {
            modelAnimationGroup.metadata = { ...animation.metadata };
          }

          // Validate the animation
          if (modelAnimationGroup.targetedAnimations.length === 0) {
            console.warn(
              `Animation ${animation.name} has no targeted animations after cloning.`
            );
            failedAnimations++;
          } else {
            successfulAnimations++;
          }
        } catch (error) {
          console.error(
            `Failed to clone animation ${animation.name}:`,
            error
          );
          failedAnimations++;
        }
      });

      // Only dispose animations if this is the default model (not a character model)
      // This keeps animations available for other character models
      if (!isCharacterModel) {
        animationsGLB.forEach(animation => animation.dispose());
        animationsGLB = [];
      }

      // Merge Meshes
      window.SceneModule.setReflections();
      window.SceneModule.setShadows(result.meshes);

      // Play an animation if available
      if (scene.animationGroups.length > 0) {
        scene.animationGroups[0].play(true, 1.0);

        currentAnimation = scene.animationGroups[0];

        // Update UI with animation names
        if (window.UIModule) {
          window.UIModule.populateAnimationList();
          window.UIModule.updateCurrentAnimationInfo();
        }

        document.getElementById("info-text").innerHTML =
          "Current Animation<br>" +
          (animationNameMap[currentAnimation.name] || currentAnimation.name);
      } else {
        console.warn("No animations available for this model");
        document.getElementById("info-text").innerHTML =
          "No animations available<br>for this character";
      }

      window.UIModule.hideLoadingView();
      
      // If callback is provided, execute it
      if (callback && typeof callback === 'function') {
        callback();
      }
    })
    .catch((error) => {
      console.error(`Failed to load model ${model}:`, error);
      window.UIModule.hideLoadingView();
      alert(`Error loading model: ${model}`);
    });
}

// Random Number
function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Random Animation Function
let disableButton = false;
function randomAnimation() {
  if (disableButton) return;
  
  const scene = window.SceneModule.getScene();
  
  disableButton = true;
  setTimeout(() => {
    disableButton = false;
  }, 500);

  var randomNumber = getRandomInt(1, scene.animationGroups.length - 1);
  var newAnimation = scene.animationGroups[randomNumber];

  // Check if currentAnimation === newAnimation
  while (currentAnimation === newAnimation) {
    randomNumber = getRandomInt(1, scene.animationGroups.length - 1);
    newAnimation = scene.animationGroups[randomNumber];
  }

  scene.onBeforeRenderObservable.runCoroutineAsync(
    animationBlending(currentAnimation, 1.0, newAnimation, 1.0, true, 0.02)
  );

  const customName = animationNameMap[newAnimation.name] || newAnimation.name;
  document.getElementById(
    "info-text"
  ).innerHTML = `Current Animation<br><span class="text-wrap">${customName}</span>`;

  // Update UI
  if (window.UIModule) {
    window.UIModule.updateCurrentAnimationInfo();
    window.UIModule.updateActiveAnimationInList(newAnimation);
  }
}

// Animation Blending
function* animationBlending(
  fromAnim,
  fromAnimSpeedRatio,
  toAnim,
  toAnimSpeedRatio,
  repeat,
  speed
) {
  try {
    let currentWeight = 1;
    let newWeight = 0;
    fromAnim.stop();
    toAnim.play(repeat);
    fromAnim.speedRatio = fromAnimSpeedRatio;
    toAnim.speedRatio = toAnimSpeedRatio;
    while (newWeight < 1) {
      newWeight += speed;
      currentWeight -= speed;
      toAnim.setWeightForAllAnimatables(newWeight);
      fromAnim.setWeightForAllAnimatables(currentWeight);
      yield;
    }

    currentAnimation = toAnim;
    if (window.UIModule) {
      window.UIModule.updateCurrentAnimationInfo();
    }
  } catch (error) {
    console.error("Error during animation blending:", error);
    fromAnim.play(true); // Return to previous animation
    yield;
  }
}

// Play a selected animation
function playAnimation(animation) {
  const scene = window.SceneModule.getScene();
  
  if (currentAnimation === animation) return;

  try {
    // Test if animation is compatible by checking if it contains animatables for the character
    if (
      animation.targetedAnimations.length === 0 ||
      !animation.targetedAnimations[0].target
    ) {
      console.warn(
        `Animation ${animation.name} appears to be incompatible with the current character model.`
      );
      alert(
        `The animation "${animation.name}" is not compatible with this character model.`
      );
      return;
    }

    scene.onBeforeRenderObservable.runCoroutineAsync(
      animationBlending(currentAnimation, 1.0, animation, 1.0, true, 0.02)
    );

    const customName = animationNameMap[animation.name] || animation.name;
    document.getElementById(
      "info-text"
    ).innerHTML = `Current Animation<br><span class="text-wrap">${customName}</span>`;

    // Update UI
    if (window.UIModule) {
      window.UIModule.updateActiveAnimationInList(animation);
    }
  } catch (error) {
    console.error(`Error playing animation ${animation.name}:`, error);
    alert(`Could not play the animation: ${animation.name}`);
  }
}

// Determine animation category based on filename
function getAnimationCategory(filename) {
  if (!filename) return "Unknown";

  const lowerFilename = filename.toLowerCase();
  let gender = "Unknown";
  let type = "Other";

  // Determine gender
  if (
    lowerFilename.includes("_m_") ||
    lowerFilename.startsWith("m_") ||
    lowerFilename.includes("readyplayer2_m_")
  ) {
    gender = "Male";
  } else if (
    lowerFilename.includes("_f_") ||
    lowerFilename.startsWith("f_") ||
    lowerFilename.includes("readyplayer2_f_")
  ) {
    gender = "Female";
  }

  // Check if this animation has original path metadata
  const scene = window.SceneModule.getScene();
  const animation = scene.animationGroups.find((a) => a.name === filename);
  const originalPath = animation?.metadata?.originalPath || "";
  const lowerOriginalPath = originalPath.toLowerCase();

  // Check if it's from gestures directory
  if (lowerOriginalPath.includes("gestures/")) {
    return "Gesture";
  }

  // Determine type
  if (lowerFilename.includes("dance")) {
    type = "Dance";
  } else if (lowerFilename.includes("idle")) {
    type = "Idle";
  } else if (
    lowerFilename.includes("expression") ||
    lowerFilename.includes("talking")
  ) {
    type = "Expression";
  } else if (
    lowerFilename.includes("gestures/") ||
    lowerFilename.includes("nod") ||
    lowerFilename.includes("shake") ||
    lowerFilename.includes("gesture") ||
    lowerFilename.includes("cocky") ||
    lowerFilename.includes("angry") ||
    lowerFilename.includes("crying") ||
    lowerFilename.includes("defeat") ||
    lowerFilename.includes("sigh") ||
    lowerFilename.includes("weight shift")
  ) {
    type = "Gesture";
  } else if (
    lowerFilename.includes("walk") ||
    lowerFilename.includes("run") ||
    lowerFilename.includes("jog") ||
    lowerFilename.includes("jump") ||
    lowerFilename.includes("strafe") ||
    lowerFilename.includes("crouch")
  ) {
    type = "Locomotion";
  }

  return gender === "Unknown" && type === "Gesture"
    ? "Gesture"
    : `${gender} ${type}`;
}

// Export the module
window.AnimationModule = {
  loadAnimationNames,
  saveAnimationNames,
  importAnimations,
  importAnimationsAndModel,
  importModel,
  randomAnimation,
  playAnimation,
  getAnimationCategory,
  getCurrentAnimation: () => currentAnimation,
  getAnimationNameMap: () => animationNameMap,
  setAnimationNameMap: (map) => { animationNameMap = map; },
  getAnimationCategories: () => animationCategories,
  setAnimationCategories: (categories) => { animationCategories = categories; },
  getPlayer: () => player
}; 