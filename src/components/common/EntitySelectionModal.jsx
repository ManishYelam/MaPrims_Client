import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  X,
  Search,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight
} from 'lucide-react';

const EntitySelectionModal = ({
  show,
  onClose,
  onSelect,
  title = 'Select Item',
  fetchData,
  columns,
  getItemId,
  getItemLabel,
  selectedItemId = null,
  selectedItemIds = [],
  excludeId = null,
  quickSelect = true,
  multiple = false,
  defaultPageSize = 20,
  pageSizeOptions = [10, 20, 30, 50],
}) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [columnFilters, setColumnFilters] = useState({});
  const [selectedIds, setSelectedIds] = useState(
    multiple ? selectedItemIds : selectedItemId ? [selectedItemId] : []
  );
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
  });

  const prevSelectedKeyRef = useRef(null);

  const loadData = useCallback(async (page, limit = pageSize) => {
    try {
      setLoading(true);
      const result = await fetchData(page, columnFilters, limit);
      let rows = result.rows || [];
      if (excludeId) rows = rows.filter(item => getItemId(item) !== excludeId);

      setItems(rows);
      setPagination({
        currentPage: result.currentPage || page,
        totalPages: result.totalPages || 1,
        totalItems: result.totalItems || rows.length,
        limit: limit,
      });
    } catch (error) {
      console.error('Error fetching data:', error);
      setItems([]);
      setPagination({ currentPage: page, totalPages: 1, totalItems: 0, limit: limit });
    } finally {
      setLoading(false);
    }
  }, [fetchData, columnFilters, excludeId, getItemId, pageSize]);

  // ✅ FIX 1: Keep latest loadData in a ref so the reset effect
  //           doesn't re-fire whenever columnFilters/pageSize change.
  const loadDataRef = useRef(loadData);
  useEffect(() => {
    loadDataRef.current = loadData;
  }, [loadData]);

  // ✅ FIX 2: Turn selection props into a stable PRIMITIVE key.
  //           Strings compare by value, so a parent passing a new
  //           array reference with same content won't re-trigger.
  const selectedKey = multiple
    ? JSON.stringify(selectedItemIds)
    : selectedItemId != null ? String(selectedItemId) : '';

  // ✅ FIX 3: The reset effect.
  //   - Depends only on PRIMITIVES: show, selectedKey, multiple, defaultPageSize.
  //   - Uses loadDataRef so internal filter changes don't re-trigger it.
  //   - Uses a bail-out updater so setColumnFilters({}) can NEVER
  //     trigger a re-render when filters are already empty.
  useEffect(() => {
    if (!show) {
      setColumnFilters(prev =>
        Object.keys(prev).length === 0 ? prev : {}
      );
      prevSelectedKeyRef.current = null;
      return;
    }

    if (prevSelectedKeyRef.current === selectedKey) return;

    prevSelectedKeyRef.current = selectedKey;
    setSelectedIds(
      multiple
        ? selectedItemIds
        : selectedItemId != null ? [selectedItemId] : []
    );
    setPageSize(defaultPageSize);
    loadDataRef.current(1, defaultPageSize);

    // selectedItemIds / selectedItemId are intentionally NOT deps:
    // selectedKey encodes them, and raw arrays change every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, selectedKey, multiple, defaultPageSize]);

  const getFilterKey = (col) => col.filterKey || col.key;
  const isSearchable = (col) => col.searchable !== false;

  const handleColumnFilterChange = (col, value) => {
    const filterKey = getFilterKey(col);
    setColumnFilters(prev => {
      const newFilters = { ...prev };
      if (value.trim() === '') delete newFilters[filterKey];
      else newFilters[filterKey] = value;
      return newFilters;
    });
  };

  const applyFilters = () => {
    loadData(1, pageSize);
  };

  const handleFilterKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      applyFilters();
    }
  };

  const handlePageSizeChange = (newSize) => {
    const size = parseInt(newSize, 10);
    setPageSize(size);
    loadData(1, size);
  };

  const handleSingleSelect = (item) => {
    const id = getItemId(item);
    setSelectedIds([id]);
    if (quickSelect) {
      onSelect(item);
      onClose();
    }
  };

  const handleToggleMultiSelect = (item) => {
    const id = getItemId(item);
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleCheckboxChange = (item) => {
    if (multiple) handleToggleMultiSelect(item);
    else handleSingleSelect(item);
  };

  const handleConfirm = () => {
    if (multiple) {
      const selectedItems = items.filter(item => selectedIds.includes(getItemId(item)));
      onSelect(selectedItems);
    } else {
      if (selectedIds.length > 0) {
        const selected = items.find(item => getItemId(item) === selectedIds[0]);
        onSelect(selected || null);
      }
    }
    onClose();
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= pagination.totalPages) loadData(page, pageSize);
  };

  const getVisiblePages = () => {
    const { currentPage, totalPages } = pagination;
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (currentPage <= 3) return [1, 2, 3, 4, 5];
    if (currentPage >= totalPages - 2) return [totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    return [currentPage - 2, currentPage - 1, currentPage, currentPage + 1, currentPage + 2];
  };

  if (!show) return null;

  const startItem = (pagination.currentPage - 1) * pageSize + 1;
  const endItem = Math.min(pagination.currentPage * pageSize, pagination.totalItems);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 z-[60]">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] flex flex-col shadow-xl">
        <div className="flex items-center justify-between p-2 border-b border-gray-200">
          <h2 className="text-xs font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-0.5 rounded hover:bg-gray-100">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex-1 overflow-hidden">
          {loading ? (null) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 p-4">
              <p className="text-xs text-gray-500">
                {Object.values(columnFilters).some(v => v) ? 'No results found' : 'No items available'}
              </p>
            </div>
          ) : (
            <div className="overflow-y-auto h-[calc(90vh-200px)]">
              <table className="w-full border-collapse">
                <thead className="sticky top-0 bg-gray-50 z-10">
                  <tr>
                    <th className="px-1 py-0 w-8 border-b border-r border-gray-200"></th>
                    {columns.map(col => (
                      <th key={col.key} className="px-1 py-0 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider border-b border-r border-gray-200">
                        {col.label}
                      </th>
                    ))}
                  </tr>
                  <tr>
                    <th className="px-1 py-0.5 w-8 border-b border-r border-gray-200"></th>
                    {columns.map(col => (
                      <th key={col.key} className="px-1 py-0.5 border-b border-r border-gray-200">
                        {isSearchable(col) ? (
                          <input
                            type="text"
                            value={columnFilters[getFilterKey(col)] || ''}
                            onChange={(e) => handleColumnFilterChange(col, e.target.value)}
                            onKeyDown={handleFilterKeyDown}
                            className="w-full px-1 py-0.5 border border-gray-200 rounded text-[10px] focus:ring-1 focus:ring-primary-400 focus:border-primary-400"
                          />
                        ) : null}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => {
                    const id = getItemId(item);
                    const isSelected = selectedIds.includes(id);
                    return (
                      <tr
                        key={id}
                        onClick={() => handleCheckboxChange(item)}
                        onDoubleClick={() => handleCheckboxChange(item)}
                        className={`cursor-pointer transition-colors select-none ${isSelected
                          ? 'bg-primary-300 text-white hover:bg-primary-700'
                          : 'hover:bg-primary-200 text-gray-700'
                          }`}
                      >
                        <td className="px-1 py-0 border-b border-r border-gray-200">
                          <div className="flex items-center justify-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleCheckboxChange(item)}
                              className="w-3.5 h-3.5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        </td>
                        {columns.map(col => (
                          <td key={col.key} className="px-1 py-0 border-b border-r border-gray-200 text-xs text-gray-600">
                            {col.render ? col.render(item) : item[col.key] || '—'}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {pagination.totalPages > 1 && (
          <div className="p-2 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-1.5">
            <div className="text-[10px] text-gray-600">
              Showing {startItem} to {endItem} of {pagination.totalItems}
            </div>
            <div className="flex items-center space-x-0.5">
              <select
                value={pageSize}
                onChange={(e) => handlePageSizeChange(e.target.value)}
                className="px-1 py-0.5 text-[10px] border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 bg-white mr-1"
              >
                {pageSizeOptions.map(size => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>

              <button onClick={() => handlePageChange(1)} disabled={pagination.currentPage === 1} className="p-0.5 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50">
                <ChevronsLeft className="w-2.5 h-2.5" />
              </button>
              <button onClick={() => handlePageChange(pagination.currentPage - 1)} disabled={pagination.currentPage === 1} className="p-0.5 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50">
                <ChevronLeft className="w-2.5 h-2.5" />
              </button>
              {getVisiblePages().map(pageNum => (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`w-5 h-5 text-[10px] rounded border transition-colors ${
                    pagination.currentPage === pageNum ? 'bg-primary-600 text-white border-primary-600' : 'border-gray-300 hover:bg-gray-50 text-gray-700'
                    }`}
                >
                  {pageNum}
                </button>
              ))}
              <button onClick={() => handlePageChange(pagination.currentPage + 1)} disabled={pagination.currentPage === pagination.totalPages} className="p-0.5 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50">
                <ChevronRight className="w-2.5 h-2.5" />
              </button>
              <button onClick={() => handlePageChange(pagination.totalPages)} disabled={pagination.currentPage === pagination.totalPages} className="p-0.5 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50">
                <ChevronsRight className="w-2.5 h-2.5" />
              </button>
            </div>
          </div>
        )}

        <div className="p-2 border-t border-gray-200 flex items-center justify-between">
          <div className="text-[10px] text-gray-600">
            {multiple ? (
              selectedIds.length > 0 ? `${selectedIds.length} selected` : 'None selected'
            ) : (
              selectedIds.length > 0
                ? `Selected: ${getItemLabel(items.find(i => getItemId(i) === selectedIds[0]) || {})}`
                : 'None selected'
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {!(quickSelect && !multiple) && (
              <button
                onClick={handleConfirm}
                disabled={selectedIds.length === 0}
                className={`px-2 py-1 text-xs font-medium text-white rounded transition-colors ${
                  selectedIds.length > 0 ? 'bg-primary-600 hover:bg-primary-700' : 'bg-gray-300 cursor-not-allowed'
                  }`}
              >
                Select {multiple && selectedIds.length > 0 ? `(${selectedIds.length})` : ''}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(EntitySelectionModal);