import { WEIGHTS, SKILL_MAP } from './positions';

// Mapa inverso: db_key → peso na posição
const DB_KEY_TO_PT_NAME = Object.fromEntries(
  Object.entries(SKILL_MAP).map(([ptName, dbKey]) => [dbKey, ptName])
);

const SKILLS = [
  { key: 'skill_speed',             label: 'Speed',           potKey: 'potential_speed'             },
  { key: 'skill_stamina',           label: 'Stamina',         potKey: 'potential_stamina'           },
  { key: 'skill_play_intelligence', label: 'Play Intelligence',potKey: 'potential_play_intelligence' },
  { key: 'skill_passing',           label: 'Passing',         potKey: 'potential_passing'           },
  { key: 'skill_shooting',          label: 'Shooting',        potKey: 'potential_shooting'          },
  { key: 'skill_heading',           label: 'Heading',         potKey: 'potential_heading'           },
  { key: 'skill_keeping',           label: 'Keeping',         potKey: 'potential_keeping'           },
  { key: 'skill_ball_control',      label: 'Ball Control',    potKey: 'potential_ball_control'      },
  { key: 'skill_tackling',          label: 'Tackling',        potKey: 'potential_tackling'          },
  { key: 'skill_aerial_passing',    label: 'Aerial Passing',  potKey: 'potential_aerial_passing'    },
  { key: 'skill_set_plays',         label: 'Set Plays',       potKey: 'potential_set_plays'         },
  { key: 'skill_experience',        label: 'Experience',      potKey: null                          },
  { key: 'skill_form',              label: 'Form',            potKey: null                          },
];

export function getSuggestions(player, primaryPos) {
  const maxedSet = new Set(JSON.parse(player.maxed_skills || '[]'));
  const posWeights = WEIGHTS[primaryPos] || {};

  return SKILLS
    .filter(s => !maxedSet.has(s.key))
    .map(s => {
      const val = player[s.key] ?? 0;
      const ptName = DB_KEY_TO_PT_NAME[s.key];
      const weight = posWeights[ptName] ?? 0;
      const potential = s.potKey ? (player[s.potKey] || null) : null;
      const isHigh = potential?.startsWith('H');
      const isLow  = potential?.startsWith('L');

      let score = weight * (10 - val);
      if (isHigh) score *= 2;
      if (isLow)  score *= 0.05;

      return { ...s, val, weight, potential, isHigh, isLow, score };
    })
    .filter(s => s.weight > 0 && s.score > 0)
    .sort((a, b) => b.score - a.score);
}

export function estDays(trainingSpeed, reference) {
  if (!trainingSpeed || !reference[trainingSpeed]) return null;
  return reference[trainingSpeed].avg;
}

export { SKILLS };
