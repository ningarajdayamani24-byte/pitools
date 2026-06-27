import React, { useState, useEffect, useRef } from 'react';

const DopplerEffect = () => {
  const canvasRef = useRef(null);
  
  // Physics State
  const [machNumber, setMachNumber] = useState(0.5); // Ratio of source speed to wave speed
  const [frequency, setFrequency] = useState(15); // Emission rate
  const [isPlaying, setIsPlaying] = useState(true);
  const [showMachCone, setShowMachCone] = useState(true);
  const [showObservers, setShowObservers] = useState(true);
  
  const timeRef = useRef(0);
  const sourceRef = useRef({ x: 0, y: 0 });
  const wavesRef = useRef([]); // Stores { x, y, radius, birthTime }
  const frameCountRef = useRef(0);

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
    wave: 'rgba(41, 121, 255, 0.4)', // Base wave color
    grid: 'rgba(255, 255, 255, 0.03)'
  };

  const WAVE_SPEED = 2.5; // Constant speed of sound/waves in the medium

  useEffect(() => {
    let frame;
    const canvas = canvasRef.current;
    sourceRef.current.y = canvas ? canvas.height / 2 : 350;

    const animate = () => {
      if (isPlaying) {
        timeRef.current += 1;
        frameCountRef.current += 1;
        updatePhysics();
      }
      draw();
      frame = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(frame);
  }, [isPlaying, machNumber, frequency, showMachCone]);

  // Clear waves when resetting or jumping heavily
  const resetSimulation = () => {
    wavesRef.current = [];
    sourceRef.current.x = 0;
  };

  const updatePhysics = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // 1. Move the source
    const sourceSpeed = WAVE_SPEED * machNumber;
    sourceRef.current.x += sourceSpeed;

    // Wrap around screen
    if (sourceRef.current.x > canvas.width + 100) {
      sourceRef.current.x = -50;
      wavesRef.current = []; // Clear old waves to avoid mess when wrapping
    }

    // 2. Emit new waves based on frequency
    // Higher frequency = lower frame interval between emissions
    const emitInterval = Math.max(2, Math.floor(60 / frequency));
    
    if (frameCountRef.current % emitInterval === 0) {
      wavesRef.current.push({
        x: sourceRef.current.x,
        y: sourceRef.current.y,
        radius: 0,
        opacity: 1.0
      });
    }

    // 3. Update existing waves (grow radius, fade out)
    for (let i = wavesRef.current.length - 1; i >= 0; i--) {
      let wave = wavesRef.current[i];
      wave.radius += WAVE_SPEED;
      // Fade out as they get larger to simulate energy dissipation (inverse square law visual)
      wave.opacity = Math.max(0, 1 - (wave.radius / 600)); 
      
      // Remove dead waves
      if (wave.opacity <= 0 || wave.radius > 800) {
        wavesRef.current.splice(i, 1);
      }
    }
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Clear & Grid
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = theme.bg;
    ctx.fillRect(0, 0, width, height);
    
    ctx.strokeStyle = theme.grid;
    ctx.lineWidth = 1;
    for (let i = 0; i < width; i += 50) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, height); ctx.stroke(); }
    for (let i = 0; i < height; i += 50) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(width, i); ctx.stroke(); }

    // Center equilibrium line
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.setLineDash([5, 5]);
    ctx.beginPath(); ctx.moveTo(0, height/2); ctx.lineTo(width, height/2); ctx.stroke();
    ctx.setLineDash([]);

    // DRAW WAVES
    // Using 'lighter' blend mode creates the intense glowing shockwave when rings stack up
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineWidth = 2;

    wavesRef.current.forEach(wave => {
      ctx.beginPath();
      ctx.strokeStyle = `rgba(41, 121, 255, ${wave.opacity * 0.6})`;
      ctx.arc(wave.x, wave.y, wave.radius, 0, Math.PI * 2);
      ctx.stroke();
    });

    ctx.globalCompositeOperation = 'source-over'; // Reset blend mode

    const sx = sourceRef.current.x;
    const sy = sourceRef.current.y;

    // DRAW MACH CONE (If Supersonic)
    if (showMachCone && machNumber > 1.0 && sx > 0) {
      // Mach angle formula: sin(theta) = v_wave / v_source = 1 / Mach
      const machAngle = Math.asin(1 / machNumber);
      
      const coneLength = 800; // How far back to draw the lines
      
      // Calculate tangent vectors
      const dx1 = -coneLength * Math.cos(machAngle);
      const dy1 = -coneLength * Math.sin(machAngle);
      const dy2 = coneLength * Math.sin(machAngle);

      ctx.beginPath();
      ctx.strokeStyle = theme.red;
      ctx.lineWidth = 2;
      ctx.setLineDash([10, 10]);
      ctx.shadowBlur = 15;
      ctx.shadowColor = theme.red;
      
      // Top line
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + dx1, sy + dy1);
      
      // Bottom line
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + dx1, sy + dy2);
      
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.shadowBlur = 0;
      
      // Cone Label
      ctx.fillStyle = theme.red;
      ctx.font = '12px monospace';
      ctx.fillText(`Shockwave Front`, sx - 150, sy - 80);
    }

    // DRAW OBSERVERS / RECEIVERS
    if (showObservers) {
      const rxBack = 150;
      const rxFront = 850;
      const obsY = sy + 60; // Place antennas slightly below the flight path
      
      let backHit = false;
      let frontHit = false;
      
      // Collision detection for antenna flashing
      wavesRef.current.forEach(wave => {
        const distBack = Math.hypot(wave.x - rxBack, wave.y - obsY);
        if (Math.abs(distBack - wave.radius) < WAVE_SPEED * 1.5) backHit = true;
        
        const distFront = Math.hypot(wave.x - rxFront, wave.y - obsY);
        if (Math.abs(distFront - wave.radius) < WAVE_SPEED * 1.5) frontHit = true;
      });

      const drawObserver = (x, y, isHit, label, fPerceived) => {
        ctx.fillStyle = '#222';
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 2;
        
        // Antenna Stand
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 20); ctx.stroke();
        // Base
        ctx.fillRect(x - 15, y + 20, 30, 8);
        
        // Radar Dish
        ctx.beginPath();
        ctx.arc(x, y, 12, 0, Math.PI, true);
        ctx.fillStyle = '#444';
        ctx.fill();
        ctx.stroke();
        
        // Flashing Sensor
        ctx.beginPath();
        ctx.arc(x, y - 5, 4, 0, Math.PI * 2);
        ctx.fillStyle = isHit ? theme.green : '#111';
        ctx.shadowBlur = isHit ? 15 : 0;
        ctx.shadowColor = theme.green;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Labels
        ctx.textAlign = 'center';
        ctx.fillStyle = theme.text;
        ctx.font = '10px monospace';
        ctx.fillText(label, x, y + 40);
        ctx.fillStyle = isHit ? theme.green : theme.blue;
        ctx.font = 'bold 13px monospace';
        ctx.fillText(fPerceived, x, y - 18);
      };

      // Doppler Math Calculation
      const fBack = (frequency / (1 + machNumber)).toFixed(1) + " Hz";
      const fFront = machNumber < 1 ? (frequency / (1 - machNumber)).toFixed(1) + " Hz" : "BOOM!";

      drawObserver(rxBack, obsY, backHit, "OBSERVER A", fBack);
      drawObserver(rxFront, obsY, frontHit, "OBSERVER B", fFront);
    }

    // DRAW SOURCE OBJECT
    ctx.fillStyle = '#fff';
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#fff';
    ctx.beginPath();
    // Draw a little jet/arrow shape
    ctx.moveTo(sx + 15, sy);
    ctx.lineTo(sx - 10, sy - 10);
    ctx.lineTo(sx - 5, sy);
    ctx.lineTo(sx - 10, sy + 10);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    
    // Status Text on Canvas
    let statusText = "Subsonic";
    let statusColor = theme.blue;
    if (Math.abs(machNumber - 1.0) < 0.05) {
        statusText = "Transonic (Sound Barrier)";
        statusColor = theme.yellow;
    } else if (machNumber > 1.0) {
        statusText = "SUPERSONIC";
        statusColor = theme.red;
    }

    ctx.fillStyle = statusColor;
    ctx.font = 'bold 18px monospace';
    ctx.fillText(statusText, 20, 30);
    
    ctx.fillStyle = theme.subText;
    ctx.font = '12px monospace';
    ctx.fillText(`Source Speed: Mach ${machNumber.toFixed(2)}`, 20, 50);
    ctx.fillText(`Wave Speed: Mach 1.0`, 20, 70);
  };

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: theme.bg, color: theme.text, fontFamily: 'monospace' }}>
      
      {/* SIDEBAR */}
      <div style={{ 
        width: '380px', minWidth: '380px', padding: '25px', boxSizing: 'border-box', overflowY: 'auto',
        backgroundColor: theme.panel, borderRight: `1px solid ${theme.border}`, display: 'flex', flexDirection: 'column', zIndex: 10 
      }}>
        
        <h2 style={{ fontSize: '18px', letterSpacing: '1px', marginBottom: '10px' }}>DOPPLER EFFECT</h2>
        <h3 style={{ fontSize: '11px', color: theme.subText, letterSpacing: '1px', marginBottom: '25px' }}>& SONIC BOOMS</h3>

        <div style={{ padding: '15px', border: `1px solid ${machNumber >= 1 ? theme.red : theme.blue}`, borderRadius: '4px', marginBottom: '35px', fontSize: '11px', lineHeight: '1.6', backgroundColor: 'rgba(255,255,255,0.02)', transition: 'border 0.3s' }}>
          {machNumber < 1 ? (
            <span><strong>DOPPLER EFFECT:</strong> Waves compress in front of the source (higher frequency/pitch) and stretch behind it (lower frequency/pitch).</span>
          ) : (
            <span style={{ color: theme.red }}><strong>SHOCKWAVE (MACH CONE):</strong> The source is moving faster than its own waves. The waves pile up on top of each other, creating a high-pressure Sonic Boom boundary.</span>
          )}
        </div>

        {/* SLIDERS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '25px', marginBottom: '35px' }}>
          
          <div>
            <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '10px', letterSpacing: '1px' }}>
              <span>SOURCE SPEED (Mach)</span>
              <span style={{ color: machNumber >= 1 ? theme.red : theme.green, fontWeight: 'bold' }}>{machNumber.toFixed(2)}</span>
            </label>
            <input 
              type="range" min="0" max="2.5" step="0.05" 
              value={machNumber} 
              onChange={(e) => setMachNumber(Number(e.target.value))} 
              style={sliderStyle(machNumber >= 1 ? theme.red : theme.green)} 
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#555', marginTop: '5px' }}>
              <span>0 (Stationary)</span>
              <span>1 (Speed of Sound)</span>
              <span>2.5 (Hypersonic)</span>
            </div>
          </div>

          <div>
            <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '10px', letterSpacing: '1px' }}>
              <span>EMISSION FREQUENCY</span>
              <span style={{ color: theme.blue, fontWeight: 'bold' }}>{frequency} Hz</span>
            </label>
            <input 
              type="range" min="2" max="30" step="1" 
              value={frequency} 
              onChange={(e) => setFrequency(Number(e.target.value))} 
              style={sliderStyle(theme.blue)} 
            />
          </div>

        </div>

        {/* DOPPLER MATH PANEL */}
        <div style={{ padding: '15px', border: `1px solid ${theme.border}`, borderRadius: '4px', marginBottom: '25px', backgroundColor: 'rgba(0,0,0,0.2)' }}>
          <h3 style={{ fontSize: '10px', color: theme.subText, letterSpacing: '1px', marginBottom: '12px' }}>PERCEIVED FREQUENCY (f')</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '8px' }}>
            <span style={{ color: theme.text }}>Behind Source:</span>
            <span style={{ color: theme.blue, fontWeight: 'bold' }}>{(frequency / (1 + machNumber)).toFixed(1)} Hz</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
            <span style={{ color: theme.text }}>In Front of Source:</span>
            <span style={{ color: machNumber < 1 ? theme.blue : theme.red, fontWeight: 'bold' }}>
              {machNumber < 1 ? (frequency / (1 - machNumber)).toFixed(1) + " Hz" : "SHOCKWAVE"}
            </span>
          </div>
        </div>

        {/* TOGGLES */}
        <div style={{ borderTop: `1px solid ${theme.border}`, paddingTop: '25px', marginBottom: '30px' }}>
          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', opacity: machNumber > 1 ? 1 : 0.3, transition: '0.3s' }}>
            <input 
              type="checkbox" 
              checked={showMachCone} 
              onChange={(e) => setShowMachCone(e.target.checked)} 
              disabled={machNumber <= 1}
              style={{ width: '16px', height: '16px', accentColor: theme.red, marginRight: '10px', cursor: 'pointer' }} 
            />
            <span style={{ fontSize: '12px', color: showMachCone && machNumber > 1 ? theme.red : theme.subText }}>Show Mach Cone Overlay</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', marginTop: '15px' }}>
            <input 
              type="checkbox" 
              checked={showObservers} 
              onChange={(e) => setShowObservers(e.target.checked)} 
              style={{ width: '16px', height: '16px', accentColor: theme.blue, marginRight: '10px', cursor: 'pointer' }} 
            />
            <span style={{ fontSize: '12px', color: showObservers ? theme.blue : theme.subText, transition: '0.3s' }}>Show Stationary Radar Observers</span>
          </label>
        </div>

        {/* ACTION BUTTONS */}
        <div style={{ display: 'flex', gap: '10px', marginTop: 'auto' }}>
            <button 
                onClick={resetSimulation}
                style={{ 
                flex: 1, padding: '14px', cursor: 'pointer', fontSize: '11px', 
                transition: 'all 0.2s', borderRadius: '4px', fontWeight: 'bold', letterSpacing: '1px',
                backgroundColor: 'rgba(255, 255, 255, 0.05)', border: `1px solid #555`, color: '#fff' 
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.1)'}
                onMouseOut={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.05)'}
            >
                RESET
            </button>

            <button 
                onClick={() => setIsPlaying(!isPlaying)}
                style={{ 
                flex: 2, padding: '14px', cursor: 'pointer', fontSize: '11px', flexShrink: 0,
                transition: 'all 0.3s ease', borderRadius: '4px', fontWeight: 'bold', letterSpacing: '1px',
                background: isPlaying ? 'rgba(255, 214, 0, 0.05)' : 'rgba(0, 230, 118, 0.05)', 
                border: `1px solid ${isPlaying ? theme.yellow : theme.green}`, 
                color: isPlaying ? theme.yellow : theme.green, 
                boxShadow: `0 0 15px ${isPlaying ? 'rgba(255, 214, 0, 0.15)' : 'rgba(0, 230, 118, 0.15)'}` 
                }}
            >
                {isPlaying ? 'PAUSE ANIMATION' : 'RESUME ANIMATION'}
            </button>
        </div>
      </div>

      {/* CANVAS */}
      <div style={{ flexGrow: 1, position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
        <canvas ref={canvasRef} width={1000} height={700} style={{ display: 'block', maxWidth: '100%' }} />
      </div>
      
    </div>
  );
};

// Sleek Slider Style
const sliderStyle = (color) => ({
  width: '100%', 
  accentColor: color, 
  cursor: 'pointer', 
  height: '4px',
  background: '#222',
  borderRadius: '2px',
  outline: 'none'
});

export default DopplerEffect;