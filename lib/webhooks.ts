const WEBHOOK_URL = process.env.WEBHOOK_URL;

export async function notifyDocumentFinalized(payload: {
  consultationId: string;
  documentId: string;
  type: string;
  doctorId: string;
}): Promise<void> {
  if (!WEBHOOK_URL?.trim()) return;
  try {
    const res = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'document.finalized',
        timestamp: new Date().toISOString(),
        ...payload,
      }),
    });
    if (!res.ok) {
      console.warn('[Webhook] document.finalized failed:', res.status);
    }
  } catch (e) {
    console.warn('[Webhook] document.finalized error:', e);
  }
}
