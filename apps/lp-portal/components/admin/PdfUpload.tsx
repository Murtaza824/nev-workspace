'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  bucket: string
  folder: string
  currentUrl: string | null
  fieldName: string
}

export function PdfUpload({ bucket, folder, currentUrl, fieldName }: Props) {
  const [url, setUrl] = useState<string | null>(currentUrl)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError(null)

    const supabase = createClient()
    const path = `${folder}/${file.name}`
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(path, file, { upsert: true })

    if (uploadError) {
      setError(uploadError.message)
      setUploading(false)
      return
    }

    const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(path)
    setUrl(publicUrlData.publicUrl)
    setUploading(false)
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Hidden input carries the URL in the form submission */}
      <input type="hidden" name={fieldName} value={url ?? ''} />

      {url ? (
        <div className="flex items-center gap-3">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-inter text-body text-accent-positive hover:opacity-80 transition-opacity duration-200 truncate max-w-xs"
          >
            View PDF
          </a>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="font-inter text-caption text-ink-secondary hover:text-ink-primary transition-colors duration-200"
          >
            Replace
          </button>
          <button
            type="button"
            onClick={() => setUrl(null)}
            className="font-inter text-caption text-ink-secondary hover:text-accent-negative transition-colors duration-200"
          >
            Remove
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center rounded-pill bg-surface-warm border border-border-hairline px-3 py-1.5 font-inter text-body text-ink-secondary hover:text-ink-primary hover:border-white/20 transition-colors duration-200 disabled:opacity-50"
        >
          {uploading ? 'Uploading…' : 'Upload PDF'}
        </button>
      )}

      {error && <p className="font-inter text-caption text-accent-negative">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={handleChange}
      />
    </div>
  )
}
