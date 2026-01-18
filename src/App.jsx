import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Clock, User, Plus, Trash2, Edit2, LogOut, Eye, EyeOff, Settings, Upload, Save, X } from 'lucide-react';

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
            
            // Update employees list IMMEDIATELY when any profile is updated
            setEmployees(prev => {
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
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', savedUserId)
        .single();
      
      if (profile) {
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
      
      // Calculate and sync busy duration if user is busy
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
    if (!currentUser) return;

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
      status_note: status === 'free' ? null : statusNote, // Clear status_note when setting to free
      busy_until: status === 'busy' ? new Date(Date.now() + durationMinutes * 60000).toISOString() : null,
      updated_at: new Date().toISOString()
    };

    const { error, data } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', currentUser.id)
      .select(); // Select to ensure realtime triggers

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
    if (!currentUser) return;

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
        const { error } = await supabase
          .from('profiles')
          .update(updates)
          .eq('id', currentUser.id);

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

      // Update password in database
      const { error } = await supabase
        .from('profiles')
        .update({ password_hash: hashedPassword })
        .eq('id', currentUser.id);

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
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', id);
    
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

  // Timer component
  const Timer = ({ busyUntil }) => {
    const [time, setTime] = useState(getTimeRemaining(busyUntil));

    useEffect(() => {
      const interval = setInterval(() => {
        setTime(getTimeRemaining(busyUntil));
      }, 1000);
      return () => clearInterval(interval);
    }, [busyUntil]);

    if (!time || time === 'Expired') return null;
    
    return (
      <div className="flex items-center gap-1 text-xs font-semibold">
        <Clock className="w-3 h-3" />
        {time}
      </div>
    );
  };

  // Employee Card Component - Compact Design
  const EmployeeCard = ({ employee }) => {
    const isFree = employee.status === 'free';
    const avatarUrl = employee.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.full_name)}&background=4F46E5&color=fff&size=64`;

    return (
      <div 
        className={`
          group relative overflow-hidden rounded-xl p-4 transition-all duration-300 transform hover:scale-105 hover:shadow-xl
          ${isFree 
            ? 'bg-gradient-to-br from-emerald-500 via-green-500 to-teal-500 shadow-lg shadow-green-500/30' 
            : 'bg-gradient-to-br from-rose-500 via-red-500 to-pink-500 shadow-lg shadow-red-500/30 opacity-90'
          }
        `}
      >
        <div className="relative flex items-center gap-3 text-white">
          {/* Avatar - smaller */}
          <div className={`relative flex-shrink-0 ${isFree ? 'animate-pulse-slow' : ''}`}>
            <div className={`absolute inset-0 rounded-full ${isFree ? 'bg-green-400' : 'bg-red-400'} blur-md opacity-40`}></div>
            <img 
              src={avatarUrl} 
              alt={employee.full_name}
              className="relative w-16 h-16 rounded-full border-2 border-white shadow-lg"
            />
            {/* Status indicator - smaller */}
            <div className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white ${isFree ? 'bg-green-400' : 'bg-red-400'}`}>
              {isFree && <div className="w-full h-full rounded-full bg-green-400 animate-ping opacity-75"></div>}
            </div>
          </div>

          {/* Name and status - compact */}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold mb-1 truncate drop-shadow-sm">{employee.full_name}</h3>
            <div className={`
              inline-block px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm
              ${isFree 
                ? 'bg-white/30 text-white' 
                : 'bg-black/30 text-white'
              }
            `}>
              {isFree ? '✓ Available' : '✕ Busy'}
            </div>
            {employee.status_note && (
              <p className="text-xs mt-1.5 text-white/90 truncate italic">
                "{employee.status_note}"
              </p>
            )}
            {!isFree && employee.busy_until && (
              <div className="mt-1.5">
                <Timer busyUntil={employee.busy_until} />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-purple-300 text-xl font-semibold">Loading...</div>
        </div>
      </div>
    );
  }

  // Public View - Enhanced Modern Design
  // This is a shared/public display - no login indicators shown
  if (view === 'public') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 md:p-8">
        {/* Hidden admin access - only visible if admin is logged in and wants to access admin panel */}
        {/* This is intentionally hidden to keep the public dashboard clean for shared screens */}
        {currentUser && currentUser.role === 'admin' && (
          <div className="fixed top-2 right-2 z-50 opacity-0 hover:opacity-100 transition-opacity">
            <button
              onClick={() => setView('admin')}
              className="px-3 py-1.5 bg-purple-600/20 text-purple-300 rounded-lg hover:bg-purple-600/40 text-xs border border-purple-500/30"
              title="Admin Access"
            >
              Admin
            </button>
          </div>
        )}
        {/* Animated background elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          {/* Header with stats */}
          <div className="mb-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <h1 className="text-5xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 mb-2">
                Team Status
              </h1>
              <button
                onClick={() => setView('login')}
                className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                <User className="w-5 h-5" />
                Staff Login
              </button>
            </div>

          </div>
          
          {/* Employee Cards Grid - More compact */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
            {employees.length === 0 ? (
              <div className="col-span-full text-center py-20">
                <div className="text-purple-300 text-xl">No employees found</div>
              </div>
            ) : (
              employees
                .sort((a, b) => {
                  if (a.status === 'free' && b.status !== 'free') return -1;
                  if (a.status !== 'free' && b.status === 'free') return 1;
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        </div>
        
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 w-full max-w-md relative z-10">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg">
              <User className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 mb-2">Staff Login</h2>
            <p className="text-purple-200 text-sm">Enter your credentials to continue</p>
          </div>
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-purple-200 mb-2">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-purple-300 focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-all"
                placeholder="Enter your username"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-purple-200 mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                  className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-purple-300 focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-all pr-12"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-300 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <button
              onClick={handleLogin}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl hover:from-indigo-700 hover:to-purple-700 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              Sign In
            </button>
            <button
              onClick={() => setView('public')}
              className="w-full bg-white/10 backdrop-blur-sm border border-white/20 text-purple-200 py-3 rounded-xl hover:bg-white/20 font-semibold transition-all"
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 p-4 md:p-8">
        {/* Animated background */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        </div>

        <div className="max-w-4xl mx-auto relative z-10">
          {/* Header with session timer */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
              <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 mb-2">
                Control Panel
              </h1>
              {sessionTimeLeft && (
                <p className="text-indigo-300 text-sm flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Session expires in: <span className="font-bold text-white">{sessionTimeLeft}</span>
                </p>
              )}
            </div>
            <div className="flex gap-2">
              {currentUser?.role === 'admin' && (
                <button
                  onClick={() => setView('admin')}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 flex items-center gap-2 shadow-lg transition-all"
                >
                  Admin Panel
                </button>
              )}
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl hover:from-red-700 hover:to-rose-700 flex items-center gap-2 shadow-lg transition-all"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-6 md:p-8">
            {/* User Info Card */}
            <div className="bg-gradient-to-br from-indigo-500/20 to-purple-500/20 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-white/10">
              <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className={`absolute inset-0 rounded-full ${currentUser.status === 'free' ? 'bg-green-400' : 'bg-red-400'} blur-xl opacity-50`}></div>
                    <img 
                      src={currentUser.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.full_name)}`}
                      alt={currentUser.full_name}
                      className="relative w-24 h-24 rounded-full border-4 border-white shadow-2xl"
                    />
                    <div className={`absolute bottom-0 right-0 w-6 h-6 rounded-full border-4 border-white ${currentUser.status === 'free' ? 'bg-green-400' : 'bg-red-400'}`}>
                      {currentUser.status === 'free' && <div className="w-full h-full rounded-full bg-green-400 animate-ping opacity-75"></div>}
                    </div>
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-white mb-1">{currentUser.full_name}</h2>
                    <div className="flex items-center gap-2">
                      <div className={`px-3 py-1 rounded-full text-sm font-bold ${currentUser.status === 'free' ? 'bg-green-500/30 text-green-200 border border-green-400' : 'bg-red-500/30 text-red-200 border border-red-400'}`}>
                        {currentUser.status === 'free' ? '✓ Available' : '✕ Busy'}
                      </div>
                      {currentUser.role === 'admin' && (
                        <div className="px-3 py-1 rounded-full text-sm font-bold bg-purple-500/30 text-purple-200 border border-purple-400">
                          Admin
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowProfileSettings(!showProfileSettings)}
                  className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 flex items-center gap-2 shadow-lg transition-all"
                >
                  <Settings className="w-4 h-4" />
                  {showProfileSettings ? 'Hide Settings' : 'Edit Profile'}
                </button>
              </div>
            </div>

            {/* Profile Settings Section */}
            {showProfileSettings && (
              <div className="mb-6 p-6 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10">
                <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                  <Settings className="w-6 h-6" />
                  Profile Settings
                </h3>
                
                {/* Avatar Upload */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-indigo-200 mb-3">Profile Picture</label>
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
                          <div className="text-white text-sm font-semibold">Uploading...</div>
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="cursor-pointer inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 shadow-lg transition-all">
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
                          className="ml-2 px-3 py-1.5 text-sm bg-red-500/20 text-red-300 hover:bg-red-500/30 rounded-lg border border-red-400/30 transition-all"
                        >
                          <X className="w-4 h-4 inline mr-1" /> Cancel
                        </button>
                      )}
                      <p className="text-xs text-indigo-300 mt-2">Max 5MB, JPG/PNG</p>
                    </div>
                  </div>
                </div>

                {/* Name Edit */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-indigo-200 mb-2">Full Name</label>
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-indigo-300 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all"
                    placeholder="Enter your full name"
                  />
                </div>

                {/* Save Profile Button */}
                <div className="mb-6">
                  <button
                    onClick={updateProfile}
                    disabled={savingProfile || uploadingAvatar}
                    className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-xl hover:from-emerald-600 hover:to-green-600 flex items-center gap-2 shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
                  >
                    <Save className="w-5 h-5" />
                    {savingProfile ? 'Saving...' : 'Save Profile Changes'}
                  </button>
                </div>

                {/* Password Change Section */}
                <div className="border-t border-white/20 pt-6">
                  <h4 className="text-xl font-bold text-white mb-4">Change Password</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-indigo-200 mb-2">Current Password</label>
                      <input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-indigo-300 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all"
                        placeholder="Enter current password"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-indigo-200 mb-2">New Password</label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-indigo-300 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all"
                        placeholder="Enter new password (min 6 characters)"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-indigo-200 mb-2">Confirm New Password</label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-indigo-300 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all"
                        placeholder="Confirm new password"
                      />
                    </div>
                    <button
                      onClick={changePassword}
                      className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                    >
                      Change Password
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Status Control Section */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
              <h3 className="text-xl font-bold text-white mb-4">Update Your Status</h3>
              <div className="space-y-4">
                {/* Status Note - only show when user is busy or when they want to add a note for busy status */}
                {/* When user is free, status note is cleared and hidden (user can add note when setting to busy) */}
                {(currentUser?.status === 'busy' || statusNote) && (
                  <div>
                    <label className="block text-sm font-medium text-indigo-200 mb-2">
                      Status Note {currentUser?.status === 'free' && '(optional, for busy status)'}
                    </label>
                    <input
                      type="text"
                      value={statusNote}
                      onChange={(e) => setStatusNote(e.target.value)}
                      placeholder="e.g., In a meeting, Working on urgent task..."
                      className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-indigo-300 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all"
                    />
                  </div>
                )}

                {/* Busy Duration - only show when status note is set (required for busy status) */}
                {statusNote && (
                  <div>
                    <label className="block text-sm font-medium text-indigo-200 mb-2">Busy Duration</label>
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        {[15, 30, 60, 120].map(duration => (
                          <button
                            key={duration}
                            onClick={() => {
                              setBusyDuration(duration);
                              setUseCustomDuration(false);
                              setCustomDuration('');
                              // Auto-update if already busy
                              if (currentUser?.status === 'busy') {
                                updateStatus('busy', duration);
                              }
                            }}
                            className={`flex-1 py-3 rounded-xl font-bold transition-all ${
                              !useCustomDuration && busyDuration === duration
                                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg scale-105'
                                : 'bg-white/10 text-indigo-200 hover:bg-white/20 border border-white/20'
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
                              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                              : 'bg-white/10 text-indigo-200 hover:bg-white/20 border border-white/20'
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
                              className="flex-1 px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-indigo-300 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all"
                            />
                            <span className="text-indigo-200 text-sm">minutes</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-4 pt-4">
                  <button
                    onClick={() => updateStatus('free')}
                    className="flex-1 py-4 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-xl hover:from-emerald-600 hover:to-green-600 font-bold text-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                  >
                    ✓ Set as Free
                  </button>
                  <button
                    onClick={() => updateStatus('busy')}
                    className="flex-1 py-4 bg-gradient-to-r from-rose-500 to-red-500 text-white rounded-xl hover:from-rose-600 hover:to-red-600 font-bold text-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                  >
                    ✕ Set as Busy
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            {currentUser?.role === 'admin' && (
              <button
                onClick={() => setView('admin')}
                className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 shadow-lg transition-all"
              >
                Admin Panel
              </button>
            )}
            <button
              onClick={() => setView('public')}
              className="flex-1 py-3 bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-xl hover:bg-white/20 transition-all"
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 md:p-8">
        {/* Animated background */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
              <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 mb-2">
                Admin Panel
              </h1>
              {sessionTimeLeft && (
                <p className="text-purple-300 text-sm flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Session: <span className="font-bold text-white">{sessionTimeLeft}</span>
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setView('employee')}
                className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:from-blue-700 hover:to-cyan-700 shadow-lg transition-all"
              >
                My Control Panel
              </button>
              <button
                onClick={() => setView('public')}
                className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 shadow-lg transition-all"
              >
                View Dashboard
              </button>
              <button
                onClick={handleLogout}
                className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl hover:from-red-700 hover:to-rose-700 flex items-center gap-2 shadow-lg transition-all"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-6 md:p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-purple-200">
                Manage Employees
              </h2>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-xl hover:from-emerald-600 hover:to-green-600 flex items-center gap-2 shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
              >
                <Plus className="w-5 h-5" />
                Add Employee
              </button>
            </div>

            <div className="space-y-3">
              {employees.length === 0 ? (
                <div className="text-center py-12 text-purple-300">
                  <User className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-xl">No employees yet</p>
                  <p className="text-sm mt-2">Click "Add Employee" to get started</p>
                </div>
              ) : (
                employees.map(emp => (
                  <div key={emp.id} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <img 
                            src={emp.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.full_name)}`}
                            alt={emp.full_name}
                            className="w-16 h-16 rounded-full border-2 border-white/30 shadow-lg"
                          />
                          <div className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white ${emp.status === 'free' ? 'bg-green-400' : 'bg-red-400'}`}></div>
                        </div>
                        <div>
                          <h3 className="font-bold text-white text-lg">{emp.full_name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                              emp.role === 'admin' 
                                ? 'bg-purple-500/30 text-purple-200 border border-purple-400' 
                                : 'bg-blue-500/30 text-blue-200 border border-blue-400'
                            }`}>
                              {emp.role}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                              emp.status === 'free' 
                                ? 'bg-green-500/30 text-green-200 border border-green-400' 
                                : 'bg-red-500/30 text-red-200 border border-red-400'
                            }`}>
                              {emp.status}
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
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl shadow-2xl border border-white/20 p-8 max-w-md w-full relative overflow-hidden">
              {/* Decorative gradient */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
              
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-500 rounded-xl flex items-center justify-center shadow-lg">
                    <Plus className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-400">Add New Employee</h3>
                </div>
                
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-purple-200 mb-2">Username</label>
                    <input
                      type="text"
                      value={newEmployee.username}
                      onChange={(e) => setNewEmployee({...newEmployee, username: e.target.value})}
                      className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-purple-300 focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition-all"
                      placeholder="Unique username for login"
                    />
                    <p className="text-xs text-purple-300 mt-1">Username must be unique</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-purple-200 mb-2">Full Name</label>
                    <input
                      type="text"
                      value={newEmployee.full_name}
                      onChange={(e) => setNewEmployee({...newEmployee, full_name: e.target.value})}
                      className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-purple-300 focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition-all"
                      placeholder="Employee's full name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-purple-200 mb-2">Password</label>
                    <input
                      type="password"
                      value={newEmployee.password}
                      onChange={(e) => setNewEmployee({...newEmployee, password: e.target.value})}
                      className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-purple-300 focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition-all"
                      placeholder="Min 6 characters"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-purple-200 mb-2">Role</label>
                    <select
                      value={newEmployee.role}
                      onChange={(e) => setNewEmployee({...newEmployee, role: e.target.value})}
                      className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition-all"
                    >
                      <option value="employee" className="bg-slate-800">Employee</option>
                      <option value="admin" className="bg-slate-800">Admin</option>
                    </select>
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={addEmployee}
                      className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-xl hover:from-emerald-600 hover:to-green-600 shadow-lg hover:shadow-xl transition-all transform hover:scale-105 font-semibold"
                    >
                      Add Employee
                    </button>
                    <button
                      onClick={() => setShowAddModal(false)}
                      className="flex-1 py-3 bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-xl hover:bg-white/20 transition-all"
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
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl shadow-2xl border border-white/20 p-8 max-w-md w-full max-h-[90vh] overflow-y-auto relative overflow-hidden">
              {/* Decorative gradient */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
              
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg">
                    <Edit2 className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Edit Employee</h3>
                </div>
                
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-purple-200 mb-2">Username</label>
                    <input
                      type="text"
                      value={editingEmployee.username || ''}
                      onChange={(e) => setEditingEmployee({...editingEmployee, username: e.target.value})}
                      className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-purple-300 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all"
                      placeholder="Username"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-purple-200 mb-2">Full Name</label>
                    <input
                      type="text"
                      value={editingEmployee.full_name}
                      onChange={(e) => setEditingEmployee({...editingEmployee, full_name: e.target.value})}
                      className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-purple-300 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all"
                      placeholder="Employee's full name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-purple-200 mb-2">Role</label>
                    <select
                      value={editingEmployee.role}
                      onChange={(e) => setEditingEmployee({...editingEmployee, role: e.target.value})}
                      className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all"
                    >
                      <option value="employee" className="bg-slate-800">Employee</option>
                      <option value="admin" className="bg-slate-800">Admin</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-purple-200 mb-3">Avatar</label>
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="absolute inset-0 bg-blue-400 rounded-full blur-xl opacity-50"></div>
                        <img 
                          src={editingEmployee.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(editingEmployee.full_name)}`}
                          alt="Avatar"
                          className="relative w-20 h-20 rounded-full border-4 border-white shadow-xl"
                        />
                      </div>
                      <label className="cursor-pointer inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 shadow-lg transition-all">
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
                      className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl hover:from-blue-600 hover:to-indigo-600 shadow-lg hover:shadow-xl transition-all transform hover:scale-105 font-semibold"
                    >
                      Save Changes
                    </button>
                    <button
                      onClick={() => setEditingEmployee(null)}
                      className="flex-1 py-3 bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-xl hover:bg-white/20 transition-all"
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
