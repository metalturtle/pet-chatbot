// Main application entry point
import * as THREE from "three";
import { ModelManager } from "./modules/model-manager.js";
import { SceneManager } from "./modules/scene-manager.js";
import { StarfieldManager } from "./modules/starfield-manager.js";
import { ChatManager } from "./modules/chat-manager.js";
import { AnimationManager } from "./modules/animation-manager.js";
import { WorkflowExecutionManager } from "./modules/workflow-execution-manager.js";

// Main application class
class App {
  constructor() {
    // Core Three.js components
    this.clock = new THREE.Clock();

    // Initialize managers
    this.sceneManager = new SceneManager();
    this.scene = this.sceneManager.scene;
    this.camera = this.sceneManager.camera;
    this.renderer = this.sceneManager.renderer;

    this.starfieldManager = new StarfieldManager(this.scene);
    this.modelManager = new ModelManager(this.scene);
    this.animationManager = new AnimationManager(this.modelManager, this.clock);

    // Create a container for 3D elements
    const element3D = {
      animationManager: this.animationManager,
      starfieldManager: this.starfieldManager,
    };

    // Get required DOM elements
    const messagesContainer = document.getElementById("messages");
    const messageInput = document.getElementById("message-input");
    const sendButton = document.getElementById("send-button");
    const workButton = document.getElementById("work-button");

    // Initialize chat manager with correct parameters
    this.chatManager = new ChatManager(
      messagesContainer,
      messageInput,
      sendButton,
      workButton,
      element3D
    );

    // Initialize the workflow panel
    this.chatManager.initializeWorkflowPanel();

    // Create workflow execution manager
    this.workflowExecutionManager = new WorkflowExecutionManager(
      this.chatManager,
      this.animationManager
    );

    // Set the workflow execution manager on the chat manager
    this.chatManager.setWorkflowExecutionManager(this.workflowExecutionManager);

    // Add some test messages
    setTimeout(() => {
      this.chatManager.messageHandler.addMessage(
        "Hello! How can I help you today?",
        false
      );
      setTimeout(() => {
        this.chatManager.messageHandler.addMessage(
          "I'd like to learn about AI and machine learning.",
          true
        );
        setTimeout(() => {
          this.chatManager.messageHandler.addMessage(
            "Great choice! AI and machine learning are fascinating fields. Would you like to know about neural networks, reinforcement learning, or something else?",
            false
          );
        }, 500);
      }, 500);
    }, 800);

    // Setup event listeners
    this.setupEventListeners();

    // Start animation loop
    this.animate();

    // Log that the application is fully initialized
    console.log("App: Initialization complete");
  }

  setupEventListeners() {
    window.addEventListener("mousemove", (event) => {
      this.animationManager.handleMouseMove(event);
    });

    window.addEventListener("resize", () => {
      this.sceneManager.handleResize();
    });
  }

  animate() {
    requestAnimationFrame(this.animate.bind(this));

    // Update animations and scene elements
    this.animationManager.update();
    this.starfieldManager.update(this.camera);

    // Render the scene
    this.renderer.render(this.scene, this.camera);
  }
}

// Initialize the application when the DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  const app = new App();
});
