import React, { useState, useEffect, useRef } from 'react';

const NewtonsLaws = () => {
  // --- CONFIG ---
  const DT = 0.016;
  const SCALE = 60; // Pixels per meter
  const FLOOR_Y = 350;
  const BLOCK_Y = FLOOR_Y - 40; // Block sits on floor

  // --- STATE ---
  const [mass, setMass] = useState(5.0);
  const [force, setForce] = useState(20); // Applied Force
  const [mu, setMu] = useState(0.3); // Friction Coeff

  const [t, setT] = useState(0);
  const [pos, setPos] = useState(2); // Meters
  const [vel, setVel] = useState(0);
  const [acc, setAcc] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  
  const [history, setHistory] = useState([]); 

  const requestRef = useRef();

  // --- PHYSICS ENGINE ---
  const g = 9.8;
  const Normal = mass * g;
  const F_max_static = mu * Normal;
  const F_kinetic = mu * Normal; // Simplifying mu_s = mu_k for this demo, or close enough

  // Determine Forces
  let frictionVal = 0;
  let currentAcc = 0;
  const isMoving = Math.abs(vel) > 0.01;

  if (isMoving) {
    // Kinetic: Friction opposes velocity
    frictionVal = -Math.sign(vel) * F_kinetic;
    // Net Force
    const F_net = force + frictionVal;
    currentAcc = F_net / mass;
  } else {
    // Static
    if (Math.abs(force) > F_max_static) {
      // Breakaway
      frictionVal = -Math.sign(force) * F_kinetic;
      const F_net = force + frictionVal;
      currentAcc = F_net / mass;
    } else {
      // Stuck (Static Equilibrium)
      frictionVal = -force;
      currentAcc = 0;
    }
  }
  
  const NetForce = force + frictionVal;

  // --- ANIMATION LOOP ---
  const animate = () => {
    let newVel = vel + currentAcc * DT;
    let newPos = pos + newVel * DT;

    // Wall Bouncing / Stopping
    if (newPos > 12) { 
        newPos = 12; newVel = 0; // Hard stop right
    }
    if (newPos < 0.5) {
        newPos = 0.5; newVel = 0; // Hard stop left
    }

    setVel(newVel);
    setPos(newPos);
    setAcc(currentAcc);
    setT(prev => prev + DT);

    // Graph Data
    setHistory(prev => {
      const point = { t, v: newVel, a: currentAcc };
      const newHist = [...prev, point];
      if (newHist.length > 200) newHist.shift();
      return newHist;
    });
    
    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    if (isRunning) requestRef.current = requestAnimationFrame(animate);
    else cancelAnimationFrame(requestRef.current);
    return () => cancelAnimationFrame(requestRef.current);
  }, [isRunning, currentAcc, vel]);

  const handleReset = () => {
    setIsRunning(false);
    setT(0);
    setPos(2);
    setVel(0);
    setHistory([]);
  };

  // --- GRAPH HELPERS ---
  const getGraphPath = (key, h, w, scale) => {
    if (history.length < 2) return "";
    return history.map((p, i) => {
      const x = (i / 200) * w;
      // Center Y
      const y = (h/2) - (p[key] / scale) * (h/2.5);
      return `${i===0?"M":"L"} ${x} ${y}`;
    }).join(" ");
  };

  // --- SCENE HELPERS ---
  const blockX = pos * SCALE;
  const V_SCALE = 3; // Visual scale for vectors

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#000', color: '#fff', fontFamily: 'monospace', overflow: 'hidden' }}>
      
      {/* SIDEBAR */}
      <aside style={{ width: '340px', background: '#0a0a0a', borderRight: '1px solid #222', padding: '20px', overflowY: 'auto' }}>
        <h2 style={{ fontSize: '16px', letterSpacing: '2px', color: '#fff', marginBottom: '20px', borderBottom:'1px solid #333', paddingBottom:'10px' }}>NEWTON'S LAB</h2>

        <div style={{ marginBottom: '20px', padding: '15px', background: '#111', borderLeft: '4px solid #00e5ff' }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#00e5ff', fontSize:'13px' }}>FORCES</h4>
          <ControlRow label="Applied Force" val={force} min={-100} max={100} set={setForce} color="#00e5ff" unit="N" />
          <ControlRow label="Friction (μ)" val={mu} min={0} max={1.0} step={0.05} set={setMu} color="#ef4444" />
        </div>

        <div style={{ marginBottom: '20px', padding: '15px', background: '#111', borderLeft: '4px solid #fff' }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#fff', fontSize:'13px' }}>OBJECT</h4>
          <ControlRow label="Mass" val={mass} min={1} max={50} set={setMass} color="#888" unit="kg" />
        </div>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <button onClick={() => setIsRunning(!isRunning)} style={btnStyle(isRunning)}>
            {isRunning ? "PAUSE" : "START"}
          </button>
          <button onClick={handleReset} style={btnStyle(false)}>RESET</button>
        </div>

        {/* MATH HUD */}
        <div style={{ background: '#111', padding: '15px', borderRadius: '4px', border: '1px solid #333' }}>
           <div style={{fontSize:'12px', color:'#00e676', marginBottom:'8px', fontWeight:'bold', textAlign:'center'}}>
              ΣF = m · a
           </div>
           
           <div style={{ display:'flex', justifyContent:'space-between', fontSize:'12px', marginBottom:'4px' }}>
              <span style={{color:'#fff'}}>Net Force:</span>
              <span style={{color:'#00e676', fontWeight:'bold'}}>{NetForce.toFixed(1)} N</span>
           </div>
           <div style={{ display:'flex', justifyContent:'space-between', fontSize:'12px', marginBottom:'4px' }}>
              <span style={{color:'#888'}}>Mass:</span>
              <span style={{color:'#888'}}>{mass.toFixed(1)} kg</span>
           </div>
           <div style={{ borderTop:'1px solid #333', marginTop:'4px', paddingTop:'4px', display:'flex', justifyContent:'space-between', fontSize:'12px' }}>
              <span style={{color:'#fff'}}>Acceleration:</span>
              <span style={{color:'#fff', fontWeight:'bold'}}>{acc.toFixed(2)} m/s²</span>
           </div>
        </div>
      </aside>

      {/* MAIN VIEWPORT */}
      <main style={{ flex: 1, position: 'relative', overflow: 'hidden', display:'flex', flexDirection:'column' }}>
        
        {/* UPPER: ANIMATION */}
        <div style={{ flex: 1, position: 'relative', background: '#0b0b0d' }}>
           
           {/* EQUATION OVERLAY */}
           <div style={{ position:'absolute', top: 20, left: 0, right: 0, display:'flex', justifyContent:'center', pointerEvents:'none' }}>
              <div style={{ background:'rgba(0,0,0,0.8)', padding:'10px 20px', borderRadius:'20px', border:'1px solid #333', display:'flex', gap:'15px', alignItems:'center' }}>
                 <div style={{color:'#00e5ff'}}>F_app ({force})</div>
                 <div style={{color:'#fff'}}>+</div>
                 <div style={{color:'#ef4444'}}>Fric ({frictionVal.toFixed(0)})</div>
                 <div style={{color:'#fff'}}>=</div>
                 <div style={{color:'#00e676'}}>Net ({NetForce.toFixed(0)})</div>
              </div>
           </div>

           <svg width="100%" height="100%">
             <defs>
                <filter id="glow"><feGaussianBlur stdDeviation="4" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
                <marker id="head-cyan" markerWidth="4" markerHeight="4" refX="2" refY="2" orient="auto"><path d="M0,0 L0,4 L4,2 z" fill="#00e5ff"/></marker>
                <marker id="head-red" markerWidth="4" markerHeight="4" refX="2" refY="2" orient="auto"><path d="M0,0 L0,4 L4,2 z" fill="#ef4444"/></marker>
                <marker id="head-green" markerWidth="4" markerHeight="4" refX="2" refY="2" orient="auto"><path d="M0,0 L0,4 L4,2 z" fill="#00e676"/></marker>
                <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                  <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#1a1a1a" strokeWidth="1"/>
                </pattern>
             </defs>

             {/* Background Grid */}
             <rect x="0" y="0" width="100%" height="100%" fill="url(#grid)" />

             {/* Floor */}
             <line x1="0" y1={FLOOR_Y} x2="100%" y2={FLOOR_Y} stroke="#fff" strokeWidth="2" filter="url(#glow)" />
             <rect x="0" y={FLOOR_Y} width="100%" height="100%" fill="#111" opacity="0.5" />

             {/* WALLS */}
             <rect x="0" y={FLOOR_Y-100} width="10" height="100" fill="#333" />
             <rect x="800" y={FLOOR_Y-100} width="10" height="100" fill="#333" />

             {/* THE BLOCK */}
             <g transform={`translate(${blockX}, ${BLOCK_Y})`}>
                {/* Body */}
                <rect x="-30" y="-20" width="60" height="40" fill="#111" stroke="#fff" strokeWidth="2" filter="url(#glow)" />
                <text x="0" y="5" fill="#fff" fontSize="10" textAnchor="middle">{mass}kg</text>

                {/* VECTORS */}
                
                {/* Applied Force (Cyan) */}
                <Vector x={0} y={0} val={force} color="#00e5ff" label="F_app" vScale={V_SCALE} />

                {/* Friction (Red) */}
                <Vector x={0} y={25} val={frictionVal} color="#ef4444" label="f" vScale={V_SCALE} />

                {/* Net Force (Green - Ghosted above) */}
                {Math.abs(NetForce) > 0.1 && (
                   <Vector x={0} y={-40} val={NetForce} color="#00e676" label="ΣF" vScale={V_SCALE} />
                )}
             </g>

           </svg>
        </div>

        {/* LOWER: GRAPHS */}
        <div style={{ height: '200px', background: '#111', borderTop: '1px solid #333', padding: '10px', display:'flex', gap:'20px' }}>
           
           {/* ACCELERATION GRAPH */}
           <div style={{ flex: 1, position:'relative' }}>
             <div style={{fontSize:'10px', color:'#00e676', position:'absolute', top:0}}>ACCELERATION (m/s²)</div>
             <svg width="100%" height="100%">
                <line x1="0" y1="50%" x2="100%" y2="50%" stroke="#333" strokeWidth="1" />
                <path d={getGraphPath('a', 160, 350, 10)} stroke="#00e676" strokeWidth="2" fill="none" />
             </svg>
           </div>

           {/* VELOCITY GRAPH */}
           <div style={{ flex: 1, position:'relative', borderLeft:'1px solid #333', paddingLeft:'10px' }}>
             <div style={{fontSize:'10px', color:'#fff', position:'absolute', top:0}}>VELOCITY (m/s)</div>
             <svg width="100%" height="100%">
                <line x1="0" y1="50%" x2="100%" y2="50%" stroke="#333" strokeWidth="1" />
                <path d={getGraphPath('v', 160, 350, 20)} stroke="#fff" strokeWidth="2" fill="none" />
             </svg>
           </div>

        </div>

      </main>
    </div>
  );
};

// --- SUB COMPONENTS ---

const Vector = ({ x, y, val, color, label, vScale }) => {
  if (Math.abs(val) < 0.5) return null;
  const len = val * vScale;
  const endX = x + len;
  
  // Marker logic
  let marker = "url(#head-white)";
  if (color === "#00e5ff") marker = "url(#head-cyan)";
  if (color === "#ef4444") marker = "url(#head-red)";
  if (color === "#00e676") marker = "url(#head-green)";

  return (
    <g>
      <line x1={x} y1={y} x2={endX} y2={y} stroke={color} strokeWidth="3" markerEnd={marker} />
      <text x={endX + (val > 0 ? 10 : -20)} y={y + 4} fill={color} fontSize="10" fontWeight="bold">{label}</text>
    </g>
  );
};

const ControlRow = ({ label, val, min, max, step=1, set, color, unit }) => (
  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
    <span style={{ width: '100px', fontSize: '11px', color: '#ccc' }}>{label}</span>
    <input type="range" min={min} max={max} step={step} value={val} onChange={(e) => set(Number(e.target.value))} style={{ flex: 1, marginRight:'10px', accentColor: color }} />
    <span style={{ width: '40px', fontSize: '10px', color: color, fontWeight:'bold', textAlign:'right' }}>{val}{unit}</span>
  </div>
);

const btnStyle = (active) => ({
  flex: 1, padding: '10px', background: active ? '#222' : 'transparent',
  border: '1px solid', borderColor: active ? '#fff' : '#333',
  color: active ? '#fff' : '#888', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold'
});

export default NewtonsLaws;