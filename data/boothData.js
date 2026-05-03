/**
 * @module boothData
 * @description Mock polling booth data for major Indian cities.
 * Provides booth locations mapped by city name and PIN code.
 */

/** @type {Object<string, Array<{name: string, address: string, timings: string, type: string, mapUrl: string}>>} */
export const boothData = {
  'kolkata': [
    {
      name: 'Kolkata Municipal Ward 64 Booth',
      address: 'Moulali Youth Centre, 12 Moulali Road, Kolkata 700014',
      timings: '7:00 AM – 6:00 PM',
      type: 'Primary Booth',
      mapUrl: 'https://maps.google.com/?q=Moulali+Youth+Centre+Kolkata',
    },
    {
      name: 'Park Street Community Hall',
      address: '23 Park Street, Near Flury\'s, Kolkata 700016',
      timings: '7:00 AM – 6:00 PM',
      type: 'Auxiliary Booth',
      mapUrl: 'https://maps.google.com/?q=Park+Street+Community+Hall+Kolkata',
    },
    {
      name: 'Salt Lake Sector V Govt. School',
      address: 'Block GN, Sector V, Salt Lake, Kolkata 700091',
      timings: '7:00 AM – 6:00 PM',
      type: 'Primary Booth',
      mapUrl: 'https://maps.google.com/?q=Salt+Lake+Sector+V+Kolkata',
    },
    {
      name: 'Jadavpur University Campus Booth',
      address: '188 Raja S.C. Mallick Rd, Jadavpur, Kolkata 700032',
      timings: '7:00 AM – 6:00 PM',
      type: 'Primary Booth',
      mapUrl: 'https://maps.google.com/?q=Jadavpur+University+Kolkata',
    },
  ],
  'delhi': [
    {
      name: 'Connaught Place Govt. School Booth',
      address: 'Block A, Connaught Place, New Delhi 110001',
      timings: '7:00 AM – 6:00 PM',
      type: 'Primary Booth',
      mapUrl: 'https://maps.google.com/?q=Connaught+Place+School+Delhi',
    },
    {
      name: 'Dwarka Sector 12 Community Centre',
      address: 'Pocket 3, Sector 12, Dwarka, Delhi 110075',
      timings: '7:00 AM – 6:00 PM',
      type: 'Primary Booth',
      mapUrl: 'https://maps.google.com/?q=Dwarka+Sector+12+Delhi',
    },
    {
      name: 'Rohini Sector 7 MCD School',
      address: 'Block E, Sector 7, Rohini, Delhi 110085',
      timings: '7:00 AM – 6:00 PM',
      type: 'Auxiliary Booth',
      mapUrl: 'https://maps.google.com/?q=Rohini+Sector+7+Delhi',
    },
  ],
  'mumbai': [
    {
      name: 'Bandra West Community Hall',
      address: '14 Hill Road, Bandra West, Mumbai 400050',
      timings: '7:00 AM – 6:00 PM',
      type: 'Primary Booth',
      mapUrl: 'https://maps.google.com/?q=Bandra+West+Community+Hall+Mumbai',
    },
    {
      name: 'Andheri East Municipal School',
      address: 'Marol Maroshi Rd, Andheri East, Mumbai 400059',
      timings: '7:00 AM – 6:00 PM',
      type: 'Primary Booth',
      mapUrl: 'https://maps.google.com/?q=Andheri+East+Municipal+School+Mumbai',
    },
    {
      name: 'Dadar Shivaji Park Booth',
      address: 'Keluskar Road, Dadar, Mumbai 400028',
      timings: '7:00 AM – 6:00 PM',
      type: 'Auxiliary Booth',
      mapUrl: 'https://maps.google.com/?q=Dadar+Shivaji+Park+Mumbai',
    },
  ],
  'bangalore': [
    {
      name: 'Koramangala Govt. School Booth',
      address: '6th Block, Koramangala, Bangalore 560095',
      timings: '7:00 AM – 6:00 PM',
      type: 'Primary Booth',
      mapUrl: 'https://maps.google.com/?q=Koramangala+Govt+School+Bangalore',
    },
    {
      name: 'Indiranagar Community Centre',
      address: '100 Feet Road, Indiranagar, Bangalore 560038',
      timings: '7:00 AM – 6:00 PM',
      type: 'Primary Booth',
      mapUrl: 'https://maps.google.com/?q=Indiranagar+Community+Centre+Bangalore',
    },
    {
      name: 'Whitefield Municipal Hall',
      address: 'ITPL Main Road, Whitefield, Bangalore 560066',
      timings: '7:00 AM – 6:00 PM',
      type: 'Auxiliary Booth',
      mapUrl: 'https://maps.google.com/?q=Whitefield+Municipal+Hall+Bangalore',
    },
  ],
  'chennai': [
    {
      name: 'T. Nagar Corporation School',
      address: '23 Usman Road, T. Nagar, Chennai 600017',
      timings: '7:00 AM – 6:00 PM',
      type: 'Primary Booth',
      mapUrl: 'https://maps.google.com/?q=T+Nagar+Corporation+School+Chennai',
    },
    {
      name: 'Adyar Community Centre Booth',
      address: 'Lattice Bridge Road, Adyar, Chennai 600020',
      timings: '7:00 AM – 6:00 PM',
      type: 'Primary Booth',
      mapUrl: 'https://maps.google.com/?q=Adyar+Community+Centre+Chennai',
    },
    {
      name: 'Anna Nagar Tower Park Booth',
      address: '2nd Avenue, Anna Nagar, Chennai 600040',
      timings: '7:00 AM – 6:00 PM',
      type: 'Auxiliary Booth',
      mapUrl: 'https://maps.google.com/?q=Anna+Nagar+Tower+Park+Chennai',
    },
  ],
  'hyderabad': [
    {
      name: 'Banjara Hills GHMC Office Booth',
      address: 'Road No. 12, Banjara Hills, Hyderabad 500034',
      timings: '7:00 AM – 6:00 PM',
      type: 'Primary Booth',
      mapUrl: 'https://maps.google.com/?q=Banjara+Hills+GHMC+Hyderabad',
    },
    {
      name: 'Kukatpally Govt. School Booth',
      address: 'KPHB Colony, Kukatpally, Hyderabad 500072',
      timings: '7:00 AM – 6:00 PM',
      type: 'Primary Booth',
      mapUrl: 'https://maps.google.com/?q=Kukatpally+KPHB+Hyderabad',
    },
    {
      name: 'Secunderabad Railway Colony Booth',
      address: 'Mettuguda, Secunderabad, Hyderabad 500017',
      timings: '7:00 AM – 6:00 PM',
      type: 'Auxiliary Booth',
      mapUrl: 'https://maps.google.com/?q=Secunderabad+Railway+Colony+Hyderabad',
    },
  ],
};

/**
 * PIN code to city mapping for location lookup.
 * @type {Object<string, string>}
 */
export const pinToCityMap = {
  // Kolkata PINs
  '700001': 'kolkata', '700014': 'kolkata', '700016': 'kolkata',
  '700032': 'kolkata', '700091': 'kolkata', '700020': 'kolkata',
  // Delhi PINs
  '110001': 'delhi', '110075': 'delhi', '110085': 'delhi',
  '110025': 'delhi', '110092': 'delhi',
  // Mumbai PINs
  '400001': 'mumbai', '400050': 'mumbai', '400059': 'mumbai',
  '400028': 'mumbai', '400076': 'mumbai',
  // Bangalore PINs
  '560001': 'bangalore', '560095': 'bangalore', '560038': 'bangalore',
  '560066': 'bangalore', '560034': 'bangalore',
  // Chennai PINs
  '600001': 'chennai', '600017': 'chennai', '600020': 'chennai',
  '600040': 'chennai', '600028': 'chennai',
  // Hyderabad PINs
  '500001': 'hyderabad', '500034': 'hyderabad', '500072': 'hyderabad',
  '500017': 'hyderabad', '500081': 'hyderabad',
};
