// Static require() map — React Native bundler needs explicit paths
const cardImages: Record<string, number> = {
  focus:               require('../../assets/cards/focus.png'),
  focus_plus:          require('../../assets/cards/focus_plus.png'),
  block:               require('../../assets/cards/block.png'),
  block_plus:          require('../../assets/cards/block_plus.png'),
  deep_work:           require('../../assets/cards/deep_work.png'),
  deep_work_plus:      require('../../assets/cards/deep_work_plus.png'),
  brainstorm:          require('../../assets/cards/brainstorm.png'),
  brainstorm_plus:     require('../../assets/cards/brainstorm_plus.png'),
  flow_state:          require('../../assets/cards/flow_state.png'),
  flow_state_plus:     require('../../assets/cards/flow_state_plus.png'),
  hyperfocus:          require('../../assets/cards/hyperfocus.png'),
  hyperfocus_plus:     require('../../assets/cards/hyperfocus_plus.png'),
  time_block:          require('../../assets/cards/time_block.png'),
  time_block_plus:     require('../../assets/cards/time_block_plus.png'),
  pomodoro_technique:  require('../../assets/cards/pomodoro_technique.png'),
  pomodoro_technique_plus: require('../../assets/cards/pomodoro_technique_plus.png'),
  second_wind:         require('../../assets/cards/second_wind.png'),
  second_wind_plus:    require('../../assets/cards/second_wind_plus.png'),
  the_zone:            require('../../assets/cards/the_zone.png'),
  the_zone_plus:       require('../../assets/cards/the_zone_plus.png'),
  context_switch:      require('../../assets/cards/context_switch.png'),
  context_switch_plus: require('../../assets/cards/context_switch_plus.png'),
  deadline_rush:       require('../../assets/cards/deadline_rush.png'),
  deadline_rush_plus:  require('../../assets/cards/deadline_rush_plus.png'),
  deep_flow:           require('../../assets/cards/deep_flow.png'),
  deep_flow_plus:      require('../../assets/cards/deep_flow_plus.png'),
  distraction:         require('../../assets/cards/distraction.png'),
};

export function getCardImage(cardBaseId: string): number | null {
  return cardImages[cardBaseId] ?? null;
}
