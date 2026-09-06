import React, { useState, useEffect } from 'react';
import { Upload, Search, Image as ImageIcon, FileText, Download, Copy, Trash2, Info, HardDrive, Check } from 'lucide-react';
import { SummaryCard } from '../../components/common/SummaryCard';
import { Modal } from '../../components/common/Modal';
import api from '../../api/axios';

export const MediaLibrary = () => {
  const [files, setFiles] = useState([]);
  const [stats, setStats] = useState({ totalFiles: 0, storageUsedMB: '0 MB', totalImages: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [fileInfoTarget, setFileInfoTarget] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const fetchMedia = async () => {
    setLoading(true);
    try {
      const res = await api.get('/super-admin/media', { params: { search } });
      if (res.data?.success) {
        setFiles(res.data.data.files);
        setStats(res.data.data.stats);
      }
    } catch (err) {
      console.error('Failed to load media files:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, [search]);

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      await api.post('/super-admin/media/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setIsUploadModalOpen(false);
      setSelectedFile(null);
      fetchMedia();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to upload media');
    }
  };

  const handleCopyLink = (file) => {
    const fullUrl = `${window.location.origin}${file.fileUrl}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedId(file._id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this file permanently?')) {
      try {
        await api.delete(`/super-admin/media/${id}`);
        fetchMedia();
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete file');
      }
    }
  };

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Media Library</h1>
          <p className="text-xs text-slate-500">Manage digital assets, product imagery & uploaded attachments</p>
        </div>
        <button
          onClick={() => setIsUploadModalOpen(true)}
          className="inline-flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors"
        >
          <Upload className="w-4 h-4 mr-1.5" />
          Upload Media
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SummaryCard title="Total Files" value={stats.totalFiles} icon={FileText} color="sky" />
        <SummaryCard title="Storage Used" value={stats.storageUsedMB} icon={HardDrive} color="purple" />
        <SummaryCard title="Total Images" value={stats.totalImages} icon={ImageIcon} color="emerald" />
      </div>

      {/* Search Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search media by filename..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <span className="text-xs text-slate-400 font-medium">Showing {files.length} assets</span>
      </div>

      {/* Media Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-400">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary-500 border-t-transparent mb-2" />
          <p className="text-xs">Loading media assets...</p>
        </div>
      ) : files.length === 0 ? (
        <div className="p-16 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
          <ImageIcon className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No media assets found</p>
          <p className="text-xs text-slate-400 mt-1">Upload photos, banners or catalogs to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {files.map((file) => {
            const isImage = file.mimeType?.startsWith('image/');
            const isCopied = copiedId === file._id;

            return (
              <div
                key={file._id}
                className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col"
              >
                {/* Thumbnail */}
                <div className="aspect-square bg-slate-100 dark:bg-slate-800 relative overflow-hidden flex items-center justify-center">
                  {isImage ? (
                    <img
                      src={file.fileUrl}
                      alt={file.originalName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <FileText className="w-10 h-10 text-slate-400" />
                  )}

                  {/* Hover Overlay Menu */}
                  <div className="absolute inset-0 bg-slate-900/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-2">
                    <button
                      onClick={() => {
                        setFileInfoTarget(file);
                        setIsInfoModalOpen(true);
                      }}
                      className="p-1.5 bg-white/90 hover:bg-white text-slate-800 rounded-lg"
                      title="View Info"
                    >
                      <Info className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleCopyLink(file)}
                      className="p-1.5 bg-white/90 hover:bg-white text-slate-800 rounded-lg"
                      title="Copy Link"
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <a
                      href={file.fileUrl}
                      download={file.originalName}
                      className="p-1.5 bg-white/90 hover:bg-white text-slate-800 rounded-lg"
                      title="Download"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>
                    <button
                      onClick={() => handleDelete(file._id)}
                      className="p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Caption */}
                <div className="p-2 text-left">
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate" title={file.originalName}>
                    {file.originalName}
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono">
                    {(file.fileSize / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Media Modal */}
      <Modal isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} title="Upload Media Files">
        <form onSubmit={handleFileUpload} className="space-y-4 text-left">
          <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-8 text-center hover:border-primary-500 transition-colors">
            <Upload className="w-10 h-10 text-slate-400 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Drag & drop media files here, or click browse
            </p>
            <p className="text-[10px] text-slate-400 mt-1">Supports JPG, PNG, GIF, WEBP, PDF up to 10MB</p>
            <input
              type="file"
              required
              onChange={(e) => setSelectedFile(e.target.files[0])}
              className="mt-4 block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
            />
          </div>
          <div className="flex justify-end space-x-2">
            <button type="button" onClick={() => setIsUploadModalOpen(false)} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 text-xs font-bold bg-primary-600 hover:bg-primary-700 text-white rounded-lg">
              Upload File
            </button>
          </div>
        </form>
      </Modal>

      {/* File Info Modal */}
      <Modal isOpen={isInfoModalOpen} onClose={() => setIsInfoModalOpen(false)} title="File Properties">
        {fileInfoTarget && (
          <div className="space-y-3 text-xs text-left">
            <div>
              <span className="font-semibold text-slate-500 block">Original Filename:</span>
              <span className="text-slate-900 dark:text-white font-mono">{fileInfoTarget.originalName}</span>
            </div>
            <div>
              <span className="font-semibold text-slate-500 block">File Size:</span>
              <span className="text-slate-900 dark:text-white font-mono">{(fileInfoTarget.fileSize / 1024).toFixed(2)} KB</span>
            </div>
            <div>
              <span className="font-semibold text-slate-500 block">MIME Type:</span>
              <span className="text-slate-900 dark:text-white font-mono">{fileInfoTarget.mimeType}</span>
            </div>
            <div>
              <span className="font-semibold text-slate-500 block">Direct URL:</span>
              <span className="text-slate-900 dark:text-white font-mono break-all">{window.location.origin}{fileInfoTarget.fileUrl}</span>
            </div>
            <div>
              <span className="font-semibold text-slate-500 block">Uploaded At:</span>
              <span className="text-slate-900 dark:text-white">{new Date(fileInfoTarget.createdAt).toLocaleString()}</span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
