import React, { useState, useRef } from "react";

const VectorComponents = () => {
  // --- CONFIG ---
  const W = 900;
  const H = 600;
  const GRID = 50;

  // --- STATE ---
  // We store Cartesian (x,y) but controls will allow Polar (Mag, Angle) manipulation
  const [vec, setVec] = useState({ x: 5, y: 3 });
  const [scale, setScale] = useState(1.0);
  
  // Toggles
  const [showGrid, setShowGrid] = useState(true);
  const [showEquations, setShowEquations] = useState(true);
  const [componentStyle, setComponentStyle] = useState('axis'); // 'axis' or 'tip-to-tail'

  const svgRef = useRef(null);
  const dragRef = useRef(null);

  // --- MATH ---
  const origin = { x: W / 2, y: H / 2 };
  const mag = Math.hypot(vec.x, vec.y);
  let angle = (Math.atan2(vec.y, vec.x) * 180) / Math.PI;
  if (angle < 0) angle += 360;

  const toSVG = (x, y) => ({
    x: origin.x + x * GRID * scale,
    y: origin.y - y * GRID * scale,
  });

  const fromSVG = (svgX, svgY) => ({
    x: (svgX - origin.x) / (GRID * scale),
    y: -(svgY - origin.y) / (GRID * scale),
  });

  // --- INTERACTION ---
  const handleMouseDown = () => (dragRef.current = true);
  
  const handleMouseMove = (e) => {
    if (!dragRef.current || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const pos = fromSVG(e.clientX - rect.left, e.clientY - rect.top);
    // Snap to 0.1
    setVec({ 
      x: Math.round(pos.x * 10) / 10, 
      y: Math.round(pos.y * 10) / 10 
    });
  };

  const handleMouseUp = () => (dragRef.current = false);

  // Update from Polar Inputs (Sliders)
  const updateFromPolar = (newMag, newAngle) => {
    const rad = (newAngle * Math.PI) / 180;
    setVec({
      x: newMag * Math.cos(rad),
      y: newMag * Math.sin(rad)
    });
  };

  // --- RENDERERS ---
  const renderArrowDef = (id, color) => (
    <marker id={id} markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
      <path d="M0,0 L0,6 L9,3 z" fill={color} />
    </marker>
  );

  const renderVector = (v, start, color, label, isDashed = false) => {
    const s = toSVG(start.x, start.y);
    const e = toSVG(start.x + v.x, start.y + v.y);
    const mid = { x: (s.x + e.x) / 2, y: (s.y + e.y) / 2 };

    return (
      <g>
        <line
          x1={s.x} y1={s.y} x2={e.x} y2={e.y}
          stroke={color} strokeWidth={isDashed ? 2 : 4}
          strokeDasharray={isDashed ? "5,5" : "none"}
          markerEnd={`url(#head-${color.replace('#', '')})`}
          style={{ filter: isDashed ? 'none' : 'url(#glow)' }}
        />
        {label && (
          <text 
            x={mid.x + 10} y={mid.y - 10} 
            fill={color} fontSize="12" fontWeight="bold"
            style={{ textShadow: `0 0 5px ${color}` }}
          >
            {label}
          </text>
        )}
      </g>
    );
  };

  const renderProjectionLines = () => {
    const o = toSVG(0, 0);
    const xEnd = toSVG(vec.x, 0);
    const yEnd = toSVG(0, vec.y);
    const tip = toSVG(vec.x, vec.y);

    return (
      <g opacity="0.3">
        {/* Vertical Drop */}
        <line x1={xEnd.x} y1={xEnd.y} x2={tip.x} y2={tip.y} stroke="#ff4444" strokeWidth="1" strokeDasharray="4,4"/>
        {/* Horizontal Drop */}
        <line x1={yEnd.x} y1={yEnd.y} x2={tip.x} y2={tip.y} stroke="#448aff" strokeWidth="1" strokeDasharray="4,4"/>
      </g>
    );
  };

  const renderAngleArc = (radius = 40) => {
    const endAngle = -angle * (Math.PI / 180);
    const start = { x: origin.x + radius, y: origin.y };
    const end = { x: origin.x + radius * Math.cos(endAngle), y: origin.y + radius * Math.sin(endAngle) };
    const largeArcFlag = angle > 180 ? 1 : 0;
    
    return (
      <path 
        d={`M ${origin.x} ${origin.y} L ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y} Z`}
        fill="#ffffff" fillOpacity="0.1" stroke="#ffffff" strokeWidth="1"
      />
    );
  };

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#000', color: '#fff', fontFamily: 'monospace', overflow: 'hidden' }}>
      
      {/* SIDEBAR */}
      <aside style={{ width: '300px', background: '#0a0a0a', borderRight: '1px solid #222', padding: '20px', overflowY: 'auto' }}>
        <h2 style={{ fontSize: '14px', letterSpacing: '2px', color: '#888', marginBottom: '20px' }}>COMPONENT LAB</h2>

        <div style={{ marginBottom: '20px', padding: '15px', background: '#111', borderLeft: '4px solid #fff' }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#fff' }}>POLAR CONTROLS</h4>
          
          <label style={{ fontSize: '11px', color: '#888' }}>Magnitude (|R|): {mag.toFixed(2)}</label>
          <input 
            type="range" min="0" max="10" step="0.1" 
            value={mag} 
            onChange={(e) => updateFromPolar(Number(e.target.value), angle)} 
            style={{ width: '100%' }} 
          />
          
          <label style={{ fontSize: '11px', color: '#888' }}>Angle (θ): {angle.toFixed(1)}°</label>
          <input 
            type="range" min="0" max="360" step="1" 
            value={angle} 
            onChange={(e) => updateFromPolar(mag, Number(e.target.value))} 
            style={{ width: '100%' }} 
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontSize: '11px' }}>Zoom: {scale.toFixed(1)}x</label>
          <input type="range" min="0.5" max="2" step="0.1" value={scale} onChange={(e) => setScale(Number(e.target.value))} style={{ width: '100%' }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button onClick={() => setComponentStyle(componentStyle === 'axis' ? 'tip' : 'axis')} style={btnStyle(false)}>
             STYLE: {componentStyle === 'axis' ? "ON AXES" : "TIP-TO-TAIL"}
          </button>
          <button onClick={() => setShowEquations(!showEquations)} style={btnStyle(showEquations)}>MATH HUD: {showEquations ? "ON" : "OFF"}</button>
          <button onClick={() => setShowGrid(!showGrid)} style={btnStyle(showGrid)}>GRID: {showGrid ? "ON" : "OFF"}</button>
          <button onClick={() => { setVec({x:5,y:3}); setScale(1); }} style={{...btnStyle(false), borderColor: '#ff4444', color: '#ff4444'}}>RESET</button>
        </div>
      </aside>

      {/* CANVAS */}
      <main style={{ flex: 1, position: 'relative' }}>
        <svg 
          ref={svgRef}
          width="100%" height="100%" 
          style={{ background: '#000', cursor: dragRef.current ? 'grabbing' : 'default' }}
          onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}
        >
          <defs>
            <filter id="glow"><feGaussianBlur stdDeviation="2" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
            {renderArrowDef('head-ff4444', '#ff4444')}
            {renderArrowDef('head-448aff', '#448aff')}
            {renderArrowDef('head-ffffff', '#ffffff')}
          </defs>

          {/* GRID */}
          {showGrid && (
            <g>
               {Array.from({ length: 41 }).map((_, i) => {
                const num = i - 20; const pos = origin.x + num * GRID * scale;
                if (num === 0) return null;
                return <g key={`v${i}`}><line x1={pos} y1={0} x2={pos} y2={H*2} stroke="#222" strokeWidth="1"/><text x={pos} y={origin.y+15} fill="#444" fontSize="10" textAnchor="middle">{num}</text></g>;
              })}
              {Array.from({ length: 41 }).map((_, i) => {
                const num = 20 - i; const pos = origin.y - num * GRID * scale;
                if (num === 0) return null;
                return <g key={`h${i}`}><line x1={0} y1={pos} x2={W*2} y2={pos} stroke="#222" strokeWidth="1"/><text x={origin.x-8} y={pos+3} fill="#444" fontSize="10" textAnchor="end">{num}</text></g>;
              })}
              <line x1={origin.x} y1={0} x2={origin.x} y2={H*2} stroke="#444" strokeWidth="2"/>
              <line x1={0} y1={origin.y} x2={W*2} y2={origin.y} stroke="#444" strokeWidth="2"/>
            </g>
          )}

          {/* VISUALS */}
          {renderAngleArc()}
          {renderProjectionLines()}

          {/* X Component (Red) */}
          {renderVector(
            { x: vec.x, y: 0 }, 
            { x: 0, y: 0 }, 
            '#ff4444', 
            `Rx (${vec.x.toFixed(1)})`
          )}

          {/* Y Component (Blue) */}
          {renderVector(
            { x: 0, y: vec.y }, 
            componentStyle === 'axis' ? { x: 0, y: 0 } : { x: vec.x, y: 0 }, 
            '#448aff', 
            `Ry (${vec.y.toFixed(1)})`
          )}

          {/* Resultant (White) */}
          {renderVector(vec, { x: 0, y: 0 }, '#ffffff', 'R')}
          
          {/* Drag Handle */}
          <circle
            cx={toSVG(vec.x, vec.y).x} cy={toSVG(vec.x, vec.y).y} r={12}
            fill="#fff" fillOpacity="0.2" stroke="#fff" strokeWidth="2"
            style={{ cursor: 'pointer' }}
            onMouseDown={handleMouseDown}
          />
        </svg>

        {/* HUD */}
        {showEquations && (
          <div style={{ position: 'absolute', top: 20, right: 20, background: 'rgba(20,20,20,0.95)', border: '1px solid #333', borderRadius: '8px', padding: '20px', width: '280px' }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '12px', color: '#fff', borderBottom: '1px solid #333', paddingBottom: '5px' }}>TRIGONOMETRY</h3>
            
            <div style={{ marginBottom: '15px', color: '#ff4444', fontFamily: 'monospace' }}>
              <div style={{fontSize:'14px', marginBottom:'5px'}}>R<sub style={{fontSize:'10px'}}>x</sub> = |R| cos(θ)</div>
              <div style={{color:'#888', fontSize:'12px'}}>= {mag.toFixed(2)} × cos({angle.toFixed(0)}°)</div>
              <div style={{fontWeight:'bold', fontSize:'16px'}}>= {vec.x.toFixed(2)}</div>
            </div>

            <div style={{ marginBottom: '15px', color: '#448aff', fontFamily: 'monospace' }}>
              <div style={{fontSize:'14px', marginBottom:'5px'}}>R<sub style={{fontSize:'10px'}}>y</sub> = |R| sin(θ)</div>
              <div style={{color:'#888', fontSize:'12px'}}>= {mag.toFixed(2)} × sin({angle.toFixed(0)}°)</div>
              <div style={{fontWeight:'bold', fontSize:'16px'}}>= {vec.y.toFixed(2)}</div>
            </div>

            <div style={{ borderTop: '1px solid #333', paddingTop: '10px', color: '#fff', fontSize: '11px', lineHeight: '1.5' }}>
              |R| = √({vec.x.toFixed(1)}² + {vec.y.toFixed(1)}²) = <strong>{mag.toFixed(2)}</strong>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

const btnStyle = (active) => ({
  padding: '8px', background: active ? '#222' : 'transparent',
  border: '1px solid', borderColor: active ? '#fff' : '#333',
  color: active ? '#fff' : '#666', borderRadius: '4px', cursor: 'pointer', fontSize: '10px', width: '100%'
});

export default VectorComponents;