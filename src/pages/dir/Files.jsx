import React, { useState } from 'react'
import { motion } from 'framer-motion'
import FileList from '../../components/dir/file/FileList'
import FileUpload from '../../components/dir/file/FileUpload'
import FilePreview from '../../components/dir/file/FilePreview'
import FileOperations from '../../components/dir/file/FileOperations'
import SearchBar from '../../components/dir/common/SearchBar'
import FilterPanel from '../../components/dir/common/FilterPanel'
import {
  Upload,
  FolderPlus,
  Grid,
  List,
  Filter,
  Download,
  Share2,
  Star,
  MoreVertical,
} from 'lucide-react'

const Files = () => {
  const [viewMode, setViewMode] = useState('grid')
  const [selectedFiles, setSelectedFiles] = useState([])
  const [showUpload, setShowUpload] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [previewFile, setPreviewFile] = useState(null)

  const files = [
    {
      id: '1',
      name: 'Project Report.pdf',
      size: 2457600,
      type: 'application/pdf',
      modified: '2024-01-15',
      uploader: 'John Doe',
      tags: ['work', 'important'],
      isFavorite: true,
      thumbnail: 'https://via.placeholder.com/100x140/3B82F6/FFFFFF?text=PDF',
    },
    {
      id: '2',
      name: 'Design Mockup.png',
      size: 5242880,
      type: 'image/png',
      modified: '2024-01-14',
      uploader: 'Jane Smith',
      tags: ['design', 'ui'],
      isFavorite: false,
      thumbnail: 'https://via.placeholder.com/100x100/10B981/FFFFFF?text=PNG',
    },
    // Add more files as needed
  ]

  const handleFileSelect = fileId => {
    setSelectedFiles(prev =>
      prev.includes(fileId) ? prev.filter(id => id !== fileId) : [...prev, fileId]
    )
  }

  const handleFileAction = (action, file) => {
    switch (action) {
      case 'preview':
        setPreviewFile(file)
        break
      case 'download':
        console.log('Download:', file)
        break
      case 'share':
        console.log('Share:', file)
        break
      case 'favorite':
        console.log('Favorite:', file)
        break
      case 'delete':
        console.log('Delete:', file)
        break
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Files</h1>
          <p className="text-gray-600 mt-2">Manage all your files in one place</p>
        </div>

        <div className="flex items-center space-x-3">
          <SearchBar placeholder="Search files..." />

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
            >
              {viewMode === 'grid' ? <List size={20} /> : <Grid size={20} />}
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-lg ${showFilters ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
            >
              <Filter size={20} />
            </button>
            <button
              onClick={() => setShowUpload(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center"
            >
              <Upload size={18} className="mr-2" />
              Upload
            </button>
          </div>
        </div>
      </div>

      {/* Selected Files Actions */}
      {selectedFiles.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 border border-blue-200 rounded-xl p-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="font-medium text-blue-800">
                {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} selected
              </span>
              <div className="flex items-center space-x-2">
                <button className="px-3 py-1.5 bg-white border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 flex items-center">
                  <Download size={16} className="mr-2" />
                  Download
                </button>
                <button className="px-3 py-1.5 bg-white border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 flex items-center">
                  <Share2 size={16} className="mr-2" />
                  Share
                </button>
                <button className="px-3 py-1.5 bg-white border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 flex items-center">
                  <Star size={16} className="mr-2" />
                  Favorite
                </button>
                <button className="px-3 py-1.5 bg-red-50 border border-red-300 text-red-700 rounded-lg hover:bg-red-100 flex items-center">
                  <MoreVertical size={16} className="mr-2" />
                  More
                </button>
              </div>
            </div>
            <button
              onClick={() => setSelectedFiles([])}
              className="text-blue-600 hover:text-blue-800"
            >
              Clear Selection
            </button>
          </div>
        </motion.div>
      )}

      {/* Filters Panel */}
      {showFilters && <FilterPanel />}

      {/* File List */}
      <FileList
        files={files}
        viewMode={viewMode}
        selectedFiles={selectedFiles}
        onSelect={handleFileSelect}
        onAction={handleFileAction}
      />

      {/* Upload Modal */}
      {showUpload && (
        <Modal
          isOpen={showUpload}
          onClose={() => setShowUpload(false)}
          title="Upload Files"
          size="xl"
        >
          <FileUpload
            onUpload={uploadedFiles => {
              console.log('Uploaded:', uploadedFiles)
              setShowUpload(false)
            }}
          />
        </Modal>
      )}

      {/* File Preview Modal */}
      {previewFile && (
        <FilePreview
          file={previewFile}
          isOpen={!!previewFile}
          onClose={() => setPreviewFile(null)}
        />
      )}
    </div>
  )
}

// Modal component (simplified for example)
const Modal = ({ isOpen, onClose, title, children, size }) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">{children}</div>
      </div>
    </div>
  )
}

const X = ({ size }) => <span>×</span>

export default Files
