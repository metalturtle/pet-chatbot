/**
 * ButtonHandler
 * Centralized handler for all button interactions in the application
 */
export class ButtonHandler {
  constructor(chatManager) {
    this.chatManager = chatManager;

    // Store references to all application buttons
    this.buttons = {
      send: document.getElementById("send-button"),
      work: document.getElementById("work-button"),
      execute: document.getElementById("execute-workflow-button"),
      reset: document.getElementById("reset-workflow-button"),
    };

    // Track button states
    this.states = {
      workflowPanelOpen: false,
      workflowSelected: false,
    };

    // Initialize button handlers
    this.initializeButtonHandlers();

    // Log initialization
    console.log("ButtonHandler: Initialized with buttons", {
      send: !!this.buttons.send,
      work: !!this.buttons.work,
      execute: !!this.buttons.execute,
      reset: !!this.buttons.reset,
    });
  }

  /**
   * Initialize all button event handlers
   */
  initializeButtonHandlers() {
    // Send button
    if (this.buttons.send) {
      this.buttons.send.addEventListener("click", (e) => {
        e.preventDefault();
        this.handleSendButtonClick();
      });
    }

    // Work button
    if (this.buttons.work) {
      this.buttons.work.addEventListener("click", (e) => {
        e.preventDefault();
        this.handleWorkButtonClick();
      });
    }

    // Execute workflow button
    if (this.buttons.execute) {
      // Remove any existing listeners by cloning and replacing
      const newExecuteButton = this.buttons.execute.cloneNode(true);
      this.buttons.execute.parentNode.replaceChild(
        newExecuteButton,
        this.buttons.execute
      );
      this.buttons.execute = newExecuteButton;

      // Add new event listener
      this.buttons.execute.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.handleExecuteButtonClick();
      });

      // Initially hide the execute button
      this.buttons.execute.style.display = "none";
    }

    // Reset workflow button
    if (this.buttons.reset) {
      this.buttons.reset.addEventListener("click", (e) => {
        e.preventDefault();
        this.handleResetButtonClick();
      });
    }
  }

  /**
   * Handle send button click
   */
  handleSendButtonClick() {
    console.log("ButtonHandler: Send button clicked");
    if (this.chatManager) {
      this.chatManager.handleMessage();
    }
  }

  /**
   * Handle work button click to toggle workflow panel
   */
  handleWorkButtonClick() {
    console.log("ButtonHandler: Work button clicked");

    if (this.chatManager) {
      // Toggle workflow panel
      this.states.workflowPanelOpen = !this.states.workflowPanelOpen;

      if (this.states.workflowPanelOpen) {
        // Open the workflow panel
        if (this.chatManager.workflowPanelManager) {
          this.chatManager.workflowPanelManager.openPanel();
        }
      } else {
        // Close the workflow panel
        if (this.chatManager.workflowPanelManager) {
          this.chatManager.workflowPanelManager.closePanel();
        }
      }

      // Update button styles based on state
      this.updateWorkButtonStyle();
    }
  }

  /**
   * Handle execute button click
   */
  handleExecuteButtonClick() {
    console.log("ButtonHandler: Execute button clicked");

    if (!this.chatManager || !this.chatManager.selectedWorkflow) {
      console.error("ButtonHandler: No workflow selected for execution");
      return;
    }

    // Check if there's a message to send
    const message = this.chatManager.messageInput.value.trim();
    if (message) {
      console.log(
        `ButtonHandler: Executing workflow: ${this.chatManager.selectedWorkflow.subnetName} with message: ${message}`
      );
      this.chatManager.executeSelectedWorkflow(message);
    } else {
      console.log("ButtonHandler: No message to execute workflow with");
      // Flash the input field to indicate action needed
      this.chatManager.messageInput.style.backgroundColor = "rgba(255,0,0,0.1)";
      setTimeout(() => {
        this.chatManager.messageInput.style.backgroundColor = "";
      }, 500);
    }
  }

  /**
   * Handle reset button click
   */
  handleResetButtonClick() {
    console.log("ButtonHandler: Reset button clicked");

    if (this.chatManager && this.chatManager.workflowPanelManager) {
      this.chatManager.workflowPanelManager.resetWorkflowSelection();
      this.setWorkflowSelected(false);
    }
  }

  /**
   * Update when a workflow is selected
   */
  setWorkflowSelected(isSelected, workflow = null) {
    console.log(
      `ButtonHandler: Setting workflow selected to ${isSelected}`,
      workflow?.subnetName
    );

    this.states.workflowSelected = isSelected;

    // Show/hide execute button based on selection
    if (this.buttons.execute) {
      if (isSelected && workflow) {
        // Show and label the execute button
        this.buttons.execute.style.display = "block";
        this.buttons.execute.textContent = `Execute: ${workflow.subnetName}`;
      } else {
        // Hide the execute button
        this.buttons.execute.style.display = "none";
      }
    }

    // Update work button style
    this.updateWorkButtonStyle();
  }

  /**
   * Update the work button styling based on current state
   */
  updateWorkButtonStyle() {
    if (!this.buttons.work) return;

    if (this.states.workflowSelected) {
      // If a workflow is selected, add the selection indicator
      this.buttons.work.classList.add("has-selection");
    } else {
      // Default state
      this.buttons.work.classList.remove("has-selection");
    }

    // If panel is open, add active class
    if (this.states.workflowPanelOpen) {
      this.buttons.work.classList.add("active");
    } else {
      this.buttons.work.classList.remove("active");
    }
  }
}
