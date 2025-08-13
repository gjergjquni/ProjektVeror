import React from 'react';
import { FaHome, FaExchangeAlt, FaBullseye, FaRobot, FaCog, FaQuestionCircle, FaWallet, FaArrowUp, FaArrowDown } from 'react-icons/fa';
import './Dashboard.css';
import logo from '../img/logo1.png';
import { FaBell, FaExclamationTriangle } from 'react-icons/fa';

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

function describeArc(cx, cy, r, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
  return [
    'M', start.x, start.y,
    'A', r, r, 0, largeArcFlag, 0, end.x, end.y
  ].join(' ');
}
function polarToCartesian(cx, cy, r, angle) {
  const rad = (angle - 90) * Math.PI / 180.0;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad)
  };
}
let currentAngle = 0;
const arcs = categories.map(cat => {
  const percent = (cat.value / total) * 100;
  const angle = (cat.value / total) * 360;
  const startAngle = currentAngle;
  const endAngle = currentAngle + angle;
  const midAngle = (startAngle + endAngle) / 2;
  currentAngle = endAngle;
  return {
    ...cat,
    percent,
    startAngle,
    endAngle,
    midAngle
  };
});
function getLabelPosition(midAngle, r = 80, cx = 100, cy = 100) {
  const rad = (midAngle - 90) * (Math.PI / 180);
  const rr = r * 0.85;
  return {
    x: cx + rr * Math.cos(rad),
    y: cy + rr * Math.sin(rad)
  };
}

export default function Dashboard() {
  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <img src={logo} alt="Logo" />
        </div>
        <nav className="sidebar-menu">
          <a href="/" className="active"><FaHome /> <span>Ballina</span></a>
          <a href="/transaksionet"><FaExchangeAlt /> <span>Transaksionet</span></a>
          <a href="/qellimet"><FaBullseye /> <span>Qëllimet</span></a>
          <a href="/aichat"><FaRobot className="bot-icon" /> <span>AIChat</span></a>
          <a href="/settings"><FaCog /> <span>Settings</span></a>
          <a href="/help"><FaQuestionCircle /> <span>Ndihmë</span></a>
        </nav>
      </aside>
      {/* Main Content */}
      <main className="dashboard-main">
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
            <svg viewBox="0 0 200 200" width="220" height="220" className="pie-chart">
              {arcs.map((arc, i) => (
                <React.Fragment key={arc.name}>
                  <path
                    d={describeArc(100, 100, 80, arc.startAngle, arc.endAngle)}
                    fill="none"
                    stroke={arc.color}
                    strokeWidth="32"
                    strokeLinecap="butt"
                  />
                  <text
                    x={getLabelPosition(arc.midAngle).x}
                    y={getLabelPosition(arc.midAngle).y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="1rem"
                    fill="#fff"
                    fontWeight="bold"
                  >
                    {Math.round(arc.percent)}%
                  </text>
                </React.Fragment>
              ))}
              {/* Donut hole */}
              <circle cx="100" cy="100" r="56" fill="#181926" />
            </svg>
            <div className="pie-legend">
              {categories.map(cat => (
                <div key={cat.name} className="pie-legend-item">
                  <span className="pie-color" style={{background: cat.color}}></span>
                  <span>{cat.name} ({cat.value}€)</span>
                </div>
              ))}
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
      </main>
    </div>
  );
}