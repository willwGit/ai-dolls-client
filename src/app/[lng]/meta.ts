import type { Metadata } from 'next';
export interface Meta extends Metadata {
  title?: string;
  locale?: string;
  isPlaceholder?: boolean;
  hidden?: true;
  rightOperateType?: 'setting' | 'complete' | 'none';
}
const meta: Indexes<Meta> = {
  '/': {
    hidden: true,
  },
  '/login': {
    hidden: true,
  },
  '/search': {
    hidden: true,
  },
  '/user-create': {
    hidden: true,
    isPlaceholder: false,
  },
  '/create-options': {
    // hidden: true,
  },
  '/create-result': {
    hidden: true,
  },
  '/chats': {
    hidden: true,
  },
  '/mine': {
    hidden: true,
  },
  '/chat': {
    hidden: true,
  },
  '/home-page': {
    hidden: true,
    isPlaceholder: false,
  },
  '/albums': {
    hidden: true,
    isPlaceholder: false,
  },
  '/photo': {
    hidden: true,
    isPlaceholder: false,
  },
  '/my-characters': {
    locale: 'myCharacters.yourCharacters',
  },
  '/share': {
    hidden: true,
    isPlaceholder: false,
  },
  '/share-rules': {
    hidden: true,
    isPlaceholder: false,
  },
};

export default meta;
