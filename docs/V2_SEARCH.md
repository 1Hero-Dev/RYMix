# RYM V2 Advanced Search & Discovery Specification

**Domain:** Marketplace Discovery  
**Code Reference:** `src/domain/rankingStrategy.ts`, `src/adapters/searchProvider.ts`

---

## 1. Search Filters
- Keyword match (Store name, item name, cuisine, ingredients)
- Category filtering (Fast Food, Traditional Algerian, Pizzeria, Grocery)
- Operating status filter (Open Now vs. All)
- Maximum delivery time
- Price tier

## 2. Multi-Factor Store Ranking
Stores are ranked dynamically using:
- **Operating Status:** Open stores receive +100 bonus; closed stores are heavily penalized (-500).
- **Customer Rating:** Up to 50 points based on validated reviews.
- **Delivery Speed:** Faster prep/transit times earn up to 40 points.
- **Active Promotions:** Stores offering deals receive a +20 promotion boost.
