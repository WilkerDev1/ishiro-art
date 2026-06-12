'use client';

import { useState, useRef } from 'react';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import type { Artwork, SocialLink, SiteConfig } from '@/generated/prisma/client';

interface AdminDashboardProps {
  initialArtworks: Artwork[];
  initialSocialLinks: SocialLink[];
  initialSiteConfig: SiteConfig;
}

export default function AdminDashboard({
  initialArtworks,
  initialSocialLinks,
  initialSiteConfig,
}: AdminDashboardProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'gallery' | 'upload' | 'social' | 'config'>('gallery');
  const [artworks, setArtworks] = useState<Artwork[]>(initialArtworks);
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>(initialSocialLinks);
  const [siteConfig, setSiteConfig] = useState<SiteConfig>(initialSiteConfig);
  const [isSavingArtwork, setIsSavingArtwork] = useState(false);
  const [isSavingSocial, setIsSavingSocial] = useState(false);
  const [isAddingSocial, setIsAddingSocial] = useState(false);
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  // Toast state
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
    show: false,
    message: '',
    type: 'success',
  });

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 3000);
  };

  // ─── UPLOAD TABS & STATE ────────────────────────────────────────────────
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadData, setUploadData] = useState({
    title: '',
    description: '',
    category: 'Illustrations',
    tags: '',
    featured: false,
    order: 0,
  });
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      setFile(files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setFile(files[0]);
    }
  };

  const setFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      showToast('Please select an image file.', 'error');
      return;
    }
    setUploadFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setUploadPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) {
      showToast('Please select an image first.', 'error');
      return;
    }

    setIsUploading(true);
    try {
      // 1. Upload the image file
      const formData = new FormData();
      formData.append('file', uploadFile);

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadRes.ok) {
        throw new Error('Failed to upload image file.');
      }

      const { url } = await uploadRes.json();

      // 2. Create the artwork db record
      const tagsArray = uploadData.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      const artworkRes = await fetch('/api/artworks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: uploadData.title,
          description: uploadData.description,
          imageUrl: url,
          category: uploadData.category,
          tags: JSON.stringify(tagsArray),
          featured: uploadData.featured,
          order: Number(uploadData.order),
        }),
      });

      if (!artworkRes.ok) {
        throw new Error('Failed to create artwork record.');
      }

      const newArtwork = await artworkRes.json();
      setArtworks((prev) => [...prev, newArtwork].sort((a, b) => a.order - b.order));
      showToast('Artwork uploaded successfully!');
      router.refresh();

      // Reset form
      setUploadFile(null);
      setUploadPreview(null);
      setUploadData({
        title: '',
        description: '',
        category: 'Illustrations',
        tags: '',
        featured: false,
        order: 0,
      });
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Failed to upload artwork.', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  // ─── GALLERY MANAGER STATE & HANDLERS ────────────────────────────────────
  const [editingArtwork, setEditingArtwork] = useState<Artwork | null>(null);
  const [editData, setEditData] = useState({
    title: '',
    description: '',
    category: 'Illustrations',
    tags: '',
    featured: false,
    order: 0,
  });

  const handleStartEdit = (art: Artwork) => {
    let tagsStr = '';
    try {
      tagsStr = art.tags ? JSON.parse(art.tags).join(', ') : '';
    } catch {}

    setEditingArtwork(art);
    setEditData({
      title: art.title,
      description: art.description || '',
      category: art.category,
      tags: tagsStr,
      featured: art.featured,
      order: art.order,
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingArtwork) return;

    setIsSavingArtwork(true);
    try {
      const tagsArray = editData.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      const res = await fetch(`/api/artworks/${editingArtwork.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editData.title,
          description: editData.description,
          category: editData.category,
          tags: JSON.stringify(tagsArray),
          featured: editData.featured,
          order: Number(editData.order),
        }),
      });

      if (!res.ok) throw new Error('Failed to update artwork.');

      const updated = await res.json();
      setArtworks((prev) =>
        prev.map((art) => (art.id === updated.id ? updated : art)).sort((a, b) => a.order - b.order)
      );
      setEditingArtwork(null);
      showToast('Artwork updated successfully!');
      router.refresh();
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Failed to update artwork.', 'error');
    } finally {
      setIsSavingArtwork(false);
    }
  };

  const handleDeleteArtwork = async (id: string) => {
    if (!confirm('Are you sure you want to delete this artwork? This cannot be undone.')) return;

    try {
      const res = await fetch(`/api/artworks/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete artwork.');

      setArtworks((prev) => prev.filter((art) => art.id !== id));
      showToast('Artwork deleted successfully.');
      router.refresh();
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Failed to delete artwork.', 'error');
    }
  };

  // ─── SOCIAL LINKS MANAGER STATE & HANDLERS ────────────────────────────────
  const [newSocial, setNewSocial] = useState({
    platform: 'twitter',
    url: '',
    label: '',
    handle: '',
    order: 0,
  });

  const [editingSocial, setEditingSocial] = useState<SocialLink | null>(null);
  const [editSocialData, setEditSocialData] = useState({
    platform: 'twitter',
    url: '',
    label: '',
    handle: '',
    order: 0,
  });

  const handleStartEditSocial = (link: SocialLink) => {
    setEditingSocial(link);
    setEditSocialData({
      platform: link.platform,
      url: link.url,
      label: link.label || '',
      handle: link.handle || '',
      order: link.order,
    });
  };

  const handleSaveEditSocial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSocial) return;

    setIsSavingSocial(true);
    try {
      const res = await fetch(`/api/social-links/${editingSocial.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: editSocialData.platform,
          url: editSocialData.url,
          label: editSocialData.label || null,
          handle: editSocialData.handle || null,
          order: Number(editSocialData.order),
        }),
      });

      if (!res.ok) throw new Error('Failed to update social link.');

      const updated = await res.json();
      setSocialLinks((prev) =>
        prev.map((link) => (link.id === updated.id ? updated : link)).sort((a, b) => a.order - b.order)
      );
      setEditingSocial(null);
      showToast('Social link updated successfully!');
      router.refresh();
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Failed to update social link.', 'error');
    } finally {
      setIsSavingSocial(false);
    }
  };

  const handleAddSocial = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingSocial(true);
    try {
      const res = await fetch('/api/social-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: newSocial.platform,
          url: newSocial.url,
          label: newSocial.label || null,
          handle: newSocial.handle || null,
          order: Number(newSocial.order),
        }),
      });

      if (!res.ok) throw new Error('Failed to add social link.');

      const added = await res.json();
      setSocialLinks((prev) => [...prev, added].sort((a, b) => a.order - b.order));
      setNewSocial({
        platform: 'twitter',
        url: '',
        label: '',
        handle: '',
        order: socialLinks.length + 1,
      });
      showToast('Social link added!');
      router.refresh();
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Failed to add social link.', 'error');
    } finally {
      setIsAddingSocial(false);
    }
  };

  const handleDeleteSocial = async (id: string) => {
    if (!confirm('Delete this social link?')) return;

    try {
      const res = await fetch(`/api/social-links/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete social link.');

      setSocialLinks((prev) => prev.filter((link) => link.id !== id));
      showToast('Social link deleted.');
      router.refresh();
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Failed to delete social link.', 'error');
    }
  };

  // ─── SITE CONFIG STATE & HANDLERS ──────────────────────────────────────────
  const [configData, setConfigData] = useState({
    artistName: siteConfig.artistName,
    tagline: siteConfig.tagline,
    email: siteConfig.email || '',
    bio: siteConfig.bio || '',
    aboutText: siteConfig.aboutText || '',
    stat1Value: siteConfig.stat1Value || '',
    stat1Label: siteConfig.stat1Label || '',
    stat2Value: siteConfig.stat2Value || '',
    stat2Label: siteConfig.stat2Label || '',
    stat3Value: siteConfig.stat3Value || '',
    stat3Label: siteConfig.stat3Label || '',
    avatarUrl: siteConfig.avatarUrl || '',
    heroImageUrl: siteConfig.heroImageUrl || '',
  });

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const heroInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingHero, setIsUploadingHero] = useState(false);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Failed to upload avatar.');

      const { url } = await res.json();
      setConfigData((prev) => ({ ...prev, avatarUrl: url }));
      showToast('Avatar uploaded successfully!');
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Failed to upload avatar.', 'error');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleHeroUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingHero(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Failed to upload hero cover.');

      const { url } = await res.json();
      setConfigData((prev) => ({ ...prev, heroImageUrl: url }));
      showToast('Hero cover image uploaded successfully!');
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Failed to upload hero cover.', 'error');
    } finally {
      setIsUploadingHero(false);
    }
  };

  const handleConfigSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingConfig(true);
    try {
      const res = await fetch('/api/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artistName: configData.artistName,
          tagline: configData.tagline,
          email: configData.email || null,
          bio: configData.bio || null,
          aboutText: configData.aboutText || null,
          stat1Value: configData.stat1Value,
          stat1Label: configData.stat1Label,
          stat2Value: configData.stat2Value,
          stat2Label: configData.stat2Label,
          stat3Value: configData.stat3Value,
          stat3Label: configData.stat3Label,
          avatarUrl: configData.avatarUrl || null,
          heroImageUrl: configData.heroImageUrl || null,
        }),
      });

      if (!res.ok) throw new Error('Failed to update configuration.');

      const updated = await res.json();
      setSiteConfig(updated);
      showToast('Config saved successfully!');
      router.refresh();
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Failed to save config.', 'error');
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' });
  };

  return (
    <div className="admin-layout" style={{ minHeight: '100vh', background: 'var(--dark)' }}>
      {/* Toast Notification */}
      <div className={`toast ${toast.show ? 'show' : ''} ${toast.type === 'success' ? 'toast--success' : 'toast--error'}`}>
        {toast.message}
      </div>

      {/* Admin Sidebar */}
      <aside className="admin-sidebar" style={{ borderRight: '1px solid var(--dark-border)' }}>
        <div style={{ padding: 'var(--space-lg)', borderBottom: '1px solid var(--dark-border)' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-lg)', color: 'var(--primary)', letterSpacing: '2px' }}>
            ISHIRO ADMIN
          </h2>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Portfolio Dashboard</span>
        </div>

        <nav style={{ padding: 'var(--space-md) 0' }}>
          <button
            className={`btn btn--ghost`}
            style={{
              width: '100%',
              textAlign: 'left',
              justifyContent: 'flex-start',
              padding: 'var(--space-md) var(--space-lg)',
              background: activeTab === 'gallery' ? 'rgba(255, 69, 0, 0.1)' : 'transparent',
              color: activeTab === 'gallery' ? 'var(--primary)' : 'var(--text-primary)',
              borderRadius: 0,
            }}
            onClick={() => setActiveTab('gallery')}
          >
            Gallery Manager
          </button>
          <button
            className={`btn btn--ghost`}
            style={{
              width: '100%',
              textAlign: 'left',
              justifyContent: 'flex-start',
              padding: 'var(--space-md) var(--space-lg)',
              background: activeTab === 'upload' ? 'rgba(255, 69, 0, 0.1)' : 'transparent',
              color: activeTab === 'upload' ? 'var(--primary)' : 'var(--text-primary)',
              borderRadius: 0,
            }}
            onClick={() => setActiveTab('upload')}
          >
            Upload New Art
          </button>
          <button
            className={`btn btn--ghost`}
            style={{
              width: '100%',
              textAlign: 'left',
              justifyContent: 'flex-start',
              padding: 'var(--space-md) var(--space-lg)',
              background: activeTab === 'social' ? 'rgba(255, 69, 0, 0.1)' : 'transparent',
              color: activeTab === 'social' ? 'var(--primary)' : 'var(--text-primary)',
              borderRadius: 0,
            }}
            onClick={() => setActiveTab('social')}
          >
            Social Link Hub
          </button>
          <button
            className={`btn btn--ghost`}
            style={{
              width: '100%',
              textAlign: 'left',
              justifyContent: 'flex-start',
              padding: 'var(--space-md) var(--space-lg)',
              background: activeTab === 'config' ? 'rgba(255, 69, 0, 0.1)' : 'transparent',
              color: activeTab === 'config' ? 'var(--primary)' : 'var(--text-primary)',
              borderRadius: 0,
            }}
            onClick={() => setActiveTab('config')}
          >
            Site Settings
          </button>
        </nav>

        <div style={{ marginTop: 'auto', padding: 'var(--space-lg)' }}>
          <button className="btn btn--outline" style={{ width: '100%', borderColor: 'var(--secondary)', color: 'var(--secondary)' }} onClick={handleLogout}>
            Log Out
          </button>
        </div>
      </aside>

      {/* Main Admin Content */}
      <main className="admin-content" style={{ padding: 'var(--space-2xl)' }}>
        {/* ─── GALLERY MANAGER TAB ────────────────────────────────────────── */}
        {activeTab === 'gallery' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-xl)' }}>
              <h1 className="admin-card__title" style={{ fontSize: 'var(--text-2xl)', margin: 0 }}>
                GALLERY MANAGER
              </h1>
              <button className="btn btn--primary" onClick={() => setActiveTab('upload')}>
                + Upload Artwork
              </button>
            </div>

            {editingArtwork ? (
              <div className="admin-card" style={{ marginBottom: 'var(--space-xl)' }}>
                <h3 className="admin-card__title">EDIT ARTWORK: {editingArtwork.title}</h3>
                <form onSubmit={handleSaveEdit}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
                    <div className="form-group">
                      <label className="form-label">Title</label>
                      <input
                        className="form-input"
                        type="text"
                        value={editData.title}
                        onChange={(e) => setEditData((prev) => ({ ...prev, title: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Category</label>
                      <select
                        className="form-select"
                        value={editData.category}
                        onChange={(e) => setEditData((prev) => ({ ...prev, category: e.target.value }))}
                      >
                        <option value="Illustrations">Illustrations</option>
                        <option value="Character Design">Character Design</option>
                        <option value="Commissions">Commissions</option>
                        <option value="Sketches">Sketches</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Description</label>
                    <textarea
                      className="form-textarea"
                      value={editData.description}
                      onChange={(e) => setEditData((prev) => ({ ...prev, description: e.target.value }))}
                      rows={3}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-md)' }}>
                    <div className="form-group">
                      <label className="form-label">Tags (comma separated)</label>
                      <input
                        className="form-input"
                        type="text"
                        value={editData.tags}
                        placeholder="e.g. original, cute, bunny"
                        onChange={(e) => setEditData((prev) => ({ ...prev, tags: e.target.value }))}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Display Order</label>
                      <input
                        className="form-input"
                        type="number"
                        value={editData.order}
                        onChange={(e) => setEditData((prev) => ({ ...prev, order: Number(e.target.value) }))}
                      />
                    </div>
                  </div>

                  <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                    <input
                      type="checkbox"
                      id="edit-featured"
                      checked={editData.featured}
                      onChange={(e) => setEditData((prev) => ({ ...prev, featured: e.target.checked }))}
                    />
                    <label htmlFor="edit-featured" className="form-label" style={{ margin: 0, cursor: 'pointer' }}>
                      Feature on Home Page Carousel
                    </label>
                  </div>

                  <div style={{ display: 'flex', gap: 'var(--space-md)', marginTop: 'var(--space-md)' }}>
                    <button className="btn btn--primary" type="submit" disabled={isSavingArtwork}>
                      {isSavingArtwork ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button className="btn btn--outline" type="button" onClick={() => setEditingArtwork(null)}>
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            ) : null}

            <div className="admin-card">
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--dark-border)', color: 'var(--text-secondary)' }}>
                      <th style={{ padding: 'var(--space-md)' }}>Thumbnail</th>
                      <th style={{ padding: 'var(--space-md)' }}>Title</th>
                      <th style={{ padding: 'var(--space-md)' }}>Category</th>
                      <th style={{ padding: 'var(--space-md)' }}>Order</th>
                      <th style={{ padding: 'var(--space-md)' }}>Featured</th>
                      <th style={{ padding: 'var(--space-md)' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {artworks.map((art) => (
                      <tr key={art.id} style={{ borderBottom: '1px solid var(--dark-border)' }}>
                        <td style={{ padding: 'var(--space-md)' }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={art.imageUrl}
                            alt={art.title}
                            style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }}
                          />
                        </td>
                        <td style={{ padding: 'var(--space-md)', fontWeight: 500 }}>{art.title}</td>
                        <td style={{ padding: 'var(--space-md)' }}>
                          <span className="gallery__tag">{art.category}</span>
                        </td>
                        <td style={{ padding: 'var(--space-md)' }}>{art.order}</td>
                        <td style={{ padding: 'var(--space-md)' }}>{art.featured ? '⭐️ Yes' : 'No'}</td>
                        <td style={{ padding: 'var(--space-md)' }}>
                          <div style={{ display: 'flex', gap: 'var(--space-xs)' }}>
                            <button className="btn btn--outline" style={{ padding: '4px 12px', fontSize: 'var(--text-sm)' }} onClick={() => handleStartEdit(art)}>
                              Edit
                            </button>
                            <button
                              className="btn btn--outline"
                              style={{ padding: '4px 12px', fontSize: 'var(--text-sm)', borderColor: 'var(--secondary)', color: 'var(--secondary)' }}
                              onClick={() => handleDeleteArtwork(art.id)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {artworks.length === 0 && (
                      <tr>
                        <td colSpan={6} style={{ padding: 'var(--space-xl)', textAlign: 'center', color: 'var(--text-muted)' }}>
                          No artworks in the database. Upload some!
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ─── UPLOAD NEW ART TAB ────────────────────────────────────────── */}
        {activeTab === 'upload' && (
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h1 className="admin-card__title" style={{ fontSize: 'var(--text-2xl)', marginBottom: 'var(--space-xl)' }}>
              UPLOAD NEW ARTWORK
            </h1>

            <div className="admin-card">
              <form onSubmit={handleUploadSubmit}>
                {/* Drag and Drop Zone */}
                <div
                  className={`upload-zone ${isDragOver ? 'drag-over' : ''}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  style={{ cursor: 'pointer' }}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                    accept="image/*"
                  />
                  {uploadPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={uploadPreview}
                      alt="Preview"
                      style={{ maxHeight: '250px', maxWidth: '100%', objectFit: 'contain', borderRadius: 'var(--radius-md)' }}
                    />
                  ) : (
                    <>
                      <div className="upload-zone__icon">📤</div>
                      <p className="upload-zone__text">Drag and drop your artwork image, or click to browse</p>
                      <p className="upload-zone__subtext">Supports PNG, JPEG, GIF, WebP, AVIF</p>
                    </>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)', marginTop: 'var(--space-lg)' }}>
                  <div className="form-group">
                    <label className="form-label">Artwork Title</label>
                    <input
                      className="form-input"
                      type="text"
                      placeholder="e.g. Crimson Cyber OC"
                      value={uploadData.title}
                      onChange={(e) => setUploadData((prev) => ({ ...prev, title: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <select
                      className="form-select"
                      value={uploadData.category}
                      onChange={(e) => setUploadData((prev) => ({ ...prev, category: e.target.value }))}
                    >
                      <option value="Illustrations">Illustrations</option>
                      <option value="Character Design">Character Design</option>
                      <option value="Commissions">Commissions</option>
                      <option value="Sketches">Sketches</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-textarea"
                    placeholder="Provide a description, context, or notes about the process."
                    value={uploadData.description}
                    onChange={(e) => setUploadData((prev) => ({ ...prev, description: e.target.value }))}
                    rows={4}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-md)' }}>
                  <div className="form-group">
                    <label className="form-label">Tags (comma separated)</label>
                    <input
                      className="form-input"
                      type="text"
                      placeholder="e.g. original, cyberpunk, red, fullbody"
                      value={uploadData.tags}
                      onChange={(e) => setUploadData((prev) => ({ ...prev, tags: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Display Order</label>
                    <input
                      className="form-input"
                      type="number"
                      value={uploadData.order}
                      onChange={(e) => setUploadData((prev) => ({ ...prev, order: Number(e.target.value) }))}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', margin: 'var(--space-md) 0' }}>
                  <input
                    type="checkbox"
                    id="featured"
                    checked={uploadData.featured}
                    onChange={(e) => setUploadData((prev) => ({ ...prev, featured: e.target.checked }))}
                  />
                  <label htmlFor="featured" className="form-label" style={{ margin: 0, cursor: 'pointer' }}>
                    Feature on Home Page Carousel
                  </label>
                </div>

                <button
                  className="btn btn--primary"
                  type="submit"
                  style={{ width: '100%' }}
                  disabled={isUploading || !uploadFile}
                >
                  {isUploading ? 'UPLOADING...' : 'UPLOAD ARTWORK'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ─── SOCIAL LINKS TAB ────────────────────────────────────────────── */}
        {activeTab === 'social' && (
          <div>
            <h1 className="admin-card__title" style={{ fontSize: 'var(--text-2xl)', marginBottom: 'var(--space-xl)' }}>
              SOCIAL LINK HUB
            </h1>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 'var(--space-lg)', alignItems: 'start' }}>
              {/* Add/Edit Link Card */}
              <div className="admin-card">
                {editingSocial ? (
                  <>
                    <h3 className="admin-card__title">EDIT SOCIAL BUTTON</h3>
                    <form onSubmit={handleSaveEditSocial}>
                      <div className="form-group">
                        <label className="form-label">Platform</label>
                        <select
                          className="form-select"
                          value={editSocialData.platform}
                          onChange={(e) => setEditSocialData((prev) => ({ ...prev, platform: e.target.value }))}
                        >
                          <option value="twitter">X / Twitter</option>
                          <option value="pixiv">Pixiv</option>
                          <option value="instagram">Instagram</option>
                          <option value="youtube">YouTube</option>
                          <option value="tiktok">TikTok</option>
                          <option value="twitch">Twitch</option>
                          <option value="discord">Discord</option>
                          <option value="deviantart">DeviantArt</option>
                          <option value="artstation">ArtStation</option>
                          <option value="kofi">Ko-fi</option>
                          <option value="patreon">Patreon</option>
                          <option value="email">Email</option>
                          <option value="website">Website</option>
                          <option value="bluesky">Bluesky</option>
                          <option value="threads">Threads</option>
                          <option value="github">GitHub</option>
                          <option value="linkedin">LinkedIn</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Destination URL</label>
                        <input
                          className="form-input"
                          type="url"
                          placeholder="https://..."
                          value={editSocialData.url}
                          onChange={(e) => setEditSocialData((prev) => ({ ...prev, url: e.target.value }))}
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Display Label (Optional)</label>
                        <input
                          className="form-input"
                          type="text"
                          placeholder="e.g. Pixiv Portfolio"
                          value={editSocialData.label}
                          onChange={(e) => setEditSocialData((prev) => ({ ...prev, label: e.target.value }))}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Handle / Subtext (Optional)</label>
                        <input
                          className="form-input"
                          type="text"
                          placeholder="e.g. @ishiro_art"
                          value={editSocialData.handle}
                          onChange={(e) => setEditSocialData((prev) => ({ ...prev, handle: e.target.value }))}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Order</label>
                        <input
                          className="form-input"
                          type="number"
                          value={editSocialData.order}
                          onChange={(e) => setEditSocialData((prev) => ({ ...prev, order: Number(e.target.value) }))}
                        />
                      </div>

                      <div style={{ display: 'flex', gap: 'var(--space-sm)', marginTop: 'var(--space-md)' }}>
                        <button className="btn btn--primary" style={{ flex: 1 }} type="submit" disabled={isSavingSocial}>
                          {isSavingSocial ? 'Saving...' : 'Save Changes'}
                        </button>
                        <button className="btn btn--outline" style={{ flex: 1 }} type="button" onClick={() => setEditingSocial(null)}>
                          Cancel
                        </button>
                      </div>
                    </form>
                  </>
                ) : (
                  <>
                    <h3 className="admin-card__title">ADD NEW BUTTON</h3>
                    <form onSubmit={handleAddSocial}>
                      <div className="form-group">
                        <label className="form-label">Platform</label>
                        <select
                          className="form-select"
                          value={newSocial.platform}
                          onChange={(e) => setNewSocial((prev) => ({ ...prev, platform: e.target.value }))}
                        >
                          <option value="twitter">X / Twitter</option>
                          <option value="pixiv">Pixiv</option>
                          <option value="instagram">Instagram</option>
                          <option value="youtube">YouTube</option>
                          <option value="tiktok">TikTok</option>
                          <option value="twitch">Twitch</option>
                          <option value="discord">Discord</option>
                          <option value="deviantart">DeviantArt</option>
                          <option value="artstation">ArtStation</option>
                          <option value="kofi">Ko-fi</option>
                          <option value="patreon">Patreon</option>
                          <option value="email">Email</option>
                          <option value="website">Website</option>
                          <option value="bluesky">Bluesky</option>
                          <option value="threads">Threads</option>
                          <option value="github">GitHub</option>
                          <option value="linkedin">LinkedIn</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Destination URL</label>
                        <input
                          className="form-input"
                          type="url"
                          placeholder="https://..."
                          value={newSocial.url}
                          onChange={(e) => setNewSocial((prev) => ({ ...prev, url: e.target.value }))}
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Display Label (Optional)</label>
                        <input
                          className="form-input"
                          type="text"
                          placeholder="e.g. Pixiv Portfolio"
                          value={newSocial.label}
                          onChange={(e) => setNewSocial((prev) => ({ ...prev, label: e.target.value }))}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Handle / Subtext (Optional)</label>
                        <input
                          className="form-input"
                          type="text"
                          placeholder="e.g. @ishiro_art"
                          value={newSocial.handle}
                          onChange={(e) => setNewSocial((prev) => ({ ...prev, handle: e.target.value }))}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Order</label>
                        <input
                          className="form-input"
                          type="number"
                          value={newSocial.order}
                          onChange={(e) => setNewSocial((prev) => ({ ...prev, order: Number(e.target.value) }))}
                        />
                      </div>

                      <button className="btn btn--primary" style={{ width: '100%', marginTop: 'var(--space-md)' }} type="submit" disabled={isAddingSocial}>
                        {isAddingSocial ? 'Adding...' : 'Add Social Button'}
                      </button>
                    </form>
                  </>
                )}
              </div>

              {/* Active Links Grid */}
              <div className="admin-card">
                <h3 className="admin-card__title">ACTIVE SOCIAL BUTTONS</h3>
                <div style={{ display: 'grid', gap: 'var(--space-sm)' }}>
                  {socialLinks.map((link) => (
                    <div
                      key={link.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: 'var(--dark-elevated)',
                        padding: 'var(--space-md) var(--space-lg)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--dark-border)',
                      }}
                    >
                      <div>
                        <span
                          style={{
                            textTransform: 'uppercase',
                            fontSize: 'var(--text-xs)',
                            fontWeight: 'bold',
                            color: 'var(--primary)',
                            marginRight: 'var(--space-md)',
                          }}
                        >
                          {link.platform}
                        </span>
                        <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                          {link.label ?? link.platform}
                        </span>
                        {link.handle && (
                          <span style={{ marginLeft: 'var(--space-sm)', fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
                            ({link.handle})
                          </span>
                        )}
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: '2px', wordBreak: 'break-all' }}>
                          {link.url}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                        <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', marginRight: 'var(--space-xs)' }}>Order: {link.order}</span>
                        <button
                          className="btn btn--outline"
                          style={{
                            padding: '4px 12px',
                            fontSize: 'var(--text-sm)',
                          }}
                          onClick={() => handleStartEditSocial(link)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn--outline"
                          style={{
                            padding: '4px 12px',
                            fontSize: 'var(--text-sm)',
                            borderColor: 'var(--secondary)',
                            color: 'var(--secondary)',
                          }}
                          onClick={() => handleDeleteSocial(link.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                  {socialLinks.length === 0 && (
                    <div style={{ textAlign: 'center', padding: 'var(--space-xl)', color: 'var(--text-muted)' }}>
                      No social links added yet.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── SITE CONFIG TAB ─────────────────────────────────────────────── */}
        {activeTab === 'config' && (
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h1 className="admin-card__title" style={{ fontSize: 'var(--text-2xl)', marginBottom: 'var(--space-xl)' }}>
              SITE CONFIGURATION
            </h1>

            <div className="admin-card">
              <form onSubmit={handleConfigSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
                  <div className="form-group">
                    <label className="form-label">Artist Display Name</label>
                    <input
                      className="form-input"
                      type="text"
                      value={configData.artistName}
                      onChange={(e) => setConfigData((prev) => ({ ...prev, artistName: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Artist Subtitle / Tagline</label>
                    <input
                      className="form-input"
                      type="text"
                      value={configData.tagline}
                      onChange={(e) => setConfigData((prev) => ({ ...prev, tagline: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Contact Email Address</label>
                  <input
                    className="form-input"
                    type="email"
                    value={configData.email}
                    onChange={(e) => setConfigData((prev) => ({ ...prev, email: e.target.value }))}
                    placeholder="artist@example.com"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Profile Biography / Tagline Detail (Markdown supported)</label>
                  <textarea
                    className="form-textarea"
                    value={configData.bio}
                    onChange={(e) => setConfigData((prev) => ({ ...prev, bio: e.target.value }))}
                    rows={4}
                    placeholder="Write a short introduction, status, commission details..."
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Detailed "About" Description</label>
                  <textarea
                    className="form-textarea"
                    value={configData.aboutText}
                    onChange={(e) => setConfigData((prev) => ({ ...prev, aboutText: e.target.value }))}
                    rows={4}
                    placeholder="Drawing since childhood, now creating art full-time..."
                  />
                </div>

                <div style={{ margin: 'var(--space-md) 0 var(--space-lg) 0' }}>
                  <h3 style={{ fontSize: 'var(--text-sm)', marginBottom: 'var(--space-sm)', textTransform: 'uppercase', fontFamily: 'var(--font-heading)', color: 'var(--text-secondary)' }}>
                    Statistics (Homepage About Section)
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-md)' }}>
                    {/* Stat 1 */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)', padding: 'var(--space-sm)', border: '1px solid var(--dark-border)', borderRadius: 'var(--radius-sm)', background: 'var(--dark-elevated)' }}>
                      <label className="form-label" style={{ fontSize: 'var(--text-xs)', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Stat 1</label>
                      <input
                        className="form-input"
                        type="text"
                        value={configData.stat1Value}
                        onChange={(e) => setConfigData((prev) => ({ ...prev, stat1Value: e.target.value }))}
                        placeholder="Value (e.g. 1.2K+)"
                        style={{ padding: '6px', fontSize: 'var(--text-sm)' }}
                      />
                      <input
                        className="form-input"
                        type="text"
                        value={configData.stat1Label}
                        onChange={(e) => setConfigData((prev) => ({ ...prev, stat1Label: e.target.value }))}
                        placeholder="Label (e.g. Followers)"
                        style={{ padding: '6px', fontSize: 'var(--text-sm)' }}
                      />
                    </div>
                    {/* Stat 2 */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)', padding: 'var(--space-sm)', border: '1px solid var(--dark-border)', borderRadius: 'var(--radius-sm)', background: 'var(--dark-elevated)' }}>
                      <label className="form-label" style={{ fontSize: 'var(--text-xs)', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Stat 2</label>
                      <input
                        className="form-input"
                        type="text"
                        value={configData.stat2Value}
                        onChange={(e) => setConfigData((prev) => ({ ...prev, stat2Value: e.target.value }))}
                        placeholder="Value (empty = dynamic)"
                        style={{ padding: '6px', fontSize: 'var(--text-sm)' }}
                      />
                      <input
                        className="form-input"
                        type="text"
                        value={configData.stat2Label}
                        onChange={(e) => setConfigData((prev) => ({ ...prev, stat2Label: e.target.value }))}
                        placeholder="Label (e.g. Artworks)"
                        style={{ padding: '6px', fontSize: 'var(--text-sm)' }}
                      />
                    </div>
                    {/* Stat 3 */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)', padding: 'var(--space-sm)', border: '1px solid var(--dark-border)', borderRadius: 'var(--radius-sm)', background: 'var(--dark-elevated)' }}>
                      <label className="form-label" style={{ fontSize: 'var(--text-xs)', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Stat 3</label>
                      <input
                        className="form-input"
                        type="text"
                        value={configData.stat3Value}
                        onChange={(e) => setConfigData((prev) => ({ ...prev, stat3Value: e.target.value }))}
                        placeholder="Value (e.g. ∞)"
                        style={{ padding: '6px', fontSize: 'var(--text-sm)' }}
                      />
                      <input
                        className="form-input"
                        type="text"
                        value={configData.stat3Label}
                        onChange={(e) => setConfigData((prev) => ({ ...prev, stat3Label: e.target.value }))}
                        placeholder="Label (e.g. Passion)"
                        style={{ padding: '6px', fontSize: 'var(--text-sm)' }}
                      />
                    </div>
                  </div>
                </div>

                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
                  <div className="form-group">
                    <label className="form-label">Avatar Image</label>
                    <div style={{ display: 'flex', gap: 'var(--space-md)', alignItems: 'center' }}>
                      {configData.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={configData.avatarUrl}
                          alt="Avatar Preview"
                          style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--dark-border)' }}
                        />
                      ) : (
                        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--dark-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'var(--text-lg)', border: '1px solid var(--dark-border)' }}>👤</div>
                      )}
                      <div style={{ flex: 1 }}>
                        <input
                          className="form-input"
                          type="text"
                          value={configData.avatarUrl}
                          onChange={(e) => setConfigData((prev) => ({ ...prev, avatarUrl: e.target.value }))}
                          placeholder="e.g. /uploads/avatar.png"
                          style={{ marginBottom: 'var(--space-xs)' }}
                        />
                        <input
                          type="file"
                          ref={avatarInputRef}
                          onChange={handleAvatarUpload}
                          accept="image/*"
                          style={{ display: 'none' }}
                        />
                        <button
                          type="button"
                          className="btn btn--outline"
                          style={{ padding: '4px 12px', fontSize: 'var(--text-xs)' }}
                          onClick={() => avatarInputRef.current?.click()}
                          disabled={isUploadingAvatar}
                        >
                          {isUploadingAvatar ? 'Uploading...' : 'Upload Avatar'}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Hero Cover Image (Optional)</label>
                    <div style={{ display: 'flex', gap: 'var(--space-md)', alignItems: 'center' }}>
                      {configData.heroImageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={configData.heroImageUrl}
                          alt="Hero Cover Preview"
                          style={{ width: '100px', height: '56px', borderRadius: 'var(--radius-sm)', objectFit: 'cover', border: '1px solid var(--dark-border)' }}
                        />
                      ) : (
                        <div style={{ width: '100px', height: '56px', borderRadius: 'var(--radius-sm)', background: 'var(--dark-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'var(--text-md)', border: '1px solid var(--dark-border)', color: 'var(--text-muted)' }}>No Cover</div>
                      )}
                      <div style={{ flex: 1 }}>
                        <input
                          className="form-input"
                          type="text"
                          value={configData.heroImageUrl}
                          onChange={(e) => setConfigData((prev) => ({ ...prev, heroImageUrl: e.target.value }))}
                          placeholder="e.g. /uploads/hero.png"
                          style={{ marginBottom: 'var(--space-xs)' }}
                        />
                        <input
                          type="file"
                          ref={heroInputRef}
                          onChange={handleHeroUpload}
                          accept="image/*"
                          style={{ display: 'none' }}
                        />
                        <button
                          type="button"
                          className="btn btn--outline"
                          style={{ padding: '4px 12px', fontSize: 'var(--text-xs)' }}
                          onClick={() => heroInputRef.current?.click()}
                          disabled={isUploadingHero}
                        >
                          {isUploadingHero ? 'Uploading...' : 'Upload Cover'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <button className="btn btn--primary" style={{ width: '100%', marginTop: 'var(--space-md)' }} type="submit" disabled={isSavingConfig}>
                  {isSavingConfig ? 'Saving...' : 'Save Settings'}
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
