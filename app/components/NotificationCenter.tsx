'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, Check, CheckCheck, AlertCircle, Info, Calendar, BookOpen, TrendingDown, Users, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Notification {
  _id: string;
  recipientId: string;
  recipientRole: string;
  senderId: string;
  senderRole: string;
  senderName: string;
  type: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  title: string;
  message: string;
  read: boolean;
  readAt?: string;
  metadata?: {
    testId?: string;
    studentId?: string;
    organizationId?: string;
    teacherId?: string;
    moduleId?: string;
    meetingDate?: string;
    meetingLink?: string;
    [key: string]: any;
  };
  createdAt: string;
  updatedAt: string;
}

interface NotificationCenterProps {
  userId: string;
  userRole: string;
  className?: string;
  isOpen?: boolean;
  onToggle?: (open: boolean) => void;
  hideButton?: boolean;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ userId, userRole, className = '', isOpen: externalIsOpen, onToggle, hideButton = false }) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const setIsOpen = (open: boolean) => {
    if (externalIsOpen !== undefined && onToggle) {
      onToggle(open);
    } else {
      setInternalIsOpen(open);
    }
  };
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const notificationRef = useRef<HTMLDivElement>(null);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const readParam = filter === 'unread' ? 'false' : null;
      const url = `/api/notifications${readParam ? `?read=${readParam}` : ''}`;
      const response = await fetch(url, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        credentials: 'include'
      });

      if (response.ok) {
        setNotifications(prev =>
          prev.map(n =>
            n._id === notificationId ? { ...n, read: true, readAt: new Date().toISOString() } : n
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/read-all', {
        method: 'PUT',
        credentials: 'include'
      });

      if (response.ok) {
        setNotifications(prev =>
          prev.map(n => ({ ...n, read: true, readAt: new Date().toISOString() }))
        );
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Get icon for notification type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'test_assigned':
      case 'test_reminder':
      case 'test_result':
        return <BookOpen className="w-5 h-5" />;
      case 'meeting':
        return <Calendar className="w-5 h-5" />;
      case 'announcement':
        return <MessageSquare className="w-5 h-5" />;
      case 'performance_update':
        return <TrendingDown className="w-5 h-5" />;
      case 'incomplete_module':
      case 'low_activity':
        return <AlertCircle className="w-5 h-5" />;
      default:
        return <Info className="w-5 h-5" />;
    }
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'border-red-500 bg-red-50';
      case 'high':
        return 'border-orange-500 bg-orange-50';
      case 'normal':
        return 'border-blue-500 bg-blue-50';
      case 'low':
        return 'border-gray-300 bg-gray-50';
      default:
        return 'border-gray-300 bg-gray-50';
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Fetch notifications on mount and when filter changes
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, filter]);

  // Poll for new notifications every 30 seconds when open
  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      fetchNotifications();
    }, 30000);

    return () => clearInterval(interval);
  }, [isOpen, filter]);

  return (
    <div className={`relative ${className}`} ref={notificationRef}>
      {/* Bell Icon Button - Hidden if hideButton is true */}
      {!hideButton && (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="Notifications"
        >
          <Bell className="w-6 h-6 text-gray-700 dark:text-gray-300" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      )}

      {/* Notification Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Overlay */}
            <motion.div
              className="fixed inset-0 bg-black/20 z-[10000]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsOpen(false)}
            />
            {/* Notification Panel */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className={`${hideButton ? 'fixed right-4 top-14' : 'absolute right-0 mt-2'} w-96 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-[10001] max-h-[600px] flex flex-col pointer-events-auto`}
            >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Notifications
              </h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="flex gap-2 p-2 border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1 text-sm rounded ${
                  filter === 'all'
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`px-3 py-1 text-sm rounded ${
                  filter === 'unread'
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                Unread ({unreadCount})
              </button>
            </div>

            {/* Notifications List */}
            <div className="overflow-y-auto flex-1">
              {loading ? (
                <div className="p-8 text-center text-gray-500">Loading...</div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  No {filter === 'unread' ? 'unread ' : ''}notifications
                </div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {notifications.map((notification) => (
                    <motion.div
                      key={notification._id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors ${
                        !notification.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                      }`}
                      onClick={() => {
                        if (!notification.read) {
                          markAsRead(notification._id);
                        }
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`p-2 rounded-lg ${getPriorityColor(notification.priority)}`}
                        >
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                              {notification.title}
                            </h4>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1" />
                            )}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {notification.message}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-gray-500 dark:text-gray-500">
                              {formatDate(notification.createdAt)}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-500">
                              From: {notification.senderName}
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationCenter;
