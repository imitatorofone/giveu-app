// app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";
import { Quicksand, Merriweather } from "next/font/google";

const bodySans = Quicksand({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-sans",
});

const heading = Merriweather({
  subsets: ["latin"],
  weight: ["700"],
  style: ["normal"],
  variable: "--font-heading",
});

export const metadata: Metadata = {
  title: "ENGAGE",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${bodySans.variable} ${heading.variable}`}>
      <body className="min-h-screen bg-gray-50 font-sans antialiased">
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            success: { 
              style: { background: "#20c997", color: "#fff" },
              iconTheme: { primary: "#fff", secondary: "#20c997" }
            },
            error: { 
              style: { background: "#ef4444", color: "#fff" },
              iconTheme: { primary: "#fff", secondary: "#ef4444" }
            },
          }}
        />
      </body>
    </html>
  );
}
