import { formatCnic } from '../utils/validators';

const CnicInput = ({
  value,
  onChange,
  className = 'n-input',
  placeholder = '35201-9565409-1',
  disabled = false,
  id,
  name,
}) => (
  <input
    id={id}
    name={name}
    inputMode="numeric"
    autoComplete="off"
    disabled={disabled}
    value={formatCnic(value)}
    placeholder={placeholder}
    className={className}
    onChange={(e) => onChange(formatCnic(e.target.value))}
  />
);

export default CnicInput;
