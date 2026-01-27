import React from 'react';

const Loading = ({ size = 40, fullScreen = false }) => {
  const spinnerStyle = {
    width: size,
    height: size,
    border: `3px solid #2a2a2a`,
    borderTop: `3px solid #ffc500`,
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  };

  const content = (
    <>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
      <div style={spinnerStyle}></div>
    </>
  );

  if (fullScreen) {
    return (
      <div style={styles.fullScreen}>
        {content}
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {content}
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '20px',
  },
  fullScreen: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
};

export default Loading;
