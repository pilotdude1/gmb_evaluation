import type { PageLoad } from './$types';

export const prerender = true;
export const csr = true;

export const load: PageLoad = async () => {
  return {
    title: 'Home - LocalSocialMax',
    description: 'Welcome to LocalSocialMax - Your modern SaaS platform',
  };
};
