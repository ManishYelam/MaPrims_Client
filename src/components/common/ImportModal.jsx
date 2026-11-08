import React, { useState, useRef, useCallback } from 'react';
import { X, Upload } from 'lucide-react';
import ImportGrid from '../import/ImportGrid';

const ImportModal = ({
  show,
  onClose,
  onUpload,
  moduleName = 'Items',
  loading = false,
}) => {
  const [parsedData, setParsedData] = useState([]);
  const [importError, setImportError] = useState(null);
  const fileRef = useRef(null);

  const processFile = useCallback(async (file) => {
    setImportError(null);
    try {
      const text = await file.text();
      const lines = text.split('\n').filter((line) => line.trim());
      if (lines.length < 2) {
        throw new Error('CSV must contain a header row and at least one data row');
      }
      const headers = lines[0]
        .split(',')
        .map((h) => h.replace(/^"|"$/g, '').trim());
      const jsonData = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i]
          .split(',')
          .map((v) => v.replace(/^"|"$/g, '').trim());
        if (values.length !== headers.length) {
          throw new Error(`Row ${i + 1} has incorrect columns`);
        }
        const obj = {};
        headers.forEach((h, idx) => {
          obj[h] = values[idx];
        });
        jsonData.push(obj);
      }
      setParsedData(jsonData);
    } catch (err) {
      setImportError(err.message);
    }
  }, []);

  const handleFileUpload = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processFile(file);
    e.target.value = '';
  }, [processFile]);

  const handleCancel = useCallback(() => {
    setParsedData([]);
    setImportError(null);
    onClose();
  }, [onClose]);

  const handleImport = useCallback(async (data) => {
    try {
      const result = await onUpload(data);
      return result;
    } catch (err) {
      return { success: false, message: err.message };
    }
  }, [onUpload]);

  const triggerFileInput = useCallback(() => {
    fileRef.current?.click();
  }, []);

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-[90%] max-w-7xl h-[85vh] min-h-0 flex flex-col overflow-hidden transition-all duration-300">
        <div className="flex justify-between items-center px-3 py-1.5 border-b flex-shrink-0">
          <h3 className="text-sm font-semibold">Import {moduleName}</h3>
          <div className="flex items-center gap-1">
            <button
              onClick={triggerFileInput}
              className="text-gray-500 hover:text-gray-700 p-0.5 rounded hover:bg-gray-100"
              title="Upload CSV"
            >
              <Upload className="w-4 h-4" />
            </button>
            <button
              onClick={handleCancel}
              className="text-gray-400 hover:text-gray-600 p-0.5"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
            <input
              type="file"
              ref={fileRef}
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        </div>
        <div className="flex-1 min-h-0">
          <ImportGrid
            moduleName={moduleName}
            initialData={parsedData}
            onImport={handleImport}
            onCancel={handleCancel}
            allowAddDelete={true}
            importError={importError}
          />
        </div>
      </div>
    </div>
  );
};

export default ImportModal;