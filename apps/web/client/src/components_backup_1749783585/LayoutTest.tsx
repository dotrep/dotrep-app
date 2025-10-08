import React from 'react';

const LayoutTest: React.FC = () => {
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#000',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        display: 'flex',
        width: '100%',
        maxWidth: '1200px',
        gap: '40px',
        border: '2px solid yellow'
      }}>
        
        {/* Left Side Test */}
        <div style={{
          flex: 1,
          backgroundColor: 'red',
          minHeight: '400px',
          border: '3px solid white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '24px',
          fontWeight: 'bold'
        }}>
          LEFT SIDE TEST
          <div style={{
            position: 'absolute',
            width: '200px',
            height: '200px',
            backgroundColor: 'blue',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            .fsn
          </div>
        </div>

        {/* Right Side Test */}
        <div style={{
          flex: 1,
          backgroundColor: 'green',
          minHeight: '400px',
          border: '3px solid white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '24px',
          fontWeight: 'bold'
        }}>
          RIGHT SIDE TEST
        </div>
      </div>
    </div>
  );
};

export default LayoutTest;