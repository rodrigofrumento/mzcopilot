export const SKILL_MAP = {
  'Velocidade':       'skill_speed',
  'Resistência':      'skill_stamina',
  'Inteligência':     'skill_play_intelligence',
  'Passe Curto':      'skill_passing',
  'Chute':            'skill_shooting',
  'Cabeceio':         'skill_heading',
  'Defesa a Gol':     'skill_keeping',
  'Controle de Bola': 'skill_ball_control',
  'Desarme':          'skill_tackling',
  'Passe Longo':      'skill_aerial_passing',
  'Bola Parada':      'skill_set_plays',
  'Experiência':      'skill_experience',
  'Forma':            'skill_form',
};

export const WEIGHTS = {
  'Goleiro':       { 'Velocidade':2,'Resistência':8,'Inteligência':8,'Passe Curto':0,'Chute':0,'Cabeceio':0,'Defesa a Gol':8,'Controle de Bola':2,'Desarme':0,'Passe Longo':2,'Bola Parada':0,'Experiência':8,'Forma':8 },
  'Zagueiro':      { 'Velocidade':7,'Resistência':3,'Inteligência':8,'Passe Curto':6,'Chute':0,'Cabeceio':0,'Defesa a Gol':0,'Controle de Bola':3,'Desarme':8,'Passe Longo':3,'Bola Parada':0,'Experiência':8,'Forma':3 },
  'Lateral':       { 'Velocidade':9,'Resistência':8,'Inteligência':3,'Passe Curto':7,'Chute':0,'Cabeceio':0,'Defesa a Gol':0,'Controle de Bola':7,'Desarme':9,'Passe Longo':4,'Bola Parada':0,'Experiência':10,'Forma':8 },
  'Volante':       { 'Velocidade':7,'Resistência':8,'Inteligência':8,'Passe Curto':8,'Chute':0,'Cabeceio':0,'Defesa a Gol':0,'Controle de Bola':2,'Desarme':8,'Passe Longo':7,'Bola Parada':0,'Experiência':8,'Forma':8 },
  'Meia Central':  { 'Velocidade':7,'Resistência':8,'Inteligência':8,'Passe Curto':8,'Chute':1,'Cabeceio':0,'Defesa a Gol':0,'Controle de Bola':5,'Desarme':1,'Passe Longo':8,'Bola Parada':0,'Experiência':8,'Forma':8 },
  'Meia Atacante': { 'Velocidade':6,'Resistência':8,'Inteligência':8,'Passe Curto':8,'Chute':8,'Cabeceio':0,'Defesa a Gol':0,'Controle de Bola':7,'Desarme':7,'Passe Longo':7,'Bola Parada':0,'Experiência':8,'Forma':8 },
  'Ponta':         { 'Velocidade':9,'Resistência':8,'Inteligência':5,'Passe Curto':3,'Chute':0,'Cabeceio':0,'Defesa a Gol':0,'Controle de Bola':8,'Desarme':0,'Passe Longo':8,'Bola Parada':0,'Experiência':8,'Forma':8 },
  'Atacante':      { 'Velocidade':8,'Resistência':8,'Inteligência':8,'Passe Curto':3,'Chute':8,'Cabeceio':2,'Defesa a Gol':0,'Controle de Bola':6,'Desarme':1,'Passe Longo':0,'Bola Parada':0,'Experiência':8,'Forma':8 },
  'Cabeçudo':      { 'Velocidade':4,'Resistência':8,'Inteligência':8,'Passe Curto':2,'Chute':8,'Cabeceio':8,'Defesa a Gol':0,'Controle de Bola':5,'Desarme':0,'Passe Longo':0,'Bola Parada':0,'Experiência':8,'Forma':8 },
};

// Peso do espaço de crescimento de skills não-maxadas no score
const TRAINABILITY = 0.3;

// Calcula score de um jogador para cada posição
// Skills não-maxadas recebem bônus pelo espaço ainda treinável:
//   effective_value = value + (10 - value) * TRAINABILITY
// Skills maxadas contribuem apenas com o valor atual.
function calcScores(player, maxedSet) {
  return Object.entries(WEIGHTS).map(([pos, weights]) => {
    let raw = 0;
    let weightSum = 0;
    for (const [skillName, weight] of Object.entries(weights)) {
      const dbKey = SKILL_MAP[skillName];
      const value = player[dbKey] ?? 0;
      const growthBonus = maxedSet.has(dbKey) ? 0 : (10 - value) * TRAINABILITY;
      raw += weight * (value + growthBonus);
      weightSum += weight;
    }
    // Normaliza pelo total de pesos → score 0–10 comparável entre posições
    const score = weightSum > 0 ? raw / weightSum : 0;
    return { pos, score };
  }).sort((a, b) => b.score - a.score);
}

// Retorna { primary, secondary }
export function getPositions(player) {
  const maxedSet = new Set(JSON.parse(player.maxed_skills || '[]'));
  const ranked = calcScores(player, maxedSet);
  return {
    primary:   ranked[0]?.pos ?? '—',
    secondary: ranked[1]?.pos ?? '—',
  };
}
