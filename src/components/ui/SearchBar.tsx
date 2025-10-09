"use client";

import { useState } from "react";

interface SearchBarProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  loading?: boolean;
  className?: string;
}

export default function SearchBar({ 
  placeholder = "Enter postcode", 
  onSearch, 
  loading = false,
  className = ""
}: SearchBarProps) {
  const [query, setQuery] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
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
          onChange={(e) => setQuery(e.target.value)}
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
