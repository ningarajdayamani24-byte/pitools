import React, { useState, useEffect, useRef } from 'react';

const WaveInterference = () => {
  const canvasRef = useRef(null);
  
  // Physics State
  const [separation, setSeparation] = useState(80); // Distance between sources
  const [wavelength, setWavelength] = useState(30);
  const [phaseDiff, setPhaseDiff] = useState(0); // Phase shift between sources in degrees
  const [isPlaying, setIsPlaying] = useState(true);
  
  // UI State
  const [viewMode, setViewMode] = useState('3d'); // '3d' or '2d'
  const timeRef = useRef(0);

  // NEW: Interaction State for 3D Dragging
  const dragRef = useRef({ isDragging: false, lastX: 0, lastY: 0, pitch: Math.PI / 6, yaw: Math.PI / 4 });

  // Theme matching pitools framework
  const theme = {
    bg: '#0a0a0c',
    panel: '#111114',
    border: '#2a2a35',
    text: '#ffffff',
    subText: '#888888',
    blue: '#2979ff',
    red: '#ff2a2a',
    green: '#00e676',
    yellow: '#ffd600',
    purple: '#b388ff',
    grid: 'rgba(255, 255, 255, 0.03)'
  };

  useEffect(() => {
    let frame;
    const animate = () => {
      if (isPlaying) {
        timeRef.current += 0.08;
      }
      draw();
      frame = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(frame);
  }, [isPlaying, separation, wavelength, phaseDiff, viewMode]);

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const t = timeRef.current;

    // Physics constants
    const A = viewMode === '3d' ? 30 : 1; // Amplitude
    const k = (2 * Math.PI) / wavelength; // Wave number
    const phi = (phaseDiff * Math.PI) / 180; // Phase shift in radians

    // Source positions (centered)
    const s1 = { x: -separation / 2, y: 0 };
    const s2 = { x: separation / 2, y: 0 };

    if (viewMode === '2d') {
      // HIGH PERFORMANCE 2D HEATMAP (Pixel Buffer Manipulation)
      const imgData = ctx.createImageData(width, height);
      const data = imgData.data;
      
      for (let py = 0; py < height; py++) {
        for (let px = 0; px < width; px++) {
          // Map screen coordinates to math coordinates (centered)
          const mx = px - width / 2;
          const my = py - height / 2;

          // Distances to sources
          const d1 = Math.hypot(mx - s1.x, my - s1.y);
          const d2 = Math.hypot(mx - s2.x, my - s2.y);

          // Superposition Equation
          const z1 = Math.sin(k * d1 - t);
          const z2 = Math.sin(k * d2 - t + phi);
          
          // Soft radial falloff for edges
          const distFromCenter = Math.hypot(mx, my);
          const falloff = Math.max(0, 1 - (distFromCenter / (width * 0.6)));
          
          const zTotal = (z1 + z2) * falloff; // Range: approx -2 to 2

          // Pixel Buffer Index (R, G, B, A)
          const index = (py * width + px) * 4;

          // Dynamic Color Mapping (Ripple Tank Style)
          let r = 10, g = 10, b = 12; // Theme background color base
          
          if (zTotal > 0) {
            // Crests (Bright Cyan/Blue)
            const intensity = zTotal / 2; // Normalize 0 to 1
            r = 10 + intensity * 31;  // Max 41 (theme.blue R)
            g = 10 + intensity * 111; // Max 121 (theme.blue G)
            b = 12 + intensity * 243; // Max 255 (theme.blue B)
          } else {
            // Troughs (Darker Blue)
            const intensity = Math.abs(zTotal) / 2;
            r = 10;
            g = 10 + intensity * 40;
            b = 12 + intensity * 120;
          }

          data[index] = r;
          data[index + 1] = g;
          data[index + 2] = b;
          data[index + 3] = 255; // Alpha fully opaque
        }
      }
      
      // Blast the pixels to the canvas
      ctx.putImageData(imgData, 0, 0);

      // Draw Source Markers
      ctx.fillStyle = theme.yellow;
      ctx.shadowBlur = 10;
      ctx.shadowColor = theme.yellow;
      ctx.beginPath(); ctx.arc(width/2 + s1.x, height/2 + s1.y, 4, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(width/2 + s2.x, height/2 + s2.y, 4, 0, Math.PI*2); ctx.fill();
      ctx.shadowBlur = 0;

    } else {
      // Clear Background for 3D Mode
      ctx.fillStyle = theme.bg;
      ctx.fillRect(0, 0, width, height);

      // 3D Isometric Wireframe Rendering
      const gridSize = 400;
      const step = 12; // Wireframe grid spacing resolution
      const cx = width / 2;
      const cy = height / 2 + 80; // Shifted down slightly

      // NEW: Interactive 3D Projection
      const project = (x, y, z) => {
        const { pitch, yaw } = dragRef.current;
        
        // Spin around Z axis (Yaw)
        const rotX = x * Math.cos(yaw) - y * Math.sin(yaw);
        const rotY = x * Math.sin(yaw) + y * Math.cos(yaw);
        
        // Tilt up/down (Pitch)
        const sx = cx + rotX;
        const sy = cy + rotY * Math.sin(pitch) - z * Math.cos(pitch);
        
        return { sx, sy };
      };

      ctx.lineWidth = 1.2;
      
      // Helper to calculate wave height at a specific point
      const getZ = (x, y) => {
        const d1 = Math.hypot(x - s1.x, y - s1.y);
        const d2 = Math.hypot(x - s2.x, y - s2.y);
        const distFromCenter = Math.hypot(x, y);
        const falloff = Math.exp(-Math.pow(distFromCenter / 250, 2));
        return (Math.sin(k * d1 - t) + Math.sin(k * d2 - t + phi)) * A * falloff;
      };

      // Draw X-axis grid lines (Color-mapped by Z height)
      for (let y = -gridSize; y <= gridSize; y += step) {
        for (let x = -gridSize; x < gridSize; x += step) {
          const zA = getZ(x, y);
          const pA = project(x, y, zA);
          
          const zB = getZ(x + step, y);
          const pB = project(x + step, y, zB);

          ctx.beginPath();
          ctx.moveTo(pA.sx, pA.sy);
          ctx.lineTo(pB.sx, pB.sy);
          
          // Z-Height Color Mapping: Troughs are dark blue, crests are bright cyan
          const avgZ = (zA + zB) / 2;
          const heightRatio = Math.max(0, Math.min(1, (avgZ + 2*A) / (4*A))); 
          // HSL: Hue shifts from 240 (Blue) to 180 (Cyan). Lightness increases at peaks.
          ctx.strokeStyle = `hsl(${240 - heightRatio * 60}, 100%, ${15 + heightRatio * 75}%)`;
          ctx.stroke();
        }
      }

      // Draw Y-axis grid lines
      for (let x = -gridSize; x <= gridSize; x += step) {
        for (let y = -gridSize; y < gridSize; y += step) {
          const zA = getZ(x, y);
          const pA = project(x, y, zA);
          
          const zB = getZ(x, y + step);
          const pB = project(x, y + step, zB);

          ctx.beginPath();
          ctx.moveTo(pA.sx, pA.sy);
          ctx.lineTo(pB.sx, pB.sy);
          
          const avgZ = (zA + zB) / 2;
          const heightRatio = Math.max(0, Math.min(1, (avgZ + 2*A) / (4*A))); 
          ctx.strokeStyle = `hsl(${240 - heightRatio * 60}, 100%, ${15 + heightRatio * 75}%)`;
          ctx.stroke();
        }
      }

      // Draw 3D Source Pillars
      const drawPillar = (sx, sy, isLeft) => {
         const { sx: px, sy: py } = project(sx, sy, 0);
         const zOffset = Math.sin(t + (isLeft ? 0 : phi)) * A;
         const top = project(sx, sy, 50 + zOffset);
         
         ctx.strokeStyle = theme.yellow;
         ctx.lineWidth = 2;
         ctx.shadowBlur = 15;
         ctx.shadowColor = theme.yellow;
         ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(top.sx, top.sy); ctx.stroke();
         ctx.fillStyle = '#fff';
         ctx.beginPath(); ctx.arc(top.sx, top.sy, 4, 0, Math.PI*2); ctx.fill();
         ctx.shadowBlur = 0;
      };
      drawPillar(s1.x, s1.y, true);
      drawPillar(s2.x, s2.y, false);
    }
  };

  // NEW: Pointer Event Handlers for Dragging
  const handlePointerDown = (e) => {
    if (viewMode !== '3d') return;
    dragRef.current.isDragging = true;
    dragRef.current.lastX = e.clientX || (e.touches && e.touches[0].clientX);
    dragRef.current.lastY = e.clientY || (e.touches && e.touches[0].clientY);
    e.currentTarget.style.cursor = 'grabbing';
  };

  const handlePointerMove = (e) => {
    if (!dragRef.current.isDragging || viewMode !== '3d') return;
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    if (!clientX || !clientY) return;

    const dx = clientX - dragRef.current.lastX;
    const dy = clientY - dragRef.current.lastY;
    
    dragRef.current.yaw -= dx * 0.01;
    dragRef.current.pitch -= dy * 0.01;
    
    // Clamp pitch to prevent flipping the camera upside down
    dragRef.current.pitch = Math.max(0.1, Math.min(Math.PI / 2.2, dragRef.current.pitch));
    
    dragRef.current.lastX = clientX;
    dragRef.current.lastY = clientY;
  };

  const handlePointerUp = (e) => {
    dragRef.current.isDragging = false;
    e.currentTarget.style.cursor = viewMode === '3d' ? 'grab' : 'default';
  };

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: theme.bg, color: theme.text, fontFamily: 'monospace' }}>
      
      {/* SIDEBAR PANEL */}
      <div style={{ 
        width: '380px', minWidth: '380px', padding: '25px', boxSizing: 'border-box', overflowY: 'auto',
        backgroundColor: theme.panel, borderRight: `1px solid ${theme.border}`, display: 'flex', flexDirection: 'column', zIndex: 10 
      }}>
        
        <h2 style={{ fontSize: '18px', letterSpacing: '1px', marginBottom: '10px' }}>WAVE INTERFERENCE</h2>
        <h3 style={{ fontSize: '11px', color: theme.subText, letterSpacing: '1px', marginBottom: '25px' }}>3D SUPERPOSITION</h3>

        <div style={{ padding: '15px', border: `1px solid ${theme.blue}`, borderRadius: '4px', marginBottom: '30px', fontSize: '11px', lineHeight: '1.6', backgroundColor: 'rgba(41, 121, 255, 0.05)' }}>
          <strong>DESTRUCTIVE INTERFERENCE (NODES):</strong> 
          <br/>Look for the perfectly flat lines radiating outwards. These are dead zones where a crest from Source 1 perfectly cancels a trough from Source 2.
        </div>

        {/* VIEW MODE TOGGLE */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '35px' }}>
          <button 
            onClick={() => setViewMode('3d')}
            style={modeBtnStyle(viewMode === '3d', theme.purple, theme)}
          >
            3D WIREFRAME MESH
          </button>
          <button 
            onClick={() => setViewMode('2d')}
            style={modeBtnStyle(viewMode === '2d', theme.red, theme)}
          >
            2D HEATMAP (TOP-DOWN)
          </button>
        </div>

        {/* CONTROLS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '25px', marginBottom: '35px' }}>
          
          <div>
            <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '10px', letterSpacing: '1px' }}>
              <span>SOURCE SEPARATION (d)</span>
              <span style={{ color: theme.yellow, fontWeight: 'bold' }}>{separation} px</span>
            </label>
            <input type="range" min="0" max="250" step="5" value={separation} onChange={(e) => setSeparation(Number(e.target.value))} style={sliderStyle(theme.yellow)} />
          </div>

          <div>
            <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '10px', letterSpacing: '1px' }}>
              <span>WAVELENGTH (λ)</span>
              <span style={{ color: theme.blue, fontWeight: 'bold' }}>{wavelength} px</span>
            </label>
            <input type="range" min="15" max="100" step="1" value={wavelength} onChange={(e) => setWavelength(Number(e.target.value))} style={sliderStyle(theme.blue)} />
          </div>

          <div>
            <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '10px', letterSpacing: '1px' }}>
              <span>PHASE DIFFERENCE (Δφ)</span>
              <span style={{ color: theme.green, fontWeight: 'bold' }}>{phaseDiff}°</span>
            </label>
            <input type="range" min="0" max="360" step="15" value={phaseDiff} onChange={(e) => setPhaseDiff(Number(e.target.value))} style={sliderStyle(theme.green)} />
            <div style={{ fontSize: '9px', color: theme.subText, marginTop: '8px' }}>
              Shift one source out of sync. Notice how the interference nodes physically rotate!
            </div>
          </div>

        </div>

        {/* PLAY/PAUSE */}
        <button 
          onClick={() => setIsPlaying(!isPlaying)}
          style={{ 
            width: '100%', padding: '14px', cursor: 'pointer', fontSize: '12px', marginTop: 'auto', flexShrink: 0,
            transition: 'all 0.3s ease', borderRadius: '4px', fontWeight: 'bold', letterSpacing: '2px',
            background: isPlaying ? 'rgba(255, 42, 42, 0.05)' : 'rgba(0, 230, 118, 0.05)', 
            border: `1px solid ${isPlaying ? theme.red : theme.green}`, 
            color: isPlaying ? theme.red : theme.green, 
            boxShadow: `0 0 15px ${isPlaying ? 'rgba(255, 42, 42, 0.15)' : 'rgba(0, 230, 118, 0.15)'}` 
          }}
        >
          {isPlaying ? 'PAUSE ANIMATION' : 'RESUME ANIMATION'}
        </button>
      </div>

      {/* CANVAS CONTAINER */}
      <div 
        style={{ flexGrow: 1, position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', cursor: viewMode === '3d' ? 'grab' : 'default' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <canvas ref={canvasRef} width={1000} height={700} style={{ display: 'block', maxWidth: '100%', touchAction: 'none' }} />
        
        {/* Hover Hint */}
        {viewMode === '3d' && (
          <div style={{ position: 'absolute', bottom: '30px', left: '50%', transform: 'translateX(-50%)', backgroundColor: 'rgba(0,0,0,0.6)', padding: '10px 20px', borderRadius: '20px', color: theme.subText, fontSize: '12px', letterSpacing: '2px', pointerEvents: 'none', border: `1px solid ${theme.border}` }}>
            <span style={{ color: theme.yellow }}>◆</span> CLICK & DRAG TO ROTATE
          </div>
        )}
      </div>
      
    </div>
  );
};

// Sleek UI Helpers
const modeBtnStyle = (isActive, color, theme) => ({
  flex: 1, padding: '12px 5px', fontSize: '10px', cursor: 'pointer', transition: 'all 0.2s', borderRadius: '4px', fontWeight: 'bold',
  backgroundColor: isActive ? `${color}22` : 'transparent',
  border: `1px solid ${isActive ? color : theme.border}`,
  color: isActive ? color : theme.subText,
  boxShadow: isActive ? `0 0 10px ${color}33` : 'none'
});

const sliderStyle = (color) => ({
  width: '100%', accentColor: color, cursor: 'pointer', height: '4px', background: '#222', borderRadius: '2px', outline: 'none'
});

export default WaveInterference;