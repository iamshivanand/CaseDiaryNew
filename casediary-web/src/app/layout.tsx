import type { Metadata } from "next";
import { Geist, Geist_Mono, Noto_Sans_Devanagari } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/context/LanguageContext";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { AppLayoutWrapper } from "@/components/AppLayoutWrapper";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const notoDevanagari = Noto_Sans_Devanagari({
  variable: "--font-noto-devanagari",
  subsets: ["devanagari"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Advocase | Digital Court Diary, Litigation Workspace & Bare Acts Directory",
  description:
    "India's modern cloud workspace for advocates, legal chambers, and law students. Real-time eCourts cause lists, TipTap legal drafting studio, BNS/BNSS 2023 Bare Acts library, and statutory court fee & limitation calculators.",
  keywords: [
    "Bare Acts 2023",
    "Bharatiya Nyaya Sanhita",
    "BNS IPC converter",
    "BNSS CrPC converter",
    "BSA 2023",
    "Advocate diary online",
    "Court Cause List India",
    "Limitation Period Calculator",
    "Court Fee Calculator Delhi High Court",
    "Legal Drafting Studio Word",
    "eCourts sync",
  ],
  authors: [{ name: "Advocase Legal Tech" }],
  openGraph: {
    title: "Advocase | Digital Court Diary & Complete Bare Acts Directory",
    description:
      "Authoritative Indian legal portal and chamber litigation software with BNS/BNSS statutory cross-references and legal calculators.",
    url: "https://advocase.in",
    siteName: "Advocase Web",
    type: "website",
  },
  icons: {
    icon: [
      { url: "/logo.png", type: "image/png" },
    ],
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Advocase",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web, Windows, macOS, Android, iOS",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "INR",
    },
    description:
      "Digital court diary and litigation management workspace for Indian advocates with built-in Bare Acts and Court Fee Calculators.",
  };

  const themeScript = `
    (function() {
      try {
        var savedTheme = localStorage.getItem('advocase_theme');
        var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        var isDark = savedTheme === 'dark' || (!savedTheme && prefersDark) || (savedTheme === 'system' && prefersDark);
        var root = document.documentElement;
        if (isDark) {
          root.classList.add('dark');
          root.classList.remove('light');
          root.setAttribute('data-theme', 'dark');
          root.style.colorScheme = 'dark';
        } else {
          root.classList.remove('dark');
          root.classList.add('light');
          root.setAttribute('data-theme', 'light');
          root.style.colorScheme = 'light';
        }
      } catch (e) {}
    })();
  `;

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#090d16" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Advocase" />
        <link rel="icon" href="/logo.png" type="image/png" sizes="any" />
        <link rel="shortcut icon" href="/logo.png" type="image/png" />
        <link rel="apple-touch-icon" href="/logo.png" />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(
                    function(registration) {
                      console.log('[Advocase PWA] ServiceWorker registered:', registration.scope);
                    },
                    function(err) {
                      console.log('[Advocase PWA] ServiceWorker registration failed:', err);
                    }
                  );
                });
              }
            `,
          }}
        />
      </head>
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} ${notoDevanagari.variable} antialiased bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 min-h-[100dvh] transition-colors duration-200`}
      >
        <ThemeProvider>
          <AuthProvider>
            <LanguageProvider>
              <AppLayoutWrapper>{children}</AppLayoutWrapper>
            </LanguageProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
