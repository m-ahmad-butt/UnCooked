import { formatSemester } from '../utils/validators';

const SemesterInput = ({ value, onChange, className = 'n-input', placeholder = '1–16', disabled = false, id, name }) => (
  <input
    id={id}
    name={name}
    type="text"
    inputMode="numeric"
    pattern="[0-9]*"
    autoComplete="off"
    disabled={disabled}
    value={formatSemester(value)}
    placeholder={placeholder}
    className={className}
    onChange={(e) => onChange(formatSemester(e.target.value))}
  />
);

export default SemesterInput;
