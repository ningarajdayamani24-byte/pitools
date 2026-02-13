import React, { useState, useEffect, useRef } from 'react';

const CoupledCylindersLab = () => {
  const canvasRef = useRef(null);
  const graphRef = useRef(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isCoupled, setIsCoupled] = useState(false);

  // Global Controls
  const [muK, setMuK] = useState(0.5);

  // Top Cylinder States (Blue)
  const [topH, setTopH] = useState(2);
  const [topR, setTopR] = useState(5);
  const [topWi, setTopWi] = useState(-10);
  const [topMass, setTopMass] = useState(50);

  // Bottom Cylinder States (Red)
  const [botH, setBotH] = useState(1);
  const [botR, setBotR] = useState(8);
  const [botWi, setBotWi] = useState(5);
  const [botMass, setBotMass] = useState(64);

  const stateRef = useRef({
    w1: 0, w2: 0, t1: 0, t2: 0,
    historyW1: [], historyW2: [],
    torque: 0
  });

  const resetSim = () => {
    const s = stateRef.current;
    s.w1 = topWi;
    s.w2 = botWi;
    s.t1 = 0; s.t2 = 0;
    s.historyW1 = []; s.historyW2 = [];
    s.torque = 0;
    setIsCoupled(false);
    setIsRunning(true);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const gCanvas = graphRef.current;
    if (!canvas || !gCanvas) return;
    const ctx = canvas.getContext('2d');
    const gCtx = gCanvas.getContext('2d');
    let animationId;

    const render = () => {
      const s = stateRef.current;
      const dt = 0.05;
      const { width, height } = canvas;
      const centerX = width / 2;
      const centerY = height / 2;

      const I1 = 0.5 * topMass * Math.pow(topR, 2);
      const I2 = 0.5 * botMass * Math.pow(botR, 2);

      if (isRunning) {
        if (isCoupled) {
          if (Math.abs(s.w1 - s.w2) > 0.05) {
            const relativeDir = s.w1 > s.w2 ? 1 : -1;
            // Torque = mu * NormalForce * radius
            s.torque = muK * (topMass * 9.8) * (Math.min(topR, botR) * 0.5);
            s.w1 -= (s.torque / I1) * dt * relativeDir;
            s.w2 += (s.torque / I2) * dt * relativeDir;
          } else {
            const L_total = (I1 * s.w1 + I2 * s.w2);
            const wFinal = L_total / (I1 + I2);
            s.w1 = s.w2 = wFinal;
            s.torque = 0;
          }
        }
        s.t1 += s.w1 * dt;
        s.t2 += s.w2 * dt;
        s.historyW1.push(s.w1);
        s.historyW2.push(s.w2);
        if (s.historyW1.length > 500) { s.historyW1.shift(); s.historyW2.shift(); }
      }

      // DRAW SIMULATION
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, width, height);
      
      // GRID
      ctx.strokeStyle = '#151515'; ctx.lineWidth = 1;
      for(let i=0; i<width; i+=40) { ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i, height); ctx.stroke(); }
      for(let j=0; j<height; j+=40) { ctx.beginPath(); ctx.moveTo(0,j); ctx.lineTo(width, j); ctx.stroke(); }

      // DATA HUD (MENTIONING ALL TERMS)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)'; ctx.fillRect(10, 10, 320, 160);
      ctx.fillStyle = '#fff'; ctx.font = 'bold 11px monospace';
      ctx.fillText(`TOP I: ${I1.toFixed(1)} kg·m² | BOT I: ${I2.toFixed(1)} kg·m²`, 20, 30);
      ctx.fillText(`L (SYSTEM MOMENTUM): ${(I1 * s.w1 + I2 * s.w2).toFixed(2)} kg·m²/s`, 20, 55);
      ctx.fillText(`τ (FRICTION TORQUE): ${s.torque.toFixed(2)} N·m`, 20, 80);
      ctx.fillStyle = '#448aff'; ctx.fillText(`ω1 (TOP VELOCITY): ${s.w1.toFixed(2)} rad/s`, 20, 110);
      ctx.fillStyle = '#ff5252'; ctx.fillText(`ω2 (BOT VELOCITY): ${s.w2.toFixed(2)} rad/s`, 20, 135);

      const drawCyl = (y, r, h, theta, color, label) => {
        ctx.save();
        ctx.translate(centerX, centerY + y); ctx.scale(1, 0.4);
        ctx.strokeStyle = color; ctx.lineWidth = h * 6;
        ctx.beginPath(); ctx.arc(0, 0, r * 15, 0, Math.PI * 2); ctx.stroke();
        ctx.rotate(theta); ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(r * 15 - 10, 0, 8, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
        ctx.fillStyle = color; ctx.fillText(label, centerX + r * 15 + 15, centerY + y);
      };

      drawCyl(isCoupled ? 25 : 90, botR, botH, s.t2, '#ff5252', "BOTTOM CYLINDER (I2)");
      drawCyl(isCoupled ? -25 : -90, topR, topH, s.t1, '#448aff', "TOP CYLINDER (I1)");

      // GRAPH WITH AXIS LABELS
      gCtx.fillStyle = '#000'; gCtx.fillRect(0, 0, gCanvas.width, gCanvas.height);
      gCtx.strokeStyle = '#222'; gCtx.beginPath(); gCtx.moveTo(0, gCanvas.height/2); gCtx.lineTo(gCanvas.width, gCanvas.height/2); gCtx.stroke();
      gCtx.fillStyle = '#69f0ae'; gCtx.fillText("Y-AXIS: ANGULAR VELOCITY (ω)", 10, 15);
      gCtx.fillText("X-AXIS: TIME (t)", gCanvas.width - 100, gCanvas.height - 10);

      const drawLine = (data, color) => {
        if (data.length < 2) return;
        gCtx.beginPath(); gCtx.strokeStyle = color; gCtx.lineWidth = 3;
        data.forEach((v, i) => {
          const x = (i / 500) * gCanvas.width;
          const y = (gCanvas.height / 2) - (v * 10);
          if (i === 0) gCtx.moveTo(x, y); else gCtx.lineTo(x, y);
        });
        gCtx.stroke();
      };
      drawLine(s.historyW1, '#448aff'); drawLine(s.historyW2, '#ff5252');

      animationId = requestAnimationFrame(render);
    };
    render();
    return () => cancelAnimationFrame(animationId);
  }, [isRunning, isCoupled, muK, topH, topR, topWi, topMass, botH, botR, botWi, botMass]);

  return (
    <div style={{ backgroundColor: '#000', color: '#fff', minHeight: '100vh', display: 'flex', overflow: 'hidden' }}>
      <aside style={{ width: '300px', background: '#0a0a0a', padding: '20px', borderRight: '1px solid #333', overflowY: 'auto' }}>
        <h3 style={{ fontSize: '14px', marginBottom: '20px' }}>COUPLED PARAMETERS</h3>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ fontSize: '11px' }}>Friction (μk): {muK}</label>
          <input type="range" min="0" max="1" step="0.05" value={muK} onChange={(e) => setMuK(Number(e.target.value))} style={{ width: '100%' }} />
        </div>
        <div style={{ padding: '10px', background: '#111', border: '1px solid #448aff', borderRadius: '4px', marginBottom: '10px' }}>
          <label style={{ fontSize: '11px' }}>Top Radius: {topR}m</label>
          <input type="range" min="2" max="10" value={topR} onChange={(e) => setTopR(Number(e.target.value))} style={{ width: '100%' }} />
          <label style={{ fontSize: '11px' }}>Top ωi: {topWi} rad/s</label>
          <input type="range" min="-20" max="20" value={topWi} onChange={(e) => setTopWi(Number(e.target.value))} style={{ width: '100%' }} />
          <label style={{ fontSize: '11px' }}>Top Mass: {topMass}kg</label>
          <input type="range" min="10" max="200" value={topMass} onChange={(e) => setTopMass(Number(e.target.value))} style={{ width: '100%' }} />
        </div>
        <div style={{ padding: '10px', background: '#111', border: '1px solid #ff5252', borderRadius: '4px', marginBottom: '10px' }}>
          <label style={{ fontSize: '11px' }}>Bot Radius: {botR}m</label>
          <input type="range" min="2" max="10" value={botR} onChange={(e) => setBotR(Number(e.target.value))} style={{ width: '100%' }} />
          <label style={{ fontSize: '11px' }}>Bot ωi: {botWi} rad/s</label>
          <input type="range" min="-20" max="20" value={botWi} onChange={(e) => setBotWi(Number(e.target.value))} style={{ width: '100%' }} />
          <label style={{ fontSize: '11px' }}>Bot Mass: {botMass}kg</label>
          <input type="range" min="10" max="200" value={botMass} onChange={(e) => setBotMass(Number(e.target.value))} style={{ width: '100%' }} />
        </div>
        <button onClick={resetSim} style={{ width: '100%', padding: '12px', background: '#448aff', color: '#fff', border: 'none', cursor: 'pointer', marginBottom: '10px' }}>START</button>
        <button onClick={() => setIsCoupled(true)} disabled={isCoupled} style={{ width: '100%', padding: '12px', background: '#00e676', border: 'none', color: '#000', fontWeight: 'bold', cursor: 'pointer' }}>COUPLE DISKS</button>
      </aside>

      <main style={{ flex: 1, padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ height: '500px', border: '1px solid #222', background: '#000' }}><canvas ref={canvasRef} width="850" height="500" /></div>
        <div style={{ height: '280px', border: '1px solid #222', background: '#000' }}><canvas ref={graphRef} width="850" height="280" /></div>
      </main>
    </div>
  );
};

export default CoupledCylindersLab;
