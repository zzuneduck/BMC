import React from 'react';

const Button = ({
  children,
  onClick,
  variant = 'primary',
  disabled = false,
  fullWidth = false,
  type = 'button',
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: disabled ? '#666' : '#ffc500',
          color: '#000',
          border: 'none',
        };
      case 'secondary':
        return {
          backgroundColor: 'transparent',
          color: disabled ? '#666' : '#ffc500',
          border: `1px solid ${disabled ? '#666' : '#ffc500'}`,
        };
      case 'danger':
        return {
          backgroundColor: disabled ? '#666' : '#dc3545',
          color: '#fff',
          border: 'none',
        };
      default:
        return {
          backgroundColor: '#ffc500',
          color: '#000',
          border: 'none',
        };
    }
  };

  return (
    <button
      type={type}
      style={{
        ...styles.button,
        ...getVariantStyles(),
        width: fullWidth ? '100%' : 'auto',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
      }}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

const styles = {
  button: {
    padding: '12px 24px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'all 0.2s',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  },
};

export default Button;
