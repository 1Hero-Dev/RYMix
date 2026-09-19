/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * RYM V2 Scheduled Orders Engine
 * Implements Sections 18 & 19 (Scheduled Orders & Dispatch Windows)
 * 
 * Invariant:
 * Scheduled orders are not dispatched immediately. They enter waiting state
 * and activate automatically when their preparation lead window arrives.
 */

export interface ScheduledTimeSlot {
  label: string; // e.g., "Aujourd'hui 12:30 - 13:00"
  isoStartTime: string;
  leadTimeMinutes: number;
}

export class SchedulingEngine {
  /**
   * Generates available delivery time slots for Ahmed Rachedi
   */
  public static getAvailableTimeSlots(): ScheduledTimeSlot[] {
    const slots: ScheduledTimeSlot[] = [];
    const now = new Date();

    // Generate slots starting 45 minutes from now up to 8 hours later
    const startHour = now.getHours();
    const currentMin = now.getMinutes();

    // Round to next 30 min block
    let nextSlotTime = new Date(now);
    nextSlotTime.setMinutes(currentMin > 30 ? 60 : 30, 0, 0);
    nextSlotTime.setTime(nextSlotTime.getTime() + 45 * 60 * 1000); // 45 min lead minimum

    for (let i = 0; i < 8; i++) {
      const slotHour = nextSlotTime.getHours();
      // Only show slots between 10:00 and 23:00 (restaurant operating hours)
      if (slotHour >= 10 && slotHour <= 22) {
        const formattedTime = nextSlotTime.toLocaleTimeString('fr-FR', {
          hour: '2-digit',
          minute: '2-digit',
        });

        slots.push({
          label: `Aujourd'hui à ${formattedTime}`,
          isoStartTime: nextSlotTime.toISOString(),
          leadTimeMinutes: Math.round((nextSlotTime.getTime() - now.getTime()) / 60000),
        });
      }
      nextSlotTime = new Date(nextSlotTime.getTime() + 60 * 60 * 1000); // Step 1 hour
    }

    return slots;
  }

  /**
   * Evaluates if a scheduled order has entered its preparation dispatch window
   * (e.g. 25 minutes before customer delivery time)
   */
  public static isReadyForPreparation(scheduledForIso: string, prepLeadMinutes: number = 25): boolean {
    const scheduledTime = new Date(scheduledForIso).getTime();
    const now = Date.now();
    const msUntilDelivery = scheduledTime - now;

    return msUntilDelivery <= prepLeadMinutes * 60 * 1000;
  }
}
