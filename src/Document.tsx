import type { ParentProps } from 'solid-js';

export default function Document(props: ParentProps) {
  return (
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="theme-color" content="#130f17" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <meta
          name="description"
          content="Public Omarchy plugins and themes by Palash Deb."
        />
        <meta property="og:title" content="Omarchy Extras" />
        <meta
          property="og:description"
          content="Bootable and the GTA6 theme collection for Omarchy."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://omarchy.palash.dev" />
        <title>Omarchy Extras</title>
      </head>
      <body>{props.children}</body>
    </html>
  );
}
