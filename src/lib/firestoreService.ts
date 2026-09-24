import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  query,
  limit
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, auth } from './firebase';
import { Member, Transaction, Attendance, Lead, GymBranch } from '../types';

// Collections constants
export const COLLECTIONS = {
  USERS: 'users',
  MEMBERS: 'members',
  TRANSACTIONS: 'transactions',
  ATTENDANCES: 'attendances',
  LEADS: 'leads',
  ADMINS: 'admins',
  BRANCHES: 'branches',
  SETTINGS: 'settings'
};

// 1. Members Cloud Operations
export async function saveMemberToFirestore(member: Member): Promise<void> {
  if (!auth.currentUser) return;
  const path = `${COLLECTIONS.MEMBERS}/${member.id}`;
  try {
    const payload = {
      id: String(member.id),
      name: String(member.name || '').slice(0, 150),
      phone: String(member.phone || '').slice(0, 30),
      expired: String(member.expired || '').slice(0, 50),
      ptQuota: Number(member.ptQuota || 0),
      picId: String(member.picId || '').slice(0, 50),
      picName: String(member.picName || '').slice(0, 150),
      followUpStatus: String(member.followUpStatus || 'AKTIF').slice(0, 100),
      photo: member.photo ? String(member.photo).slice(0, 500) : '',
      gender: member.gender || 'L',
      status: member.isFrozen || member.status === 'FREEZE' ? 'FREEZE' : member.expired && new Date(member.expired) >= new Date() ? 'Aktif' : 'Kadaluarsa',
      isFrozen: Boolean(member.isFrozen),
      freezeStartDate: member.freezeStartDate || '',
      freezeEndDate: member.freezeEndDate || member.freezePlannedEndDate || '',
      freezeReason: member.freezeReason || '',
      lastFreezeRecordId: member.lastFreezeRecordId || '',
      joinDate: member.joinDate ? String(member.joinDate).slice(0, 50) : '',
      notes: member.notes ? String(member.notes).slice(0, 300) : '',
      updatedAt: new Date().toISOString()
    };
    await setDoc(doc(db, COLLECTIONS.MEMBERS, member.id), payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteMemberFromFirestore(memberId: string): Promise<void> {
  if (!auth.currentUser) return;
  const path = `${COLLECTIONS.MEMBERS}/${memberId}`;
  try {
    await deleteDoc(doc(db, COLLECTIONS.MEMBERS, memberId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribeMembers(
  onData: (members: Member[]) => void,
  onError?: (err: unknown) => void
): () => void {
  // Only attach onSnapshot listeners if auth is ready and user is authenticated
  if (!auth.currentUser) {
    return () => {};
  }
  const path = COLLECTIONS.MEMBERS;
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const items: Member[] = [];
      snapshot.forEach((d) => {
        items.push(d.data() as Member);
      });
      if (items.length > 0) {
        onData(items);
      }
    },
    (error) => {
      console.warn('Firestore Members Subscribe Notice:', error.message);
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

// 2. Transactions Cloud Operations
export async function saveTransactionToFirestore(trx: Transaction): Promise<void> {
  if (!auth.currentUser) return;
  const path = `${COLLECTIONS.TRANSACTIONS}/${trx.id}`;
  try {
    const payload = {
      id: String(trx.id),
      date: String(trx.date || '').slice(0, 50),
      time: String(trx.time || '').slice(0, 50),
      type: String(trx.type || 'Membership').slice(0, 50),
      desc: String(trx.desc || '').slice(0, 200),
      customer: String(trx.customer || '').slice(0, 150),
      amount: Math.max(0, Number(trx.amount || 0)),
      amountPaid: Number(trx.amountPaid || trx.amount || 0),
      amountRemaining: Number(trx.amountRemaining || 0),
      method: String(trx.method || 'Tunai').slice(0, 50),
      status: String(trx.status || 'Paid').slice(0, 50),
      cashier: String(trx.cashier || 'Kasir').slice(0, 150),
      picId: trx.picId ? String(trx.picId) : '',
      picNames: trx.picNames ? String(trx.picNames) : '',
      createdAt: new Date().toISOString()
    };
    await setDoc(doc(db, COLLECTIONS.TRANSACTIONS, trx.id), payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export function subscribeTransactions(
  onData: (transactions: Transaction[]) => void,
  onError?: (err: unknown) => void
): () => void {
  // Only attach onSnapshot listeners if auth is ready and user is authenticated
  if (!auth.currentUser) {
    return () => {};
  }
  const path = COLLECTIONS.TRANSACTIONS;
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const items: Transaction[] = [];
      snapshot.forEach((d) => {
        items.push(d.data() as Transaction);
      });
      if (items.length > 0) {
        onData(items);
      }
    },
    (error) => {
      console.warn('Firestore Transactions Subscribe Notice:', error.message);
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

// 3. Attendances Cloud Operations
export async function saveAttendanceToFirestore(att: Attendance): Promise<void> {
  if (!auth.currentUser) return;
  const path = `${COLLECTIONS.ATTENDANCES}/${att.id}`;
  try {
    const payload = {
      id: String(att.id),
      date: String(att.date || '').slice(0, 50),
      timeIn: String(att.timeIn || '').slice(0, 50),
      timeOut: att.timeOut ? String(att.timeOut).slice(0, 50) : '',
      memberId: att.memberId ? String(att.memberId) : '',
      memberName: String(att.memberName || '').slice(0, 150),
      type: String(att.type || 'Reguler').slice(0, 50),
      badge: String(att.badge || '').slice(0, 50)
    };
    await setDoc(doc(db, COLLECTIONS.ATTENDANCES, att.id), payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export function subscribeAttendances(
  onData: (attendances: Attendance[]) => void,
  onError?: (err: unknown) => void
): () => void {
  // Only attach onSnapshot listeners if auth is ready and user is authenticated
  if (!auth.currentUser) {
    return () => {};
  }
  const path = COLLECTIONS.ATTENDANCES;
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const items: Attendance[] = [];
      snapshot.forEach((d) => {
        items.push(d.data() as Attendance);
      });
      if (items.length > 0) {
        onData(items);
      }
    },
    (error) => {
      console.warn('Firestore Attendances Subscribe Notice:', error.message);
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

// 4. Leads Cloud Operations
export async function saveLeadToFirestore(lead: Lead): Promise<void> {
  if (!auth.currentUser) return;
  const path = `${COLLECTIONS.LEADS}/${lead.id}`;
  try {
    const payload = {
      id: String(lead.id),
      name: String(lead.name || '').slice(0, 150),
      phone: String(lead.phone || '').slice(0, 30),
      status: String(lead.status || 'Baru').slice(0, 50),
      source: lead.source ? String(lead.source).slice(0, 50) : 'Walk-in',
      notes: lead.notes ? String(lead.notes).slice(0, 300) : '',
      picId: lead.picId ? String(lead.picId) : '',
      date: lead.date ? String(lead.date) : ''
    };
    await setDoc(doc(db, COLLECTIONS.LEADS, lead.id), payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// 5. Branches Cloud Operations
export async function saveBranchToFirestore(branch: GymBranch): Promise<void> {
  if (!auth.currentUser) return;
  const path = `${COLLECTIONS.BRANCHES}/${branch.id}`;
  try {
    await setDoc(doc(db, COLLECTIONS.BRANCHES, branch.id), branch, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteBranchFromFirestore(branchId: string): Promise<void> {
  if (!auth.currentUser) return;
  const path = `${COLLECTIONS.BRANCHES}/${branchId}`;
  try {
    await deleteDoc(doc(db, COLLECTIONS.BRANCHES, branchId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribeBranches(
  onData: (branches: GymBranch[]) => void,
  onError?: (err: unknown) => void
): () => void {
  if (!auth.currentUser) {
    return () => {};
  }
  const path = COLLECTIONS.BRANCHES;
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const items: GymBranch[] = [];
      snapshot.forEach((d) => {
        items.push(d.data() as GymBranch);
      });
      if (items.length > 0) {
        onData(items);
      }
    },
    (error) => {
      console.warn('Firestore Branches Subscribe Notice:', error.message);
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

// 6. Initial Data Cloud Sync
export async function seedInitialFirestoreData(
  initialMembers: Member[],
  initialTransactions: Transaction[]
): Promise<boolean> {
  if (!auth.currentUser) return false;
  try {
    // Check if members collection already has data
    const snapshot = await getDocs(query(collection(db, COLLECTIONS.MEMBERS), limit(1)));
    if (snapshot.empty) {
      console.log('Seeding initial gym members into Cloud Firestore...');
      for (const m of initialMembers.slice(0, 10)) {
        await saveMemberToFirestore(m);
      }
      for (const t of initialTransactions.slice(0, 10)) {
        await saveTransactionToFirestore(t);
      }
      return true;
    }
    return false;
  } catch (err) {
    console.warn('Seed initial data notice (offline or permission):', err);
    return false;
  }
}
