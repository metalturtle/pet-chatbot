export class AnimationManager {
  constructor(modelManager, clock) {
    this.modelManager = modelManager;
    this.clock = clock;

    // Animation and interaction tracking
    this.idleAnimationStartTime = 0;
    this.isUserInteracting = false;
    this.lastInteractionTime = this.clock.getElapsedTime();
    this.IDLE_DELAY = 2.0; // Seconds of no interaction before idle animation starts

    // Talking animation state
    this.isTalking = false;
    this.talkingIntensity = 0.3; // Increased nodding intensity for giddier animation

    // Electric effect state
    this.isElectricEffectActive = false;
    this.electricEffectIntensity = 0;
    this.electricEffectContainer = null;
    this.setupElectricEffect();

    // Workflow mode flag and settings
    this.workflowMode = false;
    this.vibrationIntensity = 0.1; // Intensity of head vibration in workflow mode
  }

  setupElectricEffect() {
    // Create container for electric effect if it doesn't exist
    if (!document.getElementById("electric-effect")) {
      this.electricEffectContainer = document.createElement("div");
      this.electricEffectContainer.id = "electric-effect";
      this.electricEffectContainer.className = "electric-effect";

      // Add the container around the model
      const modelContainer = document.getElementById("model-container");
      if (modelContainer) {
        modelContainer.appendChild(this.electricEffectContainer);

        // Add electric arcs
        for (let i = 0; i < 8; i++) {
          const arc = document.createElement("div");
          arc.className = "electric-arc";
          this.electricEffectContainer.appendChild(arc);
        }
      }
    }

    // Add CSS styles for electric effect if not already present
    if (!document.getElementById("electric-effect-style")) {
      const style = document.createElement("style");
      style.id = "electric-effect-style";
      style.textContent = `
        .electric-effect {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        
        .electric-effect.active {
          opacity: 1;
        }
        
        .electric-arc {
          position: absolute;
          background: linear-gradient(90deg, transparent, #00ffff, #0000ff, transparent);
          width: 100%;
          height: 2px;
          transform-origin: center;
          animation: electric-pulse 1s infinite;
          filter: blur(1px);
          opacity: 0.7;
        }
        
        @keyframes electric-pulse {
          0% {
            transform: scale(0.8) rotate(0deg);
            opacity: 0.3;
          }
          50% {
            transform: scale(1.2) rotate(180deg);
            opacity: 0.7;
          }
          100% {
            transform: scale(0.8) rotate(360deg);
            opacity: 0.3;
          }
        }
      `;
      document.head.appendChild(style);
    }
  }

  startElectricEffect() {
    this.isElectricEffectActive = true;
    if (this.electricEffectContainer) {
      this.electricEffectContainer.classList.add("active");
    }
  }

  stopElectricEffect() {
    this.isElectricEffectActive = false;
    if (this.electricEffectContainer) {
      this.electricEffectContainer.classList.remove("active");
    }
  }

  update() {
    // Update model rotation based on target
    this.modelManager.updateRotation();

    // Update electric effect if active
    if (this.isElectricEffectActive && this.electricEffectContainer) {
      // Update electric arcs positions randomly
      const arcs =
        this.electricEffectContainer.getElementsByClassName("electric-arc");
      Array.from(arcs).forEach((arc, index) => {
        const angle = (index / arcs.length) * 360 + Math.random() * 30;
        arc.style.transform = `rotate(${angle}deg)`;
      });
    }

    // Check for workflow mode - takes priority over talking and idle animations
    if (this.workflowMode) {
      this.updateWorkflowAnimation();
    }
    // Update talking animation if active, otherwise update idle animation
    else if (this.isTalking) {
      this.updateTalkingAnimation();
    } else {
      // Check idle animation
      this.updateIdleAnimation();
    }
  }

  handleMouseMove(event) {
    // Ignore mouse movement if in workflow mode
    if (this.workflowMode) {
      return;
    }

    // Record user interaction
    this.isUserInteracting = true;
    this.lastInteractionTime = this.clock.getElapsedTime();

    if (!this.modelManager.model) return;

    const modelContainer = document.getElementById("model-container");
    const rect = modelContainer.getBoundingClientRect();

    // Calculate mouse position in normalized device coordinates (-1 to +1)
    // Note that we're using the center of the container as the origin
    const mouseX = ((event.clientX - rect.left) / rect.width) * 2 - 1;

    // For Y, we want positive to be up, so we invert the usual formula
    const mouseY = -(((event.clientY - rect.top) / rect.height) * 2 - 1);

    // Pass mouse coordinates to model manager
    // We now invert the signs inside ModelManager.setTargetRotation
    this.modelManager.setTargetRotation(mouseX, mouseY);
  }

  // Apply subtle idle animation to model
  updateIdleAnimation() {
    if (!this.modelManager.model) return;

    const currentTime = this.clock.getElapsedTime();

    // Check if we should be in idle mode
    const timeSinceLastInteraction = currentTime - this.lastInteractionTime;
    if (timeSinceLastInteraction < this.IDLE_DELAY) {
      this.isUserInteracting = true;
      return;
    }

    // Start idle animation
    if (this.isUserInteracting) {
      // Just switched to idle mode
      this.isUserInteracting = false;
      this.idleAnimationStartTime = currentTime;
    }

    // Calculate time in idle animation cycle
    const idleTime = currentTime - this.idleAnimationStartTime;

    // Gentle bobbing motion (vertical)
    const bobAmount = Math.sin(idleTime * 0.7) * 0.03;
    this.modelManager.setPosition(0, bobAmount, 0);

    // Subtle swaying (rotation)
    const swayAmountX = Math.sin(idleTime * 0.5) * 0.05;
    const swayAmountY = Math.cos(idleTime * 0.3) * 0.1;

    // Apply subtle idle rotation
    this.modelManager.setTargetRotation(swayAmountY, swayAmountX);

    // Add a slight "breathing" effect by scaling
    const breathAmount = 1.0 + Math.sin(idleTime * 1.2) * 0.01;
    this.modelManager.setScale(breathAmount);
  }

  // Apply talking animation (nodding)
  updateTalkingAnimation() {
    if (!this.modelManager.model) return;

    const currentTime = this.clock.getElapsedTime();

    // Eliminate vertical movement completely
    this.modelManager.setPosition(0, 0, 0);

    // Create a giddy, enthusiastic nodding effect through rotation only
    // Forward/backward nodding with a bit of randomness
    const primaryNod = Math.sin(currentTime * 15) * this.talkingIntensity;
    const secondaryNod =
      Math.sin(currentTime * 22) * this.talkingIntensity * 0.4;
    const randomFactor = Math.sin(currentTime * 9.7) * 0.05;

    // Combine for an excited nodding rotation
    const giddyNodRotationX = primaryNod + secondaryNod + randomFactor;

    // Small side-to-side rotation
    const smallSideRotation =
      Math.sin(currentTime * 8) * this.talkingIntensity * 0.15;

    // Apply excited nodding rotation without vertical movement
    this.modelManager.setTargetRotation(smallSideRotation, giddyNodRotationX);

    // Small, quick scale changes while talking for extra enthusiasm
    const talkScaleAmount = 1.0 + Math.sin(currentTime * 12) * 0.007;
    this.modelManager.setScale(talkScaleAmount);
  }

  // Start the talking animation
  startTalking() {
    this.isTalking = true;

    // Add talking class to 3D model container for CSS animation
    const modelContainer = document.getElementById("model-container");
    modelContainer.classList.add("talking");

    // Show speech bubble
    const speechBubble = document.getElementById("speech-bubble");
    if (speechBubble) {
      speechBubble.classList.add("visible");
    }
  }

  // Stop the talking animation
  stopTalking() {
    this.isTalking = false;

    // Remove talking class from 3D model container
    const modelContainer = document.getElementById("model-container");
    modelContainer.classList.remove("talking");

    // Hide speech bubble
    const speechBubble = document.getElementById("speech-bubble");
    if (speechBubble) {
      speechBubble.classList.remove("visible");
    }
  }

  // Set the intensity of the talking animation
  setTalkingIntensity(intensity) {
    this.talkingIntensity = Math.min(Math.max(intensity, 0.1), 0.5);
  }

  // Called when user interacts with the app
  registerUserInteraction() {
    this.isUserInteracting = true;
    this.lastInteractionTime = this.clock.getElapsedTime();
  }

  // New method: Apply vibrating animation for workflow mode
  updateWorkflowAnimation() {
    if (!this.modelManager.model) return;

    const currentTime = this.clock.getElapsedTime();

    // Reset any vertical movement
    this.modelManager.setPosition(0, 0, 0);

    // Create rapid, random vibrations in all directions
    const vibrationX = (Math.random() * 2 - 1) * this.vibrationIntensity;
    const vibrationY = (Math.random() * 2 - 1) * this.vibrationIntensity;

    // Apply the vibration to head rotation
    // Using direct rotation values rather than mouse tracking
    this.modelManager.setTargetRotation(vibrationX, vibrationY);

    // Add slight scale vibration for more intensity
    const scaleVibration = 1.0 + (Math.random() * 0.02 - 0.01);
    this.modelManager.setScale(scaleVibration);
  }

  // Enable workflow mode with vibration
  startWorkflowMode() {
    this.workflowMode = true;
    console.log(
      "AnimationManager: Workflow mode enabled - head vibration activated"
    );
  }

  // Disable workflow mode, return to normal behavior
  stopWorkflowMode() {
    this.workflowMode = false;
    console.log(
      "AnimationManager: Workflow mode disabled - normal head movement resumed"
    );
  }
}
