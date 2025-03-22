import { io } from "socket.io-client";

export class WorkflowExecutionManager {
  constructor(chatManager, animationManager) {
    this.chatManager = chatManager;
    this.animationManager = animationManager;
    this.socket = null;
    this.activeWorkflow = null;
    this.steps = [];
    this.currentStepIndex = -1;
    this.isExecuting = false;

    // Create an active workflow card container that will be displayed below the model
    this.createActiveWorkflowElement();
  }

  createActiveWorkflowElement() {
    // Create active workflow card element if it doesn't exist
    if (!document.getElementById("active-workflow-card")) {
      const activeWorkflowCard = document.createElement("div");
      activeWorkflowCard.id = "active-workflow-card";
      activeWorkflowCard.classList.add("active-workflow-card");
      activeWorkflowCard.style.display = "none";

      // Create elements for workflow info
      activeWorkflowCard.innerHTML = `
        <div class="active-workflow-header">
          <div class="active-workflow-icon"></div>
          <div class="active-workflow-name">Processing Workflow</div>
        </div>
        <div class="active-workflow-status">Initializing...</div>
        <div class="active-workflow-progress">
          <div class="progress-bar">
            <div class="progress-bar-fill"></div>
          </div>
        </div>
      `;

      // Add to model container
      const modelContainer = document.getElementById("model-container");
      modelContainer.appendChild(activeWorkflowCard);
    }
  }

  updateActiveWorkflowCard(step, status) {
    const activeWorkflowCard = document.getElementById("active-workflow-card");

    if (!activeWorkflowCard) return;

    // Show the card
    activeWorkflowCard.style.display = "block";

    // Update the icon and name
    const icon = activeWorkflowCard.querySelector(".active-workflow-icon");
    const name = activeWorkflowCard.querySelector(".active-workflow-name");
    const statusEl = activeWorkflowCard.querySelector(
      ".active-workflow-status"
    );
    const progressFill = activeWorkflowCard.querySelector(".progress-bar-fill");

    if (step) {
      // Set icon letter
      icon.textContent = step.subnetName.charAt(0).toUpperCase();
      // Set name
      name.textContent = step.subnetName;
      // Set status
      statusEl.textContent =
        status === "processing"
          ? `Processing: ${step.promptExample.substring(0, 50)}...`
          : status === "done"
          ? "Completed"
          : "Waiting...";

      // Update progress bar
      const currentIndex = this.steps.findIndex(
        (s) => s.subnetID === step.subnetID
      );
      const progressPercent = ((currentIndex + 1) / this.steps.length) * 100;
      progressFill.style.width = `${progressPercent}%`;
    } else {
      // Hide the card if no step is active
      activeWorkflowCard.style.display = "none";
    }
  }

  hideActiveWorkflowCard() {
    const activeWorkflowCard = document.getElementById("active-workflow-card");
    if (activeWorkflowCard) {
      activeWorkflowCard.style.display = "none";
    }
  }

  // Add a method to check if the manager is properly initialized
  isInitialized() {
    const isValid = !!this.chatManager && !!this.animationManager;
    if (!isValid) {
      console.error("WorkflowExecutionManager: Not properly initialized", {
        chatManager: !!this.chatManager,
        animationManager: !!this.animationManager,
      });
    }
    return isValid;
  }

  // Add method to manage visual effects
  startVisualEffects() {
    // Start hyperdrive effect if available
    if (this.chatManager.starfieldManager) {
      this.chatManager.starfieldManager.startHyperdrive();
    }

    // Start electric effects if available
    if (this.animationManager) {
      this.animationManager.startElectricEffect();
    }
  }

  stopVisualEffects() {
    // Stop hyperdrive effect if available
    if (this.chatManager.starfieldManager) {
      this.chatManager.starfieldManager.stopHyperdrive();
    }

    // Stop electric effects if available
    if (this.animationManager) {
      this.animationManager.stopElectricEffect();
    }
  }

  async executeWorkflow(workflow, prompt) {
    // Check if properly initialized
    if (!this.isInitialized()) {
      console.error(
        "WorkflowExecutionManager: Cannot execute workflow - not properly initialized"
      );
      return;
    }

    if (!workflow) {
      console.error(
        "WorkflowExecutionManager: No workflow provided for execution"
      );
      return;
    }

    if (this.isExecuting) {
      if (this.chatManager && this.chatManager.messageHandler) {
        this.chatManager.messageHandler.addMessage(
          "A workflow is already running. Please wait for it to complete.",
          false
        );
      }
      return;
    }

    this.isExecuting = true;
    this.activeWorkflow = workflow;

    // Start visual effects when workflow begins
    this.startVisualEffects();

    // Prepare workflow steps - in this case, we're implementing a single step workflow
    this.steps = [workflow];
    this.currentStepIndex = 0;

    try {
      // Show that we're starting workflow execution
      if (this.chatManager && this.chatManager.messageHandler) {
        this.chatManager.messageHandler.addMessage(
          `Starting workflow: ${workflow.subnetName}`,
          false
        );
      }

      if (this.chatManager) {
        this.chatManager.updateSpeechBubble(
          `Working on ${workflow.subnetName}...`
        );
      }

      if (this.animationManager) {
        this.animationManager.startTalking();
      }

      // Connect to socket.io server
      try {
        this.socket = io("https://skynetuseragent-c0n1.stackos.io", {
          transports: ["websocket"],
          timeout: 600000,
        });
      } catch (socketError) {
        console.error("Failed to connect to socket:", socketError);
        throw new Error("Could not connect to workflow service");
      }

      // Prepare payload
      const payload = {
        prompt: prompt,
        subnet: workflow.subnetID,
      };

      // Show active workflow card
      this.updateActiveWorkflowCard(workflow, "processing");

      // Set up socket event handlers and execute the workflow
      await this.setupSocketAndExecute(payload);
    } catch (error) {
      console.error("Workflow execution error:", error);
      if (this.chatManager && this.chatManager.messageHandler) {
        this.chatManager.messageHandler.addMessage(
          `Error executing workflow: ${error.message}`,
          false
        );
      }
      this.updateActiveWorkflowCard(null, "error");
    } finally {
      // Clean up
      this.isExecuting = false;
      if (this.socket && this.socket.connected) {
        try {
          this.socket.disconnect();
        } catch (e) {
          console.error("Error disconnecting socket:", e);
        }
      }

      // Stop visual effects when workflow ends
      this.stopVisualEffects();

      // Hide the active workflow card after a delay
      setTimeout(() => {
        this.hideActiveWorkflowCard();
      }, 3000);

      // Stop talking animation
      if (this.animationManager) {
        this.animationManager.stopTalking();
      }
    }
  }

  async setupSocketAndExecute(payload) {
    return new Promise((resolve, reject) => {
      let hasError = false;

      this.socket.on("connect", () => {
        console.log("Socket connected");
        if (this.chatManager && this.chatManager.messageHandler) {
          this.chatManager.messageHandler.addMessage(
            "Connected to workflow service...",
            false
          );
        }
        this.socket.emit("process-request", payload);
      });

      this.socket.on("status", (data) => {
        if (hasError) return;
        console.log("Socket status:", data);

        // Handle different status updates
        if (data.status === "processing") {
          this.handleProcessingStatus(data);
        } else if (data.status === "done") {
          this.handleDoneStatus(data);
        } else if (data.status === "completed") {
          this.handleCompletedStatus(data);
          resolve(data.result);
        }
      });

      this.socket.on("error", (error) => {
        hasError = true;
        const errorMessage = error.message || "Connection error";
        if (this.chatManager && this.chatManager.messageHandler) {
          this.chatManager.messageHandler.addMessage(
            `Workflow error: ${errorMessage}`,
            false
          );
        }
        this.socket.disconnect();
        reject(error);
      });
    });
  }

  handleProcessingStatus(data) {
    // Find the current step
    let subnet = data.subnet;
    if (typeof data.subnet === "string") {
      // Find the step with matching subnet name (case insensitive)
      const matchingStep = this.steps.find(
        (step) => step.subnetName.toLowerCase() === data.subnet.toLowerCase()
      );
      if (matchingStep) {
        subnet = matchingStep.subnetID;
      }
    }

    if (subnet) {
      const currentStep = this.steps.find((step) => step.subnetID === subnet);
      if (currentStep) {
        // Update UI to show processing
        this.updateActiveWorkflowCard(currentStep, "processing");

        // Show a message about what's happening
        const workingMessage = `Processing with ${
          currentStep.subnetName
        }: ${currentStep.promptExample.substring(0, 100)}...`;

        if (this.chatManager && this.chatManager.messageHandler) {
          this.chatManager.messageHandler.addMessage(workingMessage, false);
        }

        if (this.chatManager) {
          this.chatManager.updateSpeechBubble(
            `Running ${currentStep.subnetName}...`
          );
        }
      }
    }
  }

  handleDoneStatus(data) {
    let subnet = data.subnet;

    if (typeof data.subnet === "string") {
      const matchingStep = this.steps.find(
        (step) => step.subnetName.toLowerCase() === data.subnet.toLowerCase()
      );
      if (matchingStep) {
        subnet = matchingStep.subnetID;
      }
    }

    if (subnet) {
      const currentStep = this.steps.find((step) => step.subnetID === subnet);
      if (currentStep) {
        // Update UI to show done
        this.updateActiveWorkflowCard(currentStep, "done");

        // Handle response data for this step
        if (data.response) {
          this.handleResponseData(data.response, currentStep);
        }
      }
    }
  }

  handleCompletedStatus(data) {
    // Mark all steps as done
    const lastStep = this.steps[this.steps.length - 1];
    this.updateActiveWorkflowCard(lastStep, "done");

    // Handle final result
    if (data.result) {
      this.handleFinalResult(data.result, data.contentType);
    }

    // Show completion message
    if (this.chatManager && this.chatManager.messageHandler) {
      this.chatManager.messageHandler.addMessage(
        "Workflow execution completed successfully!",
        false
      );
    }

    if (this.chatManager) {
      this.chatManager.updateSpeechBubble("Workflow complete!");
    }
  }

  handleResponseData(response, step) {
    // Handle intermediate response data from a step
    let displayResponse;

    if (typeof response === "string") {
      try {
        const parsedResponse = JSON.parse(response);
        displayResponse = JSON.stringify(parsedResponse, null, 2);
      } catch {
        displayResponse = response;
      }
    } else {
      // If response is already an object
      displayResponse = JSON.stringify(response, null, 2);
    }

    // Add the response to chat history
    if (this.chatManager && this.chatManager.messageHandler) {
      this.chatManager.messageHandler.addMessage(
        `${step.subnetName} result: ${displayResponse.substring(0, 500)}${
          displayResponse.length > 500 ? "..." : ""
        }`,
        false
      );
    }
  }

  handleFinalResult(result, contentType) {
    // For file downloads
    if (
      contentType &&
      !contentType.includes("text") &&
      !contentType.includes("json")
    ) {
      if (this.chatManager && this.chatManager.messageHandler) {
        this.chatManager.messageHandler.addMessage(
          `Received file output of type: ${contentType}. File downloads are not implemented in this demo.`,
          false
        );
      }
      return;
    }

    // For text or JSON responses
    let displayResult;

    if (typeof result === "string") {
      try {
        const parsedResult = JSON.parse(result);
        displayResult = JSON.stringify(parsedResult, null, 2);
      } catch {
        displayResult = result;
      }
    } else {
      // If result is already an object
      displayResult = JSON.stringify(result, null, 2);
    }

    // Add the final result to chat history
    if (this.chatManager && this.chatManager.messageHandler) {
      this.chatManager.messageHandler.addMessage(
        `Final result: ${displayResult.substring(0, 1000)}${
          displayResult.length > 1000 ? "..." : ""
        }`,
        false
      );
    }
  }
}
