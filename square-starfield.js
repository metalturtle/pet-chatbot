import * as THREE from "three";

class SquareStarfield {
  constructor(scene) {
    this.scene = scene;
    this.stars = [];
    this.starCount = 2000;
    this.bounds = 1000; // The bounds of the star field cube
    this.minSize = 0.5;
    this.maxSize = 3;
    this.minSpeed = 0.2;
    this.maxSpeed = 1.2;
    this.speedMultiplier = 1.0; // Normal speed multiplier
    this.boostMultiplier = 5.0; // Increased boost multiplier (was 3.0)
    this.maxStretchFactor = 20.0; // Increased maximum stretch (was 15.0)
    this.transitionSpeed = 0.15; // Faster transition (was 0.12)
    this.currentStretchLevel = 0; // Current transition level (0-1)
    this.chromaticStrength = 0.08; // Increased chromatic aberration (was 0.05)
    // Pure white color for all stars
    this.starColor = 0xffffff; // Pure white

    this.createStarfield();
  }

  createStarfield() {
    // Create a group to hold all stars
    this.group = new THREE.Group();
    this.scene.add(this.group);

    // We'll use line geometry for more convincing streaks
    const geometry = new THREE.PlaneGeometry(1, 1);

    // Create individual stars
    for (let i = 0; i < this.starCount; i++) {
      // Random position
      const x = (Math.random() * 2 - 1) * this.bounds;
      const y = (Math.random() * 2 - 1) * this.bounds;
      // Place stars between camera and far bound initially
      const z = Math.random() * this.bounds * 2 - this.bounds;

      // Random size
      const size = this.minSize + Math.random() * (this.maxSize - this.minSize);

      // All stars are pure white
      const color = this.starColor;

      // Random speed
      const speed =
        this.minSpeed + Math.random() * (this.maxSpeed - this.minSpeed);

      // Create material with no depth test so it always renders on top
      const material = new THREE.MeshBasicMaterial({
        color: color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.7 + Math.random() * 0.3,
        depthTest: false,
      });

      // Create the star mesh
      const star = new THREE.Mesh(geometry, material);
      star.position.set(x, y, z);
      star.scale.set(size, size, size);

      // Make the star always face the camera
      star.lookAt(0, 0, 0);

      // Create chromatic aberration elements - color-shifted versions of the star
      let redShift = null;
      let blueShift = null;

      // Apply chromatic aberration to larger stars only
      if (size > 1.2) {
        // Create red-shifted version
        const redMaterial = new THREE.MeshBasicMaterial({
          color: 0xff3333, // Softer red
          side: THREE.DoubleSide,
          transparent: true,
          opacity: material.opacity * 0.5, // Less visible for subtlety
          depthTest: false,
          blending: THREE.AdditiveBlending,
        });

        redShift = new THREE.Mesh(geometry, redMaterial);
        redShift.scale.set(size, size, size);
        redShift.visible = false; // Hidden initially
        this.group.add(redShift);

        // Create blue-shifted version
        const blueMaterial = new THREE.MeshBasicMaterial({
          color: 0x3333ff, // Softer blue
          side: THREE.DoubleSide,
          transparent: true,
          opacity: material.opacity * 0.5, // Less visible for subtlety
          depthTest: false,
          blending: THREE.AdditiveBlending,
        });

        blueShift = new THREE.Mesh(geometry, blueMaterial);
        blueShift.scale.set(size, size, size);
        blueShift.visible = false; // Hidden initially
        this.group.add(blueShift);
      }

      // Store star data for animation
      this.stars.push({
        mesh: star,
        speed: speed,
        initialZ: z,
        originalScale: size,
        defaultIntensity: material.opacity,
        distance: Math.sqrt(x * x + y * y), // Store distance from center axis
        redShift: redShift,
        blueShift: blueShift,
      });

      // Add to group
      this.group.add(star);
    }
  }

  update(camera) {
    // Smoothly transition the stretch level
    if (this.speedMultiplier > 1.0) {
      // Transitioning to hyperdrive
      this.currentStretchLevel = Math.min(
        1.0,
        this.currentStretchLevel + this.transitionSpeed
      );
    } else {
      // Transitioning back to normal
      this.currentStretchLevel = Math.max(
        0.0,
        this.currentStretchLevel - this.transitionSpeed
      );
    }

    // Calculate effective stretch based on transition state
    const effectiveStretch = this.currentStretchLevel * this.maxStretchFactor;

    // Calculate blur effect strength based on current stretch level
    const blurFactor = this.currentStretchLevel;

    // Calculate chromatic aberration offset based on stretch level
    const chromaticOffset = this.currentStretchLevel * this.chromaticStrength;

    // Update each star
    for (let i = 0; i < this.stars.length; i++) {
      const star = this.stars[i];
      const mesh = star.mesh;

      // Calculate effective speed (with multiplier)
      const effectiveSpeed = star.speed * this.speedMultiplier;

      // Move star away from camera (positive z) with current speed multiplier
      mesh.position.z += effectiveSpeed;

      // If star is too far from camera, reset its position
      if (mesh.position.z > this.bounds) {
        mesh.position.z = -this.bounds;
        mesh.position.x = (Math.random() * 2 - 1) * this.bounds;
        mesh.position.y = (Math.random() * 2 - 1) * this.bounds;
        star.distance = Math.sqrt(
          mesh.position.x * mesh.position.x + mesh.position.y * mesh.position.y
        );
      }

      // Make the star always face the camera
      mesh.quaternion.copy(camera.quaternion);

      // Apply hyperdrive effect
      if (this.currentStretchLevel > 0) {
        // Direction from star to center (we invert it to stretch toward center)
        const dirX = -mesh.position.x;
        const dirY = -mesh.position.y;
        const length = Math.sqrt(dirX * dirX + dirY * dirY);

        if (length > 0) {
          // Normalize direction vector
          const normalizedDirX = dirX / length;
          const normalizedDirY = dirY / length;

          // Calculate distance-based factors for more realistic effect
          // Stars closer to center stretch less, stars farther stretch more
          const distanceFactor = Math.min(1.0, star.distance / 100);

          // Stars farther from camera (higher z) stretch more
          const zFactor = Math.min(
            1.0,
            (mesh.position.z + this.bounds) / (2 * this.bounds)
          );

          // Higher speeds stretch more
          const speedFactor =
            (star.speed - this.minSpeed) / (this.maxSpeed - this.minSpeed);

          // Combined stretch factor
          const stretchFactor =
            effectiveStretch * distanceFactor * zFactor * speedFactor;

          // Calculate base and stretched dimensions
          const baseSize = star.originalScale;

          // Calculate stretch based on position
          const stretchLength = baseSize * (1.0 + stretchFactor * 3.0);
          const stretchWidth = baseSize * (1.0 - blurFactor * 0.7); // Thinner with more stretch

          // Apply stretch toward center
          mesh.scale.set(stretchWidth, stretchWidth, baseSize);

          // Rotate to point toward center
          const angle = Math.atan2(normalizedDirY, normalizedDirX);
          mesh.rotation.z = angle + Math.PI / 2; // Add offset to align correctly

          // Scale to desired length
          mesh.scale.y = stretchLength;

          // Increase brightness with speed
          mesh.material.opacity =
            star.defaultIntensity * (1 + blurFactor * 0.7);

          // Apply chromatic aberration by offsetting red and blue copies
          if (star.redShift && star.blueShift) {
            // Make red and blue shifts visible during hyperdrive
            star.redShift.visible = true;
            star.blueShift.visible = true;

            // Direction for aberration - perpendicular to the stretch direction
            const perpX = -normalizedDirY; // Perpendicular to the direction vector
            const perpY = normalizedDirX;

            // Calculate offset amount - smaller for subtle effect
            // Scale with star size but keep it subtle
            const offsetAmount = chromaticOffset * baseSize * 2.5;

            // Position red and blue shifts with smaller separation
            star.redShift.position.set(
              mesh.position.x + perpX * offsetAmount,
              mesh.position.y + perpY * offsetAmount,
              mesh.position.z
            );

            star.blueShift.position.set(
              mesh.position.x - perpX * offsetAmount,
              mesh.position.y - perpY * offsetAmount,
              mesh.position.z
            );

            // Copy rotation from main star
            star.redShift.rotation.copy(mesh.rotation);
            star.blueShift.rotation.copy(mesh.rotation);

            // Apply similar stretch to the main star
            star.redShift.scale.copy(mesh.scale);
            star.blueShift.scale.copy(mesh.scale);

            // Make red and blue have only slightly different elongation
            star.redShift.scale.y *= 1.05; // Just a little more stretched
            star.blueShift.scale.y *= 0.95; // Just a little less stretched

            // Adjust opacity based on hyperdrive intensity - make subtler
            const colorOpacity = star.defaultIntensity * blurFactor * 0.6;
            star.redShift.material.opacity = colorOpacity;
            star.blueShift.material.opacity = colorOpacity;
          }
        }
      } else {
        // Reset to normal square shape when not in hyperdrive mode
        mesh.rotation.set(0, 0, 0);
        mesh.scale.set(
          star.originalScale,
          star.originalScale,
          star.originalScale
        );
        mesh.material.opacity = star.defaultIntensity;

        // Make it face the camera again
        mesh.quaternion.copy(camera.quaternion);

        // Hide chromatic aberration elements when not in hyperdrive
        if (star.redShift && star.blueShift) {
          star.redShift.visible = false;
          star.blueShift.visible = false;
        }
      }
    }
  }

  // Boost the starfield speed when user is waiting for a response
  boostSpeed(speedMultiplier = null) {
    // If a specific multiplier is provided, use it, otherwise use the default
    if (speedMultiplier !== null && !isNaN(speedMultiplier)) {
      // Set the boost multiplier to the provided value
      this.boostMultiplier = speedMultiplier;
      console.log(`StarField: Boosting speed to ${speedMultiplier}x`);
    }

    // Apply the boost multiplier
    this.speedMultiplier = this.boostMultiplier;

    // Also increase transition speed for a more dramatic effect
    this.transitionSpeed = 0.35; // Much faster transition

    // Increase maximum stretch factor for more dramatic streaks
    this.maxStretchFactor = 35.0; // Much longer streaks

    // Increase chromatic strength for more visible effect during hyperdrive
    this.chromaticStrength = 0.15;

    console.log(
      `StarField: Hyperdrive ENGAGED at ${this.speedMultiplier}x speed!`
    );
  }

  // Return to normal speed when the chatbot responds
  normalSpeed() {
    this.speedMultiplier = 1.0;

    // Reset transition speed to default
    this.transitionSpeed = 0.15;

    // Reset maximum stretch factor to default
    this.maxStretchFactor = 20.0;

    // Reset chromatic strength to default
    this.chromaticStrength = 0.08;
  }

  // Set a custom speed multiplier if desired
  setSpeedMultiplier(multiplier) {
    this.speedMultiplier = multiplier;
  }

  dispose() {
    // Clean up resources when no longer needed
    if (this.group) {
      for (let i = 0; i < this.stars.length; i++) {
        const star = this.stars[i];
        star.mesh.geometry.dispose();
        star.mesh.material.dispose();
        this.group.remove(star.mesh);

        // Clean up chromatic aberration elements
        if (star.redShift) {
          star.redShift.geometry.dispose();
          star.redShift.material.dispose();
          this.group.remove(star.redShift);
        }

        if (star.blueShift) {
          star.blueShift.geometry.dispose();
          star.blueShift.material.dispose();
          this.group.remove(star.blueShift);
        }
      }
      this.scene.remove(this.group);
      this.stars = [];
    }
  }
}

export { SquareStarfield };
