import { loadJSON } from './dataLoader.js';

// Revisar lógica de cáclculo, no cuadra con FIBA
async function calculateAdvancedMetrics() {
  const playByPlayData = await loadJSON('data/playbyplay.json');
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

  console.log(localTeamId, awayTeamId);

  const metrics = {
    [localTeamId]: {
        puntosContraataque: 0,
        puntosSegundaOportunidad: 0,
        puntosTrasPerdida: 0,
        puntosBanquillo: 0 
    },
    [awayTeamId]: {
        puntosContraataque: 0,
        puntosSegundaOportunidad: 0,
        puntosTrasPerdida: 0,
        puntosBanquillo: 0 
    }
  };



  // Get all quarters in case there is an extra time
  let quarters = [...Object.keys(playByPlayData.GameActions)];

  // Calculate Puntos al Contraataque, Puntos de Segunda Oportunidad, Puntos Tras Pérdida
  for (const quarter of quarters) {
    for (const pbpEvent of playByPlayData.GameActions[quarter].Items) {
      // Skip event/iteration of loop if it's not a made shot
      const shotTypes = ['P2', 'P3', 'FT']
      if (!shotTypes.includes(pbpEvent.AC)) continue;
      const madeShot = pbpEvent.SU === '+';
      if (!madeShot) continue;

      // Check which team the pbpEvent belongs to
      const pbpCurrentTeam = pbpEvent.T1

      // Define shot types and their point values
      const shotConfig = {
        'P2': { points: 2, zField: 'Z2' },
        'P3': { points: 3, zField: 'Z2' },
        'FT': { points: 1, zField: 'Z3' }
      };

      // Define Z field mappings to metric types
      const zMappings = {
        'FB': ['puntosContraataque'],
        'SC': ['puntosSegundaOportunidad'],
        'TO': ['puntosTrasPerdida'],
        'SF': ['puntosContraataque', 'puntosSegundaOportunidad'],
        'ST': ['puntosTrasPerdida', 'puntosSegundaOportunidad'],
        'FT': ['puntosTrasPerdida', 'puntosContraataque'],
        'AL': ['puntosTrasPerdida', 'puntosContraataque', 'puntosSegundaOportunidad']
      };

      // Process the shot based on its type
      const shotType = pbpEvent.AC;
      if (shotConfig[shotType]) {
        const config = shotConfig[shotType];
        const zValue = pbpEvent[config.zField];
        
        if (zMappings[zValue]) {
          zMappings[zValue].forEach(metricType => {
            metrics[pbpCurrentTeam][metricType] += config.points;
          });
        }
      }
    }
  }

  // Calculate Puntos del Banquillo
  boxscoreData.forEach(player => {
    const teamId = 'T_' + String(player.team.organisationId);
    const playerObj = player.player;
    if (playerObj === null) return;
    
    // Comprobar que es jugador de banquillo y añadir los puntos
    if (!player.isStarter) {
      metrics[teamId].puntosBanquillo += player.points;
    }
  });

  // Get team names
  const teamNames = {};
  boxscoreData.forEach(player => {
    const teamId = 'T_' + String(player.team.organisationId);
    if (!teamNames[teamId]) {
      teamNames[teamId] = player.team.officialName;
    }
  });

  return { metrics, teamNames, localTeamId, awayTeamId };
}

// Export the function for use in other modules
export { calculateAdvancedMetrics };

// For console logging when this file is loaded directly
async function logMetrics() {
  const result = await calculateAdvancedMetrics();
  console.log(result.metrics);
}

logMetrics();
