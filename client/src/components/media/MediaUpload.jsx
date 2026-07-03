import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { FiUploadCloud, FiTrash2, FiSliders, FiCheck, FiX, FiRotateCw } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const filterPresets = [
    { name: 'Normal', filter: 'none' },
    { name: 'Clarendon', filter: 'contrast(1.25) saturate(1.25)' },
    { name: 'Lark', filter: 'brightness(1.1) saturate(1.2) sepia(0.1)' },
    { name: 'Moon', filter: 'grayscale(1) contrast(1.1) brightness(1.05)' },
    { name: 'Gingham', filter: 'hue-rotate(-10deg) saturate(0.85) brightness(1.05)' },
    { name: 'Juno', filter: 'saturate(1.3) hue-rotate(8deg) contrast(1.05)' },
];

export default function MediaUpload({ value = [], onChange }) {
    const [editingItem, setEditingItem] = useState(null);
    
    // Editor adjustment states for the active image modal
    const [brightness, setBrightness] = useState(1);
    const [contrast, setContrast] = useState(1);
    const [saturation, setSaturation] = useState(1);
    const [rotate, setRotate] = useState(0);
    const [selectedFilter, setSelectedFilter] = useState('none');
    const [activeEditTab, setActiveEditTab] = useState('filters'); // 'filters' | 'adjustments'

    const onDrop = useCallback((acceptedFiles) => {
        const newFiles = acceptedFiles.map(file => ({
            id: Math.random().toString(36).substr(2, 9),
            file,
            preview: URL.createObjectURL(file),
            adjustments: {
                brightness: 1,
                contrast: 1,
                saturation: 1,
                rotate: 0,
                filter: 'none'
            }
        }));
        onChange([...value, ...newFiles]);
    }, [value, onChange]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] },
        multiple: true
    });

    const removeFile = (id) => {
        const filtered = value.filter(f => f.id !== id);
        const removed = value.find(f => f.id === id);
        if (removed && removed.preview) URL.revokeObjectURL(removed.preview);
        onChange(filtered);
    };

    const startEditing = (item) => {
        setEditingItem(item);
        setBrightness(item.adjustments.brightness);
        setContrast(item.adjustments.contrast);
        setSaturation(item.adjustments.saturation);
        setRotate(item.adjustments.rotate);
        setSelectedFilter(item.adjustments.filter);
        setActiveEditTab('filters');
    };

    const applyEdits = () => {
        const updated = value.map(item => {
            if (item.id === editingItem.id) {
                return {
                    ...item,
                    adjustments: { brightness, contrast, saturation, rotate, filter: selectedFilter }
                };
            }
            return item;
        });
        onChange(updated);
        setEditingItem(null);
        toast.success("Image adjustments cached!");
    };

    // Computes inline styles to apply CSS filter strings
    const getFilterCSS = (adj) => {
        if (!adj) return {};
        let filterStr = '';
        if (adj.filter !== 'none') {
            filterStr += adj.filter + ' ';
        }
        filterStr += `brightness(${adj.brightness}) contrast(${adj.contrast}) saturate(${adj.saturation})`;
        return {
            filter: filterStr,
            transform: `rotate(${adj.rotate}deg)`,
            transition: 'filter 150ms ease, transform 150ms ease'
        };
    };

    return (
        <div className="flex flex-col gap-4">
            {value.length === 0 ? (
                <div 
                    {...getRootProps()} 
                    className={`min-h-[260px] border-2 border-dashed rounded-[24px] flex flex-col items-center justify-center cursor-pointer transition-all duration-300 ${
                        isDragActive 
                            ? 'border-[var(--brand-color)] bg-[var(--brand-color)]/5' 
                            : 'border-[var(--border-color)] hover:border-[var(--text-muted)] bg-[var(--surface-color)]/10'
                    }`}
                >
                    <input {...getInputProps()} />
                    <div className="flex flex-col items-center gap-4 text-center p-6">
                        <div className="w-16 h-16 bg-[var(--surface-hover)] border border-[var(--border-color)] rounded-full flex items-center justify-center">
                            <FiUploadCloud className="text-2xl text-[var(--text-secondary)]" />
                        </div>
                        <div>
                            <p className="text-[var(--text-primary)] font-bold text-sm">Drag and drop photos here</p>
                            <p className="text-[var(--text-muted)] text-[10px] uppercase tracking-wider font-extrabold mt-1">or click to browse local files</p>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 premium-card bg-[var(--surface-color)]/30">
                    {value.map((item) => (
                        <div key={item.id} className="aspect-square relative group rounded-[18px] overflow-hidden border border-[var(--border-color)] bg-black">
                            {/* Rendered with inline filter adjustments */}
                            <img 
                                src={item.preview} 
                                style={getFilterCSS(item.adjustments)} 
                                className="w-full h-full object-cover" 
                                alt="" 
                            />
                            
                            {/* Overlays actions */}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                <button 
                                    onClick={() => startEditing(item)}
                                    className="p-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full text-white transition-all hover:scale-110"
                                    title="Edit Adjustments"
                                >
                                    <FiSliders className="text-sm" />
                                </button>
                                <button 
                                    onClick={() => removeFile(item.id)}
                                    className="p-2.5 bg-red-500/20 hover:bg-red-500/40 backdrop-blur-md rounded-full text-red-400 transition-all hover:scale-110"
                                    title="Delete File"
                                >
                                    <FiTrash2 className="text-sm" />
                                </button>
                            </div>
                        </div>
                    ))}
                    
                    {/* Add extra image box */}
                    <div 
                        {...getRootProps()} 
                        className="aspect-square border-2 border-dashed border-[var(--border-color)] rounded-[18px] flex flex-col items-center justify-center cursor-pointer hover:border-[var(--brand-color)] bg-[var(--surface-color)]/20 transition-all group"
                    >
                        <input {...getInputProps()} />
                        <div className="w-10 h-10 bg-[var(--surface-hover)] border border-[var(--border-color)] rounded-full flex items-center justify-center group-hover:bg-[var(--brand-color)]/10 transition-colors">
                            <span className="text-xl text-[var(--text-secondary)] group-hover:text-[var(--brand-color)]">+</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Adjustments & Filter Lightbox Modal */}
            <AnimatePresence>
                {editingItem && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[20000] bg-black/80 flex items-center justify-center p-4 backdrop-blur-md"
                    >
                        <motion.div 
                            initial={{ scale: 0.95 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.95 }}
                            className="w-full max-w-[800px] bg-[var(--bg-color)] border border-[var(--border-color)] rounded-[28px] overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh]"
                        >
                            {/* Left Column: Image Preview Canvas */}
                            <div className="flex-1 bg-zinc-950 p-6 flex items-center justify-center relative min-h-[300px]">
                                <div className="max-w-full max-h-[400px] overflow-hidden rounded-[18px]">
                                    <img 
                                        src={editingItem.preview} 
                                        style={getFilterCSS({ brightness, contrast, saturation, rotate, filter: selectedFilter })} 
                                        className="max-w-full max-h-[350px] object-contain" 
                                        alt="" 
                                    />
                                </div>
                                <button 
                                    onClick={() => setRotate(prev => (prev + 90) % 360)}
                                    className="absolute bottom-4 right-4 p-2 bg-black/50 hover:bg-black text-white rounded-full border border-white/10"
                                    title="Rotate 90°"
                                >
                                    <FiRotateCw />
                                </button>
                            </div>

                            {/* Right Column: Editing Panel Options */}
                            <div className="w-full md:w-[320px] border-t md:border-t-0 md:border-l border-[var(--border-color)] p-5 flex flex-col justify-between bg-[var(--surface-color)]/20">
                                <div>
                                    {/* Tabs (Filters vs Adjust) */}
                                    <div className="flex border-b border-[var(--border-color)] mb-4">
                                        <button 
                                            onClick={() => setActiveEditTab('filters')}
                                            className={`flex-1 pb-2.5 text-[10px] font-extrabold uppercase tracking-wider border-b-2 transition-all ${
                                                activeEditTab === 'filters' 
                                                    ? 'text-[var(--brand-color)] border-[var(--brand-color)]' 
                                                    : 'text-[var(--text-secondary)] border-transparent hover:text-[var(--text-primary)]'
                                            }`}
                                        >
                                            Filters
                                        </button>
                                        <button 
                                            onClick={() => setActiveEditTab('adjustments')}
                                            className={`flex-1 pb-2.5 text-[10px] font-extrabold uppercase tracking-wider border-b-2 transition-all ${
                                                activeEditTab === 'adjustments' 
                                                    ? 'text-[var(--brand-color)] border-[var(--brand-color)]' 
                                                    : 'text-[var(--text-secondary)] border-transparent hover:text-[var(--text-primary)]'
                                            }`}
                                        >
                                            Adjust
                                        </button>
                                    </div>

                                    {/* Filters Grid */}
                                    {activeEditTab === 'filters' && (
                                        <div className="grid grid-cols-3 gap-2 overflow-y-auto max-h-[240px] pr-1">
                                            {filterPresets.map(p => (
                                                <div 
                                                    key={p.name}
                                                    onClick={() => setSelectedFilter(p.filter)}
                                                    className={`p-1.5 rounded-[12px] border cursor-pointer text-center flex flex-col gap-1 transition-all ${
                                                        selectedFilter === p.filter 
                                                            ? 'border-[var(--brand-color)] bg-[var(--surface-hover)]/30' 
                                                            : 'border-[var(--border-color)] hover:border-[var(--text-muted)] bg-transparent'
                                                    }`}
                                                >
                                                    <div className="aspect-square bg-zinc-800 rounded-[8px] overflow-hidden">
                                                        <img 
                                                            src={editingItem.preview} 
                                                            style={{ filter: p.filter }} 
                                                            className="w-full h-full object-cover" 
                                                            alt="" 
                                                        />
                                                    </div>
                                                    <span className="text-[9px] font-bold truncate text-[var(--text-primary)]">{p.name}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Adjustments Sliders */}
                                    {activeEditTab === 'adjustments' && (
                                        <div className="flex flex-col gap-4">
                                            {/* Brightness */}
                                            <div className="flex flex-col gap-1">
                                                <div className="flex justify-between text-[10px] font-bold text-[var(--text-secondary)]">
                                                    <span>Brightness</span>
                                                    <span>{Math.round(brightness * 100)}%</span>
                                                </div>
                                                <input 
                                                    type="range" 
                                                    min="0.5" 
                                                    max="1.5" 
                                                    step="0.05"
                                                    value={brightness}
                                                    onChange={e => setBrightness(parseFloat(e.target.value))}
                                                    className="w-full accent-[var(--brand-color)] h-1 rounded-full cursor-pointer"
                                                />
                                            </div>

                                            {/* Contrast */}
                                            <div className="flex flex-col gap-1">
                                                <div className="flex justify-between text-[10px] font-bold text-[var(--text-secondary)]">
                                                    <span>Contrast</span>
                                                    <span>{Math.round(contrast * 100)}%</span>
                                                </div>
                                                <input 
                                                    type="range" 
                                                    min="0.5" 
                                                    max="1.5" 
                                                    step="0.05"
                                                    value={contrast}
                                                    onChange={e => setContrast(parseFloat(e.target.value))}
                                                    className="w-full accent-[var(--brand-color)] h-1 rounded-full cursor-pointer"
                                                />
                                            </div>

                                            {/* Saturation */}
                                            <div className="flex flex-col gap-1">
                                                <div className="flex justify-between text-[10px] font-bold text-[var(--text-secondary)]">
                                                    <span>Saturation</span>
                                                    <span>{Math.round(saturation * 100)}%</span>
                                                </div>
                                                <input 
                                                    type="range" 
                                                    min="0" 
                                                    max="2" 
                                                    step="0.1"
                                                    value={saturation}
                                                    onChange={e => setSaturation(parseFloat(e.target.value))}
                                                    className="w-full accent-[var(--brand-color)] h-1 rounded-full cursor-pointer"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Modal Actions */}
                                <div className="flex gap-2.5 border-t border-[var(--border-color)] pt-4 mt-6">
                                    <button 
                                        onClick={applyEdits}
                                        className="flex-1 btn-premium text-[11px] uppercase tracking-wider font-extrabold flex items-center justify-center gap-1.5 py-2.5"
                                    >
                                        <FiCheck />
                                        <span>Apply</span>
                                    </button>
                                    <button 
                                        onClick={() => setEditingItem(null)}
                                        className="flex-1 btn-premium-outline text-[11px] uppercase tracking-wider font-extrabold flex items-center justify-center gap-1.5 py-2.5"
                                    >
                                        <FiX />
                                        <span>Cancel</span>
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
