# Bug Memory — Frontend Web Client

This is the React frontend web client for Bug Memory. It provides a visual workspace dashboard, traceback analyzer, command palette, and interactive memory graph.

---

## 🛠️ Technology Stack & Dependencies

* **Build Tool:** Vite + TypeScript
* **State & View:** React 19
* **Styling:** Vanilla CSS & Tailwind CSS (for layout structures)
* **Animations:** Framer Motion (used for custom transitions, modal overlays, and graph retirement fades)
* **Graph Canvas:** `react-force-graph-2d` (HTML5 canvas loader for 2D force-directed layout topologies)
* **Icons:** Lucide React

---

## 🚀 Getting Started & Run Commands

### 1. Installation
Install all client dependencies:

```bash
# Navigate to frontend directory
cd frontend

# Install npm packages
npm install
```

### 2. Start the Frontend Development Server
Start the Vite server, explicitly binding it to `127.0.0.1` and port `5173` to prevent routing conflicts:

```bash
npm run dev -- --host 127.0.0.1 --port 5173
```
Once loaded, open your web browser and navigate to `http://127.0.0.1:5173/`.

### 3. Production Build & Linting
To check type safety, compile bundles, and lint code:

```bash
# Lint codebase using Oxlint
npm run lint

# Build production assets
npm run build
```

---

## 🔌 API Integration

The frontend is configured to communicate with the FastAPI backend at `http://localhost:8000`. The connection functions are structured inside `src/lib/api.ts`.
To bypass Windows execution policies when launching `npm` via PowerShell, invoke the script using wrapper files: `npm.cmd run dev`.
