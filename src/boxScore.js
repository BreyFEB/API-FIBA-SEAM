// boxScore.js
import { loadJSON } from './dataLoader.js';
import { formatPlayerName } from './utilities/formatPlayerName.js';
import { attachTableSort } from './sortTable.js';

const BOX_SCORE_PATH = './data/boxscore.json';

function secondsToMinutes(seconds) {
  if (!seconds) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatPercent(value) {
  if (value == null) return '';
  return value.toFixed(1);
}

function createStarterIcon() {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'starter-icon');
  svg.setAttribute('width', '14');
  svg.setAttribute('height', '14');
  svg.setAttribute('viewBox', '0 0 16 16');
  svg.setAttribute('title', 'Titular');

  const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  text.setAttribute('x', '3');
  text.setAttribute('y', '12');
  text.setAttribute('class', 'starter-text');
  text.textContent = 'T';

  svg.appendChild(text);
  return svg;
}

function formatValue(value) {
  if (value === null || value === undefined || value === '' || value.length === 0) return '-';
  return value;
}

function createPlayerRow(player) {
  const tr = document.createElement('tr');
  
  // Create name cell with optional starter icon
  const nameValue = formatPlayerName(player.firstName, player.lastName);
  const nameCell = document.createElement('td');
  nameCell.className = 'player-name-cell px-1';
  nameCell.title = `${player.firstName} ${player.lastName}`;
  // Add tooltip 'Titular' if player is starter
  if (player.isStarter) {
    nameCell.title += ' (Titular)';
  }
  
  if (player.isStarter) {
    nameCell.appendChild(createStarterIcon());
  }
  nameCell.appendChild(document.createTextNode(nameValue));

  const cells = [
    { key: 'uniformNumber', value: formatValue(player?.uniformNumber) },
    { key: 'name', element: nameCell },
    { 
      key: 'minutes', 
      value: formatValue(secondsToMinutes(player.playDurationInSeconds)),
      rawValue: player.playDurationInSeconds || 0
    },
    { key: 'points', value: formatValue(player.points) },
    { key: 'fieldGoalsMade', value: formatValue(player.fieldGoalsMade) },
    { key: 'fieldGoalsAttempted', value: formatValue(player.fieldGoalsAttempted) },
    { key: 'fieldGoalsPercentage', value: formatValue(formatPercent(player.fieldGoalsPercentage)) },
    { key: 'twoPointsMade', value: formatValue(player.twoPointsMade) },
    { key: 'twoPointsAttempted', value: formatValue(player.twoPointsAttempted) },
    { key: 'twoPointsPercentage', value: formatValue(formatPercent(player.twoPointsPercentage)) },
    { key: 'threePointsMade', value: formatValue(player.threePointsMade) },
    { key: 'threePointsAttempted', value: formatValue(player.threePointsAttempted) },
    { key: 'threePointsPercentage', value: formatValue(formatPercent(player.threePointsPercentage)) },
    { key: 'freeThrowsMade', value: formatValue(player.freeThrowsMade) },
    { key: 'freeThrowsAttempted', value: formatValue(player.freeThrowsAttempted) },
    { key: 'freeThrowsPercentage', value: formatValue(formatPercent(player.freeThrowsPercentage)) },
    { key: 'offensiveRebounds', value: formatValue(player.offensiveRebounds) },
    { key: 'defensiveRebounds', value: formatValue(player.defensiveRebounds) },
    { key: 'rebounds', value: formatValue(player.rebounds) },
    { key: 'assists', value: formatValue(player.assists) },
    { key: 'personalFouls', value: formatValue(player.personalFouls) },
    { key: 'turnovers', value: formatValue(player.turnovers) },
    { key: 'steals', value: formatValue(player.steals) },
    { key: 'blockedShots', value: formatValue(player.blockedShots) },
    { key: 'plusMinus', value: formatValue(player.plusMinus) },
    { key: 'efficiency', value: formatValue(player.efficiency) },
  ];

  cells.forEach(({ key, value, title, element, rawValue }) => {
    if (element) {
      tr.appendChild(element);
    } else {
      const td = document.createElement('td');
      td.classList.add('px-1');
      if (title) td.title = title;
      if (rawValue !== undefined) {
        td.setAttribute('data-raw-value', rawValue);
      }
      td.textContent = value;
      tr.appendChild(td);
    }
  });

  return tr;
}

async function renderBoxScore() {
  const pills = document.getElementById('boxscore-team-pills');
  const tabContent = document.getElementById('boxscore-team-tab-content');
  const pillTpl = document.getElementById('boxscore-team-pill-template');
  const paneTpl = document.getElementById('boxscore-team-pane-template');
  if (!pills || !tabContent || !pillTpl || !paneTpl) return;

  let data;
  try {
    data = await loadJSON(BOX_SCORE_PATH);
  } catch (e) {
    tabContent.innerHTML = '<div class="alert alert-danger">No se pudo cargar el box score.</div>';
    return;
  }

  // Group by team
  const teams = {};
  data.forEach(entry => {
    const teamName = entry.team?.officialName || 'Equipo';
    if (!teams[teamName]) teams[teamName] = [];
    if (entry.player) {
      teams[teamName].push({
        ...entry.player,
        ...entry,
      });
    }
  });

  const teamNames = Object.keys(teams);
  if (teamNames.length === 0) {
    tabContent.innerHTML = '<div class="alert alert-warning">No hay datos de equipos.</div>';
    return;
  }

  // Clear containers
  pills.innerHTML = '';
  tabContent.innerHTML = '';

  teamNames.forEach((name, i) => {
    // Create pill
    const pillNode = pillTpl.content.firstElementChild.cloneNode(true);
    const btn = pillNode.querySelector('button');
    const paneId = `boxscore-team-${i}`;
    btn.textContent = name;
    btn.setAttribute('data-bs-target', `#${paneId}`);
    if (i === 0) btn.classList.add('active');
    pills.appendChild(pillNode);

    // Create pane with table
    const paneNode = paneTpl.content.firstElementChild.cloneNode(true);
    const pane = paneNode; // div.tab-pane
    pane.id = paneId;
    if (i === 0) pane.classList.add('show', 'active');

    const tbody = paneNode.querySelector('tbody');
    const table = paneNode.querySelector('table');

    // Store original order: starters first by minutes, then bench by minutes
    const originalOrder = teams[name].slice().sort((a, b) => {
      // Don't modify this line of code, it's used to sort the players by starter and minutes
      if (a.isStarter !== b.isStarter) return b.isStarter ? 1 : -1;
      return (b.playDurationInSeconds || 0) - (a.playDurationInSeconds || 0);
    });
    originalOrder.forEach(p => tbody.appendChild(createPlayerRow(p)));

    tabContent.appendChild(paneNode);

         // Attach sorting to this table
     attachTableSort(table, {
       defaultSort: { key: null, order: 'desc' }, // null key means use custom default order
       // Custom compare function for default sort only
       customCompare: (a, b, key, order) => {
         // Only apply starter+minutes sorting for default sort (no key)
         if (!key) {
           const aIsStarter = a.querySelector('.starter-icon') !== null;
           const bIsStarter = b.querySelector('.starter-icon') !== null;
           if (aIsStarter !== bIsStarter) return bIsStarter ? 1 : -1;
           // Within each group (starters/bench), sort by minutes
           const aMinutes = Number(a.querySelector('[data-raw-value]')?.getAttribute('data-raw-value')) || 0;
           const bMinutes = Number(b.querySelector('[data-raw-value]')?.getAttribute('data-raw-value')) || 0;
           return bMinutes - aMinutes;
         }
         return null; // For explicit column sorts, use default comparison
       }
     });
  });
}

if (document.readyState !== 'loading') renderBoxScore();
else document.addEventListener('DOMContentLoaded', renderBoxScore);
