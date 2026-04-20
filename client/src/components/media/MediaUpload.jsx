import { useState, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { FaCloudUploadAlt, FaTimes, FaImage } from 'react-icons/fa';
import toast from 'react-hot-toast';

export default function MediaUpload({ value = [], onChange, onUploadingChange }) {
    const inputRef = useRef(null);

    const onDrop = useCallback((acceptedFiles) => {
        const newFiles = acceptedFiles.map(file => ({
            id: Math.random().toString(36).substr(2, 9),
            file,
            preview: URL.createObjectURL(file),
            uploaded: false
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
        // Clean up memory
        const removed = value.find(f => f.id === id);
        if (removed && removed.preview) URL.revokeObjectURL(removed.preview);
        onChange(filtered);
    };

    return (
        <div className="flex flex-col gap-4">
            {value.length === 0 ? (
                <div 
                    {...getRootProps()} 
                    className={`min-h-[250px] border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all duration-300 ${isDragActive ? 'border-reddit-orange bg-reddit-orange/5' : 'border-reddit-dark-border hover:border-reddit-text-dim'}`}
                >
                    <input {...getInputProps()} />
                    <div className="flex flex-col items-center gap-4 text-center">
                        <div className="w-16 h-16 bg-reddit-dark-surface rounded-full flex items-center justify-center">
                            <FaCloudUploadAlt className="text-3xl text-reddit-text" />
                        </div>
                        <div>
                            <p className="text-reddit-text font-bold text-lg">Drag and drop images</p>
                            <p className="text-reddit-text-dim text-sm uppercase tracking-widest font-black mt-1">or click to browse</p>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4 reddit-card">
                    {value.map((item) => (
                        <div key={item.id} className="aspect-square relative group rounded-xl overflow-hidden border border-reddit-dark-border">
                            <img src={item.preview} className="w-full h-full object-cover" alt="Preview" />
                            <button 
                                onClick={() => removeFile(item.id)}
                                className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full text-white hover:bg-black transition-colors z-20"
                            >
                                <FaTimes />
                            </button>
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                        </div>
                    ))}
                    
                    {/* Add more button */}
                    <div 
                        {...getRootProps()} 
                        className="aspect-square border-2 border-dashed border-reddit-dark-border rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-reddit-orange transition-colors group"
                    >
                        <input {...getInputProps()} />
                        <div className="w-10 h-10 bg-reddit-dark-surface rounded-full flex items-center justify-center group-hover:bg-reddit-orange/10 transition-colors">
                            <FaImage className="text-reddit-text-dim group-hover:text-reddit-orange" />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
