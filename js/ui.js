// UI.js - Handles UI interactions and updates

// Initialize UI
function initializeUI() {
  // Panel toggle button
  const toggleBtn = document.getElementById("toggle-panel");
  const panel = document.getElementById("animation-panel");

  toggleBtn.addEventListener("click", () => {
    panel.classList.toggle("collapsed");
    toggleBtn.classList.toggle("collapsed");
  });

  // Save animation name button
  const saveNameBtn = document.getElementById("save-name-btn");
  saveNameBtn.addEventListener("click", saveCurrentAnimationName);

  // Search animations functionality
  const searchInput = document.getElementById("search-animations");
  searchInput.addEventListener("input", filterAnimations);

  // Animation input field (allow saving on enter)
  const nameInput = document.getElementById("animation-name-input");
  nameInput.addEventListener("keyup", (e) => {
    if (e.key === "Enter") {
      saveCurrentAnimationName();
    }
  });

  // Initialize filter buttons
  const filterContainer = document.getElementById("animation-filters");
  if (filterContainer) {
    filterContainer.addEventListener("click", (e) => {
      if (e.target.classList.contains("filter-btn")) {
        const filterButtons = document.querySelectorAll(".filter-btn");
        filterButtons.forEach((btn) => btn.classList.remove("active"));

        e.target.classList.add("active");
        const filter = e.target.getAttribute("data-filter");
        filterAnimationsByCategory(filter);
      }
    });
  }

  // Create Video button
  const createVideoBtn = document.getElementById("create-video-btn");
  if (createVideoBtn) {
    createVideoBtn.addEventListener("click", () => {
      window.CharacterModule.startVideoCompilation();
    });
  }
  
  // Create 360° Pan Video button
  const create360PanBtn = document.getElementById("create-360-pan-btn");
  if (create360PanBtn) {
    create360PanBtn.addEventListener("click", () => {
      const currentAnimation = window.AnimationModule.getCurrentAnimation();
      if (currentAnimation) {
        window.CharacterModule.start360PanAnimation(currentAnimation);
      } else {
        alert("Please select an animation first!");
      }
    });
  }
}

// Hide Loading View
function hideLoadingView() {
  document.getElementById("loadingDiv").style.display = "none";
}

// Populate the character selection list in the UI
function populateCharacterList() {
  const characterListElement = document.getElementById("character-list");
  if (!characterListElement) return;

  characterListElement.innerHTML = "";
  
  const availableCharacters = window.CharacterModule.getAvailableCharacters();
  const selectedCharacters = window.CharacterModule.getSelectedCharacters();

  availableCharacters.forEach((character) => {
    const isSelected = selectedCharacters.some((c) => c.id === character.id);

    const item = document.createElement("div");
    item.className = `list-group-item character-item d-flex justify-content-between align-items-center ${
      isSelected ? "active" : ""
    }`;
    item.dataset.characterId = character.id;

    item.innerHTML = `
      <div class="character-info">
        <div class="character-name">${character.name}</div>
        <div class="character-file text-muted small">${character.filename}</div>
      </div>
      <div class="character-controls">
        <button class="btn btn-sm ${
          isSelected
            ? "btn-danger remove-character"
            : "btn-primary add-character"
        }">
          <i class="fas ${isSelected ? "fa-minus" : "fa-plus"}"></i>
        </button>
      </div>
    `;

    characterListElement.appendChild(item);

    // Add click handlers for the add/remove buttons
    const actionButton = item.querySelector(".btn");
    actionButton.addEventListener("click", (e) => {
      e.stopPropagation();
      if (actionButton.classList.contains("add-character")) {
        window.CharacterModule.addCharacterToSelection(character);
      } else {
        window.CharacterModule.removeCharacterFromSelection(character);
      }
    });

    // Add click handler for the whole item to preview the character
    item.addEventListener("click", () => {
      window.CharacterModule.previewCharacter(character);
    });
  });

  // Update the create video button state
  window.CharacterModule.updateCreateVideoButtonState();
}

// Filter animations based on search input
function filterAnimations() {
  const searchTerm = document
    .getElementById("search-animations")
    .value.toLowerCase();
  const animationItems = document.querySelectorAll(".animation-item");
  const activeFilter = document.querySelector(".filter-btn.active");
  const categoryFilter = activeFilter
    ? activeFilter.getAttribute("data-filter")
    : "all";

  animationItems.forEach((item) => {
    const name = item
      .querySelector(".animation-name")
      .textContent.toLowerCase();
    const file = item
      .querySelector(".animation-file")
      .textContent.toLowerCase();
    const category = item.getAttribute("data-category");

    const matchesSearch =
      name.includes(searchTerm) || file.includes(searchTerm);
    const matchesCategory =
      categoryFilter === "all" || category === categoryFilter;

    if (matchesSearch && matchesCategory) {
      item.style.display = "";
    } else {
      item.style.display = "none";
    }
  });
}

// Filter animations by category
function filterAnimationsByCategory(category) {
  const animationItems = document.querySelectorAll(".animation-item");
  const searchTerm = document
    .getElementById("search-animations")
    .value.toLowerCase();

  animationItems.forEach((item) => {
    const name = item
      .querySelector(".animation-name")
      .textContent.toLowerCase();
    const file = item
      .querySelector(".animation-file")
      .textContent.toLowerCase();
    const itemCategory = item.getAttribute("data-category");

    let matchesCategory = category === "all";

    if (
      category === "male" &&
      (itemCategory.includes("male-") || file.includes("readyplayer2_m_"))
    ) {
      matchesCategory = true;
    } else if (
      category === "female" &&
      (itemCategory.includes("female-") || file.includes("readyplayer2_f_"))
    ) {
      matchesCategory = true;
    } else if (
      category === "dance" &&
      (itemCategory.includes("-dance") || file.includes("dance"))
    ) {
      matchesCategory = true;
    } else if (
      category === "idle" &&
      (itemCategory.includes("-idle") || file.includes("idle"))
    ) {
      matchesCategory = true;
    } else if (
      category === "expression" &&
      (itemCategory.includes("-expression") ||
        file.includes("talking") ||
        file.includes("expression"))
    ) {
      matchesCategory = true;
    } else if (
      category === "locomotion" &&
      (file.includes("walk") ||
        file.includes("run") ||
        file.includes("jog") ||
        file.includes("jump") ||
        file.includes("strafe") ||
        file.includes("crouch"))
    ) {
      matchesCategory = true;
    }

    const matchesSearch =
      name.includes(searchTerm) || file.includes(searchTerm);

    if (matchesSearch && matchesCategory) {
      item.style.display = "";
    } else {
      item.style.display = "none";
    }
  });
}

// Save the current animation name
function saveCurrentAnimationName() {
  const nameInput = document.getElementById("animation-name-input");
  const customName = nameInput.value.trim();
  const currentAnimation = window.AnimationModule.getCurrentAnimation();
  const animationNameMap = window.AnimationModule.getAnimationNameMap();

  if (customName && currentAnimation) {
    const updatedMap = {...animationNameMap};
    updatedMap[currentAnimation.name] = customName;
    window.AnimationModule.setAnimationNameMap(updatedMap);
    window.AnimationModule.saveAnimationNames();
    updateCurrentAnimationInfo();
    populateAnimationList();

    // Show feedback
    nameInput.value = "";
    nameInput.placeholder = "Saved!";
    setTimeout(() => {
      nameInput.placeholder = "Enter custom name";
    }, 1500);
  }
}

// Create export video controls in animation info section
function updateCurrentAnimationInfo() {
  const container = document.getElementById("current-animation-info");
  if (!container) return;

  // Get current animation
  const currentAnimation = window.AnimationModule.getCurrentAnimation();
  if (!currentAnimation) {
    container.innerHTML = "<p class='text-muted'>No animation selected</p>";
    return;
  }

  // Get custom name if exists
  const animationNameMap = window.AnimationModule.getAnimationNameMap();
  const customName =
    animationNameMap[currentAnimation.name] || currentAnimation.name;

  // Get animation category
  const category = window.AnimationModule.getAnimationCategory(
    currentAnimation.name
  );

  // Update animation info
  container.innerHTML = `
    <div class="mb-2">
      <div><strong>Name:</strong> ${customName}</div>
      <div><small class="text-muted">File: ${currentAnimation.name}</small></div>
      <div><small class="text-muted">Category: ${category}</small></div>
    </div>
    <div class="d-grid gap-2">
      <button id="create-360-pan-btn" class="btn btn-primary btn-sm">
        <i class="fas fa-video me-1"></i> Create 360° Video
      </button>
    </div>
  `;

  // Add event listener for the export button
  const create360PanBtn = document.getElementById("create-360-pan-btn");
  if (create360PanBtn) {
    create360PanBtn.addEventListener("click", () => {
      window.CharacterModule.start360PanAnimation(currentAnimation);
    });
  }
}

// Create and populate animation list
function populateAnimationList() {
  const scene = window.SceneModule.getScene();
  const listElement = document.getElementById("animation-list");
  if (!listElement) return;
  
  listElement.innerHTML = "";
  
  const animationNameMap = window.AnimationModule.getAnimationNameMap();
  const currentAnimation = window.AnimationModule.getCurrentAnimation();
  
  // Reset and populate category counts
  let animationCategories = {
    male: 0,
    female: 0,
    dance: 0,
    idle: 0,
    expression: 0,
    locomotion: 0,
    gesture: 0,
  };

  scene.animationGroups.forEach((animation) => {
    const customName = animationNameMap[animation.name] || "";
    const category = window.AnimationModule.getAnimationCategory(animation.name);
    const originalPath = animation.metadata?.originalPath || "";
    const isIncompatible =
      animation.metadata?.incompatible ||
      animation.targetedAnimations.length === 0 ||
      !animation.targetedAnimations[0].target;

    // Update category counts
    const lowerFilename = animation.name.toLowerCase();
    const lowerOriginalPath = originalPath.toLowerCase();

    if (
      lowerFilename.includes("_m_") ||
      lowerFilename.startsWith("m_") ||
      lowerFilename.includes("readyplayer2_m_")
    )
      animationCategories.male++;

    if (
      lowerFilename.includes("_f_") ||
      lowerFilename.startsWith("f_") ||
      lowerFilename.includes("readyplayer2_f_")
    )
      animationCategories.female++;

    if (lowerFilename.includes("dance")) animationCategories.dance++;
    if (lowerFilename.includes("idle")) animationCategories.idle++;
    if (
      lowerFilename.includes("expression") ||
      lowerFilename.includes("talking")
    )
      animationCategories.expression++;

    if (
      lowerFilename.includes("walk") ||
      lowerFilename.includes("run") ||
      lowerFilename.includes("jog") ||
      lowerFilename.includes("jump") ||
      lowerFilename.includes("strafe") ||
      lowerFilename.includes("crouch")
    ) {
      animationCategories.locomotion++;
    }

    // Check for gesture animations - both in filename and original path
    if (
      lowerFilename.includes("nod") ||
      lowerFilename.includes("shake") ||
      lowerFilename.includes("gesture") ||
      lowerFilename.includes("cocky") ||
      lowerFilename.includes("angry") ||
      lowerFilename.includes("crying") ||
      lowerFilename.includes("defeat") ||
      lowerFilename.includes("sigh") ||
      lowerFilename.includes("weight shift") ||
      lowerOriginalPath.includes("gestures/")
    ) {
      animationCategories.gesture++;
    }

    // Create item for animation list
    const item = document.createElement("div");
    item.className = "animation-item";
    if (isIncompatible) {
      item.classList.add("incompatible");
    }
    if (currentAnimation && animation.name === currentAnimation.name) {
      item.classList.add("active");
    }

    // Create a proper category class
    let categoryClass;

    // Check if it's a gesture animation from original path
    if (lowerOriginalPath.includes("gestures/")) {
      categoryClass = "gesture";
    } else if (
      lowerFilename.includes("_m_") ||
      lowerFilename.startsWith("m_") ||
      lowerFilename.includes("readyplayer2_m_")
    ) {
      if (lowerFilename.includes("dance")) {
        categoryClass = "male-dance";
      } else if (lowerFilename.includes("idle")) {
        categoryClass = "male-idle";
      } else if (
        lowerFilename.includes("expression") ||
        lowerFilename.includes("talking")
      ) {
        categoryClass = "male-expression";
      } else if (
        lowerFilename.includes("walk") ||
        lowerFilename.includes("run") ||
        lowerFilename.includes("jog") ||
        lowerFilename.includes("jump") ||
        lowerFilename.includes("strafe") ||
        lowerFilename.includes("crouch")
      ) {
        categoryClass = "male-locomotion";
      } else {
        categoryClass = "male-other";
      }
    } else if (
      lowerFilename.includes("_f_") ||
      lowerFilename.startsWith("f_") ||
      lowerFilename.includes("readyplayer2_f_")
    ) {
      if (lowerFilename.includes("dance")) {
        categoryClass = "female-dance";
      } else if (lowerFilename.includes("idle")) {
        categoryClass = "female-idle";
      } else if (
        lowerFilename.includes("expression") ||
        lowerFilename.includes("talking")
      ) {
        categoryClass = "female-expression";
      } else if (
        lowerFilename.includes("walk") ||
        lowerFilename.includes("run") ||
        lowerFilename.includes("jog") ||
        lowerFilename.includes("jump") ||
        lowerFilename.includes("strafe") ||
        lowerFilename.includes("crouch")
      ) {
        categoryClass = "female-locomotion";
      } else {
        categoryClass = "female-other";
      }
    } else {
      // For other animations, categorize based on name
      if (
        lowerFilename.includes("nod") ||
        lowerFilename.includes("shake") ||
        lowerFilename.includes("gesture") ||
        lowerFilename.includes("cocky") ||
        lowerFilename.includes("angry") ||
        lowerFilename.includes("crying") ||
        lowerFilename.includes("defeat") ||
        lowerFilename.includes("sigh")
      ) {
        categoryClass = "gesture";
      } else {
        categoryClass = "other";
      }
    }

    item.setAttribute("data-category", categoryClass);

    const compatibilityWarning = isIncompatible
      ? '<div class="incompatible-warning">(Incompatible with current model)</div>'
      : "";

    item.innerHTML = `
      <div>
        <div class="animation-name text-wrap">${
          customName || animation.name
        }</div>
        <div class="animation-file text-wrap">${animation.name}</div>
        <div class="animation-category">${category}</div>
        ${compatibilityWarning}
      </div>
    `;

    item.addEventListener("click", () => {
      if (isIncompatible) {
        alert(
          `The animation "${animation.name}" is not compatible with this character model.`
        );
        return;
      }
      window.AnimationModule.playAnimation(animation);
    });

    listElement.appendChild(item);
  });

  // Store animation categories
  window.AnimationModule.setAnimationCategories(animationCategories);
  
  // Update filter buttons with counts
  updateFilterButtonCounts();
}

// Update filter button counts
function updateFilterButtonCounts() {
  const animationCategories = window.AnimationModule.getAnimationCategories();
  
  const maleBtn = document.querySelector('[data-filter="male"]');
  const femaleBtn = document.querySelector('[data-filter="female"]');
  const danceBtn = document.querySelector('[data-filter="dance"]');
  const idleBtn = document.querySelector('[data-filter="idle"]');
  const expressionBtn = document.querySelector('[data-filter="expression"]');
  const locomotionBtn = document.querySelector('[data-filter="locomotion"]');
  const gestureBtn = document.querySelector('[data-filter="gesture"]');

  if (maleBtn)
    maleBtn.innerHTML = `Male <span class="count">${animationCategories.male}</span>`;
  if (femaleBtn)
    femaleBtn.innerHTML = `Female <span class="count">${animationCategories.female}</span>`;
  if (danceBtn)
    danceBtn.innerHTML = `Dance <span class="count">${animationCategories.dance}</span>`;
  if (idleBtn)
    idleBtn.innerHTML = `Idle <span class="count">${animationCategories.idle}</span>`;
  if (expressionBtn)
    expressionBtn.innerHTML = `Expression <span class="count">${animationCategories.expression}</span>`;
  if (locomotionBtn)
    locomotionBtn.innerHTML = `Locomotion <span class="count">${animationCategories.locomotion}</span>`;
  if (gestureBtn)
    gestureBtn.innerHTML = `Gestures <span class="count">${animationCategories.gesture}</span>`;
}

// Update which animation is active in the list
function updateActiveAnimationInList(animation) {
  const items = document.querySelectorAll(".animation-item");
  items.forEach((item) => {
    const fileDiv = item.querySelector(".animation-file");
    if (fileDiv.textContent === animation.name) {
      item.classList.add("active");
    } else {
      item.classList.remove("active");
    }
  });
}

// Export animation names
function exportAnimationNames() {
  const animationNameMap = window.AnimationModule.getAnimationNameMap();
  
  if (Object.keys(animationNameMap).length === 0) {
    alert("No animation names have been saved yet!");
    return;
  }

  const dataStr =
    "data:text/json;charset=utf-8," +
    encodeURIComponent(JSON.stringify(animationNameMap, null, 2));
  const downloadAnchorNode = document.createElement("a");
  downloadAnchorNode.setAttribute("href", dataStr);
  downloadAnchorNode.setAttribute("download", "animation-names.json");
  document.body.appendChild(downloadAnchorNode);
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
}

// Export the module
window.UIModule = {
  initializeUI,
  hideLoadingView,
  populateCharacterList,
  filterAnimations,
  filterAnimationsByCategory,
  saveCurrentAnimationName,
  updateCurrentAnimationInfo,
  populateAnimationList,
  updateFilterButtonCounts,
  updateActiveAnimationInList,
  exportAnimationNames
}; 