import React, { useState, useEffect, useRef } from 'react';

const FrictionIncline = () => {
  // --- CONFIG ---
  const DT = 0.016;
  const RAMP_LENGTH_M = 10; // The ramp is exactly 10 meters long
  const SCALE = 50; // Pixels per meter (Adjusted to fit 10m on screen)
  const GRAPH_DURATION = 5; 

  // --- STATE ---
  const [mass, setMass] = useState(3.0);
  const [theta, setTheta] = useState(20); // Degrees
  const [muS, setMuS] = useState(0.5);
  const [muK, setMuK] = useState(0.3);

  const [t, setT] = useState(0);
  const [pos, setPos] = useState(0); // Position along incline (0 to 10)
  const [vel, setVel] = useState(0);
  const [acc, setAcc] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  
  const [history, setHistory] = useState([]); 

  const requestRef = useRef();

  // --- PHYSICS ENGINE ---
  const g = 9.8;
  const rad = (theta * Math.PI) / 180;

  // Forces
  const Weight = mass * g;
  const Normal = Weight * Math.cos(rad);
  const GravityParallel = Weight * Math.sin(rad); 
  const MaxStatic = muS * Normal;
  const KineticFriction = muK * Normal;

  // Determine State
  let frictionForce = 0;
  let currentAcc = 0;
  const isMoving = Math.abs(vel) > 0.001;

  if (isMoving) {
    // Kinetic
    const dir = Math.sign(vel);
    frictionForce = -dir * KineticFriction;
    currentAcc = (GravityParallel + frictionForce) / mass; 
  } else {
    // Static
    if (Math.abs(GravityParallel) > MaxStatic) {
      frictionForce = -Math.sign(GravityParallel) * KineticFriction;
      currentAcc = (GravityParallel + frictionForce) / mass;
    } else {
      frictionForce = -GravityParallel;
      currentAcc = 0;
    }
  }

  // --- ANIMATION LOOP ---
  const animate = () => {
    let newVel = vel + currentAcc * DT;
    let newPos = pos + newVel * DT;

    // Stop exactly at the bottom of the ramp
    if (newPos > RAMP_LENGTH_M) { 
      setIsRunning(false); 
      newPos = RAMP_LENGTH_M; 
      newVel = 0;
    }

    setVel(newVel);
    setPos(newPos);
    setAcc(currentAcc);
    setT(prev => prev + DT);

    setHistory(prev => {
      const point = { t, f: Math.abs(frictionForce), g: Math.abs(GravityParallel) };
      const newHist = [...prev, point];
      if (newHist.length > 300) newHist.shift();
      return newHist;
    });
    
    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    if (isRunning) requestRef.current = requestAnimationFrame(animate);
    else cancelAnimationFrame(requestRef.current);
    return () => cancelAnimationFrame(requestRef.current);
  }, [isRunning, currentAcc, vel, frictionForce]);

  const handleReset = () => {
    setIsRunning(false);
    setT(0);
    setPos(0);
    setVel(0);
    setHistory([]);
  };

  // --- METER MATH ---
  const meterRadius = 35;
  const rawRatio = Math.abs(GravityParallel) / (MaxStatic || 1);
  const staticRatio = Math.min(1, rawRatio);
  
  // Polar coords for arc end
  const meterAngle = Math.PI * (1 - staticRatio); 
  const pEnd = { x: meterRadius * Math.cos(meterAngle), y: -meterRadius * Math.sin(meterAngle) };
  const meterPath = `M -${meterRadius} 0 A ${meterRadius} ${meterRadius} 0 0 1 ${pEnd.x} ${pEnd.y}`;

  // --- GRAPH HELPERS ---
  const getGraphPath = (key, h, w, maxVal) => {
    if (history.length < 2) return "";
    return history.map((p, i) => {
      const x = (i / 300) * w;
      const y = h - (p[key] / maxVal) * h;
      return `${i===0?"M":"L"} ${x} ${y}`;
    }).join(" ");
  };

  // --- SCENE GEOMETRY ---
  // We want the triangle to fit nicely.
  // Start Point (Top of ramp)
  const START_X = 100;
  const START_Y = 100;
  
  // Calculate Triangle Dimensions in Pixels
  const rampLenPx = RAMP_LENGTH_M * SCALE;
  const widthPx = rampLenPx * Math.cos(rad);
  const heightPx = rampLenPx * Math.sin(rad);

  // Vertices
  const topV = { x: START_X, y: START_Y };
  const botV = { x: START_X + widthPx, y: START_Y + heightPx };
  const cornerV = { x: START_X, y: START_Y + heightPx };

  // Box Position
  const boxDistPx = pos * SCALE;
  const boxX = START_X + boxDistPx * Math.cos(rad);
  const boxY = START_Y + boxDistPx * Math.sin(rad);

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#000', color: '#fff', fontFamily: 'monospace', overflow: 'hidden' }}>
      
      {/* SIDEBAR */}
      <aside style={{ width: '340px', background: '#0a0a0a', borderRight: '1px solid #222', padding: '20px', overflowY: 'auto' }}>
        <h2 style={{ fontSize: '16px', letterSpacing: '2px', color: '#fff', marginBottom: '20px', borderBottom:'1px solid #333', paddingBottom:'10px' }}>INCLINE LAB</h2>

        {/* CONTROLS */}
        <div style={{ marginBottom: '20px', padding: '15px', background: '#111', borderLeft: '4px solid #00e5ff' }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#00e5ff', fontSize:'13px' }}>CONFIGURATION</h4>
          <ControlRow label="Mass (kg)" val={mass} min={1} max={10} set={setMass} color="#fff" />
          <ControlRow label="Angle (θ)" val={theta} min={0} max={50} set={setTheta} color="#fff" unit="°" />
        </div>

        <div style={{ marginBottom: '20px', padding: '15px', background: '#111', borderLeft: '4px solid #ef4444' }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#ef4444', fontSize:'13px' }}>FRICTION COEFFS</h4>
          <ControlRow label="Static (μs)" val={muS} min={0.1} max={1.0} step={0.01} set={setMuS} color="#888" />
          <ControlRow label="Kinetic (μk)" val={muK} min={0.1} max={1.0} step={0.01} set={setMuK} color="#888" />
        </div>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <button onClick={() => setIsRunning(!isRunning)} style={btnStyle(isRunning)}>
            {isRunning ? "PAUSE" : "START"}
          </button>
          <button onClick={handleReset} style={btnStyle(false)}>RESET TOP</button>
        </div>

        <div style={{ background: '#111', padding: '15px', borderRadius: '4px', border: '1px solid #333' }}>
           <DataRow label="Distance" val={pos.toFixed(2)} unit="m" color="#fff" />
           <DataRow label="Velocity" val={vel.toFixed(2)} unit="m/s" color="#fff" />
           <div style={{ height:'1px', background:'#333', margin:'5px 0' }} />
           <DataRow label="Parallel Grav" val={GravityParallel.toFixed(1)} unit="N" color="#facc15" />
           <DataRow label="Net Force" val={(GravityParallel + frictionForce).toFixed(1)} unit="N" color="#00e5ff" bold />
        </div>
      </aside>

      {/* MAIN VIEWPORT */}
      <main style={{ flex: 1, position: 'relative', overflow: 'hidden', display:'flex', flexDirection:'column' }}>
        
        {/* UPPER: ANIMATION */}
        <div style={{ flex: 1, position: 'relative', background: '#0b0b0d' }}>
           <svg width="100%" height="100%" viewBox="0 0 800 500">
             <defs>
                <filter id="glow"><feGaussianBlur stdDeviation="4" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
                <marker id="head-yellow" markerWidth="4" markerHeight="4" refX="2" refY="2" orient="auto"><path d="M0,0 L0,4 L4,2 z" fill="#facc15"/></marker>
                <marker id="head-red" markerWidth="4" markerHeight="4" refX="2" refY="2" orient="auto"><path d="M0,0 L0,4 L4,2 z" fill="#ef4444"/></marker>
                <marker id="head-white" markerWidth="4" markerHeight="4" refX="2" refY="2" orient="auto"><path d="M0,0 L0,4 L4,2 z" fill="#fff"/></marker>
                <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                  <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#1a1a1a" strokeWidth="1"/>
                </pattern>
             </defs>

             {/* Background Grid */}
             <rect x="0" y="0" width="100%" height="100%" fill="url(#grid)" />

             {/* RAMP TRIANGLE */}
             <path 
                d={`M ${topV.x} ${topV.y} L ${botV.x} ${botV.y} L ${cornerV.x} ${cornerV.y} Z`} 
                fill="#161616" 
                stroke="#333" 
                strokeWidth="2"
             />
             {/* Glowing Ramp Surface */}
             <line x1={topV.x} y1={topV.y} x2={botV.x} y2={botV.y} stroke="#fff" strokeWidth="3" filter="url(#glow)" />
             
             {/* Ground Line */}
             <line x1={cornerV.x - 50} y1={cornerV.y} x2={botV.x + 100} y2={botV.y} stroke="#444" strokeWidth="2" />

             {/* Angle Arc */}
             <path 
                d={`M ${botV.x - 60} ${botV.y} A 60 60 0 0 0 ${botV.x - 60*Math.cos(rad)} ${botV.y - 60*Math.sin(rad)}`}
                stroke="#facc15" fill="none" strokeWidth="2" opacity="0.5"
             />
             <text x={botV.x - 80} y={botV.y - 15} fill="#facc15" fontSize="12">θ</text>

             {/* THE BLOCK */}
             <g transform={`translate(${boxX}, ${boxY}) rotate(${theta})`}>
                {/* Block Body (Anchor at bottom center) */}
                <rect x="-25" y="-30" width="50" height="30" fill="#111" stroke="#00e5ff" strokeWidth="2" filter="url(#glow)" />
                <text x="0" y="-10" fill="#fff" fontSize="10" textAnchor="middle">{mass}kg</text>

                {/* Normal Force */}
                <line x1="0" y1="-15" x2="0" y2={-15 - Normal * 2} stroke="#fff" strokeWidth="2" markerEnd="url(#head-white)" />
                
                {/* Friction (Opposing Motion) */}
                <line x1="-25" y1="0" x2={-25 + frictionForce * 4} y2="0" stroke="#ef4444" strokeWidth="3" markerEnd="url(#head-red)" />
                
                {/* Gravity Parallel Component */}
                <line x1="0" y1="0" x2={GravityParallel * 4} y2="0" stroke="#facc15" strokeWidth="2" markerEnd="url(#head-yellow)" />
             </g>

             {/* SLIP METER */}
             <g transform="translate(680, 100)">
               <text x="0" y="-45" fill="#fff" textAnchor="middle" fontSize="11" letterSpacing="1px">SLIP RATIO</text>
               {/* Background Arc */}
               <path d={`M -${meterRadius} 0 A ${meterRadius} ${meterRadius} 0 0 1 ${meterRadius} 0`} fill="none" stroke="#333" strokeWidth="8" strokeLinecap="round" />
               {/* Active Arc */}
               {staticRatio > 0 && (
                 <path 
                   d={meterPath} 
                   fill="none" 
                   stroke={isMoving ? "#00e5ff" : (staticRatio > 0.9 ? "#ef4444" : "#facc15")} 
                   strokeWidth="8"
                   strokeLinecap="round"
                   filter="url(#glow)"
                 />
               )}
               <text x="0" y="-5" fill="#fff" textAnchor="middle" fontSize="14" fontWeight="bold">
                  {isMoving ? "SLIDING" : `${(staticRatio*100).toFixed(0)}%`}
               </text>
               <text x="0" y="15" fill="#666" textAnchor="middle" fontSize="9">mg sinθ / μN</text>
             </g>

           </svg>
        </div>

        {/* LOWER: GRAPH WITH GRID */}
        <div style={{ height: '180px', background: '#111', borderTop: '1px solid #333', padding: '10px' }}>
           <div style={{ fontSize:'10px', color:'#888', marginBottom:'5px', display:'flex', gap:'20px', justifyContent:'center' }}>
              <span style={{color:'#facc15'}}>── Gravity Parallel</span>
              <span style={{color:'#ef4444'}}>── Friction</span>
              <span style={{color:'#fff', opacity:0.5}}>--- Static Limit</span>
           </div>
           
           <svg width="100%" height="100%">
             {(() => {
                const W = 800; 
                const H = 130;
                const maxVal = Math.max(50, mass * g); 
                
                return (
                  <g>
                    {/* Y-Axis Grid & Values */}
                    {Array.from({ length: 5 }).map((_, i) => {
                      const val = (maxVal / 4) * i;
                      const y = H - (val / maxVal) * H;
                      return (
                        <g key={i}>
                          <line x1="40" y1={y} x2="100%" y2={y} stroke="#333" strokeWidth="1" />
                          <text x="35" y={y + 4} fill="#666" fontSize="10" textAnchor="end">{val.toFixed(0)}N</text>
                        </g>
                      );
                    })}

                    {/* X-Axis Grid & Values */}
                    {Array.from({ length: 10 }).map((_, i) => {
                      const x = 40 + (i / 10) * W; 
                      return (
                        <g key={i}>
                           <line x1={x} y1={0} x2={x} y2={H} stroke="#222" strokeWidth="1" />
                        </g>
                      );
                    })}

                    {/* Static Limit Line */}
                    <line 
                      x1="40" y1={H - (MaxStatic / maxVal) * H} 
                      x2="100%" y2={H - (MaxStatic / maxVal) * H} 
                      stroke="#fff" strokeWidth="1" strokeDasharray="4,4" opacity="0.5" 
                    />

                    {/* Curves */}
                    <path d={getGraphPath('g', H, W, maxVal)} transform="translate(40,0)" stroke="#facc15" strokeWidth="2" fill="none" opacity="0.8" />
                    <path d={getGraphPath('f', H, W, maxVal)} transform="translate(40,0)" stroke="#ef4444" strokeWidth="2" fill="none" filter="url(#glow)" />
                  </g>
                );
             })()}
           </svg>
        </div>

      </main>
    </div>
  );
};

// --- STYLES ---

const ControlRow = ({ label, val, min, max, step=1, set, color, unit }) => (
  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
    <span style={{ width: '90px', fontSize: '11px', color: '#ccc' }}>{label}</span>
    <input type="range" min={min} max={max} step={step} value={val} onChange={(e) => set(Number(e.target.value))} style={{ flex: 1, marginRight:'10px', accentColor: color }} />
    <span style={{ width: '40px', fontSize: '10px', color: color, fontWeight:'bold', textAlign:'right' }}>{val}{unit}</span>
  </div>
);

const DataRow = ({ label, val, unit, color='#aaa', bold=false }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '11px', color }}>
    <span>{label}</span>
    <span style={{ fontWeight: bold ? 'bold' : 'normal', color: bold ? color : '#fff' }}>{val} {unit}</span>
  </div>
);

const btnStyle = (active) => ({
  flex: 1, padding: '10px', background: active ? '#222' : 'transparent',
  border: '1px solid', borderColor: active ? '#fff' : '#333',
  color: active ? '#fff' : '#888', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold'
});

export default FrictionIncline;