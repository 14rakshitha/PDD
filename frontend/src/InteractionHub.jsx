import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  FileText,
  Lock,
  MessageSquare,
  Phone,
  Video,
  UserCheck,
  Upload,
  Share2,
  Send,
  CheckCircle,
  ShieldCheck,
  File,
  PlusCircle,
  AlertCircle
} from 'lucide-react';
import {
  bookConsultation,
  fetchClientConsultations,
  fetchLawyerConsultations,
  updateConsultationStatus,
  uploadVaultDocument,
  fetchMyVault,
  fetchSharedDocuments,
  shareVaultDocument,
  sendChatMessage,
  fetchChatHistory
} from './api';
import './styles.css';

const InteractionHub = ({ initialTab = 'appointments' }) => {
  const [activeTab, setActiveTab] = useState(initialTab); // 'appointments', 'vault', 'chat'
  const [session, setSession] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('lawvoice-session')) || {};
    } catch {
      return {};
    }
  });

  const isLawyer = session.role === 'lawyer';
  const userName = session.name || (isLawyer ? 'Adv. ப்ரியா ராமன்' : 'டெமோ பயனர்');
  const userPhone = session.phone || '+91 98765 43210';
  const lawyerId = session.id || 1;

  // --- State ---
  const [consultations, setConsultations] = useState([]);
  const [vaultDocs, setVaultDocs] = useState([]);
  const [sharedDocs, setSharedDocs] = useState([]);
  const [selectedConsultation, setSelectedConsultation] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  // Booking Modal / Form State
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    lawyerName: 'Adv. ப்ரியா ராமன்',
    lawyerId: 1,
    consultationType: 'Phone', // Phone, Video, Chamber Visit
    preferredDate: new Date().toISOString().split('T')[0],
    preferredTime: '10:00 AM',
    issueSummary: ''
  });

  // Vault Upload State
  const [uploadForm, setUploadForm] = useState({
    fileName: '',
    docCategory: 'Evidence', // FIR, Contract, ID Proof, Evidence, General
    fileData: ''
  });
  const [uploading, setUploading] = useState(false);

  // Load Data
  const loadData = async () => {
    try {
      if (isLawyer) {
        const cons = await fetchLawyerConsultations(lawyerId, userName);
        setConsultations(Array.isArray(cons) ? cons : []);
        const sDocs = await fetchSharedDocuments(lawyerId, userName);
        setSharedDocs(Array.isArray(sDocs) ? sDocs : []);
      } else {
        const cons = await fetchClientConsultations(userName, userPhone);
        setConsultations(Array.isArray(cons) ? cons : []);
        const docs = await fetchMyVault(userName, userPhone);
        setVaultDocs(Array.isArray(docs) ? docs : []);
      }
    } catch (err) {
      console.error('Error loading interaction data:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, [isLawyer, userName, userPhone]);

  // Load Chat Messages when consultation selected
  useEffect(() => {
    let interval;
    if (selectedConsultation?.id) {
      const loadChat = async () => {
        try {
          const msgs = await fetchChatHistory(selectedConsultation.id);
          setChatMessages(Array.isArray(msgs) ? msgs : []);
        } catch (err) {
          console.error('Error fetching chat history:', err);
        }
      };
      loadChat();
      interval = setInterval(loadChat, 3000); // Polling every 3 seconds for live chat
    }
    return () => clearInterval(interval);
  }, [selectedConsultation]);

  // --- Handlers ---
  const handleBookSubmit = async (e) => {
    e.preventDefault();
    if (!bookingForm.issueSummary.trim()) {
      setStatusMessage('உங்கள் வழக்கு/கேள்வியின் சுருக்கத்தை பதிவு செய்யவும்.');
      return;
    }
    try {
      const payload = {
        clientName: userName,
        clientPhone: userPhone,
        clientEmail: session.email || `${userName.toLowerCase().replace(/\s+/g, '')}@lawvoice.com`,
        lawyerId: bookingForm.lawyerId,
        lawyerName: bookingForm.lawyerName,
        consultationType: bookingForm.consultationType,
        preferredDate: bookingForm.preferredDate,
        preferredTime: bookingForm.preferredTime,
        issueSummary: bookingForm.issueSummary,
        status: 'Pending'
      };
      const res = await bookConsultation(payload);
      setStatusMessage('சந்திப்பு பதிவு வெற்றிகரமாக சமர்ப்பிக்கப்பட்டது!');
      setShowBookingModal(false);
      setBookingForm({ ...bookingForm, issueSummary: '' });
      loadData();
    } catch (err) {
      setStatusMessage('சந்திப்பு பதிவில் பிழை ஏற்பட்டது.');
    }
  };

  const handleStatusChange = async (consultationId, newStatus) => {
    try {
      await updateConsultationStatus(consultationId, newStatus);
      setStatusMessage(`சந்திப்பு நிலை '${newStatus}' என புதுப்பிக்கப்பட்டது.`);
      loadData();
    } catch (err) {
      setStatusMessage('நிலையை புதுப்பிக்க முடியவில்லை.');
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const reader = new FileReader();
    reader.onload = async (uploadEvent) => {
      const base64Data = uploadEvent.target.result;
      try {
        const payload = {
          ownerName: userName,
          ownerPhone: userPhone,
          fileName: file.name,
          fileType: file.type || 'application/octet-stream',
          docCategory: uploadForm.docCategory,
          fileData: base64Data
        };
        await uploadVaultDocument(payload);
        setStatusMessage(`ஆவணம் '${file.name}' பாதுகாப்பாக பெட்டகத்தில் சேமிக்கப்பட்டது!`);
        setUploadForm({ fileName: '', docCategory: 'Evidence', fileData: '' });
        setUploading(false);
        loadData();
      } catch (err) {
        setStatusMessage('ஆவணம் பதிவேற்றுவதில் பிழை.');
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleShareDoc = async (docId, lawyerId, lawyerName, consultationId) => {
    try {
      await shareVaultDocument(docId, lawyerId, lawyerName, consultationId);
      setStatusMessage('ஆவணம் வழக்கறிஞருக்கு வெற்றிகரமாக பகிரப்பட்டது!');
      loadData();
    } catch (err) {
      setStatusMessage('ஆவணம் பகிர்தலில் பிழை.');
    }
  };

  const handleSendChat = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConsultation) return;

    try {
      const payload = {
        consultationId: selectedConsultation.id,
        senderName: userName,
        senderRole: isLawyer ? 'lawyer' : 'people',
        receiverName: isLawyer ? selectedConsultation.clientName : selectedConsultation.lawyerName,
        messageText: newMessage.trim()
      };
      await sendChatMessage(payload);
      setNewMessage('');
      const msgs = await fetchChatHistory(selectedConsultation.id);
      setChatMessages(Array.isArray(msgs) ? msgs : []);
    } catch (err) {
      setStatusMessage('செய்தி அனுப்புவதில் பிழை.');
    }
  };

  return (
    <div className="interactionHub screen">
      <div className="sectionHead">
        <div>
          <span className="pill">
            <ShieldCheck size={16} /> வழக்கறிஞர் - கிளையண்ட் உரையாடல்
          </span>
          <h2>சந்திப்புகள், ஆவணப் பெட்டகம் & நேரடி அரட்டை</h2>
        </div>
        {!isLawyer && (
          <button
            className="primaryBtn"
            onClick={() => setShowBookingModal(true)}
          >
            <PlusCircle size={18} /> புதிய சந்திப்பு பதிவு
          </button>
        )}
      </div>

      {statusMessage && (
        <div className="statusNotice">
          <AlertCircle size={18} /> {statusMessage}
        </div>
      )}

      {/* Sub Tab Navigation */}
      <div className="hubNavTabs">
        <button
          className={activeTab === 'appointments' ? 'hubTab active' : 'hubTab'}
          onClick={() => setActiveTab('appointments')}
        >
          <Calendar size={18} /> சந்திப்புகள் ({consultations.length})
        </button>
        <button
          className={activeTab === 'vault' ? 'hubTab active' : 'hubTab'}
          onClick={() => setActiveTab('vault')}
        >
          <Lock size={18} /> ஆவண பெட்டகம் ({isLawyer ? sharedDocs.length : vaultDocs.length})
        </button>
        <button
          className={activeTab === 'chat' ? 'hubTab active' : 'hubTab'}
          onClick={() => setActiveTab('chat')}
        >
          <MessageSquare size={18} /> நேரடி அரட்டை
        </button>
      </div>

      {/* TAB 1: APPOINTMENTS */}
      {activeTab === 'appointments' && (
        <div className="tabContent">
          {consultations.length === 0 ? (
            <div className="emptyState">
              <Calendar size={48} color="#6366f1" />
              <h3>இன்னும் சந்திப்புகள் பதிவு செய்யப்படவில்லை</h3>
              <p>வழக்கறிஞருடன் ஆலோசனை செய்ய புதிய சந்திப்பை பதிவு செய்யவும்.</p>
              {!isLawyer && (
                <button
                  className="primaryBtn"
                  onClick={() => setShowBookingModal(true)}
                  style={{ marginTop: '1rem' }}
                >
                  <PlusCircle size={18} /> சந்திப்பு பதிவு செய்
                </button>
              )}
            </div>
          ) : (
            <div className="consultationGrid">
              {consultations.map((item) => (
                <div key={item.id} className="consultationCard">
                  <div className="cardHeader">
                    <span className={`typeBadge ${item.consultationType}`}>
                      {item.consultationType === 'Phone' && <Phone size={14} />}
                      {item.consultationType === 'Video' && <Video size={14} />}
                      {item.consultationType === 'Chamber Visit' && <UserCheck size={14} />}
                      {item.consultationType === 'Phone' ? 'தொலைபேசி' : item.consultationType === 'Video' ? 'வீடியோ அழைப்பு' : 'நேரடி சந்திப்பு'}
                    </span>
                    <span className={`statusBadge ${item.status?.toLowerCase()}`}>
                      {item.status}
                    </span>
                  </div>

                  <div className="cardBody">
                    <h4>{isLawyer ? item.clientName : item.lawyerName}</h4>
                    <p className="metaLine">
                      <Calendar size={14} /> {item.preferredDate} | <Clock size={14} /> {item.preferredTime}
                    </p>
                    <p className="metaLine">
                      <Phone size={14} /> {isLawyer ? item.clientPhone : 'சரிபார்க்கப்பட்ட எண்'}
                    </p>
                    <div className="issueBox">
                      <strong>வழக்கு சுருக்கம்:</strong> {item.issueSummary}
                    </div>
                  </div>

                  <div className="cardActions">
                    <button
                      className="secondaryBtn compact"
                      onClick={() => {
                        setSelectedConsultation(item);
                        setActiveTab('chat');
                      }}
                    >
                      <MessageSquare size={16} /> நேரடி அரட்டை
                    </button>

                    {isLawyer && item.status === 'Pending' && (
                      <button
                        className="primaryBtn compact"
                        onClick={() => handleStatusChange(item.id, 'Confirmed')}
                      >
                        <CheckCircle size={16} /> உறுதிசெய்
                      </button>
                    )}
                    {isLawyer && item.status === 'Confirmed' && (
                      <button
                        className="secondaryBtn compact"
                        onClick={() => handleStatusChange(item.id, 'Completed')}
                      >
                        <CheckCircle size={16} /> முடிந்தது
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: DOCUMENT VAULT */}
      {activeTab === 'vault' && (
        <div className="tabContent">
          {!isLawyer && (
            <div className="uploadSection cardGlass">
              <div className="uploadHeader">
                <Lock size={20} color="#10b981" />
                <h3>AES-256 பாதுகாக்கப்பட்ட சான்று & ஆவண பெட்டகம்</h3>
              </div>
              <p>உங்கள் வழக்கு ஆவணங்கள், FIR நகல்கள், அடையாள சான்றுகளை பாதுகாப்பாக பதிவேற்றவும்.</p>

              <div className="uploadControls">
                <select
                  value={uploadForm.docCategory}
                  onChange={(e) => setUploadForm({ ...uploadForm, docCategory: e.target.value })}
                  className="selectInput"
                >
                  <option value="Evidence">வழக்கு ஆதாரம் / Evidence</option>
                  <option value="FIR">காவல் நிலைய FIR நகல்</option>
                  <option value="Contract">ஒப்பந்தம் / Rental Agreement</option>
                  <option value="ID Proof">அடையாள சான்று (Aadhaar/PAN)</option>
                  <option value="General">இதர ஆவணங்கள்</option>
                </select>

                <label className="uploadBtn">
                  <Upload size={18} /> {uploading ? 'பதிவேற்றுகிறது...' : 'ஆவணம் தேர்ந்தெடு'}
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>
            </div>
          )}

          <div className="vaultGrid">
            {(isLawyer ? sharedDocs : vaultDocs).length === 0 ? (
              <div className="emptyState">
                <FileText size={48} color="#10b981" />
                <h3>ஆவணங்கள் எதுவுமில்லை</h3>
                <p>{isLawyer ? 'கிளையண்டுகள் பகிர்ந்த ஆவணங்கள் இங்கே தோன்றும்.' : 'உங்கள் ஆவணங்களை பெட்டகத்தில் பதிவேற்றவும்.'}</p>
              </div>
            ) : (
              (isLawyer ? sharedDocs : vaultDocs).map((doc) => (
                <div key={doc.id} className="vaultCard cardGlass">
                  <div className="docHeader">
                    <File size={28} color="#6366f1" />
                    <div>
                      <h4>{doc.fileName}</h4>
                      <span className="categoryBadge">{doc.docCategory}</span>
                    </div>
                  </div>

                  <div className="docMeta">
                    <p><strong>உரிமையாளர்:</strong> {doc.ownerName}</p>
                    <p><strong>தேதி:</strong> {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : 'சமீபத்தியது'}</p>
                    {doc.sharedWithLawyerName && (
                      <p className="sharedTag">
                        <Share2 size={13} /> பகிர்வு: {doc.sharedWithLawyerName}
                      </p>
                    )}
                  </div>

                  {!isLawyer && (
                    <div className="shareActions">
                      <select
                        onChange={(e) => {
                          const consId = e.target.value;
                          const cons = consultations.find((c) => String(c.id) === String(consId));
                          if (cons) {
                            handleShareDoc(doc.id, cons.lawyerId, cons.lawyerName, cons.id);
                          }
                        }}
                        defaultValue=""
                        className="selectInput compact"
                      >
                        <option value="" disabled>வழக்கறிஞருக்கு பகிர்...</option>
                        {consultations.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.lawyerName} ({c.preferredDate})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {doc.fileData && (
                    <a
                      href={doc.fileData}
                      download={doc.fileName}
                      className="secondaryBtn compact"
                      style={{ marginTop: '0.5rem', textAlign: 'center', display: 'block' }}
                    >
                      ஆவணம் பதிவிறக்கு
                    </a>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 3: DIRECT CHAT */}
      {activeTab === 'chat' && (
        <div className="tabContent chatSection">
          <div className="chatSidebar cardGlass">
            <h3>அரட்டை அமர்வுகள்</h3>
            {consultations.length === 0 ? (
              <p className="emptyText">அரட்டை செய்ய சந்திப்புகள் எதுவும் இல்லை.</p>
            ) : (
              consultations.map((c) => (
                <div
                  key={c.id}
                  className={selectedConsultation?.id === c.id ? 'chatSessionItem active' : 'chatSessionItem'}
                  onClick={() => setSelectedConsultation(c)}
                >
                  <div className="sessionName">{isLawyer ? c.clientName : c.lawyerName}</div>
                  <div className="sessionMeta">
                    {c.consultationType} • {c.preferredDate}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="chatWindow cardGlass">
            {selectedConsultation ? (
              <>
                <div className="chatHeader">
                  <div>
                    <h4>{isLawyer ? selectedConsultation.clientName : selectedConsultation.lawyerName}</h4>
                    <span className="statusMini">{selectedConsultation.status}</span>
                  </div>
                  <span className="typePill">{selectedConsultation.consultationType}</span>
                </div>

                <div className="chatMessagesList">
                  {chatMessages.length === 0 ? (
                    <div className="chatPlaceholder">
                      <MessageSquare size={36} color="#9ca3af" />
                      <p>உங்கள் ஆலோசனையை தொடங்க செய்தியை அனுப்பவும்.</p>
                    </div>
                  ) : (
                    chatMessages.map((msg) => {
                      const isMe = msg.senderName === userName || (isLawyer && msg.senderRole === 'lawyer') || (!isLawyer && msg.senderRole === 'people');
                      return (
                        <div key={msg.id} className={isMe ? 'messageBubble sent' : 'messageBubble received'}>
                          <div className="messageSender">{msg.senderName}</div>
                          <div className="messageText">{msg.messageText}</div>
                          <div className="messageTime">
                            {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <form className="chatInputForm" onSubmit={handleSendChat}>
                  <input
                    type="text"
                    placeholder="செய்தியை உள்ளிடவும் (Tamil / English)..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="chatInput"
                  />
                  <button type="submit" className="sendBtn">
                    <Send size={18} />
                  </button>
                </form>
              </>
            ) : (
              <div className="chatPlaceholder">
                <MessageSquare size={48} color="#6366f1" />
                <h3>அரட்டையை தேர்ந்தெடுக்கவும்</h3>
                <p>இடதுபுற பட்டியலில் இருந்து வழக்கறிஞர் அல்லது கிளையண்டின் சந்திப்பை தேர்ந்தெடுக்கவும்.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* BOOKING MODAL */}
      {showBookingModal && (
        <div className="modalOverlay">
          <div className="modalCard cardGlass">
            <h3>புதிய வழக்கறிஞர் சந்திப்பு பதிவு</h3>
            <form onSubmit={handleBookSubmit}>
              <div className="formGroup">
                <label>வழக்கறிஞர் பெயர்:</label>
                <select
                  value={bookingForm.lawyerName}
                  onChange={(e) => {
                    const selectedName = e.target.value;
                    const ids = { 'Adv. ப்ரியா ராமன்': 1, 'Adv. மீனா ராஜ்': 2, 'Adv. பிரகாஷ் வேல்': 3, 'Adv. லதா சிவா': 4 };
                    setBookingForm({ ...bookingForm, lawyerName: selectedName, lawyerId: ids[selectedName] || 1 });
                  }}
                  className="selectInput"
                >
                  <option value="Adv. ப்ரியா ராமன்">Adv. ப்ரியா ராமன் (குற்றவியல் சட்டம் - சென்னை)</option>
                  <option value="Adv. மீனா ராஜ்">Adv. மீனா ராஜ் (குடும்ப சட்டம் - மதுரை)</option>
                  <option value="Adv. பிரகாஷ் வேல்">Adv. பிரகாஷ் வேல் (நுகர்வோர் சட்டம் - கோவை)</option>
                  <option value="Adv. லதா சிவா">Adv. லதா சிவா (சொத்து சட்டம் - திருச்சி)</option>
                </select>
              </div>

              <div className="formGroup">
                <label>சந்திப்பு முறை:</label>
                <div className="radioGroup">
                  <label className="radioLabel">
                    <input
                      type="radio"
                      name="cType"
                      value="Phone"
                      checked={bookingForm.consultationType === 'Phone'}
                      onChange={(e) => setBookingForm({ ...bookingForm, consultationType: e.target.value })}
                    />
                    <Phone size={15} /> தொலைபேசி
                  </label>
                  <label className="radioLabel">
                    <input
                      type="radio"
                      name="cType"
                      value="Video"
                      checked={bookingForm.consultationType === 'Video'}
                      onChange={(e) => setBookingForm({ ...bookingForm, consultationType: e.target.value })}
                    />
                    <Video size={15} /> வீடியோ அழைப்பு
                  </label>
                  <label className="radioLabel">
                    <input
                      type="radio"
                      name="cType"
                      value="Chamber Visit"
                      checked={bookingForm.consultationType === 'Chamber Visit'}
                      onChange={(e) => setBookingForm({ ...bookingForm, consultationType: e.target.value })}
                    />
                    <UserCheck size={15} /> நேரில்
                  </label>
                </div>
              </div>

              <div className="formRow">
                <div className="formGroup">
                  <label>விருப்பமான தேதி:</label>
                  <input
                    type="date"
                    value={bookingForm.preferredDate}
                    onChange={(e) => setBookingForm({ ...bookingForm, preferredDate: e.target.value })}
                    className="textInput"
                    required
                  />
                </div>
                <div className="formGroup">
                  <label>விருப்பமான நேரம்:</label>
                  <select
                    value={bookingForm.preferredTime}
                    onChange={(e) => setBookingForm({ ...bookingForm, preferredTime: e.target.value })}
                    className="selectInput"
                  >
                    <option value="10:00 AM">10:00 AM</option>
                    <option value="11:30 AM">11:30 AM</option>
                    <option value="02:00 PM">02:00 PM</option>
                    <option value="04:30 PM">04:30 PM</option>
                    <option value="06:00 PM">06:00 PM</option>
                  </select>
                </div>
              </div>

              <div className="formGroup">
                <label>வழக்கு விவரம் / சுருக்கம்:</label>
                <textarea
                  rows={3}
                  placeholder="உங்கள் சட்ட கேள்வி அல்லது சிக்கலின் சிறு குறிப்பை எழுதவும்..."
                  value={bookingForm.issueSummary}
                  onChange={(e) => setBookingForm({ ...bookingForm, issueSummary: e.target.value })}
                  className="textAreaInput"
                  required
                />
              </div>

              <div className="modalActions">
                <button type="button" className="secondaryBtn" onClick={() => setShowBookingModal(false)}>
                  ரத்து செய்
                </button>
                <button type="submit" className="primaryBtn">
                  பதிவு உறுதிசெய்
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InteractionHub;
