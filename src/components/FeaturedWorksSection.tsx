'use client';

import { useState, useEffect, useRef } from 'react';
import type { Artwork } from '@/generated/prisma/client';

interface FeaturedWorksSectionProps {
  artworks: Artwork[];
}

const FEATURED_GRADIENTS = [
  'linear-gradient(135deg, #DC143C 0%, #FF4500 50%, #0A0A0A 100%)',
  'linear-gradient(135deg, #1a0a2e 0%, #6B21A8 50%, #DC143C 100%)',
  'linear-gradient(135deg, #0A0A0A 0%, #FF4500 40%, #FF6B35 100%)',
  'linear-gradient(135deg, #1E1E1E 0%, #DC143C 60%, #FF4500 100%)',
  'linear-gradient(135deg, #FF6B35 0%, #DC143C 50%, #0A0A0A 100%)',
];

export default function FeaturedWorksSection({ artworks }: FeaturedWorksSectionProps) {
  const [selectedArtwork, setSelectedArtwork] = useState<Artwork | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);

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
        if (!child.classList.contains('featured__card')) return;
        const childRect = child.getBoundingClientRect();
        const distance = Math.abs(childRect.left - trackLeft);
        if (distance < minDistance) {
          minDistance = distance;
          closestIndex = index;
        }
      });

      const cardChildren = children.filter(c => c.classList.contains('featured__card'));
      const activeCard = cardChildren[closestIndex];
      const actualIndex = cardChildren.indexOf(activeCard);
      
      if (actualIndex !== -1) {
        setActiveIndex(actualIndex);
      }
    };

    track.addEventListener('scroll', handleScroll);
    return () => track.removeEventListener('scroll', handleScroll);
  }, [artworks.length]);

  // Close on Escape key
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
      c => c.classList.contains('featured__card')
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
      c => c.classList.contains('featured__card')
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
      c => c.classList.contains('featured__card')
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
    <>
      <div className="carousel-container">
        {/* Navigation Arrows */}
        {artworks.length > 1 && (
          <>
            <button
              className="carousel-btn-nav carousel-btn-nav--prev"
              onClick={handlePrev}
              aria-label="Previous featured artwork"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
            </button>
            <button
              className="carousel-btn-nav carousel-btn-nav--next"
              onClick={handleNext}
              aria-label="Next featured artwork"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
            </button>
          </>
        )}

        <div ref={trackRef} className="featured__track">
          {artworks.map((work, i) => {
            const hasImage = work.imageUrl;
            return (
              <div
                key={work.id}
                className="featured__card"
                onClick={() => setSelectedArtwork(work)}
              >
                {hasImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={work.imageUrl} alt={work.title} loading="lazy" />
                ) : (
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      minHeight: '260px',
                      background: FEATURED_GRADIENTS[i % FEATURED_GRADIENTS.length],
                    }}
                  />
                )}
                <div className="featured__card-info">
                  <div className="featured__card-title">{work.title}</div>
                  <div className="featured__card-subtitle">{work.category}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Carousel Dots */}
        {artworks.length > 1 && (
          <div className="carousel-dots">
            {artworks.map((_, idx) => (
              <button
                key={idx}
                onClick={() => handleDotClick(idx)}
                className={`carousel-dot ${activeIndex === idx ? 'active' : ''}`}
                aria-label={`Go to featured slide ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
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
    </>
  );
}
