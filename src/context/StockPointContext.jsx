import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'selectedStockPoint';

export const StockPointContext = createContext(null);

export const StockPointProvider = ({ children }) => {
  const [stockPoint, setStockPointState] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const setStockPoint = useCallback((sp) => {
    setStockPointState(sp ?? null);
  }, []);

  const clearStockPoint = useCallback(() => {
    setStockPointState(null);
  }, []);

  useEffect(() => {
    try {
      if (stockPoint) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stockPoint));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      /* storage unavailable — non-fatal */
    }
  }, [stockPoint]);

  const value = useMemo(
    () => ({
      stockPoint,
      stockPointId: stockPoint?.id ?? null,
      setStockPoint,
      clearStockPoint,
      hasStockPoint: Boolean(stockPoint),
    }),
    [stockPoint, setStockPoint, clearStockPoint]
  );

  return (
    <StockPointContext.Provider value={value}>
      {children}
    </StockPointContext.Provider>
  );
};

/**
 * Access the selected stock point anywhere below <StockPointProvider>.
 */
export const useStockPoint = () => {
  const ctx = useContext(StockPointContext);
  if (!ctx) {
    throw new Error('useStockPoint must be used inside <StockPointProvider>');
  }
  return ctx;
};