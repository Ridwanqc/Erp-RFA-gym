/**
 * Data sync service stubs for RFA GYM ERP
 * (Firestore removed in favor of PostgreSQL + Dokploy)
 */

export const saveMemberToFirestore = async (_m: any): Promise<void> => {};
export const saveTransactionToFirestore = async (_t: any): Promise<void> => {};
export const saveAttendanceToFirestore = async (_a: any): Promise<void> => {};
export const saveLeadToFirestore = async (_l: any): Promise<void> => {};
export const saveReservationToFirestore = async (_r: any): Promise<void> => {};
export const saveBranchToFirestore = async (_b: any): Promise<void> => {};
export const deleteBranchFromFirestore = async (_id: string): Promise<void> => {};

export const subscribeMembers = (_callback: (members: any[]) => void, _errorCallback?: any) => {
  return () => {};
};

export const subscribeTransactions = (_callback: (transactions: any[]) => void, _errorCallback?: any) => {
  return () => {};
};

export const subscribeReservations = (_callback: (reservations: any[]) => void, _errorCallback?: any) => {
  return () => {};
};

export const subscribeBranches = (_callback: (branches: any[]) => void) => {
  return () => {};
};

export const seedInitialFirestoreData = async (_members?: any[], _transactions?: any[]): Promise<void> => {};
