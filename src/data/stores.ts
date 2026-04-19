import { Store } from '../types';

import { lenskartStores1 } from './lenskart-1';
import { lenskartStores2 } from './lenskart-2';
import { lenskartStores3 } from './lenskart-3';
import { lenskartStores4 } from './lenskart-4';
import { lenskartStores5 } from './lenskart-5';
import { lenskartStores6 } from './lenskart-6';
import { lenskartStores7 } from './lenskart-7';
import { lenskartStores8 } from './lenskart-8';
import { lenskartStores9 } from './lenskart-9';
import { lenskartStores10 } from './lenskart-10';
import { lenskartStores11 } from './lenskart-11';
import { drAgarwalStores1 } from './dr-agarwal-1';
import { drAgarwalStores2 } from './dr-agarwal-2';
import { drAgarwalStores3 } from './dr-agarwal-3';
import { drAgarwalStores4 } from './dr-agarwal-4';
import { lawrenceMayoStores1 } from './lawrence-mayo-1';

export const allStores: Store[] = [
  ...lenskartStores1,
  ...lenskartStores2,
  ...lenskartStores3,
  ...lenskartStores4,
  ...lenskartStores5,
  ...lenskartStores6,
  ...lenskartStores7,
  ...lenskartStores8,
  ...lenskartStores9,
  ...lenskartStores10,
  ...lenskartStores11,
  ...drAgarwalStores1,
  ...drAgarwalStores2,
  ...drAgarwalStores3,
  ...drAgarwalStores4,
  ...lawrenceMayoStores1,
];