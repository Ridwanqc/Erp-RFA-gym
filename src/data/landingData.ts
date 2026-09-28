import {
  LandingProgram,
  TrainerProfile,
  FacilityGalleryItem,
  MilestoneItem,
  FitnessTip,
  FAQItem,
  BranchContact,
  OnlineReservation
} from '../types/landingTypes';
import { APP_TODAY } from '../utils/formatters';

export const WHY_CHOOSE_US_ITEMS = [
  {
    id: 'wc-1',
    icon: 'Dumbbell',
    title: 'Peralatan Standar Internasional',
    description: 'Line-up mesin biomekanik presisi tinggi, dumbell hingga 50kg, squat rack komplit, dan area functional modern bersertifikasi.',
    highlight: 'ISO 9001 Standard'
  },
  {
    id: 'wc-2',
    icon: 'Award',
    title: 'Certified Personal Trainer',
    description: 'Pelatih berlisensi nasional & internasional (APKI, NASM, ACE) yang siap mendampingi target fat-loss, hypertrophy, dan rehabilitasi.',
    highlight: '100% Certified'
  },
  {
    id: 'wc-3',
    icon: 'Activity',
    title: 'Dynamic Studio Class Harian',
    description: 'Lebih dari 40+ jadwal kelas seru setiap minggu: Zumba, Body Combat, Pilates, Yoga, HIIT, hingga Muaythai dengan sound-system menggelegar.',
    highlight: '40+ Sesi/Minggu'
  },
  {
    id: 'wc-4',
    icon: 'ShieldCheck',
    title: 'Fleksibilitas Member & Freezing',
    description: 'Nikmati kebebasan mengajukan cuti keanggotaan (freeze pass) jika Anda dinas keluar kota atau berhalangan tanpa kehilangan sisa hari membership.',
    highlight: 'Zero Loss Policy'
  },
  {
    id: 'wc-5',
    icon: 'Sparkles',
    title: 'Higienis, Locker Digital & Shower',
    description: 'Fasilitas premium dengan smart locker ber-PIN, shower air hangat, hair-dryer, sauna room, serta sterilisasi alat berkala 3 kali sehari.',
    highlight: 'Clean & Safe'
  },
  {
    id: 'wc-6',
    icon: 'Layers',
    title: 'Akses Multi-Cabang RFA Gym',
    description: 'Satu kartu keanggotaan aktif memberikan Anda fleksibilitas berlatih di seluruh cabang jaringan RFA Gym di Sudirman, Senopati, dan BSD.',
    highlight: '3 Cabang Strategis'
  }
];

export const RFA_PROGRAMS: LandingProgram[] = [
  {
    id: 'prog-1',
    name: 'Weight Training & Bodybuilding',
    slug: 'weight-training',
    category: 'strength',
    tagline: 'Membangun Massa Otot & Kekuatan Fisik Maksimal',
    description: 'Program latihan beban terarah yang berfokus pada teknik angkatan compound (Squat, Bench Press, Deadlift), hipertrofi terstruktur, dan progressive overload yang aman.',
    duration: '60 - 75 Menit',
    intensity: 'Tinggi',
    caloriesBurned: '450 - 650 kcal',
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=800&auto=format&fit=crop',
    features: ['Biomechanic Machines & Free Weights', 'Pendampingan Koreksi Form Gerakan', 'Target Otot Spesifik (Push/Pull/Legs)', 'Free Barbell Collar & Chalk'],
    trainerName: 'Bima Pratama (Master Coach)',
    popular: true
  },
  {
    id: 'prog-2',
    name: 'Functional & Cross Conditioning',
    slug: 'functional-training',
    category: 'strength',
    tagline: 'Stamina Atletik, Kelincahan & Ketahanan Tubuh',
    description: 'Kombinasi latihan kekuatan fungsional, kettlebell, battle rope, plyometrics, dan sled push untuk meningkatkan performa tubuh sehari-hari serta daya tahan kardiovaskular.',
    duration: '45 - 60 Menit',
    intensity: 'Intensif',
    caloriesBurned: '550 - 750 kcal',
    image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=800&auto=format&fit=crop',
    features: ['Turf Area & Sled Track', 'Kettlebell & Sandbag Training', 'Metabolic Conditioning (MetCon)', 'Agility & Speed Drills'],
    trainerName: 'Reza Pratama'
  },
  {
    id: 'prog-3',
    name: 'Yoga Flow & Mat Pilates Studio',
    slug: 'yoga-pilates',
    category: 'mindbody',
    tagline: 'Fleksibilitas, Core Strength & Ketenangan Jiwa',
    description: 'Sinkronisasi pernapasan dan postur tubuh untuk memanjangkan otot, memperbaiki postur bungkuk, memperkuat dinding core perut, serta melepaskan stres mental setelah bekerja.',
    duration: '60 Menit',
    intensity: 'Sedang',
    caloriesBurned: '250 - 400 kcal',
    image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=800&auto=format&fit=crop',
    features: ['Studio Ber-AC dengan Parket Alami', 'Matras & Yoga Block Premium', 'Instruktur RYT-200 Certified', 'Aromatherapy Relaksasi'],
    trainerName: 'Citra Lestari'
  },
  {
    id: 'prog-4',
    name: 'HIIT & Fat Burning Blast',
    slug: 'hiit-cardio',
    category: 'cardio',
    tagline: 'Bakar Kalori Cepat & Akselerasi Metabolisme',
    description: 'Interval intensitas tinggi dengan durasi istirahat terukur yang memicu efek Afterburn (EPOC), sehingga tubuh tetap membakar kalori hingga 24 jam setelah sesi selesai.',
    duration: '45 Menit',
    intensity: 'Intensif',
    caloriesBurned: '600 - 850 kcal',
    image: 'https://images.unsplash.com/photo-1434682881908-b43d0467b798?q=80&w=800&auto=format&fit=crop',
    features: ['Heart Rate Monitor Live Display', 'Dynamic Circuit Stations', 'High Energy Music Beats', 'Cocok untuk Fat Loss Cepat'],
    trainerName: 'Sarah Wijaya',
    popular: true
  },
  {
    id: 'prog-5',
    name: 'Boxing & Strike Muaythai',
    slug: 'boxing-muaythai',
    category: 'combat',
    tagline: 'Pertahanan Diri, Refleks Cepat & Cardio Ekstrem',
    description: 'Pelajari kombinasi pukulan jab, cross, hook, uppercut, dan tendangan pada heavy bag serta pad-work bersama pelatih bela diri berpengalaman.',
    duration: '60 Menit',
    intensity: 'Tinggi',
    caloriesBurned: '500 - 750 kcal',
    image: 'https://images.unsplash.com/photo-1549060279-7e168fcee0c2?q=80&w=800&auto=format&fit=crop',
    features: ['Heavy Bags & Speed Balls', 'Pad Work 1-on-1 dengan Pelatih', 'Glove & Handwrap Sanitation', 'Pelepas Stres & Pembentuk Otot'],
    trainerName: 'Andi Saputra'
  },
  {
    id: 'prog-6',
    name: '1-on-1 Personal Trainer Coaching',
    slug: 'personal-trainer',
    category: 'personal',
    tagline: 'Pendampingan Eksklusif dengan Rencana Kustom',
    description: 'Paket bimbingan privat one-on-one terlengkap meliputi penilaian komposisi tubuh (InBody Scan), meal plan terarah harian, dan evaluasi progres setiap 2 minggu.',
    duration: '60 Menit/Sesi',
    intensity: 'Tinggi',
    caloriesBurned: '400 - 700 kcal',
    image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=800&auto=format&fit=crop',
    features: ['InBody Body Composition Scan', 'Meal & Nutrition Guidance Personal', 'Evaluasi Progres Tiap 14 Hari', 'Jadwal Fleksibel Menyesuaikan Waktu Anda'],
    trainerName: 'Tim Head Coach RFA',
    popular: true
  }
];

export const TRAINER_PROFILES: TrainerProfile[] = [
  {
    id: 'TR-01',
    name: 'Bima Pratama',
    role: 'Head Strength & Conditioning Coach',
    specialty: ['Hypertrophy', 'Powerlifting', 'Koreksi Postur'],
    experience: '8+ Tahun Pengalaman',
    photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop',
    bio: 'Mantan atlet angkat berat nasional dengan sertifikasi NASM-CPT. Telah mendampingi lebih dari 350+ klien mencapai tubuh proporsional dan bebas cedera.',
    certifications: ['NASM Certified Personal Trainer', 'APKI Master Coach', 'FMS Level 2'],
    branch: 'RFA Gym Central Sudirman'
  },
  {
    id: 'TR-02',
    name: 'Citra Lestari',
    role: 'Senior Yoga & Functional Instructor',
    specialty: ['Vinyasa Yoga', 'Mat Pilates', 'Flexibility & Breathing'],
    experience: '6+ Tahun Pengalaman',
    photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=400&auto=format&fit=crop',
    bio: 'Instruktur Yoga bersertifikasi internasional Yoga Alliance RYT-200. Mengkhususkan diri pada penguatan core, mobilitas sendi, dan reduksi stres.',
    certifications: ['Yoga Alliance RYT-200', 'Polestar Pilates Certified', 'Rehab Mobility Specialist'],
    branch: 'RFA Gym Senopati Lifestyle'
  },
  {
    id: 'TR-03',
    name: 'Reza Pratama',
    role: 'HIIT & Combat Conditioning Coach',
    specialty: ['Body Combat', 'HIIT Circuit', 'Fat Loss Acceleration'],
    experience: '5+ Tahun Pengalaman',
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&auto=format&fit=crop',
    bio: 'Energetik dan disiplin, Reza memadukan seni bela diri dengan kardio intensif untuk membakar kalori secara maksimal dalam setiap sesi latihan.',
    certifications: ['Les Mills Body Combat Certified', 'CrossFit Level 1 Trainer', 'TRX Suspension Master'],
    branch: 'RFA Gym Express BSD City'
  },
  {
    id: 'TR-04',
    name: 'Sarah Wijaya',
    role: 'Women Fitness & Posture Specialist',
    specialty: ['Glute & Core Shaping', 'Prenatal & Postnatal Fitness', 'Tone & Lean'],
    experience: '5+ Tahun Pengalaman',
    photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=400&auto=format&fit=crop',
    bio: 'Membantu wanita mendapatkan kepercayaan diri melalui latihan beban yang aman, teknik yang tepat, dan pendekatan nutrisi ramah wanita tanpa lapar.',
    certifications: ['ACE Certified Personal Trainer', 'Women Fitness Specialist (WFS)', 'Sports Nutrition Coach'],
    branch: 'RFA Gym Senopati Lifestyle'
  }
];

export const FACILITY_GALLERY: FacilityGalleryItem[] = [
  {
    id: 'fg-1',
    title: 'Free Weight Zone & Power Racks',
    category: 'gym',
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=800&auto=format&fit=crop',
    description: 'Dumbbell set lengkap 2.5kg hingga 50kg, Olympic Barbell, dan 4 Olympic Squat Racks.'
  },
  {
    id: 'fg-2',
    title: 'Cardio Theater & Curved Treadmill',
    category: 'gym',
    image: 'https://images.unsplash.com/photo-1576678927484-cc907957088c?q=80&w=800&auto=format&fit=crop',
    description: 'Treadmill layar sentuh interaktif, stair climber, rowing machine, dan assault air-bike.'
  },
  {
    id: 'fg-3',
    title: 'Mirror Studio Aerobik & Yoga',
    category: 'studio',
    image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?q=80&w=800&auto=format&fit=crop',
    description: 'Studio berlantai vinyl cushion anti-slip dengan acoustic audio surround dan pencahayaan dinamis.'
  },
  {
    id: 'fg-4',
    title: 'Smart Digital Locker & Warm Shower',
    category: 'recovery',
    image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=800&auto=format&fit=crop',
    description: 'Locker ber-PIN digital mandiri, bilik shower marmer air hangat, hair dryer, dan handuk higienis.'
  },
  {
    id: 'fg-5',
    title: 'Infrared Dry Sauna Room',
    category: 'recovery',
    image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=800&auto=format&fit=crop',
    description: 'Ruang sauna kayu pinus untuk relaksasi otot mendalam, detoksifikasi keringat, dan peredaran darah.'
  },
  {
    id: 'fg-6',
    title: 'Healthy Fuel Shake & Coffee Lounge',
    category: 'lounge',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=800&auto=format&fit=crop',
    description: 'Bar protein shake organik, espresso sehat, BCAA dingin, dan area santai dilengkapi Wi-Fi cepat.'
  }
];

export const RFA_MILESTONES: MilestoneItem[] = [
  {
    year: '2018',
    title: 'Lahirnya RFA Gym Studio',
    description: 'Didirikan dengan visi membawa fasilitas fitness berkualitas tinggi yang terjangkau bagi para penggiat gaya hidup sehat di Jakarta.',
    iconName: 'Flame'
  },
  {
    year: '2020',
    title: 'Ekspansi Cabang Senopati & Digitalisasi',
    description: 'Membuka cabang kedua dengan konsep lifestyle hub dan mengintegrasikan sistem ERP digital untuk presensi dan manajemen member.',
    iconName: 'Building'
  },
  {
    year: '2023',
    title: 'Flagship Gym BSD City & Multi-Branch',
    description: 'Merambah area BSD Tangerang dengan fasilitas terlengkap seluas 1.200m2 dan integrasi keanggotaan multi-cabang terpadu.',
    iconName: 'Award'
  },
  {
    year: '2026',
    title: 'RFA GYM PLATFORM Terintegrasi Cloud',
    description: 'Meluncurkan platform terintegrasi reservasi online real-time, digital smart pass, serta sinkronisasi otomatis ke Google Sheets & Cloud.',
    iconName: 'Sparkles'
  }
];

export const FITNESS_TIPS: FitnessTip[] = [
  {
    id: 'tip-1',
    title: 'Panduan Hitung Protein Harian untuk Pembentukan Otot',
    category: 'nutrition',
    readTime: '3 Menit Baca',
    summary: 'Ketahui berapa gram protein yang tubuh Anda butuhkan per kilogram berat badan agar hasil latihan beban tidak sia-sia.',
    content: 'Untuk mereka yang aktif berlatih beban, konsumsi protein yang disarankan adalah 1.6 hingga 2.2 gram per kilogram berat badan per hari. Sumber terbaik meliputi dada ayam tanpa kulit, telur, tempe, tahu, ikan salmon, dan whey protein isolate.',
    image: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=600&auto=format&fit=crop',
    author: 'Coach Bima',
    likes: 142
  },
  {
    id: 'tip-2',
    title: '5 Kesalahan Paling Umum Pemula Saat Mulai Nge-gym',
    category: 'beginner',
    readTime: '4 Menit Baca',
    summary: 'Mulai dari ego lifting hingga mengabaikan pemanasan, hindari hal-hal ini agar terhindar dari cedera fatal.',
    content: 'Banyak pemula tergoda mengangkat beban terlalu berat dengan teknik salah (ego lifting). Ingatlah: bentuk gerakan (form) jauh lebih penting daripada angka beban. Mulailah dengan beban ringan, kuasai rentang gerak penuh (full ROM), dan istirahatlah cukup.',
    image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=600&auto=format&fit=crop',
    author: 'Coach Sarah',
    likes: 98
  },
  {
    id: 'tip-3',
    title: 'Pentingnya Tidur & Recovery dalam Membakar Lemak',
    category: 'recovery',
    readTime: '3 Menit Baca',
    summary: 'Mengapa kurang tidur 7 jam per malam bisa membuat usaha diet dan latihan Anda terhambat.',
    content: 'Saat tidur nyenyak di fase deep sleep, tubuh melepaskan Human Growth Hormone (HGH) yang memperbaiki serat otot dan membakar lemak. Kurang tidur meningkatkan hormon ghrelin (pemicu lapar) dan kortisol (pemicu penumpukan lemak perut).',
    image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=600&auto=format&fit=crop',
    author: 'Citra Lestari',
    likes: 115
  },
  {
    id: 'tip-4',
    title: 'Progressive Overload: Kunci Utama Otot Terus Berkembang',
    category: 'workout',
    readTime: '4 Menit Baca',
    summary: 'Metode ilmiah menambah repetisi, set, atau beban secara bertahap agar tidak mengalami plateau.',
    content: 'Tubuh manusia sangat adaptif. Jika Anda mengangkat beban 10kg selama berbulan-bulan tanpa peningkatan, otot tidak memiliki alasan untuk tumbuh. Tambah 1 repetisi lebih banyak, atau naikkan beban 1kg setiap pekan untuk memicu adaptasi baru.',
    image: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=600&auto=format&fit=crop',
    author: 'Coach Reza',
    likes: 187
  }
];

export const RFA_FAQS: FAQItem[] = [
  {
    id: 'faq-1',
    question: 'Bagaimana cara mendaftar dan mulai latihan di RFA Gym?',
    answer: 'Anda bisa langsung mendaftar secara online melalui menu "Reservasi Online" di platform ini untuk mendapatkan Single Pass atau memilih paket Membership. Setelah reservasi, Anda akan menerima E-Ticket ber-QR Code untuk di-scan di resepsionis pada kunjungan pertama.',
    category: 'booking'
  },
  {
    id: 'faq-2',
    question: 'Apakah pemula yang belum pernah ke gym akan dibimbing?',
    answer: 'Tentu saja! Setiap anggota baru berhak mendapatkan 1x sesi Orientasi Alat & Konsultasi Komposisi Tubuh (InBody Scan) gratis bersama Personal Trainer kami. Pelatih akan menunjukkan cara kerja alat dan postur yang benar.',
    category: 'membership'
  },
  {
    id: 'faq-3',
    question: 'Apa saja fasilitas yang sudah termasuk dalam paket Membership?',
    answer: 'Semua paket member sudah termasuk akses penuh ke area Free Weight & Mesin, seluruh Studio Class (Zumba, Yoga, HIIT, dll), Smart Locker digital gratis, bilik mandi air hangat (shower), sauna room, serta Wi-Fi berkecepatan tinggi.',
    category: 'facility'
  },
  {
    id: 'faq-4',
    question: 'Apakah tiket reservasi kelas studio bisa dibatalkan jika mendadak ada urusan?',
    answer: 'Ya, Anda bisa membatalkan reservasi kelas secara mandiri lewat "Dashboard Member" maksimal 2 jam sebelum kelas dimulai. Slot Anda akan langsung dikembalikan ke kuota akun Anda.',
    category: 'booking'
  },
  {
    id: 'faq-5',
    question: 'Apa itu fitur Freeze Membership dan bagaimana ketentuannya?',
    answer: 'Jika Anda harus ke luar kota, sakit, atau ada kesibukan kerja, Anda dapat mengajukan cuti keanggotaan (Freeze Pass). Masa aktif keanggotaan Anda akan dihentikan sementara dan dilanjutkan kembali saat Anda siap berlatih lagi tanpa ada hari yang hangus.',
    category: 'membership'
  },
  {
    id: 'faq-6',
    question: 'Pakaian dan perlengkapan apa saja yang wajib dibawa saat berlatih?',
    answer: 'Wajib mengenakan pakaian olahraga yang nyaman dan sepatu olahraga tertutup (running shoes / training shoes). Demi kenyamanan bersama, bawalah handuk kecil pribadi untuk menyeka keringat dan botol minum.',
    category: 'facility'
  }
];

export const BRANCH_CONTACTS: BranchContact[] = [
  {
    id: 'BR-001',
    name: 'RFA Gym Central Sudirman (Flagship)',
    shortName: 'Sudirman Central',
    address: 'Gedung Menara Sudirman Lt. 2, Jl. Jend. Sudirman Kav. 60, Senayan, Kebayoran Baru, Jakarta Selatan',
    phone: '(021) 5296-8800',
    whatsapp: '6281234567890',
    hours: 'Senin - Jumat: 06:00 - 22:00 WIB | Sabtu - Minggu: 06:00 - 21:00 WIB',
    facilities: ['Olympic Weight Zone', 'Heated Sauna', 'Studio Aerobik 80 Orang', 'Smart Turnstile Gate', 'Juice Bar'],
    isFlagship: true
  },
  {
    id: 'BR-002',
    name: 'RFA Gym Senopati Lifestyle Hub',
    shortName: 'Senopati Lifestyle',
    address: 'Jl. Senopati Raya No. 45, Selong, Kebayoran Baru, Jakarta Selatan',
    phone: '(021) 7278-9911',
    whatsapp: '6281911223344',
    hours: 'Senin - Minggu: 06:00 - 22:00 WIB',
    facilities: ['Pilates & Yoga Sanctuary', 'Boxing Ring Corner', 'Shower & Bath Amenities', 'Lounge Cafe', 'Free Valet Parking']
  },
  {
    id: 'BR-003',
    name: 'RFA Gym Express BSD Green Office',
    shortName: 'BSD City Express',
    address: 'BSD Green Office Park 9, Lantai Dasar Unit B-04, Jl. BSD Grand Boulevard, Tangerang',
    phone: '(021) 3045-6677',
    whatsapp: '6281233445566',
    hours: 'Senin - Sabtu: 06:00 - 21:30 WIB | Minggu: 07:00 - 20:00 WIB',
    facilities: ['CrossFit Rig & Turf', 'Recovery Ice Bath', 'Smart Locker PIN', 'Outdoor Sprint Track']
  }
];

export const INITIAL_ONLINE_RESERVATIONS: OnlineReservation[] = [
  {
    id: 'RFA-BK-2026-9810',
    bookingDate: APP_TODAY,
    targetDate: APP_TODAY,
    timeSlot: '07:30 - 08:30 WIB',
    programName: 'Morning Zumba Power',
    programCategory: 'Studio Class',
    branchId: 'BR-001',
    branchName: 'RFA Gym Central Sudirman',
    memberId: 'M001',
    customerName: 'Akbar Hanif',
    customerPhone: '081234567890',
    customerEmail: 'akbar.hanif@example.com',
    trainerName: 'Citra Lestari',
    notes: 'Mohon dekat baris depan ya coach',
    status: 'CONFIRMED',
    qrCodeData: 'RFA-RES|M001|BR-001|2026-09-28|07:30|CONFIRMED',
    ticketPassCode: 'PASS-8812',
    type: 'class',
    classId: 'C01'
  },
  {
    id: 'RFA-BK-2026-9824',
    bookingDate: APP_TODAY,
    targetDate: APP_TODAY,
    timeSlot: '19:00 - 20:00 WIB',
    programName: 'Evening Body Combat',
    programCategory: 'Studio Class',
    branchId: 'BR-001',
    branchName: 'RFA Gym Central Sudirman',
    memberId: 'M003',
    customerName: 'Doni Firmansyah',
    customerPhone: '081298765432',
    customerEmail: 'doni.firmansyah@example.com',
    trainerName: 'Reza Pratama',
    status: 'CONFIRMED',
    qrCodeData: 'RFA-RES|M003|BR-001|2026-09-28|19:00|CONFIRMED',
    ticketPassCode: 'PASS-9430',
    type: 'class',
    classId: 'C02'
  }
];
