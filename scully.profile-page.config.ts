import {ScullyConfig} from '@scullyio/scully';

const defaultPostRenderers:string[] = [];
export const config: ScullyConfig = {
  projectRoot: './src',
  projectName: 'profile-page',
  outDir: './dist/profile-page',
  defaultPostRenderers,
  routes: {
    '/blog/:slug': {
      type: 'contentFolder',
      slug: {
        folder: "./blog"
      }
    },
  },
  puppeteerLaunchOptions: {args: ['--no-sandbox', '--disable-setuid--sandbox']}
};