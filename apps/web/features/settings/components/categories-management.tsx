'use client';

import { Button } from '@modus/ui';
import {
  ArrowDown,
  ArrowUp,
  Edit,
  Folder,
  Plus,
  Save,
  Trash2,
  X,
} from 'lucide-react';
import { useState } from 'react';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string;
  icon: string | null;
  position: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface CategoriesManagementProps {
  initialCategories?: Category[];
}

export function CategoriesManagement({
  initialCategories = [],
}: CategoriesManagementProps) {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    color: '#6366f1',
    icon: 'Tag',
    is_active: true,
  });

  // Color presets
  const colorPresets = [
    '#ef4444', // Red
    '#f97316', // Orange
    '#eab308', // Yellow
    '#22c55e', // Green
    '#06b6d4', // Cyan
    '#3b82f6', // Blue
    '#8b5cf6', // Purple
    '#ec4899', // Pink
  ];

  // Icon presets
  const iconPresets = [
    'Tag',
    'Folder',
    'HelpCircle',
    'Bug',
    'Lightbulb',
    'Shield',
    'AlertCircle',
    'CheckCircle',
  ];

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/v1/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const handleCreateCategory = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/v1/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchCategories();
        setIsCreateModalOpen(false);
        setFormData({
          name: '',
          slug: '',
          description: '',
          color: '#6366f1',
          icon: 'Tag',
          is_active: true,
        });
      }
    } catch (error) {
      console.error('Failed to create category:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateCategory = async (categoryId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/v1/categories/${categoryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchCategories();
        setEditingCategory(null);
      }
    } catch (error) {
      console.error('Failed to update category:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!selectedCategory) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/v1/categories/${selectedCategory.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchCategories();
        setIsDeleteModalOpen(false);
        setSelectedCategory(null);
      }
    } catch (error) {
      console.error('Failed to delete category:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMoveUp = async (index: number) => {
    if (index === 0) return;

    const newCategories = [...categories];
    const temp = newCategories[index - 1];
    newCategories[index - 1] = newCategories[index]!;
    newCategories[index] = temp!;

    const categoryIds = newCategories.map((c) => c.id);

    try {
      const response = await fetch('/api/v1/categories/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoryIds }),
      });

      if (response.ok) {
        setCategories(newCategories);
      }
    } catch (error) {
      console.error('Failed to reorder categories:', error);
    }
  };

  const handleMoveDown = async (index: number) => {
    if (index === categories.length - 1) return;

    const newCategories = [...categories];
    const temp = newCategories[index + 1];
    newCategories[index + 1] = newCategories[index]!;
    newCategories[index] = temp!;

    const categoryIds = newCategories.map((c) => c.id);

    try {
      const response = await fetch('/api/v1/categories/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoryIds }),
      });

      if (response.ok) {
        setCategories(newCategories);
      }
    } catch (error) {
      console.error('Failed to reorder categories:', error);
    }
  };

  const startEdit = (category: Category) => {
    setSelectedCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      color: category.color,
      icon: category.icon || 'Tag',
      is_active: category.is_active,
    });
    setEditingCategory(category.id);
  };

  const cancelEdit = () => {
    setEditingCategory(null);
    setSelectedCategory(null);
    setFormData({
      name: '',
      slug: '',
      description: '',
      color: '#6366f1',
      icon: 'Tag',
      is_active: true,
    });
  };

  // Generate slug from name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const handleNameChange = (value: string) => {
    setFormData({
      ...formData,
      name: value,
      slug: formData.slug === '' ? generateSlug(value) : formData.slug,
    });
  };

  return (
    <div className="max-w-4xl mx-auto" data-testid="categories-management">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Folder size={24} className="text-primary" />
            <h2 className="text-xl font-semibold text-foreground">Categories</h2>
          </div>
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            data-testid="create-category-button"
            variant="default"
            size="default"
          >
            <Plus size={16} />
            Create Category
          </Button>
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          Manage post categories for organizing the moderation queue. Categories can be reordered
          and deactivated.
        </p>
      </div>

      {/* Categories List */}
      <div className="space-y-3">
        {categories.length === 0 ? (
          <div className="text-center py-12 bg-background-secondary rounded-lg border border-border">
            <Folder size={48} className="mx-auto mb-3 text-muted-foreground opacity-50" />
            <p className="text-lg font-medium text-foreground">No categories found</p>
            <p className="text-sm text-muted-foreground">
              Create your first category to organize posts
            </p>
          </div>
        ) : (
          categories.map((category, index) => (
            <div
              key={category.id}
              className="bg-background-secondary rounded-lg border border-border p-4 group"
              data-testid={`category-card-${category.id}`}
            >
              {editingCategory === category.id ? (
                // Edit Mode
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Name
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => handleNameChange(e.target.value)}
                        className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        data-testid="edit-category-name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Slug
                      </label>
                      <input
                        type="text"
                        value={formData.slug}
                        onChange={(e) =>
                          setFormData({ ...formData, slug: e.target.value.toLowerCase() })
                        }
                        className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-mono"
                        data-testid="edit-category-slug"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      data-testid="edit-category-description"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Color
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={formData.color}
                          onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                          className="w-12 h-10 rounded border border-border cursor-pointer"
                          data-testid="edit-category-color-picker"
                        />
                        <div className="flex gap-1">
                          {colorPresets.map((color) => (
                            <button
                              key={color}
                              onClick={() => setFormData({ ...formData, color })}
                              className={`w-8 h-8 rounded border-2 ${
                                formData.color === color
                                  ? 'border-primary'
                                  : 'border-border'
                              }`}
                              style={{ backgroundColor: color }}
                              data-testid={`color-preset-${color.replace('#', '')}`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Icon
                      </label>
                      <select
                        value={formData.icon}
                        onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                        className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        data-testid="edit-category-icon"
                      >
                        {iconPresets.map((icon) => (
                          <option key={icon} value={icon}>
                            {icon}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={`edit-active-${category.id}`}
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="w-4 h-4 rounded border-border"
                      data-testid="edit-category-is-active"
                    />
                    <label
                      htmlFor={`edit-active-${category.id}`}
                      className="text-sm text-foreground"
                    >
                      Active
                    </label>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => handleUpdateCategory(category.id)}
                      disabled={isLoading}
                      variant="default"
                      size="default"
                      data-testid="save-category-edit"
                    >
                      <Save size={16} />
                      Save
                    </Button>
                    <Button
                      onClick={cancelEdit}
                      variant="outline"
                      size="default"
                      data-testid="cancel-category-edit"
                    >
                      <X size={16} />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                // View Mode
                <>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      {/* Color indicator */}
                      <div
                        className="w-4 h-4 rounded-full flex-shrink-0"
                        style={{ backgroundColor: category.color }}
                        data-testid={`category-color-${category.id}`}
                      />

                      {/* Category info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-base font-semibold text-foreground">
                            {category.name}
                          </h3>
                          {!category.is_active && (
                            <span className="text-xs px-2 py-0.5 bg-muted text-muted-foreground rounded">
                              Inactive
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground font-mono">
                          {category.slug}
                        </p>
                        {category.description && (
                          <p className="text-sm text-foreground-secondary mt-1">
                            {category.description}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span>Position: {category.position}</span>
                          <span>Icon: {category.icon || 'None'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        onClick={() => handleMoveUp(index)}
                        disabled={index === 0 || isLoading}
                        variant="ghost"
                        size="icon"
                        data-testid={`move-up-${category.id}`}
                        title="Move up"
                      >
                        <ArrowUp size={16} className="text-foreground-secondary" />
                      </Button>
                      <Button
                        onClick={() => handleMoveDown(index)}
                        disabled={index === categories.length - 1 || isLoading}
                        variant="ghost"
                        size="icon"
                        data-testid={`move-down-${category.id}`}
                        title="Move down"
                      >
                        <ArrowDown size={16} className="text-foreground-secondary" />
                      </Button>
                      <Button
                        onClick={() => startEdit(category)}
                        variant="ghost"
                        size="icon"
                        data-testid={`edit-category-${category.id}`}
                        title="Edit category"
                      >
                        <Edit size={16} className="text-foreground-secondary" />
                      </Button>
                      <Button
                        onClick={() => {
                          setSelectedCategory(category);
                          setIsDeleteModalOpen(true);
                        }}
                        variant="ghost"
                        size="icon"
                        data-testid={`delete-category-${category.id}`}
                        title="Delete category"
                      >
                        <Trash2 size={16} className="text-red-400" />
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>

      {/* Create Category Modal */}
      {isCreateModalOpen && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          data-testid="create-category-modal"
        >
          <div className="bg-background-secondary rounded-lg border border-border shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Create Category</h2>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      placeholder="e.g., Bug Reports"
                      className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      data-testid="create-category-name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Slug *
                    </label>
                    <input
                      type="text"
                      value={formData.slug}
                      onChange={(e) =>
                        setFormData({ ...formData, slug: e.target.value.toLowerCase() })
                      }
                      placeholder="bug-reports"
                      className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-mono"
                      data-testid="create-category-slug"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description of this category..."
                    rows={2}
                    className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    data-testid="create-category-description"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Color *
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={formData.color}
                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                        className="w-12 h-10 rounded border border-border cursor-pointer"
                        data-testid="create-category-color-picker"
                      />
                      <div className="flex gap-1">
                        {colorPresets.map((color) => (
                          <button
                            key={color}
                            onClick={() => setFormData({ ...formData, color })}
                            className={`w-8 h-8 rounded border-2 ${
                              formData.color === color ? 'border-primary' : 'border-border'
                            }`}
                            style={{ backgroundColor: color }}
                            data-testid={`create-color-preset-${color.replace('#', '')}`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Icon
                    </label>
                    <select
                      value={formData.icon}
                      onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                      className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      data-testid="create-category-icon"
                    >
                      {iconPresets.map((icon) => (
                        <option key={icon} value={icon}>
                          {icon}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="create-active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4 rounded border-border"
                    data-testid="create-category-is-active"
                  />
                  <label htmlFor="create-active" className="text-sm text-foreground">
                    Active
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 mt-6">
                <Button
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setFormData({
                      name: '',
                      slug: '',
                      description: '',
                      color: '#6366f1',
                      icon: 'Tag',
                      is_active: true,
                    });
                  }}
                  variant="outline"
                  size="default"
                  data-testid="cancel-create-category"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateCategory}
                  disabled={!formData.name.trim() || !formData.slug.trim() || isLoading}
                  variant="default"
                  size="default"
                  data-testid="save-create-category"
                >
                  Create Category
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && selectedCategory && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          data-testid="delete-category-modal"
        >
          <div className="bg-background-secondary rounded-lg border border-border shadow-xl max-w-md w-full">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-foreground mb-2">Delete Category</h2>
              <p className="text-sm text-foreground-secondary mb-4">
                Are you sure you want to delete the category{' '}
                <strong>{selectedCategory.name}</strong>? This action cannot be undone.
              </p>

              <div className="flex items-center justify-end gap-3">
                <Button
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setSelectedCategory(null);
                  }}
                  variant="outline"
                  size="default"
                  data-testid="cancel-delete-category"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDeleteCategory}
                  variant="destructive"
                  size="default"
                  disabled={isLoading}
                  data-testid="confirm-delete-category"
                >
                  Delete Category
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
