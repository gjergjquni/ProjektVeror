import React, { useState } from 'react';
import PasswordInput from './PasswordInput';
import './AuthLayout.css';
import emailIcon from '../img/email-icon-removebg-preview.png';

function LoginForm({ onSwitch, onForgotPassword, onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email.trim() && password.trim()) {
      onLogin(email);
    } else {
      alert('Ju lutem plotësoni të gjitha fushat!');
    }
  };

  return (
    <form className="login-glass" onSubmit={handleSubmit} style={{ maxWidth: 600, padding: '48px 36px', fontSize: '1.32rem'}}>
      <h2 style={{textAlign: 'center', marginBottom: 26, fontWeight: 700, fontSize: '2.4rem', letterSpacing: 1}}>Kyçu në llogari</h2>
      <div style={{position: 'relative', marginBottom: 12}}>
        <span className="input-icon" style={{left: 14, top: '40%', position: 'absolute', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', height: 44}}>
          <img src={emailIcon} alt="Email" width={22} height={22} style={{display: 'block', filter: 'brightness(0) invert(1)'}} />
        </span>
        <input
          className="login-input"
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          style={{paddingLeft: 44, height: 44}}
        />
      </div>
      <div style={{marginBottom: 7}}>
        <PasswordInput
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Fjalëkalimi"
          name="password"
          required
        />
      </div>
      <div style={{textAlign: 'right', marginBottom: 10}}>
        <button type="button" className="form-link" style={{color: '#00eaff', background: 'none', border: 'none', fontWeight: 500, cursor: 'pointer', fontSize: '0.97rem', padding: 0}} onClick={onForgotPassword}>
          Ke harruar fjalëkalimin?
        </button>
      </div>
      <button type="submit" style={{width: '28%', background: '#00b894', color: '#fff', border: 'none', borderRadius: 8, padding: '4px 0', fontWeight: 700, fontSize: '0.8rem', marginTop: 8, boxShadow: '0 4px 20px rgba(0, 184, 148, 0.4)', cursor: 'pointer', letterSpacing: 1, transition: 'all 0.3s ease', margin: '8px auto 0 auto', display: 'block'}} onMouseOver={(e) => e.target.style.background = '#1dd1a1'} onMouseOut={(e) => e.target.style.background = '#00b894'}>Kyçu</button>
      <div style={{textAlign: 'center', marginTop: 12}}>
        
        <button type="button" className="form-link" style={{color: '#00eaff', background: 'none', border: 'none', fontWeight: 600, cursor: 'pointer', fontSize: '1.18rem'}} onClick={onSwitch}>Nuk ke llogari? Regjistrohu këtu.</button>
      </div>
    </form>
  );
}

export default LoginForm;