// Importimi i librarive të nevojshme nga React
import React, { useState } from 'react';
import './Transaksionet.css';
import logo from '../../img/logo1.png';
// Importimi i ikonave nga react-icons për të përdorur në aplikacion
import { FaHome, FaExchangeAlt, FaBullseye, FaRobot, FaCog, FaQuestionCircle, FaEdit, FaTrash, FaPlus, FaUtensils, FaBus, FaMoneyBillWave, FaFilm, FaQuestion, FaBars, FaTimes } from 'react-icons/fa';

// Lista e kategorive të transaksioneve me ikonat e tyre
const kategoriaOptions = [
  { value: 'Ushqime', label: 'Ushqime', icon: <FaUtensils /> },
  { value: 'Transport', label: 'Transport', icon: <FaBus /> },
  { value: 'Të ardhura', label: 'Të ardhura', icon: <FaMoneyBillWave /> },
  { value: 'Argëtim', label: 'Argëtim', icon: <FaFilm /> },
  { value: 'Të tjera', label: 'Të tjera', icon: <FaQuestion /> },
];

// Opsionet për llojin e transaksionit (të ardhura ose shpenzim)
const llojiOptions = ['Të ardhura', 'Shpenzim'];

// Opsionet për metodën e pagesës
const metodaOptions = ['Cash', 'Karte', 'Transfer', 'Paypal', 'Tjetër'];

// Funksioni për të marrë ikonën e duhur për secilën kategori
function getIconForCategory(cat) {
  const found = kategoriaOptions.find(k => k.value === cat);
  return found ? found.icon : <FaQuestion />;
}

// Komponenti kryesor i Transaksioneve
const Transaksionet = ({ onNavigate, currentPage, transaksionet, setTransaksionet }) => {
  // State për të menaxhuar modal-in e shtimit/editimit të transaksioneve
  const [showModal, setShowModal] = useState(false);
  
  // State për të ruajtur ID-në e transaksionit që po editohet
  const [editId, setEditId] = useState(null);
  
  // State për të menaxhuar sidebar-in në mobile
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // State për filtrat e transaksioneve
  const [filters, setFilters] = useState({ 
    search: '', // Kërkimi me tekst
    dateFrom: '', // Data nga
    dateTo: '', // Data deri
    kategoria: '', // Kategoria
    min: '', // Shuma minimale
    max: '' // Shuma maksimale
  });
  
  // State për formularin e transaksionit
  const [form, setForm] = useState({ 
    emri: '', 
    shuma: '', 
    kategoria: '', 
    lloji: '', 
    data: '', 
    pershkrim: '', 
    metoda: '' 
  });

  // State për modal-in e konfirmimit të daljes
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Llogaritja e statistikave të transaksioneve
  // Totali i të ardhurave - mbledh të gjitha transaksionet me lloj "Të ardhura"
  const totaliTeArdhura = transaksionet.filter(t => t.lloji === 'Të ardhura').reduce((a, b) => a + Number(b.shuma), 0);
  
  // Totali i shpenzimeve - mbledh të gjitha transaksionet me lloj "Shpenzim"
  const totaliShpenzime = transaksionet.filter(t => t.lloji === 'Shpenzim').reduce((a, b) => a + Number(b.shuma), 0);
  
  // Llogaritja e balancës (të ardhura - shpenzime)
  const balanca = totaliTeArdhura - totaliShpenzime;

  // Filtrimi i transaksioneve bazuar në kriteret e zgjedhura
  const transaksionetFiltruara = transaksionet.filter(t => {
    // Kontrolli i kërkimit me tekst
    const searchMatch = t.emri.toLowerCase().includes(filters.search.toLowerCase());
    
    // Kontrolli i kategorisë
    const kategoriaMatch = !filters.kategoria || t.kategoria === filters.kategoria;
    
    // Kontrolli i datës nga
    const dateFromMatch = !filters.dateFrom || t.data >= filters.dateFrom;
    
    // Kontrolli i datës deri
    const dateToMatch = !filters.dateTo || t.data <= filters.dateTo;
    
    // Kontrolli i shumës minimale
    const minMatch = !filters.min || t.shuma >= Number(filters.min);
    
    // Kontrolli i shumës maksimale
    const maxMatch = !filters.max || t.shuma <= Number(filters.max);
    
    // Kthen true vetëm nëse të gjitha kriteret plotësohen
    return searchMatch && kategoriaMatch && dateFromMatch && dateToMatch && minMatch && maxMatch;
  });

  // Llogaritja e përqindjeve për grafikun pie
  const totalPie = Math.abs(totaliTeArdhura) + Math.abs(totaliShpenzime);
  const percTeArdhura = totalPie ? Math.round((Math.abs(totaliTeArdhura) / totalPie) * 100) : 0;
  const percShpenzime = totalPie ? 100 - percTeArdhura : 0;

  // Funksioni për të konfirmuar daljen
  const confirmLogout = () => {
    setShowLogoutModal(false);
    window.location.href = '/';
  };

  // Funksioni për të shtuar ose edituar transaksion
  function handleSubmit(e) {
    e.preventDefault(); // Parandalon refresh-in e faqes
    
    // Kontrolli që të gjitha fushat e detyrueshme janë plotësuar
    if (!form.emri || !form.shuma || !form.kategoria || !form.lloji || !form.data) return;
    
    // Konvertimi i shumës në numër pozitiv
    const amount = Math.abs(Number(form.shuma));
    
    // Nëse po editohet një transaksion ekzistues
    if (editId) {
      setTransaksionet(ts => ts.map(t => t.id === editId ? { ...form, id: editId, shuma: amount } : t));
    } else {
      // Nëse po shtohet transaksion i ri
      setTransaksionet(ts => [...ts, { ...form, id: Date.now(), shuma: amount }]);
    }
    
    // Resetimi i modal-it dhe formularit
    setShowModal(false); 
    setEditId(null);
    setForm({ emri: '', shuma: '', kategoria: '', lloji: '', data: '', pershkrim: '', metoda: '' });
  }
  
  // Funksioni për të hapur modal-in e editimit
  function handleEdit(t) {
    setForm({ ...t, shuma: t.shuma.toString() });
    setEditId(t.id); 
    setShowModal(true);
  }
  
  // Funksioni për të fshirë transaksion
  function handleDelete(id) {
    setTransaksionet(ts => ts.filter(t => t.id !== id));
  }

  return (
    <div className="dashboard-container">
      {/* Butoni hamburger për mobile */}
      <button 
        className="hamburger-menu-btn"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label="Toggle menu"
      >
        {sidebarOpen ? <FaTimes /> : <FaBars />}
      </button>

      {/* Overlay për mobile - mbyll sidebar-in kur klikohet jashtë */}
      {sidebarOpen && (
        <div 
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar-i me navigimin */}
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
        
        {/* Menuja e navigimit */}
        <nav className="sidebar-menu">
          <button className={`sidebar-link${currentPage === 'dashboard' ? ' active' : ''}`} onClick={() => {onNavigate('dashboard'); setSidebarOpen(false);}}><FaHome /> <span>Ballina</span></button>
          <button className={`sidebar-link${currentPage === 'transaksionet' ? ' active' : ''}`} onClick={() => {onNavigate('transaksionet'); setSidebarOpen(false);}}><FaExchangeAlt /> <span>Transaksionet</span></button>
          <button className={`sidebar-link${currentPage === 'qellimet' ? ' active' : ''}`} onClick={() => {onNavigate('qellimet'); setSidebarOpen(false);}}><FaBullseye /> <span>Qëllimet</span></button>
          <button className={`sidebar-link${currentPage === 'aichat' ? ' active' : ''}`} onClick={() => {onNavigate('aichat'); setSidebarOpen(false);}}><FaRobot className="bot-icon" /> <span>AIChat</span></button>
          <button className={`sidebar-link${currentPage === 'settings' ? ' active' : ''}`} onClick={() => {onNavigate('settings'); setSidebarOpen(false);}}><FaCog /> <span>Settings</span></button>
                      <button className={`sidebar-link${currentPage === 'help' ? ' active' : ''}`} onClick={() => {onNavigate('help'); setSidebarOpen(false);}}><FaQuestionCircle /> <span>Ndihmë</span></button>
        </nav>
        
        {/* Butoni për të dalë nga aplikacioni */}
                 <button className="logout-btn" onClick={() => setShowLogoutModal(true)}>Dil</button>
      </aside>

      {/* Përmbajtja kryesore e faqes */}
      <main className="dashboard-main">
        <div className="transaksionet-advanced-container">
                     {/* Header-i me titull */}
           <div className="transaksionet-header-advanced">
             <div>
               <h2>Transaksionet e tua</h2>
               <p className="transaksionet-desc">Këtu mund të shikosh të gjitha transaksionet mujore, t'i filtroni, kërkoni dhe analizoni me lehtësi.</p>
             </div>
           </div>

                       {/* Seksioni i balancës, butonit dhe grafikut pie */}
            <div className="transaksionet-balance-chart-row">
                             {/* Seksioni i majtë - Butoni dhe Balanci */}
               <div style={{display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'flex-start'}}>
                 {/* Butoni për të shtuar transaksion të ri */}
                 <div className="transaksionet-action-buttons">
                   <button className="add-btn" onClick={() => setShowModal(true)}><FaPlus /> Shto transaksion</button>
                 </div>
                 
                 {/* Kutia e balancës */}
                 <div className="transaksionet-balance-box">
                   Balanci aktual: <span style={{color: balanca >= 0 ? '#1de9b6' : '#ff8661'}}>{balanca >= 0 ? '+' : ''}{balanca}€</span>
                 </div>
               </div>
              
              {/* Grafiku pie për të ardhura/shpenzime - në të djathtë */}
              <div className="transaksionet-pie-chart" style={{display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '28px', marginLeft: '60px'}}>
                <div style={{
                  width: '140px',
                  height: '140px',
                  borderRadius: '50%',
                  background: `conic-gradient(#1de9b6 0% ${percTeArdhura}%, #ff8661 ${percTeArdhura}% 100%)`,
                  border: '8px solid #23243a',
                  boxSizing: 'border-box',
                  position: 'relative',
                }}>
                  {/* Grafiku pie - nuk ka tekst brenda */}
                </div>
                <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', height: '140px'}}>
                  <span style={{color:'#1de9b6', fontWeight:'bold', fontSize:'1.4rem'}}>{percTeArdhura}% <span style={{color:'#b2dfdb', fontWeight:400, fontSize:'1.2rem'}}>Të ardhura</span></span>
                  <span style={{color:'#ff8661', fontWeight:'bold', fontSize:'1.4rem'}}>{percShpenzime}% <span style={{color:'#b2dfdb', fontWeight:400, fontSize:'1.2rem'}}>Shpenzime</span></span>
                </div>
              </div>
            </div>

          {/* Seksioni i filtrave dhe kërkimit */}
          <div className="transaksionet-filters-advanced">
            {/* Kërkimi me tekst */}
            <input type="text" placeholder="Kërko emrin..." value={filters.search} onChange={e => setFilters(f => ({ ...f, search: e.target.value }))} />
            
            {/* Filtri i datës nga */}
            <input type="date" value={filters.dateFrom} onChange={e => setFilters(f => ({ ...f, dateFrom: e.target.value }))} />
            <span style={{color:'#888'}}>deri</span>
            
            {/* Filtri i datës deri */}
            <input type="date" value={filters.dateTo} onChange={e => setFilters(f => ({ ...f, dateTo: e.target.value }))} />
            
            {/* Filtri i kategorisë */}
            <select value={filters.kategoria} onChange={e => setFilters(f => ({ ...f, kategoria: e.target.value }))}>
              <option value="">Kategoria</option>
              {kategoriaOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
            
            {/* Filtri i shumës minimale */}
            <input type="number" placeholder="Min €" value={filters.min} onChange={e => setFilters(f => ({ ...f, min: e.target.value }))} style={{width:80}} />
            
            {/* Filtri i shumës maksimale */}
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
                {/* Renditja e transaksioneve të filtruara */}
                {transaksionetFiltruara.map(t => (
                  <tr key={t.id} className="transaksion-row">
                    <td data-label="Data">{t.data.split('-').reverse().join('/')}</td>
                    <td data-label="Emri">{getIconForCategory(t.kategoria)} {t.emri}</td>
                    <td data-label="Kategoria">{t.kategoria}</td>
                    <td data-label="Lloji" style={{color: t.lloji === 'Të ardhura' ? '#1de9b6' : '#ff8661',fontWeight:600}}>{t.lloji}</td>
                    <td data-label="Shuma" style={{color: t.lloji === 'Të ardhura' ? '#1de9b6' : '#ff8661',fontWeight:600}}>{t.lloji === 'Të ardhura' ? '+' : '-'}{t.shuma}€</td>
                    <td data-label="Përshkrim">{t.pershkrim}</td>
                    <td data-label="Metoda">{t.metoda}</td>
                    <td data-label="Opsione">
                      {/* Butoni për të edituar transaksion */}
                      <button className="icon-btn" title="Edito" onClick={() => handleEdit(t)}><FaEdit /></button>
                      {/* Butoni për të fshirë transaksion */}
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
                {/* Fusha për emrin e transaksionit */}
                <input type="text" placeholder="Emri i transaksionit" value={form.emri} onChange={e => setForm(f => ({ ...f, emri: e.target.value }))} required />
                
                {/* Fusha për shumën */}
                <input type="number" placeholder="Shuma" value={form.shuma} onChange={e => setForm(f => ({ ...f, shuma: Math.abs(e.target.value) }))} required />
                
                {/* Dropdown për kategorinë */}
                <select value={form.kategoria} onChange={e => setForm(f => ({ ...f, kategoria: e.target.value }))} required>
                  <option value="">Kategoria</option>
                  {kategoriaOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
                
                {/* Dropdown për llojin e transaksionit */}
                <select value={form.lloji} onChange={e => setForm(f => ({ ...f, lloji: e.target.value }))} required>
                  <option value="">Tipi</option>
                  {llojiOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
                
                {/* Fusha për datën */}
                <input type="date" value={form.data} onChange={e => setForm(f => ({ ...f, data: e.target.value }))} required />
                
                {/* Fusha për përshkrimin (opsionale) */}
                <textarea placeholder="Përshkrim shtesë (opsional)" value={form.pershkrim} onChange={e => setForm(f => ({ ...f, pershkrim: e.target.value }))} />
                
                {/* Dropdown për metodën e pagesës */}
                <select value={form.metoda} onChange={e => setForm(f => ({ ...f, metoda: e.target.value }))}>
                  <option value="">Metoda e pagesës (opsionale)</option>
                  {metodaOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
                
                {/* Butonat e modal-it */}
                <div style={{display:'flex',justifyContent:'flex-end',gap:12,marginTop:16}}>
                  <button type="button" onClick={() => {setShowModal(false);setEditId(null);setForm({ emri: '', shuma: '', kategoria: '', lloji: '', data: '', pershkrim: '', metoda: '' });}} className="cancel-btn">Anulo</button>
                  <button type="submit" className="add-btn">{editId ? 'Ruaj' : 'Shto'}</button>
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

// Eksportimi i komponentit Transaksionet
export default Transaksionet; 