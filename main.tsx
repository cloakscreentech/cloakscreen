import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import ProtectedContent from './examples/basic-protection-react';

// Load Shaka Player globally
const script = document.createElement('script');
script.src = 'https://cdn.jsdelivr.net/npm/shaka-player@4.11.17/dist/shaka-player.compiled.min.js';
document.head.appendChild(script);

function App() {
  const [currentDemo, setCurrentDemo] = useState<'home' | 'react'>('home');

  if (currentDemo === 'react') {
    return <ProtectedContent />;
  }

  return (
    <div
      style={{
        fontFamily: 'Arial, sans-serif',
        padding: '40px',
        maxWidth: '800px',
        margin: '0 auto',
      }}
    >
      <h1>🚀 Cloakscreen Examples</h1>
      <p>Choose an example to see Cloakscreen in action:</p>

      <div style={{ display: 'grid', gap: '20px', marginTop: '30px' }}>
        <div
          style={{
            border: '1px solid #ddd',
            borderRadius: '8px',
            padding: '20px',
            background: '#f9f9f9',
          }}
        >
          <h3>📄 Basic HTML Protection</h3>
          <p>Simple HTML page using the UMD build via CDN</p>
          <a
            href="/examples/basic-protection.html"
            style={{
              display: 'inline-block',
              padding: '10px 20px',
              background: '#007bff',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '4px',
            }}
          >
            View HTML Example
          </a>
        </div>

        <div
          style={{
            border: '1px solid #ddd',
            borderRadius: '8px',
            padding: '20px',
            background: '#f9f9f9',
          }}
        >
          <h3>⚛️ React Component Protection</h3>
          <p>React component using ES modules with proper TypeScript</p>
          <button
            onClick={() => setCurrentDemo('react')}
            style={{
              display: 'inline-block',
              padding: '10px 20px',
              background: '#61dafb',
              color: 'black',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            View React Example
          </button>
        </div>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
