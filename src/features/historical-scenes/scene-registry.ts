import { MansioAndMutatioScene } from '@/features/historical-scenes/scenes/MansioAndMutatioScene';
import type { Scene3dType, SceneDescriptor } from '@/types';

const sceneRegistry = new Map<Scene3dType, SceneDescriptor>([
  [
    'urban-metropolis',
    {
      sceneType: 'urban-metropolis',
      titleBg: 'Градски изход, мост и магистрален профил (117 г.)',
      subtitleBg: 'Без късноримската долноградска стена от 172 г. сл. Хр.',
      defaultCameraPosition: [14, 10, 16],
      Component: MansioAndMutatioScene,
    },
  ],
  [
    'road-mutatio',
    {
      sceneType: 'road-mutatio',
      titleBg: 'Сменна станция (Mutatio) и речен/равнинен участък',
      subtitleBg: 'Пункт за подмяна на коне от системата cursus publicus',
      defaultCameraPosition: [12, 9, 14],
      Component: MansioAndMutatioScene,
    },
  ],
  [
    'mansio-praetorium',
    {
      sceneType: 'mansio-praetorium',
      titleBg: 'Имперски преториум и нощувъчна станция (Mansio)',
      subtitleBg: 'По модела на нероновите tabernae et praetoria от 61 г. сл. Хр.',
      defaultCameraPosition: [13, 9.5, 15],
      Component: MansioAndMutatioScene,
    },
  ],
  [
    'river-bridge',
    {
      sceneType: 'river-bridge',
      titleBg: 'Римски мостов преход и крайречна станция',
      subtitleBg: 'Каменни устои (opus quadratum) и обслужваща mansio',
      defaultCameraPosition: [14, 10, 15],
      Component: MansioAndMutatioScene,
    },
  ],
  [
    'sakar-pass-roadbed',
    {
      sceneType: 'sakar-pass-roadbed',
      titleBg: 'Превален участък с 6-метрова каменна настилка и стражеви пост',
      subtitleBg: 'По запазеното платно при с. Изворово (Кастра Рубра, 117 г.)',
      defaultCameraPosition: [13, 10, 15],
      Component: MansioAndMutatioScene,
    },
  ],
]);

/**
 * Позволява добавяне на нови специализирани 3D исторически сцени
 * без промяна в основния географски или рендериращ двигател.
 */
export function registerHistoricalScene(descriptor: SceneDescriptor): void {
  sceneRegistry.set(descriptor.sceneType, descriptor);
}

export function getHistoricalSceneDescriptor(sceneType: Scene3dType): SceneDescriptor {
  const found = sceneRegistry.get(sceneType);
  if (!found) {
    return sceneRegistry.get('road-mutatio')!;
  }
  return found;
}
