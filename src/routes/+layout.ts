import type { LayoutLoad } from './$types';

export const prerender = true;
export const csr = true;

export const load: LayoutLoad = async () => {
  return {
    title: 'LocalSocialMax',
    description:
      'A modern SaaS application with authentication and module management',
  };
};
