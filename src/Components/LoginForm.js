// Importimi i librarive të nevojshme nga React
import React, { useState } from 'react';
// Importimi i stileve CSS
import './AuthLayout.css';
// Importimi i ikonës së email-it
import emailIcon from '../img/email-icon-removebg-preview.png';

// Komponenti i formularit të login-it
function LoginForm({ onSwitch, onForgotPassword, onLogin }) {
  // State për të ruajtur email-in e përdoruesit
  const [email, setEmail] = useState('');
  
  // State për të ruajtur fjalëkalimin e përdoruesit
  const [password, setPassword] = useState('');

  // Funksioni që thirret kur përdoruesi dërgon formularin
  const handleSubmit = (e) => {
    e.preventDefault(); // Parandalon refresh-in e faqes
    
    // Kontrollo nëse të dy fushat janë plotësuar
    if (email.trim() && password.trim()) {
      // Nëse janë plotësuar, thirr funksionin e login-it me email-in
      onLogin(email);
    } else {
      // Nëse nuk janë plotësuar, shfaq një alert
      alert('Ju lutem plotësoni të gjitha fushat!');
    }
  };

  return (
    // Formulari kryesor i login-it me stilet e glass effect
    <form className="login-glass" onSubmit={handleSubmit} style={{ maxWidth: 600, padding: '48px 36px', fontSize: '1.32rem'}}>
      {/* Titulli i formularit */}
      <h2 style={{textAlign: 'center', marginBottom: 26, fontWeight: 700, fontSize: '2.4rem', letterSpacing: 1}}>Kyçu në llogari</h2>
      
      {/* Kontenieri për input-in e email-it */}
      <div style={{position: 'relative', marginBottom: 12}}>
        {/* Ikona e email-it brenda input-it */}
        <span className="input-icon" style={{left: 14, top: '40%', position: 'absolute', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', height: 44}}>
          <img src={emailIcon} alt="Email" width={22} height={22} style={{display: 'block', filter: 'brightness(0) invert(1)'}} />
        </span>
        
        {/* Input-i për email-in */}
        <input
          className="login-input"
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)} // Përditëson state-in kur ndryshon vlera
          required // Fusha e detyrueshme
          style={{paddingLeft: 44, height: 44}} // Stilet për të lënë vend për ikonën
        />
      </div>
      
      {/* Kontenieri për input-in e fjalëkalimit */}
      <div style={{position: 'relative', marginBottom: 12}}>
        {/* Ikona e fjalëkalimit brenda input-it */}
        <span className="input-icon" style={{left: 14, top: '40%', position: 'absolute', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', height: 44}}>
          {/* Lock SVG */}
          <svg width={22} height={22} viewBox="0 0 24 24" fill="none" style={{filter: 'brightness(0) invert(1)'}}>
            <path d="M17 11V7a5 5 0 10-10 0v4" stroke="#00eaff" strokeWidth="1.5"/>
            <rect x="5" y="11" width="14" height="9" rx="2.5" stroke="#00eaff" strokeWidth="1.5"/>
            <circle cx="12" cy="15.5" r="1.5" fill="#00eaff"/>
          </svg>
        </span>
        
        {/* Input-i për fjalëkalimin */}
        <input
          className="login-input"
          type="password"
          placeholder="Fjalëkalimi"
          value={password}
          onChange={e => setPassword(e.target.value)} // Përditëson state-in kur ndryshon vlera
          required // Fusha e detyrueshme
          style={{paddingLeft: 44, height: 44}} // Stilet për të lënë vend për ikonën
        />
      </div>
      
      {/* Link-u për "Harruat fjalëkalimin" */}
      <div style={{textAlign: 'right', marginBottom: 10}}>
        <button 
          type="button" 
          className="form-link" 
          style={{color: '#00eaff', background: 'none', border: 'none', fontWeight: 500, cursor: 'pointer', fontSize: '0.97rem', padding: 0}} 
          onClick={onForgotPassword} // Thirr funksionin për të kaluar në faqen e harruar fjalëkalimin
        >
          Ke harruar fjalëkalimin?
        </button>
      </div>
      
      {/* Butoni kryesor për të bërë login */}
      <button 
        type="submit" 
        style={{
          width: '28%', 
          background: '#00b894', 
          color: '#fff', 
          border: 'none', 
          borderRadius: 8, 
          padding: '4px 0', 
          fontWeight: 700, 
          fontSize: '0.8rem', 
          marginTop: 8, 
          boxShadow: '0 4px 20px rgba(0, 184, 148, 0.4)', 
          cursor: 'pointer', 
          letterSpacing: 1, 
          transition: 'all 0.3s ease', 
          margin: '8px auto 0 auto', 
          display: 'block'
        }} 
        onMouseOver={(e) => e.target.style.background = '#1dd1a1'} // Ndryshon ngjyrën në hover
        onMouseOut={(e) => e.target.style.background = '#00b894'} // Kthen ngjyrën origjinale
      >
        Kyçu
      </button>
      
      {/* Link-u për të kaluar në regjistrim */}
      <div style={{textAlign: 'center', marginTop: 12}}>
        <button 
          type="button" 
          className="form-link" 
          style={{color: '#00eaff', background: 'none', border: 'none', fontWeight: 600, cursor: 'pointer', fontSize: '1.18rem'}} 
          onClick={onSwitch} // Thirr funksionin për të kaluar në regjistrim
        >
          Nuk ke llogari? Regjistrohu këtu.
        </button>
      </div>
    </form>
  );
}

// Eksportimi i komponentit LoginForm
export default LoginForm;