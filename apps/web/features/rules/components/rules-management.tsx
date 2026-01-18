'use client';

import { FormError } from '@/components/ui/field-error';
import { cn } from '@/lib/utils';
import type { PriorityRule } from '@modus/logic';
import { ChevronDown, ChevronUp, Edit, Play, Plus, Search, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';

// Condition type options
const CONDITION_TYPES = [
  {
    value: 'first_time_poster',
    label: 'First Time Poster',
    description: 'Post from author with fewer than X posts',
  },
  {
    value: 'sentiment_negative',
    label: 'Negative Sentiment',
    description: 'Post with sentiment score below threshold',
  },
  { value: 'sla_exceeded', label: 'SLA Exceeded', description: 'Post open for more than X hours' },
  {
    value: 'keyword_match',
    label: 'Keyword Match',
    description: 'Post contains specific keywords',
  },
  { value: 'category_match', label: 'Category Match', description: 'Post in specific category' },
];

// Action type options
const ACTION_TYPES = [
  { value: 'set_priority', label: 'Set Priority', description: 'Set specific priority level' },
  { value: 'escalate', label: 'Escalate', description: 'Increase priority by one level' },
  { value: 'auto_assign', label: 'Auto Assign', description: 'Assign to specific agent' },
  { value: 'tag', label: 'Tag', description: 'Add tag to post' },
];

// Priority options
const PRIORITY_OPTIONS = ['P1', 'P2', 'P3', 'P4', 'P5'];

export function RulesManagement() {
  const [rules, setRules] = useState<PriorityRule[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState<PriorityRule | null>(null);

  // Form data
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    condition_type: 'first_time_poster',
    condition_value: '',
    action_type: 'set_priority',
    action_value: 'P2',
    is_active: true,
  });

  // Test data
  const [testData, setTestData] = useState({
    title: '',
    body_content: '',
    author_post_count: 1,
    sentiment_score: 0,
    category_id: '',
  });
  const [testResult, setTestResult] = useState<any>(null);

  // Fetch rules on mount
  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/v1/rules');
      if (!response.ok) throw new Error('Failed to fetch rules');
      const data = await response.json();
      setRules(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load rules');
    } finally {
      setLoading(false);
    }
  };

  const filteredRules = rules.filter(
    (rule) =>
      rule.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rule.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateRule = async () => {
    try {
      const response = await fetch('/api/v1/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!response.ok) throw new Error('Failed to create rule');
      const data = await response.json();
      setRules([...rules, data.data]);
      setIsCreateModalOpen(false);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create rule');
    }
  };

  const handleUpdateRule = async () => {
    if (!selectedRule) return;
    try {
      const response = await fetch(`/api/v1/rules/${selectedRule.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!response.ok) throw new Error('Failed to update rule');
      const data = await response.json();
      setRules(rules.map((r) => (r.id === selectedRule.id ? data.data : r)));
      setIsEditModalOpen(false);
      setSelectedRule(null);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update rule');
    }
  };

  const handleDeleteRule = async () => {
    if (!selectedRule) return;
    try {
      const response = await fetch(`/api/v1/rules/${selectedRule.id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete rule');
      setRules(rules.filter((r) => r.id !== selectedRule.id));
      setIsDeleteModalOpen(false);
      setSelectedRule(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete rule');
    }
  };

  const handleReorder = async (ruleIds: string[]) => {
    try {
      const response = await fetch('/api/v1/rules/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ruleIds }),
      });
      if (!response.ok) throw new Error('Failed to reorder rules');
      const data = await response.json();
      setRules(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reorder rules');
    }
  };

  const handleTestRule = async () => {
    try {
      const response = await fetch('/api/v1/rules/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...testData,
          ruleId: selectedRule?.id,
        }),
      });
      if (!response.ok) throw new Error('Failed to test rule');
      const data = await response.json();
      setTestResult(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to test rule');
    }
  };

  const moveRule = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index > 0) {
      const newRules = [...rules];
      const prevRule = newRules[index - 1];
      const currRule = newRules[index];
      if (prevRule && currRule) {
        [newRules[index - 1], newRules[index]] = [currRule, prevRule];
        setRules(newRules);
        handleReorder(newRules.map((r) => r.id));
      }
    } else if (direction === 'down' && index < rules.length - 1) {
      const newRules = [...rules];
      const currRule = newRules[index];
      const nextRule = newRules[index + 1];
      if (currRule && nextRule) {
        [newRules[index], newRules[index + 1]] = [nextRule, currRule];
        setRules(newRules);
        handleReorder(newRules.map((r) => r.id));
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      condition_type: 'first_time_poster',
      condition_value: '',
      action_type: 'set_priority',
      action_value: 'P2',
      is_active: true,
    });
    setTestResult(null);
    setTestData({
      title: '',
      body_content: '',
      author_post_count: 1,
      sentiment_score: 0,
      category_id: '',
    });
  };

  const openEditModal = (rule: PriorityRule) => {
    setSelectedRule(rule);
    setFormData({
      name: rule.name,
      description: rule.description ?? '',
      condition_type: rule.condition_type,
      condition_value: rule.condition_value,
      action_type: rule.action_type,
      action_value: rule.action_value,
      is_active: rule.is_active,
    });
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (rule: PriorityRule) => {
    setSelectedRule(rule);
    setIsDeleteModalOpen(true);
  };

  const openTestModal = (rule: PriorityRule) => {
    setSelectedRule(rule);
    setIsTestModalOpen(true);
    setTestResult(null);
  };

  const toggleRuleStatus = async (rule: PriorityRule) => {
    try {
      const response = await fetch(`/api/v1/rules/${rule.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !rule.is_active }),
      });
      if (!response.ok) throw new Error('Failed to update rule');
      const data = await response.json();
      setRules(rules.map((r) => (r.id === rule.id ? data.data : r)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update rule');
    }
  };

  const getConditionTypeLabel = (value: string) => {
    return CONDITION_TYPES.find((t) => t.value === value)?.label || value;
  };

  const getActionTypeLabel = (value: string) => {
    return ACTION_TYPES.find((t) => t.value === value)?.label || value;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        Loading rules...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Priority Rules</h2>
          <p className="text-sm text-muted-foreground">
            Configure rules for automatic priority assignment and escalation
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setIsCreateModalOpen(true);
          }}
          className="px-4 py-2 bg-primary hover:bg-primary/90 text-white text-sm rounded-md transition-colors flex items-center gap-2"
          data-testid="create-rule-button"
        >
          <Plus size={16} />
          Create Rule
        </button>
      </div>

      {/* Error Banner */}
      {error && <FormError message={error} />}

      {/* Search Bar */}
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <input
          type="text"
          placeholder="Search rules..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          data-testid="rule-search-input"
        />
      </div>

      {/* Rules List */}
      <div className="space-y-3">
        {filteredRules.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg font-medium">No rules found</p>
            <p className="text-sm">
              {searchTerm ? 'Try a different search term' : 'Create your first rule to get started'}
            </p>
          </div>
        ) : (
          filteredRules.map((rule, index) => (
            <div
              key={rule.id}
              className={cn(
                'bg-background-secondary rounded-lg border p-4 transition-colors',
                rule.is_active
                  ? 'border-border hover:bg-background-secondary/80'
                  : 'border-border/50 opacity-70'
              )}
              data-testid={`rule-card-${rule.id}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-base font-semibold text-foreground truncate">
                      {rule.name}
                    </h3>
                    <span
                      className={cn(
                        'text-xs px-2 py-0.5 rounded-full',
                        rule.is_active
                          ? 'bg-green-500/10 text-green-400'
                          : 'bg-gray-500/10 text-gray-400'
                      )}
                    >
                      {rule.is_active ? 'Active' : 'Disabled'}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{rule.description}</p>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-foreground-secondary">
                    <span className="bg-background-tertiary px-2 py-1 rounded">
                      {getConditionTypeLabel(rule.condition_type)}: {rule.condition_value}
                    </span>
                    <span className="bg-background-tertiary px-2 py-1 rounded">
                      {getActionTypeLabel(rule.action_type)}: {rule.action_value}
                    </span>
                    <span className="text-muted-foreground">Position: {rule.position}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {/* Reorder buttons */}
                  <div className="flex flex-col gap-1 mr-2">
                    <button
                      onClick={() => moveRule(index, 'up')}
                      disabled={index === 0}
                      className="p-1 hover:bg-background-tertiary rounded transition-colors disabled:opacity-30"
                      data-testid={`move-up-${rule.id}`}
                    >
                      <ChevronUp size={14} />
                    </button>
                    <button
                      onClick={() => moveRule(index, 'down')}
                      disabled={index === filteredRules.length - 1}
                      className="p-1 hover:bg-background-tertiary rounded transition-colors disabled:opacity-30"
                      data-testid={`move-down-${rule.id}`}
                    >
                      <ChevronDown size={14} />
                    </button>
                  </div>

                  {/* Action buttons */}
                  <button
                    onClick={() => toggleRuleStatus(rule)}
                    className={cn(
                      'p-1.5 rounded-md transition-colors',
                      rule.is_active ? 'hover:bg-yellow-500/10' : 'hover:bg-green-500/10'
                    )}
                    data-testid={`toggle-rule-${rule.id}`}
                    title={rule.is_active ? 'Disable rule' : 'Enable rule'}
                  >
                    <div
                      className={cn(
                        'w-2 h-2 rounded-full',
                        rule.is_active ? 'bg-yellow-400' : 'bg-green-400'
                      )}
                    />
                  </button>
                  <button
                    onClick={() => openTestModal(rule)}
                    className="p-1.5 hover:bg-blue-500/10 rounded-md transition-colors"
                    data-testid={`test-rule-${rule.id}`}
                    title="Test rule"
                  >
                    <Play size={16} className="text-blue-400" />
                  </button>
                  <button
                    onClick={() => openEditModal(rule)}
                    className="p-1.5 hover:bg-background-tertiary rounded-md transition-colors"
                    data-testid={`edit-rule-${rule.id}`}
                    title="Edit rule"
                  >
                    <Edit size={16} className="text-foreground-secondary" />
                  </button>
                  <button
                    onClick={() => openDeleteModal(rule)}
                    className="p-1.5 hover:bg-red-500/10 rounded-md transition-colors"
                    data-testid={`delete-rule-${rule.id}`}
                    title="Delete rule"
                  >
                    <Trash2 size={16} className="text-red-400" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create/Edit Modal */}
      {(isCreateModalOpen || isEditModalOpen) && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          data-testid={isCreateModalOpen ? 'create-rule-modal' : 'edit-rule-modal'}
        >
          <div className="bg-background-secondary rounded-lg border border-border shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">
                {isCreateModalOpen ? 'Create Rule' : 'Edit Rule'}
              </h2>

              <div className="space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Rule Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., First Time Poster Escalation"
                    className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    data-testid="rule-name-input"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description of what this rule does"
                    rows={2}
                    className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    data-testid="rule-description-input"
                  />
                </div>

                {/* Condition Type */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Condition Type
                  </label>
                  <select
                    value={formData.condition_type}
                    onChange={(e) => setFormData({ ...formData, condition_type: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    data-testid="rule-condition-type-select"
                  >
                    {CONDITION_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-muted-foreground mt-1">
                    {CONDITION_TYPES.find((t) => t.value === formData.condition_type)?.description}
                  </p>
                </div>

                {/* Condition Value */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Condition Value
                  </label>
                  <input
                    type="text"
                    value={formData.condition_value}
                    onChange={(e) => setFormData({ ...formData, condition_value: e.target.value })}
                    placeholder={getConditionValuePlaceholder(formData.condition_type)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    data-testid="rule-condition-value-input"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {getConditionValueHelpText(formData.condition_type)}
                  </p>
                </div>

                {/* Action Type */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Action Type
                  </label>
                  <select
                    value={formData.action_type}
                    onChange={(e) => setFormData({ ...formData, action_type: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    data-testid="rule-action-type-select"
                  >
                    {ACTION_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-muted-foreground mt-1">
                    {ACTION_TYPES.find((t) => t.value === formData.action_type)?.description}
                  </p>
                </div>

                {/* Action Value */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Action Value
                  </label>
                  {formData.action_type === 'set_priority' ? (
                    <select
                      value={formData.action_value}
                      onChange={(e) => setFormData({ ...formData, action_value: e.target.value })}
                      className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      data-testid="rule-action-value-select"
                    >
                      {PRIORITY_OPTIONS.map((priority) => (
                        <option key={priority} value={priority}>
                          {priority}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={formData.action_value}
                      onChange={(e) => setFormData({ ...formData, action_value: e.target.value })}
                      placeholder={getActionValuePlaceholder(formData.action_type)}
                      className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      data-testid="rule-action-value-input"
                    />
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {getActionValueHelpText(formData.action_type)}
                  </p>
                </div>

                {/* Active Toggle */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is-active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                    data-testid="rule-active-checkbox"
                  />
                  <label htmlFor="is-active" className="text-sm text-foreground">
                    Rule is active
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    if (isCreateModalOpen) setIsCreateModalOpen(false);
                    else setIsEditModalOpen(false);
                    resetForm();
                  }}
                  className="px-4 py-2 bg-background-tertiary hover:bg-background-tertiary/80 text-foreground text-sm rounded-md transition-colors border border-border"
                  data-testid="cancel-rule"
                >
                  Cancel
                </button>
                <button
                  onClick={isCreateModalOpen ? handleCreateRule : handleUpdateRule}
                  disabled={!formData.name.trim() || !formData.condition_value.trim()}
                  className={cn(
                    'px-4 py-2 text-white text-sm rounded-md transition-colors',
                    formData.name.trim() && formData.condition_value.trim()
                      ? 'bg-primary hover:bg-primary/90'
                      : 'bg-primary/50 cursor-not-allowed'
                  )}
                  data-testid="save-rule"
                >
                  {isCreateModalOpen ? 'Create Rule' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && selectedRule && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          data-testid="delete-rule-modal"
        >
          <div className="bg-background-secondary rounded-lg border border-border shadow-xl max-w-md w-full">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-foreground mb-2">Delete Rule</h2>
              <p className="text-sm text-foreground-secondary mb-4">
                Are you sure you want to delete the rule <strong>{selectedRule.name}</strong>? This
                action cannot be undone.
              </p>

              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setSelectedRule(null);
                  }}
                  className="px-4 py-2 bg-background-tertiary hover:bg-background-tertiary/80 text-foreground text-sm rounded-md transition-colors border border-border"
                  data-testid="cancel-delete-rule"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteRule}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm rounded-md transition-colors"
                  data-testid="confirm-delete-rule"
                >
                  Delete Rule
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Test Modal */}
      {isTestModalOpen && selectedRule && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          data-testid="test-rule-modal"
        >
          <div className="bg-background-secondary rounded-lg border border-border shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground">
                  Test Rule: {selectedRule.name}
                </h2>
                <button
                  onClick={() => {
                    setIsTestModalOpen(false);
                    setSelectedRule(null);
                    setTestResult(null);
                  }}
                  className="p-1 hover:bg-background-tertiary rounded-md transition-colors"
                  data-testid="close-test-modal"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                {/* Test Data Inputs */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Title</label>
                    <input
                      type="text"
                      value={testData.title}
                      onChange={(e) => setTestData({ ...testData, title: e.target.value })}
                      placeholder="Post title"
                      className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      data-testid="test-title-input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Author Post Count
                    </label>
                    <input
                      type="number"
                      value={testData.author_post_count}
                      onChange={(e) =>
                        setTestData({
                          ...testData,
                          author_post_count: Number.parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      data-testid="test-author-post-count-input"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Body Content
                  </label>
                  <textarea
                    value={testData.body_content}
                    onChange={(e) => setTestData({ ...testData, body_content: e.target.value })}
                    placeholder="Post content"
                    rows={4}
                    className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    data-testid="test-body-content-input"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Sentiment Score
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="-1"
                      max="1"
                      value={testData.sentiment_score}
                      onChange={(e) =>
                        setTestData({
                          ...testData,
                          sentiment_score: Number.parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      data-testid="test-sentiment-input"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      -1 (negative) to 1 (positive)
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Category ID
                    </label>
                    <input
                      type="text"
                      value={testData.category_id}
                      onChange={(e) => setTestData({ ...testData, category_id: e.target.value })}
                      placeholder="e.g., cat-1"
                      className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      data-testid="test-category-input"
                    />
                  </div>
                </div>

                <button
                  onClick={handleTestRule}
                  className="w-full px-4 py-2 bg-primary hover:bg-primary/90 text-white text-sm rounded-md transition-colors flex items-center justify-center gap-2"
                  data-testid="run-test-button"
                >
                  <Play size={16} />
                  Run Test
                </button>

                {/* Test Results */}
                {testResult && (
                  <div className="mt-4 p-4 bg-background-tertiary rounded-md border border-border">
                    <h3 className="text-sm font-semibold text-foreground mb-3">Test Results</h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Calculated Priority:</span>
                        <span
                          className={cn(
                            'px-2 py-0.5 rounded font-semibold',
                            testResult.calculated_priority === 'P1'
                              ? 'bg-red-500/20 text-red-400'
                              : testResult.calculated_priority === 'P2'
                                ? 'bg-orange-500/20 text-orange-400'
                                : testResult.calculated_priority === 'P3'
                                  ? 'bg-yellow-500/20 text-yellow-400'
                                  : testResult.calculated_priority === 'P4'
                                    ? 'bg-blue-500/20 text-blue-400'
                                    : 'bg-gray-500/20 text-gray-400'
                          )}
                          data-testid="test-result-priority"
                        >
                          {testResult.calculated_priority}
                        </span>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Matched Rules:</span>
                        {testResult.matched_rules.length > 0 ? (
                          <ul className="mt-2 space-y-1" data-testid="test-result-matched-rules">
                            {testResult.matched_rules.map((r: any, i: number) => (
                              <li
                                key={i}
                                className="text-xs bg-background rounded p-2 border border-border"
                              >
                                <div className="font-medium">{r.rule_name}</div>
                                <div className="text-muted-foreground">
                                  {r.action_type}: {r.action_value}
                                </div>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-xs text-muted-foreground mt-1">No rules matched</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper functions for form placeholders and help text
function getConditionValuePlaceholder(conditionType: string): string {
  switch (conditionType) {
    case 'first_time_poster':
      return 'e.g., 2';
    case 'sentiment_negative':
      return 'e.g., -0.3';
    case 'sla_exceeded':
      return 'e.g., 2';
    case 'keyword_match':
      return 'e.g., urgent,urgently,asap';
    case 'category_match':
      return 'e.g., cat-3';
    default:
      return 'Enter value';
  }
}

function getConditionValueHelpText(conditionType: string): string {
  switch (conditionType) {
    case 'first_time_poster':
      return 'Posts from authors with fewer than this many posts';
    case 'sentiment_negative':
      return 'Sentiment score threshold (lower is more negative)';
    case 'sla_exceeded':
      return 'Hours since post was created';
    case 'keyword_match':
      return 'Comma-separated list of keywords to match';
    case 'category_match':
      return 'Category ID to match';
    default:
      return '';
  }
}

function getActionValuePlaceholder(actionType: string): string {
  switch (actionType) {
    case 'auto_assign':
      return 'e.g., agent-1';
    case 'tag':
      return 'e.g., urgent-review';
    default:
      return 'Enter value';
  }
}

function getActionValueHelpText(actionType: string): string {
  switch (actionType) {
    case 'auto_assign':
      return 'Agent ID to assign posts to';
    case 'tag':
      return 'Tag to apply to matching posts';
    default:
      return '';
  }
}
