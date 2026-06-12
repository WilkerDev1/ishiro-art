'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  XTwitterIcon,
  PixivIcon,
  InstagramIcon,
} from '@/components/icons/SocialIcons';

const NAV_ITEMS = [
  { label: 'HOME', href: '/', hash: 'hero' },
  { label: 'GALLERY', href: '/gallery', hash: '' },
  { label: 'ABOUT', href: '/#about', hash: 'about' },
  { label: 'CONTACT', href: '/#contact', hash: 'contact' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [activeSection, setActiveSection] = useState('hero');

  useEffect(() => {
    if (pathname !== '/') {
      if (pathname.startsWith('/gallery')) {
        setActiveSection('gallery');
      } else {
        setActiveSection('');
      }
      return;
    }

    // IntersectionObserver only on homepage
    const sections = NAV_ITEMS.map((item) =>
      item.hash ? document.getElementById(item.hash) : null
    ).filter(Boolean) as HTMLElement[];

    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: '-40% 0px -60% 0px', threshold: 0 }
    );

    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, [pathname]);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, item: typeof NAV_ITEMS[0]) => {
    if (pathname === '/' && item.hash) {
      e.preventDefault();
      const el = document.getElementById(item.hash);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <aside className="sidebar" aria-label="Main navigation">
      {/* Logo */}
      <Link href="/" className="sidebar__logo" aria-label="ISHIRO logo" style={{ textDecoration: 'none' }}>
        I
      </Link>

      {/* Navigation */}
      <nav className="sidebar__nav">
        {NAV_ITEMS.map((item) => {
          const isActive =
            (item.label === 'GALLERY' && pathname.startsWith('/gallery')) ||
            (pathname === '/' && activeSection === item.hash);

          return (
            <Link
              key={item.label}
              href={item.href}
              className={`sidebar__nav-item ${isActive ? 'active' : ''}`}
              onClick={(e) => handleNavClick(e, item)}
              aria-current={isActive ? 'true' : undefined}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Social Links */}
      <div className="sidebar__social">
        <span className="sidebar__share-label">FOLLOW</span>
        <a
          href="https://x.com/ISHIRO_Art"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="X (Twitter)"
        >
          <XTwitterIcon size={18} />
        </a>
        <a
          href="https://pixiv.net/en/users/61774"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Pixiv"
        >
          <PixivIcon size={18} />
        </a>
        <a
          href="https://instagram.com/ishiro_art"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Instagram"
        >
          <InstagramIcon size={18} />
        </a>
        <div style={{ marginTop: 'var(--space-xl)' }} />
        <Link
          href="/admin"
          aria-label="Admin"
          title="Admin Login"
          style={{ color: 'var(--text-muted)' }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
        </Link>
      </div>
    </aside>
  );
}
