import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  Users,
  FileText,
  DollarSign,
  UserCheck,
  ShieldCheck,
  Briefcase,
  BarChart3
} from 'lucide-react';
import {
  User,
  StaffAttendance,
  Transaction,
  Schedule,
  WorkSchedule,
  LeaveRequest
} from '../types';
import { HRAttendanceDashboard } from './hr/HRAttendanceDashboard';
import { WorkScheduleTab } from './hr/WorkScheduleTab';
import { AttendanceReportTab } from './hr/AttendanceReportTab';
import { StaffDirectoryTab } from './hr/StaffDirectoryTab';
import { LeaveManagementTab } from './hr/LeaveManagementTab';
import { PayrollTab } from './hr/PayrollTab';
import { APP_TODAY } from '../utils/formatters';

interface HRPayrollViewProps {
  staffUsers: User[];
  staffAttendance: StaffAttendance[];
  transactions: Transaction[];
  schedules: Schedule[];
  workSchedules: WorkSchedule[];
  leaveRequests: LeaveRequest[];
  onSaveWorkSchedule: (schedule: WorkSchedule, isNew: boolean) => void;
  onDeleteWorkSchedule: (id: string) => void;
  onSwapWorkSchedule: (staffId1: string, staffId2: string, date: string) => void;
  onStaffClock: (record: StaffAttendance) => void;
  onDeleteAttendance?: (id: string) => void;
  onSaveStaff: (user: User, isNew: boolean) => void;
  onDeleteStaff: (id: string) => void;
  onSaveLeaveRequest: (leave: LeaveRequest, isNew: boolean) => void;
  onApproveLeaveRequest: (id: string, status: 'Approved' | 'Rejected', notes?: string) => void;
  showToast: (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

export type HRActiveTab = 'dashboard' | 'roster' | 'attendance' | 'directory' | 'leave' | 'payroll';

export const HRPayrollView: React.FC<HRPayrollViewProps> = ({
  staffUsers,
  staffAttendance,
  transactions,
  schedules,
  workSchedules,
  leaveRequests,
  onSaveWorkSchedule,
  onDeleteWorkSchedule,
  onSwapWorkSchedule,
  onStaffClock,
  onDeleteAttendance,
  onSaveStaff,
  onDeleteStaff,
  onSaveLeaveRequest,
  onApproveLeaveRequest,
  showToast
}) => {
  const [activeTab, setActiveTab] = useState<HRActiveTab>('dashboard');

  const pendingLeavesCount = leaveRequests.filter((l) => l.status === 'Pending').length;
  const todayClockedCount = staffAttendance.filter(
    (a) => a.date === APP_TODAY && !a.timeOut
  ).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* 1. MAIN HEADER & TAB NAVIGATION */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-orange-500" />
            Sistem HR & Manajemen Karyawan
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Pengelolaan jadwal kerja shift mingguan, laporan absensi real-time, pengajuan cuti, dan penggajian otomatis
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex bg-zinc-900/90 p-1.5 rounded-2xl border border-zinc-800 overflow-x-auto max-w-full scrollbar-none">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'dashboard'
                ? 'bg-orange-500 text-zinc-950 font-black shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Dashboard & Analitik
          </button>

          <button
            onClick={() => setActiveTab('roster')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'roster'
                ? 'bg-orange-500 text-zinc-950 font-black shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            Jadwal Kerja & Shift
          </button>

          <button
            onClick={() => setActiveTab('attendance')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'attendance'
                ? 'bg-orange-500 text-zinc-950 font-black shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Laporan Presensi
            {todayClockedCount > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                activeTab === 'attendance' ? 'bg-zinc-950 text-white' : 'bg-emerald-500/20 text-emerald-400'
              }`}>
                {todayClockedCount} Aktif
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('directory')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'directory'
                ? 'bg-orange-500 text-zinc-950 font-black shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Profil Karyawan ({staffUsers.length})
          </button>

          <button
            onClick={() => setActiveTab('leave')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'leave'
                ? 'bg-orange-500 text-zinc-950 font-black shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Cuti & Izin
            {pendingLeavesCount > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                activeTab === 'leave' ? 'bg-zinc-950 text-white' : 'bg-orange-500/20 text-orange-400'
              }`}>
                {pendingLeavesCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('payroll')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'payroll'
                ? 'bg-orange-500 text-zinc-950 font-black shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            Slip Gaji & Payroll
          </button>
        </div>
      </div>

      {/* 2. TAB CONTENT PANELS */}
      {activeTab === 'dashboard' && (
        <HRAttendanceDashboard
          staffUsers={staffUsers}
          staffAttendance={staffAttendance}
          workSchedules={workSchedules}
          leaveRequests={leaveRequests}
          onNavigateTab={(tab) => setActiveTab(tab)}
          showToast={showToast}
        />
      )}
      {activeTab === 'roster' && (
        <WorkScheduleTab
          staffUsers={staffUsers}
          workSchedules={workSchedules}
          onSaveSchedule={onSaveWorkSchedule}
          onDeleteSchedule={onDeleteWorkSchedule}
          onSwapSchedule={onSwapWorkSchedule}
          showToast={showToast}
        />
      )}

      {activeTab === 'attendance' && (
        <AttendanceReportTab
          staffUsers={staffUsers}
          staffAttendance={staffAttendance}
          onStaffClock={onStaffClock}
          onDeleteAttendance={onDeleteAttendance}
          onOpenDashboard={() => setActiveTab('dashboard')}
          showToast={showToast}
        />
      )}

      {activeTab === 'directory' && (
        <StaffDirectoryTab
          staffUsers={staffUsers}
          onSaveStaff={onSaveStaff}
          onDeleteStaff={onDeleteStaff}
          showToast={showToast}
        />
      )}

      {activeTab === 'leave' && (
        <LeaveManagementTab
          staffUsers={staffUsers}
          leaveRequests={leaveRequests}
          onSaveLeaveRequest={onSaveLeaveRequest}
          onApproveLeaveRequest={onApproveLeaveRequest}
          showToast={showToast}
        />
      )}

      {activeTab === 'payroll' && (
        <PayrollTab
          staffUsers={staffUsers}
          schedules={schedules}
          transactions={transactions}
          staffAttendance={staffAttendance}
          showToast={showToast}
        />
      )}
    </div>
  );
};
