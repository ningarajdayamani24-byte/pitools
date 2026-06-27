import React, { useState } from 'react';
import { Link } from 'react-router-dom';

/* ================= DATA SOURCE ================= */
const TOPICS = [
  { id: 1, title: "SHM, Circular Motion, and Transverse Waves", desc: "Relate circular motion to simple harmonic motion and wave propagation.", path: "/waves/shm-circular-transverse" },
  { id: 2, title: "Simple Harmonic Motion: Mass on a Spring", desc: "Explore Hooke's Law, energy conservation, and oscillation period.", path: "/waves/mass-on-spring" },
  { id: 3, title: "Lissajous Figures", desc: "Complex 2D Harmonic Motion.",path: "/waves/lissajous" },
  { id: 4, title: "FourierSynthesizer", desc: "A step-by-step interactive  to fourier motion.", path: "/waves/fourier-synthesizer" },
  { id: 5, title: "acoustic-beats", desc: "Learn the fundamentals of acoustic-beats, frequency, and wavelength.", path: "/waves/acoustic-beats" },
  { id: 6, title: "Wave Pulse Interference and Superposition", desc: "Observe how two wave pulses add together when they meet.", path: "/waves/pulse-interference" },
  { id: 7, title: "Wave Pulse Interference and Superposition 2", desc: "Advanced scenarios of pulse superposition and wave passing.", path: "/waves/advanced-interference" },
  { id: 8, title: "Wave Pulse Superposition Practice", desc: "Interactive practice drawing resultant wave pulses.", path: "/waves/boundary-reflection" },
  { id: 9, title: "Superposition of Transverse Waves", desc: "Continuous transverse wave interference and beat frequencies.", path: "/waves/transverse-superposition", },
  { id: 10, title: "Oscillations", desc: "General properties of oscillating systems and periodic motion.", path: "/waves/phasor-projections", },
  { id: 11, title: "Oscillations and Phase Shift", desc: "Visualize phase differences between multiple oscillating sources.", path: "/waves/phase-shift" },
  { id: 12, title: "Longitudinal Waves", desc: "Visualize compressions and rarefactions in a medium.", path: "/waves/longitudinal" },
  { id: 13, title: "Longitudinal and Transverse Wave Basics", desc: "Compare particle motion in transverse versus longitudinal waves.", path: "/waves/comparison" },
  { id: 14, title: "Standing Waves", desc: "Explore nodes, antinodes, and resonance conditions.", path: "/waves/standing" },
  { id: 15, title: "Standing Waves on Strings", desc: "Harmonics and overtones on a string fixed at both ends.",  path: "/waves/string-resonance" },
  { id: 16, title: "Wave Pulse Reflection (Free & Fixed Ends)", desc: "Observe phase inversion at fixed boundaries versus free boundaries.", path: "/waves/reflection"  },
  { id: 17, title: "Air Column Resonance", desc: "Standing sound waves in open and closed pipes.",  path: "/waves/air-column"  },
  { id: 18, title: "Acoustic Levitation (Kundt's Tube)", desc: "Crazy Physics! Watch styrofoam beads get trapped in the silent nodes of a high-power longitudinal sound wave.", path: "/waves/kundt"},
  { id: 19, title: "The Doppler Effect & Sonic Boom", desc: "Frequency shifts from moving sources and shockwave formation.", path: "/waves/doppler" },
  { id: 20, title: "Wave Interference in 3D", desc: "Spatial interference patterns from multiple point sources.",path: "/waves/interference"  },
  { id: 21, title: "Surface Waves", desc: "Circular and plane wave propagation on a 2D surface.",path: "/waves/surface"  },
  { id: 22, title: "Chladni Figures (Cymatics)", desc: "Geometric patterns created by sound resonance.", path: "/waves/chladni" }
];

/* ================= MAIN COMPONENT ================= */
export default function Home() {
  return (
    <div style={styles.wrapper}>
      <h1 style={styles.header}>Waves & Oscillations Simulations</h1>
      
      <div style={styles.grid}>
        {TOPICS.map((topic) => (
          <MenuCard key={topic.id} topic={topic} />
        ))}
      </div>
    </div>
  );
}

/* ================= CARD COMPONENT ================= */
function MenuCard({ topic }) {
  const [hover, setHover] = useState(false);
  const imagePath = `/assets/waves/wave-${topic.id}.png`;

  return (
    <Link 
      to={topic.path} 
      style={{ textDecoration: 'none' }}
    >
      <div 
        style={{
          ...styles.card,
          // Added faint blue border and dim blue glow on hover
          borderColor: hover ? "rgba(0, 168, 255, 0.4)" : "#222",
          transform: hover ? "scale(1.03)" : "scale(1)",
          boxShadow: hover ? "0 10px 30px rgba(0, 168, 255, 0.15)" : "0 4px 10px rgba(0,0,0,0.3)"
        }}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        {/* IMAGE PREVIEW AREA */}
        <div style={styles.preview}>
          <div style={styles.gridPattern} />
          
          <img 
            src={imagePath} 
            alt={topic.title}
            style={{
              ...styles.image,
              opacity: hover ? 1 : 0.8,
              transform: hover ? "scale(1.05)" : "scale(1)"
            }}
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.parentNode.style.background = '#111';
            }}
          />
        </div>

        {/* TEXT CONTENT */}
        <div style={styles.content}>
          <h3 style={styles.title}>{topic.title}</h3>
          <p style={styles.desc}>{topic.desc}</p>
        </div>
      </div>
    </Link>
  );
}

/* ================= STYLES ================= */
const styles = {
  wrapper: {
    minHeight: '100vh',
    background: '#050505',
    color: '#fff',
    padding: '60px 40px',
    fontFamily: 'Inter, system-ui, sans-serif',
  },
  header: {
    fontSize: '24px',
    fontWeight: '400',
    letterSpacing: '1px',
    marginBottom: '40px',
    borderBottom: '1px solid #222',
    paddingBottom: '20px',
    color: '#eee'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '24px',
  },
  card: {
    background: '#0a0a0c',
    border: '1px solid #222',
    borderRadius: '12px',
    overflow: 'hidden',
    transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)', // Smoother scaling transition
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  },
  preview: {
    height: '180px',
    position: 'relative',
    borderBottom: '1px solid #1a1a1a',
    overflow: 'hidden',
    background: '#08080a',
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transition: 'all 0.5s ease',
    display: 'block',
  },
  gridPattern: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundImage: `
      linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)
    `,
    backgroundSize: '20px 20px',
    pointerEvents: 'none',
    zIndex: 1,
  },
  content: {
    padding: '20px',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  title: {
    fontSize: '16px',
    fontWeight: '600',
    margin: '0 0 8px 0',
    color: '#fff',
    lineHeight: '1.4',
  },
  desc: {
    fontSize: '13px',
    color: '#888',
    margin: 0,
    lineHeight: '1.5',
  },
};