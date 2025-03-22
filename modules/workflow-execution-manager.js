import { io } from "socket.io-client";
import { LightningEffect } from "./lightning-effect.js";

export class WorkflowExecutionManager {
  constructor(chatManager, animationManager) {
    this.chatManager = chatManager;
    this.animationManager = animationManager;
    this.socket = null;
    this.activeWorkflow = null;
    this.steps = [];
    this.currentStepIndex = -1;
    this.isExecuting = false;

    // Initialize lightning effect
    this.lightningEffect = new LightningEffect();

    // API endpoints
    this.workflowApiUrl = `http://localhost:3005/natural-request`;
    this.socketUrl = "http://localhost:3014";

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
    // Start hyperdrive effect if available - make it faster!
    if (this.chatManager.starfieldManager) {
      // Call boostSpeed with a much higher speed multiplier (10.0 instead of 4.5)
      this.chatManager.starfieldManager.boostSpeed(10.0);

      // Log that we're using enhanced hyperdrive
      console.log("WorkflowExecutionManager: MAXIMUM HYPERDRIVE ENGAGED!");
    }

    // Enable workflow mode with head vibration and disable mouse tracking
    if (this.animationManager) {
      this.animationManager.startWorkflowMode();
      console.log(
        "WorkflowExecutionManager: Head vibration activated for workflow mode"
      );
    }

    // Start lightning effect around the head
    if (this.lightningEffect) {
      this.lightningEffect.start();
      console.log("WorkflowExecutionManager: Lightning effect activated");
    }

    // Lightning effects removed as requested
    // No longer starting electric effects
  }

  stopVisualEffects() {
    // Stop hyperdrive effect if available
    if (this.chatManager.starfieldManager) {
      this.chatManager.starfieldManager.normalSpeed();
    }

    // Disable workflow mode, return to normal head movement
    if (this.animationManager) {
      this.animationManager.stopWorkflowMode();
      console.log(
        "WorkflowExecutionManager: Head vibration deactivated, normal mode resumed"
      );
    }

    // Stop lightning effect
    if (this.lightningEffect) {
      this.lightningEffect.stop();
      console.log("WorkflowExecutionManager: Lightning effect deactivated");
    }

    // Lightning effects removed as requested
    // No longer stopping electric effects
  }

  // Add workflow fetching methods from WorkflowAPI
  async fetchWorkflowData(userPrompt = "") {
    console.log(
      "WorkflowExecutionManager: fetchWorkflowData called with prompt:",
      userPrompt
    );

    try {
      // Get the prompt - use provided prompt or default text
      const prompt = userPrompt || "Show available workflows";
      console.log("WorkflowExecutionManager: Using prompt:", prompt);

      // Make a POST request to the API with the user prompt in the payload
      console.log(
        "WorkflowExecutionManager: Sending request to:",
        this.workflowApiUrl
      );
      const response = await fetch(this.workflowApiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: prompt,
        }),
      });

      // Check if the request was successful
      if (!response.ok) {
        throw new Error(`API responded with status ${response.status}`);
      }

      // Parse the JSON response
      const data = await response.json();

      // Validate that the response has the expected structure
      if (!data.subnetList || !Array.isArray(data.subnetList)) {
        throw new Error("Invalid response format: missing subnetList array");
      }

      console.log("Workflow data fetched successfully:", data);
      return data;
    } catch (error) {
      console.error(
        "WorkflowExecutionManager: Error fetching workflow data:",
        error
      );
      return this.getFallbackData();
    }
  }

  getFallbackData() {
    console.log("Using sample data as fallback");
    return {
      subnetList: [
        {
          subnetID: "10",
          subnetName: "codegen",
          prompt: "Please generate a Google clone HTML app",
          promptExample: "Please generate a hello world html app",
          fileUpload: false,
          subnetURL: "https://codegenservice-c0n1.stackos.io/natural-request",
          fileDownload: true,
        },
        {
          subnetID: "9",
          subnetName: "docker",
          prompt:
            "Please build the html docker image for this project with port 80",
          promptExample:
            "Please build the html docker image for this project with port 80",
          fileUpload: true,
          subnetURL: "https://dockerservice-c0n1.stackos.io/natural-request",
          fileDownload: false,
        },
        {
          subnetID: "2",
          subnetName: "stackai",
          prompt:
            "Please deploy the generated Docker image with the tag as latest and port 80 with CPU as 256m (millicore) and 2000 mb ram and add a balance of 1 day",
          promptExample:
            "Please deploy alethio/ethereum-lite-explorer with the tag as latest and port 80 with CPU as 256m (millicore) and 2000 mb ram and add a balance of 1 day",
          fileUpload: false,
          subnetURL: "https://stackaiservice-c0n1.stackos.io/natural-request",
          fileDownload: false,
        },
      ],
    };
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

    // Get the workflow data to determine all steps in this workflow
    try {
      // If workflow is already an array, use it directly
      if (Array.isArray(workflow)) {
        this.steps = workflow;
      }
      // If it's a single workflow object but has a services array, use that
      else if (workflow.services && Array.isArray(workflow.services)) {
        this.steps = workflow.services;
      }
      // Otherwise treat the workflow itself as a single step
      else {
        this.steps = [workflow];
      }

      this.currentStepIndex = 0;

      console.log(
        `Executing workflow with ${this.steps.length} steps`,
        this.steps
      );

      // Show that we're starting workflow execution
      if (this.chatManager && this.chatManager.messageHandler) {
        this.chatManager.messageHandler.addMessage(
          `Starting workflow with ${this.steps.length} services`,
          false
        );
      }

      if (this.chatManager) {
        this.chatManager.updateSpeechBubble(`Working on your request...`);
      }

      // Removed talking animation as requested
      // No longer starting talking animation

      // Connect to socket.io server
      try {
        this.socket = io(this.socketUrl, {
          transports: ["websocket"],
          timeout: 600000,
        });
      } catch (socketError) {
        console.error("Failed to connect to socket:", socketError);
        throw new Error("Could not connect to workflow service");
      }

      // Build the payload according to the Node.js implementation format
      const payload = {
        prompt: prompt || "",
        userAuthPayload: "",
        accountNFT: {
          nftID: "1",
          collectionID: "0",
        },
        // Format workflow services as required by the backend
        workflow: this.steps, // Send the array of services directly
      };

      console.log("Sending workflow payload:", payload);

      // Show active workflow card for the first step
      this.updateActiveWorkflowCard(this.steps[0], "processing");

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

      // Removed talking animation as requested
      // No longer stopping talking animation
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
    // Expanded processing status handler for workflow with multiple services
    console.log("Processing status update:", data);

    // Handle if data contains service information directly
    if (data.service) {
      const currentService = data.service;
      // Find matching step in our steps array
      const currentStep = this.steps.find(
        (step) =>
          step.subnetID === currentService.subnetID ||
          step.subnetName?.toLowerCase() ===
            currentService.subnetName?.toLowerCase()
      );

      if (currentStep) {
        // Update the current step index
        this.currentStepIndex = this.steps.indexOf(currentStep);

        // Update UI to show processing
        this.updateActiveWorkflowCard(currentStep, "processing");

        // Show a message about what's happening
        const workingMessage = `Processing service ${
          this.currentStepIndex + 1
        }/${this.steps.length}: ${currentStep.subnetName}`;

        if (this.chatManager && this.chatManager.messageHandler) {
          this.chatManager.messageHandler.addMessage(workingMessage, false);
        }

        // Removed speech bubble update as requested
      }
      return;
    }

    // Legacy handling - find service by subnet ID or name in data
    let subnet = data.subnet;
    if (typeof data.subnet === "string") {
      // Find the step with matching subnet name (case insensitive)
      const matchingStep = this.steps.find(
        (step) => step.subnetName?.toLowerCase() === data.subnet?.toLowerCase()
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
        const workingMessage = `Processing with ${currentStep.subnetName}: ${
          currentStep.promptExample?.substring(0, 100) || ""
        }...`;

        if (this.chatManager && this.chatManager.messageHandler) {
          this.chatManager.messageHandler.addMessage(workingMessage, false);
        }

        // Removed speech bubble update as requested
      }
    }
  }

  handleDoneStatus(data) {
    console.log("Done status update:", data);

    // Handle if data contains service information directly
    if (data.service) {
      const completedService = data.service;
      // Find matching step in our steps array
      const completedStep = this.steps.find(
        (step) =>
          step.subnetID === completedService.subnetID ||
          step.subnetName?.toLowerCase() ===
            completedService.subnetName?.toLowerCase()
      );

      if (completedStep) {
        // Update UI to show completion
        this.updateActiveWorkflowCard(completedStep, "done");

        // Handle response data for this step
        if (data.response) {
          this.handleResponseData(data.response, completedStep);
        }

        // Move to the next step if available
        const nextIndex = this.steps.indexOf(completedStep) + 1;
        if (nextIndex < this.steps.length) {
          const nextStep = this.steps[nextIndex];
          this.currentStepIndex = nextIndex;
          // Prepare for next step
          this.updateActiveWorkflowCard(nextStep, "waiting");
        }
      }
      return;
    }

    // Legacy handling
    let subnet = data.subnet;

    if (typeof data.subnet === "string") {
      const matchingStep = this.steps.find(
        (step) => step.subnetName?.toLowerCase() === data.subnet?.toLowerCase()
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
    // Log the completion data
    console.log("Workflow completion:", data);

    // Mark all steps as done
    const lastStep = this.steps[this.steps.length - 1];
    this.updateActiveWorkflowCard(lastStep, "done");

    // Check for result from the Node.js implementation
    if (data.result) {
      // Process the combined result
      this.handleFinalResult(data.result, data.contentType);
    } else if (data.reult) {
      // Handle misspelled property name from the backend
      this.handleFinalResult(data.reult, data.contentType);
    } else if (data.response) {
      // Alternative property name
      this.handleFinalResult(data.response, data.contentType);
    }

    // Show completion message
    if (this.chatManager && this.chatManager.messageHandler) {
      this.chatManager.messageHandler.addMessage(
        "Workflow execution completed successfully!",
        false
      );
    }

    // Removed speech bubble update as requested
  }

  handleServiceResult(result, serviceName) {
    if (!result) return;

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

    // Add the service result to chat history
    if (this.chatManager && this.chatManager.messageHandler) {
      this.chatManager.messageHandler.addMessage(
        `${serviceName} result: ${displayResult.substring(0, 800)}${
          displayResult.length > 800 ? "..." : ""
        }`,
        false
      );
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
    if (!result) return;

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
        `Workflow result: ${displayResult.substring(0, 800)}${
          displayResult.length > 800 ? "..." : ""
        }`,
        true // Mark this as a bot message
      );
    }

    // If there's a content type indicating a file, handle it accordingly
    if (contentType && contentType !== "application/json") {
      if (this.chatManager && this.chatManager.messageHandler) {
        this.chatManager.messageHandler.addMessage(
          `Received file of type: ${contentType}. File processing is available.`,
          false
        );
      }
    }
  }
}
