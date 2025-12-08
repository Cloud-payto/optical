/**
 * Supabase Storage Helper Functions
 * Handles file uploads and downloads for return reports
 */

import { supabase } from './supabase';
import toast from 'react-hot-toast';

const BUCKET_NAME = 'return-reports';

/**
 * Upload a return report PDF to Supabase Storage
 * @param blob - The PDF blob to upload
 * @param filename - The desired filename (e.g., "Return_Report_Safilo_RR-2025-001.pdf")
 * @param accountId - The user's account ID for folder organization
 * @returns The storage path if successful, null otherwise
 */
export async function uploadReturnReport(
  blob: Blob,
  filename: string,
  accountId: string
): Promise<string | null> {
  try {
    // Create a path: account_id/year/filename
    const year = new Date().getFullYear();
    const path = `${accountId}/${year}/${filename}`;

    console.log('[STORAGE] Uploading return report:', { path, size: blob.size });

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(path, blob, {
        contentType: 'application/pdf',
        cacheControl: '3600',
        upsert: false // Don't overwrite existing files
      });

    if (error) {
      console.error('[STORAGE] Upload error:', error);
      toast.error(`Failed to save report: ${error.message}`);
      return null;
    }

    console.log('[STORAGE] Upload successful:', data.path);
    return data.path;
  } catch (error) {
    console.error('[STORAGE] Unexpected error during upload:', error);
    toast.error('Failed to save report to storage');
    return null;
  }
}

/**
 * Download a return report PDF from Supabase Storage
 * @param path - The storage path (e.g., "account_id/2025/Return_Report_Safilo_RR-2025-001.pdf")
 * @returns The PDF blob if successful, null otherwise
 */
export async function downloadReturnReport(path: string): Promise<Blob | null> {
  try {
    console.log('[STORAGE] Downloading return report:', path);

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .download(path);

    if (error) {
      console.error('[STORAGE] Download error:', error);

      if (error.message.includes('not found')) {
        toast.error('Report file not found. It may have been deleted.');
      } else {
        toast.error(`Failed to download report: ${error.message}`);
      }

      return null;
    }

    console.log('[STORAGE] Download successful:', { size: data.size });
    return data;
  } catch (error) {
    console.error('[STORAGE] Unexpected error during download:', error);
    toast.error('Failed to download report');
    return null;
  }
}

/**
 * Delete a return report PDF from Supabase Storage
 * @param path - The storage path
 * @returns True if successful, false otherwise
 */
export async function deleteReturnReport(path: string): Promise<boolean> {
  try {
    console.log('[STORAGE] Deleting return report:', path);

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([path]);

    if (error) {
      console.error('[STORAGE] Delete error:', error);
      toast.error(`Failed to delete report: ${error.message}`);
      return false;
    }

    console.log('[STORAGE] Delete successful');
    return true;
  } catch (error) {
    console.error('[STORAGE] Unexpected error during delete:', error);
    toast.error('Failed to delete report');
    return false;
  }
}

/**
 * Get a public URL for a return report (if bucket is public)
 * @param path - The storage path
 * @returns The public URL
 */
export function getReturnReportPublicUrl(path: string): string {
  const { data } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(path);

  return data.publicUrl;
}

/**
 * Create a signed URL for temporary access to a private file
 * @param path - The storage path
 * @param expiresIn - Seconds until expiration (default 1 hour)
 * @returns The signed URL if successful, null otherwise
 */
export async function getReturnReportSignedUrl(
  path: string,
  expiresIn: number = 3600
): Promise<string | null> {
  try {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(path, expiresIn);

    if (error) {
      console.error('[STORAGE] Signed URL error:', error);
      return null;
    }

    return data.signedUrl;
  } catch (error) {
    console.error('[STORAGE] Unexpected error creating signed URL:', error);
    return null;
  }
}

/**
 * List all return reports for an account
 * @param accountId - The user's account ID
 * @returns Array of file objects
 */
export async function listReturnReports(accountId: string) {
  try {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .list(accountId, {
        limit: 100,
        offset: 0,
        sortBy: { column: 'created_at', order: 'desc' }
      });

    if (error) {
      console.error('[STORAGE] List error:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('[STORAGE] Unexpected error listing files:', error);
    return [];
  }
}
