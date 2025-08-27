import * as THREE from 'three';
import { OrbitControls } from './utils/OrbitControls.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import gsap from "gsap";
import { Howl } from 'howler';

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
const CURSOR = { default: "default", pointer: "pointer", notAllowed: "not-allowed" };

const cloud = [], rotAObjects = [], rotBObjects = [];

let workBtn, contactBtn, aboutBtn, legalBtn, pcBtn;
let DJ1, DJ2, DJ3, DJ4, DJ5, DJ6, DJ7, DJ8, DJ9;

const ROT_START_RAD = THREE.MathUtils.degToRad(180);
const ROT_RANGE_RAD_HALF = THREE.MathUtils.degToRad(10 / 2);

const raycasterObjects = [];
let currentIntersects = [];
let currentHoveredObject = null;

currentIntersects.length = 0;

let currentIndex = 0;
let nextIndex = 1;

let pointerDirty = true;
let lastRaycastTime = 0;        // optional: periodic fallback
const RAYCAST_FPS = 30;         // optional: cap raycasts to 30fps
const RAYCAST_INTERVAL = 1 / RAYCAST_FPS;


let monitorMesh, sliderMesh;
let pcIndex3AnimSuppressed = false; // set true after click; cleared when we leave index 3
let pcIndex3Active = false;         // tracks if the wobble is currently running
let lastMonitorIndex = -1;          // change detector

let sliderIsAtOriginal = true;
const sliderOffset = new THREE.Vector3(0.025, 0, -0.5); // ← relative movement

const modals = {
  work: document.querySelector(".modal.work"),
  about: document.querySelector(".modal.about"),
  contact: document.querySelector(".modal.contact"),
  legal: document.querySelector(".modal.legal")
};

let introFinished = false;
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
/* manager.onLoad = () => {
  assetsReady = true;
  loadingText.textContent = `Loaded!`;
  enterButton.disabled = false;
  enterButtonMute.disabled = false;

  enterButton.classList.add("active");
  enterButtonMute.classList.add("active");
}; */

manager.onLoad = () => {
  // Skip loading screen completely
  assetsReady = true;
  loadingScreen.remove();
   playLoadingScreenExit(false);
  playIntroAnimation(); // Start scene 
  startMonitorWarmup();
};

function playLoadingScreenExit(withSound = true) {
  const tl = gsap.timeline({
    onComplete: () => {
      monitorAnimStarted = true; // start monitor glow
      loadingScreen.remove();
      playIntroAnimation();
      startMonitorWarmup();
    }
  });

  tl.to(loadingScreen, {
    transformOrigin: "center center",
    rotationX: 10,
    rotationY: -5,
    scale: 1.02, // tiny overshoot first
    y: "-2vh",
    duration: 0.4,
    ease: "power2.out"
  })
    .to(loadingScreen, {
      rotationX: -5,
      rotationY: 5,
      scale: 0.95,
      y: "1vh",
      duration: 0.3,
      ease: "power1.inOut"
    })
    .to(loadingScreen, {
      rotationX: 70,
      rotationY: -25,
      scale: 0.05,
      x: "20vw", // give it a nice curve to the side
      y: "-250vh",
      opacity: 0,
      duration: 1.2,
      ease: "expo.in"
    })
    .to(".white-overlay", { // soft iris-like flash
      opacity: 0.7,
      duration: 0.35,
      ease: "sine.inOut",
      yoyo: true,
      repeat: 1
    }, "-=0.8");

  if (withSound) {
    if (!backgroundMusic.playing()) {
      backgroundMusic.play();
    }
    musicPlaying = true;
    musicIcon.src = "/icon/music_note_124dp_3B3935_FILL0_wght700_GRAD-25_opsz48.svg";
  }
}

enterButton.addEventListener(
  "touchend",
  (e) => {
    touchHappened = true;
    e.preventDefault();
    playLoadingScreenExit(true);
  },
  { passive: false }
);

enterButton.addEventListener(
  "click",
  (e) => {
    if (touchHappened) return;
    e.preventDefault();
    playLoadingScreenExit(true);
  },
  { passive: false }
);

enterButtonMute.addEventListener(
  "touchend",
  (e) => {
    touchHappened = true;
    e.preventDefault();
    musicPlaying = false;
    playLoadingScreenExit(false);
  },
  { passive: false }
);

enterButtonMute.addEventListener(
  "click",
  (e) => {
    if (touchHappened) return;
    e.preventDefault();
    musicPlaying = false;
    playLoadingScreenExit(false);
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
const themeToggleBtn = document.getElementById("theme-toggle");
const themeIcon = document.getElementById("theme-icon");

let isDarkMode = false;

themeToggleBtn.addEventListener(
  "touchend",
  (e) => {
    touchHappened = true;
    e.preventDefault();

    isDarkMode = !isDarkMode;
    switchTheme(isDarkMode ? "night" : "day");

    if (musicPlaying) {
      uiMusic.currentTime = 0;
      uiMusic.play();
    }

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

themeToggleBtn.addEventListener(
  "click",
  (e) => {
    if (touchHappened) return;
    e.preventDefault();

    isDarkMode = !isDarkMode;
    switchTheme(isDarkMode ? "night" : "day");

    if (musicPlaying) {
      uiMusic.currentTime = 0;
      uiMusic.play();
    }

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
const djKeyMap = {
  DJ1: "DJ1",
  DJ2: "DJ2",
  DJ3: "DJ3",
  DJ4: "DJ4",
  DJ5: "DJ5",
  DJ6: "DJ6",
  DJ7: "DJ7",
  DJ8: "DJ8",
  DJ9: "DJ9",
};

const djSounds = {};

Object.values(djKeyMap).forEach((soundKey) => {
  djSounds[soundKey] = new Howl({
    src: [`/audio/DJ/${soundKey}.ogg`],
    preload: true,
    volume: 0.7,
  });
});
// UI button sounds
const pcButtonMusic = new Howl({
  src: ['/audio/sound/444492__breviceps__high-pitched-click.ogg'],
  volume: 0.7,
  preload: true
});

const sliderMusic = new Howl({
  src: ['/audio/sound/540478__breviceps__metallic-file-select.ogg'],
  volume: 0.7,
  preload: true
});

const uiMusic = new Howl({
  src: ['/audio/sound/475188__sheyvan__button-clicking-1.ogg'],
  volume: 0.7,
  preload: true
})

const backgroundMusic = new Howl({
  src: ["/audio/falselyclaimed-bit-beats-3-168873.ogg"],
  loop: true,
  volume: 0.2
});

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
      musicIcon.src = "/icon/music_note_124dp_3B3935_FILL0_wght700_GRAD-25_opsz48.svg";
    } else {
      backgroundMusic.pause();
      musicIcon.src = "/icon/music_off_124dp_3B3935_FILL0_wght700_GRAD-25_opsz48.svg";
    }
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
      musicIcon.src = "/icon/music_note_124dp_3B3935_FILL0_wght700_GRAD-25_opsz48.svg";
    } else {
      backgroundMusic.pause();
      musicIcon.src = "/icon/music_off_124dp_3B3935_FILL0_wght700_GRAD-25_opsz48.svg";
    }
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
  themeToggleBtn.classList.add("hidden");
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
  themeToggleBtn.classList.remove("hidden");
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

    if (musicPlaying) {
      uiMusic.currentTime = 0;
      uiMusic.play();
    }
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

    if (musicPlaying) {
      uiMusic.currentTime = 0;
      uiMusic.play();
    }
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

cameraToggleBtn.classList.add("glow");

function stopCameraBtnGlow() {
  cameraToggleBtn.classList.remove("glow");
}

cameraToggleBtn.addEventListener("click", () => {
  stopCameraBtnGlow();
});

cameraToggleBtn.addEventListener("touchend", (e) => {
  touchHappened = true;
  e.preventDefault();
  stopCameraBtnGlow();
}, { passive: false });

// ===== show animation index 3 helper =====
function tintMeshMaterials(mesh, toColor = { r: 3, g: 3, b: 3 }, duration = 0.5, delay = 0) {
  if (!mesh?.material) return;

  const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];

  mats.forEach((m) => {
    // store originals once
    if (!m.userData) m.userData = {};
    if (!m.userData._origColor && m.color) m.userData._origColor = m.color.clone();
    if (!m.userData._origEmissive && m.emissive) m.userData._origEmissive = m.emissive.clone();

    // prefer emissive if available (looks nicer on Standard/Physical)
    if (m.emissive) {
      gsap.to(m.emissive, {
        r: toColor.r, g: toColor.g, b: toColor.b,
        duration, delay, yoyo: true, repeat: 1,
        onComplete: () => { if (m.userData._origEmissive) m.emissive.copy(m.userData._origEmissive); }
      });
    } else if (m.color) {
      gsap.to(m.color, {
        r: toColor.r, g: toColor.g, b: toColor.b,
        duration, delay, yoyo: true, repeat: 1,
        onComplete: () => { if (m.userData._origColor) m.color.copy(m.userData._origColor); }
      });
    }
  });
}

function nudgePosition(mesh, delta = new THREE.Vector3(0.03, 0, -0.12), duration = 0.35, delay = 0) {
  if (!mesh) return;
  if (!mesh.userData._origPos) mesh.userData._origPos = mesh.position.clone();
  const p = mesh.userData._origPos;
  gsap.to(mesh.position, {
    x: p.x + delta.x, y: p.y + delta.y, z: p.z + delta.z,
    duration, delay, yoyo: true, repeat: 1, ease: "power2.inOut"
  });
}

function boopScale(mesh, scaleMul = 1.18, duration = 0.22, delay = 0) {
  if (!mesh) return;
  const base = (mesh.userData.initialScaleForIntro || mesh.userData.initialScale || mesh.scale).clone();
  gsap.to(mesh.scale, {
    x: base.x * scaleMul, y: base.y * scaleMul, z: base.z * scaleMul,
    duration, delay, yoyo: true, repeat: 1, ease: "power2.inOut",
    onComplete: () => mesh.scale.copy(base)
  });
}


let hintTL = null;

function index2RunInteractiveHint() {
  if (hintTL) { hintTL.kill(); hintTL = null; }

  const djs = [DJ1, DJ2, DJ3, DJ4, DJ5, DJ6, DJ7, DJ8, DJ9].filter(Boolean);
  hintTL = gsap.timeline({ defaults: { ease: "power2.inOut" } });

  // --- SLIDER: nudge + green tint
  if (sliderMesh) {
    nudgePosition(sliderMesh, new THREE.Vector3(0.03, 0, -0.61), 0.45, 0.10);
    tintMeshMaterials(sliderMesh, { r: 0.3, g: 3.0, b: 0.3 }, 0.6, 0.10);
  }

  // --- PCBTN: tilt + green tint
  if (pcBtn?.material) {
    if (!pcBtn.userData._origRot) pcBtn.userData._origRot = pcBtn.rotation.clone();
    hintTL
      .to(pcBtn.rotation, { z: pcBtn.userData._origRot.z + 0.2, duration: 0.40, yoyo: true, repeat: 1 }, 0.20);
    tintMeshMaterials(pcBtn, { r: 0.3, g: 3.0, b: 0.3 }, 0.6, 0.20);
  }

  // --- DJs: stagger boop + green tint
  djs.forEach((dj, i) => {
    const t = 0.35 + i * 0.08;
    boopScale(dj, 1.4, 0.26, t);
    tintMeshMaterials(dj, { r: 0.3, g: 3.0, b: 0.3 }, 0.55, t);
  });

  hintTL.eventCallback("onComplete", () => { hintTL = null; });
}

function index0RunInteractiveHint({
  cycles = 3,           // how many up/down bobs per button
  bobDY  = 0.05,        // bob height
  bobDur = 0.35,        // time for one up or down
  gap    = 0.08         // stagger between buttons
} = {}) {
  if (hintTL) { hintTL.kill(); hintTL = null; }

  const btns = [contactBtn, legalBtn, workBtn, aboutBtn].filter(Boolean);
  if (!btns.length) return;

  // cache bases once
  btns.forEach((b) => {
    if (!b.userData._origPos) b.userData._origPos = b.position.clone();
    const m = Array.isArray(b.material) ? b.material[0] : b.material;
    if (m) {
      if (!m.userData) m.userData = {};
      if (m.emissive && !m.userData._origEm)  m.userData._origEm  = m.emissive.clone();
      if (!m.emissive && m.color && !m.userData._origCol) m.userData._origCol = m.color.clone();
    }
  });

  // build arrays for batched tweens
  const poss   = btns.map(b => b.position);
  const mats   = btns.map(b => Array.isArray(b.material) ? b.material[0] : b.material).filter(Boolean);
  const colors = mats.map(m => m.emissive || m.color).filter(Boolean);

  hintTL = gsap.timeline({ defaults: { ease: "sine.inOut" } });

  // 1) Bobbing (position.y), repeated cycles times (yoyo makes it go up then down)
  hintTL.to(poss, {
    y: (i) => btns[i].userData._origPos.y + bobDY,
    duration: bobDur,
    yoyo: true,
    repeat: cycles * 2 - 1, // up+down is 2 steps; we already go up once, so -1
    stagger: { each: gap }
  }, 0);

  // 2) Color pulse in sync with the bob (shorter & snappier)
  //    Uses emissive when available, falls back to color.
  hintTL.to(colors, {
    // bump toward green each half-cycle
    keyframes: [
      { duration: bobDur * 0.35, onStart() {
          const t = this.targets()[0];
          t.r += 0.5; 
          t.g += 0.5; 
          t.b += 0.5; 
          
        }
      },
      { duration: bobDur * 0.55, onComplete() {
          // restore to cached base each half-cycle
          const t = this.targets()[0];
          const idx = colors.indexOf(t);
          const m = mats[idx];
          if (m?.userData?._origEm && m.emissive) t.copy(m.userData._origEm);
          else if (!m.emissive && m?.userData?._origCol && m.color) t.copy(m.userData._origCol);
        }
      }
    ],
    repeat: cycles * 2 - 1,
    stagger: { each: gap },
    ease: "power1.out"
  }, 0);

  // safety: snap everyone back at the very end
  hintTL.eventCallback("onComplete", () => {
    btns.forEach((b) => b.position.copy(b.userData._origPos));
    mats.forEach((m) => {
      if (m?.userData?._origEm && m.emissive) m.emissive.copy(m.userData._origEm);
      if (!m.emissive && m?.userData?._origCol && m.color) m.color.copy(m.userData._origCol);
    });
    hintTL = null;
  });
}
/**  --------------------------switch camera -------------------------- */
function switchCameraView() {
  const { position, target } = cameraPositions[currentCameraIndex];
  moveCameraTo(position, target);
  if (musicPlaying) {
    uiMusic.currentTime = 0;
    uiMusic.play();
  }
  // Advance index for next click
  currentCameraIndex = (currentCameraIndex + 1) % cameraPositions.length;
   if (currentCameraIndex === 2) {
    index2RunInteractiveHint();
  }
  if (currentCameraIndex === 0) {
  index0RunInteractiveHint();
}
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

/**  -------------------------- Camera & Renderer -------------------------- */
const camera = new THREE.PerspectiveCamera(
  35,
  sizes.width / sizes.height,
  0.1,
  200
);

if (!canvas) {
  canvas = document.createElement("canvas");
  document.getElementById("experience")?.appendChild(canvas);
}

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
  pointerDirty = true;
}
);

window.addEventListener(
  "touchstart",
  (e) => {
    if (isModalOpen) return;
    e.preventDefault();
    pointer.x = (e.touches[0].clientX / sizes.width) * 2 - 1;
    pointer.y = -(e.touches[0].clientY / sizes.height) * 2 + 1;
    pointerDirty = true;
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
      if (musicPlaying) {
        uiMusic.currentTime = 0;
        uiMusic.play();
      }
    } else if (object.name.includes("aboutbtn")) {
      showModal(modals.about);
      if (musicPlaying) {
        uiMusic.currentTime = 0;
        uiMusic.play();
      }
    } else if (object.name.includes("contactbtn")) {
      showModal(modals.contact);
      if (musicPlaying) {
        uiMusic.currentTime = 0;
        uiMusic.play();
      }
    } else if (object.name.includes("legalbtn")) {
      showModal(modals.legal);
      if (musicPlaying) {
        uiMusic.currentTime = 0;
        uiMusic.play();
      }
    }
  }

  if (!currentIntersects || currentIntersects.length === 0) return;

  const clickedObj = currentIntersects[0].object;

  // If monitor is clicked while video is active (index 4), blend back to slide 0
  if (clickedObj.name.includes("monitor") && (monitorVideoPlaying || currentIndex === 4)) {
    if (musicPlaying) {
      pcButtonMusic.currentTime = 0;
      pcButtonMusic.play();
    }

    if (monitorMesh?.material?.uniforms) {
      const u = monitorMesh.material.uniforms;
      const fromTex = ensureMonitorVideo();    // current video frame
      const toTex = monitor_texture[0];      // slide 0

      u.uTextureA.value = fromTex;
      u.uTextureB.value = toTex;
      u.uMix.value = 0.0;

      gsap.to(u.uMix, {
        value: 1.0,
        duration: 0.5,
        ease: "power2.inOut",
        onComplete: () => {
          currentIndex = 0;
          nextIndex = 1;
          u.uTextureA.value = toTex;
          u.uTextureB.value = toTex;
          u.uMix.value = 0.0;

          // stop playback AFTER the blend so there’s no snap
          stopMonitorVideo();
        }
      });
    } else {
      // fallback: just stop and snap if uniforms missing
      stopMonitorVideo();
      currentIndex = 0;
      nextIndex = 1;
    }

    return; // prevent falling into the slide-advance branch
  }

  if (clickedObj.name.includes("monitor") && currentIndex < 3) {

    if (monitorVideoPlaying) {
      stopMonitorVideo();
      pcIndex3AnimSuppressed = true;
      stopPcBtnIndex3Anim();
      pcIndex3Active = false;
      if (pcBtn?.userData?.originalColor) {
        pcBtn.material.color.copy(pcBtn.userData.originalColor);
      }

      if (monitorMesh?.material?.uniforms) {
        const u = monitorMesh.material.uniforms;
        currentIndex = 0;
        nextIndex = 1;
        u.uTextureA.value = monitor_texture[0];
        u.uTextureB.value = monitor_texture[0];
        u.uMix.value = 0.0;
      }

      if (musicPlaying) {
        pcButtonMusic.currentTime = 0;
        pcButtonMusic.play();
      }

      return; // end here, no slide advance
    }

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
  if (match && musicPlaying) {
    djSounds[match[0]].play();
  }
  //--------------pc btn-----------------//
  if (clickedObj.name.includes("pcbtn")) {
    if (musicPlaying) {
      pcButtonMusic.currentTime = 0;
      pcButtonMusic.play();
    }

    // Start/restart the video so frames are ready
    playMonitorVideoFromStart();

    // Blend current -> video (index 4)
    if (monitorMesh?.material?.uniforms) {
      const u = monitorMesh.material.uniforms;

      // from = current slide texture (or current video if already on 4)
      const fromTex = (currentIndex === 4) ? ensureMonitorVideo() : monitor_texture[currentIndex];
      const toTex = ensureMonitorVideo(); // video texture

      u.uTextureA.value = fromTex;
      u.uTextureB.value = toTex;
      u.uMix.value = 0.0;

      gsap.to(u.uMix, {
        value: 1.0,
        duration: 0.5,
        ease: "power2.inOut",
        onComplete: () => {
          currentIndex = 4;
          nextIndex = 4;
          // lock to video after the blend
          u.uTextureA.value = toTex;
          u.uTextureB.value = toTex;
          u.uMix.value = 0.0;
        }
      });
    }
  }
  //------------slider------------//
  if (clickedObj.name.includes("slider") && sliderMesh) {
    if (musicPlaying) {
      sliderMusic.currentTime = 0;
      sliderMusic.play();
    }

    const sliderOrigPosition = sliderMesh.userData.originalPosition;

    if (sliderIsAtOriginal) {
      // Move to offset position
      gsap.to(sliderMesh.position, {
        x: sliderOrigPosition.x + sliderOffset.x,
        y: sliderOrigPosition.y + sliderOffset.y,
        z: sliderOrigPosition.z + sliderOffset.z,
        duration: 0.8,
        ease: "power2.inOut"
      });
    } else {
      // Move back to original
      gsap.to(sliderMesh.position, {
        x: sliderOrigPosition.x,
        y: sliderOrigPosition.y,
        z: sliderOrigPosition.z,
        duration: 0.8,
        ease: "power2.inOut"
      });
    }

    sliderIsAtOriginal = !sliderIsAtOriginal;
  }

  if (clickedObj.name.includes("slider") || clickedObj.name.includes("DJ")) {

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
    if (musicPlaying) {
      uiMusic.currentTime = 0;
      uiMusic.play();
    }
  },
    { passive: false }
  );

  button.addEventListener("click", (e) => {
    if (touchHappened) return;
    const modal = e.target.closest(".modal");
    hideModal(modal);
    if (musicPlaying) {
      uiMusic.currentTime = 0;
      uiMusic.play();
    }
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

  scene.userData.modelRoot = modelRoot;
  const envMap = new THREE.CubeTextureLoader()
    .setPath('/textures/skymap/')
    .load(['px.webp', 'nx.webp', 'py.webp', 'ny.webp', 'pz.webp', 'nz.webp']);
  scene.environment = envMap;

  glb.scene.traverse((child) => {
    if (!child.isMesh) return;
    const name = child.name;

    /** ------------------ TEXTURE SETUP ------------------ **/
    Object.keys(textureMap).forEach((key) => {
      if (name.includes(key)) {
        child.material = new THREE.MeshBasicMaterial({
          map: loadedTextures.day[key],
        });
        child.material.map.minFilter = THREE.LinearFilter;
        child.userData.textureKey = key;
      }
    });

    if (name.includes("pcwei")) {
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

    /** ------------------ SLIDER ------------------ **/
    if (name.includes("slider")) {
      sliderMesh = child;
      child.userData.originalPosition = child.position.clone();
      raycasterObjects.push(child);
    }

    /** ------------------ ENV + CLOUDS ------------------ **/
    if (name.includes("cloud")) {
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

    if (name.includes("roA")) rotAObjects.push({ mesh: child });//yes weird name
    if (name.includes("raB")) rotBObjects.push({ mesh: child });
    if (name.includes("raycaster")) raycasterObjects.push(child);

    /** ------------------ MONITOR ------------------ **/
    if (name.includes("monitor")) {
      monitorMesh = child;
      child.userData.isMonitor = true;
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

    /** ------------------ INTRO SCALE FIX ------------------ **/
    const needsIntroHide =
      name.includes("DJ") ||
      name.includes("slider") ||
      name.includes("pcbtn") ||
      name.includes("workbtn") ||
      name.includes("aboutbtn") ||
      name.includes("contactbtn") ||
      name.includes("legalbtn");

    if (needsIntroHide) {
      // Store intended scale before hiding
      child.userData.initialScaleForIntro = child.scale.clone();
      // Hide for intro animation
      child.scale.set(0, 0, 0);
    }

    /** ------------------ CLICK TIMELINES ------------------ **/
    if (name.includes("DJ") || name.includes("pcbtn")) {
      let variantKey = name.includes("DJ") ? "DJ" : "pcbtn";
      const config = clickVariants[variantKey];
      const baseScale = child.userData.initialScaleForIntro || child.scale;
      const [sx, sy, sz] = config.scale;
      const [dx, dy, dz] = config.position;
      const originalPosition = child.position.clone();

      const tl = gsap.timeline({ paused: true });
      tl.to(child.scale, {
        x: baseScale.x * sx,
        y: baseScale.y * sy,
        z: baseScale.z * sz,
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
        x: baseScale.x,
        y: baseScale.y,
        z: baseScale.z,
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

    /** ------------------ BUTTON REFERENCES ------------------ **/
    if (name.includes("workbtn")) workBtn = child;
    if (name.includes("contactbtn")) contactBtn = child;
    if (name.includes("aboutbtn")) aboutBtn = child;
    if (name.includes("legalbtn")) legalBtn = child;
    if (name.includes("pcbtn")) pcBtn = child;
    if (name.includes("DJ1")) DJ1 = child;
    if (name.includes("DJ2")) DJ2 = child;
    if (name.includes("DJ3")) DJ3 = child;
    if (name.includes("DJ4")) DJ4 = child;
    if (name.includes("DJ5")) DJ5 = child;
    if (name.includes("DJ6")) DJ6 = child;
    if (name.includes("DJ7")) DJ7 = child;
    if (name.includes("DJ8")) DJ8 = child;
    if (name.includes("DJ9")) DJ9 = child;

    /** ------------------ HOVER TIMELINES ------------------ **/
    if (
      name.includes("DJ") ||
      name.includes("slider") ||
      name.includes("pcbtn") ||
      name.includes("workbtn") ||
      name.includes("aboutbtn") ||
      name.includes("contactbtn") ||
      name.includes("legalbtn") ||
      name.includes("hover") // keep existing hover triggers
    ) {
      // Always use original scale from intro storage if available
      child.userData.initialScale = child.userData.initialScaleForIntro
        ? child.userData.initialScaleForIntro.clone()
        : child.scale.clone();

      child.userData.initialPosition = child.position.clone();
      child.userData.initialRotation = child.rotation.clone();

      let variantKey = "default";
      if (name.includes("v2")) variantKey = "v2";
      else if (name.includes("v3")) variantKey = "v3";
      else if (name.includes("DJ")) variantKey = "DJ";
      else if (name.includes("Tthings")) variantKey = "Tthings";
      else if (name.includes("slider")) variantKey = "slider";
      else if (name.includes("pcbtn")) variantKey = "pcbtn";

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
  });
  scene.add(modelRoot);
  /** ------------------ THEME INIT ------------------ **/
  switchTheme(isDarkMode ? "night" : "day");
});

// video state
let monitorVideo = null;
let monitorVideoTexture = null;
let monitorVideoPlaying = false;
const MONITOR_VIDEO_SRC = "/Sequence 01_2.mp4";

function ensureMonitorVideo() {
  if (monitorVideoTexture) return monitorVideoTexture;

  monitorVideo = document.createElement("video");
  monitorVideo.src = MONITOR_VIDEO_SRC;
  monitorVideo.preload = "auto";
  monitorVideo.crossOrigin = "anonymous";
  monitorVideo.playsInline = true;
  monitorVideo.muted = true;     // guarantees playback on mobile after a tap
  monitorVideo.loop = false;
  monitorVideo.controls = false;

  monitorVideoTexture = new THREE.VideoTexture(monitorVideo);
  monitorVideoTexture.flipY = false;
  monitorVideoTexture.colorSpace = THREE.SRGBColorSpace;
  monitorVideoTexture.minFilter = THREE.LinearFilter;
  monitorVideoTexture.magFilter = THREE.LinearFilter;

  return monitorVideoTexture;
}

// start (or restart) video and show it on the monitor
function playMonitorVideoFromStart() {
  if (!monitorMesh?.material?.uniforms) return;

  const vTex = ensureMonitorVideo();

  // restart video safely
  try { monitorVideo.pause(); } catch (_) { }
  try { monitorVideo.currentTime = 0; } catch (_) { }
  monitorVideo.playbackRate = 1;
  const p = monitorVideo.play();
  if (p?.catch) p.catch(() => { });

  monitorVideoPlaying = true;

  // set indices so the click handler can blend into it
  nextIndex = 4;

  monitorVideo.onended = () => {
    monitorVideoPlaying = false;
    currentIndex = 0;
    nextIndex = 1;
    const u = monitorMesh.material.uniforms;
    u.uTextureA.value = monitor_texture[0];
    u.uTextureB.value = monitor_texture[0];
    u.uMix.value = 0.0;
  };
}

// stop video if it’s playing (no texture changes here)
function stopMonitorVideo() {
  if (!monitorVideoPlaying) return;
  monitorVideoPlaying = false;

  if (monitorVideo) {
    try { monitorVideo.pause(); } catch (_) { }
    try { monitorVideo.currentTime = 0; } catch (_) { }
    monitorVideo.onended = null;
  }

  currentIndex = 0;
  nextIndex = 1;
  if (monitorMesh?.material?.uniforms) {
    const u = monitorMesh.material.uniforms;
    u.uTextureA.value = monitor_texture[0];
    u.uTextureB.value = monitor_texture[0];
    u.uMix.value = 0.0;
  }
}

// --- pcbtn attention when monitor index = 3 ---
function startPcBtnIndex3Anim() {
  if (!pcBtn) return;
  if (pcBtn.userData.index3TL) return; // already running

  if (!pcBtn.userData.originalRot) pcBtn.userData.originalRot = pcBtn.rotation.clone();

  const baseR = pcBtn.userData.originalRot;

  const tl = gsap.timeline({ repeat: -1, yoyo: true, defaults: { ease: "sine.inOut", duration: 0.6 } });
  tl.to(pcBtn.rotation, { z: baseR.z + 0.22 }, 0); // slight tilt

  pcBtn.userData.index3TL = tl;
  pcBtn.userData.glowActive = true; // you referenced this flag elsewhere
}

function stopPcBtnIndex3Anim() {
  if (!pcBtn) return;
  const tl = pcBtn.userData.index3TL;
  if (tl) { tl.kill(); pcBtn.userData.index3TL = null; }

  if (pcBtn.userData.originalRot) pcBtn.rotation.copy(pcBtn.userData.originalRot);
  pcBtn.userData.glowActive = false;
}

function playIntroAnimation() {
  introFinished = false;
  const t1 = gsap.timeline({
    defaults: { duration: 0.8, ease: "back.out(1.8)" }
  });

  t1.to(workBtn.scale, { x: 1, y: 1, z: 1 })
    .to(aboutBtn.scale, { x: 1, y: 1, z: 1 }, "-=0.6")
    .to(contactBtn.scale, { x: 1, y: 1, z: 1 }, "-=0.6")
    .to(legalBtn.scale, { x: 1, y: 1, z: 1 }, "-=0.6")
    .eventCallback("onComplete", () => t2.play());

  const t2 = gsap.timeline({
    paused: true,
    defaults: { duration: 0.7, ease: "back.out(1.8)" }
  });

  t2.to(pcBtn.scale, { x: 1, y: 1, z: 1 })
    .to(sliderMesh.scale, { x: 1, y: 1, z: 1 }, "-=0.6")
    .to(DJ1.scale, { x: 1, y: 1, z: 1 }, "-=0.6")
    .to(DJ2.scale, { x: 1, y: 1, z: 1 }, "-=0.6")
    .to(DJ3.scale, { x: 1, y: 1, z: 1 }, "-=0.6")
    .to(DJ4.scale, { x: 1, y: 1, z: 1 }, "-=0.6")
    .to(DJ5.scale, { x: 1, y: 1, z: 1 }, "-=0.6")
    .to(DJ6.scale, { x: 1, y: 1, z: 1 }, "-=0.6")
    .to(DJ7.scale, { x: 1, y: 1, z: 1 }, "-=0.6")
    .to(DJ8.scale, { x: 1, y: 1, z: 1 }, "-=0.6")
    .to(DJ9.scale, { x: 1, y: 1, z: 1 }, "-=0.6")
    .eventCallback("onComplete", () => {
      introFinished = true;
    });
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

/**  -------------------------- helpers -------------------------- */
const clock = new THREE.Clock();

let currentCursor = "default";

function setCursor(style) {
  if (style !== currentCursor) {
    document.body.style.cursor = style;
    currentCursor = style;
  }
}

function startMonitorWarmup() {
  if (!monitorMesh?.material?.uniforms) return;
  const u = monitorMesh.material.uniforms;
  gsap.to(u.uBrightness, { value: 1.0, duration: 1.2, ease: "power2.out" });
  gsap.to(u.uContrast, { value: 1.0, duration: 1.2, ease: "power2.out" });
}

function enterHover(obj) {
  if (!obj?.userData?.hoverTimeline || obj.userData.hoverDisabled) return;
  obj.userData.hoverTimeline.play();
}
function leaveHover(obj) {
  if (!obj?.userData?.hoverTimeline) return;
  obj.userData.hoverTimeline.reverse();
}

let monitorHoverActive = false;
let monitorHoverTL = null;

function monitorHoverEnter() {
  if (!monitorMesh?.material?.uniforms || monitorHoverActive) return;
  monitorHoverActive = true;
  const u = monitorMesh.material.uniforms;
  monitorHoverTL?.kill();
  monitorHoverTL = gsap.timeline();
  monitorHoverTL
    .to(u.uBrightness, { value: 1.18, duration: 0.25, ease: "power2.out" }, 0)
    .to(u.uContrast, { value: 1.18, duration: 0.25, ease: "power2.out" }, 0);
}

function monitorHoverLeave() {
  if (!monitorMesh?.material?.uniforms) return;
  monitorHoverActive = false;
  const u = monitorMesh.material.uniforms;
  monitorHoverTL?.kill();
  monitorHoverTL = gsap.timeline();
  monitorHoverTL
    .to(u.uBrightness, { value: 1.0, duration: 0.25, ease: "power2.inOut" }, 0)
    .to(u.uContrast, { value: 1.0, duration: 0.25, ease: "power2.inOut" }, 0);
}

const render = () => {
  controls.update();
  const time = clock.getElapsedTime();

  const angle = ROT_START_RAD + Math.sin(time * 1.5) * ROT_RANGE_RAD_HALF;

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
    const now = clock.getElapsedTime();
    if (pointerDirty || (now - lastRaycastTime) >= RAYCAST_INTERVAL) {
      currentIntersects.length = 0; // reuse the same array
      raycaster.setFromCamera(pointer, camera);
      raycaster.intersectObjects(raycasterObjects, false, currentIntersects);

      let hoveredObject = null;
      let isMonitor = false;
      let isPointer = false;
      let isHoverA = false;

      if (currentIntersects.length > 0) {
        hoveredObject = currentIntersects[0].object;
        isMonitor = !!hoveredObject.userData?.isMonitor;
        isPointer = hoveredObject.name.includes("pointer");
        isHoverA = hoveredObject.name.includes("hover");
      }

      // after setting hoveredObject & isMonitor
      if (isMonitor) {
        monitorHoverEnter();
      } else if (monitorHoverActive) {
        // pointer moved away from monitor
        monitorHoverLeave();
      }

      if (isHoverA && !hoveredObject?.userData?.hoverDisabled) {
        if (hoveredObject !== currentHoveredObject) {
          leaveHover(currentHoveredObject);
          enterHover(hoveredObject);
          currentHoveredObject = hoveredObject;
        }
      } else if (currentHoveredObject) {
        leaveHover(currentHoveredObject);
        currentHoveredObject = null;
      }

      if (isMonitor && currentIndex === 3) {
        setCursor(CURSOR.notAllowed);
      } else if (isPointer || isMonitor) {
        setCursor(CURSOR.pointer);
      } else {
        setCursor(CURSOR.default);
      }

      if (currentIntersects.length === 0) {
        if (monitorHoverActive) monitorHoverLeave();
        leaveHover(currentHoveredObject);
      }
    }
  }

  // --- keep pcbtn "index 3" attention  ---
  if (lastMonitorIndex !== currentIndex && pcBtn && pcBtn.material) {
    const at3 = currentIndex === 3;

    if (at3) {
      if (pcIndex3AnimSuppressed) {
        // user just clicked pcbtn while it was animating -> keep it stopped
        stopPcBtnIndex3Anim();
        pcIndex3Active = false;
        if (pcBtn.userData.originalColor) {
          pcBtn.material.color.copy(pcBtn.userData.originalColor);
        }
      } else {
        // allowed to animate at index 3
        if (!pcIndex3Active) {
          if (!pcBtn.userData.originalColor) {
            pcBtn.userData.originalColor = pcBtn.material.color.clone();
          }
          pcBtn.material.color.setRGB(4, 2, 2);
          startPcBtnIndex3Anim();
          pcIndex3Active = true;
        }
      }
    } else {
      // leaving index 3: stop animation, restore color, and clear suppression
      if (pcIndex3Active) {
        stopPcBtnIndex3Anim();
        pcIndex3Active = false;
      }
      if (pcBtn.userData.originalColor) {
        pcBtn.material.color.copy(pcBtn.userData.originalColor);
      }
      if (lastMonitorIndex === 3) {
        pcIndex3AnimSuppressed = false; // next time we come back to 3, the wobble may run again
      }
    }
    lastMonitorIndex = currentIndex;
  }

  renderer.render(scene, camera);
  requestAnimationFrame(render);
  /*   console.log('Camera Position:', camera.position);
    console.log('Controls Target:', controls.target); */
};

render();