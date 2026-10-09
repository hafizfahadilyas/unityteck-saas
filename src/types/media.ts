export type MediaType = 'image' | 'video' | 'gif' | 'svg';

export type MediaProcessingStatus = 'ready' | 'uploading' | 'optimizing' | 'failed';
export type MediaOptimizationStatus = 'optimized' | 'original' | 'in_progress';
export type MediaSource = 'upload' | 'gdrive' | 'url' | 'seed';

export interface MediaUsage {
  id: string;
  type: 
    | 'product_image' 
    | 'product_gallery' 
    | 'product_variant' 
    | 'category' 
    | 'brand_logo' 
    | 'store_logo' 
    | 'store_favicon' 
    | 'banner' 
    | 'slider' 
    | 'theme' 
    | 'seo_social' 
    | 'marketing';
  label: string;
  referenceId?: string;
  referenceName?: string;
  previewThumb?: string;
}

export interface MediaAsset {
  id: string;
  storeId: string;
  fileName: string;
  title?: string;
  fileType: MediaType;
  mimeType: string;
  fileSize: number; // in bytes
  width?: number;
  height?: number;
  originalUrl: string;
  optimizedUrl?: string;
  webpUrl?: string;
  avifUrl?: string;
  thumbnailUrl?: string;
  posterUrl?: string; // for video thumbnail
  duration?: number; // duration in seconds for videos
  altText?: string;
  caption?: string;
  folder?: 'products' | 'banners' | 'categories' | 'branding' | 'marketing' | 'general' | string;
  tags?: string[];
  uploadDate: string;
  updatedAt: string;
  version: number;
  processingStatus: MediaProcessingStatus;
  optimizationStatus: MediaOptimizationStatus;
  source: MediaSource;
  metadata?: {
    originalSize?: number;
    savedBytes?: number;
    compressionRatio?: string;
    gdriveFileId?: string;
    bitrate?: string;
    resolution?: string;
    [key: string]: any;
  };
}
