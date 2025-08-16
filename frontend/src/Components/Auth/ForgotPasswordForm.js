import React, { useState } from 'react';
import './AuthLayout.css';
import emailIcon from '../../img/email-icon-removebg-preview.png';

function ForgotPasswordForm({ onBack }) {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="login-glass" style={{margin: '0 auto', maxWidth: 260}}>
        <h2 style={{textAlign: 'center', marginBottom: 18, fontWeight: 600, fontSize: '1.2rem', letterSpacing: 1}}>Ndrysho fjalëkalimin</h2>
        <p style={{textAlign: 'center', color: '#eaffff', fontSize: '1rem', marginBottom: 18}}>
          Nëse ekziston një llogari me këtë email, do të marrësh udhëzime për ndryshim.
        </p>
        <button className="form-link" style={{color: '#00eaff', background: 'none', border: 'none', fontWeight: 600, cursor: 'pointer', fontSize: '0.98rem', display: 'block', margin: '0 auto'}} onClick={onBack}>Kthehu te kyçja</button>
      </div>
    );
  }

  return (
    <form className="login-glass" onSubmit={handleSubmit} style={{margin: '0 auto', maxWidth: 600, padding: '48px 36px', fontSize: '1.32rem'}}>
      <h2 style={{textAlign: 'center', marginBottom: 26, fontWeight: 700, fontSize: '2.4rem', letterSpacing: 1}}>Ndrysho fjalëkalimin</h2>
      <div style={{position: 'relative', marginBottom: 12}}>
        <span className="input-icon" style={{left: 14, position: 'absolute', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', height: 44}}>
          <img src={emailIcon} alt="Email" width={22} height={22} style={{display: 'block', filter: 'brightness(0) invert(1)'}} />
        </span>
        <input
          className="login-input"
          type="email"
          placeholder="Shkruaj emailin"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          style={{paddingLeft: 44, height: 44}}
        />
      </div>
      <button type="submit" className="center-btn" style={{background: '#00eaff', color: '#003b4a', border: 'none', borderRadius: 8, padding: '16px 0', fontWeight: 700, fontSize: '1.22rem', marginTop: 8, boxShadow: '0 2px 15px #00eaff44', cursor: 'pointer', letterSpacing: 1}}>Dërgo</button>
      <div style={{textAlign: 'center', marginTop: 12}}>
        <button type="button" className="form-link" style={{color: '#00eaff', background: 'none', border: 'none', fontWeight: 600, cursor: 'pointer', fontSize: '1.18rem'}} onClick={onBack}>Kthehu te kyçja</button>
      </div>
    </form>
  );
}

export default ForgotPasswordForm; 