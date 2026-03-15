import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface UiState {
  sidebarOpen: boolean;
  theme: "light" | "dark" | "system";
  selectedCalendarDate: string | null;
  calendarMonth: number; // 1-12
  calendarYear: number;
  selectedPlanId: string | null; // which plan the dashboard/calendar is scoped to
}

const now = new Date();

const initialState: UiState = {
  sidebarOpen: true,
  theme: "system",
  selectedCalendarDate: null,
  calendarMonth: now.getMonth() + 1,
  calendarYear: now.getFullYear(),
  selectedPlanId: null,
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    toggleSidebar(state) {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen(state, action: PayloadAction<boolean>) {
      state.sidebarOpen = action.payload;
    },
    setTheme(state, action: PayloadAction<"light" | "dark" | "system">) {
      state.theme = action.payload;
    },
    setSelectedCalendarDate(state, action: PayloadAction<string | null>) {
      state.selectedCalendarDate = action.payload;
    },
    setCalendarMonth(state, action: PayloadAction<{ month: number; year: number }>) {
      state.calendarMonth = action.payload.month;
      state.calendarYear = action.payload.year;
    },
    setSelectedPlanId(state, action: PayloadAction<string | null>) {
      state.selectedPlanId = action.payload;
    },
  },
});

export const {
  toggleSidebar,
  setSidebarOpen,
  setTheme,
  setSelectedCalendarDate,
  setCalendarMonth,
  setSelectedPlanId,
} = uiSlice.actions;
export default uiSlice.reducer;
