import type { Metadata } from "next";
import { IBM_Plex_Sans, IBM_Plex_Serif, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const ibmSans = IBM_Plex_Sans({
  variable: "--font-ibm-sans",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

const ibmSerif = IBM_Plex_Serif({
  variable: "--font-ibm-serif",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

const ibmMono = IBM_Plex_Mono({
  variable: "--font-ibm-mono",
  weight: ["400", "500"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Land Trust Infrastructure",
  description: "A sovereign accountability system for Indian land records.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${ibmSans.variable} ${ibmSerif.variable} ${ibmMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col font-sans bg-primary-navy text-text-primary">
        {children}
      </body>
    </html>
  );
}
