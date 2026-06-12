'use client';

import { useState, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

const NAV_ITEMS = [
  { label: 'HOME', href: '/', hash: 'hero' },
  { label: 'GALLERY', href: '/gallery', hash: '' },
  { label: 'ABOUT', href: '/#about', hash: 'about' },
  { label: 'CONNECT', href: '/#social', hash: 'social' },
  { label: 'CONTACT', href: '/#contact', hash: 'contact' },
];

export default function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const toggleMenu = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, item: typeof NAV_ITEMS[0]) => {
    setIsOpen(false);
    
    if (pathname === '/' && item.hash) {
      e.preventDefault();
      // Allow menu to close before scrolling
      setTimeout(() => {
        const el = document.getElementById(item.hash);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 150);
    }
  };

  return (
    <>
      <header className="mobile-nav">
        <Link href="/" className="mobile-nav__brand" style={{ textDecoration: 'none' }}>
          ISHIRO
        </Link>
        <button
          className={`hamburger ${isOpen ? 'open' : ''}`}
          onClick={toggleMenu}
          aria-label={isOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={isOpen}
        >
          <span />
          <span />
          <span />
        </button>
      </header>

      <nav className={`mobile-menu ${isOpen ? 'open' : ''}`} aria-label="Mobile navigation">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="mobile-menu__item"
            onClick={(e) => handleNavClick(e, item)}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </>
  );
}
