# Security Specification - GymPro ERP Ultimate

## Context & Root Cause Analysis
- **Reported Errors:** 
  `{"error":"Missing or insufficient permissions.","authInfo":{"providerInfo":[]},"operationType":"list","path":"transactions"}`
  `{"error":"Missing or insufficient permissions.","authInfo":{"providerInfo":[]},"operationType":"list","path":"members"}`
- **Root Cause:** 
  The client application previously mounted real-time `onSnapshot` listeners to `/transactions` and `/members` collections immediately upon app initialization before Firebase Auth had verified authentication (`auth.currentUser == null`, `authInfo.providerInfo: []`).
  In compliance with the "Eight Pillars of Hardened Rules" (specifically Pillar 1: Default Deny All and Pillar 2: Master Gate / Request Authentication `request.auth != null`), unauthenticated access to system records is strictly forbidden.

## Collections & Access Control Matrix

| Collection | Path | Get | List | Create | Update | Delete | Constraints |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Admins** | `/admins/{adminId}` | Auth (Self/Admin) | Admin | Bootstrapped Admin | Bootstrapped Admin | Bootstrapped Admin | Restricted to bootstrapped admin (`syahmuhammadridwan@gmail.com`) & active admins |
| **Users** | `/users/{userId}` | Auth | Auth | Admin | Admin | Admin | Staff management |
| **Members** | `/members/{memberId}` | Auth | Auth | Auth + ValidMember | Auth + ValidMember | Admin | Gym membership records |
| **Transactions** | `/transactions/{trxId}` | Auth | Auth | Auth + ValidTrx | Auth + ValidTrx | Admin | POS and Membership financial transactions |
| **Attendances** | `/attendances/{attId}` | Auth | Auth | Auth + ValidAtt | Auth + ValidAtt | Admin | Check-in attendance logs |
| **Leads** | `/leads/{leadId}` | Auth | Auth | Auth + ValidLead | Auth + ValidLead | Admin | CRM prospective client pipeline |

## Client Data Fetching Rules
1. In accordance with the Firebase Integration standard:
   - **Data Fetching:** Only attach `onSnapshot` listeners if auth is ready and user is authenticated (`auth.currentUser != null`).
   - Listeners must be cleaned up if the user logs out or session is terminated.
2. All writes to Cloud Firestore are guarded by authentication checks, safely falling back to local state when running in offline or unauthenticated demo mode.
