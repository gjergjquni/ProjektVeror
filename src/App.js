import React, { useState } from 'react';
import LoginForm from './Components/LoginForm';
import RegisterForm from './Components/RegisterForm';
import ForgotPasswordForm from './Components/ForgotPasswordForm';
import AuthLayout from './Components/AuthLayout';
import './App.css';
import HomeDashboard from './Components/HomeDashboard';

function App() {
  const [page, setPage] = useState('login'); // 'login', 'register', 'forgot', 'dashboard'
  const [loggedInUser, setLoggedInUser] = useState(null);

  const handleLogin = (username) => {
    setLoggedInUser(username);
    setPage('dashboard');
  };

  // If user is logged in, show dashboard
  if (page === 'dashboard' && loggedInUser) {
    return <HomeDashboard />;
  }

  return (
    <>
      <div className="background-blur"></div>
      <AuthLayout>
        {page === 'login' && (
          <LoginForm 
            onSwitch={() => setPage('register')} 
            onForgotPassword={() => setPage('forgot')}
            onLogin={handleLogin}
          />
        )}
        {page === 'register' && (
          <RegisterForm onSwitch={() => setPage('login')} />
        )}
        {page === 'forgot' && (
          <ForgotPasswordForm onBack={() => setPage('login')} />
        )}
      </AuthLayout>
    </>
  );
}

export default App;