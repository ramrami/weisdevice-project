/**  -------------------------- Imports -------------------------- */
/* import { compileString } from "sass"; */
import * as THREE from 'three';
import { OrbitControls } from './utils/OrbitControls.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import gsap from "gsap";
import { Howl } from 'howler';

/* import { ThreeMFLoader } from "three/examples/jsm/Addons.js";
import { workgroupArray } from "three/tsl";

/**  -------------------------- Global Variables -------------------------- */
const canvas = document.querySelector("#experience-canvas");

const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

const cloud = [];
const rotAObjects = [];
const rotBObjects = [];

let isModalOpen = false;

const raycasterObjects = [];
let currentIntersects = [];//was null i changed notsure
let currentHoveredObject = null;


const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const scene = new THREE.Scene();

let currentIndex = 0;
let nextIndex = 1;
let monitorMesh = null;

let sliderMesh = null;
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

const manager = new THREE.LoadingManager();

manager.onProgress = (url, loaded, total) => {
  const percent = Math.floor((loaded / total) * 100);
  progressBar.value = percent;
  loadingText.textContent = `Loading ${loaded} of ${total}...`;
};

manager.onLoad = () => {
  loadingText.textContent = `Loaded!`;
  enterButton.disabled = false;
  enterButton.classList.add("active");
};

// When button is clicked, hide loading screen and start experience
enterButton.addEventListener("click", () => {
    bgMusic.play()
    bgMusic.volume = 0.5;
     musicPlaying = true;
  musicIcon.src = "/icon/music_note_124dp_3B3935_FILL0_wght700_GRAD-25_opsz48.svg";
  loadingScreen.classList.add("hide");
  loadingScreen.addEventListener("transitionend", () => loadingScreen.remove());
});

document.addEventListener("DOMContentLoaded", function () {
  const tipText = document.getElementById("tip-text");

  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  if (isTouchDevice) {
    tipText.textContent = "💡 Tip: Tap and swipe to explore.";
  } else {
    tipText.textContent = "💡 Tip: Click and drag to explore.";
  }
});

/**  -------------------------- music -------------------------- */

// DJ audio setup with Howler
const djAudioMap = {};

for (let i = 1; i <= 9; i++) {
  djAudioMap[`DJ${i}`] = new Howl({
    src: [`/audio/DJ/DJ${i}.ogg`],
    volume: 0.7,
    preload: true,
  });
}

// UI button sounds
const pcButtonSound = new Howl({
  src: ['/audio/sound/403007__inspectorj__ui-confirmation-alert-a2.ogg'],
  volume: 0.7,
});

const sliderSound = new Howl({
  src: ['/audio/sound/71853__ludvique__record_scratch.ogg'],
  volume: 0.7,
});

const bgMusic = new Howl({
  src: ['public/audio/frankum__vintage-elecro-pop-loop.ogg'],
  loop: true,
  volume: 0.5
});

const musicIcon = document.getElementById("music-icon");
const toggleBtn = document.getElementById("music-toggle");

let musicPlaying = false;

toggleBtn.addEventListener("click", () => {
  musicPlaying = !musicPlaying;

  if (musicPlaying) {
    bgMusic.play();
    musicIcon.src = "/icon/music_note_124dp_3B3935_FILL0_wght700_GRAD-25_opsz48.svg";
    Howler.mute(false);
  } else {
    bgMusic.pause();
    musicIcon.src = "/icon/music_off_124dp_3B3935_FILL0_wght700_GRAD-25_opsz48.svg";
    Howler.mute(true);
  }
});
/**  -------------------------- modal -------------------------- */
const experience = document.getElementById("experience");

const showModal = (modal) => {
  modal.classList.remove("hidden");
  isModalOpen = true;
  controls.enabled = false;

  experience.classList.add("blur");

  toggleBtn.classList.add("hidden");


  raycasterObjects.forEach(obj => {
    if (obj.userData && obj.userData.hoverTimeline) {
      obj.userData.hoverDisabled = true;
    }
  });

  document.body.style.cursor = "default";
  currentIntersects = [];

  gsap.set(modal, { opacity: 0 });
  gsap.to(modal, { opacity: 1, duration: 0.5 });
};

const hideModal = (modal) => {
    isModalOpen = false;
  controls.enabled = true;
  
  experience.classList.remove("blur");

  toggleBtn.classList.remove("hidden");


    raycasterObjects.forEach(obj => {
    if (obj.userData && obj.userData.hoverTimeline) {
      obj.userData.hoverDisabled = false;
    }
  });

  gsap.to(modal, {
    opacity: 0,
    duration: 0.5,
    onComplete: () => {
      modal.classList.add("hidden");
    }
  });
};
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
  camera.position.set(-12.909337086928565, 8.550931829236296, 20.598656336120253);
  controls.target.set(0.3329815555892619, 2.654559498384689, -0.5054645533440316);
} else {
  camera.position.set(-5.522436315597833, 8.036417974169375, 14.73025582438407);
  controls.target.set(-0.03621834906034986, 2.0794669599639444, -0.9874727502508671);
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

window.addEventListener("touchstart", (e) => {
  pointer.x = (e.touches[0].clientX / sizes.width) * 2 - 1;
  pointer.y = -(e.touches[0].clientY / sizes.height) * 2 + 1;
},
  { passive: false }//important for mobile 
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
};

window.addEventListener("click", handleRaycasterInteraction);

let touchHappened = false;
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
  terrain: { day: "/textures/terrain_texture.webp" },
  other: { day: "/textures/other_texture.webp" },
  pcwei: { day: "/textures/pcwei_texture.webp" },
};

const monitor_texture = [textureLoader.load('/textures/monitor/monitor_A_texture.webp'),
textureLoader.load('/textures/monitor/monitor_B_texture.webp'),
textureLoader.load('/textures/monitor/monitor_C_texture.webp'),
textureLoader.load('/textures/monitor/monitor_D_texture.webp')];
monitor_texture.forEach(tex => {
  tex.flipY = false; // or true if it was already flipped
});

const loadedTextures = { day: {} };
Object.entries(textureMap).forEach(([key, paths]) => {
  const dayTexture = textureLoader.load(paths.day);
  dayTexture.flipY = false;
  dayTexture.colorSpace = THREE.SRGBColorSpace;
  loadedTextures.day[key] = dayTexture;
});

/**  -------------------------- Model Loader -------------------------- */

const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('/draco/');
const loader = new GLTFLoader(manager);
loader.setDRACOLoader(dracoLoader);

const hoverVariants = {
  default: {
    scale: [1.3, 1.3, 1.3],
    position: [0.1, -0.1, 0.1],
    rotation: [0, -Math.PI / 8, 0], // [x, y, z]
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
  const envMap = new THREE.CubeTextureLoader()
    .setPath('/textures/skymap/')
    .load(['px.webp', 'nx.webp', 'py.webp', 'ny.webp', 'pz.webp', 'nz.webp']);
  scene.environment = envMap;

  glb.scene.traverse((child) => {
    if (!child.isMesh) return;
    const name = child.name;

    // Apply textures
    Object.keys(textureMap).forEach((key) => {
      if (child.name.includes(key)) {
        const material = new THREE.MeshBasicMaterial({
          map: loadedTextures.day[key],
        });
        material.map.minFilter = THREE.LinearFilter;
        child.material = material;
      }
    });


    if (child.name.includes("slider")) {
      sliderMesh = child;
      child.userData.originalPosition = child.position.clone(); // store original position
      raycasterObjects.push(child); // make sure it's interactable
    }

    // Clouds
    if (child.name.includes("cloud")) {
      child.material.transparent = true;
      child.material.opacity = 0.7;
      cloud.push({
        mesh: child,
        baseY: child.position.y,
        floatSpeed: Math.random() * 0.1 + 0.05,
        floatOffset: Math.random() * Math.PI * 2,
        rotationSpeed: Math.random() * 0.0002 + 0.00005
      });
    }

    // Animate parts
    if (child.name.includes("roA")) {
      rotAObjects.push({ mesh: child });
    } else if (name.includes("raB")) {
      rotBObjects.push({ mesh: child });
    }

    // Raycaster targets
    if (child.name.includes("raycaster")) {
      raycasterObjects.push(child);
    }

    // Special metallic material for pcwei
    if (child.name.includes("pcwei")) {
      const oldMap = child.material.map;
      child.material = new THREE.MeshStandardMaterial({
        map: oldMap,
        metalness: 0.9,
        roughness: 0.2,
        envMap: envMap,
        envMapIntensity: 3.0,
      });
    }


    if (child.name.includes("monitor")) {
      monitorMesh = child; // store reference for later updates
      child.material = new THREE.ShaderMaterial({
        uniforms: {
          uTextureA: { value: monitor_texture[currentIndex] },
          uTextureB: { value: monitor_texture[nextIndex] },
          uBrightness: { value: 1.0 },
          uContrast: { value: 1.0 },
          uMix: { value: 0.0 },
          uAberrationAmount: { value: 0.01 }
        },
        vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
        fragmentShader: `
uniform sampler2D uTextureA;
uniform sampler2D uTextureB;
uniform float uBrightness;
uniform float uContrast;
uniform float uMix;
uniform float uAberrationAmount; // Add this uniform in JS
varying vec2 vUv;

void main() {
  // Chromatic offset vector (can be radial, here it's a fixed offset)
  vec2 offset = vec2(uAberrationAmount);

  // Sample each channel at slightly different UVs
  vec4 texA = vec4(
    texture2D(uTextureA, vUv + offset).r,   // Red
    texture2D(uTextureA, vUv).g,            // Green
    texture2D(uTextureA, vUv - offset).b,   // Blue
    1.0
  );

  vec4 texB = vec4(
    texture2D(uTextureB, vUv + offset).r,
    texture2D(uTextureB, vUv).g,
    texture2D(uTextureB, vUv - offset).b,
    1.0
  );

  vec4 mixed = mix(texA, texB, uMix);

  // Apply brightness and contrast
  mixed.rgb = (mixed.rgb - 0.5) * uContrast + 0.5;
  mixed.rgb *= uBrightness;

  gl_FragColor = mixed;
}
      `,
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

  });

  scene.add(glb.scene);
});


    const gridSize = 100;
    const gridRes = 1;

    const gridgeometry = new THREE.PlaneGeometry(gridSize, gridSize, gridRes, gridRes);

    const gridmaterial = new THREE.ShaderMaterial({
      transparent: true,
     /*  side: THREE.DoubleSide, */
      uniforms: {
        uSize: { value: gridSize }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv - 0.5;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
fragmentShader: `
  varying vec2 vUv;
  uniform float uSize;

  float gridLine(float coord, float size) {
    float line = abs(fract(coord * size) - 0.5);
    return smoothstep(0.1, 0.0, line); // smooth lines
  }

  void main() {
    float dist = length(vUv) * 2.0;
    float alpha = smoothstep(1.0, 0.5, dist);

    float xLine = gridLine(vUv.x, uSize);
    float yLine = gridLine(vUv.y, uSize);
    float lineStrength = max(xLine, yLine);

    gl_FragColor = vec4(vec3(0.2), alpha * lineStrength * 0.1);
  }
`
    });

    const grid = new THREE.Mesh(gridgeometry, gridmaterial);
    grid.rotation.x = -Math.PI / 2;
    grid.position.set(0.5,-2.01,0.5);
    scene.add(grid);

// X-axis "fat line" (red)
const xPlane = new THREE.Mesh(
  new THREE.PlaneGeometry(100, 0.1),
  new THREE.MeshBasicMaterial({
    color: 0xff0000,
    transparent: true,
    opacity: 0.3, // adjust as needed
    depthWrite: false // prevents z-fighting if needed
  })
);
xPlane.rotation.x = -Math.PI / 2;
xPlane.position.set(0, -2, 0);
scene.add(xPlane);

// Y-axis "fat line" (green)
const yPlane = new THREE.Mesh(
  new THREE.PlaneGeometry(100, 0.1),
  new THREE.MeshBasicMaterial({
    color: 0x00ff00,
    transparent: true,
    opacity: 0.3,
    depthWrite: false
  })
);
yPlane.rotation.z = Math.PI / 2;
yPlane.rotation.x = -Math.PI / 2;
yPlane.position.set(0, -2, 0);
scene.add(yPlane);


/**  -------------------------- smoke -------------------------- */
const smokeGeometry = new THREE.PlaneGeometry(2.5, 8, 16, 64);
smokeGeometry.translate(-0.5, 5, -2); // slight upward offset
smokeGeometry.scale(0.5, 0.5, 0.5);
smokeGeometry.rotateY(-Math.PI / 2.2);

const perlinTexture = textureLoader.load("/shaders/perlin.png");
perlinTexture.wrapS = THREE.RepeatWrapping;
perlinTexture.wrapT = THREE.RepeatWrapping;
const smokeVertexShader = `
uniform float uTime;
uniform sampler2D uPerlinTexture;

varying vec2 vUv;

vec2 rotate2D(vec2 pos, float angle) {
  float s = sin(angle);
  float c = cos(angle);
  return mat2(c, -s, s, c) * pos;
}

void main() {
  vec3 newPosition = position;

  float twistPerlin = texture(uPerlinTexture, vec2(0.5, uv.y * 0.2 - uTime * 0.01)).r;
  float angle = twistPerlin * 3.0;
  newPosition.xz = rotate2D(newPosition.xz, angle);

  vec2 windOffset = vec2(
    texture(uPerlinTexture, vec2(0.25, uTime * 0.01)).r - 0.5,
    texture(uPerlinTexture, vec2(0.75, uTime * 0.01)).r - 0.5
  );
  windOffset *= pow(uv.y, 2.0) * 1.5;
  newPosition.xz += windOffset;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
  vUv = uv;
}
`;
const smokeFragmentShader = `
uniform float uTime;
uniform sampler2D uPerlinTexture;

varying vec2 vUv;

void main() {
  vec2 smokeUv = vUv;
  smokeUv.x *= 0.5;
  smokeUv.y *= 0.3;
  smokeUv.y -= uTime * 0.04;

  float smoke = texture(uPerlinTexture, smokeUv).r;
  smoke = smoothstep(0.5, 1.0, smoke);

  smoke *= smoothstep(0.0, 0.1, vUv.x);
  smoke *= smoothstep(1.0, 0.9, vUv.x);
  smoke *= smoothstep(0.0, 0.1, vUv.y);
  smoke *= smoothstep(1.0, 0.4, vUv.y);

/* gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0); */
gl_FragColor = vec4(1, 1, 1, smoke); 
}
`;
const smokeMaterial = new THREE.ShaderMaterial({
  vertexShader: smokeVertexShader,
  fragmentShader: smokeFragmentShader,
  uniforms: {
    uTime: new THREE.Uniform(0),
    uPerlinTexture: new THREE.Uniform(perlinTexture),
  },
  side: THREE.DoubleSide,
  transparent: true,
  depthWrite: false,
});

const smoke = new THREE.Mesh(smokeGeometry, smokeMaterial);
smoke.position.set(0, 2, 0);
scene.add(smoke);



const clock = new THREE.Clock();

scene.background = new THREE.Color("#c5dba7");



const render = () => {
  controls.update();
  const time = clock.getElapsedTime();

  // Animate rotation and clouds
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

  if(!isModalOpen) {

  
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

  // Handle hoverA animation
  if (isHoverA&& !hoveredObject.userData.hoverDisabled) {
    if (hoveredObject !== currentHoveredObject) {
      // Stop previous
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
  // Cursor style
  if (isMonitor && currentIndex === 3) {
    document.body.style.cursor = "not-allowed";
  } else if (isPointer || isMonitor) {
    document.body.style.cursor = "pointer";
  } else {
    document.body.style.cursor = "default";
  }

  // Monitor hover visual effect
  if (monitorMesh?.material?.uniforms) {
    const uniforms = monitorMesh.material.uniforms;
    if (isMonitor) {
      gsap.to(uniforms.uBrightness, { value: 1.2, duration: 0.5 });
      gsap.to(uniforms.uContrast, { value: 1.3, duration: 0.5 });
    } else {
      gsap.to(uniforms.uBrightness, { value: 1.0, duration: 0.5 });
      gsap.to(uniforms.uContrast, { value: 1.0, duration: 0.5 });
    }
  }

  }

  renderer.render(scene, camera);
  requestAnimationFrame(render);
};

render();



window.addEventListener("click", () => {
  if (!currentIntersects || currentIntersects.length === 0) return;

  const clickedObj = currentIntersects[0].object;

  if (clickedObj.name.includes("monitor") && currentIndex < 3) {
    if (musicPlaying && currentIndex < 3) {
      
      pcButtonSound.play();
    }
    nextIndex = currentIndex + 1;

    // Prepare new textures for blending
    if (monitorMesh.material.uniforms) {
      const uniforms = monitorMesh.material.uniforms;

      uniforms.uTextureA.value = monitor_texture[currentIndex];
      uniforms.uTextureB.value = monitor_texture[nextIndex];
      uniforms.uMix.value = 0.0;

      // Animate mix from 0 to 1
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

// Play a DJ track
const match = clickedObj.name.match(/DJ[1-9]/);
if (match) {
  const djKey = match[0];

  // Stop all others
  Object.values(djAudioMap).forEach(sound => sound.stop());

  if (musicPlaying) {
    djAudioMap[djKey].play();
  }
}

// PC button click
if (clickedObj.name.includes("pcbtn") && musicPlaying) {
  pcButtonSound.play();
}

// Slider toggle
if (clickedObj.name.includes("slider") && musicPlaying) {
  sliderSound.play();
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
       
        pcButtonSound.play();
      }
    }
  }
  //------------slider------------//


  if (clickedObj.name.includes("slider") && sliderMesh) {
    if (musicPlaying) {
     
      sliderSound.play(); // ✅ use the correct Howl instance
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

    // Light-up animation using GSAP
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
});
