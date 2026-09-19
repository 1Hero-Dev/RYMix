# Performance Budget & Optimization Specification — RYM Platform

**Version:** 1.0.0  
**Target Environment:** Algerian Mobile Data Networks (3G / 4G) & Low-Mid Range Android Devices

---

## 1. Performance Budgets

| Metric | V1 Budget | Target Result | Strategy / Enforcement |
|---|---|---|---|
| **Initial JS Bundle (Gzipped)** | < 180 KB | ~120 KB | Tree-shaking, dynamic imports, modular components |
| **First Contentful Paint (FCP)** | < 1.5s on 4G | ~1.1s | `essentialHomeData.ts` inline initial feed |
| **Time to Interactive (TTI)** | < 2.5s on 3G | ~1.8s | Deferred Leaflet map mounting until tracking view |
| **Discovery Image Payload** | < 25 KB per thumbnail | 8–18 KB | WebP compression, `w=300&fm=webp&q=75`, LazyImage |
| **Courier GPS Network Usage** | < 15 KB / minute | ~4.5 KB / min | Adaptive interval (7–25s) + 10m deadband |
| **WebSocket Ephemeral Traffic** | Room targeted only | Minimal | No global broadcasts; only subscribed order room |
| **Database Query Efficiency** | 0 N+1 queries | Single joins | Prisma snapshots on `OrderItem` |

---

## 2. Key Optimization Mechanisms

### A. Responsive WebP Image Pipeline
- Components never load raw high-resolution photography.
- `LazyImage` wraps all store logos, banners, and food items.
- Uses `IntersectionObserver` with a `250px` root margin for smooth viewport pre-fetching.
- Automatically generates responsive `srcSet` for `320w`, `640w`, and `960w` viewports.

### B. Event Listener Throttling & CPU Management
- Drag-to-scroll carousels dynamically attach `mousemove` and `mouseup` listeners *only* during active pointer interaction, completely preventing passive idle event loops.
- `window.getComputedStyle` queries are guarded behind geometric checks (`scrollWidth > clientWidth`).

### C. Adaptive GPS Telemetry
- Couriers emit coordinates only when required:
  - Idle/Waiting: 25s.
  - In Transit: 7s.
  - Approaching destination (<300m): 3.5s.
  - Movement < 10m: Broadcast suppressed.
