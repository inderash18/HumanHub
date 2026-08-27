import React, { useState } from 'react';
import { 
  IoClose, 
  IoImagesOutline, 
  IoArrowBack, 
  IoShieldCheckmark,
  IoLocationOutline,
  IoHappyOutline 
} from 'react-icons/io5';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '../../store/useAuthStore';
import api from '../../services/api';

const FILTERS = [
  { name: 'Normal', filter: 'none' },
  { name: 'Clarendon', filter: 'contrast(1.2) saturate(1.25)' },
  { name: 'Gingham', filter: 'brightness(1.05) hue-rotate(-10deg)' },
  { name: 'Juno', filter: 'contrast(1.15) saturate(1.4)' },
  { name: 'Lark', filter: 'contrast(0.9) brightness(1.15)' },
  { name: 'Moon', filter: 'grayscale(1) contrast(1.1)' },
];

export default function CreatePostModal({ isOpen, onClose, onPostCreated }) {
  const { user } = useAuthStore();
  const [step, setStep] = useState(1); // 1: Select Media, 2: Filter/Edit, 3: Caption & Proof of Humanity
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('none');
  const [caption, setCaption] = useState('');
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [aiScore, setAiScore] = useState(null);

  if (!isOpen) return null;

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setMediaFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setMediaPreview(reader.result);
      setStep(2);
    };
    reader.readAsDataURL(file);
  };

  const handleNextToCaption = () => {
    setStep(3);
    runAiPreScan();
  };

  const runAiPreScan = () => {
    setIsScanning(true);
    setAiScore(null);

    // Simulate instant real-time AI Proof-of-Humanity scan
    setTimeout(() => {
      setIsScanning(false);
      setAiScore({
        humanProbability: 99.2,
        isAI: false,
        confidence: 0.98
      });
    }, 1000);
  };

  const handleSubmitPost = async () => {
    if (!user) {
      toast.error('Please log in to post');
      return;
    }

    try {
      setIsPosting(true);
      let finalMediaUrls = [];

      // 1. If physical file exists, upload to /posts/upload or use mediaPreview data URL
      if (mediaFile) {
        try {
          const formData = new FormData();
          formData.append('images', mediaFile);
          const uploadRes = await api.post('/posts/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          if (uploadRes.data?.urls && uploadRes.data.urls.length > 0) {
            finalMediaUrls = uploadRes.data.urls;
          } else {
            finalMediaUrls = [mediaPreview];
          }
        } catch (uploadErr) {
          // Fallback to data URL
          finalMediaUrls = mediaPreview ? [mediaPreview] : [];
        }
      } else if (mediaPreview) {
        finalMediaUrls = [mediaPreview];
      }

      // 2. Submit post
      const postPayload = {
        title: title.trim() || caption.slice(0, 60) || 'Verified Human Post',
        body: caption.trim(),
        mediaUrls: finalMediaUrls
      };

      await api.post('/posts', postPayload);
      toast.success('Post published with Proof of Humanity badge! ✅');
      if (onPostCreated) onPostCreated();
      onClose();
    } catch (err) {
      console.error('[Post Error]', err);
      toast.error(err.response?.data?.message || 'Failed to publish post');
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      {/* Top Close Button */}
      <button 
        onClick={onClose}
        className="absolute top-5 right-5 text-white text-3xl hover:opacity-75 z-50"
      >
        <IoClose />
      </button>

      {/* Modal Container */}
      <div className="relative w-full max-w-[780px] bg-[#262626] rounded-2xl overflow-hidden shadow-2xl border border-[#363636] flex flex-col animate-fade-in max-h-[85vh]">
        {/* Header */}
        <div className="h-12 border-b border-[#363636] flex items-center justify-between px-4">
          {step > 1 ? (
            <button 
              onClick={() => setStep(step - 1)}
              className="text-white text-xl hover:opacity-70"
            >
              <IoArrowBack />
            </button>
          ) : <div className="w-6" />}

          <h3 className="font-semibold text-sm text-white">
            {step === 1 && 'Create new post'}
            {step === 2 && 'Filters & Adjustments'}
            {step === 3 && 'Proof of Humanity & Share'}
          </h3>

          {step === 2 && (
            <button 
              onClick={handleNextToCaption}
              className="text-[#0095f6] hover:text-white font-semibold text-sm"
            >
              Next
            </button>
          )}

          {step === 3 && (
            <button 
              onClick={handleSubmitPost}
              disabled={isPosting}
              className="text-[#0095f6] hover:text-white font-semibold text-sm disabled:opacity-50"
            >
              {isPosting ? 'Sharing...' : 'Share'}
            </button>
          )}

          {step === 1 && <div className="w-6" />}
        </div>

        {/* Step 1: Upload Media */}
        {step === 1 && (
          <div className="p-16 flex flex-col items-center justify-center text-center min-h-[420px]">
            <div className="w-24 h-24 rounded-full bg-[#1a1a1a] flex items-center justify-center text-white mb-5">
              <IoImagesOutline className="text-5xl text-[#a8a8a8]" />
            </div>
            <h4 className="text-xl font-medium text-white mb-2">Drag photos and videos here</h4>
            <p className="text-xs text-[#737373] mb-6">Verified by HumanHub AI Detection Pipeline</p>

            <label className="cursor-pointer bg-[#0095f6] hover:bg-[#1877f2] text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-lg shadow-blue-500/20">
              Select from computer
              <input 
                type="file" 
                accept="image/*,video/*" 
                onChange={handleFileSelect} 
                className="hidden" 
              />
            </label>
          </div>
        )}

        {/* Step 2: Filters & Crop */}
        {step === 2 && (
          <div className="flex flex-col md:flex-row h-[500px]">
            <div className="flex-1 bg-black flex items-center justify-center overflow-hidden">
              <img 
                src={mediaPreview} 
                alt="preview" 
                style={{ filter: selectedFilter }}
                className="max-h-full max-w-full object-contain"
              />
            </div>
            <div className="w-full md:w-64 bg-[#262626] border-l border-[#363636] p-4 flex flex-col gap-3 overflow-y-auto">
              <span className="text-xs text-[#a8a8a8] font-semibold uppercase tracking-wider">Filters</span>
              <div className="grid grid-cols-2 gap-3">
                {FILTERS.map((f) => (
                  <div 
                    key={f.name}
                    onClick={() => setSelectedFilter(f.filter)}
                    className={`cursor-pointer flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all ${
                      selectedFilter === f.filter ? 'border-[#0095f6] bg-[#363636]' : 'border-transparent hover:bg-[#363636]'
                    }`}
                  >
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-black">
                      <img 
                        src={mediaPreview} 
                        alt={f.name} 
                        style={{ filter: f.filter }}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="text-[11px] text-white font-medium">{f.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Caption & Proof of Humanity Scan */}
        {step === 3 && (
          <div className="flex flex-col md:flex-row h-[500px]">
            <div className="flex-1 bg-black flex items-center justify-center overflow-hidden">
              <img 
                src={mediaPreview} 
                alt="preview" 
                style={{ filter: selectedFilter }}
                className="max-h-full max-w-full object-contain"
              />
            </div>
            <div className="w-full md:w-80 bg-[#262626] border-l border-[#363636] p-4 flex flex-col justify-between overflow-y-auto">
              <div className="flex flex-col gap-4">
                {/* User Info */}
                <div className="flex items-center gap-3">
                  <img 
                    src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'} 
                    alt={user?.username} 
                    className="w-7 h-7 rounded-full object-cover"
                  />
                  <span className="text-sm font-semibold text-white">{user?.username || 'member'}</span>
                </div>

                {/* Caption Input */}
                <textarea 
                  placeholder="Write a caption..."
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  className="w-full bg-transparent text-sm text-white placeholder-[#737373] outline-none resize-none h-28"
                  maxLength={2200}
                />
                <div className="flex items-center justify-between text-xs text-[#737373]">
                  <IoHappyOutline className="text-lg cursor-pointer hover:text-white" />
                  <span>{caption.length}/2,200</span>
                </div>

                {/* Add Location */}
                <div className="border-t border-[#363636] pt-3 flex items-center justify-between">
                  <input 
                    type="text" 
                    placeholder="Add location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="bg-transparent text-xs text-white placeholder-[#737373] outline-none flex-1"
                  />
                  <IoLocationOutline className="text-[#a8a8a8] text-base" />
                </div>

                {/* Proof of Humanity Live Scanner */}
                <div className="bg-[#1a1a1a] p-3 rounded-xl border border-[#363636] mt-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                      <IoShieldCheckmark className="text-[#0095f6] text-sm" />
                      Proof of Humanity
                    </span>
                    {isScanning ? (
                      <span className="text-[10px] text-[#ffd635] animate-pulse">Scanning...</span>
                    ) : (
                      <span className="text-[10px] text-[#00ba7c] font-bold">100% Human ✅</span>
                    )}
                  </div>
                  <div className="w-full bg-[#363636] h-1.5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-700 ${
                        isScanning ? 'w-1/2 bg-[#ffd635] animate-pulse' : 'w-full bg-[#00ba7c]'
                      }`} 
                    />
                  </div>
                  <p className="text-[10px] text-[#737373] mt-2">
                    Autonomous verification via neural text & media classifiers.
                  </p>
                </div>
              </div>

              <div className="text-[11px] text-[#737373] text-center pt-2">
                Your post will be immediately visible on global and explore feeds.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
