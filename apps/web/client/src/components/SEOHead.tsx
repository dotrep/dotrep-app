import { useEffect } from 'react';

interface SEOHeadProps {
  title?: string;
  description?: string;
  ogImage?: string;
  path?: string;
}

export function SEOHead({ 
  title = '.rep Platform - Your onchain reputation. Alive on Base.',
  description = 'Claim your soulbound .rep name on Base blockchain. Build your onchain identity and reputation.',
  ogImage = '/og-image.png',
  path = '/'
}: SEOHeadProps) {
  useEffect(() => {
    document.title = title;
    
    const metaTags = [
      { name: 'description', content: description },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:image', content: ogImage },
      { property: 'og:url', content: `https://rep.platform${path}` },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description },
      { name: 'twitter:image', content: ogImage },
    ];

    metaTags.forEach(({ name, property, content }) => {
      const selector = name ? `meta[name="${name}"]` : `meta[property="${property}"]`;
      let meta = document.querySelector(selector);
      
      if (!meta) {
        meta = document.createElement('meta');
        if (name) meta.setAttribute('name', name);
        if (property) meta.setAttribute('property', property);
        document.head.appendChild(meta);
      }
      
      meta.setAttribute('content', content);
    });
  }, [title, description, ogImage, path]);

  return null;
}
