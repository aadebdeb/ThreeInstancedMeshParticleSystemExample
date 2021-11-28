class InstancedMeshParticleSystem {
  constructor(geometry, material, capacity, {
    birthRate = 100, // per seconds
    lifeExpectancy = 1.0, // in seconds
    lifeVariance = 0.0, // [0, 1]
    useColor = false,
  } = {}) {
    this._capacity = capacity;
    this.birthRate = birthRate;
    this.lifeExpectancy = lifeExpectancy;
    this.lifeVariance = lifeVariance;
    this._useColor = useColor;

    this.mesh = new THREE.InstancedMesh(geometry, material, capacity);
    if (useColor) {
      this.mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(3 * capacity), 3);
    }

    this._ages = new Array(this._capacity);
    this._lifes = new Array(this._capacity);
    this._alives = new Array(this._capacity);
    this._positions = new Array(this._capacity);
    this._colors = useColor ? new Array(this._capacity) : null;
    for (let i = 0; i < this._capacity; ++i) {
      this._ages[i] = 0.0;
      this._lifes[i] = 0.0;
      this._alives[i] = false;
      this._positions[i] = new THREE.Vector3();
      if (useColor) {
        this._colors[i] = new THREE.Color();
      }
    }

    // reuse variables
    this._reuseMatrix = new THREE.Matrix4();
    this._reuseColor = new THREE.Color();
  }

  get capacity() {
    return this._capacity;
  }

  get useColor() {
    return this._useColor;
  }

  update(deltaSeconds) {
    let aliveCount = 0;
    let birthNum = this.birthRate * deltaSeconds;

    for (let i = 0; i < this._capacity; ++i) {
      if (this._alives[i]) {
        const age = this._ages[i];
        const life = this._lifes[i];
        const currentAge = age + deltaSeconds;
        if (currentAge <= life) { // update alive particles
          this._ages[i] = currentAge;

          this.updateParticle(
            {
              matrix: this._reuseMatrix,
              color: this._useColor ? this._reuseColor : null,
            },
            {
              index: i,
              age: currentAge,
              life: life,
              position: this._positions[i],
              color: this._useColor ? this._colors[i] : null,
              useColor: this._useColor,
              deltaSeconds: deltaSeconds,
            }
          );
  
          this.mesh.setMatrixAt(aliveCount, this._reuseMatrix);
          this._positions[i].setFromMatrixPosition(this._reuseMatrix);
          if (this._useColor) {
            this.mesh.setColorAt(aliveCount, this._reuseColor);
            this._colors[i].copy(this._reuseColor);
          }
          aliveCount += 1;
        } else { // kill dead particles
          this._alives[i] = false;
        }
      } else if (birthNum >= 1.0 || (birthNum > 0 && Math.random() <= birthNum)) { // birth new particles
        birthNum -= 1.0;

        this._alives[i] = true;
        this._ages[i] = 0.0;
        this._lifes[i] = this.lifeExpectancy * (1.0 + (Math.random() * 2.0 - 1.0) * this.lifeVariance);

        this.createParticle(
          {
            matrix: this._reuseMatrix,
            color: this._useColor ? this._reuseColor : null,
          },
          {
            index: i,
            useColor: this._useColor,
          }
        );

        this.mesh.setMatrixAt(aliveCount, this._reuseMatrix);
        this._positions[i].setFromMatrixPosition(this._reuseMatrix);
        if (this._useColor) {
          this.mesh.setColorAt(aliveCount, this._reuseColor);
          this._colors[i].copy(this._reuseColor);
        }
        aliveCount += 1;
      }
    }

    this.mesh.count = aliveCount;
    this.mesh.instanceMatrix.needsUpdate = true;
    if (this._useColor) {
      this.mesh.instanceColor.needsUpdate = true;
    }
  }

  createParticle(outputs, params) {
    console.error('this method must be implemented in subclass.');
  }

  updateParticle(outputs, params) {
    console.error('this method must be implemented in subclass.');
  }

  dispose() {
    this.mesh.dispose();
  }
}