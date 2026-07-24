import { useState, useEffect } from 'react';

export interface DashboardState {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  showCopilot: boolean;
  toggleCopilot: () => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
  selectedHospital: string;
  setSelectedHospital: (hospital: string) => void;
}

// Global state outside the hook
let globalState = {
  isSidebarOpen: true,
  showCopilot: false,
  darkMode: false,
  selectedHospital: 'Apollo City Center',
};

type Listener = () => void;
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach((listener) => listener());
}

export default function useDashboardStore(): DashboardState {
  const [, forceUpdate] = useState({});

  useEffect(() => {
    const listener = () => forceUpdate({});
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  return {
    ...globalState,
    toggleSidebar: () => {
      globalState.isSidebarOpen = !globalState.isSidebarOpen;
      notify();
    },
    toggleCopilot: () => {
      globalState.showCopilot = !globalState.showCopilot;
      notify();
    },
    toggleDarkMode: () => {
      globalState.darkMode = !globalState.darkMode;
      notify();
    },
    setSelectedHospital: (hospital: string) => {
      globalState.selectedHospital = hospital;
      notify();
    },
  };
}
