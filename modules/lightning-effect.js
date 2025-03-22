export class LightningEffect {
  constructor() {
    this.lightning = [];
    this.active = false;
    this.container = null;
    this.canvas1 = null;
    this.canvas2 = null;
    this.ctx = null;
    this.ctx2 = null;
    this.frameNo = 1;
    this.core = { x: 0, y: 0, r: 30 }; // Will be positioned at head center
    this.wallRadius = 100; // Lightning reach
    this.numBolts = 6; // Number of lightning bolts
    this.hue = Math.floor(Math.random() * 360); // Random color
    this.animationFrame = null;
  }

  init() {
    // Create container for lightning effect
    this.container = document.createElement("div");
    this.container.id = "lightning-effect-container";
    this.container.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 10;
      opacity: 0;
      transition: opacity 0.3s ease;
    `;

    // Create canvases
    this.canvas1 = document.createElement("canvas");
    this.canvas1.id = "lightning-canvas1";
    this.canvas1.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
    `;

    this.canvas2 = document.createElement("canvas");
    this.canvas2.id = "lightning-canvas2";
    this.canvas2.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      filter: blur(8px);
      background: rgba(0,0,0,0);
    `;

    // Add canvases to container
    this.container.appendChild(this.canvas1);
    this.container.appendChild(this.canvas2);

    // Add the container to the model container
    const modelContainer = document.getElementById("model-container");
    if (modelContainer) {
      modelContainer.appendChild(this.container);
      console.log("Lightning effect container added to model container");
    } else {
      console.error("Model container not found");
      return false;
    }

    // Initialize canvases
    this.resizeCanvases();
    window.addEventListener("resize", () => this.resizeCanvases());

    // Get contexts
    this.ctx = this.canvas1.getContext("2d");
    this.ctx2 = this.canvas2.getContext("2d");

    // Success
    return true;
  }

  resizeCanvases() {
    if (!this.canvas1 || !this.container) return;

    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    this.canvas1.width = width;
    this.canvas1.height = height;
    this.canvas2.width = width;
    this.canvas2.height = height;

    // Update core position to be centered
    this.core.x = width / 2;
    this.core.y = height / 2.5; // Position slightly above center (at head)

    // Update wall radius based on container size
    this.wallRadius = Math.min(width, height) / 4;
  }

  start() {
    if (!this.container) {
      if (!this.init()) {
        console.error("Failed to initialize lightning effect");
        return;
      }
    }

    // Show the container
    this.container.style.opacity = "1";

    // Make sure lightning array is empty
    this.lightning = [];

    // Create lightning bolts
    this.createLightning();

    // Start animation
    this.active = true;
    this.animate();

    console.log("Lightning effect started");
  }

  stop() {
    // Hide the container
    if (this.container) {
      this.container.style.opacity = "0";
    }

    // Stop animation
    this.active = false;
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }

    console.log("Lightning effect stopped");
  }

  createLightning() {
    // Generate new hue for variety
    this.hue = Math.floor(Math.random() * 360);

    // Create lightning bolts
    for (let i = 0; i < this.numBolts; i++) {
      this.lightning.push(
        new LightningBolt(
          Math.random() * 2 * Math.PI,
          this.hue,
          this.core,
          this.wallRadius
        )
      );
    }
  }

  animate() {
    if (!this.active) return;

    this.animationFrame = requestAnimationFrame(() => this.animate());

    // Clear canvases
    this.ctx.clearRect(0, 0, this.canvas1.width, this.canvas1.height);
    this.ctx2.clearRect(0, 0, this.canvas2.width, this.canvas2.height);

    // Draw and update lightning bolts
    for (let i = 0; i < this.lightning.length; i++) {
      // Occasionally skip drawing to create flickering effect
      if (Math.random() > 0.1) {
        this.lightning[i].draw(this.ctx, this.ctx2);
      }
      this.lightning[i].update();
    }

    // Draw core (head center)
    this.drawCore();
  }

  drawCore() {
    // Shell
    this.ctx.lineWidth = Math.random() * 3 + 3;
    this.ctx2.lineWidth = this.ctx.lineWidth * 2;

    // Make the core mostly transparent
    this.ctx.fillStyle = "rgba(30, 30, 30, 0.1)";
    this.ctx.strokeStyle = `hsl(${this.hue}, 100%, 50%)`;

    this.ctx.beginPath();
    this.ctx.arc(this.core.x, this.core.y, this.core.r, 0, 2 * Math.PI);
    this.ctx.fill();
    this.ctx.stroke();

    // Glowing shell
    this.ctx2.strokeStyle = `hsl(${this.hue}, 100%, 50%)`;
    this.ctx2.beginPath();
    this.ctx2.arc(this.core.x, this.core.y, this.core.r, 0, 2 * Math.PI);
    this.ctx2.stroke();
  }
}

class LightningBolt {
  constructor(angle, hue, core, wallRadius) {
    this.angle = angle;
    this.hue = hue;
    this.core = core;
    this.wallRadius = wallRadius;
    this.numPoints = 8;

    // Lightning path points
    this.points = [];
    for (let j = 0; j < this.numPoints; j++) {
      this.points.push({
        x: core.r + (j / (this.numPoints - 1)) * (wallRadius - core.r),
        y: 0,
      });
    }

    // Lightning properties
    this.drift = Math.random() * 0.02 - 0.01;
    this.timer = 1;
    this.timerRate = 0.01;
    this.width = 3;
    this.fadeRate = Math.random() * 0.11 + 0.09;
    this.angularVelocity = 0.05;
    this.phase = 0;
    this.phaseDifference = Math.random() * 0.4 + 1.5;
    this.amplitude = 20;
  }

  draw(ctx, ctx2) {
    // Main lightning
    ctx.lineWidth = this.width * 1.3;
    ctx.strokeStyle = `hsl(${this.hue}, 100%, 50%)`;

    ctx.save();
    ctx.translate(this.core.x, this.core.y);
    ctx.rotate(this.angle);

    ctx.beginPath();
    ctx.moveTo(this.points[0].x, this.points[0].y);

    for (let j = 1; j < this.numPoints; j++) {
      ctx.lineTo(this.points[j].x, this.points[j].y);
    }

    ctx.stroke();
    ctx.restore();

    // Glow effect
    ctx2.lineWidth = this.width * 3;
    ctx2.strokeStyle = `hsl(${this.hue}, 100%, 50%)`;

    ctx2.save();
    ctx2.translate(this.core.x, this.core.y);
    ctx2.rotate(this.angle);

    ctx2.beginPath();
    ctx2.moveTo(this.points[0].x, this.points[0].y);

    for (let j = 1; j < this.numPoints; j++) {
      ctx2.lineTo(this.points[j].x, this.points[j].y);
    }

    ctx2.stroke();

    // Lightning tip glow
    ctx2.beginPath();
    const lastPoint = this.points[this.numPoints - 1];
    ctx2.arc(
      lastPoint.x,
      lastPoint.y,
      this.width * 3 + Math.random() * 10,
      0,
      2 * Math.PI
    );
    ctx2.fill();

    ctx2.restore();
  }

  update() {
    // Update angle and width
    this.angle += this.drift;
    this.width -= this.fadeRate;
    this.timer -= this.timerRate;

    // Reset lightning properties when faded
    if (this.width <= 0) {
      this.angle = Math.random() * 2 * Math.PI;
      this.width = 3;
      this.phaseDifference = Math.random() * 0.4 + 1.5;
      this.fadeRate = Math.random() * 0.11 + 0.09;
      this.timerRate = Math.random() * 0.09 + 0.01;
    }

    // Randomize phase periodically
    if (this.timer <= 0) {
      this.phase = Math.random() * 2 * Math.PI;
      this.amplitude = Math.random() * 10 + 10;
      this.angularVelocity = Math.random() * 0.04 + 0.03;
      this.timer = 1;
    }

    // Update path points to create zigzag effect
    for (let j = 0; j < this.numPoints; j++) {
      this.phase -= this.angularVelocity;
      this.points[j].y =
        this.amplitude *
        j *
        (this.numPoints - 1 - j) *
        0.1 *
        Math.sin(this.phase + j * this.phaseDifference);
    }
  }
}
