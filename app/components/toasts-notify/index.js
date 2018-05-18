import React from 'react';
import faker from 'faker';
import UI from './ui';

export default () => (
  <UI
    toastIds={Array.from(toasts, (_, i) => i)}
    resolveToast={id => toasts[id]}
  />
);
const toasts = Array.from({ length: 0 }, () => ({
  message: faker.lorem.sentence(),
}));
