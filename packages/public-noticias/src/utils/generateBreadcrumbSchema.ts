/**
 * Generate BreadcrumbList structured data for SEO
 * https://schema.org/BreadcrumbList
 */

interface BreadcrumbItem {
  name: string
  url: string
}

export function generateBreadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      // El último item no debe tener URL (es la página actual)
      item: index === items.length - 1 ? undefined : item.url,
    }))
  }
}
