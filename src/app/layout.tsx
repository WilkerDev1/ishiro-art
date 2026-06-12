import type { Metadata, Viewport } from 'next';
import { Archivo_Black, Space_Grotesk, Inter } from 'next/font/google';
import Sidebar from '@/components/Sidebar';
import MobileNav from '@/components/MobileNav';
import Script from 'next/script';
import './globals.css';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

const archivoBlack = Archivo_Black({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'ISHIRO_Art | Portfolio',
  description:
    'ISHIRO_Art — Cute & Funny Artist. Explore original illustrations, character designs, and digital art. Commissions open.',
  openGraph: {
    title: 'ISHIRO_Art | Portfolio',
    description:
      'Cute & Funny Artist — Original illustrations, character designs, and digital art.',
    siteName: 'ISHIRO_Art',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ISHIRO_Art | Portfolio',
    description:
      'Cute & Funny Artist — Original illustrations, character designs, and digital art.',
  },
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  ),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${archivoBlack.variable} ${spaceGrotesk.variable} ${inter.variable}`}
      suppressHydrationWarning
    >
      <body className="noise-overlay">
        <Script
          id="theme-initializer"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var savedColor = localStorage.getItem('theme-primary-color');
                if (savedColor) {
                  document.documentElement.style.setProperty('--primary', savedColor);
                }
              } catch (e) {}
            `,
          }}
        />
        <Sidebar />
        <MobileNav />
        <main className="page-wrapper">{children}</main>
      </body>
    </html>
  );
}
