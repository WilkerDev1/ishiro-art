'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { Artwork } from '@/generated/prisma/client';

interface CommissionsSectionProps {
  artworks: Artwork[];
}

export default function CommissionsSection({ artworks }: CommissionsSectionProps) {
  const [selectedArtwork, setSelectedArtwork] = useState<Artwork | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [mounted, setMounted] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Monitor scroll position to update dots
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const handleScroll = () => {
      const children = Array.from(track.children) as HTMLElement[];
      if (children.length === 0) return;

      const trackRect = track.getBoundingClientRect();
      const trackLeft = trackRect.left + parseFloat(getComputedStyle(track).paddingLeft);

      let closestIndex = 0;
      let minDistance = Infinity;

      children.forEach((child, index) => {
        if (!child.classList.contains('commissions__card')) return;
        const childRect = child.getBoundingClientRect();
        const distance = Math.abs(childRect.left - trackLeft);
        if (distance < minDistance) {
          minDistance = distance;
          closestIndex = index;
        }
      });

      const cardChildren = children.filter(c => c.classList.contains('commissions__card'));
      const activeCard = cardChildren[closestIndex];
      const actualIndex = cardChildren.indexOf(activeCard);
      
      if (actualIndex !== -1) {
        setActiveIndex(actualIndex);
      }
    };

    track.addEventListener('scroll', handleScroll);
    return () => track.removeEventListener('scroll', handleScroll);
  }, [artworks.length]);

  // Handle ESC key for Lightbox close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedArtwork(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handlePrev = () => {
    const track = trackRef.current;
    if (!track) return;
    const cardChildren = Array.from(track.children).filter(
      c => c.classList.contains('commissions__card')
    ) as HTMLElement[];
    const prevIndex = Math.max(0, activeIndex - 1);
    const targetCard = cardChildren[prevIndex];
    if (targetCard) {
      track.scrollTo({
        left: targetCard.offsetLeft - track.offsetLeft,
        behavior: 'smooth',
      });
      setActiveIndex(prevIndex);
    }
  };

  const handleNext = () => {
    const track = trackRef.current;
    if (!track) return;
    const cardChildren = Array.from(track.children).filter(
      c => c.classList.contains('commissions__card')
    ) as HTMLElement[];
    const nextIndex = Math.min(cardChildren.length - 1, activeIndex + 1);
    const targetCard = cardChildren[nextIndex];
    if (targetCard) {
      track.scrollTo({
        left: targetCard.offsetLeft - track.offsetLeft,
        behavior: 'smooth',
      });
      setActiveIndex(nextIndex);
    }
  };

  const handleDotClick = (index: number) => {
    const track = trackRef.current;
    if (!track) return;
    const cardChildren = Array.from(track.children).filter(
      c => c.classList.contains('commissions__card')
    ) as HTMLElement[];
    const targetCard = cardChildren[index];
    if (targetCard) {
      track.scrollTo({
        left: targetCard.offsetLeft - track.offsetLeft,
        behavior: 'smooth',
      });
      setActiveIndex(index);
    }
  };

  return (
    <section id="commissions" className="commissions-section section" style={{ background: 'var(--primary)', color: 'var(--dark)' }}>
      <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-xl)' }}>
        <h2 className="section-title" style={{ color: 'var(--dark)', marginBottom: 0 }}>
          COMMISSION SAMPLES
        </h2>
        {artworks.length > 1 && (
          <div className="carousel-nav-header">
            <button
              className="carousel-btn-nav-header"
              onClick={handlePrev}
              aria-label="Previous commission artwork"
              style={{ color: 'var(--dark)' }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
            </button>
            <button
              className="carousel-btn-nav-header"
              onClick={handleNext}
              aria-label="Next commission artwork"
              style={{ color: 'var(--dark)' }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
            </button>
          </div>
        )}
      </div>

      {/* Carousel Track */}
      <div className="carousel-container">

          <div
            ref={trackRef}
            className="commissions__track"
          >
            {artworks.map((work) => (
              <div
                key={work.id}
                className="commissions__card"
                onClick={() => setSelectedArtwork(work)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={work.imageUrl}
                  alt={work.title}
                  loading="lazy"
                />
                
                {/* Card Title Info */}
                <div
                  className="commissions__card-info"
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    padding: 'var(--space-md)',
                    background: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.85) 100%)',
                    zIndex: 2,
                  }}
                >
                  <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 'var(--text-base)', color: 'var(--text-primary)' }}>
                    {work.title}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Navigation Dots */}
          {artworks.length > 1 && (
            <div className="carousel-dots carousel-dots--light">
              {artworks.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => handleDotClick(idx)}
                  className={`carousel-dot ${activeIndex === idx ? 'active' : ''}`}
                  aria-label={`Go to commission slide ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </div>

      {/* Lightbox Modal rendered via Portal */}
      {mounted && typeof window !== 'undefined' && createPortal(
        <div
          className={`lightbox ${selectedArtwork ? 'open' : ''}`}
          onClick={() => setSelectedArtwork(null)}
          aria-hidden={!selectedArtwork}
        >
          <button
            className="lightbox__close"
            onClick={() => setSelectedArtwork(null)}
            aria-label="Close lightbox"
          >
            &times;
          </button>
          {selectedArtwork && (
            <div className="lightbox__content" onClick={(e) => e.stopPropagation()}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                ref={imageRef}
                className="lightbox__image"
                src={selectedArtwork.imageUrl}
                alt={selectedArtwork.title}
              />
              <div className="lightbox__info">
                <span className="gallery__card-category" style={{ display: 'inline-block', marginBottom: 'var(--space-xs)' }}>
                  {selectedArtwork.category}
                </span>
                <h3 className="lightbox__title">{selectedArtwork.title}</h3>
                {selectedArtwork.description && (
                  <p className="lightbox__description">{selectedArtwork.description}</p>
                )}
                {(() => {
                  let tags: string[] = [];
                  try {
                    tags = selectedArtwork.tags ? JSON.parse(selectedArtwork.tags) : [];
                  } catch {}
                  if (tags.length === 0) return null;
                  return (
                    <div className="gallery__card-tags" style={{ marginTop: 'var(--space-md)', marginBottom: 'var(--space-md)' }}>
                      {tags.map((tag) => (
                        <span key={tag} className="gallery__tag">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  );
                })()}

                {/* Actions: Fullscreen & Open Original */}
                <div style={{ display: 'flex', gap: 'var(--space-sm)', marginTop: 'var(--space-sm)', width: '100%' }}>
                  <a
                    href={selectedArtwork.imageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn--outline"
                    style={{ padding: '8px 12px', fontSize: 'var(--text-xs)', flex: 1, textAlign: 'center', fontWeight: 600 }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    Open Original
                  </a>
                  <button
                    type="button"
                    className="btn btn--primary"
                    style={{ padding: '8px 12px', fontSize: 'var(--text-xs)', flex: 1, fontWeight: 600 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      const img = imageRef.current;
                      if (img) {
                        if (img.requestFullscreen) {
                          img.requestFullscreen();
                        } else if ((img as any).webkitRequestFullscreen) {
                          (img as any).webkitRequestFullscreen();
                        }
                      }
                    }}
                  >
                    Fullscreen
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>,
        document.body
      )}
    </section>
  );
}
