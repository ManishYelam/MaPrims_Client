import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Database, ClipboardList, ShoppingCart, ShieldCheck,
  ArrowLeftRight, PackageMinus, Boxes, BarChart3, Wallet, CheckCircle2, Settings,
} from 'lucide-react';

import ModuleGrid from '../../layouts/ModuleGrid';
import { AuthContext } from '../../context/AuthContext';
import { useStockPoint } from '../../context/StockPointContext';
import { stockPointsAPI } from '../../services/api';
import StockPointSelectionModal from './MasterData/StockPoint/StockPointSelectionModal1';

const STORE_ICON_MAP = {
  'store dashboard': LayoutDashboard,
  'master data': Database,
  requisitions: ClipboardList,
  procurement: ShoppingCart,
  'quality control': ShieldCheck,
  transfers: ArrowLeftRight,
  consumption: PackageMinus,
  inventory: Boxes,
  'store reports': BarChart3,
  budget: Wallet,
  approvals: CheckCircle2,
  'store settings': Settings,
};

const extractList = (res) => {
  const data = res?.data?.data ?? res?.data ?? [];
  return Array.isArray(data) ? data : [];
};

const Stores = () => {
  const { user } = useContext(AuthContext);
  const { stockPoint, setStockPoint, clearStockPoint } = useStockPoint();
  const navigate = useNavigate();

  const [stockPoints, setStockPoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const userId = useMemo(
    () => user?.user?.user_id ?? user?._id ?? user?.id ?? null,
    [user]
  );

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    if (typeof stockPointsAPI?.getStockPointsByUser !== 'function') {
      setError(new Error('Stock points service is unavailable.'));
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await stockPointsAPI.getStockPointsByUser(userId);
        if (cancelled) return;
        setStockPoints(extractList(res));
      } catch (e) {
        if (cancelled) return;
        setError(e);
        setStockPoints([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [userId]);

  useEffect(() => {
    if (!stockPoint || loading || !stockPoints.length) return;
    const stillValid = stockPoints.some(
      (sp) => String(sp.id) === String(stockPoint.id)
    );
    if (!stillValid) clearStockPoint();
  }, [stockPoint, stockPoints, loading, clearStockPoint]);

  const handleConfirm = useCallback(
    (sp) => { if (sp) setStockPoint(sp); },
    [setStockPoint]
  );

  // Navigate FIRST, then clear — avoids redirect-loop guards that
  // bounce you back to /store when stockPoint becomes null.
  const handleCancel = useCallback(() => {
    navigate('/dashboard', { replace: true });
    setTimeout(() => clearStockPoint(), 0);
  }, [navigate, clearStockPoint]);

  if (loading) {
    return (
      null
    );
  }

  if (error) {
    return (
      <div className="p-4 text-sm text-red-600">
        Failed to load stock points: {error.message || 'Unknown error'}
      </div>
    );
  }

  if (stockPoint) {
    return (
      <ModuleGrid
        iconMap={STORE_ICON_MAP}
        emptyMessage="No Store sub-modules available."
        stockPointId={stockPoint.id}
        stockPoint={stockPoint}
      />
    );
  }

  return (
    <StockPointSelectionModal
      open
      stockPoints={stockPoints}
      cancellable
      onCancel={handleCancel}
      onConfirm={handleConfirm}
    />
  );
};

export default Stores;