import { createSlice } from "@reduxjs/toolkit";

const initialState = [];

const PlayerSlice = createSlice({
  name: "Player",
  initialState,
  reducers: {
    addPlayer: (state, action) => {
      state.push(action.payload);
    },

    // لتفريغ الاستمارة - نعيد نسخة جديدة من initialState
    resetForm: (state) => {
      return [];
    },
  },
});

export const { addPlayer, resetForm } = PlayerSlice.actions;

export const selectPlayer = (state) => state.player;

export default PlayerSlice.reducer;
