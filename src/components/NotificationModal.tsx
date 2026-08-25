'use client';

import React, { useState, useEffect } from 'react';
import { X, Bell, Check, AlertTriangle, ShieldCheck, Smartphone } from 'lucide-react';
import { requestFCMToken } from '@/lib/firebase';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationModal({ isOpen, onClose }: NotificationModalProps) {
  const [permission, setPermission] = useState<string>('default');
  const [token, setToken] = useState<string | null>(null);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleEnableNotifications = async () => {
    setIsSubscribing(true);
    setStatusMessage(null);
    try {
      const fcmToken = await requestFCMToken();
      if (fcmToken) {
        setToken(fcmToken);
        setPermission('granted');
        setStatusMessage('Success! Your device is registered for breaking market alerts & portfolio shifts.');
      } else {
        setStatusMessage('Permission granted or pending. Ensure Firebase environment variables are configured.');
      }
    } catch (e: any) {
      setStatusMessage(`Error enabling notifications: ${e.message}`);
    } finally {
      setIsSubscribing(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: 'linear-gradient(135deg, #d4af37 0%, #990f3d 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
              }}
            >
              <Bell size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-serif)', fontWeight: 800 }}>
                Market Push Alerts & PWA
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                FCM Protocol • Portfolio Volatility & Breaking Briefings
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon" title="Close">
            <X size={18} />
          </button>
        </div>

        <div style={{ background: 'var(--bg-card)', padding: '16px 20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', marginBottom: 20 }}>
          <h4 style={{ fontSize: '0.88rem', fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Smartphone size={16} color="var(--accent-gold)" />
            <span>Real-Time Alert Triggers</span>
          </h4>
          <ul style={{ paddingLeft: 20, fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            <li><strong>Portfolio Volatility:</strong> Alerts when your tracked stocks move ±3% intraday.</li>
            <li><strong>Morning Executive Digest:</strong> Daily briefing delivered at market open.</li>
            <li><strong>Breaking Intelligence:</strong> Urgent macroeconomic & industry announcements.</li>
          </ul>
        </div>

        {statusMessage && (
          <div
            style={{
              padding: '12px 16px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.82rem',
              background: token ? 'rgba(16, 185, 129, 0.15)' : 'rgba(212, 175, 55, 0.15)',
              color: token ? '#34d399' : 'var(--accent-gold)',
              border: `1px solid ${token ? 'rgba(16, 185, 129, 0.3)' : 'rgba(212, 175, 55, 0.3)'}`,
              marginBottom: 16,
            }}
          >
            {statusMessage}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            onClick={handleEnableNotifications}
            disabled={isSubscribing}
            style={{
              background: 'linear-gradient(135deg, var(--accent-primary), #990f3d)',
              color: '#fff',
              border: 'none',
              padding: '12px 20px',
              borderRadius: 'var(--radius-md)',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              boxShadow: '0 4px 14px rgba(153, 15, 61, 0.3)',
            }}
          >
            <Bell size={17} />
            <span>{isSubscribing ? 'Registering with FCM...' : permission === 'granted' ? 'Re-Sync FCM Notification Token' : 'Enable Mobile Push Alerts'}</span>
          </button>

          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: 4 }}>
            Powered by Firebase Cloud Messaging (FCM) & Progressive Web App Service Workers.
          </p>
        </div>
      </div>
    </div>
  );
}
