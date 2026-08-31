import type { Cta_boxStoryblok, LinkStoryblok } from '@/types/storyblok'

function popupLink(
  uid: string,
  label: string,
  popup: 'job' | 'contattaci',
): LinkStoryblok {
  return {
    _uid: uid,
    component: 'link',
    label,
    action: { type: 'popup', popup },
  }
}

export const JOB_PAGE_CTA_BOX: Cta_boxStoryblok = {
  _uid: 'job-page-cta-box',
  component: 'cta_box',
  cards: [
    {
      _uid: 'job-page-cta-contact',
      component: 'card_cta_box',
      title: 'Non hai trovato quello che cercavi?',
      color: 'black',
      link: [popupLink('job-page-cta-contact-link', 'Contattaci', 'contattaci')],
    },
    {
      _uid: 'job-page-cta-apply',
      component: 'card_cta_box',
      title: 'Entra a far parte del team',
      color: 'blue',
      link: [popupLink('job-page-cta-apply-link', 'Candidati', 'job')],
    },
  ],
}
