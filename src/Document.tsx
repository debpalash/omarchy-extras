import type { ParentProps } from 'solid-js';

const siteUrl = 'https://omarchy.palash.dev/';
const socialImage = `${siteUrl}og-image.jpg`;
const description = 'Install public Omarchy plugins and themes, including the Bootable USB writer plugin and GTA6 wallpaper-matched theme editions by Palash Deb.';
const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': `${siteUrl}#website`,
      name: 'Omarchy Extras',
      alternateName: 'Omarchy Plugins and Themes',
      url: siteUrl,
    },
    {
      '@type': 'CollectionPage',
      '@id': siteUrl,
      url: siteUrl,
      name: 'Omarchy Plugins and Themes',
      description,
      image: socialImage,
      isPartOf: { '@id': `${siteUrl}#website` },
      mainEntity: {
        '@type': 'ItemList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            item: {
              '@type': 'SoftwareApplication',
              name: 'Bootable',
              applicationCategory: 'UtilitiesApplication',
              operatingSystem: 'Omarchy Linux',
              url: 'https://bootable.palash.dev/',
              sameAs: 'https://github.com/debpalash/omarchy-bootable',
            },
          },
          {
            '@type': 'ListItem',
            position: 2,
            item: {
              '@type': 'CreativeWork',
              name: 'GTA6 theme for Omarchy',
              url: 'https://github.com/debpalash/omarchy-gta6-theme',
              image: socialImage,
            },
          },
        ],
      },
    },
  ],
};

export default function Document(props: ParentProps) {
  return (
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="theme-color" content="#130f17" />
        <meta name="robots" content="index, follow, max-image-preview:large" />
        <meta name="author" content="Palash Deb" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="canonical" href={siteUrl} />
        <link rel="preload" as="image" type="image/webp" href="/wallpapers/1-vice-sunset-ultrawide.webp" fetchpriority="high" />
        <meta name="description" content={description} />
        <meta property="og:title" content="Omarchy Plugins and Themes | Omarchy Extras" />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={siteUrl} />
        <meta property="og:site_name" content="Omarchy Extras" />
        <meta property="og:locale" content="en_US" />
        <meta property="og:image" content={socialImage} />
        <meta property="og:image:type" content="image/jpeg" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="Vice Sunset, the default GTA6 theme wallpaper for Omarchy" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Omarchy Plugins and Themes | Omarchy Extras" />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={socialImage} />
        <meta name="twitter:image:alt" content="Vice Sunset, the default GTA6 theme wallpaper for Omarchy" />
        <script type="application/ld+json" innerHTML={JSON.stringify(structuredData)} />
        <title>Omarchy Plugins and Themes | Omarchy Extras</title>
      </head>
      <body>{props.children}</body>
    </html>
  );
}
