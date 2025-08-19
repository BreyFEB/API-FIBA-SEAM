// boxscoreResumen.js
import { loadJSON } from './dataLoader.js';
import { formatPlayerName } from './utilities/formatPlayerName.js';
import { attachTableSort } from './sortTable.js';

const BOX_SCORE_PATH = './data/boxscore.json';

function createPlayerRowDoc(player) {
  const tr = document.createElement('tr');

  const tdNum = document.createElement('td');
  tdNum.textContent = player?.uniformNumber || '';
  tr.appendChild(tdNum);

  const tdName = document.createElement('td');
  tdName.className = 'player-name-cell';
  const fullName = `${player.firstName || ''} ${player.lastName || ''}`.trim();
  tdName.title = fullName;
  tdName.textContent = formatPlayerName(player.firstName, player.lastName);
  tr.appendChild(tdName);

  const tdPts = document.createElement('td');
  tdPts.textContent = player.points ?? '';
  tr.appendChild(tdPts);

  const tdReb = document.createElement('td');
  tdReb.textContent = player.rebounds ?? '';
  tr.appendChild(tdReb);

  const tdAst = document.createElement('td');
  tdAst.textContent = player.assists ?? '';
  tr.appendChild(tdAst);

  const tdEff = document.createElement('td');
  tdEff.textContent = player.efficiency ?? '';
  tr.appendChild(tdEff);

  return tr;
}

async function renderBoxscoreResumen() {
  const resumenRoot = document.getElementById('resumen-tab-content');
  const pillsContainer = document.getElementById('team-pills');
  const contentContainer = document.getElementById('team-tab-content');
  const pillTemplate = document.getElementById('team-pill-template');
  const paneTemplate = document.getElementById('team-pane-template');

  if (!resumenRoot || !pillsContainer || !contentContainer || !pillTemplate || !paneTemplate) return;

  let data;
  try {
    data = await loadJSON(BOX_SCORE_PATH);
  } catch (e) {
    resumenRoot.innerHTML = '<div class="alert alert-danger">No se pudo cargar el boxscore.</div>';
    return;
  }

  // Group by team
  const teams = {};
  data.forEach(entry => {
    const teamName = entry.team?.officialName || 'Equipo';
    if (!teams[teamName]) teams[teamName] = [];
    if (entry.player) {
      teams[teamName].push({
        uniformNumber: entry.player.uniformNumber,
        firstName: entry.player.firstName,
        lastName: entry.player.lastName,
        points: entry.points,
        rebounds: entry.rebounds,
        assists: entry.assists,
        efficiency: entry.efficiency
      });
    }
  });

  const teamNames = Object.keys(teams);
  if (teamNames.length === 0) {
    resumenRoot.innerHTML = '<div class="alert alert-warning">No hay datos de equipos.</div>';
    return;
  }

  // Clear containers
  pillsContainer.innerHTML = '';
  contentContainer.innerHTML = '';

  teamNames.forEach((name, i) => {
    // Create pill
    const pillNode = pillTemplate.content.firstElementChild.cloneNode(true);
    const btn = pillNode.querySelector('button');
    const pillId = `pill-${i}`;
    const paneId = `team-${i}`;
    btn.id = pillId;
    btn.textContent = name;
    btn.setAttribute('data-bs-target', `#${paneId}`);
    if (i === 0) btn.classList.add('active');
    pillsContainer.appendChild(pillNode);

    // Create pane with table
    const paneNode = paneTemplate.content.firstElementChild.cloneNode(true);
    const tablePane = paneNode; // div.tab-pane
    tablePane.id = paneId;
    if (i === 0) tablePane.classList.add('show', 'active');

    const tbody = paneNode.querySelector('tbody');
    const table = paneNode.querySelector('table');

    teams[name].forEach(p => tbody.appendChild(createPlayerRowDoc(p)));

    contentContainer.appendChild(paneNode);

    // Attach sorting to this table
    attachTableSort(table, {
      defaultSort: { key: 'efficiency', order: 'desc' }
    });
  });
}

if (document.readyState !== 'loading') {
  renderBoxscoreResumen();
} else {
  document.addEventListener('DOMContentLoaded', renderBoxscoreResumen);
}
