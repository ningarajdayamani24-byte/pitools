import React, { useState, useEffect, useRef } from 'react';

const MonkeyHunter = () => {
  // --- CONFIG ---
  const DT = 0.05; // Time step
  const SCALE = 10; // Pixels per meter

  // --- STATE ---
  const [v0, setV0] = useState(40);
  const [angle, setAngle] = useState(30);
  const [targetDist, setTargetDist] = useState(60); // x distance to monkey
  const [targetHeight, setTargetHeight] = useState(40); // y height of monkey
  const [slowMo, setSlowMo] = useState(1.0);
  
  const [t, setT] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [hit, setHit] = useState(false);
  
  const requestRef = useRef();

  // --- PHYSICS ENGINE ---
  const toRad = (deg) => (deg * Math.PI) / 180;
  
  // Dart Physics
  const vx0 = v0 * Math.cos(toRad(angle));
  const vy0 = v0 * Math.sin(toRad(angle));
  const dartX = vx0 * t;
  const dartY = vy0 * t - 0.5 * 9.8 * t * t;

  // Monkey Physics (Free Fall)
  const monkeyX = targetDist;
  const monkeyY = targetHeight - 0.5 * 9.8 * t * t;

  // Check Collision
  useEffect(() => {
    const dist = Math.sqrt(Math.pow(dartX - monkeyX, 2) + Math.pow(dartY - monkeyY, 2));
    if (dist < 2 && t > 0) { // Hit within 2 meters
      setHit(true);
      setIsRunning(false);
    }
  }, [dartX, dartY, monkeyX, monkeyY, t]);

  // Animation Loop
  const animate = () => {
    // Stop if ground
    if (dartY < -5 || monkeyY < -5) { 
      setIsRunning(false); 
      return; 
    }

    setT(prev => prev + (DT * slowMo));
    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    if (isRunning) requestRef.current = requestAnimationFrame(animate);
    else cancelAnimationFrame(requestRef.current);
    return () => cancelAnimationFrame(requestRef.current);
  }, [isRunning, slowMo, dartY, monkeyY]);

  const handleFire = () => {
    setT(0);
    setHit(false);
    setIsRunning(true);
  };

  const handleReset = () => {
    setIsRunning(false);
    setHit(false);
    setT(0);
  };

  // --- AUTO-AIM HELPER ---
  const aimAtMonkey = () => {
    const dx = targetDist;
    const dy = targetHeight;
    const targetAngle = (Math.atan2(dy, dx) * 180) / Math.PI;
    setAngle(targetAngle);
  };

  // --- SVG HELPERS ---
  const toSVG = (physX, physY) => ({
    x: 50 + physX * SCALE,
    y: 500 - physY * SCALE 
  });

  const dartPos = toSVG(dartX, dartY);
  const monkeyPos = toSVG(monkeyX, monkeyY);
  const launchPos = toSVG(0, 0);
  
  // Sight Line (Laser)
  const sightEnd = toSVG(
    100 * Math.cos(toRad(angle)), 
    100 * Math.sin(toRad(angle))
  );

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#000', color: '#fff', fontFamily: 'monospace', overflow: 'hidden' }}>
      
      {/* SIDEBAR */}
      <aside style={{ width: '320px', background: '#0a0a0a', borderRight: '1px solid #222', padding: '20px', overflowY: 'auto' }}>
        <h2 style={{ fontSize: '14px', letterSpacing: '2px', color: '#888', marginBottom: '20px' }}>MONKEY HUNTER</h2>

        {/* INPUTS */}
        <div style={{ marginBottom: '20px', padding: '15px', background: '#111', borderLeft: '4px solid #facc15' }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#facc15' }}>DART SETTINGS</h4>
          <ControlRow label="Speed (v₀)" val={v0} min={10} max={100} set={setV0} unit="m/s" />
          <ControlRow label="Angle (θ)" val={angle} min={0} max={90} set={setAngle} unit="°" />
          <button onClick={aimAtMonkey} style={{ width:'100%', padding:'8px', marginTop:'10px', background:'#333', color:'#fff', border:'none', cursor:'pointer', fontSize:'10px' }}>AUTO-AIM AT MONKEY</button>
        </div>

        <div style={{ marginBottom: '20px', padding: '15px', background: '#111', borderLeft: '4px solid #ef4444' }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#ef4444' }}>MONKEY SETTINGS</h4>
          <ControlRow label="Dist (x)" val={targetDist} min={20} max={80} set={setTargetDist} unit="m" />
          <ControlRow label="Height (y)" val={targetHeight} min={10} max={80} set={setTargetHeight} unit="m" />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontSize: '11px', color: '#888' }}>Time Scale (Slow Mo): {slowMo.toFixed(1)}x</label>
          <input type="range" min="0.1" max="1.0" step="0.1" value={slowMo} onChange={(e) => setSlowMo(Number(e.target.value))} style={{ width: '100%' }} />
        </div>

        {/* PLAYBACK */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <button onClick={handleFire} style={btnStyle(true, '#00e676')}>FIRE</button>
          <button onClick={() => setIsRunning(false)} style={btnStyle(false)}>PAUSE</button>
          <button onClick={handleReset} style={btnStyle(false)}>RESET</button>
        </div>

        {/* HUD */}
        <div style={{ background: '#111', padding: '15px', borderRadius: '4px', border: '1px solid #333' }}>
          <div style={{ fontSize: '11px', color: '#888', marginBottom: '5px' }}>STATUS</div>
          <div style={{ fontSize: '14px', color: hit ? '#00e676' : '#fff', fontWeight: 'bold' }}>
            {hit ? "TARGET HIT!" : isRunning ? "PROJECTILE IN FLIGHT..." : "READY"}
          </div>
          {hit && <div style={{ fontSize:'11px', marginTop:'5px', color:'#aaa' }}>Hit at t = {t.toFixed(2)}s</div>}
        </div>
      </aside>

      {/* MAIN VIEWPORT */}
      <main style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        
        <svg width="100%" height="100%" style={{ background: '#000' }}>
          <defs>
            <filter id="glow"><feGaussianBlur stdDeviation="3" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
            <marker id="head-facc15" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L5,3 z" fill="#facc15"/></marker>
          </defs>

          {/* GRID */}
          <g opacity="0.15">
             {Array.from({ length: 40 }).map((_, i) => {
               const pos = 50 + i * SCALE * 5; 
               return <line key={`v${i}`} x1={pos} y1={0} x2={pos} y2="100%" stroke="#fff" strokeWidth="1" />;
             })}
             {Array.from({ length: 20 }).map((_, i) => {
               const pos = 500 - i * SCALE * 5; 
               return <line key={`h${i}`} x1={0} y1={pos} x2="100%" y2={pos} stroke="#fff" strokeWidth="1" />;
             })}
             <line x1="0" y1="500" x2="100%" y2="500" stroke="#fff" strokeWidth="2" />
          </g>

          {/* SIGHT LINE (LASER) */}
          <line 
            x1={launchPos.x} y1={launchPos.y} 
            x2={sightEnd.x} y2={sightEnd.y} 
            stroke="#facc15" strokeWidth="1" strokeDasharray="4,4" opacity="0.5" 
          />

          {/* DART */}
          <g transform={`translate(${dartPos.x}, ${dartPos.y}) rotate(${-angle})`}>
            {/* Dart Body */}
            <rect x="-10" y="-3" width="20" height="6" fill="#facc15" filter="url(#glow)" />
            {/* Velocity Vector */}
            <line x1="0" y1="0" x2="40" y2="0" stroke="#facc15" strokeWidth="2" markerEnd="url(#head-facc15)" opacity="0.6" />
          </g>
          
          {/* MONKEY */}
          <g transform={`translate(${monkeyPos.x}, ${monkeyPos.y})`}>
            <circle cx="0" cy="0" r="10" fill={hit ? "#00e676" : "#ef4444"} filter="url(#glow)" />
            <text x="15" y="5" fill="#ef4444" fontSize="10">MONKEY</text>
            {/* Gravity Vector */}
            {isRunning && !hit && (
               <line x1="0" y1="0" x2="0" y2="30" stroke="#ef4444" strokeWidth="2" markerEnd="url(#head-facc15)" />
            )}
          </g>

          {/* CANNON BASE */}
          <circle cx={launchPos.x} cy={launchPos.y} r="8" fill="#333" stroke="#666" />

          {/* HIT EFFECT */}
          {hit && (
             <g transform={`translate(${monkeyPos.x}, ${monkeyPos.y})`}>
                <circle cx="0" cy="0" r="30" fill="none" stroke="#fff" strokeWidth="2" opacity="0.5">
                   <animate attributeName="r" from="10" to="50" dur="0.5s" repeatCount="indefinite" />
                   <animate attributeName="opacity" from="1" to="0" dur="0.5s" repeatCount="indefinite" />
                </circle>
             </g>
          )}

        </svg>

      </main>
    </div>
  );
};

// --- SUB-COMPONENTS ---

const ControlRow = ({ label, val, min, max, step=1, set, unit }) => (
  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
    <span style={{ width: '70px', fontSize: '11px', color: '#888' }}>{label}</span>
    <input type="range" min={min} max={max} step={step} value={val} onChange={(e) => set(Number(e.target.value))} style={{ flex: 1, marginRight:'10px' }} />
    <span style={{ width: '35px', fontSize: '10px', color: '#fff', textAlign: 'right' }}>{val.toFixed(0)}{unit}</span>
  </div>
);

const btnStyle = (primary, color='#fff') => ({
  flex: 1, padding: '10px', 
  background: primary ? 'rgba(255,255,255,0.1)' : 'transparent',
  border: '1px solid', borderColor: primary ? color : '#333',
  color: primary ? color : '#888', 
  borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold'
});

export default MonkeyHunter;