// Importimi i librarive të nevojshme nga React
import React, { useState } from 'react';
// Importimi i ikonave nga react-icons
import { FaHome, FaExchangeAlt, FaBullseye, FaRobot, FaCog, FaQuestionCircle, FaBars, FaTimes, FaPlus, FaMinus, FaBook, FaShieldAlt, FaEnvelope, FaExclamationTriangle } from 'react-icons/fa';
import './Help.css';
import logo from '../img/logo1.png';

// Komponenti i Help
export default function Help({ currentPage, onNavigate }) {
  // State për të menaxhuar sidebar-in në mobile
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  
  // Funksioni për të konfirmuar daljen
  const confirmLogout = () => {
    window.location.href = '/';
    setShowLogoutModal(false);
  };
  
  // State për të menaxhuar seksionet e hapura
  const [openSections, setOpenSections] = useState({
    faq: false,
    quickStart: false,
    transactions: false,
    goals: false,
    aiChat: false,
    settings: false,
    security: false,
    contact: false,
    troubleshooting: false
  });



  // Funksioni për të hapur/mbyllur seksionet
  const toggleSection = (section) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };



  return (
    <div className="dashboard-container">
      {/* Hamburger Menu Button për Mobile */}
      <button 
        className="hamburger-menu-btn"
        onClick={() => setSidebarOpen(true)}
      >
        <FaBars />
      </button>

      {/* Sidebar Overlay për Mobile */}
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
          <button type="button" onClick={e => {e.preventDefault(); onNavigate('dashboard'); setSidebarOpen(false);}}><FaHome /> <span>Ballina</span></button>
          <button type="button" onClick={e => {e.preventDefault(); onNavigate('transaksionet'); setSidebarOpen(false);}}><FaExchangeAlt /> <span>Transaksionet</span></button>
          <button type="button" onClick={e => {e.preventDefault(); onNavigate('qellimet'); setSidebarOpen(false);}}><FaBullseye /> <span>Qëllimet</span></button>
          <button type="button" onClick={e => {e.preventDefault(); onNavigate('aichat'); setSidebarOpen(false);}}><FaRobot className="bot-icon" /> <span>AIChat</span></button>
          <button type="button" onClick={e => {e.preventDefault(); onNavigate('settings'); setSidebarOpen(false);}}><FaCog /> <span>Cilësimet</span></button>
          <button type="button" className="active" onClick={e => {e.preventDefault(); onNavigate('help'); setSidebarOpen(false);}}><FaQuestionCircle /> <span>Ndihmë</span></button>
        </nav>
        <button className="logout-btn" onClick={() => setShowLogoutModal(true)}>Dil</button>
      </aside>
      
      {/* Main Content */}
      <main className="dashboard-main">
        <div className="help-container">
          {/* Header Section */}
          <div className="help-header">
            <div>
              <h2>NDIHMË DHE MBËSHTETJE</h2>
              <p className="help-desc">Gjeni përgjigjet për pyetjet tuaja dhe mësoni si të përdorni aplikacionin</p>
            </div>
          </div>

          

          {/* Help Sections */}
          <div className="help-sections">
            
            {/* FAQ Section */}
            <div className="help-section">
              <div className="section-header" onClick={() => toggleSection('faq')}>
                <div className="header-icon">
                  <FaQuestionCircle />
                </div>
                <div className="header-text">
                  <h3>Pyetje të Bëra Shpesh (FAQ)</h3>
                  <p>Përgjigjet për pyetjet më të zakonshme</p>
                </div>
                <div className="toggle-icon">
                  {openSections.faq ? <FaMinus /> : <FaPlus />}
                </div>
              </div>
              {openSections.faq && (
                <div className="section-content">
                  <div className="faq-item">
                    <h4>Si të shtoj një transaksion të ri?</h4>
                    <p>Shkoni te seksioni "Transaksionet", klikoni butonin "Shto transaksion" dhe plotësoni informacionet e nevojshme.</p>
                  </div>
                  <div className="faq-item">
                    <h4>Si të krijoj një qëllim financiar?</h4>
                    <p>Në seksionin "Qëllimet", klikoni "Shto qëllim" dhe vendosni shumën, afatin dhe kategorinë.</p>
                  </div>
                  <div className="faq-item">
                    <h4>Si të ndryshoj fjalëkalimin tim?</h4>
                    <p>Në "Cilësimet" {'>'} "Profili", klikoni "Ndrysho fjalëkalimin" dhe ndiqni udhëzimet.</p>
                  </div>
                  <div className="faq-item">
                    <h4>Si të përdor AI Chat për këshilla?</h4>
                    <p>Shkoni te "AIChat" dhe bëni pyetje të qarta për financat tuaja.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Start Guide */}
            <div className="help-section">
              <div className="section-header" onClick={() => toggleSection('quickStart')}>
                <div className="header-icon">
                  <FaBook />
                </div>
                <div className="header-text">
                  <h3>Udhëzues i Shpejtë</h3>
                  <p>Hapat e parë për të filluar</p>
                </div>
                <div className="toggle-icon">
                  {openSections.quickStart ? <FaMinus /> : <FaPlus />}
                </div>
              </div>
              {openSections.quickStart && (
                <div className="section-content">
                  <div className="step-item">
                    <div className="step-number">1</div>
                    <div className="step-content">
                      <h4>Konfiguroni profilin</h4>
                      <p>Shkoni te "Cilësimet" dhe plotësoni informacionet personale.</p>
                    </div>
                  </div>
                  <div className="step-item">
                    <div className="step-number">2</div>
                    <div className="step-content">
                      <h4>Shtoni të ardhurat tuaja</h4>
                      <p>Në "Transaksionet", shtoni të ardhurat e para duke zgjedhur kategorinë "Të ardhura".</p>
                    </div>
                  </div>
                  <div className="step-item">
                    <div className="step-number">3</div>
                    <div className="step-content">
                      <h4>Vendosni qëllimet</h4>
                      <p>Krijoni qëllime financiare në seksionin "Qëllimet".</p>
                    </div>
                  </div>
                  <div className="step-item">
                    <div className="step-number">4</div>
                    <div className="step-content">
                      <h4>Ndiqni progresin</h4>
                      <p>Përdorni dashboard-in për të parë statistikat dhe progresin tuaj.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Transactions Management */}
            <div className="help-section">
              <div className="section-header" onClick={() => toggleSection('transactions')}>
                <div className="header-icon">
                  <FaExchangeAlt />
                </div>
                <div className="header-text">
                  <h3>Menaxhimi i Transaksioneve</h3>
                  <p>Si të menaxhoni të ardhurat dhe shpenzimet</p>
                </div>
                <div className="toggle-icon">
                  {openSections.transactions ? <FaMinus /> : <FaPlus />}
                </div>
              </div>
              {openSections.transactions && (
                <div className="section-content">
                  <div className="feature-item">
                    <h4>Shtimi i të ardhurave</h4>
                    <p>Zgjidhni kategorinë "Të ardhura" dhe vendosni shumën pozitive.</p>
                  </div>
                  <div className="feature-item">
                    <h4>Shtimi i shpenzimeve</h4>
                    <p>Zgjidhni kategorinë e duhur dhe vendosni shumën negative.</p>
                  </div>
                  <div className="feature-item">
                    <h4>Kategorizimi</h4>
                    <p>Përdorni kategoritë e paracaktuara për organizim më të mirë.</p>
                  </div>
                  <div className="feature-item">
                    <h4>Editimi dhe fshirja</h4>
                    <p>Klikoni ikonën e editimit ose fshirjes pranë çdo transaksioni.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Financial Goals */}
            <div className="help-section">
              <div className="section-header" onClick={() => toggleSection('goals')}>
                <div className="header-icon">
                  <FaBullseye />
                </div>
                <div className="header-text">
                  <h3>Qëllimet Financiare</h3>
                  <p>Si të vendosni dhe ndiqni qëllimet</p>
                </div>
                <div className="toggle-icon">
                  {openSections.goals ? <FaMinus /> : <FaPlus />}
                </div>
              </div>
              {openSections.goals && (
                <div className="section-content">
                  <div className="feature-item">
                    <h4>Krijimi i qëllimeve</h4>
                    <p>Vendosni shumën e synuar, afatin dhe kategorinë e qëllimit.</p>
                  </div>
                  <div className="feature-item">
                    <h4>Ndiqja e progresit</h4>
                    <p>Përditësoni shumën e kursyer për të parë progresin në kohë reale.</p>
                  </div>
                  <div className="feature-item">
                    <h4>Përfundimi i qëllimeve</h4>
                    <p>Kur arrini shumën e synuar, qëllimi shënohet si i përfunduar.</p>
                  </div>
                </div>
              )}
            </div>

            {/* AI Chat */}
            <div className="help-section">
              <div className="section-header" onClick={() => toggleSection('aiChat')}>
                <div className="header-icon">
                  <FaRobot />
                </div>
                <div className="header-text">
                  <h3>AI Chat</h3>
                  <p>Si të përdorni këshillat e AI</p>
                </div>
                <div className="toggle-icon">
                  {openSections.aiChat ? <FaMinus /> : <FaPlus />}
                </div>
              </div>
              {openSections.aiChat && (
                <div className="section-content">
                  <div className="feature-item">
                    <h4>Bëni pyetje të qarta</h4>
                    <p>Përdorni gjuhën e thjeshtë dhe specifike për rezultate më të mira.</p>
                  </div>
                  <div className="feature-item">
                    <h4>Llojet e këshillave</h4>
                    <p>AI mund t'ju ndihmojë me buxhetimin, kursimin dhe planifikimin financiar.</p>
                  </div>
                  <div className="feature-item">
                    <h4>Shembuj të pyetjeve</h4>
                    <p>"Si të kursem për një pushim?", "Si të menaxhoj buxhetin tim?", "Cilat janë shpenzimet më të mëdha?"</p>
                  </div>
                </div>
              )}
            </div>

            {/* Settings and Personalization */}
            <div className="help-section">
              <div className="section-header" onClick={() => toggleSection('settings')}>
                <div className="header-icon">
                  <FaCog />
                </div>
                <div className="header-text">
                  <h3>Cilësimet dhe Personalizimi</h3>
                  <p>Si të personalizoni përvojën tuaj</p>
                </div>
                <div className="toggle-icon">
                  {openSections.settings ? <FaMinus /> : <FaPlus />}
                </div>
              </div>
              {openSections.settings && (
                <div className="section-content">
                  <div className="feature-item">
                    <h4>Ndryshimi i temës</h4>
                    <p>Zgjidhni midis temave të ndryshme në seksionin "Preferencat".</p>
                  </div>
                  <div className="feature-item">
                    <h4>Konfigurimi i njoftimeve</h4>
                    <p>Kontrolloni cilat njoftime dëshironi të merrni.</p>
                  </div>
                  <div className="feature-item">
                    <h4>Ndryshimi i valutës</h4>
                    <p>Zgjidhni valutën e preferuar për shfaqjen e shumave.</p>
                  </div>
                  <div className="feature-item">
                    <h4>Menaxhimi i profilit</h4>
                    <p>Përditësoni informacionet personale dhe profesionale.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Security and Privacy */}
            <div className="help-section">
              <div className="section-header" onClick={() => toggleSection('security')}>
                <div className="header-icon">
                  <FaShieldAlt />
                </div>
                <div className="header-text">
                  <h3>Siguria dhe Privatësia</h3>
                  <p>Siguria e të dhënave tuaja</p>
                </div>
                <div className="toggle-icon">
                  {openSections.security ? <FaMinus /> : <FaPlus />}
                </div>
              </div>
              {openSections.security && (
                <div className="section-content">
                  <div className="feature-item">
                    <h4>Siguria e të dhënave</h4>
                    <p>Të dhënat tuaja janë të mbrojtura me teknologji të avancuar enkriptimi.</p>
                  </div>
                  <div className="feature-item">
                    <h4>Backup i informacionit</h4>
                    <p>Informacioni juaj ruhet në mënyrë të sigurt dhe mund të rikuperohet.</p>
                  </div>
                  <div className="feature-item">
                    <h4>Politika e privatësisë</h4>
                    <p>Ne respektojmë privatësinë tuaj dhe nuk ndajmë të dhënat me palë të treta.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Contact and Support */}
            <div className="help-section">
              <div className="section-header" onClick={() => toggleSection('contact')}>
                <div className="header-icon">
                  <FaEnvelope />
                </div>
                <div className="header-text">
                  <h3>Kontakti dhe Mbështetja</h3>
                  <p>Si të na kontaktoni</p>
                </div>
                <div className="toggle-icon">
                  {openSections.contact ? <FaMinus /> : <FaPlus />}
                </div>
              </div>
                             {openSections.contact && (
                 <div className="section-content">
                   <div className="contact-item">
                     <h4>Email për mbështetje</h4>
                     <p>ruajmencur@gmail.com</p>
                   </div>
                   <div className="contact-item">
                     <h4>Orari i mbështetjes</h4>
                     <p>E Hënë - E Premte: 9:00 - 18:00</p>
                   </div>
                 </div>
               )}
            </div>

            {/* Troubleshooting */}
            <div className="help-section">
              <div className="section-header" onClick={() => toggleSection('troubleshooting')}>
                <div className="header-icon">
                  <FaExclamationTriangle />
                </div>
                <div className="header-text">
                  <h3>Zgjidhja e Problemeve</h3>
                  <p>Probleme të zakonshme dhe zgjidhjet</p>
                </div>
                <div className="toggle-icon">
                  {openSections.troubleshooting ? <FaMinus /> : <FaPlus />}
                </div>
              </div>
              {openSections.troubleshooting && (
                <div className="section-content">
                  <div className="troubleshoot-item">
                    <h4>Nuk mund të hyni në llogari?</h4>
                    <p>Kontrolloni fjalëkalimin dhe përdorni funksionin "Harruat fjalëkalimin".</p>
                  </div>
                  <div className="troubleshoot-item">
                    <h4>Aplikacioni është i ngadaltë?</h4>
                    <p>Rifreskoni faqen ose provoni të fshini cache-in e shfletuesit.</p>
                  </div>
                  <div className="troubleshoot-item">
                    <h4>Nuk shfaqen transaksionet?</h4>
                    <p>Kontrolloni filtrat dhe sigurohuni që jeni në datën e duhur.</p>
                  </div>
                  <div className="troubleshoot-item">
                    <h4>Probleme me AI Chat?</h4>
                    <p>Sigurohuni që keni lidhje interneti dhe provoni përsëri.</p>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>

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
}
