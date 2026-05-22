import Link from 'next/link'
import { PortfolioCompanyForm } from '@/components/admin/PortfolioCompanyForm'

export default function AdminPortfolioNewPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 md:px-8 animate-fade-up">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-6">
        <Link href="/admin/portfolio" className="font-inter text-body text-ink-secondary hover:text-ink-primary transition-colors duration-200">
          ← Portfolio
        </Link>
      </nav>

      <h1 className="font-fraunces text-display-2-mobile md:text-display-2 text-ink-primary mb-8">
        Add company
      </h1>

      <PortfolioCompanyForm mode="create" />
    </div>
  )
}
