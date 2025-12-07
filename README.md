<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Physics Lab – Extensible Simulations</title>

  <!-- 3D engine (Three.js) from CDN – needs internet once -->
  <script src="https://unpkg.com/three@0.160.0/build/three.min.js"></script>

  <style>
    :root {
      --bg: #020617;
      --bg-elevated: #0f172a;
      --bg-input: #020617;
      --border: #1f2937;
      --text: #e5e7eb;
      --muted: #9ca3af;
      --accent: #2563eb;
      --accent-soft: rgba(37, 99, 235, 0.1);
    }

    body[data-theme="light"] {
      --bg: #f9fafb;
      --bg-elevated: #ffffff;
      --bg-input: #f3f4f6;
      --border: #e5e7eb;
      --text: #111827;
      --muted: #6b7280;
      --accent: #2563eb;
      --accent-soft: rgba(37, 99, 235, 0.1);
    }

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
        sans-serif;
      background: var(--bg);
      color: var(--text);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }

    .app {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0.75rem 1rem 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: 0.75rem 1rem;
      border-radius: 1rem;
      border: 1px solid var(--border);
      background: var(--bg-elevated);
    }

    header h1 {
      margin: 0;
      font-size: 1.2rem;
    }

    header p {
      margin: 0.25rem 0 0;
      font-size: 0.75rem;
      color: var(--muted);
    }

    .theme-toggle {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.8rem;
      padding: 0.2rem 0.5rem;
      border-radius: 999px;
      border: 1px solid var(--border);
      background: var(--bg);
      cursor: pointer;
      user-select: none;
    }

    .theme-toggle span.mode {
      padding: 0.1rem 0.5rem;
      border-radius: 999px;
      background: var(--accent-soft);
      color: var(--accent);
      font-weight: 500;
    }

    main {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      align-items: flex-start;
    }

    .panel {
      border-radius: 1rem;
      border: 1px solid var(--border);
      background: var(--bg-elevated);
      padding: 0.9rem 1rem;
    }

    .panel.controls {
      flex: 1 1 260px;
      max-width: 340px;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .panel.view {
      flex: 2 1 400px;
      min-width: 320px;
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
    }

    h2 {
      margin: 0;
      font-size: 1rem;
    }

    .sub {
      font-size: 0.8rem;
      color: var(--muted);
    }

    .field {
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
      font-size: 0.8rem;
    }

    label {
      font-weight: 500;
    }

    input[type="number"],
    select {
      padding: 0.35rem 0.45rem;
      border-radius: 0.5rem;
      border: 1px solid var(--border);
      background: var(--bg-input);
      color: var(--text);
      font-size: 0.85rem;
    }

    input[type="number"]:focus,
    select:focus {
      outline: 2px solid var(--accent);
      outline-offset: 1px;
      border-color: var(--accent);
    }

    .unit {
      font-size: 0.7rem;
      color: var(--muted);
    }

    .field-row {
      display: flex;
      gap: 0.75rem;
    }

    button {
      border-radius: 999px;
      border: none;
      padding: 0.4rem 0.9rem;
      font-size: 0.8rem;
      font-weight: 500;
      cursor: pointer;
      background: var(--accent);
      color: white;
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
      box-shadow: 0 8px 18px rgba(0, 0, 0, 0.3);
    }

    button.secondary {
      background: transparent;
      color: var(--text);
      border: 1px solid var(--border);
      box-shadow: none;
    }

    button:active {
      transform: translateY(1px) scale(0.99);
      box-shadow: none;
    }

    .btn-row {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-top: 0.4rem;
    }

    canvas {
      border-radius: 0.75rem;
      border: 1px solid var(--border);
      background: #020617;
      width: 100%;
      max-width: 100%;
      display: block;
    }

    body[data-theme="light"] canvas {
      background: #0b1120;
    }

    #sim-3d-container {
      border-radius: 0.75rem;
      border: 1px solid var(--border);
      background: #020617;
      width: 100%;
      height: 360px;
      position: relative;
      overflow: hidden;
    }

    #error-msg {
      font-size: 0.75rem;
      color: #f97373;
      min-height: 1em;
    }

    .metrics {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      font-size: 0.78rem;
    }

    .chip {
      border-radius: 999px;
      border: 1px solid var(--border);
      padding: 0.2rem 0.6rem;
      display: inline-flex;
      gap: 0.2rem;
      align-items: baseline;
      background: var(--bg);
    }

    .chip span.value {
      font-weight: 600;
    }

    footer {
      margin-top: 0.5rem;
      font-size: 0.75rem;
      color: var(--muted);
    }

    footer code {
      padding: 0.1rem 0.35rem;
      border-radius: 0.3rem;
      border: 1px solid var(--border);
      background: var(--bg-input);
      font-size: 0.75rem;
    }

    @media (max-width: 720px) {
      header {
        flex-direction: column;
        align-items: flex-start;
      }
      .panel.controls {
        max-width: 100%;
      }
    }
  </style>
</head>
<body data-theme="dark">
  <div class="app">
    <header>
      <div>
        <h1>Physics Lab</h1>
        <p>Modular simulations • 2D + 3D • theme toggle</p>
      </div>
      <div class="theme-toggle" id="theme-toggle">
        <span>Theme</span>
        <span class="mode" id="theme-label">Dark</span>
      </div>
    </header>

    <main>
      <!-- Controls panel -->
      <section class="panel controls">
        <div class="field">
          <label for="sim-select">Simulation</label>
          <select id="sim-select">
            <option value="projectile2d">Projectile Motion (2D)</option>
            <option value="gravity3d">Gravity Ball (3D)</option>
          </select>
          <span class="sub" id="sim-description">
            2D projectile under uniform gravity.
          </span>
        </div>

        <!-- Dynamic controls area -->
        <div id="controls-area">
          <!-- Filled by JS per simulation -->
        </div>

        <div class="btn-row">
          <button id="start-btn">
            <span>▶</span>
            <span>Start</span>
          </button>
          <button id="reset-btn" class="secondary">
            ⟲ Reset
          </button>
        </div>

        <div id="error-msg"></div>

        <div class="metrics" id="metrics-area">
          <!-- Filled by JS -->
        </div>
      </section>

      <!-- View panel -->
      <section class="panel view">
        <div style="display:flex; justify-content:space-between; align-items:baseline;">
          <div>
            <h2 id="view-title">View</h2>
            <div class="sub" id="view-sub">Canvas / 3D scene</div>
          </div>
        </div>

        <canvas id="sim-2d-canvas" width="640" height="360"></canvas>
        <div id="sim-3d-container" style="display:none;"></div>

        <p class="sub" id="sim-equation">
          For projectile (2D): y = x tanθ − (g x²) / (2 u² cos²θ)
        </p>
      </section>
    </main>

    <footer>
      Structure is generic: add new simulations inside
      <code>simulations</code> in the script. Each sim defines its own controls,
      drawing, and update logic.
    </footer>
  </div>

  <script>
    // ========= THEME TOGGLE =========
    const themeToggle = document.getElementById("theme-toggle");
    const themeLabel = document.getElementById("theme-label");

    function setTheme(mode) {
      document.body.setAttribute("data-theme", mode);
      themeLabel.textContent = mode === "dark" ? "Dark" : "Light";
    }

    themeToggle.addEventListener("click", () => {
      const current = document.body.getAttribute("data-theme");
      const next = current === "dark" ? "light" : "dark";
      setTheme(next);
    });

    // ========= DOM ELEMENTS =========
    const simSelect = document.getElementById("sim-select");
    const simDescription = document.getElementById("sim-description");
    const controlsArea = document.getElementById("controls-area");
    const metricsArea = document.getElementById("metrics-area");
    const errorMsg = document.getElementById("error-msg");
    const startBtn = document.getElementById("start-btn");
    const resetBtn = document.getElementById("reset-btn");

    const canvas2d = document.getElementById("sim-2d-canvas");
    const ctx2d = canvas2d.getContext("2d");
    const container3d = document.getElementById("sim-3d-container");

    const viewTitle = document.getElementById("view-title");
    const viewSub = document.getElementById("view-sub");
    const simEquation = document.getElementById("sim-equation");

    let currentSim = null;      // simulation object
    let currentSimId = null;    // key in simulations
    let controlsApi = null;     // from buildControls()

    // ========= SIMULATION REGISTRY =========
    const simulations = {
      // -------------------- PROJECTILE 2D --------------------
      projectile2d: (function () {
        let animationId = null;

        function drawScene(originX, originY, scale, x, y, vx, vyInst) {
          const w = canvas2d.width;
          const h = canvas2d.height;
          ctx2d.clearRect(0, 0, w, h);

          // ground
          ctx2d.beginPath();
          ctx2d.moveTo(20, originY);
          ctx2d.lineTo(w - 20, originY);
          ctx2d.strokeStyle = "#4b5563";
          ctx2d.lineWidth = 1.5;
          ctx2d.stroke();

          // origin
          ctx2d.beginPath();
          ctx2d.arc(originX, originY, 4, 0, Math.PI * 2);
          ctx2d.fillStyle = "#22c55e";
          ctx2d.fill();

          // projectile
          const sx = originX + x * scale;
          const sy = originY - y * scale;

          ctx2d.beginPath();
          ctx2d.arc(sx, sy, 5, 0, Math.PI * 2);
          ctx2d.fillStyle = "#f97316";
          ctx2d.fill();

          // velocity vector arrow
          const speed = Math.sqrt(vx * vx + vyInst * vyInst) || 1;
          const factor = 0.3; // scale factor for arrow length
          const vxPx = vx * scale * factor;
          const vyPx = -vyInst * scale * factor; // minus because screen y is down

          const ex = sx + vxPx;
          const ey = sy + vyPx;

          // line
          ctx2d.beginPath();
          ctx2d.moveTo(sx, sy);
          ctx2d.lineTo(ex, ey);
          ctx2d.strokeStyle = "#22c55e";
          ctx2d.lineWidth = 1.5;
          ctx2d.stroke();

          // arrow head
          const angle = Math.atan2(ey - sy, ex - sx);
          const headLen = 8;
          ctx2d.beginPath();
          ctx2d.moveTo(ex, ey);
          ctx2d.lineTo(
            ex - headLen * Math.cos(angle - Math.PI / 6),
            ey - headLen * Math.sin(angle - Math.PI / 6)
          );
          ctx2d.lineTo(
            ex - headLen * Math.cos(angle + Math.PI / 6),
            ey - headLen * Math.sin(angle + Math.PI / 6)
          );
          ctx2d.closePath();
          ctx2d.fillStyle = "#22c55e";
          ctx2d.fill();

          // small text label near projectile
          ctx2d.fillStyle = "#e5e7eb";
          ctx2d.font = "10px system-ui";
          ctx2d.fillText("v⃗", sx + 6, sy - 6);
        }

        function buildControls(container) {
          container.innerHTML = "";

          const wrap = document.createElement("div");
          wrap.style.display = "flex";
          wrap.style.flexDirection = "column";
          wrap.style.gap = "0.5rem";

          wrap.innerHTML = `
            <div class="field">
              <label for="p2d-u">Initial speed u <span class="unit">(m/s)</span></label>
              <input id="p2d-u" type="number" value="20" step="0.1" />
            </div>
            <div class="field-row">
              <div class="field">
                <label for="p2d-angle">Angle θ <span class="unit">(deg)</span></label>
                <input id="p2d-angle" type="number" value="45" step="1" />
              </div>
              <div class="field">
                <label for="p2d-g">g <span class="unit">(m/s²)</span></label>
                <input id="p2d-g" type="number" value="9.8" step="0.1" />
              </div>
            </div>
          `;
          container.appendChild(wrap);

          return {
            getParams() {
              const u = parseFloat(document.getElementById("p2d-u").value);
              const angleDeg = parseFloat(document.getElementById("p2d-angle").value);
              const g = parseFloat(document.getElementById("p2d-g").value);

              if (!isFinite(u) || !isFinite(angleDeg) || !isFinite(g)) {
                throw new Error("Enter valid numbers.");
              }
              if (u <= 0 || g <= 0) {
                throw new Error("u and g must be > 0.");
              }

              return { u, angleDeg, g };
            }
          };
        }

        function start(params) {
          if (animationId !== null) cancelAnimationFrame(animationId);

          const { u, angleDeg, g } = params;
          const theta = (angleDeg * Math.PI) / 180;
          const ux = u * Math.cos(theta);
          const uy = u * Math.sin(theta);

          const T = (2 * uy) / g;
          const R = ux * T;
          const H = (uy * uy) / (2 * g);

          // metrics (static) + live vector place
          metricsArea.innerHTML = `
            <div class="chip">Range R: <span class="value">${R.toFixed(2)}</span> m</div>
            <div class="chip">Max height H: <span class="value">${H.toFixed(2)}</span> m</div>
            <div class="chip">Flight time T: <span class="value">${T.toFixed(2)}</span> s</div>
            <div class="chip" id="p2d-vec-chip">
              v: <span class="value" id="p2d-v">–</span> m/s,
              vx: <span class="value" id="p2d-vx">–</span>,
              vy: <span class="value" id="p2d-vy">–</span>
            </div>
          `;

          const vSpan = document.getElementById("p2d-v");
          const vxSpan = document.getElementById("p2d-vx");
          const vySpan = document.getElementById("p2d-vy");

          const margin = 20;
          const originX = margin;
          const originY = canvas2d.height - margin;

          const maxX = Math.max(R, 1);
          const maxY = Math.max(H, 1);
          const scaleX =
            (canvas2d.width - 2 * margin) / maxX;
          const scaleY =
            (canvas2d.height - 2 * margin) / maxY;
          const scale = Math.min(scaleX, scaleY);

          let t = 0;
          const steps = 300;
          const dt = T / steps;

          function animate() {
            t += dt;
            const x = ux * t;
            const y = uy * t - 0.5 * g * t * t;

            const vyInst = uy - g * t; // vertical component at time t
            const speed = Math.sqrt(ux * ux + vyInst * vyInst);

            // update vector values in UI
            if (vSpan && vxSpan && vySpan) {
              vSpan.textContent = speed.toFixed(2);
              vxSpan.textContent = ux.toFixed(2);
              vySpan.textContent = vyInst.toFixed(2);
            }

            if (y < 0) {
              // just before hitting ground, set y=0 and vyInst=0 for last frame
              drawScene(originX, originY, scale, R, 0, ux, 0);
              animationId = null;
              return;
            }

            drawScene(originX, originY, scale, x, y, ux, vyInst);
            animationId = requestAnimationFrame(animate);
          }

          // start
          drawScene(originX, originY, scale, 0, 0, ux, uy);
          animationId = requestAnimationFrame(animate);
        }

        function reset() {
          if (animationId !== null) cancelAnimationFrame(animationId);
          animationId = null;
          metricsArea.innerHTML = "";
          ctx2d.clearRect(0, 0, canvas2d.width, canvas2d.height);
        }

        function destroy() {
          reset();
        }

        return {
          id: "projectile2d",
          name: "Projectile Motion (2D)",
          dimension: "2d",
          description: "Projectile launched with speed u at angle θ in uniform g. Shows live velocity vector.",
          equationText:
            "Projectile: x = u cosθ · t, y = u sinθ · t − ½ g t². Velocity: v⃗ = (u cosθ, u sinθ − g t).",
          buildControls,
          start,
          reset,
          destroy
        };
      })(),

      // -------------------- GRAVITY BALL 3D --------------------
      gravity3d: (function () {
        let scene, camera, renderer, sphere, plane;
        let animationId = null;
        let vy = 0;
        let g = 9.8;
        let radius = 1;
        let lastTime = null;

        function setup3D() {
          // cleanup old renderer if any
          if (renderer) {
            container3d.innerHTML = "";
          }

          const width = container3d.clientWidth;
          const height = container3d.clientHeight;

          scene = new THREE.Scene();
          scene.background = new THREE.Color(0x020617);

          camera = new THREE.PerspectiveCamera(
            60,
            width / height,
            0.1,
            100
          );
          camera.position.set(5, 4, 8);
          camera.lookAt(0, 1, 0);

          renderer = new THREE.WebGLRenderer({ antialias: true });
          renderer.setSize(width, height);
          container3d.appendChild(renderer.domElement);

          // light
          const light = new THREE.DirectionalLight(0xffffff, 1.0);
          light.position.set(5, 10, 5);
          scene.add(light);
          scene.add(new THREE.AmbientLight(0xffffff, 0.3));

          // plane (ground)
          const planeGeo = new THREE.PlaneGeometry(20, 20);
          const planeMat = new THREE.MeshStandardMaterial({
            color: 0x111827,
            roughness: 0.8
          });
          plane = new THREE.Mesh(planeGeo, planeMat);
          plane.rotation.x = -Math.PI / 2;
          plane.position.y = 0;
          scene.add(plane);

          // sphere
          const sphereGeo = new THREE.SphereGeometry(radius, 32, 32);
          const sphereMat = new THREE.MeshStandardMaterial({
            color: 0xf97316,
            roughness: 0.3
          });
          sphere = new THREE.Mesh(sphereGeo, sphereMat);
          sphere.position.set(0, 5, 0);
          scene.add(sphere);
        }

        function buildControls(container) {
          container.innerHTML = "";

          const wrap = document.createElement("div");
          wrap.style.display = "flex";
          wrap.style.flexDirection = "column";
          wrap.style.gap = "0.5rem";

          wrap.innerHTML = `
            <div class="field">
              <label for="g3d-g">g <span class="unit">(m/s²)</span></label>
              <input id="g3d-g" type="number" value="9.8" step="0.1" />
            </div>
            <div class="field">
              <label for="g3d-height">Initial height <span class="unit">(m)</span></label>
              <input id="g3d-height" type="number" value="5" step="0.1" />
            </div>
          `;
          container.appendChild(wrap);

          return {
            getParams() {
              const gVal = parseFloat(
                document.getElementById("g3d-g").value
              );
              const hVal = parseFloat(
                document.getElementById("g3d-height").value
              );
              if (!isFinite(gVal) || !isFinite(hVal)) {
                throw new Error("Enter valid numbers.");
              }
              if (gVal <= 0 || hVal <= 0) {
                throw new Error("g and height must be > 0.");
              }
              return { g: gVal, h: hVal };
            }
          };
        }

        function start(params) {
          if (!renderer) setup3D();
          if (animationId !== null) cancelAnimationFrame(animationId);

          g = params.g;
          const h = params.h;
          vy = 0;
          radius = 1;

          if (sphere) {
            sphere.position.set(0, h, 0);
          }

          // metrics: ideal free-fall (no bounce)
          const T = Math.sqrt((2 * h) / g);
          const vImpact = g * T;

          metricsArea.innerHTML = `
            <div class="chip">Height h: <span class="value">${h.toFixed(
              2
            )}</span> m</div>
            <div class="chip">Fall time (ideal): <span class="value">${T.toFixed(
              2
            )}</span> s</div>
            <div class="chip">Impact speed: <span class="value">${vImpact.toFixed(
              2
            )}</span> m/s</div>
          `;

          lastTime = null;

          function animate(timestamp) {
            if (!lastTime) lastTime = timestamp;
            const dt = (timestamp - lastTime) / 1000;
            lastTime = timestamp;

            // simple gravity + bounce
            vy -= g * dt;
            sphere.position.y += vy * dt;

            if (sphere.position.y - radius < 0) {
              sphere.position.y = radius;
              vy = -vy * 0.7; // lose energy
              if (Math.abs(vy) < 0.5) vy = 0; // almost rest
            }

            renderer.render(scene, camera);
            animationId = requestAnimationFrame(animate);
          }

          animationId = requestAnimationFrame(animate);
        }

        function reset() {
          metricsArea.innerHTML = "";
          if (animationId !== null) cancelAnimationFrame(animationId);
          animationId = null;
          lastTime = null;
          if (renderer && sphere) {
            sphere.position.set(0, 5, 0);
            renderer.render(scene, camera);
          }
        }

        function destroy() {
          if (animationId !== null) cancelAnimationFrame(animationId);
          animationId = null;
          if (renderer) {
            renderer.dispose();
            renderer = null;
          }
          if (scene) {
            while (scene.children.length > 0) {
              scene.remove(scene.children[0]);
            }
          }
          container3d.innerHTML = "";
        }

        return {
          id: "gravity3d",
          name: "Gravity Ball (3D)",
          dimension: "3d",
          description:
            "Ball falling under gravity, bouncing on a plane. Simple 3D gravity demo.",
          equationText:
            "Free fall (ideal): y(t) = h − ½ g t², v(t) = −g t. Here we add bounces with energy loss.",
          buildControls,
          start,
          reset,
          destroy
        };
      })()
    };

    // ========= SIM SELECTION / LIFECYCLE =========
    function switchSimulation(id) {
      if (currentSim && currentSim.destroy) {
        currentSim.destroy();
      }
      errorMsg.textContent = "";
      metricsArea.innerHTML = "";
      controlsArea.innerHTML = "";

      currentSimId = id;
      currentSim = simulations[id];

      if (!currentSim) {
        console.error("Unknown simulation:", id);
        return;
      }

      // UI texts
      viewTitle.textContent = currentSim.name;
      viewSub.textContent =
        currentSim.dimension === "2d" ? "2D canvas" : "3D scene";
      simDescription.textContent = currentSim.description;
      simEquation.textContent = currentSim.equationText;

      // show correct view
      if (currentSim.dimension === "2d") {
        canvas2d.style.display = "block";
        container3d.style.display = "none";
      } else {
        canvas2d.style.display = "none";
        container3d.style.display = "block";
      }

      // Build controls for this sim
      controlsApi = currentSim.buildControls(controlsArea);

      // Reset visuals
      if (currentSim.reset) currentSim.reset();
    }

    simSelect.addEventListener("change", (e) => {
      switchSimulation(e.target.value);
    });

    startBtn.addEventListener("click", () => {
      if (!currentSim || !controlsApi) return;
      try {
        const params = controlsApi.getParams();
        errorMsg.textContent = "";
        currentSim.start(params);
      } catch (err) {
        errorMsg.textContent = err.message || String(err);
      }
    });

    resetBtn.addEventListener("click", () => {
      if (currentSim && currentSim.reset) {
        currentSim.reset();
        errorMsg.textContent = "";
      }
    });

    // initial setup
    switchSimulation("projectile2d");
  </script>
</body>
</html>
