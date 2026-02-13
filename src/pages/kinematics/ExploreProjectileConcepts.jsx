import React, { useState, useEffect, useRef } from 'react';

const ExploreProjectileConcepts = () => {
  // --- CONFIG ---
  const DT = 0.05;
  const SCALE = 8; // Pixels per meter

  // --- STATE ---
  const [v0, setV0] = useState(40);
  const [activeAngles, setActiveAngles] = useState([
    { id: 1, angle: 30, color: '#ef4444', enabled: true },
    { id: 2, angle: 45, color: '#3b82f6', enabled: true },
    { id: 3, angle: 60, color: '#22c55e', enabled: true },
    { id: 4, angle: 75, color: '#a855f7', enabled: false },
    { id: 5, angle: 15, color: '#facc15', enabled: false },
  ]);
  
  const [t, setT] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  
  const requestRef = useRef();

  // --- PHYSICS ENGINE ---
  const toRad = (deg) => (deg * Math.PI) / 180;
  const g = 9.8;

  // Calculate flight time for a specific angle
  const getFlightTime = (angle) => {
    const vy0 = v0 * Math.sin(toRad(angle));
    return (2 * vy0) / g;
  };

  const calcState = (angle, time) => {
    const vx = v0 * Math.cos(toRad(angle));
    const vy0 = v0 * Math.sin(toRad(angle));
    
    // Position
    const x = vx * time;
    const y = vy0 * time - 0.5 * g * time * time;
    
    // Velocity
    const vy = vy0 - g * time;
    
    return { x, y, vx, vy };
  };

  // Animation Loop
  const animate = () => {
    // Determine the longest flight time among active balls
    let maxFlightTime = 0;
    activeAngles.forEach(p => {
      if (p.enabled) {
        const ft = getFlightTime(p.angle);
        if (ft > maxFlightTime) maxFlightTime = ft;
      }
    });

    // If current time exceeds the longest flight, stop.
    if (t > maxFlightTime + 0.1) {
      setIsRunning(false);
      return;
    }

    setT(prev => prev + DT);
    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    if (isRunning) requestRef.current = requestAnimationFrame(animate);
    else cancelAnimationFrame(requestRef.current);
    return () => cancelAnimationFrame(requestRef.current);
  }, [isRunning, activeAngles, t]); 

  const handleFire = () => {
    setT(0);
    setIsRunning(true);
  };

  const handleReset = () => {
    setIsRunning(false);
    setT(0);
  };

  const toggleAngle = (id) => {
    setActiveAngles(prev => prev.map(p => p.id === id ? { ...p, enabled: !p.enabled } : p));
  };

  const updateAngle = (id, newAngle) => {
    setActiveAngles(prev => prev.map(p => p.id === id ? { ...p, angle: Number(newAngle) } : p));
    handleReset();
  };

  // --- PRESETS ---
  const applyPreset = (type) => {
    handleReset();
    let newConfig = [...activeAngles];
    switch (type) {
      case 'complementary':
        newConfig[0] = { ...newConfig[0], angle: 30, enabled: true };
        newConfig[1] = { ...newConfig[1], angle: 60, enabled: true };
        newConfig[2] = { ...newConfig[2], angle: 45, enabled: true }; 
        newConfig[3] = { ...newConfig[3], enabled: false };
        newConfig[4] = { ...newConfig[4], enabled: false };
        break;
      case 'fan':
        newConfig.forEach((p, i) => {
          p.angle = 15 * (i + 1);
          p.enabled = true;
        });
        break;
      case 'max_range':
        newConfig[0] = { ...newConfig[0], angle: 35, enabled: true };
        newConfig[1] = { ...newConfig[1], angle: 45, enabled: true };
        newConfig[2] = { ...newConfig[2], angle: 55, enabled: true };
        newConfig[3] = { ...newConfig[3], enabled: false };
        newConfig[4] = { ...newConfig[4], enabled: false };
        break;
      default: break;
    }
    setActiveAngles(newConfig);
  };

  // --- RENDER HELPERS ---
  const ORIGIN_X = 60; 
  const ORIGIN_Y = 520;

  const toSVG = (x, y) => ({
    x: ORIGIN_X + x * SCALE,
    y: ORIGIN_Y - y * SCALE
  });

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#000', color: '#fff', fontFamily: 'monospace', overflow: 'hidden' }}>
      
      {/* SIDEBAR */}
      <aside style={{ width: '360px', background: '#0a0a0a', borderRight: '1px solid #222', padding: '20px', overflowY: 'auto' }}>
        <h2 style={{ fontSize: '16px', letterSpacing: '2px', color: '#fff', marginBottom: '20px', borderBottom:'1px solid #333', paddingBottom:'10px' }}>PROJECTILE COMPARISON</h2>

        {/* MAIN CONTROLS */}
        <div style={{ marginBottom: '20px', padding: '15px', background: '#111', borderLeft: '4px solid #fff' }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#fff', fontSize: '14px' }}>GLOBAL SETTINGS</h4>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ width: '90px', fontSize: '12px', color: '#ccc' }}>Speed (v₀)</span>
            <input type="range" min={10} max={60} value={v0} onChange={(e) => setV0(Number(e.target.value))} style={{ flex: 1, marginRight:'10px' }} />
            <span style={{ fontSize: '12px', color: '#fff', fontWeight:'bold' }}>{v0} m/s</span>
          </div>
        </div>

        {/* ANGLE SLIDERS */}
        <div style={{ marginBottom: '20px' }}>
           <h4 style={{ fontSize: '12px', color: '#ccc', marginBottom: '10px' }}>ACTIVE PROJECTILES</h4>
           {activeAngles.map((p) => (
             <div key={p.id} style={{ display: 'flex', alignItems: 'center', marginBottom: '8px', opacity: p.enabled ? 1 : 0.4 }}>
               <input type="checkbox" checked={p.enabled} onChange={() => toggleAngle(p.id)} style={{ accentColor: p.color, marginRight:'10px', transform:'scale(1.2)' }} />
               <input 
                 type="range" min={0} max={90} value={p.angle} 
                 onChange={(e) => updateAngle(p.id, e.target.value)} 
                 disabled={!p.enabled}
                 style={{ flex: 1, accentColor: p.color }}
               />
               <span style={{ width: '35px', textAlign: 'right', fontSize: '12px', color: p.color, fontWeight:'bold', marginLeft:'8px' }}>{p.angle}°</span>
             </div>
           ))}
        </div>

        {/* PRESETS */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <button onClick={() => applyPreset('complementary')} style={presetBtnStyle}>COMPLEMENTARY (30°/60°)</button>
          <button onClick={() => applyPreset('fan')} style={presetBtnStyle}>FAN (15°-75°)</button>
          <button onClick={() => applyPreset('max_range')} style={presetBtnStyle}>MAX RANGE TEST</button>
        </div>

        {/* PLAYBACK */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <button onClick={handleFire} style={btnStyle(true, '#fff')}>LAUNCH ALL</button>
          <button onClick={handleReset} style={btnStyle(false)}>RESET</button>
        </div>

        {/* LIVE DATA TABLE */}
        <div style={{ background: '#111', borderRadius: '6px', border: '1px solid #333', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
            <thead>
              <tr style={{ background: '#222', color: '#fff' }}>
                <th style={thStyle}>#</th>
                <th style={thStyle}>Angle</th>
                <th style={thStyle}>Height</th>
                <th style={thStyle}>Range</th>
              </tr>
            </thead>
            <tbody>
              {activeAngles.map((p) => {
                if (!p.enabled) return null;
                // Calculate state using capped time
                const ft = getFlightTime(p.angle);
                const effectiveT = Math.min(t, ft);
                const s = calcState(p.angle, effectiveT);
                
                return (
                  <tr key={p.id} style={{ borderBottom: '1px solid #333' }}>
                    <td style={{...tdStyle, color: p.color, fontWeight:'bold' }}>P{p.id}</td>
                    <td style={{...tdStyle, color: '#fff'}}>{p.angle}°</td>
                    <td style={tdStyle}>{s.y.toFixed(1)}m</td>
                    <td style={tdStyle}>{s.x.toFixed(1)}m</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

      </aside>

      {/* MAIN VIEWPORT */}
      <main style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <svg width="100%" height="100%" style={{ background: '#000' }}>
          <defs>
            <filter id="glow"><feGaussianBlur stdDeviation="3" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
          </defs>

          {/* GRID */}
          <g>
             {/* Vertical Lines & Numbers (X-AXIS) */}
             {Array.from({ length: 40 }).map((_, i) => {
               const val = i * 10;
               const pos = ORIGIN_X + i * SCALE * 10; 
               return (
                 <g key={`v${i}`}>
                   <line x1={pos} y1={0} x2={pos} y2="100%" stroke="#333" strokeWidth="1" />
                   {/* Bright White Numbers */}
                   <text x={pos} y={ORIGIN_Y + 20} fill="#e5e5e5" fontSize="11" fontWeight="bold" textAnchor="middle">{val}</text>
                 </g>
               );
             })}

             {/* Horizontal Lines & Numbers (Y-AXIS) */}
             {Array.from({ length: 20 }).map((_, i) => {
               const val = i * 10;
               const pos = ORIGIN_Y - i * SCALE * 10; 
               return (
                 <g key={`h${i}`}>
                   <line x1={0} y1={pos} x2="100%" y2={pos} stroke="#333" strokeWidth="1" />
                   {/* Bright White Numbers */}
                   <text x={ORIGIN_X - 10} y={pos + 4} fill="#e5e5e5" fontSize="11" fontWeight="bold" textAnchor="end">{val}</text>
                 </g>
               );
             })}
             
             {/* Main Axes */}
             <line x1={0} y1={ORIGIN_Y} x2="100%" y2={ORIGIN_Y} stroke="#fff" strokeWidth="2" />
             <line x1={ORIGIN_X} y1={0} x2={ORIGIN_X} y2="100%" stroke="#fff" strokeWidth="2" />
             
             {/* Labels */}
             <text x={ORIGIN_X + 10} y={20} fill="#888" fontSize="12">HEIGHT (m)</text>
             <text x={ORIGIN_X + 800} y={ORIGIN_Y - 10} fill="#888" fontSize="12">RANGE (m)</text>
          </g>

          {/* PROJECTILES */}
          {activeAngles.map(p => {
             if (!p.enabled) return null;
             
             // --- CRITICAL PHYSICS FIX ---
             // Calculate max flight time for this specific ball
             const flightTime = getFlightTime(p.angle);
             
             // The ball stops updating position after it lands
             const effectiveT = Math.min(t, flightTime);

             // Calculate path up to effective time
             let trailD = "";
             for(let time = 0; time <= effectiveT; time+=0.1) {
                const s = calcState(p.angle, time);
                const pos = toSVG(s.x, s.y);
                trailD += `${time===0?"M":"L"} ${pos.x} ${pos.y} `;
             }
             // Ensure the final point is the exact landing spot
             const final = calcState(p.angle, effectiveT);
             const finalPos = toSVG(final.x, final.y);
             trailD += `L ${finalPos.x} ${finalPos.y}`;

             return (
               <g key={p.id}>
                 {/* Trail */}
                 <path d={trailD} stroke={p.color} strokeWidth="3" fill="none" filter="url(#glow)" opacity="0.9" />
                 
                 {/* Ball */}
                 <circle cx={finalPos.x} cy={finalPos.y} r="6" fill="#fff" filter="url(#glow)" />
                 
                 {/* Range Label on Graph (only if landed) */}
                 {t >= flightTime && (
                    <text x={finalPos.x} y={finalPos.y + 20} fill={p.color} fontSize="11" fontWeight="bold" textAnchor="middle">
                      {final.x.toFixed(0)}m
                    </text>
                 )}
               </g>
             );
          })}

        </svg>
      </main>
    </div>
  );
};

// --- STYLES ---

const btnStyle = (primary, color='#fff') => ({
  flex: 1, padding: '12px', 
  background: primary ? '#222' : 'transparent',
  border: '1px solid', borderColor: primary ? color : '#333',
  color: primary ? color : '#888', 
  borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold'
});

const presetBtnStyle = {
  flex: '1 1 30%', padding: '10px',
  background: '#151515', border: '1px solid #444',
  color: '#ccc', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold'
};

const thStyle = { padding: '10px', textAlign: 'left', fontWeight: 'bold', borderBottom: '2px solid #444' };
const tdStyle = { padding: '10px', color: '#e5e5e5', borderBottom: '1px solid #333' };

export default ExploreProjectileConcepts;