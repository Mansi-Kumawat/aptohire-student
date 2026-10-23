import React from 'react';

export const SkipLink: React.FC = () => {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 z-50 px-4 py-2 bg-verdant-700 text-white rounded-control font-semibold shadow-modal"
    >
      Skip to main content
    </a>
  );
};
