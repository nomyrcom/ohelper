# Security Specification for Ya Mo'een Rating System

## 1. Data Invariants

1. **Self-Rating Prevention**: A user is strictly forbidden from rating themselves.
2. **Service Completion Requirement**: A rating can only be submitted after the associated service has been transition to the `completed` state.
3. **Participant Auth**: Only the original requester and the assigned provider of a service are permitted to submit ratings.
4. **Deterministic Rating Identity**: To prevent duplicate ratings, the document ID in the `ratings` subcollection MUST match the `uid` of the rater.
5. **Point Integrity**: Points can only be transferred between users when a service is finalized by BOTH parties (handled in service update logic).
6. **Immutable Identity**: Fields like `createdAt`, `requesterId`, and `providerId` (once assigned) must remain immutable.
7. **Type Safety**: All ratings must be integers between 1 and 5.

## 2. The "Dirty Dozen" Payloads

1. **Self-Rating Attack**: User A attempts to create a rating where `fromId` == `toId` == `userA_uid`.
2. **Double Rating Attack**: User A attempts to create a second rating doc for the same service using a random ID instead of their `uid`.
3. **Incomplete Service Rating**: User A attempts to rate User B while the service status is still `active`.
4. **Impersonation Rating**: User A attempts to submit a rating with `fromId` set to `userC_uid`.
5. **Rating Injection**: User A attempts to set a rating of `99` stars.
6. **Shadow Field Injection**: User A attempts to add an `isAdmin: true` field to their profile while updating their `name`.
7. **Point Theft**: User A attempts to directly increment their own `points` without a completed service.
8. **Rating Modification**: User A attempts to `delete` or `update` an existing rating submitted by User B.
9. **Orphaned Rating**: User A attempts to create a rating for a non-existent `serviceId`.
10. **Privilege Escalation**: User A attempts to update their own `ratingCount` or `ratingSum` directly.
11. **Spam Listing**: User A attempts to `list` all ratings in the system to scrape user reviews.
12. **Status Skipping**: Provider A attempts to move service from `active` directly to `completed` without requester confirmation.

## 3. The Test Runner (Mock Logic)

The following tests must pass:
- `create /services/S1/ratings/U1` where `fromId=U1, toId=U2` -> **ALLOWED** (if S1 is completed)
- `create /services/S1/ratings/U1` where `fromId=U1, toId=U1` -> **DENIED**
- `update /users/U2` (increment ratingCount) by `U1` -> **ALLOWED**
- `update /users/U2` (set points to 1000) by `U2` -> **DENIED** (only admins or specific service logic can touch points)
