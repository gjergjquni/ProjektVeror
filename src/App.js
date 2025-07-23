import React, { useState } from 'react';
import LoginForm from './Components/LoginForm';
import RegisterForm from './Components/RegisterForm';
import ForgotPasswordForm from './Components/ForgotPasswordForm';
import AuthLayout from './Components/AuthLayout';
import './App.css';
import HomeDashboard from './Components/HomeDashboard';
import Transaksionet from './Components/Transaksionet';

function App() {
  const [page, setPage] = useState('login'); // 'login', 'register', 'forgot', 'dashboard', 'transaksionet', 'qellimet', 'aichat', 'settings', 'help'
  const [loggedInUser, setLoggedInUser] = useState(null);

  const handleLogin = (username) => {
    setLoggedInUser(username);
    setPage('dashboard');
  };

  // Nëse user është loguar dhe ka zgjedhur Transaksionet
  if (page === 'transaksionet' && loggedInUser) {
    return <Transaksionet
      currentPage={page}
      onNavigate={setPage}
    />;
  }

  // Nëse user është loguar dhe është në dashboard
  if (page === 'dashboard' && loggedInUser) {
    return <HomeDashboard
      onGoToTransaksionet={() => setPage('transaksionet')}
      onNavigate={setPage}
      currentPage={page}
    />;
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