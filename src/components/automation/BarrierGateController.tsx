import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Zap,
  Lock,
  Unlock,
  Radio,
  Server,
  RefreshCw,
  Sliders,
  History,
  QrCode,
  Volume2,
  AlertCircle,
  CheckCircle,
  Play
} from 'lucide-react';
import { Member, TurnstileGateConfig, TurnstileGateLog, GateAccessDecision } from '../../types';
import { playSuccessBeep, playErrorBuzz, playGateUnlockSound, speakAccessVoice } from '../../utils/audioAlerts';
import { getMemberStatus } from '../../utils/memberStatus';

interface BarrierGateControllerProps {
  members: Member[];
  onMemberCheckIn?: (member: Member) => void;
  showToast?: (title: string, message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
}

export const BarrierGateController: React.FC<BarrierGateControllerProps> = ({
  members,
  onMemberCheckIn,
  showToast
}) => {
  // Gate Configuration
  const [gateConfig, setGateConfig] = useState<TurnstileGateConfig>(() => {
    try {
      const saved = localStorage.getItem('gympro_turnstile_config');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      id: 'GATE-01',
      name: 'Turnstile Utama Lobby',
      type: 'TRIPOD_TURNSTILE',
      ipAddress: '192.168.1.180',
      port: 8080,
      relayPulseMs: 3000,
      direction: 'IN',
      enabled: true
    };
  });

  // Gate Hardware State
  const [gateStatus, setGateStatus] = useState<'IDLE' | 'OPENING' | 'GRANTED' | 'DENIED'>('IDLE');
  const [countdown, setCountdown] = useState<number>(0);
  const [lastScannedMember, setLastScannedMember] = useState<Member | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('MENUNGGU KARTU / QR MEMBER');
  const [manualCodeInput, setManualCodeInput] = useState('');

  // Access Logs
  const [logs, setLogs] = useState<TurnstileGateLog[]>(() => {
    try {
      const saved = localStorage.getItem('gympro_gate_logs');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  // Save config & logs
  useEffect(() => {
    try {
      localStorage.setItem('gympro_turnstile_config', JSON.stringify(gateConfig));
    } catch {}
  }, [gateConfig]);

  useEffect(() => {
    try {
      localStorage.setItem('gympro_gate_logs', JSON.stringify(logs.slice(0, 50)));
    } catch {}
  }, [logs]);

  // Handle Relay Pulse Countdown
  useEffect(() => {
    let timer: any = null;
    if (countdown > 0) {
      timer = setTimeout(() => {
        setCountdown((c) => Math.max(0, c - 100));
      }, 100);
    } else if (countdown === 0 && (gateStatus === 'GRANTED' || gateStatus === 'DENIED' || gateStatus === 'OPENING')) {
      setGateStatus('IDLE');
      setStatusMessage('MENUNGGU KARTU / QR MEMBER');
    }
    return () => clearTimeout(timer);
  }, [countdown, gateStatus]);

  // Process access attempt
  const processAccessValidation = (inputCode: string) => {
    if (!gateConfig.enabled) {
      showToast?.('Gerbang Nonaktif', 'Harap aktifkan koneksi gerbang terlebih dahulu.', 'warning');
      return;
    }

    const trimmed = inputCode.trim();
    if (!trimmed) return;

    // Find member by ID, barcode, phone, or name
    const foundMember = members.find(
      (m) =>
        m.id.toLowerCase() === trimmed.toLowerCase() ||
        ((m as any).barcode && String((m as any).barcode).toLowerCase() === trimmed.toLowerCase()) ||
        (m.phone && m.phone.endsWith(trimmed)) ||
        m.name.toLowerCase().includes(trimmed.toLowerCase())
    );

    const now = new Date();
    const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    if (!foundMember) {
      playErrorBuzz();
      setGateStatus('DENIED');
      setStatusMessage('AKSES DITOLAK: MEMBER TIDAK DITEMUKAN');
      setCountdown(2500);

      const deniedLog: TurnstileGateLog = {
        id: `LOG-${Date.now()}`,
        timestamp: timeStr,
        barcodeOrCardId: trimmed,
        gateId: gateConfig.id,
        gateName: gateConfig.name,
        direction: gateConfig.direction === 'OUT' ? 'OUT' : 'IN',
        decision: 'DENIED_NOT_FOUND',
        notes: 'Barcode/ID tidak terdaftar di sistem',
        relayPulseMs: 0
      };
      setLogs((prev) => [deniedLog, ...prev]);
      showToast?.('Akses Ditolak', 'Member/Barcode tidak ditemukan.', 'error');
      return;
    }

    setLastScannedMember(foundMember);

    const statusInfo = getMemberStatus(foundMember);
    const isFrozen = foundMember.status === 'FREEZE' || foundMember.isFrozen;
    const isExpired = statusInfo.status === 'EXPIRED';
    const isGracePeriod = statusInfo.status === 'MASA TENGGANG';

    if (isFrozen) {
      speakAccessVoice('EXPIRED');
      setGateStatus('DENIED');
      setStatusMessage(`AKSES DITOLAK: MEMBERSHIP FREEZE (${foundMember.name})`);
      setCountdown(2500);

      const log: TurnstileGateLog = {
        id: `LOG-${Date.now()}`,
        timestamp: timeStr,
        memberId: foundMember.id,
        memberName: foundMember.name,
        memberPhoto: foundMember.photo,
        barcodeOrCardId: trimmed,
        gateId: gateConfig.id,
        gateName: gateConfig.name,
        direction: gateConfig.direction === 'OUT' ? 'OUT' : 'IN',
        decision: 'DENIED_FROZEN',
        notes: 'Status membership sedang cuti/freeze',
        relayPulseMs: 0
      };
      setLogs((prev) => [log, ...prev]);
      showToast?.('Akses Ditolak', `Membership ${foundMember.name} sedang Freeze.`, 'warning');
      return;
    }

    if (isExpired) {
      speakAccessVoice('EXPIRED');
      setGateStatus('DENIED');
      setStatusMessage(`AKSES DITOLAK: MEMBERSHIP HABIS (${foundMember.name})`);
      setCountdown(3000);

      const log: TurnstileGateLog = {
        id: `LOG-${Date.now()}`,
        timestamp: timeStr,
        memberId: foundMember.id,
        memberName: foundMember.name,
        memberPhoto: foundMember.photo,
        barcodeOrCardId: trimmed,
        gateId: gateConfig.id,
        gateName: gateConfig.name,
        direction: gateConfig.direction === 'OUT' ? 'OUT' : 'IN',
        decision: 'DENIED_EXPIRED',
        notes: `Masa aktif kedaluwarsa sejak ${foundMember.expired || 'N/A'}`,
        relayPulseMs: 0
      };
      setLogs((prev) => [log, ...prev]);
      showToast?.('Akses Ditolak', `Membership ${foundMember.name} sudah kedaluwarsa.`, 'error');
      return;
    }

    // Granted Access: Trigger Relay, Sound & Voice Announcement
    playGateUnlockSound();
    if (isGracePeriod) {
      speakAccessVoice('MASA TENGGANG');
      setGateStatus('GRANTED');
      setStatusMessage(`AKSES DITERIMA DALAM MASA TENGGANG: SILAKAN MASUK (${foundMember.name.toUpperCase()})`);
    } else {
      speakAccessVoice('AKTIF');
      setGateStatus('GRANTED');
      setStatusMessage(`AKSES DIIZINKAN: SILAKAN MASUK (${foundMember.name.toUpperCase()})`);
    }
    setCountdown(gateConfig.relayPulseMs);

    const grantedLog: TurnstileGateLog = {
      id: `LOG-${Date.now()}`,
      timestamp: timeStr,
      memberId: foundMember.id,
      memberName: foundMember.name,
      memberPhoto: foundMember.photo,
      barcodeOrCardId: trimmed,
      gateId: gateConfig.id,
      gateName: gateConfig.name,
      direction: gateConfig.direction === 'OUT' ? 'OUT' : 'IN',
      decision: 'GRANTED',
      notes: `Relay ON (${gateConfig.relayPulseMs}ms) • Status AKTIF`,
      relayPulseMs: gateConfig.relayPulseMs
    };
    setLogs((prev) => [grantedLog, ...prev]);

    // Optional Check-in trigger
    onMemberCheckIn?.(foundMember);
    showToast?.('Gerbang Terbuka', `Sinyal relay dikirim ke ${gateConfig.name}. Selamat datang, ${foundMember.name}!`, 'success');
  };

  const handleManualOverride = () => {
    playGateUnlockSound();
    playSuccessBeep();
    setGateStatus('GRANTED');
    setStatusMessage('MANUAL OVERRIDE: GERBANG DIBUKA RESEPSIONIS');
    setCountdown(gateConfig.relayPulseMs);

    const now = new Date();
    const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const overrideLog: TurnstileGateLog = {
      id: `LOG-${Date.now()}`,
      timestamp: timeStr,
      barcodeOrCardId: 'STAFF-OVERRIDE',
      gateId: gateConfig.id,
      gateName: gateConfig.name,
      direction: gateConfig.direction === 'OUT' ? 'OUT' : 'IN',
      decision: 'MANUAL_OVERRIDE',
      notes: 'Buka paksa manual dari tombol front desk',
      relayPulseMs: gateConfig.relayPulseMs
    };
    setLogs((prev) => [overrideLog, ...prev]);
    showToast?.('Override Berhasil', 'Relay pulsa darurat dikirim.', 'info');
  };

  return (
    <div className="space-y-6">
      {/* Hardware Controller Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Visual Gate Simulator & Relay Status */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div
                  className={`w-3.5 h-3.5 rounded-full ${
                    gateConfig.enabled ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                  }`}
                />
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {gateConfig.name}
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    TCP Relay: {gateConfig.ipAddress}:{gateConfig.port} • Pulsa: {gateConfig.relayPulseMs}ms
                  </p>
                </div>
              </div>

              <span
                className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${
                  gateStatus === 'GRANTED'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : gateStatus === 'DENIED'
                    ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                    : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                {gateStatus === 'GRANTED'
                  ? 'TERBUKA (RELAY ON)'
                  : gateStatus === 'DENIED'
                  ? 'TERKUNCI (DITOLAK)'
                  : 'STANDBY (SIAP SCAN)'}
              </span>
            </div>

            {/* Visual Gate Graphic / Display Panel */}
            <div className="my-6 p-6 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 text-white shadow-inner flex flex-col items-center justify-center relative overflow-hidden border border-slate-800">
              {/* LED Status Bar */}
              <div className="absolute top-4 left-6 right-6 flex items-center justify-between">
                <span className="text-[11px] font-mono text-slate-400">HARDWARE CONTROLLER V3.2</span>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-3 h-3 rounded-full transition-all ${
                      gateStatus === 'GRANTED'
                        ? 'bg-emerald-400 shadow-[0_0_12px_#34d399]'
                        : 'bg-slate-700'
                    }`}
                  />
                  <div
                    className={`w-3 h-3 rounded-full transition-all ${
                      gateStatus === 'DENIED'
                        ? 'bg-rose-500 shadow-[0_0_12px_#f43f5e]'
                        : 'bg-slate-700'
                    }`}
                  />
                  <div
                    className={`w-3 h-3 rounded-full transition-all ${
                      gateStatus === 'IDLE'
                        ? 'bg-blue-400 shadow-[0_0_8px_#60a5fa]'
                        : 'bg-slate-700'
                    }`}
                  />
                </div>
              </div>

              {/* Turnstile Tripod / Flap Animation Display */}
              <div className="py-8 flex flex-col items-center">
                <div className="relative w-44 h-44 flex items-center justify-center">
                  {/* Outer Ring */}
                  <div
                    className={`absolute inset-0 rounded-full border-4 border-dashed transition-all duration-700 ${
                      gateStatus === 'GRANTED'
                        ? 'border-emerald-400 rotate-180 scale-105'
                        : gateStatus === 'DENIED'
                        ? 'border-rose-500 scale-95'
                        : 'border-slate-700'
                    }`}
                  />

                  {/* Tripod Arms Graphic */}
                  <div
                    className={`w-28 h-28 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-xl ${
                      gateStatus === 'GRANTED'
                        ? 'bg-emerald-600 text-white rotate-90 scale-110'
                        : gateStatus === 'DENIED'
                        ? 'bg-rose-600 text-white'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {gateStatus === 'GRANTED' ? (
                      <Unlock className="w-12 h-12 animate-pulse" />
                    ) : gateStatus === 'DENIED' ? (
                      <Lock className="w-12 h-12" />
                    ) : (
                      <Radio className="w-12 h-12 animate-pulse text-blue-400" />
                    )}
                  </div>
                </div>

                {/* LCD Screen Display on Gate */}
                <div className="mt-4 px-6 py-2.5 rounded-xl bg-black/70 border border-slate-700 text-center font-mono w-full max-w-sm">
                  <p
                    className={`text-xs font-bold tracking-wider ${
                      gateStatus === 'GRANTED'
                        ? 'text-emerald-400'
                        : gateStatus === 'DENIED'
                        ? 'text-rose-400'
                        : 'text-slate-300'
                    }`}
                  >
                    {statusMessage}
                  </p>
                  {countdown > 0 && (
                    <p className="text-[11px] text-amber-400 mt-1">
                      Kunci Otomatis Dalam: {(countdown / 1000).toFixed(1)}s
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Manual Override & Test Scan Controls */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={handleManualOverride}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs uppercase tracking-wider shadow-sm transition-all"
            >
              <Zap className="w-4 h-4" />
              Buka Gerbang Manual (Override)
            </button>

            <button
              onClick={() => {
                const active = members.find((m) => m.status === 'AKTIF');
                if (active) processAccessValidation(active.id);
              }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold"
            >
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              Test Tap Member Aktif
            </button>

            <button
              onClick={() => {
                const expired = members.find((m) => m.status === 'EXPIRED');
                if (expired) {
                  processAccessValidation(expired.id);
                } else {
                  processAccessValidation('EXPIRED-MEMBER-TEST');
                }
              }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold"
            >
              <AlertCircle className="w-4 h-4 text-rose-500" />
              Test Tap Member Expired
            </button>
          </div>
        </div>

        {/* Right Column: Scan Card Simulator & Relay Configuration */}
        <div className="lg:col-span-5 space-y-6">
          {/* Card / Barcode Scanner Input */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm">
              <QrCode className="w-4 h-4 text-emerald-600" />
              Simulasi Tap Kartu RFID / QR Barcode
            </h4>
            <p className="text-xs text-slate-500">
              Ketik ID Member, nomor barcode, atau 4 digit nomor HP lalu tekan enter untuk memverifikasi hak akses barrier gate.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                processAccessValidation(manualCodeInput);
                setManualCodeInput('');
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                placeholder="Contoh: M-001 / QR Code..."
                value={manualCodeInput}
                onChange={(e) => setManualCodeInput(e.target.value)}
                className="flex-1 px-3 py-2 text-sm font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm"
              >
                Tap Card
              </button>
            </form>

            {/* Quick Click Demo Members */}
            <div className="pt-2">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                Pilih Member Langsung:
              </label>
              <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                {members.slice(0, 6).map((m) => (
                  <div
                    key={m.id}
                    onClick={() => processAccessValidation(m.id)}
                    className="flex items-center justify-between p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/80 cursor-pointer text-xs transition-colors"
                  >
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {m.name}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        m.status === 'AKTIF'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      }`}
                    >
                      {m.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Relay Parameter Config */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
            <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm">
              <Sliders className="w-4 h-4 text-blue-600" />
              Pengaturan Relay Barrier Gate
            </h4>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-slate-500 block mb-1">Durasi Pulsa Relay</label>
                <select
                  value={gateConfig.relayPulseMs}
                  onChange={(e) => setGateConfig({ ...gateConfig, relayPulseMs: Number(e.target.value) })}
                  className="w-full p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                >
                  <option value={2000}>2.0 Detik</option>
                  <option value={3000}>3.0 Detik (Standard)</option>
                  <option value={5000}>5.0 Detik</option>
                  <option value={8000}>8.0 Detik (Disabilitas)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-500 block mb-1">Tipe Barrier</label>
                <select
                  value={gateConfig.type}
                  onChange={(e) => setGateConfig({ ...gateConfig, type: e.target.value as any })}
                  className="w-full p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                >
                  <option value="TRIPOD_TURNSTILE">Tripod Turnstile</option>
                  <option value="FLAP_BARRIER">Flap Barrier Wing</option>
                  <option value="SWING_GATE">Swing Glass Gate</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Status Integrasi Gerbang
              </span>
              <button
                onClick={() => setGateConfig({ ...gateConfig, enabled: !gateConfig.enabled })}
                className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all ${
                  gateConfig.enabled
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                {gateConfig.enabled ? 'ONLINE (AKTIF)' : 'OFFLINE (STANDALONE)'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Gate Access Logs Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-emerald-600" />
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Log Akses Gerbang Real-Time
            </h4>
          </div>
          <button
            onClick={() => {
              setLogs([]);
              localStorage.removeItem('gympro_gate_logs');
            }}
            className="text-xs text-rose-500 hover:text-rose-700 font-semibold"
          >
            Bersihkan Log
          </button>
        </div>

        {logs.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            Belum ada aktivitas tap gerbang hari ini.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-72 overflow-y-auto">
            {logs.map((log) => {
              const isGranted = log.decision === 'GRANTED' || log.decision === 'MANUAL_OVERRIDE';
              return (
                <div
                  key={log.id}
                  className="p-3 sm:px-4 flex items-center justify-between gap-4 text-xs hover:bg-slate-50 dark:hover:bg-slate-800/50"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-slate-400 text-[11px]">{log.timestamp}</span>
                    <span
                      className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                        isGranted
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      }`}
                    >
                      {log.decision}
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {log.memberName || log.barcodeOrCardId}
                    </span>
                  </div>

                  <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                    {log.notes}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
