import countryList from 'country-list';

export interface CountryItem {
  code: string;
  name: string;
  flag: string;
}

// Converts standard ISO 3166-1 alpha-2 codes into Unicode flag emojis without external assets.
export function getCountryFlag(code: string): string {
  if (!code || code.length !== 2) return '🌐';
  const codePoints = code
    .toUpperCase()
    .split('')
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

const ALL_COUNTRIES: CountryItem[] = countryList.getData().map(({ code, name }) => ({
  code: code.toUpperCase(),
  name,
  flag: getCountryFlag(code),
}));

export function getAllCountries(): CountryItem[] {
  return ALL_COUNTRIES;
}

export function getCountryByCode(code: string): CountryItem | undefined {
  if (!code) return undefined;
  const upper = code.trim().toUpperCase();
  const found = ALL_COUNTRIES.find((c) => c.code === upper);
  return found ?? { code: upper, name: upper, flag: getCountryFlag(upper) };
}

export function searchCountries(query: string, limit = 8): CountryItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return ALL_COUNTRIES.filter(
    (c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().startsWith(q),
  ).slice(0, limit);
}
