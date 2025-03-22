/**
 * WorkflowAPI
 * Handles all API calls to workflow services
 */
export class WorkflowAPI {
  constructor(chatManager) {
    this.chatManager = chatManager;
    this.workflowApiUrl = "https://skyintel-c0n1.stackos.io/natural-request";
  }

  async fetchWorkflowData(userPrompt = "") {
    console.log(
      "WorkflowAPI: fetchWorkflowData called with prompt:",
      userPrompt
    );

    try {
      // Get the prompt - use provided prompt or default text
      const prompt = userPrompt || "Show available workflows";
      console.log("WorkflowAPI: Using prompt:", prompt);

      // Make a POST request to the API with the user prompt in the payload
      console.log("WorkflowAPI: Sending request to:", this.workflowApiUrl);
      const response = await fetch(this.workflowApiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        // Include the user prompt in the payload
        body: JSON.stringify({
          prompt: prompt,
        }),
      });

      // Check if the request was successful
      console.log(
        "WorkflowAPI: Received response with status:",
        response.status
      );
      if (!response.ok) {
        throw new Error(`API responded with status ${response.status}`);
      }

      // Parse the JSON response
      const data = await response.json();
      console.log("WorkflowAPI: Response data parsed successfully");

      // Validate that the response has the expected structure
      if (!data.subnetList || !Array.isArray(data.subnetList)) {
        throw new Error("Invalid response format: missing subnetList array");
      }

      console.log("Workflow data fetched successfully:", data);
      return data;
    } catch (error) {
      console.error("WorkflowAPI: Error fetching workflow data:", error);

      // Return fallback data in case of error
      console.log("WorkflowAPI: Using fallback data due to error");
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

  async executeWorkflow(message, workflow) {
    // Create proper request body with the user prompt
    const requestBody = {
      prompt: message, // This is the user's message/prompt
    };

    try {
      const response = await fetch(workflow.subnetURL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`API responded with status ${response.status}`);
      }

      const responseData = await response.json();
      console.log(`${workflow.subnetName} API response:`, responseData);

      return {
        success: true,
        data: responseData,
      };
    } catch (apiError) {
      console.error(`Error calling ${workflow.subnetName} API:`, apiError);

      // Return simulated response for the error case
      return {
        success: false,
        error: apiError.message,
        simulatedResponse: {
          success: true,
          message: `${workflow.subnetName} processed your request: "${message}"`,
          result: `This is a simulated response from the ${workflow.subnetName} service.`,
        },
      };
    }
  }
}
