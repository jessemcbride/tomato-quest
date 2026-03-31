const enemyImages: Record<string, number> = {
  procrastination_blob:   require('../../assets/enemies/procrastination_blob.png'),
  social_media_hydra:     require('../../assets/enemies/social_media_hydra.png'),
  meeting_minotaur:       require('../../assets/enemies/meeting_minotaur.png'),
  deadline_demon:         require('../../assets/enemies/deadline_demon.png'),
  procrastination_demon:  require('../../assets/enemies/procrastination_demon.png'),
  burnout_boss:           require('../../assets/enemies/burnout_boss.png'),
};

export function getEnemyImage(enemyId: string): number | null {
  return enemyImages[enemyId] ?? null;
}
