/**
 * MessageHandler
 * Handles adding messages to the chat, typing indicators, and speech bubble updates
 */
export class MessageHandler {
  constructor(chatManager) {
    this.chatManager = chatManager;
    this.messagesContainer = document.getElementById("messages");
  }

  addMessage(content, isUser) {
    const messageDiv = document.createElement("div");
    messageDiv.className = `message ${isUser ? "user-message" : "bot-message"}`;
    messageDiv.textContent = content;
    this.messagesContainer.appendChild(messageDiv);
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;

    // Sending a message counts as user interaction
    if (isUser) {
      this.chatManager.animationManager.registerUserInteraction();
    }
  }

  showTypingIndicator() {
    const typingDiv = document.createElement("div");
    typingDiv.className = "message bot-message typing-indicator";
    typingDiv.innerHTML = "<span>.</span><span>.</span><span>.</span>";
    typingDiv.id = "typing-indicator";
    this.messagesContainer.appendChild(typingDiv);
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
  }

  removeTypingIndicator() {
    const typingIndicator = document.getElementById("typing-indicator");
    if (typingIndicator) {
      typingIndicator.remove();
    }
  }

  updateSpeechBubble(text) {
    const speechBubble = document.getElementById("speech-bubble");
    if (speechBubble) {
      speechBubble.textContent = text;

      // Make the speech bubble visible when there is text
      if (text) {
        speechBubble.classList.add("visible");
      } else {
        speechBubble.classList.remove("visible");
      }
    }
  }

  startBotResponse() {
    this.chatManager.isResponding = true;

    // Start the talking animation
    this.chatManager.animationManager.startTalking();

    // Set initial speech bubble text while "thinking"
    this.updateSpeechBubble("I'm thinking...");

    // Show typing indicator
    this.showTypingIndicator();

    // Simulate variable response time based on message length
    const responseTime =
      this.chatManager.responseDelay +
      Math.random() * this.chatManager.responseDuration;

    setTimeout(() => {
      // After thinking time, update speech bubble with responsive text
      this.updateSpeechBubble("Let me tell you something...");

      // Remove typing indicator
      this.removeTypingIndicator();

      // Add the bot's response
      const botResponse =
        "I'm a chatbot. This is a placeholder response. I nod my head while I'm talking to show that I'm actively responding to your message.";
      this.addMessage(botResponse, false);

      // End the response sequence
      this.endBotResponse();
    }, responseTime);
  }

  endBotResponse() {
    // Stop the talking animation
    this.chatManager.animationManager.stopTalking();

    // Reset responding state
    this.chatManager.isResponding = false;
  }
}
