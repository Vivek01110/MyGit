import { MapPin, Link2, Pencil, Calendar, Mail, UserCheck } from "lucide-react";
import Button from "../common/Button";

export default function ProfileHeader({ user, isOwner = false, onEditClick }) {
  const displayName = user?.name || user?.username || "Developer";
  const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    displayName
  )}&background=238636&color=fff&size=128`;

  const avatarUrl = user?.avatar || defaultAvatar;

  // Format joined date
  const formattedJoinDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric"
      })
    : user?.joinDate || "Member";

  return (
    <div className="card-surface p-6 rounded-2xl border border-border shadow-sm">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
        {/* Avatar */}
        <div className="relative mx-auto shrink-0 sm:mx-0">
          <img
            src={avatarUrl}
            alt={displayName}
            className="h-28 w-28 rounded-full border-4 border-canvas object-cover shadow-lg ring-2 ring-border"
            onError={(e) => {
              e.currentTarget.src = defaultAvatar;
            }}
          />
          {isOwner && (
            <span
              title="Your profile"
              className="absolute bottom-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-accent-green text-white shadow-md"
            >
              <UserCheck size={14} />
            </span>
          )}
        </div>

        {/* User Details */}
        <div className="min-w-0 flex-1 text-center sm:text-left">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h1 className="text-2xl font-bold text-fg">
                  {displayName}
                </h1>
                {user?.name && (
                  <span className="text-sm font-normal text-fg-muted">
                    (@{user.username})
                  </span>
                )}
              </div>

              {!user?.name && (
                <p className="text-sm text-fg-muted">
                  @{user?.username}
                </p>
              )}
            </div>

            {/* Edit Profile Button (if Owner) */}
            {isOwner && (
              <Button
                variant="secondary"
                size="sm"
                icon={Pencil}
                onClick={onEditClick}
                className="self-center sm:self-auto"
              >
                Edit Profile
              </Button>
            )}
          </div>

          {/* Bio / Description */}
          {user?.bio ? (
            <p className="mt-3 text-sm text-fg leading-relaxed">
              {user.bio}
            </p>
          ) : isOwner ? (
            <p className="mt-3 text-sm text-fg-subtle italic">
              No bio yet. Click "Edit Profile" to add a short description about yourself!
            </p>
          ) : null}

          {/* Metadata Row */}
          <div className="mt-4 flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-fg-muted">
            {user?.email && (
              <span className="flex items-center gap-1.5">
                <Mail size={14} className="text-fg-subtle" />
                {user.email}
              </span>
            )}

            {user?.location && (
              <span className="flex items-center gap-1.5">
                <MapPin size={14} className="text-fg-subtle" />
                {user.location}
              </span>
            )}

            {user?.website && (
              <a
                href={user.website.startsWith("http") ? user.website : `https://${user.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-accent-blue hover:underline"
              >
                <Link2 size={14} />
                {user.website.replace(/^https?:\/\//, "")}
              </a>
            )}

            <span className="flex items-center gap-1.5 text-fg-subtle">
              <Calendar size={14} />
              Joined {formattedJoinDate}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}