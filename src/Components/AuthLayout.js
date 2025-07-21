import React from 'react';
import './AuthLayout.css';
import logo1 from '../img/logo1.png';

function AuthLayout({ children }) {
  // Responsive style for logo
  const logoStyle = {
    width: '100%',
    maxWidth: '750px',
    height: 'auto',
    maxHeight: '80vh',
    margin: '0 auto',
    display: 'block',
    objectFit: 'contain',
    filter: 'drop-shadow(0 4px 24px rgba(0,0,0,0.12))',
  };

  // Center logo as before
  const rightStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    background: 'transparent',
    padding: '2vw 1vw 2vw 4vw',
  };

  // Restore previous leftStyle with marginLeft and marginRight
  const leftStyle = {
    marginLeft: '2vw',
    marginRight: '18vw',
    maxWidth: '480px',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    minHeight: '100vh',
  };

  return (
    <div className="auth-layout">
      <div className="auth-left">
        <img 
          src={logo1} 
          alt="Logo" 
          className="logo"
        />
      </div>
      <div className="auth-right">
        {children}
      </div>
    </div>
  );
}

export default AuthLayout; 