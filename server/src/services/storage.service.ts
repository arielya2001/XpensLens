import crypto from 'crypto';
import path from 'path';
import { supabase } from '../lib/supabase';

const BUCKET = 'receipts';

export async function uploadReceipt(buffer: Buffer, originalname: string, mimetype: string): Promise<string> {
  const ext = path.extname(originalname);
  const filename = `${crypto.randomUUID()}${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(filename, buffer, { contentType: mimetype });

  if (error) throw new Error(`Storage upload failed: ${error.message}`);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(filename);
  return data.publicUrl;
}
