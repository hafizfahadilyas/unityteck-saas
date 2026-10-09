import type { MediaType, MediaAsset } from '../types/media';

/**
 * Human readable file size formatter
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Detect media type from file extension or mime type
 */
export function detectMediaType(mimeOrUrl: string, fileName = ''): MediaType {
  const checkStr = (mimeOrUrl + ' ' + fileName).toLowerCase();
  if (checkStr.includes('gif') || checkStr.endsWith('.gif')) return 'gif';
  if (checkStr.includes('svg') || checkStr.endsWith('.svg')) return 'svg';
  if (
    checkStr.includes('video') ||
    checkStr.includes('mp4') ||
    checkStr.includes('webm') ||
    checkStr.includes('mov') ||
    checkStr.includes('m4v') ||
    checkStr.endsWith('.mp4') ||
    checkStr.endsWith('.webm')
  ) {
    return 'video';
  }
  return 'image';
}

/**
 * Cache-busting URL utility for zero-stale image delivery
 */
export function getCacheBustedUrl(url: string, version?: number | string): string {
  if (!url) return '';
  if (url.startsWith('data:') || url.startsWith('blob:')) return url;
  const v = version ?? Date.now();
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}v=${v}`;
}

/**
 * Client-side high quality image optimization using canvas
 * Generates WebP/JPEG, responsive thumbnail, and calculates savings
 */
export async function optimizeImageFile(
  file: File,
  maxDimension = 2000,
  quality = 0.88,
): Promise<{
  dataUrl: string;
  webpUrl: string;
  thumbnailDataUrl: string;
  width: number;
  height: number;
  originalSize: number;
  compressedSize: number;
  savingsPct: number;
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Resize down if larger than maxDimension
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        // Main optimized canvas
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return resolve({
            dataUrl: e.target?.result as string,
            webpUrl: e.target?.result as string,
            thumbnailDataUrl: e.target?.result as string,
            width: img.width,
            height: img.height,
            originalSize: file.size,
            compressedSize: file.size,
            savingsPct: 0,
          });
        }

        // Draw image smoothly
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        const webpUrl = canvas.toDataURL('image/webp', quality);
        const dataUrl = file.type === 'image/png' && file.size < 500000 
          ? (e.target?.result as string) 
          : webpUrl;

        // Create fast thumbnail (300px max)
        const thumbCanvas = document.createElement('canvas');
        const thumbMax = 320;
        let tw = width;
        let th = height;
        if (tw > thumbMax || th > thumbMax) {
          if (tw > th) {
            th = Math.round((th * thumbMax) / tw);
            tw = thumbMax;
          } else {
            tw = Math.round((tw * thumbMax) / th);
            th = thumbMax;
          }
        }
        thumbCanvas.width = tw;
        thumbCanvas.height = th;
        const thumbCtx = thumbCanvas.getContext('2d');
        if (thumbCtx) {
          thumbCtx.imageSmoothingEnabled = true;
          thumbCtx.imageSmoothingQuality = 'high';
          thumbCtx.drawImage(img, 0, 0, tw, th);
        }
        const thumbnailDataUrl = thumbCanvas.toDataURL('image/webp', 0.8);

        // Approximate size of base64
        const compressedSize = Math.round((webpUrl.length * 3) / 4);
        const originalSize = file.size;
        const savingsPct = originalSize > compressedSize 
          ? Math.round(((originalSize - compressedSize) / originalSize) * 100) 
          : 0;

        resolve({
          dataUrl,
          webpUrl,
          thumbnailDataUrl,
          width,
          height,
          originalSize,
          compressedSize: Math.min(compressedSize, originalSize),
          savingsPct,
        });
      };
      img.onerror = () => reject(new Error('Failed to load image for optimization'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Video metadata and poster extraction
 */
export async function extractVideoMetadata(
  fileOrUrl: File | string,
): Promise<{ duration: number; width: number; height: number; posterUrl: string }> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;

    const cleanup = () => {
      if (typeof fileOrUrl !== 'string') {
        URL.revokeObjectURL(video.src);
      }
    };

    video.onloadedmetadata = () => {
      const duration = Math.round(video.duration || 0);
      const width = video.videoWidth || 1280;
      const height = video.videoHeight || 720;

      // Seek to 1s to capture poster
      video.currentTime = Math.min(1, (video.duration || 2) / 2);
    };

    video.onseeked = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 360;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const posterUrl = canvas.toDataURL('image/jpeg', 0.85);
          cleanup();
          resolve({
            duration: Math.round(video.duration || 0),
            width: video.videoWidth || 1280,
            height: video.videoHeight || 720,
            posterUrl,
          });
          return;
        }
      } catch {
        // cross-origin canvas security fallback
      }
      cleanup();
      resolve({
        duration: Math.round(video.duration || 0),
        width: video.videoWidth || 1280,
        height: video.videoHeight || 720,
        posterUrl: '',
      });
    };

    video.onerror = () => {
      cleanup();
      resolve({
        duration: 0,
        width: 1280,
        height: 720,
        posterUrl: '',
      });
    };

    if (typeof fileOrUrl === 'string') {
      video.crossOrigin = 'anonymous';
      video.src = fileOrUrl;
    } else {
      video.src = URL.createObjectURL(fileOrUrl);
    }
  });
}

/**
 * Google Drive URL Parser
 * Supports various Google Drive link formats and extracts file ID and direct links
 */
export function parseGoogleDriveUrl(inputUrl: string): {
  isGoogleDrive: boolean;
  fileId?: string;
  directUrl?: string;
  thumbnailUrl?: string;
  previewUrl?: string;
} {
  const clean = inputUrl.trim();
  if (!clean.includes('drive.google.com') && !clean.includes('docs.google.com')) {
    return { isGoogleDrive: false };
  }

  let fileId = '';
  // Match /file/d/FILE_ID/ or /d/FILE_ID/
  const fileDMatch = clean.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (fileDMatch && fileDMatch[1]) {
    fileId = fileDMatch[1];
  } else {
    // Match id=FILE_ID
    const idParamMatch = clean.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (idParamMatch && idParamMatch[1]) {
      fileId = idParamMatch[1];
    }
  }

  if (!fileId) {
    return { isGoogleDrive: true };
  }

  return {
    isGoogleDrive: true,
    fileId,
    directUrl: `https://drive.google.com/uc?export=view&id=${fileId}`,
    thumbnailUrl: `https://drive.google.com/thumbnail?id=${fileId}&sz=w600`,
    previewUrl: `https://drive.google.com/file/d/${fileId}/preview`,
  };
}
