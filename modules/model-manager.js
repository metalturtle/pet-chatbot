import * as THREE from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";

export class ModelManager {
  constructor(scene) {
    this.scene = scene;
    this.model = null;
    this.targetRotation = new THREE.Euler(0, 0, 0);
    this.rotationSpeed = 0.5;
    this.modelLoaded = false;
    this.defaultScale = 0.012; // Slightly larger default scale

    // Load the model directly - don't create fallback yet
    this.loadModel();
  }

  createFallbackModel() {
    // Only create fallback if real model fails to load
    console.log("Creating fallback model as actual model couldn't be loaded");

    // Create a simple head with a sphere and face features
    const headGroup = new THREE.Group();

    // Head sphere
    const headGeometry = new THREE.SphereGeometry(1, 32, 32);
    const headMaterial = new THREE.MeshStandardMaterial({
      color: 0xf5d0a9,
      roughness: 0.7,
      metalness: 0.1,
    });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    headGroup.add(head);

    // Eyes
    const eyeGeometry = new THREE.SphereGeometry(0.15, 16, 16);
    const eyeMaterial = new THREE.MeshStandardMaterial({
      color: 0x222222,
      roughness: 0.1,
      metalness: 0.5,
    });

    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.3, 0.1, -0.85);
    headGroup.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.3, 0.1, -0.85);
    headGroup.add(rightEye);

    // Mouth
    const mouthGeometry = new THREE.TorusGeometry(0.3, 0.05, 8, 16, Math.PI);
    const mouthMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      roughness: 0.8,
      metalness: 0.1,
    });
    const mouth = new THREE.Mesh(mouthGeometry, mouthMaterial);
    mouth.position.set(0, -0.3, -0.85);
    mouth.rotation.set(Math.PI / 2, 0, 0);
    headGroup.add(mouth);

    // Add the fallback model to the scene
    this.fallbackModel = headGroup;
    this.model = headGroup; // Use this as default model
    this.scene.add(headGroup);
  }

  loadModel() {
    console.log("Loading model...");
    const loader = new FBXLoader();

    // Try direct path with ./ prefix for Vite asset handling
    const modelPath = "./@model/model3d.fbx";
    console.log(`Loading model from: ${modelPath}`);

    loader.load(
      modelPath,
      (fbx) => {
        console.log("Model loaded successfully!");

        // Remove fallback model if it exists
        if (this.fallbackModel) {
          this.scene.remove(this.fallbackModel);
          this.fallbackModel = null;
        }

        this.model = fbx;
        this.model.scale.set(
          this.defaultScale,
          this.defaultScale,
          this.defaultScale
        );

        // Center the model
        const box = new THREE.Box3().setFromObject(this.model);
        const center = box.getCenter(new THREE.Vector3());
        this.model.position.set(0, 0, 0);
        this.model.position.sub(center);

        // Adjust position for better framing
        this.model.position.y += 0.2;

        // Make sure model is visible
        this.model.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            child.frustumCulled = false;
          }
        });

        this.scene.add(this.model);
        this.modelLoaded = true;
        console.log("Model added to scene");

        // Load texture
        this.loadTexture();
      },
      (xhr) => {
        const progress = (xhr.loaded / xhr.total) * 100;
        console.log(`${progress.toFixed(2)}% loaded`);
      },
      (error) => {
        console.error("Error loading model:", error);
        // Create fallback model if actual model failed to load
        this.createFallbackModel();
      }
    );
  }

  loadTexture() {
    console.log("Loading texture...");
    const texturePath = "./@model/texture.png";
    console.log(`Loading texture from: ${texturePath}`);

    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(
      texturePath,
      (texture) => {
        console.log("Texture loaded successfully");
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.needsUpdate = true;

        const standardMaterial = new THREE.MeshStandardMaterial({
          map: texture,
          transparent: true,
          side: THREE.DoubleSide,
          roughness: 0.5,
          metalness: 0.2,
        });

        this.model.traverse((child) => {
          if (child.isMesh) {
            child.material = standardMaterial.clone();
            child.material.needsUpdate = true;
          }
        });
      },
      null,
      (error) => {
        console.error("Error loading texture:", error);
        // Apply default material
        this.model.traverse((child) => {
          if (child.isMesh) {
            child.material = new THREE.MeshStandardMaterial({
              color: 0x7a7a7a,
              roughness: 0.5,
              metalness: 0.2,
            });
          }
        });
      }
    );
  }

  updateRotation() {
    if (this.model) {
      this.model.rotation.x +=
        (this.targetRotation.x - this.model.rotation.x) * this.rotationSpeed;
      this.model.rotation.y +=
        (this.targetRotation.y - this.model.rotation.y) * this.rotationSpeed;
    }
  }

  setTargetRotation(mouseX, mouseY) {
    const maxRotationX = THREE.MathUtils.degToRad(30);
    const maxRotationY = THREE.MathUtils.degToRad(60);

    if (typeof mouseY === "number" && typeof mouseX === "number") {
      // Direct angle setting (used for mouse movement)
      // For horizontal rotation, we use positive mouseX (removed the negative sign)
      // This makes the model turn toward the mouse pointer horizontally
      this.targetRotation.y = THREE.MathUtils.clamp(
        mouseX * maxRotationY,
        -maxRotationY,
        maxRotationY
      );

      // Keep vertical rotation inverted for natural tracking
      this.targetRotation.x = THREE.MathUtils.clamp(
        -mouseY * maxRotationX,
        -maxRotationX,
        maxRotationX
      );
    } else {
      // Simple angle setting for animation
      this.targetRotation.x = mouseX;
      this.targetRotation.y = mouseY;
    }
  }

  setPosition(x, y, z) {
    if (this.model) {
      if (x !== undefined) this.model.position.x = x;
      if (y !== undefined) this.model.position.y = y + 0.2; // Keep slight Y offset
      if (z !== undefined) this.model.position.z = z;
    }
  }

  setScale(scale) {
    if (this.model) {
      const finalScale = this.defaultScale * scale;
      this.model.scale.set(finalScale, finalScale, finalScale);
    }
  }
}
