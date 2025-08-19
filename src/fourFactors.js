// Calculate teams' four factors stats and make function exportable
import { loadJSON } from './dataLoader.js';

async function calculateFourFactors() {
  const boxscoreData = await loadJSON('data/boxscore.json');

  let localTeamName = undefined;
  let awayTeamName = undefined;

  for (const boxscoreEntry of boxscoreData) {
    const currentTeamName = boxscoreEntry.team.officialName;
    if (localTeamName !== undefined && awayTeamName !== undefined) break;
    if (localTeamName === undefined && awayTeamName === undefined) {
      localTeamName = currentTeamName;
    } else if (localTeamName !== undefined && awayTeamName === undefined && currentTeamName !== localTeamName) {
      awayTeamName = currentTeamName;
    }
  }
  
  // Initialize team totals for calculations
  const teamTotals = {
    [localTeamName]: {
      fieldGoalsMade: 0,
      fieldGoalsAttempted: 0,
      threePointsMade: 0,
      freeThrowsMade: 0,
      freeThrowsAttempted: 0,
      turnovers: 0,
      offensiveRebounds: 0,
      defensiveRebounds: 0
    },
    [awayTeamName]: {
      fieldGoalsMade: 0,
      fieldGoalsAttempted: 0,
      threePointsMade: 0,
      freeThrowsMade: 0,
      freeThrowsAttempted: 0,
      turnovers: 0,
      offensiveRebounds: 0,
      defensiveRebounds: 0
    }
  };

  // Sum up stats for each team
  boxscoreData.forEach(player => {
    const teamName = player.team.officialName;
    if (!teamTotals[teamName]) return;

    teamTotals[teamName].fieldGoalsMade += player.fieldGoalsMade || 0;
    teamTotals[teamName].fieldGoalsAttempted += player.fieldGoalsAttempted || 0;
    teamTotals[teamName].threePointsMade += player.threePointsMade || 0;
    teamTotals[teamName].freeThrowsMade += player.freeThrowsMade || 0;
    teamTotals[teamName].freeThrowsAttempted += player.freeThrowsAttempted || 0;
    teamTotals[teamName].turnovers += player.turnovers || 0;
    teamTotals[teamName].offensiveRebounds += player.offensiveRebounds || 0;
    teamTotals[teamName].defensiveRebounds += player.defensiveRebounds || 0;
  });

  // Calculate four factors
  const fourFactors = {
    [localTeamName]: {
      efg: 0,
      tovPercentage: 0,
      rebPercentage: 0,
      ftf: 0
    },
    [awayTeamName]: {
      efg: 0,
      tovPercentage: 0,
      rebPercentage: 0,
      ftf: 0
    }
  };

  // Calculate for each team
  [localTeamName, awayTeamName].forEach(teamName => {
    const team = teamTotals[teamName];
    const opponent = teamTotals[teamName === localTeamName ? awayTeamName : localTeamName];
    
    // EFG: (FG made + 0.5 * 3P made) / FGA
    if (team.fieldGoalsAttempted > 0) {
      fourFactors[teamName].efg = Math.round(((team.fieldGoalsMade + 0.5 * team.threePointsMade) / team.fieldGoalsAttempted) * 100);
    }
    
    // TOV%: TOV / (FGA + 0.44 * FTA + TOV)
    const possessions = team.fieldGoalsAttempted + 0.44 * team.freeThrowsAttempted + team.turnovers;
    if (possessions > 0) {
      fourFactors[teamName].tovPercentage = Math.round((team.turnovers / possessions) * 100);
    }
    
    // REB%: ORB / (ORB + opponent DRB)
    const totalRebounds = team.offensiveRebounds + opponent.defensiveRebounds;
    if (totalRebounds > 0) {
      fourFactors[teamName].rebPercentage = Math.round((team.offensiveRebounds / totalRebounds) * 100);
    }
    
    // FTF: FT made / FGA
    if (team.fieldGoalsAttempted > 0) {
      fourFactors[teamName].ftf = Math.round((team.freeThrowsMade / team.fieldGoalsAttempted) * 100);
    }
  });

  return { fourFactors, localTeamName, awayTeamName };
}

// Export the function for use in other modules
export { calculateFourFactors };
