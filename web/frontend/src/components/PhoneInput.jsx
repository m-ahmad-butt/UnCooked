import { useEffect, useState } from 'react';
import {
  COUNTRY_DIALS,
  DEFAULT_COUNTRY,
  composePhone,
  digitsOnly,
  parsePhone,
} from '../utils/validators';

const PhoneInput = ({ value, onChange, className = 'n-input', disabled = false, id, name }) => {
  const parsed = parsePhone(value);
  const [country, setCountry] = useState(parsed.country || DEFAULT_COUNTRY);
  const [local, setLocal] = useState(parsed.local || '');

  useEffect(() => {
    const next = parsePhone(value);
    setCountry(next.country || DEFAULT_COUNTRY);
    setLocal(next.local || '');
  }, [value]);

  const emit = (nextCountry, nextLocal) => {
    onChange(composePhone(nextCountry, nextLocal));
  };

  return (
    <div className="flex gap-2">
      <select
        disabled={disabled}
        value={country.code}
        className={`${className} w-[7.5rem] shrink-0`}
        aria-label="Country code"
        onChange={(e) => {
          const next = COUNTRY_DIALS.find((c) => c.code === e.target.value) || DEFAULT_COUNTRY;
          setCountry(next);
          emit(next, local);
        }}
      >
        {COUNTRY_DIALS.map((c) => (
          <option key={c.code} value={c.code}>
            {c.flag} +{c.dial}
          </option>
        ))}
      </select>
      <input
        id={id}
        name={name}
        type="tel"
        inputMode="numeric"
        pattern="[0-9]*"
        autoComplete="tel-national"
        disabled={disabled}
        value={local}
        placeholder="3001234567"
        className={`${className} min-w-0 flex-1`}
        onChange={(e) => {
          const next = digitsOnly(e.target.value).replace(/^0+/, '').slice(0, country.localLen);
          setLocal(next);
          emit(country, next);
        }}
      />
    </div>
  );
};

export default PhoneInput;
