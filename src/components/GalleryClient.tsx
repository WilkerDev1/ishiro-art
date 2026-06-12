'use client';

import { useState, useEffect } from 'react';
import type { Artwork } from '@/generated/prisma/client';
import ScrollReveal from '@/components/ScrollReveal';

interface GalleryClientProps {
  artworks: Artwork[];
}

const CATEGORIES = ['All', 'Illustrations', 'Character Design', 'Commissions', 'Sketches'];

const FALLBACK_GRADIENTS = [
  'linear-gradient(135deg, #DC143C 0%, #FF4500 50%, #0A0A0A 100%)',
  'linear-gradient(135deg, #1a0a2e 0%, #6B21A8 50%, #DC143C 100%)',
  'linear-gradient(135deg, #0A0A0A 0%, #FF4500 40%, #FF6B35 100%)',
  'linear-gradient(135deg, #1E1E1E 0%, #DC143C 60%, #FF4500 100%)',
  'linear-gradient(135deg, #FF6B35 0%, #DC143C 50%, #0A0A0A 100%)',
  'linear-gradient(135deg, #2A085C 0%, #FF4500 70%, #0A0A0A 100%)',
];

export default function GalleryClient({ artworks }: GalleryClientProps) {
  const [activeFilter, setActiveFilter] = useState('All');
  const [lightboxArtwork, setLightboxArtwork] = useState<Artwork | null>(null);

  // Filtered artworks
  const filteredArtworks = artworks.filter((art) => {
    if (activeFilter === 'All') return true;
    return art.category === activeFilter;
  });

  // Handle ESC key for Lightbox close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLightboxArtwork(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <section className="gallery section" style={{ minHeight: '100vh', paddingTop: 'var(--space-3xl)' }}>
      <div className="container">
        {/* Gallery Title */}
        <ScrollReveal animation="reveal">
          <h1 className="hero__title" style={{ fontSize: 'clamp(3rem, 8vw, 6rem)', marginBottom: 'var(--space-xl)' }}>
            GALLERY<span className="accent">.</span>
          </h1>
        </ScrollReveal>

        {/* Filter bar */}
        <ScrollReveal animation="reveal" delay={100}>
          <div className="gallery__filters" style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap', marginBottom: 'var(--space-xl)' }}>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                className={`gallery__filter-btn ${activeFilter === cat ? 'active' : ''}`}
                onClick={() => setActiveFilter(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </ScrollReveal>

        {/* Masonry Grid */}
        <ScrollReveal animation="reveal-scale" delay={200}>
          <div className="gallery__grid">
            {filteredArtworks.length > 0 ? (
              filteredArtworks.map((art) => {
                let tags: string[] = [];
                try {
                  tags = art.tags ? JSON.parse(art.tags) : [];
                } catch {
                  // Fallback if tags not valid JSON
                }

                return (
                  <div
                    key={art.id}
                    className="gallery__card"
                    onClick={() => setLightboxArtwork(art)}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={art.imageUrl} alt={art.title} loading="lazy" />
                    <div className="gallery__card-overlay">
                      <div className="gallery__card-title">{art.title}</div>
                      <div className="gallery__card-category">{art.category}</div>
                      {tags.length > 0 && (
                        <div className="gallery__card-tags">
                          {tags.slice(0, 3).map((tag) => (
                            <span key={tag} className="gallery__tag">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            ) : artworks.length === 0 ? (
              // Render gradient placeholders if database is entirely empty
              Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="gallery__card"
                  style={{
                    height: i % 2 === 0 ? '300px' : '450px',
                    background: FALLBACK_GRADIENTS[i % FALLBACK_GRADIENTS.length],
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-end',
                    padding: 'var(--space-lg)',
                  }}
                >
                  <div className="gallery__card-overlay" style={{ opacity: 1, background: 'none' }}>
                    <div className="gallery__card-title">Placeholder Artwork {i + 1}</div>
                    <div className="gallery__card-category">
                      {CATEGORIES[1 + (i % (CATEGORIES.length - 1))]}
                    </div>
                    <div className="gallery__card-tags">
                      <span className="gallery__tag">#Placeholder</span>
                      <span className="gallery__tag">#Art</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              // Database has items but no items match current filter
              <div style={{ gridColumn: '1 / -1', padding: 'var(--space-2xl) 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
                No artworks found in this category.
              </div>
            )}
          </div>
        </ScrollReveal>
      </div>

      {/* Lightbox Modal */}
      <div
        className={`lightbox ${lightboxArtwork ? 'open' : ''}`}
        onClick={() => setLightboxArtwork(null)}
        aria-hidden={!lightboxArtwork}
      >
        <button
          className="lightbox__close"
          onClick={() => setLightboxArtwork(null)}
          aria-label="Close lightbox"
        >
          &times;
        </button>
        {lightboxArtwork && (
          <div className="lightbox__content" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className="lightbox__image"
              src={lightboxArtwork.imageUrl}
              alt={lightboxArtwork.title}
            />
            <div className="lightbox__info">
              <span className="gallery__card-category" style={{ display: 'inline-block', marginBottom: 'var(--space-xs)' }}>
                {lightboxArtwork.category}
              </span>
              <h3 className="lightbox__title">{lightboxArtwork.title}</h3>
              {lightboxArtwork.description && (
                <p className="lightbox__description">{lightboxArtwork.description}</p>
              )}
              {(() => {
                let tags: string[] = [];
                try {
                  tags = lightboxArtwork.tags ? JSON.parse(lightboxArtwork.tags) : [];
                } catch {}
                if (tags.length === 0) return null;
                return (
                  <div className="gallery__card-tags" style={{ marginTop: 'var(--space-md)' }}>
                    {tags.map((tag) => (
                      <span key={tag} className="gallery__tag">
                        #{tag}
                      </span>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
