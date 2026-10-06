import { useState, useRef, useEffect } from 'react';
import { getCountryByCode, searchCountries } from '../lib/countries.ts';

const PRESET_SHORT_NAMES: Record<string, string> = {
  DE: 'Germany',
  GB: 'UK',
  SG: 'Singapore',
  US: 'USA',
  CH: 'Switzerland',
  AE: 'UAE',
  CN: 'China',
  HK: 'Hong Kong',
  IN: 'India',
};

interface CountryTagInputProps {
  id?: string;
  label: string;
  value: string | string[];
  onChange: (value: any) => void;
  multiple?: boolean;
  placeholder?: string;
  popularPresets?: string[];
  hint?: string;
}

export function CountryTagInput({
  id,
  label,
  value,
  onChange,
  multiple = false,
  placeholder = 'Search country by name or code…',
  popularPresets = ['DE', 'GB', 'SG', 'US', 'CH', 'AE', 'CN', 'HK', 'IN'],
  hint,
}: CountryTagInputProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedCodes: string[] = multiple
    ? (Array.isArray(value) ? value : value ? [value] : [])
    : typeof value === 'string' && value
    ? [value]
    : [];

  const suggestions = searchCountries(query, 6).filter(
    (item) => !selectedCodes.includes(item.code),
  );

  // Close suggestions dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectCountry = (code: string) => {
    if (multiple) {
      if (!selectedCodes.includes(code)) {
        onChange([...selectedCodes, code]);
      }
    } else {
      onChange(code);
    }
    setQuery('');
    setOpen(false);
  };

  const handleRemoveCountry = (code: string) => {
    if (multiple) {
      onChange(selectedCodes.filter((c) => c !== code));
    } else {
      onChange('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (suggestions.length > 0) {
        handleSelectCountry(suggestions[0].code);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-xs font-medium text-subtle">
          {label}
        </label>
        {hint && <span className="text-[11px] text-subtle">{hint}</span>}
      </div>

      {/* Selected Tags Display */}
      {selectedCodes.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-1" role="group" aria-label={`Selected ${label}`}>
          {selectedCodes.map((code) => {
            const country = getCountryByCode(code);
            return (
              <span
                key={code}
                className="inline-flex items-center gap-1.5 rounded-full border border-brand-300 bg-brand-50/80 px-2.5 py-1 text-xs font-medium text-brand-950 transition-all dark:border-brand-800 dark:bg-brand-950/60 dark:text-brand-100"
              >
                <span aria-hidden>{country?.flag}</span>
                <span>{country?.name}</span>
                <span className="font-mono text-[10px] text-subtle uppercase">({code})</span>
                <button
                  type="button"
                  onClick={() => handleRemoveCountry(code)}
                  aria-label={`Remove ${country?.name ?? code}`}
                  className="ml-1 inline-flex size-4 items-center justify-center rounded-full text-subtle transition-colors hover:bg-brand-200/50 hover:text-danger dark:hover:bg-brand-800/50"
                >
                  ✕
                </button>
              </span>
            );
          })}
        </div>
      )}

      {/* Search & Autocomplete Input Container */}
      {(!multiple && selectedCodes.length > 0) ? null : (
        <div className="relative">
          <input
            id={id}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => {
              if (query.trim()) setOpen(true);
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            aria-autocomplete="list"
            className="w-full rounded-field border border-line bg-surface px-3 py-2 text-sm text-ink focus:outline-none focus:ring-1 focus:ring-brand-600 min-h-[44px]"
          />

          {/* Autocomplete Dropdown List */}
          {open && suggestions.length > 0 && (
            <ul
              role="listbox"
              className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-field border border-line bg-surface shadow-lg motion-safe:animate-fade-up"
            >
              {suggestions.map((item) => (
                <li key={item.code} role="option" aria-selected="false">
                  <button
                    type="button"
                    onClick={() => handleSelectCountry(item.code)}
                    aria-label={`Select ${item.name}`}
                    className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-ink transition-colors hover:bg-surface-subtle focus:bg-surface-subtle"
                  >
                    <span className="text-base" aria-hidden>{item.flag}</span>
                    <span className="font-medium">{item.name}</span>
                    <span className="ml-auto font-mono text-xs text-subtle uppercase">
                      {item.code}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* 1-Tap Popular Preset Chips */}
      {popularPresets.length > 0 && (
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] text-subtle mr-1">Popular:</span>
          {popularPresets.map((code) => {
            const country = getCountryByCode(code);
            const isSelected = selectedCodes.includes(code);
            const shortName = PRESET_SHORT_NAMES[code] ?? country?.name ?? code;
            return (
              <button
                key={code}
                type="button"
                onClick={() => {
                  if (isSelected) {
                    handleRemoveCountry(code);
                  } else {
                    handleSelectCountry(code);
                  }
                }}
                aria-pressed={isSelected}
                aria-label={`Preset ${shortName}`}
                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition-colors min-h-[28px] ${
                  isSelected
                    ? 'border-brand-600 bg-brand-600/10 font-semibold text-brand-900 dark:text-brand-100'
                    : 'border-line bg-surface text-ink hover:bg-surface-subtle'
                }`}
              >
                <span aria-hidden>{country?.flag}</span>
                <span>{shortName}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
