import { create } from "zustand";

interface Profile {
  username?: string;

  email?: string;

  streak?: number;

  longestStreak?: number;
}

interface AuthStore {
  user: any;

  profile: Profile | null;

  loading: boolean;

  setUser: (u: any) => void;

  setProfile: (p: Profile | null) => void;

  setLoading: (v: boolean) => void;
}

export const useAuthStore =
create<AuthStore>((set)=>({

  user: undefined,

  profile: null,

  loading:true,

  setUser:(user)=>
  set({
    user
  }),

  setProfile:(profile)=>
  set({
    profile
  }),

  setLoading:(loading)=>
  set({
    loading
  })

}));