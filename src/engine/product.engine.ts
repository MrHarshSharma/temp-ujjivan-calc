import type { ProductMaster, ProductReturnHistory } from '@/types'

/**
 * F-02 / F-07 product-master helpers. Pure functions over the product list so
 * the recommendation engine, plan screen, and admin all share one source of truth.
 */

/** A product is a "protection" product (XIRR N/A) when it carries no return history. */
export function isProtectionProduct(product: ProductMaster): boolean {
  const { xirr3yr, xirr5yr, xirr10yr } = product.returnHistory
  return product.category === 'INSURANCE' || (xirr3yr === null && xirr5yr === null && xirr10yr === null)
}

/** True when at least one XIRR horizon is populated. */
export function hasXirr(history: ProductReturnHistory): boolean {
  return history.xirr3yr !== null || history.xirr5yr !== null || history.xirr10yr !== null
}

/**
 * F-03: resolve the alternate product for a given product.
 * Uses the admin-set `alternateProductId`; if unset, falls back to the
 * next-best-ranked ACTIVE product in the same category.
 */
export function getAlternateProduct(
  product: ProductMaster,
  allProducts: ProductMaster[]
): ProductMaster | null {
  if (product.alternateProductId) {
    const explicit = allProducts.find(p => p.id === product.alternateProductId && p.isActive)
    if (explicit) return explicit
  }
  return (
    allProducts
      .filter(p => p.id !== product.id && p.isActive && p.category === product.category)
      .sort((a, b) => a.priorityRank - b.priorityRank)[0] ?? null
  )
}

/**
 * F-02: split a product list into Ujjivan offerings vs third-party "Other market
 * options". Each group is sorted by priority rank (lower = shown first).
 */
export function splitUjjivanVsThirdParty(products: ProductMaster[]): {
  ujjivan: ProductMaster[]
  thirdParty: ProductMaster[]
} {
  const byRank = (a: ProductMaster, b: ProductMaster) => a.priorityRank - b.priorityRank
  return {
    ujjivan: products.filter(p => p.isUjjivanProduct).sort(byRank),
    thirdParty: products.filter(p => !p.isUjjivanProduct).sort(byRank),
  }
}

/** F-02 non-removable disclosure shown whenever third-party products appear. */
export const THIRD_PARTY_DISCLOSURE =
  'Ujjivan does not currently offer a product in this category. The following are third-party options you may consider.'
