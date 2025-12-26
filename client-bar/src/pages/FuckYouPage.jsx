import React from 'react';

export default function FuckYouPage() {
  return (
    <div className="fixed inset-0 bg-white flex flex-col items-center justify-center p-4 z-[9999]">
      <img 
        src="https://dcimg1.dcinside.com/viewimage.php?id=2cb9dd2ff6c131a960&no=24b0d769e1d32ca73fea85fa11d028315c2a09e47d692719f95ebfe695d2a17112e7c2c528c8ebe8ad26729d9309e79deb4284f3f6ed1e7f451e7427ae3281954a902f5ea89fd1aa909e5596407ec96221ba577da5d23d&orgExt" 
        alt="Access Denied" 
        className="max-w-full h-auto max-h-[70vh] rounded-lg shadow-xl mb-8"
      />
      <h1 className="text-5xl md:text-7xl font-extrabold text-red-600 text-center tracking-tighter">
        너관리자아니잖아.
      </h1>
    </div>
  );
}