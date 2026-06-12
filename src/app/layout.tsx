import type { Metadata } from 'next';
import { Archivo_Black, Space_Grotesk, Inter } from 'next/font/google';
import Sidebar from '@/components/Sidebar';
import MobileNav from '@/components/MobileNav';
import './globals.css';

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
    >
      <body className="noise-overlay">
        <Sidebar />
        <MobileNav />
        <main className="page-wrapper">{children}</main>
      </body>
    </html>
  );
}
