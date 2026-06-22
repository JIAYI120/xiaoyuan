import { useState, useRef } from 'react';
import styles from './InputField.module.css';

function InputField({
  type = 'text',
  name,
  value,
  onChange,
  placeholder,
  icon,
  suffix,
  required = false,
}) {
  const [focused, setFocused] = useState(false);
  const inputRef = useRef(null);
  const hasValue = value && value.length > 0;

  const handleClick = () => {
    inputRef.current?.focus();
  };

  return (
    <div
      onClick={handleClick}
      className={`${styles.container} ${focused ? styles.focused : ''}`}
    >
      <div className={`${styles.icon} ${focused ? styles.active : ''}`}>
        {icon}
      </div>

      <div className={styles.inputWrapper}>
        <label className={`${styles.label} ${(focused || hasValue) ? styles.hidden : ''}`}>
          {placeholder}
        </label>
        <input
          ref={inputRef}
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          required={required}
          className={styles.input}
        />
      </div>

      {suffix ? (
        <div className={styles.suffix}>
          {suffix}
        </div>
      ) : (
        <div className={`${styles.dot} ${focused ? styles.active : ''}`} />
      )}
    </div>
  );
}

export default InputField;
