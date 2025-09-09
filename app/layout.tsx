import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import Providers from "./components/Providers";

export const metadata: Metadata = {
  title: "JIRA Worklog Viewer",
  description: "View and manage your JIRA worklogs with ease",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#333",
              color: "#fff",
              border: "1px solid #444",
            },
            success: {
              iconTheme: {
                primary: "#4CAF50",
                secondary: "#fff",
              },
            },
            error: {
              iconTheme: {
                primary: "#E53E3E",
                secondary: "#fff",
              },
            },
          }}
        />
      </body>
    </html>
  );
}
