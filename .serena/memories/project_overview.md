# Project Overview: TantanLay

## Purpose
TantanLay is a mobile sales management application built for small businesses to track products, manage inventory, create sales records, and generate invoices. It provides a comprehensive solution for product management, customer records, and sales tracking with PDF invoice generation.

## Tech Stack
- **Framework**: Expo 53 with React Native 0.79.2
- **Language**: TypeScript with strict type checking
- **State Management**: Zustand store for global state
- **Database**: SQLite via expo-sqlite for local data persistence
- **Navigation**: Expo Router with file-based routing and bottom tab navigation
- **Forms**: React Hook Form with Yup validation
- **PDF Generation**: expo-print for invoice generation
- **UI Framework**: Custom themed components with light/dark mode support

## Key Dependencies
- React 19.0.0 / React Native 0.79.2
- Expo SDK 53
- expo-sqlite for database
- zustand for state management
- react-hook-form + yup for forms
- expo-router for navigation
- expo-print for PDF generation
- Various expo modules (constants, file-system, haptics, etc.)

## Core Features
1. Product inventory management with stock tracking
2. Customer management with contact details
3. Sales creation with automatic stock updates
4. PDF invoice generation and sharing
5. Sales history and reporting
6. Custom product support (non-inventory items)
7. Data migration from AsyncStorage to SQLite