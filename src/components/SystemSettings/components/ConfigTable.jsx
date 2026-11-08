import React from 'react'
import { Edit, Activity, Trash2 } from 'lucide-react'

const ConfigTable = ({
  configs,
  columns,
  statusColumn = true,
  descriptionColumn = true,
  onEdit,
  onDelete,
  onActivate,
  onTest,
}) => {
  if (!configs || configs.length === 0) {
    return (
      <div className="text-center py-6">
        <div className="mx-auto h-8 w-8 text-gray-400 mb-2">
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <h3 className="text-sm font-medium text-gray-900 mb-1">No configurations</h3>
        <p className="text-xs text-gray-500 mb-3">Get started by creating a new configuration.</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            {statusColumn && (
              <th className="w-16 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
            )}
            {columns.map(col => (
              <th
                key={col.key}
                className={`px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                  col.width ? col.width : ''
                }`}
              >
                {col.label}
              </th>
            ))}
            {descriptionColumn && (
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
            )}
            <th className="w-32 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {configs.map(config => (
            <tr
              key={config.app_prop_id}
              className={`hover:bg-gray-50 transition-colors ${
                config.status === 'active' ? 'bg-green-50 hover:bg-green-100' : ''
              }`}
            >
              {statusColumn && (
                <td className="px-3 py-2 whitespace-nowrap">
                  <div className="flex items-center">
                    <div
                      className={`w-2 h-2 rounded-full mr-1.5 ${
                        config.status === 'active' ? 'bg-green-500' : 'bg-gray-400'
                      }`}
                    />
                    <span
                      className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
                        config.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {config.status}
                    </span>
                  </div>
                </td>
              )}
              {columns.map(col => (
                <td key={col.key} className="px-3 py-2 whitespace-nowrap">
                  {col.render ? col.render(config) : config[col.key] || '-'}
                </td>
              ))}
              {descriptionColumn && (
                <td className="px-3 py-2">
                  <div className="text-gray-900 text-xs max-w-[120px] truncate" title={config.desc}>
                    {config.desc || 'No description'}
                  </div>
                </td>
              )}
              <td className="px-3 py-2 whitespace-nowrap">
                <div className="flex items-center space-x-1">
                  {config.status !== 'active' && onActivate && (
                    <button
                      onClick={() => onActivate(config)}
                      className="text-green-600 hover:text-green-800 p-1 rounded hover:bg-green-100 transition-colors flex items-center"
                      title="Activate this configuration"
                    >
                      <div className="w-2 h-2 rounded-full bg-green-500 mr-1" />
                      <span className="text-xs">Activate</span>
                    </button>
                  )}
                  {onEdit && (
                    <button
                      onClick={() => onEdit(config)}
                      className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-100 transition-colors"
                      title="Edit this configuration"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {onTest && (
                    <button
                      onClick={() => onTest(config)}
                      className="text-purple-600 hover:text-purple-800 p-1 rounded hover:bg-purple-100 transition-colors"
                      title="Test this configuration"
                    >
                      <Activity className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={() => onDelete(config)}
                      className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-100 transition-colors"
                      title="Delete this configuration"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default ConfigTable
