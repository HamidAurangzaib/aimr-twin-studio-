
import { 
  // @ts-ignore
  onAuthStateChanged, 
  // @ts-ignore
  sendPasswordResetEmail as firebaseSendPasswordResetEmail
} from "firebase/auth";
// Import User as a type to resolve "no exported member" errors in some configurations
// @ts-ignore
import type { User } from "firebase/auth";
import { auth, persistencePromise } from "./firebase";

/**
 * authReady mechanism
 * Resolves with the User object (or null) as soon as the initial auth state is determined.
 */
let resolveAuth: (value: User | null) => void;
export const authReady = new Promise<User | null>((resolve) => {
  resolveAuth = resolve;
});

/**
 * Single Global Auth Listener
 * Centralized tracking of auth state
 */
let isInitialStateKnown = false;
persistencePromise.then(() => {
  onAuthStateChanged(auth, (user: User | null) => {
    if (!isInitialStateKnown) {
      isInitialStateKnown = true;
      resolveAuth(user);
    }
  });
});

/**
 * User-friendly Error Mapper
 */
export const mapAuthError = (code: string): string => {
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/invalid-email':
      return "Password or email incorrect";
    case 'auth/user-not-found':
      return "Account not found";
    case 'auth/too-many-requests':
      return "Too many attempts, try again later";
    case 'auth/network-request-failed':
      return "Network error. Please try again.";
    default:
      return "Something went wrong. Please try again.";
  }
};

/**
 * Enhanced Password Reset with Error Logging
 */
export const sendPasswordResetEmail = async (email: string) => {
  try {
    await firebaseSendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (error: any) {
    console.group("Studio Auth: Password Reset Failure");
    console.error("Error Code:", error.code);
    console.error("Message:", error.message);
    console.groupEnd();
    throw error;
  }
};
