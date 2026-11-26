import React from 'react';

export type SkeletonAnimation = 'shimmer' | 'pulse' | 'none';
export type SkeletonSpeed = 'slow' | 'normal' | 'fast';
export type SkeletonVariant = 'rectangular' | 'rounded' | 'circular' | 'pill';

export interface SkeletonConfig {
  enabled: boolean;
  animation: SkeletonAnimation;
  speed: SkeletonSpeed;
  reducedMotion: boolean;
}

export interface SkeletonBaseProps {
  className?: string;
  style?: React.CSSProperties;
  animation?: SkeletonAnimation;
  speed?: SkeletonSpeed;
  'aria-label'?: string;
}

export interface SkeletonProps extends SkeletonBaseProps {
  variant?: SkeletonVariant;
  width?: string | number;
  height?: string | number;
  children?: React.ReactNode;
}

export interface SkeletonTextProps extends SkeletonBaseProps {
  lines?: number;
  lastLineWidth?: string | number;
  gap?: string | number;
  lineHeight?: string | number;
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl';
}

export interface SkeletonTitleProps extends SkeletonBaseProps {
  withSubtitle?: boolean;
  withBadge?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export interface SkeletonAvatarProps extends SkeletonBaseProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  shape?: 'circle' | 'rounded' | 'square';
}

export interface SkeletonImageProps extends SkeletonBaseProps {
  aspectRatio?: 'square' | 'video' | 'portrait' | 'wide' | string;
  width?: string | number;
  height?: string | number;
  rounded?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full' | 'none';
  showIcon?: boolean;
}

export interface SkeletonButtonProps extends SkeletonBaseProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  width?: string | number;
  fullWidth?: boolean;
  rounded?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export interface SkeletonCardProps extends SkeletonBaseProps {
  hasHeader?: boolean;
  hasFooter?: boolean;
  hasMedia?: boolean;
  mediaHeight?: string | number;
  lines?: number;
  children?: React.ReactNode;
}

export interface SkeletonProductCardProps extends SkeletonBaseProps {
  variant?: 'grid' | 'horizontal' | 'compact' | 'luxury';
  imageAspectRatio?: 'square' | 'video' | 'portrait' | string;
  showRating?: boolean;
  showButton?: boolean;
  showVendor?: boolean;
}

export interface SkeletonProductGridProps extends SkeletonBaseProps {
  count?: number;
  columns?: 1 | 2 | 3 | 4 | 5 | 6 | 'auto';
  variant?: 'grid' | 'horizontal' | 'compact' | 'luxury';
  gap?: 'sm' | 'md' | 'lg';
}

export interface SkeletonTableRowProps extends SkeletonBaseProps {
  columns?: number;
  columnWidths?: (string | number)[];
  alignments?: ('left' | 'center' | 'right')[];
}

export interface SkeletonTableProps extends SkeletonBaseProps {
  columns?: number;
  rows?: number;
  columnWidths?: (string | number)[];
  hasHeader?: boolean;
  hasPagination?: boolean;
  hasToolbar?: boolean;
  dense?: boolean;
}

export interface SkeletonSidebarProps extends SkeletonBaseProps {
  itemCount?: number;
  collapsed?: boolean;
  hasLogo?: boolean;
  hasUser?: boolean;
  hasFooter?: boolean;
}

export interface SkeletonNavbarProps extends SkeletonBaseProps {
  hasSearch?: boolean;
  hasActions?: boolean;
  hasStoreSwitcher?: boolean;
  hasAvatar?: boolean;
}

export interface SkeletonChartProps extends SkeletonBaseProps {
  type?: 'bar' | 'area' | 'line' | 'donut' | 'cylinder';
  height?: string | number;
  hasLegend?: boolean;
  hasHeader?: boolean;
}

export interface SkeletonDashboardProps extends SkeletonBaseProps {
  statCardsCount?: number;
  hasCharts?: boolean;
  hasRecentOrders?: boolean;
  hasActivities?: boolean;
}

export interface SkeletonFormProps extends SkeletonBaseProps {
  fieldsCount?: number;
  columns?: 1 | 2 | 3;
  hasActions?: boolean;
}

export interface SkeletonModalProps extends SkeletonBaseProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  hasHeader?: boolean;
  hasFooter?: boolean;
  lines?: number;
}

export interface SkeletonPageProps extends SkeletonBaseProps {
  layout?: 'dashboard' | 'table' | 'cards' | 'form' | 'storefront';
  hasHeader?: boolean;
  hasTabs?: boolean;
}

export interface SkeletonCheckoutProps extends SkeletonBaseProps {
  hasSidebar?: boolean;
}

export interface SkeletonOrderListProps extends SkeletonBaseProps {
  count?: number;
}
