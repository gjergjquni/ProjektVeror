import React, { useState } from 'react';
import './PasswordInput.css';
import eyeOpen from '../../img/eye-open-1-removebg-preview.png';
import eyeClose from '../../img/eye-close-removebg-preview.png';

function PasswordInput({ value, onChange, placeholder = "Fjalëkalimi", name = "password", required = false, onValidationChange }) {
  const [visible, setVisible] = useState(false);
  const [errors, setErrors] = useState([]);

  // Password validation function
  const validatePassword = (password) => {
    const errors = [];
    
    if (password.length < 8) {
      errors.push('Fjalëkalimi duhet të ketë të paktën 8 karaktere');
    }
    
    if (!/\d/.test(password)) {
      errors.push('Fjalëkalimi duhet të përmbajë të paktën një numër');
    }
    
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Fjalëkalimi duhet të përmbajë të paktën një simbol');
    }
    
    return errors;
  };

  const handlePasswordChange = (e) => {
    const newPassword = e.target.value;
    
    // Only validate if onValidationChange is provided (for register form)
    if (onValidationChange) {
      const validationErrors = validatePassword(newPassword);
      setErrors(validationErrors);
      onValidationChange(validationErrors.length === 0);
    } else {
      setErrors([]); // No validation for login
    }
    
    onChange(e);
  };

  return (
    <div className="password-input-container">
      <div className="password-input-wrapper">
        <span className="input-icon-left">
          {/* Lock SVG */}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M17 11V7a5 5 0 10-10 0v4" stroke="#00eaff" strokeWidth="1.5"/><rect x="5" y="11" width="14" height="9" rx="2.5" stroke="#00eaff" strokeWidth="1.5"/><circle cx="12" cy="15.5" r="1.5" fill="#00eaff"/></svg>
        </span>
        <input
          className={`password-input ${errors.length > 0 ? 'password-input-error' : ''}`}
          type={visible ? "text" : "password"}
          value={value}
          onChange={handlePasswordChange}
          placeholder={placeholder}
          name={name}
          required={required}
          autoComplete="current-password"
        />
        <span className="input-icon-right">
          <button
            type="button"
            className="toggle-visibility"
            onClick={() => setVisible(v => !v)}
            aria-label={visible ? "Fshih fjalëkalimin" : "Shfaq fjalëkalimin"}
            tabIndex={0}
          >
            <img
              src={visible ? eyeOpen : eyeClose}
              alt={visible ? "Shfaq fjalëkalimin" : "Fshih fjalëkalimin"}
              className="eye-img"
              draggable="false"
              width={28}
              height={28}
            />
          </button>
        </span>
      </div>
      {errors.length > 0 && (
        <div className="password-errors">
          {errors.map((error, index) => (
            <div key={index} className="password-error">
              • {error}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default PasswordInput;