import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';

export async function extractTextFromDocument(buffer: Buffer, mimeType: string, filename: string): Promise<string> {
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';

  if (mimeType === 'application/pdf' || ext === 'pdf') {
    const result = await pdfParse(buffer);
    return result.text.trim();
  }

  if (
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimeType === 'application/msword' ||
    ext === 'docx' || ext === 'doc'
  ) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value.trim();
  }

  if (mimeType === 'text/plain' || ext === 'txt') {
    return buffer.toString('utf-8').trim();
  }

  throw new Error(`Unsupported file type: ${mimeType}`);
}
