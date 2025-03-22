import * as THREE from "three";

export class SceneManager {
  constructor() {
    this.initScene();
    this.initCamera();
    this.initRenderer();
    this.setupLights();
  }

  initScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000); // Black background
  }

  initCamera() {
    const modelContainer = document.getElementById("model-container");
    const containerWidth = modelContainer.clientWidth;
    const containerHeight = modelContainer.clientHeight;

    this.camera = new THREE.PerspectiveCamera(
      60, // Slightly narrower field of view for better focus
      containerWidth / containerHeight,
      0.1,
      2000
    );
    this.camera.position.z = 7; // Move camera back to see model better
    this.camera.position.y = 0.5; // Slight upward adjustment to center the head
  }

  initRenderer() {
    const modelContainer = document.getElementById("model-container");
    const containerWidth = modelContainer.clientWidth;
    const containerHeight = modelContainer.clientHeight;

    this.renderer = new THREE.WebGLRenderer({
      antialias: true, // Enable antialiasing for smoother edges
      alpha: true,
    });
    this.renderer.setSize(containerWidth, containerHeight);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.setClearColor(0x000000, 0); // Clear to transparent

    // Enable better shadows
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    modelContainer.appendChild(this.renderer.domElement);
  }

  setupLights() {
    this.lights = {};

    // Stronger ambient light for better visibility
    this.lights.ambient = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(this.lights.ambient);

    // Add key light from front
    this.lights.key = new THREE.DirectionalLight(0xffffff, 1.0);
    this.lights.key.position.set(0, 1, 5);
    this.lights.key.castShadow = true;
    this.scene.add(this.lights.key);

    // Keep colored point lights for stylized effect
    this.lights.red = new THREE.PointLight(0xff5555, 1.0, 15);
    this.lights.red.position.set(3, 0, 3);
    this.scene.add(this.lights.red);

    this.lights.green = new THREE.PointLight(0x55ff55, 1.0, 15);
    this.lights.green.position.set(-3, 0, 3);
    this.scene.add(this.lights.green);

    this.lights.blue = new THREE.PointLight(0x5555ff, 1.0, 15);
    this.lights.blue.position.set(0, 3, 3);
    this.scene.add(this.lights.blue);
  }

  handleResize() {
    const modelContainer = document.getElementById("model-container");
    const containerWidth = modelContainer.clientWidth;
    const containerHeight = modelContainer.clientHeight;

    this.camera.aspect = containerWidth / containerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(containerWidth, containerHeight);
  }
}
