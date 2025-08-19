import { loadJSON } from './dataLoader.js';

// Calculate basic box score totals for each team
async function calculateBasicStats() {
  const boxscoreData = await loadJSON('data/boxscore.json');
  
  let localTeamId = undefined;
  let awayTeamId = undefined;

  for (const boxscoreEntry of boxscoreData) {
    const currentOrganisationId = 'T_' + String(boxscoreEntry.team.organisationId);
    if (localTeamId !== undefined && awayTeamId !== undefined) {
      break;
    } else if (localTeamId === undefined && awayTeamId === undefined) {
      localTeamId = currentOrganisationId;
    } else if (localTeamId !== undefined && awayTeamId === undefined && currentOrganisationId !== localTeamId) {
      awayTeamId = currentOrganisationId;
    }
  }

  // Initialize team totals
  const teamTotals = {
    [localTeamId]: {
      points: 0,
      fieldGoalsMade: 0,
      fieldGoalsAttempted: 0,
      twoPointsMade: 0,
      twoPointsAttempted: 0,
      threePointsMade: 0,
      threePointsAttempted: 0,
      freeThrowsMade: 0,
      freeThrowsAttempted: 0,
      offensiveRebounds: 0,
      defensiveRebounds: 0,
      rebounds: 0,
      assists: 0,
      personalFouls: 0,
      turnovers: 0,
      steals: 0,
      blockedShots: 0,
      efficiency: 0
    },
    [awayTeamId]: {
      points: 0,
      fieldGoalsMade: 0,
      fieldGoalsAttempted: 0,
      twoPointsMade: 0,
      twoPointsAttempted: 0,
      threePointsMade: 0,
      threePointsAttempted: 0,
      freeThrowsMade: 0,
      freeThrowsAttempted: 0,
      offensiveRebounds: 0,
      defensiveRebounds: 0,
      rebounds: 0,
      assists: 0,
      personalFouls: 0,
      turnovers: 0,
      steals: 0,
      blockedShots: 0,
      efficiency: 0
    }
  };

  // Sum up stats for each team
  boxscoreData.forEach(player => {
    const teamId = 'T_' + String(player.team.organisationId);
    const playerObj = player.player;

    teamTotals[teamId].points += player.points || 0;
    teamTotals[teamId].fieldGoalsMade += player.fieldGoalsMade || 0;
    teamTotals[teamId].fieldGoalsAttempted += player.fieldGoalsAttempted || 0;
    teamTotals[teamId].twoPointsMade += player.twoPointsMade || 0;
    teamTotals[teamId].twoPointsAttempted += player.twoPointsAttempted || 0;
    teamTotals[teamId].threePointsMade += player.threePointsMade || 0;
    teamTotals[teamId].threePointsAttempted += player.threePointsAttempted || 0;
    teamTotals[teamId].freeThrowsMade += player.freeThrowsMade || 0;
    teamTotals[teamId].freeThrowsAttempted += player.freeThrowsAttempted || 0;
    teamTotals[teamId].offensiveRebounds += player.offensiveRebounds || 0;
    teamTotals[teamId].defensiveRebounds += player.defensiveRebounds || 0;
    teamTotals[teamId].rebounds += player.rebounds || 0;
    teamTotals[teamId].assists += player.assists || 0;
    teamTotals[teamId].personalFouls += player.personalFouls || 0;
    teamTotals[teamId].turnovers += player.turnovers || 0;
    teamTotals[teamId].steals += player.steals || 0;
    teamTotals[teamId].blockedShots += player.blockedShots || 0;
    teamTotals[teamId].efficiency += player.efficiency || 0;
  });

  // Get team names
  const teamNames = {};
  boxscoreData.forEach(player => {
    const teamId = 'T_' + String(player.team.organisationId);
    if (!teamNames[teamId]) {
      teamNames[teamId] = player.team.officialName;
    }
  });

  return { teamTotals, teamNames, localTeamId, awayTeamId };
}

function createComparisonStat(statTitle, localTeamName, awayTeamName, localValue, awayValue, isReversed = false) {
  const template = document.getElementById('comparativa-stat-template');
  const clone = template.content.cloneNode(true);

  // Set the stat title
  clone.querySelector('.stat-title').textContent = statTitle;

  // Get the team stat elements
  const teamStats = clone.querySelectorAll('.team-stat');
  const localTeamStat = teamStats[0];
  const awayTeamStat = teamStats[1];

  // Calculate percentages for bar widths
  const maxValue = Math.max(localValue, awayValue);
  const localPercentage = maxValue > 0 ? (localValue / maxValue) * 100 : 0;
  const awayPercentage = maxValue > 0 ? (awayValue / maxValue) * 100 : 0;

  // Set local team data
  localTeamStat.querySelector('.team-name').textContent = localTeamName;
  const localValueElement = localTeamStat.querySelector('.stat-value');
  localValueElement.textContent = statTitle.toLowerCase().includes('porcentaje') ? `${localValue}%` : localValue;
  const localBar = localTeamStat.querySelector('.stat-bar');
  localBar.style.width = `${localPercentage}%`;
  localBar.className = 'stat-bar stat-bar-local';

  // Set away team data
  awayTeamStat.querySelector('.team-name').textContent = awayTeamName;
  const awayValueElement = awayTeamStat.querySelector('.stat-value');
  awayValueElement.textContent = statTitle.toLowerCase().includes('porcentaje') ? `${awayValue}%` : awayValue;
  const awayBar = awayTeamStat.querySelector('.stat-bar');
  awayBar.style.width = `${awayPercentage}%`;
  awayBar.className = 'stat-bar stat-bar-away';

  // Style the team with better values (considering if stat is reversed)
  let localIsBetter, awayIsBetter;
  
  if (isReversed) {
    // For fouls and turnovers, lower is better
    localIsBetter = localValue < awayValue;
    awayIsBetter = awayValue < localValue;
  } else {
    // For most stats, higher is better
    localIsBetter = localValue > awayValue;
    awayIsBetter = awayValue > localValue;
  }

  if (localIsBetter) {
    localTeamStat.classList.add('team-stat-higher');
    awayTeamStat.classList.add('team-stat-lower');
  } else if (awayIsBetter) {
    awayTeamStat.classList.add('team-stat-higher');
    localTeamStat.classList.add('team-stat-lower');
  }
  // If values are equal, neither gets special styling

  return clone;
}

async function renderComparativasBasica() {
  try {
    const { teamTotals, teamNames, localTeamId, awayTeamId } = await calculateBasicStats();
    
    const container = document.getElementById('comparativas-basica-container');
    container.innerHTML = ''; // Clear existing content
    container.className = 'row g-3'; // Bootstrap grid with gap

    const localTeamName = teamNames[localTeamId];
    const awayTeamName = teamNames[awayTeamId];

    const statsToDisplay = [
      {
        title: 'Puntos',
        localValue: teamTotals[localTeamId].points,
        awayValue: teamTotals[awayTeamId].points,
        isReversed: false
      },
      {
        title: 'Tiros de campo anotados',
        localValue: teamTotals[localTeamId].fieldGoalsMade,
        awayValue: teamTotals[awayTeamId].fieldGoalsMade,
        isReversed: false
      },
             {
         title: 'Tiros de campo intentados',
         localValue: teamTotals[localTeamId].fieldGoalsAttempted,
         awayValue: teamTotals[awayTeamId].fieldGoalsAttempted,
         isReversed: false
       },
       {
         title: 'Porcentaje de tiros de campo',
         localValue: teamTotals[localTeamId].fieldGoalsAttempted > 0 ? 
           Math.round((teamTotals[localTeamId].fieldGoalsMade / teamTotals[localTeamId].fieldGoalsAttempted) * 100) : 0,
         awayValue: teamTotals[awayTeamId].fieldGoalsAttempted > 0 ? 
           Math.round((teamTotals[awayTeamId].fieldGoalsMade / teamTotals[awayTeamId].fieldGoalsAttempted) * 100) : 0,
         isReversed: false
       },
       {
         title: 'Tiros de 2 anotados',
        localValue: teamTotals[localTeamId].twoPointsMade,
        awayValue: teamTotals[awayTeamId].twoPointsMade,
        isReversed: false
      },
             {
         title: 'Tiros de 2 intentados',
         localValue: teamTotals[localTeamId].twoPointsAttempted,
         awayValue: teamTotals[awayTeamId].twoPointsAttempted,
         isReversed: false
       },
       {
         title: 'Porcentaje de tiros de 2',
         localValue: teamTotals[localTeamId].twoPointsAttempted > 0 ? 
           Math.round((teamTotals[localTeamId].twoPointsMade / teamTotals[localTeamId].twoPointsAttempted) * 100) : 0,
         awayValue: teamTotals[awayTeamId].twoPointsAttempted > 0 ? 
           Math.round((teamTotals[awayTeamId].twoPointsMade / teamTotals[awayTeamId].twoPointsAttempted) * 100) : 0,
         isReversed: false
       },
       {
         title: 'Triples anotados',
        localValue: teamTotals[localTeamId].threePointsMade,
        awayValue: teamTotals[awayTeamId].threePointsMade,
        isReversed: false
      },
             {
         title: 'Triples intentados',
         localValue: teamTotals[localTeamId].threePointsAttempted,
         awayValue: teamTotals[awayTeamId].threePointsAttempted,
         isReversed: false
       },
       {
         title: 'Porcentaje de triples',
         localValue: teamTotals[localTeamId].threePointsAttempted > 0 ? 
           Math.round((teamTotals[localTeamId].threePointsMade / teamTotals[localTeamId].threePointsAttempted) * 100) : 0,
         awayValue: teamTotals[awayTeamId].threePointsAttempted > 0 ? 
           Math.round((teamTotals[awayTeamId].threePointsMade / teamTotals[awayTeamId].threePointsAttempted) * 100) : 0,
         isReversed: false
       },
       {
         title: 'Tiros libres anotados',
        localValue: teamTotals[localTeamId].freeThrowsMade,
        awayValue: teamTotals[awayTeamId].freeThrowsMade,
        isReversed: false
      },
             {
         title: 'Tiros libres intentados',
         localValue: teamTotals[localTeamId].freeThrowsAttempted,
         awayValue: teamTotals[awayTeamId].freeThrowsAttempted,
         isReversed: false
       },
       {
         title: 'Porcentaje de tiros libres',
         localValue: teamTotals[localTeamId].freeThrowsAttempted > 0 ? 
           Math.round((teamTotals[localTeamId].freeThrowsMade / teamTotals[localTeamId].freeThrowsAttempted) * 100) : 0,
         awayValue: teamTotals[awayTeamId].freeThrowsAttempted > 0 ? 
           Math.round((teamTotals[awayTeamId].freeThrowsMade / teamTotals[awayTeamId].freeThrowsAttempted) * 100) : 0,
         isReversed: false
       },
       {
         title: 'Rebotes ofensivos',
        localValue: teamTotals[localTeamId].offensiveRebounds,
        awayValue: teamTotals[awayTeamId].offensiveRebounds,
        isReversed: false
      },
      {
        title: 'Rebotes defensivos',
        localValue: teamTotals[localTeamId].defensiveRebounds,
        awayValue: teamTotals[awayTeamId].defensiveRebounds,
        isReversed: false
      },
      {
        title: 'Rebotes totales',
        localValue: teamTotals[localTeamId].rebounds,
        awayValue: teamTotals[awayTeamId].rebounds,
        isReversed: false
      },
      {
        title: 'Asistencias',
        localValue: teamTotals[localTeamId].assists,
        awayValue: teamTotals[awayTeamId].assists,
        isReversed: false
      },
      {
        title: 'Faltas personales',
        localValue: teamTotals[localTeamId].personalFouls,
        awayValue: teamTotals[awayTeamId].personalFouls,
        isReversed: true // Lower is better for fouls
      },
      {
        title: 'Pérdidas',
        localValue: teamTotals[localTeamId].turnovers,
        awayValue: teamTotals[awayTeamId].turnovers,
        isReversed: true // Lower is better for turnovers
      },
      {
        title: 'Robos',
        localValue: teamTotals[localTeamId].steals,
        awayValue: teamTotals[awayTeamId].steals,
        isReversed: false
      },
      {
        title: 'Tapones',
        localValue: teamTotals[localTeamId].blockedShots,
        awayValue: teamTotals[awayTeamId].blockedShots,
        isReversed: false
      },
      {
        title: 'Eficiencia total',
        localValue: teamTotals[localTeamId].efficiency,
        awayValue: teamTotals[awayTeamId].efficiency,
        isReversed: false
      }
    ];

    statsToDisplay.forEach(stat => {
      const statElement = createComparisonStat(
        stat.title,
        localTeamName,
        awayTeamName,
        stat.localValue,
        stat.awayValue,
        stat.isReversed
      );
      
      // Wrap in Bootstrap column
      const colWrapper = document.createElement('div');
      colWrapper.className = 'col-12 col-lg-6'; // Full width on mobile, half on large screens
      colWrapper.appendChild(statElement);
      container.appendChild(colWrapper);
    });

  } catch (error) {
    console.error('Error rendering comparativas básica:', error);
    const container = document.getElementById('comparativas-basica-container');
    container.innerHTML = '<div class="alert alert-danger">Error cargando estadísticas básicas comparativas</div>';
  }
}

// Initialize when the DOM is loaded
document.addEventListener('DOMContentLoaded', renderComparativasBasica);
