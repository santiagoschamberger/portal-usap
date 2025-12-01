/**
 * DealStageBadge Component
 * Displays deal stage with color-coded badges
 */

interface DealStageBadgeProps {
  stage: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export function DealStageBadge({ 
  stage, 
  size = 'md',
  showIcon = false 
}: DealStageBadgeProps) {
  
  // Color mapping for Deal stages
  const getStageStyles = (stage: string) => {
    const styles: Record<string, string> = {
      'New Lead / Prevet': 'bg-blue-100 text-blue-800 border-blue-200',
      'Submitted': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'Underwriting': 'bg-indigo-100 text-indigo-800 border-indigo-200',
      'Approved': 'bg-green-100 text-green-800 border-green-200',
      'Declined': 'bg-red-100 text-red-800 border-red-200',
      'Closed': 'bg-gray-100 text-gray-800 border-gray-200'
    };
    
    return styles[stage] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  // Optional icons for each stage
  const getStageIcon = (stage: string) => {
    const icons: Record<string, string> = {
      'New Lead / Prevet': '🆕',
      'Submitted': '📝',
      'Underwriting': '🔍',
      'Approved': '✅',
      'Declined': '❌',
      'Closed': '🔒'
    };
    
    return icons[stage] || '📋';
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
        ${getStageStyles(stage)}
        ${sizeClasses[size]}
      `}
      title={stage}
    >
      {showIcon && <span>{getStageIcon(stage)}</span>}
      {stage}
    </span>
  );
}

