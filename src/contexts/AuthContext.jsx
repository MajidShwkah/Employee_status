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
  // Prevents duplicate profile fetches when both onAuthStateChange
  // AND the initial getSession() call see the same session.
  const profileFetchedForRef = useRef(null);

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
          console.error('   Code:', createError.code, '| Message:', createError.message);
          console.error('   Hint: Run user_profiles_setup.sql in Supabase if user_profiles table is missing or RLS blocks insert.');
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

  // ─────────────────────────────────────────────────────────────────────────
  // loadProfileAsync — NEVER called with await inside onAuthStateChange.
  //
  // Supabase JS v2 holds an internal async lock during auth init.
  // Awaiting a DB query inside onAuthStateChange blocks that lock → deadlock.
  // Instead, we schedule the profile fetch to run *after* the auth event
  // has returned, using a plain async IIFE that runs off the call stack.
  // ─────────────────────────────────────────────────────────────────────────
  const loadProfileAsync = useCallback((currentSession) => {
    if (!currentSession?.user) return;

    // Skip if we already fetched for this exact session user
    const userId = currentSession.user.id;
    if (profileFetchedForRef.current === userId) {
      console.log('⏭️ Profile already fetched for this user, skipping');
      return;
    }
    profileFetchedForRef.current = userId;

    // Fire-and-forget: runs async, completely outside the auth event loop
    (async () => {
      try {
        const { user: authUser } = currentSession;
        console.log('🔐 Loading profile for:', authUser.email);

        // Validate email domain
        if (!isValidEmailDomain(authUser.email)) {
          console.log('🚫 Invalid email domain:', authUser.email);
          await supabase.auth.signOut();
          if (isMountedRef.current) {
            setAuthError(`Access Denied: Only ${ALLOWED_EMAIL_DOMAIN} emails are allowed.`);
            setProfileLoading(false);
            setSigningIn(false);
            profileFetchedForRef.current = null;
          }
          return;
        }

        if (isMountedRef.current) setProfileLoading(true);

        const userProfile = await fetchUserProfile(
          authUser.id,
          authUser.email,
          authUser.user_metadata
        );

        if (isMountedRef.current) {
          if (userProfile) {
            setProfile(userProfile);
            setAuthError(null);
            console.log('✅ Profile loaded:', userProfile.full_name, '| Role:', userProfile.role);
          } else {
            setAuthError('Failed to create or load your profile. Check the browser console for details. Ensure user_profiles table exists in Supabase (run user_profiles_setup.sql).');
            profileFetchedForRef.current = null; // allow retry
          }
          setProfileLoading(false);
          setSigningIn(false);
        }
      } catch (err) {
        console.error('❌ loadProfileAsync error:', err);
        if (isMountedRef.current) {
          setAuthError('An error occurred loading your profile.');
          setProfileLoading(false);
          setSigningIn(false);
          profileFetchedForRef.current = null;
        }
      }
    })();
  }, [isValidEmailDomain, fetchUserProfile]);

  // Sign in with Google
  const signInWithGoogle = useCallback(async () => {
    setAuthError(null);
    setSigningIn(true);

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
      profileFetchedForRef.current = null;
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

  // ─────────────────────────────────────────────────────────────────────────
  // Auth Initialization
  //
  // Industry-standard pattern for Supabase v2:
  //   1. Subscribe to onAuthStateChange FIRST
  //   2. Call getSession() to handle any existing session
  //   3. NEVER await DB queries inside the auth event callback
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    isMountedRef.current = true;

    console.log('🚀 Starting auth initialization...');

    // 1. Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, currentSession) => {
      console.log('🔔 Auth event:', event, currentSession ? '(has session)' : '(no session)');

      // Clear OAuth hash from URL after redirect
      if (window.location.hash?.includes('access_token')) {
        window.history.replaceState(null, '', window.location.pathname);
      }

      if (event === 'SIGNED_OUT') {
        profileFetchedForRef.current = null;
        if (isMountedRef.current) {
          setSession(null);
          setUser(null);
          setProfile(null);
          setAuthError(null);
          setLoading(false);
          setProfileLoading(false);
          setSigningIn(false);
          setInitialized(true);
        }
        return;
      }

      if (event === 'TOKEN_REFRESHED' && currentSession) {
        if (isMountedRef.current) {
          setSession(currentSession);
          setUser(currentSession.user);
        }
        return;
      }

      // SIGNED_IN or INITIAL_SESSION
      if (currentSession) {
        if (isMountedRef.current) {
          setSession(currentSession);
          setUser(currentSession.user);
          setLoading(false);
          setInitialized(true);
        }
        // ⚠️ DO NOT await here — fires profile fetch outside the auth lock
        loadProfileAsync(currentSession);
      } else {
        if (isMountedRef.current) {
          setSession(null);
          setUser(null);
          setProfile(null);
          setLoading(false);
          setProfileLoading(false);
          setInitialized(true);
        }
      }
    });

    // 2. Get any existing session (handles page refresh with stored session)
    supabase.auth.getSession().then(({ data: { session: existingSession }, error }) => {
      if (error) {
        console.error('❌ getSession error:', error);
      }
      console.log('📡 Existing session:', existingSession ? 'found' : 'none');

      // onAuthStateChange will handle INITIAL_SESSION for us.
      // We only need to handle the case where it hasn't fired yet.
      if (!initialized && isMountedRef.current) {
        if (!existingSession) {
          setLoading(false);
          setInitialized(true);
        }
        // If existingSession exists, onAuthStateChange(INITIAL_SESSION) handles it.
      }
    });

    return () => {
      isMountedRef.current = false;
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
