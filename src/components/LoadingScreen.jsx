import React from 'react';

// Beautiful full-screen loading component
const LoadingScreen = ({ message = 'Loading...', minimal = false }) => {
  if (minimal) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-10 h-10 border-4 border-gray-200 rounded-full"></div>
            <div className="absolute top-0 left-0 w-10 h-10 border-4 border-[#c9a227] border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-gray-600 text-sm">{message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center z-50">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }} />
      
      <div className="flex flex-col items-center gap-6 animate-fadeIn">
        {/* Logo */}
        <div className="relative">
          <img 
            src="/Rime_logo.jpeg" 
            alt="Rime" 
            className="w-20 h-20 rounded-2xl shadow-lg"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        </div>
        
        {/* Spinner */}
        <div className="relative">
          <div className="w-12 h-12 border-4 border-gray-200 rounded-full"></div>
          <div className="absolute top-0 left-0 w-12 h-12 border-4 border-[#c9a227] border-t-transparent rounded-full animate-spin"></div>
        </div>
        
        {/* Message */}
        <div className="text-center">
          <p className="text-gray-700 font-medium">{message}</p>
          <p className="text-gray-400 text-sm mt-1">Please wait...</p>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default LoadingScreen;
