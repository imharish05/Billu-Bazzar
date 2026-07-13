import React from 'react';
import Loader from '../components/Loader';

const LoaderPreviewPage = () => {
  return (
    <main id="main-content" className="min-h-[80vh] flex flex-col items-center justify-center bg-[#FDFDFB] gap-6 py-24">
      <h1 className="font-playfair text-3xl font-bold text-neutral-900">Universal Loader Preview</h1>
      <div className="bg-white p-12 shadow-sm border border-neutral-100 flex items-center justify-center">
        <Loader color="#C9A24B" />
      </div>
      <p className="text-neutral-500 text-sm font-mono">Component: Client/src/components/Loader.jsx</p>
    </main>
  );
};

export default LoaderPreviewPage;
