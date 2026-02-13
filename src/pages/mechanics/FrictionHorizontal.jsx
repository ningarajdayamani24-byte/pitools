import React, { useState, useEffect, useRef } from 'react';

const FrictionLab = () => {
  // --- CONFIG ---
  const SCALE = 80; // Pixels per meter
  const DT = 0.016;
  const GRAPH_POINTS = 300;

  // --- STATE ---
  const [tension, setTension] = useState(10);
  const [angle, setAngle] = useState(0);
  const [mass, setMass] = useState(5.0);
  const [muS, setMuS] = useState(0.5);
  const [muK, setMuK] = useState(0.4);

  const [t, setT] = useState(0);
  const [pos, setPos] = useState(0);
  const [vel, setVel] = useState(0);
  const [acc, setAcc] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  
  // Data history for graph
  const [history, setHistory] = useState([]); 

  const requestRef = useRef();

  // --- PHYSICS ENGINE ---
  const toRad = (deg) => (deg * Math.PI) / 180;
  const g = 9.8;

  // Forces
  const Fx = tension * Math.cos(toRad(angle));
  const Fy = tension * Math.sin(toRad(angle));
  const Weight = mass * g;
  const Normal = Math.max(0, Weight - Fy); 
  const MaxStatic = muS * Normal;
  const KineticFriction = muK * Normal;

  // Determine State
  const isMoving = Math.abs(vel) > 0.01;
  
  let frictionForce = 0;
  let currentAcc = 0;

  if (isMoving) {
    // KINETIC
    frictionForce = KineticFriction; 
    currentAcc = (Fx - frictionForce) / mass;
  } else {
    // STATIC
    if (Fx > MaxStatic) {
      // Breakaway!
      frictionForce = KineticFriction;
      currentAcc = (Fx - frictionForce) / mass;
    } else {
      // Stuck
      frictionForce = Fx; 
      currentAcc = 0;
    }
  }

  // --- ANIMATION LOOP ---
  const animate = () => {
    if (Math.abs(currentAcc) > 0.001 || Math.abs(vel) > 0.01) {
       if (vel > 0 && currentAcc < 0 && vel + currentAcc * DT <= 0) {
         setVel(0);
         setAcc(0);
       } else {
         setVel(prev => prev + currentAcc * DT);
         setPos(prev => prev + vel * DT);
         setAcc(currentAcc);
       }
    } else {
      setVel(0);
      setAcc(0);
    }

    setT(prev => prev + DT);

    // Update Graph Data
    setHistory(prev => {
      const point = { t, f: frictionForce, pull: Fx };
      const newHist = [...prev, point];
      if (newHist.length > GRAPH_POINTS) newHist.shift();
      return newHist;
    });
    
    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    if (isRunning) requestRef.current = requestAnimationFrame(animate);
    else cancelAnimationFrame(requestRef.current);
    return () => cancelAnimationFrame(requestRef.current);
  }, [isRunning, currentAcc, vel, frictionForce, Fx]);

  const handleReset = () => {
    setIsRunning(false);
    setT(0);
    setPos(0);
    setVel(0);
    setHistory([]);
  };

  const setMaterial = (name) => {
    handleReset();
    switch(name) {
      case 'ice': setMuS(0.1); setMuK(0.05); break;
      case 'wood': setMuS(0.5); setMuK(0.35); break;
      case 'rubber': setMuS(0.9); setMuK(0.7); break;
      default: break;
    }
  };

  // --- METER LOGIC (THE FIX) ---
  // Clamp ratio between 0 and 1 for the arc
  const meterRatio = Math.min(1, Fx / (MaxStatic || 1)); // Avoid div/0
  const meterRadius = 35;
  // Calculate endpoint of the arc based on ratio
  // Start is at (-R, 0)
  // End x = -R * cos(ratio * PI)
  // End y = -R * sin(ratio * PI) (Negative Y is Up in SVG)
  const endX = -meterRadius * Math.cos(meterRatio * Math.PI);
  const endY = -meterRadius * Math.sin(meterRatio * Math.PI);

  // SVG Path Command: M(ove) start, A(rc) radiusX radiusY rotation large-arc sweep endX endY
  const meterPath = `M ${-meterRadius} 0 A ${meterRadius} ${meterRadius} 0 0 1 ${endX} ${endY}`;


  // --- VISUALIZATION HELPERS ---
  const boxW = 80;
  const boxH = 60;
  const screenX = 400; 
  const floorY = 300;
  const V_SCALE = 4; 

  const getGraphPath = (key, color) => {
    if (history.length < 2) return "";
    const maxForce = Math.max(60, tension * 1.2); 
    const h = 130; 
    const w = 300; 
    
    return history.map((p, i) => {
      const x = (i / GRAPH_POINTS) * w;
      const y = h - (p[key] / maxForce) * h; // y=0 is top, h is bottom
      return `${i===0?"M":"L"} ${x} ${y}`;
    }).join(" ");
  };

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#000', color: '#fff', fontFamily: 'monospace', overflow: 'hidden' }}>
      
      {/* SIDEBAR */}
      <aside style={{ width: '320px', background: '#0a0a0a', borderRight: '1px solid #222', padding: '20px', overflowY: 'auto' }}>
        <h2 style={{ fontSize: '16px', letterSpacing: '2px', color: '#fff', marginBottom: '20px', borderBottom:'1px solid #333', paddingBottom:'10px' }}>FRICTION LAB</h2>

        {/* INPUTS */}
        <div style={{ marginBottom: '20px', padding: '15px', background: '#111', borderLeft: '4px solid #00e5ff' }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#00e5ff', fontSize: '13px' }}>APPLIED FORCE</h4>
          <ControlRow label="Tension (T)" val={tension} min={0} max={100} set={setTension} unit="N" color="#00e5ff" />
          <ControlRow label="Angle (θ)" val={angle} min={0} max={45} set={setAngle} unit="°" color="#fff" />
          <p style={{ fontSize:'10px', color:'#666', marginTop:'5px' }}>Fx = {(tension * Math.cos(toRad(angle))).toFixed(1)} N</p>
        </div>

        <div style={{ marginBottom: '20px', padding: '15px', background: '#111', borderLeft: '4px solid #ef4444' }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#ef4444', fontSize: '13px' }}>SURFACE PROPERTIES</h4>
          
          <div style={{ display:'flex', gap:'5px', marginBottom:'10px' }}>
            <button onClick={()=>setMaterial('ice')} style={matBtnStyle}>ICE</button>
            <button onClick={()=>setMaterial('wood')} style={matBtnStyle}>WOOD</button>
            <button onClick={()=>setMaterial('rubber')} style={matBtnStyle}>TIRE</button>
          </div>

          <ControlRow label="Mass (m)" val={mass} min={1} max={20} set={setMass} unit="kg" color="#888" />
          <ControlRow label="Static (μs)" val={muS} min={0.1} max={1.0} step={0.01} set={setMuS} unit="" color="#aaa" />
          <ControlRow label="Kinetic (μk)" val={muK} min={0.1} max={1.0} step={0.01} set={setMuK} unit="" color="#aaa" />
        </div>

        {/* PLAYBACK */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <button onClick={() => setIsRunning(!isRunning)} style={btnStyle(isRunning)}>
            {isRunning ? "PAUSE" : "START"}
          </button>
          <button onClick={handleReset} style={btnStyle(false)}>RESET</button>
        </div>

        {/* DATA HUD */}
        <div style={{ background: '#111', padding: '15px', borderRadius: '4px', border: '1px solid #333' }}>
          <DataRow label="Normal Force (N)" val={Normal.toFixed(1)} unit="N" />
          <DataRow label="Max Static (fs_max)" val={MaxStatic.toFixed(1)} unit="N" color="#888" />
          <div style={{ height:'1px', background:'#333', margin:'5px 0' }} />
          <DataRow label="Current Friction (f)" val={frictionForce.toFixed(1)} unit="N" color="#ef4444" bold />
          <DataRow label="Acceleration (a)" val={acc.toFixed(2)} unit="m/s²" color="#00e5ff" bold />
          <DataRow label="Velocity (v)" val={vel.toFixed(2)} unit="m/s" color="#fff" />
        </div>

      </aside>

      {/* MAIN VIEWPORT */}
      <main style={{ flex: 1, position: 'relative', overflow: 'hidden', display:'flex', flexDirection:'column' }}>
        
        {/* UPPER: ANIMATION */}
        <div style={{ flex: 1, position: 'relative', background: '#0b0b0d' }}>
           <svg width="100%" height="100%">
             <defs>
                <filter id="glow"><feGaussianBlur stdDeviation="4" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
                <marker id="head-cyan" markerWidth="4" markerHeight="4" refX="2" refY="2" orient="auto"><path d="M0,0 L0,4 L4,2 z" fill="#00e5ff"/></marker>
                <marker id="head-red" markerWidth="4" markerHeight="4" refX="2" refY="2" orient="auto"><path d="M0,0 L0,4 L4,2 z" fill="#ef4444"/></marker>
                <marker id="head-white" markerWidth="4" markerHeight="4" refX="2" refY="2" orient="auto"><path d="M0,0 L0,4 L4,2 z" fill="#fff"/></marker>
                
                {/* Floor Pattern */}
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse" patternTransform={`translate(${-pos*SCALE % 40}, 0)`}>
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#222" strokeWidth="1"/>
                </pattern>
             </defs>

             {/* Floor */}
             <rect x="0" y={floorY} width="100%" height="100%" fill="url(#grid)" />
             <line x1="0" y1={floorY} x2="100%" y2={floorY} stroke="#00e5ff" strokeWidth="2" filter="url(#glow)" />

             {/* THE BOX */}
             <g transform={`translate(${screenX}, ${floorY - boxH})`}>
                {/* Glow behind */}
                <rect x="0" y="0" width={boxW} height={boxH} fill="none" stroke="#00e5ff" strokeWidth="2" filter="url(#glow)" opacity="0.5" />
                {/* Solid Box */}
                <rect x="0" y="0" width={boxW} height={boxH} fill="#111" stroke="#fff" strokeWidth="2" />
                
                {/* Status Text */}
                <text x={boxW/2} y={boxH/2 + 5} fill={isMoving ? "#00e5ff" : "#ef4444"} textAnchor="middle" fontSize="12" fontWeight="bold">
                  {isMoving ? "KINETIC" : "STATIC"}
                </text>

                {/* VECTORS */}
                {/* Applied Force (Tension) */}
                <g transform={`translate(${boxW}, ${boxH/2})`}>
                   <line 
                      x1="0" y1="0" 
                      x2={Fx * V_SCALE} y2={-Fy * V_SCALE} 
                      stroke="#00e5ff" strokeWidth="4" markerEnd="url(#head-cyan)" 
                   />
                   <text x={Fx * V_SCALE + 10} y={-Fy * V_SCALE} fill="#00e5ff" fontSize="12">T</text>
                   
                   {/* Angle Arc */}
                   {angle > 0 && (
                     <path d={`M 30 0 A 30 30 0 0 0 ${30*Math.cos(toRad(angle))} ${-30*Math.sin(toRad(angle))}`} stroke="#fff" fill="none" opacity="0.5"/>
                   )}
                </g>

                {/* Friction Force */}
                <g transform={`translate(0, ${boxH})`}>
                   <line 
                      x1="0" y1="0" 
                      x2={-frictionForce * V_SCALE} y2="0" 
                      stroke="#ef4444" strokeWidth="4" markerEnd="url(#head-red)" 
                   />
                   <text x={-frictionForce * V_SCALE - 20} y={-10} fill="#ef4444" fontSize="12">f</text>
                </g>

                {/* Normal Force */}
                <g transform={`translate(${boxW/2}, 0)`}>
                   <line x1="0" y1="0" x2="0" y2={-Normal * (V_SCALE/2)} stroke="#fff" strokeWidth="2" markerEnd="url(#head-white)" />
                   <text x="5" y={-Normal * (V_SCALE/2) - 5} fill="#fff" fontSize="12">N</text>
                </g>

                {/* Gravity */}
                <g transform={`translate(${boxW/2}, ${boxH})`}>
                   <line x1="0" y1="0" x2="0" y2={Weight * (V_SCALE/2)} stroke="#555" strokeWidth="2" />
                </g>
             </g>

             {/* BREAKAWAY METER (FIXED) */}
             <g transform="translate(600, 120)">
               <text x="0" y="-45" fill="#fff" textAnchor="middle" fontSize="12" letterSpacing="1px">STATIC LIMIT</text>
               
               {/* Background Arc (100% capacity) */}
               <path d={`M -${meterRadius} 0 A ${meterRadius} ${meterRadius} 0 0 1 ${meterRadius} 0`} fill="none" stroke="#333" strokeWidth="8" strokeLinecap="round" />
               
               {/* Active Arc (Current Ratio) */}
               {/* Only draw if ratio > 0 to avoid path errors */}
               {meterRatio > 0 && (
                 <path 
                   d={meterPath} 
                   fill="none" 
                   stroke={isMoving ? "#00e5ff" : "#ef4444"} 
                   strokeWidth="8"
                   strokeLinecap="round"
                   filter="url(#glow)"
                 />
               )}

               {/* Center Text */}
               <text x="0" y="-5" fill={isMoving ? "#00e5ff" : "#fff"} textAnchor="middle" fontSize="16" fontWeight="bold">
                  {isMoving ? "SLIDING" : `${(meterRatio * 100).toFixed(0)}%`}
               </text>
               
               <text x="0" y="15" fill="#888" textAnchor="middle" fontSize="10">
                 {Fx.toFixed(0)}N / {MaxStatic.toFixed(0)}N
               </text>
             </g>

           </svg>
        </div>

        {/* LOWER: LIVE GRAPH */}
        <div style={{ height: '180px', background: '#111', borderTop: '1px solid #333', padding: '10px' }}>
           <div style={{ fontSize:'10px', color:'#888', marginBottom:'5px', display:'flex', gap:'20px' }}>
              <span>FORCE HISTORY</span>
              <span style={{color:'#00e5ff'}}>── Applied Pull</span>
              <span style={{color:'#ef4444'}}>── Friction</span>
           </div>
           
           <svg width="100%" height="100%">
             {/* Grid Lines */}
             <line x1="0" y1="130" x2="100%" y2="130" stroke="#333" strokeWidth="1" />
             <line x1="0" y1="30" x2="100%" y2="30" stroke="#333" strokeWidth="1" strokeDasharray="4,4" />
             <text x="5" y="25" fill="#666" fontSize="10">Max Force</text>
             
             {/* Curves */}
             <path d={getGraphPath('pull')} stroke="#00e5ff" strokeWidth="2" fill="none" opacity="0.5" />
             <path d={getGraphPath('f')} stroke="#ef4444" strokeWidth="2" fill="none" filter="url(#glow)" />
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

const matBtnStyle = {
  flex: 1, padding:'6px', background:'#222', border:'1px solid #444', color:'#ccc', fontSize:'10px', borderRadius:'3px', cursor:'pointer'
};

export default FrictionLab;