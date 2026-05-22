'use client'

import dynamic from 'next/dynamic'

// Dynamically import to avoid SSR since @uiw/react-md-editor uses browser APIs
const MDEditor = dynamic(
  () => import('@uiw/react-md-editor').then((mod) => mod.default),
  { ssr: false }
)

interface Props {
  value: string
  onChange: (value: string) => void
}

export function MdEditor({ value, onChange }: Props) {
  return (
    <div data-color-mode="dark">
      <MDEditor
        value={value}
        onChange={(v) => onChange(v ?? '')}
        height={400}
        preview="edit"
      />
    </div>
  )
}
