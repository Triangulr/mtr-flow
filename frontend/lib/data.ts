export interface Station {
  id: number;
  code: string;
  name: string;
  line: string;
  latitude?: number;
  longitude?: number;
}

export const STATIONS: Station[] = [
  // Island Line
  { id: 101, code: 'CHW', name: 'Chai Wan', line: 'Island Line' },
  { id: 102, code: 'HFC', name: 'Heng Fa Chuen', line: 'Island Line' },
  { id: 103, code: 'SKW', name: 'Shau Kei Wan', line: 'Island Line' },
  { id: 104, code: 'SWH', name: 'Sai Wan Ho', line: 'Island Line' },
  { id: 105, code: 'TAK', name: 'Tai Koo', line: 'Island Line' },
  { id: 106, code: 'QUB', name: 'Quarry Bay', line: 'Island Line' },
  { id: 107, code: 'NOP', name: 'North Point', line: 'Island Line' },
  { id: 108, code: 'FOH', name: 'Fortress Hill', line: 'Island Line' },
  { id: 109, code: 'TIH', name: 'Tin Hau', line: 'Island Line' },
  { id: 110, code: 'CAB', name: 'Causeway Bay', line: 'Island Line' },
  { id: 111, code: 'WAC', name: 'Wan Chai', line: 'Island Line' },
  { id: 112, code: 'ADM', name: 'Admiralty', line: 'Island Line' },
  { id: 113, code: 'CEN', name: 'Central', line: 'Island Line' },
  { id: 114, code: 'SHW', name: 'Sheung Wan', line: 'Island Line' },
  { id: 115, code: 'SYP', name: 'Sai Ying Pun', line: 'Island Line' },
  { id: 116, code: 'HKU', name: 'HKU', line: 'Island Line' },
  { id: 117, code: 'KET', name: 'Kennedy Town', line: 'Island Line' },

  // Tsuen Wan Line
  { id: 201, code: 'TSW', name: 'Tsuen Wan', line: 'Tsuen Wan Line' },
  { id: 202, code: 'TWH', name: 'Tai Wo Hau', line: 'Tsuen Wan Line' },
  { id: 203, code: 'KWH', name: 'Kwai Hing', line: 'Tsuen Wan Line' },
  { id: 204, code: 'KWF', name: 'Kwai Fong', line: 'Tsuen Wan Line' },
  { id: 205, code: 'LAK', name: 'Lai King', line: 'Tsuen Wan Line' },
  { id: 206, code: 'MEF', name: 'Mei Foo', line: 'Tsuen Wan Line' },
  { id: 207, code: 'LCK', name: 'Lai Chi Kok', line: 'Tsuen Wan Line' },
  { id: 208, code: 'CSW', name: 'Cheung Sha Wan', line: 'Tsuen Wan Line' },
  { id: 209, code: 'SSP', name: 'Sham Shui Po', line: 'Tsuen Wan Line' },
  { id: 210, code: 'PRE', name: 'Prince Edward', line: 'Tsuen Wan Line' },
  { id: 211, code: 'MOK', name: 'Mong Kok', line: 'Tsuen Wan Line' },
  { id: 212, code: 'YMT', name: 'Yau Ma Tei', line: 'Tsuen Wan Line' },
  { id: 213, code: 'JOR', name: 'Jordan', line: 'Tsuen Wan Line' },
  { id: 214, code: 'TST', name: 'Tsim Sha Tsui', line: 'Tsuen Wan Line' },
  { id: 215, code: 'ADM', name: 'Admiralty', line: 'Tsuen Wan Line' },
  { id: 216, code: 'CEN', name: 'Central', line: 'Tsuen Wan Line' },

  // Kwun Tong Line
  { id: 301, code: 'TIK', name: 'Tiu Keng Leng', line: 'Kwun Tong Line' },
  { id: 302, code: 'YAT', name: 'Yau Tong', line: 'Kwun Tong Line' },
  { id: 303, code: 'LAT', name: 'Lam Tin', line: 'Kwun Tong Line' },
  { id: 304, code: 'KWT', name: 'Kwun Tong', line: 'Kwun Tong Line' },
  { id: 305, code: 'NTK', name: 'Ngau Tau Kok', line: 'Kwun Tong Line' },
  { id: 306, code: 'KOB', name: 'Kowloon Bay', line: 'Kwun Tong Line' },
  { id: 307, code: 'CHH', name: 'Choi Hung', line: 'Kwun Tong Line' },
  { id: 308, code: 'DIH', name: 'Diamond Hill', line: 'Kwun Tong Line' },
  { id: 309, code: 'WTS', name: 'Wong Tai Sin', line: 'Kwun Tong Line' },
  { id: 310, code: 'LOF', name: 'Lok Fu', line: 'Kwun Tong Line' },
  { id: 311, code: 'KOT', name: 'Kowloon Tong', line: 'Kwun Tong Line' },
  { id: 312, code: 'SKM', name: 'Shek Kip Mei', line: 'Kwun Tong Line' },
  { id: 313, code: 'PRE', name: 'Prince Edward', line: 'Kwun Tong Line' },
  { id: 314, code: 'MOK', name: 'Mong Kok', line: 'Kwun Tong Line' },
  { id: 315, code: 'YMT', name: 'Yau Ma Tei', line: 'Kwun Tong Line' },
  { id: 316, code: 'HOM', name: 'Ho Man Tin', line: 'Kwun Tong Line' },
  { id: 317, code: 'WHA', name: 'Whampoa', line: 'Kwun Tong Line' },

  // Tseung Kwan O Line
  { id: 401, code: 'POA', name: 'Po Lam', line: 'Tseung Kwan O Line' },
  { id: 402, code: 'LHP', name: 'LOHAS Park', line: 'Tseung Kwan O Line' },
  { id: 403, code: 'HAH', name: 'Hang Hau', line: 'Tseung Kwan O Line' },
  { id: 404, code: 'TKO', name: 'Tseung Kwan O', line: 'Tseung Kwan O Line' },
  { id: 405, code: 'TIK', name: 'Tiu Keng Leng', line: 'Tseung Kwan O Line' },
  { id: 406, code: 'YAT', name: 'Yau Tong', line: 'Tseung Kwan O Line' },
  { id: 407, code: 'QUB', name: 'Quarry Bay', line: 'Tseung Kwan O Line' },
  { id: 408, code: 'NOP', name: 'North Point', line: 'Tseung Kwan O Line' },

  // Tung Chung Line
  { id: 501, code: 'TUC', name: 'Tung Chung', line: 'Tung Chung Line' },
  { id: 502, code: 'SUN', name: 'Sunny Bay', line: 'Tung Chung Line' },
  { id: 503, code: 'TSY', name: 'Tsing Yi', line: 'Tung Chung Line' },
  { id: 504, code: 'LAK', name: 'Lai King', line: 'Tung Chung Line' },
  { id: 505, code: 'NAC', name: 'Nam Cheong', line: 'Tung Chung Line' },
  { id: 506, code: 'OLY', name: 'Olympic', line: 'Tung Chung Line' },
  { id: 507, code: 'KOW', name: 'Kowloon', line: 'Tung Chung Line' },
  { id: 508, code: 'HOK', name: 'Hong Kong', line: 'Tung Chung Line' },

  // East Rail Line
  { id: 601, code: 'LOW', name: 'Lo Wu', line: 'East Rail Line' },
  { id: 602, code: 'LMC', name: 'Lok Ma Chau', line: 'East Rail Line' },
  { id: 603, code: 'SHS', name: 'Sheung Shui', line: 'East Rail Line' },
  { id: 604, code: 'FAN', name: 'Fanling', line: 'East Rail Line' },
  { id: 605, code: 'TWO', name: 'Tai Wo', line: 'East Rail Line' },
  { id: 606, code: 'TAP', name: 'Tai Po Market', line: 'East Rail Line' },
  { id: 607, code: 'UNI', name: 'University', line: 'East Rail Line' },
  { id: 608, code: 'FOT', name: 'Fo Tan', line: 'East Rail Line' },
  { id: 609, code: 'SHT', name: 'Sha Tin', line: 'East Rail Line' },
  { id: 610, code: 'TAW', name: 'Tai Wai', line: 'East Rail Line' },
  { id: 611, code: 'KOT', name: 'Kowloon Tong', line: 'East Rail Line' },
  { id: 612, code: 'MKK', name: 'Mong Kok East', line: 'East Rail Line' },
  { id: 613, code: 'HUH', name: 'Hung Hom', line: 'East Rail Line' },
  { id: 614, code: 'EXC', name: 'Exhibition Centre', line: 'East Rail Line' },
  { id: 615, code: 'ADM', name: 'Admiralty', line: 'East Rail Line' },

  // Tuen Ma Line
  { id: 701, code: 'WKS', name: 'Wu Kai Sha', line: 'Tuen Ma Line' },
  { id: 702, code: 'MOS', name: 'Ma On Shan', line: 'Tuen Ma Line' },
  { id: 703, code: 'HEO', name: 'Heng On', line: 'Tuen Ma Line' },
  { id: 704, code: 'TSH', name: 'Tai Shui Hang', line: 'Tuen Ma Line' },
  { id: 705, code: 'SHM', name: 'Shek Mun', line: 'Tuen Ma Line' },
  { id: 706, code: 'CIO', name: 'City One', line: 'Tuen Ma Line' },
  { id: 707, code: 'STW', name: 'Sha Tin Wai', line: 'Tuen Ma Line' },
  { id: 708, code: 'CKT', name: 'Che Kung Temple', line: 'Tuen Ma Line' },
  { id: 709, code: 'TAW', name: 'Tai Wai', line: 'Tuen Ma Line' },
  { id: 710, code: 'HIK', name: 'Hin Keng', line: 'Tuen Ma Line' },
  { id: 711, code: 'DIH', name: 'Diamond Hill', line: 'Tuen Ma Line' },
  { id: 712, code: 'KAT', name: 'Kai Tak', line: 'Tuen Ma Line' },
  { id: 713, code: 'SUW', name: 'Sung Wong Toi', line: 'Tuen Ma Line' },
  { id: 714, code: 'TKW', name: 'To Kwa Wan', line: 'Tuen Ma Line' },
  { id: 715, code: 'HOM', name: 'Ho Man Tin', line: 'Tuen Ma Line' },
  { id: 716, code: 'HUH', name: 'Hung Hom', line: 'Tuen Ma Line' },
  { id: 717, code: 'ETS', name: 'East Tsim Sha Tsui', line: 'Tuen Ma Line' },
  { id: 718, code: 'AUS', name: 'Austin', line: 'Tuen Ma Line' },
  { id: 719, code: 'NAC', name: 'Nam Cheong', line: 'Tuen Ma Line' },
  { id: 720, code: 'MEF', name: 'Mei Foo', line: 'Tuen Ma Line' },
  { id: 721, code: 'TWW', name: 'Tsuen Wan West', line: 'Tuen Ma Line' },
  { id: 722, code: 'KSR', name: 'Kam Sheung Road', line: 'Tuen Ma Line' },
  { id: 723, code: 'YUL', name: 'Yuen Long', line: 'Tuen Ma Line' },
  { id: 724, code: 'LOP', name: 'Long Ping', line: 'Tuen Ma Line' },
  { id: 725, code: 'TIS', name: 'Tin Shui Wai', line: 'Tuen Ma Line' },
  { id: 726, code: 'SIH', name: 'Siu Hong', line: 'Tuen Ma Line' },
  { id: 727, code: 'TUM', name: 'Tuen Mun', line: 'Tuen Ma Line' },

  // South Island Line
  { id: 801, code: 'ADM', name: 'Admiralty', line: 'South Island Line' },
  { id: 802, code: 'OCP', name: 'Ocean Park', line: 'South Island Line' },
  { id: 803, code: 'WCH', name: 'Wong Chuk Hang', line: 'South Island Line' },
  { id: 804, code: 'LET', name: 'Lei Tung', line: 'South Island Line' },
  { id: 805, code: 'SOH', name: 'South Horizons', line: 'South Island Line' },

  // Airport Express
  { id: 901, code: 'AWE', name: 'AsiaWorld-Expo', line: 'Airport Express' },
  { id: 902, code: 'AIR', name: 'Airport', line: 'Airport Express' },
  { id: 903, code: 'TSY', name: 'Tsing Yi', line: 'Airport Express' },
  { id: 904, code: 'KOW', name: 'Kowloon', line: 'Airport Express' },
  { id: 905, code: 'HOK', name: 'Hong Kong', line: 'Airport Express' },

  // Disneyland Resort Line
  { id: 951, code: 'SUN', name: 'Sunny Bay', line: 'Disneyland Resort Line' },
  { id: 952, code: 'DIS', name: 'Disneyland Resort', line: 'Disneyland Resort Line' },

];
