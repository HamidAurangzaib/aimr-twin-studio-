
import React, { useState, useEffect } from 'react';
// @ts-ignore
import { deleteUser, signOut } from 'firebase/auth';
// Fix: Import User as a type to resolve "no exported member" compiler errors
// @ts-ignore
import type { User } from 'firebase/auth';
import { doc, getDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

interface UserProfile {
  name: string;
  email: string;
  photoFileName: string;
}

interface ProfileProps {
  user: User;
  onClose: () => void;
}

const Profile: React.FC<ProfileProps> = ({ user, onClose }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const data = userSnap.data() as UserProfile;
          setProfile(data);
          setNewName(data.name);
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
        setError("Failed to load profile.");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user.uid]);

  const handleUpdate = async () => {
    if (!newName.trim()) return;
    setLoading(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        name: newName,
        updatedAt: serverTimestamp(),
      });
      setProfile(prev => prev ? { ...prev, name: newName } : null);
      setIsEditing(false);
    } catch (err) {
      setError("Failed to update name.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm("ARE YOU ABSOLUTELY SURE? This will permanently delete your twin profile, account, and all associated data. This action cannot be undone.")) return;
    
    setIsDeleting(true);
    try {
      // 1. Delete Firestore Record
      await deleteDoc(doc(db, 'users', user.uid));
      
      // 2. Delete Auth Account
      await deleteUser(user);
      
      // 3. Sign Out just in case
      await signOut(auth);
    } catch (err: any) {
      console.error("Error deleting account:", err);
      if (err.code === 'auth/requires-recent-login') {
        setError("For security, please sign out and sign back in before deleting your account.");
      } else {
        setError("Failed to delete account. Please try again.");
      }
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading && !profile) return <div className="p-8 text-center text-brand-gold animate-pulse font-black uppercase tracking-widest text-xs">Scanning Profile...</div>;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-brand-charcoal/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-brand-surface rounded-[2.5rem] border border-white/5 shadow-2xl p-8 relative overflow-hidden">
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 text-brand-muted hover:text-brand-gold transition-colors z-10"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className="text-3xl font-serif font-black text-brand-gold mb-8 uppercase tracking-[0.2em] text-center">Studio Profile</h2>

        <div className="space-y-8 relative z-0">
          <div className="text-center">
            <div className="w-24 h-24 bg-brand-gold/10 rounded-full flex items-center justify-center border border-brand-gold/30 mx-auto mb-4">
               <span className="text-4xl font-serif font-bold text-brand-gold">
                 {profile?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}
               </span>
            </div>
            {isEditing ? (
              <div className="space-y-4">
                <input 
                  type="text" 
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full p-4 bg-brand-charcoal border border-white/10 rounded-2xl text-brand-text text-center focus:outline-none focus:ring-1 focus:ring-brand-gold/50"
                  placeholder="Studio Name"
                />
                <div className="flex gap-2">
                   <button 
                    onClick={handleUpdate}
                    className="flex-1 py-3 bg-brand-gold text-brand-charcoal font-black rounded-xl hover:bg-white transition-all text-[10px] uppercase tracking-widest"
                  >
                    Save Changes
                  </button>
                  <button 
                    onClick={() => setIsEditing(false)}
                    className="flex-1 py-3 border border-white/10 text-brand-muted rounded-xl hover:text-brand-text transition-all text-[10px] uppercase tracking-widest"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                <h3 className="text-2xl font-black text-brand-text uppercase tracking-tight">{profile?.name || "Premium User"}</h3>
                <p className="text-brand-muted text-[10px] font-bold uppercase tracking-widest">{profile?.email || user.email}</p>
                <button 
                  onClick={() => setIsEditing(true)}
                  className="text-brand-gold text-[10px] font-black uppercase tracking-[0.2em] mt-4 hover:underline"
                >
                  Edit Studio Profile
                </button>
              </div>
            )}
          </div>

          <div className="pt-8 border-t border-white/5 space-y-4">
            <div className="bg-brand-charcoal/30 p-4 rounded-2xl border border-white/5">
               <p className="text-[10px] font-black text-brand-muted uppercase tracking-widest mb-1 opacity-50">Last Uploaded Sync</p>
               <p className="text-xs text-brand-text italic font-medium">
                 {profile?.photoFileName || "No studio source synced yet."}
               </p>
            </div>

            {error && (
              <div className="bg-red-900/10 border border-red-900/20 py-3 px-4 rounded-xl text-[10px] font-bold text-red-400 text-center uppercase tracking-tighter">
                {error}
              </div>
            )}

            <button 
              onClick={handleDeleteAccount}
              disabled={isDeleting}
              className="w-full py-4 text-red-400/40 hover:text-red-400 text-[10px] font-black uppercase tracking-[0.2em] transition-colors mt-8"
            >
              {isDeleting ? "Deactivating Studio..." : "Delete Account Permanently"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
