// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import netlify from '@astrojs/netlify';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://thesaunaguys.com',
  adapter: netlify(),

  integrations: [
    react(),
    mdx(),
    sitemap({
      filter: (page) => !page.includes('/admin/') && !page.includes('/dashboard/'),
    }),
  ],

  vite: {
    plugins: [tailwindcss()],
  },

  // Prerender public pages by default (SSG)
  // Admin/dashboard routes opt out with `export const prerender = false`
  prefetch: {
    prefetchAll: true,
  },
});
