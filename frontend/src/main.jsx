import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Link, NavLink, Route, Routes, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  BookOpen,
  Bot,
  Calendar,
  ChevronRight,
  Clock,
  FileText,
  FileCheck2,
  History,
  Home,
  MapPin,
  Menu,
  Mic,
  Phone,
  Search,
  Settings,
  Shield,
  Sparkles,
  User,
  UserCheck,
  Volume2,
  X
} from 'lucide-react';
import LoginPage from './LoginPage';
import LawyerProfile from './LawyerProfile';
import PeopleLawyers from './PeopleLawyers';
import InteractionHub from './InteractionHub';
import RtiGenerator from './RtiGenerator';
import DeadlineTracker from './DeadlineTracker';
import LawyerLocationFinder from './LawyerLocationFinder';
import { buildTamilLegalAnswer } from './tamilLegalAssistant';
import { API } from './api';
import './styles.css';
const USER_ID = 'lawvoice-demo-user';
const USER_BASE = '/user-profile';

const getActiveUserId = () => {
  try {
    const session = JSON.parse(localStorage.getItem('lawvoice-session'));
    if (session && session.id) {
      return `user-${session.id}`;
    }
  } catch (e) {}
  return USER_ID;
};

const navItems = [
  { path: USER_BASE, label: 'முகப்பு', icon: Home },
  { path: `${USER_BASE}/assistant`, label: 'குரல் உதவி', icon: Mic },
  { path: `${USER_BASE}/interaction`, label: 'சந்திப்புகள் & ஆவணங்கள்', icon: Calendar },
  { path: `${USER_BASE}/lawyer-location`, label: 'வழக்கறிஞர் அமைவிடம் (Leaflet)', icon: MapPin },
  { path: `${USER_BASE}/lawyers`, label: 'வழக்கறிஞர்கள் பட்டியல்', icon: UserCheck },
  { path: `${USER_BASE}/rti-generator`, label: 'RTI விண்ணப்ப இயற்றி', icon: FileText },
  { path: `${USER_BASE}/deadline-tracker`, label: 'சட்ட காலக்கெடு', icon: Clock },
  { path: `${USER_BASE}/fir`, label: 'முதல் தகவல் அறிக்கை வழிகாட்டி', icon: Shield },
  { path: `${USER_BASE}/knowledge`, label: 'சட்ட நூலகம்', icon: BookOpen },
  { path: `${USER_BASE}/my-requests`, label: 'கோரிக்கை நிலை', icon: FileCheck2 },
  { path: `${USER_BASE}/emergency`, label: 'அவசர உதவி', icon: AlertTriangle },
  { path: `${USER_BASE}/history`, label: 'வரலாறு', icon: History },
  { path: `${USER_BASE}/profile`, label: 'சுயவிவரம்', icon: User },
  { path: `${USER_BASE}/admin`, label: 'நிர்வாகம்', icon: Settings }
];

const pageGroups = [
  {
    title: 'காவல்துறை மற்றும் புகார்கள்',
    pages: [
      ['police-rights', 'காவல் நிலைய உரிமைகள்', 'காவல் நிலையத்தில் அமைதியாகவும் தெளிவாகவும் பேசுங்கள். புகார் எண், புகார் நகல், அதிகாரியின் பெயர் ஆகியவற்றைக் கேளுங்கள்.'],
      ['fir-refusal', 'காவல்துறை முதல் தகவல் அறிக்கை மறுத்தால்', 'புகார் ஏற்க மறுத்தால், மேல் அதிகாரியிடம் எழுத்துப் புகார் அனுப்பி சமர்ப்பித்த ஆதாரத்தை வைத்திருங்கள்.'],
      ['women-police-help', 'பெண்களுக்கான காவல் ஆதரவு', 'பெண்கள் தொடர்பான புகார்களுக்கு பெண் அதிகாரி, தனியுரிமை, பாதுகாப்பான பதிவு நடைமுறை ஆகியவற்றைக் கேட்கலாம்.'],
      ['cyber-complaint', 'இணைய குற்ற புகார்', 'மோசடி, மிரட்டல், கணக்கு திருட்டு, இணைய துன்புறுத்தல் ஆகியவற்றுக்கு படங்கள், பரிவர்த்தனை விவரங்கள், இணைப்புகள், தொலைபேசி எண்கள் ஆகியவற்றைப் பாதுகாக்கவும்.'],
      ['missing-person', 'காணாமல் போனவர் புகார்', 'சமீபத்திய புகைப்படம், அணிந்திருந்த உடை விவரம், கடைசியாக தெரிந்த இடம், தொடர்பு வரலாறு ஆகியவற்றுடன் விரைவாக புகார் அளிக்கவும்.'],
      ['accident-help', 'விபத்து உதவி', 'முதலில் உயிரைக் காப்பாற்றுங்கள். மருத்துவ உதவி, காவல் பதிவு, காப்பீட்டு ஆவணங்கள், சாட்சி விவரங்கள் ஆகியவற்றை ஏற்பாடு செய்யுங்கள்.'],
      ['arrest-rights', 'கைது உரிமைகள்', 'கைது காரணத்தை அறிதல், குடும்பத்தினருக்கு தெரிவிதல், வழக்கறிஞரை தொடர்புகொள்ளுதல் ஆகியவை உங்கள் உரிமைகள்.']
    ]
  },
  {
    title: 'குடும்பம் மற்றும் பாதுகாப்பு',
    pages: [
      ['domestic-violence', 'குடும்ப வன்முறை', 'உடல், உணர்ச்சி, சொல், நிதி துன்புறுத்தல்களுக்கு பாதுகாப்பு உத்தரவு மற்றும் ஆதரவு சேவைகள் மூலம் நடவடிக்கை எடுக்கலாம்.'],
      ['women-safety', 'பெண்கள் பாதுகாப்பு', 'உடனடி ஆபத்து இருந்தால் 112 அல்லது 181 அழைக்கவும், பாதுகாப்பான இடத்திற்கு செல்லவும், ஆதாரங்களை பாதுகாக்கவும்.'],
      ['child-rights', 'குழந்தை உரிமைகள்', 'குழந்தைகளுக்கு பாதுகாப்பு, கல்வி, பராமரிப்பு, வன்முறை அல்லது சுரண்டலிலிருந்து பாதுகாப்பு ஆகிய உரிமைகள் உள்ளன.'],
      ['elder-care', 'மூத்த குடிமக்கள் பாதுகாப்பு', 'புறக்கணிப்பு, துன்புறுத்தல், சொத்து அழுத்தம், பராமரிப்பு மறுப்பு ஆகியவற்றுக்கு மூத்த குடிமக்கள் உதவி கேட்கலாம்.'],
      ['marriage-registration', 'திருமண பதிவு', 'அடையாளச் சான்று, வயது சான்று, புகைப்படங்கள், சாட்சிகள், முகவரி சான்று தேவைப்படலாம்.'],
      ['maintenance', 'பராமரிப்பு உதவி', 'உண்மை நிலை மற்றும் நிதி சூழல் அடிப்படையில் துணைவர், குழந்தை அல்லது பெற்றோர் பராமரிப்பு தொகை கேட்கலாம்.'],
      ['legal-aid-family', 'குடும்ப சட்ட உதவி', 'வருமானம், சமூக நிலை, பாதிப்பு, வழக்கு வகை ஆகியவற்றின் அடிப்படையில் இலவச சட்ட உதவி கிடைக்கலாம்.']
    ]
  },
  {
    title: 'நுகர்வோர் மற்றும் பணம்',
    pages: [
      ['consumer-rights', 'நுகர்வோர் உரிமைகள்', 'குறைபாடுள்ள பொருட்கள், மோசமான சேவை, தவறான விளம்பரம், பாதுகாப்பற்ற பொருட்கள், அதிக கட்டணம் ஆகியவற்றுக்கு புகார் அளிக்கலாம்.'],
      ['refund-claim', 'பணத்திருப்பு கோரிக்கை', 'பில்கள், உத்தரவாத அட்டைகள், பணம் செலுத்திய ஆதாரம், புகார் தேதிகள், செய்திகள் ஆகியவை கோரிக்கைக்கு உதவும்.'],
      ['online-fraud', 'இணைய பண மோசடி', 'வங்கி, இணைய குற்ற புகார் மையம், காவல்துறையை விரைவாக தொடர்புகொள்ளுங்கள். மின்னணு மோசடியில் நேரம் முக்கியம்.'],
      ['loan-harassment', 'கடன் துன்புறுத்தல்', 'மிரட்டல், பொதுவில் அவமானப்படுத்தல், மீண்டும் மீண்டும் தொந்தரவு, அனுமதியற்ற தொடர்பு ஆகியவற்றை புகார் செய்யலாம்.'],
      ['insurance-claim', 'காப்பீட்டு கோரிக்கை', 'காப்பீட்டு ஆவணம், மருத்துவ பதிவுகள், சேத ஆதாரம், பில்கள், காலக்கெடுகள் முக்கியம்.'],
      ['bank-complaint', 'வங்கி புகார்', 'முதலில் வங்கிக்கு எழுத்துப் புகார் அளிக்கவும், தீர்வு இல்லையெனில் அதிகாரப்பூர்வ குறைதீர் முறையில் மேல்முறையீடு செய்யவும்.'],
      ['digital-payment', 'மின்னணு பணம் செலுத்தல் சிக்கல்', 'தவறான பரிமாற்றம் அல்லது தோல்வியடைந்த பணம் செலுத்தலை விரைவாக புகார் செய்து பரிவர்த்தனை குறிப்பு எண்ணை வைத்திருங்கள்.']
    ]
  },
  {
    title: 'வீடு, நிலம் மற்றும் வேலை',
    pages: [
      ['tenant-rights', 'வாடகையாளர் உரிமைகள்', 'எழுத்து ஒப்பந்தம், வாடகை ரசீதுகள், அறிவிப்பு காலம், பராமரிப்பு பொறுப்புகள் தெளிவாக இருக்க வேண்டும்.'],
      ['land-records', 'நில ஆவணங்கள்', 'உரிமை ஆவணங்கள், பிணை இல்லா சான்று, வரி ரசீதுகள், எல்லைகள், பதிவு விவரங்கள் ஆகியவற்றை சரிபார்க்கவும்.'],
      ['property-dispute', 'சொத்து தகராறு', 'உரிமை ஆவணங்கள், வரி ரசீதுகள், உடைமை ஆதாரம், எல்லை பதிவுகள் தகராறுகளில் பயன்படும்.'],
      ['workplace-rights', 'வேலைத்தள உரிமைகள்', 'ஊதியம், பாதுகாப்பு, மரியாதை, துன்புறுத்தல் இல்லாத வேலைத்தளம் ஆகியவை ஊழியர்களின் உரிமைகள்.'],
      ['salary-delay', 'சம்பள தாமதம்', 'வேலை நியமனக் கடிதம், வருகைப் பதிவுகள், சம்பளச் சீட்டுகள், செய்திகள், வங்கி அறிக்கைகள் ஆகியவற்றை சேமிக்கவும்.'],
      ['workplace-harassment', 'வேலைத்தள துன்புறுத்தல்', 'உள் புகார் முறையைப் பயன்படுத்தவும், சம்பவங்களை பதிவு செய்யவும், ஆதாரங்களை பாதுகாப்பாக வைத்திருக்கவும்.'],
      ['rental-deposit', 'வாடகை முன்பணம்', 'முன்பண ரசீதுகள், பரிமாற்ற ஆதாரம், குடியேறும் புகைப்படங்கள், வெளியேறும் நிலை பதிவுகள் ஆகியவற்றை வைத்திருங்கள்.']
    ]
  },
  {
    title: 'ஆவணங்கள் மற்றும் பொது சேவைகள்',
    pages: [
      ['document-checklist', 'ஆவண சரிபார்ப்பு பட்டியல்', 'அடையாளச் சான்று, முகவரி சான்று, சம்பவ ஆதாரம், புகைப்படங்கள், பில்கள், செய்திகள் தேவைப்படலாம்.'],
      ['legal-notice', 'சட்ட அறிவிப்பு', 'சட்ட அறிவிப்பில் உண்மைகள், கோரிக்கை, காலக்கெடு, அனுப்புநர் விவரம், அனுப்பிய ஆதாரம் ஆகியவை இருக்க வேண்டும்.'],
      ['affidavit', 'உறுதிமொழி ஆவணம்', 'உறுதிமொழி ஆவணம் என்பது அதை வழங்கும் நபர் உறுதிப்படுத்தும் உண்மை விவரங்களின் எழுத்து அறிக்கை. நோட்டரி விதிகள் பொருந்தலாம்.'],
      ['rti', 'தகவல் அறியும் உரிமை', 'அரசு அலுவலகங்களிலிருந்து பொது தகவலை தெளிவான விண்ணப்பம் மூலம் கேட்கலாம்.'],
      ['free-legal-aid', 'இலவச சட்ட உதவி', 'தகுதியுள்ளவர்களுக்கு சட்ட சேவை ஆணையங்கள் ஆலோசனை, வழக்குரை, ஆவண உதவி வழங்கலாம்.'],
      ['court-process', 'நீதிமன்ற நடைமுறை', 'வழக்கில் தாக்கல், அறிவிப்பு, பதில், ஆதாரம், விசாரணைகள், வாதங்கள், உத்தரவு ஆகியவை இருக்கலாம்.'],
      ['evidence-care', 'ஆதார பராமரிப்பு', 'அசல் ஆவணங்களை பாதுகாப்பாக வைத்திருங்கள்; படங்கள், ஒலி, செய்திகள் ஆகியவற்றை மாற்ற வேண்டாம்.']
    ]
  },
  {
    title: 'செயலி வழிகாட்டி',
    pages: [
      ['voice-use', 'குரல் உள்ளீடு பயன்படுத்துதல்', 'ஒலிவாங்கி பொத்தானைத் தொட்டு முக்கிய உண்மைகளுடன் உங்கள் சட்ட கேள்வியை தெளிவாக கேளுங்கள்.'],
      ['text-to-speech', 'குரல் பதில்', 'பதில் தோன்றிய பிறகு, ஒலி பொத்தானைப் பயன்படுத்தி பதிலை கேளுங்கள்.'],
      ['language-support', 'மொழி ஆதரவு', 'தற்போதைய முகப்பு தமிழ் வழி எளிய குரல் முதன்மை சட்ட உதவி ஓட்டத்துடன் உள்ளது.'],
      ['history-use', 'வரலாறு பயன்படுத்துதல்', 'முன்பு கேட்ட கேள்விகளும் பதில்களும் வரலாறு பக்கத்தில் பார்க்கலாம்.'],
      ['lawyer-booking', 'வழக்கறிஞர் தொடர்பு', 'தொழில்முறை உதவி தேவைப்பட்டால் சரிபார்க்கப்பட்ட வழக்கறிஞரை தேர்ந்தெடுத்து அழைக்கவும்.'],
      ['privacy', 'தனியுரிமை கவனம்', 'தனிப்பட்ட விவரங்கள், கணக்கு எண்கள், உணர்வுபூர்வ ஆவணங்கள் பகிர்வதற்கு முன் கவனமாக இருங்கள்.'],
      ['admin-flow', 'உள்ளடக்க மேலாண்மை', 'நிர்வாகிகள் சட்ட உள்ளடக்கம், கேள்வி பதில்கள், வழிகாட்டிகள், தர சரிபார்ப்புகளை பராமரிக்கலாம்.']
    ]
  },
  {
    title: 'சிறப்பு சட்ட தலைப்புகள்',
    pages: [
      ['motor-vehicle', 'மோட்டார் வாகன சட்டம்', 'ஓட்டுநர் உரிமம், காப்பீடு, விபத்து அறிக்கைகள், அபராதங்கள், வாகன ஆவணங்கள் சரிபார்க்கப்பட வேண்டும்.'],
      ['education-rights', 'கல்வி உரிமைகள்', 'சேர்க்கை, கட்டணம், சான்றிதழ்கள், துன்புறுத்தல், பள்ளி பதிவுகள் ஆகியவை ஆவணங்களுடன் கையாளப்பட வேண்டும்.'],
      ['medical-negligence', 'மருத்துவ அலட்சியம்', 'மருத்துவ பதிவுகள், பில்கள், மருந்து சீட்டுகள், இரண்டாம் கருத்து, இழப்பு விவரங்கள் முக்கியம்.'],
      ['defamation', 'அவதூறு', 'புகழுக்கு சேதம் விளைவிக்கும் பொய்யான கூற்றுகளுக்கு ஆதாரம், சூழல், சட்ட ஆய்வு தேவைப்படலாம்.'],
      ['privacy-rights', 'தனியுரிமை உரிமைகள்', 'அனுமதியற்ற புகைப்படங்கள், தரவு பகிர்வு, கணக்கு அணுகல், தனிப்பட்ட விவர வெளியீடு ஆகியவற்றை புகார் செய்யலாம்.'],
      ['environment', 'சுற்றுச்சூழல் புகார்', 'மாசு, சத்தம், கழிவு கொட்டுதல், மரம் வெட்டுதல் ஆகியவற்றை உள்ளூர் அதிகாரிகளிடம் புகார் செய்யலாம்.'],
      ['senior-citizen-property', 'மூத்த குடிமக்கள் சொத்து பாதுகாப்பு', 'அழுத்தம், மோசடி, புறக்கணிப்பு, மூத்த குடிமக்கள் சொத்து தவறான பயன்பாடு ஆகியவற்றுக்கு விரைவான சட்ட ஆதரவு தேவை.']
    ]
  },
  {
    title: 'பணிச்சுற்று வரைபடம்',
    pages: [
      ['workflow-speak', 'பேசும் நிலை', 'பயனர் குரல் அல்லது எழுத்து மூலம் சட்ட கேள்வி கேட்கிறார்.'],
      ['workflow-convert', 'மாற்றும் நிலை', 'பேச்சு எழுத்தாக மாற்றப்பட்டு நோக்கம் கண்டறியப்படுகிறது.'],
      ['workflow-process', 'செயலாக்க நிலை', 'தலைப்பு, உரிமைகள், படிகள், அடுத்த செயல்கள் ஆகியவற்றை அமைப்பு இணைக்கிறது.'],
      ['workflow-explain', 'விளக்கும் நிலை', 'சட்ட சிக்கலான சொற்கள் இல்லாமல் எளிய மொழியில் பதில் காட்டப்படுகிறது.'],
      ['workflow-assist', 'உதவும் நிலை', 'பயனர் விவரங்கள், கேள்வி பதில்கள், அவசர உதவி, வழக்கறிஞர் விருப்பங்கள் ஆகியவற்றைப் பார்க்கலாம்.'],
      ['workflow-connect', 'இணைக்கும் நிலை', 'தொழில்முறை உதவி தேவைப்படும்போது சரிபார்க்கப்பட்ட வழக்கறிஞருடன் இணைக்கலாம்.'],
      ['workflow-save', 'சேமிக்கும் நிலை', 'கேள்விகளும் பதில்களும் பிறகு பார்க்க வரலாற்றில் சேமிக்கப்படும்.']
    ]
  }
];

const allPages = pageGroups.flatMap((group) =>
  group.pages.map(([slug, title, text]) => ({ slug, title, text, group: group.title }))
);

const fallbackAnswer = {
  topic: 'பொது சட்ட உதவி',
  summary: 'இது முதல் நிலை சட்ட விழிப்புணர்வு வழிகாட்டல். தேதிகள், இடங்கள், ஆவணங்கள், பெயர்கள், ஆதாரங்கள் ஆகியவற்றை ஒழுங்காக வைத்திருங்கள்.',
  steps: ['சம்பவத்தை நேர வரிசையில் எழுதுங்கள்.', 'ஆதாரங்களை பாதுகாப்பாக சேமிக்கவும்.', 'சரியான அதிகாரியை தொடர்புகொள்ளவும்.', 'பிரச்சினை தீவிரமாக இருந்தால் வழக்கறிஞரிடம் பேசவும்.'],
  rights: ['சட்ட உதவி கேட்கும் உரிமை உங்களுக்கு உள்ளது.', 'ரசீது, குறிப்பு எண் அல்லது புகார் எண் கேட்கலாம்.'],
  nextActions: ['தொடர்புடைய வழிகாட்டி பக்கங்களைப் பார்க்கவும்.', 'உடனடி ஆபத்து இருந்தால் அவசர உதவியைப் பயன்படுத்தவும்.'],
  disclaimer: 'இது பொது சட்ட விழிப்புணர்வு மட்டுமே; தொழில்முறை சட்ட ஆலோசனைக்கு மாற்றாகாது.'
};

const aiUnavailableAnswer = {
  topic: 'Sarvam AI இணைக்கப்படவில்லை',
  summary: 'வழக்கறிஞர் போல் துல்லியமாக பதில் தர இந்த பக்கத்திற்கு backend Sarvam AI இணைப்பு தேவை. Backend ஓடவில்லை, SARVAM_API_KEY set செய்யப்படவில்லை, அல்லது Sarvam API பதில் தரவில்லை. Generic பதிலை காட்டாமல் இணைப்பு பிரச்சினையைத் தெரிவிக்கிறோம்.',
  steps: [
    'Backend terminal-ல் SARVAM_API_KEY set செய்யுங்கள்.',
    'Backend-ஐ restart செய்து மீண்டும் கேள்வி கேளுங்கள்.',
    'கேள்வியை விவரமாக எழுதுங்கள்: என்ன நடந்தது, எப்போது, எங்கு, யார், என்ன ஆதாரம் உள்ளது.'
  ],
  rights: ['தவறான அல்லது generic சட்ட பதிலை நம்ப வேண்டாம்.'],
  nextActions: ['Sarvam இணைந்த பிறகு இந்த பக்கம் கேள்விக்கேற்ப செயல் திட்டம் தரும்.'],
  disclaimer: 'AI சேவை இணைக்கப்படாததால் சட்ட வழிகாட்டல் உருவாக்கப்படவில்லை.'
};

function isBadBackendTamil(answer) {
  // Only flag OBVIOUS Latin-1 mis-encoding artifacts (à®, Ã®, Â«)
  // Proper Tamil Unicode (\u0B80-\u0BFF) will NOT match these
  const visibleText = [
    answer.topic || '',
    answer.summary || ''
  ].join(' ');
  // Must have BOTH the Latin prefix (à/Ã) AND a following non-ASCII char to be flagged
  return /à[\x80-\xBF]|Ã[\x80-\xBF]/.test(visibleText);
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/lawyer-profile" element={<LawyerProfile />} />
        <Route path="/user-profile/*" element={<UserApp />} />
      </Routes>
    </BrowserRouter>
  );
}

function UserApp() {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div className="app">
      <aside className={menuOpen ? 'sidebar open' : 'sidebar'}>
        <div className="brand">
          <div className="brandMark">சகு</div>
          <div>
            <strong>சட்டக்குரல்</strong>
            <span>சட்ட உதவி</span>
          </div>
        </div>
        <nav>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink key={item.path} to={item.path} end={item.path === USER_BASE} onClick={() => setMenuOpen(false)} className={({ isActive }) => (isActive ? 'active' : '')}>
                <Icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </aside>
      <main>
        <header className="topbar">
          <button className="iconBtn mobileOnly" onClick={() => setMenuOpen(true)} aria-label="பட்டியைத் திற">
            <Menu size={21} />
          </button>
          <div>
            <p>தமிழில் எளிய சட்ட விழிப்புணர்வு</p>
            <h1>சட்டக்குரல்</h1>
          </div>
          <div className="topbarActions">
            <Link className="secondaryBtn" to="/">சுயவிவரம் மாற்று</Link>
            <Link className="quickCall" to={`${USER_BASE}/emergency`}><Phone size={17} /> அவசரம்</Link>
          </div>
        </header>
        {menuOpen && <button className="scrim" onClick={() => setMenuOpen(false)} aria-label="பட்டியை மூடு"><X /></button>}
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/assistant" element={<Assistant />} />
          <Route path="/interaction" element={<InteractionHub />} />
          <Route path="/rti-generator" element={<RtiGenerator />} />
          <Route path="/deadline-tracker" element={<DeadlineTracker />} />
          <Route path="/fir" element={<FirPage />} />
          <Route path="/knowledge" element={<Knowledge />} />
          <Route path="/lawyers" element={<PeopleLawyers />} />
          <Route path="/lawyer-location" element={<LawyerLocationFinder />} />
          <Route path="/my-requests" element={<MyRequests />} />
          <Route path="/emergency" element={<Emergency />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/page/:slug" element={<DetailPage />} />
        </Routes>
      </main>
    </div>
  );
}

function Dashboard() {
  const stats = [
    [`${allPages.length}`, 'தமிழ் வழிகாட்டி பக்கங்கள்'],
    ['10', 'முக்கிய தொகுதிகள்'],
    ['4', 'அவசர வழிகள்']
  ];
  return (
    <section className="screen">
      <div className="hero">
        <div>
          <span className="pill"><Shield size={16} /> பொதுமக்கள் சட்ட உதவி</span>
          <h2>குரலில் கேளுங்கள். அடுத்த சட்ட படியைப் புரிந்துகொள்ளுங்கள்.</h2>
          <p>முதல் தகவல் அறிக்கை வழிகாட்டல், காவல் உரிமைகள், நுகர்வோர் சிக்கல்கள், வாடகை தகராறுகள், அவசர ஆதரவு, சட்ட வரலாறு, வழக்கறிஞர் தொடர்பு அனைத்தும் ஒரே நட்பு செயலியில்.</p>
          <div className="heroActions">
            <Link to={`${USER_BASE}/assistant`} className="primaryBtn"><Mic size={18} /> கேள்வி கேள்</Link>
            <Link to={`${USER_BASE}/lawyer-location`} className="secondaryBtn"><MapPin size={18} /> வழக்கறிஞர் அமைவிடம் (Leaflet Map)</Link>
            <Link to={`${USER_BASE}/fir`} className="secondaryBtn"><FileText size={18} /> முதல் தகவல் அறிக்கை வழிகாட்டி</Link>
          </div>
        </div>
        <div className="voicePanel">
          <Bot size={42} />
          <h3>பேசு | மாற்று | விளக்கு | உதவு | இணை</h3>
          <p>குரல் உள்ளீடு, எளிய பதில்கள், ஒலி பதில், வரலாறு கண்காணிப்பு ஆகியவை அன்றாட சட்ட விழிப்புணர்வுக்கு தயாராக உள்ளன.</p>
        </div>
      </div>
      <div className="statGrid">{stats.map(([n, l]) => <div className="stat" key={l}><strong>{n}</strong><span>{l}</span></div>)}</div>
      <PageShelf limit={16} />
    </section>
  );
}

function Assistant() {
  const [query, setQuery] = useState('');
  const [answer, setAnswer] = useState(fallbackAnswer);
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const [message, setMessage] = useState('');

  const ask = async () => {
    if (!query.trim()) return;
    setBusy(true);
    setMessage('');
    try {
      const statusRes = await fetch(`${API}/ai/status`);
      if (statusRes.ok) {
        const status = await statusRes.json();
        if (false && !status.configured) {
          setAnswer({
            ...aiUnavailableAnswer,
            summary: 'Sarvam AI key backend-ல் set செய்யப்படவில்லை. அதனால் வழக்கறிஞர் போல் துல்லியமான பதில் உருவாக்க முடியாது.',
            nextActions: [
              '$env:SARVAM_API_KEY="your_sarvam_api_key" set செய்து backend restart செய்யுங்கள்.',
              'பிறகு இதே கேள்வியை மீண்டும் கேளுங்கள்.'
            ]
          });
          setMessage('Sarvam AI key backend-ல் இல்லை.');
          return;
        }
      }
      const res = await fetch(`${API}/legal/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify({ userId: getActiveUserId(), query, language: 'ta' })
      });
      if (!res.ok) {
        throw new Error('Request failed: ' + res.status);
      }
      const json = await res.json();
      const data = normalizeAnswer(json, query);
      setAnswer(data);
      saveLocal(query, data.summary);
    } catch {
      setAnswer(buildTamilLegalAnswer(query));
      setMessage('Backend/Sarvam இணைப்பு இல்லை. எளிய உள்ளூர் பதில் இப்போது காட்டப்படுகிறது.');
    } finally {
      setBusy(false);
    }
  };

  const listen = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setMessage('இந்த உலாவியில் குரல் உள்ளீடு இயங்கவில்லை. தயவுசெய்து கேள்வியை எழுதுங்கள்.');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'ta-IN';
    recognition.interimResults = false;
    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onresult = (event) => setQuery(event.results[0][0].transcript);
    recognition.onerror = () => {
      setListening(false);
      setMessage('குரல் உள்ளீடு தொடங்கவில்லை. ஒலிவாங்கி அனுமதியை சரிபார்க்கவும் அல்லது கேள்வியை எழுதவும்.');
    };
    recognition.start();
  };

  return (
    <section className="screen twoCol">
      <div className="panel">
        <span className="pill"><Mic size={16} /> குரல் உள்ளீடு</span>
        <h2>உங்கள் சட்ட கேள்வி</h2>
        <textarea value={query} onChange={(e) => setQuery(e.target.value)} placeholder="உங்கள் சட்ட கேள்வியை தமிழில் எழுதவும் அல்லது பேசவும்" />
        <div className="toolbar">
          <button className={listening ? 'dangerBtn' : 'secondaryBtn'} onClick={listen}><Mic size={17} /> {listening ? 'கேட்கிறது' : 'பேசு'}</button>
          <button className="primaryBtn" onClick={ask} disabled={busy}>{busy ? 'செயலாக்குகிறது' : 'பதில் பெறு'}</button>
        </div>
        {message && <p className="notice">{message}</p>}
      </div>
      <AnswerCard answer={answer} query={query} />
    </section>
  );
}

function AnswerCard({ answer, query = '' }) {
  const [bookingMessage, setBookingMessage] = useState('');
  const speak = () => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(`${answer.topic}. ${answer.summary}. ${answer.steps.join('. ')}`);
    utterance.lang = 'ta-IN';
    window.speechSynthesis.speak(utterance);
  };

  const bookLawyer = (lawyer) => {
    let name = 'டெமோ பயனர்';
    let phone = '+91 98765 43210';
    try {
      const session = JSON.parse(localStorage.getItem('lawvoice-session'));
      if (session) {
        if (session.name) name = session.name;
        if (session.phone) phone = session.phone;
      }
    } catch {}

    const request = {
      id: `REQ-${Date.now().toString().slice(-5)}`,
      lawyerId: lawyer.id,
      lawyerName: lawyer.name,
      name,
      phone,
      category: lawyer.category,
      city: lawyer.city,
      urgency: 'New',
      status: 'New request',
      issue: query.trim() || answer.summary,
      time: new Date().toLocaleString()
    };
    const previous = JSON.parse(localStorage.getItem('lawvoice-requests') || '[]');
    localStorage.setItem('lawvoice-requests', JSON.stringify([request, ...previous]));
    setBookingMessage(`${lawyer.name} அவர்களுக்கு கோரிக்கை அனுப்பப்பட்டது. அது வழக்கறிஞர் profile-ல் People requests பகுதியில் தெரியும்.`);
  };

  return (
    <div className="panel answer">
      <div className="rowBetween">
        <span className="pill"><Bot size={16} /> எளிய விளக்கம்</span>
        <button className="iconBtn" onClick={speak} aria-label="பதிலை கேள்"><Volume2 size={19} /></button>
      </div>
      <h2>{answer.topic}</h2>
      <p>{answer.summary}</p>
      {Array.isArray(answer.sources) && answer.sources.length > 0 && (
        <p className="answerSources">
          <strong>மூலம்:</strong> {answer.sources.join(' • ')}
        </p>
      )}
      <MiniList title="படிகள்" items={answer.steps} />
      <MiniList title="உரிமைகள்" items={answer.rights} />
      <MiniList title="அடுத்த உதவி" items={answer.nextActions} />
      <small>{answer.disclaimer}</small>
    </div>
  );
}

function FirPage() {
  return (
    <section className="screen">
      <AnswerCard answer={{
        topic: 'முதல் தகவல் அறிக்கை தாக்கல் வழிகாட்டி',
        summary: 'குற்றம், மிரட்டல், திருட்டு, விபத்து அல்லது துன்புறுத்தல் நடந்தால் புகார் அளிப்பது முக்கியமான முதல் படி.',
        steps: ['சம்பவ விவரங்களை எழுதுங்கள்.', 'ஆதாரம் மற்றும் அடையாள ஆவணங்களை சேகரிக்கவும்.', 'அருகிலுள்ள காவல் நிலையத்துக்கு செல்லுங்கள்.', 'புகார் எண் மற்றும் நகலை கேளுங்கள்.', 'மறுத்தால் மேல் அதிகாரியை தொடர்புகொள்ளுங்கள்.'],
        rights: ['புகார் அளிக்கும் உரிமை உங்களுக்கு உள்ளது.', 'பெண்கள் பெண் அதிகாரியின் ஆதரவை கேட்கலாம்.', 'புகார் நகலை கேட்கலாம்.'],
        nextActions: ['உடனடி ஆபத்து இருந்தால் 112 அழைக்கவும்.', 'அனைத்து விவரங்களையும் உங்கள் பதிவில் சேமிக்கவும்.', 'தேவைப்பட்டால் வழக்கறிஞரை தொடர்புகொள்ளவும்.'],
        disclaimer: 'குறிப்பிட்ட வழக்குக்கு தொழில்முறை ஆலோசனை பெறுங்கள்.'
      }} />
      <PageShelf group="காவல்துறை மற்றும் புகார்கள்" />
    </section>
  );
}

function Knowledge() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  // Categories list
  const categories = ['All', ...pageGroups.map(g => g.title)];

  // Filtered pages logic
  const filteredPages = allPages.filter(p => {
    const matchesCategory = activeCategory === 'All' || p.group === activeCategory;
    const matchesSearch = 
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.group.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <section className="screen">
      <div className="sectionHead">
        <div>
          <span className="pill"><BookOpen size={16} /> சட்ட நூலகம்</span>
          <h2>சட்ட வழிகாட்டி நூலகம்</h2>
        </div>
        <strong>{filteredPages.length} வழிகாட்டிகள்</strong>
      </div>

      {/* Premium Search Box */}
      <div className="searchBarContainer" style={{
        display: 'flex',
        alignItems: 'center',
        background: 'var(--panel-bg, #ffffff)',
        padding: '0.8rem 1.2rem',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
        marginBottom: '1.5rem',
        border: '1px solid rgba(0, 0, 0, 0.08)'
      }}>
        <Search size={20} style={{ color: 'var(--text-secondary, #666)', marginRight: '0.8rem' }} />
        <input
          type="text"
          placeholder="சட்டத் தலைப்புகள், உரிமைகள் அல்லது வழிகாட்டிகளைத் தேடுங்கள்..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            border: 'none',
            outline: 'none',
            width: '100%',
            fontSize: '1rem',
            background: 'transparent',
            color: 'var(--text-main, #333)'
          }}
        />
        {searchTerm && (
          <button 
            onClick={() => setSearchTerm('')} 
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-secondary, #666)'
            }}
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Category Selection Filter Pills */}
      <div className="categoryFilters" style={{
        display: 'flex',
        gap: '0.6rem',
        overflowX: 'auto',
        paddingBottom: '0.8rem',
        marginBottom: '1.8rem',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none'
      }}>
        {categories.map((cat) => {
          const isActive = activeCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                whiteSpace: 'nowrap',
                padding: '0.5rem 1.2rem',
                borderRadius: '50px',
                fontSize: '0.9rem',
                fontWeight: isActive ? '600' : '400',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                background: isActive ? 'var(--primary-color, #10b981)' : 'var(--panel-bg, #ffffff)',
                color: isActive ? '#ffffff' : 'var(--text-secondary, #666)',
                boxShadow: isActive ? '0 4px 10px rgba(16, 185, 129, 0.3)' : '0 2px 6px rgba(0, 0, 0, 0.03)'
              }}
            >
              {cat === 'All' ? 'அனைத்தும்' : cat}
            </button>
          );
        })}
      </div>

      {/* Search / Filter Results Grid */}
      {filteredPages.length > 0 ? (
        <div className="pageGrid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '1.2rem'
        }}>
          {filteredPages.map((p) => (
            <Link 
              to={`${USER_BASE}/page/${p.slug}`} 
              key={p.slug} 
              className="pageTile"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '1.2rem',
                background: 'var(--panel-bg, #ffffff)',
                border: '1px solid rgba(0, 0, 0, 0.05)',
                borderRadius: '12px',
                textDecoration: 'none',
                color: 'inherit',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.06)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.02)';
              }}
            >
              <div>
                <span className="libraryCardGroup" style={{
                  fontSize: '0.8rem',
                  color: 'var(--primary-color, #10b981)',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  marginBottom: '0.5rem',
                  display: 'inline-block'
                }}>{p.group}</span>
                <h3 style={{
                  fontSize: '1.1rem',
                  margin: '0 0 0.6rem 0',
                  color: 'var(--text-main, #333)',
                  lineHeight: '1.3'
                }}>{p.title}</h3>
                <p style={{
                  fontSize: '0.9rem',
                  color: 'var(--text-secondary, #666)',
                  margin: '0 0 1.2rem 0',
                  lineHeight: '1.5',
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}>{p.text}</p>
              </div>
              <div className="libraryCardFooter" style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.9rem',
                color: 'var(--primary-color, #10b981)',
                fontWeight: '600',
                borderTop: '1px solid rgba(0, 0, 0, 0.04)',
                paddingTop: '0.8rem',
                marginTop: 'auto'
              }}>
                <span>மேலும் வாசிக்க</span>
                <ChevronRight size={16} />
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="panel" style={{
          textAlign: 'center',
          padding: '3rem 1.5rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <AlertTriangle size={48} style={{ color: 'var(--text-secondary, #999)' }} />
          <h3>தேடலுக்குப் பொருத்தமான வழிகாட்டிகள் எதுவும் கிடைக்கவில்லை.</h3>
          <p style={{ color: 'var(--text-secondary, #666)', maxWidth: '400px' }}>
            விவரங்களைக் கண்டறிய எங்கள் குரல் வழிகாட்டியிடம் உங்கள் கேள்வியைக் கேட்கலாம்.
          </p>
          <Link to={`${USER_BASE}/assistant`} className="primaryBtn" style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            textDecoration: 'none'
          }}>
            <Mic size={17} /> குரல் உதவியிடம் கேளுங்கள்
          </Link>
        </div>
      )}
    </section>
  );
}

function Lawyers() {
  const [locationMessage, setLocationMessage] = useState('');
  const lawyers = [
    ['அருண் குமார்', 'குற்றவியல் சட்டம்', 'சென்னை', '+91 90000 10001', '4.8'],
    ['மீனா ராஜ்', 'குடும்ப சட்டம்', 'மதுரை', '+91 90000 10002', '4.7'],
    ['பிரகாஷ் வேல்', 'நுகர்வோர் வழக்குகள்', 'கோயம்புத்தூர்', '+91 90000 10003', '4.6'],
    ['லதா சிவா', 'சொத்து சட்டம்', 'திருச்சி', '+91 90000 10004', '4.9']
  ];
  const searchLocation = () => {
    if (!navigator.geolocation) {
      setLocationMessage('இந்த உலாவியில் இட தேடல் இயங்கவில்லை.');
      return;
    }
    setLocationMessage('உங்கள் இடம் சரிபார்க்கப்படுகிறது...');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        window.open(`https://www.google.com/maps/search/lawyers/@${latitude},${longitude},13z`, '_blank', 'noopener,noreferrer');
        setLocationMessage('அருகிலுள்ள வழக்கறிஞர் தேடல் வரைபடத்தில் திறக்கப்பட்டது.');
      },
      () => setLocationMessage('இட அனுமதி மறுக்கப்பட்டது. பட்டியலில் உள்ள எந்த வழக்கறிஞரையும் அழைக்கலாம்.')
    );
  };

  return (
    <section className="screen">
      <div className="sectionHead">
        <div><span className="pill"><MapPin size={16} /> அருகிலுள்ள உதவி</span><h2>சரிபார்க்கப்பட்ட வழக்கறிஞர்கள்</h2></div>
        <button className="secondaryBtn" onClick={searchLocation}><Search size={17} /> இடம் தேடு</button>
      </div>
      {locationMessage && <p className="notice">{locationMessage}</p>}
      <div className="cardGrid">
        {lawyers.map((l) => <div className="card" key={l[0]}><h3>{l[0]}</h3><p>{l[1]}</p><span>{l[2]}</span><strong>மதிப்பீடு {l[4]}</strong><a className="primaryBtn" href={`tel:${l[3]}`}><Phone size={16} /> அழை</a></div>)}
      </div>
    </section>
  );
}

function Emergency() {
  const [items, setItems] = useState([
    ['தேசிய அவசரம் (National Emergency)', '112', 'அனைத்து அவசர தேவைகள் மற்றும் காவல் உதவிக்காக'],
    ['பெண்கள் உதவி (Women Helpline)', '181', 'பெண்கள் பாதுகாப்பு, வன்முறை மற்றும் உடனடி ஆதரவுக்காக'],
    ['இலவச சட்ட உதவி (Free Legal Aid - NALSA)', '15100', 'சட்ட சேவை ஆணையத்தின் இலவச சட்ட உதவி மற்றும் ஆலோசனைகளுக்காக'],
    ['சைபர் நிதி மோசடி (Cyber Financial Fraud)', '1930', 'ஆன்லைன் வங்கி அல்லது UPI பண மோசடி புகார்களைப் பதிவு செய்ய'],
    ['நுகர்வோர் உதவி (National Consumer Helpline)', '1915', 'நுகர்வோர் பொருள் மற்றும் சேவை தொடர்பான புகார்களைப் பதிவு செய்ய'],
    ['குழந்தை உதவி (Child Helpline)', '1098', 'குழந்தை பாதுகாப்பு, ஆதரவு மற்றும் கடத்தல் தடுப்புக்காக'],
    ['மூத்த குடிமக்கள் உதவி (Senior Citizen Helpline)', '14567', 'மூத்த குடிமக்களின் பாதுகாப்பு, பராமரிப்பு மற்றும் உதவிக்காக'],
    ['மாநில அவசர கட்டுப்பாடு (State Emergency)', '1070', 'பேரிடர் மற்றும் இயற்கை பேரிடர் கால கட்டுப்பாட்டு அறைக்காக']
  ]);
  const [backendMessage, setBackendMessage] = useState('');

  React.useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch(`${API}/emergency`);
        if (!res.ok) throw new Error('failed');
        const data = await res.json();
        const mapped = Array.isArray(data)
          ? data.map((row) => [row.title || '', row.number || row.phone || '', row.description || row.note || '']).filter((i) => i[0] && i[1])
          : [];
        if (!cancelled && mapped.length > 0) {
          setItems(mapped);
          setBackendMessage('');
        }
      } catch {
        if (!cancelled) setBackendMessage('Backend அவசர பட்டியல் இப்போது கிடைக்கவில்லை. உள்ளூர் பட்டியல் காட்டப்படுகிறது.');
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  return <section className="screen"><div className="sectionHead"><div><span className="pill"><AlertTriangle size={16} /> உடனடி உதவி</span><h2>அவசர சட்ட உதவி எண்கள்</h2></div></div>{backendMessage && <p className="notice">{backendMessage}</p>}<div className="cardGrid emergency">{items.map((i) => <div className="card" key={i[1]}><h3>{i[0]}</h3><strong>{i[1]}</strong><p>{i[2]}</p><a className="dangerBtn" href={`tel:${i[1]}`}><Phone size={16} /> இப்போது அழை</a></div>)}</div></section>;
}

function HistoryPage() {
  const [rows, setRows] = useState(readHistory());
  const [backendMessage, setBackendMessage] = useState('');

  React.useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch(`${API}/history/${getActiveUserId()}`);
        if (!res.ok) throw new Error('failed');
        const data = await res.json();
        const mapped = Array.isArray(data)
          ? data.map((row) => ({
            query: row.queryText || row.query || '',
            answer: row.responseText || row.answer || ''
          })).filter((r) => r.query && r.answer)
          : [];
        if (!cancelled && mapped.length > 0) {
          setRows(mapped);
          setBackendMessage('');
        }
      } catch {
        if (!cancelled) setBackendMessage('Backend வரலாறு இப்போது கிடைக்கவில்லை. உள்ளூர் வரலாறு மட்டும் காட்டப்படுகிறது.');
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const clearHistory = () => {
    localStorage.removeItem('lawvoice-history-' + getActiveUserId());
    setRows([]);
  };
  return <section className="screen"><div className="sectionHead"><div><span className="pill"><History size={16} /> சேமிக்கப்பட்டது</span><h2>கேள்வி வரலாறு</h2></div>{rows.length > 0 && <button className="secondaryBtn" onClick={clearHistory}>வரலாறு நீக்கு</button>}</div>{backendMessage && <p className="notice">{backendMessage}</p>}{rows.length === 0 ? <div className="panel"><p>இன்னும் உள்ளூர் வரலாறு இல்லை. குரல் உதவி பக்கத்தில் கேள்வி கேளுங்கள்.</p></div> : <div className="stack">{rows.map((r, i) => <div className="panel" key={`${r.query}-${i}`}><h3>{r.query}</h3><p>{r.answer}</p></div>)}</div>}</section>;
}

function Profile() {
  const [saved, setSaved] = useState('');
  const [session, setSession] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('lawvoice-session')) || {};
    } catch {
      return {};
    }
  });

  const [name, setName] = useState(session.name || 'பயனர்');
  const [district, setDistrict] = useState(session.district || 'சென்னை');
  const [language, setLanguage] = useState(session.language || 'தமிழ்');

  const handleSave = () => {
    const updatedSession = { ...session, name, district, language };
    localStorage.setItem('lawvoice-session', JSON.stringify(updatedSession));
    setSaved('சுயவிவரம் வெற்றிகரமாக சேமிக்கப்பட்டது!');
    setTimeout(() => setSaved(''), 4000);
  };

  return (
    <section className="screen twoCol">
      <div className="panel">
        <span className="pill"><User size={16} /> பயனர்</span>
        <h2>சுயவிவரம்</h2>
        <label>
          பெயர்
          <input value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label>
          மாவட்டம்
          <input value={district} onChange={(e) => setDistrict(e.target.value)} />
        </label>
        <label>
          விருப்ப மொழி
          <input value={language} onChange={(e) => setLanguage(e.target.value)} />
        </label>
        <button className="primaryBtn" onClick={handleSave}>சேமி</button>
        {saved && <p className="notice">{saved}</p>}
      </div>
      <div className="panel">
        <h2>அணுகல் வசதி</h2>
        <MiniList title="இயங்கும் அம்சங்கள்" items={['குரல் உள்ளீடு', 'குரல் பதில்', 'பெரிய தொடு பொத்தான்கள்', 'கைபேசி நட்பு அமைப்பு']} />
      </div>
    </section>
  );
}

function Admin() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('');

  const saveContent = async () => {
    if (!title.trim() || !description.trim()) {
      setStatus('தலைப்பும் விளக்கமும் இரண்டும் உள்ளிடவும்.');
      return;
    }
    try {
      const res = await fetch(`${API}/admin/content`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description })
      });
      if (!res.ok) {
        throw new Error('Request failed');
      }
      setStatus('உள்ளடக்கம் ஆய்வுக்காக சேமிக்கப்பட்டது.');
      setTitle('');
      setDescription('');
    } catch {
      setStatus('பின்னணி சேவை இப்போது கிடைக்கவில்லை. உள்ளடக்கம் சமர்ப்பிக்கப்படவில்லை.');
    }
  };

  return <section className="screen twoCol"><div className="panel"><span className="pill"><Settings size={16} /> நிர்வாகம்</span><h2>உள்ளடக்க புதுப்பிப்பு</h2><label>தலைப்பு<input placeholder="சட்ட தலைப்பு" value={title} onChange={(event) => setTitle(event.target.value)} /></label><label>விளக்கம்<textarea placeholder="எளிய தமிழ் விளக்கம்" value={description} onChange={(event) => setDescription(event.target.value)} /></label><button className="primaryBtn" onClick={saveContent}>ஆய்வுக்காக சேமி</button>{status && <p className="notice">{status}</p>}</div><div className="panel"><h2>கண்காணிப்பு</h2><MiniList title="பணிகள்" items={['கேள்வி பதில்களை பராமரி', 'சட்ட வழிகாட்டிகளை புதுப்பி', 'வழக்கறிஞர்களை சரிபார்', 'பதில் தரத்தை ஆய்வு செய்']} /></div></section>;
}

function DetailPage() {
  const { slug } = useParams();
  const page = allPages.find((p) => p.slug === slug) || allPages[0];
  return <section className="screen"><div className="panel detail"><span className="pill"><BookOpen size={16} /> {page.group}</span><h2>{page.title}</h2><p>{page.text}</p><MiniList title="பயனுள்ள படிகள்" items={['முக்கிய உண்மைகளை எழுதிச் சேமிக்கவும்.', 'தொடர்புடைய ஆவணங்களை ஒன்றாக வைத்திருங்கள்.', 'அவசரம் இருந்தால் அதிகாரப்பூர்வ உதவி எண்ணை அழைக்கவும்.', 'பிரச்சினை தொடர்ந்தால் வழக்கறிஞரிடம் பேசவும்.']} /><div className="toolbar"><Link className="secondaryBtn" to={`${USER_BASE}/assistant`}><Mic size={17} /> இதைப் பற்றி கேள்</Link><Link className="primaryBtn" to={`${USER_BASE}/lawyers`}><MapPin size={17} /> உதவி தேடு</Link></div></div></section>;
}

function PageShelf({ group, limit }) {
  const pages = group ? allPages.filter((p) => p.group === group) : allPages.slice(0, limit || allPages.length);
  return <div className="shelf"><h3>{group || 'முக்கிய பக்கங்கள்'}</h3><div className="pageGrid">{pages.map((p) => <Link className="pageTile" to={`${USER_BASE}/page/${p.slug}`} key={p.slug}><span>{p.group}</span><strong>{p.title}</strong><ChevronRight size={18} /></Link>)}</div></div>;
}

function MiniList({ title, items = [] }) {
  return <div className="miniList"><h4>{title}</h4>{items.map((item) => <div key={item}><ChevronRight size={15} /><span>{item}</span></div>)}</div>;
}

function saveLocal(query, answer) {
  const old = readHistory();
  localStorage.setItem('lawvoice-history-' + getActiveUserId(), JSON.stringify([{ query, answer }, ...old].slice(0, 20)));
}

function readHistory() {
  try {
    const rows = JSON.parse(localStorage.getItem('lawvoice-history-' + getActiveUserId()) || '[]');
    return Array.isArray(rows) ? rows.filter((row) => row && row.query && row.answer && !/[A-Za-z]{2,}/.test(`${row.query} ${row.answer}`)) : [];
  } catch {
    localStorage.removeItem('lawvoice-history-' + getActiveUserId());
    return [];
  }
}

function normalizeAnswer(data, query = '') {
  // If Sarvam returned a proper response with topic+summary, use it directly
  if (data?.topic && data?.summary && data.summary.length > 20) {
    return {
      topic: data.topic,
      summary: data.summary,
      steps: Array.isArray(data.steps) && data.steps.length > 0 ? data.steps : [],
      rights: Array.isArray(data.rights) && data.rights.length > 0 ? data.rights : [],
      nextActions: Array.isArray(data.nextActions) && data.nextActions.length > 0 ? data.nextActions : [],
      category: data.category || 'General',
      suggestedLawyers: Array.isArray(data.suggestedLawyers) ? data.suggestedLawyers : [],
      sources: Array.isArray(data.sources) ? data.sources : [],
      disclaimer: data.disclaimer || 'இது பொதுவான சட்ட விழிப்புணர்வு மட்டுமே; குறிப்பிட்ட வழக்குக்கு வழக்கறிஞரிடம் ஆலோசனை பெறுங்கள்.'
    };
  }
  // Fallback to local Tamil classifier if Sarvam gave empty/invalid response
  return buildTamilLegalAnswer(query);
}

function MyRequests() {
  const [myRequests, setMyRequests] = useState(() => {
    try {
      const all = JSON.parse(localStorage.getItem('lawvoice-requests') || '[]');
      const session = JSON.parse(localStorage.getItem('lawvoice-session') || '{}');
      const userPhone = session.phone || '';
      const userName = session.name || '';
      
      const normalize = (p) => p ? p.replace(/[^0-9]/g, '') : '';
      const phoneDigits = normalize(userPhone);

      return Array.isArray(all) ? all.filter((r) => {
        const reqPhone = normalize(r.phone);
        const nameMatches = userName && r.name && r.name.trim().toLowerCase() === userName.trim().toLowerCase();
        const phoneMatches = phoneDigits && reqPhone && (reqPhone.includes(phoneDigits) || phoneDigits.includes(reqPhone));
        return nameMatches || phoneMatches;
      }) : [];
    } catch {
      return [];
    }
  });

  return (
    <section className="screen">
      <div className="sectionHead">
        <div>
          <span className="pill"><FileCheck2 size={16} /> கோரிக்கை நிலை</span>
          <h2>எனது வழக்கறிஞர் கோரிக்கைகள்</h2>
        </div>
      </div>
      <div className="requestsList" style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
        {myRequests.map((req) => (
          <div key={req.id} className="lawyerCard" style={{ padding: '20px', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#fff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', color: '#2d3748' }}>
                வழக்கறிஞர்: {req.lawyerName || 'சரிபார்க்கப்பட்ட வழக்கறிஞர்'}
              </h3>
              <span className="pill" style={{ 
                backgroundColor: req.status === 'முடிந்தது' ? '#c6f6d5' : req.status === 'New request' ? '#feebc8' : '#ebf8ff',
                color: req.status === 'முடிந்தது' ? '#22543d' : req.status === 'New request' ? '#744210' : '#2b6cb0',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 'bold'
              }}>
                {req.status === 'New request' ? 'அனுப்பப்பட்டது' : req.status}
              </span>
            </div>
            <div style={{ fontSize: '14px', color: '#4a5568', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span>வழக்கு விவரம்: <strong>{req.issue}</strong></span>
              <span>வகை: <strong>{req.category}</strong></span>
              <span>அனுப்பிய நேரம்: <strong>{req.time}</strong></span>
              <span>கோரிக்கை ID: <strong>{req.id}</strong></span>
            </div>
          </div>
        ))}
        {myRequests.length === 0 && (
          <p style={{ color: '#718096', fontStyle: 'italic', fontSize: '15px' }}>கோரிக்கைகள் எதுவும் இன்னும் அனுப்பப்படவில்லை.</p>
        )}
      </div>
    </section>
  );
}

createRoot(document.getElementById('root')).render(<App />);
