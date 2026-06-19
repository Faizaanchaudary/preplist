import { create } from "zustand";

const useSidebarStore = create((set) => ({
  isExpanded: true,
  isMobileOpen: false,

  toggleSidebar: () =>
    set((state) => ({
      isExpanded: !state.isExpanded,
    })),

  setExpanded: (value) =>
    set({
      isExpanded: Boolean(value),
    }),

  openMobileSidebar: () =>
    set({
      isMobileOpen: true,
    }),

  closeMobileSidebar: () =>
    set({
      isMobileOpen: false,
    }),

  toggleMobileSidebar: () =>
    set((state) => ({
      isMobileOpen: !state.isMobileOpen,
    })),
}));

export default useSidebarStore;