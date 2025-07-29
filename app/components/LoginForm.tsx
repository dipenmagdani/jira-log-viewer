"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye,
  EyeOff,
  Globe,
  Mail,
  Key,
  Loader2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

interface LoginFormProps {
  onLogin: (credentials: {
    siteUrl: string;
    email: string;
    apiToken: string;
  }) => void;
}

export default function LoginForm({ onLogin }: LoginFormProps) {
  const [siteUrl, setSiteUrl] = useState(
    process.env.NEXT_PUBLIC_JIRA_SITE_URL || ""
  );
  const [email, setEmail] = useState("");
  const [apiToken, setApiToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    setSuccess(false);

    try {
      // Authenticate with JIRA using the new auth API
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ siteUrl, email, apiToken }),
      });

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          onLogin({ siteUrl, email, apiToken });
        }, 1000);
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Authentication failed");
      }
    } catch (err) {
      setError(
        "Failed to authenticate with JIRA. Please check your credentials and connection."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const formVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
  };

  const buttonVariants = {
    idle: { scale: 1 },
    hover: { scale: 1.02 },
    tap: { scale: 0.98 },
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={formVariants}
      className="w-full max-w-md mx-auto"
    >
      <motion.div variants={itemVariants} className="text-center mb-8">
        <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl mx-auto mb-4 shadow-lg">
          <Globe className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">
          JIRA Worklog Viewer
        </h1>
        <p className="text-gray-400">
          Connect to your JIRA instance to view worklogs
        </p>
      </motion.div>

      <motion.form
        onSubmit={handleSubmit}
        className="space-y-6"
        variants={itemVariants}
      >
        <motion.div variants={itemVariants}>
          <label
            htmlFor="siteUrl"
            className="block text-sm font-medium text-gray-300 mb-2"
          >
            Site URL
          </label>
          <div className="relative">
            <Globe className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="url"
              id="siteUrl"
              value={siteUrl}
              onChange={(e) => setSiteUrl(e.target.value)}
              className="input-field pl-12"
              placeholder="https://your-domain.atlassian.net/"
              required
            />
          </div>
        </motion.div>

        <motion.div variants={itemVariants}>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-300 mb-2"
          >
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field pl-12"
              placeholder="your-email@example.com"
              required
            />
          </div>
        </motion.div>

        <motion.div variants={itemVariants}>
          <label
            htmlFor="apiToken"
            className="block text-sm font-medium text-gray-300 mb-2"
          >
            API Token
          </label>
          <div className="relative">
            <Key className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type={showToken ? "text" : "password"}
              id="apiToken"
              value={apiToken}
              onChange={(e) => setApiToken(e.target.value)}
              className="input-field pl-12 pr-12"
              placeholder="Your JIRA API token"
              required
            />
            <motion.button
              type="button"
              onClick={() => setShowToken(!showToken)}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              {showToken ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </motion.button>
          </div>
          <motion.p
            className="text-xs text-gray-500 mt-2"
            variants={itemVariants}
          >
            Generate an API token from your{" "}
            <a
              href="https://id.atlassian.com/manage-profile/security/api-tokens"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 hover:underline transition-colors"
            >
              Atlassian Account Settings
            </a>
          </motion.p>
        </motion.div>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm flex items-center"
            >
              <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
              {error}
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-3 rounded-lg text-sm flex items-center"
            >
              <CheckCircle className="w-4 h-4 mr-2 flex-shrink-0" />
              Connection successful! Redirecting...
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          type="submit"
          disabled={isLoading || success}
          className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          variants={buttonVariants}
          initial="idle"
          whileHover={!isLoading && !success ? "hover" : "idle"}
          whileTap={!isLoading && !success ? "tap" : "idle"}
        >
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-center"
              >
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Connecting...
              </motion.div>
            ) : success ? (
              <motion.div
                key="success"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-center"
              >
                <CheckCircle className="w-5 h-5 mr-2" />
                Connected!
              </motion.div>
            ) : (
              <motion.span
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                Connect to JIRA
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </motion.form>
    </motion.div>
  );
}
