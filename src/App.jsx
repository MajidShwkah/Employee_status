import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Clock, User, Plus, Trash2, Edit2, LogOut, Settings, Upload, Save, X, MessageSquare, Moon, Sun, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from './lib/supabase';
import { useAuth } from './contexts/AuthContext';
import adhanAudio from './Adan.mp3';
import './index.css';

// Google Icon component for OAuth button
const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

// ============================================
// Global Announcement Bar Component
// High-visibility bar for admin notices
// ============================================
const AnnouncementBar = React.memo(({ settings }) => {
  if (!settings?.is_active || !settings?.announcement_text) return null;
  
  return (
    <div className="sticky top-0 z-50 bg-gradient-to-r from-red-600 to-red-700 text-white py-3 px-4 text-center shadow-lg relative overflow-hidden">
      {/* Animated background effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>
      
      <div className="relative flex items-center justify-center gap-3">
        <span className="animate-pulse text-xl">📢</span>
        <p 
          className="text-sm md:text-base font-semibold tracking-wide"
          style={{ unicodeBidi: 'plaintext', direction: 'auto' }}
        >
          {settings.announcement_text}
        </p>
        <span className="animate-pulse text-xl">📢</span>
      </div>
    </div>
  );
});

// ============================================
// Global Layout Shell - Renders immediately, no flicker
// ============================================
const AppShell = ({ children, siteSettings }) => (
  <div className="min-h-screen bg-[#F8F5EF]">
    <AnnouncementBar settings={siteSettings} />
    {children}
  </div>
);

// ============================================
// Content Loading Spinner - Small, inline
// ============================================
const ContentSpinner = ({ message = 'Loading...' }) => (
  <div className="flex flex-col items-center justify-center py-12">
    <div className="relative">
      <div className="w-10 h-10 border-4 border-gray-200 rounded-full"></div>
      <div className="absolute top-0 left-0 w-10 h-10 border-4 border-[#c9a227] border-t-transparent rounded-full animate-spin"></div>
    </div>
    <p className="text-gray-500 text-sm mt-3">{message}</p>
  </div>
);

// ============================================
// TV Alert Component - BIG CENTER Breaking News Style
// Dark glassmorphism with colorful accent border
// ============================================
const TVAlert = React.memo(({ alert, onDismiss, isFirst }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);
  
  useEffect(() => {
    // Auto dismiss after 6 seconds (faster for TV)
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => {
        setIsVisible(false);
        onDismiss(alert.id);
      }, 400);
    }, 6000);
    
    return () => clearTimeout(timer);
  }, [alert.id, onDismiss]);
  
  if (!isVisible) return null;
  
  const statusColors = {
    free: { border: 'border-emerald-500', bg: 'bg-emerald-500', text: 'text-emerald-400', glow: 'shadow-emerald-500/50' },
    busy: { border: 'border-red-500', bg: 'bg-red-500', text: 'text-red-400', glow: 'shadow-red-500/50' },
    important: { border: 'border-orange-500', bg: 'bg-orange-500', text: 'text-orange-400', glow: 'shadow-orange-500/50' },
    note: { border: 'border-blue-500', bg: 'bg-blue-500', text: 'text-blue-400', glow: 'shadow-blue-500/50' }
  };
  
  const colors = statusColors[alert.type] || statusColors.note;
  
  return (
    <div 
      className={`transform transition-all duration-400 ease-out ${
        isExiting ? 'scale-90 opacity-0' : 'scale-100 opacity-100'
      } ${isFirst ? 'animate-bounce-in' : ''}`}
      style={{ unicodeBidi: 'plaintext', direction: 'auto' }}
    >
      <div className={`relative overflow-hidden rounded-2xl border-2 ${colors.border} bg-[#0d0d1a]/95 backdrop-blur-xl shadow-2xl ${colors.glow}`}
           style={{ boxShadow: `0 0 60px ${colors.glow.includes('emerald') ? 'rgba(16,185,129,0.3)' : colors.glow.includes('red') ? 'rgba(239,68,68,0.3)' : colors.glow.includes('orange') ? 'rgba(249,115,22,0.3)' : 'rgba(59,130,246,0.3)'}` }}>
        
        {/* Top banner */}
        <div className={`${colors.bg} px-4 py-2 flex items-center justify-between`}>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-white rounded-full animate-pulse"></span>
            <span className="text-white font-bold text-sm uppercase tracking-wider">Live Update</span>
          </div>
          <span className="text-white/80 text-xs">Just now</span>
        </div>
        
        <div className="relative p-6 flex items-center gap-6">
          {/* Large Avatar */}
          <div className="relative flex-shrink-0">
            <img 
              src={alert.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(alert.name)}&background=random&size=96`}
              alt={alert.name}
              className={`w-24 h-24 rounded-full border-4 ${colors.border} object-cover shadow-xl`}
            />
            <div className={`absolute -bottom-2 -right-2 w-8 h-8 rounded-full ${colors.bg} border-4 border-[#0d0d1a] flex items-center justify-center shadow-lg`}>
              <span className="text-white text-lg font-bold">
                {alert.type === 'free' ? '✓' : alert.type === 'busy' ? '⏱' : alert.type === 'important' ? '!' : '📝'}
              </span>
            </div>
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0" style={{ unicodeBidi: 'plaintext', direction: 'auto' }}>
            <p className="text-white font-bold text-2xl mb-2" style={{ unicodeBidi: 'plaintext', direction: 'auto' }}>
              {alert.name}
            </p>
            <p className={`text-xl ${colors.text} font-semibold`} style={{ unicodeBidi: 'plaintext', direction: 'auto' }}>
              {alert.message}
            </p>
          </div>
          
          {/* Close button */}
          <button 
            onClick={() => {
              setIsExiting(true);
              setTimeout(() => onDismiss(alert.id), 400);
            }}
            className="absolute top-3 right-3 p-2 text-white/40 hover:text-white/80 hover:bg-white/10 rounded-full transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Progress bar */}
        <div className="h-1.5 bg-white/10">
          <div 
            className={`h-full ${colors.bg} animate-shrink`}
            style={{ animationDuration: '6s' }}
          ></div>
        </div>
      </div>
    </div>
  );
});

// ============================================
// TV Alerts Container - CENTER of screen, stacks multiple alerts
// ============================================
const TVAlertsContainer = React.memo(({ alerts, onDismiss }) => {
  if (alerts.length === 0) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      <div className="flex flex-col gap-4 max-w-2xl w-full px-4 pointer-events-auto">
        {alerts.slice(0, 3).map((alert, index) => (
          <TVAlert 
            key={alert.id} 
            alert={alert} 
            onDismiss={onDismiss}
            isFirst={index === 0}
          />
        ))}
        {alerts.length > 3 && (
          <div className="text-center text-white/60 text-sm bg-black/50 rounded-full px-4 py-2 backdrop-blur-sm">
            +{alerts.length - 3} more updates
          </div>
        )}
      </div>
    </div>
  );
});

// ============================================
// NewsTicker Component - Clean, Note-Focused Broadcast Ticker
// Matches website color scheme, name above note (transparent)
// Now with "NEW" badge for recently updated notes
// ============================================
const NewsTicker = React.memo(({ employees, recentlyUpdated = {} }) => {
  const employeesWithNotes = React.useMemo(() => 
    employees.filter(emp => emp.status_note && emp.status_note.trim() !== ''),
    [employees]
  );
  
  if (employeesWithNotes.length === 0) {
    return (
      <div 
        className="w-full overflow-hidden border-b border-[#212121]/10"
        style={{ 
          background: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)'
        }}
      >
        <div className="py-4 px-6 text-center">
          <span className="text-[#212121]/40 text-base italic">
            No notes to display. Employees can add notes from their Control Panel.
          </span>
        </div>
      </div>
    );
  }

  // Note item - Avatar + Name/Note stacked with optional NEW badge
  // ═══════════════════════════════════════════════════════════════
  // 📐 SIZE SETTINGS - Change these values to adjust news bar items:
  //    - Avatar: w-14 h-14 (56px) - Change to w-16 h-16 for bigger
  //    - Name: text-sm - Change to text-base for bigger
  //    - Note: text-xl - Change to text-2xl for bigger
  // ═══════════════════════════════════════════════════════════════
  const NoteItem = ({ emp }) => {
    const isNew = recentlyUpdated[emp.id];
    
    return (
      <div 
        className={`flex items-center gap-4 flex-shrink-0 px-6 relative ${isNew ? 'animate-pulse-subtle' : ''}`}
        style={{ unicodeBidi: 'plaintext', direction: 'auto' }}
      >
        {/* NEW badge */}
        {isNew && (
          <div className="absolute -top-1 -left-1 z-10">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-red-500 text-white animate-bounce shadow-lg">
              NEW
            </span>
          </div>
        )}
        
        {/* Avatar - w-14 h-14 = 56px */}
        <div className={`relative ${isNew ? 'ring-2 ring-red-400 ring-offset-2 ring-offset-white/80 rounded-full' : ''}`}>
          <img 
            src={emp.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.full_name)}&background=e5e5e5&color=212121&size=56`}
            alt={emp.full_name}
            className="w-14 h-14 rounded-full border-2 border-[#212121]/10 object-cover flex-shrink-0"
          />
        </div>
        <div className="flex flex-col">
          {/* Name - text-sm */}
          <span className="text-[#212121]/50 text-sm font-medium uppercase tracking-wider">
            {emp.full_name}
          </span>
          {/* Note text - text-xl (larger) */}
          <span 
            className={`text-[#212121] font-bold text-xl ${isNew ? 'text-red-600' : ''}`}
            style={{ unicodeBidi: 'plaintext', direction: 'auto' }}
          >
            {emp.status_note}
          </span>
        </div>
      </div>
    );
  };

  // Separator between notes
  const Separator = () => (
    <span className="text-[#212121]/20 text-2xl mx-4 flex-shrink-0">•</span>
  );
  
  return (
    <div 
      className="mt-4 overflow-hidden rounded-xl relative ticker-container"
      style={{
        background: 'rgba(255, 255, 255, 0.7)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        border: '1px solid rgba(33, 33, 33, 0.1)',
        boxShadow: '0 2px 12px rgba(0, 0, 0, 0.05)',
      }}
    >
      {/* Gradient edges */}
      <div 
        className="absolute left-0 top-0 bottom-0 w-16 z-10 pointer-events-none"
        style={{ background: 'linear-gradient(to right, rgba(255,255,255,0.9) 0%, transparent 100%)' }}
      />
      <div 
        className="absolute right-0 top-0 bottom-0 w-16 z-10 pointer-events-none"
        style={{ background: 'linear-gradient(to left, rgba(255,255,255,0.9) 0%, transparent 100%)' }}
      />
      
      {/* Marquee track - Dual-list for seamless loop */}
      {/* 📐 PADDING: py-4 = vertical padding. Change to py-5 or py-6 for taller bar */}
      <div className="py-4">
        <div className="ticker-track flex items-center">
          {/* First copy */}
          <div className="ticker-content flex items-center">
            {employeesWithNotes.map((emp, index) => (
              <React.Fragment key={`first-${emp.id}`}>
                <NoteItem emp={emp} />
                {index < employeesWithNotes.length - 1 && <Separator />}
              </React.Fragment>
            ))}
            <Separator />
          </div>
          
          {/* Second copy */}
          <div className="ticker-content flex items-center">
            {employeesWithNotes.map((emp, index) => (
              <React.Fragment key={`second-${emp.id}`}>
                <NoteItem emp={emp} />
                {index < employeesWithNotes.length - 1 && <Separator />}
              </React.Fragment>
            ))}
            <Separator />
          </div>
        </div>
      </div>
    </div>
  );
});

// ============================================
// Notification Component - Colors match status
// ============================================
const Notification = ({ notification, onClose }) => {
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(onClose, 3000);
      return () => clearTimeout(timer);
    }
  }, [notification, onClose]);
  
  if (!notification) return null;
  
  // Colors match status colors
  const colors = {
    free: 'bg-[#166534] border-[#15803d]',
    busy: 'bg-[#991b1b] border-[#b91c1c]',
    important: 'bg-[#ea580c] border-[#f97316]',
    success: 'bg-[#166534] border-[#15803d]',
    error: 'bg-[#991b1b] border-[#b91c1c]',
    info: 'bg-blue-500 border-blue-400'
  };
  
  return (
    <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-xl text-white shadow-lg border-2 ${colors[notification.type] || colors.info} animate-slide-in`}>
      {notification.message}
    </div>
  );
};

// ============================================
// Employee Card Component - Horizontal layout with decorative corner
// ============================================
const EmployeeCard = React.memo(({ employee, onStatusExpired }) => {
  const [countdown, setCountdown] = useState('');
  
  const statusColors = {
    free: 'from-[#166534] to-[#15803d]',
    busy: 'from-[#991b1b] to-[#b91c1c]',
    important: 'from-[#ea580c] to-[#f97316]'
  };
  
  const statusConfig = {
    free: { text: 'Available', icon: '✓', color: 'bg-green-500' },
    busy: { text: 'Busy', icon: '✕', color: 'bg-red-500' },
    important: { text: 'Important', icon: '!', color: 'bg-orange-500' }
  };

  const status = statusConfig[employee.status] || statusConfig.free;

  // Countdown timer for busy status
  useEffect(() => {
    if (employee.status !== 'busy' || !employee.busy_until) {
      setCountdown('');
      return;
    }

    const updateCountdown = () => {
      const now = new Date();
      const busyUntil = new Date(employee.busy_until);
      const diff = busyUntil - now;
      
      if (diff <= 0) {
        setCountdown('');
        if (onStatusExpired) {
          onStatusExpired(employee.id);
        }
        return;
      }
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      if (hours > 0) {
        setCountdown(`${hours}h ${minutes}m`);
      } else if (minutes > 0) {
        setCountdown(`${minutes}m ${seconds}s`);
      } else {
        setCountdown(`${seconds}s`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [employee.status, employee.busy_until, employee.id, onStatusExpired]);

  return (
    <div className={`relative bg-gradient-to-br ${statusColors[employee.status] || statusColors.free} rounded-2xl p-4 shadow-lg border-2 border-white/20 overflow-hidden`}>
      {/* Decorative half circle in top right corner */}
      <div className="absolute -top-6 -right-6 w-16 h-16 bg-white/15 rounded-full"></div>
      <div className="absolute -top-3 -right-3 w-10 h-10 bg-white/10 rounded-full"></div>
      
      {/* Horizontal layout */}
      <div className="flex items-center gap-4 relative z-10">
        {/* Avatar on left */}
        <div className="relative flex-shrink-0">
          <div className="w-14 h-14 rounded-full bg-white/20 p-0.5 shadow-lg">
            <img 
              src={employee.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.full_name)}&background=random&size=56`}
              alt={employee.full_name}
              className="w-full h-full rounded-full object-cover border-2 border-white/60"
            />
          </div>
          {/* Status indicator dot on avatar */}
          <div className={`absolute -bottom-0.5 -right-0.5 w-5 h-5 ${status.color} rounded-full border-2 border-white flex items-center justify-center`}>
            <span className="text-white text-[10px] font-bold">{status.icon}</span>
          </div>
        </div>
        
        {/* Name and Status on right */}
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-white text-lg truncate">{employee.full_name}</h3>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 border border-white/30 backdrop-blur-sm text-white text-sm font-medium shadow-sm">
              {status.text}
              {countdown && <span className="font-mono text-white/80">• {countdown}</span>}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
});

// ============================================
// Maximum busy duration: 24 hours
// ============================================
const MAX_BUSY_DURATION_MINUTES = 24 * 60;

// ============================================
// Main App Component
// ============================================
const App = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    profile: currentUser,
    session,
    isAuthenticated, 
    isAdmin, 
    loading: authLoading,
    profileLoading,
    signingIn,
    initialized,
    authError, 
    signInWithGoogle, 
    signOut: handleLogout,
    updateProfile,
    setAuthError
  } = useAuth();

  // App state
  const [employees, setEmployees] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  
  // Site Settings (Global Announcement)
  const [siteSettings, setSiteSettings] = useState(null);
  const siteSettingsChannelRef = useRef(null);

  // Employee control state
  const [noteText, setNoteText] = useState('');
  const [busyDuration, setBusyDuration] = useState(30);
  const [customDuration, setCustomDuration] = useState('');
  const [useCustomDuration, setUseCustomDuration] = useState(false);
  const [durationWarning, setDurationWarning] = useState('');
  const customDurationTimeoutRef = useRef(null);
  const realtimeChannelRef = useRef(null);
  const isMountedRef = useRef(true);
  const pollingIntervalRef = useRef(null);
  
  // TV Dashboard Real-time Alert States
  const [tvAlerts, setTvAlerts] = useState([]);
  
  // Recently updated - persisted to localStorage so it survives refresh
  const [recentlyUpdated, setRecentlyUpdated] = useState(() => {
    try {
      const saved = localStorage.getItem('recentlyUpdatedNotes');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Filter out expired entries (older than 10 minutes)
        const TEN_MINUTES = 10 * 60 * 1000;
        const now = Date.now();
        const filtered = {};
        Object.keys(parsed).forEach(id => {
          if (now - parsed[id] < TEN_MINUTES) {
            filtered[id] = parsed[id];
          }
        });
        return filtered;
      }
    } catch (e) {
      console.error('Error loading recentlyUpdated from localStorage:', e);
    }
    return {};
  });
  
  // Ref to hold current employees for realtime callbacks
  const employeesRef = useRef([]);
  
  // Dismiss TV alert
  const dismissTvAlert = useCallback((alertId) => {
    setTvAlerts(prev => prev.filter(a => a.id !== alertId));
  }, []);
  
  // Keep employeesRef in sync with employees state
  useEffect(() => {
    employeesRef.current = employees;
  }, [employees]);
  
  // Persist recentlyUpdated to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('recentlyUpdatedNotes', JSON.stringify(recentlyUpdated));
    } catch (e) {
      console.error('Error saving recentlyUpdated to localStorage:', e);
    }
  }, [recentlyUpdated]);
  
  // Cleanup recently updated entries after 10 minutes
  useEffect(() => {
    const TEN_MINUTES = 3 * 60 * 1000;
    const interval = setInterval(() => {
      const now = Date.now();
      setRecentlyUpdated(prev => {
        const updated = { ...prev };
        let changed = false;
        Object.keys(updated).forEach(id => {
          if (now - updated[id] > TEN_MINUTES) {
            delete updated[id];
            changed = true;
          }
        });
        return changed ? updated : prev;
      });
    }, 30000); // Check every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  // Profile editing state
  const [showProfileSettings, setShowProfileSettings] = useState(false);
  const [editingName, setEditingName] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  // Admin state
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [isAnnouncementOpen, setIsAnnouncementOpen] = useState(false);

  // Notification state
  const [notification, setNotification] = useState(null);

  // Prayer times state
  const [prayerTimes, setPrayerTimes] = useState(null);
  const [nextPrayer, setNextPrayer] = useState(null);
  const [countdown, setCountdown] = useState('');
  const [lastPlayedPrayer, setLastPlayedPrayer] = useState(null);
  const [prayerDateInfo, setPrayerDateInfo] = useState(null);
  const [currentTime, setCurrentTime] = useState('');
  const adhanAudioRef = useRef(null);

  // Show notification helper
  const showNotification = useCallback((message, type = 'info') => {
    setNotification({ message, type });
  }, []);

  // Clear notification on route change
  useEffect(() => {
    setNotification(null);
  }, [location.pathname]);

  // ============================================
  // Data Fetching (must be before handleStatusExpired)
  // ============================================
  
  // Fetch Site Settings (Global Announcement)
  const fetchSiteSettings = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .eq('id', 'global_config')
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching site settings:', error);
        return;
      }
      
      if (data) {
        console.log('📢 Site settings loaded:', data.is_active ? 'Active' : 'Inactive');
        setSiteSettings(data);
      } else {
        // Create default settings if not exists
        const defaultSettings = {
          id: 'global_config',
          announcement_text: '⚠️ Security Upgrade: Please login using your @getrime.com Google account only. Old notes have been migrated.',
          is_active: true,
          updated_at: new Date().toISOString()
        };
        const { error: insertError } = await supabase
          .from('site_settings')
          .insert(defaultSettings);
        
        if (!insertError) {
          setSiteSettings(defaultSettings);
        }
      }
    } catch (err) {
      console.error('Exception fetching site settings:', err);
    }
  }, []);
  
  const fetchEmployees = useCallback(async () => {
    try {
      const { data, error, status, statusText } = await supabase
        .from('user_profiles')
        .select('*')
        .order('full_name');
      
      if (error) {
        console.error('❌ Error fetching employees:', error);
        console.error('   Status:', status, statusText);
        return;
      }
      
      if (!isMountedRef.current) return;
      
      const newData = data || [];
      const oldData = employeesRef.current;
      
      // Detect changes and trigger TV alerts (for polling-based updates)
      if (oldData.length > 0 && newData.length > 0) {
        newData.forEach(newEmp => {
          const oldEmp = oldData.find(e => e.id === newEmp.id);
          if (oldEmp) {
            // Status changed
            if (oldEmp.status !== newEmp.status) {
              console.log('🔔 POLLING: Status change detected for', newEmp.full_name);
              
              // Calculate busy duration message
              let statusMessage = 'updated their status';
              if (newEmp.status === 'free') {
                statusMessage = 'is now Available ✓';
              } else if (newEmp.status === 'important') {
                statusMessage = 'Can be reached for important matters only ⚠️';
              } else if (newEmp.status === 'busy') {
                if (newEmp.busy_until) {
                  const busyUntil = new Date(newEmp.busy_until);
                  const now = new Date();
                  const diffMs = busyUntil - now;
                  const diffMins = Math.round(diffMs / 60000);
                  if (diffMins > 0) {
                    if (diffMins >= 60) {
                      const hours = Math.floor(diffMins / 60);
                      const mins = diffMins % 60;
                      statusMessage = `Will be busy for ${hours}h ${mins}m ⏱`;
                    } else {
                      statusMessage = `Will be busy for ${diffMins} minutes ⏱`;
                    }
                  } else {
                    statusMessage = 'is now Busy ⏱';
                  }
                } else {
                  statusMessage = 'is now Busy ⏱';
                }
              }
              
              setTvAlerts(prev => {
                // Allow multiple status changes - only block exact same status within 3 seconds
                const alertId = `${newEmp.id}-status-${newEmp.status}-${Date.now()}`;
                const recentSameStatus = prev.find(a => 
                  a.id.includes(`${newEmp.id}-status-${newEmp.status}`) && 
                  (Date.now() - parseInt(a.id.split('-').pop())) < 3000
                );
                if (recentSameStatus) return prev; // Only block if same exact status within 3 sec
                return [...prev, {
                  id: alertId,
                  type: newEmp.status,
                  name: newEmp.full_name,
                  avatar: newEmp.avatar_url,
                  message: statusMessage
                }];
              });
            }
            
            // Note changed
            if (oldEmp.status_note !== newEmp.status_note && newEmp.status_note) {
              console.log('🔔 POLLING: Note change detected for', newEmp.full_name);
              setTvAlerts(prev => {
                // Allow multiple note changes - only block exact same note within 5 seconds
                const noteHash = newEmp.status_note.substring(0, 20);
                const recentSameNote = prev.find(a => 
                  a.id.includes(`${newEmp.id}-note`) && 
                  a.message.includes(noteHash)
                );
                if (recentSameNote) return prev;
                return [...prev, {
                  id: `${newEmp.id}-note-${Date.now()}`,
                  type: 'note',
                  name: newEmp.full_name,
                  avatar: newEmp.avatar_url,
                  message: `📝 "${newEmp.status_note.substring(0, 50)}${newEmp.status_note.length > 50 ? '...' : ''}"`
                }];
              });
              
              // Mark as recently updated
              setRecentlyUpdated(prev => ({
                ...prev,
                [newEmp.id]: Date.now()
              }));
            }
          }
        });
      }
      
      setEmployees(newData);
      setDataLoading(false);
    } catch (err) {
      console.error('❌ Exception fetching employees:', err);
      if (isMountedRef.current) {
        setDataLoading(false);
      }
    }
  }, []);

  // Fetch prayer times from API
  const fetchPrayerTimes = useCallback(async () => {
    try {
      const today = new Date();
      const year = today.getFullYear();
      const month = today.getMonth() + 1;
      const day = today.getDate();
      
      const response = await fetch(
        `https://api.aladhan.com/v1/timings/${day}-${month}-${year}?latitude=31.7683&longitude=35.2137&method=4`
      );
      const data = await response.json();
      
      if (data.code === 200 && data.data) {
        setPrayerTimes(data.data.timings);
        setPrayerDateInfo(data.data.date);
      }
    } catch (err) {
      console.error('Error fetching prayer times:', err);
    }
  }, []);

  // Handle status expiration - auto change to Available
  const handleStatusExpired = useCallback(async (employeeId) => {
    // Only auto-change if it's the current user
    if (currentUser && employeeId === currentUser.id) {
      console.log('⏰ Busy time expired, changing to Available');
      try {
        const updates = {
          status: 'free',
          busy_until: null,
          updated_at: new Date().toISOString()
        };
        
        const { error } = await supabase
          .from('user_profiles')
          .update(updates)
          .eq('id', currentUser.id);
        
        if (!error) {
          updateProfile(updates);
          setEmployees(prev => prev.map(emp => 
            emp.id === currentUser.id ? { ...emp, ...updates } : emp
          ));
          showNotification('Your busy time has ended - now Available', 'free');
        }
      } catch (err) {
        console.error('Error auto-updating status:', err);
      }
    } else {
      // For other employees, just refresh their data
      fetchEmployees();
    }
  }, [currentUser, updateProfile, fetchEmployees, showNotification]);

  // Calculate next prayer
  useEffect(() => {
    if (!prayerTimes) return;
    
    const prayers = [
      { name: 'Fajr', time: prayerTimes.Fajr },
      { name: 'Dhuhr', time: prayerTimes.Dhuhr },
      { name: 'Asr', time: prayerTimes.Asr },
      { name: 'Maghrib', time: prayerTimes.Maghrib },
      { name: 'Isha', time: prayerTimes.Isha }
    ];
    
    const updateNextPrayer = () => {
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      
      for (const prayer of prayers) {
        const [hours, minutes] = prayer.time.split(':').map(Number);
        const prayerMinutes = hours * 60 + minutes;
        
        if (prayerMinutes > currentMinutes) {
          setNextPrayer(prayer);
          
          const diffMinutes = prayerMinutes - currentMinutes;
          const hours = Math.floor(diffMinutes / 60);
          const mins = diffMinutes % 60;
          setCountdown(hours > 0 ? `${hours}h ${mins}m` : `${mins}m`);
          
          // Check if it's prayer time (within 1 minute)
          if (diffMinutes <= 1 && lastPlayedPrayer !== prayer.name) {
            if (adhanAudioRef.current) {
              adhanAudioRef.current.play().catch(console.error);
            }
            setLastPlayedPrayer(prayer.name);
          }
          
          return;
        }
      }
      
      // After Isha, next prayer is Fajr tomorrow
      setNextPrayer(prayers[0]);
      const [fajrH, fajrM] = prayers[0].time.split(':').map(Number);
      const fajrMinutes = fajrH * 60 + fajrM;
      const remaining = (24 * 60 - currentMinutes) + fajrMinutes;
      const hours = Math.floor(remaining / 60);
      const mins = remaining % 60;
      setCountdown(`${hours}h ${mins}m`);
    };
    
    updateNextPrayer();
    const interval = setInterval(updateNextPrayer, 30000);
    return () => clearInterval(interval);
  }, [prayerTimes, lastPlayedPrayer]);

  // Update current time
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      }));
    };
    
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // ============================================
  // Employee Status Functions
  // ============================================
  const updateStatus = async (newStatus, duration = null) => {
    if (!currentUser) return;
    
    const updates = {
      status: newStatus,
      updated_at: new Date().toISOString()
    };
    
    if (newStatus === 'busy' && duration) {
      const busyUntil = new Date(Date.now() + duration * 60 * 1000);
      updates.busy_until = busyUntil.toISOString();
    } else {
      updates.busy_until = null;
    }
    
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', currentUser.id);
      
      if (error) throw error;
      
      // Update profile in auth context
      updateProfile(updates);
      
      // Also update local employees array immediately for instant UI feedback
      setEmployees(prev => prev.map(emp => 
        emp.id === currentUser.id ? { ...emp, ...updates } : emp
      ));
      
      // Use status-specific notification color
      const statusLabel = newStatus === 'free' ? 'Available' : newStatus === 'important' ? 'Important Only' : 'Busy';
      showNotification(`Status changed to ${statusLabel}`, newStatus);
      console.log('✅ Status updated to:', newStatus);
    } catch (err) {
      console.error('Error updating status:', err);
      showNotification('Failed to update status', 'error');
    }
  };

  const saveNote = async () => {
    if (!currentUser) return;
    
    const updates = {
      status_note: noteText,
      updated_at: new Date().toISOString()
    };
    
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', currentUser.id);
      
      if (error) throw error;
      
      // Update profile in auth context
      updateProfile(updates);
      
      // Also update local employees array for instant UI feedback
      setEmployees(prev => prev.map(emp => 
        emp.id === currentUser.id ? { ...emp, ...updates } : emp
      ));
      
      showNotification('Note saved!', 'success');
    } catch (err) {
      console.error('Error saving note:', err);
      showNotification('Failed to save note', 'error');
    }
  };

  // ============================================
  // Profile Functions
  // ============================================
  const uploadAvatar = async (file, userId) => {
    if (!file) return null;
    
    try {
      // Validate file
      if (!file.type.startsWith('image/')) {
        showNotification('Please select an image file', 'error');
        return null;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        showNotification('Image must be less than 5MB', 'error');
        return null;
      }
      
      const fileExt = file.name.split('.').pop().toLowerCase();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`; // Store directly in bucket root
      
      console.log('📤 Uploading avatar:', filePath);
      
      // Use upsert to overwrite existing files
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });
      
      if (uploadError) {
        console.error('❌ Upload error:', uploadError);
        // Check if it's a bucket not found error
        if (uploadError.message?.includes('not found') || uploadError.message?.includes('Bucket')) {
          showNotification('Storage bucket not configured. Please set up "avatars" bucket in Supabase.', 'error');
        } else {
          showNotification(`Upload failed: ${uploadError.message}`, 'error');
        }
        return null;
      }
      
      console.log('✅ Upload successful:', uploadData);
      
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
      
      console.log('🔗 Public URL:', publicUrl);
      return publicUrl;
    } catch (err) {
      console.error('❌ Exception uploading avatar:', err);
      showNotification('Failed to upload avatar. Check console for details.', 'error');
      return null;
    }
  };

  const saveProfile = async () => {
    if (!currentUser) return;
    
    setSavingProfile(true);
    
    try {
      let avatarUrl = currentUser.avatar_url;
      
      if (avatarFile) {
        setUploadingAvatar(true);
        const newUrl = await uploadAvatar(avatarFile, currentUser.id);
        if (newUrl) avatarUrl = newUrl;
        setUploadingAvatar(false);
      }
      
      const updates = {
        full_name: editingName || currentUser.full_name,
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString()
      };
      
      const { error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', currentUser.id);
      
      if (error) throw error;
      
      // Update profile in auth context
      updateProfile(updates);
      
      // Also update local employees array
      setEmployees(prev => prev.map(emp => 
        emp.id === currentUser.id ? { ...emp, ...updates } : emp
      ));
      
      showNotification('Profile saved!', 'success');
      setShowProfileSettings(false);
      setAvatarFile(null);
      setAvatarPreview(null);
    } catch (err) {
      console.error('Error saving profile:', err);
      showNotification('Failed to save profile', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  // ============================================
  // Admin Functions
  // ============================================
  const updateEmployee = async (empId, updates) => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', empId);
      
      if (error) throw error;
      
      showNotification('Employee updated!', 'success');
      setEditingEmployee(null);
      fetchEmployees();
    } catch (err) {
      console.error('Error updating employee:', err);
      showNotification('Failed to update employee', 'error');
    }
  };

  const deleteEmployee = async (empId) => {
    if (!confirm('Are you sure you want to remove this employee?')) return;
    
    try {
      const { error } = await supabase
        .from('user_profiles')
        .delete()
        .eq('id', empId);
      
      if (error) throw error;
      
      showNotification('Employee removed', 'success');
      fetchEmployees();
    } catch (err) {
      console.error('Error deleting employee:', err);
      showNotification('Failed to remove employee', 'error');
    }
  };

  // ============================================
  // Duration Handling
  // ============================================
  const handleCustomDurationChange = (value) => {
    setCustomDuration(value);
    setDurationWarning('');
    
    if (customDurationTimeoutRef.current) {
      clearTimeout(customDurationTimeoutRef.current);
    }
    
    customDurationTimeoutRef.current = setTimeout(() => {
      const duration = parseInt(value);
      if (isNaN(duration) || duration < 1) {
        setDurationWarning('Please enter a valid duration');
      } else if (duration > MAX_BUSY_DURATION_MINUTES) {
        setDurationWarning(`Maximum duration is ${MAX_BUSY_DURATION_MINUTES} minutes (24 hours)`);
      }
    }, 500);
  };

  const getEffectiveDuration = () => {
    if (useCustomDuration && customDuration) {
      const duration = parseInt(customDuration);
      if (!isNaN(duration) && duration > 0) {
        return Math.min(duration, MAX_BUSY_DURATION_MINUTES);
      }
    }
    return busyDuration;
  };

  // ============================================
  // Initialize App
  // ============================================
  useEffect(() => {
    isMountedRef.current = true;
    let isSubscribed = true;
    
    // Fetch initial data
    fetchEmployees();
    fetchPrayerTimes();
    fetchSiteSettings();
    
    // Setup realtime subscription for site_settings (announcements)
    const setupSiteSettingsRealtime = () => {
      if (!isSubscribed) return;
      
      const channel = supabase
        .channel('site-settings-realtime')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'site_settings' },
          (payload) => {
            if (!isMountedRef.current) return;
            console.log('📢 Site settings updated in real-time');
            if (payload.new) {
              setSiteSettings(payload.new);
            }
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('✅ Site settings realtime active');
          }
        });
      
      siteSettingsChannelRef.current = channel;
    };
    
    setupSiteSettingsRealtime();
    
    // Setup realtime subscription with proper error handling
    const setupRealtime = () => {
      if (!isSubscribed) return;
      
      const channelName = `user-profiles-${Date.now()}`;
      console.log('📡 Setting up realtime channel:', channelName);
      
      const channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'user_profiles' },
          (payload) => {
            if (!isMountedRef.current) return;
            
            console.log('🔔 REALTIME EVENT RECEIVED:', payload.eventType, payload.new?.full_name || payload.old?.id);
            
            if (payload.eventType === 'INSERT') {
              console.log('➕ New employee inserted:', payload.new.full_name);
              setEmployees(prev => [...prev, payload.new]);
              // Show TV alert for new employee
              const newEmp = payload.new;
              setTvAlerts(prev => [...prev, {
                id: `${newEmp.id}-${Date.now()}`,
                type: 'note',
                name: newEmp.full_name,
                avatar: newEmp.avatar_url,
                message: 'joined the team!'
              }]);
            } else if (payload.eventType === 'UPDATE') {
              // Use ref to get current employees (avoids stale closure)
              const oldEmp = employeesRef.current.find(e => e.id === payload.new.id);
              const newEmp = payload.new;
              
              console.log('📝 Employee updated:', newEmp.full_name);
              console.log('   Old status:', oldEmp?.status, '-> New status:', newEmp.status);
              console.log('   Old note:', oldEmp?.status_note, '-> New note:', newEmp.status_note);
              
              // Update employees state
              setEmployees(prev => prev.map(emp => 
                emp.id === payload.new.id ? { ...emp, ...payload.new } : emp
              ));
              
              // Check what changed and create appropriate TV alert
              if (oldEmp) {
                // Status changed
                if (oldEmp.status !== newEmp.status) {
                  console.log('🚨 STATUS CHANGE DETECTED! Creating TV alert...');
                  
                  // Calculate busy duration message
                  let statusMessage = 'updated their status';
                  if (newEmp.status === 'free') {
                    statusMessage = 'is now Available ✓';
                  } else if (newEmp.status === 'important') {
                    statusMessage = 'Can be reached for important matters only ⚠️';
                  } else if (newEmp.status === 'busy') {
                    if (newEmp.busy_until) {
                      const busyUntil = new Date(newEmp.busy_until);
                      const now = new Date();
                      const diffMs = busyUntil - now;
                      const diffMins = Math.round(diffMs / 60000);
                      if (diffMins > 0) {
                        if (diffMins >= 60) {
                          const hours = Math.floor(diffMins / 60);
                          const mins = diffMins % 60;
                          statusMessage = `Will be busy for ${hours}h ${mins}m ⏱`;
                        } else {
                          statusMessage = `Will be busy for ${diffMins} minutes ⏱`;
                        }
                      } else {
                        statusMessage = 'is now Busy ⏱';
                      }
                    } else {
                      statusMessage = 'is now Busy ⏱';
                    }
                  }
                  
                  setTvAlerts(prev => {
                    // Allow rapid status changes - each gets its own alert
                    const newAlert = {
                      id: `${newEmp.id}-status-${newEmp.status}-${Date.now()}`,
                      type: newEmp.status,
                      name: newEmp.full_name,
                      avatar: newEmp.avatar_url,
                      message: statusMessage
                    };
                    console.log('📺 Adding TV Alert:', newAlert);
                    return [...prev, newAlert];
                  });
                }
                
                // Note changed
                if (oldEmp.status_note !== newEmp.status_note && newEmp.status_note) {
                  console.log('📝 NOTE CHANGE DETECTED! Creating TV alert...');
                  setTvAlerts(prev => {
                    const newAlert = {
                      id: `${newEmp.id}-note-${Date.now()}`,
                      type: 'note',
                      name: newEmp.full_name,
                      avatar: newEmp.avatar_url,
                      message: `📝 "${newEmp.status_note.substring(0, 50)}${newEmp.status_note.length > 50 ? '...' : ''}"`
                    };
                    console.log('📺 Adding TV Alert:', newAlert);
                    return [...prev, newAlert];
                  });
                  
                  // Mark as recently updated (for 10 minutes)
                  setRecentlyUpdated(prev => ({
                    ...prev,
                    [newEmp.id]: Date.now()
                  }));
                }
              } else {
                // No old employee found, still show an alert
                console.log('⚠️ No old employee found in cache, showing generic alert');
                setTvAlerts(prev => [...prev, {
                  id: `${newEmp.id}-update-${Date.now()}`,
                  type: newEmp.status,
                  name: newEmp.full_name,
                  avatar: newEmp.avatar_url,
                  message: 'updated their profile'
                }]);
              }
            } else if (payload.eventType === 'DELETE') {
              console.log('🗑️ Employee deleted:', payload.old.id);
              setEmployees(prev => prev.filter(emp => emp.id !== payload.old.id));
            }
          }
        )
        .subscribe((status, err) => {
          console.log('📡 Realtime subscription status:', status, err ? `Error: ${err.message || err}` : '');
          
          if (status === 'SUBSCRIBED') {
            console.log('✅ Realtime subscription ACTIVE - listening for changes on user_profiles');
          } else if (status === 'CHANNEL_ERROR') {
            console.error('❌ Realtime channel error:', err);
          } else if (status === 'TIMED_OUT') {
            console.warn('⏰ Realtime subscription timed out, retrying...');
            setTimeout(() => {
              if (isMountedRef.current && isSubscribed) {
                setupRealtime();
              }
            }, 2000);
          } else if (status === 'CLOSED' && isMountedRef.current && isSubscribed) {
            console.log('⚠️ Realtime closed, will try to reconnect...');
            setTimeout(() => {
              if (isMountedRef.current && isSubscribed) {
                setupRealtime();
              }
            }, 3000);
          }
        });
      
      realtimeChannelRef.current = channel;
    };
    
    setupRealtime();
    
    // Refresh prayer times daily
    const prayerInterval = setInterval(fetchPrayerTimes, 24 * 60 * 60 * 1000);
    
    // Polling fallback for employees - VERY FAST updates every 2 seconds
    // This ensures near-instant updates for TV dashboard
    pollingIntervalRef.current = setInterval(() => {
      fetchEmployees();
    }, 2000); // Every 2 seconds for near-instant updates
    
    return () => {
      isMountedRef.current = false;
      isSubscribed = false;
      if (realtimeChannelRef.current) {
        supabase.removeChannel(realtimeChannelRef.current);
        realtimeChannelRef.current = null;
      }
      if (siteSettingsChannelRef.current) {
        supabase.removeChannel(siteSettingsChannelRef.current);
        siteSettingsChannelRef.current = null;
      }
      clearInterval(prayerInterval);
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [fetchEmployees, fetchPrayerTimes, fetchSiteSettings]);

  // Initialize profile settings when opened
  useEffect(() => {
    if (showProfileSettings && currentUser) {
      setEditingName(currentUser.full_name || '');
    }
  }, [showProfileSettings, currentUser]);

  // Sync noteText with currentUser's status_note when currentUser changes
  // Use a ref to track if we should sync or if user is actively editing
  const noteInputRef = useRef(null);
  const lastSyncedNoteRef = useRef('');
  
  useEffect(() => {
    // Only sync if the currentUser's note changed externally (e.g., from realtime update)
    // and the user isn't actively editing the input
    if (currentUser) {
      const serverNote = currentUser.status_note || '';
      // Sync if this is first load OR if server note changed AND we're not focused on input
      if (lastSyncedNoteRef.current !== serverNote && document.activeElement !== noteInputRef.current) {
        setNoteText(serverNote);
        lastSyncedNoteRef.current = serverNote;
      }
    }
  }, [currentUser?.status_note]);

  // ============================================
  // VIEWS / PAGES
  // ============================================
  
  // Public Dashboard View
  const PublicDashboard = () => (
    <div className="min-h-screen bg-gradient-image-static p-4 md:p-8">
      <audio ref={adhanAudioRef} src={adhanAudio} preload="auto" />
      
      {/* TV Alerts - Breaking News Style Toasts */}
      <TVAlertsContainer alerts={tvAlerts} onDismiss={dismissTvAlert} />
      
      <Notification notification={notification} onClose={() => setNotification(null)} />
      
      {/* Hidden admin access */}
      {isAuthenticated && isAdmin && (
        <div className="fixed top-2 right-2 z-50 opacity-0 hover:opacity-100 transition-opacity">
          <button
            onClick={() => navigate('/admin')}
            className="px-3 py-1.5 bg-[#212121] text-white rounded-lg hover:bg-[#212121]/90 text-xs"
          >
            Admin
          </button>
        </div>
      )}

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="mb-12">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Logo */}
            <div className="bg-white rounded-xl p-2 shadow-sm h-20 flex items-center">
              <img src="/Rime_logo.jpeg" alt="Rime Logo" className="h-10 w-auto object-contain" />
            </div>
            
            {/* Prayer & Time Widget */}
            {prayerDateInfo && prayerTimes && nextPrayer && (
              <div className="flex gap-2 items-center">
                {/* Time Widget */}
                <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl border-2 border-gray-700 shadow-lg p-3 w-[200px] h-20 flex flex-col justify-between">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-[#00ff41] font-mono tracking-wider drop-shadow-[0_0_10px_rgba(0,255,65,0.9)] leading-none">
                      {currentTime}
                    </div>
                  </div>
                  <div className="text-center">
                    <span className="text-[10px] font-semibold text-gray-300 uppercase tracking-wider">
                      {prayerDateInfo.gregorian?.weekday?.en}
                    </span>
                    <span className="text-[10px] text-gray-300 mx-1">•</span>
                    <span className="text-[10px] font-bold text-gray-200">
                      {prayerDateInfo.gregorian?.day} {prayerDateInfo.gregorian?.month?.en} {prayerDateInfo.gregorian?.year}
                    </span>
                  </div>
                </div>
                
                {/* Prayer Widget */}
                <div className="bg-gradient-to-br from-[#166534] to-[#15803d] rounded-xl border-2 border-[#166534] shadow-lg p-3 w-[200px] h-20 flex flex-col justify-center">
                  <div className="flex items-center justify-center gap-2 text-white mb-1">
                    {nextPrayer.name === 'Fajr' || nextPrayer.name === 'Maghrib' || nextPrayer.name === 'Isha' ? (
                      <Moon className="w-5 h-5 flex-shrink-0" />
                    ) : (
                      <Sun className="w-5 h-5 flex-shrink-0" />
                    )}
                    <span className="text-lg font-bold">{nextPrayer.name}</span>
                    <span className="text-lg font-mono font-bold">{nextPrayer.time}</span>
                  </div>
                  <div className="text-center text-sm font-mono font-semibold text-white/90">
                    ({countdown || 'Loading...'})
                  </div>
                </div>
              </div>
            )}
            
            {/* Settings Button - Use session check (not isAuthenticated) to handle profile loading state */}
            <button
              onClick={() => {
                if (session) {
                  navigate(isAdmin ? '/admin' : '/dashboard');
                } else {
                  navigate('/login');
                }
              }}
              className="px-4 py-2 bg-[#212121] text-white rounded-lg hover:bg-[#212121]/90 flex items-center justify-center gap-2 shadow-sm transition-all text-sm font-medium"
            >
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">{session ? 'Dashboard' : 'Settings'}</span>
              <span className="sm:hidden">{session ? 'Panel' : 'Login'}</span>
            </button>
          </div>

          <NewsTicker employees={employees} recentlyUpdated={recentlyUpdated} />
        </div>
        
        {/* Employee Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
          {dataLoading ? (
            <div className="col-span-full flex justify-center py-20">
              <ContentSpinner message="Loading employees..." />
            </div>
          ) : employees.length === 0 ? (
            <div className="col-span-full text-center py-20">
              <div className="text-[#212121] text-xl">No employees found</div>
            </div>
          ) : (
            employees
              .sort((a, b) => {
                const statusOrder = { 'important': 0, 'free': 1, 'busy': 2 };
                const aOrder = statusOrder[a.status] ?? 3;
                const bOrder = statusOrder[b.status] ?? 3;
                if (aOrder !== bOrder) return aOrder - bOrder;
                return a.full_name.localeCompare(b.full_name);
              })
              .map(emp => <EmployeeCard key={emp.id} employee={emp} onStatusExpired={handleStatusExpired} />)
          )}
        </div>
      </div>
    </div>
  );

  // Login Page
  const LoginPage = () => (
    <div className="min-h-screen bg-gradient-image-static flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
      </div>
      
      <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-8 w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-[#212121] rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg">
            <User className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-[#212121] mb-2">Employee Login</h2>
          <p className="text-[#212121]/70 text-sm">Sign in with your company Google account</p>
        </div>
        
        <div className="space-y-5">
          {authError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
              <p className="text-red-600 font-medium">{authError}</p>
              <p className="text-red-500 text-sm mt-1">Please use your @getrime.com email</p>
            </div>
          )}
          
          <button
            onClick={signInWithGoogle}
            disabled={signingIn}
            className="w-full bg-white border-2 border-gray-200 text-[#212121] py-3 px-4 rounded-xl hover:bg-gray-50 hover:border-gray-300 font-semibold shadow-sm hover:shadow-md transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {signingIn ? (
              <>
                <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <GoogleIcon />
                <span>Sign in with Google</span>
              </>
            )}
          </button>
          
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">Company accounts only</span>
            </div>
          </div>
          
          <p className="text-center text-sm text-gray-500">
            Only <span className="font-semibold text-[#212121]">@getrime.com</span> email addresses are allowed
          </p>
          
          <button
            onClick={() => navigate('/')}
            className="w-full bg-gray-50 border border-gray-200 text-[#212121] py-3 rounded-xl hover:bg-gray-100 font-semibold transition-all"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );

  // Employee Dashboard
  const EmployeeDashboard = () => {
    // Note: useEffect removed - noteText is now synced at App level
    return (
      <div className="min-h-screen bg-gradient-image-static p-4 md:p-8">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        </div>

        <Notification notification={notification} onClose={() => setNotification(null)} />

        <div className="max-w-4xl mx-auto relative z-10">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
              <h1 className="text-4xl md:text-5xl font-extrabold text-[#212121] mb-2">Control Panel</h1>
              <p className="text-[#212121]/70 text-sm">
                Signed in as <span className="font-semibold">{currentUser?.email}</span>
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {isAdmin && (
                <button
                  onClick={() => navigate('/admin')}
                  className="px-4 py-2 bg-[#212121] text-white rounded-lg hover:bg-[#212121]/90 shadow-sm transition-all text-sm font-medium"
                >
                  Admin Panel
                </button>
              )}
              <button
                onClick={() => navigate('/')}
                className="px-4 py-2 bg-[#212121] text-white rounded-lg hover:bg-[#212121]/90 shadow-sm transition-all text-sm font-medium"
              >
                View Dashboard
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-[#991b1b] text-white rounded-lg hover:bg-[#991b1b]/90 flex items-center gap-2 shadow-sm transition-all text-sm font-medium"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>

          {/* Status Card */}
          <div className="bg-white rounded-3xl shadow-xl border border-gray-200 p-6 md:p-8 mb-6">
            {/* Profile Header with Inline Edit */}
            <div className="flex items-center gap-4 mb-6">
              {/* Avatar with Camera Badge Indicator */}
              <div className="relative">
                <img 
                  src={avatarPreview || currentUser?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.full_name || 'User')}`}
                  alt={currentUser?.full_name}
                  className="w-20 h-20 rounded-full border-4 border-gray-200 shadow-lg object-cover"
                />
                {/* Small camera badge indicator */}
                <label className="absolute bottom-0 right-0 w-7 h-7 bg-[#212121] rounded-full flex items-center justify-center cursor-pointer hover:bg-[#212121]/80 transition-all shadow-md border-2 border-white">
                  <Upload className="w-3.5 h-3.5 text-white" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files[0];
                      if (file) {
                        setAvatarPreview(URL.createObjectURL(file));
                        const newUrl = await uploadAvatar(file, currentUser.id);
                        if (newUrl) {
                          const updates = { avatar_url: newUrl, updated_at: new Date().toISOString() };
                          await supabase.from('user_profiles').update(updates).eq('id', currentUser.id);
                          updateProfile(updates);
                          setEmployees(prev => prev.map(emp => emp.id === currentUser.id ? { ...emp, ...updates } : emp));
                          showNotification('Avatar updated!', 'success');
                        }
                        setAvatarPreview(null);
                      }
                    }}
                    className="hidden"
                  />
                </label>
              </div>
              
              {/* Name with Click-to-Edit (popup style) */}
              <div className="flex-1">
                {showProfileSettings ? (
                  <div className="mb-1">
                    <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl p-2 shadow-sm">
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="flex-1 text-xl font-bold text-[#212121] bg-transparent px-2 py-1 outline-none"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (editingName && editingName !== currentUser?.full_name) {
                              const updates = { full_name: editingName, updated_at: new Date().toISOString() };
                              supabase.from('user_profiles').update(updates).eq('id', currentUser.id);
                              updateProfile(updates);
                              setEmployees(prev => prev.map(emp => emp.id === currentUser.id ? { ...emp, ...updates } : emp));
                              showNotification('Name updated!', 'success');
                            }
                            setShowProfileSettings(false);
                          } else if (e.key === 'Escape') {
                            setShowProfileSettings(false);
                            setEditingName(currentUser?.full_name || '');
                          }
                        }}
                      />
                      <button
                        onClick={async () => {
                          if (editingName && editingName !== currentUser?.full_name) {
                            const updates = { full_name: editingName, updated_at: new Date().toISOString() };
                            await supabase.from('user_profiles').update(updates).eq('id', currentUser.id);
                            updateProfile(updates);
                            setEmployees(prev => prev.map(emp => emp.id === currentUser.id ? { ...emp, ...updates } : emp));
                            showNotification('Name updated!', 'success');
                          }
                          setShowProfileSettings(false);
                        }}
                        className="p-1.5 bg-[#212121] text-white rounded-lg hover:bg-[#212121]/90"
                      >
                        <Save className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setShowProfileSettings(false);
                          setEditingName(currentUser?.full_name || '');
                        }}
                        className="p-1.5 bg-gray-100 text-[#212121] rounded-lg hover:bg-gray-200"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-xs text-[#212121]/50 mt-1 ml-2">Press Enter to save, Esc to cancel</p>
                  </div>
                ) : (
                  <div 
                    className="flex items-center gap-2 mb-1 group cursor-pointer"
                    onClick={() => {
                      setEditingName(currentUser?.full_name || '');
                      setShowProfileSettings(true);
                    }}
                  >
                    <h2 className="text-2xl font-bold text-[#212121]">{currentUser?.full_name}</h2>
                    <Edit2 className="w-4 h-4 text-[#212121]/30 group-hover:text-[#212121]/70 transition-colors" />
                  </div>
                )}
                <p className="text-[#212121]/60">{currentUser?.email}</p>
                <span className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-semibold text-white ${
                  currentUser?.status === 'free' ? 'bg-[#166534]' : 
                  currentUser?.status === 'important' ? 'bg-[#f97316]' : 
                  'bg-[#991b1b]'
                }`}>
                  {currentUser?.status === 'free' ? 'Available' : 
                   currentUser?.status === 'important' ? 'Important Only' : 
                   'Busy'}
                </span>
              </div>
            </div>

            {/* Status Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <button
                onClick={() => updateStatus('free')}
                className={`p-4 rounded-xl font-semibold transition-all ${
                  currentUser?.status === 'free' 
                    ? 'bg-[#166534] text-white shadow-lg' 
                    : 'bg-gray-100 text-[#212121] hover:bg-gray-200'
                }`}
              >
                🟢 Available
              </button>
              <button
                onClick={() => updateStatus('important')}
                className={`p-4 rounded-xl font-semibold transition-all ${
                  currentUser?.status === 'important' 
                    ? 'bg-[#f97316] text-white shadow-lg' 
                    : 'bg-gray-100 text-[#212121] hover:bg-gray-200'
                }`}
              >
                🟠 Important Only
              </button>
              <button
                onClick={() => updateStatus('busy', getEffectiveDuration())}
                className={`p-4 rounded-xl font-semibold transition-all ${
                  currentUser?.status === 'busy' 
                    ? 'bg-[#991b1b] text-white shadow-lg' 
                    : 'bg-gray-100 text-[#212121] hover:bg-gray-200'
                }`}
              >
                🔴 Busy
              </button>
            </div>

            {/* Duration Selector - Only show when setting Busy status */}
            {currentUser?.status === 'busy' && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                <label className="block text-sm font-medium text-[#991b1b] mb-2">Update Busy Duration</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {[15, 30, 60, 120].map(mins => (
                    <button
                      key={mins}
                      onClick={() => {
                        setBusyDuration(mins);
                        setUseCustomDuration(false);
                        // Auto-update when already busy
                        updateStatus('busy', mins);
                      }}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        !useCustomDuration && busyDuration === mins
                          ? 'bg-[#991b1b] text-white'
                          : 'bg-white text-[#991b1b] hover:bg-red-100 border border-red-200'
                      }`}
                    >
                      {mins < 60 ? `${mins}m` : `${mins/60}h`}
                    </button>
                  ))}
                  <button
                    onClick={() => setUseCustomDuration(true)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      useCustomDuration
                        ? 'bg-[#991b1b] text-white'
                        : 'bg-white text-[#991b1b] hover:bg-red-100 border border-red-200'
                    }`}
                  >
                    Custom
                  </button>
                </div>
                {useCustomDuration && (
                  <div className="mt-2">
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min="1"
                        max="1440"
                        value={customDuration}
                        onChange={(e) => {
                          const val = e.target.value;
                          // Allow empty or valid numbers up to 1440
                          if (val === '' || (parseInt(val, 10) >= 0 && parseInt(val, 10) <= 1440)) {
                            setCustomDuration(val);
                          }
                        }}
                        placeholder="Enter minutes"
                        className="flex-1 px-4 py-2 bg-red-50/50 border border-red-200 rounded-lg focus:ring-2 focus:ring-[#991b1b]/20 focus:border-[#991b1b]/40 focus:bg-white transition-all"
                      />
                      <button
                        onClick={() => {
                          const mins = parseInt(customDuration, 10);
                          if (mins > 0) {
                            updateStatus('busy', Math.min(mins, MAX_BUSY_DURATION_MINUTES));
                          }
                        }}
                        className="px-4 py-2 bg-[#991b1b] text-white rounded-lg hover:bg-[#991b1b]/90 font-medium text-sm"
                      >
                        Apply
                      </button>
                    </div>
                    <p className="text-red-500 text-xs mt-1.5">⚠️ Maximum duration: 24 hours (1440 minutes)</p>
                    {durationWarning && (
                      <p className="text-amber-600 text-sm mt-1">{durationWarning}</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Note Section */}
            <div>
              <label className="block text-sm font-medium text-[#212121] mb-2">Status Note</label>
              <div className="flex gap-2">
                <input
                  ref={noteInputRef}
                  type="text"
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  onBlur={() => {
                    // Update the lastSyncedNote when user finishes editing
                    lastSyncedNoteRef.current = noteText;
                  }}
                  placeholder="What are you working on?"
                  className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#212121]/20 focus:border-[#212121]/30 focus:bg-white transition-all"
                />
                <button
                  onClick={() => {
                    saveNote();
                    lastSyncedNoteRef.current = noteText;
                  }}
                  className="px-6 py-3 bg-[#212121] text-white rounded-xl hover:bg-[#212121]/90 font-semibold shadow-sm transition-all"
                >
                  <Save className="w-5 h-5" />
                </button>
              </div>
              {currentUser?.status_note !== noteText && noteText !== '' && (
                <p className="text-xs text-amber-600 mt-1">You have unsaved changes</p>
              )}
            </div>
          </div>

        </div>
      </div>
    );
  };

  // Admin Dashboard
  const AdminDashboard = () => (
    <div className="min-h-screen bg-gradient-image-static p-4 md:p-8">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
      </div>

      <Notification notification={notification} onClose={() => setNotification(null)} />

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-[#212121] mb-2">Admin Panel</h1>
            <p className="text-[#212121]/70 text-sm">
              Signed in as <span className="font-semibold">{currentUser?.email}</span>
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 bg-[#212121] text-white rounded-lg hover:bg-[#212121]/90 shadow-sm transition-all text-sm font-medium"
            >
              My Control Panel
            </button>
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 bg-[#212121] text-white rounded-lg hover:bg-[#212121]/90 shadow-sm transition-all text-sm font-medium"
            >
              View Dashboard
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-[#991b1b] text-white rounded-lg hover:bg-[#991b1b]/90 flex items-center gap-2 shadow-sm transition-all text-sm font-medium"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>

        {/* Manage Employees Section - Moved Above */}
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 p-6 md:p-8 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <h2 className="text-3xl font-bold text-[#212121]">Manage Employees</h2>
            <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-2 text-sm text-blue-700">
              <span className="font-medium">💡 Tip:</span> Employees are added automatically when they sign in
            </div>
          </div>

          <div className="space-y-3">
            {employees.length === 0 ? (
              <div className="text-center py-12 text-[#212121]/70">
                <User className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-xl">No employees yet</p>
                <p className="text-sm mt-2">Employees will appear here after signing in with Google</p>
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
                              ? 'bg-[#212121] text-white' 
                              : 'bg-gray-200 text-[#212121]'
                          }`}>
                            {emp.role}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold text-white ${
                            emp.status === 'free' ? 'bg-[#166534]' : 
                            emp.status === 'important' ? 'bg-[#f97316]' : 
                            'bg-[#991b1b]'
                          }`}>
                            {emp.status === 'free' ? 'Free' : emp.status === 'important' ? 'Important Only' : 'Busy'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingEmployee(emp)}
                        className="p-3 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-xl transition-all"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      {emp.id !== currentUser?.id && (
                        <button
                          onClick={() => deleteEmployee(emp.id)}
                          className="p-3 bg-red-100 hover:bg-red-200 text-red-600 rounded-xl transition-all"
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

        {/* Global Announcement Control - Accordion */}
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 mb-6 overflow-hidden">
          <button
            onClick={() => setIsAnnouncementOpen(!isAnnouncementOpen)}
            className="w-full p-6 md:p-8 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">📢</span>
              <h2 className="text-2xl font-bold text-[#212121]">Global Announcement</h2>
            </div>
            {isAnnouncementOpen ? (
              <ChevronUp className="w-6 h-6 text-[#212121]" />
            ) : (
              <ChevronDown className="w-6 h-6 text-[#212121]" />
            )}
          </button>
          
          {isAnnouncementOpen && (
            <div className="px-6 md:px-8 pb-6 md:pb-8">
              <p className="text-sm text-[#212121]/60 mb-4">
                This message will be displayed on ALL screens including the TV Dashboard. Everyone will see it instantly.
              </p>
              
              <div className="space-y-4">
            {/* Toggle Switch */}
            <div className="flex items-center justify-between bg-gray-50 rounded-xl p-4 border border-gray-200">
              <div>
                <p className="font-semibold text-[#212121]">Show Announcement</p>
                <p className="text-xs text-[#212121]/50">Turn on to display the message on all screens</p>
              </div>
              <button
                onClick={async () => {
                  const newValue = !siteSettings?.is_active;
                  try {
                    const { error } = await supabase
                      .from('site_settings')
                      .upsert({
                        id: 'global_config',
                        is_active: newValue,
                        updated_at: new Date().toISOString()
                      });
                    if (error) throw error;
                    setSiteSettings(prev => ({ ...prev, is_active: newValue }));
                    showNotification(newValue ? 'Announcement is now visible!' : 'Announcement hidden', 'success');
                  } catch (err) {
                    console.error('Error toggling announcement:', err);
                    showNotification('Failed to update announcement', 'error');
                  }
                }}
                className={`relative w-14 h-7 rounded-full transition-colors ${
                  siteSettings?.is_active ? 'bg-emerald-500' : 'bg-gray-300'
                }`}
              >
                <span className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-transform ${
                  siteSettings?.is_active ? 'translate-x-7' : 'translate-x-0'
                }`}></span>
              </button>
            </div>
            
            {/* Message Input */}
            <div>
              <label className="block text-sm font-medium text-[#212121] mb-2">Announcement Message</label>
              <textarea
                value={siteSettings?.announcement_text || ''}
                onChange={(e) => setSiteSettings(prev => ({ ...prev, announcement_text: e.target.value }))}
                placeholder="Enter your announcement message..."
                rows={3}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#212121]/20 focus:border-[#212121]/30 focus:bg-white transition-all resize-none"
                style={{ unicodeBidi: 'plaintext', direction: 'auto' }}
              />
            </div>
            
            {/* Update Button */}
            <button
              onClick={async () => {
                try {
                  const { error } = await supabase
                    .from('site_settings')
                    .upsert({
                      id: 'global_config',
                      announcement_text: siteSettings?.announcement_text || '',
                      is_active: siteSettings?.is_active || false,
                      updated_at: new Date().toISOString()
                    });
                  if (error) throw error;
                  showNotification('Announcement updated successfully!', 'success');
                } catch (err) {
                  console.error('Error updating announcement:', err);
                  showNotification('Failed to update announcement', 'error');
                }
              }}
              className="w-full px-6 py-3 bg-[#212121] text-white rounded-xl hover:bg-[#212121]/90 font-semibold transition-all flex items-center justify-center gap-2"
            >
              <Save className="w-5 h-5" />
              Update Announcement
            </button>
            
            {/* Preview */}
            {siteSettings?.is_active && siteSettings?.announcement_text && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-xs font-semibold text-red-600 mb-2">📺 LIVE PREVIEW:</p>
                <div className="bg-gradient-to-r from-red-600 to-red-700 text-white py-2 px-4 rounded-lg text-center text-sm font-semibold">
                  📢 {siteSettings.announcement_text} 📢
                </div>
              </div>
            )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Employee Modal */}
      {editingEmployee && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={(e) => e.target === e.currentTarget && setEditingEmployee(null)}>
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-[#212121] rounded-xl flex items-center justify-center shadow-lg">
                <Edit2 className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-3xl font-bold text-[#212121]">Edit Employee</h3>
            </div>
            
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-[#212121] mb-2">Email</label>
                <input
                  type="text"
                  value={editingEmployee.email || ''}
                  disabled
                  className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-[#212121]/70 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#212121] mb-2">Full Name</label>
                <input
                  type="text"
                  value={editingEmployee.full_name}
                  onChange={(e) => setEditingEmployee({...editingEmployee, full_name: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[#212121] focus:ring-2 focus:ring-[#212121]/20 focus:border-[#212121]/30 focus:bg-white transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#212121] mb-2">Role</label>
                <select
                  value={editingEmployee.role}
                  onChange={(e) => setEditingEmployee({...editingEmployee, role: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[#212121] focus:ring-2 focus:ring-[#212121]/20 focus:border-[#212121]/30 focus:bg-white transition-all"
                >
                  <option value="employee">Employee</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#212121] mb-3">Avatar</label>
                <div className="flex items-center gap-4">
                  <img 
                    src={editingEmployee.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(editingEmployee.full_name)}`}
                    alt="Avatar"
                    className="w-20 h-20 rounded-full border-4 border-white shadow-xl"
                  />
                  <label className="cursor-pointer px-5 py-2.5 bg-[#212121] text-white rounded-xl hover:bg-[#212121]/90 shadow-lg transition-all">
                    <Upload className="w-4 h-4 inline mr-2" />
                    Change Avatar
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files[0];
                        if (file) {
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
                  onClick={() => updateEmployee(editingEmployee.id, {
                    full_name: editingEmployee.full_name,
                    role: editingEmployee.role,
                    ...(editingEmployee.avatar_url && { avatar_url: editingEmployee.avatar_url })
                  })}
                  className="flex-1 py-3 bg-[#212121] text-white rounded-xl hover:bg-[#212121]/90 shadow-lg font-semibold"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => setEditingEmployee(null)}
                  className="flex-1 py-3 bg-gray-50 border border-gray-200 text-[#212121] rounded-xl hover:bg-gray-100 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // ============================================
  // ROUTING - Persistent Shell (no flicker on refresh)
  // ============================================
  
  const currentPath = location.pathname;
  
  // Public route - always accessible
  if (currentPath === '/') {
    return <AppShell siteSettings={siteSettings}>{PublicDashboard()}</AppShell>;
  }
  
  // Login page
  if (currentPath === '/login') {
    // If already logged in with profile, redirect to dashboard
    if (session && currentUser) {
      return <Navigate to={isAdmin ? '/admin' : '/dashboard'} replace />;
    }
    return <AppShell siteSettings={siteSettings}>{LoginPage()}</AppShell>;
  }
  
  // Protected routes - /dashboard and /admin
  if (currentPath === '/dashboard' || currentPath === '/admin') {
    // Still checking session - show loading spinner
    if (!initialized) {
      return (
        <AppShell siteSettings={siteSettings}>
          <div className="min-h-screen bg-gradient-image-static p-8">
            <div className="max-w-4xl mx-auto">
              <div className="flex justify-center items-center min-h-[60vh]">
                <ContentSpinner message="Checking session..." />
              </div>
            </div>
          </div>
        </AppShell>
      );
    }
    
    // No session at all - redirect to login
    if (!session) {
      return <Navigate to="/login" replace />;
    }
    
    // Has session, loading or waiting for profile
    if (profileLoading || !currentUser) {
      return (
        <AppShell siteSettings={siteSettings}>
          <div className="min-h-screen bg-gradient-image-static p-8">
            <div className="max-w-4xl mx-auto">
              <div className="flex justify-center items-center min-h-[60vh]">
                <ContentSpinner message="Loading your profile..." />
              </div>
            </div>
          </div>
        </AppShell>
      );
    }
    
    // Admin route requires admin role
    if (currentPath === '/admin' && !isAdmin) {
      return <Navigate to="/dashboard" replace />;
    }
    
    // Fully authenticated - render dashboard
    return <AppShell siteSettings={siteSettings}>{currentPath === '/admin' ? AdminDashboard() : EmployeeDashboard()}</AppShell>;
  }
  
  // Catch-all
  return <Navigate to="/" replace />;
};

export default App;
