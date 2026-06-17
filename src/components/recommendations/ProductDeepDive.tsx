'use client'

import type { ProductMaster } from '@/types'
import { hasXirr } from '@/engine/product.engine'

/** F-07: compact XIRR row — "3yr 15.2% · 5yr 13.8% · 10yr 12.5% · as of 2026-03". */
export function XirrInline({ product }: { product: ProductMaster }) {
  const h = product.returnHistory
  if (!hasXirr(h)) {
    return <span className="text-[11px] text-slate-400">XIRR N/A — protection product</span>
  }
  const parts = [
    h.xirr3yr != null ? `3yr ${h.xirr3yr.toFixed(1)}%` : null,
    h.xirr5yr != null ? `5yr ${h.xirr5yr.toFixed(1)}%` : null,
    h.xirr10yr != null ? `10yr ${h.xirr10yr.toFixed(1)}%` : null,
  ].filter(Boolean)
  return (
    <span className="text-[11px] text-slate-500 font-medium">
      {parts.join(' · ')}
      {h.asOf && <span className="text-slate-400 font-normal"> · as of {h.asOf}</span>}
    </span>
  )
}

/** F-03: Refer/Open (Ujjivan) or Learn more (third-party); "Coming soon" when no link. */
function CtaButton({ product, secondary = false }: { product: ProductMaster; secondary?: boolean }) {
  const label = product.isUjjivanProduct ? 'Refer / Open' : 'Learn more'
  if (!product.ctaLink) {
    return (
      <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-400 cursor-not-allowed">
        Coming soon
      </span>
    )
  }
  const styles = secondary
    ? 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
    : 'bg-blue-600 text-white hover:bg-blue-700'
  return (
    <a
      href={product.ctaLink}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${styles}`}
    >
      {label} →
    </a>
  )
}

function ProsCons({ pros, cons }: { pros: string[]; cons: string[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 mt-2">
      <div>
        <p className="text-[11px] font-semibold text-green-700 uppercase tracking-wide mb-1">Pros</p>
        <ul className="space-y-0.5">
          {pros.map((p, i) => (
            <li key={i} className="text-xs text-slate-600 flex gap-1.5"><span className="text-green-500">+</span>{p}</li>
          ))}
        </ul>
      </div>
      <div>
        <p className="text-[11px] font-semibold text-red-700 uppercase tracking-wide mb-1">Cons</p>
        <ul className="space-y-0.5">
          {cons.map((c, i) => (
            <li key={i} className="text-xs text-slate-600 flex gap-1.5"><span className="text-red-400">−</span>{c}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}

/** Side-by-side 5yr XIRR comparison between primary and alternate (F-03). */
function XirrCompare({ primary, alternate }: { primary: ProductMaster; alternate: ProductMaster }) {
  const p = primary.returnHistory.xirr5yr
  const a = alternate.returnHistory.xirr5yr
  if (p == null && a == null) return null
  const fmt = (v: number | null) => (v != null ? `${v.toFixed(1)}%` : 'N/A')
  return (
    <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-500">
      <span className="font-medium text-slate-600">5yr XIRR:</span>
      <span>{primary.name.split(' ')[0]} <strong className="text-slate-800">{fmt(p)}</strong></span>
      <span className="text-slate-300">vs</span>
      <span>{alternate.name.split(' ')[0]} <strong className="text-slate-800">{fmt(a)}</strong></span>
    </div>
  )
}

/**
 * F-03 deep dive: primary recommended product alongside one alternate with a
 * structured pros/cons comparison, XIRR data, and CTAs.
 */
export function ProductDeepDive({
  primary,
  alternate,
}: {
  primary: ProductMaster
  alternate: ProductMaster | null
}) {
  return (
    <div className="mt-3 border-t border-slate-100 pt-3">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Deep dive</p>

      {/* Primary recommended */}
      <div className="rounded-lg border border-blue-200 bg-blue-50/50 px-3 py-2.5">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded">Recommended</span>
              <p className="text-sm font-semibold text-slate-900">{primary.name}</p>
            </div>
            <p className="text-xs text-slate-600 mt-1"><span className="font-medium text-slate-700">Why this? </span>{primary.rmPitch}</p>
            <div className="mt-1"><XirrInline product={primary} /></div>
          </div>
          <CtaButton product={primary} />
        </div>
      </div>

      {/* Alternate option */}
      {alternate && (
        <div className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 mt-2">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">Alternate option</span>
                <p className="text-sm font-semibold text-slate-900">{alternate.name}</p>
              </div>
              <div className="mt-1"><XirrInline product={alternate} /></div>
            </div>
            <CtaButton product={alternate} secondary />
          </div>
          <ProsCons pros={alternate.pros} cons={alternate.cons} />
          <XirrCompare primary={primary} alternate={alternate} />
        </div>
      )}
    </div>
  )
}
