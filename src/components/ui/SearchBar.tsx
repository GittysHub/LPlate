"use client";

import { useState, useEffect } from "react";

interface SearchBarProps {
  placeholder: string;
  onSearch: (query: string) => void;
  loading?: boolean;
  className?: string;
  value?: string;
}

export default function SearchBar({ 
  placeholder, 
  onSearch, 
  loading = false,
  className = "",
  value = ""
}: SearchBarProps) {
  const [query, setQuery] = useState(value);

  // Update internal state when value prop changes
  useEffect(() => {
    setQuery(value);
  }, [value]);

  // Format postcode as user types
  const formatPostcode = (input: string) => {
    // Remove all spaces and convert to uppercase
    let formatted = input.trim().toUpperCase().replace(/\s+/g, "");
    
    // Add space in appropriate position for UK postcodes
    if (formatted.length >= 5) {
      if (formatted.length === 6) {
        // Format: ABC123 -> ABC 123
        formatted = formatted.slice(0, 3) + " " + formatted.slice(3);
      } else if (formatted.length === 7) {
        // Format: ABCD123 -> ABCD 123  
        formatted = formatted.slice(0, 4) + " " + formatted.slice(4);
      } else if (formatted.length === 5) {
        // Format: AB123 -> AB 123
        formatted = formatted.slice(0, 2) + " " + formatted.slice(2);
      } else if (formatted.length === 8) {
        // Format: ABCD1234 -> ABCD 1234
        formatted = formatted.slice(0, 4) + " " + formatted.slice(4);
      }
    }
    
    return formatted;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const formatted = formatPostcode(value);
    setQuery(formatted);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (query.trim() && !loading) {
        onSearch(query.trim());
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && !loading) {
      onSearch(query.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`relative ${className}`}>
      <div className="relative flex shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105 border-2 border-black rounded-xl focus-within:border-gray-800">
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 z-10 text-lg">
          📍
        </div>
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full border-0 rounded-xl pl-12 pr-24 py-4 text-base md:text-lg text-gray-900 placeholder-gray-500 focus:ring-4 focus:ring-green-700 transition-all duration-300 bg-white rounded-l-xl outline-none"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className={`absolute right-0 top-0 bottom-0 px-6 md:px-8 py-0 rounded-r-xl font-bold text-sm md:text-lg transition-all duration-300 ${
            loading || !query.trim()
              ? "bg-green-800 text-white cursor-not-allowed opacity-70"
              : "bg-green-600 hover:bg-green-700 text-white hover:scale-110 hover:shadow-xl hover:shadow-green-200"
          }`}
          style={{ right: '-2px', top: '-2px', bottom: '-2px' }}
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </div>
    </form>
  );
}
