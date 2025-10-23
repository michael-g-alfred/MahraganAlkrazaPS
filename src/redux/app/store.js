import { configureStore } from "@reduxjs/toolkit";
import PlayerReducer from "../features/PlayerSlice";

export const store = configureStore({
  reducer: {
    Player: PlayerReducer,
    // teamPlayer: teamPlayerReducer (هنضيفه بعدين)
  },
});
