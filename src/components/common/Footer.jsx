// src/components/common/Footer.jsx
import React from 'react';

export default function Footer() {
  return (
    <footer className="bg-[#0f172a] text-white py-6 px-4 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center">
        {/* Left Section */}
        <p className="text-sm">&copy; {new Date().getFullYear()} Cravzo. All rights reserved.</p>

        {/* Right Section */}
        <div className="flex gap-4 mt-2 md:mt-0">
          <a href="/about" className="hover:text-coral transition-colors">About</a>
          <a href="/contact" className="hover:text-coral transition-colors">Contact</a>
          <a href="/privacy" className="hover:text-coral transition-colors">Privacy</a>
        </div>
      </div>
    </footer>
  );
}
