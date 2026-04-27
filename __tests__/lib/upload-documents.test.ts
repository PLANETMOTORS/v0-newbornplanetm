import { describe, it, expect, vi, beforeEach } from 'vitest'
import { uploadDocuments } from '@/lib/finance/upload-documents'

describe('uploadDocuments', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('skips docs with no file', async () => {
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)
    await uploadDocuments('app-1', [{ file: null, type: 'id' }])
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('sends a POST request for each doc with a file', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({ ok: true })
    vi.stubGlobal('fetch', fetchSpy)
    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' })
    await uploadDocuments('app-2', [{ file, type: 'income_proof' }])
    expect(fetchSpy).toHaveBeenCalledWith(
      '/api/v1/financing/documents',
      expect.objectContaining({ method: 'POST' })
    )
  })

  it('logs error when upload fails (ok: false)', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }))
    const file = new File(['x'], 'doc.pdf')
    await uploadDocuments('app-3', [{ file, type: 'bank_stmt' }])
    expect(consoleSpy).toHaveBeenCalledWith('Document upload failed:', 'bank_stmt')
  })

  it('logs error when fetch throws', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')))
    const file = new File(['x'], 'doc.pdf')
    await uploadDocuments('app-4', [{ file, type: 'id_front' }])
    expect(consoleSpy).toHaveBeenCalledWith('Document upload error:', expect.any(Error))
  })

  it('handles multiple docs, skipping null files', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({ ok: true })
    vi.stubGlobal('fetch', fetchSpy)
    const file = new File(['x'], 'a.pdf')
    await uploadDocuments('app-5', [
      { file: null, type: 'missing' },
      { file, type: 'present' },
      { file: null, type: 'also_missing' },
    ])
    expect(fetchSpy).toHaveBeenCalledTimes(1)
  })
})
