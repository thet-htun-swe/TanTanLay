# 📋 TODO List – Invoicing App with Expo

This is the development checklist for a mobile invoicing app built with Expo (React Native).

---

## ✅ Initial Setup

- [ ] Initialize Expo app: `npx create-expo-app invoicing-app`
- [ ] Set up TypeScript (optional but recommended)
- [ ] Install essential dependencies:
  - [ ] Navigation (`@react-navigation/native`, `@react-navigation/stack`)
  - [ ] Form handling (`react-hook-form`, `yup`)
  - [ ] State management (Context API or Zustand/Recoil)
  - [ ] PDF/invoice generator (`react-native-print` or external API)
  - [ ] Local DB/storage (`expo-sqlite` or `AsyncStorage`)

---

## 🛒 Product Management

- [ ] Create Product data model: `id`, `name`, `price`, `sku`, `stockQty`
- [ ] Create UI to:
  - [ ] Add new product
  - [ ] Edit product
  - [ ] Delete product
- [ ] Store products locally (SQLite or AsyncStorage)
- [ ] Add validation for product form

---

## 🧾 Sale Voucher Form

- [ ] Build form to:
  - [ ] Select one or more products from inventory
  - [ ] Specify quantity and optional discount
  - [ ] Add customer info (name, contact)
- [ ] Auto-calculate:
  - [ ] Line total per product
  - [ ] Subtotal, tax, total
- [ ] Use react-hook-form for input validation
- [ ] Save transaction data locally with unique ID and timestamp

---

## 🧾 Invoice Generation

- [ ] Design invoice layout (company name/logo, products, totals, etc.)
- [ ] Use `react-native-print`, `react-native-html-to-pdf`, or custom template for generating invoice
- [ ] Allow invoice preview and download/share as PDF

---

## 📂 Transaction History

- [ ] Create list view for past transactions
- [ ] Allow filtering/search by:
  - [ ] Customer name
  - [ ] Date range
- [ ] Click into any transaction to view full invoice

---

## ✨ Nice-to-Haves

- [ ] Add dark mode support
- [ ] Export all invoices as CSV
- [ ] Cloud sync (e.g., Firebase or Supabase)
- [ ] Authentication (email/password or biometrics)
- [ ] Send invoice via WhatsApp, SMS, or Email

---

## 🧪 Testing

- [ ] Unit tests for logic and calculations
- [ ] Integration tests for form and invoice flow
- [ ] Manual test on Android & iOS devices

---

## 🚀 Deployment

- [ ] Configure app.json (name, icon, splash screen)
- [ ] Build app for Android/iOS using EAS
- [ ] Test on real devices
- [ ] Publish to Google Play / App Store (optional)

---

## 📌 Notes

- Avoid hardcoding tax rates or currency – make it configurable
- Use UUIDs for product and transaction IDs
- Consider performance for large product lists
