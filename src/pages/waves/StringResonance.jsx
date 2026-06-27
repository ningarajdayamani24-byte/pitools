import React, { useState, useEffect, useRef } from 'react';

const StringResonance = () => {
  const canvasRef = useRef(null);
  
  // Physics State (Defaults matching the user's screenshot exactly for 8th harmonic)
  const [frequency, setFrequency] = useState(125); // Hz
  const [tension, setTension] = useState(50); // N
  const [density, setDensity] = useState(3.2); // x 10^-3 kg/m
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
    orange: '#ff9100',
    table: '#1a1a20',
    pulley: '#111',
    string: 'rgba(41, 121, 255, 0.9)',
    grid: 'rgba(255, 255, 255, 0.03)'
  };

  useEffect(() => {
    let frame;
    const animate = () => {
      if (isPlaying) {
        // Animation speed scales slightly with frequency for visual effect
        timeRef.current += (frequency * 0.0015);
      }
      draw();
      frame = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(frame);
  }, [isPlaying, frequency, tension, density]);

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const t = timeRef.current;

    // Clear background
    ctx.fillStyle = theme.bg;
    ctx.fillRect(0, 0, width, height);

    // Grid
    ctx.strokeStyle = theme.grid;
    ctx.lineWidth = 1;
    for (let i = 0; i < width; i += 50) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, height); ctx.stroke(); }
    for (let i = 0; i < height; i += 50) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(width, i); ctx.stroke(); }

    // Physics constants
    const L_phys = 4.0; // meters (Length of string)
    const mu = density * 1e-3; // kg/m
    const v = Math.sqrt(tension / mu); // Wave speed (m/s)
    const lambda = v / frequency; // Wavelength (m)
    
    // Number of half-wavelengths (harmonics) that fit in L
    const n_calc = (2 * L_phys) / lambda; 
    
    // Calculate resonance amplitude (Gaussian peak around integer values of n)
    const distFromInt = Math.abs(n_calc - Math.round(n_calc));
    // Base amplitude is small (driven wave), max amplitude occurs at resonance
    const maxAmp = 55;
    const minAmp = 5;
    const currentAmp = minAmp + (maxAmp - minAmp) * Math.exp(-Math.pow(distFromInt * 8, 2));

    // Drawing Constants
    const tableTop = 450;
    const pulleyX = 150;
    const pulleyY = 250;
    const forkX = 750;
    const stringL_px = forkX - pulleyX;

    
    // 1. Draw Table/Bench
    ctx.fillStyle = theme.table;
    ctx.strokeStyle = theme.border;
    ctx.lineWidth = 3;
    ctx.fillRect(pulleyX + 20, tableTop, width - pulleyX, height - tableTop + 10);
    ctx.strokeRect(pulleyX + 20, tableTop, width - pulleyX, height - tableTop + 10);

    // 2. Draw Pulley Mount & Wheel
    ctx.fillStyle = '#333';
    ctx.beginPath(); ctx.moveTo(pulleyX + 20, tableTop); ctx.lineTo(pulleyX, pulleyY); ctx.lineTo(pulleyX + 40, pulleyY); ctx.fill();
    ctx.fillStyle = theme.pulley;
    ctx.beginPath(); ctx.arc(pulleyX, pulleyY, 20, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#555'; ctx.lineWidth = 4; ctx.stroke();
    ctx.fillStyle = theme.blue; ctx.beginPath(); ctx.arc(pulleyX, pulleyY, 4, 0, Math.PI * 2); ctx.fill(); // Axle

    // 3. Draw Hanging Mass
    // Size scales with tension
    const massSize = 25 + (tension / 100) * 30; 
    const massX = pulleyX - 20;
    const massY = pulleyY + 100;
    
    // Vertical string to mass
    ctx.strokeStyle = '#aaa';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(massX, pulleyY); ctx.lineTo(massX, massY); ctx.stroke();
    
    // Mass block
    ctx.fillStyle = 'rgba(255, 145, 0, 0.1)';
    ctx.strokeStyle = theme.orange;
    ctx.lineWidth = 2;
    ctx.fillRect(massX - massSize/2, massY, massSize, massSize);
    ctx.strokeRect(massX - massSize/2, massY, massSize, massSize);
    
    // Mass Label
    ctx.fillStyle = '#fff';
    ctx.font = '12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`T = ${tension.toFixed(1)} N`, massX, massY + massSize + 20);

    // 4. Draw Tuning Fork
    const forkOscillation = Math.cos(t * 10) * 4; // Visual vibration
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // Base
    ctx.beginPath(); ctx.moveTo(forkX + 40, tableTop); ctx.lineTo(forkX + 40, pulleyY); ctx.stroke();
    // Prongs mechanism
    ctx.beginPath(); ctx.moveTo(forkX + 40, pulleyY); ctx.lineTo(forkX + 10, pulleyY); ctx.stroke();
    ctx.lineWidth = 4;
    // Top prong
    ctx.beginPath(); ctx.moveTo(forkX + 10, pulleyY); ctx.lineTo(forkX + 10, pulleyY - 15 + forkOscillation); ctx.lineTo(forkX - 30, pulleyY - 15 + forkOscillation); ctx.stroke();
    // Bottom prong
    ctx.beginPath(); ctx.moveTo(forkX + 10, pulleyY); ctx.lineTo(forkX + 10, pulleyY + 15 - forkOscillation); ctx.lineTo(forkX - 30, pulleyY + 15 - forkOscillation); ctx.stroke();
    
    // Fork Label
    ctx.fillStyle = '#fff';
    ctx.fillText(`f = ${frequency.toFixed(0)} Hz`, forkX, pulleyY - 40);

    
    // 5. Draw the String (Standing Wave)
    ctx.beginPath();
    ctx.strokeStyle = theme.string;
    ctx.lineWidth = 3;
    ctx.shadowBlur = currentAmp > 15 ? 12 : 2;
    ctx.shadowColor = theme.blue;
    
    // Wave spatial frequency mapping physics to pixels
    const k_px = (Math.PI * n_calc) / stringL_px; 
    
    for (let x = 0; x <= stringL_px; x++) {
      // The wave function. We use exact mathematical mapping so resonance is visually proven.
      const yDisplacement = currentAmp * Math.sin(k_px * x) * Math.cos(t);
      const drawX = pulleyX + x;
      const drawY = pulleyY - yDisplacement;
      
      if (x === 0) ctx.moveTo(drawX, drawY);
      else ctx.lineTo(drawX, drawY);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    
    // 6. Annotations (Length Arrow)
    const arrowY = 180;
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(pulleyX, arrowY); ctx.lineTo(forkX, arrowY); ctx.stroke();
    // Arrow heads
    ctx.beginPath(); ctx.moveTo(pulleyX+10, arrowY-5); ctx.lineTo(pulleyX, arrowY); ctx.lineTo(pulleyX+10, arrowY+5); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(forkX-10, arrowY-5); ctx.lineTo(forkX, arrowY); ctx.lineTo(forkX-10, arrowY+5); ctx.stroke();
    
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px monospace';
    ctx.fillText('L = 4.0 m', pulleyX + stringL_px/2, arrowY - 10);

    // 7. Equations Overlay (matching screenshot)
    ctx.fillStyle = theme.blue;
    ctx.font = 'italic 20px serif';
    ctx.textAlign = 'left';
    
    // lambda = v/f
    ctx.fillText('λ = v / f', pulleyX + 50, 100);
    
    // v = sqrt(T/mu)
    const eqX = forkX - 150;
    const eqY = 100;
    ctx.fillText('v = ', eqX, eqY);
    // Draw Square Root
    ctx.strokeStyle = theme.blue;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(eqX + 40, eqY - 5);
    ctx.lineTo(eqX + 45, eqY + 10);
    ctx.lineTo(eqX + 55, eqY - 25);
    ctx.lineTo(eqX + 85, eqY - 25);
    ctx.stroke();
    // Fraction T/mu
    ctx.font = 'italic 18px serif';
    ctx.fillText('T', eqX + 62, eqY - 10);
    ctx.fillText('μ', eqX + 62, eqY + 15);
    ctx.beginPath(); ctx.moveTo(eqX + 58, eqY + 0); ctx.lineTo(eqX + 80, eqY + 0); ctx.stroke();

    // 8. Dynamic Readouts (Status)
    ctx.fillStyle = theme.subText;
    ctx.font = '12px monospace';
    ctx.fillText(`Wave Speed (v): ${v.toFixed(1)} m/s`, 20, 30);
    ctx.fillText(`Wavelength (λ): ${lambda.toFixed(2)} m`, 20, 50);
    
    if (distFromInt < 0.05) {
      ctx.fillStyle = theme.green;
      ctx.shadowBlur = 8;
      ctx.shadowColor = theme.green;
      ctx.fillText(`RESONANCE ACHIEVED: ${Math.round(n_calc)}th Harmonic`, 20, 75);
      ctx.shadowBlur = 0;
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: theme.bg, color: theme.text, fontFamily: 'monospace' }}>
      
      {/* SIDEBAR */}
      <div style={{ width: '380px', padding: '25px', backgroundColor: theme.panel, borderRight: `1px solid ${theme.border}`, display: 'flex', flexDirection: 'column', zIndex: 10 }}>
        
        <h2 style={{ fontSize: '18px', letterSpacing: '1px', marginBottom: '10px' }}>STANDING WAVES</h2>
        <h3 style={{ fontSize: '11px', color: theme.subText, letterSpacing: '1px', marginBottom: '25px' }}>ON STRINGS (MELDE'S EXP.)</h3>

        <div style={{ padding: '15px', border: `1px solid ${theme.border}`, borderRadius: '4px', marginBottom: '35px', fontSize: '11px', lineHeight: '1.6', backgroundColor: 'rgba(255,255,255,0.02)' }}>
          Adjust the parameters to find resonant frequencies. Resonance occurs when the calculated harmonic (n) is a whole number.<br/><br/>
          <strong>Pro-Tip:</strong> Try 125 Hz, 3.2×10⁻³ kg/m, and 50 N.
        </div>

        {/* CONTROLS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
          
          {/* Frequency Slider */}
          <div>
            <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '10px', letterSpacing: '1px' }}>
              <span>VIBRATION FREQUENCY (f)</span>
              <span style={{ color: theme.blue, fontWeight: 'bold' }}>{frequency.toFixed(0)} Hz</span>
            </label>
            <input type="range" min="10" max="250" step="1" value={frequency} onChange={(e) => setFrequency(Number(e.target.value))} style={sliderStyle(theme.blue)} />
          </div>

          {/* Density Slider */}
          <div>
            <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '10px', letterSpacing: '1px' }}>
              <span>LINEAR DENSITY (μ)</span>
              <span style={{ color: theme.blue, fontWeight: 'bold' }}>{density.toFixed(1)} × 10⁻³ kg/m</span>
            </label>
            <input type="range" min="1.0" max="10.0" step="0.1" value={density} onChange={(e) => setDensity(Number(e.target.value))} style={sliderStyle(theme.blue)} />
          </div>

          {/* Tension Slider */}
          <div>
            <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '10px', letterSpacing: '1px' }}>
              <span>TENSION (T)</span>
              <span style={{ color: theme.blue, fontWeight: 'bold' }}>{tension.toFixed(0)} N</span>
            </label>
            <input type="range" min="10" max="150" step="1" value={tension} onChange={(e) => setTension(Number(e.target.value))} style={sliderStyle(theme.blue)} />
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
          {isPlaying ? 'PAUSE OSCILLATOR' : 'ACTIVATE OSCILLATOR'}
        </button>
      </div>

      {/* CANVAS */}
      <div style={{ flexGrow: 1, position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
        <canvas ref={canvasRef} width={1000} height={700} style={{ display: 'block', maxWidth: '100%' }} />
      </div>
      
    </div>
  );
};

// Helper for sleek sliders
const sliderStyle = (color) => ({
  width: '100%', 
  accentColor: color, 
  cursor: 'pointer', 
  height: '4px',
  background: '#222',
  borderRadius: '2px',
  outline: 'none'
});

export default StringResonance;