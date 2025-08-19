import { loadJSON } from './dataLoader.js';

// Function to update game summary with dynamic data
async function updateGameSummary() {
  try {
    const boxscoreData = await loadJSON('data/boxscore.json');
    
    // Get team data
    let localTeam = null;
    let awayTeam = null;
    let localScore = 0;
    let awayScore = 0;
    
    // Process boxscore data to get team info and calculate scores
    boxscoreData.forEach(player => {
      const teamId = 'T_' + String(player.team.organisationId);
      const teamInfo = {
        id: teamId,
        name: player.team.officialName,
        organisationId: player.team.organisationId
      };
      
      if (!localTeam) {
        localTeam = teamInfo;
      } else if (localTeam.id !== teamId && !awayTeam) {
        awayTeam = teamInfo;
      }
      
      // Add player points to team score
      if (localTeam && teamId === localTeam.id) {
        localScore += player.points || 0;
      } else if (awayTeam && teamId === awayTeam.id) {
        awayScore += player.points || 0;
      }
    });
    
    // Update team names
    if (localTeam) {
      const localTeamNameElement = document.querySelector('.main-local-teamname');
      if (localTeamNameElement) {
        localTeamNameElement.textContent = localTeam.name;
      }
    }
    
    if (awayTeam) {
      const awayTeamNameElement = document.querySelector('.main-away-teamname');
      if (awayTeamNameElement) {
        awayTeamNameElement.textContent = awayTeam.name;
      }
    }
    
    // Update scores
    const localScoreElement = document.querySelector('.main-local-team-score');
    const awayScoreElement = document.querySelector('.main-away-team-score');
    
    if (localScoreElement) {
      localScoreElement.textContent = localScore;
    }
    
    if (awayScoreElement) {
      awayScoreElement.textContent = awayScore;
    }
    
  } catch (error) {
    console.error('Error updating game summary:', error);
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  // Update game summary with dynamic data
  await updateGameSummary();
    const navBar = document.getElementById('main-tabs');

    navBar.addEventListener('click', function(event) {
      const link = event.target.closest('a.nav-link');
      if (!link) return;
      event.preventDefault();
      if (link.classList.contains('active')) return;

      // Toggle active
      navBar.querySelectorAll('a.nav-link.active').forEach(a => a.classList.remove('active'));
      link.classList.add('active');

      // Show selected section, hide others
      const targetId = link.getAttribute('data-section');
      document.querySelectorAll('[id^="section-"]').forEach(sec => {
        if (sec.id === targetId) sec.classList.remove('d-none');
        else sec.classList.add('d-none');
      });
    });

    // Highlight the winning team in the game score
    const teamAScore = document.querySelector('span.main-local-team-score');
    const teamBScore = document.querySelector('span.main-away-team-score');
    
    const teamAScoreNumber = Number(teamAScore.textContent);
    const teamBScoreNumber = Number(teamBScore.textContent);
    
    if (teamAScoreNumber > teamBScoreNumber) {
      teamAScore.classList.add('fw-bold', 'text-success');
    } else if (teamBScoreNumber > teamAScoreNumber) {
      teamBScore.classList.add('fw-bold', 'text-success');
    }

});