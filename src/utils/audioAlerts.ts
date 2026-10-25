// Audio cues using HTML5 Web Audio API synthesizer for kiosk & gate feedback
export function playSuccessBeep() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const now = ctx.currentTime;
    
    // First tone (pleasant mid tone)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now); // D5
    gain1.gain.setValueAtTime(0.15, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.15);

    // Second tone (higher harmony tone)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.12); // A5
    gain2.gain.setValueAtTime(0.18, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.35);
  } catch (e) {
    // Ignore audio context error if user has not interacted
  }
}

export function playErrorBuzz() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.setValueAtTime(160, now + 0.1);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.3);
  } catch (e) {}
}

export function playGateUnlockSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const now = ctx.currentTime;

    // Relay click
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(1200, now);
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.08);
  } catch (e) {}
}

export function playGracePeriodTone() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const now = ctx.currentTime;

    // Warm double chime for warning/grace period
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(523.25, now); // C5
    gain1.gain.setValueAtTime(0.16, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.18);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(659.25, now + 0.15); // E5
    gain2.gain.setValueAtTime(0.16, now + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.15);
    osc2.stop(now + 0.35);
  } catch (e) {}
}

export type AccessVoiceStatus = 'AKTIF' | 'EXPIRED' | 'MASA TENGGANG';

/**
 * Memainkan suara respon ID Card Scanner:
 * 1. Member Aktif -> "Akses diterima"
 * 2. Expired -> "Akses ditolak"
 * 3. Masa Tenggang -> "Akses diterima dalam masa tenggang"
 */
export function speakAccessVoice(status: AccessVoiceStatus, soundEnabled: boolean = true) {
  if (!soundEnabled) return;

  // 1. Play synthesizer tone
  if (status === 'EXPIRED') {
    playErrorBuzz();
  } else if (status === 'MASA TENGGANG') {
    playGracePeriodTone();
  } else {
    playSuccessBeep();
  }

  // 2. Play Web Speech API voice in Indonesian
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel(); // Stop previous voice speech

      let phrase = 'Akses diterima';
      if (status === 'EXPIRED') {
        phrase = 'Akses ditolak';
      } else if (status === 'MASA TENGGANG') {
        phrase = 'Akses diterima dalam masa tenggang';
      }

      const utterance = new SpeechSynthesisUtterance(phrase);
      utterance.lang = 'id-ID';
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      // Select Indonesian voice if found
      const voices = window.speechSynthesis.getVoices();
      const idVoice = voices.find(
        (v) => v.lang === 'id-ID' || v.lang.toLowerCase().startsWith('id')
      );
      if (idVoice) {
        utterance.voice = idVoice;
      }

      window.speechSynthesis.speak(utterance);
    } catch {
      // Audio speech might fail silently if disabled or unsupported
    }
  }
}
