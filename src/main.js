import { compileString } from "sass";
import "./style.scss"
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { ThreeMFLoader } from "three/examples/jsm/Addons.js";

/**  -------------------------- Loaders -------------------------- */
const textureLoader = new THREE.TextureLoader()
const dracoLoader = new DRACOLoader();

dracoLoader.setDecoderPath('/draco/');
// Instantiate a loader
const loader = new GLTFLoader();

loader.setDRACOLoader(dracoLoader);
const textureMap = {
  terrain: {
    day: "/textures/terrain_texture.webp",
    /*   night: "", */
  },

  other: {
    day: "/textures/other_texture.webp"
  },

  pcwei: {
    day: "/textures/pcwei_texture.webp"
  },

  monitor: {
    day: "/textures/monitor_A_texture.webp"
  },
}

const loadedTextures = {
  day: {},
  /*   night: {}, */
};

Object.entries(textureMap).forEach(([key, paths]) => {
  const dayTexture = textureLoader.load(paths.day);
  dayTexture.flipY = false;
  dayTexture.colorSpace = THREE.SRGBColorSpace;
  loadedTextures.day[key] = dayTexture;

  /*const nightTexture = textureLoader.load(paths.night);
  nightTexture.flipY = false;
  nightTexture.colorSpace = THREE.SRGBColorSpace;
  loadedTextures.night[key] = nightTexture;*/
});

loader.load("/models/desert.glb", (glb) => {
  glb.scene.traverse((child) => {
    console.log(child.name)
    if (child.isMesh) {
      Object.keys(textureMap).forEach((key) => {
        if (child.name.includes(key)) {
          const material = new THREE.MeshBasicMaterial({
            map: loadedTextures.day[key],
          });
          child.material = material;

          if (child.material.map) {
            child.material.map.minFilter = THREE.LinearFilter;
          }
        }

        if (child.name.includes("cloud")) {
          child.material.transparent = true;
          child.material.opacity = 0.7;
        }

        const envMap = new THREE.CubeTextureLoader()
          .setPath('/textures/skymap/')
          .load([
            'px.webp', 'nx.webp',
            'py.webp', 'ny.webp',
            'pz.webp', 'nz.webp'
          ]);

        scene.environment = envMap;

        if (child.name.includes("pcwei")/*  || child.name.includes("monitor") */) {
          const oldMap = child.material.map; // keep the existing texture

          child.material = new THREE.MeshStandardMaterial({
            map: oldMap,
            metalness: 0.9,
            roughness: 0.2,
            envMap: envMap,
            envMapIntensity: 3.0,
          });

        }
      })
    }
  });

  scene.add(glb.scene); // Make sure `scene` is already defined
});

/**  -------------------------- Scene setup -------------------------- */
const canvas = document.querySelector("#experience-canvas");
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

const scene = new THREE.Scene();

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

const controls = new OrbitControls(camera, renderer.domElement);
controls.minDistance = 5;
controls.maxDistance = 45;

controls.minPolarAngle = 0;
controls.maxPolarAngle = Math.PI / 2;

controls.minAzimuthAngle = -Infinity;
controls.maxAzimuthAngle = Infinity;

controls.enableDamping = true;
/* controls.enablePan = false; */
controls.dampingFactor = 0.05;

controls.update();

//Set starting camera position
if (window.innerWidth < 768) {
  camera.position.set(
    -11.383115329475373,
    10.671866710496602,
    37.856171218786116
  );
  controls.target.set(
    0.2906936012104184,
    2.6137582034237625,
    -0.5250785161947387,
  );
} else {
  camera.position.set(
    -13.757830381437602,
    4.031331088414266,
    22.81442298293254
  );

  controls.target.set(
    0.05434256799569519,
    2.3990680369343007,
    -1.157919459830688
  );
}

window.addEventListener("resize", () => {
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  // Update Camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

function animate() {



};



const render = () => {
  controls.update();

  console.log(camera.position);
  console.log("000000000000");
  console.log(controls.target);

  scene.background = new THREE.Color("#c5dba7");
  renderer.render(scene, camera);

  window.requestAnimationFrame(render);

};

render();