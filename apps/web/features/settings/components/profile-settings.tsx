'use client';

import { Button } from '@modus/ui';
import { Camera, Mail, Shield, User } from 'lucide-react';
import { useState, useEffect } from 'react';

interface Agent {
  id: string;
  user_id: string;
  display_name: string;
  avatar_url?: string | null;
  role: 'agent' | 'supervisor' | 'admin' | 'moderator';
  status: 'online' | 'offline' | 'busy';
  last_active_at: string;
  created_at: string;
}

interface ProfileSettingsProps {
  agent: Agent | null;
  onUpdateAgent: (agentId: string, updates: Partial<Agent>) => Promise<void>;
}

export function ProfileSettings({ agent, onUpdateAgent }: ProfileSettingsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    display_name: agent?.display_name || '',
    avatar_url: agent?.avatar_url || '',
  });
  const [errors, setErrors] = useState<{ display_name?: string; avatar_url?: string }>({});

  // Sync formData when agent prop changes (e.g., after successful update)
  useEffect(() => {
    if (agent) {
      setFormData({
        display_name: agent.display_name,
        avatar_url: agent.avatar_url || '',
      });
    }
  }, [agent]);

  const handleSave = async () => {
    if (!agent) return;

    // Validation
    const newErrors: typeof errors = {};
    if (!formData.display_name.trim()) {
      newErrors.display_name = 'Display name is required';
    } else if (formData.display_name.trim().length < 2) {
      newErrors.display_name = 'Display name must be at least 2 characters';
    } else if (formData.display_name.trim().length > 50) {
      newErrors.display_name = 'Display name must not exceed 50 characters';
    }

    if (formData.avatar_url && !isValidUrl(formData.avatar_url)) {
      newErrors.avatar_url = 'Please enter a valid URL';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    try {
      await onUpdateAgent(agent.id, {
        display_name: formData.display_name.trim(),
        avatar_url: formData.avatar_url ? formData.avatar_url.trim() : null,
      });
      setIsEditing(false);
      setErrors({});
    } catch (error) {
      console.error('Failed to update profile:', error);
      setErrors({ display_name: 'Failed to update profile. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      display_name: agent?.display_name || '',
      avatar_url: agent?.avatar_url || '',
    });
    setErrors({});
    setIsEditing(false);
  };

  const isValidUrl = (string: string): boolean => {
    try {
      new URL(string);
      return true;
    } catch {
      return false;
    }
  };

  if (!agent) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <p>Loading profile...</p>
      </div>
    );
  }

  const roleColors = {
    agent: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    supervisor: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    admin: 'bg-red-500/10 text-red-400 border-red-500/20',
    moderator: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  };

  return (
    <div className="max-w-3xl mx-auto" data-testid="profile-settings">
      {/* Profile Header Card */}
      <div className="bg-background-secondary rounded-lg border border-border p-6 mb-6">
        <div className="flex items-start justify-between mb-6">
          <h2 className="text-xl font-semibold text-foreground">Profile Information</h2>
          {!isEditing ? (
            <Button
              onClick={() => setIsEditing(true)}
              variant="outline"
              size="default"
              data-testid="edit-profile-button"
            >
              Edit Profile
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                onClick={handleCancel}
                variant="outline"
                size="default"
                disabled={isLoading}
                data-testid="cancel-profile-button"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                variant="default"
                size="default"
                disabled={isLoading}
                data-testid="save-profile-button"
              >
                {isLoading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          )}
        </div>

        {/* Avatar Section */}
        <div className="flex items-center gap-6 mb-6">
          <div
            className="relative w-24 h-24 rounded-full bg-background-tertiary border-2 border-border flex items-center justify-center overflow-hidden group"
            data-testid="avatar-display"
          >
            {agent.avatar_url ? (
              <img
                src={agent.avatar_url}
                alt={agent.display_name}
                className="w-full h-full object-cover"
                data-testid="avatar-image"
              />
            ) : (
              <User size={40} className="text-muted-foreground" data-testid="avatar-placeholder" />
            )}
            {isEditing && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera size={24} className="text-white" />
              </div>
            )}
          </div>

          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground mb-1">{agent.display_name}</h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail size={14} />
              <span data-testid="user-id">{agent.user_id}</span>
            </div>
            <div className="mt-2">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${roleColors[agent.role]}`}
                data-testid="role-badge"
              >
                <Shield size={12} />
                {agent.role.charAt(0).toUpperCase() + agent.role.slice(1)}
              </span>
            </div>
          </div>
        </div>

        {/* Form Fields */}
        <div className="space-y-4">
          {/* Display Name */}
          <div>
            <label
              htmlFor="display-name"
              className="block text-sm font-medium text-foreground mb-2"
            >
              Display Name <span className="text-red-400">*</span>
            </label>
            {isEditing ? (
              <>
                <input
                  id="display-name"
                  type="text"
                  value={formData.display_name}
                  onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                  disabled={isLoading}
                  className={`w-full px-3 py-2 bg-background border rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-colors ${
                    errors.display_name
                      ? 'border-red-400 focus:ring-red-400'
                      : 'border-border focus:ring-primary'
                  }`}
                  placeholder="Enter your display name"
                  data-testid="display-name-input"
                  maxLength={50}
                />
                {errors.display_name && (
                  <p className="text-xs text-red-400 mt-1.5" data-testid="display-name-error">
                    {errors.display_name}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1.5">
                  {formData.display_name.length}/50 characters
                </p>
              </>
            ) : (
              <div
                className="px-3 py-2 bg-background-tertiary rounded-md text-sm text-foreground"
                data-testid="display-name-display"
              >
                {agent.display_name}
              </div>
            )}
          </div>

          {/* Avatar URL */}
          <div>
            <label htmlFor="avatar-url" className="block text-sm font-medium text-foreground mb-2">
              Avatar URL
            </label>
            {isEditing ? (
              <>
                <input
                  id="avatar-url"
                  type="url"
                  value={formData.avatar_url}
                  onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
                  disabled={isLoading}
                  className={`w-full px-3 py-2 bg-background border rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-colors ${
                    errors.avatar_url
                      ? 'border-red-400 focus:ring-red-400'
                      : 'border-border focus:ring-primary'
                  }`}
                  placeholder="https://example.com/avatar.jpg"
                  data-testid="avatar-url-input"
                />
                {errors.avatar_url && (
                  <p className="text-xs text-red-400 mt-1.5" data-testid="avatar-url-error">
                    {errors.avatar_url}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1.5">
                  Enter a URL for your profile image. Leave empty to use default avatar.
                </p>
              </>
            ) : (
              <div
                className="px-3 py-2 bg-background-tertiary rounded-md text-sm text-foreground break-all"
                data-testid="avatar-url-display"
              >
                {agent.avatar_url || <span className="text-muted-foreground">No avatar set</span>}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Account Information */}
      <div className="bg-background-secondary rounded-lg border border-border p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Account Information</h3>
        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between py-2 border-b border-border">
            <span className="text-muted-foreground">Agent ID</span>
            <span className="text-foreground font-mono" data-testid="agent-id">
              {agent.id}
            </span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-border">
            <span className="text-muted-foreground">Status</span>
            <span className="text-foreground capitalize" data-testid="agent-status">
              {agent.status}
            </span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-border">
            <span className="text-muted-foreground">Member Since</span>
            <span className="text-foreground" data-testid="created-at">
              {new Date(agent.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-muted-foreground">Last Active</span>
            <span className="text-foreground" data-testid="last-active">
              {new Date(agent.last_active_at).toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
