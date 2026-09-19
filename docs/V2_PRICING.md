# RYM V2 Dynamic Pricing Specification

**Domain:** Commerce & Financial Integrity  
**Code Reference:** `src/domain/dynamicPricingEngine.ts`, `src/domain/pricingStrategy.ts`

---

## 1. Principles
- **Strictly Server Authoritative:** The server computes all item sums, delivery fees, packaging fees, surge multipliers, discounts, and final totals.
- **Reproducible & Auditable:** Every checkout yields an `AuthoritativePriceBreakdown` with a cryptographic signature and itemized components.

## 2. Dynamic Price Breakdown Formula
```text
Total = ItemsSubtotal - DiscountDZD + DeliveryFeeDZD + PackagingFeeDZD + SmallOrderFeeDZD + PlatformServiceFeeDZD
```

Where `DeliveryFeeDZD` incorporates:
- Municipal Zone Base Fee (100 DZD in Ahmed Rachedi)
- Distance fee (for deliveries > 2.5 km)
- Demand surge multiplier (1.0x to 1.25x during peak lunch/dinner)
- Weather surcharge (0 DZD normal, +50 DZD storm)
- Late night surcharge (0 DZD normal, +50 DZD past 22:00)
- Free delivery waiver if `ItemsSubtotal >= FreeDeliveryThreshold` (2500 DZD)
