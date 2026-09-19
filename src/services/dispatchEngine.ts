/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Dispatch Policy & Fulfillment Business Rules (Compatibility Layer)
 * 
 * SINGLE ARCHITECTURAL OWNER:
 * - Real-time dispatch decisions, candidate spatial ranking, courier scoring,
 *   active assignment, and route sequencing are authoritatively owned by the
 *   Go Realtime Service (`services/realtime-dispatch/dispatch`).
 * - Business policies, eligibility rules, and capacity constraints are defined in
 *   `src/domain/deliveryPolicy.ts`.
 */

export * from '../domain/deliveryPolicy';
