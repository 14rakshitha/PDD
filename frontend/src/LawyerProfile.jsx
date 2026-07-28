import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell,
  BriefcaseBusiness,
  CalendarCheck,
  Clock,
  Eye,
  FileCheck2,
  FileText,
  MapPin,
  Menu,
  MessageSquareText,
  Phone,
  Save,
  Search,
  Share2,
  Star,
  Upload,
  UsersRound,
  Plus,
  Trash2,
  X
} from 'lucide-react';
import { practiceAreas, readStoredLawyerProfile, readStoredRequests } from './demoData';
import {
  updateLawyerProfile,
  API,
  fetchLawyerConsultations,
  updateConsultationStatus,
  fetchSharedDocuments
} from './api';
import './styles.css';

/* ── city → approx lat/lng for Tamil Nadu client map markers ── */
const tamilCityCoords = {
  'சென்னை': { lat: 13.0827, lng: 80.2707 },
  'மதுரை': { lat: 9.9252, lng: 78.1198 },
  'கோயம்புத்தூர்': { lat: 11.0168, lng: 76.9558 },
  'திருச்சி': { lat: 10.7905, lng: 78.7047 },
  'சேலம்': { lat: 11.6643, lng: 78.146 },
  'திருநெல்வேலி': { lat: 8.7139, lng: 77.7567 },
  'ஈரோடு': { lat: 11.341, lng: 77.7172 },
  'வேலூர்': { lat: 12.9165, lng: 79.1325 },
  'தஞ்சாவூர்': { lat: 10.787, lng: 79.1378 },
  'தூத்துக்குடி': { lat: 8.7642, lng: 78.1348 },
  'Chennai': { lat: 13.0827, lng: 80.2707 },
  'Madurai': { lat: 9.9252, lng: 78.1198 },
  'Coimbatore': { lat: 11.0168, lng: 76.9558 },
  'Paris': { lat: 13.0827, lng: 80.2707 },
  'பாரிஸ்': { lat: 13.0827, lng: 80.2707 },
};

const LawyerProfile = () => {
  const [lawyer, setLawyer] = useState(readStoredLawyerProfile);
  const [requests, setRequests] = useState(() => {
    const allReqs = readStoredRequests();
    try {
      const session = JSON.parse(localStorage.getItem('lawvoice-session') || '{}');
      const currentName = session.name || '';
      const isPriya = currentName.includes('ப்ரியா') || currentName.includes('Priya');
      const isMeena = currentName.includes('மீனா') || currentName.includes('Meena');
      
      return allReqs.filter(req => {
        if (req.lawyerId === ('u' + session.id)) return true;
        if (isPriya && req.lawyerId === 'priya') return true;
        if (isMeena && req.lawyerId === 'meena') return true;
        return false;
      });
    } catch {
      return [];
    }
  });
  const [otherLawyers, setOtherLawyers] = useState([]);
  const [newCaseText, setNewCaseText] = useState('');
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [activeRequest, setActiveRequest] = useState(null);
  const [saved, setSaved] = useState('');
  const [reply, setReply] = useState('');
  const [activeTab, setActiveTab] = useState('profile');
  const [menuOpen, setMenuOpen] = useState(false);

  /* ── NEW: Dynamic Schedule (Feature #3) ── */
  const [consultations, setConsultations] = useState([]);

  /* ── NEW: Shared Documents (Feature #5) ── */
  const [sharedDocs, setSharedDocs] = useState([]);
  const [docPreview, setDocPreview] = useState(null);

  /* ── NEW: Notifications (Feature #6) ── */
  const [notifications, setNotifications] = useState([]);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [readNotifIds, setReadNotifIds] = useState(() => {
    try { return JSON.parse(localStorage.getItem('lawvoice-read-notifs') || '[]'); } catch { return []; }
  });

  /* ── NEW: Client Map ── */
  const clientMapRef = useRef(null);
  const clientMapInstance = useRef(null);

  // Set active request if requests are loaded
  useEffect(() => {
    if (requests.length > 0 && !activeRequest) {
      setActiveRequest(requests[0]);
    }
  }, [requests, activeRequest]);

  // Load other lawyers from backend
  useEffect(() => {
    const loadLawyers = async () => {
      try {
        const session = JSON.parse(localStorage.getItem('lawvoice-session') || '{}');
        const res = await fetch(`${API}/lawyers`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setOtherLawyers(data.filter(l => l.name !== session.name));
          }
        }
      } catch (err) {
        console.error("Failed to load other lawyers:", err);
      }
    };
    loadLawyers();
  }, []);

  /* ── NEW: Fetch consultations + documents from backend ── */
  useEffect(() => {
    const loadBackendData = async () => {
      try {
        const session = JSON.parse(localStorage.getItem('lawvoice-session') || '{}');
        const lawyerId = session.id;
        const lawyerName = session.name || lawyer.name;

        // Dynamic Schedule: fetch consultations for this lawyer
        const cons = await fetchLawyerConsultations(lawyerId, lawyerName);
        if (Array.isArray(cons)) setConsultations(cons);

        // Shared Documents: fetch documents shared with this lawyer
        const docs = await fetchSharedDocuments(lawyerId, lawyerName);
        if (Array.isArray(docs)) setSharedDocs(docs);

        // Build notifications from new consultations + requests
        const notifs = [];
        if (Array.isArray(cons)) {
          cons.filter(c => c.status === 'Pending').forEach(c => {
            notifs.push({
              id: `cons-${c.id}`,
              type: 'consultation',
              title: `புதிய ஆலோசனை கோரிக்கை`,
              body: `${c.clientName} - ${c.consultationType} (${c.preferredDate} ${c.preferredTime})`,
              time: c.createdAt,
              icon: '📅'
            });
          });
        }
        if (Array.isArray(docs)) {
          docs.filter(d => d.uploadedAt).forEach(d => {
            notifs.push({
              id: `doc-${d.id}`,
              type: 'document',
              title: `புதிய ஆவணம் பகிரப்பட்டது`,
              body: `${d.ownerName} - ${d.fileName} (${d.docCategory})`,
              time: d.uploadedAt,
              icon: '📄'
            });
          });
        }
        requests.filter(r => r.status === 'புதிய கோரிக்கை').forEach(r => {
          notifs.push({
            id: `req-${r.id}`,
            type: 'request',
            title: `புதிய சட்ட கோரிக்கை`,
            body: `${r.name} - ${r.issue} (${r.city})`,
            time: r.time,
            icon: '⚖️'
          });
        });
        setNotifications(notifs);
      } catch (err) {
        console.error('Error loading backend data:', err);
      }
    };
    loadBackendData();
  }, [lawyer.name, requests]);

  const filteredRequests = useMemo(() => {
    const term = query.trim().toLowerCase();
    const activeLawyerName = lawyer.name || '';
    
    const lawyerRequests = requests.filter((request) => {
      const requestLawyerName = request.lawyerName || '';
      if (requestLawyerName.trim().toLowerCase() === activeLawyerName.trim().toLowerCase()) {
        return true;
      }
      
      // Fallback mappings using demo IDs
      if (request.lawyerId === 'priya' && activeLawyerName.includes('ப்ரியா')) return true;
      if (request.lawyerId === 'meena' && activeLawyerName.includes('மீனா')) return true;
      if (request.lawyerId === 'prakash' && activeLawyerName.includes('பிரகாஷ்')) return true;
      if (request.lawyerId === 'latha' && activeLawyerName.includes('லதா')) return true;
      
      return false;
    });

    return lawyerRequests.filter((request) => {
      const matchesCategory = categoryFilter === 'All' || request.category === categoryFilter;
      const matchesSearch = !term || `${request.name} ${request.issue} ${request.city} ${request.status}`.toLowerCase().includes(term);
      return matchesCategory && matchesSearch;
    });
  }, [categoryFilter, query, requests, lawyer.name]);

  const updateLawyer = (field, value) => {
    setLawyer((current) => ({ ...current, [field]: value }));
    setSaved('');
  };

  const saveLawyer = async () => {
    try {
      setSaved('சேமிக்கிறது...');
      localStorage.setItem('lawvoice-lawyer-profile', JSON.stringify(lawyer));
      
      const session = JSON.parse(localStorage.getItem('lawvoice-session') || '{}');
      const payload = {
        name: lawyer.name,
        phone: lawyer.phone,
        district: lawyer.district,
        city: lawyer.city,
        barId: lawyer.barId,
        category: lawyer.category,
        experience: lawyer.experience,
        office: lawyer.office,
        state: lawyer.state,
        languages: lawyer.languages,
        consultationMode: lawyer.consultationMode,
        availability: lawyer.availability,
        bio: lawyer.bio,
        education: lawyer.education,
        courtPractice: lawyer.courtPractice,
        consultationFee: lawyer.consultationFee,
        caseHistory: lawyer.caseHistory
      };
      
      await updateLawyerProfile(payload);
      
      // Update local session info
      session.name = lawyer.name;
      session.phone = lawyer.phone;
      session.district = lawyer.district;
      localStorage.setItem('lawvoice-session', JSON.stringify(session));

      setSaved('சுயவிவரம் சேமிக்கப்பட்டது. மக்கள் இப்போது உங்கள் புதுப்பிக்கப்பட்ட பொது விவரங்கள் மற்றும் வழக்கு வரலாறைக் காணலாம்.');
    } catch (err) {
      setSaved('சேமிப்பு தோல்வியடைந்தது: ' + err.message);
    }
  };

  const updateRequestStatus = async (status) => {
    if (!activeRequest) return;
    const updated = requests.map((request) => request.id === activeRequest.id ? { ...request, status } : request);
    setRequests(updated);
    setActiveRequest({ ...activeRequest, status });
    localStorage.setItem('lawvoice-requests', JSON.stringify(updated));

    // If marked as "முடிந்தது" (Solved), append to case history automatically
    if (status === 'முடிந்தது') {
      const newCase = `செயலி மூலம் தீர்க்கப்பட்ட வழக்கு: ${activeRequest.name} - ${activeRequest.issue}`;
      if (!lawyer.caseHistory.includes(newCase)) {
        const updatedHistory = [...(lawyer.caseHistory || []), newCase];
        const updatedLawyer = { ...lawyer, caseHistory: updatedHistory };
        setLawyer(updatedLawyer);
        localStorage.setItem('lawvoice-lawyer-profile', JSON.stringify(updatedLawyer));
        
        try {
          await updateLawyerProfile({
            ...lawyer,
            caseHistory: updatedHistory
          });
        } catch (e) {
          console.error("Failed to sync solved case to backend:", e);
        }
      }
    }
  };

  const addManualCase = async () => {
    if (!newCaseText.trim()) return;
    const updatedHistory = [...(lawyer.caseHistory || []), newCaseText.trim()];
    const updatedLawyer = { ...lawyer, caseHistory: updatedHistory };
    setLawyer(updatedLawyer);
    setNewCaseText('');
    localStorage.setItem('lawvoice-lawyer-profile', JSON.stringify(updatedLawyer));
    
    try {
      await updateLawyerProfile({
        ...lawyer,
        caseHistory: updatedHistory
      });
      setSaved('வழக்கு வரலாறு வெற்றிகரமாக சேர்க்கப்பட்டது.');
    } catch (e) {
      console.error("Failed to save manual case in backend:", e);
    }
  };

  const deleteCase = async (indexToDelete) => {
    const updatedHistory = (lawyer.caseHistory || []).filter((_, idx) => idx !== indexToDelete);
    const updatedLawyer = { ...lawyer, caseHistory: updatedHistory };
    setLawyer(updatedLawyer);
    localStorage.setItem('lawvoice-lawyer-profile', JSON.stringify(updatedLawyer));
    
    try {
      await updateLawyerProfile({
        ...lawyer,
        caseHistory: updatedHistory
      });
      setSaved('வழக்கு வரலாறு நீக்கப்பட்டது.');
    } catch (e) {
      console.error("Failed to sync case deletion to backend:", e);
    }
  };

  return (
    <div className="app">
      <aside className={menuOpen ? 'sidebar open' : 'sidebar'}>
        <div className="brand">
          <div className="brandMark">சகு</div>
          <div>
            <strong>சட்டக்குரல்</strong>
            <span>வழக்கறிஞர்</span>
          </div>
        </div>
         <nav>
          <a href="#" className={activeTab === 'profile' ? 'active' : ''} onClick={(e) => { e.preventDefault(); setActiveTab('profile'); setMenuOpen(false); }}>
            <BriefcaseBusiness size={18} />
            <span>சுயவிவரத் தகவல்</span>
          </a>
          <a href="#" className={activeTab === 'cases' ? 'active' : ''} onClick={(e) => { e.preventDefault(); setActiveTab('cases'); setMenuOpen(false); }}>
            <FileCheck2 size={18} />
            <span>வழக்கு வரலாறு</span>
          </a>
          <a href="#" className={activeTab === 'requests' ? 'active' : ''} onClick={(e) => { e.preventDefault(); setActiveTab('requests'); setMenuOpen(false); }}>
            <UsersRound size={18} />
            <span>கோரிக்கைகள்</span>
          </a>
          <a href="#" className={activeTab === 'schedule' ? 'active' : ''} onClick={(e) => { e.preventDefault(); setActiveTab('schedule'); setMenuOpen(false); }}>
            <CalendarCheck size={18} />
            <span>ஆலோசனைகள் ({consultations.length})</span>
          </a>
          <a href="#" className={activeTab === 'documents' ? 'active' : ''} onClick={(e) => { e.preventDefault(); setActiveTab('documents'); setMenuOpen(false); }}>
            <FileText size={18} />
            <span>ஆவணங்கள் ({sharedDocs.length})</span>
          </a>
          <a href="#" className={activeTab === 'clientmap' ? 'active' : ''} onClick={(e) => { e.preventDefault(); setActiveTab('clientmap'); setMenuOpen(false); }}>
            <MapPin size={18} />
            <span>வாடிக்கையாளர் வரைபடம்</span>
          </a>
          <a href="#" className={activeTab === 'other' ? 'active' : ''} onClick={(e) => { e.preventDefault(); setActiveTab('other'); setMenuOpen(false); }}>
            <UsersRound size={18} />
            <span>பிற வழக்கறிஞர்கள்</span>
          </a>
          
          <div style={{ marginTop: 'auto', paddingTop: '20px' }}>
            <Link className="secondaryBtn" to="/" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>வெளியேறு</Link>
          </div>
        </nav>
      </aside>

      {menuOpen && <button className="scrim" onClick={() => setMenuOpen(false)} aria-label="பட்டியை மூடு"><X /></button>}

      <main style={{ minHeight: '100vh', overflowY: 'auto' }}>
        <header className="topbar">
          <button className="iconBtn mobileOnly" onClick={() => setMenuOpen(true)} aria-label="பட்டியைத் திற">
            <Menu size={21} />
          </button>
          <div>
            <p>LawVoice வழக்கறிஞர் பணிப்பகம்</p>
            <h1>வணக்கம், {lawyer.name}</h1>
          </div>
          <div className="topbarActions" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* ── Notification Bell ── */}
            <div style={{ position: 'relative' }}>
              <button
                className="iconBtn"
                onClick={() => setShowNotifPanel(!showNotifPanel)}
                style={{ position: 'relative', background: showNotifPanel ? 'rgba(16,185,129,0.15)' : 'transparent', borderRadius: '10px', padding: '8px' }}
                aria-label="அறிவிப்புகள்"
              >
                <Bell size={22} />
                {notifications.filter(n => !readNotifIds.includes(n.id)).length > 0 && (
                  <span style={{
                    position: 'absolute', top: '2px', right: '2px',
                    background: '#ef4444', color: '#fff', borderRadius: '50%',
                    width: '18px', height: '18px', fontSize: '11px', fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '2px solid #fff'
                  }}>
                    {notifications.filter(n => !readNotifIds.includes(n.id)).length}
                  </span>
                )}
              </button>

              {/* ── Notification Dropdown Panel ── */}
              {showNotifPanel && (
                <div className="notifPanel" style={{
                  position: 'absolute', right: 0, top: '48px', width: '380px', maxHeight: '420px',
                  background: '#fff', borderRadius: '14px', boxShadow: '0 12px 40px rgba(0,0,0,0.18)',
                  zIndex: 999, overflow: 'hidden', border: '1px solid #e5e7eb'
                }}>
                  <div style={{ padding: '14px 18px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontSize: '15px', color: '#1e293b' }}>🔔 அறிவிப்புகள் ({notifications.length})</h3>
                    <button
                      className="secondaryBtn compact"
                      style={{ fontSize: '12px', padding: '4px 10px' }}
                      onClick={() => {
                        const allIds = notifications.map(n => n.id);
                        setReadNotifIds(allIds);
                        localStorage.setItem('lawvoice-read-notifs', JSON.stringify(allIds));
                      }}
                    >அனைத்தும் படிக்கப்பட்டது</button>
                  </div>
                  <div style={{ overflowY: 'auto', maxHeight: '360px' }}>
                    {notifications.length === 0 ? (
                      <div style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>
                        <Bell size={32} /><p>புதிய அறிவிப்புகள் இல்லை</p>
                      </div>
                    ) : (
                      notifications.map(n => (
                        <div
                          key={n.id}
                          style={{
                            padding: '12px 18px', borderBottom: '1px solid #f8fafc',
                            background: readNotifIds.includes(n.id) ? '#fff' : '#f0fdf4',
                            cursor: 'pointer', transition: 'background 0.2s'
                          }}
                          onClick={() => {
                            if (!readNotifIds.includes(n.id)) {
                              const updated = [...readNotifIds, n.id];
                              setReadNotifIds(updated);
                              localStorage.setItem('lawvoice-read-notifs', JSON.stringify(updated));
                            }
                            if (n.type === 'consultation') setActiveTab('schedule');
                            else if (n.type === 'document') setActiveTab('documents');
                            else setActiveTab('requests');
                            setShowNotifPanel(false);
                          }}
                        >
                          <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                            <span style={{ fontSize: '22px' }}>{n.icon}</span>
                            <div style={{ flex: 1 }}>
                              <strong style={{ fontSize: '13px', color: '#1e293b' }}>{n.title}</strong>
                              <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#64748b' }}>{n.body}</p>
                            </div>
                            {!readNotifIds.includes(n.id) && (
                              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', marginTop: '6px', flexShrink: 0 }} />
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <a className="quickCall" href={`tel:${lawyer.phone}`}><Phone size={17} /> அலுவலக அழைப்பு</a>
          </div>
        </header>

        <div className="screen">
          <section className="lawyerStats">
            <div className="stat"><strong>{requests.length}</strong><span>மொத்த கோரிக்கைகள்</span></div>
            <div className="stat"><strong>{consultations.length}</strong><span>ஆலோசனைகள்</span></div>
            <div className="stat"><strong>{lawyer.category}</strong><span>முக்கிய நடைமுறை</span></div>
            <div className="stat"><strong>{lawyer.city}</strong><span>சேவை நகரம்</span></div>
          </section>

          {activeTab === 'profile' && (
            <section className="screen">
              <div className="sectionHead">
                <div>
                  <span className="pill"><BriefcaseBusiness size={16} /> தனிப்பட்ட விவரங்கள்</span>
                  <h2>சுயவிவரத் தகவல்</h2>
                </div>
                <button className="primaryBtn" onClick={saveLawyer}><Save size={17} /> சுயவிவரம் சேமிக்கவும்</button>
              </div>

              <div className="cardGrid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
                <div className="panel">
                  <h3>அடிப்படைத் தகவல்கள்</h3>
                  <div className="avatarUploadGroup" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <img
                      src={lawyer.avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'}
                      alt="Profile Photo"
                      style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #10b981' }}
                    />
                    <label className="secondaryBtn compact" style={{ cursor: 'pointer', margin: 0 }}>
                      📷 புகைப்படத்தைப் பதிவேற்று (Upload Photo)
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (uploadEvent) => {
                              updateLawyer('avatar', uploadEvent.target.result);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  </div>
                  <label>
                    வழக்கறிஞர் பெயர்
                    <input value={lawyer.name} onChange={(event) => updateLawyer('name', event.target.value)} />
                  </label>
                  <label>
                    பார் பதிவு
                    <input value={lawyer.barId} onChange={(event) => updateLawyer('barId', event.target.value)} />
                  </label>
                  <label>
                    தொலைபேசி
                    <input value={lawyer.phone} onChange={(event) => updateLawyer('phone', event.target.value)} />
                  </label>
                  <label>
                    மின்னஞ்சல்
                    <input value={lawyer.email} onChange={(event) => updateLawyer('email', event.target.value)} />
                  </label>
                </div>

                <div className="panel">
                  <h3>தொழில்முறை விவரங்கள்</h3>
                  <label>
                    நடைமுறை பகுதி
                    <select value={lawyer.category} onChange={(event) => updateLawyer('category', event.target.value)}>
                      {practiceAreas.map((area) => <option key={area}>{area}</option>)}
                    </select>
                  </label>
                  <label>
                    அனுபவம்
                    <input value={lawyer.experience} onChange={(event) => updateLawyer('experience', event.target.value)} />
                  </label>
                  <label>
                    மொழிகள்
                    <input value={lawyer.languages} onChange={(event) => updateLawyer('languages', event.target.value)} />
                  </label>
                </div>

                <div className="panel">
                  <h3>அலுவலகம் மற்றும் இருப்பிடம்</h3>
                  <label>
                    அலுவலக முகவரி
                    <input value={lawyer.office} onChange={(event) => updateLawyer('office', event.target.value)} />
                  </label>
                  <label>
                    நகரம்
                    <input value={lawyer.city} onChange={(event) => updateLawyer('city', event.target.value)} />
                  </label>
                  <label>
                    மாவட்டம்
                    <input value={lawyer.district} onChange={(event) => updateLawyer('district', event.target.value)} />
                  </label>
                  <label>
                    மாநிலம்
                    <input value={lawyer.state} onChange={(event) => updateLawyer('state', event.target.value)} />
                  </label>
                </div>

                <div className="panel">
                  <h3>ஆலோசனை விவரங்கள்</h3>
                  <label>
                    ஆலோசனை முறை
                    <input value={lawyer.consultationMode} onChange={(event) => updateLawyer('consultationMode', event.target.value)} />
                  </label>
                  <label>
                    கிடைக்கும் தன்மை
                    <input value={lawyer.availability} onChange={(event) => updateLawyer('availability', event.target.value)} />
                  </label>
                </div>

                <div className="panel" style={{ gridColumn: '1 / -1' }}>
                  <h3>பொது வாழ்க்கைக்குறிப்பு</h3>
                  <label>
                    சுயவிவரக் குறிப்பு
                    <textarea value={lawyer.bio} onChange={(event) => updateLawyer('bio', event.target.value)} />
                  </label>
                </div>
              </div>
              {saved && <p className="notice">{saved}</p>}
            </section>
          )}

          {activeTab === 'cases' && (
            <section className="screen">
              <div className="panel">
                <span className="pill"><FileCheck2 size={16} /> பொது வழக்கு வரலாறு</span>
                <h2>கல்வி மற்றும் வழக்கு வரலாறு</h2>
                <div className="formGrid">
                  <label>
                    கல்வி
                    <input value={lawyer.education} onChange={(event) => updateLawyer('education', event.target.value)} />
                  </label>
                  <label>
                    நீதிமன்ற நடைமுறை
                    <input value={lawyer.courtPractice} onChange={(event) => updateLawyer('courtPractice', event.target.value)} />
                  </label>
                  <label className="wideField">
                    ஆலோசனை கட்டணம்
                    <input value={lawyer.consultationFee} onChange={(event) => updateLawyer('consultationFee', event.target.value)} />
                  </label>
                </div>

                <div style={{ marginTop: '20px' }}>
                  <h3 style={{ fontSize: '16px', marginBottom: '10px', color: '#2d3748' }}>வழக்கு வரலாறு</h3>
                  <div className="caseHistoryList" style={{ marginBottom: '15px' }}>
                    {(lawyer.caseHistory || []).map((caseItem, index) => (
                      <div key={index} className="caseHistoryItem" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#f5f7fb', borderRadius: '6px', marginBottom: '8px' }}>
                        <span style={{ fontSize: '14px', color: '#333' }}>{caseItem}</span>
                        <button className="deleteBtn" onClick={() => deleteCase(index)} style={{ color: '#e53e3e', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                    {(!lawyer.caseHistory || lawyer.caseHistory.length === 0) && (
                      <p style={{ color: '#718096', fontStyle: 'italic', fontSize: '14px' }}>இன்னும் வழக்குகள் எதுவும் சேர்க்கப்படவில்லை.</p>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <input 
                      type="text" 
                      value={newCaseText} 
                      onChange={(e) => setNewCaseText(e.target.value)} 
                      placeholder="புதிய தீர்க்கப்பட்ட வழக்கு விவரங்களை உள்ளிடவும் (எ.கா: ரவி குமார் - நிலத் தகராறு)" 
                    />
                    <button className="primaryBtn" onClick={addManualCase} style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '8px' }}>
                      <Plus size={16} /> சேர்க்க
                    </button>
                  </div>
                </div>
                
                <div style={{ marginTop: '20px', borderTop: '1px solid #e2e8f0', paddingTop: '15px' }}>
                  <button className="primaryBtn" onClick={saveLawyer}><Save size={17} /> வழக்கு வரலாறு சேமிக்கவும்</button>
                </div>
              </div>
              {saved && <p className="notice">{saved}</p>}
            </section>
          )}

          {activeTab === 'requests' && (
            <section className="screen">
              <div className="sectionHead">
                <div>
                  <span className="pill"><UsersRound size={16} /> கோரிக்கைகள்</span>
                  <h2>மக்களின் கோரிக்கைகள் மற்றும் பின்தொடர்ச்சி</h2>
                </div>
              </div>
              <div className="requestWorkspace">
                <div className="panel enquiryPanel">
                  <div className="sectionHead">
                    <div>
                      <span className="pill"><UsersRound size={16} /> மக்களின் கோரிக்கைகள்</span>
                      <h2>உள்வரும் ஆலோசனை கோரிக்கைகள்</h2>
                    </div>
                  </div>
                  <div className="filterRow">
                    <label className="searchField">
                      <Search size={18} />
                      <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="பெயர், சிக்கல், நகரம், நிலை தேடவும்" />
                    </label>
                    <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
                      <option>அனைத்தும்</option>
                      {practiceAreas.map((area) => <option key={area}>{area}</option>)}
                    </select>
                  </div>
                  <div className="clientList">
                    {filteredRequests.map((request) => (
                      <button
                        className={activeRequest?.id === request.id ? 'clientRow active' : 'clientRow'}
                        key={request.id}
                        onClick={() => setActiveRequest(request)}
                      >
                        <span>
                          <strong>{request.name}</strong>
                          <small>{request.category} | {request.city} | {request.status}</small>
                        </span>
                        <em>{request.urgency}</em>
                      </button>
                    ))}
                    {filteredRequests.length === 0 && (
                      <p style={{ color: '#718096', fontStyle: 'italic', fontSize: '14px', padding: '15px' }}>வழக்கு கோரிக்கைகள் எதுவும் இல்லை.</p>
                    )}
                  </div>
                </div>

                <div className="panel">
                  <span className="pill"><FileCheck2 size={16} /> கோரிக்கை விவரங்கள்</span>
                  {activeRequest ? (
                    <>
                      <h2>{activeRequest.name}</h2>
                      <div className="caseMeta">
                        <span>சிக்கல் <strong>{activeRequest.issue}</strong></span>
                        <span>வகை <strong>{activeRequest.category}</strong></span>
                        <span>தொலைபேசி <strong>{activeRequest.phone}</strong></span>
                      </div>
                      <p className="enquirySummary">பெறப்பட்டது {activeRequest.time}. தற்போதைய நிலை: {activeRequest.status}.</p>
                      <label>
                        பதிலளிப்பு குறிப்பு
                        <textarea value={reply} onChange={(event) => setReply(event.target.value)} placeholder="தொழில்முறை பதிலளிப்பு அல்லது ஆவண சரிபாரணை எழுதவும்." />
                      </label>
                      <div className="toolbar">
                        <button className="primaryBtn" onClick={() => updateRequestStatus('Replied')}><MessageSquareText size={17} /> பதிலளிக்கப்பட்டது</button>
                        <button className="secondaryBtn" onClick={() => updateRequestStatus('Consultation scheduled')}><CalendarCheck size={17} /> அட்டவணை</button>
                        <button className="primaryBtn" style={{ backgroundColor: '#2b6cb0' }} onClick={() => updateRequestStatus('முடிந்தது')}><FileCheck2 size={17} /> முடிந்தது (Solved)</button>
                      </div>
                    </>
                  ) : (
                    <p>கோரிக்கை தேர்ந்தெடுக்கப்படவில்லை.</p>
                  )}
                </div>
              </div>
            </section>
          )}

          {activeTab === 'other' && (
            <section className="screen">
              <div className="panel">
                <span className="pill"><UsersRound size={16} /> பிற வழக்கறிஞர்கள்</span>
                <h2>பதிவுசெய்யப்பட்ட பிற வழக்கறிஞர்கள்</h2>
                <p style={{ color: '#718096', fontSize: '14px', marginBottom: '15px' }}>
                  கணினியில் பதிவுசெய்யப்பட்ட பிற வழக்கறிஞர்களின் பட்டியல் மற்றும் விவரங்கள்:
                </p>
                <div className="otherLawyersGrid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '15px' }}>
                  {otherLawyers.map((other) => (
                    <div key={other.id || other.name} className="panel" style={{ padding: '15px' }}>
                      <h3 style={{ margin: '0 0 5px 0', fontSize: '16px' }}>{other.name}</h3>
                      <div style={{ fontSize: '13px', color: '#4a5568', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span>வகை: <strong>{other.category}</strong></span>
                        <span>நகரம்: <strong>{other.city}</strong></span>
                        <span>அனுபவம்: <strong>{other.experience}</strong></span>
                        <span>பார் ID: <strong>{other.barId}</strong></span>
                      </div>
                    </div>
                  ))}
                  {otherLawyers.length === 0 && (
                    <p style={{ color: '#718096', fontStyle: 'italic', fontSize: '14px' }}>பிற வழக்கறிஞர்கள் யாரும் இன்னும் பதிவு செய்யப்படவில்லை.</p>
                  )}
                </div>
              </div>
            </section>
          )}

          {activeTab === 'schedule' && (
            <section className="screen">
              <div className="sectionHead">
                <div>
                  <span className="pill"><CalendarCheck size={16} /> ஆலோசனைகள்</span>
                  <h2>நிகழ்வு அட்டவணை (Dynamic Schedule)</h2>
                </div>
              </div>
              {consultations.length === 0 ? (
                <div className="panel" style={{ textAlign: 'center', padding: '40px' }}>
                  <CalendarCheck size={48} color="#94a3b8" />
                  <h3 style={{ color: '#64748b', marginTop: '12px' }}>இன்னும் ஆலோசனைகள் இல்லை</h3>
                  <p style={{ color: '#94a3b8', fontSize: '14px' }}>மக்கள் பக்கத்திலிருந்து ஆலோசனை பதிவு செய்யும் போது இங்கே காட்டப்படும்.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
                  {consultations.map(c => {
                    const statusColors = {
                      'Pending': { bg: '#fef3c7', color: '#92400e', label: 'நிலுவையில்' },
                      'Confirmed': { bg: '#d1fae5', color: '#065f46', label: 'உறுதிப்படுத்தப்பட்டது' },
                      'Completed': { bg: '#e0e7ff', color: '#3730a3', label: 'முடிந்தது' },
                      'Cancelled': { bg: '#fee2e2', color: '#991b1b', label: 'ரத்தானது' }
                    };
                    const s = statusColors[c.status] || statusColors['Pending'];
                    return (
                      <div key={c.id} className="panel" style={{ padding: '18px', borderLeft: `4px solid ${s.color}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                          <div>
                            <strong style={{ fontSize: '16px', color: '#1e293b' }}>{c.clientName}</strong>
                            <p style={{ margin: '3px 0', fontSize: '13px', color: '#64748b' }}>{c.clientPhone}</p>
                          </div>
                          <span style={{ background: s.bg, color: s.color, padding: '3px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600 }}>{s.label}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '13px', color: '#475569', marginBottom: '10px' }}>
                          <span><Clock size={14} /> {c.preferredDate} | {c.preferredTime}</span>
                          <span><Phone size={14} /> {c.consultationType}</span>
                        </div>
                        {c.issueSummary && <p style={{ fontSize: '13px', color: '#64748b', background: '#f8fafc', padding: '8px 12px', borderRadius: '8px' }}>{c.issueSummary}</p>}
                        {c.status === 'Pending' && (
                          <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                            <button className="primaryBtn compact" onClick={async () => {
                              await updateConsultationStatus(c.id, 'Confirmed');
                              setConsultations(prev => prev.map(x => x.id === c.id ? { ...x, status: 'Confirmed' } : x));
                            }}>✓ உறுதிப்படுத்து</button>
                            <button className="secondaryBtn compact" onClick={async () => {
                              await updateConsultationStatus(c.id, 'Cancelled');
                              setConsultations(prev => prev.map(x => x.id === c.id ? { ...x, status: 'Cancelled' } : x));
                            }}>✕ ரத்து</button>
                          </div>
                        )}
                        {c.status === 'Confirmed' && (
                          <button className="primaryBtn compact" style={{ marginTop: '10px', background: '#3730a3' }} onClick={async () => {
                            await updateConsultationStatus(c.id, 'Completed');
                            setConsultations(prev => prev.map(x => x.id === c.id ? { ...x, status: 'Completed' } : x));
                          }}>✓ முடிந்தது</button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {/* ── NEW: Documents Tab (Feature #5) ── */}
          {activeTab === 'documents' && (
            <section className="screen">
              <div className="sectionHead">
                <div>
                  <span className="pill"><FileText size={16} /> பகிரப்பட்ட ஆவணங்கள்</span>
                  <h2>வாடிக்கையாளர் ஆவணங்கள்</h2>
                </div>
              </div>
              {sharedDocs.length === 0 ? (
                <div className="panel" style={{ textAlign: 'center', padding: '40px' }}>
                  <FileText size={48} color="#94a3b8" />
                  <h3 style={{ color: '#64748b', marginTop: '12px' }}>ஆவணங்கள் இல்லை</h3>
                  <p style={{ color: '#94a3b8', fontSize: '14px' }}>வாடிக்கையாளர்கள் ஆவணங்களை பகிரும் போது இங்கே காட்டப்படும்.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                  {sharedDocs.map(doc => (
                    <div key={doc.id} className="panel" style={{ padding: '18px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <FileText size={22} color="#4f46e5" />
                          </div>
                          <div>
                            <strong style={{ fontSize: '14px', color: '#1e293b' }}>{doc.fileName}</strong>
                            <p style={{ margin: '2px 0', fontSize: '12px', color: '#64748b' }}>{doc.ownerName}</p>
                          </div>
                        </div>
                        <span className="pill" style={{ fontSize: '11px', background: '#f0fdf4', color: '#065f46' }}>{doc.docCategory}</span>
                      </div>
                      <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '10px' }}>
                        வகை: {doc.fileType || 'N/A'} | பதிவேற்றம்: {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString('ta-IN') : 'N/A'}
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {doc.fileData && (
                          <button className="primaryBtn compact" onClick={() => setDocPreview(doc)}>
                            <Eye size={14} /> பார்க்க
                          </button>
                        )}
                        {doc.fileData && (
                          <a
                            href={doc.fileData}
                            download={doc.fileName}
                            className="secondaryBtn compact"
                          >
                            📥 பதிவிறக்கம்
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Document Preview Modal */}
              {docPreview && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                  <div style={{ background: '#fff', borderRadius: '16px', maxWidth: '700px', width: '100%', maxHeight: '85vh', overflow: 'auto', padding: '24px', position: 'relative' }}>
                    <button onClick={() => setDocPreview(null)} style={{ position: 'absolute', top: '12px', right: '12px', background: 'none', border: 'none', cursor: 'pointer' }}><X size={24} /></button>
                    <h3 style={{ marginBottom: '8px' }}>{docPreview.fileName}</h3>
                    <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '16px' }}>{docPreview.ownerName} | {docPreview.docCategory} | {docPreview.fileType}</p>
                    {docPreview.fileData && docPreview.fileData.startsWith('data:image') ? (
                      <img src={docPreview.fileData} alt={docPreview.fileName} style={{ maxWidth: '100%', borderRadius: '10px' }} />
                    ) : (
                      <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '10px', fontSize: '13px', whiteSpace: 'pre-wrap', wordBreak: 'break-all', maxHeight: '400px', overflow: 'auto' }}>
                        {docPreview.fileData ? docPreview.fileData.substring(0, 500) + '...' : 'ஆவண தரவு கிடைக்கவில்லை.'}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </section>
          )}

          {/* ── NEW: Client Map Tab ── */}
          {activeTab === 'clientmap' && (
            <section className="screen">
              <div className="sectionHead">
                <div>
                  <span className="pill"><MapPin size={16} /> வாடிக்கையாளர் வரைபடம்</span>
                  <h2>வாடிக்கையாளர்கள் இருப்பிடம் (Client Locations)</h2>
                </div>
              </div>

              <div className="panel" style={{ padding: '12px' }}>
                <ClientMapLeaflet
                  mapRef={clientMapRef}
                  mapInstance={clientMapInstance}
                  lawyer={lawyer}
                  requests={requests}
                  consultations={consultations}
                  tamilCityCoords={tamilCityCoords}
                />
              </div>

              {/* Client location list */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px', marginTop: '16px' }}>
                {[...requests.map(r => ({ name: r.name, city: r.city, type: 'கோரிக்கை', detail: r.issue })),
                  ...consultations.map(c => ({ name: c.clientName, city: '', type: 'ஆலோசனை', detail: `${c.consultationType} - ${c.preferredDate}` }))
                ].map((item, idx) => (
                  <div key={idx} className="panel" style={{ padding: '14px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: item.type === 'கோரிக்கை' ? '#fef3c7' : '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {item.type === 'கோரிக்கை' ? '⚖️' : '📅'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <strong style={{ fontSize: '13px', color: '#1e293b' }}>{item.name}</strong>
                      <p style={{ margin: '2px 0', fontSize: '12px', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.detail}</p>
                      {item.city && <span style={{ fontSize: '11px', color: '#10b981' }}><MapPin size={12} /> {item.city}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

        </div>
      </main>
    </div>
  );
};

/* ── Client Map Leaflet Sub-component ── */
const ClientMapLeaflet = ({ mapRef, mapInstance, lawyer, requests, consultations, tamilCityCoords }) => {
  useEffect(() => {
    let isMounted = true;
    const initMap = () => {
      if (!mapRef.current || !window.L || !isMounted) return;
      try {
        if (mapInstance.current) { mapInstance.current.remove(); mapInstance.current = null; }
        if (mapRef.current._leaflet_id) mapRef.current._leaflet_id = null;

        const lawyerCity = tamilCityCoords[lawyer.city] || tamilCityCoords['சென்னை'];
        const map = window.L.map(mapRef.current).setView([lawyerCity.lat, lawyerCity.lng], 8);
        window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap'
        }).addTo(map);
        mapInstance.current = map;

        // Lawyer office marker (green)
        const lawyerIcon = window.L.divIcon({
          html: `<div style="background:#10b981;color:#fff;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-size:16px;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.3)">⚖️</div>`,
          className: '', iconSize: [32, 32], iconAnchor: [16, 16]
        });
        window.L.marker([lawyerCity.lat, lawyerCity.lng], { icon: lawyerIcon })
          .addTo(map)
          .bindPopup(`<b>${lawyer.name}</b><br/>அலுவலகம்: ${lawyer.city}<br/>${lawyer.category}`)
          .bindTooltip(lawyer.name, { permanent: true, direction: 'top', className: 'tamilTooltip' });

        // Client markers from requests
        const latLngs = [[lawyerCity.lat, lawyerCity.lng]];
        const clientIcon = window.L.divIcon({
          html: `<div style="background:#3b82f6;color:#fff;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-size:14px;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.25)">👤</div>`,
          className: '', iconSize: [28, 28], iconAnchor: [14, 14]
        });

        requests.forEach(r => {
          const coords = tamilCityCoords[r.city];
          if (coords) {
            // Add small random offset to avoid overlapping
            const jLat = coords.lat + (Math.random() - 0.5) * 0.02;
            const jLng = coords.lng + (Math.random() - 0.5) * 0.02;
            latLngs.push([jLat, jLng]);
            window.L.marker([jLat, jLng], { icon: clientIcon })
              .addTo(map)
              .bindPopup(`<b>${r.name}</b><br/>நகரம்: ${r.city}<br/>சிக்கல்: ${r.issue}<br/>நிலை: ${r.status}`)
              .bindTooltip(r.name, { direction: 'top', className: 'tamilTooltip' });
            // Line from lawyer to client
            window.L.polyline([[lawyerCity.lat, lawyerCity.lng], [jLat, jLng]], {
              color: '#3b82f6', weight: 1.5, opacity: 0.4, dashArray: '6,4'
            }).addTo(map);
          }
        });

        // Consultation markers (different color)
        const consIcon = window.L.divIcon({
          html: `<div style="background:#8b5cf6;color:#fff;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-size:14px;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.25)">📅</div>`,
          className: '', iconSize: [28, 28], iconAnchor: [14, 14]
        });

        consultations.forEach(c => {
          // Try to find city from client name matching requests
          const matchReq = requests.find(r => r.name === c.clientName);
          const coords = matchReq ? tamilCityCoords[matchReq.city] : null;
          if (coords) {
            const jLat = coords.lat + (Math.random() - 0.5) * 0.02;
            const jLng = coords.lng + (Math.random() - 0.5) * 0.02;
            latLngs.push([jLat, jLng]);
            window.L.marker([jLat, jLng], { icon: consIcon })
              .addTo(map)
              .bindPopup(`<b>${c.clientName}</b><br/>ஆலோசனை: ${c.consultationType}<br/>தேதி: ${c.preferredDate} ${c.preferredTime}<br/>நிலை: ${c.status}`)
              .bindTooltip(c.clientName, { direction: 'top', className: 'tamilTooltip' });
          }
        });

        if (latLngs.length > 1) {
          map.fitBounds(window.L.latLngBounds(latLngs), { padding: [40, 40] });
        }

        setTimeout(() => { if (mapInstance.current) mapInstance.current.invalidateSize(); }, 300);
      } catch (err) { console.warn('Client map init error:', err); }
    };

    if (!window.L) { const t = setTimeout(initMap, 500); return () => clearTimeout(t); }
    else initMap();
    return () => { isMounted = false; if (mapInstance.current) { try { mapInstance.current.remove(); } catch {} mapInstance.current = null; } };
  }, [requests, consultations, lawyer]);

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '10px', fontSize: '12px', color: '#64748b' }}>
        <span>⚖️ வழக்கறிஞர் அலுவலகம்</span>
        <span>👤 கோரிக்கை வாடிக்கையாளர்</span>
        <span>📅 ஆலோசனை வாடிக்கையாளர்</span>
      </div>
      <div ref={mapRef} style={{ height: '420px', width: '100%', borderRadius: '12px', zIndex: 1, boxShadow: 'inset 0 0 10px rgba(0,0,0,0.08)' }} />
    </div>
  );
};

export default LawyerProfile;
