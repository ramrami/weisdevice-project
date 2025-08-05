import * as THREE from 'three';
import { OrbitControls } from './utils/OrbitControls.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import gsap from "gsap";

import monitorVertexShader from "./shaders/monitorVertexShader.glsl?raw";
import monitorFragmentShader from "./shaders/monitorFragmentShader.glsl?raw";
import gridVertexShader from "./shaders/gridVertexShader.glsl?raw";
import gridFragmentShader from "./shaders/gridFragmentShader.glsl?raw";
import smokeVertexShader from "./shaders/smokeVertexShader.glsl?raw";
import smokeFragmentShader from "./shaders/smokeFragmentShader.glsl?raw";
import fadePlaneVertexShader from "./shaders/fadePlaneVertexShader.glsl?raw";
import fadePlaneFragmentShader from "./shaders/fadePlaneFragementShader.glsl?raw"

/**  -------------------------- Global Variables -------------------------- */
const canvas = document.querySelector("#experience-canvas");

const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const scene = new THREE.Scene();

let touchHappened = false;
let isModalOpen = false;
let musicPlaying = false;
let monitorAnimStarted = false;

const cloud = [], rotAObjects = [], rotBObjects = [];

let workBtn, contactBtn, aboutBtn, legalBtn, pcBtn;
let DJ1, DJ2, DJ3, DJ4, DJ5, DJ6, DJ7, DJ8, DJ9;

let monitorBrightness = 0;
let monitorContrast = 0;

const raycasterObjects = [];
let currentIntersects = [];
let currentHoveredObject = null;

let currentIndex = 0;
let nextIndex = 1;

let monitorMesh, sliderMesh;

let sliderIsAtOriginal = true;
const sliderOffset = new THREE.Vector3(0, 0, -0.5); // ← relative movement

const modals = {
  work: document.querySelector(".modal.work"),
  about: document.querySelector(".modal.about"),
  contact: document.querySelector(".modal.contact"),
  legal: document.querySelector(".modal.legal")
};

/**  -------------------------- loadingscreen -------------------------- */
const loadingText = document.getElementById("loading-text");
const progressBar = document.getElementById("progress-bar");
const enterButton = document.getElementById("enter-button");
const loadingScreen = document.getElementById("loading-screen");
const enterButtonMute = document.getElementById("enter-button-mute");

const manager = new THREE.LoadingManager();

let assetsReady = false;

manager.onProgress = (url, loaded, total) => {
  const percent = Math.floor((loaded / total) * 100);


  gsap.to(progressBar, {
    value: percent,
    duration: 0.3,
    ease: "power1.out"
  });

  gsap.to(loadingText, {
    textContent: `Loading ${loaded} of ${total}...`,
    duration: 0.3,
    ease: "none"
  });
};
manager.onLoad = () => {
  assetsReady = true;
  loadingText.textContent = `Loaded!`;
  enterButton.disabled = false;
  enterButtonMute.disabled = false;

  enterButton.classList.add("active");
  enterButtonMute.classList.add("active");
};

/* manager.onLoad = () => {
  // Skip loading screen completely
  assetsReady = true;
  loadingScreen.remove();
  monitorAnimStarted = true;
  playIntroAnimation(); // Start scene directly
}; */

enterButton.addEventListener(
  "touchend",
  (e) => {
    touchHappened = true;
    e.preventDefault();

    backgroundMusic.play();
    backgroundMusic.volume = 0.4;
    musicPlaying = true;
    musicIcon.src = "/icon/music_note_124dp_3B3935_FILL0_wght700_GRAD-25_opsz48.svg";

    monitorAnimStarted = true;
    loadingScreen.remove();
    playIntroAnimation();
  },
  { passive: false }
);

enterButton.addEventListener(
  "click",
  (e) => {
    if (touchHappened) return;
    e.preventDefault();

    backgroundMusic.play();
    backgroundMusic.volume = 0.4;
    musicPlaying = true;
    musicIcon.src = "/icon/music_note_124dp_3B3935_FILL0_wght700_GRAD-25_opsz48.svg";

    monitorAnimStarted = true;
    loadingScreen.remove();
    playIntroAnimation();
  },
  { passive: false }
);

enterButtonMute.addEventListener(
  "touchend",
  (e) => {
    touchHappened = true;
    e.preventDefault();

    musicPlaying = false;
    monitorAnimStarted = true;
    loadingScreen.remove();
    playIntroAnimation();
  },
  { passive: false }
);

enterButtonMute.addEventListener(
  "click",
  (e) => {
    if (touchHappened) return;
    e.preventDefault();

    musicPlaying = false;
    monitorAnimStarted = true;
    loadingScreen.remove();
    playIntroAnimation();
  },
  { passive: false }
);

document.addEventListener("DOMContentLoaded", function () {
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "night") {
    isDarkMode = true;
    document.documentElement.setAttribute("data-theme", "night");
    themeIcon.src = "/icon/dark_mode_124dp_3B3935_FILL0_wght700_GRAD200_opsz48.svg";
    switchTheme("night");
  } else {
    isDarkMode = false;
    document.documentElement.removeAttribute("data-theme");
    themeIcon.src = "/icon/light_mode_124dp_3B3935_FILL0_wght700_GRAD200_opsz48.svg";
    switchTheme("day");
  }

  const tipText = document.getElementById("tip-text");

  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  if (isTouchDevice) {
    tipText.textContent = "💡 Tip: Tap and swipe to explore.";
  } else {
    tipText.textContent = "💡 Tip: Click and drag to explore.";
  }
});
/**  -------------------------- theme toggle -------------------------- */
const themeToggleButton = document.getElementById("theme-toggle");
const themeIcon = document.getElementById("theme-icon");

let isDarkMode = false;

themeToggleButton.addEventListener(
  "touchend",
  (e) => {
    touchHappened = true;
    e.preventDefault();

    isDarkMode = !isDarkMode;
    switchTheme(isDarkMode ? "night" : "day");

    if (isDarkMode) {
      document.documentElement.setAttribute("data-theme", "night");
      themeIcon.src = "/icon/dark_mode_124dp_3B3935_FILL0_wght700_GRAD200_opsz48.svg";
    } else {
      document.documentElement.removeAttribute("data-theme");
      themeIcon.src = "/icon/light_mode_124dp_3B3935_FILL0_wght700_GRAD200_opsz48.svg";
    }

    localStorage.setItem("theme", isDarkMode ? "night" : "day");
  },
  { passive: false }
);

themeToggleButton.addEventListener(
  "click",
  (e) => {
    if (touchHappened) return;
    e.preventDefault();

    isDarkMode = !isDarkMode;
    switchTheme(isDarkMode ? "night" : "day");

    if (isDarkMode) {
      document.documentElement.setAttribute("data-theme", "night");
      themeIcon.src = "/icon/dark_mode_124dp_3B3935_FILL0_wght700_GRAD200_opsz48.svg";
    } else {
      document.documentElement.removeAttribute("data-theme");
      themeIcon.src = "/icon/light_mode_124dp_3B3935_FILL0_wght700_GRAD200_opsz48.svg";
    }

    localStorage.setItem("theme", isDarkMode ? "night" : "day");
  },
  { passive: false }
);

/**  -------------------------- music -------------------------- */
const djAudio = new Audio();
djAudio.volume = 0.7;
djAudio.preload = "auto"; // optional, helps on slower networks

// UI button sounds
const pcButtonMusic = new Audio('/audio/sound/403007__inspectorj__ui-confirmation-alert-a2.ogg');

const sliderMusic = new Audio('/audio/sound/770169__j1cr0wav3__itemcollect.ogg');
const backgroundMusic = document.getElementById("bg-music");
const musicIcon = document.getElementById("music-icon");
const musicToggleBtn = document.getElementById("music-toggle");

musicToggleBtn.addEventListener(
  "touchend",
  (e) => {
    touchHappened = true;
    e.preventDefault();

    musicPlaying = !musicPlaying;

    if (musicPlaying) {
      backgroundMusic.play();
      backgroundMusic.volume = 0.4;
      musicIcon.src = "/icon/music_note_124dp_3B3935_FILL0_wght700_GRAD-25_opsz48.svg";
    } else {
      backgroundMusic.pause();
      musicIcon.src = "/icon/music_off_124dp_3B3935_FILL0_wght700_GRAD-25_opsz48.svg";
    }

    djAudio.muted = !musicPlaying;
    if (!musicPlaying) djAudio.pause();
  },
  { passive: false }
);

musicToggleBtn.addEventListener(
  "click",
  (e) => {
    if (touchHappened) return;
    e.preventDefault();

    musicPlaying = !musicPlaying;

    if (musicPlaying) {
      backgroundMusic.play();
      backgroundMusic.volume = 0.4;
      musicIcon.src = "/icon/music_note_124dp_3B3935_FILL0_wght700_GRAD-25_opsz48.svg";
    } else {
      backgroundMusic.pause();
      musicIcon.src = "/icon/music_off_124dp_3B3935_FILL0_wght700_GRAD-25_opsz48.svg";
    }

    djAudio.muted = !musicPlaying;
    if (!musicPlaying) djAudio.pause();
  },
  { passive: false }
);

/**  -------------------------- modal -------------------------- */
const experience = document.getElementById("experience");

const showModal = (modal) => {
  modal.classList.remove("hidden");
  isModalOpen = true;
  controls.enabled = false;

  experience.classList.add("blur");
  overlay.style.display = "block";
  musicToggleBtn.classList.add("hidden");
  themeToggleButton.classList.add("hidden");
  cameraToggleBtn.classList.add("hidden");

  raycasterObjects.forEach(obj => {
    if (obj.userData && obj.userData.hoverTimeline) {
      obj.userData.hoverDisabled = true;
    }
  });

  document.body.style.cursor = "default";
  currentIntersects = [];

  gsap.set(modal, {
    scaleY: 0,
    scaleX: 1,
    opacity: 0,
    transformOrigin: "center center"
  });

  gsap.to(modal, {
    scaleY: 1,
    opacity: 1,
    duration: 0.5,
    ease: "power3.out"
  });
};

const hideModal = (modal) => {
  isModalOpen = false;
  controls.enabled = true;
  experience.classList.remove("blur");
  overlay.style.display = "none";
  musicToggleBtn.classList.remove("hidden");
  themeToggleButton.classList.remove("hidden");
  cameraToggleBtn.classList.remove("hidden");

  raycasterObjects.forEach(obj => {
    if (obj.userData && obj.userData.hoverTimeline) {
      obj.userData.hoverDisabled = false;
    }
  });

  gsap.to(modal, {
    scaleY: 0,
    opacity: 0,
    duration: 0.4,
    ease: "power2.in",
    onComplete: () => {
      modal.classList.add("hidden");
    }
  });
};

const overlay = document.querySelector(".overlay");

overlay.addEventListener(
  "touchend",
  (e) => {
    touchHappened = true;
    e.preventDefault();
    const modal = document.querySelector('.modal:not(.hidden)');
    if (isModalOpen && modal) hideModal(modal);
  },
  { passive: false }
);

overlay.addEventListener(
  "click",
  (e) => {
    if (touchHappened) return;
    e.preventDefault();
    const modal = document.querySelector('.modal:not(.hidden)');
    if (isModalOpen && modal) hideModal(modal);
  },
  { passive: false }
);
/**  -------------------------- camera-toggle -------------------------- */
window.addEventListener('DOMContentLoaded', () => {
  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  document.body.classList.toggle('no-touch', !isTouch);
});

const cameraPositionsDesktop = [
  { position: new THREE.Vector3(-5.5, 8.0, 14.7), target: new THREE.Vector3(-0.0, 2.0, -0.9) },
  { position: new THREE.Vector3(1.2, 5.1, 6.2), target: new THREE.Vector3(-0.2, 2.0, -0.8) },
  { position: new THREE.Vector3(-0.8, 6.1, 6.6), target: new THREE.Vector3(2, 5, 2.6) }
];

const cameraPositionsMobile = [
  { position: new THREE.Vector3(-12.9, 8.5, 20.5), target: new THREE.Vector3(0.3, 2.6, -0.5) },
  { position: new THREE.Vector3(1.0, 4.7, 6.3), target: new THREE.Vector3(-0.3, 1.6, -0.6) },
  { position: new THREE.Vector3(-1.1, 3.6, 6.6), target: new THREE.Vector3(1.8, 3.6, 2.6) }
];

const isMobile = window.innerWidth < 768;
const cameraPositions = isMobile ? cameraPositionsMobile : cameraPositionsDesktop;

let currentCameraIndex = 1;

const cameraToggleBtn = document.getElementById("camera-toggle");

function switchCameraView() {
  const { position, target } = cameraPositions[currentCameraIndex];
  moveCameraTo(position, target);

  // Advance index for next click
  currentCameraIndex = (currentCameraIndex + 1) % cameraPositions.length;
}

cameraToggleBtn.addEventListener("click", (e) => {
  e.preventDefault();
  switchCameraView();
});

cameraToggleBtn.addEventListener("touchend", (e) => {
  touchHappened = true;
  e.preventDefault();
  switchCameraView();
}, { passive: false });

function moveCameraTo(position, target) {
  gsap.to(camera.position, {
    x: position.x,
    y: position.y,
    z: position.z,
    duration: 2,
    ease: "power2.inOut"
  });

  gsap.to(controls.target, {
    x: target.x,
    y: target.y,
    z: target.z,
    duration: 2,
    ease: "power2.inOut",
    onUpdate: () => controls.update()
  });
}

let cameraIndex2Effect = false;

let loopGlowTimeline = null;
let isLoopingGlowActive = false;

/**  -------------------------- Camera & Renderer -------------------------- */
const camera = new THREE.PerspectiveCamera(
  35,
  sizes.width / sizes.height,
  0.1,
  200
);

const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true,
});

renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

/**  -------------------------- Controls -------------------------- */
const controls = new OrbitControls(camera, renderer.domElement);
controls.minDistance = 5;
controls.maxDistance = 45;
controls.minPolarAngle = 0;
controls.maxPolarAngle = Math.PI / 2;
controls.minAzimuthAngle = -Infinity;
controls.maxAzimuthAngle = Infinity;
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.update();

/**  -------------------------- Responsive Camera -------------------------- */
if (window.innerWidth < 768) {
  camera.position.set(-12.9, 8.5, 20.5);
  controls.target.set(0.3, 2.6, -0.5);
} else {
  camera.position.set(-5.5, 8.0, 14.7);
  controls.target.set(-0.0, 2.0, -0.9);
}

window.addEventListener("resize", () => {
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

/**  -------------------------- Mouse Tracking -------------------------- */
window.addEventListener("mousemove", (e) => {
  touchHappened = false;//detail
  pointer.x = (e.clientX / sizes.width) * 2 - 1;
  pointer.y = -(e.clientY / sizes.height) * 2 + 1;
}
);

window.addEventListener(
  "touchstart",
  (e) => {
    if (isModalOpen) return;
    e.preventDefault();
    pointer.x = (e.touches[0].clientX / sizes.width) * 2 - 1;
    pointer.y = -(e.touches[0].clientY / sizes.height) * 2 + 1;
  },
  { passive: false }
);

function handleRaycasterInteraction() {
  if (currentIntersects && currentIntersects.length > 0) {
    const object = currentIntersects[0].object;

    // Click animation
    if (object.userData.clickTimeline) {
      object.userData.clickTimeline.restart(); // always plays from start
    }

    if (object.name.includes("workbtn")) {
      showModal(modals.work);
    } else if (object.name.includes("aboutbtn")) {
      showModal(modals.about);
    } else if (object.name.includes("contactbtn")) {
      showModal(modals.contact);
    } else if (object.name.includes("legalbtn")) {
      showModal(modals.legal);
    }
  }

  if (!currentIntersects || currentIntersects.length === 0) return;

  const clickedObj = currentIntersects[0].object;

  if (clickedObj.name.includes("monitor") && currentIndex < 3) {
    if (musicPlaying && currentIndex < 3) {

      pcButtonMusic.currentTime = 0;
      pcButtonMusic.play();
    }
    nextIndex = currentIndex + 1;

    // Prepare new textures for blending
    if (monitorMesh?.material?.uniforms) {
      const uniforms = monitorMesh.material.uniforms;

      uniforms.uTextureA.value = monitor_texture[currentIndex];
      uniforms.uTextureB.value = monitor_texture[nextIndex];
      uniforms.uMix.value = 0.0;

      gsap.to(uniforms.uMix, {
        value: 1.0,
        duration: 0.5,
        ease: "power2.inOut",
        onComplete: () => {
          // After transition, set currentIndex = nextIndex and reset mix
          currentIndex = nextIndex;
          uniforms.uTextureA.value = monitor_texture[currentIndex];
          uniforms.uTextureB.value = monitor_texture[currentIndex];
          uniforms.uMix.value = 0.0;
        }
      });
    }
  }

  const match = clickedObj.name.match(/DJ[1-9]/);
  if (match) {
    const djKey = match[0];
    const src = `/audio/DJ/${djKey}.ogg`;

    if (musicPlaying) {
      // Only change src if needed
      if (!djAudio.src.endsWith(src)) {
        djAudio.src = src;
      }

      djAudio.currentTime = 0;
      djAudio.play();
    }
  }
  //--------------pc btn-----------------//
  if (clickedObj.name.includes("pcbtn")) {

    if (monitorMesh && monitorMesh.material && monitorMesh.material.uniforms) {
      currentIndex = 0;
      nextIndex = 1;

      const uniforms = monitorMesh.material.uniforms;

      uniforms.uTextureA.value = monitor_texture[currentIndex];
      uniforms.uTextureB.value = monitor_texture[currentIndex];
      uniforms.uMix.value = 0.0; // Show only Texture A

      if (musicPlaying) {

        pcButtonMusic.currentTime = 0;
        pcButtonMusic.play();
      }
    }
  }
  //------------slider------------//
  if (clickedObj.name.includes("slider") && sliderMesh) {
    if (musicPlaying) {
      sliderMusic.currentTime = 0;
      sliderMusic.play();
    }

    const orig = sliderMesh.userData.originalPosition;

    if (sliderIsAtOriginal) {
      // Move to offset position
      gsap.to(sliderMesh.position, {
        x: orig.x + sliderOffset.x,
        y: orig.y + sliderOffset.y,
        z: orig.z + sliderOffset.z,
        duration: 0.8,
        ease: "power2.inOut"
      });
    } else {
      // Move back to original
      gsap.to(sliderMesh.position, {
        x: orig.x,
        y: orig.y,
        z: orig.z,
        duration: 0.8,
        ease: "power2.inOut"
      });
    }

    sliderIsAtOriginal = !sliderIsAtOriginal;
  }

  if (clickedObj.name.includes("slider") || clickedObj.name.includes("pcbtn") || clickedObj.name.includes("DJ")) {

    // Save original color (only once per object)
    if (!clickedObj.userData.originalColor) {
      clickedObj.userData.originalColor = clickedObj.material.color.clone();
    }

    gsap.to(clickedObj.material.color, {
      r: 1, g: 3, b: 1,
      duration: 0.2,
      yoyo: true,
      repeat: 1,
      onComplete: () => {
        // Restore to original color (optional safety)
        clickedObj.material.color.copy(clickedObj.userData.originalColor);
      }
    });
  }
};

window.addEventListener(
  "touchend",
  (e) => {
    if (isModalOpen) return;
    e.preventDefault();
    handleRaycasterInteraction();
  },
  { passive: false }
);

window.addEventListener("click", handleRaycasterInteraction);

document.querySelectorAll(".modal-exit-button").forEach((button) => {
  button.addEventListener("touchend", (e) => {
    touchHappened = true;
    const modal = e.target.closest(".modal");
    hideModal(modal);
  },
    { passive: false }
  );

  button.addEventListener("click", (e) => {
    if (touchHappened) return;
    const modal = e.target.closest(".modal");
    hideModal(modal);
  },
    { passive: false }
  );
},
);
/**  -------------------------- Texture Setup -------------------------- */
const textureLoader = new THREE.TextureLoader(manager);
const textureMap = {
  terrain: {
    day: "/textures/terrain_texture.webp",
    night: "/textures/night-texture/terrain_texture_night.webp"
  },
  other: {
    day: "/textures/other_texture.webp",
    night: "/textures/night-texture/other_texture_night.webp"
  },
  pcwei: {
    day: "/textures/pcwei_texture.webp",
    night: "/textures/night-texture/pcwei_texture_night.webp"
  },
};

const monitor_texture = [textureLoader.load('/textures/monitor/monitor_A_texture.webp'),
textureLoader.load('/textures/monitor/monitor_B_texture.webp'),
textureLoader.load('/textures/monitor/monitor_C_texture.webp'),
textureLoader.load('/textures/monitor/monitor_D_texture.webp')];
monitor_texture.forEach(tex => {
  tex.flipY = false;
});

const loadedTextures = { day: {}, night: {} };

Object.entries(textureMap).forEach(([key, paths]) => {
  // Load and configure day texture
  const dayTexture = textureLoader.load(paths.day);
  dayTexture.flipY = false;
  dayTexture.colorSpace = THREE.SRGBColorSpace;
  dayTexture.minFilter = THREE.LinearFilter;
  dayTexture.magFilter = THREE.LinearFilter;
  loadedTextures.day[key] = dayTexture;

  // Load and configure night texture
  const nightTexture = textureLoader.load(paths.night);
  nightTexture.flipY = false;
  nightTexture.colorSpace = THREE.SRGBColorSpace;
  nightTexture.minFilter = THREE.LinearFilter;
  nightTexture.magFilter = THREE.LinearFilter;
  loadedTextures.night[key] = nightTexture;
});

/**  -------------------------- Model Loader -------------------------- */
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('/draco/');
const loader = new GLTFLoader(manager);
loader.setDRACOLoader(dracoLoader);

const hoverVariants = {
  default: {
    scale: [1.2, 1.2, 1.2],
    position: [0, 0, 0],
    rotation: [0, -Math.PI / 8, 0],
  },
  v2: {
    scale: [1.1, 1.5, 1.1],
    position: [0, 0.05, 0],
    rotation: [0, Math.PI / 18, 0],
  },
  v3: {
    scale: [1.2, 1.5, 1.2],
    position: [0, 0, 0],
    rotation: [0, 0, 0],
  },
  DJ: {
    scale: [1.2, 1.2, 1.2],
    position: [0, 0, 0],
    rotation: [0, Math.PI / 3, 0],
  },
  slider: {
    scale: [1.1, 1.2, 1.1],
    position: [0, 0, 0],
    rotation: [0, 0, 0],
  },
  pcbtn: {
    scale: [1.2, 1.1, 1.1],
    position: [0, 0, 0],
    rotation: [0, 0, 0],
  },
  Tthings: {
    scale: [1.2, 1, 1.2],
    position: [0, 0, 0],
    rotation: [0, 0, 0],
  },
};

const clickVariants = {
  DJ: {
    scale: [1.0, 1.5, 1.0],
    position: [0, -0.03, 0],
    duration: 0.3,
    easeOut: "elastic.out(1, 0.3)"
  },
  pcbtn: {
    scale: [1.0, 1.0, 1.0],
    position: [0, 0, -0.02],
    duration: 0.3,
    easeOut: "elastic.out(1, 0.3)"
  },
};

loader.load("/models/desert.glb", (glb) => {
  const modelRoot = glb.scene;
  scene.add(modelRoot);
  scene.userData.modelRoot = modelRoot;
  const envMap = new THREE.CubeTextureLoader()
    .setPath('/textures/skymap/')
    .load(['px.webp', 'nx.webp', 'py.webp', 'ny.webp', 'pz.webp', 'nz.webp']);
  scene.environment = envMap;

  glb.scene.traverse((child) => {
    if (!child.isMesh) return;
    const name = child.name;

    Object.keys(textureMap).forEach((key) => {
      if (child.name.includes(key)) {
        child.material = new THREE.MeshBasicMaterial({
          map: loadedTextures.day[key],
        });
        child.material.map.minFilter = THREE.LinearFilter;

        // Set textureKey so switchTheme works
        child.userData.textureKey = key;
      }
    });

    if (child.name.includes("slider")) {
      sliderMesh = child;
      child.userData.originalPosition = child.position.clone();
      raycasterObjects.push(child);
    }

    // Clouds
    if (child.name.includes("cloud")) {
      const key = "other";
      child.material = new THREE.MeshBasicMaterial({
        map: loadedTextures.day[key],
        transparent: true,
        opacity: 0.7,
        depthWrite: false
      });

      child.userData.textureKey = key;

      cloud.push({
        mesh: child,
        baseY: child.position.y,
        floatSpeed: Math.random() * 0.1 + 0.05,
        floatOffset: Math.random() * Math.PI * 2,
        rotationSpeed: Math.random() * 0.0002 + 0.00005
      });
    }

    if (child.name.includes("roA")) {
      rotAObjects.push({ mesh: child });
    } else if (name.includes("raB")) {
      rotBObjects.push({ mesh: child });
    }

    if (child.name.includes("raycaster")) {
      raycasterObjects.push(child);
    }

    if (child.name.includes("pcwei")) {
      const key = "pcwei";
      child.material = new THREE.MeshStandardMaterial({
        map: loadedTextures.day[key],
        metalness: 0.9,
        roughness: 0.2,
        envMap: envMap,
        envMapIntensity: 3.0,
      });

      child.userData.textureKey = key;
    }

    if (child.name.includes("monitor")) {
      monitorMesh = child;
      child.material = new THREE.ShaderMaterial({
        uniforms: {
          uTextureA: { value: monitor_texture[currentIndex] },
          uTextureB: { value: monitor_texture[nextIndex] },
          uBrightness: { value: 0.0 },
          uContrast: { value: 0.0 },
          uMix: { value: 0.0 },
          uAberrationAmount: { value: 0.01 }
        },
        vertexShader: monitorVertexShader,
        fragmentShader: monitorFragmentShader,
      });
    }

    if (child.name.includes("DJ") || child.name.includes("pcbtn")) {//just so
      let variantKey = null;
      if (child.name.includes("DJ")) variantKey = "DJ";
      else if (child.name.includes("pcbtn")) variantKey = "pcbtn";

      const config = clickVariants[variantKey];

      const [sx, sy, sz] = config.scale;
      const [dx, dy, dz] = config.position;
      const originalPosition = { ...child.position };

      const tl = gsap.timeline({ paused: true });

      tl.to(child.scale, {
        x: child.scale.x * sx,
        y: child.scale.y * sy,
        z: child.scale.z * sz,
        duration: config.duration * 0.5,
        ease: "power2.in"
      });

      tl.to(child.position, {
        x: originalPosition.x + dx,
        y: originalPosition.y + dy,
        z: originalPosition.z + dz,
        duration: config.duration * 0.5,
        ease: "power2.out"
      }, 0);

      tl.to(child.scale, {
        x: child.scale.x,
        y: child.scale.y,
        z: child.scale.z,
        duration: config.duration,
        ease: config.easeOut
      });

      tl.to(child.position, {
        x: originalPosition.x,
        y: originalPosition.y,
        z: originalPosition.z,
        duration: config.duration,
        ease: config.easeOut
      }, `-=${config.duration}`);

      child.userData.clickTimeline = tl;
      raycasterObjects.push(child);
    }

    if (child.name.includes("workbtn")) {
      workBtn = child;
    }
    if (child.name.includes("contactbtn")) {
      contactBtn = child;
    }
    if (child.name.includes("aboutbtn")) {
      aboutBtn = child;
    }
    if (child.name.includes("legalbtn")) {
      legalBtn = child;
    }
    if (child.name.includes("pcbtn")) {
      pcBtn = child;
    }
    if (child.name.includes("DJ1")) {
      DJ1 = child;
    }
    if (child.name.includes("DJ2")) {
      DJ2 = child;
    }
    if (child.name.includes("DJ3")) {
      DJ3 = child;
    }
    if (child.name.includes("DJ4")) {
      DJ4 = child;
    }
    if (child.name.includes("DJ5")) {
      DJ5 = child;
    }
    if (child.name.includes("DJ6")) {
      DJ6 = child;
    }
    if (child.name.includes("DJ7")) {
      DJ7 = child;
    }
    if (child.name.includes("DJ8")) {
      DJ8 = child;
    }
    if (child.name.includes("DJ9")) {
      DJ9 = child;
    }

    if (child.name.includes("hover")) {//that is alway hoverA in blender

      child.userData.initialScale = child.scale.clone();
      child.userData.initialPosition = child.position.clone();
      child.userData.initialRotation = child.rotation.clone();

      // Determine which variant to use
      let variantKey = "default";
      if (child.name.includes("v2")) variantKey = "v2";
      else if (child.name.includes("v3")) variantKey = "v3";
      else if (child.name.includes("DJ")) variantKey = "DJ";
      else if (child.name.includes("Tthings")) variantKey = "Tthings";
      else if (child.name.includes("slider")) variantKey = "slider";
      else if (child.name.includes("pcbtn")) variantKey = "pcbtn";

      const config = hoverVariants[variantKey];
      const [sx, sy, sz] = config.scale;
      const [px, py, pz] = config.position;
      const [rx, ry, rz] = config.rotation;

      const tl = gsap.timeline({ paused: true });

      tl.to(child.scale, {
        x: child.userData.initialScale.x * sx,
        y: child.userData.initialScale.y * sy,
        z: child.userData.initialScale.z * sz,
        duration: 0.3,
        ease: "power2.out"
      }, 0);

      tl.to(child.position, {
        x: child.userData.initialPosition.x + px,
        y: child.userData.initialPosition.y + py,
        z: child.userData.initialPosition.z + pz,
        duration: 0.3,
        ease: "power2.out"
      }, 0);

      tl.to(child.rotation, {
        x: child.userData.initialRotation.x + rx,
        y: child.userData.initialRotation.y + ry,
        z: child.userData.initialRotation.z + rz,
        duration: 0.3,
        ease: "power2.out"
      }, 0);

      child.userData.hoverTimeline = tl;
    }
    switchTheme(isDarkMode ? "night" : "day");// important for default texture mode!
  });
  /*   scene.add(glb.scene); */
});

function playIntroAnimation() {
  workBtn.scale.set(0, 0, 0);
  contactBtn.scale.set(0, 0, 0);
  aboutBtn.scale.set(0, 0, 0);
  legalBtn.scale.set(0, 0, 0);
  pcBtn.scale.set(0, 0, 0);
  sliderMesh.scale.set(0, 0, 0);
  DJ1.scale.set(0, 0, 0);
  DJ2.scale.set(0, 0, 0);
  DJ3.scale.set(0, 0, 0);
  DJ4.scale.set(0, 0, 0);
  DJ5.scale.set(0, 0, 0);
  DJ6.scale.set(0, 0, 0);
  DJ7.scale.set(0, 0, 0);
  DJ8.scale.set(0, 0, 0);
  DJ9.scale.set(0, 0, 0);

  const t1 = gsap.timeline({
    defaults: {
      duration: 0.8,
      ease: "back.out(1.8)"
    }
  });

  t1.to(workBtn.scale, {
    x: 1,
    y: 1,
    z: 1
  })
    .to(aboutBtn.scale, {
      x: 1,
      y: 1,
      z: 1
    }, "-=0.6")
    .to(contactBtn.scale, {
      x: 1,
      y: 1,
      z: 1
    }, "-=0.6")
    .to(legalBtn.scale, {
      x: 1,
      y: 1,
      z: 1
    }, "-=0.6");

  t1.eventCallback("onComplete", () => t2.play());

  const t2 = gsap.timeline({
    paused: true,
    defaults: {
      duration: 0.8,
      ease: "back.out(1.8)"
    }
  });

  t2.to(pcBtn.scale, {
    x: 1,
    y: 1,
    z: 1
  })
    .to(sliderMesh.scale, {
      x: 1,
      y: 1,
      z: 1
    }, "-=0.6")
    .to(DJ1.scale, {
      x: 1,
      y: 1,
      z: 1
    }, "-=0.6")
    .to(DJ2.scale, {
      x: 1,
      y: 1,
      z: 1
    }, "-=0.6")
    .to(DJ3.scale, {
      x: 1,
      y: 1,
      z: 1
    }, "-=0.6")

    .to(DJ4.scale, {
      x: 1,
      y: 1,
      z: 1
    }, "-=0.6")

    .to(DJ5.scale, {
      x: 1,
      y: 1,
      z: 1
    }, "-=0.6")

    .to(DJ6.scale, {
      x: 1,
      y: 1,
      z: 1
    }, "-=0.6")

    .to(DJ7.scale, {
      x: 1,
      y: 1,
      z: 1
    }, "-=0.6")

    .to(DJ8.scale, {
      x: 1,
      y: 1,
      z: 1
    }, "-=0.6")

    .to(DJ9.scale, {
      x: 1,
      y: 1,
      z: 1
    }, "-=0.6")
}

const gridSize = 100;
const gridRes = 1;

const gridgeometry = new THREE.PlaneGeometry(gridSize, gridSize, gridRes, gridRes);

const gridmaterial = new THREE.ShaderMaterial({
  transparent: true,
  /*  side: THREE.DoubleSide, */
  uniforms: {
    uSize: { value: gridSize },
    uLineColor: { value: new THREE.Color(0.2, 0.2, 0.2) }
  },
  vertexShader: gridVertexShader,
  fragmentShader: gridFragmentShader,
});

const grid = new THREE.Mesh(gridgeometry, gridmaterial);
grid.rotation.x = -Math.PI / 2;
grid.position.set(0.5, -2.01, 0.5);
scene.add(grid);

const fadePlaneMaterial = new THREE.ShaderMaterial({
  uniforms: {
    uColor: { value: new THREE.Color(0xff0000) } // Change for yPlane
  },
  vertexShader: fadePlaneVertexShader,
  fragmentShader: fadePlaneFragmentShader,
  transparent: true,
  depthWrite: false
});

const xPlane = new THREE.Mesh(
  new THREE.PlaneGeometry(100, 0.1),
  fadePlaneMaterial.clone()
);
xPlane.material.uniforms.uColor.value.set(0xff0000);
xPlane.rotation.x = -Math.PI / 2;
xPlane.position.set(0, -2, 0);
scene.add(xPlane);

const yPlane = new THREE.Mesh(
  new THREE.PlaneGeometry(100, 0.1),
  fadePlaneMaterial.clone()
);
yPlane.material.uniforms.uColor.value.set(0x00ff00);
yPlane.rotation.z = Math.PI / 2;
yPlane.rotation.x = -Math.PI / 2;
yPlane.position.set(0, -2, 0);
scene.add(yPlane);

/**  -------------------------- smoke -------------------------- */
const smokeGeometry = new THREE.PlaneGeometry(2.5, 8, 16, 64);
smokeGeometry.translate(-0.5, 5, -2);
smokeGeometry.scale(0.5, 0.5, 0.5);
smokeGeometry.rotateY(-Math.PI / 2.2);

const perlinTexture = textureLoader.load("/shaders/perlin.png");
perlinTexture.wrapS = THREE.RepeatWrapping;
perlinTexture.wrapT = THREE.RepeatWrapping;

const smokeMaterial = new THREE.ShaderMaterial({

  uniforms: {
    uTime: new THREE.Uniform(0),
    uPerlinTexture: new THREE.Uniform(perlinTexture),
    uColor: new THREE.Uniform(new THREE.Color(1, 1, 1)),
  },
  vertexShader: smokeVertexShader,
  fragmentShader: smokeFragmentShader,

  side: THREE.DoubleSide,
  transparent: true,
  depthWrite: false,
});

const smoke = new THREE.Mesh(smokeGeometry, smokeMaterial);
smoke.position.set(0, 2, 0);
scene.add(smoke);

/**  -------------------------- switchTheme -------------------------- */
function switchTheme(theme) {
  const modelRoot = scene.userData.modelRoot;
  if (!modelRoot) return;

  gridmaterial.uniforms.uLineColor.value.set(
    theme === "night" ? 0.4 : 0.2,
    theme === "night" ? 0.4 : 0.2,
    theme === "night" ? 0.4 : 0.2
  );

  smokeMaterial.uniforms.uColor.value.set(
    theme === "night" ? 0.7 : 1,
    theme === "night" ? 0.3 : 1,
    theme === "night" ? 0.1 : 1
  );
  modelRoot.traverse((child) => {
    if (!child.isMesh) return;

    const key = child.userData.textureKey;
    if (key && loadedTextures[theme]?.[key]) {
      const newTexture = loadedTextures[theme][key];
      if (child.material.map !== newTexture) {
        child.material.map = newTexture;
        child.material.needsUpdate = true;
      }
    }
  });

  scene.background = new THREE.Color(theme === "night" ? "#1a1a1a" : "#c5dba7");
}

const clock = new THREE.Clock();

let currentCursor = "default";

function setCursor(style) {
  if (style !== currentCursor) {
    document.body.style.cursor = style;
    currentCursor = style;
  }
}

const render = () => {
  controls.update();
  const time = clock.getElapsedTime();

  const startDeg = 180;
  const rangeDeg = 10;
  const angle = THREE.MathUtils.degToRad(startDeg) + Math.sin(time * 1.5) * THREE.MathUtils.degToRad(rangeDeg / 2);

  smokeMaterial.uniforms.uTime.value = time;

  cloud.forEach(c => {
    const mesh = c.mesh;
    mesh.position.y = c.baseY + Math.sin(time * c.floatSpeed + c.floatOffset) * 0.5;
    mesh.rotation.y += c.rotationSpeed;
  });

  rotAObjects.forEach(obj => {
    obj.mesh.rotation.x = angle;
  });
  rotBObjects.forEach(obj => {
    obj.mesh.rotation.x = -angle;
  });

  if (assetsReady && !isModalOpen) {
    // Raycaster
    raycaster.setFromCamera(pointer, camera);
    currentIntersects = raycaster.intersectObjects(raycasterObjects);

    let hoveredObject = null;
    let isMonitor = false;
    let isPointer = false;
    let isHoverA = false;

    if (currentIntersects.length > 0) {
      hoveredObject = currentIntersects[0].object;
      isMonitor = hoveredObject.name.includes("monitor");
      isPointer = hoveredObject.name.includes("pointer");
      isHoverA = hoveredObject.name.includes("hover");
    }

    if (isHoverA && !hoveredObject.userData.hoverDisabled) {
      if (hoveredObject !== currentHoveredObject) {

        if (currentHoveredObject && currentHoveredObject.userData.hoverTimeline) {
          currentHoveredObject.userData.hoverTimeline.reverse();
        }

        // Play new
        if (hoveredObject.userData.hoverTimeline) {
          hoveredObject.userData.hoverTimeline.play();
        }

        currentHoveredObject = hoveredObject;
      }
    } else {
      if (currentHoveredObject && currentHoveredObject.userData.hoverTimeline) {
        currentHoveredObject.userData.hoverTimeline.reverse();
        currentHoveredObject = null;
      }
    }

    if (isMonitor && currentIndex === 3) {
      setCursor("not-allowed");
    } else if (isPointer || isMonitor) {
      setCursor("pointer");
    } else {
      setCursor("default");
    }

    if (monitorAnimStarted && monitorMesh?.material?.uniforms) {
      const uniforms = monitorMesh.material.uniforms;

      monitorBrightness += (1.0 - monitorBrightness) * 0.05;
      monitorContrast += (1.0 - monitorContrast) * 0.05;

      uniforms.uBrightness.value = monitorBrightness;
      uniforms.uContrast.value = monitorContrast;

      // define when the animation is completed
      if (Math.abs(1.0 - monitorBrightness) < 0.01 && Math.abs(1.0 - monitorContrast) < 0.01) {
        uniforms.uBrightness.value = 1.0;
        uniforms.uContrast.value = 1.0;
        monitorAnimStarted = false;
      }
    }
  }

  // If monitor is showing texture index 3, make pcBtn red
if (pcBtn && pcBtn.material) {
  if (currentIndex === 3) {
    pcBtn.material.color.setRGB(4, 2, 2); // red
  } else {
    // Store original color if not stored yet
    if (!pcBtn.userData.originalColor) {
      pcBtn.userData.originalColor = pcBtn.material.color.clone();
    }
    pcBtn.material.color.copy(pcBtn.userData.originalColor);
  }
}

  if (currentCameraIndex === 2 && !cameraIndex2Effect) {
    cameraIndex2Effect = true;

    // Animate monitor brightness
    if (monitorMesh?.material?.uniforms) {
      gsap.to(monitorMesh.material.uniforms.uBrightness, {
        value: 1.18,
        duration: 0.7,
        yoyo: true,
        repeat: 1,
        ease: "power1.inOut"
      });
    }

// Glow for camera index 2 (skip pcBtn if already glowing from currentIndex 3)
const glowTargets = [
  sliderMesh,
  pcBtn.userData.glowActive ? null : pcBtn, // skip if already glowing
  DJ1, DJ2, DJ3, DJ4, DJ5, DJ6, DJ7, DJ8, DJ9
].filter(Boolean); // remove null

glowTargets.forEach(obj => {
  if (!obj?.material) return;

  if (!obj.userData.originalColor) {
    obj.userData.originalColor = obj.material.color.clone();
  }

  let targetColor = obj.name.includes("slider")
    ? { r: 3, g: 3, b: 3 }
    : { r: 1.5, g: 1.5, b: 1.5 };

  gsap.to(obj.material.color, {
    ...targetColor,
    duration: 0.7,
    yoyo: true,
    repeat: 1,
    onComplete: () => {
      obj.material.color.copy(obj.userData.originalColor);
    }
  });
});

    // Reset the trigger after ~1s to allow reactivation if desired (optional)
    setTimeout(() => {
      cameraIndex2Effect = false;
    }, 1500);
  }

  if (currentCameraIndex === 0) {
    if (!isLoopingGlowActive) {
      isLoopingGlowActive = true;

      const buttons = [workBtn, contactBtn, aboutBtn, legalBtn];

      loopGlowTimeline = gsap.timeline({ repeat: -1, paused: false });

      buttons.forEach((btn, index) => {
        if (!btn?.material) return;

        if (!btn.userData.originalColor) {
          btn.userData.originalColor = btn.material.color.clone();
        }

        loopGlowTimeline.to(btn.material.color, {
          r: 1.7,
          g: 1.7,
          b: 1.7,
          duration: 0.7,
          yoyo: true,
          repeat: 1,
          ease: "power1.inOut",
          onComplete: () => {
            btn.material.color.copy(btn.userData.originalColor);
          }
        }, index * 0.3); // stagger timing
      });
    }
  } else {
    if (isLoopingGlowActive && loopGlowTimeline) {
      loopGlowTimeline.kill();
      loopGlowTimeline = null;
      isLoopingGlowActive = false;

      // Reset colors just in case
      [workBtn, contactBtn, aboutBtn, legalBtn].forEach(btn => {
        if (btn?.userData?.originalColor) {
          btn.material.color.copy(btn.userData.originalColor);
        }
      });
    }
  }

  renderer.render(scene, camera);
  requestAnimationFrame(render);
  /*   console.log('Camera Position:', camera.position);
    console.log('Controls Target:', controls.target); */

};

render();