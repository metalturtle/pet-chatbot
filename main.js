import * as THREE from "three";
import { SquareStarfield } from "./square-starfield.js";
import { ChatManager } from "./modules/chat-manager.js";
import { AnimationManager } from "./modules/animation-manager.js";
import { ModelManager } from "./modules/model-manager.js";
import { SceneManager } from "./modules/scene-manager.js";
import { WorkflowExecutionManager } from "./modules/workflow-execution-manager.js";

let clock = new THREE.Clock();
let starfield;
let chatManager,
  animationManager,
  modelManager,
  sceneManager,
  workflowExecutionManager;

function init() {
  console.log("Main: Initializing application");
  // Create clock
  clock = new THREE.Clock();

  // Create scene and setup 3D environment
  setupScene();

  // Create managers
  setupManagers();

  // Initialize starfield
  starfield = new SquareStarfield(sceneManager.scene);

  // Start animation loop
  animate();

  console.log("Main: Initialization complete");
}

function setupScene() {
  console.log("Main: Setting up scene");
  // Create scene manager which handles scene, camera, renderer and lights
  sceneManager = new SceneManager();
}

function setupManagers() {
  console.log("Main: Setting up managers");

  // Create model manager and load the model
  console.log("Main: Creating ModelManager");
  modelManager = new ModelManager(sceneManager.scene);
  modelManager.loadModel();

  // Create animation manager
  console.log("Main: Creating AnimationManager");
  animationManager = new AnimationManager(modelManager, clock);

  // Create chat manager
  console.log("Main: Creating ChatManager");
  chatManager = new ChatManager(starfield, animationManager);

  // Expose chat manager to window for global access
  window.chatManagerInstance = chatManager;
  console.log(
    "Main: ChatManager exposed globally as window.chatManagerInstance"
  );

  // Create workflow execution manager
  console.log("Main: Creating WorkflowExecutionManager");
  workflowExecutionManager = new WorkflowExecutionManager(
    chatManager,
    animationManager
  );

  // Set the workflow execution manager on the chat manager
  chatManager.setWorkflowExecutionManager(workflowExecutionManager);
  console.log("Main: WorkflowExecutionManager set on ChatManager");

  // Setup mouse movement handler
  window.addEventListener("mousemove", (event) =>
    animationManager.handleMouseMove(event)
  );

  // Set up window resize handler
  window.addEventListener("resize", onWindowResize);

  console.log("Main: All managers initialized successfully");
}

function onWindowResize() {
  sceneManager.handleResize();
}

function animate() {
  requestAnimationFrame(animate);

  // Update animation manager
  animationManager.update();

  // Update starfield
  if (starfield) {
    starfield.update(sceneManager.camera);
  }

  // Render the scene
  sceneManager.renderer.render(sceneManager.scene, sceneManager.camera);
}

// Initialize the application
init();
