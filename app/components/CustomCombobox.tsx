"use client";

import { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Search } from "lucide-react";

const CustomCombobox = ({
  options,
  value,
  onChange,
  placeholder,
  searchPlaceholder,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const filteredOptions = options.filter(
    (option) =>
      option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      option.value.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedOption = options.find((option) => option.value === value);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        className="w-full flex items-center justify-between bg-slate-700/30 border border-slate-600/30 rounded-xl px-4 py-3 text-white hover:bg-slate-600/40 hover:border-slate-500/50 transition-all duration-200 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center min-w-0 flex-1">
          {selectedOption ? (
            <>
              <div className="flex-shrink-0 mr-3">{selectedOption.icon}</div>
              <span className="truncate text-left">{selectedOption.label}</span>
            </>
          ) : (
            <span className="text-slate-400">{placeholder}</span>
          )}
        </div>
        <ChevronDown
          className={`w-4 h-4 flex-shrink-0 ml-2 text-slate-400 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ type: "spring", duration: 0.3, bounce: 0.1 }}
            className="absolute z-20 w-full mt-2 bg-slate-800/95 backdrop-blur-md border border-slate-600/50 rounded-xl shadow-2xl overflow-hidden"
          >
            <div className="p-3 border-b border-slate-600/30">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder={searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-700/50 border border-slate-600/30 rounded-lg text-white placeholder-slate-400 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                  autoFocus
                />
              </div>
            </div>

            <ul className="max-h-64 overflow-y-auto custom-scrollbar">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option) => (
                  <li key={option.value}>
                    <button
                      type="button"
                      className="w-full px-4 py-3 text-left text-white hover:bg-slate-700/50 cursor-pointer flex items-center transition-all duration-150 hover:translate-x-1"
                      onClick={() => {
                        onChange(option.value);
                        setIsOpen(false);
                        setSearchTerm("");
                      }}
                    >
                      <div className="flex-shrink-0 mr-3">{option.icon}</div>
                      <span className="flex-1 min-w-0 truncate">
                        {option.label}
                      </span>
                    </button>
                  </li>
                ))
              ) : (
                <li className="px-4 py-6 text-center text-slate-400">
                  <div className="flex flex-col items-center space-y-2">
                    <Search className="w-8 h-8 text-slate-500" />
                    <p>No options found</p>
                    <p className="text-xs text-slate-500">
                      Try adjusting your search
                    </p>
                  </div>
                </li>
              )}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CustomCombobox;
