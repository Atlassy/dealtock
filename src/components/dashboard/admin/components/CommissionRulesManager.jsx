// CommissionRulesManager.jsx - Updated for new commission rules structure
import React, { useState, useEffect } from "react";
import { supabase } from "../../../../lib/supabaseClient";
import {
  Percent,
  Plus,
  Edit,
  Trash2,
  X,
  Save,
  RefreshCw,
  Users,
  Truck,
  Star,
  Crown,
  AlertTriangle
} from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

const CommissionRulesManager = () => {
  const { t } = useTranslation();
  const [rules, setRules] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddRule, setShowAddRule] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [ruleForm, setRuleForm] = useState({
    applies_to: 'B2C',
    category: '',
    percentage: '30',
    min_amount: '',
    max_amount: '',
    is_active: true,
    valid_from: new Date().toISOString().split('T')[0],
    valid_to: ''
  });

  // Calculate stats based on current rules
  const stats = {
    total: rules.length,
    active: rules.filter(r => r.is_active).length,
    b2c: rules.filter(r => r.applies_to === 'B2C').length,
    seller: rules.filter(r => r.applies_to === 'Seller').length,
    dropshipper: rules.filter(r => r.applies_to === 'dropshipper').length,
    proSeller: rules.filter(r => r.applies_to === 'Pro_Seller').length,
    proDropshipper: rules.filter(r => r.applies_to === 'Pro_dropshipper').length
  };

  useEffect(() => {
    loadCommissionData();
  }, []);

  const loadCommissionData = async () => {
    try {
      setLoading(true);
      console.log('🔍 Loading commission data...');
      
      // Fetch commission rules. Note: there's no real foreign key between
      // commission_rules.category_id and categories.id, so PostgREST can't
      // embed the join — match category names client-side instead (below).
      const { data: rulesData, error: rulesError } = await supabase
        .from('commission_rules')
        .select('*')
        .order('applies_to', { ascending: true })
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false });

      if (rulesError) {
        console.error('❌ Rules fetch error:', rulesError);
        toast.error(t('commissionRules.loadFailed'));
        setRules([]);
      } else {
        setRules(rulesData || []);
        console.log(`✅ Loaded ${rulesData?.length || 0} commission rules`);
      }

      // Fetch categories for dropdown
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('id, name')
        .order('name', { ascending: true });
      
      if (categoriesError) {
        console.error('❌ Categories fetch error:', categoriesError);
        setCategories([]);
      } else {
        setCategories(categoriesData || []);
      }

    } catch (error) {
      console.error('❌ Error loading commission data:', error);
      toast.error(t('commissionRules.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRule = async () => {
    try {
      // Validate form
      if (!ruleForm.applies_to) {
        toast.error(t('commissionRules.selectAppliesTo'));
        return;
      }

      if (!ruleForm.percentage || parseFloat(ruleForm.percentage) < 0) {
        toast.error(t('commissionRules.invalidPercentage'));
        return;
      }

      // Find category name if ID is selected
      let categoryName = null;
      if (ruleForm.category) {
        const selectedCategory = categories.find(c => c.id === ruleForm.category);
        categoryName = selectedCategory?.name || null;
      }

      // Determine priority based on rule type and category
      let priority = 10;
      if (!ruleForm.category) {
        priority = 0; // Default rules have lower priority
      }

      const ruleData = {
        applies_to: ruleForm.applies_to,
        category: categoryName,
        category_id: ruleForm.category || null,
        percentage: parseFloat(ruleForm.percentage),
        min_amount: ruleForm.min_amount ? parseFloat(ruleForm.min_amount) : null,
        max_amount: ruleForm.max_amount ? parseFloat(ruleForm.max_amount) : null,
        is_active: ruleForm.is_active,
        is_default: !ruleForm.category, // No category means default rule
        priority: priority,
        valid_from: ruleForm.valid_from || new Date().toISOString().split('T')[0],
        valid_to: ruleForm.valid_to || null,
        rule_type: 'commission'
      };

      let result;
      if (editingRule) {
        // Update existing rule
        result = await supabase
          .from('commission_rules')
          .update(ruleData)
          .eq('id', editingRule.id);
      } else {
        // Insert new rule
        result = await supabase
          .from('commission_rules')
          .insert([ruleData]);
      }

      if (result.error) throw result.error;

      toast.success(editingRule ? t('commissionRules.ruleUpdated') : t('commissionRules.ruleCreated'));
      setShowAddRule(false);
      setEditingRule(null);
      resetForm();
      loadCommissionData();

    } catch (error) {
      console.error('Error saving rule:', error);
      toast.error(t('commissionRules.saveFailed', { error: error.message }));
    }
  };

  const handleEditRule = (rule) => {
    setEditingRule(rule);
    setRuleForm({
      applies_to: rule.applies_to || 'B2C',
      category: rule.category_id || '',
      percentage: rule.percentage?.toString() || '',
      min_amount: rule.min_amount?.toString() || '',
      max_amount: rule.max_amount?.toString() || '',
      is_active: rule.is_active ?? true,
      valid_from: rule.valid_from?.split('T')[0] || new Date().toISOString().split('T')[0],
      valid_to: rule.valid_to?.split('T')[0] || ''
    });
    setShowAddRule(true);
  };

  const handleDeleteRule = async (ruleId) => {
    if (!window.confirm(t('commissionRules.confirmDelete'))) return;

    try {
      const { error } = await supabase
        .from('commission_rules')
        .delete()
        .eq('id', ruleId);

      if (error) throw error;

      toast.success(t('commissionRules.ruleDeleted'));
      loadCommissionData();
    } catch (error) {
      console.error('Error deleting rule:', error);
      toast.error(t('commissionRules.deleteFailed'));
    }
  };

  const handleToggleActive = async (rule) => {
    try {
      const { error } = await supabase
        .from('commission_rules')
        .update({ is_active: !rule.is_active })
        .eq('id', rule.id);

      if (error) throw error;

      toast.success(rule.is_active ? t('commissionRules.ruleDeactivated') : t('commissionRules.ruleActivated'));
      loadCommissionData();
    } catch (error) {
      console.error('Error toggling rule:', error);
      toast.error(t('commissionRules.toggleFailed'));
    }
  };

  const resetForm = () => {
    setRuleForm({
      applies_to: 'B2C',
      category: '',
      percentage: '',
      min_amount: '',
      max_amount: '',
      is_active: true,
      valid_from: new Date().toISOString().split('T')[0],
      valid_to: ''
    });
    setEditingRule(null);
  };

  // Two ranges overlap if each one's min is below the other's max (null = unbounded)
  const rangesOverlap = (aMin, aMax, bMin, bMax) => {
    const aLow = aMin ?? -Infinity;
    const aHigh = aMax ?? Infinity;
    const bLow = bMin ?? -Infinity;
    const bHigh = bMax ?? Infinity;
    return aLow <= bHigh && bLow <= aHigh;
  };

  const datesOverlap = (aFrom, aTo, bFrom, bTo) => {
    const aStart = aFrom ? new Date(aFrom).getTime() : -Infinity;
    const aEnd = aTo ? new Date(aTo).getTime() : Infinity;
    const bStart = bFrom ? new Date(bFrom).getTime() : -Infinity;
    const bEnd = bTo ? new Date(bTo).getTime() : Infinity;
    return aStart <= bEnd && bStart <= aEnd;
  };

  // Finds other active rules that would AMBIGUOUSLY compete with `candidate` for the
  // same orders (same applies_to + same category, overlapping amount range and dates,
  // AND the same priority — a lower-priority default/fallback rule overlapping with a
  // higher-priority specific rule is resolved deterministically by priority, so that's
  // an intentional default+override pattern, not a real conflict).
  const findConflicts = (candidate, excludeId = null) => {
    return rules.filter((rule) => {
      if (rule.id === excludeId) return false;
      if (!rule.is_active || candidate.is_active === false) return false;
      if (rule.applies_to !== candidate.applies_to) return false;
      const samePriority = (rule.priority ?? 0) === (candidate.priority ?? 0);
      if (!samePriority) return false;
      // category_id is legacy/unused (no real FK to categories, table is empty) -
      // the actual category lives in the free-text `category` column instead.
      const sameCategory = (rule.category_id || rule.category || null) === (candidate.category_id || candidate.category || null);
      if (!sameCategory) return false;
      if (!rangesOverlap(rule.min_amount, rule.max_amount, candidate.min_amount, candidate.max_amount)) return false;
      if (!datesOverlap(rule.valid_from, rule.valid_to, candidate.valid_from, candidate.valid_to)) return false;
      return true;
    });
  };

  const formConflicts = showAddRule
    ? findConflicts(
        {
          applies_to: ruleForm.applies_to,
          category_id: ruleForm.category || null,
          priority: ruleForm.category ? 10 : 0,
          min_amount: ruleForm.min_amount ? parseFloat(ruleForm.min_amount) : null,
          max_amount: ruleForm.max_amount ? parseFloat(ruleForm.max_amount) : null,
          valid_from: ruleForm.valid_from || null,
          valid_to: ruleForm.valid_to || null,
          is_active: ruleForm.is_active
        },
        editingRule?.id || null
      )
    : [];

  const getCategoryName = (rule) => {
    // Match against the separately-fetched categories list (no real FK to embed the join)
    if (rule.category_id) {
      const matched = categories.find(c => c.id === rule.category_id);
      if (matched?.name) return matched.name;
    }
    // Fallback to the legacy free-text category field
    if (rule.category) {
      return rule.category;
    }
    return t('commissionRules.table.allCategories');
  };

  const getAppliesToIcon = (appliesTo) => {
    switch (appliesTo) {
      case 'B2C':
        return <Users className="w-4 h-4" />;
      case 'Seller':
        return <Star className="w-4 h-4" />;
      case 'dropshipper':
        return <Truck className="w-4 h-4" />;
      case 'Pro_Seller':
        return <Crown className="w-4 h-4" />;
      case 'Pro_dropshipper':
        return <Crown className="w-4 h-4" />;
      default:
        return <Percent className="w-4 h-4" />;
    }
  };

  const getAppliesToColor = (appliesTo) => {
    switch (appliesTo) {
      case 'B2C':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'Seller':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'dropshipper':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
      case 'Pro_Seller':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'Pro_dropshipper':
        return 'bg-kraft-100 text-kraft-800 dark:bg-kraft-900/30 dark:text-kraft-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap gap-4 justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Percent className="w-6 h-6" />
            {t('commissionRules.title')}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
            {t('commissionRules.subtitle')}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadCommissionData}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-200 flex items-center gap-2 text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            {t('commissionRules.refresh')}
          </button>
          <button
            onClick={() => {
              resetForm();
              setShowAddRule(true);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            {t('commissionRules.addRule')}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <p className="text-sm text-gray-600 dark:text-gray-400">{t('commissionRules.stats.totalRules')}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <p className="text-sm text-gray-600 dark:text-gray-400">{t('commissionRules.stats.activeRules')}</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.active}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <p className="text-sm text-gray-600 dark:text-gray-400">{t('commissionRules.stats.b2cRules')}</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.b2c}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <p className="text-sm text-gray-600 dark:text-gray-400">{t('commissionRules.stats.sellerRules')}</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.seller}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <p className="text-sm text-gray-600 dark:text-gray-400">{t('commissionRules.stats.dropshipperRules')}</p>
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.dropshipper}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <p className="text-sm text-gray-600 dark:text-gray-400">{t('commissionRules.stats.premiumRules')}</p>
          <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.proSeller + stats.proDropshipper}</p>
        </div>
      </div>

      {/* Rules Table */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">{t('commissionRules.loadingRules')}</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="text-left p-4 font-medium text-sm text-gray-700 dark:text-gray-300">{t('commissionRules.table.appliesTo')}</th>
                  <th className="text-left p-4 font-medium text-sm text-gray-700 dark:text-gray-300">{t('commissionRules.table.category')}</th>
                  <th className="text-left p-4 font-medium text-sm text-gray-700 dark:text-gray-300">{t('commissionRules.table.commissionPercent')}</th>
                  <th className="text-left p-4 font-medium text-sm text-gray-700 dark:text-gray-300">{t('commissionRules.table.orderRange')}</th>
                  <th className="text-left p-4 font-medium text-sm text-gray-700 dark:text-gray-300">{t('commissionRules.table.validPeriod')}</th>
                  <th className="text-left p-4 font-medium text-sm text-gray-700 dark:text-gray-300">{t('commissionRules.table.status')}</th>
                  <th className="text-left p-4 font-medium text-sm text-gray-700 dark:text-gray-300">{t('commissionRules.table.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {rules.map((rule) => {
                  const conflicts = findConflicts(rule, rule.id);
                  return (
                  <tr key={rule.id} className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getAppliesToColor(rule.applies_to)}`}>
                        {getAppliesToIcon(rule.applies_to)}
                        {rule.applies_to === 'Pro_Seller' ? t('commissionRules.table.proSeller') :
                         rule.applies_to === 'Pro_dropshipper' ? t('commissionRules.table.proDropshipper') :
                         rule.applies_to}
                      </span>
                      {conflicts.length > 0 && (
                        <span
                          className="inline-flex items-center gap-1 ml-2 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400"
                          title={`Overlaps with ${conflicts.length} other active rule(s): ${conflicts.map(c => `${c.percentage}% (${c.min_amount ?? 0}-${c.max_amount ?? '∞'} MAD)`).join(', ')}`}
                        >
                          <AlertTriangle className="w-3 h-3" />
                          {t('commissionRules.table.conflict')}
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-sm text-gray-700 dark:text-gray-300">
                      {getCategoryName(rule)}
                    </td>
                    <td className="p-4 font-medium">
                      <span className="text-blue-600 dark:text-blue-400 font-bold">{rule.percentage}%</span>
                    </td>
                    <td className="p-4 text-sm text-gray-600 dark:text-gray-400">
                      {rule.min_amount !== null ? `${rule.min_amount} MAD` : '0 MAD'} - {rule.max_amount !== null ? `${rule.max_amount} MAD` : '∞'}
                    </td>
                    <td className="p-4 text-sm text-gray-700 dark:text-gray-300">
                      <div>{new Date(rule.valid_from).toLocaleDateString()}</div>
                      {rule.valid_to && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {t('commissionRules.table.to', { date: new Date(rule.valid_to).toLocaleDateString() })}
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => handleToggleActive(rule)}
                        className={`px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors ${
                          rule.is_active
                            ? 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50'
                            : 'bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50'
                        }`}
                      >
                        {rule.is_active ? t('commissionRules.table.active') : t('commissionRules.table.inactive')}
                      </button>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditRule(rule)}
                          className="p-1 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors"
                          title={t('commissionRules.table.edit')}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteRule(rule.id)}
                          className="p-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                          title={t('commissionRules.table.delete')}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {rules.length === 0 && (
            <div className="text-center py-12">
              <Percent className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">{t('commissionRules.noRules')}</p>
              <p className="text-sm text-gray-400 mt-1">
                {t('commissionRules.noRulesSub')}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Rule Modal */}
      {showAddRule && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-lg max-h-[90vh] overflow-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-800">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingRule ? t('commissionRules.modal.editTitle') : t('commissionRules.modal.addTitle')}
              </h3>
              <button
                onClick={() => {
                  setShowAddRule(false);
                  resetForm();
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-700 dark:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Applies To */}
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">{t('commissionRules.modal.appliesToLabel')}</label>
                <select
                  value={ruleForm.applies_to}
                  onChange={(e) => setRuleForm({...ruleForm, applies_to: e.target.value})}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="B2C">{t('commissionRules.modal.b2cOption')}</option>
                  <option value="Seller">{t('commissionRules.modal.sellerOption')}</option>
                  <option value="dropshipper">{t('commissionRules.modal.dropshipperOption')}</option>
                  <option value="Pro_Seller">{t('commissionRules.modal.proSellerOption')}</option>
                  <option value="Pro_dropshipper">{t('commissionRules.modal.proDropshipperOption')}</option>
                </select>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {ruleForm.applies_to === 'B2C' && t('commissionRules.modal.hintB2C')}
                  {ruleForm.applies_to === 'Seller' && t('commissionRules.modal.hintSeller')}
                  {ruleForm.applies_to === 'dropshipper' && t('commissionRules.modal.hintDropshipper')}
                  {ruleForm.applies_to === 'Pro_Seller' && t('commissionRules.modal.hintProSeller')}
                  {ruleForm.applies_to === 'Pro_dropshipper' && t('commissionRules.modal.hintProDropshipper')}
                </p>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">{t('commissionRules.modal.categoryLabel')}</label>
                <select
                  value={ruleForm.category}
                  onChange={(e) => setRuleForm({...ruleForm, category: e.target.value})}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">{t('commissionRules.modal.categoryDefault')}</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {t('commissionRules.modal.categoryHint')}
                </p>
              </div>

              {/* Percentage */}
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">{t('commissionRules.modal.percentageLabel')}</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={ruleForm.percentage}
                    onChange={(e) => setRuleForm({...ruleForm, percentage: e.target.value})}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg pr-8 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    placeholder={t('commissionRules.modal.percentagePlaceholder')}
                    required
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">%</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {ruleForm.applies_to === 'Pro_Seller' && t('commissionRules.modal.hintProSellerPercent')}
                  {ruleForm.applies_to === 'Pro_dropshipper' && t('commissionRules.modal.hintProDropshipperPercent')}
                </p>
              </div>

              {/* Order Amount Range */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">{t('commissionRules.modal.minAmount')}</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={ruleForm.min_amount}
                    onChange={(e) => setRuleForm({...ruleForm, min_amount: e.target.value})}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">{t('commissionRules.modal.maxAmount')}</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={ruleForm.max_amount}
                    onChange={(e) => setRuleForm({...ruleForm, max_amount: e.target.value})}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    placeholder={t('commissionRules.modal.noMax')}
                  />
                </div>
              </div>

              {/* Valid Period */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">{t('commissionRules.modal.validFrom')}</label>
                  <input
                    type="date"
                    value={ruleForm.valid_from}
                    onChange={(e) => setRuleForm({...ruleForm, valid_from: e.target.value})}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">{t('commissionRules.modal.validTo')}</label>
                  <input
                    type="date"
                    value={ruleForm.valid_to}
                    onChange={(e) => setRuleForm({...ruleForm, valid_to: e.target.value})}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Active Status */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={ruleForm.is_active}
                  onChange={(e) => setRuleForm({...ruleForm, is_active: e.target.checked})}
                  className="rounded text-blue-600 mr-2 focus:ring-blue-500"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('commissionRules.modal.ruleIsActive')}
                </label>
              </div>

              {/* Conflict warning */}
              {formConflicts.length > 0 && (
                <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800/40 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-yellow-800 dark:text-yellow-300">
                    <p className="font-medium">{t('commissionRules.modal.conflictWarning', { count: formConflicts.length })}</p>
                    <ul className="mt-1 space-y-0.5 list-disc list-inside">
                      {formConflicts.map((c) => (
                        <li key={c.id}>
                          {c.percentage}% on {c.min_amount ?? 0}–{c.max_amount ?? '∞'} MAD
                          {c.valid_to ? ` (until ${new Date(c.valid_to).toLocaleDateString()})` : ''}
                        </li>
                      ))}
                    </ul>
                    <p className="mt-1">{t('commissionRules.modal.conflictPriority')}</p>
                  </div>
                </div>
              )}

              {/* Form Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddRule(false);
                    resetForm();
                  }}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 transition-colors"
                >
                  {t('commissionRules.modal.cancel')}
                </button>
                <button
                  onClick={handleSaveRule}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  {editingRule ? t('commissionRules.modal.updateRule') : t('commissionRules.modal.addRuleBtn')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommissionRulesManager;