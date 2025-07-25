import React, { useRef, useEffect } from 'react';
import { protect } from 'cloakscreen';

function ProtectedContent() {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initializeCloakscreen = async () => {
      if (!contentRef.current) return;

      try {
        await protect(contentRef.current, {
          provider: {
            name: import.meta.env.VITE_DRM_PROVIDER,
            siteId: import.meta.env.VITE_DRM_SITE_ID,
            tokenEndpoint: import.meta.env.VITE_DRM_TOKEN_ENDPOINT,
          },
        });
      } catch (error) {
        console.error('Failed to protect content:', error);
      }
    };

    initializeCloakscreen();
  }, []);

  return (
    <div style={{ background: 'white', color: 'black', fontFamily: 'Arial, sans-serif', padding: '20px' }}>
      <div ref={contentRef}>
        <h2>Protected Sensitive Information</h2>
        <p>
          This is highly sensitive content that should be protected from AI vision models and
          screenshots.
        </p>
        <p>API Key: sk-1234567890abcdef</p>
        <p>Database Password: MySecretPassword123!</p>
        <p>JWT Secret: jwt_secret_token_here</p>
        <p>Credit Card: 4532-1234-5678-9012</p>
        <p>SSN: 123-45-6789</p>
        <p>Account Number: ACC-789456123</p>
        <p>Full Name: John Doe</p>
        <p>Email: john.doe@company.com</p>
        <p>Phone: +1-555-123-4567</p>
        <p>
          <span style={{ color: 'red' }}>This</span>{' '}
          <span style={{ color: 'blue' }}>colorful</span>{' '}
          <span style={{ color: 'green' }}>text</span>{' '}
          <span style={{ color: 'orange' }}>demonstrates</span>{' '}
          <span style={{ color: 'purple' }}>how</span>{' '}
          <span style={{ color: 'brown' }}>protection</span>{' '}
          <span style={{ color: 'pink' }}>works</span>{' '}
          <span style={{ color: 'gray' }}>with</span>{' '}
          <span style={{ color: 'navy' }}>multiple</span>{' '}
          <span style={{ color: 'teal' }}>colors</span>{' '}
          <span style={{ color: 'maroon' }}>per</span>{' '}
          <span style={{ color: 'olive' }}>character.</span>
        </p>
      </div>
    </div>
  );
}

export default ProtectedContent;
