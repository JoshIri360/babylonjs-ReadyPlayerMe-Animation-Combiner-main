// On Document Loaded - Start Game //
document.addEventListener("DOMContentLoaded", startGame);

// Global BabylonJS Variables
var canvas = document.getElementById("renderCanvas");
var engine = new BABYLON.Engine(canvas, true, { stencil: false }, true);
var scene = createScene(engine, canvas);
var camera = new BABYLON.ArcRotateCamera("camera", BABYLON.Tools.ToRadians(-90), BABYLON.Tools.ToRadians(65), 6, BABYLON.Vector3.Zero(), scene);
var dirLight = new BABYLON.DirectionalLight("dirLight", new BABYLON.Vector3(0,0,0), scene);
var hemiLight = new BABYLON.HemisphericLight("hemiLight", new BABYLON.Vector3(0, 1, 0), scene);
var shadowGenerator = new BABYLON.ShadowGenerator(2048, dirLight, true);

var ground;
var hdrTexture;
var hdrRotation = 0;

var currentAnimation;
var animationNameMap = {};
var animationCategories = {};

// Load saved animation names from localStorage
function loadAnimationNames() {
    const saved = localStorage.getItem('animationNames');
    if (saved) {
        animationNameMap = JSON.parse(saved);
    }
}

// Save animation names to localStorage
function saveAnimationNames() {
    localStorage.setItem('animationNames', JSON.stringify(animationNameMap));
}

// Create Scene
function createScene(engine, canvas) {
    // Set Canvas & Engine //
    canvas = document.getElementById("renderCanvas");
    engine.clear(new BABYLON.Color3(0, 0, 0), true, true);
    var scene = new BABYLON.Scene(engine);
    return scene;
}

// Start Game
function startGame() {
    // Set Canvas & Engine //
    var toRender = function () {
        scene.render();
    }
    engine.runRenderLoop(toRender);
    
    createCamera();

    // Hemispheric Light //
    hemiLight.intensity = 0.1;

    // Directional Light //
    dirLight.intensity = 1.5;
    dirLight.position = new BABYLON.Vector3(0,30,10);
    dirLight.direction = new BABYLON.Vector3(-2, -4, -5);

    // Cylinder Ground //
    ground = BABYLON.MeshBuilder.CreateCylinder("ground", {diameter: 7, height: 0.2, tessellation: 80}, scene);
    ground.position.y = -0.1;
    ground.isPickable = false;
    var groundMat = new BABYLON.PBRMaterial("groundMaterial", scene);
    groundMat.albedoColor = new BABYLON.Color3(0.95,0.95,0.95);
    groundMat.roughness = 0.15;
    groundMat.metallic = 0;
    groundMat.specularIntensity = 0;
    ground.material = groundMat;
    ground.receiveShadows = true;

    setLighting();    
    loadAnimationNames();
    initializeUI();
    importAnimationsAndModel("readyplayer2.glb");

    // scene.debugLayer.show({embedMode: true}).then(function () {
    // });
}

// Initialize UI
function initializeUI() {
    // Panel toggle button
    const toggleBtn = document.getElementById('toggle-panel');
    const panel = document.getElementById('animation-panel');
    
    toggleBtn.addEventListener('click', () => {
        panel.classList.toggle('collapsed');
        toggleBtn.classList.toggle('collapsed');
    });
    
    // Save animation name button
    const saveNameBtn = document.getElementById('save-name-btn');
    saveNameBtn.addEventListener('click', saveCurrentAnimationName);
    
    // Search animations functionality
    const searchInput = document.getElementById('search-animations');
    searchInput.addEventListener('input', filterAnimations);
    
    // Animation input field (allow saving on enter)
    const nameInput = document.getElementById('animation-name-input');
    nameInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
            saveCurrentAnimationName();
        }
    });

    // Initialize filter buttons
    const filterContainer = document.getElementById('animation-filters');
    if (filterContainer) {
        filterContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('filter-btn')) {
                const filterButtons = document.querySelectorAll('.filter-btn');
                filterButtons.forEach(btn => btn.classList.remove('active'));
                
                e.target.classList.add('active');
                const filter = e.target.getAttribute('data-filter');
                filterAnimationsByCategory(filter);
            }
        });
    }
}

// Filter animations based on search input
function filterAnimations() {
    const searchTerm = document.getElementById('search-animations').value.toLowerCase();
    const animationItems = document.querySelectorAll('.animation-item');
    const activeFilter = document.querySelector('.filter-btn.active');
    const categoryFilter = activeFilter ? activeFilter.getAttribute('data-filter') : 'all';
    
    animationItems.forEach(item => {
        const name = item.querySelector('.animation-name').textContent.toLowerCase();
        const file = item.querySelector('.animation-file').textContent.toLowerCase();
        const category = item.getAttribute('data-category');
        
        const matchesSearch = name.includes(searchTerm) || file.includes(searchTerm);
        const matchesCategory = categoryFilter === 'all' || category === categoryFilter;
        
        if (matchesSearch && matchesCategory) {
            item.style.display = '';
        } else {
            item.style.display = 'none';
        }
    });
}

// Filter animations by category
function filterAnimationsByCategory(category) {
    const animationItems = document.querySelectorAll('.animation-item');
    const searchTerm = document.getElementById('search-animations').value.toLowerCase();
    
    animationItems.forEach(item => {
        const name = item.querySelector('.animation-name').textContent.toLowerCase();
        const file = item.querySelector('.animation-file').textContent.toLowerCase();
        const itemCategory = item.getAttribute('data-category');
        
        let matchesCategory = category === 'all';
        
        if (category === 'male' && itemCategory.includes('male-')) {
            matchesCategory = true;
        } else if (category === 'female' && itemCategory.includes('female-')) {
            matchesCategory = true;
        } else if (category === 'dance' && itemCategory.includes('-dance')) {
            matchesCategory = true;
        } else if (category === 'idle' && itemCategory.includes('-idle')) {
            matchesCategory = true;
        } else if (category === 'expression' && (itemCategory.includes('-expression') || file.includes('talking'))) {
            matchesCategory = true;
        } else if (category === 'locomotion' && 
                  (file.includes('walk') || file.includes('run') || file.includes('jog') || 
                   file.includes('jump') || file.includes('strafe') || file.includes('crouch'))) {
            matchesCategory = true;
        }
        
        const matchesSearch = name.includes(searchTerm) || file.includes(searchTerm);
        
        if (matchesSearch && matchesCategory) {
            item.style.display = '';
        } else {
            item.style.display = 'none';
        }
    });
}

// Save the current animation name
function saveCurrentAnimationName() {
    const nameInput = document.getElementById('animation-name-input');
    const customName = nameInput.value.trim();
    
    if (customName && currentAnimation) {
        animationNameMap[currentAnimation.name] = customName;
        saveAnimationNames();
        updateCurrentAnimationInfo();
        updateAnimationList();
        
        // Show feedback
        nameInput.value = '';
        nameInput.placeholder = 'Saved!';
        setTimeout(() => {
            nameInput.placeholder = 'Enter custom name';
        }, 1500);
    }
}

// Update current animation info display
function updateCurrentAnimationInfo() {
    if (!currentAnimation) return;
    
    const infoElement = document.getElementById('current-animation-info');
    const customName = animationNameMap[currentAnimation.name] || '';
    
    infoElement.innerHTML = `
        <div><strong>File:</strong> <span class="text-wrap">${currentAnimation.name}</span></div>
        ${customName ? `<div><strong>Custom Name:</strong> <span class="text-wrap">${customName}</span></div>` : ''}
        <div><strong>Category:</strong> <span class="text-wrap">${getAnimationCategory(currentAnimation.name)}</span></div>
    `;
    
    // Update main info text at top of screen
    const displayName = customName || currentAnimation.name;
    document.getElementById('info-text').innerHTML = `Current Animation<br><span class="text-wrap">${displayName}</span>`;
    
    // Update input placeholder with current custom name
    const nameInput = document.getElementById('animation-name-input');
    nameInput.placeholder = customName ? 'Update name' : 'Enter custom name';
    if (customName) nameInput.value = customName;
}

// Determine animation category based on filename
function getAnimationCategory(filename) {
    if (!filename) return 'Unknown';
    
    const lowerFilename = filename.toLowerCase();
    let gender = 'Unknown';
    let type = 'Other';
    
    // Determine gender
    if (lowerFilename.includes('_m_') || lowerFilename.startsWith('m_')) {
        gender = 'Male';
    } else if (lowerFilename.includes('_f_') || lowerFilename.startsWith('f_')) {
        gender = 'Female';
    }
    
    // Determine type
    if (lowerFilename.includes('dance')) {
        type = 'Dance';
    } else if (lowerFilename.includes('idle')) {
        type = 'Idle';
    } else if (lowerFilename.includes('expression') || lowerFilename.includes('talking')) {
        type = 'Expression';
    } else if (lowerFilename.includes('walk') || lowerFilename.includes('run') || 
              lowerFilename.includes('jog') || lowerFilename.includes('jump') || 
              lowerFilename.includes('strafe') || lowerFilename.includes('crouch')) {
        type = 'Locomotion';
    }
    
    return `${gender} ${type}`;
}

// Create and populate animation list
function populateAnimationList() {
    const listElement = document.getElementById('animation-list');
    listElement.innerHTML = '';
    
    // Reset and populate category counts
    animationCategories = {
        'male': 0,
        'female': 0,
        'dance': 0,
        'idle': 0,
        'expression': 0,
        'locomotion': 0
    };
    
    scene.animationGroups.forEach(animation => {
        const customName = animationNameMap[animation.name] || '';
        const category = getAnimationCategory(animation.name);
        
        // Update category counts
        const lowerFilename = animation.name.toLowerCase();
        if (lowerFilename.includes('_m_') || lowerFilename.startsWith('m_')) animationCategories.male++;
        if (lowerFilename.includes('_f_') || lowerFilename.startsWith('f_')) animationCategories.female++;
        if (lowerFilename.includes('dance')) animationCategories.dance++;
        if (lowerFilename.includes('idle')) animationCategories.idle++;
        if (lowerFilename.includes('expression') || lowerFilename.includes('talking')) animationCategories.expression++;
        if (lowerFilename.includes('walk') || lowerFilename.includes('run') || 
            lowerFilename.includes('jog') || lowerFilename.includes('jump') || 
            lowerFilename.includes('strafe') || lowerFilename.includes('crouch')) {
            animationCategories.locomotion++;
        }
        
        const item = document.createElement('div');
        item.className = 'animation-item';
        if (currentAnimation && animation.name === currentAnimation.name) {
            item.classList.add('active');
        }
        
        // Create a proper category class
        let categoryClass;
        if (lowerFilename.includes('_m_') || lowerFilename.startsWith('m_')) {
            if (lowerFilename.includes('dance')) {
                categoryClass = 'male-dance';
            } else if (lowerFilename.includes('idle')) {
                categoryClass = 'male-idle';
            } else if (lowerFilename.includes('expression') || lowerFilename.includes('talking')) {
                categoryClass = 'male-expression';
            } else if (lowerFilename.includes('walk') || lowerFilename.includes('run') || 
                       lowerFilename.includes('jog') || lowerFilename.includes('jump') ||
                       lowerFilename.includes('strafe') || lowerFilename.includes('crouch')) {
                categoryClass = 'male-locomotion';
            } else {
                categoryClass = 'male-other';
            }
        } else if (lowerFilename.includes('_f_') || lowerFilename.startsWith('f_')) {
            if (lowerFilename.includes('dance')) {
                categoryClass = 'female-dance';
            } else if (lowerFilename.includes('idle')) {
                categoryClass = 'female-idle';
            } else if (lowerFilename.includes('expression') || lowerFilename.includes('talking')) {
                categoryClass = 'female-expression';
            } else if (lowerFilename.includes('walk') || lowerFilename.includes('run') || 
                       lowerFilename.includes('jog') || lowerFilename.includes('jump') ||
                       lowerFilename.includes('strafe') || lowerFilename.includes('crouch')) {
                categoryClass = 'female-locomotion';
            } else {
                categoryClass = 'female-other';
            }
        } else {
            categoryClass = 'other';
        }
        
        item.setAttribute('data-category', categoryClass);
        
        item.innerHTML = `
            <div>
                <div class="animation-name text-wrap">${customName || animation.name}</div>
                <div class="animation-file text-wrap">${animation.name}</div>
                <div class="animation-category">${category}</div>
            </div>
        `;
        
        item.addEventListener('click', () => {
            playAnimation(animation);
        });
        
        listElement.appendChild(item);
    });
    
    // Update filter buttons with counts
    updateFilterButtonCounts();
}

// Update filter button counts
function updateFilterButtonCounts() {
    const maleBtn = document.querySelector('[data-filter="male"]');
    const femaleBtn = document.querySelector('[data-filter="female"]');
    const danceBtn = document.querySelector('[data-filter="dance"]');
    const idleBtn = document.querySelector('[data-filter="idle"]');
    const expressionBtn = document.querySelector('[data-filter="expression"]');
    const locomotionBtn = document.querySelector('[data-filter="locomotion"]');
    
    if (maleBtn) maleBtn.innerHTML = `Male <span class="count">${animationCategories.male}</span>`;
    if (femaleBtn) femaleBtn.innerHTML = `Female <span class="count">${animationCategories.female}</span>`;
    if (danceBtn) danceBtn.innerHTML = `Dance <span class="count">${animationCategories.dance}</span>`;
    if (idleBtn) idleBtn.innerHTML = `Idle <span class="count">${animationCategories.idle}</span>`;
    if (expressionBtn) expressionBtn.innerHTML = `Expression <span class="count">${animationCategories.expression}</span>`;
    if (locomotionBtn) locomotionBtn.innerHTML = `Locomotion <span class="count">${animationCategories.locomotion}</span>`;
}

// Play a selected animation
function playAnimation(animation) {
    if (currentAnimation === animation) return;
    
    scene.onBeforeRenderObservable.runCoroutineAsync(animationBlending(currentAnimation, 1.0, animation, 1.0, true, 0.02));
    
    const customName = animationNameMap[animation.name] || animation.name;
    document.getElementById('info-text').innerHTML = `Current Animation<br><span class="text-wrap">${customName}</span>`;
    
    // Update UI
    updateActiveAnimationInList(animation);
}

// Update which animation is active in the list
function updateActiveAnimationInList(animation) {
    const items = document.querySelectorAll('.animation-item');
    items.forEach(item => {
        const fileDiv = item.querySelector('.animation-file');
        if (fileDiv.textContent === animation.name) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}

// Update animation list
function updateAnimationList() {
    populateAnimationList();
}

// Export animation names
function exportAnimationNames() {
    if (Object.keys(animationNameMap).length === 0) {
        alert('No animation names have been saved yet!');
        return;
    }
    
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(animationNameMap, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "animation-names.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

// Create ArcRotateCamera //
function createCamera() {  
    camera.position.z = 10;
    camera.setTarget(new BABYLON.Vector3(0, 1, 0));
    camera.allowUpsideDown = false;
    camera.panningSensibility = 0;
    camera.lowerRadiusLimit = 2;
    camera.upperRadiusLimit = 16;
    camera.lowerBetaLimit = 0.75;
    camera.upperBetaLimit = Math.PI / 2;
    camera.panningSensibility = 0;
    camera.pinchDeltaPercentage = 0.00050;
    camera.wheelPrecision = 60;
    camera.useBouncingBehavior = false;
    camera.useAutoRotationBehavior = true;
    camera.autoRotationBehavior.idleRotationSpeed = 0.15;
    camera.radius = 5;
    camera.attachControl(canvas, true);
}

// Setup Animations & Player
var player;
var animationsGLB = [];
// Import Animations and Models
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
        "001", "002", "004", "005", "006", "007", "008", "009", 
        "010", "011", "012", "013", "014", "015", "016", "017", "018"
    ];
    
    for (const num of maleExpressions) {
        await importAnimations(`masculine/expression/M_Standing_Expressions_${num}.glb`);
    }
    
    // Talking variations - use correct format with 3 digits
    for (let index = 1; index <= 10; index++) {
        const indexStr = index < 10 ? `00${index}` : `0${index}`;
        await importAnimations(`masculine/expression/M_Talking_Variations_${indexStr}.glb`);
    }
    
    // Locomotion animations - select a subset to not overwhelm
    const maleLocomotions = [
        "M_Walk_001.glb", "M_Run_001.glb", "M_Jog_001.glb",
        "M_Walk_Jump_001.glb", "M_Run_Jump_001.glb",
        "M_Walk_Backwards_001.glb", "M_Run_Backwards_002.glb"
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
        await importAnimations(`femenine/expression/F_Talking_Variations_${indexStr}.glb`);
    }
    
    // Locomotion animations - select a subset to not overwhelm
    const femaleLocomotions = [
        "F_Walk_002.glb", "F_Run_001.glb", "F_Jog_001.glb",
        "F_Walk_Jump_001.glb", "F_Run_Jump_001.glb",
        "F_Walk_Backwards_001.glb", "F_Run_Backwards_001.glb"
    ];
    
    for (const anim of femaleLocomotions) {
        await importAnimations(`femenine/locomotion/${anim}`);
    }
    
    importModel(model);
}

// Import Animations
function importAnimations(animation) {
    return BABYLON.SceneLoader.ImportMeshAsync(null, "./resources/models/animations/" + animation, null, scene)
      .then((result) => {
        result.meshes.forEach(element => {
            if (element)
                element.dispose();  
        });
        animationsGLB.push(result.animationGroups[0]);
    })
    .catch(error => {
        console.warn("Error loading animation: " + animation, error);
    });
}
  
// Import Model
function importModel(model) {
    BABYLON.SceneLoader.ImportMeshAsync(null, "./resources/models/" + model, null, scene)
      .then((result) => {
        player = result.meshes[0];
        player.name = "Character";

        var modelTransformNodes = player.getChildTransformNodes();
        
        animationsGLB.forEach((animation) => {
          const modelAnimationGroup = animation.clone(model.replace(".glb", "_") + animation.name, (oldTarget) => {
            return modelTransformNodes.find((node) => node.name === oldTarget.name);
          });
          animation.dispose();
        });
        animationsGLB = [];

        // Merge Meshes
        
        setReflections();
        setShadows();
        scene.animationGroups[0].play(true, 1.0);
        console.log("Animations: " + scene.animationGroups);
        console.log("Animations: " + scene.animationGroups.length);
        currentAnimation = scene.animationGroups[0];
        
        // Update UI with animation names
        populateAnimationList();
        updateCurrentAnimationInfo();
        
        document.getElementById("info-text").innerHTML = "Current Animation<br>" + (animationNameMap[currentAnimation.name] || currentAnimation.name);
        hideLoadingView();
 
    });
}

// Random Number
function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Random Animation Function
var disableButton = false;
function randomAnimation() {  
    if (disableButton)
        return;
    disableButton = true;
    setTimeout(() => {
        disableButton = false;
    }, 500);

    var randomNumber = getRandomInt(1, scene.animationGroups.length - 1);
    var newAnimation = scene.animationGroups[randomNumber];
    // console.log("Random Animation: " + newAnimation.name);

    // Check if currentAnimation === newAnimation
    while (currentAnimation === newAnimation) {
        randomNumber = getRandomInt(1, scene.animationGroups.length - 1);
        newAnimation = scene.animationGroups[randomNumber];
        console.log("Rechecking Anim: " + newAnimation.name);
    }

    scene.onBeforeRenderObservable.runCoroutineAsync(animationBlending(currentAnimation, 1.0, newAnimation, 1.0, true, 0.02));
    
    const customName = animationNameMap[newAnimation.name] || newAnimation.name;
    document.getElementById("info-text").innerHTML = `Current Animation<br><span class="text-wrap">${customName}</span>`;
    
    // Update UI
    updateCurrentAnimationInfo();
    updateActiveAnimationInList(newAnimation);
}

// Animation Blending
function* animationBlending(fromAnim, fromAnimSpeedRatio, toAnim, toAnimSpeedRatio, repeat, speed)
{
    let currentWeight = 1;
    let newWeight = 0;
    fromAnim.stop();
    toAnim.play(repeat);
    fromAnim.speedRatio = fromAnimSpeedRatio;
    toAnim.speedRatio = toAnimSpeedRatio;
    while(newWeight < 1)
    {
        newWeight += speed;
        currentWeight -= speed;
        toAnim.setWeightForAllAnimatables(newWeight);
        fromAnim.setWeightForAllAnimatables(currentWeight);
        yield;
    }

    currentAnimation = toAnim;
    updateCurrentAnimationInfo();
}

// Environment Lighting
function setLighting() {
    hdrTexture = BABYLON.CubeTexture.CreateFromPrefilteredData("./resources/env/environment_19.env", scene);
    hdrTexture.rotationY = BABYLON.Tools.ToRadians(hdrRotation);
    hdrSkybox = BABYLON.MeshBuilder.CreateBox("skybox", {size: 1024}, scene);
    var hdrSkyboxMaterial = new BABYLON.PBRMaterial("skybox", scene);
    hdrSkyboxMaterial.backFaceCulling = false;
    hdrSkyboxMaterial.reflectionTexture = hdrTexture.clone();
    hdrSkyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
    hdrSkyboxMaterial.microSurface = 0.4;
    hdrSkyboxMaterial.disableLighting = true;
    hdrSkybox.material = hdrSkyboxMaterial;
    hdrSkybox.infiniteDistance = true;
}

// Set Shadows
function setShadows() {
    scene.meshes.forEach(function(mesh) {
        if (mesh.name != "skybox" 
        && mesh.name != "ground")
        {
            shadowGenerator.darkness = 0.1;
            shadowGenerator.bias = 0.00001;
            shadowGenerator.useBlurExponentialShadowMap = true;
            shadowGenerator.addShadowCaster(mesh);
        }
    });
}

// Set Reflections
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

// Hide Loading View
function hideLoadingView() {
    document.getElementById("loadingDiv").style.display = "none";
}

// Resize Window
window.addEventListener("resize", function () {
    engine.resize();
});