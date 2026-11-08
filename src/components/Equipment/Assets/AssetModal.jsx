import React, { useState, useEffect, useRef, useCallback, useMemo, lazy, Suspense } from 'react';
import {
  X, Save, FileArchive, TbTool, Code, AlertCircle, RefreshCw,
  Layers, MapPin, Calendar, Shield, ChevronDown, ChevronUp, ChevronRight,
} from 'lucide-react';
import { assetAPI } from '../../../services/api';
import toast from 'react-hot-toast';

const AssetSelectionModal = lazy(() => import('./AssetSelectionModal'));

const generateCodeFromName = (name) => {
  if (!name || !name.trim()) return '';
  const words = name.trim().split(/\s+/);
  return words.map(w => w[0]).join('').toUpperCase().slice(0, 5);
};

const AssetModal = ({ show, asset, onClose, onSaved, assets = [], categoryOptions = [] }) => {
  const [saveLoading, setSaveLoading] = useState(false);
  const [expandedSection, setExpandedSection] = useState(null);
  const [jsonError, setJsonError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const [showParentModal, setShowParentModal] = useState(false);
  const [autoGenerateCode, setAutoGenerateCode] = useState(true);

  const isEdit = !!asset;

  const [formData, setFormData] = useState({
    name: '', code: '', description: '', category: '',
    parent_id: '', location_id: '', status: 'Operational',
    criticality: 'Low', warranty_expiry_date: '', installation_date: '',
    specifications: '',
  });

  const defaultSpecifications = `{
  "manufacturer": "",
  "model": "",
  "serial_number": "",
  "power_rating": "",
  "dimensions": "",
  "notes": ""
}`;

  const statusOptions = [
    { value: 'Operational', label: 'Operational' },
    { value: 'UnderMaintenance', label: 'Under Maintenance' },
    { value: 'BrokenDown', label: 'Broken Down' },
    { value: 'Decommissioned', label: 'Decommissioned' },
  ];

  const criticalityOptions = [
    { value: 'Low', label: 'Low', color: 'text-green-700 bg-green-50 border-green-200' },
    { value: 'Medium', label: 'Medium', color: 'text-yellow-700 bg-yellow-50 border-yellow-200' },
    { value: 'High', label: 'High', color: 'text-orange-700 bg-orange-50 border-orange-200' },
    { value: 'Critical', label: 'Critical', color: 'text-red-700 bg-red-50 border-red-200' },
  ];

  const selectedParentName = useMemo(() => {
    if (!formData.parent_id) return 'None';
    const parent = assets.find(a => a.id === formData.parent_id);
    return parent ? parent.name : 'None';
  }, [formData.parent_id, assets]);

  const validateJSON = useCallback(jsonString => {
    try {
      if (!jsonString?.trim()) { setJsonError(null); return true; }
      const parsed = JSON.parse(jsonString);
      if (typeof parsed !== 'object') { setJsonError('Specifications must be a JSON object'); return false; }
      setJsonError(null); return true;
    } catch (error) {
      setJsonError(`Invalid JSON: ${error.message}`); return false;
    }
  }, []);

  useEffect(() => {
    if (asset) {
      setFormData({
        name: asset.name || '',
        code: asset.code || '',
        description: asset.description || '',
        category: asset.category || '',
        parent_id: asset.parent_id || '',
        location_id: asset.location_id || '',
        status: asset.status || 'Operational',
        criticality: asset.criticality || 'Low',
        warranty_expiry_date: asset.warranty_expiry_date || '',
        installation_date: asset.installation_date || '',
        specifications: asset.specifications
          ? (() => {
              try {
                const spec = typeof asset.specifications === 'string'
                  ? JSON.parse(asset.specifications)
                  : asset.specifications;
                return JSON.stringify(spec, null, 2);
              } catch (e) { return ''; }
            })()
          : '',
      });
      setAutoGenerateCode(!asset.code);
      setValidationErrors({});
    } else {
      setFormData({
        name: '', code: '', description: '', category: '',
        parent_id: '', location_id: '', status: 'Operational',
        criticality: 'Low', warranty_expiry_date: '', installation_date: '',
        specifications: defaultSpecifications,
      });
      setAutoGenerateCode(true);
      setJsonError(null);
      setValidationErrors({});
    }
  }, [asset]);

  useEffect(() => {
    if (autoGenerateCode && show && !isEdit) {
      const generated = generateCodeFromName(formData.name);
      handleInputChange('code', generated);
    }
  }, [formData.name, autoGenerateCode, isEdit, show]);

  useEffect(() => {
    const handler = e => { if (e.key === 'Escape' && show && !saveLoading) onClose(); };
    if (show) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [show, saveLoading, onClose]);

  if (!show) return null;

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (validationErrors[field]) {
      setValidationErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
    }
    if (field === 'specifications') validateJSON(value);
  };

  const handleParentSelect = (parentAsset) => {
    handleInputChange('parent_id', parentAsset ? parentAsset.id : '');
    setShowParentModal(false);
  };

  const formatJSON = () => {
    if (!formData.specifications?.trim()) { handleInputChange('specifications', '{}'); return; }
    try {
      const formatted = JSON.stringify(JSON.parse(formData.specifications), null, 2);
      handleInputChange('specifications', formatted);
      setJsonError(null);
      toast.success('JSON formatted successfully');
    } catch (e) {
      setJsonError(`Cannot format: ${e.message}`);
      toast.error('Invalid JSON - cannot format');
    }
  };

  const loadDefaultSpecifications = () => {
    handleInputChange('specifications', defaultSpecifications);
    setJsonError(null);
    toast.success('Default specifications loaded');
  };

  const clearSpecifications = () => {
    handleInputChange('specifications', '');
    setJsonError(null);
    toast.success('Specifications cleared');
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name?.trim()) errors.name = 'Name is required';
    if (formData.category && formData.category.trim().length === 0) errors.category = 'Category cannot be empty'; // optional
    if (formData.specifications?.trim() && !validateJSON(formData.specifications)) errors.specifications = 'Invalid JSON format';
    setValidationErrors(errors);
    if (Object.keys(errors).length) {
      toast.error(Object.values(errors)[0]);
      return false;
    }
    return true;
  };

  const handleSaveAsset = async (forcedStatus = null) => {
    if (!validateForm()) return;

    const payload = {
      name: formData.name.trim(),
      code: formData.code.trim() || null,
      description: formData.description.trim() || null,
      category: formData.category.trim() || null,
      parent_id: formData.parent_id || null,
      location_id: formData.location_id.trim() || null,
      status: forcedStatus || formData.status,
      criticality: formData.criticality,
      warranty_expiry_date: formData.warranty_expiry_date || null,
      installation_date: formData.installation_date || null,
      specifications: formData.specifications?.trim()
        ? (() => { try { return JSON.parse(formData.specifications); } catch { return null; } })()
        : null,
    };

    setSaveLoading(true);
    try {
      const response = asset
        ? await assetAPI.updateAsset(asset.id, payload)
        : await assetAPI.createAsset(payload);
      onSaved();
      toast.success('Asset saved successfully!');
    } catch (err) {
      console.error('Save asset error:', err.response?.data || err);
      toast.error(err.response?.data?.message || 'Failed to save asset');
    } finally {
      setSaveLoading(false);
    }
  };

  const toggleSection = section => setExpandedSection(expandedSection === section ? null : section);
  const excludeId = asset?.id || null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-1 z-50">
      <div className="bg-white rounded-md max-w-4xl w-full h-[95vh] flex flex-col shadow-xl">
        <div className="flex-shrink-0 flex items-center justify-between p-3 border-b">
          <div>
            <h2 className="text-base font-semibold">{asset ? 'Edit Asset' : 'Create Asset'}</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {asset ? `Editing: ${asset.name}` : 'Add asset details'}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1" disabled={saveLoading}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                <TbTool className="w-3.5 h-3.5" /> Basic Information
              </h3>

              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">
                  Name <span className="text-red-500">*</span>
                </label>
                <input type="text" value={formData.name}
                  onChange={e => handleInputChange('name', e.target.value)}
                  className={`w-full px-2.5 py-1.5 border rounded text-sm focus:ring-1 focus:ring-primary-500 ${validationErrors.name ? 'border-red-500' : ''}`}
                  placeholder="Asset name" disabled={saveLoading} autoFocus />
                {validationErrors.name && <p className="text-xs text-red-600 mt-1">{validationErrors.name}</p>}
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Code</label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 relative">
                    <input type="text"
                      value={formData.code}
                      onChange={e => handleInputChange('code', e.target.value)}
                      disabled={autoGenerateCode || saveLoading || isEdit}
                      className={`w-full px-2.5 py-1.5 border rounded text-sm focus:ring-1 focus:ring-primary-500 ${
                        autoGenerateCode || isEdit ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''
                      }`}
                      placeholder={autoGenerateCode ? 'Auto‑generated from name' : 'Short code (e.g., PUMP01)'}
                    />
                    {autoGenerateCode && (
                      <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none">
                        <RefreshCw className="w-3 h-3 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer select-none whitespace-nowrap">
                    <input type="checkbox"
                      checked={autoGenerateCode}
                      onChange={e => {
                        const checked = e.target.checked;
                        setAutoGenerateCode(checked);
                        if (checked && !isEdit) {
                          const generated = generateCodeFromName(formData.name);
                          handleInputChange('code', generated);
                        }
                      }}
                      disabled={saveLoading || isEdit}
                      className="rounded border-gray-300 text-primary-600 focus:ring-1 focus:ring-primary-500 w-3.5 h-3.5"
                    />
                    Auto
                  </label>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Description</label>
                <textarea rows="3" value={formData.description}
                  onChange={e => handleInputChange('description', e.target.value)}
                  className="w-full px-2.5 py-1.5 border rounded text-sm focus:ring-1 focus:ring-primary-500 resize-none"
                  placeholder="Asset description" disabled={saveLoading} />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Category</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={e => handleInputChange('category', e.target.value)}
                  list="asset-category-list"
                  className="w-full px-2.5 py-1.5 border rounded text-sm focus:ring-1 focus:ring-primary-500"
                  placeholder="e.g., Pump, Motor, Conveyor"
                  disabled={saveLoading}
                />
                {categoryOptions.length > 0 && (
                  <datalist id="asset-category-list">
                    {categoryOptions.map((cat, idx) => (
                      <option key={idx} value={cat} />
                    ))}
                  </datalist>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">Status</label>
                  <select value={formData.status} onChange={e => handleInputChange('status', e.target.value)}
                    className="w-full px-2.5 py-1.5 border rounded text-sm focus:ring-1 focus:ring-primary-500" disabled={saveLoading}>
                    {statusOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">Criticality</label>
                  <select value={formData.criticality} onChange={e => handleInputChange('criticality', e.target.value)}
                    className="w-full px-2.5 py-1.5 border rounded text-sm focus:ring-1 focus:ring-primary-500" disabled={saveLoading}>
                    {criticalityOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" /> Location & Dates
              </h3>

              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Parent Asset</label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 px-2.5 py-1.5 border rounded text-sm bg-white flex items-center justify-between cursor-pointer hover:bg-gray-50"
                    onClick={() => !saveLoading && setShowParentModal(true)}>
                    <span className={formData.parent_id ? 'text-gray-900' : 'text-gray-400'}>{selectedParentName}</span>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                  {formData.parent_id && (
                    <button onClick={() => handleInputChange('parent_id', '')} className="p-1 text-gray-400 hover:text-red-600">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Location ID</label>
                <input type="text" value={formData.location_id}
                  onChange={e => handleInputChange('location_id', e.target.value)}
                  className="w-full px-2.5 py-1.5 border rounded text-sm focus:ring-1 focus:ring-primary-500"
                  placeholder="Location identifier" disabled={saveLoading} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">Warranty Expiry</label>
                  <input type="date" value={formData.warranty_expiry_date}
                    onChange={e => handleInputChange('warranty_expiry_date', e.target.value)}
                    className="w-full px-2.5 py-1.5 border rounded text-sm focus:ring-1 focus:ring-primary-500"
                    disabled={saveLoading} />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">Installation Date</label>
                  <input type="date" value={formData.installation_date}
                    onChange={e => handleInputChange('installation_date', e.target.value)}
                    className="w-full px-2.5 py-1.5 border rounded text-sm focus:ring-1 focus:ring-primary-500"
                    disabled={saveLoading} />
                </div>
              </div>

              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" /> Specifications (JSON)
                </h3>
              </div>
            </div>
          </div>

          <div className={`mt-4 border rounded-lg overflow-hidden ${validationErrors.specifications ? 'border-red-300' : 'border-gray-200'}`}>
            <button onClick={() => toggleSection('specifications')}
              className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100" disabled={saveLoading}>
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4" />
                <span className="text-sm font-medium">Specifications (JSON)</span>
                {jsonError && <span className="text-xs text-red-600 ml-2"><AlertCircle className="w-3 h-3 inline" /> JSON Error</span>}
              </div>
              {expandedSection === 'specifications' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {expandedSection === 'specifications' && (
              <div className="p-3 space-y-3 bg-white">
                <div className="flex flex-wrap gap-2 mb-2">
                  <button onClick={loadDefaultSpecifications} disabled={saveLoading} className="px-3 py-1.5 text-xs bg-green-50 text-green-700 rounded hover:bg-green-100 disabled:opacity-50">Load Default</button>
                  <button onClick={formatJSON} disabled={saveLoading} className="px-3 py-1.5 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100 disabled:opacity-50"><Code className="w-3 h-3 inline" /> Format JSON</button>
                  <button onClick={clearSpecifications} disabled={saveLoading} className="px-3 py-1.5 text-xs bg-red-50 text-red-700 rounded hover:bg-red-100 disabled:opacity-50">Clear</button>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-gray-700">Enter specifications as JSON</label>
                    <span className="text-xs text-gray-500">{formData.specifications.length} characters</span>
                  </div>
                  <textarea rows="8" value={formData.specifications}
                    onChange={e => handleInputChange('specifications', e.target.value)}
                    className={`w-full px-3 py-2 border rounded text-sm font-mono resize-none focus:ring-1 ${jsonError || validationErrors.specifications ? 'border-red-300 focus:ring-red-500' : 'focus:ring-primary-500'}`}
                    placeholder={`{\n  "manufacturer": "",\n  "model": "",\n  "serial_number": "",\n  "power_rating": "",\n  "dimensions": "",\n  "notes": ""\n}`}
                    disabled={saveLoading} spellCheck="false" />
                  {(jsonError || validationErrors.specifications) && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                      <p className="text-xs text-red-700"><AlertCircle className="w-3 h-3 inline mr-1" />{jsonError || validationErrors.specifications}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex-shrink-0 flex items-center justify-between p-3 border-t bg-gray-50">
          <p className="text-xs text-gray-500">
            {asset?.updatedAt ? `Updated: ${new Date(asset.updatedAt).toLocaleDateString()}` : 'New asset'}
          </p>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-3 py-1.5 text-xs border rounded bg-white hover:bg-gray-50" disabled={saveLoading}>Cancel</button>
            <button onClick={() => handleSaveAsset('Decommissioned')}
              className="px-3 py-1.5 text-xs border rounded bg-gray-100 text-gray-700 hover:bg-gray-200 flex items-center gap-1.5 disabled:opacity-50"
              disabled={saveLoading || Object.keys(validationErrors).length > 0}>
              <FileArchive className="w-3 h-3" /> Decommission
            </button>
            <button onClick={() => handleSaveAsset()}
              className="px-3 py-1.5 text-xs border rounded bg-primary-600 text-white hover:bg-primary-700 flex items-center gap-1.5 disabled:opacity-50"
              disabled={saveLoading || Object.keys(validationErrors).length > 0}>
              <Save className="w-3 h-3" /> {saveLoading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>

      <Suspense fallback={null}>
        <AssetSelectionModal
          show={showParentModal}
          onClose={() => setShowParentModal(false)}
          onSelect={handleParentSelect}
          selectedAssetId={formData.parent_id || null}
          excludeId={excludeId}
        />
      </Suspense>
    </div>
  );
};

export default React.memo(AssetModal);