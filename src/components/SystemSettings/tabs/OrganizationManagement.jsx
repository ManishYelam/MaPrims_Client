import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Edit, RefreshCw, Eye, EyeOff, Save } from 'lucide-react';
import { organizationAPI, dbConnectionAPI, policyAPI } from '../../../services/api';

const OrganizationManagement = ({ showMessage, showConfirmation }) => {
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState('org');
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [dbRefreshTrigger, setDbRefreshTrigger] = useState(0);
  const [policyRefreshTrigger, setPolicyRefreshTrigger] = useState(0);

  // ---------- Fetch all organizations ----------
  const fetchOrganizations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await organizationAPI.getAll();
      const orgList = res.data?.data || res.data || [];
      setOrganizations(orgList);
      if (orgList.length > 0 && !selectedOrg) {
        handleSelectOrg(orgList[0]);
      } else if (orgList.length === 0) {
        setSelectedOrg(null);
        setFormData({});
      }
    } catch (err) {
      showMessage('error', 'Failed to load organizations');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch DB & Policy details
  const fetchOrgDetails = useCallback(async (orgId) => {
    try {
      const [dbRes, policyRes] = await Promise.all([
        dbConnectionAPI.getByOrgId(orgId),
        policyAPI.getByOrgId(orgId),
      ]);
      return {
        dbConnection: dbRes.data?.data || null,
        policy: policyRes.data?.data || null,
      };
    } catch {
      return { dbConnection: null, policy: null };
    }
  }, []);

  const handleSelectOrg = useCallback(async (org) => {
    setSelectedOrg(org);
    setEditing(false);
    try {
      const fullOrgRes = await organizationAPI.getById(org.org_id);
      const fullOrg = fullOrgRes.data?.data || fullOrgRes.data || org;
      const details = await fetchOrgDetails(org.org_id);
      setFormData({ ...fullOrg, ...details });
    } catch {
      const details = await fetchOrgDetails(org.org_id);
      setFormData({ ...org, ...details });
    }
  }, [fetchOrgDetails]);

  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  // ---------- Organization upsert ----------
  const handleSaveOrg = useCallback(async () => {
    setSaving(true);
    try {
      let payload = { ...formData };
      if (!payload.org_id) payload.org_id = null;
      const res = await organizationAPI.createOrUpdate(payload);
      const savedOrg = res.data?.data || res.data;
      showMessage('success', formData.org_id ? 'Organization updated' : 'Organization created');
      await fetchOrganizations();
      setSelectedOrg(savedOrg);
      setEditing(false);
    } catch (err) {
      showMessage('error', err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  }, [formData, fetchOrganizations, showMessage]);

  // ---------- Database Connection Handlers ----------
  const handleSaveDbConnection = useCallback(async (dbData) => {
    try {
      if (formData.dbConnection?.database_id) {
        await dbConnectionAPI.update(formData.dbConnection.database_id, dbData);
        showMessage('success', 'Database connection updated');
      } else {
        await dbConnectionAPI.create({ ...dbData, org_id: selectedOrg.org_id });
        showMessage('success', 'Database connection created');
      }
      const details = await fetchOrgDetails(selectedOrg.org_id);
      setFormData(prev => ({ ...prev, dbConnection: details.dbConnection }));
      setDbRefreshTrigger(prev => prev + 1);
    } catch (err) {
      showMessage('error', err.response?.data?.message || 'Failed to save database connection');
    }
  }, [formData.dbConnection, selectedOrg, fetchOrgDetails, showMessage]);

  // ---------- Policy Handlers ----------
  const handleSavePolicy = useCallback(async (policyData) => {
    try {
      if (formData.policy?.policy_id) {
        await policyAPI.update(formData.policy.policy_id, policyData);
        showMessage('success', 'Policy updated');
      } else {
        await policyAPI.create({ ...policyData, org_id: selectedOrg.org_id });
        showMessage('success', 'Policy created');
      }
      const details = await fetchOrgDetails(selectedOrg.org_id);
      setFormData(prev => ({ ...prev, policy: details.policy }));
      setPolicyRefreshTrigger(prev => prev + 1);
    } catch (err) {
      showMessage('error', err.response?.data?.message || 'Failed to save policy');
    }
  }, [formData.policy, selectedOrg, fetchOrgDetails, showMessage]);

  // ---------- Organization Form (edit mode) ----------
  const renderOrgForm = () => (
    <div className="space-y-1.5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-1 text-[0.65rem]">
        <div><label className="block font-medium mb-0.5">Name *</label><input value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} className="border rounded p-1 w-full" /></div>
        <div><label className="block font-medium mb-0.5">Branch ID</label><input type="number" value={formData.branch_id || ''} onChange={e => setFormData({ ...formData, branch_id: e.target.value ? parseInt(e.target.value) : null })} className="border rounded p-1 w-full" /></div>
        <div><label className="block font-medium mb-0.5">Email *</label><input value={formData.email || ''} onChange={e => setFormData({ ...formData, email: e.target.value })} className="border rounded p-1 w-full" /></div>
        <div><label className="block font-medium mb-0.5">Phone</label><input value={formData.phone || ''} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="border rounded p-1 w-full" /></div>
        <div><label className="block font-medium mb-0.5">Website</label><input value={formData.website || ''} onChange={e => setFormData({ ...formData, website: e.target.value })} className="border rounded p-1 w-full" /></div>
        <div><label className="block font-medium mb-0.5">Industry Type</label><input value={formData.industry_type || ''} onChange={e => setFormData({ ...formData, industry_type: e.target.value })} className="border rounded p-1 w-full" /></div>
        <div><label className="block font-medium mb-0.5">Number of Employees</label><input type="number" value={formData.num_employees || ''} onChange={e => setFormData({ ...formData, num_employees: e.target.value ? parseInt(e.target.value) : null })} className="border rounded p-1 w-full" /></div>
        <div><label className="block font-medium mb-0.5">Registration Number</label><input value={formData.registration_number || ''} onChange={e => setFormData({ ...formData, registration_number: e.target.value })} className="border rounded p-1 w-full" /></div>
        <div><label className="block font-medium mb-0.5">Tax ID</label><input value={formData.tax_id || ''} onChange={e => setFormData({ ...formData, tax_id: e.target.value })} className="border rounded p-1 w-full" /></div>
        <div><label className="block font-medium mb-0.5">Founder Name</label><input value={formData.founder_name || ''} onChange={e => setFormData({ ...formData, founder_name: e.target.value })} className="border rounded p-1 w-full" /></div>
        <div><label className="block font-medium mb-0.5">Founded Date</label><input type="date" value={formData.founded_date ? formData.founded_date.split('T')[0] : ''} onChange={e => setFormData({ ...formData, founded_date: e.target.value })} className="border rounded p-1 w-full" /></div>
        <div><label className="block font-medium mb-0.5">Status</label><select value={formData.status || 'active'} onChange={e => setFormData({ ...formData, status: e.target.value })} className="border rounded p-1 w-full"><option value="active">Active</option><option value="inactive">Inactive</option></select></div>
        <div className="col-span-2"><label className="block font-medium mb-0.5">Address</label><textarea value={formData.address || ''} onChange={e => setFormData({ ...formData, address: e.target.value })} rows="2" className="border rounded p-1 w-full" /></div>
        <div className="col-span-2"><label className="block font-medium mb-0.5">Logo URL</label><input value={formData.logo || ''} onChange={e => setFormData({ ...formData, logo: e.target.value })} className="border rounded p-1 w-full" /></div>
        <div className="col-span-2"><label className="block font-medium mb-0.5">Social Links (JSON)</label><textarea value={JSON.stringify(formData.social_links || {})} onChange={e => { try { setFormData({ ...formData, social_links: JSON.parse(e.target.value) }); } catch(e) {} }} rows="2" className="border rounded p-1 w-full font-mono text-[0.65rem]" /></div>
        <div className="col-span-2"><label className="block font-medium mb-0.5">Email Settings (JSON)</label><textarea value={JSON.stringify(formData.email_settings || {})} onChange={e => { try { setFormData({ ...formData, email_settings: JSON.parse(e.target.value) }); } catch(e) {} }} rows="2" className="border rounded p-1 w-full font-mono text-[0.65rem]" /></div>
        <div className="col-span-2"><label className="block font-medium mb-0.5">Terms & Conditions</label><textarea value={formData.terms_and_aonditions || ''} onChange={e => setFormData({ ...formData, terms_and_aonditions: e.target.value })} rows="2" className="border rounded p-1 w-full" /></div>
        <div className="col-span-2"><label className="block font-medium mb-0.5">Privacy Policy</label><textarea value={formData.privacy_policy || ''} onChange={e => setFormData({ ...formData, privacy_policy: e.target.value })} rows="2" className="border rounded p-1 w-full" /></div>
        <div className="col-span-2"><label className="block font-medium mb-0.5">API Key</label><input value={formData.api_key || ''} onChange={e => setFormData({ ...formData, api_key: e.target.value })} className="border rounded p-1 w-full" /></div>
      </div>
      <div className="flex justify-end gap-1">
        <button onClick={() => setEditing(false)} className="px-2 py-0.5 border rounded text-[0.65rem]">Cancel</button>
        <button onClick={handleSaveOrg} disabled={saving} className="px-2 py-0.5 bg-primary-600 text-white rounded text-[0.65rem]">{saving ? 'Saving...' : 'Save'}</button>
      </div>
    </div>
  );

  const renderOrgView = () => (
    <div>
      <div className="grid grid-cols-2 gap-1 text-[0.65rem] mb-2">
        <div><span className="font-medium">ID:</span> {selectedOrg?.org_id}</div>
        <div><span className="font-medium">Name:</span> {selectedOrg?.name}</div>
        <div><span className="font-medium">Branch ID:</span> {selectedOrg?.branch_id ?? '—'}</div>
        <div><span className="font-medium">Email:</span> {selectedOrg?.email}</div>
        <div><span className="font-medium">Phone:</span> {selectedOrg?.phone || '—'}</div>
        <div><span className="font-medium">Website:</span> {selectedOrg?.website || '—'}</div>
        <div><span className="font-medium">Industry:</span> {selectedOrg?.industry_type || '—'}</div>
        <div><span className="font-medium">Employees:</span> {selectedOrg?.num_employees || '—'}</div>
        <div><span className="font-medium">Registration No.:</span> {selectedOrg?.registration_number || '—'}</div>
        <div><span className="font-medium">Tax ID:</span> {selectedOrg?.tax_id || '—'}</div>
        <div><span className="font-medium">Founder:</span> {selectedOrg?.founder_name || '—'}</div>
        <div><span className="font-medium">Founded:</span> {selectedOrg?.founded_date ? new Date(selectedOrg.founded_date).toLocaleDateString() : '—'}</div>
        <div><span className="font-medium">Logo:</span> {selectedOrg?.logo ? <a href={selectedOrg.logo} target="_blank" rel="noopener noreferrer" className="text-primary-600">Link</a> : '—'}</div>
        <div><span className="font-medium">Status:</span> <span className={`px-1 py-0.5 rounded-full text-[0.6rem] ${selectedOrg?.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{selectedOrg?.status}</span></div>
        <div className="col-span-2"><span className="font-medium">Address:</span> {selectedOrg?.address || '—'}</div>
        <div className="col-span-2"><span className="font-medium">Social Links:</span> <pre className="text-[0.6rem] bg-gray-50 p-1 rounded overflow-x-auto">{JSON.stringify(selectedOrg?.social_links || {}, null, 2)}</pre></div>
        <div className="col-span-2"><span className="font-medium">Email Settings:</span> <pre className="text-[0.6rem] bg-gray-50 p-1 rounded overflow-x-auto">{JSON.stringify(selectedOrg?.email_settings || {}, null, 2)}</pre></div>
        <div className="col-span-2"><span className="font-medium">Terms:</span> {selectedOrg?.terms_and_aonditions || '—'}</div>
        <div className="col-span-2"><span className="font-medium">Privacy:</span> {selectedOrg?.privacy_policy || '—'}</div>
        <div className="col-span-2"><span className="font-medium">API Key:</span> {selectedOrg?.api_key || '—'}</div>
      </div>
      <div className="flex gap-1">
        <button onClick={() => setEditing(true)} className="px-2 py-0.5 bg-primary-600 text-white rounded text-[0.65rem] flex items-center gap-0.5"><Edit size={10} /> Edit</button>
      </div>
    </div>
  );

  // ---------- Database Connection Form ----------
  const DbConnectionForm = () => {
    const [localLoading, setLocalLoading] = useState(false);
    const [localSaving, setLocalSaving] = useState(false);
    const [dbForm, setDbForm] = useState({
      db_host: 'localhost',
      db_port: 3306,
      db_name: '',
      db_user: '',
      db_password: '',
      dialect: 'mysql',
      pool_max: 5,
      pool_min: 0,
      pool_acquire: 10000,
      pool_idle: 10000,
      is_active: true,
      extra_config: {},
    });
    const [existingConnId, setExistingConnId] = useState(null);

    const loadConnection = useCallback(async () => {
      if (!selectedOrg) return;
      setLocalLoading(true);
      try {
        const res = await dbConnectionAPI.getByOrgId(selectedOrg.org_id);
        const conn = res.data?.data;
        if (conn) {
          setExistingConnId(conn.database_id);
          setDbForm({
            db_host: conn.db_host || 'localhost',
            db_port: conn.db_port || 3306,
            db_name: conn.db_name || '',
            db_user: conn.db_user || '',
            db_password: '',
            dialect: conn.dialect || 'mysql',
            pool_max: conn.pool_max ?? 5,
            pool_min: conn.pool_min ?? 0,
            pool_acquire: conn.pool_acquire ?? 10000,
            pool_idle: conn.pool_idle ?? 10000,
            is_active: conn.is_active !== undefined ? conn.is_active : true,
            extra_config: conn.extra_config || {},
          });
        } else {
          setExistingConnId(null);
          setDbForm({
            db_host: 'localhost',
            db_port: 3306,
            db_name: '',
            db_user: '',
            db_password: '',
            dialect: 'mysql',
            pool_max: 5,
            pool_min: 0,
            pool_acquire: 10000,
            pool_idle: 10000,
            is_active: true,
            extra_config: {},
          });
        }
      } catch (err) {
        showMessage('error', 'Could not load database connection');
      } finally {
        setLocalLoading(false);
      }
    }, [selectedOrg, showMessage]);

    useEffect(() => {
      loadConnection();
    }, [loadConnection, dbRefreshTrigger]);

    const handleSave = async () => {
      setLocalSaving(true);
      try {
        const payload = {
          db_host: dbForm.db_host,
          db_port: dbForm.db_port,
          db_name: dbForm.db_name,
          db_user: dbForm.db_user,
          dialect: dbForm.dialect,
          pool_max: dbForm.pool_max,
          pool_min: dbForm.pool_min,
          pool_acquire: dbForm.pool_acquire,
          pool_idle: dbForm.pool_idle,
          is_active: dbForm.is_active,
          extra_config: dbForm.extra_config,
        };
        if (dbForm.db_password) payload.db_password = dbForm.db_password;

        if (existingConnId) {
          await dbConnectionAPI.update(existingConnId, payload);
          showMessage('success', 'Database connection updated');
        } else {
          await dbConnectionAPI.create({ ...payload, org_id: selectedOrg.org_id });
          showMessage('success', 'Database connection created');
        }
        const details = await fetchOrgDetails(selectedOrg.org_id);
        setFormData(prev => ({ ...prev, dbConnection: details.dbConnection }));
        setDbRefreshTrigger(prev => prev + 1);
      } catch (err) {
        showMessage('error', err.response?.data?.message || 'Failed to save database connection');
      } finally {
        setLocalSaving(false);
      }
    };

    if (localLoading) return <div className="text-center py-2">Loading DB config...</div>;

    return (
      <div className="space-y-1.5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-1 text-[0.65rem]">
          <div><label className="block font-medium mb-0.5">Host *</label><input value={dbForm.db_host} onChange={e => setDbForm({ ...dbForm, db_host: e.target.value })} className="border rounded p-1 w-full" /></div>
          <div><label className="block font-medium mb-0.5">Port *</label><input type="number" value={dbForm.db_port} onChange={e => setDbForm({ ...dbForm, db_port: parseInt(e.target.value) || 3306 })} className="border rounded p-1 w-full" /></div>
          <div><label className="block font-medium mb-0.5">Database Name *</label><input value={dbForm.db_name} onChange={e => setDbForm({ ...dbForm, db_name: e.target.value })} className="border rounded p-1 w-full" /></div>
          <div><label className="block font-medium mb-0.5">Username *</label><input value={dbForm.db_user} onChange={e => setDbForm({ ...dbForm, db_user: e.target.value })} className="border rounded p-1 w-full" /></div>
          <div>
            <label className="block font-medium mb-0.5">Password {existingConnId ? '(new)' : '*'}</label>
            <div className="relative">
              <input type={showPassword ? "text" : "password"} value={dbForm.db_password} onChange={e => setDbForm({ ...dbForm, db_password: e.target.value })} className="border rounded p-1 w-full pr-6" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-1 top-0.5">{showPassword ? <EyeOff size={12} /> : <Eye size={12} />}</button>
            </div>
            {existingConnId && <p className="text-[0.6rem] text-gray-400 mt-0.5">Leave blank to keep existing</p>}
          </div>
          <div><label className="block font-medium mb-0.5">Dialect</label><select value={dbForm.dialect} onChange={e => setDbForm({ ...dbForm, dialect: e.target.value })} className="border rounded p-1 w-full"><option value="mysql">MySQL</option><option value="postgres">PostgreSQL</option><option value="mariadb">MariaDB</option><option value="mssql">SQL Server</option></select></div>
          <div><label className="block font-medium mb-0.5">Pool Max</label><input type="number" value={dbForm.pool_max} onChange={e => setDbForm({ ...dbForm, pool_max: parseInt(e.target.value) })} className="border rounded p-1 w-full" /></div>
          <div><label className="block font-medium mb-0.5">Pool Min</label><input type="number" value={dbForm.pool_min} onChange={e => setDbForm({ ...dbForm, pool_min: parseInt(e.target.value) })} className="border rounded p-1 w-full" /></div>
          <div><label className="block font-medium mb-0.5">Acquire (ms)</label><input type="number" value={dbForm.pool_acquire} onChange={e => setDbForm({ ...dbForm, pool_acquire: parseInt(e.target.value) })} className="border rounded p-1 w-full" /></div>
          <div><label className="block font-medium mb-0.5">Idle (ms)</label><input type="number" value={dbForm.pool_idle} onChange={e => setDbForm({ ...dbForm, pool_idle: parseInt(e.target.value) })} className="border rounded p-1 w-full" /></div>
          <div className="flex items-center gap-1 col-span-2"><input type="checkbox" checked={dbForm.is_active} onChange={e => setDbForm({ ...dbForm, is_active: e.target.checked })} /><label className="font-medium">Active connection</label></div>
          <div className="col-span-2"><label className="block font-medium mb-0.5">Extra Config (JSON)</label><textarea rows="2" value={JSON.stringify(dbForm.extra_config, null, 2)} onChange={e => { try { setDbForm({ ...dbForm, extra_config: JSON.parse(e.target.value) }); } catch(e) {} }} className="border rounded p-1 w-full font-mono text-[0.65rem]" /></div>
        </div>
        <button onClick={handleSave} disabled={localSaving} className="px-2 py-0.5 bg-primary-600 text-white rounded text-[0.65rem] disabled:opacity-50">{localSaving ? 'Saving...' : existingConnId ? 'Update DB' : 'Create DB'}</button>
      </div>
    );
  };

  // ---------- Policy Form ----------
  const PolicyForm = () => {
    const [localLoading, setLocalLoading] = useState(false);
    const [localSaving, setLocalSaving] = useState(false);
    const [policyForm, setPolicyForm] = useState({
      max_users: 10,
      max_storage_mb: 1024,
      billing_plan: 'free',
      require_mfa: false,
      session_timeout_minutes: 120,
      data_retention_days: 365,
      feature_flags: {},
      custom_settings: {},
      is_active: true,
    });
    const [existingPolicyId, setExistingPolicyId] = useState(null);

    const loadPolicy = useCallback(async () => {
      if (!selectedOrg) return;
      setLocalLoading(true);
      try {
        const res = await policyAPI.getByOrgId(selectedOrg.org_id);
        const policy = res.data?.data;
        if (policy) {
          setExistingPolicyId(policy.policy_id);
          setPolicyForm({
            max_users: policy.max_users ?? 10,
            max_storage_mb: policy.max_storage_mb ?? 1024,
            billing_plan: policy.billing_plan || 'free',
            require_mfa: policy.require_mfa ?? false,
            session_timeout_minutes: policy.session_timeout_minutes ?? 120,
            data_retention_days: policy.data_retention_days ?? 365,
            feature_flags: policy.feature_flags || {},
            custom_settings: policy.custom_settings || {},
            is_active: policy.is_active ?? true,
          });
        } else {
          setExistingPolicyId(null);
          setPolicyForm({
            max_users: 10,
            max_storage_mb: 1024,
            billing_plan: 'free',
            require_mfa: false,
            session_timeout_minutes: 120,
            data_retention_days: 365,
            feature_flags: {},
            custom_settings: {},
            is_active: true,
          });
        }
      } catch (err) {
        showMessage('error', 'Could not load policy');
      } finally {
        setLocalLoading(false);
      }
    }, [selectedOrg, showMessage]);

    useEffect(() => {
      loadPolicy();
    }, [loadPolicy, policyRefreshTrigger]);

    const handleSave = async () => {
      setLocalSaving(true);
      try {
        const payload = { ...policyForm };
        if (existingPolicyId) {
          await policyAPI.update(existingPolicyId, payload);
          showMessage('success', 'Policy updated');
        } else {
          await policyAPI.create({ ...payload, org_id: selectedOrg.org_id });
          showMessage('success', 'Policy created');
        }
        const details = await fetchOrgDetails(selectedOrg.org_id);
        setFormData(prev => ({ ...prev, policy: details.policy }));
        setPolicyRefreshTrigger(prev => prev + 1);
      } catch (err) {
        showMessage('error', err.response?.data?.message || 'Failed to save policy');
      } finally {
        setLocalSaving(false);
      }
    };

    if (localLoading) return <div className="text-center py-2">Loading policy...</div>;

    return (
      <div className="space-y-1.5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-1 text-[0.65rem]">
          <div><label className="block font-medium mb-0.5">Max Users *</label><input type="number" value={policyForm.max_users} onChange={e => setPolicyForm({ ...policyForm, max_users: parseInt(e.target.value) })} className="border rounded p-1 w-full" /></div>
          <div><label className="block font-medium mb-0.5">Max Storage (MB)</label><input type="number" value={policyForm.max_storage_mb} onChange={e => setPolicyForm({ ...policyForm, max_storage_mb: parseInt(e.target.value) })} className="border rounded p-1 w-full" /></div>
          <div><label className="block font-medium mb-0.5">Billing Plan *</label><select value={policyForm.billing_plan} onChange={e => setPolicyForm({ ...policyForm, billing_plan: e.target.value })} className="border rounded p-1 w-full"><option value="free">Free</option><option value="pro">Pro</option><option value="enterprise">Enterprise</option></select></div>
          <div><label className="block font-medium mb-0.5">Session Timeout (min)</label><input type="number" value={policyForm.session_timeout_minutes} onChange={e => setPolicyForm({ ...policyForm, session_timeout_minutes: parseInt(e.target.value) })} className="border rounded p-1 w-full" /></div>
          <div><label className="block font-medium mb-0.5">Data Retention (days)</label><input type="number" value={policyForm.data_retention_days} onChange={e => setPolicyForm({ ...policyForm, data_retention_days: parseInt(e.target.value) })} className="border rounded p-1 w-full" /></div>
          <div className="flex items-center gap-1"><input type="checkbox" checked={policyForm.require_mfa} onChange={e => setPolicyForm({ ...policyForm, require_mfa: e.target.checked })} /><label>Require MFA</label></div>
          <div className="flex items-center gap-1"><input type="checkbox" checked={policyForm.is_active} onChange={e => setPolicyForm({ ...policyForm, is_active: e.target.checked })} /><label>Policy Active</label></div>
        </div>
        <div><label className="block font-medium mb-0.5">Feature Flags (JSON)</label><textarea rows="2" value={JSON.stringify(policyForm.feature_flags, null, 2)} onChange={e => { try { setPolicyForm({ ...policyForm, feature_flags: JSON.parse(e.target.value) }); } catch(e) {} }} className="border rounded p-1 w-full font-mono text-[0.65rem]" /></div>
        <div><label className="block font-medium mb-0.5">Custom Settings (JSON)</label><textarea rows="2" value={JSON.stringify(policyForm.custom_settings, null, 2)} onChange={e => { try { setPolicyForm({ ...policyForm, custom_settings: JSON.parse(e.target.value) }); } catch(e) {} }} className="border rounded p-1 w-full font-mono text-[0.65rem]" /></div>
        <button onClick={handleSave} disabled={localSaving} className="px-2 py-0.5 bg-primary-600 text-white rounded text-[0.65rem] disabled:opacity-50">{localSaving ? 'Saving...' : existingPolicyId ? 'Update Policy' : 'Create Policy'}</button>
      </div>
    );
  };

  // ---------- Left table: configurable columns ----------
  const columns = [
    { key: 'org_id', label: 'ID', minWidth: '60px' },
    { key: 'name', label: 'Name', minWidth: '120px' },
    { key: 'branch_id', label: 'Branch ID', minWidth: '80px' },
    { key: 'email', label: 'Email', minWidth: '150px' },
    { key: 'phone', label: 'Phone', minWidth: '100px' },
    { key: 'industry_type', label: 'Industry', minWidth: '100px' },
    { key: 'num_employees', label: 'Employees', minWidth: '80px' },
    { key: 'address', label: 'Address', minWidth: '150px' },
    { key: 'status', label: 'Status', minWidth: '80px' },
  ];

  const orgTable = useMemo(() => (
    <div className="overflow-x-auto max-h-[500px] overflow-y-auto border rounded-lg">
      <table className="min-w-full divide-y divide-gray-200 text-[0.65rem]">
        <thead className="bg-gray-50 sticky top-0">
          <tr>
            {columns.map(col => (
              <th key={col.key} className="px-2 py-1 text-left font-medium text-gray-500" style={{ minWidth: col.minWidth }}>
                {col.label}
              </th>
            ))}
            <th className="px-2 py-1 text-right font-medium text-gray-500 min-w-[60px]">Action</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {organizations.map(org => (
            <tr
              key={org.org_id}
              className={`cursor-pointer ${selectedOrg?.org_id === org.org_id ? 'bg-primary-50' : 'hover:bg-gray-50'}`}
              onClick={() => handleSelectOrg(org)}
            >
              {columns.map(col => {
                let value = org[col.key];
                if (col.key === 'status') {
                  return (
                    <td key={col.key} className="px-2 py-1 whitespace-nowrap">
                      <span className={`px-1 py-0.5 rounded-full text-[0.6rem] ${value === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {value}
                      </span>
                    </td>
                  );
                }
                if (col.key === 'address') {
                  return (
                    <td key={col.key} className="px-2 py-1 max-w-[200px] truncate text-gray-600" title={value || '—'}>
                      {value || '—'}
                    </td>
                  );
                }
                return (
                  <td key={col.key} className="px-2 py-1 whitespace-nowrap text-gray-600">
                    {value !== null && value !== undefined ? value : '—'}
                  </td>
                );
              })}
              <td className="px-2 py-1 whitespace-nowrap text-right">
                <button onClick={(e) => { e.stopPropagation(); handleSelectOrg(org); }} className="text-primary-600 text-[0.65rem]">
                  View
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ), [organizations, selectedOrg, handleSelectOrg]);

  // ---------- Main Layout ----------
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden text-[0.65rem]">
      <div className="flex flex-col md:flex-row">
        <div className="md:w-3/5 border-r border-gray-200 p-1">
          <div className="flex justify-between items-center mb-1">
            <h3 className="font-semibold text-gray-900">Organizations</h3>
            <button
              onClick={() => { setSelectedOrg(null); setEditing(true); setFormData({ status: 'active' }); }}
              className="p-0.5 bg-primary-100 rounded-full"
              title="Create new organization"
            >
              <Plus size={10} />
            </button>
          </div>
          {loading && organizations.length === 0 ? (
            <div className="flex justify-center py-2"><RefreshCw className="animate-spin text-gray-400" size={12} /></div>
          ) : organizations.length === 0 ? (
            <div className="text-center text-gray-500 py-2">No organizations.<br />Click + to create.</div>
          ) : orgTable}
        </div>

        <div className="md:w-2/5 p-2 overflow-y-auto max-h-[500px]">
          {(selectedOrg || editing) ? (
            <>
              <div className="flex border-b mb-2">
                {[
                  { id: 'org', name: 'Org', icon: '🏢' },
                  { id: 'db', name: 'DB', icon: '🗄️' },
                  { id: 'policy', name: 'Policy', icon: '⚖️' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveSubTab(tab.id)}
                    className={`flex items-center px-2 py-0.5 text-[0.65rem] font-medium ${activeSubTab === tab.id ? 'border-b-2 border-primary-500 text-primary-600' : 'text-gray-500'}`}
                  >
                    <span className="mr-0.5">{tab.icon}</span>{tab.name}
                  </button>
                ))}
              </div>
              {activeSubTab === 'org' && (editing ? renderOrgForm() : renderOrgView())}
              {activeSubTab === 'db' && selectedOrg && <DbConnectionForm />}
              {activeSubTab === 'policy' && selectedOrg && <PolicyForm />}
              {(activeSubTab !== 'org' && !selectedOrg) && (
                <div className="text-center text-gray-500 py-4">Save organization first</div>
              )}
            </>
          ) : (
            <div className="text-center text-gray-500 py-4">Select or create an organization</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrganizationManagement;