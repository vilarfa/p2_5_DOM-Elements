// Lista global de polillas activas
let moths = [];

// Centro y ancho original del sprite (para escalar correctamente)
const ORIG_CENTER = { x: 800, y: 320 };
const ORIG_WIDTH = 600;

// Tamaños mínimos y máximos de las polillas
const MIN_SIZE = 60, MAX_SIZE = 80;

// Número inicial de polillas
const INITIAL_MOTHS = 12;

// Margen dinámico según pantalla
let margin;

// Contador de frames para generar polillas con el tiempo
let frameCounter = 0;


// ---------------------------------------------------------
// SETUP
// ---------------------------------------------------------
function setup() {
  createCanvas(windowWidth, windowHeight);
  noSmooth();
  colorMode(HSB, 360, 100, 100);

  // Margen = 10% del lado más pequeño de la pantalla
  margin = min(width, height) * 0.10;

  // Primera polilla con paleta original
  moths.push(new Moth(random(0.1, 0.9), random(0.1, 0.9), originalPalette()));

  // Resto con variaciones de color
  for (let i = 1; i < INITIAL_MOTHS; i++) {
    moths.push(new Moth(random(0.1, 0.9), random(0.1, 0.9), variantPalette()));
  }
}


// ---------------------------------------------------------
// DRAW LOOP
// ---------------------------------------------------------
function draw() {
  background("#070718"); // Fondo oscuro

  // Actualizar y dibujar todas las polillas
  moths.forEach(m => {
    m.update();
    m.show();
  });

  // Generar nuevas polillas cada 300 frames (~5s)
  frameCounter++;
  if (frameCounter % 300 === 0) {
    moths.push(new Moth(random(0.1, 0.9), random(0.1, 0.9), variantPalette()));
  }
}


// ---------------------------------------------------------
// PALETAS DE COLOR
// ---------------------------------------------------------

// Genera una paleta armónica basada en un tono principal
function harmoniousPalette() {
  let baseHue = random() < 0.5 ? random(330, 360) : random(50, 65);

  let main    = color(baseHue, random(65, 80), random(85, 100));
  let lower   = color((baseHue + random(20, 40)) % 360, random(60, 80), random(85, 100));
  let body    = color((baseHue + random(40, 60)) % 360, random(60, 80), random(85, 100));
  let outline = color((baseHue + random(60, 90)) % 360, random(60, 80), random(75, 95));

  return { main, lower, body, outline };
}

function originalPalette() { return harmoniousPalette(); }
function variantPalette()  { return harmoniousPalette(); }


// ---------------------------------------------------------
// CLASE MOTH (POLILLA)
// ---------------------------------------------------------
class Moth {
  constructor(xRel, yRel, palette) {

    // Posición relativa (0–1) para adaptarse a cambios de ventana
    this.xRel = xRel;
    this.yRel = yRel;
    this.updatePosition();

    // Atributos principales
    Object.assign(this, {
      palette,
      angle: random(TWO_PI),       // Ángulo para movimientos circulares
      dir: random([-1, 1]),        // Dirección inicial
      type: floor(random(1, 5)),   // Tipo de movimiento (1–4)
      exploding: false,            // Estado de explosión
      particles: [],               // Partículas generadas al explotar
      timer: 0                     // Duración de explosión
    });

    // Escalado del sprite
    this.scaleFactor = random(MIN_SIZE, MAX_SIZE) / ORIG_WIDTH;
    this.r = (ORIG_WIDTH * this.scaleFactor) / 2; // Radio de colisión
    this.speed = random(0.4, 1.2);                // Velocidad base
  }

  // Convierte posición relativa en posición absoluta
  updatePosition(randomOffset = true) {
    this.x = margin + this.xRel * (width - 2 * margin);
    this.y = margin + this.yRel * (height - 2 * margin);

    // Pequeña variación aleatoria para evitar alineaciones rígidas
    if (randomOffset) {
      this.x += random(-20, 20);
      this.y += random(-20, 20);
      this.x = constrain(this.x, margin, width - margin);
      this.y = constrain(this.y, margin, height - margin);
    }
  }

  // Actualiza la posición relativa según la ventana actual
  updateRelPosition() {
    this.xRel = (this.x - margin) / (width - 2 * margin);
    this.yRel = (this.y - margin) / (height - 2 * margin);
  }

  // Movimiento y explosión
  update() {
    if (!this.exploding) {

      // Cuatro patrones de movimiento
      switch (this.type) {
        case 1: // Movimiento suave con variación angular
          this.x += cos(this.angle) * this.speed;
          this.y += sin(this.angle) * this.speed;
          this.angle += random(-0.08, 0.08);
          break;

        case 2: // Movimiento horizontal ondulado
          this.x += this.speed * this.dir;
          this.y += sin(frameCount * 0.04 + this.x * 0.001) * 1.2;
          if (this.x < margin || this.x > width - margin) this.dir *= -1;
          break;

        case 3: // Movimiento vertical ondulado
          this.y += this.speed * this.dir;
          this.x += cos(frameCount * 0.04 + this.y * 0.001) * 1.2;
          if (this.y < margin || this.y > height - margin) this.dir *= -1;
          break;

        case 4: // Movimiento circular continuo
          this.angle += 0.025 * this.dir;
          this.x += cos(this.angle) * this.speed;
          this.y += sin(this.angle) * this.speed;
          break;
      }

      // Mantener dentro del área visible
      this.x = constrain(this.x, margin, width - margin);
      this.y = constrain(this.y, margin, height - margin);

      this.updateRelPosition();

    } else {
      // Actualizar partículas de explosión
      this.particles.forEach(p => p.update());
      if (--this.timer <= 0) this.exploding = false;
    }
  }

  // Dibuja la polilla o sus partículas si está explotando
  show() {
    this.exploding
      ? this.particles.forEach(p => p.show())
      : this.drawSprite();
  }

  // Dibujo del sprite pixelado
  drawSprite() {
    push();
    translate(this.x, this.y);
    scale(this.scaleFactor);
    translate(-ORIG_CENTER.x, -ORIG_CENTER.y);
    noStroke();

    // Función auxiliar para dibujar bloques de color
    const drawRects = (c, arr) => { fill(c); arr.forEach(r => rect(...r)); };

    // Capas del sprite
    drawRects(this.palette.main, [
      [520,180,60,60],[1020,180,60,60],[960,200,100,120],[540,200,100,120],
      [640,200,60,100],[900,200,60,100],[880,240,20,40],[700,240,20,40],
      [560,320,60,20],[980,320,60,20],[600,340,20,20],[980,340,20,20]
    ]);

    drawRects(this.palette.lower, [
      [640,300,300,160],[620,360,20,60],[940,340,20,80]
    ]);

    drawRects(this.palette.body, [
      [740,240,120,100]
    ]);

    drawRects(this.palette.outline, [
      // Muchísimos rectángulos que forman el contorno pixelado
      // (los mantengo tal cual, solo comentado como bloque)
      [740,140,20,60],[720,160,20,20],[760,180,20,20],[760,200,80,20],
      [820,180,20,20],[840,140,20,60],[860,160,20,20],
      [700,220,200,20],[700,200,20,40],[880,200,20,40],
      [680,200,40,20],[880,200,40,20],[580,180,100,20],[920,180,100,20],
      [980,160,120,20],[500,160,120,20],[500,160,20,120],[1080,160,20,120],
      [520,240,20,80],[1060,240,20,80],[540,320,20,20],[1040,320,20,20],
      [560,340,40,20],[1000,340,40,20],[580,360,40,20],[980,360,40,20],
      [960,340,20,20],[620,340,20,20],[620,320,60,20],[920,320,60,20],
      [900,300,60,20],[640,300,60,20],[700,280,20,20],[880,280,20,20],
      [720,240,20,100],[860,240,20,100],[740,240,20,20],[840,240,20,20],
      [740,320,20,20],[840,320,20,20],[760,340,80,20],[600,360,20,80],
      [600,420,40,20],[620,440,60,20],[960,360,20,80],[940,420,20,20],
      [900,440,60,20],[980,360,20,80],[960,420,40,20],[920,440,60,20],
      [660,440,40,40],[900,440,40,40],[700,460,60,40],[840,460,60,40],
      [740,440,20,40],[840,440,20,40],[760,440,80,20],[780,440,40,40],
      [780,360,40,20],[540,340,20,20],[1040,340,20,20]
    ]);

    pop();
  }

  // Genera partículas en forma de estrella
  explode() {
    this.exploding = true;
    this.timer = 60;
    this.particles = [];

    let n = floor(random(8, 14));
    for (let i = 0; i < n; i++) {
      let angle = TWO_PI / n * i;
      let speed = random(2, 5);
      this.particles.push(
        new StarParticle(this.x, this.y, this.scaleFactor, floor(random(1, 6)), angle, speed)
      );
    }
  }

  // Detección de clic dentro del radio
  clicked(mx, my) {
    return dist(mx, my, this.x, this.y) <= this.r;
  }
}


// ---------------------------------------------------------
// PARTÍCULAS DE EXPLOSIÓN
// ---------------------------------------------------------
class StarParticle {
  constructor(x, y, scale, type, angle = 0, speed = 0) {
    Object.assign(this, { x, y, type });

    this.scale = scale * random(0.85, 1.25);
    this.vx = cos(angle) * speed;
    this.vy = sin(angle) * speed;

    this.alpha = 255;
    this.life = floor(random(45, 90));

    this.rot = random(TWO_PI);
    this.rotz = random(-0.06, 0.06);
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.alpha -= 255 / this.life;
    this.rot += this.rotz;
  }

  show() {
    push();
    translate(this.x, this.y);
    rotate(this.rot);
    scale(this.scale);
    noStroke();
    fill("#F9D810");
    rect(0, 0, 20, 20);
    pop();
  }
}


// ---------------------------------------------------------
// INTERACCIÓN
// ---------------------------------------------------------

// Clic de ratón
function mousePressed() {
  moths.forEach(m => {
    if (!m.exploding && m.clicked(mouseX, mouseY)) m.explode();
  });
}

// Toques táctiles
function touchStarted() {
  for (let t of touches) {
    moths.forEach(m => {
      if (!m.exploding && m.clicked(t.x, t.y)) m.explode();
    });
  }
  return false;
}


// ---------------------------------------------------------
// AJUSTE AL REDIMENSIONAR VENTANA
// ---------------------------------------------------------
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  margin = min(width, height) * 0.10;

  // Recalcular posiciones absolutas según el nuevo tamaño
  moths.forEach(m => m.updatePosition(true));
}