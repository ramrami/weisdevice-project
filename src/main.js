/**  -------------------------- Imports -------------------------- */
/* import { compileString } from "sass"; */
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
let currentIntersects = null;

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
const textureLoader = new THREE.TextureLoader();
const textureMap = {
  terrain: { day: "/textures/terrain_texture.webp" },
  other: { day: "/textures/other_texture.webp" },
  pcwei: { day: "/textures/pcwei_texture.webp" },
  monitor: { day: "/textures/monitor/monitor_A_texture.webp" },
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
    if (name.includes("roA")) {
      rotAObjects.push({ mesh: child });
    } else if (name.includes("raB")) {
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
/**  -------------------------- monitor mesh -------------------------- */
/* const screenGeometry = new THREE.PlaneGeometry(1.6, 0.9); // size as needed
const screenMaterial = new THREE.MeshBasicMaterial({
  map: loadedTextures.day.monitor.day,
  transparent: true,
});
const screenMesh = new THREE.Mesh(screenGeometry, screenMaterial);
screenMesh.name = "monitorScreen";
screenMesh.position.set(x, y, z); // 
screenMesh.rotation.y = Math.PI; // or whatever orientation fits
scene.add(screenMesh);

raycasterObjects.push(screenMesh); */ // allow hover & click

/**  -------------------------- Animation -------------------------- */
const clock = new THREE.Clock();

scene.background = new THREE.Color("#c5dba7");
const render = (timestamp) => {
  controls.update();

  const time = clock.getElapsedTime();
  const startDeg = 180;
  const rangeDeg = 10;
  const angle = THREE.MathUtils.degToRad(startDeg) + Math.sin(time * 1.5) * THREE.MathUtils.degToRad(rangeDeg / 2);

  smokeMaterial.uniforms.uTime.value = time;
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
  currentIntersects = raycaster.intersectObjects(raycasterObjects);

  if (currentIntersects.length > 0) {
    const currentIntersectObject = currentIntersects[0].object;

    if (currentIntersectObject.name.includes("pointer")) {
      document.body.style.cursor = "pointer";
    } else {
      document.body.style.cursor = "default";
    }
  } else {
    document.body.style.cursor = "default";
  }

  renderer.render(scene, camera);
  requestAnimationFrame(render);
};

render();