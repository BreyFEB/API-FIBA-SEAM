// playByPlay.js
import { loadJSON } from './dataLoader.js';

const PBP_PATH = './data/playbyplay.json';
const BOX_SCORE_PATH = './data/boxscore.json';

function parseQuarterKey(qKey) {
  // Expect keys like Q1, Q2, ... prefer natural order
  const num = Number(qKey.replace(/[^0-9]/g, ''));
  return Number.isNaN(num) ? 0 : num;
}

function timeToSeconds(timeStr) {
  // format MM:SS
  const [m, s] = (timeStr || '0:00').split(':').map(n => Number(n));
  if (Number.isNaN(m) || Number.isNaN(s)) return 0;
  return m * 60 + s;
}

function createPbpItemNode(tpl, { time, action, scoreA, scoreB, teamClass, meta, scoringBadge, substitutionArrow }) {
  const node = tpl.content.firstElementChild.cloneNode(true);
  if (teamClass) node.classList.add(teamClass);
  node.querySelector('.pbp-time').textContent = time || '';
  
  const actionEl = node.querySelector('.pbp-action');
  actionEl.textContent = action || '';
  
  // Add scoring badge if present
  if (scoringBadge) {
    const badge = document.createElement('span');
    badge.className = 'badge bg-success ms-2';
    badge.textContent = scoringBadge;
    actionEl.appendChild(badge);
  }
  
  // Add substitution arrow if present
  if (substitutionArrow) {
    const arrow = document.createElement('span');
    arrow.className = `${substitutionArrow.className} ms-2`;
    arrow.textContent = substitutionArrow.text;
    actionEl.appendChild(arrow);
  }
  
  node.querySelector('.pbp-score').textContent = `${scoreA ?? ''} - ${scoreB ?? ''}`;
  const metaEl = node.querySelector('.pbp-meta');
  if (metaEl) metaEl.textContent = meta || '';
  return node;
}

function getScoringBadge(eventData) {
  // Check if this is a successful scoring action
  if (eventData.SU !== '+') return null; // Only for successful actions
  
  // Determine points based on AC field
  switch (eventData.AC) {
    case 'P3':
      return '+3';
    case 'P2':
      return '+2';
    case 'FT':
      return '+1';
    default:
      return null;
  }
}

function getSubstitutionArrow(action) {
  const actionLower = action.toLowerCase();
  
  if (actionLower.includes('cambio (entra)')) {
    return {
      text: '>>',
      className: 'text-success fw-bold'
    };
  } else if (actionLower.includes('cambio (sale)')) {
    return {
      text: '<<',
      className: 'text-danger fw-bold'
    };
  }
  
  return null;
}

function translateToSpanish(action) {
  const source = action.toString();
  const t0 = source.toLowerCase().trim().replace(/\s+/g, ' ');

  // Normalize common synonyms to simplify matching
  let t = t0;

  const rules = [
    { re: /start of (period|quarter)/, es: 'Inicio del cuarto' },
    { re: /end of (period|quarter)/, es: 'Fin del cuarto' },
    { re: /start of game/, es: 'Inicio del partido' },
    { re: /end of game/, es: 'Final del partido' },

    { re: /defensive rebound/, es: 'Rebote defensivo' },
    { re: /offensive rebound/, es: 'Rebote ofensivo' },

    { re: /3pt.*made/, es: 'Triple anotado' },
    { re: /3pt.*miss(ed)?/, es: 'Triple fallado' },
    { re: /2pt.*made/, es: 'Tiro de 2 anotado' },
    { re: /2pt.*miss(ed)?/, es: 'Tiro de 2 fallado' },
    { re: /layup.*made/, es: 'Bandeja anotada' },
    { re: /layup.*miss(ed)?/, es: 'Bandeja fallada' },
    { re: /dunk.*made/, es: 'Mate anotado' },
    { re: /dunk.*miss(ed)?/, es: 'Mate fallado' },
    { re: /jumpt shot.*made/, es: 'Tiro anotado' },
    { re: /jump shot.*miss(ed)?/, es: 'Tiro fallado' },

    { re: /free throw.*made/, es: 'Tiro libre anotado' },
    { re: /free throw.*miss(ed)?/, es: 'Tiro libre fallado' },

    { re: /personal foul.*two free throws awarded/, es: 'Falta personal; 2 tiros libres' },
    { re: /personal foul/, es: 'Falta personal' },
    { re: /(shooting|shoot) foul/, es: 'Falta de tiro' },
    { re: /blocking foul/, es: 'Falta en defensa (bloqueo)' },
    { re: /(offensive|charging) foul/, es: 'Falta en ataque' },
    { re: /double foul/, es: 'Doble falta' },
    { re: /unsportsmanlike foul/, es: 'Falta antideportiva' },
    { re: /technical foul/, es: 'Falta técnica' },
    { re: /foul drawn/, es: 'Falta recibida' },

    { re: /jump ball.*won/, es: 'Salto entre dos (ganado)' },
    { re: /jump ball.*lost/, es: 'Salto entre dos (perdido)' },
    { re: /jump ball/, es: 'Salto entre dos' },
    { re: /block(ed)?/, es: 'Tapón' },
    { re: /steal/, es: 'Robo' },
    { re: /assist/, es: 'Asistencia' },

    // Turnovers
    { re: /turnover.*travel/, es: 'Pérdida: pasos' },
    { re: /turnover.*bad pass/, es: 'Pérdida: mal pase' },
    { re: /turnover.*lost ball/, es: 'Pérdida: balón perdido' },
    { re: /turnover.*out of bounds/, es: 'Pérdida: fuera de banda' },
    { re: /turnover.*double dribble/, es: 'Pérdida: dobles' },
    { re: /turnover.*carry/, es: 'Pérdida: acompañanmiento' },
    { re: /turnover.*5 second/, es: 'Pérdida: 5 segundos' },
    { re: /turnover.*8 second/, es: 'Pérdida: 8 segundos' },
    { re: /turnover.*backcourt/, es: 'Pérdida: campo atrás' },
    { re: /turnover.*shot clock/, es: 'Pérdida: 24 segundos' },
    { re: /turnover.*3 second/, es: 'Pérdida: 3 segundos' },
    { re: /turnover.*ball handling/, es: 'Pérdida: mal manejo de balón' },
    { re: /offensive goaltending/, es: 'Interferencia ofensiva' },
    { re: /defensive goaltending/, es: 'Interferencia defensiva' },

    { re: /timeout/, es: 'Tiempo muerto' },
    { re: /substitution.*\bin\b/, es: 'Cambio (entra)' },
    { re: /substitution.*\bout\b/, es: 'Cambio (sale)' },
  ];

  for (const { re, es } of rules) {
    if (re.test(t)) return es;
  }

  // Fallback: capitalize original as-is
  return source.charAt(0).toUpperCase() + source.slice(1);
}

function parseOrgFromT1(t1) {
  if (!t1) return null;
  const m = String(t1).match(/T[_-]?(\d+)/i);
  return m ? Number(m[1]) : null;
}

function parsePlayerIdFromC1(c1) {
  if (!c1) return null;
  const m = String(c1).match(/P[_-]?(\d+)/i);
  return m ? Number(m[1]) : null;
}

async function resolveTeams() {
  try {
    const box = await loadJSON(BOX_SCORE_PATH);
    const orgs = [];
    const playerToOrg = new Map();
    const orgToName = new Map();
    const playerToName = new Map();
    for (const entry of box) {
      const orgId = entry?.team?.organisationId;
      const orgName = entry?.team?.officialName;
      const playerId = entry?.player?.playerId;
      const firstName = entry?.player?.firstName || '';
      const lastName = entry?.player?.lastName || '';
      if (orgId != null && !orgs.includes(orgId)) orgs.push(orgId);
      if (orgId != null && orgName && !orgToName.has(orgId)) orgToName.set(orgId, orgName);
      if (playerId != null && orgId != null) playerToOrg.set(playerId, orgId);
      if (playerId != null) playerToName.set(playerId, `${firstName} ${lastName}`.trim());
    }
    return { localOrgId: orgs[0] || null, awayOrgId: orgs[1] || null, playerToOrg, orgToName, playerToName };
  } catch {
    return { localOrgId: null, awayOrgId: null, playerToOrg: new Map(), orgToName: new Map(), playerToName: new Map() };
  }
}

async function renderPlayByPlay() {
  const list = document.getElementById('pbp-list');
  const itemTpl = document.getElementById('pbp-item-template');
  const pills = document.getElementById('pbp-quarter-pills');
  const tabContent = document.getElementById('pbp-quarter-tab-content');
  const pillTpl = document.getElementById('pbp-quarter-pill-template');
  const paneTpl = document.getElementById('pbp-quarter-pane-template');
  if (!itemTpl || !pills || !tabContent || !pillTpl || !paneTpl) return;

  let data;
  try {
    data = await loadJSON(PBP_PATH);
  } catch (e) {
    list.innerHTML = '<div class="alert alert-danger">No se pudo cargar el PBP.</div>';
    return;
  }

  const { localOrgId, awayOrgId, playerToOrg, orgToName, playerToName } = await resolveTeams();

  const gameActions = data?.GameActions || {};
  const quarters = Object.keys(gameActions)
    .filter(k => /^Q\d+$/i.test(k))
    .sort((a, b) => parseQuarterKey(a) - parseQuarterKey(b));

  // Build quarter pills and panes
  pills.innerHTML = '';
  tabContent.innerHTML = '';

  quarters.forEach((qKey, i) => {
    const qNum = parseQuarterKey(qKey);
    const pillNode = pillTpl.content.firstElementChild.cloneNode(true);
    const btn = pillNode.querySelector('button');
    const paneId = `pbp-q${qNum}`;
    btn.textContent = 'Cuarto ' + String(qNum);
    btn.setAttribute('data-bs-target', `#${paneId}`);
    if (i === 0) btn.classList.add('active');
    pills.appendChild(pillNode);

    const paneNode = paneTpl.content.firstElementChild.cloneNode(true);
    const pane = paneNode; // div.tab-pane
    pane.id = paneId;
    if (i === 0) pane.classList.add('show', 'active');
    const paneList = pane.querySelector('.pbp-list');

    const events = (gameActions[qKey]?.Items || [])
      .slice()
      .sort((a, b) => parseInt(b.SORTORDER) - parseInt(a.SORTORDER)); // reverse chronological: last first -> append reversed

    events.forEach(ev => {
      let teamClass = 'pbp-neutral';
      let orgFromEvent = parseOrgFromT1(ev.T1);
      let playerName = '';
      if (orgFromEvent == null) {
        const pid = parsePlayerIdFromC1(ev.C1);
        if (pid != null && playerToOrg.has(pid)) orgFromEvent = playerToOrg.get(pid);
        if (pid != null && playerToName.has(pid)) playerName = playerToName.get(pid);
      } else {
        const pid = parsePlayerIdFromC1(ev.C1);
        if (pid != null && playerToName.has(pid)) playerName = playerToName.get(pid);
      }
      const teamName = orgFromEvent != null && orgToName.has(orgFromEvent) ? orgToName.get(orgFromEvent) : '';
      if (orgFromEvent != null) {
        if (localOrgId != null && orgFromEvent === localOrgId) teamClass = 'pbp-local';
        else if (awayOrgId != null && orgFromEvent === awayOrgId) teamClass = 'pbp-away';
      }
             const actionEs = translateToSpanish(ev.Action);
       const scoringBadge = getScoringBadge(ev);
       const substitutionArrow = getSubstitutionArrow(actionEs);
       const node = createPbpItemNode(itemTpl, {
         time: ev.Time,
         action: actionEs,
         scoreA: ev.SA,
         scoreB: ev.SB,
         teamClass,
         meta: [playerName, teamName].filter(Boolean).join(' · '),
         scoringBadge,
         substitutionArrow,
       });
      paneList.appendChild(node);
    });

    tabContent.appendChild(paneNode);
  });
}

if (document.readyState !== 'loading') renderPlayByPlay();
else document.addEventListener('DOMContentLoaded', renderPlayByPlay);
