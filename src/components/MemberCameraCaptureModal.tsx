import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  Camera,
  RotateCcw,
  FlipHorizontal,
  Check,
  Upload,
  AlertCircle,
  Sparkles,
  User,
  Flashlight,
  FlashlightOff,
  Timer
} from 'lucide-react';
import { Member } from '../types';

interface MemberCameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: Member;
  onSavePhoto: (newPhotoUrl: string) => void;
}

export const MemberCameraCaptureModal: React.FC<MemberCameraCaptureModalProps> = ({
  isOpen,
  onClose,
  member,
  onSavePhoto
}) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [isMirrored, setIsMirrored] = useState(true);
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [useCountdown, setUseCountdown] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const [isFlashing, setIsFlashing] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const countdownTimerRef = useRef<any>(null);

  // Play a soft shutter sound using Web Audio API
  const playShutterSound = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.1);
    } catch {
      // Audio might fail if no user gesture; continue silently
    }
  }, []);

  // Stop camera tracks cleanly
  const stopCamera = useCallback(() => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    setCountdown(null);

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // ignore
        }
      });
      streamRef.current = null;
    }
    setStream(null);
    setCameraActive(false);
    setTorchOn(false);
    setTorchSupported(false);
  }, []);

  // Check if device has more than one camera
  useEffect(() => {
    if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
      navigator.mediaDevices
        .enumerateDevices()
        .then((devices) => {
          const videoInputs = devices.filter((d) => d.kind === 'videoinput');
          setHasMultipleCameras(videoInputs.length > 1);
        })
        .catch(() => {});
    }
  }, []);

  // Start Camera
  const startCamera = useCallback(async () => {
    stopCamera();
    setCameraError(null);
    setCapturedPhoto(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Browser ini tidak mendukung akses webcam langsung. Gunakan opsi unggah foto.');
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 640 },
          height: { ideal: 640 }
        },
        audio: false
      };

      let mediaStream: MediaStream;
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch {
        // Fallback to basic video constraint
        mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }

      streamRef.current = mediaStream;
      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setCameraActive(true);

        // Check torch capability
        const track = mediaStream.getVideoTracks()[0];
        if (track && 'getCapabilities' in track) {
          const capabilities = (track as any).getCapabilities();
          if (capabilities && capabilities.torch) {
            setTorchSupported(true);
          }
        }
      }
    } catch (err: any) {
      console.warn('Camera access error:', err);
      let message = 'Tidak dapat mengakses kamera perangkat.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        message = 'Izin akses kamera ditolak oleh browser. Mohon izinkan akses kamera di pengaturan browser atau unggah foto manual.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        message = 'Tidak ditemukan perangkat kamera atau webcam pada perangkat ini.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        message = 'Kamera sedang digunakan oleh aplikasi lain. Tutup aplikasi tersebut dan coba lagi.';
      }
      setCameraError(message);
      setCameraActive(false);
    }
  }, [facingMode, stopCamera]);

  // Launch camera when modal opens
  useEffect(() => {
    if (isOpen) {
      setCapturedPhoto(null);
      startCamera();
    } else {
      stopCamera();
      setCapturedPhoto(null);
      setCameraError(null);
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, startCamera, stopCamera]);

  // Toggle torch / flashlight
  const toggleTorch = async () => {
    if (!streamRef.current || !torchSupported) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (track && 'applyConstraints' in track) {
      try {
        const next = !torchOn;
        await (track as any).applyConstraints({
          advanced: [{ torch: next }]
        });
        setTorchOn(next);
      } catch (err) {
        console.warn('Torch toggle failed:', err);
      }
    }
  };

  // Toggle front/back camera
  const handleSwitchCamera = () => {
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextMode);
    setIsMirrored(nextMode === 'user');
  };

  // Execute snapshot from live video
  const doCapture = useCallback(() => {
    if (!videoRef.current) return;
    const video = videoRef.current;

    // Trigger visual flash & sound
    setIsFlashing(true);
    playShutterSound();
    setTimeout(() => setIsFlashing(false), 200);

    const vw = video.videoWidth || 640;
    const vh = video.videoHeight || 480;

    // Crop center square
    const cropSize = Math.min(vw, vh);
    const startX = (vw - cropSize) / 2;
    const startY = (vh - cropSize) / 2;

    const canvas = document.createElement('canvas');
    // Save at 480x480 for crisp avatar display while keeping payload very lightweight (~40-60KB)
    const targetSize = 480;
    canvas.width = targetSize;
    canvas.height = targetSize;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      if (isMirrored) {
        ctx.translate(targetSize, 0);
        ctx.scale(-1, 1);
      }

      ctx.drawImage(video, startX, startY, cropSize, cropSize, 0, 0, targetSize, targetSize);

      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setCapturedPhoto(dataUrl);
      stopCamera();
    }
  }, [isMirrored, playShutterSound, stopCamera]);

  // Trigger capture with optional 3-second countdown
  const handleTriggerCapture = () => {
    if (useCountdown) {
      setCountdown(3);
      countdownTimerRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev === null || prev <= 1) {
            clearInterval(countdownTimerRef.current);
            countdownTimerRef.current = null;
            doCapture();
            return null;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      doCapture();
    }
  };

  // Handle retake
  const handleRetake = () => {
    setCapturedPhoto(null);
    startCamera();
  };

  // Handle save captured photo
  const handleConfirmSave = () => {
    if (!capturedPhoto) return;
    onSavePhoto(capturedPhoto);
    onClose();
  };

  // Fallback: Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const targetSize = 480;
        canvas.width = targetSize;
        canvas.height = targetSize;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const cropSize = Math.min(img.width, img.height);
          const startX = (img.width - cropSize) / 2;
          const startY = (img.height - cropSize) / 2;
          ctx.drawImage(img, startX, startY, cropSize, cropSize, 0, 0, targetSize, targetSize);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setCapturedPhoto(dataUrl);
          stopCamera();
        }
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4 overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden animate-in fade-in zoom-in-95 my-auto">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-800 bg-zinc-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-500/20 text-orange-400 flex items-center justify-center border border-orange-500/30 shrink-0">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>Foto Profil Member</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30">
                  {member.id}
                </span>
              </h3>
              <p className="text-xs text-zinc-400 truncate max-w-[240px] sm:max-w-xs">
                {member.name} • {member.phone}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-2 rounded-xl hover:bg-zinc-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewfinder or Captured Preview */}
        <div className="p-4 sm:p-6 space-y-4 bg-zinc-900">
          <div className="relative aspect-square w-full max-w-xs mx-auto rounded-3xl overflow-hidden bg-black border-2 border-zinc-700 shadow-inner flex items-center justify-center">
            {/* Shutter White Flash Effect */}
            {isFlashing && (
              <div className="absolute inset-0 bg-white z-40 animate-out fade-out duration-200 pointer-events-none" />
            )}

            {/* Countdown Overlay */}
            {countdown !== null && (
              <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 backdrop-blur-xs">
                <span className="text-7xl font-black text-orange-400 animate-ping font-mono">
                  {countdown}
                </span>
              </div>
            )}

            {/* Live Video Element */}
            {!capturedPhoto && !cameraError && (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${isMirrored ? 'scale-x-[-1]' : ''}`}
                />

                {/* Face Alignment Target Guide Overlay */}
                <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-6">
                  {/* Oval Face Silhouette Guide */}
                  <div className="w-48 h-60 sm:w-56 sm:h-72 rounded-[50%] border-2 border-dashed border-orange-400/70 shadow-[0_0_20px_rgba(249,115,22,0.35)] flex flex-col items-center justify-center relative">
                    <div className="absolute top-2 w-3 h-3 border-t-2 border-l-2 border-orange-400" />
                    <div className="absolute top-2 right-0 w-3 h-3 border-t-2 border-r-2 border-orange-400" />
                    <div className="absolute bottom-2 left-0 w-3 h-3 border-b-2 border-l-2 border-orange-400" />
                    <div className="absolute bottom-2 right-0 w-3 h-3 border-b-2 border-r-2 border-orange-400" />
                    <div className="w-2 h-2 rounded-full bg-orange-400/40" />
                  </div>
                  <div className="absolute bottom-4 px-3 py-1 rounded-full bg-black/75 backdrop-blur-xs border border-zinc-700 text-[11px] text-zinc-300 font-medium flex items-center gap-1.5 shadow-md">
                    <Sparkles className="w-3.5 h-3.5 text-orange-400" />
                    <span>Posisikan wajah di dalam bingkai</span>
                  </div>
                </div>

                {/* Top Quick Badges in Viewfinder */}
                <div className="absolute top-3 inset-x-3 flex items-center justify-between pointer-events-none">
                  <span className="px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-xs text-[10px] font-mono text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    LIVE KAMERA
                  </span>
                  {torchSupported && (
                    <button
                      type="button"
                      onClick={toggleTorch}
                      className="pointer-events-auto p-1.5 rounded-full bg-black/70 text-amber-400 hover:text-white border border-amber-500/40 shadow-sm cursor-pointer"
                      title="Nyalakan Lampu Kilat / Flash"
                    >
                      {torchOn ? <Flashlight className="w-4 h-4" /> : <FlashlightOff className="w-4 h-4" />}
                    </button>
                  )}
                </div>
              </>
            )}

            {/* Captured Photo Preview */}
            {capturedPhoto && (
              <div className="relative w-full h-full">
                <img
                  src={capturedPhoto}
                  alt="Hasil Foto Member"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-emerald-500/90 text-white text-[11px] font-bold flex items-center gap-1.5 shadow-md">
                  <Check className="w-3.5 h-3.5" />
                  <span>Foto Terambil</span>
                </div>
              </div>
            )}

            {/* Error or Permission Denied State */}
            {cameraError && !capturedPhoto && (
              <div className="p-6 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/30">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Kamera Tidak Aktif</h4>
                  <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{cameraError}</p>
                </div>
                <div className="pt-2 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={startCamera}
                    className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Coba Akses Kamera Lagi</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition flex items-center justify-center gap-1.5 border border-zinc-700 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5 text-orange-400" />
                    <span>Pilih Foto dari Galeri / File</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Controls Bar */}
          {!capturedPhoto && cameraActive && (
            <div className="flex items-center justify-between gap-3 px-2">
              {/* Left Controls: Mirror & Timer */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsMirrored(!isMirrored)}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    isMirrored
                      ? 'bg-orange-500/20 text-orange-400 border-orange-500/40'
                      : 'bg-zinc-800/80 text-zinc-400 border-zinc-700 hover:text-white'
                  }`}
                  title="Cerminkan Tampilan Kamera (Mirror)"
                >
                  <FlipHorizontal className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setUseCountdown(!useCountdown)}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    useCountdown
                      ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                      : 'bg-zinc-800/80 text-zinc-400 border-zinc-700 hover:text-white'
                  }`}
                  title={useCountdown ? 'Timer 3 Detik Aktif' : 'Timer Mati (Instan)'}
                >
                  <Timer className="w-4 h-4" />
                  <span className="text-[11px]">{useCountdown ? '3s' : '0s'}</span>
                </button>

                {hasMultipleCameras && (
                  <button
                    type="button"
                    onClick={handleSwitchCamera}
                    className="p-2.5 rounded-xl bg-zinc-800/80 text-zinc-300 border border-zinc-700 hover:text-white hover:bg-zinc-700 transition text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    title="Ganti Kamera Depan / Belakang"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Center Main Capture Button */}
              <button
                type="button"
                onClick={handleTriggerCapture}
                disabled={countdown !== null}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-sm transition-transform active:scale-95 flex items-center gap-2 shadow-lg shadow-orange-500/25 cursor-pointer disabled:opacity-50"
              >
                <Camera className="w-5 h-5" />
                <span>{useCountdown ? 'Mulai (3s)' : 'Ambil Foto'}</span>
              </button>

              {/* Right Control: Upload File */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700 transition cursor-pointer"
                title="Unggah Foto dari File Perangkat"
              >
                <Upload className="w-4 h-4 text-orange-400" />
              </button>
            </div>
          )}

          {/* Review & Action Bar after Capture */}
          {capturedPhoto && (
            <div className="space-y-3 pt-1">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleRetake}
                  className="flex-1 py-3 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition flex items-center justify-center gap-2 border border-zinc-700 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4 text-zinc-400" />
                  <span>Foto Ulang (Retake)</span>
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSave}
                  className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-xs font-black transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Gunakan & Simpan Foto</span>
                </button>
              </div>
              <p className="text-[11px] text-center text-zinc-400">
                Foto akan langsung diperbarui pada profil member, kartu digital ID, dan sinkronisasi cloud.
              </p>
            </div>
          )}

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="user"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>

        {/* Footer info */}
        <div className="p-3 sm:p-4 bg-zinc-950 border-t border-zinc-800 flex items-center justify-between text-[11px] text-zinc-400">
          <span className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-orange-400" />
            <span>ID: {member.id}</span>
          </span>
          <span>Resolusi Foto Otomatis Disesuaikan</span>
        </div>
      </div>
    </div>
  );
};
