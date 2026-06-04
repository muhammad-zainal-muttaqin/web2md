import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'web2md',
  description: 'Convert any web page to clean Markdown.',
  base: '/web2md/',
  lastUpdated: true,

  editLink: {
    pattern: 'https://github.com/muhammad-zainal-muttaqin/web2md/edit/main/docs/:path',
    text: 'Edit this page on GitHub',
  },

  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Install', link: '/install' },
      { text: 'Usage', link: '/usage' },
      { text: 'Changelog', link: '/changelog' },
      { text: 'GitHub', link: 'https://github.com/muhammad-zainal-muttaqin/web2md' },
    ],

    sidebar: [
      {
        text: 'Getting Started',
        items: [
          { text: 'Introduction', link: '/' },
          { text: 'Install', link: '/install' },
          { text: 'Usage', link: '/usage' },
        ],
      },
      {
        text: 'Reference',
        items: [
          { text: 'Changelog', link: '/changelog' },
          { text: 'License', link: '/license' },
        ],
      },
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/muhammad-zainal-muttaqin/web2md' },
    ],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2026 Zainal',
    },

    search: {
      provider: 'local',
    },
  },
})
