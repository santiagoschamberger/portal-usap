/**
 * LeadStatusBadge Component
 * Displays lead status with color-coded badges
 * 
 * Portal uses 6 user-friendly statuses with specific colors
 */

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
  
  // Color mapping for 6 Portal statuses
  const getStatusStyles = (status: string) => {
    const styles: Record<string, string> = {
      'Pre-Vet / New Lead': 'bg-blue-100 text-blue-800 border-blue-200',
      'Contacted': 'bg-purple-100 text-purple-800 border-purple-200',
      'Sent for Signature / Submitted': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'Approved': 'bg-green-100 text-green-800 border-green-200',
      'Declined': 'bg-red-100 text-red-800 border-red-200',
      'Dead / Withdrawn': 'bg-gray-100 text-gray-800 border-gray-200'
    };
    
    return styles[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  // Optional icons for each status
  const getStatusIcon = (status: string) => {
    const icons: Record<string, string> = {
      'Pre-Vet / New Lead': '📋',
      'Contacted': '📞',
      'Sent for Signature / Submitted': '📝',
      'Approved': '✅',
      'Declined': '❌',
      'Dead / Withdrawn': '🔒'
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
        ${getStatusStyles(status)}
        ${sizeClasses[size]}
      `}
      title={status}
    >
      {showIcon && <span>{getStatusIcon(status)}</span>}
      {status}
    </span>
  );
}

