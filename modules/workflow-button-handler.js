/**
 * WorkflowButtonHandler
 * Specialized handler for workflow-related button interactions
 */
export class WorkflowButtonHandler {
  constructor(chatManager, buttonHandler) {
    this.chatManager = chatManager;
    this.buttonHandler = buttonHandler;

    // Set up workflow selection event listener
    this.setupWorkflowEvents();

    console.log("WorkflowButtonHandler: Initialized");
  }

  /**
   * Set up event listeners for workflow selection events
   */
  setupWorkflowEvents() {
    // Listen for workflow selection
    document.addEventListener("workflowSelected", (event) => {
      console.log(
        "WorkflowButtonHandler: Workflow selected event received",
        event.detail
      );
      this.onWorkflowSelected(event.detail);
    });

    // Listen for workflow deselection
    document.addEventListener("workflowDeselected", () => {
      console.log("WorkflowButtonHandler: Workflow deselected event received");
      this.onWorkflowDeselected();
    });

    // Create a simple diagnostic interval to ensure workflow selection state is consistent
    setInterval(() => {
      this.verifyWorkflowButtonState();
    }, 2000);
  }

  /**
   * Handle workflow selection
   */
  onWorkflowSelected(workflow) {
    if (!workflow) return;

    // Update the chatManager reference
    this.chatManager.selectedWorkflow = workflow;

    // Store globally for debugging
    window.selectedWorkflow = workflow;

    // Update button state through the button handler
    if (this.buttonHandler) {
      this.buttonHandler.setWorkflowSelected(true, workflow);
    }

    console.log(
      `WorkflowButtonHandler: Workflow "${workflow.subnetName}" selected and button state updated`
    );
  }

  /**
   * Handle workflow deselection
   */
  onWorkflowDeselected() {
    // Clear workflow selection
    this.chatManager.selectedWorkflow = null;
    window.selectedWorkflow = null;

    // Update button state
    if (this.buttonHandler) {
      this.buttonHandler.setWorkflowSelected(false);
    }

    console.log(
      "WorkflowButtonHandler: Workflow deselected and button state updated"
    );
  }

  /**
   * Utility method to verify and fix workflow button state
   */
  verifyWorkflowButtonState() {
    // Find the currently selected workflow
    const selectedWorkflow =
      this.chatManager.selectedWorkflow || window.selectedWorkflow;

    // Get the execute button
    const executeButton = document.getElementById("execute-workflow-button");

    if (selectedWorkflow) {
      // If we have a selected workflow but the execute button is not visible, fix it
      if (executeButton && executeButton.style.display !== "block") {
        console.log("WorkflowButtonHandler: Fixing execute button visibility");

        // Update through button handler
        if (this.buttonHandler) {
          this.buttonHandler.setWorkflowSelected(true, selectedWorkflow);
        } else {
          // Direct fix
          executeButton.style.display = "block";
          executeButton.textContent = `Execute: ${selectedWorkflow.subnetName}`;
        }
      }
    } else {
      // If we don't have a selected workflow but the execute button is visible, hide it
      if (executeButton && executeButton.style.display === "block") {
        console.log(
          "WorkflowButtonHandler: Hiding execute button as no workflow is selected"
        );

        // Update through button handler
        if (this.buttonHandler) {
          this.buttonHandler.setWorkflowSelected(false);
        } else {
          // Direct fix
          executeButton.style.display = "none";
        }
      }
    }
  }
}
