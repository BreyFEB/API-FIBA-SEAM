// Shot map functionality for displaying team shots on SVG courts
import { loadJSON } from './dataLoader.js';

// Coordinate transformation constants
const ORIGINAL_MAX_X = 280;
const ORIGINAL_MAX_Y = 261;
const SVG_MAX_X = 1500;
const SVG_MAX_Y = 1400;

// Transform coordinates from play-by-play format to SVG format
function transformCoordinates(originalX, originalY) {
  // Scale from original dimensions (280x261) to SVG dimensions (1500x1400)
  // Both coordinate systems have top-left origin, so no flipping needed
  const svgX = (originalX / ORIGINAL_MAX_X) * SVG_MAX_X;
  const svgY = (originalY / ORIGINAL_MAX_Y) * SVG_MAX_Y;
  
  return { x: svgX, y: svgY };
}

// Helper function to find player name by ID from boxscore data
function findPlayerName(playerId, boxscoreData) {
  if (!playerId || !boxscoreData) return 'N/D';
  
  const player = boxscoreData.find(p => p.player && p.player.playerId === playerId);
  if (player && player.player) {
    const firstName = player.player.firstName || '';
    const lastName = player.player.lastName || '';
    return `${firstName} ${lastName}`.trim() || 'N/D';
  }
  return 'N/D';
}

// Mobile tooltip helpers
function getOrCreateShotTooltip() {
  let tooltip = document.getElementById('shot-tooltip');
  if (!tooltip) {
    tooltip = document.createElement('div');
    tooltip.id = 'shot-tooltip';
    tooltip.className = 'shot-tooltip';
    tooltip.style.display = 'none';
    document.body.appendChild(tooltip);
  }
  return tooltip;
}

function showShotTooltip(clientX, clientY, content) {
  const tooltip = getOrCreateShotTooltip();
  tooltip.textContent = content;
  tooltip.style.display = 'block';

  const rect = tooltip.getBoundingClientRect();
  let left = clientX - rect.width / 2;
  let top = clientY - rect.height - 10;

  if (left < 10) left = 10;
  if (left + rect.width > window.innerWidth - 10) left = window.innerWidth - rect.width - 10;
  if (top < 10) top = clientY + 16;

  tooltip.style.left = `${left}px`;
  tooltip.style.top = `${top}px`;
}

function hideShotTooltip() {
  const tooltip = document.getElementById('shot-tooltip');
  if (tooltip) tooltip.style.display = 'none';
}

// Create a shot marker (green circle for makes, red cross for misses)
function createShotMarker(x, y, made, shotData, boxscoreData) {
  const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
  
  // Add tooltip with shot information
  const title = document.createElementNS("http://www.w3.org/2000/svg", "title");
  const quarter = shotData.quarter.replace('Q', '') || 'N/A';
  const time = shotData.Time || 'N/A';
  
  // Extract player ID from C1 field (format: "P_123456")
  let playerName = 'N/D';
  if (shotData.C1) {
    const playerIdStr = shotData.C1.split('_')[1]; // Get the part after "P_"
    const playerId = parseInt(playerIdStr, 10);
    playerName = findPlayerName(playerId, boxscoreData);
  }

  title.textContent = `Cuarto: ${quarter}\nTiempo restante: ${time}\nJugador: ${playerName}`;
  g.appendChild(title);
  
  // Add invisible background rectangle for better hover area
  const backgroundRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  backgroundRect.setAttribute("x", x - 25);
  backgroundRect.setAttribute("y", y - 25);
  backgroundRect.setAttribute("width", "50");
  backgroundRect.setAttribute("height", "50");
  backgroundRect.setAttribute("fill", "rgba(0,0,0,0.001)");
  backgroundRect.setAttribute("pointer-events", "all");
  g.appendChild(backgroundRect);
  
  if (made) {
    // Green circle for made shots
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("cx", x);
    circle.setAttribute("cy", y);
    circle.setAttribute("r", "18");
    circle.setAttribute("fill", "none");
    circle.setAttribute("stroke", "green");
    circle.setAttribute("stroke-width", "6");
    circle.setAttribute("pointer-events", "none");
    g.appendChild(circle);
  } else {
    // Red cross for missed shots
    const line1 = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line1.setAttribute("x1", x - 18);
    line1.setAttribute("y1", y - 18);
    line1.setAttribute("x2", x + 18);
    line1.setAttribute("y2", y + 18);
    line1.setAttribute("stroke", "red");
    line1.setAttribute("stroke-width", "6");
    line1.setAttribute("pointer-events", "none");
    
    const line2 = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line2.setAttribute("x1", x - 18);
    line2.setAttribute("y1", y + 18);
    line2.setAttribute("x2", x + 18);
    line2.setAttribute("y2", y - 18);
    line2.setAttribute("stroke", "red");
    line2.setAttribute("stroke-width", "6");
    line2.setAttribute("pointer-events", "none");
    
    g.appendChild(line1);
    g.appendChild(line2);
  }
  
  // Add hover/tap effects (works on both desktop and mobile)
  backgroundRect.addEventListener('mouseenter', () => {
    if (made) {
      const circle = g.querySelector('circle');
      circle.setAttribute('r', '24');
      circle.setAttribute('stroke-width', '8');
    } else {
      const lines = g.querySelectorAll('line');
      lines.forEach((line, index) => {
        line.setAttribute('stroke-width', '8');
        if (index === 0) {
          line.setAttribute('x1', x - 24);
          line.setAttribute('y1', y - 24);
          line.setAttribute('x2', x + 24);
          line.setAttribute('y2', y + 24);
        } else {
          line.setAttribute('x1', x - 24);
          line.setAttribute('y1', y + 24);
          line.setAttribute('x2', x + 24);
          line.setAttribute('y2', y - 24);
        }
      });
    }
  });
  
  backgroundRect.addEventListener('mouseleave', () => {
    if (made) {
      const circle = g.querySelector('circle');
      circle.setAttribute('r', '18');
      circle.setAttribute('stroke-width', '6');
    } else {
      const lines = g.querySelectorAll('line');
      lines.forEach((line, index) => {
        line.setAttribute('stroke-width', '6');
        if (index === 0) {
          line.setAttribute('x1', x - 18);
          line.setAttribute('y1', y - 18);
          line.setAttribute('x2', x + 18);
          line.setAttribute('y2', y + 18);
        } else {
          line.setAttribute('x1', x - 18);
          line.setAttribute('y1', y + 18);
          line.setAttribute('x2', x + 18);
          line.setAttribute('y2', y - 18);
        }
      });
    }
  });
  
  // Add touch events for mobile support
  backgroundRect.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const touch = e.touches && e.touches[0] ? e.touches[0] : null;
    const tooltipContent = `Cuarto: ${quarter}\nTiempo restante: ${time}\nJugador: ${playerName}`;
    if (touch) showShotTooltip(touch.clientX, touch.clientY, tooltipContent);
    backgroundRect.dispatchEvent(new Event('mouseenter'));
  }, { passive: false });
  
  backgroundRect.addEventListener('touchend', (e) => {
    e.preventDefault();
    hideShotTooltip();
    setTimeout(() => {
      backgroundRect.dispatchEvent(new Event('mouseleave'));
    }, 800);
  }, { passive: false });
  
  return g;
}

// Get team information from boxscore data
async function getTeamInfo() {
  const boxscoreData = await loadJSON('data/boxscore.json');
  
  let localTeam = null;
  let awayTeam = null;
  
  for (const player of boxscoreData) {
    const teamId = player.team.organisationId;
    const teamName = player.team.officialName;
    
    if (!localTeam) {
      localTeam = { id: teamId, name: teamName };
    } else if (localTeam.id !== teamId && !awayTeam) {
      awayTeam = { id: teamId, name: teamName };
      break;
    }
  }
  
  return { localTeam, awayTeam };
}

// Extract shots from play-by-play data
async function extractShots() {
  const [playByPlayData, { localTeam, awayTeam }] = await Promise.all([
    loadJSON('data/playbyplay.json'),
    getTeamInfo()
  ]);
  
  const localShots = [];
  const awayShots = [];
  
  // Process each quarter
  Object.keys(playByPlayData.GameActions).forEach(quarter => {
    const quarterData = playByPlayData.GameActions[quarter];
    if (quarterData && quarterData.Items) {
      quarterData.Items.forEach(event => {
        // Check if this is a shot (P2 or P3) with coordinates
        if ((event.AC === 'P2' || event.AC === 'P3') && 
            event.SX !== undefined && event.SY !== undefined) {
          
          const shotData = {
            ...event,
            quarter: quarter,
            made: event.SU === '+' // '+' indicates made shot
          };
          
          // Determine which team took the shot
          if (event.T1 === `T_${localTeam.id}`) {
            localShots.push(shotData);
          } else if (event.T1 === `T_${awayTeam.id}`) {
            awayShots.push(shotData);
          }
        }
      });
    }
  });
  
  return { localShots, awayShots, localTeam, awayTeam };
}

// Display shots on the specified SVG court
function displayShotsOnCourt(shots, containerId, boxscoreData) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  // Clear existing shots
  container.innerHTML = '';
  
  shots.forEach(shot => {
    const coords = transformCoordinates(shot.SX, shot.SY);
    const marker = createShotMarker(coords.x, coords.y, shot.made, shot, boxscoreData);
    container.appendChild(marker);
  });
}

// Update team tab labels with actual team names
function updateTeamTabLabels(localTeam, awayTeam) {
  const localTab = document.getElementById('local-shots-tab');
  const awayTab = document.getElementById('away-shots-tab');
  
  if (localTab && localTeam) {
    localTab.textContent = localTeam.name;
  }
  if (awayTab && awayTeam) {
    awayTab.textContent = awayTeam.name;
  }
}

// Main function to load and display all shots
async function loadShotMap() {
  try {
    const [{ localShots, awayShots, localTeam, awayTeam }, boxscoreData] = await Promise.all([
      extractShots(),
      loadJSON('data/boxscore.json')
    ]);
    
    // Update team tab labels
    updateTeamTabLabels(localTeam, awayTeam);
    
    // Display shots on respective courts with boxscore data for player names
    displayShotsOnCourt(localShots, 'local-shots-container', boxscoreData);
    displayShotsOnCourt(awayShots, 'away-shots-container', boxscoreData);
    
    console.log(`Loaded ${localShots.length} shots for ${localTeam.name}`);
    console.log(`Loaded ${awayShots.length} shots for ${awayTeam.name}`);
    
  } catch (error) {
    console.error('Error loading shot map:', error);
  }
}

// Export the main function
export { loadShotMap };
