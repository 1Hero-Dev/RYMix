# RYM V2 Recommendations & Customer Personalization Specification

**Domain:** Customer Experience & Reordering  
**Code Reference:** `src/domain/recommendationsEngine.ts`

---

## 1. Features
- **Favorite Stores:** Fast bookmarking saved locally and synchronized across sessions.
- **Popular & Trending Dishes:** Filtered by actual order frequency in Ahmed Rachedi.
- **Safe Reorder:** Re-populates the cart from an existing past order.

## 2. Safe Reorder Invariant
Reordering NEVER blindly duplicates historical items or prices. It validates:
1. Store is currently open.
2. Items still exist in the current store menu.
3. Items are marked `isAvailable == true`.
4. Prices are refreshed to current authoritative prices.
5. If an item was discontinued, the customer is notified and the remaining available items are added.
