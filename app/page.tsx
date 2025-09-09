"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Activity } from "lucide-react";
import LoginForm from "./components/LoginForm";
import Dashboard from "./components/Dashboard";

interface AuthData {
  siteUrl: string;
  email: string;
  apiToken: string;
  isOAuth?: boolean;
}

const STORAGE_KEY = "jira-worklog-credentials";

export default function Home() {
  const [authData, setAuthData] = useState<AuthData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load saved credentials on component mount
  useEffect(() => {
    const loadSavedCredentials = async () => {
      try {
        const savedData = localStorage.getItem(STORAGE_KEY);
        if (savedData) {
          const credentials: AuthData = JSON.parse(savedData);

          // Validate saved credentials by testing them
          const response = await fetch("/api/auth", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(credentials),
          });

          if (response.ok) {
            setAuthData(credentials);
          } else {
            // Clear invalid credentials
            localStorage.removeItem(STORAGE_KEY);
          }
        }
      } catch (error) {
        console.error("Failed to load saved credentials:", error);
        localStorage.removeItem(STORAGE_KEY);
      } finally {
        setIsLoading(false);
      }
    };

    loadSavedCredentials();
  }, []);

  const handleLogin = (credentials: AuthData) => {
    setAuthData(credentials);
    // Save credentials to localStorage for persistence (only for API token method)
    if (!credentials.isOAuth) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(credentials));
    }
  };
  const handleLogout = () => {
    // Clear credentials from localStorage
    localStorage.removeItem(STORAGE_KEY);
    setAuthData(null);
  };

  const pageVariants = {
    initial: { opacity: 0 },
    animate: {
      opacity: 1,
      transition: { duration: 0.8 },
    },
    exit: {
      opacity: 0,
      transition: { duration: 0.5 },
    },
  };

  return (
    <motion.main
      className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900"
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
    >
      {/* Background patterns */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10">
        {isLoading ? (
          <motion.div
            className="flex items-center justify-center min-h-screen p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl mx-auto mb-4 shadow-lg flex items-center justify-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Activity className="w-8 h-8 text-white" />
                </motion.div>
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">
                Loading...
              </h2>
              <p className="text-gray-400">Checking saved credentials</p>
            </div>
          </motion.div>
        ) : !authData ? (
          <motion.div
            className="flex items-center justify-center min-h-screen p-4"
            key="login"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.6 }}
          >
            <div className="w-full max-w-md">
              <LoginForm onLogin={handleLogin} />
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.6 }}
          >
            <Dashboard authData={authData} onLogout={handleLogout} />
          </motion.div>
        )}
      </div>
    </motion.main>
  );
}
