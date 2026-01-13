/**
 * LeadStatusBadge Component
 * Displays lead status with color-coded badges
 * 
 * Portal uses 6 simplified statuses (Dec 2025 mapping)
 */

import { normalizeLeadStatus } from '@/lib/statusStageMapping'

interface LeadStatusBadgeProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export function LeadStatusBadge({ 
  status, 
  size = 'md',
  showIcon = false 
}: LeadStatusBadgeProps) {
  
  const normalizedStatus = normalizeLeadStatus(status)

  // Color mapping for current Portal statuses
  const getStatusStyles = (status: string) => {
    const styles: Record<string, string> = {
      'New': 'bg-blue-100 text-blue-800 border-blue-200',
      'Contact Attempt': 'bg-purple-100 text-purple-800 border-purple-200',
      'Contacted - In Progress': 'bg-indigo-100 text-indigo-800 border-indigo-200',
      'Sent for Signature': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'Application Signed': 'bg-green-100 text-green-800 border-green-200',
      'Lost': 'bg-gray-100 text-gray-800 border-gray-200',
    };
    
    return styles[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  // Optional icons for each status
  const getStatusIcon = (status: string) => {
    const icons: Record<string, string> = {
      'New': '📋',
      'Contact Attempt': '📞',
      'Contacted - In Progress': '🧭',
      'Sent for Signature': '📝',
      'Application Signed': '✅',
      'Lost': '🔒',
    };
    
    return icons[status] || '📋';
  };

  // Size classes
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base'
  };

  return (
    <span 
      className={`
        inline-flex items-center gap-1 
        rounded-full font-medium border
        ${getStatusStyles(normalizedStatus)}
        ${sizeClasses[size]}
      `}
      title={normalizedStatus}
    >
      {showIcon && <span>{getStatusIcon(normalizedStatus)}</span>}
      {normalizedStatus}
    </span>
  );
}

