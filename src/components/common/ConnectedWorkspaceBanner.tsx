import React from 'react';

interface ConnectedWorkspaceBannerProps {
  page?: 'dashboard' | 'products' | 'categories' | 'media' | 'builder' | 'settings';
  compact?: boolean;
  onNavigateTab?: (tab: string) => void;
}

/**
 * ConnectedWorkspaceBanner
 * Disabled: This banner was a development-only helper showing the local disk folder path (E:\GOGLE\...).
 * It has been hidden so the store admin dashboard remains clean, uncluttered, and production-ready for merchants.
 */
export const ConnectedWorkspaceBanner: React.FC<ConnectedWorkspaceBannerProps> = () => {
  return null;
};
