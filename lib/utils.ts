import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getScoreLabel(score: number): { label: string; color: string; bgColor: string } {
  if (score >= 85) return { label: 'Excellent Applicant', color: '#22c55e', bgColor: 'rgba(34, 197, 94, 0.1)' };
  if (score >= 70) return { label: 'Good Applicant', color: '#3b82f6', bgColor: 'rgba(59, 130, 246, 0.1)' };
  if (score >= 55) return { label: 'Fair - Review Recommended', color: '#eab308', bgColor: 'rgba(234, 179, 8, 0.1)' };
  if (score >= 40) return { label: 'High Risk', color: '#f97316', bgColor: 'rgba(249, 115, 22, 0.1)' };
  return { label: 'Does Not Meet Criteria', color: '#ef4444', bgColor: 'rgba(239, 68, 68, 0.1)' };
}

export function getRecommendationStyle(rec: string): { color: string; bg: string; border: string } {
  switch (rec) {
    case 'APPROVE':
      return { color: '#22c55e', bg: 'rgba(34, 197, 94, 0.1)', border: 'rgba(34, 197, 94, 0.3)' };
    case 'CONDITIONAL':
      return { color: '#f97316', bg: 'rgba(249, 115, 22, 0.1)', border: 'rgba(249, 115, 22, 0.3)' };
    case 'DECLINE':
      return { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)', border: 'rgba(239, 68, 68, 0.3)' };
    default:
      return { color: '#64748b', bg: 'rgba(100, 116, 139, 0.1)', border: 'rgba(100, 116, 139, 0.3)' };
  }
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
}
