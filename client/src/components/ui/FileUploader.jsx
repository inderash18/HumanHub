import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { FaCloudUploadAlt, FaTimes } from 'react-icons/fa';

export default function FileUploader({ onUploadComplete, currentImage = '' }) {
    const [uploading, setUploading] = useState(false);
    const [preview, setPreview] = useState(currentImage);

    const onDrop = useCallback(async (acceptedFiles) => {
        const file = acceptedFiles[0];
        if (!file) return;

        // Custom validation check
        if (file.size > 5 * 1024 * 1024) {
            toast.error("File size must be under 5MB");
            return;
        }

        const formData = new FormData();
        formData.append('image', file);

        setUploading(true);
        const loadingToast = toast.loading('Uploading quality creation...');

        try {
            const { data } = await api.post('/posts/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            setPreview(data.url);
            onUploadComplete(data.url);
            toast.success("Ready for humanity scan", { id: loadingToast });
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || "Upload failed", { id: loadingToast });
        } finally {
            setUploading(false);
        }
    }, [onUploadComplete]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] },
        maxFiles: 1,
        disabled: uploading
    });

    const removeImage = (e) => {
        e.stopPropagation();
        setPreview('');
        onUploadComplete('');
    };

    return (
        <div 
            {...getRootProps()} 
            className={`reddit-card min-h-[200px] border-2 border-dashed flex flex-col items-center justify-center cursor-pointer relative overflow-hidden transition-all duration-300 ${
                isDragActive ? 'border-brand-gold bg-brand-gold/5' : 'border-white/10 hover:border-white/20'
            }`}
        >
            <input {...getInputProps()} />
            
            {preview ? (
                <div className="w-full h-full p-2 relative">
                    <img src={preview} alt="Upload Preview" className="max-h-[300px] w-full object-contain rounded-lg shadow-2xl" />
                    <button 
                        onClick={removeImage}
                        className="absolute top-4 right-4 bg-black/60 hover:bg-black/90 p-2 rounded-full text-white backdrop-blur-md"
                    >
                        <FaTimes />
                    </button>
                    <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity rounded-lg">
                        <span className="text-white text-xs font-bold uppercase tracking-wider">Change Image</span>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center gap-3 p-8">
                    <div className={`p-4 rounded-full ${uploading ? 'animate-pulse bg-brand-gold/20' : 'bg-white/5'}`}>
                        <FaCloudUploadAlt className={`text-4xl ${uploading ? 'text-brand-gold' : 'text-brand-muted'}`} />
                    </div>
                    <div className="text-center">
                        <p className="text-white font-bold mb-1">
                            {uploading ? 'Processing Signal...' : 'Drop image or browse'}
                        </p>
                        <p className="text-brand-muted text-xs uppercase tracking-widest font-mono">
                            JPG, PNG, WEBP • MAX 5MB
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
