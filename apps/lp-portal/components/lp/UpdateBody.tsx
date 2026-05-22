'use client'

import ReactMarkdown from 'react-markdown'

interface UpdateBodyProps {
  markdown: string
}

export function UpdateBody({ markdown }: UpdateBodyProps) {
  return (
    <article className="font-inter text-ink-primary">
      <ReactMarkdown
        components={{
          p: ({ children }) => (
            <p className="font-inter text-body-lg-mobile md:text-body-lg text-ink-primary leading-[1.65] md:leading-[1.75] mb-6">
              {children}
            </p>
          ),
          h2: ({ children }) => (
            <h2 className="font-fraunces text-[24px] md:text-[28px] text-ink-primary mt-[2em] mb-4 leading-tight">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="font-fraunces text-[20px] md:text-[22px] text-ink-primary mt-6 mb-3 leading-tight">
              {children}
            </h3>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-[4px] border-accent-positive pl-4 italic font-fraunces text-[18px] md:text-[20px] text-ink-primary my-6">
              {children}
            </blockquote>
          ),
          code: ({ children, className }) => {
            // Block code vs inline
            const isBlock = className?.startsWith('language-')
            if (isBlock) {
              return (
                <code className="block font-mono text-[15px] md:text-[16px] text-ink-primary bg-surface-warm px-4 py-3 rounded my-4 overflow-x-auto">
                  {children}
                </code>
              )
            }
            return (
              <code className="font-mono text-[15px] md:text-[16px] text-ink-primary bg-surface-warm px-1 rounded">
                {children}
              </code>
            )
          },
          img: ({ src, alt }) => (
            <figure className="my-8">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={alt ?? ''}
                className="w-full rounded-lg"
              />
              {alt && (
                <figcaption className="mt-2 font-inter text-caption text-ink-secondary text-center">
                  {alt}
                </figcaption>
              )}
            </figure>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent-positive underline underline-offset-2 hover:opacity-80 transition-opacity"
            >
              {children}
            </a>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-outside pl-5 mb-6 space-y-1 font-inter text-body-lg-mobile md:text-body-lg text-ink-primary">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-outside pl-5 mb-6 space-y-1 font-inter text-body-lg-mobile md:text-body-lg text-ink-primary">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="leading-[1.75]">{children}</li>
          ),
        }}
      >
        {markdown}
      </ReactMarkdown>
    </article>
  )
}
