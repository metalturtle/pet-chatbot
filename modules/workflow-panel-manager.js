/**
 * WorkflowPanelManager
 * Handles the workflow panel UI, card creation, selection, and related functionality
 */
export class WorkflowPanelManager {
  constructor(chatManager) {
    this.chatManager = chatManager;
    this.workflowPanel = document.getElementById("workflow-panel");
    this.workflowCards = document.getElementById("workflow-cards");
    this.selectedWorkflow = null;
    this.availableServices = []; // Store all available services

    // Setup event listeners for reset button
    this.setupEventListeners();

    // Add a console log to track the state during initialization
    console.log(
      "WorkflowPanelManager: Constructor completed, selectedWorkflow:",
      this.selectedWorkflow
    );
  }

  setupEventListeners() {
    // Reset button is now handled by the ButtonHandler
    // No need for duplicate handlers here
  }

  displayWorkflowData(data) {
    console.log(
      "WorkflowPanelManager: displayWorkflowData called with data:",
      data
    );

    // Store all available services
    this.availableServices = data.subnetList || [];

    // Clear any existing workflow cards
    this.workflowCards.innerHTML = "";

    // Create a workflow with all available services
    const completeWorkflow = {
      id: "complete-workflow",
      name: "Complete Workflow",
      services: [...this.availableServices], // Use all available services
    };

    // Create the complete workflow card
    this.createWorkflowCard(completeWorkflow);

    // Show the workflow panel
    this.workflowPanel.style.display = "block";
  }

  createWorkflowCard(workflow) {
    const card = document.createElement("div");
    card.className = "workflow-card complete-workflow";
    card.dataset.workflowId = workflow.id;

    // Generate a list of service names
    const servicesList = workflow.services
      .map((service) => service.subnetName)
      .join(", ");

    card.innerHTML = `
      <div class="workflow-title">
        <div class="workflow-icon">⚡</div>
        <div class="workflow-name">${workflow.name}</div>
        <div class="workflow-id">${workflow.services.length} services</div>
      </div>
      <div class="workflow-details">Execute all services in sequence</div>
      <div class="workflow-prompt-label">Services:</div>
      <div class="workflow-services-list">${servicesList}</div>
      <div class="workflow-prompt-label">Service Details:</div>
      <div class="workflow-prompt">
        ${workflow.services
          .map(
            (service) =>
              `<strong>${service.subnetName}</strong>: ${service.promptExample}`
          )
          .join("<br><br>")}
      </div>
      <button class="workflow-use-button">Use Complete Workflow</button>
    `;

    // Find the use button within the card
    const useButton = card.querySelector(".workflow-use-button");

    // Add click event to the "Use Complete Workflow" button
    useButton.addEventListener("click", () => {
      // Select this workflow
      this.selectWorkflow(workflow, card);
    });

    // Make the whole card clickable
    card.addEventListener("click", (event) => {
      // Don't trigger this if we clicked the use button
      if (event.target === useButton) {
        return;
      }

      // Highlight the selected card
      document.querySelectorAll(".workflow-card").forEach((c) => {
        c.classList.remove("selected");
      });
      card.classList.add("selected");

      // Select this workflow
      this.selectWorkflow(workflow, card);
    });

    // Add card to workflow panel
    this.workflowCards.appendChild(card);
  }

  // Handle the selection of a workflow
  selectWorkflow(workflow, card = null) {
    console.log(`WorkflowPanelManager: selectWorkflow "${workflow.name}"`);

    // Set the selected workflow
    this.selectedWorkflow = workflow;

    // Update the parent ChatManager reference
    this.chatManager.selectedWorkflow = workflow;

    // Store it globally for debugging
    window.selectedWorkflow = workflow;

    // Update UI to show which workflow is selected
    if (card) {
      // Highlight the selected card
      document.querySelectorAll(".workflow-card").forEach((c) => {
        c.classList.remove("selected");
      });
      card.classList.add("selected");
    } else {
      // Try to find the right card by dataset attributes
      document.querySelectorAll(".workflow-card").forEach((c) => {
        if (c.dataset.workflowId === workflow.id) {
          c.classList.add("selected");
        } else {
          c.classList.remove("selected");
        }
      });
    }

    // Update the execute button text to show service count
    const executeButton = document.getElementById("execute-workflow-button");
    if (executeButton) {
      const serviceCount = workflow.services ? workflow.services.length : 1;
      executeButton.textContent = `Execute Workflow (${serviceCount} ${
        serviceCount > 1 ? "services" : "service"
      })`;

      // Make sure the execute button is visible
      executeButton.style.display = "block";
    }

    // Dispatch the workflow selected event
    const event = new CustomEvent("workflowSelected", {
      detail: workflow,
      bubbles: true,
    });
    document.dispatchEvent(event);

    // Create message about selected workflow
    const serviceNames = workflow.services.map((s) => s.subnetName).join(", ");
    const message = `Selected workflow: ${workflow.name} with ${workflow.services.length} services (${serviceNames}). Type a message and click Execute to run this workflow.`;

    // Display a message showing what was selected
    this.chatManager.messageHandler.addMessage(message, false);
  }

  // Reset the workflow selection
  resetWorkflowSelection() {
    console.log("WorkflowPanelManager: resetWorkflowSelection");

    // Clear selection
    this.selectedWorkflow = null;
    this.chatManager.selectedWorkflow = null;
    window.selectedWorkflow = null;

    // Reset UI - remove selected class from all cards
    document.querySelectorAll(".workflow-card").forEach((card) => {
      card.classList.remove("selected");
    });

    // Dispatch event for workflow deselection
    const event = new CustomEvent("workflowDeselected", {
      bubbles: true,
    });
    document.dispatchEvent(event);

    // Display a message
    this.chatManager.messageHandler.addMessage(
      "Workflow selection cleared. Using default chat mode.",
      false
    );
  }

  // Methods to open and close the workflow panel
  openPanel() {
    console.log("WorkflowPanelManager: Opening panel");
    if (this.workflowPanel) {
      this.workflowPanel.style.display = "block";

      // Fetch workflow data if needed
      if (!this.workflowCards.children.length) {
        this.chatManager.fetchWorkflowData();
      }
    }
  }

  closePanel() {
    console.log("WorkflowPanelManager: Closing panel");
    if (this.workflowPanel) {
      this.workflowPanel.style.display = "none";
    }
  }
}
