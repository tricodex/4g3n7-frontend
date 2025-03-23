import { create } from 'zustand'

// Define types for our store
interface AvatarState {
  isSpeaking: boolean
  setIsSpeaking: (isSpeaking: boolean) => void
  toggleSpeaking: () => void
  mouthOpenPercentage: number
  setMouthOpenPercentage: (percentage: number) => void
}

// Create store
export const useAvatarStore = create<AvatarState>((set) => ({
  isSpeaking: false,
  setIsSpeaking: (isSpeaking) => set({ isSpeaking }),
  toggleSpeaking: () => set((state) => {
    console.log("AvatarStore: Toggling speaking state from", state.isSpeaking, "to", !state.isSpeaking);
    return { isSpeaking: !state.isSpeaking };
  }),
  mouthOpenPercentage: 0,
  setMouthOpenPercentage: (percentage) => set({ mouthOpenPercentage: Math.max(0, Math.min(100, percentage)) }),
}))

// If in browser environment, attach store to window for debugging
if (typeof window !== 'undefined') {
  // @ts-ignore
  window.__AVATAR_STORE__ = useAvatarStore;
}
