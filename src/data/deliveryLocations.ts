export interface DeliveryLocation {
  id: string;
  name: string;
  district: string;
  zone: 'INSIDE_VALLEY' | 'OUTSIDE_VALLEY' | 'OUTER_REGIONAL';
  zoneLabel: string;
  charge: number;
}

export const DELIVERY_LOCATIONS: DeliveryLocation[] = [
  // ----------------------------------------------------
  // ZONE 1: INSIDE KATHMANDU VALLEY — Rs. 100
  // ----------------------------------------------------
  // Kathmandu District
  { id: 'ktm-city', name: 'Kathmandu City', district: 'Kathmandu', zone: 'INSIDE_VALLEY', zoneLabel: 'Inside Valley', charge: 100 },
  { id: 'ktm-thamel', name: 'Thamel / Durbar Marg', district: 'Kathmandu', zone: 'INSIDE_VALLEY', zoneLabel: 'Inside Valley', charge: 100 },
  { id: 'ktm-baneshwor', name: 'New Baneshwor / Koteshwor', district: 'Kathmandu', zone: 'INSIDE_VALLEY', zoneLabel: 'Inside Valley', charge: 100 },
  { id: 'ktm-boudha', name: 'Boudha / Jorpati', district: 'Kathmandu', zone: 'INSIDE_VALLEY', zoneLabel: 'Inside Valley', charge: 100 },
  { id: 'ktm-kalanki', name: 'Kalanki / Swayambhu', district: 'Kathmandu', zone: 'INSIDE_VALLEY', zoneLabel: 'Inside Valley', charge: 100 },
  { id: 'ktm-maharajgunj', name: 'Maharajgunj / Chabahil', district: 'Kathmandu', zone: 'INSIDE_VALLEY', zoneLabel: 'Inside Valley', charge: 100 },
  { id: 'ktm-kirtipur', name: 'Kirtipur', district: 'Kathmandu', zone: 'INSIDE_VALLEY', zoneLabel: 'Inside Valley', charge: 100 },
  { id: 'ktm-budhanilkantha', name: 'Budhanilkantha', district: 'Kathmandu', zone: 'INSIDE_VALLEY', zoneLabel: 'Inside Valley', charge: 100 },
  { id: 'ktm-tokha', name: 'Tokha', district: 'Kathmandu', zone: 'INSIDE_VALLEY', zoneLabel: 'Inside Valley', charge: 100 },
  { id: 'ktm-sankhu', name: 'Shankharapur (Sankhu)', district: 'Kathmandu', zone: 'INSIDE_VALLEY', zoneLabel: 'Inside Valley', charge: 100 },
  { id: 'ktm-tarakeshwar', name: 'Tarakeshwar', district: 'Kathmandu', zone: 'INSIDE_VALLEY', zoneLabel: 'Inside Valley', charge: 100 },
  { id: 'ktm-gokarneshwar', name: 'Gokarneshwar', district: 'Kathmandu', zone: 'INSIDE_VALLEY', zoneLabel: 'Inside Valley', charge: 100 },
  { id: 'ktm-chandragiri', name: 'Chandragiri', district: 'Kathmandu', zone: 'INSIDE_VALLEY', zoneLabel: 'Inside Valley', charge: 100 },
  { id: 'ktm-nagarjun', name: 'Nagarjun', district: 'Kathmandu', zone: 'INSIDE_VALLEY', zoneLabel: 'Inside Valley', charge: 100 },

  // Lalitpur District
  { id: 'lal-patan', name: 'Lalitpur (Patan)', district: 'Lalitpur', zone: 'INSIDE_VALLEY', zoneLabel: 'Inside Valley', charge: 100 },
  { id: 'lal-jawalakhel', name: 'Jawalakhel / Jhamsikhel', district: 'Lalitpur', zone: 'INSIDE_VALLEY', zoneLabel: 'Inside Valley', charge: 100 },
  { id: 'lal-satdobato', name: 'Satdobato / Kupondole', district: 'Lalitpur', zone: 'INSIDE_VALLEY', zoneLabel: 'Inside Valley', charge: 100 },
  { id: 'lal-imadol', name: 'Mahalaxmi (Imadol)', district: 'Lalitpur', zone: 'INSIDE_VALLEY', zoneLabel: 'Inside Valley', charge: 100 },
  { id: 'lal-godawari', name: 'Godawari', district: 'Lalitpur', zone: 'INSIDE_VALLEY', zoneLabel: 'Inside Valley', charge: 100 },

  // Bhaktapur District
  { id: 'bkt-city', name: 'Bhaktapur City', district: 'Bhaktapur', zone: 'INSIDE_VALLEY', zoneLabel: 'Inside Valley', charge: 100 },
  { id: 'bkt-thimi', name: 'Thimi (Madhyapur)', district: 'Bhaktapur', zone: 'INSIDE_VALLEY', zoneLabel: 'Inside Valley', charge: 100 },
  { id: 'bkt-suryabinayak', name: 'Suryabinayak', district: 'Bhaktapur', zone: 'INSIDE_VALLEY', zoneLabel: 'Inside Valley', charge: 100 },
  { id: 'bkt-changunarayan', name: 'Changunarayan', district: 'Bhaktapur', zone: 'INSIDE_VALLEY', zoneLabel: 'Inside Valley', charge: 100 },

  // ----------------------------------------------------
  // ZONE 2: OUTSIDE VALLEY — Rs. 150
  // ----------------------------------------------------
  // Chitwan & Kaski
  { id: 'out-pokhara', name: 'Pokhara / Lekhnath', district: 'Kaski', zone: 'OUTSIDE_VALLEY', zoneLabel: 'Outside Valley', charge: 150 },
  { id: 'out-bharatpur', name: 'Bharatpur', district: 'Chitwan', zone: 'OUTSIDE_VALLEY', zoneLabel: 'Outside Valley', charge: 150 },
  { id: 'out-narayangarh', name: 'Narayangarh', district: 'Chitwan', zone: 'OUTSIDE_VALLEY', zoneLabel: 'Outside Valley', charge: 150 },
  { id: 'out-tandi', name: 'Tandi / Ratnanagar', district: 'Chitwan', zone: 'OUTSIDE_VALLEY', zoneLabel: 'Outside Valley', charge: 150 },

  // Morang & Sunsari
  { id: 'out-biratnagar', name: 'Biratnagar', district: 'Morang', zone: 'OUTSIDE_VALLEY', zoneLabel: 'Outside Valley', charge: 150 },
  { id: 'out-urlabari', name: 'Urlabari', district: 'Morang', zone: 'OUTSIDE_VALLEY', zoneLabel: 'Outside Valley', charge: 150 },
  { id: 'out-dharan', name: 'Dharan', district: 'Sunsari', zone: 'OUTSIDE_VALLEY', zoneLabel: 'Outside Valley', charge: 150 },
  { id: 'out-itahari', name: 'Itahari', district: 'Sunsari', zone: 'OUTSIDE_VALLEY', zoneLabel: 'Outside Valley', charge: 150 },
  { id: 'out-inaruwa', name: 'Inaruwa', district: 'Sunsari', zone: 'OUTSIDE_VALLEY', zoneLabel: 'Outside Valley', charge: 150 },

  // Rupandehi & Kapilvastu
  { id: 'out-butwal', name: 'Butwal', district: 'Rupandehi', zone: 'OUTSIDE_VALLEY', zoneLabel: 'Outside Valley', charge: 150 },
  { id: 'out-bhairahawa', name: 'Bhairahawa (Siddharthanagar)', district: 'Rupandehi', zone: 'OUTSIDE_VALLEY', zoneLabel: 'Outside Valley', charge: 150 },
  { id: 'out-lumbini', name: 'Lumbini', district: 'Rupandehi', zone: 'OUTSIDE_VALLEY', zoneLabel: 'Outside Valley', charge: 150 },
  { id: 'out-taulihawa', name: 'Taulihawa', district: 'Kapilvastu', zone: 'OUTSIDE_VALLEY', zoneLabel: 'Outside Valley', charge: 150 },
  { id: 'out-chandrauta', name: 'Chandrauta', district: 'Kapilvastu', zone: 'OUTSIDE_VALLEY', zoneLabel: 'Outside Valley', charge: 150 },

  // Jhapa & Parsa
  { id: 'out-birtamode', name: 'Birtamode', district: 'Jhapa', zone: 'OUTSIDE_VALLEY', zoneLabel: 'Outside Valley', charge: 150 },
  { id: 'out-damak', name: 'Damak', district: 'Jhapa', zone: 'OUTSIDE_VALLEY', zoneLabel: 'Outside Valley', charge: 150 },
  { id: 'out-kakarvitta', name: 'Kakarvitta', district: 'Jhapa', zone: 'OUTSIDE_VALLEY', zoneLabel: 'Outside Valley', charge: 150 },
  { id: 'out-bhadrapur', name: 'Bhadrapur', district: 'Jhapa', zone: 'OUTSIDE_VALLEY', zoneLabel: 'Outside Valley', charge: 150 },
  { id: 'out-birgunj', name: 'Birgunj', district: 'Parsa', zone: 'OUTSIDE_VALLEY', zoneLabel: 'Outside Valley', charge: 150 },

  // Makwanpur & Banke
  { id: 'out-hetauda', name: 'Hetauda', district: 'Makwanpur', zone: 'OUTSIDE_VALLEY', zoneLabel: 'Outside Valley', charge: 150 },
  { id: 'out-nepalgunj', name: 'Nepalgunj', district: 'Banke', zone: 'OUTSIDE_VALLEY', zoneLabel: 'Outside Valley', charge: 150 },
  { id: 'out-kohalpur', name: 'Kohalpur', district: 'Banke', zone: 'OUTSIDE_VALLEY', zoneLabel: 'Outside Valley', charge: 150 },

  // Dhanusha, Mahottari & Sarlahi
  { id: 'out-janakpur', name: 'Janakpur', district: 'Dhanusha', zone: 'OUTSIDE_VALLEY', zoneLabel: 'Outside Valley', charge: 150 },
  { id: 'out-dhalkebar', name: 'Dhalkebar', district: 'Dhanusha', zone: 'OUTSIDE_VALLEY', zoneLabel: 'Outside Valley', charge: 150 },
  { id: 'out-mahendranagar-dhn', name: 'Mahendranagar', district: 'Dhanusha', zone: 'OUTSIDE_VALLEY', zoneLabel: 'Outside Valley', charge: 150 },
  { id: 'out-bardibas', name: 'Bardibas', district: 'Mahottari', zone: 'OUTSIDE_VALLEY', zoneLabel: 'Outside Valley', charge: 150 },
  { id: 'out-jaleshwar', name: 'Jaleshwar', district: 'Mahottari', zone: 'OUTSIDE_VALLEY', zoneLabel: 'Outside Valley', charge: 150 },
  { id: 'out-lalbandi', name: 'Lalbandi', district: 'Sarlahi', zone: 'OUTSIDE_VALLEY', zoneLabel: 'Outside Valley', charge: 150 },
  { id: 'out-malangwa', name: 'Malangwa', district: 'Sarlahi', zone: 'OUTSIDE_VALLEY', zoneLabel: 'Outside Valley', charge: 150 },

  // Dang & Nawalpur/Parasi
  { id: 'out-ghorahi', name: 'Ghorahi', district: 'Dang', zone: 'OUTSIDE_VALLEY', zoneLabel: 'Outside Valley', charge: 150 },
  { id: 'out-tulsipur', name: 'Tulsipur', district: 'Dang', zone: 'OUTSIDE_VALLEY', zoneLabel: 'Outside Valley', charge: 150 },
  { id: 'out-lamahi', name: 'Lamahi', district: 'Dang', zone: 'OUTSIDE_VALLEY', zoneLabel: 'Outside Valley', charge: 150 },
  { id: 'out-gaindakot', name: 'Gaindakot', district: 'Nawalpur', zone: 'OUTSIDE_VALLEY', zoneLabel: 'Outside Valley', charge: 150 },
  { id: 'out-kawasoti', name: 'Kawasoti', district: 'Nawalpur', zone: 'OUTSIDE_VALLEY', zoneLabel: 'Outside Valley', charge: 150 },
  { id: 'out-ramgram', name: 'Ramgram (Parasi)', district: 'Parasi', zone: 'OUTSIDE_VALLEY', zoneLabel: 'Outside Valley', charge: 150 },
  { id: 'out-sunwal', name: 'Sunwal', district: 'Parasi', zone: 'OUTSIDE_VALLEY', zoneLabel: 'Outside Valley', charge: 150 },

  // Kavre, Nuwakot & Dhading
  { id: 'out-banepa', name: 'Banepa', district: 'Kavre', zone: 'OUTSIDE_VALLEY', zoneLabel: 'Outside Valley', charge: 150 },
  { id: 'out-dhulikhel', name: 'Dhulikhel', district: 'Kavre', zone: 'OUTSIDE_VALLEY', zoneLabel: 'Outside Valley', charge: 150 },
  { id: 'out-panauti', name: 'Panauti', district: 'Kavre', zone: 'OUTSIDE_VALLEY', zoneLabel: 'Outside Valley', charge: 150 },
  { id: 'out-bidur', name: 'Bidur / Trishuli', district: 'Nuwakot', zone: 'OUTSIDE_VALLEY', zoneLabel: 'Outside Valley', charge: 150 },
  { id: 'out-dhadingbesi', name: 'Dhading Besi', district: 'Dhading', zone: 'OUTSIDE_VALLEY', zoneLabel: 'Outside Valley', charge: 150 },
  { id: 'out-malekhu', name: 'Malekhu', district: 'Dhading', zone: 'OUTSIDE_VALLEY', zoneLabel: 'Outside Valley', charge: 150 },

  // Tanahun, Gorkha, Palpa & Syangja
  { id: 'out-damauli', name: 'Damauli', district: 'Tanahun', zone: 'OUTSIDE_VALLEY', zoneLabel: 'Outside Valley', charge: 150 },
  { id: 'out-abukhaireni', name: 'Abukhaireni', district: 'Tanahun', zone: 'OUTSIDE_VALLEY', zoneLabel: 'Outside Valley', charge: 150 },
  { id: 'out-gorkha', name: 'Gorkha Bazaar', district: 'Gorkha', zone: 'OUTSIDE_VALLEY', zoneLabel: 'Outside Valley', charge: 150 },
  { id: 'out-tansen', name: 'Tansen', district: 'Palpa', zone: 'OUTSIDE_VALLEY', zoneLabel: 'Outside Valley', charge: 150 },
  { id: 'out-rampur', name: 'Rampur', district: 'Palpa', zone: 'OUTSIDE_VALLEY', zoneLabel: 'Outside Valley', charge: 150 },
  { id: 'out-putalibazar', name: 'Putalibazar', district: 'Syangja', zone: 'OUTSIDE_VALLEY', zoneLabel: 'Outside Valley', charge: 150 },
  { id: 'out-waling', name: 'Waling', district: 'Syangja', zone: 'OUTSIDE_VALLEY', zoneLabel: 'Outside Valley', charge: 150 },

  // Siraha, Saptari, Rautahat & Bara
  { id: 'out-lahan', name: 'Lahan', district: 'Siraha', zone: 'OUTSIDE_VALLEY', zoneLabel: 'Outside Valley', charge: 150 },
  { id: 'out-siraha', name: 'Siraha Bazaar', district: 'Siraha', zone: 'OUTSIDE_VALLEY', zoneLabel: 'Outside Valley', charge: 150 },
  { id: 'out-rajbiraj', name: 'Rajbiraj', district: 'Saptari', zone: 'OUTSIDE_VALLEY', zoneLabel: 'Outside Valley', charge: 150 },
  { id: 'out-chandrapur', name: 'Chandrapur', district: 'Rautahat', zone: 'OUTSIDE_VALLEY', zoneLabel: 'Outside Valley', charge: 150 },
  { id: 'out-gaur', name: 'Gaur', district: 'Rautahat', zone: 'OUTSIDE_VALLEY', zoneLabel: 'Outside Valley', charge: 150 },
  { id: 'out-simara', name: 'Simara', district: 'Bara', zone: 'OUTSIDE_VALLEY', zoneLabel: 'Outside Valley', charge: 150 },
  { id: 'out-kalaiya', name: 'Kalaiya', district: 'Bara', zone: 'OUTSIDE_VALLEY', zoneLabel: 'Outside Valley', charge: 150 },

  // ----------------------------------------------------
  // ZONE 3: OUTER REGIONAL HUBS & DISTRICT HEADQUARTERS — Rs. 200
  // ----------------------------------------------------
  // Far-West & Sudurpashchim
  { id: 'reg-dhangadhi', name: 'Dhangadhi', district: 'Kailali', zone: 'OUTER_REGIONAL', zoneLabel: 'Outer Regional', charge: 200 },
  { id: 'reg-tikapur', name: 'Tikapur', district: 'Kailali', zone: 'OUTER_REGIONAL', zoneLabel: 'Outer Regional', charge: 200 },
  { id: 'reg-attariya', name: 'Attariya', district: 'Kailali', zone: 'OUTER_REGIONAL', zoneLabel: 'Outer Regional', charge: 200 },
  { id: 'reg-mahendranagar-kan', name: 'Mahendranagar (Bhimdatta)', district: 'Kanchanpur', zone: 'OUTER_REGIONAL', zoneLabel: 'Outer Regional', charge: 200 },
  { id: 'reg-amargadhi', name: 'Amargadhi (Dadeldhura)', district: 'Dadeldhura', zone: 'OUTER_REGIONAL', zoneLabel: 'Outer Regional', charge: 200 },
  { id: 'reg-chainpur', name: 'Chainpur (Bajhang)', district: 'Bajhang', zone: 'OUTER_REGIONAL', zoneLabel: 'Outer Regional', charge: 200 },
  { id: 'reg-martadi', name: 'Martadi (Bajura)', district: 'Bajura', zone: 'OUTER_REGIONAL', zoneLabel: 'Outer Regional', charge: 200 },
  { id: 'reg-darchula', name: 'Darchula Bazaar', district: 'Darchula', zone: 'OUTER_REGIONAL', zoneLabel: 'Outer Regional', charge: 200 },
  { id: 'reg-dasharathchand', name: 'Dasharathchand (Baitadi)', district: 'Baitadi', zone: 'OUTER_REGIONAL', zoneLabel: 'Outer Regional', charge: 200 },
  { id: 'reg-dipayal', name: 'Dipayal Silgadhi (Doti)', district: 'Doti', zone: 'OUTER_REGIONAL', zoneLabel: 'Outer Regional', charge: 200 },
  { id: 'reg-mangalsen', name: 'Mangalsen (Achham)', district: 'Achham', zone: 'OUTER_REGIONAL', zoneLabel: 'Outer Regional', charge: 200 },

  // Karnali & Mid-West
  { id: 'reg-birendranagar', name: 'Birendranagar (Surkhet)', district: 'Surkhet', zone: 'OUTER_REGIONAL', zoneLabel: 'Outer Regional', charge: 200 },
  { id: 'reg-gulariya', name: 'Gulariya (Bardiya)', district: 'Bardiya', zone: 'OUTER_REGIONAL', zoneLabel: 'Outer Regional', charge: 200 },
  { id: 'reg-dailekh', name: 'Dailekh', district: 'Dailekh', zone: 'OUTER_REGIONAL', zoneLabel: 'Outer Regional', charge: 200 },
  { id: 'reg-salyan', name: 'Salyan', district: 'Salyan', zone: 'OUTER_REGIONAL', zoneLabel: 'Outer Regional', charge: 200 },
  { id: 'reg-khalanga', name: 'Khalanga (Jajarkot)', district: 'Jajarkot', zone: 'OUTER_REGIONAL', zoneLabel: 'Outer Regional', charge: 200 },
  { id: 'reg-manma', name: 'Manma (Kalikot)', district: 'Kalikot', zone: 'OUTER_REGIONAL', zoneLabel: 'Outer Regional', charge: 200 },
  { id: 'reg-chandannath', name: 'Chandannath (Jumla)', district: 'Jumla', zone: 'OUTER_REGIONAL', zoneLabel: 'Outer Regional', charge: 200 },
  { id: 'reg-dunai', name: 'Dunai (Dolpa)', district: 'Dolpa', zone: 'OUTER_REGIONAL', zoneLabel: 'Outer Regional', charge: 200 },
  { id: 'reg-gamgadhi', name: 'Gamgadhi (Mugu)', district: 'Mugu', zone: 'OUTER_REGIONAL', zoneLabel: 'Outer Regional', charge: 200 },
  { id: 'reg-simikot', name: 'Simikot (Humla)', district: 'Humla', zone: 'OUTER_REGIONAL', zoneLabel: 'Outer Regional', charge: 200 },
  { id: 'reg-liwang', name: 'Liwang (Rolpa)', district: 'Rolpa', zone: 'OUTER_REGIONAL', zoneLabel: 'Outer Regional', charge: 200 },
  { id: 'reg-pyuthan', name: 'Pyuthan', district: 'Pyuthan', zone: 'OUTER_REGIONAL', zoneLabel: 'Outer Regional', charge: 200 },
  { id: 'reg-rukumkot', name: 'Rukumkot', district: 'Rukum East', zone: 'OUTER_REGIONAL', zoneLabel: 'Outer Regional', charge: 200 },
  { id: 'reg-musikot', name: 'Musikot', district: 'Rukum West', zone: 'OUTER_REGIONAL', zoneLabel: 'Outer Regional', charge: 200 },

  // Western Mountain & Hills
  { id: 'reg-baglung', name: 'Baglung', district: 'Baglung', zone: 'OUTER_REGIONAL', zoneLabel: 'Outer Regional', charge: 200 },
  { id: 'reg-beni', name: 'Beni (Myagdi)', district: 'Myagdi', zone: 'OUTER_REGIONAL', zoneLabel: 'Outer Regional', charge: 200 },
  { id: 'reg-kusma', name: 'Kusma (Parbat)', district: 'Parbat', zone: 'OUTER_REGIONAL', zoneLabel: 'Outer Regional', charge: 200 },
  { id: 'reg-besisahar', name: 'Besisahar (Lamjung)', district: 'Lamjung', zone: 'OUTER_REGIONAL', zoneLabel: 'Outer Regional', charge: 200 },
  { id: 'reg-sandhikharka', name: 'Sandhikharka (Arghakhanchi)', district: 'Arghakhanchi', zone: 'OUTER_REGIONAL', zoneLabel: 'Outer Regional', charge: 200 },
  { id: 'reg-tamghas', name: 'Tamghas (Gulmi)', district: 'Gulmi', zone: 'OUTER_REGIONAL', zoneLabel: 'Outer Regional', charge: 200 },
  { id: 'reg-chame', name: 'Chame (Manang)', district: 'Manang', zone: 'OUTER_REGIONAL', zoneLabel: 'Outer Regional', charge: 200 },
  { id: 'reg-jomsom', name: 'Jomsom (Mustang)', district: 'Mustang', zone: 'OUTER_REGIONAL', zoneLabel: 'Outer Regional', charge: 200 },

  // Central & Eastern Hills/Himalayas
  { id: 'reg-charikot', name: 'Charikot (Dolakha)', district: 'Dolakha', zone: 'OUTER_REGIONAL', zoneLabel: 'Outer Regional', charge: 200 },
  { id: 'reg-chautara', name: 'Chautara (Sindhupalchok)', district: 'Sindhupalchok', zone: 'OUTER_REGIONAL', zoneLabel: 'Outer Regional', charge: 200 },
  { id: 'reg-manthali', name: 'Manthali (Ramechhap)', district: 'Ramechhap', zone: 'OUTER_REGIONAL', zoneLabel: 'Outer Regional', charge: 200 },
  { id: 'reg-kamalamai', name: 'Kamalamai (Sindhuli)', district: 'Sindhuli', zone: 'OUTER_REGIONAL', zoneLabel: 'Outer Regional', charge: 200 },
  { id: 'reg-dhunche', name: 'Dhunche (Rasuwa)', district: 'Rasuwa', zone: 'OUTER_REGIONAL', zoneLabel: 'Outer Regional', charge: 200 },
  { id: 'reg-ilam', name: 'Ilam', district: 'Ilam', zone: 'OUTER_REGIONAL', zoneLabel: 'Outer Regional', charge: 200 },
  { id: 'reg-gaighat', name: 'Gaighat & Katari (Udayapur)', district: 'Udayapur', zone: 'OUTER_REGIONAL', zoneLabel: 'Outer Regional', charge: 200 },
  { id: 'reg-dhankuta', name: 'Dhankuta', district: 'Dhankuta', zone: 'OUTER_REGIONAL', zoneLabel: 'Outer Regional', charge: 200 },
  { id: 'reg-phidim', name: 'Phidim (Panchthar)', district: 'Panchthar', zone: 'OUTER_REGIONAL', zoneLabel: 'Outer Regional', charge: 200 },
  { id: 'reg-fungling', name: 'Fungling (Taplejung)', district: 'Taplejung', zone: 'OUTER_REGIONAL', zoneLabel: 'Outer Regional', charge: 200 },
  { id: 'reg-khandbari', name: 'Khandbari (Sankhuwasabha)', district: 'Sankhuwasabha', zone: 'OUTER_REGIONAL', zoneLabel: 'Outer Regional', charge: 200 },
  { id: 'reg-salleri', name: 'Salleri (Solukhumbu)', district: 'Solukhumbu', zone: 'OUTER_REGIONAL', zoneLabel: 'Outer Regional', charge: 200 },
  { id: 'reg-okhaldhunga', name: 'Okhaldhunga', district: 'Okhaldhunga', zone: 'OUTER_REGIONAL', zoneLabel: 'Outer Regional', charge: 200 },
  { id: 'reg-diktel', name: 'Diktel (Khotang)', district: 'Khotang', zone: 'OUTER_REGIONAL', zoneLabel: 'Outer Regional', charge: 200 },
  { id: 'reg-bhojpur', name: 'Bhojpur', district: 'Bhojpur', zone: 'OUTER_REGIONAL', zoneLabel: 'Outer Regional', charge: 200 },
  { id: 'reg-myanglung', name: 'Myanglung (Terhathum)', district: 'Terhathum', zone: 'OUTER_REGIONAL', zoneLabel: 'Outer Regional', charge: 200 },
];
