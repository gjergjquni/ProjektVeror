import React, { useState } from 'react';
import './Transaksionet.css';
import logo from '../img/logo1.png';
import { FaHome, FaExchangeAlt, FaBullseye, FaRobot, FaCog, FaQuestionCircle, FaEdit, FaTrash, FaPlus, FaUtensils, FaBus, FaMoneyBillWave, FaFilm, FaQuestion } from 'react-icons/fa';

const kategoriaOptions = [
  { value: 'Ushqime', label: 'Ushqime', icon: <FaUtensils /> },
  { value: 'Transport', label: 'Transport', icon: <FaBus /> },
  { value: 'Të ardhura', label: 'Të ardhura', icon: <FaMoneyBillWave /> },
  { value: 'Argëtim', label: 'Argëtim', icon: <FaFilm /> },
  { value: 'Të tjera', label: 'Të tjera', icon: <FaQuestion /> },
];
const llojiOptions = ['Të ardhura', 'Shpenzim'];
const metodaOptions = ['Cash', 'Karte', 'Transfer', 'Paypal', 'Tjetër'];

const transaksionetShembull = [
  { id: 1, emri: 'Rroga mujore', shuma: 1000, kategoria: 'Të ardhura', lloji: 'Të ardhura', data: '2025-07-21', pershkrim: 'Paga mujore', metoda: 'Transfer' },
  { id: 2, emri: 'Pazar ushqimesh', shuma: 50, kategoria: 'Ushqime', lloji: 'Shpenzim', data: '2025-07-20', pershkrim: '', metoda: 'Karte' },
  { id: 3, emri: 'Netflix', shuma: 10, kategoria: 'Argëtim', lloji: 'Shpenzim', data: '2025-07-18', pershkrim: 'Abonim', metoda: 'Karte' },
  { id: 4, emri: 'Naftë', shuma: 40, kategoria: 'Transport', lloji: 'Shpenzim', data: '2025-07-15', pershkrim: '', metoda: 'Cash' },
];

function getIconForCategory(cat) {
  const found = kategoriaOptions.find(k => k.value === cat);
  return found ? found.icon : <FaQuestion />;
}

const Transaksionet = ({ onNavigate, currentPage }) => {
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [filters, setFilters] = useState({ search: '', dateFrom: '', dateTo: '', kategoria: '', min: '', max: '' });
  const [transaksionet, setTransaksionet] = useState(transaksionetShembull);
  const [form, setForm] = useState({ emri: '', shuma: '', kategoria: '', lloji: '', data: '', pershkrim: '', metoda: '' });

  // Statistika
  const totaliTeArdhura = transaksionet.filter(t => t.lloji === 'Të ardhura').reduce((a, b) => a + Number(b.shuma), 0);
  const totaliShpenzime = transaksionet.filter(t => t.lloji === 'Shpenzim').reduce((a, b) => a + Number(b.shuma), 0);
  const balanca = totaliTeArdhura - totaliShpenzime;

  // Filtrim
  const transaksionetFiltruara = transaksionet.filter(t => {
    const searchMatch = t.emri.toLowerCase().includes(filters.search.toLowerCase());
    const kategoriaMatch = !filters.kategoria || t.kategoria === filters.kategoria;
    const dateFromMatch = !filters.dateFrom || t.data >= filters.dateFrom;
    const dateToMatch = !filters.dateTo || t.data <= filters.dateTo;
    const minMatch = !filters.min || t.shuma >= Number(filters.min);
    const maxMatch = !filters.max || t.shuma <= Number(filters.max);
    return searchMatch && kategoriaMatch && dateFromMatch && dateToMatch && minMatch && maxMatch;
  });

  // Grafik Pie për të ardhura/shpenzime
  const totalPie = Math.abs(totaliTeArdhura) + Math.abs(totaliShpenzime);
  const percTeArdhura = totalPie ? Math.round((Math.abs(totaliTeArdhura) / totalPie) * 100) : 0;
  const percShpenzime = totalPie ? 100 - percTeArdhura : 0;

  // Shto ose edit transaksion
  function handleSubmit(e) {
    e.preventDefault();
    if (!form.emri || !form.shuma || !form.kategoria || !form.lloji || !form.data) return;
    const amount = Math.abs(Number(form.shuma));
    if (editId) {
      setTransaksionet(ts => ts.map(t => t.id === editId ? { ...form, id: editId, shuma: amount } : t));
    } else {
      setTransaksionet(ts => [...ts, { ...form, id: Date.now(), shuma: amount }]);
    }
    setShowModal(false); setEditId(null);
    setForm({ emri: '', shuma: '', kategoria: '', lloji: '', data: '', pershkrim: '', metoda: '' });
  }
  function handleEdit(t) {
    setForm({ ...t, shuma: t.shuma.toString() });
    setEditId(t.id); setShowModal(true);
  }
  function handleDelete(id) {
    setTransaksionet(ts => ts.filter(t => t.id !== id));
  }

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <img src={logo} alt="Logo" />
        </div>
        <nav className="sidebar-menu">
          <button className={`sidebar-link${currentPage === 'dashboard' ? ' active' : ''}`} onClick={() => onNavigate('dashboard')}><FaHome /> <span>Ballina</span></button>
          <button className={`sidebar-link${currentPage === 'transaksionet' ? ' active' : ''}`} onClick={() => onNavigate('transaksionet')}><FaExchangeAlt /> <span>Transaksionet</span></button>
          <button className={`sidebar-link${currentPage === 'qellimet' ? ' active' : ''}`} onClick={() => onNavigate('qellimet')}><FaBullseye /> <span>Qëllimet</span></button>
          <button className={`sidebar-link${currentPage === 'aichat' ? ' active' : ''}`} onClick={() => onNavigate('aichat')}><FaRobot className="bot-icon" /> <span>AIChat</span></button>
          <button className={`sidebar-link${currentPage === 'settings' ? ' active' : ''}`} onClick={() => onNavigate('settings')}><FaCog /> <span>Settings</span></button>
          <button className={`sidebar-link${currentPage === 'help' ? ' active' : ''}`} onClick={() => onNavigate('help')}><FaQuestionCircle /> <span>Help</span></button>
        </nav>
        <button className="logout-btn" onClick={() => window.location.href = '/'}>Dil</button>
      </aside>
      {/* Main Content */}
      <main className="dashboard-main">
        <div className="transaksionet-advanced-container">
          {/* Titulli dhe përshkrimi */}
          <div className="transaksionet-header-advanced">
            <div>
              <h2>Transaksionet e tua</h2>
              <p className="transaksionet-desc">Këtu mund të shikosh të gjitha transaksionet mujore, t’i filtroni, kërkoni dhe analizoni me lehtësi.</p>
            </div>
            <div className="transaksionet-action-buttons">
              <button className="add-btn" onClick={() => setShowModal(true)}><FaPlus /> Shto transaksion</button>
            </div>
          </div>

          {/* Balanca & Grafik */}
          <div className="transaksionet-balance-chart-row">
            <div className="transaksionet-balance-box">
              Balanci aktual: <span style={{color: balanca >= 0 ? '#1de9b6' : '#ff8661'}}>{balanca >= 0 ? '+' : ''}{balanca}€</span>
            </div>
            <div className="transaksionet-pie-chart" style={{display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '28px'}}>
              <div style={{
                width: '100px',
                height: '100px',
                borderRadius: '50%',
                background: `conic-gradient(#1de9b6 0% ${percTeArdhura}%, #ff8661 ${percTeArdhura}% 100%)`,
                border: '7px solid #23243a',
                boxSizing: 'border-box',
                position: 'relative',
              }}>
                {/* No percentage text inside the chart */}
              </div>
              <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '6px', height: '100px'}}>
                <span style={{color:'#1de9b6', fontWeight:'bold', fontSize:'1.18rem'}}>{percTeArdhura}% <span style={{color:'#b2dfdb', fontWeight:400, fontSize:'1.08rem'}}>Të ardhura</span></span>
                <span style={{color:'#ff8661', fontWeight:'bold', fontSize:'1.18rem'}}>{percShpenzime}% <span style={{color:'#b2dfdb', fontWeight:400, fontSize:'1.08rem'}}>Shpenzime</span></span>
              </div>
            </div>
          </div>

          {/* Filtrat & Kërkimi */}
          <div className="transaksionet-filters-advanced">
            <input type="text" placeholder="Kërko emrin..." value={filters.search} onChange={e => setFilters(f => ({ ...f, search: e.target.value }))} />
            <input type="date" value={filters.dateFrom} onChange={e => setFilters(f => ({ ...f, dateFrom: e.target.value }))} />
            <span style={{color:'#888'}}>deri</span>
            <input type="date" value={filters.dateTo} onChange={e => setFilters(f => ({ ...f, dateTo: e.target.value }))} />
            <select value={filters.kategoria} onChange={e => setFilters(f => ({ ...f, kategoria: e.target.value }))}>
              <option value="">Kategoria</option>
              {kategoriaOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
            <input type="number" placeholder="Min €" value={filters.min} onChange={e => setFilters(f => ({ ...f, min: e.target.value }))} style={{width:80}} />
            <input type="number" placeholder="Max €" value={filters.max} onChange={e => setFilters(f => ({ ...f, max: e.target.value }))} style={{width:80}} />
          </div>

          {/* Tabela e transaksioneve */}
          <div className="transaksionet-table-advanced-wrap">
            <table className="transaksionet-table-advanced">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Emri</th>
                  <th>Kategoria</th>
                  <th>Lloji</th>
                  <th>Shuma (€)</th>
                  <th>Përshkrim</th>
                  <th>Metoda</th>
                  <th>Opsione</th>
                </tr>
              </thead>
              <tbody>
                {transaksionetFiltruara.map(t => (
                  <tr key={t.id} className="transaksion-row">
                    <td>{t.data.split('-').reverse().join('/')}</td>
                    <td>{getIconForCategory(t.kategoria)} {t.emri}</td>
                    <td>{t.kategoria}</td>
                    <td style={{color: t.lloji === 'Të ardhura' ? '#1de9b6' : '#ff8661',fontWeight:600}}>{t.lloji}</td>
                    <td style={{color: t.lloji === 'Të ardhura' ? '#1de9b6' : '#ff8661',fontWeight:600}}>{t.lloji === 'Të ardhura' ? '+' : '-'}{t.shuma}€</td>
                    <td>{t.pershkrim}</td>
                    <td>{t.metoda}</td>
                    <td>
                      <button className="icon-btn" title="Edito" onClick={() => handleEdit(t)}><FaEdit /></button>
                      <button className="icon-btn" title="Fshi" onClick={() => handleDelete(t.id)}><FaTrash /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal për shtim/editim transaksioni */}
        {showModal && (
          <div className="modal-bg">
            <div className="modal-content">
              <h3>{editId ? 'Edito' : 'Shto'} transaksion</h3>
              <form className="modal-form" onSubmit={handleSubmit}>
                <input type="text" placeholder="Emri i transaksionit" value={form.emri} onChange={e => setForm(f => ({ ...f, emri: e.target.value }))} required />
                <input type="number" placeholder="Shuma" value={form.shuma} onChange={e => setForm(f => ({ ...f, shuma: Math.abs(e.target.value) }))} required />
                <select value={form.kategoria} onChange={e => setForm(f => ({ ...f, kategoria: e.target.value }))} required>
                  <option value="">Kategoria</option>
                  {kategoriaOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
                <select value={form.lloji} onChange={e => setForm(f => ({ ...f, lloji: e.target.value }))} required>
                  <option value="">Tipi</option>
                  {llojiOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
                <input type="date" value={form.data} onChange={e => setForm(f => ({ ...f, data: e.target.value }))} required />
                <textarea placeholder="Përshkrim shtesë (opsional)" value={form.pershkrim} onChange={e => setForm(f => ({ ...f, pershkrim: e.target.value }))} />
                <select value={form.metoda} onChange={e => setForm(f => ({ ...f, metoda: e.target.value }))}>
                  <option value="">Metoda e pagesës (opsionale)</option>
                  {metodaOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
                <div style={{display:'flex',justifyContent:'flex-end',gap:12,marginTop:16}}>
                  <button type="button" onClick={() => {setShowModal(false);setEditId(null);setForm({ emri: '', shuma: '', kategoria: '', lloji: '', data: '', pershkrim: '', metoda: '' });}} className="cancel-btn">Anulo</button>
                  <button type="submit" className="add-btn">{editId ? 'Ruaj' : 'Shto'}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Transaksionet; 