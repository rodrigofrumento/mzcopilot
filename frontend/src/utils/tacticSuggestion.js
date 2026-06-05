import { WEIGHTS, SKILL_MAP } from './positions';

// Estilo preferido do usuário (CLAUDE.md)
const PREFERRED = { passing: 'wings', mentality: 'offensive', pressing: 'aggressive' };

const PITCH_W = 220;
const PITCH_H = 350;
const SUB_X   = 210;

/** Infere a posição tática de um jogador a partir de suas coordenadas no pitch */
export function inferPosition(p) {
  if (p.isGk) return 'Goleiro';
  const xPct = (p.left / PITCH_W) * 100;
  const yPct = (p.top  / PITCH_H) * 100;

  if (yPct > 82) return 'Goleiro';

  if (yPct > 55) {
    // Defesa
    return (xPct < 18 || xPct > 78) ? 'Lateral' : 'Zagueiro';
  }
  if (yPct > 32) {
    // Meio-campo
    if (xPct < 18 || xPct > 78) return 'Ponta';
    return 'Meia Central';
  }
  // Ataque
  return 'Atacante';
}

/** Calcula o score normalizado de um jogador para uma dada posição (0–10) */
function playerPosScore(player, positionName) {
  const weights = WEIGHTS[positionName];
  if (!weights) return 0;

  const maxedSet = new Set(JSON.parse(player.maxed_skills || '[]'));
  let raw = 0, weightSum = 0;

  for (const [skillName, weight] of Object.entries(weights)) {
    const dbKey = SKILL_MAP[skillName];
    const value = player[dbKey] ?? 0;
    const growthBonus = maxedSet.has(dbKey) ? 0 : (10 - value) * 0.3;
    raw += weight * (value + growthBonus);
    weightSum += weight;
  }
  return weightSum > 0 ? raw / weightSum : 0;
}

/**
 * Pontua uma tática completa.
 * Retorna { score, playerScores }
 */
export function scoreTactic(tactic, playerMap) {
  const starters = (tactic.players || []).filter(p => !p.isSub && p.left < SUB_X);
  if (starters.length === 0) return { score: 0, playerScores: [] };

  const playerScores = starters.map(p => {
    const info = playerMap[String(p.pid)];
    const pos  = inferPosition(p);
    const score = info ? playerPosScore(info, pos) : 0;
    return { pid: p.pid, shirtNr: p.shirtNr, name: info?.name ?? p.pid, pos, score };
  });

  const avg = playerScores.reduce((s, p) => s + p.score, 0) / playerScores.length;
  return { score: avg, playerScores };
}

/** Quantos dos 3 settings preferidos batem com a tática */
export function styleMatch(tactic) {
  let matches = 0;
  if (tactic.passing   === PREFERRED.passing)   matches++;
  if (tactic.mentality === PREFERRED.mentality) matches++;
  if (tactic.pressing  === PREFERRED.pressing)  matches++;
  return matches; // 0-3
}

/** Retorna os rankings das táticas com scores e match de estilo */
export function rankTactics(tactics, playerMap) {
  return tactics
    .map(t => {
      const { score, playerScores } = scoreTactic(t, playerMap);
      const match = styleMatch(t);
      return { tactic: t, score, playerScores, styleMatch: match };
    })
    .sort((a, b) => {
      // Ordena por score; empate resolve por match de estilo
      if (Math.abs(b.score - a.score) > 0.05) return b.score - a.score;
      return b.styleMatch - a.styleMatch;
    });
}
