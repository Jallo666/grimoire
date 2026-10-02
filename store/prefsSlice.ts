import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type UnitSystem = "piedi" | "metri" | "quadretti" | "";

const prefsSlice = createSlice({
  name: "prefs",
  initialState: { unitSystem: "" as UnitSystem },
  reducers: {
    setUnitSystem(state, action: PayloadAction<UnitSystem>) {
      state.unitSystem = action.payload;
    },
  },
});

export const { setUnitSystem } = prefsSlice.actions;
export default prefsSlice.reducer;
