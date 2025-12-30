import { create } from "zustand";
import { AuthState } from "../types";


const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoggedIn: false,
  login: (username: string) => set({ user: username, isLoggedIn: true }),
  logout: () => set({ user: null, isLoggedIn: false }),
}));

export default useAuthStore;