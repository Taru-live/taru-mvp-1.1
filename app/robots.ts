import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://taru.live'

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/about-us',
          '/contact',
          '/pricing',
          '/privacy-policy',
          '/terms-and-conditions',
          '/career-details',
          '/career-exploration',
          '/login',
          '/register',
          '/diagnostic-assessment',
          '/interest-assessment',
          '/skill-assessment',
          '/curriculum-path',
          '/recommended-modules',
        ],
        disallow: [
          '/api/',
          '/dashboard/',
          '/modules/',
          '/student-onboarding',
          '/parent-onboarding',
          '/organization-onboarding',
          '/invite/',
          '/super-admin-login',
          '/result-summary',
          '/subject-selection',
          '/youtube-demo',
          '/youtube-videos',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: [
          '/',
          '/about-us',
          '/contact',
          '/pricing',
          '/career-details',
          '/career-exploration',
          '/curriculum-path',
          '/recommended-modules',
        ],
        disallow: [
          '/api/',
          '/dashboard/',
          '/modules/',
          '/login',
          '/register',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
