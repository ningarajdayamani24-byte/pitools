<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>PITOOLS – Physics Lab</title>
<meta name="viewport" content="width=device-width,initial-scale=1" />
<style>
  :root{
    --bg:#f6f7fb; --panel:#ffffff; --text:#0b1220; --muted:#475569; --accent:#0b72ff;
    --border:#e6eefb; --accent-2:#10b981;
  }
  [data-theme="dark"]{
    --bg:#020617; --panel:#0f1724; --text:#e6eef8; --muted:#9aa7b6; --accent:#2563eb;
    --border:#102033; --accent-2:#22c55e;
  }

  html,body{height:100%;margin:0;font-family:Inter,ui-sans-serif,system-ui,Segoe UI,Roboto,"Helvetica Neue",Arial;}
  body{background:var(--bg);color:var(--text);display:flex;justify-content:center;padding:20px 12px;box-sizing:border-box}
  .app{width:100%;max-width:1200px;display:grid;grid-template-columns:360px 1fr;gap:18px;align-items:start}

  header{grid-column:1/-1;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px;border-radius:12px;background:var(--panel);border:1px solid var(--border)}

  .logo-area{display:flex;align-items:center;gap:12px}
  .logo-holder{
    padding:6px;
    border-radius:14px;
    background:var(--panel);
    border:1px solid var(--border);
  }
  .app-logo{
    width:56px;
    height:56px;
    border-radius:10px;
    object-fit:contain;
    background:transparent;
    transition:opacity 0.2s ease;
  }
  .title{font-weight:700;font-size:1.05rem}
  .subtitle{font-size:0.85rem;color:var(--muted);margin-top:2px}

  .right-controls{display:flex;align-items:center;gap:10px}
  .theme-toggle{
    padding:8px 10px;
    border-radius:999px;
    border:1px solid var(--border);
    cursor:pointer;
    background:transparent;
    color:var(--muted);
    font-weight:600;
  }

  .panel{background:var(--panel);border:1px solid var(--border);padding:12px;border-radius:12px}
  .controls{display:flex;flex-direction:column;gap:10px}
  label{font-size:0.85rem;color:var(--muted);margin-bottom:6px;display:block}
  input[type=number], select, input[type=range]{
    width:100%;padding:8px;border-radius:8px;
    border:1px solid var(--border);background:transparent;color:var(--text);
    box-sizing:border-box;
  }
  .row{display:flex;gap:8px}
  .row .field{flex:1;display:flex;flex-direction:column}
  .btn-row{display:flex;gap:8px;margin-top:6px;flex-wrap:wrap}
  button{
    padding:8px 12px;border-radius:8px;border:none;
    background:var(--accent);color:white;cursor:pointer;font-weight:600
  }
  button.secondary{background:transparent;border:1px solid var(--border);color:var(--text)}
  button:disabled{opacity:0.45;cursor:not-allowed}
  .small{font-size:0.85rem;color:var(--muted)}

  #canvas-wrap{position:relative}
  canvas{
    width:100%;height:360px;border-radius:10px;display:block;
    background:linear-gradient(180deg,#071224,#02101a);
    border:1px solid rgba(0,0,0,0.1)
  }
  .math{
    font-family:ui-monospace,SFMono-Regular,monospace;
    background:linear-gradient(180deg,rgba(0,0,0,0.02),transparent);
    padding:10px;border-radius:8px;border:1px solid var(--border);
    font-size:0.9rem;color:var(--muted)
  }
  .metrics{display:flex;flex-wrap:wrap;gap:8px;margin-top:8px}
  .chip{
    background:transparent;border:1px solid var(--border);
    padding:6px 8px;border-radius:999px;
    font-weight:700;color:var(--text);font-size:0.9rem
  }
  .graph{height:160px;border-radius:8px;border:1px solid var(--border);background:linear-gradient(180deg,#fff,transparent);overflow:hidden}
  .note{font-size:0.82rem;color:var(--muted)}

  .cat-menu{display:flex;gap:6px;margin-bottom:8px;flex-wrap:wrap}
  .cat-btn{
    padding:6px 10px;border-radius:999px;
    border:1px solid var(--border);
    background:transparent;
    color:var(--muted);
    font-size:0.8rem;
    cursor:pointer
  }
  .cat-btn.active{background:var(--accent);border-color:var(--accent);color:#fff}

  @media (max-width:920px){.app{grid-template-columns:1fr;}}
</style>
</head>
<body data-theme="light">
<div class="app">

  <header>
    <div class="logo-area">
      <div class="logo-holder">
        <!-- use your files: pitools-logo-light.png & pitools-logo-dark.png -->
        <img id="app-logo" src="pitools-logo-light.png" alt="PITOOLS logo" class="app-logo">
      </div>
      <div>
        <div class="title">PITOOLS – Physics Lab</div>
        <div class="subtitle">Mechanics now • Electromagnetism & Modern Physics coming soon</div>
      </div>
    </div>

    <div class="right-controls">
      <button class="theme-toggle" id="themeBtn">Dark</button>
    </div>
  </header>

  <!-- left: controls -->
  <section class="panel controls">

    <!-- physics category menu -->
    <div>
      <label>Physics branch</label>
      <div class="cat-menu">
        <button class="cat-btn active" data-cat="mechanics">Mechanics</button>
        <button class="cat-btn" data-cat="em">Electromagnetism</button>
        <button class="cat-btn" data-cat="modern">Modern Physics</button>
      </div>
      <div class="note">
        Mechanics has the projectile simulation. Other branches are placeholders where you can plug more tools later.
      </div>
    </div>

    <div id="controls-main" style="margin-top:10px">
      <div>
        <label>Simulation</label>
        <select id="preset-select">
          <option value="custom">Custom (blank)</option>
          <option value="human-throw">Human Throw (preset)</option>
          <option value="long-shot">Long shot (preset)</option>
        </select>
        <div class="note" style="margin-top:6px">Pick a preset to load realistic values, or set your own.</div>
      </div>

      <div class="row" style="margin-top:6px">
        <div class="field">
          <label>Initial speed u (m/s)</label>
          <input id="u" type="number" value="15" step="0.1" min="0.1">
        </div>
        <div class="field">
          <label>Angle θ (deg)</label>
          <input id="theta" type="number" value="40" step="0.1" min="0" max="89.9">
        </div>
      </div>

      <div class="row">
        <div class="field">
          <label>Initial height h (m)</label>
          <input id="h" type="number" value="1.6" step="0.01" min="0">
        </div>
        <div class="field">
          <label>Gravity g (m/s²)</label>
          <input id="g" type="number" value="9.8" step="0.01" min="0.1">
        </div>
      </div>

      <div>
        <label>Angle slider</label>
        <input id="angle-range" type="range" min="0" max="89.9" step="0.1" value="40">
        <div class="row" style="margin-top:6px">
          <div class="small">Time scale</div>
          <input id="time-scale" type="range" min="0.2" max="3" step="0.1" value="1">
        </div>
      </div>

      <div class="btn-row">
        <button id="startBtn">▶ Start</button>
        <button id="pauseBtn" class="secondary">⏸ Pause</button>
        <button id="resetBtn" class="secondary">⟲ Reset</button>
        <button id="preset-human" class="secondary">Human Throw</button>
      </div>

      <div style="margin-top:10px">
        <label>Display</label>
        <div style="display:flex;gap:8px;margin-top:6px;flex-wrap:wrap">
          <label class="small"><input id="show-trace" type="checkbox" checked> Trace</label>
          <label class="small"><input id="show-vel" type="checkbox" checked> Velocity vector</label>
          <label class="small"><input id="show-acc" type="checkbox" checked> Acceleration (g)</label>
          <label class="small"><input id="show-analytic" type="checkbox"> Analytic curve</label>
        </div>
      </div>

      <div style="margin-top:12px">
        <div class="math" id="math-box"></div>
        <div class="metrics" id="metrics"></div>
      </div>
    </div>

    <div id="no-sim-message" class="note" style="display:none;margin-top:12px">
      No simulations added for this branch yet. Later you can add electromagnetism or modern physics simulations here.
    </div>

  </section>

  <!-- right: view -->
  <section class="panel">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
      <div>
        <strong>Simulation View</strong>
        <div class="note">Stick-figure thrower at origin (left). Units: meters (scaled).</div>
      </div>
      <div class="note">Angle vs Range (bottom)</div>
    </div>

    <div id="canvas-wrap">
      <canvas id="sim-canvas" width="900" height="360"></canvas>
    </div>

    <div style="display:flex;gap:12px;margin-top:10px">
      <div style="flex:1">
        <div style="font-weight:700;margin-bottom:6px">Equations & derivation</div>
        <div class="math" id="equations" style="max-height:200px;overflow:auto"></div>
      </div>
      <div style="width:320px">
        <div style="font-weight:700;margin-bottom:6px">Angle vs Range</div>
        <canvas id="angle-graph" width="320" height="160" class="graph"></canvas>
      </div>
    </div>
  </section>

</div>

<script>
(() => {
  const $ = id => document.getElementById(id);
  const fmt = v => (Number.isFinite(v) ? v.toFixed(3) : '–');

  // theme + logo
  const body = document.body;
  const themeBtn = $('themeBtn');
  const logo = $('app-logo');
  const LOGO_LIGHT = "WhatsApp Image 2025-12-07 at 11.47.56 AM.jpeg";
  const LOGO_DARK  = "image.jpg";

  function updateLogo(theme){
    logo.style.opacity = "0";
    setTimeout(()=>{
      logo.src = theme === "dark" ? LOGO_DARK : LOGO_LIGHT;
      logo.style.opacity = "1";
    },120);
  }

  function setTheme(theme){
    body.setAttribute("data-theme", theme);
    themeBtn.textContent = theme === "dark" ? "Light" : "Dark";
    updateLogo(theme);
  }

  setTheme("light");
  themeBtn.addEventListener("click", ()=>{
    const current = body.getAttribute("data-theme");
    setTheme(current === "dark" ? "light" : "dark");
  });

  // category buttons
  const catButtons = document.querySelectorAll(".cat-btn");
  const controlsMain = $("controls-main");
  const noSimMsg = $("no-sim-message");
  let currentCategory = "mechanics";

  function setCategory(cat){
    currentCategory = cat;
    catButtons.forEach(btn=>btn.classList.toggle("active", btn.dataset.cat===cat));
    const hasSim = (cat === "mechanics");
    controlsMain.style.display = hasSim ? "block" : "none";
    noSimMsg.style.display = hasSim ? "none" : "block";
    startBtn.disabled = !hasSim;
    pauseBtn.disabled = !hasSim;
    resetBtn.disabled = !hasSim;
  }
  catButtons.forEach(btn=>btn.addEventListener("click", ()=>setCategory(btn.dataset.cat)));

  // inputs
  const uIn = $("u"), thetaIn = $("theta"), hIn = $("h"), gIn = $("g");
  const angleRange = $("angle-range"), timeScale = $("time-scale");
  const startBtn = $("startBtn"), pauseBtn = $("pauseBtn"), resetBtn = $("resetBtn");
  const presetSelect = $("preset-select"), presetHuman = $("preset-human");
  const showTrace = $("show-trace"), showVel = $("show-vel"), showAcc = $("show-acc"), showAnalytic = $("show-analytic");

  const mathBox = $("math-box"), metricsDiv = $("metrics"), equations = $("equations");
  const canvas = $("sim-canvas"), ctx = canvas.getContext("2d");
  const graph = $("angle-graph"), gctx = graph.getContext("2d");

  // presets
  function loadPreset(name){
    if(name === "human-throw"){
      uIn.value = 15; thetaIn.value = 40; hIn.value = 1.6; gIn.value = 9.8;
    } else if(name === "long-shot"){
      uIn.value = 30; thetaIn.value = 35; hIn.value = 1.2; gIn.value = 9.8;
    }
    angleRange.value = thetaIn.value;
    computeAndDrawStatics();
    drawAngleGraph();
  }
  presetSelect.addEventListener("change", ()=> loadPreset(presetSelect.value));
  presetHuman.addEventListener("click", ()=> { loadPreset("human-throw"); presetSelect.value="human-throw"; });

  angleRange.addEventListener("input", ()=>{ thetaIn.value = angleRange.value; computeAndDrawStatics(); drawAngleGraph(); });
  thetaIn.addEventListener("change", ()=>{ angleRange.value = thetaIn.value; computeAndDrawStatics(); drawAngleGraph(); });

  // physics helpers
  const degToRad = d => d*Math.PI/180;
  function flightTime(uy,g,h){
    if(g<=0) return NaN;
    const disc = uy*uy + 2*g*h;
    if(disc < 0) return NaN;
    return (uy + Math.sqrt(disc))/g;
  }
  function rangeFor(u,thetaDeg,g,h){
    const th = degToRad(thetaDeg);
    const ux = u*Math.cos(th), uy = u*Math.sin(th);
    const T = flightTime(uy,g,h);
    return ux*T;
  }
  function maxHeight(u,thetaDeg,g,h){
    const th = degToRad(thetaDeg);
    const uy = u*Math.sin(th);
    return h + (uy*uy)/(2*g);
  }

  // static math + metrics
  function computeAndDrawStatics(){
    const u = parseFloat(uIn.value);
    const theta = parseFloat(thetaIn.value);
    const h = parseFloat(hIn.value);
    const g = parseFloat(gIn.value);
    if(!(isFinite(u) && isFinite(theta) && isFinite(h) && isFinite(g))) return;

    const th = degToRad(theta);
    const ux = u*Math.cos(th), uy = u*Math.sin(th);
    const T = flightTime(uy,g,h);
    const R = ux*T;
    const H = maxHeight(u,theta,g,h);
    const tp = uy/g;

    mathBox.innerHTML = `
      <div style="font-weight:700;margin-bottom:6px">Used formulas (h ≠ 0)</div>
      <div class="small"><strong>Vertical:</strong> y(t) = h + (u sinθ) t − ½ g t²</div>
      <div class="small">Solve y(t)=0 → ½ g t² − (u sinθ) t − h = 0 → positive root:</div>
      <div class="small" style="margin-top:6px">
        t_f = (u sinθ + √((u sinθ)² + 2 g h)) / g
      </div>
      <div class="small" style="margin-top:8px">
        Range: R = (u cosθ) · t_f
      </div>
      <div style="margin-top:8px;font-size:0.92rem;color:var(--muted)">
        Substituted:<br>
        u = ${u} m/s, θ = ${theta}°, h = ${h} m, g = ${g} m/s²<br>
        u sinθ = ${fmt(uy)} , u cosθ = ${fmt(ux)} , t_f = ${fmt(T)} s
      </div>
    `;

    equations.innerHTML = `
      <div style="font-weight:700">Analytic results</div>
      <div class="small">Flight time (positive root): t_f = (u sinθ + √((u sinθ)² + 2 g h))/g = <strong>${fmt(T)} s</strong></div>
      <div class="small">Range: R = u cosθ · t_f = <strong>${fmt(R)} m</strong></div>
      <div class="small">Max height: H = h + (u sinθ)² / (2 g) = <strong>${fmt(H)} m</strong></div>
      <div class="small">Time to peak: t_p = u sinθ / g = <strong>${fmt(tp)} s</strong></div>
      <div class="small">Velocity components at t: v_x = u cosθ, v_y = u sinθ − g t</div>
    `;

    metricsDiv.innerHTML = "";
    const chip = (label,val)=>{
      const d = document.createElement("div");
      d.className="chip";
      d.textContent = `${label} ${val}`;
      return d;
    };
    metricsDiv.appendChild(chip("Range R:", fmt(R)+" m"));
    metricsDiv.appendChild(chip("Max H:", fmt(H)+" m"));
    metricsDiv.appendChild(chip("Flight T:", fmt(T)+" s"));
    metricsDiv.appendChild(chip("u_x:", fmt(ux)+" m/s"));
    metricsDiv.appendChild(chip("u_y:", fmt(uy)+" m/s"));
  }

  // angle vs range graph
  function drawAngleGraph(){
    const u = parseFloat(uIn.value), h = parseFloat(hIn.value), g = parseFloat(gIn.value);
    const W = graph.width, H = graph.height;
    gctx.clearRect(0,0,W,H);
    gctx.fillStyle = getComputedStyle(document.body).getPropertyValue("--panel");
    gctx.fillRect(0,0,W,H);

    const samples = 180;
    const Rs = [];
    let maxR = 0;
    for(let i=0;i<=samples;i++){
      const th = i*(90/samples);
      const r = rangeFor(u,th,g,h);
      Rs.push(r);
      if(isFinite(r) && r>maxR) maxR=r;
    }
    if(!isFinite(maxR) || maxR<=0) maxR = 1;

    gctx.strokeStyle = "#9aa7b6"; gctx.lineWidth=1;
    gctx.beginPath(); gctx.moveTo(40,10); gctx.lineTo(40,H-30); gctx.lineTo(W-8,H-30); gctx.stroke();
    gctx.fillStyle = getComputedStyle(document.body).getPropertyValue("--muted"); gctx.font="10px sans-serif";
    gctx.fillText("Angle (°)", W/2 - 20, H-8);
    gctx.save(); gctx.translate(12,H/2+10); gctx.rotate(-Math.PI/2); gctx.fillText("Range (m)",0,0); gctx.restore();

    gctx.beginPath();
    for(let i=0;i<=samples;i++){
      const x = 40 + ((W-60)*(i/samples));
      const r = Rs[i] || 0;
      const y = (H-30) - ((H-50)*(r/maxR));
      if(i===0) gctx.moveTo(x,y); else gctx.lineTo(x,y);
    }
    gctx.strokeStyle = getComputedStyle(document.body).getPropertyValue("--accent");
    gctx.lineWidth=2; gctx.stroke();

    const angle = parseFloat(thetaIn.value);
    const idx = Math.round((angle/90)*samples);
    const rx = 40 + ((W-60)*(idx/samples));
    const ry = (H-30) - ((H-50)*((Rs[idx]||0)/maxR));
    gctx.fillStyle = getComputedStyle(document.body).getPropertyValue("--accent-2");
    gctx.beginPath(); gctx.arc(rx,ry,4,0,Math.PI*2); gctx.fill();
    gctx.fillStyle = getComputedStyle(document.body).getPropertyValue("--muted");
    gctx.font="11px sans-serif";
    gctx.fillText(`θ=${angle.toFixed(1)}°`, rx+6, ry-6);
    gctx.fillText(`R=${fmt(Rs[idx])} m`, rx+6, ry+8);
  }

  // simulation drawing
  const Wc = canvas.width, Hc = canvas.height;
  const originX = 80;
  const groundY = Hc - 44;
  let raf=null, running=false, paused=false;
  let sim = {u:parseFloat(uIn.value),theta:parseFloat(thetaIn.value),h:parseFloat(hIn.value),g:parseFloat(gIn.value),time:0,path:[]};

  function computeScale(R,Hmax){
    const worldX = Math.max(R*1.1,5);
    const worldY = Math.max(Hmax*1.2,3);
    const usableW = (Wc - originX - 40);
    const usableH = (groundY - 20);
    const scaleX = usableW/worldX;
    const scaleY = usableH/worldY;
    const scale = Math.min(scaleX,scaleY);
    return {scale, offsetY:groundY, worldX, worldY};
  }

  function drawStickFigure(ctx,x,y){
    ctx.save();
    ctx.translate(x,y);
    ctx.strokeStyle = getComputedStyle(document.body).getPropertyValue("--text");
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0,-26,8,0,Math.PI*2); ctx.fillStyle="#fff"; ctx.fill();
    ctx.moveTo(0,-18); ctx.lineTo(0,0); ctx.stroke();
    ctx.moveTo(0,-12); ctx.lineTo(-12,6); ctx.moveTo(0,-12); ctx.lineTo(12,6); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0,-12); ctx.lineTo(18,-28); ctx.lineWidth=3; ctx.stroke();
    ctx.restore();
  }

  function renderFrame(params){
    const {u,theta,h,g,scaleInfo,path,time,showVelVec,showAccVec,analytic} = params;
    const th = degToRad(theta);
    const ux = u*Math.cos(th), uy = u*Math.sin(th);
    ctx.clearRect(0,0,Wc,Hc);

    const grad = ctx.createLinearGradient(0,0,0,Hc);
    grad.addColorStop(0, getComputedStyle(document.body).getPropertyValue("--panel"));
    grad.addColorStop(1, getComputedStyle(document.body).getPropertyValue("--bg"));
    ctx.fillStyle=grad; ctx.fillRect(0,0,Wc,Hc);

    ctx.fillStyle="#18304a";
    ctx.fillRect(0,groundY,Wc,Hc-groundY);
    ctx.strokeStyle="rgba(255,255,255,0.06)"; ctx.lineWidth=1;
    for(let i=0;i<10;i++){ ctx.beginPath(); ctx.moveTo(0,groundY+i*4); ctx.lineTo(Wc,groundY+i*4); ctx.stroke(); }

    drawStickFigure(ctx,originX,groundY);

    if(analytic){
      ctx.beginPath(); let started=false;
      for(let x=0;x<=scaleInfo.worldX;x+=0.5){
        const tloc = x/ux;
        const yloc = h + uy*tloc - 0.5*g*tloc*tloc;
        const sx = originX + x*scaleInfo.scale;
        const sy = scaleInfo.offsetY - yloc*scaleInfo.scale;
        if(!started){ctx.moveTo(sx,sy);started=true;} else ctx.lineTo(sx,sy);
      }
      ctx.strokeStyle="rgba(37,99,235,0.6)"; ctx.lineWidth=1.5; ctx.stroke();
    }

    if(path && path.length>0){
      ctx.beginPath();
      path.forEach((p,i)=>{
        const sx = originX + p.x*scaleInfo.scale;
        const sy = scaleInfo.offsetY - p.y*scaleInfo.scale;
        if(i===0) ctx.moveTo(sx,sy); else ctx.lineTo(sx,sy);
      });
      ctx.strokeStyle="rgba(249,115,22,0.9)"; ctx.lineWidth=1.5; ctx.stroke();
    }

    const y = h + uy*time - 0.5*g*time*time;
    const x = ux*time;
    const sx = originX + x*scaleInfo.scale;
    const sy = scaleInfo.offsetY - y*scaleInfo.scale;

    ctx.beginPath(); ctx.fillStyle="#f97316"; ctx.arc(sx,sy,7,0,Math.PI*2); ctx.fill();
    ctx.fillStyle="white"; ctx.font="11px sans-serif"; ctx.fillText("ball", sx+10, sy+4);

    const vyInst = uy - g*time;
    if(showVelVec){
      const arrowScale=0.25;
      const vxPx = ux*scaleInfo.scale*arrowScale;
      const vyPx = -vyInst*scaleInfo.scale*arrowScale;
      const ex = sx+vxPx, ey=sy+vyPx;
      ctx.beginPath(); ctx.moveTo(sx,sy); ctx.lineTo(ex,ey);
      ctx.strokeStyle=getComputedStyle(document.body).getPropertyValue("--accent-2"); ctx.lineWidth=2; ctx.stroke();
      const angle=Math.atan2(ey-sy,ex-sx);
      const headLen=8;
      ctx.beginPath();
      ctx.moveTo(ex,ey);
      ctx.lineTo(ex-headLen*Math.cos(angle-Math.PI/6), ey-headLen*Math.sin(angle-Math.PI/6));
      ctx.lineTo(ex-headLen*Math.cos(angle+Math.PI/6), ey-headLen*Math.sin(angle+Math.PI/6));
      ctx.closePath(); ctx.fillStyle=getComputedStyle(document.body).getPropertyValue("--accent-2"); ctx.fill();
    }

    if(showAccVec){
      const ax=0, ay=-g;
      const arrowScale=0.16;
      const axPx=ax*scaleInfo.scale*arrowScale, ayPx=-ay*scaleInfo.scale*arrowScale;
      const ex=sx+axPx, ey=sy+ayPx;
      ctx.beginPath(); ctx.moveTo(sx,sy); ctx.lineTo(ex,ey);
      ctx.strokeStyle="rgba(37,99,235,0.9)"; ctx.lineWidth=1.6; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(ex,ey); ctx.lineTo(ex-6,ey-4); ctx.lineTo(ex+6,ey-4); ctx.closePath();
      ctx.fillStyle="rgba(37,99,235,0.9)"; ctx.fill();
    }

    ctx.fillStyle=getComputedStyle(document.body).getPropertyValue("--panel");
    ctx.fillRect(Wc-220,12,208,76);
    ctx.strokeStyle=getComputedStyle(document.body).getPropertyValue("--border"); ctx.strokeRect(Wc-220,12,208,76);
    ctx.fillStyle=getComputedStyle(document.body).getPropertyValue("--muted"); ctx.font="12px sans-serif";
    ctx.fillText(`t = ${fmt(time)} s`, Wc-200,30);
    ctx.fillStyle=getComputedStyle(document.body).getPropertyValue("--text"); ctx.font="13px monospace";
    ctx.fillText(`v_x = ${fmt(ux)} m/s`, Wc-200,50);
    ctx.fillText(`v_y = ${fmt(vyInst)} m/s`, Wc-200,66);
    ctx.fillText(`|v| = ${fmt(Math.sqrt(ux*ux+vyInst*vyInst))} m/s`, Wc-200,84);

    ctx.fillStyle=getComputedStyle(document.body).getPropertyValue("--muted");
    ctx.font="10px sans-serif";
    const step = Math.max(1, Math.round(scaleInfo.worldX/8));
    for(let xm=0; xm<=scaleInfo.worldX; xm+=step){
      const px = originX + xm*scaleInfo.scale;
      ctx.beginPath(); ctx.moveTo(px,groundY); ctx.lineTo(px,groundY+6);
      ctx.strokeStyle="rgba(255,255,255,0.06)"; ctx.stroke();
      ctx.fillText(`${xm.toFixed(0)} m`, px-10, groundY+20);
    }
  }

  function startSim(){
    if(currentCategory!=="mechanics") return;
    sim.u=parseFloat(uIn.value);
    sim.theta=parseFloat(thetaIn.value);
    sim.h=parseFloat(hIn.value);
    sim.g=parseFloat(gIn.value);
    sim.time=0; sim.path=[];
    running=true; paused=false;
    pauseBtn.textContent="⏸ Pause";
    animate();
  }
  function pauseToggle(){
    if(!running || currentCategory!=="mechanics") return;
    paused=!paused;
    pauseBtn.textContent = paused ? "▶ Resume" : "⏸ Pause";
    if(!paused) animate(); else if(raf) cancelAnimationFrame(raf);
  }
  function resetSim(){
    running=false; paused=false; if(raf) cancelAnimationFrame(raf);
    sim.time=0; sim.path=[];
    computeAndDrawStatics(); drawAngleGraph();
    const initR = rangeFor(parseFloat(uIn.value),parseFloat(thetaIn.value),parseFloat(gIn.value),parseFloat(hIn.value));
    const initH = maxHeight(parseFloat(uIn.value),parseFloat(thetaIn.value),parseFloat(gIn.value),parseFloat(hIn.value));
    const scaleInfo = computeScale(initR,initH);
    renderFrame({...sim,time:0,path:[],scaleInfo,showVelVec:true,showAccVec:true,analytic:true});
  }

  function animate(){
    if(!running || currentCategory!=="mechanics") return;
    if(paused) return;
    const scaleInfo = (()=> {
      const R = rangeFor(sim.u,sim.theta,sim.g,sim.h);
      const H = maxHeight(sim.u,sim.theta,sim.g,sim.h);
      return computeScale(R,H);
    })();

    const dt = 0.016*parseFloat(timeScale.value);
    sim.time += dt;
    const th = degToRad(sim.theta), ux=sim.u*Math.cos(th), uy=sim.u*Math.sin(th);
    const y = sim.h + uy*sim.time - 0.5*sim.g*sim.time*sim.time;

    if(showTrace.checked) sim.path.push({x:ux*sim.time,y:Math.max(0,y)});
    renderFrame({...sim,scaleInfo,showVelVec:showVel.checked,showAccVec:showAcc.checked,analytic:showAnalytic.checked});

    if(y<=0 && sim.time>0.01){
      running=false;
      const T = flightTime(uy,sim.g,sim.h);
      sim.time=T;
      if(showTrace.checked) sim.path.push({x:ux*T,y:0});
      renderFrame({...sim,scaleInfo,showVelVec:showVel.checked,showAccVec:showAcc.checked,analytic:showAnalytic.checked});
      computeAndDrawStatics(); drawAngleGraph();
      return;
    }
    computeAndDrawStatics(); drawAngleGraph();
    raf=requestAnimationFrame(animate);
  }

  startBtn.addEventListener("click", startSim);
  pauseBtn.addEventListener("click", pauseToggle);
  resetBtn.addEventListener("click", resetSim);

  ["input","change"].forEach(ev=>{
    [uIn,thetaIn,hIn,gIn].forEach(el=>el.addEventListener(ev,()=>{computeAndDrawStatics();drawAngleGraph();}));
    showAnalytic.addEventListener("change",()=>{computeAndDrawStatics();drawAngleGraph();});
  });

  // init
  setCategory("mechanics");
  loadPreset("human-throw");
  computeAndDrawStatics();
  drawAngleGraph();
  const initR = rangeFor(parseFloat(uIn.value),parseFloat(thetaIn.value),parseFloat(gIn.value),parseFloat(hIn.value));
  const initH = maxHeight(parseFloat(uIn.value),parseFloat(thetaIn.value),parseFloat(gIn.value),parseFloat(hIn.value));
  const scaleInfo = computeScale(initR,initH);
  renderFrame({...sim,time:0,path:[],scaleInfo,showVelVec:true,showAccVec:true,analytic:true});
})();
</script>
</body>
</html>
