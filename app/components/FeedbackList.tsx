'use client';

import { MessageCircle, Clock, CheckCircle } from 'lucide-react';

interface FeedbackItem {
  id: string;
  type: 'general' | 'bug_report' | 'feature_request' | 'improvement';
  message: string;
  status: 'pending' | 'in_progress' | 'completed';
  createdAt: string;
}

interface FeedbackListProps {
  feedback?: FeedbackItem[];
}

export function FeedbackList({ feedback = [] }: FeedbackListProps) {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'bug_report':
        return <MessageCircle size={16} color="#FF6B6B" />;
      case 'feature_request':
        return <MessageCircle size={16} color="#20c997" />;
      case 'improvement':
        return <MessageCircle size={16} color="#FFD166" />;
      default:
        return <MessageCircle size={16} color="#666666" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={16} color="#20c997" />;
      case 'in_progress':
        return <Clock size={16} color="#FFD166" />;
      default:
        return <Clock size={16} color="#666666" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'bug_report':
        return 'Bug Report';
      case 'feature_request':
        return 'Feature Request';
      case 'improvement':
        return 'Improvement';
      default:
        return 'General';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'in_progress':
        return 'In Progress';
      default:
        return 'Pending';
    }
  };

  if (feedback.length === 0) {
    return (
      <div style={{
        backgroundColor: 'white',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-6)',
        border: '1px solid #e5e7eb',
        textAlign: 'center'
      }}>
        <MessageCircle size={48} color="#e5e7eb" style={{ margin: '0 auto var(--space-4)' }} />
        <h3 style={{
          margin: '0 0 var(--space-2)',
          fontSize: 'var(--text-lg)',
          fontWeight: 'var(--font-semibold)',
          color: '#333333'
        }}>
          No Feedback Yet
        </h3>
        <p style={{
          margin: 0,
          color: '#666666',
          fontSize: 'var(--text-sm)'
        }}>
          Share your thoughts and suggestions to help improve the app
        </p>
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: 'var(--radius-lg)',
      border: '1px solid #e5e7eb'
    }}>
      <div style={{
        padding: 'var(--space-6)',
        borderBottom: '1px solid #e5e7eb'
      }}>
        <h3 style={{
          margin: 0,
          fontSize: 'var(--text-lg)',
          fontWeight: 'var(--font-semibold)',
          color: '#333333'
        }}>
          Recent Feedback
        </h3>
        <p style={{
          margin: 'var(--space-1) 0 0',
          color: '#666666',
          fontSize: 'var(--text-sm)'
        }}>
          {feedback.length} item{feedback.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div style={{ maxHeight: 400, overflow: 'auto' }}>
        {feedback.map((item) => (
          <div
            key={item.id}
            style={{
              padding: 'var(--space-4) var(--space-6)',
              borderBottom: '1px solid #f3f4f6',
              display: 'flex',
              gap: 'var(--space-3)',
              alignItems: 'flex-start'
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 32,
              height: 32,
              borderRadius: 'var(--radius-md)',
              backgroundColor: '#f8f9fa',
              flexShrink: 0
            }}>
              {getTypeIcon(item.type)}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                marginBottom: 'var(--space-1)'
              }}>
                <span style={{
                  fontSize: 'var(--text-sm)',
                  fontWeight: 'var(--font-medium)',
                  color: '#333333'
                }}>
                  {getTypeLabel(item.type)}
                </span>
                <span style={{
                  fontSize: 'var(--text-xs)',
                  color: '#666666'
                }}>
                  {new Date(item.createdAt).toLocaleDateString()}
                </span>
              </div>

              <p style={{
                margin: '0 0 var(--space-2)',
                fontSize: 'var(--text-sm)',
                color: '#333333',
                lineHeight: 1.5
              }}>
                {item.message}
              </p>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-1)'
              }}>
                {getStatusIcon(item.status)}
                <span style={{
                  fontSize: 'var(--text-xs)',
                  color: '#666666'
                }}>
                  {getStatusLabel(item.status)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
