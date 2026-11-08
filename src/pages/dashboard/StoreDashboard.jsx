// pages/dashboard/store/dashboard/index.jsx
// ============================================================
// STORE DASHBOARD — SINGLE FILE, NO APIS
// Uses mock data. Replace MOCK_DATA + fetchData with real API later.
// ============================================================

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Store, Package, ShoppingCart, ArrowLeftRight, PackageMinus,
  AlertTriangle, Clock, DollarSign, RefreshCw, Calendar,
  TrendingUp, TrendingDown, CheckCircle2, XCircle, RotateCcw,
  ShieldCheck, Truck, Boxes, Wallet, FileText, Layers, Timer,
} from 'lucide-react';
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area,
  Legend, LineChart, Line,
} from 'recharts';

// ============================================================
// CONSTANTS
// ============================================================
const COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#84CC16',
];

// ============================================================
// SMALL REUSABLE COMPONENTS
// ============================================================
const StatCard = ({ title, value, icon: Icon, color, subtitle, loading, trend }) => (
  <div className="bg-white rounded-lg p-2 shadow-sm border border-gray-100 h-full flex flex-col justify-center">
    <div className="flex items-center justify-between">
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-medium text-gray-500 truncate">{title}</p>
        {loading ? (
          <div className="h-4 w-16 bg-gray-200 rounded animate-pulse mt-0.5" />
        ) : (
          <p className="text-sm font-bold text-gray-900 mt-0.5 truncate">{value ?? '—'}</p>
        )}
        {!loading && subtitle && (
          <p className="text-[9px] text-gray-400 truncate flex items-center gap-1">
            {trend === 'up' && <TrendingUp className="w-2.5 h-2.5 text-green-500 flex-shrink-0" />}
            {trend === 'down' && <TrendingDown className="w-2.5 h-2.5 text-red-500 flex-shrink-0" />}
            <span className="truncate">{subtitle}</span>
          </p>
        )}
      </div>
      <div className={`p-1.5 rounded-md ${color} ml-1.5 flex-shrink-0`}>
        <Icon className="w-3.5 h-3.5 text-white" />
      </div>
    </div>
  </div>
);

const ListItem = ({ title, subtitle, badge, badgeColor = 'blue', right }) => {
  const c = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    green: 'bg-green-50 text-green-700 border-green-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    red: 'bg-red-50 text-red-700 border-red-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    gray: 'bg-gray-50 text-gray-700 border-gray-200',
  };
  return (
    <div className={`flex items-center justify-between p-2 rounded-lg border ${c[badgeColor] || c.blue}`}>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium truncate">{title}</p>
        {subtitle && <p className="text-[10px] opacity-75 truncate">{subtitle}</p>}
      </div>
      {right != null && (
        <span className="text-[10px] font-medium bg-white/50 px-2 py-0.5 rounded-full ml-2 flex-shrink-0">
          {right}
        </span>
      )}
      {badge != null && (
        <span className="text-[10px] font-medium bg-white/50 px-2 py-0.5 rounded-full ml-2 flex-shrink-0">
          {badge}
        </span>
      )}
    </div>
  );
};

const StatusBadge = ({ status }) => {
  const map = {
    approved: { color: 'bg-green-100 text-green-700', label: 'Approved' },
    pending: { color: 'bg-amber-100 text-amber-700', label: 'Pending' },
    issued: { color: 'bg-blue-100 text-blue-700', label: 'Issued' },
    in_transit: { color: 'bg-purple-100 text-purple-700', label: 'In Transit' },
    qc_pending: { color: 'bg-orange-100 text-orange-700', label: 'QC Pending' },
    rejected: { color: 'bg-red-100 text-red-700', label: 'Rejected' },
  };
  const s = map[status] || { color: 'bg-gray-100 text-gray-700', label: status };
  return (
    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${s.color}`}>
      {s.label}
    </span>
  );
};

const CardHeader = ({ title, subtitle, icon: Icon, iconColor = 'text-blue-600' }) => (
  <div className="flex items-center gap-2 mb-1">
    {Icon && <Icon className={`w-4 h-4 ${iconColor}`} />}
    <div>
      <h3 className="text-sm font-semibold">{title}</h3>
      {subtitle && <p className="text-[10px] text-gray-400">{subtitle}</p>}
    </div>
  </div>
);

const EmptyState = ({ text = 'No data' }) => (
  <div className="h-48 flex items-center justify-center text-sm text-gray-400">{text}</div>
);

const LoadState = () => (
  <div className="h-48 flex items-center justify-center text-sm text-gray-400">Loading...</div>
);

// ============================================================
// MOCK DATA (replace with API response later)
// ============================================================
const MOCK_DATA = {
  summary: {
    totalStockValue: 12450000,
    totalStockValueTrend: 5.2,
    totalSkus: 1248,
    totalCategories: 28,
    activeStockPoints: 12,
    lowStockItems: 87,
    expiringSoonItems: 34,
    pendingApprovals: 18,
    openPurchaseOrders: 42,
    openPOValue: 2340000,
    inTransitShipments: 7,
    materialIssuesToday: 46,
    materialIssuesTodayValue: 890000,
    grnsToday: 8,
    grnsTodayValue: 1230000,
  },
  stockByStore: [
    { store: 'Central Store', qty: 45200, value: 5200000 },
    { store: 'Purchase Store', qty: 12300, value: 1800000 },
    { store: 'Medical Store', qty: 8900, value: 2100000 },
    { store: 'General Store', qty: 6700, value: 450000 },
    { store: 'Maintenance', qty: 3400, value: 1200000 },
    { store: 'IT Store', qty: 1200, value: 1700000 },
    { store: 'Lab Store', qty: 2100, value: 800000 },
    { store: 'Production', qty: 15600, value: 320000 },
  ],
  stockValueTrend: [
    { date: 'Oct 01', value: 11200000 },
    { date: 'Oct 05', value: 11500000 },
    { date: 'Oct 10', value: 11900000 },
    { date: 'Oct 15', value: 12100000 },
    { date: 'Oct 20', value: 12300000 },
    { date: 'Oct 24', value: 12450000 },
  ],
  movementTypes: [
    { type: 'GRN', count: 124 },
    { type: 'Issues', count: 342 },
    { type: 'STN Out', count: 86 },
    { type: 'STN In', count: 78 },
    { type: 'Returns', count: 24 },
    { type: 'Adjust', count: 12 },
  ],
  movementTrend: [
    { date: 'Oct 18', in: 12000, out: 9800 },
    { date: 'Oct 19', in: 14500, out: 11200 },
    { date: 'Oct 20', in: 9800, out: 13400 },
    { date: 'Oct 21', in: 16200, out: 12800 },
    { date: 'Oct 22', in: 11000, out: 9500 },
    { date: 'Oct 23', in: 13900, out: 14100 },
    { date: 'Oct 24', in: 15400, out: 11800 },
  ],
  topIssuedItems: [
    { item: 'Steel Rod 12mm', qty: 340, value: 680000 },
    { item: 'Cotton Rolls', qty: 210, value: 210000 },
    { item: 'Nitrile Gloves', qty: 890, value: 89000 },
    { item: 'Laptops Dell 5540', qty: 4, value: 320000 },
    { item: 'Drill Bits Set', qty: 45, value: 45000 },
  ],
  lowStockAlerts: [
    { item: 'Steel Rod 12mm', store: 'Central Store', current: 12, reorder: 100, severity: 'critical' },
    { item: 'Nitrile Gloves', store: 'Medical Store', current: 45, reorder: 500, severity: 'critical' },
    { item: 'A4 Paper Ream', store: 'General Store', current: 20, reorder: 200, severity: 'warning' },
    { item: 'Welding Wire', store: 'Maintenance', current: 8, reorder: 50, severity: 'warning' },
    { item: 'Printer Cartridge', store: 'IT Store', current: 3, reorder: 20, severity: 'warning' },
  ],
  expiryAlerts: [
    { item: 'Paracetamol 500mg', batch: 'B-2024-45', qty: 120, expiry: '2025-11-15', daysLeft: 22, store: 'Medical Store' },
    { item: 'Bandage Rolls', batch: 'B-2023-89', qty: 340, expiry: '2025-11-02', daysLeft: 9, store: 'Medical Store' },
    { item: 'Lab Reagent X', batch: 'R-2024-12', qty: 5, expiry: '2025-10-30', daysLeft: 6, store: 'Lab Store' },
  ],
  pendingApprovalsByDoc: [
    { docType: 'Material Req.', count: 12, oldest: '3 days', critical: 4 },
    { docType: 'Purchase Req.', count: 9, oldest: '2 days', critical: 2 },
    { docType: 'Purchase Order', count: 6, oldest: '5 days', critical: 3 },
    { docType: 'Stock Transfer', count: 4, oldest: '1 day', critical: 0 },
    { docType: 'GRN (QC)', count: 3, oldest: '2 days', critical: 1 },
    { docType: 'Adjustment', count: 1, oldest: '1 day', critical: 0 },
  ],
  recentDocuments: [
    { no: 'PO-2025-0142', type: 'PO', party: 'ABC Steels', value: 340000, status: 'approved', time: '2h ago' },
    { no: 'GRN-2025-0089', type: 'GRN', party: 'XYZ Pharma', value: 125000, status: 'qc_pending', time: '4h ago' },
    { no: 'MR-2025-0212', type: 'MR', party: 'Maintenance', value: 45000, status: 'pending', time: '6h ago' },
    { no: 'STN-2025-0089', type: 'STN', party: 'Central → Medical', value: 89000, status: 'in_transit', time: '8h ago' },
    { no: 'ISS-2025-0441', type: 'Issue', party: 'Production', value: 234000, status: 'issued', time: '10h ago' },
  ],
  budgetUtilization: [
    { cc: 'CC-MNT-001', name: 'Maintenance', budget: 1000000, consumed: 850000 },
    { cc: 'CC-IT-001', name: 'IT', budget: 1500000, consumed: 1200000 },
    { cc: 'CC-PRD-001', name: 'Production', budget: 2500000, consumed: 1850000 },
    { cc: 'CC-MED-001', name: 'Medical', budget: 500000, consumed: 490000 },
    { cc: 'CC-ADM-001', name: 'Admin', budget: 300000, consumed: 120000 },
  ],
  supplierPerformance: [
    { supplier: 'ABC Steels', rating: 4.5, onTime: 92, quality: 98, risk: 'low' },
    { supplier: 'XYZ Pharma', rating: 4.2, onTime: 88, quality: 95, risk: 'low' },
    { supplier: 'Global IT', rating: 3.8, onTime: 78, quality: 91, risk: 'medium' },
    { supplier: 'QuickFix Tools', rating: 3.2, onTime: 65, quality: 82, risk: 'high' },
  ],
  itemsByCategory: [
    { name: 'Electrical', value: 45000 },
    { name: 'Mechanical', value: 34000 },
    { name: 'Medical', value: 28000 },
    { name: 'IT', value: 15000 },
    { name: 'Stationery', value: 12000 },
    { name: 'Housekeeping', value: 8000 },
  ],
  abcClassification: [
    { class: 'A', value: 7450000, items: 125 },
    { class: 'B', value: 3740000, items: 340 },
    { class: 'C', value: 1260000, items: 783 },
  ],
  topSuppliersBySpend: [
    { supplier: 'ABC Steels', total: 2340000, orders: 18 },
    { supplier: 'XYZ Pharma', total: 1890000, orders: 24 },
    { supplier: 'Global IT', total: 1560000, orders: 12 },
    { supplier: 'QuickFix Tools', total: 890000, orders: 34 },
    { supplier: 'BuildRight Ltd', total: 760000, orders: 9 },
  ],
};

// ============================================================
// MAIN DASHBOARD COMPONENT
// ============================================================
const StoreDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  // ===== Replace this with real API call later =====
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // TODO:
      // const res = await storeAPI.getDashboardAll();
      // if (res.data?.success) setData(res.data.data);
      // else throw new Error(res.data?.message || 'Failed to load dashboard');

      await new Promise((r) => setTimeout(r, 400));
      setData(MOCK_DATA);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ============================================================
  // STAT CARDS
  // ============================================================
  const statCards = useMemo(() => {
    if (!data) {
      return [
        { title: 'Total Stock Value', icon: DollarSign, color: 'bg-blue-500', loading: true },
        { title: 'Total SKUs', icon: Package, color: 'bg-emerald-500', loading: true },
        { title: 'Active Stores', icon: Store, color: 'bg-indigo-500', loading: true },
        { title: 'Low Stock Items', icon: AlertTriangle, color: 'bg-amber-500', loading: true },
        { title: 'Pending Approvals', icon: Clock, color: 'bg-rose-500', loading: true },
        { title: 'Open POs', icon: ShoppingCart, color: 'bg-purple-500', loading: true },
        { title: 'In-Transit STNs', icon: ArrowLeftRight, color: 'bg-teal-500', loading: true },
        { title: 'Issues Today', icon: PackageMinus, color: 'bg-orange-500', loading: true },
      ];
    }
    const s = data.summary;
    return [
      {
        title: 'Total Stock Value',
        value: `₹${(s.totalStockValue / 1000000).toFixed(2)}M`,
        icon: DollarSign, color: 'bg-blue-500',
        subtitle: `${s.totalStockValueTrend > 0 ? '+' : ''}${s.totalStockValueTrend}% vs last month`,
        trend: s.totalStockValueTrend > 0 ? 'up' : 'down',
      },
      {
        title: 'Total SKUs',
        value: s.totalSkus.toLocaleString(),
        icon: Package, color: 'bg-emerald-500',
        subtitle: `${s.totalCategories} categories`,
      },
      {
        title: 'Active Stores',
        value: s.activeStockPoints,
        icon: Store, color: 'bg-indigo-500',
        subtitle: 'Stock points enabled',
      },
      {
        title: 'Low Stock Items',
        value: s.lowStockItems,
        icon: AlertTriangle, color: 'bg-amber-500',
        subtitle: `${s.expiringSoonItems} expiring soon`,
      },
      {
        title: 'Pending Approvals',
        value: s.pendingApprovals,
        icon: Clock, color: 'bg-rose-500',
        subtitle: 'Across all documents',
      },
      {
        title: 'Open POs',
        value: s.openPurchaseOrders,
        icon: ShoppingCart, color: 'bg-purple-500',
        subtitle: `₹${(s.openPOValue / 1000000).toFixed(2)}M value`,
      },
      {
        title: 'In-Transit STNs',
        value: s.inTransitShipments,
        icon: ArrowLeftRight, color: 'bg-teal-500',
        subtitle: 'Awaiting receipt',
      },
      {
        title: 'Issues Today',
        value: s.materialIssuesToday,
        icon: PackageMinus, color: 'bg-orange-500',
        subtitle: `₹${(s.materialIssuesTodayValue / 1000).toFixed(0)}K value`,
      },
    ];
  }, [data]);

  // ============================================================
  // CHART DATA PREP
  // ============================================================
  const chartData = useMemo(() => {
    if (!data) return null;
    return {
      stockByStore: data.stockByStore.map((x) => ({
        name: x.store, value: x.value / 1000000, qty: x.qty,
      })),
      stockValueTrend: data.stockValueTrend.map((p) => ({
        date: p.date, value: p.value / 1000000,
      })),
      movementTypes: data.movementTypes,
      movementTrend: data.movementTrend,
      topIssuedItems: data.topIssuedItems,
      lowStockAlerts: data.lowStockAlerts,
      expiryAlerts: data.expiryAlerts,
      pendingApprovalsByDoc: data.pendingApprovalsByDoc,
      recentDocuments: data.recentDocuments,
      budgetUtilization: data.budgetUtilization.map((b) => ({
        name: b.name,
        consumed: b.consumed,
        remaining: b.budget - b.consumed,
        pct: Math.round((b.consumed / b.budget) * 100),
      })),
      supplierPerformance: data.supplierPerformance,
      itemsByCategory: data.itemsByCategory,
      abcClassification: data.abcClassification,
      topSuppliersBySpend: data.topSuppliersBySpend.map((s) => ({
        name: s.supplier, total: s.total / 1000000, orders: s.orders,
      })),
    };
  }, [data]);

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="space-y-4 pb-6 px-1 sm:px-0">
      {/* Top bar */}
      <div className="flex flex-wrap justify-between items-center gap-3">
        <p className="text-xs text-gray-400">Store Management • Overview</p>
        <div className="flex gap-2">
          <button
            onClick={() => { setRefreshing(true); fetchData(); }}
            disabled={refreshing}
            className="inline-flex items-center px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <button className="inline-flex items-center px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg">
            <Calendar className="w-3 h-3 mr-1" />
          </button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <AlertTriangle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
        {statCards.map((c, i) => <StatCard key={i} {...c} />)}
      </div>

      {/* ============================================================ */}
      {/* ROW 1: Stock by Store | Stock Value Trend | Movement Types */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border p-3">
          <CardHeader title="Stock by Store" subtitle="Value in ₹ millions" icon={Store} />
          {loading ? <LoadState /> : chartData?.stockByStore?.length ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData.stockByStore} layout="vertical" margin={{ top: 5, right: 10, left: 60, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 9 }} />
                <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 9 }} />
                <Tooltip formatter={(v) => `₹${v.toFixed(2)}M`} />
                <Bar dataKey="value" fill="#3B82F6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyState />}
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-3">
          <CardHeader title="Stock Value Trend" subtitle="Last 30 days" icon={TrendingUp} iconColor="text-emerald-600" />
          {loading ? <LoadState /> : chartData?.stockValueTrend?.length ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData.stockValueTrend} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="stockGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 8 }} />
                <YAxis tick={{ fontSize: 8 }} tickFormatter={(v) => `${v}M`} />
                <Tooltip formatter={(v) => `₹${v.toFixed(2)}M`} />
                <Area type="monotone" dataKey="value" stroke="#10B981" fill="url(#stockGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : <EmptyState />}
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-3">
          <CardHeader title="Movement Types" subtitle="This month" icon={Boxes} iconColor="text-purple-600" />
          {loading ? <LoadState /> : chartData?.movementTypes?.length ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={chartData.movementTypes}
                  cx="50%" cy="50%"
                  innerRadius={40} outerRadius={70}
                  paddingAngle={3}
                  dataKey="count"
                  label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                  style={{ fontSize: 9 }}
                >
                  {chartData.movementTypes.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 10 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <EmptyState />}
        </div>
      </div>

      {/* ============================================================ */}
      {/* ROW 2: Movement Trend | Top Issued | ABC */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border p-3 lg:col-span-2">
          <CardHeader title="In/Out Movement" subtitle="Last 7 days" icon={ArrowLeftRight} />
          {loading ? <LoadState /> : chartData?.movementTrend?.length ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData.movementTrend} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 8 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Line type="monotone" dataKey="in" name="Inward" stroke="#10B981" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="out" name="Outward" stroke="#EF4444" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : <EmptyState />}
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-3">
          <CardHeader title="Top Issued Items" subtitle="By qty this month" icon={PackageMinus} iconColor="text-orange-600" />
          {loading ? <LoadState /> : chartData?.topIssuedItems?.length ? (
            <div className="space-y-2 max-h-48 overflow-y-auto mt-2">
              {chartData.topIssuedItems.map((item, i) => (
                <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium truncate">{item.item}</p>
                    <p className="text-[10px] text-gray-500">₹{(item.value / 1000).toFixed(0)}K</p>
                  </div>
                  <span className="text-xs font-bold text-blue-600 ml-2">{item.qty}</span>
                </div>
              ))}
            </div>
          ) : <EmptyState />}
        </div>
      </div>

      {/* ============================================================ */}
      {/* ROW 3: Pending Approvals | Low Stock | Expiry Alerts */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border p-3">
          <CardHeader title="Pending Approvals" subtitle="By document type" icon={Clock} iconColor="text-rose-500" />
          {loading ? <LoadState /> : chartData?.pendingApprovalsByDoc?.length ? (
            <div className="space-y-2 max-h-48 overflow-y-auto mt-2">
              {chartData.pendingApprovalsByDoc.map((row, i) => (
                <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex-1">
                    <p className="text-xs font-medium">{row.docType}</p>
                    <p className="text-[10px] text-gray-500">
                      Oldest: {row.oldest}
                      {row.critical > 0 && (
                        <span className="ml-2 text-red-600 font-medium">{row.critical} critical</span>
                      )}
                    </p>
                  </div>
                  <span className={`text-sm font-bold ${row.critical > 0 ? 'text-red-600' : 'text-amber-600'}`}>
                    {row.count}
                  </span>
                </div>
              ))}
            </div>
          ) : <EmptyState text="No pending approvals" />}
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-3">
          <CardHeader title="Low Stock Alerts" subtitle="Below reorder point" icon={AlertTriangle} iconColor="text-amber-500" />
          {loading ? <LoadState /> : chartData?.lowStockAlerts?.length ? (
            <div className="space-y-2 max-h-48 overflow-y-auto mt-2">
              {chartData.lowStockAlerts.map((item, i) => (
                <ListItem
                  key={i}
                  title={item.item}
                  subtitle={`${item.store} · ${item.current}/${item.reorder}`}
                  right={item.severity === 'critical' ? '⚠' : '!'}
                  badgeColor={item.severity === 'critical' ? 'red' : 'amber'}
                />
              ))}
            </div>
          ) : <EmptyState text="All items above reorder" />}
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-3">
          <CardHeader title="Expiry Alerts" subtitle="Items expiring soon" icon={Timer} iconColor="text-red-600" />
          {loading ? <LoadState /> : chartData?.expiryAlerts?.length ? (
            <div className="space-y-2 max-h-48 overflow-y-auto mt-2">
              {chartData.expiryAlerts.map((item, i) => (
                <ListItem
                  key={i}
                  title={item.item}
                  subtitle={`${item.store} · Batch ${item.batch} · Qty ${item.qty}`}
                  right={`${item.daysLeft}d`}
                  badgeColor={item.daysLeft <= 7 ? 'red' : item.daysLeft <= 15 ? 'amber' : 'purple'}
                />
              ))}
            </div>
          ) : <EmptyState text="No expiry alerts" />}
        </div>
      </div>

      {/* ============================================================ */}
      {/* ROW 4: Recent Documents | Budget Utilization */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl shadow-sm border p-3">
          <CardHeader title="Recent Documents" subtitle="Latest activity" icon={FileText} />
          {loading ? <LoadState /> : chartData?.recentDocuments?.length ? (
            <div className="space-y-2 max-h-64 overflow-y-auto mt-2">
              {chartData.recentDocuments.map((doc, i) => (
                <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium truncate">{doc.no}</p>
                    <p className="text-[10px] text-gray-500 truncate">
                      {doc.type} · {doc.party} · ₹{(doc.value / 1000).toFixed(0)}K · {doc.time}
                    </p>
                  </div>
                  <StatusBadge status={doc.status} />
                </div>
              ))}
            </div>
          ) : <EmptyState />}
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-3">
          <CardHeader title="Budget Utilization" subtitle="Consumed vs total" icon={Wallet} iconColor="text-indigo-600" />
          {loading ? <LoadState /> : chartData?.budgetUtilization?.length ? (
            <div className="space-y-2 max-h-64 overflow-y-auto mt-2">
              {chartData.budgetUtilization.map((b, i) => (
                <div key={i} className="p-2 bg-gray-50 rounded">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium">{b.name}</span>
                    <span className={`text-xs font-bold ${b.pct >= 90 ? 'text-red-600' : b.pct >= 75 ? 'text-amber-600' : 'text-green-600'}`}>
                      {b.pct}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full ${b.pct >= 90 ? 'bg-red-500' : b.pct >= 75 ? 'bg-amber-500' : 'bg-green-500'}`}
                      style={{ width: `${Math.min(b.pct, 100)}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-gray-500 mt-1">
                    ₹{(b.consumed / 100000).toFixed(1)}L of ₹{((b.consumed + b.remaining) / 100000).toFixed(1)}L
                  </p>
                </div>
              ))}
            </div>
          ) : <EmptyState />}
        </div>
      </div>

      {/* ============================================================ */}
      {/* ROW 5: ABC | Top Suppliers | Supplier Performance */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border p-3">
          <CardHeader title="ABC Classification" subtitle="Stock value by class" icon={Layers} iconColor="text-purple-600" />
          {loading ? <LoadState /> : chartData?.abcClassification?.length ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData.abcClassification} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="class" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 8 }} tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
                <Tooltip formatter={(v) => `₹${(v / 1000000).toFixed(2)}M`} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {chartData.abcClassification.map((_, i) => (
                    <Cell key={i} fill={['#10B981', '#F59E0B', '#EF4444'][i]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyState />}
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-3">
          <CardHeader title="Top Suppliers" subtitle="By spend" icon={Truck} iconColor="text-teal-600" />
          {loading ? <LoadState /> : chartData?.topSuppliersBySpend?.length ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData.topSuppliersBySpend} layout="vertical" margin={{ top: 5, right: 10, left: 60, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 9 }} tickFormatter={(v) => `₹${v}M`} />
                <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 9 }} />
                <Tooltip formatter={(v) => `₹${v.toFixed(2)}M`} />
                <Bar dataKey="total" fill="#14B8A6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyState />}
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-3">
          <CardHeader title="Supplier Performance" subtitle="Rating & reliability" icon={ShieldCheck} iconColor="text-emerald-600" />
          {loading ? <LoadState /> : chartData?.supplierPerformance?.length ? (
            <div className="space-y-2 max-h-48 overflow-y-auto mt-2">
              {chartData.supplierPerformance.map((s, i) => (
                <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium truncate">{s.supplier}</p>
                    <p className="text-[10px] text-gray-500">
                      On-time {s.onTime}% · Quality {s.quality}%
                    </p>
                  </div>
                  <div className="text-right ml-2 flex-shrink-0">
                    <p className="text-xs font-bold text-amber-600">★ {s.rating}</p>
                    <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${
                      s.risk === 'low' ? 'bg-green-100 text-green-700' :
                      s.risk === 'medium' ? 'bg-amber-100 text-amber-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {s.risk}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : <EmptyState />}
        </div>
      </div>

      {/* ============================================================ */}
      {/* ROW 6: Items by Category */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl shadow-sm border p-3">
          <CardHeader title="Items by Category" subtitle="Distribution" icon={Layers} />
          {loading ? <LoadState /> : chartData?.itemsByCategory?.length ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={chartData.itemsByCategory}
                  cx="50%" cy="50%"
                  innerRadius={45} outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                  nameKey="name"
                  label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                  style={{ fontSize: 9 }}
                >
                  {chartData.itemsByCategory.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 10 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <EmptyState />}
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-3">
          <CardHeader title="Today at a Glance" subtitle="Live counts" icon={CheckCircle2} iconColor="text-emerald-600" />
          {loading ? <LoadState /> : (
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-1">
                  <ShoppingCart className="w-3.5 h-3.5 text-blue-600" />
                  <span className="text-[10px] font-medium text-blue-700 uppercase">GRNs Today</span>
                </div>
                <p className="text-xl font-bold text-blue-700">{data.summary.grnsToday}</p>
                <p className="text-[10px] text-blue-600">
                  ₹{(data.summary.grnsTodayValue / 100000).toFixed(1)}L value
                </p>
              </div>

              <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                <div className="flex items-center gap-2 mb-1">
                  <PackageMinus className="w-3.5 h-3.5 text-orange-600" />
                  <span className="text-[10px] font-medium text-orange-700 uppercase">Issues Today</span>
                </div>
                <p className="text-xl font-bold text-orange-700">{data.summary.materialIssuesToday}</p>
                <p className="text-[10px] text-orange-600">
                  ₹{(data.summary.materialIssuesTodayValue / 100000).toFixed(1)}L value
                </p>
              </div>

              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span className="text-[10px] font-medium text-amber-700 uppercase">Pending</span>
                </div>
                <p className="text-xl font-bold text-amber-700">{data.summary.pendingApprovals}</p>
                <p className="text-[10px] text-amber-600">Approvals</p>
              </div>

              <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                <div className="flex items-center gap-2 mb-1">
                  <ArrowLeftRight className="w-3.5 h-3.5 text-purple-600" />
                  <span className="text-[10px] font-medium text-purple-700 uppercase">In Transit</span>
                </div>
                <p className="text-xl font-bold text-purple-700">{data.summary.inTransitShipments}</p>
                <p className="text-[10px] text-purple-600">STN shipments</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StoreDashboard;