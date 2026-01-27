import React from 'react';

const Card = ({ title, children, onClick, highlight = false }) => {
  return (
    <div
      style={{
        ...styles.card,
        border: highlight ? '1px solid #ffc500' : '1px solid #2a2a2a',
        cursor: onClick ? 'pointer' : 'default',
      }}
      onClick={onClick}
    >
      {title && <h3 style={styles.title}>{title}</h3>}
      <div style={styles.content}>{children}</div>
    </div>
  );
};

const styles = {
  card: {
    backgroundColor: '#1a1a1a',
    borderRadius: '12px',
    padding: '16px',
    transition: 'all 0.2s',
  },
  title: {
    color: '#fff',
    fontSize: '16px',
    fontWeight: '600',
    marginBottom: '12px',
    margin: '0 0 12px 0',
  },
  content: {
    color: '#ccc',
    fontSize: '14px',
  },
};

export default Card;
