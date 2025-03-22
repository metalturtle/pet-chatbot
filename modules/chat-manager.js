/**
 * Main ChatManager class
 * Orchestrates the overall chat experience by using specialized modules
 */
import { MessageHandler } from "./message-handler.js";
import { WorkflowPanelManager } from "./workflow-panel-manager.js";
import { WorkflowAPI } from "./workflow-api.js";
import { ButtonHandler } from "./button-handler.js";
import { WorkflowButtonHandler } from "./workflow-button-handler.js";

export class ChatManager {
  constructor(container, inputElement, sendButton, workButton, element3D) {
    // Store the animation manager reference if provided
    this.animationManager = element3D?.animationManager;
    this.starfieldManager = element3D?.starfieldManager;

    // Get DOM elements - use parameters if provided, otherwise find them in the DOM
    this.messageInput =
      inputElement || document.getElementById("message-input");
    this.sendButton = sendButton || document.getElementById("send-button");
    this.workButton = workButton || document.getElementById("work-button");
    this.messagesContainer = container || document.getElementById("messages");
    this.workflowPanel = document.getElementById("workflow-panel");
    this.workflowCards = document.getElementById("workflow-cards");

    // Check if required DOM elements are available
    const hasRequiredElements =
      this.messageInput &&
      this.sendButton &&
      this.workButton &&
      this.messagesContainer;

    if (!hasRequiredElements) {
      console.error("ChatManager: Missing required DOM elements", {
        messageInput: !!this.messageInput,
        sendButton: !!this.sendButton,
        workButton: !!this.workButton,
        messagesContainer: !!this.messagesContainer,
      });
    }

    // Track the currently selected workflow
    this.selectedWorkflow = null;

    // Response settings
    this.isResponding = false;
    this.responseDelay = 1000; // Base delay for response
    this.responseDuration = 2000; // How long the response typing should take

    // Initialize message handler first (as other modules depend on it)
    this.messageHandler = new MessageHandler(this);

    // Initialize the button handler system
    this.buttonHandler = new ButtonHandler(this);

    // Initialize workflow-related modules
    this.workflowPanelManager = new WorkflowPanelManager(this);
    this.workflowAPI = new WorkflowAPI(this);

    // Initialize the workflow button handler
    this.workflowButtonHandler = new WorkflowButtonHandler(
      this,
      this.buttonHandler
    );

    // Panel state
    this.isPanelOpen = false;

    // Make the instance globally accessible for debugging
    window.chatManagerInstance = this;

    // Setup main event listeners once everything is initialized
    if (hasRequiredElements) {
      console.log(
        "ChatManager: All required elements found, setting up event listeners"
      );
      this.setupEventListeners();
    } else {
      console.error(
        "ChatManager: Skipping event listener setup due to missing elements"
      );
    }
  }

  setupEventListeners() {
    console.log("ChatManager: Setting up event listeners");

    // Only add event listeners if elements exist
    if (!this.messageInput) {
      console.error(
        "ChatManager: messageInput not available for event listeners"
      );
      return;
    }

    // Instead of setting up button event listeners (now handled by ButtonHandler)
    // we only need to set up keyboard events and other non-button interactions

    if (this.messageInput) {
      // Enter key submits message
      this.messageInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          this.handleMessage();
        }
      });

      // Register user interactions with animation manager if available
      if (this.animationManager) {
        this.messageInput.addEventListener("click", () => {
          this.animationManager.registerUserInteraction();
        });

        this.messageInput.addEventListener("input", () => {
          this.animationManager.registerUserInteraction();
        });
      }
    }
  }

  handleMessage() {
    console.log("ChatManager: handleMessage called");

    // Safety check for messageInput
    if (!this.messageInput) {
      console.error("ChatManager: messageInput is not available");
      return;
    }

    const message = this.messageInput.value.trim();
    if (message) {
      // Don't allow sending messages while bot is responding
      if (this.isResponding) {
        console.log("ChatManager: Ignoring message while bot is responding");
        return;
      }

      // Safety check for messageHandler
      if (!this.messageHandler) {
        console.error("ChatManager: messageHandler is not available");
        return;
      }

      try {
        // Add the user message to the chat
        this.messageHandler.addMessage(message, true);
        this.messageInput.value = "";

        // Register user interaction with the chat if animation manager exists
        if (this.animationManager) {
          this.animationManager.registerUserInteraction();
        }

        // If a workflow is selected, send to that workflow's API
        if (this.selectedWorkflow) {
          console.log(
            "ChatManager: Selected workflow found, sending to workflow",
            this.selectedWorkflow.subnetName
          );
          this.sendToWorkflow(message, this.selectedWorkflow);
        } else {
          console.log(
            "ChatManager: No workflow selected, using default response"
          );
          // Otherwise use the default bot response
          this.messageHandler.startBotResponse();
        }
      } catch (error) {
        console.error("ChatManager: Error in handleMessage", error);
        // Try to show an error message if possible
        try {
          this.messageHandler.addMessage(
            "Sorry, an error occurred while processing your message. Please try again.",
            false
          );
        } catch (e) {
          console.error("ChatManager: Could not show error message", e);
        }
      }
    } else {
      console.log("ChatManager: Empty message, ignoring");
    }
  }

  handleWorkRequest() {
    console.log("ChatManager: handleWorkRequest called");

    // Show a message indicating that workflow data is being loaded
    if (this.messageHandler) {
      this.messageHandler.addMessage("Fetching workflow data...", true);
    }

    // Start the talking animation if available
    if (this.animationManager) {
      this.animationManager.startTalking();
      this.updateSpeechBubble("Let me check what workflows are available...");
    }

    // Make sure the button is in Work mode when fetching workflows
    if (this.buttonHandler) {
      this.buttonHandler.updateWorkButton(false);
    }

    // Fetch workflow data from the API
    this.fetchWorkflowData();
  }

  async fetchWorkflowData() {
    console.log("ChatManager: fetchWorkflowData called");

    try {
      // Show loading state
      this.updateSpeechBubble("Fetching workflow data...");

      // Get the current message from the input field if available
      const userPrompt = this.messageInput.value.trim();
      console.log("ChatManager: userPrompt for workflow search:", userPrompt);

      // Fetch the data using our API module
      console.log("ChatManager: Calling workflowAPI.fetchWorkflowData");
      const data = await this.workflowAPI.fetchWorkflowData(userPrompt);
      console.log("ChatManager: Workflow data received:", data);

      // Process the workflow data
      console.log(
        "ChatManager: Calling workflowPanelManager.displayWorkflowData"
      );
      this.workflowPanelManager.displayWorkflowData(data);

      // Show success message
      this.messageHandler.addMessage(
        "Workflow data loaded successfully! Check out the workflow panel on the left.",
        false
      );
      this.updateSpeechBubble("I found some workflows for you!");
    } catch (error) {
      // Show error message
      console.error("ChatManager: Error in fetchWorkflowData:", error);
      this.messageHandler.addMessage(
        `Error fetching workflow data: ${error.message}`,
        false
      );
      this.updateSpeechBubble("I had trouble finding workflows.");
      console.error("Error fetching workflow data:", error);
    } finally {
      // Stop the talking animation after a short delay
      setTimeout(() => {
        this.animationManager.stopTalking();
      }, 1000);
    }
  }

  // Add a new method to send a message to the selected workflow's API
  async sendToWorkflow(message, workflow) {
    this.isResponding = true;

    // Start the talking animation if available
    if (this.animationManager) {
      this.animationManager.startTalking();
    }
    this.updateSpeechBubble(`Processing with ${workflow.subnetName}...`);

    // Show typing indicator
    if (this.messageHandler) {
      this.messageHandler.showTypingIndicator();
    }

    try {
      // If we have a workflow execution manager, use it for execution
      if (this.workflowExecutionManager) {
        // Delegate to the workflow execution manager
        await this.workflowExecutionManager.executeWorkflow(workflow, message);
      } else {
        // Otherwise, use the fallback implementation
        await this.fallbackWorkflowExecution(message, workflow);
      }
    } catch (error) {
      // Show error message
      if (this.messageHandler) {
        this.messageHandler.addMessage(
          `Error with ${workflow.subnetName} service: ${error.message}`,
          false
        );
      }
      this.updateSpeechBubble("I encountered an error!");
    } finally {
      // Remove typing indicator
      if (this.messageHandler) {
        this.messageHandler.removeTypingIndicator();
      }

      // End the response sequence
      setTimeout(() => {
        this.endBotResponse();
      }, 1000);
    }
  }

  // Fallback implementation if workflow execution manager is not available
  async fallbackWorkflowExecution(message, workflow) {
    // If workflow requires file upload, we would handle that here
    if (workflow.fileUpload) {
      // In a real implementation, we would add file data
      this.messageHandler.addMessage(
        "Note: This workflow requires file upload. File upload is not implemented in this demo.",
        false
      );
    }

    // Make the POST request to the workflow API
    this.messageHandler.addMessage(
      `Sending request to ${workflow.subnetName} service...`,
      false
    );

    // Execute the workflow using our API module
    const result = await this.workflowAPI.executeWorkflow(message, workflow);

    if (result.success) {
      // Process the successful response
      this.updateSpeechBubble(`${workflow.subnetName} responded!`);
      this.messageHandler.addMessage(
        `Response from ${workflow.subnetName} service:`,
        false
      );

      // Format and display the response data
      if (typeof result.data === "object") {
        this.messageHandler.addMessage(
          JSON.stringify(result.data, null, 2),
          false
        );
      } else {
        this.messageHandler.addMessage(String(result.data), false);
      }
    } else {
      // Handle the error case with simulated response
      this.messageHandler.addMessage(
        `Could not connect to ${workflow.subnetName} service. Using simulated response.`,
        false
      );

      // Simulate a brief delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Update bubble text
      this.updateSpeechBubble(`${workflow.subnetName} is responding!`);

      // Show the simulated response
      this.messageHandler.addMessage(
        `Simulated response from ${workflow.subnetName}: ${result.simulatedResponse.result}`,
        false
      );
    }

    // If workflow provides file download, add a download option
    if (workflow.fileDownload) {
      this.messageHandler.addMessage(
        "Note: This workflow provides file download. Download functionality is not implemented in this demo.",
        false
      );
    }
  }

  // Set the workflow execution manager reference
  setWorkflowExecutionManager(manager) {
    this.workflowExecutionManager = manager;
  }

  // Helper method to update speech bubble text (delegates to MessageHandler)
  updateSpeechBubble(text) {
    try {
      if (this.messageHandler) {
        this.messageHandler.updateSpeechBubble(text);
      } else {
        console.error(
          "ChatManager: messageHandler not available for updateSpeechBubble"
        );

        // Fallback - try to update directly
        const speechBubble = document.getElementById("speech-bubble");
        if (speechBubble) {
          speechBubble.textContent = text;
          speechBubble.classList.add("visible");
        }
      }
    } catch (error) {
      console.error("ChatManager: Error in updateSpeechBubble", error);
    }
  }

  // Helper method to end bot response (delegates to MessageHandler)
  endBotResponse() {
    try {
      if (this.messageHandler) {
        this.messageHandler.endBotResponse();
      } else {
        console.error(
          "ChatManager: messageHandler not available for endBotResponse"
        );

        // Fallback - try to end directly
        this.isResponding = false;

        if (this.animationManager) {
          this.animationManager.stopTalking();
        }

        // Hide speech bubble
        const speechBubble = document.getElementById("speech-bubble");
        if (speechBubble) {
          speechBubble.classList.remove("visible");
        }
      }
    } catch (error) {
      console.error("ChatManager: Error in endBotResponse", error);
      this.isResponding = false;
    }
  }

  initializeWorkflowPanel() {
    // Set up direct access to the workflow panel manager for debugging
    window.workflowPanelManager = this.workflowPanelManager;

    console.log("ChatManager: Initializing workflow panel");

    // Initialize the workflow panel state
    this.isPanelOpen = false;
  }

  // Method to execute the selected workflow
  executeSelectedWorkflow(message) {
    if (!this.selectedWorkflow) {
      console.error("No workflow selected to execute");
      return;
    }

    console.log(
      `Executing workflow: ${this.selectedWorkflow.subnetName} with message: ${message}`
    );

    // Create a special message indicating workflow execution
    this.messageHandler.addMessage(message, "user");

    // Add a system message indicating the workflow being used
    this.messageHandler.addMessage(
      `Processing with workflow: ${this.selectedWorkflow.subnetName}...`,
      "system"
    );

    // Simulate workflow processing (in a real app, this would make an API call)
    this.isProcessing = true;

    // Visual feedback during processing
    let dots = 0;
    const processingInterval = setInterval(() => {
      const processingMsg = document.querySelector(
        ".message.system:last-child"
      );
      if (processingMsg) {
        dots = (dots + 1) % 4;
        const dotString = ".".repeat(dots);
        processingMsg.textContent = `Processing with workflow: ${this.selectedWorkflow.subnetName}${dotString}`;
      }
    }, 500);

    // Simulate a response after 2-3 seconds
    setTimeout(() => {
      clearInterval(processingInterval);
      this.isProcessing = false;

      // Remove the processing message
      const processingMsg = document.querySelector(
        ".message.system:last-child"
      );
      if (processingMsg) {
        processingMsg.remove();
      }

      // Add the "AI" response
      this.messageHandler.addMessage(
        `I've processed your request "${message}" using the ${this.selectedWorkflow.subnetName} workflow. Here's your result...`,
        "ai"
      );

      // Clear the input field
      this.messageInput.value = "";
    }, 2000 + Math.random() * 1000);
  }
}
