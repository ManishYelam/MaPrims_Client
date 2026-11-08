import React, { useState, useMemo, useEffect, useCallback } from 'react'
import {
  FaFolder, FaFolderOpen, FaArrowUp, FaSearch,
  FaChevronRight, FaChevronDown, FaHome, FaArrowRight,
  FaFilePdf, FaFileImage, FaFileVideo, FaFileAudio, FaFileArchive, FaFileCode, FaFileAlt
} from 'react-icons/fa'
import { FiRefreshCw } from 'react-icons/fi'
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { storageAPI } from '../services/api'

const FILE_TYPE_EXTENSIONS = {
  image: new Set(['jpg','jpeg','png','gif','bmp','svg','webp']),
  code: new Set(['js','jsx','ts','tsx','html','css','py','java','cpp','c','php','rb','go','rs']),
  text: new Set(['txt','md','json','xml','csv','yml','yaml','ini','cfg','conf']),
  pdf: new Set(['pdf']),
  audio: new Set(['mp3','wav','ogg','m4a','flac','aac','wma']),
  video: new Set(['mp4','avi','mov','mkv','wmv','flv','webm','m4v']),
  archive: new Set(['zip','rar','tar','gz','7z','bz2','xz']),
  document: new Set(['doc','docx','xls','xlsx','ppt','pptx','odt','ods','odp']),
}

const getFileTypeFromExtension = (filename) => {
  const ext = filename?.split('.').pop()?.toLowerCase()
  if (!ext) return 'other'
  for (const [type, exts] of Object.entries(FILE_TYPE_EXTENSIONS)) {
    if (exts.has(ext)) return type
  }
  return 'other'
}

const getFileIconAndColor = (fileType, fileName) => {
  const ext = fileName?.split('.').pop()?.toLowerCase() || ''
  if (fileType === 'pdf' || ext === 'pdf') return { icon: FaFilePdf, color: 'text-red-600' }
  if (fileType === 'image') {
    const colorMap = {
      png: 'text-blue-600',
      jpg: 'text-green-600',
      jpeg: 'text-green-600',
      gif: 'text-purple-600',
      bmp: 'text-yellow-600',
      webp: 'text-indigo-600',
      svg: 'text-orange-600',
    }
    return { icon: FaFileImage, color: colorMap[ext] || 'text-gray-600' }
  }
  if (fileType === 'video') return { icon: FaFileVideo, color: 'text-red-500' }
  if (fileType === 'audio') return { icon: FaFileAudio, color: 'text-purple-500' }
  if (fileType === 'archive') return { icon: FaFileArchive, color: 'text-yellow-600' }
  if (fileType === 'code') return { icon: FaFileCode, color: 'text-green-600' }
  if (fileType === 'document' || fileType === 'text' || fileType === 'other') {
    if (ext === 'doc' || ext === 'docx') return { icon: FaFileAlt, color: 'text-blue-700' }
    if (ext === 'xls' || ext === 'xlsx') return { icon: FaFileAlt, color: 'text-green-700' }
    return { icon: FaFileAlt, color: 'text-gray-600' }
  }
  return { icon: FaFileAlt, color: 'text-gray-500' }
}

const SORT_FUNCTIONS = {
  'name-asc': (a, b) => a.name.localeCompare(b.name),
  'name-desc': (a, b) => b.name.localeCompare(a.name),
  'size-asc': (a, b) => (a.size || 0) - (b.size || 0),
  'size-desc': (a, b) => (b.size || 0) - (a.size || 0),
  'date-asc': (a, b) => new Date(a.modified) - new Date(b.modified),
  'date-desc': (a, b) => new Date(b.modified) - new Date(a.modified),
  'type-asc': (a, b) => (a.file_type || '').localeCompare(b.file_type || ''),
  'type-desc': (a, b) => (b.file_type || '').localeCompare(a.file_type || ''),
}

const formatBytes = (bytes, decimals = 2) => {
  if (!bytes || bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes','KB','MB','GB','TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`
}

const flattenTree = nodes => {
  const flat = {}
  const process = (node, path = '') => {
    const curPath = path ? `${path}/${node.slug}` : `/${node.slug}`
    flat[node.dir_id] = { ...node, full_path: curPath, children: node.children || [] }
    if (node.children?.length) node.children.forEach(c => process(c, curPath))
  }
  nodes.forEach(n => process(n))
  return flat
}

const buildFullPath = pathArr =>
  pathArr.length === 1 && pathArr[0].dir_id === 0
    ? '/'
    : pathArr.filter(f => f.dir_id !== 0).map(f => f.name).join('/')

let idCounter = 1
const transformStorageTree = (node, parentPath = '') => {
  const id = idCounter++
  const curPath = parentPath ? `${parentPath}/${node.name}` : `/${node.name}`
  const slug = node.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  if (node.type === 'directory') {
    return {
      dir_id: id, name: node.name, slug, full_path: curPath, type: 'directory',
      children: node.children ? node.children.map(c => transformStorageTree(c, curPath)) : [],
    }
  }
  return {
    file_id: id,
    name: node.name,
    type: 'file',
    file_type: node.file_type || getFileTypeFromExtension(node.name),
    extension: node.extension || '',
    mime_type: node.mime_type || '',
    size: node.size,
    modified: node.modified,
    full_path: curPath,
  }
}

const TreeNode = React.memo(({ node, level = 0, expanded, onToggle, onSelect, onFileClick, currentPath }) => {
  const isDirectory = node.type === 'directory' || node.dir_id != null
  const isOpen = expanded.has(node.dir_id)
  const active = currentPath[currentPath.length-1]?.dir_id === node.dir_id

  const handleNodeClick = (e) => {
    if (isDirectory) {
      onSelect(node)
      if (node.children?.length) onToggle(node.dir_id)
    } else {
      onFileClick(node)
    }
  }

  const handleToggleClick = (e) => {
    e.stopPropagation()
    if (isDirectory && node.children?.length) onToggle(node.dir_id)
  }

  return (
    <div>
      <div
        className={`flex items-center py-0.5 px-1.5 rounded hover:bg-gray-100 cursor-pointer ${active ? 'bg-blue-50 text-blue-600' : ''}`}
        style={{ paddingLeft: `${level*16+6}px` }}
        onClick={handleNodeClick}
      >
        {isDirectory ? (
          node.children?.length ? (
            <span onClick={handleToggleClick} className="mr-0.5 p-0.5 hover:bg-gray-200 rounded flex-shrink-0">
              {isOpen ? <FaChevronDown size={9}/> : <FaChevronRight size={9}/>}
            </span>
          ) : (
            <span className="w-4 mr-0.5 flex-shrink-0"/>
          )
        ) : (
          <span className="w-4 mr-0.5 flex-shrink-0"/>
        )}

        {isDirectory ? (
          isOpen ? <FaFolderOpen className="text-yellow-500 mr-1 flex-shrink-0" size={13}/> : <FaFolder className="text-yellow-500 mr-1 flex-shrink-0" size={13}/>
        ) : (
          <FileIcon node={node} />
        )}

        <span className="truncate text-[11px] min-w-0 flex-1">{node.name}</span>

        {isDirectory && node.children?.length > 0 && (
          <span className="ml-auto text-[10px] text-gray-500 flex-shrink-0 whitespace-nowrap">{node.children.length}</span>
        )}
        {!isDirectory && (
          <span className="ml-auto text-[10px] text-gray-400 flex-shrink-0 whitespace-nowrap">{formatBytes(node.size)}</span>
        )}
      </div>

      {isDirectory && isOpen && node.children?.length > 0 && (
        <div>
          {node.children.map(c => (
            <TreeNode
              key={c.dir_id ?? c.file_id}
              node={c}
              level={level+1}
              expanded={expanded}
              onToggle={onToggle}
              onSelect={onSelect}
              onFileClick={onFileClick}
              currentPath={currentPath}
            />
          ))}
        </div>
      )}
    </div>
  )
})

const FileIcon = React.memo(({ node }) => {
  const { icon: Icon, color } = getFileIconAndColor(node.file_type, node.name)
  return <Icon className={`${color} mr-1 w-3 h-3 flex-shrink-0`} />
})

const FileExplorer = () => {
  const [currentPath, setCurrentPath] = useState([{ dir_id: 0, name: 'Home', full_path: '/' }])
  const [sortBy, setSortBy] = useState('name-asc')
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState(new Set())
  const [tree, setTree] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState(null)
  const [editingPath, setEditingPath] = useState(false)
  const [pathInput, setPathInput] = useState('')

  const fetchTree = useCallback(async () => {
    try {
      setLoading(true)
      idCounter = 1
      const { data } = await storageAPI.list()
      if (data.success) {
        setTree(data.tree.map(n => transformStorageTree(n, '')))
        setErr(null)
      }
    } catch (e) {
      setErr('Failed to load tree')
      toast.error('Failed to load tree')
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchTree() }, [fetchTree])

  const flatData = useMemo(() => tree.length ? flattenTree(tree) : {}, [tree])

  const folderItems = useMemo(() => {
    const cur = currentPath[currentPath.length-1]
    if (cur.dir_id === 0) return tree.map(d => ({ ...d, type: 'folder' }))
    const dir = flatData[cur.dir_id]
    if (!dir) return []
    return (dir.children || []).map(c => ({
      ...c,
      type: c.dir_id ? 'folder' : c.type,
      items: c.children?.length || 0,
      size: c.size || 0,
      modified: c.modified,
      file_type: c.file_type || '',
      extension: c.extension || '',
    }))
  }, [currentPath, tree, flatData])

  const items = useMemo(() => {
    let filtered = search ? folderItems.filter(i => i.name.toLowerCase().includes(search.toLowerCase())) : folderItems
    const sortFn = SORT_FUNCTIONS[sortBy] || SORT_FUNCTIONS['name-asc']
    return [...filtered].sort(sortFn)
  }, [folderItems, search, sortBy])

  useEffect(() => {
    if (!editingPath) setPathInput(buildFullPath(currentPath))
  }, [currentPath, editingPath])

  const goToPath = useCallback(target => {
    if (!target) return
    let norm = target.trim()
    if (norm === '/' || norm === '\\') {
      setCurrentPath([{ dir_id: 0, name: 'Home', full_path: '/' }])
      setEditingPath(false)
      return
    }
    norm = norm.startsWith('/') ? norm : `/${norm}`
    if (norm.endsWith('/') && norm.length > 1) norm = norm.slice(0, -1)
    let match = Object.values(flatData).find(d => d.full_path === norm)
    if (match) {
      const build = (d, arr = []) => {
        const nxt = [d, ...arr]
        if (d.dir_id === 0) return nxt
        const parent = Object.values(flatData).find(p => p.children?.some(c => c.dir_id === d.dir_id))
        return parent ? build(parent, nxt) : [{ dir_id: 0, name: 'Home', full_path: '/' }, ...nxt]
      }
      setCurrentPath(build(match))
      setEditingPath(false)
      toast.success(`Navigated to ${match.name}`)
    } else {
      const parts = norm.split('/').filter(p => p)
      const dirs = Object.values(flatData).filter(d => parts.includes(d.name))
      if (dirs.length) {
        const fallback = dirs[0]
        const build = (d, arr = []) => {
          const nxt = [d, ...arr]
          if (d.dir_id === 0) return nxt
          const parent = Object.values(flatData).find(p => p.children?.some(c => c.dir_id === d.dir_id))
          return parent ? build(parent, nxt) : [{ dir_id: 0, name: 'Home', full_path: '/' }, ...nxt]
        }
        setCurrentPath(build(fallback))
        setEditingPath(false)
        toast.success(`Navigated to ${fallback.name}`)
      } else {
        toast.error('Path not found')
      }
    }
  }, [flatData])

  const navigateUp = () => {
    if (currentPath.length > 1) setCurrentPath(prev => prev.slice(0, -1))
  }

  const toggleExpand = id => setExpanded(prev => {
    const next = new Set(prev)
    next.has(id) ? next.delete(id) : next.add(id)
    return next
  })

  const selectFolder = folder => {
    if (folder.dir_id === 0) return setCurrentPath([{ dir_id: 0, name: 'Home', full_path: '/' }])
    const find = (nodes, id, path=[]) => {
      for (const n of nodes) {
        if (n.dir_id === id) return [...path, n]
        if (n.children?.length) {
          const f = find(n.children, id, [...path, n])
          if (f) return f
        }
      }
      return null
    }
    const newPath = find(tree, folder.dir_id, [{ dir_id: 0, name: 'Home', full_path: '/' }])
    if (newPath) setCurrentPath(newPath)
  }

  const openFile = useCallback((item) => {
    if (item.type === 'folder') return
    const rel = item.full_path.startsWith('/') ? item.full_path.slice(1) : item.full_path
    window.open('/uploads/' + rel, '_blank')
  }, [])

  const renderFileIcon = (item) => {
    const { icon: Icon, color } = getFileIconAndColor(item.file_type, item.name)
    return <Icon className={`${color} w-3.5 h-3.5 flex-shrink-0`} />
  }

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"/>
    </div>
  )
  if (err) return (
    <div className="p-4 text-red-600 bg-red-50 rounded">
      <p>{err}</p>
      <button onClick={fetchTree} className="mt-2 px-3 py-1 bg-red-600 text-white rounded">Retry</button>
    </div>
  )

  return (
    <div className="h-full bg-gray-50 p-1 overflow-hidden">
      <ToastContainer position="top-right" autoClose={2000} hideProgressBar newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover theme="light" style={{ fontSize: '12px' }} toastStyle={{ minHeight: '32px', padding: '6px 10px', fontSize: '12px', borderRadius: '4px' }} />
      <div className="flex gap-1 h-full min-h-0">
        {/* Sidebar */}
        <div className="w-60 bg-white rounded-lg shadow-sm overflow-hidden flex flex-col h-full min-h-0">
          <div className="p-1.5 border-b shrink-0">
            <h2 className="text-[11px] font-semibold">Files & Directories</h2>
          </div>
          <div className="p-1 overflow-y-auto flex-1 min-h-0">
            {tree.map(d => (
              <TreeNode
                key={d.dir_id ?? d.file_id}
                node={d}
                expanded={expanded}
                onToggle={toggleExpand}
                onSelect={selectFolder}
                onFileClick={openFile}
                currentPath={currentPath}
              />
            ))}
          </div>
          <div className="p-1 border-t bg-gray-50 text-[10px] flex justify-between shrink-0">
            <span>{Object.keys(flatData).length} dirs</span>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 bg-white rounded-lg shadow-sm overflow-hidden flex flex-col h-full min-h-0">
          {/* Toolbar */}
          <div className="border-b p-1 flex flex-wrap items-center gap-1 shrink-0">
            <button onClick={navigateUp} disabled={currentPath.length <= 1} className={`p-0.5 rounded ${currentPath.length <= 1 ? 'text-gray-400' : 'hover:bg-gray-100'}`}>
              <FaArrowUp size={11}/>
            </button>
            <button onClick={fetchTree} className="p-0.5 rounded hover:bg-gray-100">
              <FiRefreshCw size={11}/>
            </button>
            <div className="flex-1 flex items-center bg-gray-50 border rounded px-1 py-0.5 h-6 cursor-text" onClick={() => { setEditingPath(true); setTimeout(() => document.querySelector('[data-path-input]')?.select(), 10) }}>
              {!editingPath ? (
                <div className="flex items-center space-x-0.5 text-[11px]">
                  <FaHome size={9}/>
                  {currentPath.filter(f => f.dir_id !== 0).map((f, i) => (
                    <React.Fragment key={f.dir_id ?? f.full_path}>
                      <FaArrowRight className="mx-0.5" size={7}/>
                      <span className="truncate max-w-[70px]">{f.name}</span>
                    </React.Fragment>
                  ))}
                </div>
              ) : (
                <div className="flex items-center w-full">
                  <input data-path-input value={pathInput} onChange={e => setPathInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') goToPath(pathInput); if (e.key === 'Escape') setEditingPath(false) }} onBlur={() => setTimeout(() => setEditingPath(false), 100)} className="flex-1 text-[11px] border-none outline-none" autoFocus />
                  <button onClick={() => goToPath(pathInput)} className="ml-1 px-1 py-0.5 bg-blue-600 text-white rounded text-[10px]">Go</button>
                  <button onClick={() => setEditingPath(false)} className="ml-0.5 px-1 py-0.5 bg-gray-200 rounded text-[10px]">Cancel</button>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-1">
              <div className="relative">
                <FaSearch className="absolute left-1 top-1/2 -translate-y-1/2 text-gray-400 text-[10px]" />
                <input type="text" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="pl-5 pr-1 py-0.5 text-[11px] border rounded w-20 h-6" />
              </div>
              <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="appearance-none bg-gray-100 border rounded text-[11px] px-1 py-0.5 pr-4 h-6">
                <option value="name-asc">Name A-Z</option>
                <option value="name-desc">Name Z-A</option>
                <option value="date-desc">Newest</option>
                <option value="date-asc">Oldest</option>
                <option value="size-desc">Largest</option>
                <option value="size-asc">Smallest</option>
                <option value="type-asc">Type A-Z</option>
                <option value="type-desc">Type Z-A</option>
              </select>
            </div>
          </div>

          {/* Content area (scrollable) */}
          <div className="p-1 flex-1 min-h-0 overflow-y-auto">
            <div className="flex justify-between items-center mb-1">
              <h3 className="text-[11px] font-medium">{currentPath[currentPath.length-1].name} <span className="text-gray-500">({items.length} items)</span></h3>
            </div>
            {items.length === 0 ? (
              <div className="text-center py-3 text-gray-500 text-[11px]">Empty folder</div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-1">
                {items.map((item, idx) => (
                  <div key={item.dir_id || item.file_id || idx}
                    className="p-1 border rounded hover:bg-gray-50 text-[11px] cursor-pointer"
                    onClick={() => {
                      if (item.type === 'folder') {
                        setCurrentPath(prev => [...prev, item])
                        toggleExpand(item.dir_id)
                      }
                    }}
                    onDoubleClick={() => item.type === 'folder' ? selectFolder(item) : openFile(item)}>
                    <div className="flex items-center gap-1">
                      {item.type === 'folder' ? <FaFolder className="text-yellow-500" size={13}/> : renderFileIcon(item)}
                      <span className="truncate flex-1 text-[11px]">{item.name}</span>
                      {item.type === 'folder' && item.items > 0 && <span className="text-[10px] text-gray-500 bg-gray-100 px-0.5 rounded">{item.items}</span>}
                    </div>
                    {item.type === 'file' && item.extension && (
                      <div className="text-[10px] text-gray-400 mt-0.5">{item.extension.toUpperCase()}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* No footer */}
        </div>
      </div>
    </div>
  )
}

export default FileExplorer
