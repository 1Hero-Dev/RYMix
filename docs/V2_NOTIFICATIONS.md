# RYM V2 Advanced Notifications Specification

**Domain:** User Engagement & Operational Alerts  
**Code Reference:** `src/services/notificationService.ts`

---

## 1. Multi-Channel Support
- **In-App Alerts:** Real-time banner/toast updates for active lifecycle transitions.
- **Push Notifications:** Background alerts via FCM adapter for mobile devices.
- **Transactional SMS:** Critical SMS alerts for non-smartphone courier alerts or customer phone confirmation in Algeria.

## 2. Notification Templates
- `OrderConfirmed`: Sent to customer and merchant upon checkout.
- `CourierAssigned`: Alerts merchant that courier is en route to pickup.
- `CourierArriving`: Triggers when courier is within 300 meters of customer destination.
- `ScheduledReminder`: Reminds customer 15 minutes before scheduled delivery.
