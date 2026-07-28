import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin,
  Search,
  Phone,
  Navigation,
  Compass,
  Star,
  Building,
  ExternalLink,
  Layers,
  Sparkles,
  Calendar,
  UserCheck,
  X
} from 'lucide-react';
import { API } from './api';
import './styles.css';

const districtsTN = [
  { name: 'அனைத்து மாவட்டங்கள் (All)', lat: 11.1271, lng: 78.6569, zoom: 7 },
  { name: 'சென்னை (Chennai)', lat: 13.0827, lng: 80.2707, zoom: 12 },
  { name: 'மதுரை (Madurai)', lat: 9.9252, lng: 78.1198, zoom: 12 },
  { name: 'கோயம்புத்தூர் (Coimbatore)', lat: 11.0168, lng: 76.9558, zoom: 12 },
  { name: 'திருச்சி (Trichy)', lat: 10.7905, lng: 78.7047, zoom: 12 },
  { name: 'சேலம் (Salem)', lat: 11.6643, lng: 78.146, zoom: 12 },
  { name: 'திருநெல்வேலி (Tirunelveli)', lat: 8.7139, lng: 77.7567, zoom: 12 },
  { name: 'ஈரோடு (Erode)', lat: 11.341, lng: 77.7172, zoom: 12 },
  { name: 'வேலூர் (Vellore)', lat: 12.9165, lng: 79.1325, zoom: 12 },
  { name: 'தஞ்சாவூர் (Thanjavur)', lat: 10.787, lng: 79.1378, zoom: 12 },
  { name: 'தூத்துக்குடி (Tuticorin)', lat: 8.7642, lng: 78.1348, zoom: 12 }
];

const cityCoordsMap = {
  'சென்னை': { lat: 13.0878, lng: 80.2835, district: 'சென்னை (Chennai)', court: 'மெட்ராஸ் உயர் நீதிமன்றம்' },
  'Chennai': { lat: 13.0878, lng: 80.2835, district: 'சென்னை (Chennai)', court: 'மெட்ராஸ் உயர் நீதிமன்றம்' },
  'பாரிஸ்': { lat: 13.0850, lng: 80.2860, district: 'சென்னை (Chennai)', court: 'பாரிமுனை வழக்கறிஞர் சங்கம்' },
  'மதுரை': { lat: 9.9252, lng: 78.1198, district: 'மதுரை (Madurai)', court: 'மதுரை கிளை உயர் நீதிமன்றம்' },
  'Madurai': { lat: 9.9252, lng: 78.1198, district: 'மதுரை (Madurai)', court: 'மதுரை கிளை உயர் நீதிமன்றம்' },
  'கோயம்புத்தூர்': { lat: 11.0168, lng: 76.9558, district: 'கோயம்புத்தூர் (Coimbatore)', court: 'கோயம்புத்தூர் நீதிமன்றம்' },
  'Coimbatore': { lat: 11.0168, lng: 76.9558, district: 'கோயம்புத்தூர் (Coimbatore)', court: 'கோயம்புத்தூர் நீதிமன்றம்' },
  'திருச்சி': { lat: 10.7905, lng: 78.7047, district: 'திருச்சி (Trichy)', court: 'திருச்சி மாவட்ட நீதிமன்றம்' },
  'Trichy': { lat: 10.7905, lng: 78.7047, district: 'திருச்சி (Trichy)', court: 'திருச்சி மாவட்ட நீதிமன்றம்' },
  'சேலம்': { lat: 11.6643, lng: 78.1460, district: 'சேலம் (Salem)', court: 'சேலம் நீதிமன்றம்' },
  'Salem': { lat: 11.6643, lng: 78.1460, district: 'சேலம் (Salem)', court: 'சேலம் நீதிமன்றம்' },
};

const lawyerLocationsDataInitial = [
  {
    id: 1,
    name: 'Adv. ப்ரியா ராமன்',
    category: 'குற்றவியல் சட்டம் (Criminal Law)',
    city: 'சென்னை',
    district: 'சென்னை (Chennai)',
    address: 'எண் 45, உயர் நீதிமன்ற வளாகம் அருகே, என்.எஸ்சி போஸ் சாலை, பாரிமுனை, சென்னை - 600104',
    lat: 13.0878,
    lng: 80.2835,
    phone: '+91 90000 10001',
    rating: '4.8',
    experience: '9 ஆண்டுகள்',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    courtName: 'மெட்ராஸ் உயர் நீதிமன்றம் (Madras High Court)'
  },
  {
    id: 2,
    name: 'Adv. மீனா ராஜ்',
    category: 'குடும்ப சட்டம் (Family Law)',
    city: 'மதுரை',
    district: 'மதுரை (Madurai)',
    address: 'எண் 18, மாவட்ட வழக்கறிஞர் சங்கம் கட்டிடம், கே.கே நகர், மதுரை - 625020',
    lat: 9.9252,
    lng: 78.1198,
    phone: '+91 90000 10002',
    rating: '4.7',
    experience: '11 ஆண்டுகள்',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    courtName: 'மதுரை கிளை உயர் நீதிமன்றம் & மாவட்ட நீதிமன்றம்'
  },
  {
    id: 3,
    name: 'Adv. பிரகாஷ் வேல்',
    category: 'நுகர்வோர் சட்டம் (Consumer Law)',
    city: 'கோயம்புத்தூர்',
    district: 'கோயம்புத்தூர் (Coimbatore)',
    address: 'எண் 102, ஸ்டேட் பாங்க் ரோடு, மாவட்ட ஆட்சியர் அலுவலகம் எதிரில், கோயம்புத்தூர் - 641018',
    lat: 11.0168,
    lng: 76.9558,
    phone: '+91 90000 10003',
    rating: '4.6',
    experience: '7 ஆண்டுகள்',
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80',
    courtName: 'கோயம்புத்தூர் ஒருங்கிணைந்த நீதிமன்ற வளாகம்'
  },
  {
    id: 4,
    name: 'Adv. லதா சிவா',
    category: 'சொத்து சட்டம் (Property Law)',
    city: 'திருச்சி',
    district: 'திருச்சி (Trichy)',
    address: 'எண் 7, நீதிமன்ற சாலை, கண்டோன்மென்ட், திருச்சிராப்பள்ளி - 620001',
    lat: 10.7905,
    lng: 78.7047,
    phone: '+91 90000 10004',
    rating: '4.9',
    experience: '13 ஆண்டுகள்',
    avatar: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=150&auto=format&fit=crop&q=80',
    courtName: 'திருச்சி மாவட்ட முதன்மை நீதிமன்றம்'
  },
  {
    id: 5,
    name: 'Adv. கேசவன் சுப்பிரமணியம்',
    category: 'சிவில் சட்டம் (Civil Law)',
    city: 'சேலம்',
    district: 'சேலம் (Salem)',
    address: 'எண் 88, அஸ்தம்பட்டி பிரதான சாலை, நீதிமன்ற வளாகம் அருகே, சேலம் - 636007',
    lat: 11.6643,
    lng: 78.146,
    phone: '+91 90000 10005',
    rating: '4.8',
    experience: '15 ஆண்டுகள்',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    courtName: 'சேலம் மாவட்ட ஒருங்கிணைந்த நீதிமன்றம்'
  }
];

const LawyerLocationFinder = () => {
  const [lawyersList, setLawyersList] = useState(lawyerLocationsDataInitial);
  const [selectedDistrict, setSelectedDistrict] = useState('அனைத்து மாவட்டங்கள் (All)');
  const [searchQuery, setSearchQuery] = useState('');
  const [locationStatus, setLocationStatus] = useState('');
  const [distances, setDistances] = useState({});
  const [selectedLawyerOnMap, setSelectedLawyerOnMap] = useState(null);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);

  // Fetch backend lawyers and merge dynamically
  useEffect(() => {
    const fetchLawyers = async () => {
      try {
        const res = await fetch(`${API}/lawyers`);
        if (res.ok) {
          const backendData = await res.json();
          if (Array.isArray(backendData) && backendData.length > 0) {
            const merged = [...lawyerLocationsDataInitial];
            backendData.forEach((bl, index) => {
              const exists = merged.some(
                m => m.name.trim().toLowerCase().includes(bl.name.trim().toLowerCase()) ||
                     (bl.phone && m.phone === bl.phone)
              );
              if (!exists) {
                const cityKey = bl.city || bl.district || 'சென்னை';
                const cityInfo = cityCoordsMap[cityKey] || cityCoordsMap['சென்னை'];
                // Add slight offset so markers don't overlap exactly
                const offsetLat = (Math.random() - 0.5) * 0.015;
                const offsetLng = (Math.random() - 0.5) * 0.015;

                merged.push({
                  id: bl.id || `backend-${index}`,
                  name: bl.name.startsWith('Adv.') ? bl.name : `Adv. ${bl.name}`,
                  category: bl.category || 'பொது சட்டம் (General Law)',
                  city: bl.city || 'சென்னை',
                  district: cityInfo.district,
                  address: bl.office || `${bl.city || 'சென்னை'} நீதிமன்ற வளாகம் அருகே`,
                  lat: cityInfo.lat + offsetLat,
                  lng: cityInfo.lng + offsetLng,
                  phone: bl.phone || '+91 90000 10006',
                  rating: bl.rating || '4.8',
                  experience: bl.experience || '8 ஆண்டுகள்',
                  avatar: bl.avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
                  courtName: bl.courtPractice || cityInfo.court
                });
              }
            });
            setLawyersList(merged);
          }
        }
      } catch (e) {
        console.error("Failed to load backend lawyers in map:", e);
      }
    };
    fetchLawyers();
  }, []);

  // Calculate Distance in KM using Haversine Formula
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c).toFixed(1);
  };

  // Initialize Leaflet Map
  useEffect(() => {
    let isMounted = true;

    const initMap = () => {
      if (!mapRef.current || !window.L || !isMounted) return;

      try {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }

        if (mapRef.current._leaflet_id) {
          mapRef.current._leaflet_id = null;
        }

        const map = window.L.map(mapRef.current).setView([10.8, 78.7], 7);

        window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map);

        mapInstanceRef.current = map;

        // Render Markers with Tamil tooltips
        markersRef.current = [];
        const latLngList = [];
        lawyersList.forEach((lawyer) => {
          latLngList.push([lawyer.lat, lawyer.lng]);
          const lawyerIcon = window.L.divIcon({
            html: `<div style="background:#059669;color:#fff;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-size:15px;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.3)">⚖️</div>`,
            className: '', iconSize: [32, 32], iconAnchor: [16, 16]
          });
          const marker = window.L.marker([lawyer.lat, lawyer.lng], { icon: lawyerIcon }).addTo(map);
          const popupContent = `
            <div style="font-family: 'Noto Sans Tamil', sans-serif; padding: 6px;">
              <strong style="font-size: 14px; color: #1e293b;">${lawyer.name}</strong><br/>
              <span style="font-size: 12px; color: #059669; font-weight: 600;">${lawyer.category}</span><br/>
              <small style="color: #64748b;">🏛️ ${lawyer.courtName}</small><br/>
              <small style="color: #64748b;">📍 ${lawyer.city}</small><br/>
              <a href="tel:${lawyer.phone}" style="display: inline-block; margin-top: 6px; padding: 4px 10px; background: #059669; color: white; border-radius: 6px; text-decoration: none; font-size: 12px;">📞 அழைக்கவும் ${lawyer.phone}</a>
            </div>
          `;
          marker.bindPopup(popupContent);
          // Tamil permanent tooltip showing lawyer name
          marker.bindTooltip(lawyer.name, { permanent: true, direction: 'top', className: 'tamilTooltip' });
          marker.on('click', () => {
            setSelectedLawyerOnMap(lawyer);
          });
          markersRef.current.push(marker);
        });

        // Fit map bounds over all Tamil Nadu markers
        if (latLngList.length > 0 && window.L.latLngBounds) {
          const bounds = window.L.latLngBounds(latLngList);
          map.fitBounds(bounds, { padding: [40, 40] });
        }

        // Trigger size invalidation to fix CSS flex container rendering
        setTimeout(() => {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.invalidateSize();
          }
        }, 300);
      } catch (err) {
        console.warn('Leaflet map init warning:', err);
      }
    };

    // Retry if Leaflet script is still loading asynchronously
    if (!window.L) {
      const timer = setTimeout(initMap, 500);
      return () => clearTimeout(timer);
    } else {
      initMap();
    }

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (e) {}
        mapInstanceRef.current = null;
      }
    };
  }, [lawyersList]);

  // Update Map Center when District is selected
  const handleDistrictChange = (distObj) => {
    setSelectedDistrict(distObj.name);
    if (mapInstanceRef.current && distObj.lat) {
      mapInstanceRef.current.flyTo([distObj.lat, distObj.lng], distObj.zoom, {
        duration: 1.2
      });
    }
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('உங்கள் ப்ரவுசரில் GPS சேவை கிடைக்கவில்லை.');
      return;
    }
    setLocationStatus('உங்கள் தற்போதைய இருப்பிடம் கணக்கிடப்படுகிறது...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };

        const newDistances = {};
        lawyersList.forEach((lawyer) => {
          newDistances[lawyer.id] = calculateDistance(
            coords.lat,
            coords.lng,
            lawyer.lat,
            lawyer.lng
          );
        });
        setDistances(newDistances);
        setLocationStatus('உங்கள் ஜிபிஎஸ் இருப்பிடத்திலிருந்து தூரம் கணக்கிடப்பட்டது!');

        if (mapInstanceRef.current && window.L) {
          mapInstanceRef.current.flyTo([coords.lat, coords.lng], 12);
          const userMarker = window.L.marker([coords.lat, coords.lng])
            .addTo(mapInstanceRef.current)
            .bindPopup('<b>📍 உங்கள் தற்போதைய இடம்</b>')
            .openPopup();
          markersRef.current.push(userMarker);
        }
      },
      () => setLocationStatus('ஜிபிஎஸ் இருப்பிட அனுமதி வழங்கப்படவில்லை.')
    );
  };

  const filteredLawyers = lawyersList.filter((lawyer) => {
    const matchesDistrict =
      selectedDistrict === 'அனைத்து மாவட்டங்கள் (All)' ||
      lawyer.district === selectedDistrict ||
      lawyer.city.includes(selectedDistrict.split(' ')[0]);

    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      lawyer.name.toLowerCase().includes(query) ||
      lawyer.category.toLowerCase().includes(query) ||
      lawyer.city.toLowerCase().includes(query) ||
      lawyer.address.toLowerCase().includes(query);

    return matchesDistrict && matchesSearch;
  });

  return (
    <div className="lawyerLocationScreen screen">
      <div className="sectionHead">
        <div>
          <span className="pill">
            <Layers size={16} /> Leaflet OpenStreetMap வரைபடம்
          </span>
          <h2>வழக்கறிஞர் அமைவிடம் மற்றும் நேரடி வரைபட வழிகாட்டி</h2>
        </div>
        <button className="primaryBtn" onClick={handleGetLocation}>
          <Navigation size={18} /> GPS அருகில் தேடு (Near Me)
        </button>
      </div>

      {locationStatus && (
        <div className="statusNotice">
          <Compass size={18} /> {locationStatus}
        </div>
      )}

      {/* Leaflet Interactive OpenStreetMap Container */}
      <div className="mapContainerCard cardGlass" style={{ padding: '0.8rem', borderRadius: '16px' }}>
        <div className="mapHeaderRow" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem', padding: '0 0.4rem' }}>
          <h3 style={{ margin: 0, fontSize: '1rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MapPin size={18} color="#059669" /> தமிழ்நாடு வழக்கறிஞர் & நீதிமன்றங்கள் நேரடி வரைபடம் (Leaflet API)
          </h3>
          <span className="pill" style={{ background: '#ecfdf5', color: '#065f46', fontSize: '0.78rem' }}>
            OpenStreetMap Live Tiles
          </span>
        </div>
        <div
          ref={mapRef}
          style={{
            height: '380px',
            width: '100%',
            borderRadius: '12px',
            zIndex: 1,
            boxShadow: 'inset 0 0 10px rgba(0,0,0,0.1)'
          }}
        />
      </div>

      {/* SELECTED LAWYER INFO BANNER ON MARKER CLICK */}
      {selectedLawyerOnMap && (
        <div className="selectedLawyerBanner cardGlass" style={{ borderLeft: '5px solid #059669', padding: '1.4rem', position: 'relative' }}>
          <button
            onClick={() => setSelectedLawyerOnMap(null)}
            className="modalCloseBtn"
            style={{ position: 'absolute', top: '12px', right: '12px' }}
            aria-label="மூடு"
          >
            <X size={20} />
          </button>
          <div style={{ display: 'flex', gap: '1.2rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <img
              src={selectedLawyerOnMap.avatar}
              alt={selectedLawyerOnMap.name}
              style={{ width: '72px', height: '72px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #059669' }}
            />
            <div style={{ flex: 1, minWidth: '240px' }}>
              <span className="pill" style={{ background: '#ecfdf5', color: '#065f46', marginBottom: '0.4rem', display: 'inline-flex' }}>
                <Sparkles size={14} /> வரைபடத்தில் தேர்ந்தெடுக்கப்பட்டது (Selected from Map)
              </span>
              <h3 style={{ margin: '4px 0', fontSize: '1.25rem', color: '#0f172a' }}>{selectedLawyerOnMap.name}</h3>
              <p style={{ margin: '3px 0', color: '#475569', fontSize: '0.92rem' }}>
                <strong>{selectedLawyerOnMap.category}</strong> | ⭐ {selectedLawyerOnMap.rating} ({selectedLawyerOnMap.experience})
              </p>
              <p style={{ margin: '3px 0', color: '#64748b', fontSize: '0.88rem' }}>
                <Building size={14} /> <strong>நீதிமன்றம்:</strong> {selectedLawyerOnMap.courtName}
              </p>
              <p style={{ margin: '3px 0', color: '#64748b', fontSize: '0.88rem' }}>
                <MapPin size={14} color="#ef4444" /> <strong>முகவரி:</strong> {selectedLawyerOnMap.address}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <a href={`tel:${selectedLawyerOnMap.phone}`} className="secondaryBtn">
                <Phone size={16} /> அழை ({selectedLawyerOnMap.phone})
              </a>
              <Link to="/user-profile/interaction" className="primaryBtn">
                <Calendar size={16} /> சந்தியுங்கள் (Book Consultation)
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* District Selection Chips */}
      <div className="districtFilterSection cardGlass">
        <h4>மாவட்ட ரீதியாக வழக்கறிஞர்களைத் தேர்ந்தெடுக்கவும்:</h4>
        <div className="districtChips">
          {districtsTN.map((distObj) => (
            <button
              key={distObj.name}
              className={selectedDistrict === distObj.name ? 'districtChip active' : 'districtChip'}
              onClick={() => handleDistrictChange(distObj)}
            >
              <MapPin size={14} /> {distObj.name}
            </button>
          ))}
        </div>
      </div>

      {/* Search Bar */}
      <div className="searchBarContainer">
        <Search size={18} className="searchIcon" />
        <input
          type="text"
          placeholder="வழக்கறிஞர் பெயர், நகரம், அல்லது சட்டப் பிரிவு தேடவும்..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="locationSearchInput"
        />
      </div>

      {/* Lawyer Location Cards Grid */}
      <div className="lawyerLocationGrid">
        {filteredLawyers.length === 0 ? (
          <div className="emptyState cardGlass">
            <MapPin size={48} color="#6366f1" />
            <h3>தேர்ந்தெடுத்த மாவட்டத்தில் வழக்கறிஞர்கள் கிடைக்கவில்லை</h3>
            <p>வேறு மாவட்டத்தையோ அல்லது தேடல் வார்த்தையையோ தேர்ந்தெடுக்கவும்.</p>
          </div>
        ) : (
          filteredLawyers.map((lawyer) => (
            <div key={lawyer.id} className="locationCard cardGlass">
              <div className="cardHeaderRow">
                <img
                  src={lawyer.avatar}
                  alt={lawyer.name}
                  className="lawyerAvatarImg"
                />
                <div>
                  <h3>{lawyer.name}</h3>
                  <span className="categoryBadge">{lawyer.category}</span>
                  <div className="miniMetaRow">
                    <span><Star size={14} color="#f59e0b" /> {lawyer.rating}</span>
                    <span>{lawyer.experience}</span>
                  </div>
                </div>
              </div>

              <div className="cardBodyDetails">
                <p className="courtTag">
                  <Building size={14} /> <strong>நீதிமன்றம்:</strong> {lawyer.courtName}
                </p>
                <p className="addressText">
                  <MapPin size={15} color="#ef4444" /> {lawyer.address}
                </p>

                {distances[lawyer.id] && (
                  <div className="distanceBadge">
                    <Navigation size={14} /> உங்கள் இருப்பிடத்திலிருந்து <strong>{distances[lawyer.id]} கி.மீ (km)</strong> தொலைவில்
                  </div>
                )}
              </div>

              <div className="cardFooterToolbar">
                <a href={`tel:${lawyer.phone}`} className="secondaryBtn compact">
                  <Phone size={16} /> அழை (Call)
                </a>
                <button
                  onClick={() => {
                    if (mapInstanceRef.current) {
                      mapInstanceRef.current.flyTo([lawyer.lat, lawyer.lng], 14);
                      const m = markersRef.current.find((item) =>
                        item.getLatLng().lat.toFixed(3) === lawyer.lat.toFixed(3)
                      );
                      if (m) m.openPopup();
                    }
                  }}
                  className="primaryBtn compact"
                >
                  <MapPin size={16} /> வரைபடத்தில் பார் (View on Map)
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default LawyerLocationFinder;
