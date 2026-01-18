import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Clock, User, Plus, Trash2, Edit2, LogOut, Eye, EyeOff, Settings, Upload, Save, X, MessageSquare } from 'lucide-react';

// Simple password hashing using Web Crypto API
const hashPassword = async (password) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
};

const verifyPassword = async (password, hash) => {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
};

// Initialize Supabase client
// TODO: Replace these with your actual Supabase credentials
const SUPABASE_URL = 'https://dmmmwudmypwcchkxchlg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtbW13dWRteXB3Y2Noa3hjaGxnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0NzgxMjgsImV4cCI6MjA4NDA1NDEyOH0.p-YhlQ9Tj4YrEIIcuY_uWWwIsHBAlBZQqp3KlFLt4fc';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Session duration: 15 minutes
const SESSION_DURATION = 15 * 60 * 1000;

const App = () => {
  const [view, setView] = useState('public'); // public, employee, admin
  const [employees, setEmployees] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [sessionTimeLeft, setSessionTimeLeft] = useState(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Login state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Employee control state
  const [statusNote, setStatusNote] = useState('');
  const [busyDuration, setBusyDuration] = useState(30);
  const [customDuration, setCustomDuration] = useState('');
  const [useCustomDuration, setUseCustomDuration] = useState(false);
  const customDurationTimeoutRef = useRef(null);

  // Profile editing state
  const [showProfileSettings, setShowProfileSettings] = useState(false);
  const [editingName, setEditingName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  // Admin state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [newEmployee, setNewEmployee] = useState({
    username: '',
    full_name: '',
    password: '',
    role: 'employee'
  });

  // Notification state
  const [notification, setNotification] = useState(null);
  
  // Notes gallery state
  const [currentNoteIndex, setCurrentNoteIndex] = useState(0);

  // Initialize and setup realtime subscription
  useEffect(() => {
    // Only check user on mount, not on every render
    const initApp = async () => {
      await checkUser();
      await fetchEmployees();
      setIsInitialLoad(false);
    };
    initApp();
    
    // Periodically refresh session to keep user logged in
    // This ensures session persists across page navigations
    const sessionRefreshInterval = setInterval(() => {
      const savedUserId = localStorage.getItem('currentUserId');
      const sessionExpiry = localStorage.getItem('sessionExpiry');
      
      if (savedUserId && sessionExpiry) {
        const expiryTime = parseInt(sessionExpiry);
        const timeUntilExpiry = expiryTime - Date.now();
        
        // If session is still valid, refresh it
        if (timeUntilExpiry > 0 && timeUntilExpiry < SESSION_DURATION) {
          localStorage.setItem('sessionExpiry', (Date.now() + SESSION_DURATION).toString());
        }
      }
    }, 60000); // Check every minute

    // Setup realtime subscription with proper status monitoring
    const channel = supabase
      .channel('public:profiles', {
        config: {
          broadcast: { self: true }, // Receive our own updates too
        }
      })
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'profiles' 
        }, 
        (payload) => {
          console.log('🔔 Realtime update received:', payload);
          
          if (payload.eventType === 'INSERT') {
            console.log('➕ New employee added:', payload.new);
            setEmployees(prev => {
              // Check if already exists (avoid duplicates)
              if (prev.find(emp => emp.id === payload.new.id)) {
                return prev;
              }
              return [...prev, payload.new];
            });
          } else if (payload.eventType === 'UPDATE') {
            console.log('🔄 Employee updated:', payload.new.full_name, 'Status:', payload.new.status);
            
            // Find the previous state to detect changes
            setEmployees(prev => {
              const oldEmp = prev.find(emp => emp.id === payload.new.id);
              
              // Check if status changed
              if (oldEmp && oldEmp.status !== payload.new.status) {
                const statusConfig = {
                  'free': { emoji: '✅', label: 'Available' },
                  'busy': { emoji: '🔴', label: 'Busy' },
                  'important': { emoji: '⚠️', label: 'Important' }
                };
                const config = statusConfig[payload.new.status] || { emoji: '🔄', label: payload.new.status };
                setNotification({
                  type: 'status',
                  message: `${payload.new.full_name} is now ${config.label}`,
                  emoji: config.emoji,
                  name: payload.new.full_name,
                  status: payload.new.status
                });
              }
              
              // Check if status note changed (and is not empty)
              if (oldEmp && oldEmp.status_note !== payload.new.status_note && payload.new.status_note) {
                setNotification({
                  type: 'note',
                  message: `${payload.new.full_name} says: "${payload.new.status_note}"`,
                  emoji: '💬',
                  name: payload.new.full_name,
                  note: payload.new.status_note
                });
              }
              
              const updated = prev.map(emp => {
                if (emp.id === payload.new.id) {
                  // Preserve avatar_url if it's missing in the update
                  const preservedAvatar = (payload.new.avatar_url && payload.new.avatar_url.trim() !== '') 
                    ? payload.new.avatar_url 
                    : emp.avatar_url;
                  const updatedEmp = { ...payload.new, avatar_url: preservedAvatar };
                  console.log('✅ Updated employee in list:', updatedEmp.full_name, '→ Status:', updatedEmp.status);
                  return updatedEmp;
                }
                return emp;
              });
              return updated;
            });
            
            // If the update is for the current user, also update currentUser state
            setCurrentUser(prev => {
              if (prev && payload.new.id === prev.id) {
                const preservedAvatar = (payload.new.avatar_url && payload.new.avatar_url.trim() !== '') 
                  ? payload.new.avatar_url 
                  : prev.avatar_url;
                
                const updatedUser = { 
                  ...prev, 
                  ...payload.new,
                  avatar_url: preservedAvatar
                };
                console.log('✅ Updated current user:', updatedUser.full_name, '→ Status:', updatedUser.status);
                return updatedUser;
              }
              return prev;
            });
          } else if (payload.eventType === 'DELETE') {
            console.log('➖ Employee deleted:', payload.old);
            setEmployees(prev => prev.filter(emp => emp.id !== payload.old.id));
            
            // If current user was deleted, log them out
            setCurrentUser(prev => {
              if (prev && payload.old.id === prev.id) {
                localStorage.removeItem('currentUserId');
                localStorage.removeItem('sessionExpiry');
                return null;
              }
              return prev;
            });
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Realtime subscription ACTIVE - listening for changes');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Realtime subscription ERROR - check Supabase configuration');
        } else if (status === 'TIMED_OUT') {
          console.warn('⚠️ Realtime subscription TIMED OUT - retrying...');
        } else {
          console.log('🔄 Realtime subscription status:', status);
        }
      });

    return () => {
      clearInterval(sessionRefreshInterval);
      supabase.removeChannel(channel);
    };
  }, []); // Empty dependency - subscription is set up once on mount

  // Auto-dismiss notifications after 5 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Auto-cycle through notes gallery every 5 seconds
  useEffect(() => {
    const employeesWithNotes = employees.filter(emp => emp.status_note && emp.status_note.trim() !== '');
    if (employeesWithNotes.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentNoteIndex(prev => (prev + 1) % employeesWithNotes.length);
    }, 5000); // Change note every 5 seconds
    
    return () => clearInterval(interval);
  }, [employees]);

  // Auto-update status to 'free' when busy timer expires
  // Only applies to employees who set a timer (have busy_until set)
  useEffect(() => {
    const checkExpiredTimers = async () => {
      const now = Date.now();
      
      // Check all employees with busy status and busy_until set
      // Only auto-update if they have a timer (busy_until is set)
      const expiredEmployees = employees.filter(emp => {
        if (emp.status !== 'busy' || !emp.busy_until) return false;
        const busyUntil = new Date(emp.busy_until).getTime();
        return busyUntil <= now;
      });

      // Auto-update expired timers to 'free'
      for (const emp of expiredEmployees) {
        console.log(`⏰ Timer expired for ${emp.full_name}, auto-setting to free`);
        
        // Update via Supabase - this will trigger realtime updates for all clients
        const { error } = await supabase
          .from('profiles')
          .update({
            status: 'free',
            status_note: null,
            busy_until: null,
            updated_at: new Date().toISOString()
          })
          .eq('id', emp.id);
        
        if (error) {
          console.error(`Error auto-updating ${emp.full_name} to free:`, error);
        } else {
          console.log(`✅ Auto-updated ${emp.full_name} to free`);
        }
      }
    };

    // Check every 10 seconds for expired timers
    const interval = setInterval(checkExpiredTimers, 10000);
    
    // Also check immediately
    checkExpiredTimers();
    
    return () => clearInterval(interval);
  }, [employees]); // Re-run when employees list changes

  // Check if user is logged in (from localStorage) with session expiration
  const checkUser = async () => {
    const savedUserId = localStorage.getItem('currentUserId');
    const sessionExpiry = localStorage.getItem('sessionExpiry');
    
    // Check if session expired
    if (sessionExpiry && Date.now() > parseInt(sessionExpiry)) {
      // Session expired
      localStorage.removeItem('currentUserId');
      localStorage.removeItem('sessionExpiry');
      setCurrentUser(null);
      setView('public');
      setLoading(false);
      return;
    }
    
    if (savedUserId) {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', savedUserId)
        .single();
      
      // SECURITY: Verify we got the correct profile
      if (error) {
        console.error('Error loading profile:', error);
        localStorage.removeItem('currentUserId');
        localStorage.removeItem('sessionExpiry');
        setCurrentUser(null);
        setView('public');
        setLoading(false);
        return;
      }
      
      if (profile && profile.id === savedUserId) {
        // CRITICAL: Always preserve avatar_url when setting currentUser
        // If profile has avatar_url, use it; otherwise keep existing if available
        const preservedAvatar = (profile.avatar_url && profile.avatar_url.trim() !== '') 
          ? profile.avatar_url 
          : (currentUser?.avatar_url || profile.avatar_url);
        
        setCurrentUser({ ...profile, avatar_url: preservedAvatar });
        
        // Refresh session expiry - this extends the session on every check
        localStorage.setItem('sessionExpiry', (Date.now() + SESSION_DURATION).toString());
        
        // CRITICAL: Only auto-set view on initial page load (when isInitialLoad is true)
        // After initial load, NEVER change the view - preserve whatever view the user is on
        // This ensures users stay logged in when navigating between views
        if (isInitialLoad) {
          // First load or page refresh - set appropriate view based on role
          if (profile.role === 'admin') {
            setView('admin');
          } else if (profile.role === 'employee') {
            setView('employee');
          }
        }
        // After initial load, DO NOT change view - keep current view
        // This allows logged-in users to navigate freely between public dashboard, control panel, and admin panel
        // User stays logged in for 15 minutes regardless of which view they're on
      } else {
        // User not found, clear session
        localStorage.removeItem('currentUserId');
        localStorage.removeItem('sessionExpiry');
        setCurrentUser(null);
        if (view !== 'public' && view !== 'login') {
          setView('public');
        }
      }
    } else {
      // No saved user - ensure we're on public view
      setCurrentUser(null);
      if (view !== 'public' && view !== 'login') {
        setView('public');
      }
    }
    setLoading(false);
  };

  // Sync status fields when currentUser changes
  useEffect(() => {
    if (currentUser) {
      // Sync status note from current user
      if (currentUser.status_note && currentUser.status_note !== statusNote) {
        setStatusNote(currentUser.status_note);
      }
      
      // Calculate and sync busy duration if user is busy (not for important)
      if (currentUser.status === 'busy' && currentUser.busy_until) {
        const busyUntil = new Date(currentUser.busy_until).getTime();
        const now = Date.now();
        const remainingMinutes = Math.ceil((busyUntil - now) / 60000);
        if (remainingMinutes > 0) {
          // Set to closest preset or custom
          if ([15, 30, 60, 120].includes(remainingMinutes)) {
            setBusyDuration(remainingMinutes);
            setUseCustomDuration(false);
          } else {
            setCustomDuration(remainingMinutes.toString());
            setUseCustomDuration(true);
          }
        }
      }
    }
  }, [currentUser]);

  // Auto-logout timer and session countdown
  useEffect(() => {
    if (!currentUser) {
      setSessionTimeLeft(null);
      return;
    }

    const updateSessionTimer = () => {
      const sessionExpiry = localStorage.getItem('sessionExpiry');
      if (!sessionExpiry) return;

      const expiryTime = parseInt(sessionExpiry);
      const timeUntilExpiry = expiryTime - Date.now();

      if (timeUntilExpiry <= 0) {
        alert('Your session has expired. Please login again.');
        handleLogout();
        return;
      }

      // Update session time left display
      const minutes = Math.floor(timeUntilExpiry / 60000);
      const seconds = Math.floor((timeUntilExpiry % 60000) / 1000);
      setSessionTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`);

      // Warn when 2 minutes left
      if (timeUntilExpiry < 2 * 60 * 1000 && timeUntilExpiry > 1 * 60 * 1000) {
        // Only show once
        if (!localStorage.getItem('sessionWarningShown')) {
          alert('Your session will expire in 2 minutes. Activity will extend your session.');
          localStorage.setItem('sessionWarningShown', 'true');
        }
      }
    };

    // Update immediately
    updateSessionTimer();

    // Update every second
    const interval = setInterval(updateSessionTimer, 1000);

    // Set timer for auto-logout
    const sessionExpiry = localStorage.getItem('sessionExpiry');
    if (sessionExpiry) {
      const expiryTime = parseInt(sessionExpiry);
      const timeUntilExpiry = expiryTime - Date.now();
      
      if (timeUntilExpiry > 0) {
        const timer = setTimeout(() => {
          alert('Your session has expired. Please login again.');
          handleLogout();
        }, timeUntilExpiry);

        // Refresh session on user activity
        const refreshSession = () => {
          localStorage.setItem('sessionExpiry', (Date.now() + SESSION_DURATION).toString());
          localStorage.removeItem('sessionWarningShown'); // Reset warning
        };

        // Listen for user activity
        const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
        events.forEach(event => {
          window.addEventListener(event, refreshSession, { passive: true });
        });

        return () => {
          clearTimeout(timer);
          clearInterval(interval);
          events.forEach(event => {
            window.removeEventListener(event, refreshSession);
          });
        };
      }
    }

    return () => {
      clearInterval(interval);
    };
  }, [currentUser]);

  const fetchEmployees = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('full_name');
    
    if (!error && data) {
      setEmployees(data);
    }
  };

  const handleLogin = async () => {
    if (!username || !password) {
      alert('Please enter username and password');
      return;
    }

    // Find user by username
    const { data: users, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', username)
      .single();

    if (error || !users) {
      alert('Invalid username or password');
      return;
    }

    // Verify password
    const passwordMatch = await verifyPassword(password, users.password_hash);
    if (!passwordMatch) {
      alert('Invalid username or password');
      return;
    }

    // Login successful - store user ID and session expiry (15 minutes)
    localStorage.setItem('currentUserId', users.id);
    localStorage.setItem('sessionExpiry', (Date.now() + SESSION_DURATION).toString());
    setCurrentUser(users);
    
    // Update employees list to include the logged-in user's latest data
    setEmployees(prev => {
      const existingIndex = prev.findIndex(emp => emp.id === users.id);
      if (existingIndex >= 0) {
        // Update existing employee
        const updated = [...prev];
        updated[existingIndex] = users;
        return updated;
      } else {
        // Add new employee (shouldn't happen, but just in case)
        return [...prev, users];
      }
    });
    
    // Admins can access both admin panel and employee control panel
    // Default to admin panel, but they can switch
    if (users.role === 'admin') {
      setView('admin');
    } else {
      setView('employee');
    }
    
    setUsername('');
    setPassword('');
  };

  const handleLogout = () => {
    localStorage.removeItem('currentUserId');
    localStorage.removeItem('sessionExpiry');
    setCurrentUser(null);
    setView('public');
    setUsername('');
    setPassword('');
  };

  const updateStatus = async (status, durationOverride = null) => {
    // SECURITY: Verify user is logged in
    if (!currentUser) {
      alert('You must be logged in to update status');
      return;
    }
    
    // SECURITY: Double-check currentUser is valid
    const savedUserId = localStorage.getItem('currentUserId');
    if (!savedUserId || savedUserId !== currentUser.id) {
      alert('Session expired. Please login again.');
      handleLogout();
      return;
    }

    // Calculate duration - use override if provided, otherwise use custom or preset
    let durationMinutes = durationOverride;
    if (durationMinutes === null) {
      if (useCustomDuration && customDuration) {
        durationMinutes = parseInt(customDuration);
        if (isNaN(durationMinutes) || durationMinutes <= 0) {
          alert('Please enter a valid custom duration');
          return;
        }
      } else {
        durationMinutes = busyDuration;
      }
    }

    const updates = {
      status,
      status_note: status === 'free' ? null : statusNote, // Clear status_note only when setting to free
      busy_until: status === 'busy' ? new Date(Date.now() + durationMinutes * 60000).toISOString() : null, // Only set timer for busy status
      updated_at: new Date().toISOString()
    };

    // SECURITY: Always verify we're updating our own profile
    // This is critical - never allow updating other users' profiles
    const { error, data } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', currentUser.id)  // CRITICAL: Only update current user's profile
      .select(); // Select to ensure realtime triggers
    
    // SECURITY: Verify the update was for the correct user
    if (data && data.length > 0 && data[0].id !== currentUser.id) {
      console.error('SECURITY ERROR: Attempted to update wrong profile!');
      alert('Security error: Cannot update this profile');
      return;
    }

    if (!error) {
      console.log('✅ Status updated in database:', updates);
      // IMMEDIATE UPDATE: Update local state immediately for instant UI feedback
      const updatedUser = { ...currentUser, ...updates };
      setCurrentUser(updatedUser);
      
      // IMMEDIATE UPDATE: Update employees list immediately so dashboard shows new status right away
      setEmployees(prev => 
        prev.map(emp => emp.id === currentUser.id ? updatedUser : emp)
      );
      
      // Then fetch the complete updated profile from database to ensure all fields are correct
      const { data: updatedProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single();
      
      if (updatedProfile) {
        // Ensure avatar_url is preserved - never lose it
        const preservedAvatar = updatedProfile.avatar_url || currentUser.avatar_url;
        const finalUser = { ...updatedProfile, avatar_url: preservedAvatar };
        setCurrentUser(finalUser);
        
        // Update employees list with the complete profile
        setEmployees(prev => 
          prev.map(emp => emp.id === currentUser.id ? finalUser : emp)
        );
      }
      
      if (status === 'free') {
        setStatusNote('');
        setCustomDuration('');
        setUseCustomDuration(false);
      }
    } else {
      alert('Error updating status: ' + error.message);
    }
  };

  // Avatar upload function
  const uploadAvatar = async (file, userId = null) => {
    if (!file) return null;
    const targetUserId = userId || currentUser?.id;
    if (!targetUserId) return null;

    setUploadingAvatar(true);
    try {
      // Check if bucket exists, if not use data URL as fallback
      const fileExt = file.name.split('.').pop();
      const fileName = `${targetUserId}-${Math.random()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Try to upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        // If bucket doesn't exist, use data URL as fallback
        if (uploadError.message.includes('Bucket not found') || uploadError.message.includes('not found')) {
          console.warn('Storage bucket not found, using data URL');
          const reader = new FileReader();
          return new Promise((resolve) => {
            reader.onloadend = () => {
              setUploadingAvatar(false);
              resolve(reader.result); // Return data URL
            };
            reader.readAsDataURL(file);
          });
        }
        throw uploadError;
      }

      // Get public URL
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setUploadingAvatar(false);
      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      setUploadingAvatar(false);
      
      // Fallback to data URL if storage fails
      if (error.message.includes('Bucket not found') || error.message.includes('not found')) {
        const reader = new FileReader();
        return new Promise((resolve) => {
          reader.onloadend = () => {
            resolve(reader.result); // Return data URL
          };
          reader.readAsDataURL(file);
        });
      }
      
      alert('Error uploading avatar: ' + error.message + '\n\nNote: Using image as data URL. Set up Supabase Storage bucket "avatars" for better performance.');
      return null;
    }
  };

  // Handle avatar file selection
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size must be less than 5MB');
        return;
      }
      setAvatarFile(file);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Update profile (name and avatar)
  const updateProfile = async () => {
    // SECURITY: Verify user is logged in
    if (!currentUser) {
      alert('You must be logged in to update profile');
      return;
    }
    
    // SECURITY: Double-check currentUser is valid
    const savedUserId = localStorage.getItem('currentUserId');
    if (!savedUserId || savedUserId !== currentUser.id) {
      alert('Session expired. Please login again.');
      handleLogout();
      return;
    }

    setSavingProfile(true);
    try {
      const updates = {};

      // Update name if changed
      if (editingName && editingName !== currentUser.full_name) {
        updates.full_name = editingName;
      }

      // Upload avatar if selected
      if (avatarFile) {
        const avatarUrl = await uploadAvatar(avatarFile);
        if (avatarUrl) {
          updates.avatar_url = avatarUrl;
        }
      }

      // Update profile if there are changes
      if (Object.keys(updates).length > 0) {
        // SECURITY: Always verify we're updating our own profile
        const { error, data } = await supabase
          .from('profiles')
          .update(updates)
          .eq('id', currentUser.id)  // CRITICAL: Only update current user's profile
          .select();
        
        // SECURITY: Verify the update was for the correct user
        if (data && data.length > 0 && data[0].id !== currentUser.id) {
          console.error('SECURITY ERROR: Attempted to update wrong profile!');
          alert('Security error: Cannot update this profile');
          return;
        }

        if (error) throw error;

        // Update local state
        setCurrentUser({ ...currentUser, ...updates });
        setEditingName('');
        setAvatarFile(null);
        setAvatarPreview(null);
        alert('Profile updated successfully!');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Error updating profile: ' + error.message);
    } finally {
      setSavingProfile(false);
    }
  };

  // Change password
  const changePassword = async () => {
    // SECURITY: Verify user is logged in
    if (!currentUser) {
      alert('You must be logged in to change password');
      return;
    }
    
    // SECURITY: Double-check currentUser is valid
    const savedUserId = localStorage.getItem('currentUserId');
    if (!savedUserId || savedUserId !== currentUser.id) {
      alert('Session expired. Please login again.');
      handleLogout();
      return;
    }
    
    if (!currentPassword || !newPassword || !confirmPassword) {
      alert('Please fill in all password fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      alert('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }

    try {
      // Verify current password
      const passwordMatch = await verifyPassword(currentPassword, currentUser.password_hash);
      if (!passwordMatch) {
        alert('Current password is incorrect');
        return;
      }

      // Hash new password
      const hashedPassword = await hashPassword(newPassword);

      // SECURITY: Always verify we're updating our own profile
      const { error, data } = await supabase
        .from('profiles')
        .update({ password_hash: hashedPassword })
        .eq('id', currentUser.id)  // CRITICAL: Only update current user's password
        .select();
      
      // SECURITY: Verify the update was for the correct user
      if (data && data.length > 0 && data[0].id !== currentUser.id) {
        console.error('SECURITY ERROR: Attempted to update wrong profile password!');
        alert('Security error: Cannot update this profile');
        return;
      }

      if (error) throw error;

      // Update local state
      setCurrentUser({ ...currentUser, password_hash: hashedPassword });
      alert('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Error changing password:', error);
      alert('Error changing password: ' + error.message);
    }
  };

  // Initialize editing name when opening profile settings
  useEffect(() => {
    if (showProfileSettings && currentUser) {
      setEditingName(currentUser.full_name);
    }
  }, [showProfileSettings, currentUser]);

  const addEmployee = async () => {
    if (!newEmployee.username || !newEmployee.full_name || !newEmployee.password) {
      alert('Please fill in all fields');
      return;
    }

    if (newEmployee.password.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }

    try {
      // Hash password
      const hashedPassword = await hashPassword(newEmployee.password);

      // Create profile directly
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          username: newEmployee.username,
          password_hash: hashedPassword,
          full_name: newEmployee.full_name,
          role: newEmployee.role,
          status: 'free',
          avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(newEmployee.full_name)}&background=4F46E5&color=fff&size=128`
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          alert('Username already exists. Please choose a different username.');
        } else {
          alert('Error creating employee: ' + error.message);
        }
        return;
      }

      setShowAddModal(false);
      setNewEmployee({ username: '', full_name: '', password: '', role: 'employee' });
      alert('✅ Employee created successfully! They can login immediately with their username and password.');
      
      // Refresh employees list
      fetchEmployees();
    } catch (error) {
      console.error('Error creating employee:', error);
      alert('Error creating employee: ' + error.message);
    }
  };

  const deleteEmployee = async (id) => {
    if (!confirm('Are you sure you want to delete this employee?')) return;
    
    await supabase.from('profiles').delete().eq('id', id);
  };

  const updateEmployee = async (id, updates) => {
    // SECURITY: Only admins can update other employees
    if (!currentUser || currentUser.role !== 'admin') {
      alert('Only admins can update employee profiles');
      return;
    }
    
    // SECURITY: Verify admin is logged in
    const savedUserId = localStorage.getItem('currentUserId');
    if (!savedUserId || savedUserId !== currentUser.id) {
      alert('Session expired. Please login again.');
      handleLogout();
      return;
    }
    
    // SECURITY: Admins can update any employee, but verify the update succeeded
    const { error, data } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', id)
      .select();
    
    // SECURITY: Verify the update was for the intended employee
    if (data && data.length > 0 && data[0].id !== id) {
      console.error('SECURITY ERROR: Update returned wrong profile!');
      alert('Security error: Update failed');
      return;
    }
    
    if (error) {
      alert('Error updating employee: ' + error.message);
      return;
    }
    
    // Refresh employees list
    fetchEmployees();
    
    // If updating current user, update local state
    if (currentUser && currentUser.id === id) {
      setCurrentUser({ ...currentUser, ...updates });
    }
    
    setEditingEmployee(null);
    alert('Employee updated successfully!');
  };

  const getTimeRemaining = (busyUntil) => {
    if (!busyUntil) return null;
    const now = Date.now();
    const end = new Date(busyUntil).getTime();
    const diff = end - now;
    
    if (diff <= 0) return 'Expired';
    
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Get time remaining in MM:SS format for inline display (e.g., "10:25")
  const getTimeRemainingFormatted = (busyUntil) => {
    if (!busyUntil) return null;
    const now = Date.now();
    const end = new Date(busyUntil).getTime();
    const diff = end - now;
    
    if (diff <= 0) return null; // Don't show expired timer inline
    
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Timer component
  const Timer = ({ busyUntil }) => {
    const [time, setTime] = useState(getTimeRemaining(busyUntil));

    useEffect(() => {
      const interval = setInterval(() => {
        setTime(getTimeRemaining(busyUntil));
      }, 1000);
      return () => clearInterval(interval);
    }, [busyUntil]);

    if (!time) return null;
    
    // Handle expired state
    if (time === 'Expired') {
      return (
        <div className="flex items-center gap-1.5 text-xs font-semibold text-white/80">
          <Clock className="w-3.5 h-3.5 opacity-60" />
          <span className="italic">Time expired</span>
        </div>
      );
    }
    
    return (
      <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
        <Clock className="w-3.5 h-3.5" />
        <span>{time}</span>
      </div>
    );
  };

  // Employee Card Component - Modern Design with Full Color Background
  const EmployeeCard = ({ employee }) => {
    const isFree = employee.status === 'free';
    const isImportant = employee.status === 'important';
    const avatarUrl = employee.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.full_name)}&background=4F46E5&color=fff&size=64`;
    
    // Real-time timer state for inline display (MM:SS format)
    const [timerFormatted, setTimerFormatted] = useState(() => {
      if (!isFree && !isImportant && employee.busy_until) {
        return getTimeRemainingFormatted(employee.busy_until);
      }
      return null;
    });

    // Update timer every second for accurate countdown
    useEffect(() => {
      if (!isFree && !isImportant && employee.busy_until) {
        const interval = setInterval(() => {
          const timeRemaining = getTimeRemainingFormatted(employee.busy_until);
          setTimerFormatted(timeRemaining);
        }, 1000); // Update every second
        
        // Also update immediately
        setTimerFormatted(getTimeRemainingFormatted(employee.busy_until));
        
        return () => clearInterval(interval);
      } else {
        setTimerFormatted(null);
      }
    }, [employee.busy_until, isFree, isImportant]);

    // Determine status colors
    const getStatusColors = () => {
      if (isFree) {
        return {
          bg: 'bg-[#166534]',
          bgGradient: 'bg-gradient-to-br from-[#166534] to-[#15803d]',
          shadow: 'shadow-lg shadow-[#166534]/40',
          glow: 'bg-[#166534]',
          indicator: 'bg-white',
          badge: 'bg-white/20 backdrop-blur-sm text-white border border-white/30',
          label: '✓ Available',
          text: 'text-white'
        };
      } else if (isImportant) {
        return {
          bg: 'bg-[#f97316]',
          bgGradient: 'bg-gradient-to-br from-[#f97316] to-[#ea580c]',
          shadow: 'shadow-lg shadow-[#f97316]/40',
          glow: 'bg-[#f97316]',
          indicator: 'bg-white',
          badge: 'bg-white/20 backdrop-blur-sm text-white border border-white/30',
          label: '⚠ Important',
          text: 'text-white'
        };
      } else {
        return {
          bg: 'bg-[#991b1b]',
          bgGradient: 'bg-gradient-to-br from-[#991b1b] to-[#7f1d1d]',
          shadow: 'shadow-lg shadow-[#991b1b]/40',
          glow: 'bg-[#991b1b]',
          indicator: 'bg-white',
          badge: 'bg-white/20 backdrop-blur-sm text-white border border-white/30',
          label: '✕ Busy',
          text: 'text-white'
        };
      }
    };

    const statusColors = getStatusColors();

    return (
      <div 
        className={`
          group relative overflow-hidden rounded-2xl p-5 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-2xl
          ${statusColors.bgGradient} ${statusColors.shadow}
          border-0
        `}
      >
        {/* Decorative gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-50"></div>
        
        {/* Content */}
        <div className="relative flex items-center gap-3">
          {/* Avatar with glow effect */}
          <div className={`relative flex-shrink-0 ${isFree ? 'animate-pulse-slow' : ''}`}>
            <div className={`absolute inset-0 rounded-full ${statusColors.glow} blur-xl opacity-60`}></div>
            <img 
              src={avatarUrl} 
              alt={employee.full_name}
              className="relative w-16 h-16 rounded-full border-2 border-white/50 shadow-xl"
            />
            {/* Status indicator */}
            <div className={`absolute bottom-0 right-0 w-5 h-5 rounded-full border-2 border-white ${statusColors.indicator} shadow-lg`}>
              {isFree && <div className="w-full h-full rounded-full bg-white animate-ping opacity-75"></div>}
              {isImportant && <div className="w-full h-full rounded-full bg-white animate-pulse opacity-75"></div>}
            </div>
          </div>

          {/* Name and Badge with Timer */}
          <div className="flex-1 min-w-0">
            <h3 className={`text-lg font-bold mb-2 truncate ${statusColors.text}`}>
              {employee.full_name}
            </h3>
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold ${statusColors.badge} shadow-sm`}>
              <span>{statusColors.label}</span>
              {!isFree && !isImportant && timerFormatted && (
                <>
                  <span className="text-white/70">-</span>
                  <span className="text-white/90 font-mono">{timerFormatted}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Corner accent */}
        <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-bl-full"></div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-image-static flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-[#212121] text-xl font-semibold">Loading...</div>
        </div>
      </div>
    );
  }

  // Notification Component - Big and Prominent
  const Notification = ({ notification, onClose }) => {
    if (!notification) return null;
    
    return (
      <div className="fixed top-8 left-1/2 transform -translate-x-1/2 z-[100] animate-in slide-in-from-top-5 duration-500">
        <div className={`
          px-10 py-8 rounded-3xl shadow-2xl backdrop-blur-xl border-3
          ${notification.type === 'status' 
            ? notification.status === 'free'
              ? 'bg-[#166534] border-[#166534] shadow-[#166534]/50'
              : notification.status === 'important'
              ? 'bg-[#f97316] border-[#f97316] shadow-[#f97316]/50'
              : 'bg-[#991b1b] border-[#991b1b] shadow-[#991b1b]/50'
            : 'bg-white border border-gray-200'
          }
          text-white max-w-3xl w-full mx-4
        `}>
          <div className="flex items-start justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-3">
                <span className="text-5xl">{notification.emoji}</span>
                <h3 className="text-3xl font-extrabold">{notification.name}</h3>
              </div>
              {notification.type === 'note' ? (
                <div className="mt-4">
                  <p className="text-2xl font-bold mb-3">says:</p>
                  <div className="p-4 bg-white/25 rounded-xl border-2 border-white/40 backdrop-blur-sm">
                    <p className="text-2xl font-semibold italic leading-relaxed">"{notification.note}"</p>
                  </div>
                </div>
              ) : (
                <p className="text-2xl font-bold">{notification.message}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-white/90 hover:text-white transition-colors flex-shrink-0"
            >
              <X className="w-7 h-7" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Public View - Enhanced Modern Design
  // This is a shared/public display - no login indicators shown
  if (view === 'public') {
    return (
      <div className="min-h-screen bg-gradient-image-static p-4 md:p-8">
        {/* Notification */}
        {notification && (
          <Notification 
            notification={notification} 
            onClose={() => setNotification(null)}
          />
        )}
        {/* Hidden admin access - only visible if admin is logged in and wants to access admin panel */}
        {/* This is intentionally hidden to keep the public dashboard clean for shared screens */}
        {currentUser && currentUser.role === 'admin' && (
          <div className="fixed top-2 right-2 z-50 opacity-0 hover:opacity-100 transition-opacity">
            <button
              onClick={() => setView('admin')}
              className="px-3 py-1.5 bg-[#212121] text-white rounded-lg hover:bg-[#212121]/90 text-xs border border-[#212121]"
              title="Admin Access"
            >
              Admin
            </button>
          </div>
        )}

        <div className="max-w-7xl mx-auto relative z-10">
          {/* Header - Organized Layout */}
          <div className="mb-8 space-y-4">
            {/* Top Row: Status Guide | Logo | Settings */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* Status Guide - Left */}
              <div className="bg-white rounded-xl p-3 md:p-4 border border-gray-200 shadow-sm order-2 sm:order-1">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                  {/* Red - Busy */}
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-[#991b1b] border-2 border-white shadow-sm flex-shrink-0"></div>
                    <div className="text-xs md:text-sm text-[#212121] font-medium whitespace-nowrap">
                      <span className="font-bold">Busy</span> - <span className="text-[#212121]/70">مشغول</span>
                    </div>
                  </div>
                  {/* Green - Available */}
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-[#166534] border-2 border-white shadow-sm flex-shrink-0"></div>
                    <div className="text-xs md:text-sm text-[#212121] font-medium whitespace-nowrap">
                      <span className="font-bold">Available</span> - <span className="text-[#212121]/70">متاح</span>
                    </div>
                  </div>
                  {/* Orange - Important */}
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-[#f97316] border-2 border-white shadow-sm flex-shrink-0"></div>
                    <div className="text-xs md:text-sm text-[#212121] font-medium whitespace-nowrap">
                      <span className="font-bold">Important Only</span> - <span className="text-[#212121]/70">متاح عند الضرورة فقط</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Logo - Center */}
              <div className="bg-white rounded-xl p-2 shadow-sm order-1 sm:order-2">
                <img 
                  src="/Rime_logo.jpeg" 
                  alt="Rime Logo" 
                  className="h-12 md:h-16 w-auto object-contain"
                />
              </div>
              
              {/* Settings - Right */}
              <button
                onClick={() => setView('login')}
                className="px-6 py-3 bg-[#212121] text-white rounded-xl hover:bg-[#212121]/90 flex items-center gap-2 shadow-sm transition-all duration-300 order-3"
              >
                <User className="w-5 h-5" />
                <span className="hidden sm:inline">Settings</span>
                <span className="sm:hidden">Login</span>
              </button>
            </div>

            {/* Bottom Row: Notes Gallery (Full Width) */}
            {(() => {
              const employeesWithNotes = employees.filter(emp => emp.status_note && emp.status_note.trim() !== '');
              if (employeesWithNotes.length === 0) return null;
              
              const currentEmployee = employeesWithNotes[currentNoteIndex % employeesWithNotes.length];
              
              return (
                <div className="bg-white rounded-2xl p-4 md:p-5 border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <MessageSquare className="w-5 h-5 md:w-6 md:h-6 text-[#212121]" />
                      <span className="text-base md:text-lg font-bold text-[#212121]">Status Updates</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setCurrentNoteIndex(prev => (prev - 1 + employeesWithNotes.length) % employeesWithNotes.length)}
                        className="px-3 py-2 text-[#212121] hover:text-[#212121] hover:bg-gray-100 rounded-lg transition-all text-lg font-bold"
                      >
                        ←
                      </button>
                      <span className="text-xs md:text-sm text-[#212121]/70 font-semibold">
                        {currentNoteIndex % employeesWithNotes.length + 1} / {employeesWithNotes.length}
                      </span>
                      <button
                        onClick={() => setCurrentNoteIndex(prev => (prev + 1) % employeesWithNotes.length)}
                        className="px-3 py-2 text-[#212121] hover:text-[#212121] hover:bg-gray-100 rounded-lg transition-all text-lg font-bold"
                      >
                        →
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <img 
                      src={currentEmployee.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentEmployee.full_name)}&background=4F46E5&color=fff&size=128`}
                      alt={currentEmployee.full_name}
                      className="w-14 h-14 md:w-16 md:h-16 rounded-full border-2 border-white/40 shadow-lg flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-lg md:text-xl font-extrabold text-[#212121] mb-1.5 truncate">{currentEmployee.full_name}</p>
                      <p className="text-xl md:text-2xl lg:text-3xl font-bold text-[#212121] leading-relaxed">
                        "{currentEmployee.status_note}"
                      </p>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
          
          {/* Employee Cards Grid - More compact */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
            {employees.length === 0 ? (
              <div className="col-span-full text-center py-20">
                <div className="text-[#212121] text-xl">No employees found</div>
              </div>
            ) : (
              employees
                .sort((a, b) => {
                  // Sort: Important first, then Free, then Busy
                  const statusOrder = { 'important': 0, 'free': 1, 'busy': 2 };
                  const aOrder = statusOrder[a.status] ?? 3;
                  const bOrder = statusOrder[b.status] ?? 3;
                  if (aOrder !== bOrder) return aOrder - bOrder;
                  return a.full_name.localeCompare(b.full_name);
                })
                .map(emp => (
                  <EmployeeCard key={emp.id} employee={emp} />
                ))
            )}
          </div>
        </div>
      </div>
    );
  }

  // Login View - Enhanced Design
  if (view === 'login') {
    return (
      <div className="min-h-screen bg-gradient-image-static flex items-center justify-center p-4 relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        </div>
        
        <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-8 w-full max-w-md relative z-10">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-[#212121] rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg">
              <User className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-[#212121] mb-2">Settings</h2>
            <p className="text-[#212121]/70 text-sm">Enter your credentials to continue</p>
          </div>
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-[#212121] mb-2">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-[#212121] placeholder-gray-400 focus:ring-2 focus:ring-[#212121] focus:border-[#212121] transition-all"
                placeholder="Enter your username"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#212121] mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-[#212121] placeholder-gray-400 focus:ring-2 focus:ring-[#212121] focus:border-[#212121] transition-all pr-12"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#212121] hover:text-[#212121]/80 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <button
              onClick={handleLogin}
              className="w-full bg-[#212121] text-white py-3 rounded-xl hover:bg-[#212121]/90 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              Sign In
            </button>
            <button
              onClick={() => setView('public')}
              className="w-full bg-white border border-gray-300 text-[#212121] py-3 rounded-xl hover:bg-gray-50 font-semibold transition-all"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Employee Control Panel - Enhanced Design
  if (view === 'employee' && currentUser) {
    return (
      <div className="min-h-screen bg-gradient-image-static p-4 md:p-8">
        {/* Animated background */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        </div>

        <div className="max-w-4xl mx-auto relative z-10">
          {/* Header with session timer */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
              <h1 className="text-4xl md:text-5xl font-extrabold text-[#212121] mb-2">
                Control Panel
              </h1>
              {sessionTimeLeft && (
                <p className="text-[#212121]/70 text-sm flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Session expires in: <span className="font-bold text-[#212121]">{sessionTimeLeft}</span>
                </p>
              )}
            </div>
            <div className="flex gap-2">
              {currentUser?.role === 'admin' && (
                <button
                  onClick={() => setView('admin')}
                  className="px-4 py-2 bg-[#212121] text-white rounded-xl hover:bg-[#212121]/90 flex items-center gap-2 shadow-sm transition-all"
                >
                  Admin Panel
                </button>
              )}
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-[#991b1b] text-white rounded-xl hover:bg-[#991b1b]/90 flex items-center gap-2 shadow-lg transition-all"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 p-6 md:p-8">
            {/* User Info Card */}
            <div className="bg-white rounded-2xl p-6 mb-6 border border-gray-200 shadow-sm">
              <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className={`absolute inset-0 rounded-full ${
                      currentUser.status === 'free' ? 'bg-[#166534]' : 
                      currentUser.status === 'important' ? 'bg-[#f97316]' : 
                      'bg-[#991b1b]'
                    } blur-xl opacity-50`}></div>
                    <img 
                      src={currentUser.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.full_name)}`}
                      alt={currentUser.full_name}
                      className="relative w-24 h-24 rounded-full border-4 border-white shadow-2xl"
                    />
                    <div className={`absolute bottom-0 right-0 w-6 h-6 rounded-full border-4 border-white ${
                      currentUser.status === 'free' ? 'bg-[#166534]' : 
                      currentUser.status === 'important' ? 'bg-[#f97316]' : 
                      'bg-[#991b1b]'
                    }`}>
                      {currentUser.status === 'free' && <div className="w-full h-full rounded-full bg-[#166534] animate-ping opacity-75"></div>}
                      {currentUser.status === 'important' && <div className="w-full h-full rounded-full bg-[#f97316] animate-pulse opacity-75"></div>}
                    </div>
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-[#212121] mb-1">{currentUser.full_name}</h2>
                    <div className="flex items-center gap-2">
                      <div className={`px-3 py-1 rounded-full text-sm font-bold text-white ${
                        currentUser.status === 'free' ? 'bg-[#166534]' : 
                        currentUser.status === 'important' ? 'bg-[#f97316]' : 
                        'bg-[#991b1b]'
                      }`}>
                        {currentUser.status === 'free' ? '✓ Available' : 
                         currentUser.status === 'important' ? '⚠ Important' : 
                         '✕ Busy'}
                      </div>
                      {currentUser.role === 'admin' && (
                        <div className="px-3 py-1 rounded-full text-sm font-bold bg-[#212121] text-white border border-[#212121]">
                          Admin
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowProfileSettings(!showProfileSettings)}
                  className="px-5 py-2.5 bg-[#212121] text-white rounded-xl hover:bg-[#212121]/90 flex items-center gap-2 shadow-sm transition-all"
                >
                  <Settings className="w-4 h-4" />
                  {showProfileSettings ? 'Hide Settings' : 'Edit Profile'}
                </button>
              </div>
            </div>

            {/* Profile Settings Section */}
            {showProfileSettings && (
              <div className="mb-6 p-6 bg-white rounded-2xl border border-gray-200 shadow-sm">
                <h3 className="text-2xl font-bold text-[#212121] mb-6 flex items-center gap-2">
                  <Settings className="w-6 h-6" />
                  Profile Settings
                </h3>
                
                {/* Avatar Upload */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-[#212121] mb-3">Profile Picture</label>
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="absolute inset-0 bg-indigo-400 rounded-full blur-xl opacity-50"></div>
                      <img 
                        src={avatarPreview || currentUser.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.full_name)}`}
                        alt="Avatar preview"
                        className="relative w-28 h-28 rounded-full border-4 border-white shadow-2xl"
                      />
                      {uploadingAvatar && (
                        <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center backdrop-blur-sm">
                          <div className="text-[#212121] text-sm font-semibold">Uploading...</div>
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="cursor-pointer inline-flex items-center px-5 py-2.5 bg-[#212121] text-white rounded-xl hover:bg-[#212121]/90 shadow-lg transition-all">
                        <Upload className="w-4 h-4 mr-2" />
                        {avatarFile ? 'Change Image' : 'Upload Image'}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarChange}
                          className="hidden"
                        />
                      </label>
                      {avatarFile && (
                        <button
                          onClick={() => {
                            setAvatarFile(null);
                            setAvatarPreview(null);
                          }}
                          className="ml-2 px-3 py-1.5 text-sm bg-[#991b1b] text-white hover:bg-[#991b1b]/90 rounded-lg border border-[#991b1b] transition-all"
                        >
                          <X className="w-4 h-4 inline mr-1" /> Cancel
                        </button>
                      )}
                      <p className="text-xs text-[#212121]/60 mt-2">Max 5MB, JPG/PNG</p>
                    </div>
                  </div>
                </div>

                {/* Name Edit */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-[#212121] mb-2">Full Name</label>
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-[#212121] placeholder-gray-400 focus:ring-2 focus:ring-[#212121] focus:border-[#212121] transition-all"
                    placeholder="Enter your full name"
                  />
                </div>

                {/* Save Profile Button */}
                <div className="mb-6">
                  <button
                    onClick={updateProfile}
                    disabled={savingProfile || uploadingAvatar}
                    className="px-6 py-3 bg-[#212121] text-white rounded-xl hover:bg-[#212121]/90 flex items-center gap-2 shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save className="w-5 h-5" />
                    {savingProfile ? 'Saving...' : 'Save Profile Changes'}
                  </button>
                </div>

                {/* Password Change Section */}
                <div className="border-t border-gray-200 pt-6">
                  <h4 className="text-xl font-bold text-[#212121] mb-4">Change Password</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-[#212121] mb-2">Current Password</label>
                      <input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-[#212121] placeholder-gray-400 focus:ring-2 focus:ring-[#212121] focus:border-[#212121] transition-all"
                        placeholder="Enter current password"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#212121] mb-2">New Password</label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-[#212121] placeholder-gray-400 focus:ring-2 focus:ring-[#212121] focus:border-[#212121] transition-all"
                        placeholder="Enter new password (min 6 characters)"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#212121] mb-2">Confirm New Password</label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-[#212121] placeholder-gray-400 focus:ring-2 focus:ring-[#212121] focus:border-[#212121] transition-all"
                        placeholder="Confirm new password"
                      />
                    </div>
                    <button
                      onClick={changePassword}
                      className="px-6 py-3 bg-[#212121] text-white rounded-xl hover:bg-[#212121]/90 shadow-sm transition-all"
                    >
                      Change Password
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Status Control Section */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
              <h3 className="text-xl font-bold text-[#212121] mb-4">Update Your Status</h3>
              <div className="space-y-4">
                {/* Status Note - show when user is busy, important, or when adding a note */}
                {(currentUser?.status === 'busy' || currentUser?.status === 'important' || (currentUser?.status === 'free' && statusNote)) && (
                  <div>
                    <label className="block text-sm font-medium text-[#212121] mb-2">
                      Status Note {currentUser?.status === 'free' && '(optional, for busy status)'}
                    </label>
                    <input
                      type="text"
                      value={statusNote}
                      onChange={(e) => setStatusNote(e.target.value)}
                      placeholder="e.g., In a meeting, Working on urgent task..."
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-[#212121] placeholder-gray-400 focus:ring-2 focus:ring-[#212121] focus:border-[#212121] transition-all"
                    />
                  </div>
                )}

                {/* Duration - only show when status note is set (for busy status only, not for important) */}
                {statusNote && currentUser?.status === 'busy' && (
                  <div>
                    <label className="block text-sm font-medium text-[#212121] mb-2">Busy Duration</label>
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        {[15, 30, 60, 120].map(duration => (
                          <button
                            key={duration}
                            onClick={() => {
                              setBusyDuration(duration);
                              setUseCustomDuration(false);
                              setCustomDuration('');
                              // Auto-update if already busy (not for important)
                              if (currentUser?.status === 'busy') {
                                updateStatus('busy', duration);
                              }
                            }}
                              className={`flex-1 py-3 rounded-xl font-bold transition-all ${
                              !useCustomDuration && busyDuration === duration
                                ? 'bg-[#212121] text-white shadow-lg scale-105'
                                : 'bg-white text-[#212121] hover:bg-gray-50 border border-gray-300'
                            }`}
                          >
                            {duration}m
                          </button>
                        ))}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            const newUseCustom = !useCustomDuration;
                            setUseCustomDuration(newUseCustom);
                            if (newUseCustom && currentUser?.status === 'busy' && customDuration) {
                              const customMin = parseInt(customDuration);
                              if (!isNaN(customMin) && customMin > 0) {
                                updateStatus('busy', customMin);
                              }
                            }
                          }}
                          className={`px-4 py-2 rounded-xl font-medium transition-all ${
                            useCustomDuration
                              ? 'bg-[#212121] text-white'
                              : 'bg-white text-[#212121] hover:bg-gray-50 border border-gray-300'
                          }`}
                        >
                          Custom
                        </button>
                        {useCustomDuration && (
                          <div className="flex-1 flex items-center gap-2">
                            <input
                              type="number"
                              min="1"
                              value={customDuration}
                              onChange={(e) => {
                                const newValue = e.target.value;
                                setCustomDuration(newValue);
                                
                                // Clear existing timeout
                                if (customDurationTimeoutRef.current) {
                                  clearTimeout(customDurationTimeoutRef.current);
                                }
                                
                                // Auto-update if already busy and valid input (with debounce)
                                if (currentUser?.status === 'busy' && newValue) {
                                  const customMin = parseInt(newValue);
                                  if (!isNaN(customMin) && customMin > 0) {
                                    // Debounce the update - wait 1 second after user stops typing
                                    customDurationTimeoutRef.current = setTimeout(() => {
                                      updateStatus('busy', customMin);
                                    }, 1000);
                                  }
                                }
                              }}
                              onBlur={(e) => {
                                // Clear timeout and update immediately when user leaves the field
                                if (customDurationTimeoutRef.current) {
                                  clearTimeout(customDurationTimeoutRef.current);
                                }
                                if (currentUser?.status === 'busy' && e.target.value) {
                                  const customMin = parseInt(e.target.value);
                                  if (!isNaN(customMin) && customMin > 0) {
                                    updateStatus('busy', customMin);
                                  }
                                }
                              }}
                              placeholder="Minutes"
                              className="flex-1 px-4 py-3 bg-white border border-gray-300 rounded-xl text-[#212121] placeholder-gray-400 focus:ring-2 focus:ring-[#212121] focus:border-[#212121] transition-all"
                            />
                            <span className="text-[#212121]/70 text-sm">minutes</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-3 pt-4">
                  <button
                    onClick={() => updateStatus('free')}
                    className="py-4 bg-[#166534] text-white rounded-xl hover:bg-[#166534]/90 font-bold text-lg shadow-sm transition-all"
                  >
                    ✓ Free
                  </button>
                  <button
                    onClick={() => updateStatus('busy')}
                    className="py-4 bg-[#991b1b] text-white rounded-xl hover:bg-[#991b1b]/90 font-bold text-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                  >
                    ✕ Busy
                  </button>
                  <button
                    onClick={() => updateStatus('important')}
                    className="py-4 bg-[#f97316] text-white rounded-xl hover:bg-[#f97316]/90 font-bold text-lg shadow-sm transition-all"
                  >
                    ⚠ Important
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            {currentUser?.role === 'admin' && (
              <button
                onClick={() => setView('admin')}
                className="flex-1 py-3 bg-[#212121] text-white rounded-xl hover:bg-[#212121]/90 shadow-lg transition-all"
              >
                Admin Panel
              </button>
            )}
            <button
              onClick={() => setView('public')}
              className="flex-1 py-3 bg-white border border-gray-300 text-[#212121] rounded-xl hover:bg-gray-50 transition-all"
            >
              View Public Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Admin Panel - Enhanced Design
  if (view === 'admin' && currentUser?.role === 'admin') {
    return (
      <div className="min-h-screen bg-gradient-image-static p-4 md:p-8">
        {/* Animated background */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
              <h1 className="text-4xl md:text-5xl font-extrabold text-[#212121] mb-2">
                Admin Panel
              </h1>
              {sessionTimeLeft && (
                <p className="text-[#212121]/70 text-sm flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Session: <span className="font-bold text-[#212121]">{sessionTimeLeft}</span>
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setView('employee')}
                className="px-5 py-2.5 bg-[#212121] text-white rounded-xl hover:bg-[#212121]/90 shadow-sm transition-all"
              >
                My Control Panel
              </button>
              <button
                onClick={() => setView('public')}
                className="px-5 py-2.5 bg-[#212121] text-white rounded-xl hover:bg-[#212121]/90 shadow-lg transition-all"
              >
                View Dashboard
              </button>
              <button
                onClick={handleLogout}
                className="px-5 py-2.5 bg-[#212121] text-white rounded-xl hover:bg-[#212121]/90 flex items-center gap-2 shadow-sm transition-all"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 p-6 md:p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <h2 className="text-3xl font-bold text-[#212121]">
                Manage Employees
              </h2>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-6 py-3 bg-[#212121] text-white rounded-xl hover:bg-[#212121]/90 flex items-center gap-2 shadow-sm transition-all"
              >
                <Plus className="w-5 h-5" />
                Add Employee
              </button>
            </div>

            <div className="space-y-3">
              {employees.length === 0 ? (
                <div className="text-center py-12 text-[#212121]/70">
                  <User className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-xl">No employees yet</p>
                  <p className="text-sm mt-2">Click "Add Employee" to get started</p>
                </div>
              ) : (
                employees.map(emp => (
                  <div key={emp.id} className="bg-white border border-gray-200 rounded-2xl p-5 hover:bg-gray-50 transition-all shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <img 
                            src={emp.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.full_name)}`}
                            alt={emp.full_name}
                            className="w-16 h-16 rounded-full border-2 border-white/30 shadow-lg"
                          />
                          <div className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white ${
                            emp.status === 'free' ? 'bg-[#166534]' : 
                            emp.status === 'important' ? 'bg-[#f97316]' : 
                            'bg-[#991b1b]'
                          }`}></div>
                        </div>
                        <div>
                          <h3 className="font-bold text-[#212121] text-lg">{emp.full_name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                              emp.role === 'admin' 
                                ? 'bg-[#212121] text-white border border-[#212121]' 
                                : 'bg-gray-200 text-[#212121] border border-gray-300'
                            }`}>
                              {emp.role}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold text-white ${
                              emp.status === 'free' 
                                ? 'bg-[#166534] border border-[#166534]' 
                                : emp.status === 'important'
                                ? 'bg-[#f97316] border border-[#f97316]'
                                : 'bg-[#991b1b] border border-[#991b1b]'
                            }`}>
                              {emp.status === 'free' ? 'Free' : 
                               emp.status === 'important' ? 'Important' : 
                               'Busy'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditingEmployee(emp)}
                          className="p-3 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-xl border border-blue-400/30 hover:border-blue-400 transition-all"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                        {emp.id !== currentUser.id && (
                          <button
                            onClick={() => deleteEmployee(emp.id)}
                            className="p-3 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-xl border border-red-400/30 hover:border-red-400 transition-all"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Add Employee Modal - Enhanced */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={(e) => e.target === e.currentTarget && setShowAddModal(false)}>
            <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-8 max-w-md w-full relative overflow-hidden">
              {/* Decorative gradient */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
              
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-[#166534] rounded-xl flex items-center justify-center shadow-lg">
                    <Plus className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-3xl font-bold text-[#212121]">Add New Employee</h3>
                </div>
                
                <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-[#212121] mb-2">Username</label>
                      <input
                        type="text"
                        value={newEmployee.username}
                        onChange={(e) => setNewEmployee({...newEmployee, username: e.target.value})}
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-[#212121] placeholder-gray-400 focus:ring-2 focus:ring-[#212121] focus:border-[#212121] transition-all"
                        placeholder="Unique username for login"
                      />
                      <p className="text-xs text-[#212121]/60 mt-1">Username must be unique</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#212121] mb-2">Full Name</label>
                    <input
                      type="text"
                      value={newEmployee.full_name}
                      onChange={(e) => setNewEmployee({...newEmployee, full_name: e.target.value})}
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-[#212121] placeholder-gray-400 focus:ring-2 focus:ring-[#212121] focus:border-[#212121] transition-all"
                      placeholder="Employee's full name"
                    />
                  </div>
                    <div>
                      <label className="block text-sm font-medium text-[#212121] mb-2">Password</label>
                    <input
                      type="password"
                      value={newEmployee.password}
                      onChange={(e) => setNewEmployee({...newEmployee, password: e.target.value})}
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-[#212121] placeholder-gray-400 focus:ring-2 focus:ring-[#212121] focus:border-[#212121] transition-all"
                      placeholder="Min 6 characters"
                    />
                  </div>
                    <div>
                      <label className="block text-sm font-medium text-[#212121] mb-2">Role</label>
                      <select
                        value={newEmployee.role}
                        onChange={(e) => setNewEmployee({...newEmployee, role: e.target.value})}
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-[#212121] focus:ring-2 focus:ring-[#212121] focus:border-[#212121] transition-all"
                      >
                        <option value="employee">Employee</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                    <div className="flex gap-3 pt-4">
                      <button
                        onClick={addEmployee}
                        className="flex-1 py-3 bg-[#166534] text-white rounded-xl hover:bg-[#166534]/90 shadow-lg hover:shadow-xl transition-all transform hover:scale-105 font-semibold"
                      >
                        Add Employee
                      </button>
                    <button
                      onClick={() => setShowAddModal(false)}
                      className="flex-1 py-3 bg-white border border-gray-300 text-[#212121] rounded-xl hover:bg-gray-50 transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Employee Modal - Enhanced */}
        {editingEmployee && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={(e) => e.target === e.currentTarget && setEditingEmployee(null)}>
            <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 p-8 max-w-md w-full max-h-[90vh] overflow-y-auto relative overflow-hidden">
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-[#212121] rounded-xl flex items-center justify-center shadow-lg">
                    <Edit2 className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-3xl font-bold text-[#212121]">Edit Employee</h3>
                </div>
                
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-[#212121] mb-2">Username</label>
                    <input
                      type="text"
                      value={editingEmployee.username || ''}
                      onChange={(e) => setEditingEmployee({...editingEmployee, username: e.target.value})}
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-[#212121] placeholder-gray-400 focus:ring-2 focus:ring-[#212121] focus:border-[#212121] transition-all"
                      placeholder="Username"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#212121] mb-2">Full Name</label>
                    <input
                      type="text"
                      value={editingEmployee.full_name}
                      onChange={(e) => setEditingEmployee({...editingEmployee, full_name: e.target.value})}
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-[#212121] placeholder-gray-400 focus:ring-2 focus:ring-[#212121] focus:border-[#212121] transition-all"
                      placeholder="Employee's full name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#212121] mb-2">Role</label>
                    <select
                      value={editingEmployee.role}
                      onChange={(e) => setEditingEmployee({...editingEmployee, role: e.target.value})}
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-[#212121] focus:ring-2 focus:ring-[#212121] focus:border-[#212121] transition-all"
                    >
                      <option value="employee">Employee</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#212121] mb-3">Avatar</label>
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="absolute inset-0 bg-blue-400 rounded-full blur-xl opacity-50"></div>
                        <img 
                          src={editingEmployee.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(editingEmployee.full_name)}`}
                          alt="Avatar"
                          className="relative w-20 h-20 rounded-full border-4 border-white shadow-xl"
                        />
                      </div>
                      <label className="cursor-pointer inline-flex items-center px-5 py-2.5 bg-[#212121] text-white rounded-xl hover:bg-[#212121]/90 shadow-lg transition-all">
                        <Upload className="w-4 h-4 mr-2" />
                        Change Avatar
                        <input
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files[0];
                            if (file) {
                              if (!file.type.startsWith('image/')) {
                                alert('Please select an image file');
                                return;
                              }
                              if (file.size > 5 * 1024 * 1024) {
                                alert('Image size must be less than 5MB');
                                return;
                              }
                              const avatarUrl = await uploadAvatar(file, editingEmployee.id);
                              if (avatarUrl) {
                                setEditingEmployee({...editingEmployee, avatar_url: avatarUrl});
                              }
                            }
                          }}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={async () => {
                        const updates = {
                          username: editingEmployee.username,
                          full_name: editingEmployee.full_name,
                          role: editingEmployee.role
                        };
                        if (editingEmployee.avatar_url) {
                          updates.avatar_url = editingEmployee.avatar_url;
                        }
                        await updateEmployee(editingEmployee.id, updates);
                      }}
                      className="flex-1 py-3 bg-[#212121] text-white rounded-xl hover:bg-[#212121]/90 shadow-lg hover:shadow-xl transition-all transform hover:scale-105 font-semibold"
                    >
                      Save Changes
                    </button>
                    <button
                      onClick={() => setEditingEmployee(null)}
                      className="flex-1 py-3 bg-white border border-gray-300 text-[#212121] rounded-xl hover:bg-gray-50 transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
};

export default App;
