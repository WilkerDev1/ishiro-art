import prisma from '@/lib/prisma';
import ScrollReveal from '@/components/ScrollReveal';
import { iconMap, ArrowUpRightIcon } from '@/components/icons/SocialIcons';
import FeaturedWorksSection from '@/components/FeaturedWorksSection';
import CommissionsSection from '@/components/CommissionsSection';
import ThemeColorExtractor from '@/components/ThemeColorExtractor';

export const dynamic = 'force-dynamic';

/* ─── Data Fetchers ──────────────────────────────────────────────────── */

async function getSiteConfig() {
  try {
    const config = await prisma.siteConfig.findUnique({
      where: { id: 'main' },
    });
    return config;
  } catch {
    return null;
  }
}

async function getSocialLinks() {
  try {
    const links = await prisma.socialLink.findMany({
      where: { visible: true },
      orderBy: { order: 'asc' },
    });
    return links;
  } catch {
    return [];
  }
}

async function getFeaturedArtworks() {
  try {
    const artworks = await prisma.artwork.findMany({
      where: { featured: true },
      orderBy: { order: 'asc' },
      take: 8,
    });
    return artworks;
  } catch {
    return [];
  }
}

async function getArtworkCount() {
  try {
    return await prisma.artwork.count();
  } catch {
    return 0;
  }
}

async function getCommissionArtworks() {
  try {
    const artworks = await prisma.artwork.findMany({
      where: { category: 'Commissions' },
      orderBy: { order: 'asc' },
    });
    return artworks;
  } catch {
    return [];
  }
}

/* ─── Fallback Data ──────────────────────────────────────────────────── */

const FALLBACK_SOCIAL_LINKS = [
  {
    id: '1',
    platform: 'x',
    url: 'https://x.com/ishiro_art',
    label: 'X / Twitter',
    handle: '@ishiro_art',
    icon: 'x',
    order: 0,
    visible: true,
  },
  {
    id: '2',
    platform: 'pixiv',
    url: 'https://pixiv.net/users/ishiro',
    label: 'Pixiv',
    handle: 'ISHIRO',
    icon: 'pixiv',
    order: 1,
    visible: true,
  },
  {
    id: '3',
    platform: 'instagram',
    url: 'https://instagram.com/ishiro_art',
    label: 'Instagram',
    handle: '@ishiro_art',
    icon: 'instagram',
    order: 2,
    visible: true,
  },
  {
    id: '4',
    platform: 'youtube',
    url: 'https://youtube.com/@ishiro_art',
    label: 'YouTube',
    handle: '@ishiro_art',
    icon: 'youtube',
    order: 3,
    visible: true,
  },
  {
    id: '5',
    platform: 'ko-fi',
    url: 'https://ko-fi.com/ishiro',
    label: 'Ko-fi',
    handle: 'Support my work',
    icon: 'ko-fi',
    order: 4,
    visible: true,
  },
];

import type { Artwork } from '@/generated/prisma/client';

const FALLBACK_FEATURED: Artwork[] = [
  { id: '1', title: 'Summer Bloom', description: null, imageUrl: '', category: 'Illustrations', tags: '[]', featured: true, order: 1, width: null, height: null, createdAt: new Date(), updatedAt: new Date() },
  { id: '2', title: 'Midnight Shrine', description: null, imageUrl: '', category: 'Fanart', tags: '[]', featured: true, order: 2, width: null, height: null, createdAt: new Date(), updatedAt: new Date() },
  { id: '3', title: 'Cherry Blossom OC', description: null, imageUrl: '', category: 'Original Characters', tags: '[]', featured: true, order: 3, width: null, height: null, createdAt: new Date(), updatedAt: new Date() },
  { id: '4', title: 'Neon City Girl', description: null, imageUrl: '', category: 'Illustrations', tags: '[]', featured: true, order: 4, width: null, height: null, createdAt: new Date(), updatedAt: new Date() },
  { id: '5', title: 'Autumn Spirit', description: null, imageUrl: '', category: 'Original Characters', tags: '[]', featured: true, order: 5, width: null, height: null, createdAt: new Date(), updatedAt: new Date() },
];

const FEATURED_GRADIENTS = [
  'linear-gradient(135deg, #DC143C 0%, #FF4500 50%, #0A0A0A 100%)',
  'linear-gradient(135deg, #1a0a2e 0%, #6B21A8 50%, #DC143C 100%)',
  'linear-gradient(135deg, #0A0A0A 0%, #FF4500 40%, #FF6B35 100%)',
  'linear-gradient(135deg, #1E1E1E 0%, #DC143C 60%, #FF4500 100%)',
  'linear-gradient(135deg, #FF6B35 0%, #DC143C 50%, #0A0A0A 100%)',
];

/* ─── Home Page ──────────────────────────────────────────────────────── */

export default async function HomePage() {
  const [config, socialLinks, featuredArtworks, artworkCount, commissionArtworks] =
    await Promise.all([
      getSiteConfig(),
      getSocialLinks(),
      getFeaturedArtworks(),
      getArtworkCount(),
      getCommissionArtworks(),
    ]);

  const artistName = config?.artistName ?? 'ISHIRO';
  const tagline =
    config?.tagline ?? 'Cute & Funny Artist';
  const email = config?.email ?? 'ishiro@example.com';
  const bio =
    config?.bio ??
    'Digital artist specializing in cute & funny illustrations, character designs, and fanart. Inspired by anime, manga, and Japanese pop culture.';
  const aboutText =
    config?.aboutText ??
    'Drawing since childhood, now creating art full-time. Every piece tells a story—whether it\'s an original character, a vibrant illustration, or a love letter to my favourite anime.';

  const stat1Value = config?.stat1Value ?? '1.2K+';
  const stat1Label = config?.stat1Label ?? 'Followers';
  const stat2Value = config?.stat2Value
    ? config.stat2Value
    : `${artworkCount > 0 ? artworkCount : '50'}+`;
  const stat2Label = config?.stat2Label ?? 'Artworks';
  const stat3Value = config?.stat3Value ?? '∞';
  const stat3Label = config?.stat3Label ?? 'Passion';

  const socials =
    socialLinks.length > 0 ? socialLinks : FALLBACK_SOCIAL_LINKS;

  const featured =
    featuredArtworks.length > 0
      ? featuredArtworks
      : FALLBACK_FEATURED;

  const commissions = commissionArtworks;

  return (
    <>
      <ThemeColorExtractor imageUrl={config?.heroImageUrl} />
      {/* ═══════════════ HERO ═══════════════ */}
      <section id="hero" className="hero">
        {/* Gradient background (no uploaded hero image yet) */}
        <div
          className="hero__bg"
          style={{
            backgroundImage: config?.heroImageUrl
              ? `url(${config.heroImageUrl})`
              : 'none',
            backgroundColor: config?.heroImageUrl
              ? 'transparent'
              : 'var(--primary)',
          }}
        />

        <div className="hero__content">
          <ScrollReveal animation="reveal">
            <h1 className="hero__title">
              <span className="hero__name-ishiro">{artistName}</span>
              <span className="accent">ART</span>
            </h1>
          </ScrollReveal>

          <ScrollReveal animation="reveal" delay={200}>
            <p className="hero__subtitle">{tagline}</p>
          </ScrollReveal>

          <ScrollReveal animation="reveal" delay={400}>
            <p className="hero__tagline">
              Original illustrations · Character Design · Fanart
            </p>
          </ScrollReveal>

          <ScrollReveal animation="reveal" delay={600}>
            <div className="hero__actions">
              <a href="#featured" className="btn btn--primary">
                View Gallery
              </a>
              <a href="#commissions" className="btn btn--outline">
                COMMISSIONS
              </a>
            </div>
          </ScrollReveal>
        </div>

        {/* Decorative animated elements */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            bottom: '10%',
            right: '8%',
            width: '300px',
            height: '300px',
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(255,69,0,0.15) 0%, transparent 70%)',
            filter: 'blur(60px)',
            animation: 'float 8s ease-in-out infinite',
            zIndex: 1,
          }}
        />
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: '20%',
            right: '15%',
            width: '200px',
            height: '200px',
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(220,20,60,0.1) 0%, transparent 70%)',
            filter: 'blur(40px)',
            animation: 'float 6s ease-in-out infinite reverse',
            zIndex: 1,
          }}
        />

        <style>{`
          @keyframes float {
            0%, 100% { transform: translate(0, 0) scale(1); }
            33% { transform: translate(20px, -30px) scale(1.05); }
            66% { transform: translate(-15px, 15px) scale(0.95); }
          }
        `}</style>
      </section>

      {/* ═══════════════ SOCIAL HUB ═══════════════ */}
      <section id="social" className="social-hub section">
        <div className="container">
          <ScrollReveal>
            <h2 className="section-title">CONNECT</h2>
          </ScrollReveal>

          <ScrollReveal animation="reveal" className="stagger-children">
            <div className="social-grid">
              {socials.map((link) => {
                const IconComponent =
                  iconMap[(link.icon ?? link.platform).toLowerCase()] ??
                  iconMap['link'];
                return (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="social-btn"
                  >
                    <div className="social-btn__icon">
                      {IconComponent && <IconComponent size={22} />}
                    </div>
                    <div className="social-btn__info">
                      <div className="social-btn__label">
                        {link.label ?? link.platform}
                      </div>
                      {link.handle && (
                        <div className="social-btn__handle">{link.handle}</div>
                      )}
                    </div>
                    <div className="social-btn__arrow">
                      <ArrowUpRightIcon size={18} />
                    </div>
                  </a>
                );
              })}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ═══════════════ FEATURED WORKS ═══════════════ */}
      <section id="featured" className="section">
        <ScrollReveal animation="reveal-scale">
          <FeaturedWorksSection artworks={featured} />
        </ScrollReveal>
      </section>

      {/* ═══════════════ COMMISSIONS SECTION ═══════════════ */}
      {commissions.length > 0 && (
        <ScrollReveal animation="reveal">
          <CommissionsSection artworks={commissions} />
        </ScrollReveal>
      )}

      {/* ═══════════════ ABOUT ═══════════════ */}
      <section id="about" className="about">
        <div className="about__grid">
          <ScrollReveal animation="reveal-left">
            <div className="about__image">
              {config?.avatarUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={config.avatarUrl} alt={`${artistName} avatar`} />
              ) : (
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    background:
                      'linear-gradient(135deg, #1E1E1E 0%, #DC143C 50%, #FF4500 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'var(--font-display)',
                    fontSize: 'var(--text-hero)',
                    color: 'rgba(255,255,255,0.1)',
                  }}
                >
                  I
                </div>
              )}
            </div>
          </ScrollReveal>

          <ScrollReveal animation="reveal-right">
            <div className="about__text">
              <h2>
                ABOUT <span className="text-accent-primary">{artistName}</span>
              </h2>
              <p>{bio}</p>
              {aboutText && <p>{aboutText}</p>}

              <div className="about__stats">
                <div>
                  <div className="about__stat-value">{stat1Value}</div>
                  <div className="about__stat-label">{stat1Label}</div>
                </div>
                <div>
                  <div className="about__stat-value">{stat2Value}</div>
                  <div className="about__stat-label">{stat2Label}</div>
                </div>
                <div>
                  <div className="about__stat-value">{stat3Value}</div>
                  <div className="about__stat-label">{stat3Label}</div>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ═══════════════ CONTACT ═══════════════ */}
      <section id="contact" className="contact">
        <ScrollReveal>
          <div className="deco-line" />
          <h2 className="section-title section-title--center">GET IN TOUCH</h2>
        </ScrollReveal>

        <ScrollReveal animation="reveal-scale" delay={200}>
          <div className="contact__box">
            <a href={`mailto:${email}`} className="contact__email">
              {email}
            </a>
            <p className="contact__subtitle">COMMISSIONS OPEN</p>
          </div>
        </ScrollReveal>
      </section>

      {/* ═══════════════ FOOTER ═══════════════ */}
      <footer className="footer">
        <p className="footer__text">
          © {new Date().getFullYear()}{' '}
          <a href="#hero">{artistName}_Art</a>. All rights reserved.
        </p>
      </footer>
    </>
  );
}
