
import React, { useState } from 'react';
import { Search, UploadCloud, FileText, Image as ImageIcon, File, Trash2, Eye, MoreVertical, Clock, RotateCcw, X, Download } from 'lucide-react';
import type{ Document, DocumentVersion } from '../types';

interface DocumentsProps {
  documents: Document[];
  setDocuments: React.Dispatch<React.SetStateAction<Document[]>>;
}

export const Documents: React.FC<DocumentsProps> = ({ documents, setDocuments }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // History / Version Control State
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyDoc, setHistoryDoc] = useState<Document | null>(null);
  
  // Preview State
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null);
  
  // Version Upload State
  const [versionFile, setVersionFile] = useState<File | null>(null);
  const [versionNote, setVersionNote] = useState('');

  // New Document Form State
  const [uploadForm, setUploadForm] = useState({
    name: '',
    type: 'Invoice' as const,
    file: null as File | null
  });

  // Enhanced Filter Logic: Searches Name, Type, and Version Notes
  const filteredDocs = documents.filter(d => {
    const lowerTerm = searchTerm.toLowerCase();
    const matchesTypeFilter = filterType === 'All' || d.type === filterType;
    
    // Deep search across document properties
    const matchesSearch = 
      d.name.toLowerCase().includes(lowerTerm) ||
      d.type.toLowerCase().includes(lowerTerm) ||
      d.versions.some(v => v.note?.toLowerCase().includes(lowerTerm));

    return matchesTypeFilter && matchesSearch;
  });

  const handleDelete = (id: string) => {
    if (confirm('Delete this document and all its versions permanently?')) {
      setDocuments(documents.filter(d => d.id !== id));
    }
  };

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadForm.file) return;

    setIsUploading(true);
    
    // Simulate upload delay
    setTimeout(() => {
      const newDoc: Document = {
        id: Date.now().toString(),
        name: uploadForm.name || uploadForm.file!.name,
        type: uploadForm.type,
        dateUploaded: new Date().toISOString(),
        size: `${(uploadForm.file!.size / 1024).toFixed(1)} KB`,
        url: URL.createObjectURL(uploadForm.file!),
        versions: []
      };

      // Add initial version
      newDoc.versions.push({
        id: Date.now().toString(),
        version: 1,
        dateUploaded: newDoc.dateUploaded,
        size: newDoc.size,
        url: newDoc.url!,
        note: 'Initial upload'
      });
      
      setDocuments([newDoc, ...documents]);
      setIsUploading(false);
      setShowUploadModal(false);
      setUploadForm({ name: '', type: 'Invoice', file: null });
    }, 1500);
  };

  const handleOpenHistory = (doc: Document) => {
    setHistoryDoc(doc);
    setVersionFile(null);
    setVersionNote('');
    setShowHistoryModal(true);
  };

  const handleAddVersion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!versionFile || !historyDoc) return;

    setIsUploading(true);

    setTimeout(() => {
        const newVersionNum = historyDoc.versions.length > 0 
            ? Math.max(...historyDoc.versions.map(v => v.version)) + 1 
            : 1;

        const newVersion: DocumentVersion = {
            id: Date.now().toString(),
            version: newVersionNum,
            dateUploaded: new Date().toISOString(),
            size: `${(versionFile.size / 1024).toFixed(1)} KB`,
            url: URL.createObjectURL(versionFile),
            note: versionNote || `Version ${newVersionNum}`
        };

        const updatedDoc = {
            ...historyDoc,
            dateUploaded: newVersion.dateUploaded, // Update display to latest
            size: newVersion.size,
            url: newVersion.url,
            versions: [newVersion, ...historyDoc.versions] // Add to top
        };

        setDocuments(documents.map(d => d.id === historyDoc.id ? updatedDoc : d));
        setHistoryDoc(updatedDoc);
        setVersionFile(null);
        setVersionNote('');
        setIsUploading(false);
    }, 1000);
  };

  const handleRevert = (version: DocumentVersion) => {
    if(!confirm(`Revert to version ${version.version}? This will create a new version copy.`)) return;
    if (!historyDoc) return;

    const newVersionNum = Math.max(...historyDoc.versions.map(v => v.version)) + 1;
    
    const newVersion: DocumentVersion = {
        ...version,
        id: Date.now().toString(),
        version: newVersionNum,
        dateUploaded: new Date().toISOString(),
        note: `Reverted to V${version.version}: ${version.note || ''}`
    };

    const updatedDoc = {
        ...historyDoc,
        dateUploaded: newVersion.dateUploaded,
        size: newVersion.size,
        url: newVersion.url,
        versions: [newVersion, ...historyDoc.versions]
    };

    setDocuments(documents.map(d => d.id === historyDoc.id ? updatedDoc : d));
    setHistoryDoc(updatedDoc);
  };

  const getIcon = (type: string) => {
    switch(type) {
      case 'Invoice': return <FileText className="text-blue-500" size={32} />;
      case 'Contract': return <File className="text-purple-500" size={32} />;
      case 'Manual': return <File className="text-orange-500" size={32} />;
      default: return <ImageIcon className="text-green-500" size={32} />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Document Management</h2>
          <p className="text-slate-500 mt-1">Securely store invoices, contracts, and receipts.</p>
        </div>
        <button 
          onClick={() => setShowUploadModal(true)}
          className="flex items-center gap-2 bg-primary hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors shadow-sm"
        >
          <UploadCloud size={20} />
          Upload Document
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Search by name, type, or version notes..." 
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {['All', 'Invoice', 'Contract', 'Manual', 'Other'].map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
                ${filterType === type 
                  ? 'bg-slate-900 text-white' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredDocs.map(doc => (
          <div key={doc.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow group">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-slate-50 rounded-lg">
                {getIcon(doc.type)}
              </div>
              <div className="relative">
                <button className="text-slate-400 hover:text-slate-600">
                  <MoreVertical size={20} />
                </button>
              </div>
            </div>
            <h3 className="font-semibold text-slate-900 truncate mb-1" title={doc.name}>{doc.name}</h3>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs px-2 py-1 bg-slate-100 rounded text-slate-600">{doc.type}</span>
              <span className="text-xs text-slate-400">{doc.size}</span>
              <span className="text-xs text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                 V{doc.versions.length}
              </span>
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <span className="text-xs text-slate-400">
                {new Date(doc.dateUploaded).toLocaleDateString()}
              </span>
              <div className="flex gap-1">
                <button 
                  onClick={() => handleOpenHistory(doc)}
                  className="p-1.5 text-slate-500 hover:bg-slate-100 rounded transition-colors"
                  title="Version History"
                >
                  <Clock size={16} />
                </button>
                <button 
                  onClick={() => setPreviewDoc(doc)}
                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  title="Preview"
                >
                  <Eye size={16} />
                </button>
                <button 
                  onClick={() => handleDelete(doc.id)}
                  className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
        
        {filteredDocs.length === 0 && (
          <div className="col-span-full py-12 text-center">
            <div className="inline-block p-4 bg-slate-50 rounded-full mb-4">
              <FileText size={48} className="text-slate-300" />
            </div>
            <h3 className="text-lg font-medium text-slate-900">No documents found</h3>
            <p className="text-slate-500">Upload a new document to get started.</p>
          </div>
        )}
      </div>

      {/* Upload Modal (New Doc) */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold mb-6 text-slate-900">Upload Document</h3>
            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Document Name (Optional)</label>
                <input
                  type="text"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary/50 outline-none"
                  placeholder="e.g. Annual Lease Agreement"
                  value={uploadForm.name}
                  onChange={(e) => setUploadForm({ ...uploadForm, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                <select
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary/50 outline-none"
                  value={uploadForm.type}
                  onChange={(e) => setUploadForm({ ...uploadForm, type: e.target.value as any })}
                >
                  <option value="Invoice">Invoice</option>
                  <option value="Contract">Contract</option>
                  <option value="Manual">Manual</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">File Attachment</label>
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:bg-slate-50 transition-colors cursor-pointer relative">
                  <input 
                    type="file" 
                    required
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={(e) => setUploadForm({ ...uploadForm, file: e.target.files?.[0] || null })}
                  />
                  <UploadCloud className="mx-auto text-slate-400 mb-2" size={32} />
                  {uploadForm.file ? (
                    <p className="text-sm font-medium text-primary">{uploadForm.file.name}</p>
                  ) : (
                    <p className="text-sm text-slate-500">Click to upload or drag and drop</p>
                  )}
                </div>
              </div>
              
              <div className="flex justify-end gap-3 mt-6 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading || !uploadForm.file}
                  className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isUploading ? 'Uploading...' : 'Save Document'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* History / Version Control Modal */}
      {showHistoryModal && historyDoc && (
          <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                      <div>
                        <h3 className="text-xl font-bold text-slate-900">Version History</h3>
                        <p className="text-sm text-slate-500">{historyDoc.name}</p>
                      </div>
                      <button 
                          onClick={() => setShowHistoryModal(false)}
                          className="text-slate-400 hover:text-slate-600 transition-colors"
                      >
                          <X size={24} />
                      </button>
                  </div>

                  {/* Add New Version Form */}
                  <div className="bg-slate-50 p-4 rounded-lg mb-6 border border-slate-200">
                      <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                          <UploadCloud size={16} />
                          Upload New Version
                      </h4>
                      <form onSubmit={handleAddVersion} className="flex flex-col md:flex-row gap-3 items-end">
                          <div className="flex-1 w-full">
                              <label className="block text-xs font-medium text-slate-600 mb-1">Select File</label>
                              <input 
                                  type="file" 
                                  required
                                  onChange={(e) => setVersionFile(e.target.files?.[0] || null)}
                                  className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-white file:text-primary hover:file:bg-slate-100"
                              />
                          </div>
                          <div className="flex-1 w-full">
                               <label className="block text-xs font-medium text-slate-600 mb-1">Change Note</label>
                               <input 
                                  type="text" 
                                  placeholder="e.g. Updated terms"
                                  value={versionNote}
                                  onChange={(e) => setVersionNote(e.target.value)}
                                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/50 outline-none bg-white" 
                               />
                          </div>
                          <button 
                            type="submit"
                            disabled={!versionFile || isUploading}
                            className="px-4 py-2 bg-primary text-white text-sm rounded-lg font-medium hover:bg-blue-700 transition-colors whitespace-nowrap disabled:opacity-50"
                          >
                            {isUploading ? 'Uploading...' : 'Add Version'}
                          </button>
                      </form>
                  </div>

                  {/* Version List */}
                  <div className="overflow-y-auto flex-1 pr-2">
                      <div className="space-y-3">
                          {historyDoc.versions.map((version, index) => (
                              <div key={version.id} className={`p-4 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-4
                                  ${index === 0 ? 'bg-indigo-50 border-indigo-100' : 'bg-white border-slate-100'}`}>
                                  <div>
                                      <div className="flex items-center gap-2 mb-1">
                                          <span className={`px-2 py-0.5 text-xs font-bold rounded-full 
                                              ${index === 0 ? 'bg-indigo-200 text-indigo-800' : 'bg-slate-200 text-slate-600'}`}>
                                              V{version.version}
                                          </span>
                                          {index === 0 && <span className="text-xs font-medium text-indigo-600">Current Version</span>}
                                          <span className="text-xs text-slate-400">
                                              {new Date(version.dateUploaded).toLocaleString()}
                                          </span>
                                      </div>
                                      <p className="text-sm font-medium text-slate-800">
                                          {version.note || 'No notes provided'}
                                      </p>
                                      <p className="text-xs text-slate-500 mt-1">Size: {version.size}</p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                      {index !== 0 && (
                                          <button 
                                              onClick={() => handleRevert(version)}
                                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                                          >
                                              <RotateCcw size={14} />
                                              Revert
                                          </button>
                                      )}
                                      <button 
                                          onClick={() => window.open(version.url, '_blank')}
                                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                                      >
                                          <Download size={14} />
                                          Download
                                      </button>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* Document Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 bg-slate-900/70 flex items-center justify-center z-60 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200 bg-slate-50 rounded-t-xl">
               <div className="flex items-center gap-3">
                 <div className="p-2 bg-white border border-slate-200 rounded-lg shadow-sm">
                   {getIcon(previewDoc.type)}
                 </div>
                 <div>
                   <h3 className="text-lg font-bold text-slate-900 truncate max-w-md">{previewDoc.name}</h3>
                   <p className="text-xs text-slate-500">
                     {previewDoc.type} • {previewDoc.size} • {new Date(previewDoc.dateUploaded).toLocaleDateString()}
                   </p>
                 </div>
               </div>
               <button 
                 onClick={() => setPreviewDoc(null)}
                 className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors"
               >
                 <X size={24} />
               </button>
            </div>

            {/* Modal Body (Iframe Preview) */}
            <div className="flex-1 bg-slate-100 relative overflow-hidden">
               {previewDoc.url && previewDoc.url !== '#' ? (
                 <iframe 
                   src={previewDoc.url} 
                   className="w-full h-full border-0" 
                   title="Document Preview"
                 />
               ) : (
                 <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
                   <div className="w-24 h-24 bg-slate-200 rounded-full flex items-center justify-center mb-4">
                     <FileText size={48} className="text-slate-400" />
                   </div>
                   <h4 className="text-lg font-semibold text-slate-600 mb-2">Preview Unavailable</h4>
                   <p className="max-w-md">
                     This is a mock document placeholder. Please upload a real file (PDF, Image) to test the preview functionality.
                   </p>
                 </div>
               )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-200 flex justify-between items-center bg-white rounded-b-xl">
               <button 
                 onClick={() => setPreviewDoc(null)}
                 className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
               >
                 Close
               </button>
               <a 
                 href={previewDoc.url} 
                 target="_blank" 
                 rel="noreferrer"
                 className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm"
               >
                 <Download size={18} />
                 Download File
               </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
