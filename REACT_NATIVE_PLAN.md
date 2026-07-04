# DODAGO React Native — Execution Plan

## Goal
React Native app (Android + iOS) with EXACT same UI/UX as web app mobile view.
Same backend, same database. Web app continues running alongside.
Performance = Swiggy/Zomato level. Play Store ready.

## 🚫 STRICT RULES — NEVER BREAK THESE
1. **Pixel-perfect UI copy** — React Native app ka har screen, button, color, spacing, font, animation EXACTLY web app mobile view jaisa hona chahiye. Ek pixel bhi change nahi.
2. **Same images & logos** — Web app me jo bhi images, logos, icons use hue hain, wahi exact files/assets React Native me bhi use honge. Koi naya image nahi banega.
3. **Same colors & theme** — Web app ka color palette, gradient, shadow, border-radius sab exactly same.
4. **Same typography** — Web app me jo font-family, font-size, font-weight hai wahi React Native me bhi.
5. **No UI "improvements"** — Chahe kuch UI element web me behtar ho sakta hai, lekin change nahi karna. Exact copy hona chahiye.
6. **No backend changes** — Backend me ek line bhi code change nahi hoga. Naye endpoints nahi banenge.
7. **No database changes** — Database schema, tables, columns kuch nahi badlega.
8. **Web app chalte rahna chahiye** — Web app (dodago.shop) pe koi asar nahi padega.

---

## Phase 1: Foundation
```
[ ] 1.1 Create Expo project
[ ] 1.2 Setup React Navigation (Stack + Bottom Tab)
[ ] 1.3 Setup Redux Toolkit (same slices as web)
[ ] 1.4 Setup API service (Axios, same endpoints)
[ ] 1.5 Setup Socket.IO client
[ ] 1.6 Setup NativeWind (Tailwind for RN)
[ ] 1.7 Folder structure banao
```

## Phase 2: Auth Screens (Web Copy)
```
[ ] 2.1 Splash Screen
[ ] 2.2 Login Screen (email + password)
[ ] 2.3 Signup Screen
[ ] 2.4 OTP Verification Screen
[ ] 2.5 Forgot Password Screen
[ ] 2.6 Google/Facebook OAuth (if needed)
```

## Phase 3: Main App — Customer Side
```
[ ] 3.1 Home Screen (featured restaurants, ads, categories)
[ ] 3.2 Restaurant List Screen
[ ] 3.3 Restaurant Menu Screen (with side dishes, notes)
[ ] 3.4 Cart Screen
[ ] 3.5 Checkout Screen
[ ] 3.6 Order Confirmation Screen
[ ] 3.7 Order History Screen
[ ] 3.8 Order Tracking (Live Map) Screen
[ ] 3.9 Profile Screen
[ ] 3.10 Address Management Screen
[ ] 3.11 Favorites Screen
[ ] 3.12 Reviews & Ratings Screen
[ ] 3.13 Search Screen
[ ] 3.14 Notifications Screen
```

## Phase 4: Rider App
```
[ ] 4.1 Rider Dashboard (available orders)
[ ] 4.2 Active Delivery Screen (with navigation)
[ ] 4.3 Delivery History Screen
[ ] 4.4 Earnings Screen
[ ] 4.5 Rider Profile Screen
```

## Phase 5: Vendor App
```
[ ] 5.1 Vendor Dashboard (orders overview)
[ ] 5.2 Order Management (accept/reject/prepare)
[ ] 5.3 Menu Management (add/edit items)
[ ] 5.4 Earnings & Reports Screen
[ ] 5.5 Vendor Profile Screen
```

## Phase 6: Admin App
```
[ ] 6.1 Admin Dashboard
[ ] 6.2 User Management Screen
[ ] 6.3 Restaurant Management Screen
[ ] 6.4 Order Management Screen
[ ] 6.5 Featured & Ads Management
```

## Phase 7: Real-Time Features
```
[ ] 7.1 Chat Screen (Customer ↔ Rider/Vendor)
[ ] 7.2 Live Order Status Updates (Socket.IO)
[ ] 7.3 Rider Live Location on Map
[ ] 7.4 Push Notifications (Firebase FCM)
```

## Phase 8: Performance Optimization
```
[ ] 8.1 FlatList virtualization (all lists)
[ ] 8.2 FastImage for image caching
[ ] 8.3 MMKV for fast local storage
[ ] 8.4 Redux Persist (cart, auth state)
[ ] 8.5 Lazy loading screens
[ ] 8.6 Memoization (React.memo, useMemo)
[ ] 8.7 Network caching (offline support)
```

## Phase 9: Payments
```
[ ] 9.1 Razorpay SDK integration
[ ] 9.2 COD option
[ ] 9.3 Payment success/failure handling
```

## Phase 10: Polish & Play Store
```
[ ] 10.1 App Icon + Splash Screen
[ ] 10.2 Deep Linking (order tracking links)
[ ] 10.3 Error boundaries + crash reporting
[ ] 10.4 Accessibility
[ ] 10.5 App signing (keystore)
[ ] 10.6 EAS Build for Android
[ ] 10.7 Play Store listing (screenshots, description)
[ ] 10.8 Submit for review
```

---

## Libraries to Use
| Purpose | Library |
|---|---|
| Framework | Expo SDK 52+ |
| Navigation | @react-navigation/native v7 |
| Styling | NativeWind v4 (Tailwind) |
| State | Redux Toolkit + Persist |
| Maps | react-native-maps |
| Images | react-native-fast-image |
| Storage | MMKV |
| Icons | lucide-react-native |
| Charts | victory-native |
| Push | @react-native-firebase/messaging |
| Payments | razorpay-react-native |
| Socket | socket.io-client |
| HTTP | axios |
| Animations | react-native-reanimated |

---

## Total Effort
- **Duration:** ~6-7 weeks (1 developer full-time)
- **Backend changes:** ZERO
- **Web app impact:** ZERO
- **Delivery:** APK/AAB ready for Play Store


## 🚫 STRICT RULES — NEVER BREAK THESE
1. **Pixel-perfect UI copy** — React Native app ka har screen, button, color, spacing, font, animation EXACTLY web app mobile view jaisa hona chahiye. Ek pixel bhi change nahi.
2. **Same images & logos** — Web app me jo bhi images, logos, icons use hue hain, wahi exact files/assets React Native me bhi use honge. Koi naya image nahi banega.
3. **Same colors & theme** — Web app ka color palette, gradient, shadow, border-radius sab exactly same.
4. **Same typography** — Web app me jo font-family, font-size, font-weight hai wahi React Native me bhi.
5. **No UI "improvements"** — Chahe kuch UI element web me behtar ho sakta hai, lekin change nahi karna. Exact copy hona chahiye.
6. **No backend changes** — Backend me ek line bhi code change nahi hoga. Naye endpoints nahi banenge.
7. **No database changes** — Database schema, tables, columns kuch nahi badlega.
8. **Web app chalte rahna chahiye** — Web app (dodago.shop) pe koi asar nahi padega.
