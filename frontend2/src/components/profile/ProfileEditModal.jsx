import { useState } from "react";
import { X, User, MapPin, Link2, FileText, Image, Loader2, Check } from "lucide-react";
import Button from "../common/Button";

const AVATAR_PRESETS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80",
];

export default function ProfileEditModal({ user, isOpen, onClose, onSave }) {
  const [name, setName] = useState(user?.name || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [location, setLocation] = useState(user?.location || "");
  const [website, setWebsite] = useState(user?.website || "");
  const [avatar, setAvatar] = useState(user?.avatar || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    name || user?.username || "Dev"
  )}&background=238636&color=fff&size=128`;

  const currentAvatar = avatar.trim() || defaultAvatar;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await onSave({
        name: name.trim(),
        bio: bio.trim(),
        location: location.trim(),
        website: website.trim(),
        avatar: avatar.trim()
      });
      onClose();
    } catch (err) {
      setError(err.message || "Failed to update profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div
        className="relative w-full max-w-lg rounded-2xl border border-border bg-canvas-subtle p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div className="flex items-center gap-2">
            <User size={20} className="text-accent-green" />
            <h2 className="text-lg font-semibold text-fg">Edit Profile</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-fg-muted hover:bg-canvas hover:text-fg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-lg bg-red-950/40 border border-red-800 p-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Avatar Preview & Presets */}
          <div>
            <label className="block text-xs font-medium text-fg-muted mb-2">
              Profile Avatar
            </label>
            <div className="flex items-center gap-4">
              <img
                src={currentAvatar}
                alt="Avatar preview"
                className="h-16 w-16 rounded-full border-2 border-accent-green object-cover bg-canvas shadow-inner"
                onError={(e) => {
                  e.currentTarget.src = defaultAvatar;
                }}
              />
              <div className="flex-1">
                <div className="relative">
                  <Image
                    size={15}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-subtle"
                  />
                  <input
                    type="url"
                    value={avatar}
                    onChange={(e) => setAvatar(e.target.value)}
                    placeholder="Custom image URL..."
                    className="input-field pl-9 text-xs"
                  />
                </div>
                <p className="mt-1 text-[11px] text-fg-subtle">
                  Or pick a preset avatar below:
                </p>
              </div>
            </div>

            {/* Avatar presets */}
            <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
              {AVATAR_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setAvatar(preset)}
                  className={`relative h-9 w-9 shrink-0 rounded-full border-2 transition-all ${
                    avatar === preset ? "border-accent-green scale-105" : "border-border hover:border-fg-muted"
                  }`}
                >
                  <img
                    src={preset}
                    alt={`Preset ${idx + 1}`}
                    className="h-full w-full rounded-full object-cover"
                  />
                  {avatar === preset && (
                    <span className="absolute inset-0 flex items-center justify-center rounded-full bg-accent-green/60 text-white">
                      <Check size={12} strokeWidth={3} />
                    </span>
                  )}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setAvatar("")}
                className={`px-2 text-[10px] rounded-lg border border-border text-fg-muted hover:text-fg hover:bg-canvas transition-colors ${
                  !avatar ? "border-accent-green text-accent-green" : ""
                }`}
              >
                Default
              </button>
            </div>
          </div>

          {/* Full Name */}
          <div>
            <label htmlFor="edit-name" className="block text-xs font-medium text-fg-muted mb-1.5">
              Full Name
            </label>
            <div className="relative">
              <User
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-subtle"
              />
              <input
                id="edit-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Vivek Kumar"
                className="input-field pl-9 text-sm"
              />
            </div>
          </div>

          {/* Bio / Description */}
          <div>
            <label htmlFor="edit-bio" className="block text-xs font-medium text-fg-muted mb-1.5">
              Bio / Description
            </label>
            <div className="relative">
              <FileText
                size={15}
                className="pointer-events-none absolute left-3 top-3 text-fg-subtle"
              />
              <textarea
                id="edit-bio"
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us a little about yourself, what you build, or what interests you..."
                className="input-field pl-9 text-sm resize-none"
              />
            </div>
          </div>

          {/* Location & Website Grid */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="edit-location" className="block text-xs font-medium text-fg-muted mb-1.5">
                Location
              </label>
              <div className="relative">
                <MapPin
                  size={15}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-subtle"
                />
                <input
                  id="edit-location"
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. San Francisco, CA"
                  className="input-field pl-9 text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="edit-website" className="block text-xs font-medium text-fg-muted mb-1.5">
                Website / Social
              </label>
              <div className="relative">
                <Link2
                  size={15}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-subtle"
                />
                <input
                  id="edit-website"
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://yourportfolio.com"
                  className="input-field pl-9 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={loading}
              className="min-w-[100px]"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin mr-1.5" />
                  Saving...
                </>
              ) : (
                "Save changes"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
