import React from 'react';
import './AuthLayout.css';
import logo1 from '../../img/logo1.png';

function AuthLayout({ children }) {
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