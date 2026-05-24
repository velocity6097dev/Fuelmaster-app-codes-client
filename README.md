
---

# FuelMaster (Client Application)

FuelMaster is a robust, mobile-first management application built for fuel stations. Wrapped in **Capacitor 8**, it leverages native device capabilities while utilizing a modern **React 18** web foundation. It features real-time synchronization, secure authentication, native document scanning, and subscription-based access control.

---

## 🛠️ Tech Stack & Ecosystem

* **Frontend Framework:** React 18 (with React Router v6)
* **Native Bridge:** Capacitor 8 (iOS & Android)
* **Backend / BaaS:** Supabase (`@supabase/supabase-js`)
* **Styling & UI:** Sass (`sass`), Lucide React (`lucide-react`), Framer Motion (`framer-motion`)
* **Media & Documents:** Capgo Document Scanner, Cropper.js, jsPDF

---

## ✨ Core Features

Based on the project routing and package ecosystem, FuelMaster offers:

* **🔒 Intelligent Authentication & Access Control:**
* Session management via `AuthContext`.
* **Subscription Enforcement:** Automatically redirects inactive accounts to a `/blocked` screen.
* **Global Maintenance Mode:** Instantly routs users to `/maintenance` via `BroadcastContext` when the system is offline.


* **📊 Station Management Modules:**
* **Dashboard:** High-level overview of station metrics.
* **Density & Stocks:** Track fuel density measurements and real-time stock levels.
* **Variance:** Monitor and reconcile fuel variances.
* **Staff & Compliance:** Manage employees and ensure operational compliance.
* **Reimbursements:** Generate and manage invoices/reimbursements.


* **📱 Native Device Capabilities:**
* **Camera & Scanning:** Native document scanning (`@capgo/capacitor-document-scanner`) and advanced image cropping.
* **Hardware Interaction:** Custom Android back-button handling, Haptics, and Native Audio integration.
* **File System & Sharing:** PDF generation (`jspdf`) integrated with native sharing and file system saving.



---

## 🏗️ Application Architecture

### Routing Guards (`src/App.js`)

The application relies on a strict wrapper system to handle user state:

1. **`GlobalGuard`**: Listens to real-time broadcast events. If the system is marked as `active: true` for maintenance, it forces all traffic to the `/maintenance` screen, preventing database conflicts during updates.
2. **`ProtectedRoute`**:
* Ensures the user is authenticated (redirects to `/login` if not).
* Waits for `StationContext` to sync station data. Handles poor connectivity gracefully with a retry UI.
* Validates `subscription_status`. If a station's subscription is "inactive", access is heavily restricted.



---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed on your local machine:

* **Node.js:** v18 or higher recommended.
* **Android Studio / Xcode:** Required for building the native Capacitor apps.
* **Capacitor CLI:** Comes pre-installed in `devDependencies`.

### Installation

1. **Clone the repository and install dependencies:**
```bash
npm install

```


2. **Start the development server:**
```bash
npm start

```


*The app will run locally on `localhost:3000` in your browser.*

### Native Building & Syncing

Whenever you make changes to the React code or install a new Capacitor plugin, you must build the web assets and sync them to the native platforms:

1. **Build the React application:**
```bash
npm run build

```


2. **Sync to Capacitor (Android/iOS):**
```bash
npx cap sync

```


3. **Generate/Update Splash Screens & Icons:**
```bash
npx @capacitor/assets generate

```



---

## 📦 Available Scripts

* `npm start` - Runs the app in development mode.
* `npm run build` - Builds the app for production to the `build` folder.
* `npm test` - Launches the test runner in interactive watch mode.
* `npm run eject` - Ejects the `create-react-app` configuration (Not recommended unless strictly necessary).
