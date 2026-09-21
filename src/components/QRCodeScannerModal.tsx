import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  Camera,
  RotateCcw,
  Flashlight,
  FlashlightOff,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  LogOut,
  Upload,
  RefreshCw,
  Sparkles,
  Zap,
  Clock,
  ShieldCheck,
  Flame,
  Volume2,
  VolumeX,
  Smartphone
} from 'lucide-react';
import jsQR from 'jsqr';
import { Member, Attendance } from '../types';
import { getTimestamp, APP_TODAY } from '../utils/formatters';
import { getMemberPassCode } from './IDCardModal';

interface QRCodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: Member[];
  attendances: Attendance[];
  onAddAttendance: (newAtt: Attendance, memberToUpdate?: Member) => void;
  onCheckoutMember: (attId: string) => void;
  showToast: (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

// Helper: match decoded text to a gym member
export function findMemberFromQR(text: string, members: Member[]): Member | null {
  if (!text) return null;
  const raw = text.trim();

  // 1. Check RFA-MEMBER:M001:PASSCODE format (standard in IDCardModal)
  if (raw.startsWith('RFA-MEMBER:')) {
    const parts = raw.split(':');
    const memberId = parts[1]?.trim();
    if (memberId) {
      const found = members.find((m) => m.id.toLowerCase() === memberId.toLowerCase());
      if (found) return found;
    }
  }

  // 2. Direct ID match (e.g. M001, M002)
  const directMatch = members.find((m) => m.id.toLowerCase() === raw.toLowerCase());
  if (directMatch) return directMatch;

  // 3. Check JSON format
  try {
    const parsed = JSON.parse(raw);
    const candidateId = parsed.id || parsed.memberId || parsed.member_id;
    if (candidateId) {
      const found = members.find((m) => m.id.toLowerCase() === String(candidateId).toLowerCase());
      if (found) return found;
    }
  } catch {
    // ignore json error
  }

  // 4. Check URL query params (e.g. ?member=M001 or ?id=M001)
  if (raw.includes('?') || raw.includes('/')) {
    try {
      const url = new URL(raw, 'https://gym.local');
      const candidateId = url.searchParams.get('member') || url.searchParams.get('id') || url.searchParams.get('memberId');
      if (candidateId) {
        const found = members.find((m) => m.id.toLowerCase() === candidateId.toLowerCase());
        if (found) return found;
      }
    } catch {
      // ignore url error
    }
  }

  // 5. Check passCode match using getMemberPassCode
  for (const m of members) {
    const code = getMemberPassCode(m.id, m.name);
    if (code.toLowerCase() === raw.toLowerCase()) {
      return m;
    }
  }

  // 6. Check phone number (numeric match)
  const numericRaw = raw.replace(/[^0-9]/g, '');
  if (numericRaw.length >= 7) {
    const phoneMatch = members.find((m) => m.phone && m.phone.replace(/[^0-9]/g, '') === numericRaw);
    if (phoneMatch) return phoneMatch;
  }

  // 7. Check full name exact match
  const nameMatch = members.find((m) => m.name.toLowerCase() === raw.toLowerCase());
  if (nameMatch) return nameMatch;

  return null;
}

export const QRCodeScannerModal: React.FC<QRCodeScannerModalProps> = ({
  isOpen,
  onClose,
  members,
  attendances,
  onAddAttendance,
  onCheckoutMember,
  showToast
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameId = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Camera & scanner state
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [torchOn, setTorchOn] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [autoCheckIn, setAutoCheckIn] = useState(true);

  // Scanned result state
  const [detectedMember, setDetectedMember] = useState<Member | null>(null);
  const [scannedRawText, setScannedRawText] = useState<string | null>(null);
  const [visitType, setVisitType] = useState<'Reguler' | 'PT'>('Reguler');
  const [countdown, setCountdown] = useState<number | null>(null);
  const [recentScans, setRecentScans] = useState<Array<{ id: string; name: string; action: 'IN' | 'OUT'; time: string; type: string }>>([]);

  // Lock flag to prevent repeated rapid detections
  const isProcessingRef = useRef(false);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Synthesize sound beep using Web Audio API
  const playBeep = useCallback((isError = false) => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (isError) {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        osc.frequency.setValueAtTime(140, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.25);
      } else {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.08); // A5
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.22);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.22);
      }
    } catch {
      // Audio context might be restricted before user gesture; fail silently
    }
  }, [soundEnabled]);

  // Stop camera tracks cleanly
  const stopCamera = useCallback(() => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
    setTorchOn(false);
    setTorchSupported(false);
  }, []);

  // Check active session today for member
  const getActiveSession = useCallback((member: Member) => {
    return attendances.find(
      (a) =>
        (a.memberId === member.id || a.memberName === member.name) &&
        a.date === APP_TODAY &&
        !a.timeOut
    );
  }, [attendances]);

  // Execute check-in or check-out for a member
  const handleExecuteAction = useCallback((member: Member, explicitVisitType?: 'Reguler' | 'PT') => {
    const isExpired = new Date(member.expired + 'T00:00:00') < new Date(APP_TODAY + 'T00:00:00');
    if (isExpired) {
      playBeep(true);
      showToast(
        'Akses Ditolak',
        `Membership ${member.name} telah kadaluarsa (${member.expired}). Silakan lakukan perpanjangan paket terlebih dahulu.`,
        'error'
      );
      setDetectedMember(null);
      setScannedRawText(null);
      isProcessingRef.current = false;
      return;
    }

    const activeSession = getActiveSession(member);
    const chosenType = explicitVisitType || visitType;

    if (activeSession) {
      // Check-out logic
      onCheckoutMember(activeSession.id);
      playBeep(false);
      if ('vibrate' in navigator) navigator.vibrate?.([50, 50, 50]);
      showToast('Check-Out Berhasil', `Sampai jumpa lagi, ${member.name}! Sesi latihan selesai.`, 'success');

      setRecentScans((prev) => [
        {
          id: member.id,
          name: member.name,
          action: 'OUT',
          time: getTimestamp(),
          type: activeSession.badge || 'Gym Reguler'
        },
        ...prev.slice(0, 4)
      ]);
    } else {
      // Check-in logic
      let updatedMember = undefined;
      if (chosenType === 'PT') {
        if ((member.ptQuota || 0) <= 0) {
          playBeep(true);
          showToast('Kuota PT Habis', `Member ${member.name} tidak memiliki sisa sesi PT.`, 'warning');
          setDetectedMember(null);
          setScannedRawText(null);
          isProcessingRef.current = false;
          return;
        }
        updatedMember = { ...member, ptQuota: member.ptQuota - 1 };
      }

      const newAtt: Attendance = {
        id: 'ATT-' + Date.now(),
        date: APP_TODAY,
        timeIn: getTimestamp(),
        timeOut: '',
        memberId: member.id,
        memberName: member.name,
        type: chosenType,
        badge: chosenType === 'PT' ? 'Sesi PT' : 'Gym Reguler'
      };

      onAddAttendance(newAtt, updatedMember);
      playBeep(false);
      if ('vibrate' in navigator) navigator.vibrate?.(100);
      showToast('Check-In Berhasil', `Selamat datang & berlatih, ${member.name}!`, 'success');

      setRecentScans((prev) => [
        {
          id: member.id,
          name: member.name,
          action: 'IN',
          time: getTimestamp(),
          type: chosenType === 'PT' ? 'Sesi PT' : 'Gym Reguler'
        },
        ...prev.slice(0, 4)
      ]);
    }

    // Reset detected member after brief delay to allow next scan
    setTimeout(() => {
      setDetectedMember(null);
      setScannedRawText(null);
      setCountdown(null);
      isProcessingRef.current = false;
    }, 1200);
  }, [visitType, getActiveSession, onCheckoutMember, onAddAttendance, playBeep, showToast]);

  // Handle successful QR detection
  const handleQRDetected = useCallback((rawContent: string) => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;

    setScannedRawText(rawContent);
    const matched = findMemberFromQR(rawContent, members);

    if (matched) {
      setDetectedMember(matched);
      playBeep(false);

      if (autoCheckIn) {
        // Auto check-in after brief 0.8s confirmation countdown
        setCountdown(1);
        countdownTimerRef.current = setTimeout(() => {
          handleExecuteAction(matched);
        }, 800);
      }
    } else {
      playBeep(true);
      showToast('QR Tidak Dikenal', `QR Code terdeteksi ("${rawContent.substring(0, 30)}..."), namun tidak cocok dengan data Member.`, 'warning');
      setTimeout(() => {
        setScannedRawText(null);
        isProcessingRef.current = false;
      }, 1500);
    }
  }, [members, autoCheckIn, playBeep, showToast, handleExecuteAction]);

  // Continuous frame analysis loop
  const scanLoop = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    if (video.readyState === video.HAVE_ENOUGH_DATA && ctx) {
      // Set canvas to video dimensions
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      if (!isProcessingRef.current) {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert'
        });

        if (code && code.data) {
          handleQRDetected(code.data);
        }
      }
    }

    animationFrameId.current = requestAnimationFrame(scanLoop);
  }, [handleQRDetected]);

  // Start Camera
  const startCamera = useCallback(async () => {
    stopCamera();
    setCameraError(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Browser tidak mendukung akses kamera langsung pada perangkat ini.');
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      };

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (err) {
        // Fallback to simple video constraint if facingMode is rejected
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setCameraActive(true);

        // Check if torch/flashlight is supported
        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) {
          const capabilities = (videoTrack.getCapabilities?.() || {}) as any;
          setTorchSupported(!!capabilities.torch);
        }

        animationFrameId.current = requestAnimationFrame(scanLoop);
      }
    } catch (err: any) {
      console.warn('Camera access failed:', err);
      let message = 'Gagal mengakses kamera.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        message = 'Izin kamera ditolak. Silakan berikan izin akses kamera pada browser Anda.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        message = 'Tidak ditemukan perangkat kamera pada perangkat ini.';
      } else {
        message = err.message || 'Kamera tidak dapat diaktifkan. Gunakan opsi unggah gambar QR atau simulasi.';
      }
      setCameraError(message);
      setCameraActive(false);
    }
  }, [facingMode, scanLoop, stopCamera]);

  // Toggle Torch
  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (track && torchSupported) {
      try {
        await (track as any).applyConstraints({
          advanced: [{ torch: !torchOn }]
        });
        setTorchOn(!torchOn);
      } catch (err) {
        console.warn('Failed to toggle torch:', err);
      }
    }
  };

  // Flip Camera (Front / Rear)
  const toggleCameraFacing = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Handle uploaded image file scanning
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const offscreenCanvas = document.createElement('canvas');
        offscreenCanvas.width = img.width;
        offscreenCanvas.height = img.height;
        const ctx = offscreenCanvas.getContext('2d');
        if (!ctx) return;

        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(0, 0, img.width, img.height);
        const code = jsQR(imgData.data, imgData.width, imgData.height);

        if (code && code.data) {
          handleQRDetected(code.data);
        } else {
          playBeep(true);
          showToast('QR Tidak Ditemukan', 'Gambar tidak mengandung QR Code yang terbaca.', 'warning');
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
    // Reset file input
    e.target.value = '';
  };

  // Simulation quick scan for testing
  const simulateScanMember = (member: Member) => {
    const passCode = getMemberPassCode(member.id, member.name);
    const mockQR = `RFA-MEMBER:${member.id}:${passCode}`;
    handleQRDetected(mockQR);
  };

  // Start / stop camera on open / close
  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
      if (countdownTimerRef.current) {
        clearTimeout(countdownTimerRef.current);
      }
      setDetectedMember(null);
      setScannedRawText(null);
      isProcessingRef.current = false;
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, startCamera, stopCamera]);

  // Restart camera if facingMode changes while open
  useEffect(() => {
    if (isOpen && cameraActive) {
      startCamera();
    }
  }, [facingMode]);

  if (!isOpen) return null;

  const activeSessionForDetected = detectedMember ? getActiveSession(detectedMember) : null;
  const isDetectedExpired = detectedMember
    ? new Date(detectedMember.expired + 'T00:00:00') < new Date(APP_TODAY + 'T00:00:00')
    : false;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800 flex flex-col my-auto relative">
        {/* Hidden internal elements */}
        <canvas ref={canvasRef} className="hidden" />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileUpload}
        />

        {/* Modal Top Bar */}
        <div className="p-4 sm:p-5 border-b border-zinc-800/80 bg-zinc-900/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400 shadow-sm">
              <Camera className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  Scanner ID Card Member
                </h3>
                <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span> Live
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Arahkan kamera ke QR Code pada kartu digital member
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Audio Toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Matikan Suara Beep' : 'Aktifkan Suara Beep'}
              className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-orange-400" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Viewfinder Section */}
        <div className="relative bg-black h-[320px] sm:h-[380px] overflow-hidden flex items-center justify-center select-none">
          {/* Live Video */}
          <video
            ref={videoRef}
            className={`w-full h-full object-cover ${cameraActive ? 'opacity-100' : 'opacity-0'}`}
          />

          {/* Camera Loading / Inactive / Error state */}
          {!cameraActive && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-zinc-950/90 z-10 space-y-3">
              {cameraError ? (
                <>
                  <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Kamera Belum Aktif</h4>
                    <p className="text-xs text-zinc-400 max-w-sm mt-1 leading-relaxed">
                      {cameraError}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 justify-center pt-2">
                    <button
                      onClick={startCamera}
                      className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 transition shadow"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Coba Lagi
                    </button>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 transition"
                    >
                      <Upload className="w-3.5 h-3.5" /> Unggah Foto QR
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-10 h-10 rounded-full border-2 border-orange-500 border-t-transparent animate-spin"></div>
                  <p className="text-xs text-zinc-400">Menghubungkan ke sensor kamera perangkat...</p>
                </>
              )}
            </div>
          )}

          {/* Viewfinder Target Box Overlay */}
          {cameraActive && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              {/* Semi-transparent Dark Mask surrounding center */}
              <div className="relative w-64 h-64 sm:w-72 sm:h-72">
                {/* HUD Corners */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-orange-500 rounded-tl-xl shadow-lg"></div>
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-orange-500 rounded-tr-xl shadow-lg"></div>
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-orange-500 rounded-bl-xl shadow-lg"></div>
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-orange-500 rounded-br-xl shadow-lg"></div>

                {/* Animated Laser Scanning Line */}
                <div className="absolute inset-x-2 top-0 h-1 bg-gradient-to-r from-transparent via-orange-400 to-transparent shadow-[0_0_12px_#f97316] animate-[scan_2s_ease-in-out_infinite]"></div>

                {/* Center Reticle Point */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-orange-500/60 ring-4 ring-orange-500/20"></div>
                </div>
              </div>
            </div>
          )}

          {/* In-Camera Floating Controls */}
          <div className="absolute bottom-4 inset-x-4 flex items-center justify-between z-20 pointer-events-auto">
            {/* Auto Check-in Toggle */}
            <button
              onClick={() => setAutoCheckIn(!autoCheckIn)}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold backdrop-blur-md border transition flex items-center gap-1.5 shadow-lg ${
                autoCheckIn
                  ? 'bg-orange-500/90 text-zinc-950 border-orange-400'
                  : 'bg-zinc-900/80 text-zinc-300 border-zinc-700'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Auto-Proses: {autoCheckIn ? 'ON' : 'OFF'}</span>
            </button>

            {/* Quick Action Tools */}
            <div className="flex items-center gap-2">
              {torchSupported && (
                <button
                  onClick={toggleTorch}
                  title="Flashlight"
                  className={`p-2.5 rounded-xl backdrop-blur-md border transition shadow-lg ${
                    torchOn
                      ? 'bg-yellow-400 text-zinc-950 border-yellow-300'
                      : 'bg-zinc-900/80 text-white border-zinc-700 hover:bg-zinc-800'
                  }`}
                >
                  {torchOn ? <Flashlight className="w-4 h-4" /> : <FlashlightOff className="w-4 h-4" />}
                </button>
              )}

              <button
                onClick={toggleCameraFacing}
                title="Ganti Kamera Depan / Belakang"
                className="p-2.5 bg-zinc-900/80 hover:bg-zinc-800 text-white border border-zinc-700 rounded-xl backdrop-blur-md transition shadow-lg"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                title="Scan dari Foto Galeri"
                className="p-2.5 bg-zinc-900/80 hover:bg-zinc-800 text-white border border-zinc-700 rounded-xl backdrop-blur-md transition shadow-lg"
              >
                <Upload className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* DETECTED MEMBER HUD CARD (If a member was just scanned) */}
        {detectedMember && (
          <div className="p-4 sm:p-5 bg-zinc-900 border-t border-zinc-800 space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-200">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-zinc-800 border border-zinc-700 overflow-hidden flex items-center justify-center shrink-0 shadow">
                  {detectedMember.photo && detectedMember.photo.startsWith('http') ? (
                    <img
                      src={detectedMember.photo}
                      alt={detectedMember.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span className="text-sm font-black text-orange-400">
                      {detectedMember.name.substring(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm sm:text-base font-black text-white">
                      {detectedMember.name}
                    </h4>
                    <span className="text-[10px] bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded-md font-mono border border-zinc-700">
                      {detectedMember.id}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    {isDetectedExpired ? (
                      <span className="bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px] font-bold px-2 py-0.5 rounded">
                        Expired: {detectedMember.expired}
                      </span>
                    ) : (
                      <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Aktif s.d {detectedMember.expired}
                      </span>
                    )}

                    {detectedMember.picName && (
                      <span className="text-xs text-zinc-400 font-medium">
                        PIC: <strong className="text-zinc-200">{detectedMember.picName}</strong>
                      </span>
                    )}

                    {(detectedMember.ptQuota || 0) > 0 && (
                      <span className="bg-purple-500/20 text-purple-400 border border-purple-500/30 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                        <Flame className="w-3 h-3" /> {detectedMember.ptQuota} Sesi PT
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Status Action Badge */}
              <div className="text-right shrink-0">
                {activeSessionForDetected ? (
                  <span className="bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[11px] font-bold px-2.5 py-1 rounded-xl flex items-center gap-1.5">
                    <LogOut className="w-3.5 h-3.5" /> Akan Checkout
                  </span>
                ) : (
                  <span className="bg-orange-500/20 text-orange-400 border border-orange-500/30 text-[11px] font-bold px-2.5 py-1 rounded-xl flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5" /> Akan Check-In
                  </span>
                )}
              </div>
            </div>

            {/* Visit type switch if checking in */}
            {!activeSessionForDetected && !isDetectedExpired && (
              <div className="bg-zinc-950 p-2.5 rounded-2xl border border-zinc-800 flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold text-zinc-400 ml-1">Kategori:</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setVisitType('Reguler')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                      visitType === 'Reguler'
                        ? 'bg-blue-500 text-white shadow'
                        : 'text-zinc-400 hover:text-white bg-zinc-900'
                    }`}
                  >
                    Gym Reguler
                  </button>
                  <button
                    type="button"
                    onClick={() => setVisitType('PT')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                      visitType === 'PT'
                        ? 'bg-purple-600 text-white shadow'
                        : 'text-zinc-400 hover:text-white bg-zinc-900'
                    }`}
                  >
                    Sesi PT ({detectedMember.ptQuota || 0})
                  </button>
                </div>
              </div>
            )}

            {/* Action Buttons & Countdown */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleExecuteAction(detectedMember)}
                className={`flex-1 py-3 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition ${
                  activeSessionForDetected
                    ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/20'
                    : 'bg-orange-500 hover:bg-orange-600 text-zinc-950 shadow-orange-500/20'
                }`}
              >
                {activeSessionForDetected ? (
                  <>
                    <LogOut className="w-4 h-4" />
                    <span>Konfirmasi Check-Out Sekarang</span>
                  </>
                ) : (
                  <>
                    <UserCheck className="w-4 h-4" />
                    <span>
                      {autoCheckIn && countdown !== null
                        ? `Memproses Otomatis (${countdown}s)...`
                        : 'Konfirmasi Check-In Sekarang'}
                    </span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  if (countdownTimerRef.current) clearTimeout(countdownTimerRef.current);
                  setDetectedMember(null);
                  setScannedRawText(null);
                  isProcessingRef.current = false;
                }}
                className="px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs rounded-2xl transition"
              >
                Scan Lainnya
              </button>
            </div>
          </div>
        )}

        {/* BOTTOM HELPER / TEST SIMULATION PANEL */}
        <div className="p-4 bg-zinc-950 border-t border-zinc-800/80">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-orange-400 shrink-0" />
              <p className="text-[11px] text-zinc-400">
                Kartu member fisik atau tampilan kartu dari layar ponsel dapat diarahkan langsung ke scanner.
              </p>
            </div>

            {/* Desktop Test Shortcuts (Simulasi 1-klik untuk testing tanpa kamera fisik) */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider shrink-0 mr-1">
                Uji Cepat:
              </span>
              {members.slice(0, 3).map((m) => (
                <button
                  key={m.id}
                  onClick={() => simulateScanMember(m)}
                  className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white px-2.5 py-1 rounded-lg text-[10px] font-bold transition shrink-0"
                >
                  {m.name.split(' ')[0]} ({m.id})
                </button>
              ))}
            </div>
          </div>

          {/* Recent Scans in this session */}
          {recentScans.length > 0 && (
            <div className="mt-3 pt-3 border-t border-zinc-900 flex items-center gap-2 overflow-x-auto">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider shrink-0 flex items-center gap-1">
                <Clock className="w-3 h-3 text-emerald-400" /> Terproses:
              </span>
              <div className="flex items-center gap-2">
                {recentScans.map((r, i) => (
                  <span
                    key={i}
                    className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md border shrink-0 ${
                      r.action === 'IN'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                    }`}
                  >
                    <span>{r.name.split(' ')[0]}</span>
                    <span className="opacity-75">({r.action})</span>
                    <span className="text-zinc-500 text-[9px]">{r.time}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
