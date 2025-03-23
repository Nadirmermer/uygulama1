import { beckDepressionTest } from './beck-depression';
import { beckAnxietyTest } from './beck-anxiety';
import { beckHopelessnessTest } from './beck-hopelessness';
import { beckSuicideTest } from './beck-suicide';
import { edinburghTest } from './edinburgh';
import { scid5CvTest } from './scid-5-cv';
import { scid5PdTest } from './scid-5-pd';
import { scid5SpqTest } from './scid-5-spq';
import { scl90rTest } from './scl90r';
import { ytt40Test } from './ytt40';
import { algılananStresTest } from './algılananStres';
import { arizonaCinselYasantilarTest } from './arizonaCinselYasantilar';
import { bilisselDuyguDuzenlemeTest } from './bilisselDuyguDuzenleme';
import { connersEbeveynTest } from './connersEbeveyn';
import { yayginAnksiyeteTest } from './yayginAnksiyete';
import { torontoAleksitimiTest } from './torontoAleksitimi';

// Test objeleri için bir map
export const TEST_MAP = {
  'beck-depression': beckDepressionTest,
  'beck-anxiety': beckAnxietyTest,
  'beck-hopelessness': beckHopelessnessTest,
  'beck-suicide': beckSuicideTest,
  'edinburgh': edinburghTest,
  'scid-5-cv': scid5CvTest,
  'scid-5-pd': scid5PdTest,
  'scid-5-spq': scid5SpqTest,
  'scl90r': scl90rTest,
  'ytt40': ytt40Test,
  'aso': algılananStresTest,
  'acyo': arizonaCinselYasantilarTest,
  'bdo': bilisselDuyguDuzenlemeTest,
  'conners-parent': connersEbeveynTest,
  'yaygin-anksiyete': yayginAnksiyeteTest,
  'toronto-aleksitimi': torontoAleksitimiTest
};

// Test listesi (arayüzde gösterilecek)
export const AVAILABLE_TESTS = [
  beckDepressionTest,
  beckAnxietyTest,
  beckHopelessnessTest,
  beckSuicideTest,
  edinburghTest,
  scid5CvTest,
  scid5PdTest,
  scid5SpqTest,
  scl90rTest,
  ytt40Test,
  algılananStresTest,
  arizonaCinselYasantilarTest,
  bilisselDuyguDuzenlemeTest,
  connersEbeveynTest,
  yayginAnksiyeteTest,
  torontoAleksitimiTest
];

// İçe aktarmaları yeniden dışa aktar
export { beckDepressionTest } from './beck-depression';
export { beckAnxietyTest } from './beck-anxiety';
export { beckHopelessnessTest } from './beck-hopelessness';
export { beckSuicideTest } from './beck-suicide';
export { edinburghTest } from './edinburgh';
export { scid5CvTest } from './scid-5-cv';
export { scid5PdTest } from './scid-5-pd';
export { scid5SpqTest } from './scid-5-spq';
export { scl90rTest } from './scl90r';
export { ytt40Test } from './ytt40';
export { algılananStresTest } from './algılananStres';
export { arizonaCinselYasantilarTest } from './arizonaCinselYasantilar';
export { bilisselDuyguDuzenlemeTest } from './bilisselDuyguDuzenleme';
export { connersEbeveynTest } from './connersEbeveyn';
export { yayginAnksiyeteTest } from './yayginAnksiyete';
export { torontoAleksitimiTest } from './torontoAleksitimi';
