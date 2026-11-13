/** Digits only. */
export const digitsOnly = (value) => String(value || '').replace(/\D/g, '');

/** CNIC: 13 digits → 35201-9565409-1 */
export const formatCnic = (value) => {
  const d = digitsOnly(value).slice(0, 13);
  if (d.length <= 5) return d;
  if (d.length <= 12) return `${d.slice(0, 5)}-${d.slice(5)}`;
  return `${d.slice(0, 5)}-${d.slice(5, 12)}-${d.slice(12)}`;
};

export const isValidCnic = (value) => {
  if (!value) return true; // optional unless caller requires
  return digitsOnly(value).length === 13;
};

export const cnicError = (value) => {
  if (!value) return '';
  return isValidCnic(value) ? '' : 'CNIC must be 13 digits (35201-9565409-1)';
};

/** Semester: positive integer */
export const formatSemester = (value) => digitsOnly(value).slice(0, 2);

export const isValidSemester = (value) => {
  if (!value && value !== 0) return true;
  const n = Number(digitsOnly(value));
  return Number.isInteger(n) && n >= 1 && n <= 16;
};

export const semesterError = (value) => {
  if (!value && value !== 0) return '';
  return isValidSemester(value) ? '' : 'Semester must be a number from 1 to 16';
};

export const COUNTRY_DIALS = [
  { code: 'PK', name: 'Pakistan', dial: '92', flag: '🇵🇰', localLen: 10 },
  { code: 'AE', name: 'UAE', dial: '971', flag: '🇦🇪', localLen: 9 },
  { code: 'SA', name: 'Saudi Arabia', dial: '966', flag: '🇸🇦', localLen: 9 },
  { code: 'GB', name: 'United Kingdom', dial: '44', flag: '🇬🇧', localLen: 10 },
  { code: 'US', name: 'United States', dial: '1', flag: '🇺🇸', localLen: 10 },
  { code: 'IN', name: 'India', dial: '91', flag: '🇮🇳', localLen: 10 },
  { code: 'CN', name: 'China', dial: '86', flag: '🇨🇳', localLen: 11 },
  { code: 'TR', name: 'Turkey', dial: '90', flag: '🇹🇷', localLen: 10 },
];

export const DEFAULT_COUNTRY = COUNTRY_DIALS[0]; // Pakistan

/** Split stored phone into { country, local }. */
export const parsePhone = (value) => {
  const raw = String(value || '').trim();
  const d = digitsOnly(raw);
  if (!d) return { country: DEFAULT_COUNTRY, local: '' };

  // Prefer longest matching dial code
  const sorted = [...COUNTRY_DIALS].sort((a, b) => b.dial.length - a.dial.length);
  for (const c of sorted) {
    if (d.startsWith(c.dial) && d.length > c.dial.length) {
      return { country: c, local: d.slice(c.dial.length).slice(0, c.localLen) };
    }
  }
  // Local PK numbers often start with 03…
  if (d.startsWith('0') && d.length <= 11) {
    return {
      country: DEFAULT_COUNTRY,
      local: d.replace(/^0/, '').slice(0, DEFAULT_COUNTRY.localLen),
    };
  }
  return { country: DEFAULT_COUNTRY, local: d.slice(0, DEFAULT_COUNTRY.localLen) };
};

export const composePhone = (country, local) => {
  const loc = digitsOnly(local)
    .replace(/^0+/, '')
    .slice(0, country?.localLen || 10);
  if (!loc) return '';
  return `+${country.dial}${loc}`;
};

export const isValidPhone = (value) => {
  if (!value) return true;
  const { country, local } = parsePhone(value);
  const loc = digitsOnly(local);
  return loc.length >= Math.min(7, country.localLen) && loc.length <= country.localLen;
};

export const phoneError = (value) => {
  if (!value) return '';
  return isValidPhone(value) ? '' : 'Enter a valid phone number';
};
