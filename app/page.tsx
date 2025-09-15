"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { AlertCircle, Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import Dashboard from "./components/Dashboard";
import { atlassianOAuth } from "./lib/atlassian-oauth";

interface AuthData {
  siteUrl: string;
  email: string;
  apiToken: string;
}

interface AtlassianAuthData {
  user: {
    account_id: string;
    name: string;
    email: string;
    picture: string;
  };
  sites: Array<{
    id: string;
    name: string;
    url: string;
    scopes: string[];
    avatarUrl: string;
  }>;
  tokens: {
    access_token: string;
    expires_in: number;
    refresh_token?: string;
  };
  timestamp: number;
}

const ATLASSIAN_AUTH_KEY = "atlassian_auth_data";

export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [authData, setAuthData] = useState<AuthData | null>(null);
  const [atlassianAuthData, setAtlassianAuthData] =
    useState<AtlassianAuthData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");

  // Check for existing authentication on page load
  useEffect(() => {
    checkExistingAuth();
  }, []);

  // Check for OAuth callback parameters
  useEffect(() => {
    const authSuccess = searchParams.get("auth");
    const authError = searchParams.get("error");
    const authDataParam = searchParams.get("data");

    if (authSuccess === "success") {
      if (authDataParam) {
        handleOAuthCallback(authDataParam);
      }
      // Clean up URL
      window.history.replaceState({}, "", "/");
    } else if (authError) {
      setError(`Authentication failed: ${authError}`);
      setIsLoading(false);
      // Clean up URL
      window.history.replaceState({}, "", "/");
    }
  }, [searchParams]);

  const checkExistingAuth = () => {
    try {
      console.log("Checking existing authentication...");
      const storedAuth = localStorage.getItem(ATLASSIAN_AUTH_KEY);

      if (storedAuth) {
        const authData: AtlassianAuthData = JSON.parse(storedAuth);
        console.log("Found stored auth data:", {
          hasUser: !!authData.user,
          hasSites: !!authData.sites,
        });

        // Check if token is still valid (expires_in is in seconds)
        const tokenExpiry =
          authData.timestamp + authData.tokens.expires_in * 1000;
        const isExpired = Date.now() > tokenExpiry - 60000; // 1 minute buffer

        console.log("Token expiry check:", {
          tokenExpiry: new Date(tokenExpiry).toISOString(),
          now: new Date().toISOString(),
          isExpired,
        });

        if (!isExpired && authData.user && authData.sites) {
          console.log("Token is valid, setting auth data");
          setAtlassianAuthData(authData);

          // Convert to AuthData format for Dashboard
          const primarySite = authData.sites[0];
          if (primarySite) {
            const credentials = {
              siteUrl: primarySite.url,
              email: authData.user.email,
              apiToken: "oauth_token", // Server will use stored tokens
            };
            setAuthData(credentials);
            console.log("Authentication restored from localStorage");
          }
        } else {
          console.log("Token expired or invalid, removing stored data");
          localStorage.removeItem(ATLASSIAN_AUTH_KEY);
        }
      } else {
        console.log("No stored authentication found");
      }
    } catch (error) {
      console.error("Error checking existing auth:", error);
      localStorage.removeItem(ATLASSIAN_AUTH_KEY);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthCallback = (authDataParam: string) => {
    try {
      console.log("Processing OAuth callback data...");
      const callbackData = JSON.parse(decodeURIComponent(authDataParam));

      const atlassianData: AtlassianAuthData = {
        user: callbackData.user,
        sites: callbackData.sites,
        tokens: callbackData.tokens,
        timestamp: callbackData.timestamp,
      };

      // Store in localStorage
      localStorage.setItem(ATLASSIAN_AUTH_KEY, JSON.stringify(atlassianData));
      console.log("Auth data stored in localStorage");

      setAtlassianAuthData(atlassianData);

      // Convert to AuthData format for Dashboard
      const primarySite = atlassianData.sites[0];
      if (primarySite) {
        const authCredentials = {
          siteUrl: primarySite.url,
          email: atlassianData.user.email,
          apiToken: "oauth_token",
        };
        console.log("Setting authData from callback:", authCredentials);
        setAuthData(authCredentials);
      }

      setIsLoading(false);
    } catch (error) {
      console.error("Failed to process OAuth callback:", error);
      setError("Failed to process authentication data");
      setIsLoading(false);
    }
  };

  const handleAtlassianLogin = () => {
    const authUrl = atlassianOAuth.getAuthorizationUrl();
    window.location.href = authUrl;
  };

  const handleLogout = async () => {
    console.log("Logging out...");
    setAuthData(null);
    setAtlassianAuthData(null);

    // Clear localStorage
    localStorage.removeItem(ATLASSIAN_AUTH_KEY);

    console.log("User logged out successfully");
    router.push("/");
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
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">
                Loading...
              </h2>
              <p className="text-gray-400">Checking authentication status</p>
            </div>
          </motion.div>
        ) : authData ? (
          <Dashboard authData={authData} onLogout={handleLogout} />
        ) : (
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="w-full max-w-md">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-center"
                >
                  <AlertCircle className="w-5 h-5 mx-auto mb-2" />
                  {error}
                </motion.div>
              )}

              {/* Atlassian OAuth Login */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl"
              >
                <div className="text-center mb-8">
                  <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl mx-auto mb-6 shadow-lg flex items-center justify-center">
                    <svg
                      className="w-10 h-10 text-white"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                    </svg>
                  </div>
                  <h1 className="text-3xl font-bold text-white mb-3">
                    JIRA Worklog Viewer
                  </h1>
                  <p className="text-gray-400 text-lg">
                    Connect with your Atlassian account to view and manage your
                    worklogs
                  </p>
                </div>

                <button
                  onClick={handleAtlassianLogin}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-2xl flex items-center justify-center space-x-3 group"
                >
                  {/* Atlassian Logo */}
                  <svg
                    className="w-6 h-6 group-hover:scale-110 transition-transform duration-300"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M8.5 2h11l-4 4h-4.5c-2.5 0-4.5 2-4.5 4.5v3c0 1.4.6 2.7 1.6 3.6L4 21V8.5C4 4.5 6.5 2 10 2z" />
                    <path d="M16 8h6v6h-6z" opacity="0.8" />
                  </svg>
                  <span className="text-lg">Continue with Atlassian</span>
                </button>

                <div className="mt-8 text-center">
                  <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a5 5 0 0110 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>Secure OAuth 2.0 authentication</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </div>
    </motion.main>
  );
}
