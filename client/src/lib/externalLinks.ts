// External redirect links manager
// Creates links to the redirect page which will safely handle external navigation

/**
 * Creates a URL for the redirect page with encoded external link details
 * @param url The external URL to redirect to
 * @param name The display name of the external site
 * @returns URL string for the redirect page
 */
export function createRedirectUrl(url: string, name: string): string {
  // Ensure the URL has a protocol
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }
  
  const encodedUrl = encodeURIComponent(url);
  const encodedName = encodeURIComponent(name);
  
  return `/redirect?url=${encodedUrl}&name=${encodedName}`;
}

// Common external links used across the site
export const externalLinks = {
  whitepaper: {
    url: 'https://priorprotocol.gitbook.io/whitepaper',
    name: 'Prior Protocol Whitepaper'
  },
  twitter: {
    url: 'https://x.com/priorprotocol',
    name: 'Prior Protocol on Twitter'
  },
  discord: {
    url: 'https://discord.com/invite/priorprotocol',
    name: 'Prior Protocol Discord Community'
  },
  medium: {
    url: 'https://medium.com/@priorprotocol_12054',
    name: 'Prior Protocol Medium Blog'
  },
  baseScan: {
    url: 'https://sepolia.basescan.org',
    name: 'Base Sepolia Explorer'
  }
};

/**
 * Get a redirect URL for a common external link
 * @param key The key of the external link in the externalLinks object
 * @returns URL string for the redirect page
 */
export function getExternalLink(key: keyof typeof externalLinks): string {
  const link = externalLinks[key];
  return createRedirectUrl(link.url, link.name);
}