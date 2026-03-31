const relicImages: Record<string, number> = {
  coffee_mug:                   require('../../assets/relics/coffee_mug.png'),
  standing_desk:                require('../../assets/relics/standing_desk.png'),
  noise_canceling_headphones:   require('../../assets/relics/noise_canceling_headphones.png'),
  pomodoro_clock:               require('../../assets/relics/pomodoro_clock.png'),
  focus_playlist:               require('../../assets/relics/focus_playlist.png'),
  lucky_tomato:                 require('../../assets/relics/lucky_tomato.png'),
  productivity_journal:         require('../../assets/relics/productivity_journal.png'),
};

export function getRelicImage(relicId: string): number | null {
  return relicImages[relicId] ?? null;
}
