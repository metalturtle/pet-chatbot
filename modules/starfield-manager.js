import { SquareStarfield } from "../square-starfield.js";

export class StarfieldManager {
  constructor(scene) {
    this.scene = scene;
    this.starfield = new SquareStarfield(scene);
  }

  update(camera) {
    if (this.starfield) {
      this.starfield.update(camera);
    }
  }

  boostSpeed(speedMultiplier) {
    if (this.starfield) {
      this.starfield.boostSpeed(speedMultiplier);
    }
  }

  normalSpeed() {
    if (this.starfield) {
      this.starfield.normalSpeed();
    }
  }

  setSpeedMultiplier(multiplier) {
    if (this.starfield) {
      this.starfield.setSpeedMultiplier(multiplier);
    }
  }

  getCurrentStretchLevel() {
    return this.starfield ? this.starfield.currentStretchLevel : 0;
  }

  dispose() {
    if (this.starfield) {
      this.starfield.dispose();
    }
  }
}
