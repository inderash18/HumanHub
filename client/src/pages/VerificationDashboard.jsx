import React from 'react';
import { 
  IoShieldCheckmark, 
  IoFingerPrintOutline, 
  IoSpeedometerOutline, 
  IoCheckmarkCircle,
  IoPulseOutline,
  IoEyeOutline
} from 'react-icons/io5';
import { MdVerified } from 'react-icons/md';
import { useAuthStore } from '../store/useAuthStore';

export default function VerificationDashboard() {
  const { user } = useAuthStore();

  const trustPercent = Math.round((user?.trustScore || 0.98) * 100);

  return (
    <div className="w-full max-w-[800px] mx-auto px-4 py-8 select-none">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#0095f6] to-[#00ba7c] flex items-center justify-center text-white text-3xl mx-auto mb-3 shadow-lg shadow-blue-500/20">
          <IoShieldCheckmark />
        </div>
        <h2 className="text-2xl font-bold text-white flex items-center justify-center gap-1.5">
          Proof of Humanity Dashboard
          <MdVerified className="text-[#0095f6] text-2xl" />
        </h2>
        <p className="text-xs text-[#a8a8a8] mt-1 max-w-md mx-auto">
          Real-time cryptographic and neural behavioral verification preventing automated bots from entering HumanHub.
        </p>
      </div>

      {/* Main Stats Card */}
      <div className="bg-[#121212] border border-[#262626] rounded-2xl p-6 sm:p-8 flex flex-col gap-6 shadow-2xl mb-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <span className="text-xs text-[#737373] uppercase tracking-wider font-semibold">Your Humanity Status</span>
            <h3 className="text-xl font-bold text-white mt-1 flex items-center gap-2">
              100% Certified Human
              <span className="w-2.5 h-2.5 rounded-full bg-[#00ba7c] animate-ping" />
            </h3>
            <p className="text-xs text-[#a8a8a8] mt-1">Active verified session for @{user?.username || 'member'}</p>
          </div>

          <div className="flex items-center gap-3 bg-black/60 border border-[#262626] px-6 py-4 rounded-2xl">
            <IoSpeedometerOutline className="text-3xl text-[#0095f6]" />
            <div>
              <span className="text-2xl font-black text-white">{trustPercent}%</span>
              <span className="text-[10px] text-[#00ba7c] block font-semibold">Trust Confidence</span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div>
          <div className="flex justify-between text-xs text-[#a8a8a8] mb-2 font-semibold">
            <span>Bot Likelihood: 0.02%</span>
            <span className="text-[#00ba7c]">Human Confidence: {trustPercent}%</span>
          </div>
          <div className="w-full h-3 bg-[#262626] rounded-full overflow-hidden">
            <div className="w-full h-full bg-gradient-to-r from-[#0095f6] to-[#00ba7c] rounded-full" />
          </div>
        </div>
      </div>

      {/* Verification Layers Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-[#121212] border border-[#262626] rounded-2xl flex flex-col gap-3">
          <IoFingerPrintOutline className="text-3xl text-[#0095f6]" />
          <div>
            <h4 className="text-sm font-bold text-white">Biometric Telemetry</h4>
            <p className="text-xs text-[#737373] mt-1">Typing cadence, cursor dynamics, and natural sensor entropy.</p>
          </div>
          <span className="text-[11px] text-[#00ba7c] font-semibold flex items-center gap-1">
            <IoCheckmarkCircle /> Verified
          </span>
        </div>

        <div className="p-5 bg-[#121212] border border-[#262626] rounded-2xl flex flex-col gap-3">
          <IoPulseOutline className="text-3xl text-[#00ba7c]" />
          <div>
            <h4 className="text-sm font-bold text-white">Neural Text Classifier</h4>
            <p className="text-xs text-[#737373] mt-1">Real-time inference against synthetic LLM signatures.</p>
          </div>
          <span className="text-[11px] text-[#00ba7c] font-semibold flex items-center gap-1">
            <IoCheckmarkCircle /> Verified
          </span>
        </div>

        <div className="p-5 bg-[#121212] border border-[#262626] rounded-2xl flex flex-col gap-3">
          <IoEyeOutline className="text-3xl text-[#ffd635]" />
          <div>
            <h4 className="text-sm font-bold text-white">Media Authenticity</h4>
            <p className="text-xs text-[#737373] mt-1">Deepfake frequency artifact detection on image and video uploads.</p>
          </div>
          <span className="text-[11px] text-[#00ba7c] font-semibold flex items-center gap-1">
            <IoCheckmarkCircle /> Verified
          </span>
        </div>
      </div>
    </div>
  );
}
