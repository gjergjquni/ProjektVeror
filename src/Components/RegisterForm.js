// Importimi i librarive të nevojshme nga React
import React, { useState, useEffect } from 'react';
// Importimi i stileve CSS
import './AuthLayout.css';
// Importimi i ikonave
import emailIcon from '../img/email-icon-removebg-preview.png';
import userIcon from '../img/user.icon.png';

// Komponenti i formularit të regjistrimit
function RegisterForm({ onSwitch }) {
  // State për të ruajtur të dhënat e formularit
  const [username, setUsername] = useState(''); // Emri dhe mbiemri
  const [email, setEmail] = useState(''); // Email-i
  const [birthDay, setBirthDay] = useState(''); // Dita e lindjes
  const [birthMonth, setBirthMonth] = useState(''); // Muaji i lindjes
  const [birthYear, setBirthYear] = useState(''); // Viti i lindjes
  const [password, setPassword] = useState(''); // Fjalëkalimi
  const [confirmPassword, setConfirmPassword] = useState(''); // Konfirmimi i fjalëkalimit
  const [isMobile, setIsMobile] = useState(false); // A është ekrani mobile

  // Hook për të kontrolluar madhësinë e ekranit
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 425); // Konsidero mobile nëse gjerësia < 425px
    };
    
    checkScreenSize(); // Kontrollo menjëherë
    window.addEventListener('resize', checkScreenSize); // Shto listener për ndryshimin e madhësisë
    
    return () => window.removeEventListener('resize', checkScreenSize); // Pastro listener-in
  }, []);

  // Lista e muajve në shqip
  const months = [
    'Janar', 'Shkurt', 'Mars', 'Prill', 'Maj', 'Qershor',
    'Korrik', 'Gusht', 'Shtator', 'Tetor', 'Nëntor', 'Dhjetor'
  ];

  // Viti aktual dhe lista e viteve të kaluara (100 vite mbrapa)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i);

  // Funksioni që thirret kur përdoruesi dërgon formularin
  const handleSubmit = (e) => {
    e.preventDefault(); // Parandalon refresh-in e faqes
    
    // Kontrollo nëse fjalëkalimet përputhen
    if (password !== confirmPassword) {
      alert('Fjalëkalimet nuk përputhen!');
      return;
    }
    
    // Kontrollo nëse fushat e fjalëkalimit janë plotësuar
    if (password.length === 0 || confirmPassword.length === 0) {
      alert('Ju lutem plotësoni të gjitha fushat!');
      return;
    }
    
    // Kontrollo nëse data e lindjes është zgjedhur
    if (!birthDay || !birthMonth || !birthYear) {
      alert('Ju lutem zgjidhni datën e lindjes!');
      return;
    }

    // Shfaq një alert me të dhënat e regjistrimit (për demo)
    alert(`Regjistrim: ${username} / ${email} / ${birthDay}/${birthMonth}/${birthYear}`);
  };

  return (
    // Formulari kryesor i regjistrimit me stilet e glass effect
    <form className="login-glass" onSubmit={handleSubmit} style={{
      margin: '0 auto', 
      maxWidth: isMobile ? '98vw' : 600, // Gjerësia e ndryshueshme për mobile
      width: '100%',
      padding: isMobile ? '12px 8px' : '8px 20px', // Padding i ndryshueshëm
      fontSize: isMobile ? '0.95rem' : '1.32rem', // Madhësia e fontit e ndryshueshme
      boxSizing: 'border-box'
    }}>
      {/* Titulli i formularit */}
      <h2 style={{
        textAlign: 'center', 
        marginBottom: isMobile ? 12 : 24, 
        fontWeight: 800, 
        fontSize: isMobile ? '1.4rem' : 'clamp(2.2rem, 5vw, 3.2rem)', // Font i ndryshueshëm
        letterSpacing: 1
      }}>Krijo llogari</h2>
      
      {/* Kontenieri për input-in e emrit */}
      <div style={{position: 'relative', marginBottom: isMobile ? 6 : 12}}>
        {/* Ikona e përdoruesit */}
        <span className="input-icon" style={{
          left: isMobile ? 8 : 10, 
          top: '40%', 
          position: 'absolute', 
          transform: 'translateY(-50%)', 
          display: 'flex', 
          alignItems: 'center', 
          height: isMobile ? 36 : 44
        }}>
          <img src={userIcon} alt="User" width={isMobile ? 20 : 26} height={isMobile ? 20 : 26} style={{display: 'block', filter: 'brightness(0) invert(1) brightness(1.5)'}} />
        </span>
        {/* Input-i për emrin dhe mbiemrin */}
        <input
          className="login-input"
          type="text"
          placeholder="Emri dhe Mbiemri"
          value={username}
          onChange={e => setUsername(e.target.value)} // Përditëson state-in
          required // Fusha e detyrueshme
          style={isMobile ? {paddingLeft: 36, height: 36} : {}}
        />
      </div>
      
      {/* Kontenieri për input-in e email-it */}
      <div style={{position: 'relative', marginBottom: isMobile ? 6 : 12}}>
        {/* Ikona e email-it */}
        <span className="input-icon" style={{
          left: isMobile ? 8 : 14, 
          top: '40%', 
          position: 'absolute', 
          transform: 'translateY(-50%)', 
          display: 'flex', 
          alignItems: 'center', 
          height: isMobile ? 36 : 44
        }}>
          <img src={emailIcon} alt="Email" width={isMobile ? 18 : 22} height={isMobile ? 18 : 22} style={{display: 'block', filter: 'brightness(0) invert(1)'}} />
        </span>
        {/* Input-i për email-in */}
        <input
          className="login-input"
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)} // Përditëson state-in
          required // Fusha e detyrueshme
          style={isMobile ? {paddingLeft: 36, height: 36} : {paddingLeft: 44, height: 44}} // Stilet për të lënë vend për ikonën
        />
      </div>
      
      {/* Fushat për datën e lindjes */}
      <div style={{marginBottom: isMobile ? 6 : 12}}>
        <label style={{
          color: '#eaffff', 
          fontSize: isMobile ? '0.9rem' : '1.1rem', 
          marginBottom: isMobile ? 4 : 8, 
          display: 'block'
        }}>Data e lindjes</label>
        <div className="birthdate-row">
          {/* Dropdown për ditën */}
          <select
            className="login-input birthdate-select"
            value={birthDay}
            onChange={e => setBirthDay(e.target.value)} // Përditëson state-in
            required
            style={isMobile ? {height: 36, fontSize: '0.9rem'} : {}}
          >
            <option value="">Dita</option>
            {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
              <option key={day} value={day}>{day}</option>
            ))}
          </select>
          
          {/* Dropdown për muajin */}
          <select
            className="login-input birthdate-select"
            value={birthMonth}
            onChange={e => setBirthMonth(e.target.value)} // Përditëson state-in
            required
            style={isMobile ? {height: 36, fontSize: '0.9rem'} : {}}
          >
            <option value="">Muaji</option>
            {months.map((month, index) => (
              <option key={index + 1} value={index + 1}>{month}</option>
            ))}
          </select>
          
          {/* Dropdown për vitin */}
          <select
            className="login-input birthdate-select"
            value={birthYear}
            onChange={e => setBirthYear(e.target.value)} // Përditëson state-in
            required
            style={isMobile ? {height: 36, fontSize: '0.9rem'} : {}}
          >
            <option value="">Viti</option>
            {years.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Kontenieri për input-in e fjalëkalimit */}
      <div style={{position: 'relative', marginBottom: isMobile ? 6 : 12}}>
        {/* Ikona e fjalëkalimit */}
        <span className="input-icon" style={{
          left: isMobile ? 8 : 14, 
          top: '40%', 
          position: 'absolute', 
          transform: 'translateY(-50%)', 
          display: 'flex', 
          alignItems: 'center', 
          height: isMobile ? 36 : 44
        }}>
          {/* Lock SVG */}
          <svg width={isMobile ? 18 : 22} height={isMobile ? 18 : 22} viewBox="0 0 24 24" fill="none" style={{filter: 'brightness(0) invert(1)'}}>
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
          onChange={e => setPassword(e.target.value)} // Përditëson state-in
          required // Fusha e detyrueshme
          style={isMobile ? {paddingLeft: 36, height: 36} : {paddingLeft: 44, height: 44}} // Stilet për të lënë vend për ikonën
        />
      </div>
      
      {/* Kontenieri për konfirmimin e fjalëkalimit */}
      <div style={{position: 'relative', marginBottom: isMobile ? 6 : 12}}>
        {/* Ikona e fjalëkalimit */}
        <span className="input-icon" style={{
          left: isMobile ? 8 : 14, 
          top: '40%', 
          position: 'absolute', 
          transform: 'translateY(-50%)', 
          display: 'flex', 
          alignItems: 'center', 
          height: isMobile ? 36 : 44
        }}>
          {/* Lock SVG */}
          <svg width={isMobile ? 18 : 22} height={isMobile ? 18 : 22} viewBox="0 0 24 24" fill="none" style={{filter: 'brightness(0) invert(1)'}}>
            <path d="M17 11V7a5 5 0 10-10 0v4" stroke="#00eaff" strokeWidth="1.5"/>
            <rect x="5" y="11" width="14" height="9" rx="2.5" stroke="#00eaff" strokeWidth="1.5"/>
            <circle cx="12" cy="15.5" r="1.5" fill="#00eaff"/>
          </svg>
        </span>
        {/* Input-i për konfirmimin e fjalëkalimit */}
        <input
          className="login-input"
          type="password"
          placeholder="Konfirmo fjalëkalimin"
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)} // Përditëson state-in
          required // Fusha e detyrueshme
          style={isMobile ? {paddingLeft: 36, height: 36} : {paddingLeft: 44, height: 44}} // Stilet për të lënë vend për ikonën
        />
      </div>
      
      {/* Butoni kryesor për të bërë regjistrim */}
      <button type="submit" style={{
        width: isMobile ? '85%' : '50%', // Gjerësia e ndryshueshme
        background: '#00b894', // Ngjyra jeshile
        color: '#fff', // Teksti i bardhë
        border: 'none', // Pa kufi
        borderRadius: isMobile ? 8 : 12, // Këndet e rrumbullakosura
        padding: isMobile ? '8px 0' : '12px 0', // Padding i ndryshueshëm
        fontWeight: 700, // Pesha e fontit
        fontSize: isMobile ? '0.9rem' : '1.15rem', // Madhësia e fontit
        marginTop: 8,
        boxShadow: '0 4px 20px rgba(0, 184, 148, 0.4)', // Hija
        cursor: 'pointer', // Kursor pointer
        letterSpacing: 1, // Hapësira mes shkronjave
        transition: 'all 0.3s ease', // Animacioni
        minWidth: isMobile ? 100 : 160, // Gjerësia minimale
        display: 'block',
        margin: '8px auto 0 auto' // Qendërzimi
      }}
      onMouseOver={(e) => e.target.style.background = '#1dd1a1'} // Ndryshon ngjyrën në hover
      onMouseOut={(e) => e.target.style.background = '#00b894'}> {/* Kthen ngjyrën origjinale */}
        Regjistrohu
      </button>
      
      {/* Link-u për të kaluar në login */}
      <div style={{textAlign: 'center', marginTop: isMobile ? 8 : 12}}>
        <button 
          type="button" 
          className="form-link" 
          style={{
            color: '#00eaff', 
            background: 'none', 
            border: 'none', 
            fontWeight: 600, 
            cursor: 'pointer', 
            fontSize: isMobile ? '0.85rem' : '1.18rem'
          }} 
          onClick={onSwitch} // Thirr funksionin për të kaluar në login
        >
          Ke llogari? Kyçu këtu.
        </button>
      </div>
    </form>
  );
}

// Eksportimi i komponentit RegisterForm
export default RegisterForm;