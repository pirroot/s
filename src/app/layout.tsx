import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import { SITE } from "@/data/site";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: "Batolite — Sculpted Light for Contemporary Spaces",
    template: "%s — Batolite",
  },
  description: SITE.description,
  keywords: [
    "Batolite",
    "lighting studio",
    "lighting atelier",
    "pendant light",
    "wall light",
    "cylinder wall lamp",
    "concrete pendant",
    "black pendant lamp",
    "monochrome lighting",
    "architectural lighting",
    "interactive lighting showroom",
    "disc pendant light",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Batolite",
    title: "Batolite — Sculpted Light for Contemporary Spaces",
    description: SITE.description,
    images: [
      {
        url: "/og.jpg",
        width: 1200,
        height: 630,
        alt: "Batolite — monochrome interior lit by Batolite fixtures",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Batolite — Sculpted Light for Contemporary Spaces",
    description: SITE.description,
    images: ["/og.jpg"],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${cormorant.variable} antialiased bg-white text-neutral-900`}
      >
        {children}
      </body>
    </html>
  );
}
