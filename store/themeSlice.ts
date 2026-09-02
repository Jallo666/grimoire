import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type Theme = "light" | "dark";

const themeSlice = createSlice({
  name: "theme",
  initialState: { value: "light" as Theme },
  reducers: {
    setTheme(state, action: PayloadAction<Theme>) {
      state.value = action.payload;
    },
  },
});

export const { setTheme } = themeSlice.actions;
export default themeSlice.reducer;
