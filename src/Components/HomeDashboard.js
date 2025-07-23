import React from 'react';
import { FaWallet, FaArrowUp, FaArrowDown, FaBell, FaExclamationTriangle } from 'react-icons/fa';
import './HomeDashboard.css';
import logo from '../img/logo1.png';
import { FaHome, FaExchangeAlt, FaBullseye, FaRobot, FaCog, FaQuestionCircle } from 'react-icons/fa';

const userName = 'Ledion';
const balance = 1240;
const income = 1000;
const expenses = 820;
const lastMonthExpenses = 710;
const expenseChange = Math.round(((expenses - lastMonthExpenses) / lastMonthExpenses) * 100);
const notifications = [
  { type: 'warning', icon: <FaExclamationTriangle />, text: 'Pagesa e internetit skadon pas 2 ditësh.' },
  { type: 'info', icon: <FaBell />, text: 'Keni një transaksion të pazakontë: -200€ në Argëtim.' },
  { type: 'danger', icon: <FaExclamationTriangle />, text: 'Keni tejkaluar buxhetin për Ushqime këtë muaj.' },
];
const categories = [
  { name: 'Ushqime', value: 320, color: '#00b894' },
  { name: 'Transport', value: 180, color: '#0984e3' },
  { name: 'Argëtim', value: 120, color: '#e17055' },
  { name: 'Të tjera', value: 200, color: '#636e72' },
];
const total = categories.reduce((sum, c) => sum + c.value, 0);

export default function HomeDashboard({ onNavigate }) {
  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <img src={logo} alt="Logo" />
        </div>
        <nav className="sidebar-menu">
          <button type="button" className="active" onClick={e => {e.preventDefault(); onNavigate('dashboard');}}><FaHome /> <span>Ballina</span></button>
          <button type="button" onClick={e => {e.preventDefault(); onNavigate('transaksionet');}}><FaExchangeAlt /> <span>Transaksionet</span></button>
          <button type="button" onClick={e => {e.preventDefault(); onNavigate('qellimet');}}><FaBullseye /> <span>Qëllimet</span></button>
          <button type="button" onClick={e => {e.preventDefault(); onNavigate('aichat');}}><FaRobot className="bot-icon" /> <span>AIChat</span></button>
          <button type="button" onClick={e => {e.preventDefault(); onNavigate('settings');}}><FaCog /> <span>Settings</span></button>
          <button type="button" onClick={e => {e.preventDefault(); onNavigate('help');}}><FaQuestionCircle /> <span>Help</span></button>
        </nav>
        <button className="logout-btn" onClick={() => window.location.href = '/'}>Dil</button>
      </aside>
      {/* Main Content */}
      <main className="dashboard-main">
        <div className="main-content-center">
          <div className="greeting-section">
            <h1>Mirë se u riktheve, {userName}!</h1>
            <p className="greeting-sub">Ja përmbledhja jote financiare për sot.</p>
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
                <div className="income-value">{income}€</div>
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
                <div style={{
                  width: '140px',
                  height: '140px',
                  borderRadius: '50%',
                  background: `conic-gradient(${categories.map((cat, i) => `${cat.color} ${i === 0 ? 0 : (categories.slice(0, i).reduce((a, c) => a + c.value, 0) / total) * 100}%, ${cat.color} ${(categories.slice(0, i + 1).reduce((a, c) => a + c.value, 0) / total) * 100}%`).join(', ')})`,
                  border: '10px solid #181926',
                  boxSizing: 'border-box',
                  position: 'relative',
                  marginBottom: '8px',
                }}>
                  {/* No text inside the chart */}
                </div>
                <div className="pie-legend">
                  {categories.map(cat => (
                    <div key={cat.name} className="pie-legend-item">
                      <span className="pie-color" style={{background: cat.color}}></span>
                      <span>{cat.name} ({cat.value}€)</span>
                    </div>
                  ))}
                </div>
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
        </div>
      </main>
    </div>
  );
} 