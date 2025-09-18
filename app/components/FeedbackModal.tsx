'use client';

import { useState } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
  const [feedback, setFeedback] = useState('');
  const [type, setType] = useState<'general' | 'bug_report' | 'feature_request' | 'improvement'>('general');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback.trim()) return;

    setIsSubmitting(true);
    try {
      // Here you would typically send the feedback to your backend
      // console.log('Feedback submitted:', { type, feedback });
      setFeedback('');
      onClose();
    } catch (error) {
      console.error('Error submitting feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-6)',
        maxWidth: 500,
        width: '90%',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 'var(--space-4)'
        }}>
          <h2 style={{
            margin: 0,
            fontSize: 'var(--text-xl)',
            fontWeight: 'var(--font-semibold)',
            color: '#333333'
          }}>
            Share Feedback
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 'var(--space-1)',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={20} color="#666666" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 'var(--space-4)' }}>
            <label style={{
              display: 'block',
              fontSize: 'var(--text-sm)',
              fontWeight: 'var(--font-medium)',
              color: '#333333',
              marginBottom: 'var(--space-2)'
            }}>
              Feedback Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              style={{
                width: '100%',
                padding: 'var(--space-3)',
                border: '1px solid #e5e7eb',
                borderRadius: 'var(--radius-md)',
                fontSize: 'var(--text-sm)',
                backgroundColor: 'white'
              }}
            >
              <option value="general">General Feedback</option>
              <option value="bug_report">Bug Report</option>
              <option value="feature_request">Feature Request</option>
              <option value="improvement">Improvement Suggestion</option>
            </select>
          </div>

          <div style={{ marginBottom: 'var(--space-6)' }}>
            <label style={{
              display: 'block',
              fontSize: 'var(--text-sm)',
              fontWeight: 'var(--font-medium)',
              color: '#333333',
              marginBottom: 'var(--space-2)'
            }}>
              Your Feedback
            </label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Share your thoughts, suggestions, or report any issues..."
              rows={6}
              style={{
                width: '100%',
                padding: 'var(--space-3)',
                border: '1px solid #e5e7eb',
                borderRadius: 'var(--radius-md)',
                fontSize: 'var(--text-sm)',
                resize: 'vertical',
                fontFamily: 'inherit'
              }}
            />
          </div>

          <div style={{
            display: 'flex',
            gap: 'var(--space-3)',
            justifyContent: 'flex-end'
          }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: 'var(--space-3) var(--space-6)',
                border: '1px solid #e5e7eb',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'white',
                color: '#666666',
                fontSize: 'var(--text-sm)',
                fontWeight: 'var(--font-medium)',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!feedback.trim() || isSubmitting}
              style={{
                padding: 'var(--space-3) var(--space-6)',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                backgroundColor: '#20c997',
                color: 'white',
                fontSize: 'var(--text-sm)',
                fontWeight: 'var(--font-medium)',
                cursor: feedback.trim() && !isSubmitting ? 'pointer' : 'not-allowed',
                opacity: feedback.trim() && !isSubmitting ? 1 : 0.6,
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)'
              }}
            >
              <Send size={16} />
              {isSubmitting ? 'Sending...' : 'Send Feedback'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
