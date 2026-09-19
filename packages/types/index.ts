// This package holds shared TypeScript types representing the API contracts and Enums
// These types should map closely to the Prisma schema to ensure frontend-backend alignment.

export enum Role {
  CUSTOMER = 'CUSTOMER',
  COURIER = 'COURIER',
  MERCHANT_STAFF = 'MERCHANT_STAFF',
  MERCHANT_OWNER = 'MERCHANT_OWNER',
  ADMIN_SUPPORT = 'ADMIN_SUPPORT',
  ADMIN_OPERATIONS = 'ADMIN_OPERATIONS',
  SUPER_ADMIN = 'SUPER_ADMIN'
}

export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PREPARING = 'PREPARING',
  READY = 'READY',
  ASSIGNED = 'ASSIGNED',
  PICKED_UP = 'PICKED_UP',
  DELIVERING = 'DELIVERING',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED'
}

export interface User {
  id: string;
  phone: string;
  name?: string;
  role: Role;
}
