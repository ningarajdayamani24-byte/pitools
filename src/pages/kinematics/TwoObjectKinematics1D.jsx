import React, { useState, useEffect, useRef } from 'react';

const TwoObjectKinematics = () => {
  // --- CONFIG ---
  const T_MAX = 10.0;
  const DT = 0.02;
  const SCALE = 20; // Pixels per meter (Motion View)
  const GRAPH_Y_SCALE = 1.5; // Pixels per meter (Graph View)

  // --- STATE ---
  const [blue, setBlue] = useState({ x0: 0, v0: 10, a: 0 });
  const [red, setRed] = useState({ x0: 40, v0: 0, a: -2 });
  const [t, setT] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [cameraX, setCameraX] = useState(0);

  const requestRef = useRef();

  // --- PHYSICS ENGINE ---
  const getPos = (obj, time) => obj.x0 + obj.v0 * time + 0.5 * obj.a * time * time;
  const getVel = (obj, time) => obj.v0 + obj.a * time;

  const bPos = getPos(blue, t);
  const rPos = getPos(red, t);
  const bVel = getVel(blue, t);
  const rVel = getVel(red, t);

  // Auto-center camera
  useEffect(() => {
    const midpoint = (bPos + rPos) / 2;
    setCameraX(midpoint);
  }, [bPos, rPos]);

  // Animation Loop
  const animate = () => {
    setT(prevT => {
      if (prevT >= T_MAX) {
        setIsRunning(false);
        return T_MAX;
      }
      return prevT + DT;
    });
    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    if (isRunning) requestRef.current = requestAnimationFrame(animate);
    else cancelAnimationFrame(requestRef.current);
    return () => cancelAnimationFrame(requestRef.current);
  }, [isRunning]);

  // Collision Check
  const collision = Math.abs(bPos - rPos) < 2; 

  // --- SUB-COMPONENTS ---

  const Car = ({ pos, color, yOffset, label, vel }) => {
    const screenX = 450 + (pos - cameraX) * SCALE;
    if (screenX < -100 || screenX > 1000) return null;

    return (
      <g transform={`translate(${screenX}, ${yOffset})`}>
        <ellipse cx="0" cy="10" rx="25" ry="6" fill={color} filter={`url(#glow-${color.replace('#','')})`} opacity="0.4" />
        <path d="M -20 0 L -15 -12 L 10 -12 L 20 0 L 20 8 L -20 8 Z" fill="#000" stroke={color} strokeWidth="2" />
        <circle cx="-12" cy="8" r="5" fill="#111" stroke="#555" />
        <circle cx="12" cy="8" r="5" fill="#111" stroke="#555" />
        <line x1="0" y1="-5" x2={vel * 3} y2="-5" stroke={color} strokeWidth="2" markerEnd={`url(#head-${color.replace('#','')})`} />
        <text x="0" y="-20" fill={color} fontSize="11" textAnchor="middle" fontWeight="bold">{label}</text>
      </g>
    );
  };

  const GraphCurve = ({ color, obj }) => {
    let d = "";
    for (let i = 0; i <= T_MAX; i += 0.1) {
      const p = getPos(obj, i);
      const gx = (i / T_MAX) * 800; 
      const gy = 150 - (p * GRAPH_Y_SCALE); 
      // Clamp graphical range to avoid drawing way outside svg
      if (gy > -50 && gy < 350) {
          d += `${i === 0 ? "M" : "L"} ${gx} ${gy} `;
      }
    }
    return <path d={d} stroke={color} strokeWidth="2" fill="none" filter={`url(#glow-${color.replace('#','')})`} />;
  };

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#000', color: '#fff', fontFamily: 'monospace', overflow: 'hidden' }}>
      
      {/* SIDEBAR */}
      <aside style={{ width: '320px', background: '#0a0a0a', borderRight: '1px solid #222', padding: '20px', overflowY: 'auto' }}>
        <h2 style={{ fontSize: '14px', letterSpacing: '2px', color: '#888', marginBottom: '20px' }}>KINEMATICS LAB: 2 BODY</h2>

        {/* BLUE CAR CONTROLS */}
        <div style={{ marginBottom: '20px', padding: '15px', background: '#111', borderLeft: '4px solid #2563eb' }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#2563eb' }}>BLUE CAR</h4>
          <ControlRow label="x₀" val={blue.x0} min={-50} max={50} set={(v) => setBlue({...blue, x0:v})} />
          <ControlRow label="v₀" val={blue.v0} min={-20} max={20} set={(v) => setBlue({...blue, v0:v})} />
          <ControlRow label="a" val={blue.a} min={-5} max={5} step={0.1} set={(v) => setBlue({...blue, a:v})} />
        </div>

        {/* RED CAR CONTROLS */}
        <div style={{ marginBottom: '20px', padding: '15px', background: '#111', borderLeft: '4px solid #ef4444' }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#ef4444' }}>RED CAR</h4>
          <ControlRow label="x₀" val={red.x0} min={-50} max={50} set={(v) => setRed({...red, x0:v})} />
          <ControlRow label="v₀" val={red.v0} min={-20} max={20} set={(v) => setRed({...red, v0:v})} />
          <ControlRow label="a" val={red.a} min={-5} max={5} step={0.1} set={(v) => setRed({...red, a:v})} />
        </div>

        {/* PLAYBACK */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <button onClick={() => setIsRunning(!isRunning)} style={btnStyle(isRunning)}>
            {isRunning ? "PAUSE" : "RUN"}
          </button>
          <button onClick={() => { setIsRunning(false); setT(0); }} style={{...btnStyle(false), borderColor: '#fff', color: '#fff'}}>
            RESET
          </button>
        </div>

        {/* HUD DATA */}
        <div style={{ background: '#111', padding: '15px', borderRadius: '4px', border: '1px solid #333' }}>
          <div style={{ fontSize: '11px', color: '#888', marginBottom: '10px' }}>TELEMETRY (t = {t.toFixed(2)}s)</div>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:'12px', marginBottom:'5px', color:'#2563eb' }}>
             <span>x_blue: {bPos.toFixed(1)}m</span><span>v: {bVel.toFixed(1)}</span>
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:'12px', marginBottom:'10px', color:'#ef4444' }}>
             <span>x_red: {rPos.toFixed(1)}m</span><span>v: {rVel.toFixed(1)}</span>
          </div>
          <div style={{ borderTop: '1px solid #333', paddingTop: '5px', fontSize: '12px', color: '#fff' }}>
             Δx (Separation): {Math.abs(bPos - rPos).toFixed(1)} m
          </div>
        </div>
      </aside>

      {/* MAIN VIEWPORT */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '20px', gap: '20px' }}>
        
        {/* 1. TRACK VIEW */}
        <div style={{ flex: 1, background: '#000', border: '1px solid #222', borderRadius: '8px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 10, left: 10, fontSize: '12px', color: '#555' }}>
            TRACK VIEW (Camera follows center) | Center = {cameraX.toFixed(1)}m
          </div>
          
          {collision && (
            <div style={{ 
              position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
              background: 'rgba(255, 0, 0, 0.8)', padding: '10px 20px', borderRadius: '8px',
              color: '#fff', fontWeight: 'bold', border: '2px solid #fff', zIndex: 100
            }}>
              COLLISION DETECTED!
            </div>
          )}

          <svg width="100%" height="100%" viewBox="0 0 900 300">
            <defs>
              <filter id="glow-2563eb"><feGaussianBlur stdDeviation="2" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
              <filter id="glow-ef4444"><feGaussianBlur stdDeviation="2" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
              <marker id="head-2563eb" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L5,3 z" fill="#2563eb"/></marker>
              <marker id="head-ef4444" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L5,3 z" fill="#ef4444"/></marker>
            </defs>

            {/* Infinite Road */}
            {Array.from({ length: 41 }).map((_, i) => {
              const tickWorldPos = Math.floor(cameraX / 10) * 10 + (i - 20) * 10;
              const screenX = 450 + (tickWorldPos - cameraX) * SCALE;
              if (screenX < -50 || screenX > 950) return null;
              return (
                <g key={i}>
                  <line x1={screenX} y1={250} x2={screenX} y2={260} stroke="#333" strokeWidth="2" />
                  <text x={screenX} y={280} fill="#444" fontSize="10" textAnchor="middle">{tickWorldPos}</text>
                </g>
              );
            })}
            <line x1="0" y1="250" x2="900" y2="250" stroke="#333" strokeWidth="2" />

            <Car pos={bPos} vel={bVel} color="#2563eb" yOffset={100} label={`Blue (${bPos.toFixed(0)}m)`} />
            <Car pos={rPos} vel={rVel} color="#ef4444" yOffset={200} label={`Red (${rPos.toFixed(0)}m)`} />
          </svg>
        </div>

        {/* 2. LIVE GRAPH (x vs t) */}
        <div style={{ height: '300px', background: '#000', border: '1px solid #222', borderRadius: '8px', position: 'relative' }}>
          <div style={{ position: 'absolute', top: 10, left: 10, fontSize: '12px', color: '#555' }}>POSITION vs TIME GRAPH</div>
          
          <svg width="100%" height="100%" viewBox="0 0 900 300" style={{ overflow: 'visible' }}>
             
             {/* Main Group: Translating right to make room for Y-axis numbers */}
             <g transform="translate(50, 0)">
                
                {/* Horizontal Grid (Position) */}
                {Array.from({ length: 11 }).map((_, i) => {
                  // Range: -100m to +100m, step 20m
                  const val = (i - 5) * 20; 
                  const y = 150 - (val * GRAPH_Y_SCALE);
                  return (
                    <g key={`hg-${i}`}>
                      <line x1={0} y1={y} x2={800} y2={y} stroke={val === 0 ? "#666" : "#222"} strokeWidth={val === 0 ? 2 : 1} />
                      <text x={-10} y={y + 3} fill={val === 0 ? "#fff" : "#666"} fontSize="10" textAnchor="end">{val}m</text>
                    </g>
                  );
                })}

                {/* Vertical Grid (Time) */}
                {Array.from({ length: 11 }).map((_, i) => {
                  const x = (i / 10) * 800; // 0 to 800px width
                  return (
                    <g key={`vg-${i}`}>
                      <line x1={x} y1={0} x2={x} y2={300} stroke="#222" strokeWidth="1" />
                      <text x={x} y={295} fill="#666" fontSize="10" textAnchor="middle">{i}s</text>
                    </g>
                  );
                })}

                {/* Data Curves */}
                <GraphCurve color="#2563eb" obj={blue} />
                <GraphCurve color="#ef4444" obj={red} />

                {/* Live Tracking Dots */}
                <circle cx={(t/T_MAX)*800} cy={150 - bPos*GRAPH_Y_SCALE} r="5" fill="#2563eb" stroke="#000" />
                <circle cx={(t/T_MAX)*800} cy={150 - rPos*GRAPH_Y_SCALE} r="5" fill="#ef4444" stroke="#000" />
                
                {/* Time Scrubber */}
                <line x1={(t/T_MAX)*800} y1="0" x2={(t/T_MAX)*800} y2="300" stroke="#fff" strokeDasharray="4,4" opacity="0.3" />
             </g>
          </svg>
        </div>

      </main>
    </div>
  );
};

const ControlRow = ({ label, val, min, max, step=1, set }) => (
  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
    <span style={{ width: '30px', fontSize: '11px', color: '#888' }}>{label}</span>
    <input type="range" min={min} max={max} step={step} value={val} onChange={(e) => set(Number(e.target.value))} style={{ flex: 1 }} />
    <span style={{ width: '35px', fontSize: '10px', color: '#fff', textAlign: 'right' }}>{val}</span>
  </div>
);

const btnStyle = (active) => ({
  flex: 1, padding: '10px', background: active ? '#222' : 'transparent',
  border: '1px solid', borderColor: active ? '#fff' : '#333',
  color: active ? '#fff' : '#888', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold'
});

export default TwoObjectKinematics;