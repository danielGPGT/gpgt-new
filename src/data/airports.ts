// List of major airports for F1, MotoGP, and major UK cities
export const AIRPORTS = [
  // Major UK Airports
  { name: 'London Heathrow', code: 'LHR' },
  { name: 'London Gatwick', code: 'LGW' },
  { name: 'London Stansted', code: 'STN' },
  { name: 'London Luton', code: 'LTN' },
  { name: 'London City', code: 'LCY' },
  { name: 'Manchester', code: 'MAN' },
  { name: 'Birmingham', code: 'BHX' },
  { name: 'Edinburgh', code: 'EDI' },
  { name: 'Glasgow', code: 'GLA' },
  { name: 'Bristol', code: 'BRS' },
  { name: 'Liverpool', code: 'LPL' },
  { name: 'Newcastle', code: 'NCL' },
  { name: 'East Midlands', code: 'EMA' },
  { name: 'Leeds Bradford', code: 'LBA' },
  { name: 'Aberdeen', code: 'ABZ' },
  { name: 'Belfast International', code: 'BFS' },
  { name: 'Belfast City', code: 'BHD' },
  { name: 'Southampton', code: 'SOU' },
  { name: 'Cardiff', code: 'CWL' },
  { name: 'London Southend', code: 'SEN' },

  // F1 & MotoGP Event Airports
  { name: 'Melbourne Tullamarine', code: 'MEL' }, // Australian GP
  { name: 'Avalon', code: 'AVV' },
  { name: 'Shanghai Pudong', code: 'PVG' }, // Chinese GP
  { name: 'Nagoya Chubu Centrair', code: 'NGO' }, // Japanese GP (Suzuka)
  { name: 'Osaka Kansai', code: 'KIX' },
  { name: 'Tokyo Narita', code: 'NRT' },
  { name: 'Tokyo Haneda', code: 'HND' },
  { name: 'Bahrain International', code: 'BAH' }, // Bahrain GP
  { name: 'Jeddah King Abdulaziz', code: 'JED' }, // Saudi GP
  { name: 'Riyadh King Khalid', code: 'RUH' },
  { name: 'Miami International', code: 'MIA' }, // Miami GP
  { name: 'Fort Lauderdale', code: 'FLL' },
  { name: 'Montreal Trudeau', code: 'YUL' }, // Canadian GP
  { name: 'Toronto Pearson', code: 'YYZ' },
  { name: 'Nice Côte d\'Azur', code: 'NCE' }, // Monaco GP
  { name: 'Marseille', code: 'MRS' },
  { name: 'Barcelona El Prat', code: 'BCN' }, // Spanish GP
  { name: 'Girona', code: 'GRO' },
  { name: 'Vienna Schwechat', code: 'VIE' }, // Austrian GP (Red Bull Ring)
  { name: 'Graz', code: 'GRZ' },
  { name: 'Salzburg', code: 'SZG' },
  { name: 'London Heathrow', code: 'LHR' }, // British GP (Silverstone)
  { name: 'Birmingham', code: 'BHX' },
  { name: 'Luton', code: 'LTN' },
  { name: 'Brussels Zaventem', code: 'BRU' }, // Belgian GP (Spa)
  { name: 'Luxembourg', code: 'LUX' },
  { name: 'Maastricht Aachen', code: 'MST' },
  { name: 'Budapest Ferenc Liszt', code: 'BUD' }, // Hungarian GP
  { name: 'Debrecen', code: 'DEB' },
  { name: 'Amsterdam Schiphol', code: 'AMS' }, // Dutch GP (Zandvoort)
  { name: 'Rotterdam', code: 'RTM' },
  { name: 'Eindhoven', code: 'EIN' },
  { name: 'Milan Malpensa', code: 'MXP' }, // Italian GP (Monza)
  { name: 'Milan Linate', code: 'LIN' },
  { name: 'Bergamo Orio al Serio', code: 'BGY' },
  { name: 'Rome Fiumicino', code: 'FCO' },
  { name: 'Madrid Barajas', code: 'MAD' }, // Spanish GP (Madring)
  { name: 'Baku Heydar Aliyev', code: 'GYD' }, // Azerbaijan GP
  { name: 'Singapore Changi', code: 'SIN' }, // Singapore GP
  { name: 'Austin Bergstrom', code: 'AUS' }, // US GP (COTA)
  { name: 'Houston', code: 'IAH' },
  { name: 'Dallas Fort Worth', code: 'DFW' },
  { name: 'Mexico City Benito Juarez', code: 'MEX' }, // Mexican GP
  { name: 'Cancun', code: 'CUN' },
  { name: 'São Paulo Guarulhos', code: 'GRU' }, // Brazilian GP (Interlagos)
  { name: 'Rio de Janeiro Galeão', code: 'GIG' },
  { name: 'Las Vegas Harry Reid', code: 'LAS' }, // Las Vegas GP
  { name: 'Los Angeles', code: 'LAX' },
  { name: 'Doha Hamad', code: 'DOH' }, // Qatar GP (Losail)
  { name: 'Abu Dhabi', code: 'AUH' }, // Abu Dhabi GP (Yas Marina)
  { name: 'Dubai', code: 'DXB' },
  // MotoGP
  { name: 'Austin Bergstrom', code: 'AUS' }, // COTA
  { name: 'Zaragoza', code: 'ZAZ' }, // MotorLand Aragón
  { name: 'Barcelona El Prat', code: 'BCN' }, // Catalunya
  { name: 'Phillip Island', code: 'MEL' }, // Australian MotoGP
  { name: 'Vienna Schwechat', code: 'VIE' }, // Austrian MotoGP
  { name: 'Goiânia Santa Genoveva', code: 'GYN' }, // Brazilian MotoGP
  { name: 'Silverstone', code: 'LHR' }, // British MotoGP
  { name: 'Brno', code: 'BRQ' }, // Czech MotoGP
  { name: 'Assen', code: 'GRQ' }, // Dutch TT
  { name: 'Le Mans', code: 'LME' }, // French MotoGP
  { name: 'Sachsenring', code: 'LEJ' }, // German MotoGP
  { name: 'Budapest', code: 'BUD' }, // Hungarian MotoGP
  { name: 'Delhi Indira Gandhi', code: 'DEL' }, // Indian MotoGP
  { name: 'Lombok', code: 'LOP' }, // Indonesian MotoGP
  { name: 'Mugello', code: 'FLR' }, // Italian MotoGP
  { name: 'Portimão', code: 'FAO' }, // Portuguese MotoGP
  { name: 'Misano', code: 'RMI' }, // San Marino MotoGP
  { name: 'Jerez', code: 'XRY' }, // Spanish MotoGP
  { name: 'Buriram', code: 'BFV' }, // Thailand MotoGP
  { name: 'Valencia', code: 'VLC' }, // Valencian MotoGP
  // Major international hubs
  { name: 'Paris Charles de Gaulle', code: 'CDG' },
  { name: 'Frankfurt', code: 'FRA' },
  { name: 'Munich', code: 'MUC' },
  { name: 'Zurich', code: 'ZRH' },
  { name: 'Geneva', code: 'GVA' },
  { name: 'Istanbul', code: 'IST' },
  { name: 'Madrid Barajas', code: 'MAD' },
  { name: 'Rome Fiumicino', code: 'FCO' },
  { name: 'Lisbon', code: 'LIS' },
  { name: 'Vienna', code: 'VIE' },
  { name: 'Copenhagen', code: 'CPH' },
  { name: 'Stockholm Arlanda', code: 'ARN' },
  { name: 'Oslo Gardermoen', code: 'OSL' },
  { name: 'Helsinki', code: 'HEL' },
  { name: 'Dublin', code: 'DUB' },
  { name: 'Brussels', code: 'BRU' },
  { name: 'Warsaw Chopin', code: 'WAW' },
  { name: 'Prague', code: 'PRG' },
  { name: 'Budapest', code: 'BUD' },
  { name: 'Athens', code: 'ATH' },
  { name: 'Moscow Sheremetyevo', code: 'SVO' },
  { name: 'Moscow Domodedovo', code: 'DME' },
  { name: 'St Petersburg Pulkovo', code: 'LED' },
  { name: 'Dubai', code: 'DXB' },
  { name: 'Doha', code: 'DOH' },
  { name: 'Abu Dhabi', code: 'AUH' },
  { name: 'Johannesburg OR Tambo', code: 'JNB' },
  { name: 'Cape Town', code: 'CPT' },
  { name: 'Hong Kong', code: 'HKG' },
  { name: 'Beijing Capital', code: 'PEK' },
  { name: 'Shanghai Pudong', code: 'PVG' },
  { name: 'Tokyo Narita', code: 'NRT' },
  { name: 'Tokyo Haneda', code: 'HND' },
  { name: 'Seoul Incheon', code: 'ICN' },
  { name: 'Bangkok Suvarnabhumi', code: 'BKK' },
  { name: 'Singapore Changi', code: 'SIN' },
  { name: 'Kuala Lumpur', code: 'KUL' },
  { name: 'Sydney', code: 'SYD' },
  { name: 'Melbourne', code: 'MEL' },
  { name: 'Auckland', code: 'AKL' },
  { name: 'Los Angeles', code: 'LAX' },
  { name: 'San Francisco', code: 'SFO' },
  { name: 'New York JFK', code: 'JFK' },
  { name: 'Newark', code: 'EWR' },
  { name: 'Chicago O\'Hare', code: 'ORD' },
  { name: 'Dallas Fort Worth', code: 'DFW' },
  { name: 'Houston', code: 'IAH' },
  { name: 'Miami', code: 'MIA' },
  { name: 'Atlanta', code: 'ATL' },
  { name: 'Toronto Pearson', code: 'YYZ' },
  { name: 'Vancouver', code: 'YVR' },
  { name: 'Montreal Trudeau', code: 'YUL' },
  { name: 'Mexico City', code: 'MEX' },
  { name: 'Sao Paulo Guarulhos', code: 'GRU' },
  { name: 'Buenos Aires Ezeiza', code: 'EZE' },
  { name: 'Lima Jorge Chavez', code: 'LIM' },
  { name: 'Santiago', code: 'SCL' },
]; 