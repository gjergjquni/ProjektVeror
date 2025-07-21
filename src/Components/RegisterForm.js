import React, { useState, useEffect } from 'react';
import PasswordInput from './PasswordInput';
import './AuthLayout.css';
import emailIcon from '../img/email-icon-removebg-preview.png';
import userIcon from '../img/user.icon.png';

function RegisterForm({ onSwitch }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [birthDay, setBirthDay] = useState('');
  const [birthMonth, setBirthMonth] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPasswordValid, setIsPasswordValid] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 480);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);



  const months = [
    'Janar', 'Shkurt', 'Mars', 'Prill', 'Maj', 'Qershor',
    'Korrik', 'Gusht', 'Shtator', 'Tetor', 'Nëntor', 'Dhjetor'
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Check if passwords are valid
    if (!isPasswordValid) {
      alert('Fjalëkalimi nuk plotëson kërkesat e sigurisë!');
      return;
    }
    
    if (password !== confirmPassword) {
      alert('Fjalëkalimet nuk përputhen!');
      return;
    }
    
    if (password.length === 0 || confirmPassword.length === 0) {
      alert('Ju lutem plotësoni të gjitha fushat!');
      return;
    }
    
    // Check if birth date is selected
    if (!birthDay || !birthMonth || !birthYear) {
      alert('Ju lutem zgjidhni datën e lindjes!');
      return;
    }


    
    alert(`Regjistrim: ${username} / ${email} / ${birthDay}/${birthMonth}/${birthYear}`);
  };

  return (
    <form className="login-glass" onSubmit={handleSubmit} style={{
      margin: '0 auto', 
      maxWidth: isMobile ? '95vw' : 600, 
      width: '100%',
      padding: isMobile ? '8px 16px' : '8px 20px', 
      fontSize: isMobile ? '1.1rem' : '1.32rem',
      boxSizing: 'border-box'
    }}>
      <h2 style={{
        textAlign: 'center', 
        marginBottom: isMobile ? 18 : 24, 
        fontWeight: 800, 
        fontSize: 'clamp(2.2rem, 5vw, 3.2rem)', 
        letterSpacing: 1
      }}>Krijo llogari</h2>
      <div style={{position: 'relative', marginBottom: isMobile ? 8 : 12}}>
        <span className="input-icon" style={{left: 10, top: '40%', position: 'absolute', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', height: 44}}>
          <img src={userIcon} alt="User" width={26} height={26} style={{display: 'block', filter: 'brightness(0) invert(1) brightness(1.5)'}} />
        </span>
        <input
          className="login-input"
          type="text"
          placeholder="Emri dhe Mbiemri"
          value={username}
          onChange={e => setUsername(e.target.value)}
          required
        />
      </div>
      <div style={{position: 'relative', marginBottom: isMobile ? 8 : 12}}>
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
      
      {/* Birth Date Fields */}
      <div style={{marginBottom: isMobile ? 8 : 12}}>
        <label style={{color: '#eaffff', fontSize: isMobile ? '1rem' : '1.1rem', marginBottom: isMobile ? 6 : 8, display: 'block'}}>Data e lindjes</label>
        <div className="birthdate-row">
          <select
            className="login-input birthdate-select"
            value={birthDay}
            onChange={e => setBirthDay(e.target.value)}
            required
          >
            <option value="">Dita</option>
            {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
              <option key={day} value={day}>{day}</option>
            ))}
          </select>
          <select
            className="login-input birthdate-select"
            value={birthMonth}
            onChange={e => setBirthMonth(e.target.value)}
            required
          >
            <option value="">Muaji</option>
            {months.map((month, index) => (
              <option key={index + 1} value={index + 1}>{month}</option>
            ))}
          </select>
          <select
            className="login-input birthdate-select"
            value={birthYear}
            onChange={e => setBirthYear(e.target.value)}
            required
          >
            <option value="">Viti</option>
            {years.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      </div>


      <div style={{marginBottom: isMobile ? 8 : 12}}>
        <PasswordInput
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Fjalëkalimi"
          name="password"
          required
          onValidationChange={setIsPasswordValid}
        />
      </div>
      <div style={{marginBottom: isMobile ? 12 : 16}}>
        <PasswordInput
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
          placeholder="Konfirmo fjalëkalimin"
          name="confirm-password"
          required
        />
      </div>
      <button type="submit" style={{
        width: isMobile ? '70%' : '50%',
        background: '#00b894',
        color: '#fff',
        border: 'none',
        borderRadius: isMobile ? 10 : 12,
        padding: isMobile ? '10px 0' : '12px 0',
        fontWeight: 700,
        fontSize: isMobile ? '1rem' : '1.15rem',
        marginTop: 12,
        boxShadow: '0 4px 20px rgba(0, 184, 148, 0.4)',
        cursor: 'pointer',
        letterSpacing: 1,
        transition: 'all 0.3s ease',
        minWidth: isMobile ? 120 : 160,
        display: 'block',
        margin: '12px auto 0 auto'
      }}
      onMouseOver={(e) => e.target.style.background = '#1dd1a1'}
      onMouseOut={(e) => e.target.style.background = '#00b894'}>
        Regjistrohu
      </button>
      <div style={{textAlign: 'center', marginTop: 12}}>
        
        <button type="button" className="form-link" style={{color: '#00eaff', background: 'none', border: 'none', fontWeight: 600, cursor: 'pointer', fontSize: '1.18rem'}} onClick={onSwitch}>Ke llogari? Kyçu këtu.</button>
      </div>
    </form>
  );
}

export default RegisterForm;