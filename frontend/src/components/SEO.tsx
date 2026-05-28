import { Helmet } from 'react-helmet-async'

interface SEOProps {
  title: string
  description?: string
  ogTitle?: string
  ogDescription?: string
  ogImage?: string
}

const SITE_NAME = 'Congrès Scientifique'
const DEFAULT_DESC = 'Plateforme de gestion de congrès scientifiques - soumissions, inscriptions, programme et actes.'

export function SEO({ title, description = DEFAULT_DESC, ogTitle, ogDescription, ogImage }: SEOProps) {
  const fullTitle = title ? `${title} - ${SITE_NAME}` : SITE_NAME
  const ogTitleFinal = ogTitle ?? fullTitle
  const ogDescFinal = ogDescription ?? description

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta property="og:title" content={ogTitleFinal} />
      <meta property="og:description" content={ogDescFinal} />
      <meta property="og:type" content="website" />
      <meta property="og:locale" content="fr_FR" />
      {ogImage && <meta property="og:image" content={ogImage} />}
    </Helmet>
  )
}
