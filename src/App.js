// Importimi i librarive të nevojshme nga React
import React, { useState } from 'react';
// Importimi i komponentëve të ndryshëm të aplikacionit
import LoginForm from './Components/LoginForm';
import RegisterForm from './Components/RegisterForm';
import ForgotPasswordForm from './Components/ForgotPasswordForm';
import AuthLayout from './Components/AuthLayout';
import './App.css';
import HomeDashboard from './Components/HomeDashboard';
import Transaksionet from './Components/Transaksionet';
import Qellimet from './Components/Qellimet';
import AIChat from './Components/AIChat';
import Settings from './Components/Settings';
import Help from './Components/Help';

// Të dhënat fillestare të transaksioneve - këto janë transaksione shembull që shfaqen kur aplikacioni hapet
const initialTransaksionet = [
  { id: 1, emri: 'Rroga mujore', shuma: 1000, kategoria: 'Të ardhura', lloji: 'Të ardhura', data: '2025-07-21', pershkrim: 'Paga mujore', metoda: 'Transfer' },
  { id: 2, emri: 'Pazar ushqimesh', shuma: 50, kategoria: 'Ushqime', lloji: 'Shpenzim', data: '2025-07-20', pershkrim: '', metoda: 'Karte' },
  { id: 3, emri: 'Netflix', shuma: 10, kategoria: 'Argëtim', lloji: 'Shpenzim', data: '2025-07-18', pershkrim: 'Abonim', metoda: 'Karte' },
  { id: 4, emri: 'Naftë', shuma: 40, kategoria: 'Transport', lloji: 'Shpenzim', data: '2025-07-15', pershkrim: '', metoda: 'Cash' },
];

// Komponenti kryesor i aplikacionit - App
function App() {
  // State për të menaxhuar faqen aktuale të aplikacionit
  // Vlerat e mundshme: 'login', 'register', 'forgot', 'dashboard', 'transaksionet', 'qellimet', 'aichat', 'settings', 'help'
  const [page, setPage] = useState('login');
  
  // State për të ruajtur informacionin e përdoruesit të loguar
  const [loggedInUser, setLoggedInUser] = useState(null);
  
  // State të përbashkët për të dhënat e transaksioneve
  const [transaksionet, setTransaksionet] = useState(initialTransaksionet);
  
  // State për totalin e të ardhurave - vlera fillestare
  const [totalIncome, setTotalIncome] = useState(1240);
  
  // State për të ruajtur listën e të ardhurave
  const [incomes, setIncomes] = useState([]);

  // Funksioni që thirret kur përdoruesi bën login
  // Merr emrin e përdoruesit dhe e vendos në state, pastaj e dërgon në dashboard
  const handleLogin = (username) => {
    setLoggedInUser(username);
    setPage('dashboard');
  };

  // Kontrolli i faqes së Transaksioneve
  // Nëse përdoruesi është loguar dhe ka zgjedhur faqen e transaksioneve
  if (page === 'transaksionet' && loggedInUser) {
    return <Transaksionet
      currentPage={page}
      onNavigate={setPage}
      transaksionet={transaksionet}
      setTransaksionet={setTransaksionet}
    />;
  }

  // Kontrolli i faqes së Qëllimeve
  // Nëse përdoruesi është loguar dhe ka zgjedhur faqen e qëllimeve
  if (page === 'qellimet' && loggedInUser) {
    return <Qellimet
      currentPage={page}
      onNavigate={setPage}
    />;
  }

  // Kontrolli i faqes së AIChat
  // Nëse përdoruesi është loguar dhe ka zgjedhur faqen e AIChat
  if (page === 'aichat' && loggedInUser) {
    return <AIChat
      currentPage={page}
      onNavigate={setPage}
    />;
  }

  // Kontrolli i faqes së Settings
  // Nëse përdoruesi është loguar dhe ka zgjedhur faqen e Settings
  if (page === 'settings' && loggedInUser) {
    return <Settings
      currentPage={page}
      onNavigate={setPage}
    />;
  }

  // Kontrolli i faqes së Help
  // Nëse përdoruesi është loguar dhe ka zgjedhur faqen e Help
  if (page === 'help' && loggedInUser) {
    return <Help
      currentPage={page}
      onNavigate={setPage}
    />;
  }

  // Kontrolli i faqes së Dashboard
  // Nëse përdoruesi është loguar dhe është në faqen kryesore
  if (page === 'dashboard' && loggedInUser) {
    return <HomeDashboard
      onGoToTransaksionet={() => setPage('transaksionet')}
      onNavigate={setPage}
      transaksionet={transaksionet}
      setTransaksionet={setTransaksionet}
      totalIncome={totalIncome}
      setTotalIncome={setTotalIncome}
      incomes={incomes}
      setIncomes={setIncomes}
    />;
  }

  // Kthimi i komponentit kryesor për faqet e autentifikimit
  return (
    <>
      {/* Div për efektin e blur në background */}
      <div className="background-blur"></div>
      
      {/* Layout-i i autentifikimit që përmban formularët */}
      <AuthLayout>
        {/* Kontrolli i faqes së login */}
        {page === 'login' && (
          <LoginForm 
            onSwitch={() => setPage('register')} // Funksioni për të kaluar në regjistrim
            onForgotPassword={() => setPage('forgot')} // Funksioni për të kaluar në "Harruat fjalëkalimin"
            onLogin={handleLogin} // Funksioni që thirret kur bëhet login
          />
        )}
        
        {/* Kontrolli i faqes së regjistrimit */}
        {page === 'register' && (
          <RegisterForm onSwitch={() => setPage('login')} />
        )}
        
        {/* Kontrolli i faqes së "Harruat fjalëkalimin" */}
        {page === 'forgot' && (
          <ForgotPasswordForm onBack={() => setPage('login')} />
        )}
      </AuthLayout>
    </>
  );
}

// Eksportimi i komponentit App për ta përdorur në index.js
export default App;