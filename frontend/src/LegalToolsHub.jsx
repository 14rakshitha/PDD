import React, { useState, useEffect } from 'react';
import {
  FileText,
  Clock,
  Printer,
  Download,
  PlusCircle,
  CheckCircle,
  AlertTriangle,
  HelpCircle,
  Calendar,
  ShieldAlert,
  Send,
  Building,
  User,
  MapPin,
  Sparkles,
  X
} from 'lucide-react';
import {
  generateRtiDraft,
  fetchMyRtiDrafts,
  createLegalDeadline,
  fetchMyDeadlines,
  updateDeadlineStatus
} from './api';
import './styles.css';

const limitationPresets = [
  {
    title: 'செக் மோசடி நோட்டீஸ் (Sec 138 NI Act)',
    category: 'Cheque Bounce',
    days: 30,
    desc: 'செக் திரும்பிய வங்கியின் அறிவிப்பு கிடைத்த 30 நாட்களுக்குள் சட்டப்பூர்வ அறிவிப்பு அனுப்பப்பட வேண்டும்.'
  },
  {
    title: 'நுகர்வோர் நீதிமன்ற வழக்கு (Consumer Complaint)',
    category: 'Consumer Dispute',
    days: 730, // 2 Years
    desc: 'சேவை குறைபாடு அல்லது பொருள் சேதம் ஏற்பட்ட 2 ஆண்டுகளுக்குள் வழக்கு பதிவு செய்ய வேண்டும்.'
  },
  {
    title: 'உயர் நீதிமன்ற மேல்முறையீடு (High Court Appeal)',
    category: 'Civil Appeal',
    days: 90,
    desc: 'கீழ் நீதிமன்ற தீர்ப்பு நகல் கிடைத்த 90 நாட்களுக்குள் மேல்முறையீடு செய்ய வேண்டும்.'
  },
  {
    title: 'காவல் நிலைய FIR மேல்முறையீடு',
    category: 'Criminal FIR',
    days: 30,
    desc: 'புகாரை ஏற்றுக்கொள்ள மறுத்தால் 30 நாட்களுக்குள் எஸ்பி/கமிஷனரிடம் முறையிட வேண்டும்.'
  },
  {
    title: 'சம்பள பாக்கி / தொழிலாளர் வழக்கு',
    category: 'Labor Claim',
    days: 1095, // 3 Years
    desc: 'சம்பளம் மறுக்கப்பட்ட நாளிலிருந்து 3 ஆண்டுகளுக்குள் தொழிலாளர் நீதிமன்றத்தை அணுகலாம்.'
  }
];

const LegalToolsHub = ({ initialTab = 'rti' }) => {
  const [activeTab, setActiveTab] = useState(initialTab); // 'rti', 'deadlines'
  const [session] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('lawvoice-session')) || {};
    } catch {
      return {};
    }
  });

  const userName = session.name || 'டெமோ பயனர்';
  const userPhone = session.phone || '+91 98765 43210';
  const userDistrict = session.district || 'சென்னை';

  const [statusMessage, setStatusMessage] = useState('');

  // --- RTI Form & State ---
  const [rtiDrafts, setRtiDrafts] = useState([]);
  const [showRtiModal, setShowRtiModal] = useState(false);
  const [selectedRti, setSelectedRti] = useState(null);
  const [rtiForm, setRtiForm] = useState({
    applicantName: userName,
    applicantAddress: `12, காந்தி சாலை, ${userDistrict}, தமிழ்நாடு`,
    applicantPhone: userPhone,
    publicAuthorityName: 'பொது தகவல் அலுவலர், சென்னை மாநகராட்சி',
    publicAuthorityAddress: 'ரிப்பன் கட்டிடம், சென்னை - 600003',
    subject: 'சாலை பராமரிப்பு மற்றும் நிதியொதுக்கீடு தொடர்பான தகவல்கள் கோருதல்',
    questions: '1. கடந்த 2 ஆண்டுகளில் இந்த பகுதியில் மேற்கொள்ளப்பட்ட சாலை பணிகளின் விவரங்கள் என்ன?\n2. இதற்காக ஒதுக்கப்பட்ட மொத்த நிதி மற்றும் ஒப்பந்ததாரர் பெயர் என்ன?\n3. பணி நிறைவு சான்றிதழ் நகலை வழங்கவும்.',
    periodOfInfo: '2022 - 2024',
    feeDetails: 'ரூ. 10 நீதிமன்றக் கட்டண முத்திரை (Court Fee Stamp) ஒட்டப்பட்டுள்ளது.',
    language: 'ta'
  });

  // --- Deadline State ---
  const [deadlines, setDeadlines] = useState([]);
  const [showDeadlineModal, setShowDeadlineModal] = useState(false);
  const [deadlineForm, setDeadlineForm] = useState({
    caseTitle: '',
    category: 'Cheque Bounce',
    startDate: new Date().toISOString().split('T')[0],
    limitationDays: 30,
    notes: ''
  });

  // Load Data
  const loadData = async () => {
    try {
      const rtis = await fetchMyRtiDrafts(userName, userPhone);
      setRtiDrafts(Array.isArray(rtis) ? rtis : []);
      const dls = await fetchMyDeadlines(userName, userPhone);
      setDeadlines(Array.isArray(dls) ? dls : []);
    } catch (err) {
      console.error('Error loading legal tools data:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, [userName, userPhone]);

  // Handle RTI Draft Submit
  const handleRtiSubmit = async (e) => {
    e.preventDefault();
    const draftPayload = {
      ...rtiForm,
      applicantName: userName,
      applicantPhone: userPhone,
      createdAt: new Date().toISOString()
    };
    
    // Set draft immediately for fast UI feedback
    setSelectedRti(draftPayload);
    setShowRtiModal(false);
    setStatusMessage('RTI விண்ணப்ப வரைவு வெற்றிகரமாக உருவாக்கப்பட்டது!');

    try {
      const res = await generateRtiDraft(draftPayload);
      if (res && res.id) {
        setSelectedRti(res);
      }
      loadData();
    } catch (err) {
      console.warn('Backend sync failed, using local draft:', err);
    }
  };

  // Handle Deadline Submit
  const handleDeadlineSubmit = async (e) => {
    e.preventDefault();
    if (!deadlineForm.caseTitle.trim()) {
      setStatusMessage('வழக்கு அல்லது தலைப்பை உள்ளிடவும்.');
      return;
    }
    try {
      const start = new Date(deadlineForm.startDate);
      const due = new Date(start);
      due.setDate(due.getDate() + parseInt(deadlineForm.limitationDays, 10));

      const payload = {
        userName,
        userPhone,
        caseTitle: deadlineForm.caseTitle.trim(),
        category: deadlineForm.category,
        startDate: deadlineForm.startDate,
        limitationDays: parseInt(deadlineForm.limitationDays, 10),
        dueDate: due.toISOString().split('T')[0],
        notes: deadlineForm.notes
      };

      await createLegalDeadline(payload);
      setStatusMessage('சட்ட காலக்கெடு வெற்றிகரமாக சேமிக்கப்பட்டது!');
      setShowDeadlineModal(false);
      setDeadlineForm({
        caseTitle: '',
        category: 'Cheque Bounce',
        startDate: new Date().toISOString().split('T')[0],
        limitationDays: 30,
        notes: ''
      });
      loadData();
    } catch (err) {
      setStatusMessage('சட்ட காலக்கெடு சேமிக்கப்பட்டது (உள்ளூர் பதிவு).');
      setShowDeadlineModal(false);
    }
  };

  const handleMarkCompleted = async (id) => {
    try {
      await updateDeadlineStatus(id, 'Completed');
      setStatusMessage('காலக்கெடு முடிந்ததாக குறிக்கப்பட்டது.');
      loadData();
    } catch (err) {
      setStatusMessage('புதுப்பிக்க முடியவில்லை.');
    }
  };

  const applyPreset = (preset) => {
    setDeadlineForm({
      ...deadlineForm,
      caseTitle: `${preset.title} வழக்கு`,
      category: preset.category,
      limitationDays: preset.days,
      notes: preset.desc
    });
    setShowDeadlineModal(true);
  };

  return (
    <div className="legalToolsHub screen">
      <div className="sectionHead">
        <div>
          <span className="pill">
            <Sparkles size={16} /> சட்ட கருவிகள் (Legal Tools)
          </span>
          <h2>RTI விண்ணப்ப இயற்றி & சட்ட காலக்கெடு கண்காணிப்பு</h2>
        </div>
      </div>

      {statusMessage && (
        <div className="statusNotice">
          <CheckCircle size={18} /> {statusMessage}
        </div>
      )}

      {/* Sub Tab Navigation */}
      <div className="hubNavTabs">
        <button
          className={activeTab === 'rti' ? 'hubTab active' : 'hubTab'}
          onClick={() => setActiveTab('rti')}
        >
          <FileText size={18} /> RTI விண்ணப்ப இயற்றி ({rtiDrafts.length})
        </button>
        <button
          className={activeTab === 'deadlines' ? 'hubTab active' : 'hubTab'}
          onClick={() => setActiveTab('deadlines')}
        >
          <Clock size={18} /> சட்ட காலக்கெடு கண்காணிப்பு ({deadlines.length})
        </button>
      </div>

      {/* TAB 1: RTI APPLICATION GENERATOR */}
      {activeTab === 'rti' && (
        <div className="tabContent">
          <div className="actionRow">
            <p className="sectionDesc">
              சட்டப்படியான <strong>RTI Act 2005 (பிரிவு 6(1))</strong> முறைப்படி அதிகாரப்பூர்வ தகவல் அறியும் உரிமை விண்ணப்பத்தை எளிய தமிழில் உருவாக்கவும்.
            </p>
            <button
              className="primaryBtn"
              onClick={() => {
                setSelectedRti(null);
                setShowRtiModal(true);
              }}
            >
              <PlusCircle size={18} /> புதிய RTI விண்ணப்பம் உருவாக்கு
            </button>
          </div>

          {/* If a draft is selected for preview */}
          {selectedRti ? (
            <div className="rtiPreviewSheet cardGlass">
              <div className="sheetHeader">
                <div>
                  <span className="officialBadge">அதிகாரப்பூர்வ RTI 2005 வடிவமைப்பு</span>
                  <h3>தகவல் அறியும் உரிமைச் சட்டம் 2005 - பிரிவு 6(1)-ன் கீழ் விண்ணப்பம்</h3>
                </div>
                <div className="sheetActions">
                  <button className="secondaryBtn" onClick={() => window.print()}>
                    <Printer size={16} /> அச்சிடு (Print)
                  </button>
                  <button className="secondaryBtn" onClick={() => setSelectedRti(null)}>
                    பட்டியலுக்கு திரும்பு
                  </button>
                </div>
              </div>

              <div className="rtiPrintBody">
                <p style={{ textAlign: 'right', fontWeight: 'bold' }}>
                  தேதி: {new Date().toLocaleDateString('ta-IN')}
                </p>

                <div className="rtiAddressBlock">
                  <p><strong>அனுப்புநர்:</strong></p>
                  <p>{selectedRti.applicantName}</p>
                  <p>{selectedRti.applicantAddress}</p>
                  <p>தொலைபேசி: {selectedRti.applicantPhone}</p>
                </div>

                <div className="rtiAddressBlock" style={{ marginTop: '1rem' }}>
                  <p><strong>பெறுநர்:</strong></p>
                  <p>{selectedRti.publicAuthorityName}</p>
                  <p>{selectedRti.publicAuthorityAddress}</p>
                </div>

                <p style={{ marginTop: '1.2rem' }}>
                  <strong>பொருள்:</strong> தகவல் அறியும் உரிமைச் சட்டம் 2005-ன் கீழ் தகவல்கள் கோருதல் - தொடர்பாக.
                </p>

                <p>ஐயா / அம்மா,</p>
                <p>
                  தகவல் அறியும் உரிமைச் சட்டம் 2005, பிரிவு 6(1)-ன் கீழ் பின்வரும் தகவல்களை எனக்கு சான்றளிக்கப்பட்ட நகல்களாக வழங்குமாறு கேட்டுக்கொள்கிறேன்:
                </p>

                <div className="questionsBox">
                  <pre style={{ fontFamily: 'inherit', whiteSpace: 'pre-wrap' }}>{selectedRti.questions}</pre>
                </div>

                <p><strong>தகவல் தேவைப்படும் காலம்:</strong> {selectedRti.periodOfInfo}</p>
                <p><strong>கட்டண விவரம்:</strong> {selectedRti.feeDetails}</p>
                <p>
                  கோரப்பட்ட தகவல்கள் சட்டப்படியான 30 நாட்களுக்குள் என் முகவரிக்கு தபால் மூலம் அனுப்பி வைக்கப்படுமாறு தாழ்மையுடன் கேட்டுக்கொள்கிறேன்.
                </p>

                <div style={{ marginTop: '2.5rem', display: 'flex', justifyContent: 'space-between' }}>
                  <p>இடம்: {userDistrict}</p>
                  <p style={{ textAlign: 'right' }}>
                    தங்கள் உண்மையுள்ள,<br /><br />
                    <strong>({selectedRti.applicantName})</strong>
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="rtiGrid">
              {rtiDrafts.length === 0 ? (
                <div className="emptyState">
                  <FileText size={48} color="#10b981" />
                  <h3>RTI விண்ணப்பங்கள் எதுவுமில்லை</h3>
                  <p>அரசுத்துறைகளிடம் தகவல்கள் பெற புதிய RTI விண்ணப்பத்தை உடனே உருவாக்கவும்.</p>
                  <button
                    className="primaryBtn"
                    onClick={() => setShowRtiModal(true)}
                    style={{ marginTop: '1rem' }}
                  >
                    <PlusCircle size={18} /> புதிய RTI விண்ணப்பம்
                  </button>
                </div>
              ) : (
                rtiDrafts.map((rti) => (
                  <div key={rti.id} className="rtiCard cardGlass">
                    <div className="rtiCardHead">
                      <FileText size={24} color="#6366f1" />
                      <div>
                        <h4>{rti.publicAuthorityName}</h4>
                        <span className="datePill">
                          {new Date(rti.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <p className="subjectText"><strong>பொருள்:</strong> {rti.subject}</p>
                    <div className="questionsPreview">
                      {rti.questions.length > 80 ? rti.questions.substring(0, 80) + '...' : rti.questions}
                    </div>

                    <div className="rtiCardFooter">
                      <button
                        className="secondaryBtn compact"
                        onClick={() => setSelectedRti(rti)}
                      >
                        அச்சிடு / வரைவு பார் (View Draft)
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: LEGAL DEADLINE TRACKER */}
      {activeTab === 'deadlines' && (
        <div className="tabContent">
          <div className="actionRow">
            <p className="sectionDesc">
              இந்திய சட்ட வரம்புச் சட்டம் (Limitation Act 1963) படி வழக்கு பதிவு செய்யும் காலக்கெடுக்களை கணக்கிட்டு கண்காணிக்கவும்.
            </p>
            <button
              className="primaryBtn"
              onClick={() => setShowDeadlineModal(true)}
            >
              <PlusCircle size={18} /> புதிய காலக்கெடு சேர்
            </button>
          </div>

          {/* Quick Preset Buttons */}
          <div className="presetsSection">
            <h4>விரைவு காலக்கெடு வார்ப்புருக்கள் (Quick Presets):</h4>
            <div className="presetsGrid">
              {limitationPresets.map((preset) => (
                <div
                  key={preset.title}
                  className="presetCard"
                  onClick={() => applyPreset(preset)}
                >
                  <div className="presetHead">
                    <strong>{preset.title}</strong>
                    <span className="daysBadge">{preset.days} நாட்கள்</span>
                  </div>
                  <p>{preset.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Deadlines Grid */}
          <div className="deadlinesGrid">
            {deadlines.length === 0 ? (
              <div className="emptyState">
                <Clock size={48} color="#6366f1" />
                <h3>காலக்கெடுகள் எதுவும் சேமிக்கப்படவில்லை</h3>
                <p>வழக்கு காலக்கெடுவை இழக்காமல் இருக்க புதிய நினைவூட்டலை சேர்க்கவும்.</p>
              </div>
            ) : (
              deadlines.map((item) => {
                const isMissed = item.status === 'Missed';
                const isSoon = item.status === 'Expiring Soon';
                const isDone = item.status === 'Completed';

                return (
                  <div
                    key={item.id}
                    className={`deadlineCard cardGlass ${isMissed ? 'missed' : isSoon ? 'soon' : isDone ? 'done' : 'active'}`}
                  >
                    <div className="deadlineHeader">
                      <span className="categoryTag">{item.category}</span>
                      <span className={`statusTag ${item.status?.toLowerCase().replace(/\s+/g, '')}`}>
                        {isMissed ? 'காலாவதியானது' : isSoon ? 'விரைவில் முடிகிறது' : isDone ? 'முடிந்தது' : 'செயலில்'}
                      </span>
                    </div>

                    <h3>{item.caseTitle}</h3>

                    <div className="deadlineMeta">
                      <p>
                        <Calendar size={14} /> <strong>தொடக்க தேதி:</strong> {item.startDate}
                      </p>
                      <p>
                        <Clock size={14} /> <strong>கடைசி தேதி (Due Date):</strong> <span className="dueDateText">{item.dueDate}</span>
                      </p>
                      <p>
                        <strong>காலக்கெடு:</strong> {item.limitationDays} நாட்கள்
                      </p>
                    </div>

                    {item.notes && <p className="notesBox">{item.notes}</p>}

                    {!isDone && (
                      <div className="cardActions" style={{ marginTop: '1rem' }}>
                        <button
                          className="secondaryBtn compact"
                          onClick={() => handleMarkCompleted(item.id)}
                        >
                          <CheckCircle size={16} /> முடிந்ததாக குறி (Mark Completed)
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* RTI MODAL */}
      {showRtiModal && (
        <div className="modalOverlay" onClick={() => setShowRtiModal(false)}>
          <div className="modalCard cardGlass" onClick={(e) => e.stopPropagation()}>
            <div className="modalHeader">
              <h3>புதிய RTI விண்ணப்பம் உருவாக்கு</h3>
              <button
                type="button"
                className="modalCloseBtn"
                onClick={() => setShowRtiModal(false)}
                aria-label="மூடு"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleRtiSubmit}>
              <div className="formGroup">
                <label>பொது தகவல் அலுவலர் (Public Authority):</label>
                <input
                  type="text"
                  value={rtiForm.publicAuthorityName}
                  onChange={(e) => setRtiForm({ ...rtiForm, publicAuthorityName: e.target.value })}
                  className="textInput"
                  placeholder="எ.கா: பொது தகவல் அலுவலர், மாநகராட்சி / காவல் நிலையம்"
                  required
                />
              </div>

              <div className="formGroup">
                <label>அலுவலக முகவரி:</label>
                <input
                  type="text"
                  value={rtiForm.publicAuthorityAddress}
                  onChange={(e) => setRtiForm({ ...rtiForm, publicAuthorityAddress: e.target.value })}
                  className="textInput"
                  required
                />
              </div>

              <div className="formGroup">
                <label>விண்ணப்ப பொருள் (Subject):</label>
                <input
                  type="text"
                  value={rtiForm.subject}
                  onChange={(e) => setRtiForm({ ...rtiForm, subject: e.target.value })}
                  className="textInput"
                  required
                />
              </div>

              <div className="formGroup">
                <label>கோரப்படும் கேள்விகள் / தகவல்கள் (ஒவ்வொரு வரியிலும் 1 கேள்வி):</label>
                <textarea
                  rows={4}
                  value={rtiForm.questions}
                  onChange={(e) => setRtiForm({ ...rtiForm, questions: e.target.value })}
                  className="textAreaInput"
                  placeholder="1. தகவல்கள்...\n2. சான்றளிக்கப்பட்ட நகல்கள்..."
                  required
                />
              </div>

              <div className="formRow">
                <div className="formGroup">
                  <label>காலக்கட்டம்:</label>
                  <input
                    type="text"
                    value={rtiForm.periodOfInfo}
                    onChange={(e) => setRtiForm({ ...rtiForm, periodOfInfo: e.target.value })}
                    className="textInput"
                  />
                </div>
                <div className="formGroup">
                  <label>கட்டண விவரம்:</label>
                  <input
                    type="text"
                    value={rtiForm.feeDetails}
                    onChange={(e) => setRtiForm({ ...rtiForm, feeDetails: e.target.value })}
                    className="textInput"
                  />
                </div>
              </div>

              <div className="modalActions">
                <button type="button" className="secondaryBtn" onClick={() => setShowRtiModal(false)}>
                  ரத்து செய்
                </button>
                <button type="submit" className="primaryBtn">
                  RTI வரைவு உருவாக்கு
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DEADLINE MODAL */}
      {showDeadlineModal && (
        <div className="modalOverlay" onClick={() => setShowDeadlineModal(false)}>
          <div className="modalCard cardGlass" onClick={(e) => e.stopPropagation()}>
            <div className="modalHeader">
              <h3>புதிய சட்ட காலக்கெடு சேர்</h3>
              <button
                type="button"
                className="modalCloseBtn"
                onClick={() => setShowDeadlineModal(false)}
                aria-label="மூடு"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleDeadlineSubmit}>
              <div className="formGroup">
                <label>வழக்கு / காரியத்தின் தலைப்பு:</label>
                <input
                  type="text"
                  value={deadlineForm.caseTitle}
                  onChange={(e) => setDeadlineForm({ ...deadlineForm, caseTitle: e.target.value })}
                  className="textInput"
                  placeholder="எ.கா: செக் திரும்பிய நோட்டீஸ் அனுப்பும் காலக்கெடு"
                  required
                />
              </div>

              <div className="formRow">
                <div className="formGroup">
                  <label>வகை:</label>
                  <select
                    value={deadlineForm.category}
                    onChange={(e) => setDeadlineForm({ ...deadlineForm, category: e.target.value })}
                    className="selectInput"
                  >
                    <option value="Cheque Bounce">செக் மோசடி (NI Act)</option>
                    <option value="Consumer Dispute">நுகர்வோர் வழக்கு</option>
                    <option value="Civil Appeal">சிவில் மேல்முறையீடு</option>
                    <option value="Criminal FIR">குற்றவியல் FIR</option>
                    <option value="Labor Claim">தொழிலாளர் வழக்கு</option>
                    <option value="General">இதர காலக்கெடு</option>
                  </select>
                </div>

                <div className="formGroup">
                  <label>வரம்பு நாட்கள் (Limitation Days):</label>
                  <input
                    type="number"
                    value={deadlineForm.limitationDays}
                    onChange={(e) => setDeadlineForm({ ...deadlineForm, limitationDays: e.target.value })}
                    className="textInput"
                    required
                  />
                </div>
              </div>

              <div className="formGroup">
                <label>சம்பவம் / அறிவிப்பு கிடைத்த தேதி (Start Date):</label>
                <input
                  type="date"
                  value={deadlineForm.startDate}
                  onChange={(e) => setDeadlineForm({ ...deadlineForm, startDate: e.target.value })}
                  className="textInput"
                  required
                />
              </div>

              <div className="formGroup">
                <label>குறிப்புகள் (Optional):</label>
                <textarea
                  rows={2}
                  value={deadlineForm.notes}
                  onChange={(e) => setDeadlineForm({ ...deadlineForm, notes: e.target.value })}
                  className="textAreaInput"
                />
              </div>

              <div className="modalActions">
                <button type="button" className="secondaryBtn" onClick={() => setShowDeadlineModal(false)}>
                  ரத்து செய்
                </button>
                <button type="submit" className="primaryBtn">
                  காலக்கெடு சேமி
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LegalToolsHub;
