// CommissionRulesManager.jsx - Fixed for your schema
import React, { useState, useEffect } from "react";
import { supabase } from "../../../../lib/supabaseClient";
import { 
  Percent, 
  Plus, 
  Edit, 
  Trash2, 
  X,
  Save,
  Filter,
  RefreshCw,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";

const CommissionRulesManager = () => {
  const [rules, setRules] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddRule, setShowAddRule] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [ruleForm, setRuleForm] = useState({
    applies_to: 'dealtock', // 'seller', 'dropshipper', 'dealtock'
    category: '',
    percentage: '10',
    min_amount: '',
    max_amount: '',
    is_active: true,
    valid_from: new Date().toISOString().split('T')[0],
    valid_to: ''
  });

  useEffect(() => {
    loadCommissionData();
  }, []);

  const loadCommissionData = async () => {
    try {
      setLoading(true);
      
      // Fetch commission rules
      const { data: rulesData, error: rulesError } = await supabase
        .from('commission_rules')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (rulesError) {
        console.error('Rules fetch error:', rulesError);
        toast.error('Failed to load commission rules');
        setRules([]);
      } else {
        setRules(rulesData || []);
      }

      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('id, name');
      
      if (categoriesError) {
        console.error('Categories fetch error:', categoriesError);
        setCategories([]);
      } else {
        setCategories(categoriesData || []);
      }

    } catch (error) {
      console.error('Error loading commission data:', error);
      toast.error('Failed to load commission data');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRule = async () => {
    try {
      // Validate form
      if (!ruleForm.applies_to) {
        toast.error('Please select who this rule applies to');
        return;
      }

      if (!ruleForm.percentage || parseFloat(ruleForm.percentage) <= 0) {
        toast.error('Please enter a valid percentage');
        return;
      }

      const ruleData = {
        applies_to: ruleForm.applies_to,
        category: ruleForm.category || null,
        percentage: parseFloat(ruleForm.percentage),
        min_amount: ruleForm.min_amount ? parseFloat(ruleForm.min_amount) : null,
        max_amount: ruleForm.max_amount ? parseFloat(ruleForm.max_amount) : null,
        is_active: ruleForm.is_active,
        valid_from: ruleForm.valid_from || new Date().toISOString().split('T')[0],
        valid_to: ruleForm.valid_to || null
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

      toast.success(editingRule ? 'Rule updated successfully' : 'Rule created successfully');
      setShowAddRule(false);
      setEditingRule(null);
      loadCommissionData();
      
    } catch (error) {
      console.error('Error saving rule:', error);
      toast.error('Failed to save commission rule: ' + error.message);
    }
  };

  const handleEditRule = (rule) => {
    setEditingRule(rule);
    setRuleForm({
      applies_to: rule.applies_to || 'dealtock',
      category: rule.category || '',
      percentage: rule.percentage?.toString() || '10',
      min_amount: rule.min_amount?.toString() || '',
      max_amount: rule.max_amount?.toString() || '',
      is_active: rule.is_active ?? true,
      valid_from: rule.valid_from?.split('T')[0] || new Date().toISOString().split('T')[0],
      valid_to: rule.valid_to?.split('T')[0] || ''
    });
    setShowAddRule(true);
  };

  const handleDeleteRule = async (ruleId) => {
    if (!window.confirm('Are you sure you want to delete this commission rule?')) return;

    try {
      const { error } = await supabase
        .from('commission_rules')
        .delete()
        .eq('id', ruleId);

      if (error) throw error;

      toast.success('Rule deleted successfully');
      loadCommissionData();
    } catch (error) {
      console.error('Error deleting rule:', error);
      toast.error('Failed to delete rule');
    }
  };

  const handleToggleActive = async (rule) => {
    try {
      const { error } = await supabase
        .from('commission_rules')
        .update({ is_active: !rule.is_active })
        .eq('id', rule.id);

      if (error) throw error;

      toast.success(`Rule ${rule.is_active ? 'deactivated' : 'activated'}`);
      loadCommissionData();
    } catch (error) {
      console.error('Error toggling rule:', error);
      toast.error('Failed to update rule status');
    }
  };

  const resetForm = () => {
    setRuleForm({
      applies_to: 'dealtock',
      category: '',
      percentage: '10',
      min_amount: '',
      max_amount: '',
      is_active: true,
      valid_from: new Date().toISOString().split('T')[0],
      valid_to: ''
    });
    setEditingRule(null);
  };

  // Calculate stats
  const stats = {
    total: rules.length,
    active: rules.filter(r => r.is_active).length,
    seller: rules.filter(r => r.applies_to === 'seller').length,
    dropshipper: rules.filter(r => r.applies_to === 'dropshipper').length,
    dealtock: rules.filter(r => r.applies_to === 'dealtock').length
  };

  const getCategoryName = (categoryId) => {
    if (!categoryId) return 'All Categories';
    const category = categories.find(c => c.id === categoryId);
    return category?.name || categoryId;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap gap-4 justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Percent className="w-6 h-6" />
            Commission Rules Management
          </h2>
          <p className="text-gray-600 text-sm mt-1">
            Configure platform fees for sellers, dropshippers, and Dealtock
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadCommissionData}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2 text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={() => {
              resetForm();
              setShowAddRule(true);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Commission Rule
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-600">Total Rules</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-600">Active Rules</p>
          <p className="text-2xl font-bold text-green-600">{stats.active}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-600">Seller Rules</p>
          <p className="text-2xl font-bold text-blue-600">{stats.seller}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-600">Dropshipper Rules</p>
          <p className="text-2xl font-bold text-purple-600">{stats.dropshipper}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-600">Dealtock Rules</p>
          <p className="text-2xl font-bold text-orange-600">{stats.dealtock}</p>
        </div>
      </div>

      {/* Rules Table */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading commission rules...</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-4 font-medium text-sm">Applies To</th>
                  <th className="text-left p-4 font-medium text-sm">Category</th>
                  <th className="text-left p-4 font-medium text-sm">Commission %</th>
                  <th className="text-left p-4 font-medium text-sm">Order Range (MAD)</th>
                  <th className="text-left p-4 font-medium text-sm">Valid Period</th>
                  <th className="text-left p-4 font-medium text-sm">Status</th>
                  <th className="text-left p-4 font-medium text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rules.map((rule) => (
                  <tr key={rule.id} className="border-t hover:bg-gray-50">
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        rule.applies_to === 'seller' ? 'bg-blue-100 text-blue-800' :
                        rule.applies_to === 'dropshipper' ? 'bg-purple-100 text-purple-800' :
                        'bg-orange-100 text-orange-800'
                      }`}>
                        {rule.applies_to?.charAt(0).toUpperCase() + rule.applies_to?.slice(1)}
                      </span>
                    </td>
                    <td className="p-4 text-sm">
                      {getCategoryName(rule.category)}
                    </td>
                    <td className="p-4 font-medium">
                      {rule.percentage}%
                    </td>
                    <td className="p-4 text-sm text-gray-600">
                      {rule.min_amount || 0} - {rule.max_amount || '∞'}
                    </td>
                    <td className="p-4 text-sm">
                      <div>{new Date(rule.valid_from).toLocaleDateString()}</div>
                      {rule.valid_to && (
                        <div className="text-xs text-gray-500">
                          to {new Date(rule.valid_to).toLocaleDateString()}
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => handleToggleActive(rule)}
                        className={`px-3 py-1 rounded-full text-xs font-medium cursor-pointer ${
                          rule.is_active 
                            ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                            : 'bg-red-100 text-red-800 hover:bg-red-200'
                        }`}
                      >
                        {rule.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditRule(rule)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteRule(rule.id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {rules.length === 0 && (
            <div className="text-center py-12">
              <Percent className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No commission rules configured.</p>
              <p className="text-sm text-gray-400 mt-1">
                Click "Add Commission Rule" to create your first rule.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Rule Modal */}
      {showAddRule && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-auto">
            <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white">
              <h3 className="text-xl font-bold">
                {editingRule ? 'Edit Commission Rule' : 'Add Commission Rule'}
              </h3>
              <button 
                onClick={() => {
                  setShowAddRule(false);
                  resetForm();
                }} 
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              {/* Applies To */}
              <div>
                <label className="block text-sm font-medium mb-1">Applies To *</label>
                <select
                  value={ruleForm.applies_to}
                  onChange={(e) => setRuleForm({...ruleForm, applies_to: e.target.value})}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="dealtock">Dealtock (Platform)</option>
                  <option value="seller">Seller</option>
                  <option value="dropshipper">Dropshipper</option>
                </select>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium mb-1">Category (Optional)</label>
                <select
                  value={ruleForm.category}
                  onChange={(e) => setRuleForm({...ruleForm, category: e.target.value})}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Leave empty to apply to all categories
                </p>
              </div>

              {/* Percentage */}
              <div>
                <label className="block text-sm font-medium mb-1">Commission Percentage *</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={ruleForm.percentage}
                    onChange={(e) => setRuleForm({...ruleForm, percentage: e.target.value})}
                    className="w-full p-2 border rounded-lg pr-8"
                    required
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">%</span>
                </div>
              </div>

              {/* Order Amount Range */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Min Order (MAD)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={ruleForm.min_amount}
                    onChange={(e) => setRuleForm({...ruleForm, min_amount: e.target.value})}
                    className="w-full p-2 border rounded-lg"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Max Order (MAD)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={ruleForm.max_amount}
                    onChange={(e) => setRuleForm({...ruleForm, max_amount: e.target.value})}
                    className="w-full p-2 border rounded-lg"
                    placeholder="No max"
                  />
                </div>
              </div>

              {/* Valid Period */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Valid From</label>
                  <input
                    type="date"
                    value={ruleForm.valid_from}
                    onChange={(e) => setRuleForm({...ruleForm, valid_from: e.target.value})}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Valid To (Optional)</label>
                  <input
                    type="date"
                    value={ruleForm.valid_to}
                    onChange={(e) => setRuleForm({...ruleForm, valid_to: e.target.value})}
                    className="w-full p-2 border rounded-lg"
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
                  className="rounded text-blue-600 mr-2"
                />
                <label htmlFor="isActive" className="text-sm font-medium">
                  Rule is active
                </label>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddRule(false);
                    resetForm();
                  }}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveRule}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {editingRule ? 'Update Rule' : 'Add Rule'}
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