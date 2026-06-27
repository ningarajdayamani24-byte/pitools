import React from 'react';

const ComingSoon = () => {
  const theme = {
    bg: '#0a0a0c',
    text: '#ffffff',
    subText: '#888888',
    blue: '#2979ff'
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh', 
      backgroundColor: theme.bg, 
      color: theme.text, 
      fontFamily: 'monospace' 
    }}>
      <div style={{ 
        width: '60px', 
        height: '60px', 
        border: `2px solid ${theme.blue}`, 
        borderRadius: '50%', 
        marginBottom: '20px',
        animation: 'spin 2s linear infinite'
      }} />
      
      <h1 style={{ fontSize: '24px', letterSpacing: '4px', marginBottom: '10px' }}>COMING SOON</h1>
      <p style={{ color: theme.subText, fontSize: '12px', letterSpacing: '2px' }}>NEW PHYSICS SIMULATION IN DEVELOPMENT</p>

      {/* CSS Animation defined locally */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default ComingSoon;