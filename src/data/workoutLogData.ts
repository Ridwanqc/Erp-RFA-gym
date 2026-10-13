import { TrainerWorkoutLog } from '../types';
import { APP_TODAY } from '../utils/formatters';

export const INITIAL_WORKOUT_LOGS: TrainerWorkoutLog[] = [
  {
    id: 'LOG-001',
    scheduleId: 'SCH-01',
    trainerId: 'S04',
    trainerName: 'Reza Pratama',
    memberId: 'M001',
    memberName: 'Akbar Hanif',
    date: APP_TODAY,
    time: '16:00',
    durationMinutes: 60,
    sessionNumber: 4,
    focusArea: 'Chest & Triceps Hypertrophy',
    exercisesSummary: '1. Barbell Bench Press 4x10 @ 65kg (PR!)\n2. Incline DB Press 3x12 @ 22kg\n3. Dips Bodyweight 3x10\n4. Rope Triceps Pushdown 4x15 @ 25kg',
    rpeRate: 8,
    condition: 'Prima & Bertenaga',
    formQuality: 'Sempurna',
    weightProgressKg: 73.5,
    coachNotes: 'Teknik leg drive pada bench press sudah mantap. Istirahat 90 detik antar set. Member sangat termotivasi dan disiplin.',
    nextSessionGoal: 'Coba tes 70kg di Bench Press 3x8, lalu lanjut fokus Upper Chest flyes.',
    createdAt: `${APP_TODAY} 17:05 WIB`
  },
  {
    id: 'LOG-001-B',
    scheduleId: 'SCH-01-PREV',
    trainerId: 'S04',
    trainerName: 'Reza Pratama',
    memberId: 'M001',
    memberName: 'Akbar Hanif',
    date: '2026-10-06',
    time: '18:00',
    durationMinutes: 60,
    sessionNumber: 3,
    focusArea: 'Back & Biceps Hypertrophy',
    exercisesSummary: '1. Pull Up Bodyweight 4x8\n2. Barbell Bent-over Row 4x10 @ 55kg\n3. Lat Pulldown Close Grip 3x12 @ 50kg\n4. Incline Dumbbell Curl 3x12 @ 12kg',
    rpeRate: 7,
    condition: 'Prima & Bertenaga',
    formQuality: 'Baik',
    weightProgressKg: 73.8,
    coachNotes: 'Scapular retraction konsisten. Postur punggung lurus dan tidak rounded saat barbell row.',
    nextSessionGoal: 'Progres beban Barbell Row ke 60kg dan tambah 1 set Pull-up.',
    createdAt: '2026-10-06 19:05 WIB'
  },
  {
    id: 'LOG-002',
    scheduleId: 'SCH-05',
    trainerId: 'S04',
    trainerName: 'Reza Pratama',
    memberId: 'M005',
    memberName: 'Hendro Prasetyo',
    date: '2026-09-17',
    time: '17:00',
    durationMinutes: 60,
    sessionNumber: 8,
    focusArea: 'Back & Core Strength',
    exercisesSummary: '1. Lat Pulldown Wide Grip 4x12 @ 55kg\n2. Seated Cable Row 4x12 @ 50kg\n3. Face Pulls 3x15 @ 20kg\n4. Hanging Knee Raises 3x12',
    rpeRate: 7,
    condition: 'Normal',
    formQuality: 'Baik',
    weightProgressKg: 78.0,
    coachNotes: 'Mind-muscle connection latissimus dorsi meningkat. Postur bahu tidak membungkuk.',
    nextSessionGoal: 'Sesi terakhir kuota paket. Ajak diskusi perpanjangan paket 10 sesi berikutnya.',
    createdAt: '2026-09-17 18:10 WIB'
  },
  {
    id: 'LOG-003',
    scheduleId: 'SCH-07',
    trainerId: 'S05',
    trainerName: 'David Chen',
    memberId: 'M007',
    memberName: 'Kevin Wijaya',
    date: '2026-09-18',
    time: '18:00',
    durationMinutes: 60,
    sessionNumber: 2,
    focusArea: 'Leg Day & Squat Mechanics',
    exercisesSummary: '1. Barbell Back Squat 5x5 @ 90kg\n2. Romanian Deadlift 4x10 @ 70kg\n3. Walking Lunges DB 3x12 steps @ 16kg\n4. Standing Calf Raises 4x20',
    rpeRate: 9,
    condition: 'Lelah / Recovery',
    formQuality: 'Baik',
    weightProgressKg: 81.2,
    coachNotes: 'Depth squat konsisten parallel. Bracing pernapasan terjaga dengan sabuk. Member berkeringat deras.',
    nextSessionGoal: 'Deload ringan sesi berikutnya, fokus mobilitas panggul dan hamstring.',
    createdAt: '2026-09-18 19:15 WIB'
  },
  {
    id: 'LOG-004',
    scheduleId: 'SCH-03',
    trainerId: 'S01',
    trainerName: 'Budi Santoso',
    memberId: 'M003',
    memberName: 'Doni Firmansyah',
    date: '2026-10-07',
    time: '18:00',
    durationMinutes: 60,
    sessionNumber: 4,
    focusArea: 'Upper Body Power & Chest Hypertrophy',
    exercisesSummary: '1. Barbell Bench Press 4x8 @ 70kg (New PR!)\n2. Incline DB Press 3x10 @ 24kg\n3. Bent-over Barbell Row 4x10 @ 60kg\n4. Overhead Triceps Extension 3x12 @ 20kg',
    rpeRate: 8,
    condition: 'Prima & Bertenaga',
    formQuality: 'Sempurna',
    weightProgressKg: 74.0,
    coachNotes: 'Form teknik arching dan leg drive bench press sangat stabil. Mampu mengunci 70kg tanpa bantuan spotter.',
    nextSessionGoal: 'Target Sesi 5: Progressive overload ke Deadlift compound 4x6 @ 95kg dan core bracing.',
    createdAt: '2026-10-07 19:10 WIB'
  },
  {
    id: 'LOG-005',
    scheduleId: 'SCH-02',
    trainerId: 'S04',
    trainerName: 'Reza Pratama',
    memberId: 'M002',
    memberName: 'Sari Rahayu',
    date: '2026-10-06',
    time: '19:00',
    durationMinutes: 50,
    sessionNumber: 3,
    focusArea: 'Glutes & Hamstrings Hypertrophy',
    exercisesSummary: '1. Barbell Hip Thrust 4x12 @ 65kg\n2. Romanian Deadlift DB 3x12 @ 16kg\n3. Bulgarian Split Squat 3x10 @ 10kg\n4. Cable Kickbacks 3x15',
    rpeRate: 8,
    condition: 'Normal',
    formQuality: 'Baik',
    weightProgressKg: 56.5,
    coachNotes: 'Koneksi kontraksi glutes sangat solid. Tempo fase eksentrik 3 detik diterapkan dengan baik.',
    nextSessionGoal: 'Tingkatkan beban Barbell Hip Thrust ke 70kg di sesi berikutnya.',
    createdAt: '2026-10-06 20:00 WIB'
  }
];

export const WORKOUT_LOG_STORAGE_KEY = 'rfa_trainer_workout_logs';

export function loadWorkoutLogsFromStorage(): TrainerWorkoutLog[] {
  try {
    const saved = localStorage.getItem(WORKOUT_LOG_STORAGE_KEY);
    if (!saved) return INITIAL_WORKOUT_LOGS;
    const parsed: TrainerWorkoutLog[] = JSON.parse(saved);
    const existingIds = new Set(parsed.map((l) => l.id));
    const missing = INITIAL_WORKOUT_LOGS.filter((l) => !existingIds.has(l.id));
    return missing.length > 0 ? [...parsed, ...missing] : parsed;
  } catch {
    return INITIAL_WORKOUT_LOGS;
  }
}

export function saveWorkoutLogsToStorage(logs: TrainerWorkoutLog[]): void {
  try {
    localStorage.setItem(WORKOUT_LOG_STORAGE_KEY, JSON.stringify(logs));
  } catch (e) {
    console.error('Failed to save workout logs to localStorage', e);
  }
}
