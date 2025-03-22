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

    // Clear any existing workflow cards
    this.workflowCards.innerHTML = "";

    // Create a card for each subnet in the list
    data.subnetList.forEach((subnet) => {
      const card = document.createElement("div");
      card.className = "workflow-card";
      card.dataset.subnetName = subnet.subnetName; // Store the subnet name for selection

      // Use the first letter of the subnet name for the icon
      const iconLetter = subnet.subnetName.charAt(0).toUpperCase();

      // Create additional details about file upload/download
      const fileDetails = [];
      if (subnet.fileUpload) fileDetails.push("Requires file upload");
      if (subnet.fileDownload) fileDetails.push("Provides file download");

      const fileDetailsText =
        fileDetails.length > 0
          ? `<div class="workflow-details">${fileDetails.join(" • ")}</div>`
          : "";

      card.innerHTML = `
        <div class="workflow-title">
          <div class="workflow-icon">${iconLetter}</div>
          <div class="workflow-name">${subnet.subnetName}</div>
          <div class="workflow-id">ID: ${subnet.subnetID}</div>
        </div>
        ${fileDetailsText}
        <div class="workflow-prompt-label">Example Prompt:</div>
        <div class="workflow-prompt">${subnet.promptExample}</div>
        <button class="workflow-use-button">Use This Prompt</button>
      `;

      // Find the use button within the card
      const useButton = card.querySelector(".workflow-use-button");

      // Add click event to the "Use This Prompt" button
      useButton.addEventListener("click", () => {
        // Set the message input first
        this.chatManager.messageInput.value = subnet.promptExample;
        this.chatManager.messageInput.focus();

        // Select this workflow
        this.selectWorkflow(subnet, card);
      });

      // Make the whole card clickable, but with a different action
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
        this.selectWorkflow(subnet, card);

        // Show details about this workflow
        this.chatManager.messageHandler.addMessage(
          `Workflow Info - Name: ${subnet.subnetName}, ID: ${subnet.subnetID}
          ${
            subnet.fileUpload
              ? "Requires file upload"
              : "No file upload required"
          }
          ${subnet.fileDownload ? "Provides file download" : "No file download"}
          URL: ${subnet.subnetURL}`,
          false
        );
      });

      // Add the card to the workflow panel
      this.workflowCards.appendChild(card);
    });

    // Show the workflow panel
    this.workflowPanel.style.display = "block";
  }

  // Handle the selection of a workflow
  selectWorkflow(workflow, card = null) {
    console.log("WorkflowPanelManager: selectWorkflow", workflow.subnetName);

    // Set the selected workflow
    this.selectedWorkflow = workflow;

    // Update the parent ChatManager reference
    this.chatManager.selectedWorkflow = workflow;

    // Store it globally for debugging
    window.selectedWorkflow = workflow;

    // Update UI to show which workflow is selected
    // If a card was provided, use it for selection, otherwise find by dataset
    if (card) {
      // Highlight the selected card
      document.querySelectorAll(".workflow-card").forEach((c) => {
        c.classList.remove("selected");
      });
      card.classList.add("selected");
    } else {
      document.querySelectorAll(".workflow-card").forEach((card) => {
        if (card.dataset.subnetName === workflow.subnetName) {
          card.classList.add("selected");
        } else {
          card.classList.remove("selected");
        }
      });
    }

    // Dispatch the workflow selected event
    const event = new CustomEvent("workflowSelected", {
      detail: workflow,
      bubbles: true,
    });
    document.dispatchEvent(event);

    // Display a message showing what was selected
    this.chatManager.messageHandler.addMessage(
      `Selected workflow: ${workflow.subnetName}. Type a message and click Execute to use this workflow.`,
      false
    );
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
