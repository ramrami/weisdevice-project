/**  -------------------------- Imports -------------------------- */
import { compileString } from "sass";
import "./style.scss";
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import gsap from "gsap";

/* import { ThreeMFLoader } from "three/examples/jsm/Addons.js";
import { workgroupArray } from "three/tsl";
 */
/**  -------------------------- Global Variables -------------------------- */
const canvas = document.querySelector("#experience-canvas");

const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

const cloud = [];
const rotAObjects = [];
const rotBObjects = [];
const raycasterObjects = [];

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const scene = new THREE.Scene();

const modals = {
  work: document.querySelector(".modal.work"),
  about: document.querySelector(".modal.about"),
  contact: document.querySelector(".modal.contact"),
  legal: document.querySelector(".modal.legal")
};


/**  -------------------------- modal -------------------------- */
const showModal = (modal) => {
  modal.style.display = "block"

  gsap.set(modal, { opacity: 0 });

  gsap.to(modal, {
    opacity: 1,
    duration: 0.5,
  });
};

const hideModal = (modal) => {
  gsap.to(modal, {
    opacity: 0,
    duration: 0.5,
    onComplete: () => {
      modal.style.display = "none"
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
  camera.position.set(-11.38, 10.67, 37.85);
  controls.target.set(0.29, 2.61, -0.52);
} else {
  camera.position.set(-8.86, 4.63, 19.63);
  controls.target.set(0.11, 2.21, -1.12);
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
  pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
});

window.addEventListener("click", (e) => {
  if (hoveredObject) {
    const object = hoveredObject;

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
});

document.querySelectorAll(".modal-exit-button").forEach((button) => {
  button.addEventListener("click", (e) => {
    const modal = e.target.closest(".modal"); 
    hideModal(modal); 
  });
});
/**  -------------------------- Texture Setup -------------------------- */
const textureLoader = new THREE.TextureLoader();
const textureMap = {
  terrain: { day: "/textures/terrain_texture.webp" },
  other: { day: "/textures/other_texture.webp" },
  pcwei: { day: "/textures/pcwei_texture.webp" },
  monitor: { day: "/textures/monitor_A_texture.webp" },
};

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
const loader = new GLTFLoader();
loader.setDRACOLoader(dracoLoader);

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
      if (name.includes(key)) {
        const material = new THREE.MeshBasicMaterial({
          map: loadedTextures.day[key],
        });
        material.map.minFilter = THREE.LinearFilter;
        child.material = material;
      }
    });

    // Clouds
    if (name.includes("cloud")) {
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
    if (name.includes("_roA")) {
      rotAObjects.push({ mesh: child });
    } else if (name.includes("_raB")) {
      rotBObjects.push({ mesh: child });
    }

    // Raycaster targets
    if (name.includes("raycaster")) {
      raycasterObjects.push(child);
    }

    // Special metallic material for pcwei
    if (name.includes("pcwei")) {
      const oldMap = child.material.map;
      child.material = new THREE.MeshStandardMaterial({
        map: oldMap,
        metalness: 0.9,
        roughness: 0.2,
        envMap: envMap,
        envMapIntensity: 3.0,
      });
    }
  });

  scene.add(glb.scene);
});

/**  -------------------------- Animation -------------------------- */
const clock = new THREE.Clock();
let hoveredObject = null;

const render = () => {
  controls.update();
  scene.background = new THREE.Color("#c5dba7");

  const time = clock.getElapsedTime();
  const startDeg = 180;
  const rangeDeg = 10;
  const angle = THREE.MathUtils.degToRad(startDeg) + Math.sin(time * 1.5) * THREE.MathUtils.degToRad(rangeDeg / 2);

  // Animate clouds
  cloud.forEach(c => {
    const mesh = c.mesh;
    mesh.position.y = c.baseY + Math.sin(time * c.floatSpeed + c.floatOffset) * 0.5;
    mesh.rotation.y += c.rotationSpeed;
  });

  // Animate parts
  rotAObjects.forEach(obj => {
    obj.mesh.rotation.x = angle;
  });
  rotBObjects.forEach(obj => {
    obj.mesh.rotation.x = -angle;
  });

  // Raycaster hover
  raycaster.setFromCamera(pointer, camera);
  const intersects = raycaster.intersectObjects(raycasterObjects);

  for (let i = 0; i < intersects.length; i++) {
    intersects[i].object.material.color.set(0xff0000); // Debug highlight
  }

  if (intersects.length > 0) {
    const hit = intersects[0].object;
    hoveredObject = hit;

    if (hit.name.includes("pointer") || hit.name.includes("btn")) {
      document.body.style.cursor = "pointer";
    } else {
      document.body.style.cursor = "default";
    }
  } else {
    hoveredObject = null;
    document.body.style.cursor = "default";
  }

  renderer.render(scene, camera);
  requestAnimationFrame(render);
};

render();