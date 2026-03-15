import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import studyPlanReducer from "./slices/studyPlanSlice";
import mockTestReducer from "./slices/mockTestSlice";
import uiReducer from "./slices/uiSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    studyPlan: studyPlanReducer,
    mockTest: mockTestReducer,
    ui: uiReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
