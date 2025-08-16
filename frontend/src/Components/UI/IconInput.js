import React from 'react';
import './IconInput.css';
import emailIcon from '../../img/email-icon-removebg-preview.png';
import newUserIcon from '../../img/user.icon.png';

function IconInput({ value, onChange, placeholder = "Email", name = "email", type = "email", required = false }) {
  // Choose icon based on input type or name
  let icon = null;
  if (type === 'email' || name === 'email') {
    icon = (
      <img src={emailIcon} alt="Email" className="email-img" width={22} height={22} draggable="false" />
    );
  } else if (name === 'username' || type === 'text') {
    icon = (
      <img src={newUserIcon} alt="Përdoruesi" className="user-img" width={22} height={22} draggable="false" />
    );
  }

  return (
    <div className="icon-input-wrapper">
      <span className="input-icon-left">
        {icon}
      </span>
      <input
        className="icon-input"
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        name={name}
        required={required}
        autoComplete={type === 'email' ? 'email' : 'username'}
      />
    </div>
  );
}

export default IconInput; 