import React, { useState } from 'react'
import { motion } from 'framer-motion'
import DirectoryTree from '../../components/dir/directory/DirectoryTree'
import DirectoryList from '../../components/dir/directory/DirectoryList'
// import DirectoryOperations from '../components/directory/DirectoryOperations';
// import SearchBar from '../components/common/SearchBar';
// import CreateDirectoryModal from '../components/directory/CreateDirectoryModal';
import {
  FolderPlus,
  Grid,
  List,
  Filter,
  MoreVertical,
  Upload,
  Star,
  Users,
  HardDrive,
} from 'lucide-react'

const Directories = () => {
  const [viewMode, setViewMode] = useState('grid')
  const [selectedDirs, setSelectedDirs] = useState([])
  const [showFilters, setShowFilters] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const directories = [
    {
      id: '1',
      name: 'Documents',
      path: '/Documents',
      size: 254803968, // 243MB
      fileCount: 124,
      created: '2024-01-10',
      modified: '2024-01-15',
      visibility: 'private',
      tags: ['work', 'personal'],
      isFavorite: true,
      isLocked: false,
      children: [
        { id: '11', name: 'Work', size: 157286400, fileCount: 89 },
        { id: '12', name: 'Personal', size: 97517568, fileCount: 35 },
      ],
    },
    {
      id: '2',
      name: 'Images',
      path: '/Images',
      size: 5368709120, // 5GB
      fileCount: 2345,
      created: '2024-01-05',
      modified: '2024-01-14',
      visibility: 'public',
      tags: ['photos', 'design'],
      isFavorite: false,
      isLocked: false,
    },
    {
      id: '3',
      name: 'Videos',
      path: '/Videos',
      size: 10737418240, // 10GB
      fileCount: 123,
      created: '2024-01-01',
      modified: '2024-01-12',
      visibility: 'shared',
      tags: ['movies', 'tutorials'],
      isFavorite: true,
      isLocked: true,
    },
    {
      id: '4',
      name: 'Music',
      path: '/Music',
      size: 3221225472, // 3GB
      fileCount: 456,
      created: '2024-01-08',
      modified: '2024-01-13',
      visibility: 'private',
      tags: ['audio', 'playlists'],
      isFavorite: false,
      isLocked: false,
    },
    {
      id: '5',
      name: 'Backups',
      path: '/Backups',
      size: 21474836480, // 20GB
      fileCount: 67,
      created: '2024-01-03',
      modified: '2024-01-15',
      visibility: 'private',
      tags: ['system', 'archive'],
      isFavorite: false,
      isLocked: true,
    },
    {
      id: '6',
      name: 'Shared',
      path: '/Shared',
      size: 1073741824, // 1GB
      fileCount: 89,
      created: '2024-01-06',
      modified: '2024-01-14',
      visibility: 'shared',
      tags: ['collaboration'],
      isFavorite: false,
      isLocked: false,
    },
    {
      id: '7',
      name: 'Projects',
      path: '/Projects',
      size: 4294967296, // 4GB
      fileCount: 156,
      created: '2024-01-02',
      modified: '2024-01-15',
      visibility: 'private',
      tags: ['development', 'work'],
      isFavorite: true,
      isLocked: false,
      children: [
        { id: '71', name: 'Web App', size: 2147483648, fileCount: 89 },
        { id: '72', name: 'Mobile App', size: 1610612736, fileCount: 45 },
        { id: '73', name: 'Database', size: 536870912, fileCount: 22 },
      ],
    },
    {
      id: '8',
      name: 'Archives',
      path: '/Archives',
      size: 8589934592, // 8GB
      fileCount: 34,
      created: '2023-12-15',
      modified: '2024-01-10',
      visibility: 'private',
      tags: ['old', 'compressed'],
      isFavorite: false,
      isLocked: true,
    },
  ]

  const directoryTreeData = [
    {
      id: 'root',
      name: 'Root',
      children: directories.map(dir => ({
        id: dir.id,
        name: dir.name,
        children: dir.children || [],
        fileCount: dir.fileCount,
        size: dir.size,
        isExpanded: false,
        isSelected: selectedDirs.includes(dir.id),
      })),
    },
  ]

  const handleSelectDirectory = dir => {
    // console.log('Selected directory:', dir)
  }

  const handleDirectoryAction = (action, dir) => {
    // console.log('Directory action:', action, dir)
    switch (action) {
      case 'open':
        handleSelectDirectory(dir)
        break
      case 'share':
        // console.log('Share directory:', dir)
        break
      case 'delete':
        if (window.confirm(`Delete directory "${dir.name}"?`)) {
          // console.log('Delete directory:', dir)
        }
        break
    }
  }

  const handleCreateDirectory = async data => {
    // console.log('Create directory:', data)
    // API call to create directory
    setShowCreateModal(false)
  }

  const handleSearch = (query, filters) => {
    // console.log('Search:', query, filters)
    setSearchQuery(query)
  }

  const filteredDirectories = searchQuery
    ? directories.filter(
        dir =>
          dir.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          dir.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : directories

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Directories</h1>
          <p className="text-gray-600 mt-1">Organize your files into folders</p>
        </div>

        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
          {/* <SearchBar 
            placeholder="Search directories..." 
            onSearch={handleSearch}
          /> */}

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
              title={viewMode === 'grid' ? 'List View' : 'Grid View'}
            >
              {viewMode === 'grid' ? <List size={20} /> : <Grid size={20} />}
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-lg ${showFilters ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
              title="Filters"
            >
              <Filter size={20} />
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center"
            >
              <FolderPlus size={18} className="mr-2" />
              New Folder
            </button>
          </div>
        </div>
      </div>

      {/* Directory Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Directories</p>
              <p className="text-2xl font-bold">{directories.length}</p>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <HardDrive className="text-blue-600" size={24} />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Files</p>
              <p className="text-2xl font-bold">
                {directories.reduce((sum, dir) => sum + dir.fileCount, 0).toLocaleString()}
              </p>
            </div>
            <div className="p-2 bg-green-100 rounded-lg">
              <Upload className="text-green-600" size={24} />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Size</p>
              <p className="text-2xl font-bold">
                {formatBytes(directories.reduce((sum, dir) => sum + dir.size, 0))}
              </p>
            </div>
            <div className="p-2 bg-purple-100 rounded-lg">
              <Star className="text-purple-600" size={24} />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Shared</p>
              <p className="text-2xl font-bold">
                {directories.filter(dir => dir.visibility === 'shared').length}
              </p>
            </div>
            <div className="p-2 bg-orange-100 rounded-lg">
              <Users className="text-orange-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Directory Tree - Left Column */}
        <div className="lg:col-span-1">
          <DirectoryTree
            data={directoryTreeData}
            onSelect={handleSelectDirectory}
            onCreateFolder={() => setShowCreateModal(true)}
          />
        </div>

        {/* Directory List - Right Column */}
        <div className="lg:col-span-2">
          {/* {selectedDirs.length > 0 && (
            <DirectoryOperations 
              selectedDirectories={directories.filter(dir => selectedDirs.includes(dir.id))}
              onAction={handleDirectoryAction}
            />
          )} */}

          <DirectoryList
            directories={filteredDirectories}
            viewMode={viewMode}
            onSelect={handleSelectDirectory}
            onAction={handleDirectoryAction}
            onViewModeChange={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
          />
        </div>
      </div>

      {/* Create Directory Modal */}
      {/* {showCreateModal && (
        <CreateDirectoryModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateDirectory}
        />
      )} */}
    </div>
  )
}

const formatBytes = bytes => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

export default Directories
