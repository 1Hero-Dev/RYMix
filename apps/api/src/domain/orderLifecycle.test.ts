import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  ORDER_LIFECYCLE_RULES,
  validateOrderTransition,
  type ActorRole,
  type OrderStatus,
} from './orderLifecycle.js';

const allowed = (from: OrderStatus, to: OrderStatus, role: ActorRole) =>
  assert.equal(
    validateOrderTransition(from, to, role).valid,
    true,
    `${role} should be allowed ${from} -> ${to}`
  );

const denied = (from: OrderStatus, to: OrderStatus, role: ActorRole) =>
  assert.equal(
    validateOrderTransition(from, to, role).valid,
    false,
    `${role} must NOT be allowed ${from} -> ${to}`
  );

test('happy path: each role can perform the steps it owns', () => {
  allowed('PENDING', 'CONFIRMED', 'MERCHANT');
  allowed('CONFIRMED', 'PREPARING', 'MERCHANT');
  allowed('PREPARING', 'READY', 'MERCHANT');

  allowed('READY', 'ASSIGNED', 'COURIER');
  allowed('ASSIGNED', 'PICKED_UP', 'COURIER');
  allowed('READY', 'PICKED_UP', 'COURIER');
  allowed('PICKED_UP', 'DELIVERING', 'COURIER');
  allowed('DELIVERING', 'ARRIVED', 'COURIER');
  allowed('DELIVERING', 'DELIVERED', 'COURIER');
  allowed('ARRIVED', 'DELIVERED', 'COURIER');

  allowed('ARRIVED', 'CUSTOMER_CONFIRMED', 'CUSTOMER');
});

test('only the customer can record their own confirmation, and only after arrival', () => {
  denied('DELIVERING', 'CUSTOMER_CONFIRMED', 'CUSTOMER'); // courier has not arrived yet
  denied('DELIVERING', 'CUSTOMER_CONFIRMED', 'COURIER'); // a courier cannot confirm on the customer's behalf
  denied('ARRIVED', 'CUSTOMER_CONFIRMED', 'COURIER');
});

test('a customer cannot accept their own order (skipping the merchant)', () => {
  denied('PENDING', 'CONFIRMED', 'CUSTOMER');
});

test('a customer cannot mark an order delivered (this settles the payment)', () => {
  denied('ARRIVED', 'DELIVERED', 'CUSTOMER');
  denied('CUSTOMER_CONFIRMED', 'DELIVERED', 'CUSTOMER');
  denied('DELIVERING', 'DELIVERED', 'CUSTOMER');
});

test('a merchant cannot perform courier steps', () => {
  denied('READY', 'ASSIGNED', 'MERCHANT');
  denied('READY', 'PICKED_UP', 'MERCHANT');
  denied('DELIVERING', 'DELIVERED', 'MERCHANT');
});

test('a courier cannot perform merchant steps', () => {
  denied('PENDING', 'CONFIRMED', 'COURIER');
  denied('PREPARING', 'READY', 'COURIER');
});

test('cancellation is refused on the generic transition path for non-admins', () => {
  // It must go through POST /orders/:id/cancel so evaluateCancellationPolicy applies.
  denied('PENDING', 'CANCELLED', 'CUSTOMER');
  denied('PENDING', 'CANCELLED', 'MERCHANT');
  denied('READY', 'CANCELLED', 'COURIER');
  denied('DELIVERING', 'CANCELLED', 'COURIER');
});

test('admin keeps the override, but only along legal edges', () => {
  allowed('PENDING', 'CANCELLED', 'ADMIN');
  allowed('DELIVERING', 'DELIVERED', 'ADMIN');
  denied('PENDING', 'DELIVERED', 'ADMIN'); // still cannot skip the machine
});

test('terminal states cannot be left by anyone', () => {
  for (const role of ['CUSTOMER', 'MERCHANT', 'COURIER', 'ADMIN', 'SYSTEM'] as ActorRole[]) {
    denied('DELIVERED', 'PENDING', role);
    denied('CANCELLED', 'PENDING', role);
  }
});

test('unknown statuses are rejected rather than crashing', () => {
  const result = validateOrderTransition('BOGUS' as OrderStatus, 'PENDING', 'ADMIN');
  assert.equal(result.valid, false);
});

// Regression guard. The state machine once defined ARRIVED and CUSTOMER_CONFIRMED
// while the database enum did not, so a courier tapping "arrived" passed
// validation and then failed inside Prisma with a 500.
test('every lifecycle status exists in the Prisma OrderStatus enum', () => {
  const schemaPath = fileURLToPath(new URL('../../prisma/schema.prisma', import.meta.url));
  const schema = readFileSync(schemaPath, 'utf-8');
  const block = /enum OrderStatus \{([^}]*)\}/.exec(schema);
  assert.ok(block, 'OrderStatus enum not found in schema.prisma');

  const dbStatuses = new Set(
    block[1]!
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('//'))
  );

  const missing = Object.keys(ORDER_LIFECYCLE_RULES).filter((s) => !dbStatuses.has(s));
  assert.deepEqual(missing, [], `statuses missing from the database enum: ${missing.join(', ')}`);
});
