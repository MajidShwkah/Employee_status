import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase, ALLOWED_EMAIL_DOMAIN } from '../lib/supabase';

// Auth Context
const AuthContext = createContext(null);

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [initialized, setInitialized] = useState(false);
  
  const isMountedRef = useRef(true);
  const hasInitializedRef = useRef(false);
  const isProcessingRef = useRef(false);

  // Validate email domain
  const isValidEmailDomain = useCallback((email) => {
    return email && email.toLowerCase().endsWith(ALLOWED_EMAIL_DOMAIN.toLowerCase());
  }, []);

  // Fetch user profile from user_profiles table
  const fetchUserProfile = useCallback(async (userId, userEmail, userMetadata = {}) => {
    if (!userId) return null;
    
    console.log('📋 Fetching profile for user:', userId);
    
    try {
      const { data: existingProfile, error: fetchError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (fetchError && fetchError.code === 'PGRST116') {
        console.log('👤 Profile not found, creating new profile...');
        
        const newProfile = {
          id: userId,
          email: userEmail,
          full_name: userMetadata.full_name || userMetadata.name || userEmail.split('@')[0],
          avatar_url: userMetadata.avatar_url || userMetadata.picture || null,
          role: 'employee',
          status: 'free',
          status_note: '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        
        const { data: createdProfile, error: createError } = await supabase
          .from('user_profiles')
          .insert(newProfile)
          .select()
          .single();
        
        if (createError) {
          console.error('❌ Error creating profile:', createError);
          return null;
        }
        
        console.log('✅ Profile created:', createdProfile?.full_name);
        return createdProfile;
      }
      
      if (fetchError) {
        console.error('❌ Error fetching profile:', fetchError);
        return null;
      }
      
      console.log('✅ Profile fetched:', existingProfile?.full_name);
      return existingProfile;
    } catch (err) {
      console.error('❌ Exception fetching profile:', err);
      return null;
    }
  }, []);

  // Process authentication - validate domain and fetch profile
  const processAuth = useCallback(async (currentSession) => {
    if (!currentSession?.user) {
      return { success: false, error: 'No session' };
    }

    // Prevent double processing
    if (isProcessingRef.current) {
      console.log('⏳ Already processing auth, skipping...');
      return { success: false, error: 'Already processing' };
    }
    
    isProcessingRef.current = true;

    const { user: authUser } = currentSession;
    console.log('🔐 Processing auth for:', authUser.email);

    try {
      // Validate email domain
      if (!isValidEmailDomain(authUser.email)) {
        console.log('🚫 Invalid email domain:', authUser.email);
        await supabase.auth.signOut();
        return { 
          success: false, 
          error: `Access Denied: Only ${ALLOWED_EMAIL_DOMAIN} emails are allowed.` 
        };
      }

      const userProfile = await fetchUserProfile(
        authUser.id, 
        authUser.email, 
        authUser.user_metadata
      );

      if (!userProfile) {
        return { success: false, error: 'Failed to load user profile. Please try again.' };
      }

      return { success: true, profile: userProfile };
    } finally {
      isProcessingRef.current = false;
    }
  }, [isValidEmailDomain, fetchUserProfile]);

  // Sign in with Google - uses separate signingIn state
  const signInWithGoogle = useCallback(async () => {
    setAuthError(null);
    setSigningIn(true);  // Use separate state for button
    
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      
      if (error) {
        console.error('❌ Google sign-in error:', error);
        setAuthError(error.message);
        setSigningIn(false);
        return { success: false, error: error.message };
      }
      
      // Don't set signingIn to false here - we're redirecting to Google
      return { success: true };
    } catch (err) {
      console.error('❌ Google sign-in exception:', err);
      setAuthError(err.message);
      setSigningIn(false);
      return { success: false, error: err.message };
    }
  }, []);

  // Sign out
  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      if (isMountedRef.current) {
        setUser(null);
        setProfile(null);
        setSession(null);
        setAuthError(null);
      }
      console.log('✅ Signed out successfully');
    } catch (err) {
      console.error('❌ Sign out error:', err);
    }
  }, []);

  // Update profile in context
  const updateProfile = useCallback((updates) => {
    setProfile(prev => prev ? { ...prev, ...updates } : null);
  }, []);

  // Refresh profile from database
  const refreshProfile = useCallback(async () => {
    if (!user?.id) return null;
    
    const freshProfile = await fetchUserProfile(user.id, user.email, user.user_metadata);
    if (freshProfile && isMountedRef.current) {
      setProfile(freshProfile);
    }
    return freshProfile;
  }, [user, fetchUserProfile]);

  // Initialize auth state - SIMPLIFIED VERSION
  useEffect(() => {
    isMountedRef.current = true;
    
    // Prevent double initialization in strict mode
    if (hasInitializedRef.current) {
      return;
    }
    hasInitializedRef.current = true;

    console.log('🚀 Starting auth initialization...');

    // Helper function to process session and load profile
    const loadProfile = async (currentSession) => {
      if (!currentSession?.user) return;
      
      console.log('📋 Loading profile for:', currentSession.user.email);
      setProfileLoading(true);
      
      const result = await processAuth(currentSession);
      
      if (isMountedRef.current) {
        if (result.success) {
          setProfile(result.profile);
          setAuthError(null);
          console.log('✅ Profile loaded:', result.profile.full_name, '| Role:', result.profile.role);
        } else if (result.error !== 'Already processing') {
          console.error('❌ Profile load failed:', result.error);
          setAuthError(result.error);
          // Don't clear session - let user retry
        }
        setProfileLoading(false);
        setSigningIn(false);
      }
    };

    // Set up auth state change listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      console.log('🔔 Auth event:', event, currentSession ? '(has session)' : '(no session)');
      
      // Clear OAuth hash from URL
      if (window.location.hash?.includes('access_token')) {
        window.history.replaceState(null, '', window.location.pathname);
      }
      
      if (event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
        setProfile(null);
        setAuthError(null);
        setLoading(false);
        setProfileLoading(false);
        setSigningIn(false);
        setInitialized(true);
        return;
      }

      if (event === 'TOKEN_REFRESHED' && currentSession) {
        setSession(currentSession);
        setUser(currentSession.user);
        return;
      }

      // SIGNED_IN or INITIAL_SESSION
      if (currentSession) {
        setSession(currentSession);
        setUser(currentSession.user);
        setLoading(false);
        setInitialized(true);
        await loadProfile(currentSession);
      } else {
        setSession(null);
        setUser(null);
        setProfile(null);
        setLoading(false);
        setProfileLoading(false);
        setInitialized(true);
      }
    });

    // THEN get existing session
    const initAuth = async () => {
      try {
        console.log('📡 Checking existing session...');
        const { data: { session: existingSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ getSession error:', error);
        }
        
        console.log('📡 Existing session:', existingSession ? 'found' : 'none');
        
        if (isMountedRef.current) {
          if (existingSession) {
            setSession(existingSession);
            setUser(existingSession.user);
            setLoading(false);
            setInitialized(true);
            await loadProfile(existingSession);
          } else {
            setLoading(false);
            setInitialized(true);
          }
        }
      } catch (err) {
        console.error('❌ initAuth error:', err);
        if (isMountedRef.current) {
          setLoading(false);
          setInitialized(true);
        }
      }
    };

    initAuth();

    return () => {
      isMountedRef.current = false;
      subscription.unsubscribe();
    };
  }, [processAuth]);

  // Context value
  const value = {
    user,
    profile,
    session,
    loading,
    profileLoading,
    signingIn,
    initialized,
    authError,
    isAuthenticated: !!session && !!profile,
    isAdmin: profile?.role === 'admin',
    signInWithGoogle,
    signOut,
    updateProfile,
    refreshProfile,
    setAuthError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
