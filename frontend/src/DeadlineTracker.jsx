import React, { useState, useEffect } from 'react';
import {
  Clock,
  PlusCircle,
  CheckCircle,
  Calendar,
  AlertTriangle,
  X,
  Sparkles
} from 'lucide-react';
import {
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

const DeadlineTracker = () => {
  const [session] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('lawvoice-session')) || {};
    } catch {
      return {};
    }
  });

  const userName = session.name || 'டெமோ பயனர்';
  const userPhone = session.phone || '+91 98765 43210';

  const [statusMessage, setStatusMessage] = useState('');
  const [deadlines, setDeadlines] = useState([]);
  const [showDeadlineModal, setShowDeadlineModal] = useState(false);
  const [deadlineForm, setDeadlineForm] = useState({
    caseTitle: '',
    category: 'Cheque Bounce',
    startDate: new Date().toISOString().split('T')[0],
    limitationDays: 30,
    notes: ''
  });

  const loadData = async () => {
    try {
      const dls = await fetchMyDeadlines(userName, userPhone);
      setDeadlines(Array.isArray(dls) ? dls : []);
    } catch (err) {
      console.error('Error loading deadlines:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, [userName, userPhone]);

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
    <div className="deadlineTrackerScreen screen">
      <div className="sectionHead">
        <div>
          <span className="pill">
            <Clock size={16} /> Limitation Act 1963
          </span>
          <h2>சட்ட காலக்கெடு மற்றும் வரம்பு கண்காணிப்பு (Legal Deadline Tracker)</h2>
        </div>
        <button
          className="primaryBtn"
          onClick={() => setShowDeadlineModal(true)}
        >
          <PlusCircle size={18} /> புதிய காலக்கெடு சேர்
        </button>
      </div>

      {statusMessage && (
        <div className="statusNotice">
          <CheckCircle size={18} /> {statusMessage}
        </div>
      )}

      {/* Quick Preset Buttons */}
      <div className="presetsSection">
        <h4>விரைவு காலக்கெடு வார்ப்புருக்கள் (Quick Limitation Presets):</h4>
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
            <button
              className="primaryBtn"
              onClick={() => setShowDeadlineModal(true)}
              style={{ marginTop: '1rem' }}
            >
              <PlusCircle size={18} /> புதிய காலக்கெடு
            </button>
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
                    <strong>வரம்பு காலக்கெடு:</strong> {item.limitationDays} நாட்கள்
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

export default DeadlineTracker;
