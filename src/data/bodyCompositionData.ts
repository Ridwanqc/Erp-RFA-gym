import { BodyCompositionRecord } from '../types';

export const INITIAL_BODY_COMPOSITION_RECORDS: BodyCompositionRecord[] = [
  // Akbar Hanif (M001) - 3 Assessments showing fat loss & muscle gain
  {
    id: 'BC-2026-001',
    memberId: 'M001',
    memberName: 'Akbar Hanif',
    date: '2026-07-15',
    time: '09:00 WIB',
    trainerId: 'S04',
    trainerName: 'Reza Pratama',
    weight: 84.5,
    height: 175,
    bmi: 27.6,
    bodyFatPercentage: 26.5,
    muscleMass: 33.2,
    visceralFat: 10,
    basalMetabolicRate: 1740,
    bodyWaterPercentage: 52.0,
    boneMass: 3.1,
    chest: 104,
    waist: 96,
    hips: 102,
    armRight: 34.5,
    armLeft: 34.0,
    thighRight: 59.0,
    thighLeft: 58.5,
    bloodPressure: '128/85',
    restingHeartRate: 76,
    targetWeight: 75.0,
    fitnessGoal: 'Weight Loss',
    notes: 'Penilaian awal program PT. Fokus pada deficit kalori moderat dan latihan beban compound.',
    trainerRecommendations: 'Latihan beban 3x seminggu, kardio zona 2 30 menit pasca latihan. Batasi asupan sodium dan karbo sederhana.',
    branchId: 'BR-001',
    branchName: 'GymPro Flagship Kelapa Gading',
    createdAt: '2026-07-15T09:30:00Z'
  },
  {
    id: 'BC-2026-002',
    memberId: 'M001',
    memberName: 'Akbar Hanif',
    date: '2026-08-15',
    time: '09:15 WIB',
    trainerId: 'S04',
    trainerName: 'Reza Pratama',
    weight: 81.2,
    height: 175,
    bmi: 26.5,
    bodyFatPercentage: 23.8,
    muscleMass: 34.1,
    visceralFat: 8,
    basalMetabolicRate: 1765,
    bodyWaterPercentage: 54.2,
    boneMass: 3.2,
    chest: 103,
    waist: 91,
    hips: 99,
    armRight: 35.0,
    armLeft: 34.8,
    thighRight: 58.0,
    thighLeft: 57.5,
    bloodPressure: '122/80',
    restingHeartRate: 72,
    targetWeight: 75.0,
    fitnessGoal: 'Weight Loss',
    notes: 'Evaluasi bulan ke-1. Penurunan berat badan 3.3 kg dengan peningkatan massa otot 0.9 kg! Lingkar pinggang susut 5 cm.',
    trainerRecommendations: 'Pertahankan asupan protein 1.8g/kg BB. Naikkan intensitas progressive overload pada squat dan bench press.',
    branchId: 'BR-001',
    branchName: 'GymPro Flagship Kelapa Gading',
    createdAt: '2026-08-15T09:45:00Z'
  },
  {
    id: 'BC-2026-003',
    memberId: 'M001',
    memberName: 'Akbar Hanif',
    date: '2026-09-15',
    time: '10:00 WIB',
    trainerId: 'S04',
    trainerName: 'Reza Pratama',
    weight: 78.4,
    height: 175,
    bmi: 25.6,
    bodyFatPercentage: 21.2,
    muscleMass: 35.3,
    visceralFat: 7,
    basalMetabolicRate: 1790,
    bodyWaterPercentage: 56.5,
    boneMass: 3.3,
    chest: 102.5,
    waist: 86.5,
    hips: 96,
    armRight: 35.8,
    armLeft: 35.5,
    thighRight: 57.0,
    thighLeft: 56.8,
    bloodPressure: '118/78',
    restingHeartRate: 68,
    targetWeight: 75.0,
    fitnessGoal: 'Weight Loss',
    notes: 'Evaluasi bulan ke-2. Postur tubuh jauh lebih atletis, definisi otot bahu dan dada mulai terlihat jelas. Sisa 3.4 kg menuju target ideal.',
    trainerRecommendations: 'Mulai masuk fase body recomposition dengan sedikit penambahan kalori pada hari latihan beban berat.',
    branchId: 'BR-001',
    branchName: 'GymPro Flagship Kelapa Gading',
    createdAt: '2026-09-15T10:30:00Z'
  },

  // Maya Indah (M004) - 2 Assessments showing toning & fat loss
  {
    id: 'BC-2026-004',
    memberId: 'M004',
    memberName: 'Maya Indah',
    date: '2026-08-01',
    time: '16:00 WIB',
    trainerId: 'S03',
    trainerName: 'Citra Lestari',
    weight: 63.8,
    height: 162,
    bmi: 24.3,
    bodyFatPercentage: 29.8,
    muscleMass: 22.4,
    visceralFat: 6,
    basalMetabolicRate: 1320,
    bodyWaterPercentage: 49.5,
    boneMass: 2.4,
    chest: 90,
    waist: 76,
    hips: 98,
    armRight: 28.5,
    armLeft: 28.2,
    thighRight: 56.0,
    thighLeft: 55.5,
    bloodPressure: '115/75',
    restingHeartRate: 74,
    targetWeight: 57.0,
    fitnessGoal: 'General Fitness',
    notes: 'Konsultasi awal. Keluhan rasa cepat lelah dan ingin mengencangkan otot lengan dan perut.',
    trainerRecommendations: 'Gabungan functional training dan pilates 3x per minggu. Minum air minimal 2.5 liter per hari.',
    branchId: 'BR-001',
    branchName: 'GymPro Flagship Kelapa Gading',
    createdAt: '2026-08-01T16:30:00Z'
  },
  {
    id: 'BC-2026-005',
    memberId: 'M004',
    memberName: 'Maya Indah',
    date: '2026-09-10',
    time: '15:30 WIB',
    trainerId: 'S03',
    trainerName: 'Citra Lestari',
    weight: 60.5,
    height: 162,
    bmi: 23.0,
    bodyFatPercentage: 26.4,
    muscleMass: 23.2,
    visceralFat: 5,
    basalMetabolicRate: 1345,
    bodyWaterPercentage: 52.0,
    boneMass: 2.5,
    chest: 88,
    waist: 71,
    hips: 95,
    armRight: 27.2,
    armLeft: 27.0,
    thighRight: 53.5,
    thighLeft: 53.0,
    bloodPressure: '112/72',
    restingHeartRate: 69,
    targetWeight: 57.0,
    fitnessGoal: 'General Fitness',
    notes: 'Progres sangat memuaskan. Berat turun 3.3 kg, lingkar pinggang berkurang 5 cm dan stamina meningkat pesat.',
    trainerRecommendations: 'Tambahkan intensitas kettlebell swing dan plank series untuk core stabilization.',
    branchId: 'BR-001',
    branchName: 'GymPro Flagship Kelapa Gading',
    createdAt: '2026-09-10T16:00:00Z'
  },

  // Bella Safira (M006)
  {
    id: 'BC-2026-006',
    memberId: 'M006',
    memberName: 'Bella Safira',
    date: '2026-09-05',
    time: '11:00 WIB',
    trainerId: 'S03',
    trainerName: 'Citra Lestari',
    weight: 54.0,
    height: 165,
    bmi: 19.8,
    bodyFatPercentage: 22.0,
    muscleMass: 21.8,
    visceralFat: 3,
    basalMetabolicRate: 1280,
    bodyWaterPercentage: 55.0,
    boneMass: 2.3,
    chest: 84,
    waist: 66,
    hips: 90,
    armRight: 25.0,
    armLeft: 24.8,
    thighRight: 50.0,
    thighLeft: 49.5,
    bloodPressure: '110/70',
    restingHeartRate: 66,
    targetWeight: 56.0,
    fitnessGoal: 'Muscle Gain',
    notes: 'Member ingin menambah massa otot (lean bulking) dan memperbaiki postur punggung.',
    trainerRecommendations: 'Surplus kalori 250-300 kcal/hari. Fokus pada lat pulldown, seated cable row, dan hip thrust.',
    branchId: 'BR-001',
    branchName: 'GymPro Flagship Kelapa Gading',
    createdAt: '2026-09-05T11:45:00Z'
  },

  // Hendro Prasetyo (M005)
  {
    id: 'BC-2026-007',
    memberId: 'M005',
    memberName: 'Hendro Prasetyo',
    date: '2026-09-02',
    time: '14:00 WIB',
    trainerId: 'S04',
    trainerName: 'Reza Pratama',
    weight: 89.0,
    height: 178,
    bmi: 28.1,
    bodyFatPercentage: 27.2,
    muscleMass: 36.0,
    visceralFat: 11,
    basalMetabolicRate: 1820,
    bodyWaterPercentage: 51.5,
    boneMass: 3.4,
    chest: 108,
    waist: 99,
    hips: 105,
    armRight: 36.5,
    armLeft: 36.2,
    thighRight: 62.0,
    thighLeft: 61.5,
    bloodPressure: '132/88',
    restingHeartRate: 78,
    targetWeight: 80.0,
    fitnessGoal: 'Weight Loss',
    notes: 'Member memiliki target penurunan berat badan 9 kg. Perlu perhatian khusus pada fleksibilitas sendi lutut.',
    trainerRecommendations: 'Hindari high impact jumping. Gunakan elliptical trainer dan leg press terkontrol.',
    branchId: 'BR-001',
    branchName: 'GymPro Flagship Kelapa Gading',
    createdAt: '2026-09-02T14:40:00Z'
  }
];

export function calculateBMI(weightKg: number, heightCm: number): number {
  if (!weightKg || !heightCm || heightCm <= 0) return 0;
  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);
  return Math.round(bmi * 10) / 10;
}

export function getBMICategory(bmi: number): {
  label: string;
  color: string;
  bg: string;
  badge: string;
} {
  if (bmi <= 0) return { label: '-', color: 'text-zinc-400', bg: 'bg-zinc-800', badge: 'bg-zinc-800 text-zinc-300' };
  if (bmi < 18.5) return { label: 'Berat Kurang (Underweight)', color: 'text-amber-400', bg: 'bg-amber-500/20', badge: 'bg-amber-500/10 text-amber-300 border-amber-500/30' };
  if (bmi < 23.0) return { label: 'Normal / Ideal', color: 'text-emerald-400', bg: 'bg-emerald-500/20', badge: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' };
  if (bmi < 25.0) return { label: 'Berlebih (Overweight)', color: 'text-yellow-400', bg: 'bg-yellow-500/20', badge: 'bg-yellow-500/10 text-yellow-300 border-yellow-500/30' };
  if (bmi < 30.0) return { label: 'Obesitas Tingkat I', color: 'text-orange-400', bg: 'bg-orange-500/20', badge: 'bg-orange-500/10 text-orange-300 border-orange-500/30' };
  return { label: 'Obesitas Tingkat II', color: 'text-rose-400', bg: 'bg-rose-500/20', badge: 'bg-rose-500/10 text-rose-300 border-rose-500/30' };
}

export function calculateEstimatedBMR(weightKg: number, heightCm: number, ageYears: number = 28, gender: 'L' | 'P' = 'L'): number {
  if (!weightKg || !heightCm) return 0;
  // Harris-Benedict revised formula
  if (gender === 'L') {
    return Math.round(88.362 + (13.397 * weightKg) + (4.799 * heightCm) - (5.677 * ageYears));
  } else {
    return Math.round(447.593 + (9.247 * weightKg) + (3.098 * heightCm) - (4.330 * ageYears));
  }
}
