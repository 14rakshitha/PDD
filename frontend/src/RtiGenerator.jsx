import React, { useState, useEffect } from 'react';
import {
  FileText,
  Printer,
  PlusCircle,
  CheckCircle,
  AlertCircle,
  Building,
  User,
  Calendar,
  Sparkles,
  X
} from 'lucide-react';
import { generateRtiDraft, fetchMyRtiDrafts } from './api';
import './styles.css';

const RtiGenerator = () => {
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

  const loadData = async () => {
    try {
      const rtis = await fetchMyRtiDrafts(userName, userPhone);
      setRtiDrafts(Array.isArray(rtis) ? rtis : []);
    } catch (err) {
      console.error('Error loading RTI data:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, [userName, userPhone]);

  const handleRtiSubmit = async (e) => {
    e.preventDefault();
    const draftPayload = {
      ...rtiForm,
      applicantName: userName,
      applicantPhone: userPhone,
      createdAt: new Date().toISOString()
    };
    
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

  return (
    <div className="rtiGeneratorScreen screen">
      <div className="sectionHead">
        <div>
          <span className="pill">
            <FileText size={16} /> RTI Act 2005
          </span>
          <h2>RTI விண்ணப்ப இயற்றி (RTI Application Generator)</h2>
        </div>
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

      {statusMessage && (
        <div className="statusNotice">
          <CheckCircle size={18} /> {statusMessage}
        </div>
      )}

      {selectedRti ? (
        <div className="rtiPreviewSheet cardGlass">
          <div className="sheetHeader">
            <div>
              <span className="officialBadge">அதிகாரப்பூர்வ RTI 2005 வடிவமைப்பு</span>
              <h3>தகவல் அறியும் உரிமைச் சட்டம் 2005 - பிரிவு 6(1)-ன் கீழ் விண்ணப்பம்</h3>
            </div>
            <div className="sheetActions">
              <button className="primaryBtn" onClick={() => window.print()}>
                <Printer size={16} /> அச்சிடு (Print / PDF)
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

            <div className="rtiAddressBlock" style={{ marginTop: '1.2rem' }}>
              <p><strong>பெறுநர்:</strong></p>
              <p>{selectedRti.publicAuthorityName}</p>
              <p>{selectedRti.publicAuthorityAddress}</p>
            </div>

            <p style={{ marginTop: '1.4rem' }}>
              <strong>பொருள்:</strong> தகவல் அறியும் உரிமைச் சட்டம் 2005-ன் கீழ் தகவல்கள் கோருதல் - தொடர்பாக.
            </p>

            <p>ஐயா / அம்மா,</p>
            <p>
              தகவல் அறியும் உரிமைச் சட்டம் 2005, பிரிவு 6(1)-ன் கீழ் பின்வரும் தகவல்களை எனக்கு சான்றளிக்கப்பட்ட நகல்களாக வழங்குமாறு கேட்டுக்கொள்கிறேன்:
            </p>

            <div className="questionsBox">
              <pre style={{ fontFamily: 'inherit', whiteSpace: 'pre-wrap', margin: 0 }}>{selectedRti.questions}</pre>
            </div>

            <p><strong>தகவல் தேவைப்படும் காலம்:</strong> {selectedRti.periodOfInfo}</p>
            <p><strong>கட்டண விவரம்:</strong> {selectedRti.feeDetails}</p>
            <p>
              கோரப்பட்ட தகவல்கள் சட்டப்படியான 30 நாட்களுக்குள் என் முகவரிக்கு தபால் மூலம் அனுப்பி வைக்கப்படுமாறு தாழ்மையுடன் கேட்டுக்கொள்கிறேன்.
            </p>

            <div style={{ marginTop: '3rem', display: 'flex', justifyContent: 'space-between' }}>
              <p>இடம்: {userDistrict}</p>
              <p style={{ textAlign: 'right' }}>
                தங்கள் உண்மையுள்ள,<br /><br /><br />
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
    </div>
  );
};

export default RtiGenerator;
