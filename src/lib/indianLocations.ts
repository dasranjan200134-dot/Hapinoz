export interface PincodeInfo {
  city: string;
  state: string;
  estimatedDays: string;
  isServiceable: boolean;
  courierPartner: string;
}

// Common Indian Pincode prefixes and key regions
const PINCODE_MAP: Record<string, { city: string; state: string; days: string; courier: string }> = {
  // Karnataka (56-59)
  '560': { city: 'Bengaluru', state: 'Karnataka', days: '1-2 Days', courier: 'Delhivery Express' },
  '570': { city: 'Mysuru', state: 'Karnataka', days: '2-3 Days', courier: 'Delhivery Express' },
  '575': { city: 'Mangaluru', state: 'Karnataka', days: '2-3 Days', courier: 'BlueDart' },
  '580': { city: 'Hubballi', state: 'Karnataka', days: '2-3 Days', courier: 'Delhivery Express' },

  // Maharashtra (40-44)
  '400': { city: 'Mumbai', state: 'Maharashtra', days: '1-2 Days', courier: 'BlueDart Express' },
  '411': { city: 'Pune', state: 'Maharashtra', days: '1-2 Days', courier: 'Delhivery Express' },
  '440': { city: 'Nagpur', state: 'Maharashtra', days: '2-3 Days', courier: 'BlueDart' },
  '422': { city: 'Nashik', state: 'Maharashtra', days: '2-3 Days', courier: 'Delhivery Express' },
  '431': { city: 'Aurangabad', state: 'Maharashtra', days: '2-3 Days', courier: 'Delhivery Express' },

  // Delhi NCR & Haryana (11, 12)
  '110': { city: 'New Delhi', state: 'Delhi NCR', days: '1-2 Days', courier: 'BlueDart Express' },
  '122': { city: 'Gurugram', state: 'Haryana (NCR)', days: '1-2 Days', courier: 'Delhivery Express' },
  '201': { city: 'Noida / Ghaziabad', state: 'Uttar Pradesh (NCR)', days: '1-2 Days', courier: 'Delhivery Express' },
  '121': { city: 'Faridabad', state: 'Haryana (NCR)', days: '1-2 Days', courier: 'Delhivery Express' },

  // Tamil Nadu (60-64)
  '600': { city: 'Chennai', state: 'Tamil Nadu', days: '2-3 Days', courier: 'BlueDart' },
  '641': { city: 'Coimbatore', state: 'Tamil Nadu', days: '2-3 Days', courier: 'Delhivery Express' },
  '625': { city: 'Madurai', state: 'Tamil Nadu', days: '2-3 Days', courier: 'Delhivery Express' },

  // Telangana & Andhra Pradesh (50-53)
  '500': { city: 'Hyderabad', state: 'Telangana', days: '1-2 Days', courier: 'BlueDart Express' },
  '530': { city: 'Visakhapatnam', state: 'Andhra Pradesh', days: '2-3 Days', courier: 'Delhivery Express' },
  '520': { city: 'Vijayawada', state: 'Andhra Pradesh', days: '2-3 Days', courier: 'Delhivery Express' },
  '522': { city: 'Guntur', state: 'Andhra Pradesh', days: '2-3 Days', courier: 'Delhivery Express' },

  // West Bengal & North East (70-79)
  '700': { city: 'Kolkata', state: 'West Bengal', days: '2-3 Days', courier: 'BlueDart' },
  '734': { city: 'Siliguri', state: 'West Bengal', days: '3-4 Days', courier: 'India Post Speed' },
  '781': { city: 'Guwahati', state: 'Assam', days: '3-4 Days', courier: 'BlueDart Air' },
  '793': { city: 'Shillong', state: 'Meghalaya', days: '3-4 Days', courier: 'India Post Speed' },

  // Gujarat (38, 39)
  '380': { city: 'Ahmedabad', state: 'Gujarat', days: '2-3 Days', courier: 'Delhivery Express' },
  '390': { city: 'Vadodara', state: 'Gujarat', days: '2-3 Days', courier: 'BlueDart' },
  '395': { city: 'Surat', state: 'Gujarat', days: '2-3 Days', courier: 'Delhivery Express' },

  // Rajasthan (30-34)
  '302': { city: 'Jaipur', state: 'Rajasthan', days: '2-3 Days', courier: 'Delhivery Express' },
  '342': { city: 'Jodhpur', state: 'Rajasthan', days: '2-3 Days', courier: 'Delhivery Express' },
  '313': { city: 'Udaipur', state: 'Rajasthan', days: '2-3 Days', courier: 'Delhivery Express' },

  // Uttar Pradesh & Bihar (20-28, 80-85)
  '226': { city: 'Lucknow', state: 'Uttar Pradesh', days: '2-3 Days', courier: 'Delhivery Express' },
  '208': { city: 'Kanpur', state: 'Uttar Pradesh', days: '2-3 Days', courier: 'Delhivery Express' },
  '221': { city: 'Varanasi', state: 'Uttar Pradesh', days: '2-3 Days', courier: 'Delhivery Express' },
  '800': { city: 'Patna', state: 'Bihar', days: '3-4 Days', courier: 'Delhivery Express' },

  // Kerala (67-69)
  '682': { city: 'Kochi', state: 'Kerala', days: '2-3 Days', courier: 'BlueDart' },
  '695': { city: 'Thiruvananthapuram', state: 'Kerala', days: '2-3 Days', courier: 'Delhivery Express' },
  '673': { city: 'Kozhikode', state: 'Kerala', days: '2-3 Days', courier: 'Delhivery Express' },

  // Punjab, Chandigarh, MP (14-16, 45-48)
  '160': { city: 'Chandigarh', state: 'Punjab / Haryana', days: '2-3 Days', courier: 'BlueDart' },
  '141': { city: 'Ludhiana', state: 'Punjab', days: '2-3 Days', courier: 'Delhivery Express' },
  '452': { city: 'Indore', state: 'Madhya Pradesh', days: '2-3 Days', courier: 'Delhivery Express' },
  '462': { city: 'Bhopal', state: 'Madhya Pradesh', days: '2-3 Days', courier: 'Delhivery Express' },

  // Odisha & Jharkhand (75-77, 83)
  '751': { city: 'Bhubaneswar', state: 'Odisha', days: '2-3 Days', courier: 'BlueDart' },
  '834': { city: 'Ranchi', state: 'Jharkhand', days: '3-4 Days', courier: 'Delhivery Express' },
};

export const lookupIndianPincode = (pincode: string): PincodeInfo => {
  const cleanPin = pincode.trim().replace(/\D/g, '');
  if (cleanPin.length < 3) {
    return {
      city: '',
      state: '',
      estimatedDays: '2-4 Days',
      isServiceable: true,
      courierPartner: 'Delhivery / BlueDart',
    };
  }

  const prefix3 = cleanPin.substring(0, 3);
  if (PINCODE_MAP[prefix3]) {
    const match = PINCODE_MAP[prefix3];
    return {
      city: match.city,
      state: match.state,
      estimatedDays: match.days,
      isServiceable: true,
      courierPartner: match.courier,
    };
  }

  // Fallback for valid 6-digit Indian PIN codes
  if (cleanPin.length === 6) {
    const firstDigit = cleanPin.charAt(0);
    let estimatedState = 'India';
    if (firstDigit === '1' || firstDigit === '2') estimatedState = 'Northern Region';
    else if (firstDigit === '3' || firstDigit === '4') estimatedState = 'Western Region';
    else if (firstDigit === '5' || firstDigit === '6') estimatedState = 'Southern Region';
    else if (firstDigit === '7' || firstDigit === '8') estimatedState = 'Eastern Region';

    return {
      city: 'Local Delivery Hub',
      state: estimatedState,
      estimatedDays: '3-4 Days',
      isServiceable: true,
      courierPartner: 'Delhivery / India Post',
    };
  }

  return {
    city: '',
    state: '',
    estimatedDays: '2-4 Days',
    isServiceable: true,
    courierPartner: 'Express Couriers',
  };
};

export const INDIAN_STATES = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chandigarh (UT)',
  'Chhattisgarh',
  'Delhi NCR',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jammu & Kashmir',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Ladakh (UT)',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Puducherry (UT)',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
];
