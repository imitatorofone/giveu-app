'use client';

import { Bell, BellDot } from 'lucide-react';
import { useState } from 'react';
import { useNotifications } from '../../lib/useNotifications';

interface NotificationBellProps {
  userId: string;
}

export default function NotificationBell({ userId }: NotificationBellProps) {
  const { notifications, unreadCount, markAsRead } = useNotifications(userId);
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div style={{ position: 'relative' }}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'relative',
          padding: 8,
          borderRadius: '50%',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          transition: 'background-color 0.2s'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--muted)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        {unreadCount > 0 ? (
          <BellDot style={{ width: 24, height: 24, color: 'var(--primary)' }} />
        ) : (
          <Bell style={{ width: 24, height: 24, color: 'var(--muted-foreground)' }} />
        )}
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: -4,
            right: -4,
            backgroundColor: 'var(--destructive)',
            color: 'white',
            fontSize: 12,
            borderRadius: '50%',
            width: 20,
            height: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold'
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 10
            }}
            onClick={() => setIsOpen(false)}
          />
          
          {/* Notification Panel */}
          <div style={{
            position: 'absolute',
            right: 0,
            top: '100%',
            marginTop: 8,
            width: 384, // w-96 equivalent
            backgroundColor: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
            zIndex: 20,
            maxHeight: 384, // max-h-96 equivalent
            overflowY: 'auto'
          }}>
            <div style={{
              padding: 16,
              borderBottom: '1px solid var(--border)'
            }}>
              <h3 style={{
                margin: 0,
                fontWeight: 600,
                color: 'var(--foreground)'
              }}>
                Notifications
              </h3>
            </div>
            
            {notifications.length === 0 ? (
              <div style={{
                padding: 16,
                textAlign: 'center',
                color: 'var(--muted-foreground)'
              }}>
                No notifications yet
              </div>
            ) : (
              <div>
                {notifications.map((notification) => (
                  <NotificationItem 
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={() => markAsRead(notification.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// NotificationItem component
function NotificationItem({ notification, onMarkAsRead }: { 
  notification: any; 
  onMarkAsRead: () => void; 
}) {
  const isUnread = !notification.read_at;
  
  const handleClick = () => {
    if (isUnread) onMarkAsRead();
    
    // Navigate to the relevant page based on notification type
    if (notification.type === 'need_match' && notification.payload?.need_id) {
      // Navigate to opportunities page with highlighted need
      window.location.href = `/opportunities?highlight=${notification.payload.need_id}`;
    }
  };
  
  return (
    <div 
      style={{
        padding: 16,
        cursor: 'pointer',
        borderBottom: '1px solid var(--border)',
        backgroundColor: isUnread ? 'var(--muted)' : 'transparent',
        borderLeft: isUnread ? '4px solid var(--primary)' : '4px solid transparent',
        transition: 'background-color 0.2s'
      }}
      onClick={handleClick}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = 'var(--muted)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = isUnread ? 'var(--muted)' : 'transparent';
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
        <div style={{ flex: 1 }}>
          <h4 style={{
            margin: 0,
            fontSize: 14,
            fontWeight: isUnread ? 600 : 500,
            color: 'var(--foreground)'
          }}>
            {notification.title}
          </h4>
          <p style={{
            margin: '4px 0',
            fontSize: 14,
            color: 'var(--muted-foreground)',
            lineHeight: 1.4
          }}>
            {notification.message}
          </p>
          {notification.payload?.urgency && (
            <span style={{
              display: 'inline-block',
              marginTop: 8,
              padding: '2px 8px',
              fontSize: 12,
              borderRadius: 12,
              backgroundColor: notification.payload.urgency === 'urgent' ? '#fecaca' :
                              notification.payload.urgency === 'soon' ? '#fed7aa' :
                              '#bbf7d0',
              color: notification.payload.urgency === 'urgent' ? '#dc2626' :
                     notification.payload.urgency === 'soon' ? '#ea580c' :
                     '#16a34a'
            }}>
              {notification.payload.urgency}
            </span>
          )}
        </div>
        {isUnread && (
          <div style={{
            width: 8,
            height: 8,
            backgroundColor: 'var(--primary)',
            borderRadius: '50%',
            marginTop: 4,
            marginLeft: 8,
            flexShrink: 0
          }} />
        )}
      </div>
      <p style={{
        margin: '8px 0 0 0',
        fontSize: 12,
        color: 'var(--muted-foreground)'
      }}>
        {new Date(notification.created_at).toLocaleDateString()}
      </p>
    </div>
  );
}