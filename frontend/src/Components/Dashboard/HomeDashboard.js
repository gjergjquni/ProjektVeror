// Importimi i librarive të nevojshme nga React
import React, { useState } from 'react';
// Importimi i ikonave nga react-icons për të përdorur në aplikacion
import { FaWallet, FaArrowUp, FaArrowDown, FaBell, FaExclamationTriangle, FaPlus, FaTimes } from 'react-icons/fa';
import './HomeDashboard.css';
import logo from '../../img/logo1.png';
import { FaHome, FaExchangeAlt, FaBullseye, FaRobot, FaCog, FaQuestionCircle, FaBars } from 'react-icons/fa';

// Emri i përdoruesit - për momentin i vendosur statikisht
const userName = 'Ledion';



// Njoftimet e sistemit - këto janë njoftime shembull
const notifications = [
  { type: 'warning', icon: <FaExclamationTriangle />, text: 'Pagesa e internetit skadon pas 2 ditësh.' },
  { type: 'info', icon: <FaBell />, text: 'Keni një transaksion të pazakontë: -200€ në Argëtim.' },
  { type: 'danger', icon: <FaExclamationTriangle />, text: 'Keni tejkaluar buxhetin për Ushqime këtë muaj.' },
];

// Komponenti kryesor i Dashboard-it të shtëpisë
export default function HomeDashboard({ 
  onNavigate, // Funksioni për navigimin mes faqeve
  transaksionet, // Lista e transaksioneve
  setTransaksionet, // Funksioni për të ndryshuar transaksionet
  totalIncome, // Totali i të ardhurave
  setTotalIncome, // Funksioni për të ndryshuar totalin e të ardhurave
  incomes, // Lista e të ardhurave të shtuara
  setIncomes // Funksioni për të ndryshuar të ardhurat
}) {
  // State për të menaxhuar sidebar-in në mobile
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // State për të menaxhuar modal-in e shtimit të të ardhurave
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  
  // State për formularin e të ardhurave
  const [incomeForm, setIncomeForm] = useState({
    monthlyIncome: '', // Të ardhurat mujore
    additionalIncome: '', // Të ardhurat shtesë
    description: '' // Përshkrimi
  });

  // State për modal-in e konfirmimit të daljes
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  
  // Llogaritja e statistikave nga transaksionet
  // Totali i shpenzimeve - mbledh të gjitha transaksionet me lloj "Shpenzim"
  const totaliShpenzime = transaksionet.filter(t => t.lloji === 'Shpenzim').reduce((a, b) => a + Number(b.shuma), 0);
  
  // Shpenzimet totale = shpenzimet nga transaksionet + të ardhurat e shtuara
  const expenses = totaliShpenzime;
  
  // Bilanci total = të ardhurat totale - shpenzimet
  const balance = totalIncome - expenses;
  
  // Për krahasimin me muajin e kaluar - vlera statike për shembull
  const lastMonthExpenses = 710;
  const expenseChange = Math.round(((expenses - lastMonthExpenses) / lastMonthExpenses) * 100);
  


  // Funksioni për të llogaritur shpenzimet sipas kategorive nga transaksionet aktuale
  const calculateExpensesByCategory = () => {
    const expensesByCategory = {};
    
    // Filtro vetëm shpenzimet nga transaksionet
    const shpenzimet = transaksionet.filter(t => t.lloji === 'Shpenzim');
    
    // Grupo shpenzimet sipas kategorive dhe mbledh shumat
    shpenzimet.forEach(transaksion => {
      const kategoria = transaksion.kategoria;
      if (!expensesByCategory[kategoria]) {
        expensesByCategory[kategoria] = 0;
      }
      expensesByCategory[kategoria] += Number(transaksion.shuma);
    });
    
    return expensesByCategory;
  };

  // Kategoritë e shpenzimeve nga transaksionet aktuale
  const expensesByCategory = calculateExpensesByCategory();
  
  // Kategoritë dinamike për pie chart (nga transaksionet reale)
  const dynamicCategories = Object.entries(expensesByCategory).map(([name, value], index) => {
    const colors = ['#00b894', '#0984e3', '#e17055', '#636e72', '#fdcb6e', '#6c5ce7'];
    return {
      name: name,
      value: value,
      color: colors[index % colors.length] // Përdor ngjyra në mënyrë ciklike
    };
  });
  
  // Totali dinamik për pie chart
  const dynamicTotal = dynamicCategories.reduce((sum, c) => sum + c.value, 0);

  // Funksioni për të konfirmuar daljen
  const confirmLogout = () => {
    setShowLogoutModal(false);
    window.location.href = '/';
  };

  // Funksioni për të shtuar të ardhura të reja
  const handleIncomeSubmit = (e) => {
    e.preventDefault(); // Parandalon refresh-in e faqes
    
    // Kontrollo nëse ka të dhëna të vlefshme
    const monthlyIncome = parseFloat(incomeForm.monthlyIncome) || 0;
    const additionalIncome = parseFloat(incomeForm.additionalIncome) || 0;
    
    if (monthlyIncome > 0 || additionalIncome > 0) {
      // Krijo objektin e të ardhurave
      const newIncome = {
        id: Date.now(),
        monthlyIncome: monthlyIncome,
        additionalIncome: additionalIncome,
        description: incomeForm.description,
        date: new Date().toISOString().split('T')[0]
      };
      
      // Shto në array-in e të ardhurave
      setIncomes(prev => [...prev, newIncome]);
      
      // Përditëso totalin e të ardhurave
      const totalNewIncome = monthlyIncome + additionalIncome;
      setTotalIncome(prev => prev + totalNewIncome);
      
      // Shto si transaksion në listën e transaksioneve
      if (monthlyIncome > 0) {
        const newTransaction = {
          id: Date.now() + 1,
          emri: incomeForm.description || 'Të ardhura mujore',
          shuma: monthlyIncome,
          kategoria: 'Të ardhura',
          lloji: 'Të ardhura',
          data: new Date().toISOString().split('T')[0],
          pershkrim: incomeForm.description || 'Të ardhura mujore e shtuar',
          metoda: 'Transfer'
        };
        setTransaksionet(prev => [...prev, newTransaction]);
      }
      
      if (additionalIncome > 0) {
        const newTransaction = {
          id: Date.now() + 2,
          emri: incomeForm.description || 'Të ardhura shtesë',
          shuma: additionalIncome,
          kategoria: 'Të ardhura',
          lloji: 'Të ardhura',
          data: new Date().toISOString().split('T')[0],
          pershkrim: incomeForm.description || 'Të ardhura shtesë e shtuar',
          metoda: 'Transfer'
        };
        setTransaksionet(prev => [...prev, newTransaction]);
      }
      
      console.log('Të ardhurat e reja u shtuan:', newIncome);
      console.log('Totali i ri i të ardhurave:', totalIncome + totalNewIncome);
    }
    
    // Reset formën dhe mbyll modalin
    setShowIncomeModal(false);
    setIncomeForm({ monthlyIncome: '', additionalIncome: '', description: '' });
  };

  // Funksion për të fshirë të ardhurat
  const removeIncome = (id) => {
    const incomeToRemove = incomes.find(income => income.id === id);
    if (incomeToRemove) {
      const amountToRemove = incomeToRemove.monthlyIncome + incomeToRemove.additionalIncome;
      setTotalIncome(prev => prev - amountToRemove);
      setIncomes(prev => prev.filter(income => income.id !== id));
      
      // Fshi transaksionet përkatëse
      setTransaksionet(prev => prev.filter(t => 
        !(t.emri === (incomeToRemove.description || 'Të ardhura mujore') && 
          t.shuma === incomeToRemove.monthlyIncome && 
          t.lloji === 'Të ardhura')
      ));
      
      console.log('Të ardhurat u fshinë:', incomeToRemove);
    }
  };

  return (
    <div className="dashboard-container">
      {/* Hamburger Menu Button */}
      <button 
        className="hamburger-menu-btn"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label="Toggle menu"
      >
        {sidebarOpen ? <FaTimes /> : <FaBars />}
      </button>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div 
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <img src={logo} alt="Logo" />
          </div>
          <button 
            className="sidebar-close-btn"
            onClick={() => setSidebarOpen(false)}
          >
            <FaTimes />
          </button>
        </div>
        <nav className="sidebar-menu">
          <button type="button" className="active" onClick={e => {e.preventDefault(); onNavigate('dashboard'); setSidebarOpen(false);}}><FaHome /> <span>Ballina</span></button>
          <button type="button" onClick={e => {e.preventDefault(); onNavigate('transaksionet'); setSidebarOpen(false);}}><FaExchangeAlt /> <span>Transaksionet</span></button>
          <button type="button" onClick={e => {e.preventDefault(); onNavigate('qellimet'); setSidebarOpen(false);}}><FaBullseye /> <span>Qëllimet</span></button>
          <button type="button" onClick={e => {e.preventDefault(); onNavigate('aichat'); setSidebarOpen(false);}}><FaRobot className="bot-icon" /> <span>AIChat</span></button>
          <button type="button" onClick={e => {e.preventDefault(); onNavigate('settings'); setSidebarOpen(false);}}><FaCog /> <span>Settings</span></button>
          <button type="button" onClick={e => {e.preventDefault(); onNavigate('help'); setSidebarOpen(false);}}><FaQuestionCircle /> <span>Ndihmë</span></button>
        </nav>
                 <button className="logout-btn" onClick={() => setShowLogoutModal(true)}>Dil</button>
      </aside>
      
      {/* Main Content */}
      <main className="dashboard-main">
        <div className="main-content-center">
          <div className="greeting-section">
            <div className="greeting-header">
              <div>
                <h1>Mirë se u riktheve, {userName}!</h1>
                <p className="greeting-sub">Ja përmbledhja jote financiare për sot.</p>
              </div>
              <button 
                className="add-income-btn"
                onClick={() => setShowIncomeModal(true)}
              >
                <FaPlus /> Shto të ardhura
              </button>
            </div>
          </div>
          
          <div className="main-balance-section">
            <div className="balance-card">
              <FaWallet className="balance-icon" />
              <div className="balance-label">Bilanci total</div>
              <div className="balance-value">{balance}€</div>
            </div>
            <div className="income-expense-cards">
              <div className="income-card">
                <FaArrowUp className="income-icon" />
                <div className="income-label">Të ardhura mujore</div>
                <div className="income-value">{totalIncome}€</div>
              </div>
              <div className="expense-card">
                <FaArrowDown className="expense-icon" />
                <div className="expense-label">Shpenzime mujore</div>
                <div className="expense-value">{expenses}€</div>
              </div>
            </div>
          </div>
          
          <div className="dashboard-bottom-section">
            <div className="pie-chart-card">
              <div className="pie-title">Shpenzimet sipas kategorive</div>
              <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px'}}>
                {dynamicCategories.length > 0 ? (
                  <>
                    <div style={{
                      width: '140px',
                      height: '140px',
                      borderRadius: '50%',
                      background: `conic-gradient(${dynamicCategories.map((cat, i) => `${cat.color} ${i === 0 ? 0 : (dynamicCategories.slice(0, i).reduce((a, c) => a + c.value, 0) / dynamicTotal) * 100}%, ${cat.color} ${(dynamicCategories.slice(0, i + 1).reduce((a, c) => a + c.value, 0) / dynamicTotal) * 100}%`).join(', ')})`,
                      border: '1px solid #181926',
                      boxSizing: 'border-box',
                      position: 'relative',
                      marginBottom: '8px',
                    }}>
                      {/* No text inside the chart */}
                    </div>
                    <div className="pie-legend">
                      {dynamicCategories.map(cat => (
                        <div key={cat.name} className="pie-legend-item">
                          <span className="pie-color" style={{background: cat.color}}></span>
                          <span>{cat.name} ({cat.value}€)</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '16px',
                    padding: '20px'
                  }}>
                    <div style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '50%',
                      background: '#2d2f45',
                      border: '3px solid #636e72',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#636e72',
                      fontSize: '2rem'
                    }}>
                      €
                    </div>
                    <div style={{textAlign: 'center', color: '#b2bec3'}}>
                      <p style={{margin: '0 0 8px 0', fontSize: '1.1rem'}}>Nuk ka shpenzime</p>
                      <p style={{margin: 0, fontSize: '0.9rem'}}>Shto transaksione për të parë shpenzimet</p>
                    </div>
                  </div>
                )}
              </div>

            </div>
            <div className="compare-notify-section">
              <div className={`compare-card ${expenseChange > 0 ? 'negative' : 'positive'}`}>
                {expenseChange > 0 ? (
                  <span>+{expenseChange}% më shumë shpenzime se muaji i kaluar</span>
                ) : (
                  <span>Keni kursyer më shumë këtë muaj!</span>
                )}
              </div>
              <div className="notifications-list">
                {notifications.map((n, i) => (
                  <div key={i} className={`notification-card ${n.type}`}>
                    <span className="notif-icon">{n.icon}</span>
                    <span>{n.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Seksioni për të shfaqur të ardhurat e shtuara */}
          {incomes.length > 0 && (
            <div className="incomes-section">
              <div className="incomes-header">
                <h3>Të ardhurat e mia të shtuara</h3>
                <span className="incomes-count">{incomes.length} të ardhura</span>
              </div>
              <div className="incomes-grid">
                {incomes.map(income => (
                  <div key={income.id} className="income-item">
                    <div className="income-item-header">
                      <div className="income-item-icon">
                        <FaArrowUp />
                      </div>
                      <button 
                        className="income-remove-btn"
                        onClick={() => removeIncome(income.id)}
                        title="Fshi të ardhurat"
                      >
                        <FaTimes />
                      </button>
                    </div>
                    <div className="income-item-content">
                      <div className="income-item-name">
                        {income.description || 'Të ardhura të reja'}
                      </div>
                      <div className="income-item-amount">
                        {(income.monthlyIncome + income.additionalIncome).toFixed(2)}€
                      </div>
                      <div className="income-item-details">
                        {income.monthlyIncome > 0 && (
                          <span className="income-detail">Mujore: {income.monthlyIncome}€</span>
                        )}
                        {income.additionalIncome > 0 && (
                          <span className="income-detail">Shtesë: {income.additionalIncome}€</span>
                        )}
                      </div>
                      <div className="income-item-date">
                        {new Date(income.date).toLocaleDateString('sq-AL')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Seksioni për transaksionet e fundit */}
          {transaksionet.length > 0 && (
            <div className="recent-transactions-section">
              <div className="recent-transactions-header">
                <h3>Transaksionet e fundit</h3>
                <span className="transactions-count">{transaksionet.length} transaksione</span>
              </div>
              <div className="recent-transactions-list">
                {transaksionet.slice(0, 3).map(transaction => (
                  <div key={transaction.id} className="transaction-item">
                    <div className="transaction-icon">
                      {transaction.lloji === 'Të ardhura' ? <FaArrowUp /> : <FaArrowDown />}
                    </div>
                    <div className="transaction-content">
                      <div className="transaction-name">{transaction.emri}</div>
                      <div className="transaction-category">{transaction.kategoria}</div>
                      <div className="transaction-date">
                        {new Date(transaction.data).toLocaleDateString('sq-AL')}
                      </div>
                    </div>
                    <div className="transaction-amount" style={{
                      color: transaction.lloji === 'Të ardhura' ? '#00b894' : '#ff8661'
                    }}>
                      {transaction.lloji === 'Të ardhura' ? '+' : '-'}{transaction.shuma}€
                    </div>
                  </div>
                ))}
              </div>
              {transaksionet.length > 3 && (
                <div style={{
                  textAlign: 'center',
                  marginTop: '16px'
                }}>
                  <button 
                    onClick={() => onNavigate('transaksionet')}
                    style={{
                      background: 'transparent',
                      border: '1px solid rgba(0, 185, 148, 0.3)',
                      color: '#00b894',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseOver={(e) => {
                      e.target.style.background = 'rgba(0, 185, 148, 0.1)';
                    }}
                    onMouseOut={(e) => {
                      e.target.style.background = 'transparent';
                    }}
                  >
                    Shiko të gjitha ({transaksionet.length})
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Modal për shtim të ardhurash */}
      {showIncomeModal && (
        <div className="modal-bg">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Shto të ardhura të reja</h3>
              <button 
                className="modal-close-btn"
                onClick={() => setShowIncomeModal(false)}
              >
                <FaTimes />
              </button>
            </div>
            <form className="modal-form" onSubmit={handleIncomeSubmit}>
              <div className="form-group">
                <label htmlFor="monthlyIncome">Të ardhura mujore (€) *</label>
                <input 
                  type="number" 
                  id="monthlyIncome"
                  placeholder="Shkruaj shumën mujore..."
                  value={incomeForm.monthlyIncome}
                  onChange={e => setIncomeForm(f => ({ ...f, monthlyIncome: e.target.value }))}
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="additionalIncome">Të ardhura shtesë (€)</label>
                <input 
                  type="number" 
                  id="additionalIncome"
                  placeholder="Shkruaj të ardhura shtesë..."
                  value={incomeForm.additionalIncome}
                  onChange={e => setIncomeForm(f => ({ ...f, additionalIncome: e.target.value }))}
                  min="0"
                  step="0.01"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="description">Përshkrim (opsional)</label>
                <textarea 
                  id="description"
                  placeholder="Përshkrim i të ardhurave..."
                  value={incomeForm.description}
                  onChange={e => setIncomeForm(f => ({ ...f, description: e.target.value }))}
                  rows="3"
                />
              </div>
              
              <div className="form-actions">
                <button 
                  type="button" 
                  className="cancel-btn"
                  onClick={() => {
                    setShowIncomeModal(false);
                    setIncomeForm({ monthlyIncome: '', additionalIncome: '', description: '' });
                  }}
                >
                  Anulo
                </button>
                <button type="submit" className="submit-btn">
                  <FaPlus /> Shto të ardhura
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal për konfirmimin e daljes */}
      {showLogoutModal && (
        <div className="modal-bg">
          <div className="modal-content">
            <div className="modal-header">
              <h3>KONFIRMO DALJEN</h3>
              <button className="modal-close-btn" onClick={() => setShowLogoutModal(false)}>
                <FaTimes />
              </button>
            </div>
            <div className="modal-body">
              <p>A jeni të sigurt që dëshironi të dilni nga llogaria?</p>
            </div>
            <div className="modal-actions">
              <button 
                type="button" 
                className="cancel-btn" 
                onClick={() => setShowLogoutModal(false)}
              >
                ANULO
              </button>
              <button 
                type="button" 
                className="confirm-btn" 
                onClick={confirmLogout}
              >
                PO, DIL
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 