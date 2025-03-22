/**
 * Manages button behaviors and states
 */
export class ButtonManager {
  constructor(chatManager) {
    this.chatManager = chatManager;

    // Store references to buttons
    this.workButton = chatManager.workButton;
    this.executeButton = document.getElementById("execute-workflow-button");

    // Set up event listeners
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Set up the work button
    if (this.workButton) {
      this.workButton.addEventListener("click", (e) => {
        e.preventDefault();
        console.log("Work button clicked");
        this.chatManager.handleWorkButtonClick();
      });
    }

    // Initial button state
    this.updateWorkButton(false);
  }

  // Update the work button state based on selectedWorkflow
  updateWorkButton(hasSelectedWorkflow) {
    if (!this.workButton) return;

    console.log("ButtonManager: updateWorkButton", hasSelectedWorkflow);

    if (hasSelectedWorkflow) {
      // If workflow is selected, show that in the button
      this.workButton.textContent = "Workflows";
      this.workButton.classList.add("has-selection");
    } else {
      // Default state - just show "Work"
      this.workButton.textContent = "Work";
      this.workButton.classList.remove("has-selection");
    }
  }

  // Helper to show Execute button when workflow is selected
  showExecuteButton(workflow) {
    if (!this.executeButton) return;

    console.log("ButtonManager: showExecuteButton", workflow?.subnetName);

    if (workflow) {
      this.executeButton.style.display = "block";
      this.executeButton.textContent = `Execute: ${workflow.subnetName}`;

      // Ensure it's properly clickable
      this.executeButton.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log("Execute button clicked via ButtonManager");

        // Get the message input value
        const message = this.chatManager.messageInput.value.trim();
        if (message) {
          this.chatManager.executeSelectedWorkflow(message);
        } else {
          // Flash the input to indicate text is needed
          this.chatManager.messageInput.style.backgroundColor =
            "rgba(255,0,0,0.1)";
          setTimeout(() => {
            this.chatManager.messageInput.style.backgroundColor = "";
          }, 500);
        }
      };
    } else {
      this.executeButton.style.display = "none";
    }
  }

  // Helper to hide Execute button
  hideExecuteButton() {
    if (this.executeButton) {
      this.executeButton.style.display = "none";
    }
  }
}
