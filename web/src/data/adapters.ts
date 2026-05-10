export interface Adapter {
  id: string
  name: string
  icon: string
  code: string
  features: string[]
}

export const adapters: Adapter[] = [
  {
    id: 'redis',
    name: 'Redis',
    icon: `<svg width="18" height="18" viewBox="0 -18 256 256" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid"><g><path d="M245.97 168.94C232.31 176.06 161.54 205.16 146.47 213.02 131.4 220.87 123.03 220.8 111.13 215.11 99.23 209.42 23.91 178.99 10.35 172.51 3.56 169.27 0 166.54 0 163.95L0 138.08S98.05 116.73 113.88 111.05C129.71 105.37 135.2 105.17 148.67 110.1 162.14 115.04 242.69 129.57 256 134.45L256 159.95C255.99 162.51 252.92 165.32 245.97 168.94" fill="#912626"/><path d="M245.96 143.22C232.3 150.34 161.53 179.44 146.47 187.29 131.4 195.15 123.03 195.07 111.13 189.38 99.23 183.7 23.92 153.27 10.35 146.79-3.22 140.3-3.5 135.84 9.83 130.62 23.15 125.4 98.05 96.02 113.88 90.34 129.71 84.66 135.2 84.45 148.67 89.39 162.14 94.32 232.49 122.33 245.8 127.2 259.11 132.08 259.63 136.1 245.96 143.22" fill="#C6302B"/><path d="M245.97 127.07C232.31 134.2 161.54 163.29 146.47 171.15 131.4 179 123.03 178.93 111.13 173.24 99.23 167.55 23.91 137.13 10.35 130.64 3.56 127.4 0 124.67 0 122.09L0 96.21S98.05 74.86 113.88 69.18C129.71 63.5 135.2 63.3 148.67 68.23 162.14 73.17 242.69 87.7 256 92.57L256 118.09C255.99 120.64 252.92 123.45 245.97 127.07" fill="#912626"/><path d="M245.96 101.35C232.3 108.47 161.53 137.57 146.47 145.43 131.4 153.28 123.03 153.2 111.13 147.51 99.23 141.83 23.92 111.4 10.35 104.92-3.22 98.44-3.5 93.97 9.83 88.75 23.15 83.54 98.05 54.15 113.88 48.47 129.71 42.79 135.2 42.59 148.67 47.52 162.14 52.46 232.49 80.45 245.8 85.33 259.11 90.21 259.63 94.23 245.96 101.35" fill="#C6302B"/><path d="M245.97 83.65C232.31 90.77 161.54 119.87 146.47 127.73 131.4 135.59 123.03 135.51 111.13 129.82 99.23 124.13 23.91 93.7 10.35 87.22 3.56 83.98 0 81.25 0 78.67L0 52.79S98.05 31.44 113.88 25.76C129.71 20.08 135.2 19.88 148.67 24.81 162.14 29.75 242.69 44.28 256 49.16L256 74.67C255.99 77.22 252.92 80.03 245.97 83.65" fill="#912626"/><path d="M245.96 57.93C232.3 65.05 161.53 94.15 146.47 102 131.4 109.86 123.03 109.78 111.13 104.09 99.23 98.41 23.92 67.98 10.35 61.5-3.22 55.02-3.5 50.55 9.83 45.33 23.15 40.11 98.05 10.73 113.88 5.05 129.71-0.63 135.2-0.83 148.67 4.1 162.14 9.03 232.49 37.04 245.8 41.91 259.11 46.79 259.63 50.81 245.96 57.93" fill="#C6302B"/><path d="M159.28 32.76L137.27 35.04 132.35 46.9 124.39 33.67 98.97 31.38 117.94 24.55 112.25 14.05 130 20.99 146.74 15.51 142.22 26.37 159.28 32.76" fill="#FFFFFF"/><path d="M131.03 90.27L89.95 73.24 148.82 64.2 131.03 90.27" fill="#FFFFFF"/><path d="M74.08 39.35C91.46 39.35 105.54 44.81 105.54 51.54 105.54 58.28 91.46 63.74 74.08 63.74 56.71 63.74 42.62 58.28 42.62 51.54 42.62 44.81 56.71 39.35 74.08 39.35" fill="#FFFFFF"/><path d="M185.29 36L220.13 49.76 185.32 63.52 185.29 36" fill="#621B1C"/><path d="M146.75 51.24L185.29 36 185.32 63.52 181.55 65 146.75 51.24" fill="#9A2928"/></g></svg>`,
    code: `<span class="token-import">import</span> { build } <span class="token-import">from</span> <span class="token-string">'triva'</span>;

<span class="token-keyword">const</span> <span class="token-function">app</span> = <span class="token-keyword">new</span> <span class="token-function">build</span>({
  cache: {
    type: <span class="token-string">'redis'</span>,
    database: {
      host: <span class="token-string">'localhost'</span>,
      port: <span class="token-number">6379</span>
    }
  }
});`,
    features: ['Sub-millisecond latency', 'Distributed caching', 'Production-grade reliability'],
  },
  {
    id: 'mongodb',
    name: 'MongoDB',
    icon: `<svg width="18" height="18" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><circle cx="512" cy="512" r="512" style="fill:#13aa52"/><path d="M648.86 449.44c-32.34-142.73-108.77-189.66-117-207.59-9-12.65-18.12-35.15-18.12-35.15-.15-.38-.39-1.05-.67-1.7-.93 12.65-1.41 17.53-13.37 30.29-18.52 14.48-113.54 94.21-121.27 256.37-7.21 151.24 109.25 241.36 125 252.85l1.79 1.27v-.11c.1.76 5 36 8.44 73.34H526a726.68 726.68 0 0 1 13-78.53l1-.65a204.48 204.48 0 0 0 20.11-16.45l.72-.65c33.48-30.93 93.67-102.47 93.08-216.53a347.07 347.07 0 0 0-5.05-56.76zM512.35 659.12s0-212.12 7-212.08c5.46 0 12.53 273.61 12.53 273.61-9.72-1.17-19.53-45.03-19.53-61.53z" style="fill:#fff"/></svg>`,
    code: `<span class="token-import">import</span> { build } <span class="token-import">from</span> <span class="token-string">'triva'</span>;

<span class="token-keyword">const</span> <span class="token-function">app</span> = <span class="token-keyword">new</span> <span class="token-function">build</span>({
  cache: {
    type: <span class="token-string">'mongodb'</span>,
    database: {
      uri: <span class="token-string">'mongodb://localhost:27017'</span>
    }
  }
});`,
    features: ['Flexible document storage', 'Rich query capabilities', 'Horizontal scaling'],
  },
  {
    id: 'postgresql',
    name: 'PostgreSQL',
    icon: `<svg width="18" height="18" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><style>.pg{fill:none;stroke:#fff;stroke-width:12;stroke-linecap:round;stroke-linejoin:round}</style><path d="M378.5 372.5c3.2-26.9 2.3-30.8 22.3-26.5l5.1.4c15.4.7 35.5-2.5 47.4-8 25.5-11.8 40.6-31.5 15.5-26.4-57.3 11.8-61.2-7.6-61.2-7.6 60.5-89.7 85.8-203.6 63.9-231.5C411.9-3 308.8 33 307.1 33.9l-.5.1c-11.3-2.3-24-3.8-38.2-4-25.9-.4-45.6 6.8-60.5 18.1 0 0-183.8-75.7-175.2 95.2 1.8 36.4 52.1 275.2 112.1 203 21.9-26.4 43.1-48.7 43.1-48.7 10.5 7 23.1 10.6 36.3 9.3l1-.9c-.3 3.3-.2 6.5.4 10.3-15.5 17.3-10.9 20.3-41.8 26.7-31.3 6.4-12.9 17.9-.9 20.9 14.5 3.6 48.2 8.8 70.9-23l-.9 3.6c6.1 4.9 5.7 34.9 6.5 56.3.9 21.4 2.3 41.5 6.7 53.3s9.5 42.2 50.1 33.5c34-7.3 59.9-17.7 62.3-115.1" style="stroke:#000;stroke-width:37"/><path d="M468.7 312.1c-57.3 11.8-61.2-7.6-61.2-7.6C468 214.8 493.3 100.9 471.4 73 411.9-3 308.8 33 307.1 33.9l-.6.1c-11.3-2.3-24-3.7-38.2-4-25.9-.4-45.6 6.8-60.5 18.1 0 0-183.8-75.7-175.2 95.2 1.8 36.4 52.1 275.2 112.1 203 21.9-26.4 43.1-48.7 43.1-48.7 10.5 7 23.1 10.6 36.3 9.3l1-.9c-.3 3.3-.2 6.5.4 10.3-15.5 17.3-10.9 20.3-41.8 26.7-31.3 6.4-12.9 17.9-.9 20.9 14.5 3.6 48.2 8.8 70.9-23l-.9 3.6c6.1 4.9 10.3 31.6 9.6 55.8s-1.2 40.8 3.6 53.8 9.5 42.2 50.1 33.5c33.9-7.3 51.5-26.1 54-57.6 1.7-22.4 5.7-19 5.9-39l3.2-9.5c3.6-30.3.6-40.1 21.5-35.5l5.1.4c15.4.7 35.5-2.5 47.4-8 25.5-11.7 40.5-31.4 15.5-26.3" style="fill:#336791"/><path d="M206.9 164.7c-.3 2.3 4.3 8.5 10.2 9.3 6 .8 11.1-4 11.4-6.3s-4.2-4.9-10.2-5.7c-6-.9-11.1.3-11.4 2.7z" style="fill:#fff;stroke:#fff;stroke-width:4"/><path d="M388.4 159.9c.3 2.3-4.2 8.5-10.2 9.3s-11.1-4-11.4-6.3 4.3-4.9 10.2-5.7 11.1.4 11.4 2.7z" style="fill:#fff;stroke:#fff;stroke-width:2"/></svg>`,
    code: `<span class="token-import">import</span> { build } <span class="token-import">from</span> <span class="token-string">'triva'</span>;

<span class="token-keyword">const</span> <span class="token-function">app</span> = <span class="token-keyword">new</span> <span class="token-function">build</span>({
  cache: {
    type: <span class="token-string">'postgresql'</span>,
    database: {
      host: <span class="token-string">'localhost'</span>,
      database: <span class="token-string">'triva'</span>
    }
  }
});`,
    features: ['ACID compliance', 'Advanced querying', 'Enterprise reliability'],
  },
  {
    id: 'mysql',
    name: 'MySQL',
    icon: `<svg width="18" height="18" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><path d="M471.6 393.4c-27.9-.7-49.4 2.1-67.6 9.8-5.2 2.1-13.5 2.1-14.3 8.7 2.8 2.8 3.2 7.3 5.6 11.2 4.2 7 11.5 16.3 18.1 21.2 7.3 5.6 14.6 11.1 22.3 16 13.5 8.4 28.9 13.3 42.1 21.6 7.7 4.9 15.3 11.1 23 16.4 3.8 2.8 6.2 7.3 11.1 9.1v-1.1c-2.5-3.1-3.2-7.7-5.6-11.1L496 485c-10.1-13.6-22.7-25.4-36.2-35.2-11.1-7.7-35.5-18.1-40.1-31l-.7-.7c7.7-.7 16.8-3.5 24-5.6 11.8-3.1 22.7-2.4 34.8-5.5 5.6-1.4 11.1-3.2 16.8-4.9V399c-6.3-6.3-10.8-14.6-17.4-20.5-17.7-15.3-37.3-30.3-57.5-42.8-10.8-7-24.7-11.5-36.2-17.4-4.1-2.1-11.1-3.1-13.6-6.6-6.2-7.7-9.8-17.7-14.3-26.8-10.1-19.1-19.8-40.4-28.5-60.6-6.3-13.6-10.1-27.1-17.8-39.7-35.9-59.2-74.9-95-134.8-130.2-12.8-7.5-28.1-10.6-44.5-14.4l-26.1-1.4c-5.6-2.4-11.2-9.1-16-12.2C68 13.9 16.8-13.3 2.2 22.6c-9.4 22.6 13.9 44.9 21.9 56.4 5.9 8 13.6 17.1 17.7 26.1 2.5 5.9 3.1 12.2 5.6 18.5 5.6 15.3 10.8 32.4 18.1 46.7 3.8 7.3 8 15 12.9 21.6 2.8 3.9 7.7 5.6 8.7 11.9-4.9 6.9-5.2 17.4-8 26.1-12.5 39.3-7.6 88.1 10.1 117 5.6 8.7 18.8 27.9 36.5 20.5 15.7-6.3 12.2-26.1 16.7-43.5 1-4.2.4-7 2.4-9.7v.7c4.9 9.7 9.8 19.1 14.3 28.9 10.8 17 29.6 34.8 45.3 46.6 8.3 6.3 15 17.1 25.4 20.9v-1h-.7c-2.1-3.1-5.2-4.5-8-6.9-6.3-6.3-13.2-13.9-18.1-20.9-14.6-19.5-27.5-41.1-39-63.4-5.6-10.8-10.4-22.6-15-33.4-2.1-4.2-2.1-10.4-5.6-12.5-5.2 7.7-12.9 14.3-16.7 23.7-6.6 15-7.3 33.4-9.8 52.6l-1.4.7c-11.1-2.8-15-14.3-19.2-24-10.4-24.7-12.2-64.4-3.1-93 2.4-7.3 12.9-30.3 8.7-37.2-2.1-6.7-9.1-10.5-12.9-15.7-4.5-6.6-9.4-15-12.5-22.3-8.4-19.5-12.6-41.1-21.6-60.6C51 88 43.7 78.6 37.8 70.3c-6.6-9.4-13.9-16-19.2-27.2-1.7-3.8-4.2-10.1-1.4-14.3.7-2.8 2.1-3.8 4.9-4.5 4.5-3.8 17.4 1 21.9 3.1 12.9 5.2 23.7 10.1 34.5 17.4 4.9 3.5 10.1 10.1 16.4 11.9h7.3c11.1 2.4 23.7.7 34.1 3.8 18.4 5.9 35.2 14.6 50.1 24 45.6 28.9 83.2 70 108.6 119.1 4.2 8 5.9 15.3 9.7 23.7 7.3 17.1 16.4 34.5 23.7 51.2 7.3 16.4 14.3 33.1 24.7 46.7 5.2 7.3 26.1 11.1 35.5 15 6.9 3.1 17.8 5.9 24 9.7 11.8 7.3 23.6 15.7 34.8 23.7 5.7 4.1 23.1 12.9 24.2 19.8M116.4 90.8c-4.8 0-9.6.5-14.3 1.8v.7h.7c2.8 5.6 7.7 9.4 11.2 14.3 2.8 5.6 5.2 11.1 8 16.7l.7-.7c4.9-3.5 7.4-9.1 7.4-17.4-2.1-2.5-2.4-4.9-4.2-7.3-2.2-3.6-6.7-5.3-9.5-8.1" style="fill:#5d87a1"/></svg>`,
    code: `<span class="token-import">import</span> { build } <span class="token-import">from</span> <span class="token-string">'triva'</span>;

<span class="token-keyword">const</span> <span class="token-function">app</span> = <span class="token-keyword">new</span> <span class="token-function">build</span>({
  cache: {
    type: <span class="token-string">'mysql'</span>,
    database: {
      host: <span class="token-string">'localhost'</span>,
      database: <span class="token-string">'triva'</span>
    }
  }
});`,
    features: ['Wide adoption', 'Proven reliability', 'Great performance'],
  },
  {
    id: 'sqlite',
    name: 'SQLite',
    icon: `<svg width="18" height="18" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="sq-a" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0" stop-color="#97d9f6"/><stop offset="1" stop-color="#0f80cc"/></linearGradient></defs><path d="M23.192 3.242H5.623A2.147 2.147 0 0 0 3.482 5.383V24.759A2.147 2.147 0 0 0 5.623 26.9H17.195C17.063 21.142 19.03 9.968 23.192 3.242z" style="fill:#0f80cc"/><path d="M22.554 3.867H5.623A1.518 1.518 0 0 0 4.107 5.383V23.345a42.01 42.01 0 0 1 13.569-2.684A123.555 123.555 0 0 1 22.554 3.867z" style="fill:url(#sq-a)"/><path d="M27.29 2.608c-1.2-1.073-2.66-.642-4.1.634-.213.19-.426.4-.638.625A25.4 25.4 0 0 0 17.1 15a10.178 10.178 0 0 1 .634 1.822c.036.14.069.272.1.384.062.265.1.437.1.437s-.022-.083-.113-.346l-.059-.17c-.01-.027-.023-.059-.038-.094-.16-.373-.6-1.16-.8-1.5-.167.493-.315.954-.438 1.371a12.131 12.131 0 0 1 .908 2.8s-.03-.115-.171-.515a19.037 19.037 0 0 0-.9-1.708 4.037 4.037 0 0 0-.264 1.724 6.009 6.009 0 0 1 .493 1.383c.334 1.283.566 2.846.566 2.846s.008.1.02.263a26.145 26.145 0 0 0 .065 3.205 11.362 11.362 0 0 0 .584 3.1l.18-.1a13.859 13.859 0 0 1-.478-4.628 35.269 35.269 0 0 1 1.938-9.688c2.01-5.308 4.8-9.568 7.35-11.6-2.326 2.1-5.474 8.9-6.417 11.418a45.656 45.656 0 0 0-2.254 8A6.211 6.211 0 0 1 21.39 20s1.233-1.521 2.674-3.693a26.206 26.206 0 0 0-2.755.733c-.7.294-.889.394-.889.394a23.939 23.939 0 0 1 4.215-2.007c2.676-4.215 5.592-10.2 2.656-12.824" style="fill:#003b57"/></svg>`,
    code: `<span class="token-import">import</span> { build } <span class="token-import">from</span> <span class="token-string">'triva'</span>;

<span class="token-keyword">const</span> <span class="token-function">app</span> = <span class="token-keyword">new</span> <span class="token-function">build</span>({
  cache: {
    type: <span class="token-string">'sqlite'</span>,
    database: {
      filename: <span class="token-string">'./cache.db'</span>
    }
  }
});`,
    features: ['Zero configuration', 'File-based storage', 'Perfect for development'],
  },
  {
    id: 'better-sqlite3',
    name: 'Better SQLite3',
    icon: `<svg width="18" height="18" viewBox="8 10.52 240 237.48" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="bs-a" x1="10.116" x2="38.013" y1="15.798" y2="15.798" gradientUnits="userSpaceOnUse"><stop offset="0" style="stop-color:#ababab"/><stop offset=".194" style="stop-color:#f6f6f6"/><stop offset=".397" style="stop-color:#b0b0b0"/><stop offset="1" style="stop-color:#585858"/></linearGradient></defs><g transform="matrix(8.59688 0 0 6.30047 -78.796 85.965)"><path d="M23.941 8.037c-7.625 0-13.825 2.13-13.825 5.475v6.558c0 3.345 6.2 5.648 13.825 5.648s14.072-2.303 14.072-5.648v-6.558c0-3.345-6.447-5.475-14.072-5.475" style="fill:url(#bs-a)"/><ellipse cx="24.395" cy="13.995" rx="13.333" ry="5.25" style="fill:#c3c3c3"/></g></svg>`,
    code: `<span class="token-import">import</span> { build } <span class="token-import">from</span> <span class="token-string">'triva'</span>;

<span class="token-keyword">const</span> <span class="token-function">app</span> = <span class="token-keyword">new</span> <span class="token-function">build</span>({
  cache: {
    type: <span class="token-string">'better-sqlite3'</span>,
    database: {
      filename: <span class="token-string">'./cache.db'</span>
    }
  }
});`,
    features: ['Synchronous API', 'Faster than node-sqlite3', 'Simple and efficient'],
  },
  {
    id: 'supabase',
    name: 'Supabase',
    icon: `<svg width="18" height="18" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="sb-a" x1="237.109" x2="419.106" y1="289.781" y2="366.11" gradientUnits="userSpaceOnUse"><stop offset="0" style="stop-color:#249361"/><stop offset="1" style="stop-color:#3ecf8e"/></linearGradient></defs><path d="M297.6 501c-12.9 16.3-39.2 7.4-39.5-13.4L253.6 183h204.8c37.1 0 57.8 42.8 34.7 71.9z" style="fill:url(#sb-a)"/><path d="M297.6 501c-12.9 16.3-39.2 7.4-39.5-13.4L253.6 183h204.8c37.1 0 57.8 42.8 34.7 71.9z" style="fill:url(#sb-a);opacity:.2"/><path d="M214.4 11c12.9-16.3 39.2-7.4 39.5 13.4l2 304.5H53.7c-37.1 0-57.8-42.8-34.7-71.9z" style="fill:#3ecf8e"/></svg>`,
    code: `<span class="token-import">import</span> { build } <span class="token-import">from</span> <span class="token-string">'triva'</span>;

<span class="token-keyword">const</span> <span class="token-function">app</span> = <span class="token-keyword">new</span> <span class="token-function">build</span>({
  cache: {
    type: <span class="token-string">'supabase'</span>,
    database: {
      url: process.env.<span class="token-string">SUPABASE_URL</span>
    }
  }
});`,
    features: ['Serverless PostgreSQL', 'Real-time subscriptions', 'Auto-generated APIs'],
  },
  {
    id: 'embedded',
    name: 'Embedded',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="3" width="18" height="18" rx="2" stroke="#7addd3" stroke-width="1.5"/><path d="M8 12h8M12 8v8" stroke="#7addd3" stroke-width="1.5" stroke-linecap="round"/></svg>`,
    code: `<span class="token-import">import</span> { build } <span class="token-import">from</span> <span class="token-string">'triva'</span>;

<span class="token-keyword">const</span> <span class="token-function">app</span> = <span class="token-keyword">new</span> <span class="token-function">build</span>({
  cache: {
    type: <span class="token-string">'embedded'</span>,
    database: {
      path: <span class="token-string">'./data'</span>
    }
  }
});`,
    features: ['Encrypted file storage', 'No external dependencies', 'Privacy-focused'],
  },
  {
    id: 'memory',
    name: 'Memory',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 6V4M10 20V18M14 6V4M14 20V18M18.2222 10H20M4 10H5.77778M18.2222 14H20M4 14H5.77778M10 10H14V14H10V10ZM7.99998 18H16C17.1046 18 18 17.1046 18 16V8C18 6.89543 17.1046 6 16 6H7.99998C6.89542 6 5.99998 6.89543 5.99998 8V16C5.99998 17.1046 6.89542 18 7.99998 18Z" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    code: `<span class="token-import">import</span> { build } <span class="token-import">from</span> <span class="token-string">'triva'</span>;

<span class="token-keyword">const</span> <span class="token-function">app</span> = <span class="token-keyword">new</span> <span class="token-function">build</span>({
  cache: {
    type: <span class="token-string">'memory'</span>
  }
});`,
    features: ['Instant access', 'Zero setup required', 'Perfect for testing'],
  },
]
