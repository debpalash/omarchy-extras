import type { ParentProps } from 'solid-js';

const siteUrl = 'https://omarchy.palash.dev/';
const socialImage = `${siteUrl}screens/tokyo-night.webp`;
const description = 'Beautiful, Fun & Opinionated Linux by DHH';
const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Omarchy',
  url: siteUrl,
  description,
  image: socialImage,
  isBasedOn: 'https://omarchy.org/',
  author: {
    '@type': 'Person',
    name: 'Palash Deb',
    url: 'https://palash.dev/',
  },
  about: {
    '@type': 'SoftwareApplication',
    name: 'Omarchy',
    operatingSystem: 'Linux',
    applicationCategory: 'OperatingSystem',
    url: 'https://omarchy.org/',
    sameAs: 'https://github.com/omacom/omarchy',
  },
};

export default function Document(props: ParentProps) {
  return (
    <html lang="en">
      <head>
        <script innerHTML="document.documentElement.classList.add('wte-home');" />
        {import.meta.env.DEV && <link rel="stylesheet" href="/virtual:stylex.css" />}
        {import.meta.env.DEV && (
          <script type="module" src="/@id/virtual:stylex:runtime" />
        )}
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="theme-color" content="#11121a" />
        <meta name="robots" content="index, follow, max-image-preview:large" />
        <meta name="author" content="Palash Deb" />
        <link rel="icon" type="image/png" href="/favicon.png" />
        <link rel="canonical" href={siteUrl} />
        <link rel="preload" as="image" type="image/webp" href="/images/silk.webp" fetchpriority="high" />
        <script type="module" src="/assets/js/script.js" />
        <meta name="description" content={description} />
        <meta property="og:title" content="Omarchy: Beautiful, Fun & Opinionated Linux by DHH" />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={siteUrl} />
        <meta property="og:site_name" content="Omarchy" />
        <meta property="og:locale" content="en_US" />
        <meta property="og:image" content={socialImage} />
        <meta property="og:image:type" content="image/webp" />
        <meta property="og:image:width" content="1600" />
        <meta property="og:image:height" content="900" />
        <meta property="og:image:alt" content="Omarchy desktop running the Tokyo Night theme" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Omarchy: Beautiful, Fun & Opinionated Linux by DHH" />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={socialImage} />
        <meta name="twitter:image:alt" content="Omarchy desktop running the Tokyo Night theme" />
        <script type="application/ld+json" innerHTML={JSON.stringify(structuredData)} />
        <title>Omarchy: Beautiful, Fun &amp; Opinionated Linux by DHH</title>
      </head>
      <body>{props.children}</body>
    </html>
  );
}
