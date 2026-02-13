import React, { useState } from "react";

const MotionGraphs1D = () => {
  // --- CONFIG ---
  const W = 300;
  const H = 300;
  const GRID = 40; // 1 unit = 40px
  const T_MAX = 4.0;
  const POINTS = 100;

  // --- STATE ---
  const [x0, setX0] = useState(-2);
  const [v0, setV0] = useState(1);
  const [a, setA] = useState(0.5);
  const [tCheck, setTCheck] = useState(2.0); // The "Scrubber" time

  // --- PHYSICS ENGINE ---
  // Generate data points for the curves
  const timeArr = Array.from({ length: POINTS }, (_, i) => (i / (POINTS - 1)) * T_MAX * 1.5 - (T_MAX * 0.75)); // Range roughly -3 to +3 for visual centering usually, but let's stick to time t
  // Actually, let's map t from -3 to 3 for the visual x-axis to show full behavior
  const tRange = Array.from({ length: POINTS }, (_, i) => {
    const minT = -3.5;
    const maxT = 3.5;
    return minT + (i / (POINTS - 1)) * (maxT - minT);
  });

  const getPos = (t) => x0 + v0 * t + 0.5 * a * t * t;
  const getVel = (t) => v0 + a * t;
  const getAcc = (t) => a;

  // Calculate current state for HUD
  const currX = getPos(tCheck);
  const currV = getVel(tCheck);
  const currA = getAcc(tCheck);

  // --- HELPER COMPONENTS ---

  const Graph = ({ title, color, data, curVal, labelY }) => {
    const midX = W / 2;
    const midY = H / 2;

    // Convert Physics Coords -> SVG Coords
    const toSVG = (t, val) => ({
      x: midX + t * GRID,
      y: midY - val * GRID
    });

    // Generate Path
    const path = data.map((p, i) => {
      const pos = toSVG(p.t, p.val);
      return `${i === 0 ? "M" : "L"} ${pos.x} ${pos.y}`;
    }).join(" ");

    // Current Scrubber Point
    const scrubberPos = toSVG(tCheck, curVal);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ color: color, fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', letterSpacing: '1px' }}>
          {title}
        </div>
        <svg width={W} height={H} style={{ background: '#000', border: '1px solid #333', borderRadius: '4px' }}>
          <defs>
             <filter id={`glow-${color}`} x="-50%" y="-50%" width="200%" height="200%">
               <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
               <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
             </filter>
          </defs>

          {/* GRID */}
          <g opacity="0.2">
            {Array.from({ length: W / GRID + 1 }).map((_, i) => {
              const x = (i - Math.floor(W/GRID/2)) * GRID + midX;
              return <line key={`v${i}`} x1={x} y1={0} x2={x} y2={H} stroke="#444" />;
            })}
            {Array.from({ length: H / GRID + 1 }).map((_, i) => {
              const y = (i - Math.floor(H/GRID/2)) * GRID + midY;
              return <line key={`h${i}`} x1={0} y1={y} x2={W} y2={y} stroke="#444" />;
            })}
          </g>

          {/* AXES */}
          <line x1={midX} y1={0} x2={midX} y2={H} stroke="#666" strokeWidth="2" />
          <line x1={0} y1={midY} x2={W} y2={midY} stroke="#666" strokeWidth="2" />
          <text x={W - 20} y={midY + 15} fill="#888" fontSize="10">t</text>
          <text x={midX + 6} y={15} fill="#888" fontSize="10">{labelY}</text>

          {/* CURVE */}
          <path 
            d={path} 
            stroke={color} 
            strokeWidth="3" 
            fill="none" 
            filter={`url(#glow-${color})`} 
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* SCRUBBER POINT */}
          <circle cx={scrubberPos.x} cy={scrubberPos.y} r="5" fill="#fff" stroke={color} strokeWidth="2" />
          
          {/* Scrubber Value Label */}
          <text x={10} y={H-10} fill={color} fontSize="11" fontFamily="monospace">
            {labelY}({tCheck.toFixed(1)}) = {curVal.toFixed(2)}
          </text>
        </svg>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#000', color: '#fff', fontFamily: 'monospace', overflow: 'hidden' }}>
      
      {/* SIDEBAR CONTROLS */}
      <aside style={{ width: '320px', background: '#0a0a0a', borderRight: '1px solid #222', padding: '20px', overflowY: 'auto' }}>
        <h2 style={{ fontSize: '14px', letterSpacing: '2px', color: '#888', marginBottom: '20px' }}>MOTION GRAPHS</h2>

        {/* INPUTS */}
        <div style={{ marginBottom: '20px', padding: '15px', background: '#111', borderLeft: '4px solid #fff' }}>
          <h4 style={{ margin: '0 0 15px 0', color: '#fff' }}>INITIAL CONDITIONS</h4>
          
          <label style={{ fontSize: '11px', color: '#3b82f6' }}>Initial Pos (x₀): {x0}</label>
          <input type="range" min="-3" max="3" step="0.1" value={x0} onChange={(e) => setX0(Number(e.target.value))} style={{ width: '100%' }} />

          <label style={{ fontSize: '11px', color: '#22c55e' }}>Initial Vel (v₀): {v0}</label>
          <input type="range" min="-3" max="3" step="0.1" value={v0} onChange={(e) => setV0(Number(e.target.value))} style={{ width: '100%' }} />

          <label style={{ fontSize: '11px', color: '#ef4444' }}>Acceleration (a): {a}</label>
          <input type="range" min="-2" max="2" step="0.1" value={a} onChange={(e) => setA(Number(e.target.value))} style={{ width: '100%' }} />
        </div>

        {/* SCRUBBER */}
        <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #333', borderRadius: '4px' }}>
          <label style={{ fontSize: '11px', color: '#fff', fontWeight:'bold' }}>TIME SCRUBBER (t): {tCheck.toFixed(2)}s</label>
          <input type="range" min="-3.5" max="3.5" step="0.05" value={tCheck} onChange={(e) => setTCheck(Number(e.target.value))} style={{ width: '100%', marginTop:'10px' }} />
          <p style={{ fontSize: '10px', color: '#666', marginTop: '5px' }}>Drag to see values at different times</p>
        </div>

        {/* MATH BOX */}
        <div style={{ background: '#111', padding: '15px', borderRadius: '4px', border: '1px solid #333' }}>
          <div style={{ fontSize: '11px', color: '#888', marginBottom: '10px' }}>CURRENT STATE (t = {tCheck.toFixed(2)})</div>
          
          <div style={{ marginBottom: '8px', fontSize: '12px', color: '#3b82f6' }}>
             x = {currX.toFixed(2)} m
          </div>
          <div style={{ marginBottom: '8px', fontSize: '12px', color: '#22c55e' }}>
             v = {currV.toFixed(2)} m/s
          </div>
          <div style={{ marginBottom: '0px', fontSize: '12px', color: '#ef4444' }}>
             a = {currA.toFixed(2)} m/s²
          </div>
        </div>
      </aside>

      {/* MAIN VIEWPORT */}
      <main style={{ flex: 1, padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', overflowY: 'auto' }}>
        
        {/* ROW OF GRAPHS */}
        <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap', justifyContent: 'center' }}>
          
          <Graph 
            title="POSITION (x vs t)" 
            color="#3b82f6" 
            labelY="x"
            curVal={currX}
            data={tRange.map(t => ({ t, val: getPos(t) }))} 
          />

          <Graph 
            title="VELOCITY (v vs t)" 
            color="#22c55e" 
            labelY="v"
            curVal={currV}
            data={tRange.map(t => ({ t, val: getVel(t) }))} 
          />

          <Graph 
            title="ACCELERATION (a vs t)" 
            color="#ef4444" 
            labelY="a"
            curVal={currA}
            data={tRange.map(t => ({ t, val: getAcc(t) }))} 
          />

        </div>

        {/* Equation Legend */}
        <div style={{ marginTop: '40px', display: 'flex', gap: '40px', opacity: 0.8 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: '#3b82f6', fontSize: '14px', marginBottom: '5px' }}>x(t) = x₀ + v₀t + ½at²</div>
            <div style={{ color: '#666', fontSize: '12px' }}>
               x(t) = {x0} + {v0}t + {(0.5*a).toFixed(2)}t²
            </div>
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: '#22c55e', fontSize: '14px', marginBottom: '5px' }}>v(t) = v₀ + at</div>
            <div style={{ color: '#666', fontSize: '12px' }}>
               v(t) = {v0} + {a}t
            </div>
          </div>
        </div>

      </main>
    </div>
  );
};

export default MotionGraphs1D;