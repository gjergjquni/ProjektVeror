import React, { useState } from 'react';
import './Qellimet.css';
import logo from '../../img/logo1.png';
import { FaHome, FaExchangeAlt, FaBullseye, FaRobot, FaCog, FaQuestionCircle, FaEdit, FaTrash, FaPlus, FaLaptop, FaPlane, FaCar, FaGraduationCap, FaHeart, FaGift, FaQuestion, FaBars, FaTimes } from 'react-icons/fa';

const kategoriaOptions = [
  { value: 'Teknologji', label: 'Teknologji', icon: 'FaLaptop', color: '#00b894' },
  { value: 'Pushime', label: 'Pushime', icon: 'FaPlane', color: '#0984e3' },
  { value: 'Transport', label: 'Transport', icon: 'FaCar', color: '#e17055' },
  { value: 'Shtëpi', label: 'Shtëpi', icon: 'FaHome', color: '#6c5ce7' },
  { value: 'Edukim', label: 'Edukim', icon: 'FaGraduationCap', color: '#fd79a8' },
  { value: 'Shëndetësi', label: 'Shëndetësi', icon: 'FaHeart', color: '#e84393' },
  { value: 'Dhuratë', label: 'Dhuratë', icon: 'FaGift', color: '#fdcb6e' },
  { value: 'Të tjera', label: 'Të tjera', icon: 'FaQuestion', color: '#636e72' },
];

const qellimetShembull = [
  { 
    id: 1, 
    emri: 'Laptop i ri', 
    shumaKursyer: 800, 
    shumaSynuar: 1200, 
    kategoria: 'Teknologji',
    dataFillimit: '2025-01-01',
    dataPerfundimit: '2025-06-30',
    pershkrim: 'Laptop për punë dhe studime'
  },
  { 
    id: 2, 
    emri: 'Pushime në Greqi', 
    shumaKursyer: 1200, 
    shumaSynuar: 2500, 
    kategoria: 'Pushime',
    dataFillimit: '2025-02-01',
    dataPerfundimit: '2025-08-31',
    pershkrim: 'Pushime 7 ditë në Santorini'
  },
  { 
    id: 3, 
    emri: 'Makina e re', 
    shumaKursyer: 5000, 
    shumaSynuar: 15000, 
    kategoria: 'Transport',
    dataFillimit: '2025-01-15',
    dataPerfundimit: '2025-12-31',
    pershkrim: 'Makina e përditshme'
  },
];

function getIconForCategory(cat) {
  const found = kategoriaOptions.find(k => k.value === cat);
  if (!found) return <FaQuestion />;
  
  const iconMap = {
    'FaLaptop': <FaLaptop />,
    'FaPlane': <FaPlane />,
    'FaCar': <FaCar />,
    'FaHome': <FaHome />,
    'FaGraduationCap': <FaGraduationCap />,
    'FaHeart': <FaHeart />,
    'FaGift': <FaGift />,
    'FaQuestion': <FaQuestion />
  };
  
  return iconMap[found.icon] || <FaQuestion />;
}

function getColorForCategory(cat) {
  const found = kategoriaOptions.find(k => k.value === cat);
  return found ? found.color : '#636e72';
}

function calculateProgress(shumaKursyer, shumaSynuar) {
  return Math.min((shumaKursyer / shumaSynuar) * 100, 100);
}

function calculateDaysLeft(dataPerfundimit) {
  const today = new Date();
  const endDate = new Date(dataPerfundimit);
  const diffTime = endDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('sq-AL', { style: 'currency', currency: 'EUR' }).format(amount);
}

const Qellimet = ({ onNavigate, currentPage }) => {
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [qellimet, setQellimet] = useState(qellimetShembull);

  // Funksioni për të konfirmuar daljen
  const confirmLogout = () => {
    window.location.href = '/';
    setShowLogoutModal(false);
  };
  const [form, setForm] = useState({ 
    emri: '', 
    shumaKursyer: '', 
    shumaSynuar: '', 
    kategoria: '', 
    dataFillimit: '', 
    dataPerfundimit: '', 
    pershkrim: '' 
  });

  // Statistika
  const totaliKursyer = qellimet.reduce((sum, q) => sum + q.shumaKursyer, 0);
  const totaliSynuar = qellimet.reduce((sum, q) => sum + q.shumaSynuar, 0);
  const progresiTotal = totaliSynuar > 0 ? (totaliKursyer / totaliSynuar) * 100 : 0;
  const qellimetAktive = qellimet.filter(q => q.shumaKursyer < q.shumaSynuar).length;
  const qellimetPërfunduara = qellimet.filter(q => q.shumaKursyer >= q.shumaSynuar).length;

  // Shto ose edit qëllim
  function handleSubmit(e) {
    e.preventDefault();
    if (!form.emri || !form.shumaSynuar || !form.kategoria || !form.dataPerfundimit) return;
    
    const newQellim = {
      ...form,
      shumaKursyer: Number(form.shumaKursyer) || 0,
      shumaSynuar: Number(form.shumaSynuar)
    };

    if (editId) {
      setQellimet(qs => qs.map(q => q.id === editId ? { ...newQellim, id: editId } : q));
    } else {
      setQellimet(qs => [...qs, { ...newQellim, id: Date.now() }]);
    }
    
    setShowModal(false); 
    setEditId(null);
    setForm({ emri: '', shumaKursyer: '', shumaSynuar: '', kategoria: '', dataFillimit: '', dataPerfundimit: '', pershkrim: '' });
  }

  function handleEdit(q) {
    setForm({ 
      ...q, 
      shumaKursyer: q.shumaKursyer.toString(),
      shumaSynuar: q.shumaSynuar.toString()
    });
    setEditId(q.id); 
    setShowModal(true);
  }

  function handleDelete(id) {
    setQellimet(qs => qs.filter(q => q.id !== id));
  }

  function handleUpdateProgress(id, newAmount) {
    setQellimet(qs => qs.map(q => 
      q.id === id ? { ...q, shumaKursyer: Math.min(Number(newAmount), q.shumaSynuar) } : q
    ));
  }

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
          <button className={`sidebar-link${currentPage === 'dashboard' ? ' active' : ''}`} onClick={() => {onNavigate('dashboard'); setSidebarOpen(false);}}><FaHome /> <span>Ballina</span></button>
          <button className={`sidebar-link${currentPage === 'transaksionet' ? ' active' : ''}`} onClick={() => {onNavigate('transaksionet'); setSidebarOpen(false);}}><FaExchangeAlt /> <span>Transaksionet</span></button>
          <button className={`sidebar-link${currentPage === 'qellimet' ? ' active' : ''}`} onClick={() => {onNavigate('qellimet'); setSidebarOpen(false);}}><FaBullseye /> <span>Qëllimet</span></button>
          <button className={`sidebar-link${currentPage === 'aichat' ? ' active' : ''}`} onClick={() => {onNavigate('aichat'); setSidebarOpen(false);}}><FaRobot className="bot-icon" /> <span>AIChat</span></button>
          <button className={`sidebar-link${currentPage === 'settings' ? ' active' : ''}`} onClick={() => {onNavigate('settings'); setSidebarOpen(false);}}><FaCog /> <span>Settings</span></button>
                      <button className={`sidebar-link${currentPage === 'help' ? ' active' : ''}`} onClick={() => {onNavigate('help'); setSidebarOpen(false);}}><FaQuestionCircle /> <span>Ndihmë</span></button>
        </nav>
        <button className="logout-btn" onClick={() => setShowLogoutModal(true)}>Dil</button>
      </aside>

      {/* Main Content */}
      <main className="dashboard-main">
        <div className="qellimet-container">
          {/* Header */}
          <div className="qellimet-header">
            <div>
              <h2>Qëllimet e tua financiare</h2>
              <p className="qellimet-desc">Vendos qëllime, ndiq progresin dhe arri ato që ke planifikuar.</p>
            </div>
            <div className="qellimet-action-buttons">
              <button className="add-btn" onClick={() => setShowModal(true)}><FaPlus /> Shto qëllim</button>
            </div>
          </div>

          {/* Statistika */}
          <div className="qellimet-stats">
            <div className="stat-card">
              <div className="stat-value">{formatCurrency(totaliKursyer)}</div>
              <div className="stat-label">Total i kursyer</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{formatCurrency(totaliSynuar)}</div>
              <div className="stat-label">Total i synuar</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{Math.round(progresiTotal)}%</div>
              <div className="stat-label">Progresi total</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{qellimetAktive}</div>
              <div className="stat-label">Qëllime aktive</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{qellimetPërfunduara}</div>
              <div className="stat-label">Qëllime përfunduara</div>
            </div>
          </div>

          {/* Shiriti i progresit total */}
          <div className="qellimet-total-progress">
            <div className="progress-header">
              <span>Progresi total i qëllimeve</span>
              <span>{Math.round(progresiTotal)}%</span>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${progresiTotal}%` }}
              ></div>
            </div>
          </div>

          {/* Lista e qëllimeve */}
          <div className="qellimet-grid">
            {qellimet.map(q => {
              const progress = calculateProgress(q.shumaKursyer, q.shumaSynuar);
              const daysLeft = calculateDaysLeft(q.dataPerfundimit);
              const isCompleted = q.shumaKursyer >= q.shumaSynuar;
              const isOverdue = daysLeft < 0 && !isCompleted;
              
              return (
                <div key={q.id} className={`qellim-card ${isCompleted ? 'completed' : ''} ${isOverdue ? 'overdue' : ''}`}>
                  <div className="qellim-header">
                    <div className="qellim-icon" style={{ color: getColorForCategory(q.kategoria) }}>
                      {getIconForCategory(q.kategoria)}
                    </div>
                    <div className="qellim-title">
                      <h3>{q.emri}</h3>
                      <span className="qellim-category">{q.kategoria}</span>
                    </div>
                    <div className="qellim-actions">
                      <button className="icon-btn" title="Edito" onClick={() => handleEdit(q)}><FaEdit /></button>
                      <button className="icon-btn" title="Fshi" onClick={() => handleDelete(q.id)}><FaTrash /></button>
                    </div>
                  </div>

                  <div className="qellim-progress">
                    <div className="progress-info">
                      <span>{formatCurrency(q.shumaKursyer)} / {formatCurrency(q.shumaSynuar)}</span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{ 
                          width: `${progress}%`,
                          backgroundColor: isCompleted ? '#00b894' : getColorForCategory(q.kategoria)
                        }}
                      ></div>
                    </div>
                  </div>

                  <div className="qellim-details">
                    <div className="qellim-amount-input">
                      <label>Përditëso shumën e kursyer:</label>
                      <input 
                        type="number" 
                        value={q.shumaKursyer}
                        onChange={(e) => handleUpdateProgress(q.id, e.target.value)}
                        min="0"
                        max={q.shumaSynuar}
                        step="10"
                      />
                    </div>
                    
                    <div className="qellim-info">
                      <div className="info-item">
                        <span className="info-label">Afati:</span>
                        <span className={`info-value ${isOverdue ? 'overdue' : ''}`}>
                          {isOverdue ? `${Math.abs(daysLeft)} ditë më vonë` : 
                           daysLeft === 0 ? 'Sot' : 
                           daysLeft === 1 ? '1 ditë mbetur' : 
                           `${daysLeft} ditë mbetur`}
                        </span>
                      </div>
                      {q.pershkrim && (
                        <div className="info-item">
                          <span className="info-label">Përshkrim:</span>
                          <span className="info-value">{q.pershkrim}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {isCompleted && (
                    <div className="qellim-completed-badge">
                      <span>🎉 Qëllimi u arrit!</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {qellimet.length === 0 && (
            <div className="qellimet-empty">
              <div className="empty-icon">🎯</div>
              <h3>Nuk ke qëllime ende</h3>
              <p>Fillo duke shtuar qëllimin tënd të parë financiar!</p>
              <button className="add-btn" onClick={() => setShowModal(true)}><FaPlus /> Shto qëllimin tënd të parë</button>
            </div>
          )}
        </div>

        {/* Modal për shtim/editim qëllimi */}
        {showModal && (
          <div className="modal-bg">
            <div className="modal-content">
              <h3>{editId ? 'Edito' : 'Shto'} qëllim</h3>
              <form className="modal-form" onSubmit={handleSubmit}>
                <input 
                  type="text" 
                  placeholder="Emri i qëllimit" 
                  value={form.emri} 
                  onChange={e => setForm(f => ({ ...f, emri: e.target.value }))} 
                  required 
                />
                <input 
                  type="number" 
                  placeholder="Shuma e synuar (€)" 
                  value={form.shumaSynuar} 
                  onChange={e => setForm(f => ({ ...f, shumaSynuar: e.target.value }))} 
                  required 
                />
                <input 
                  type="number" 
                  placeholder="Shuma e kursyer (€) - opsionale" 
                  value={form.shumaKursyer} 
                  onChange={e => setForm(f => ({ ...f, shumaKursyer: e.target.value }))} 
                />
                <select 
                  value={form.kategoria} 
                  onChange={e => setForm(f => ({ ...f, kategoria: e.target.value }))} 
                  required
                >
                  <option value="">Zgjidh kategorinë</option>
                  {kategoriaOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <input 
                  type="date" 
                  placeholder="Data e fillimit" 
                  value={form.dataFillimit} 
                  onChange={e => setForm(f => ({ ...f, dataFillimit: e.target.value }))} 
                />
                <input 
                  type="date" 
                  placeholder="Data e përfundimit" 
                  value={form.dataPerfundimit} 
                  onChange={e => setForm(f => ({ ...f, dataPerfundimit: e.target.value }))} 
                  required 
                />
                <textarea 
                  placeholder="Përshkrim shtesë (opsional)" 
                  value={form.pershkrim} 
                  onChange={e => setForm(f => ({ ...f, pershkrim: e.target.value }))} 
                />
                <div style={{display:'flex',justifyContent:'flex-end',gap:12,marginTop:16}}>
                  <button 
                    type="button" 
                    onClick={() => {
                      setShowModal(false);
                      setEditId(null);
                      setForm({ emri: '', shumaKursyer: '', shumaSynuar: '', kategoria: '', dataFillimit: '', dataPerfundimit: '', pershkrim: '' });
                    }} 
                    className="cancel-btn"
                  >
                    Anulo
                  </button>
                  <button type="submit" className="add-btn">
                    {editId ? 'Ruaj' : 'Shto'}
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
      </main>
    </div>
  );
};

export default Qellimet; 