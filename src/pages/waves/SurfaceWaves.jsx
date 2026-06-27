import React, { useState, useEffect, useRef } from 'react';

const SurfaceWaves = () => {
  const canvasRef = useRef(null);
  const [amplitude, setAmplitude] = useState(40);
  const [wavelength, setWavelength] = useState(200);
  const [speed, setSpeed] = useState(4.6);
  const [showCircles, setShowCircles] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  
  const timeRef = useRef(0);

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
    waterGradientTop: '#1a3a5e',
    waterGradientBottom: '#0a1a2e',
    grid: 'rgba(255, 255, 255, 0.05)'
  };

  useEffect(() => {
    let frame;
    const animate = () => {
      if (isPlaying) {
        timeRef.current += 0.05 * speed;
      }
      draw();
      frame = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(frame);
  }, [isPlaying, amplitude, wavelength, speed, showCircles]);

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const t = timeRef.current;
    
    // Water gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, theme.waterGradientTop);
    gradient.addColorStop(1, theme.waterGradientBottom);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Grid overlays
    ctx.strokeStyle = theme.grid;
    ctx.lineWidth = 1;
    for (let i = 0; i < width; i += 50) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, height); ctx.stroke(); }
    for (let i = 0; i < height; i += 50) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(width, i); ctx.stroke(); }

    const k = (2 * Math.PI) / wavelength;
    const getWaveY = (x) => amplitude * Math.sin(k * x - t);

    // Draw shaded wave envelope
    ctx.fillStyle = 'rgba(41, 121, 255, 0.15)';
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    for (let x = 0; x <= width; x++) {
      ctx.lineTo(x, height / 2 - getWaveY(x));
    }
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.fill();

    // Draw particle grid
    if (showCircles) {
      const rows = 8;
      const cols = 22;
      const spacingX = width / cols;
      const spacingY = 40;
      const startY = 150;

      for (let c = 0; c < cols; c++) {
        for (let r = 0; r < rows; r++) {
          const x = (c * spacingX) + (spacingX / 2);
          const yBase = startY + r * spacingY;
          const displacement = getWaveY(x);
          const y = yBase - displacement;

          // Highlight trackers: Keep these consistent with screenshot logic
          const isTrackerRed = (r === 0 && c === 9);
          const isTrackerGreen = (r === 5 && c === 4);
          
          ctx.shadowBlur = (isTrackerRed || isTrackerGreen) ? 15 : 0;
          ctx.shadowColor = isTrackerRed ? theme.red : (isTrackerGreen ? theme.green : 'transparent');
          ctx.fillStyle = isTrackerRed ? theme.red : (isTrackerGreen ? theme.green : '#ffffff');
          
          ctx.beginPath();
          ctx.arc(x, y, 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: theme.bg, color: theme.text, fontFamily: 'monospace' }}>
      <div style={{ width: '380px', padding: '25px', backgroundColor: theme.panel, borderRight: `1px solid ${theme.border}`, display: 'flex', flexDirection: 'column' }}>
        <h2 style={{ fontSize: '18px', marginBottom: '25px', borderBottom: `1px solid ${theme.border}`, paddingBottom: '15px' }}>SURFACE WAVES</h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
          <div>
            <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '10px' }}>
              <span>AMPLITUDE</span><span style={{ color: theme.blue }}>{amplitude}</span>
            </label>
            <input type="range" min="10" max="80" value={amplitude} onChange={e => setAmplitude(Number(e.target.value))} style={sliderStyle(theme.blue)} />
          </div>
          <div>
            <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '10px' }}>
              <span>WAVELENGTH</span><span style={{ color: theme.blue }}>{wavelength}</span>
            </label>
            <input type="range" min="50" max="400" value={wavelength} onChange={e => setWavelength(Number(e.target.value))} style={sliderStyle(theme.blue)} />
          </div>
          <div>
            <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '10px' }}>
              <span>SPEED</span><span style={{ color: theme.blue }}>{speed.toFixed(1)}</span>
            </label>
            <input type="range" min="1" max="10" step="0.1" value={speed} onChange={e => setSpeed(Number(e.target.value))} style={sliderStyle(theme.blue)} />
          </div>
        </div>

        <label style={{ marginTop: '30px', display: 'flex', alignItems: 'center', cursor: 'pointer', fontSize: '12px' }}>
          <input type="checkbox" checked={showCircles} onChange={e => setShowCircles(e.target.checked)} style={{ marginRight: '10px', accentColor: theme.blue }} />
          Show Particle Grid
        </label>

        <div style={{ display: 'flex', gap: '10px', marginTop: 'auto' }}>
          <button onClick={() => setIsPlaying(true)} style={btnStyle(theme.green)}>START</button>
          <button onClick={() => setIsPlaying(false)} style={btnStyle(theme.red)}>STOP</button>
        </div>
      </div>
      <canvas ref={canvasRef} width={1000} height={700} style={{ flexGrow: 1 }} />
    </div>
  );
};

const sliderStyle = (color) => ({ width: '100%', accentColor: color, cursor: 'pointer', height: '4px', background: '#333', borderRadius: '2px', outline: 'none' });
const btnStyle = (color) => ({ flex: 1, padding: '12px', background: 'transparent', border: `1px solid ${color}`, color, cursor: 'pointer', fontWeight: 'bold' });

export default SurfaceWaves;