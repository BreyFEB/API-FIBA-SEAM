import { calculateAdvancedMetrics } from './avanzado.js';
import { calculateFourFactors } from './fourFactors.js';

function createComparisonStat(statTitle, localTeamName, awayTeamName, localValue, awayValue, isReversed = false) {
  const template = document.getElementById('comparativa-stat-template');
  const clone = template.content.cloneNode(true);

  // Set the stat title
  clone.querySelector('.stat-title').textContent = statTitle;

  // Get the team stat elements
  const teamStats = clone.querySelectorAll('.team-stat');
  const localTeamStat = teamStats[0];
  const awayTeamStat = teamStats[1];

  // Extract numeric values for bar width calculation (remove % if present)
  const localNumValue = typeof localValue === 'string' ? parseFloat(localValue.replace('%', '')) : localValue;
  const awayNumValue = typeof awayValue === 'string' ? parseFloat(awayValue.replace('%', '')) : awayValue;
  
  // Calculate percentages for bar widths using numeric values
  const maxValue = Math.max(localNumValue, awayNumValue);
  const localPercentage = maxValue > 0 ? (localNumValue / maxValue) * 100 : 0;
  const awayPercentage = maxValue > 0 ? (awayNumValue / maxValue) * 100 : 0;

  // Set local team data
  localTeamStat.querySelector('.team-name').textContent = localTeamName;
  const localValueElement = localTeamStat.querySelector('.stat-value');
  localValueElement.textContent = localValue;
  const localBar = localTeamStat.querySelector('.stat-bar');
  localBar.style.width = `${localPercentage}%`;
  localBar.className = 'stat-bar stat-bar-local';

  // Set away team data
  awayTeamStat.querySelector('.team-name').textContent = awayTeamName;
  const awayValueElement = awayTeamStat.querySelector('.stat-value');
  awayValueElement.textContent = awayValue;
  const awayBar = awayTeamStat.querySelector('.stat-bar');
  awayBar.style.width = `${awayPercentage}%`;
  awayBar.className = 'stat-bar stat-bar-away';

  // Style the team with better values (considering if stat is reversed)
  let localIsBetter, awayIsBetter;
  
  if (isReversed) {
    // For stats where lower is better (e.g., turnovers)
    localIsBetter = localNumValue < awayNumValue;
    awayIsBetter = awayNumValue < localNumValue;
  } else {
    // For most stats, higher is better
    localIsBetter = localNumValue > awayNumValue;
    awayIsBetter = awayNumValue > localNumValue;
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

async function renderComparativas() {
  try {
    const { metrics, teamNames, localTeamId, awayTeamId } = await calculateAdvancedMetrics();
    const { fourFactors, localTeamName: ffLocalTeamName, awayTeamName: ffAwayTeamName } = await calculateFourFactors();
    
    const container = document.getElementById('comparativas-container');
    container.innerHTML = ''; // Clear existing content
    container.className = 'row g-3'; // Bootstrap grid with gap

    const localTeamName = teamNames[localTeamId];
    const awayTeamName = teamNames[awayTeamId];

    const statsToDisplay = [
      {
        title: 'Puntos al contraataque',
        localValue: metrics[localTeamId].puntosContraataque,
        awayValue: metrics[awayTeamId].puntosContraataque
      },
      {
        title: 'Puntos de segunda oportunidad',
        localValue: metrics[localTeamId].puntosSegundaOportunidad,
        awayValue: metrics[awayTeamId].puntosSegundaOportunidad
      },
      {
        title: 'Puntos tras pérdida',
        localValue: metrics[localTeamId].puntosTrasPerdida,
        awayValue: metrics[awayTeamId].puntosTrasPerdida
      },
      {
        title: 'Puntos del banquillo',
        localValue: metrics[localTeamId].puntosBanquillo,
        awayValue: metrics[awayTeamId].puntosBanquillo
      }
    ];

    statsToDisplay.forEach(stat => {
      const statElement = createComparisonStat(
        stat.title,
        localTeamName,
        awayTeamName,
        stat.localValue,
        stat.awayValue
      );
      
      // Wrap in Bootstrap column
      const colWrapper = document.createElement('div');
      colWrapper.className = 'col-12 col-lg-6'; // Full width on mobile, half on large screens
      colWrapper.appendChild(statElement);
      container.appendChild(colWrapper);
    });

    // Add Four Factors section
    const fourFactorsSection = document.createElement('div');
    fourFactorsSection.className = 'col-12 mt-4';
    fourFactorsSection.innerHTML = `
      <h4 class="text-center mb-3">Four Factors</h4>
      <div class="text-center mb-3">
        <button type="button" class="btn btn-outline-secondary btn-sm" data-bs-toggle="modal" data-bs-target="#fourFactorsGlossaryModal">
          <i class="bi bi-question-circle me-1"></i>¿Qué significan estas estadísticas?
        </button>
      </div>
      <hr class="mb-4" style="opacity: 0.3;">
      <div class="row g-3" id="four-factors-container"></div>
    `;
    container.appendChild(fourFactorsSection);

    // Add Four Factors stats
    const fourFactorsContainer = document.getElementById('four-factors-container');
    const fourFactorsStats = [
      {
        title: 'Porcentaje de tiro efectivo',
        localValue: fourFactors[ffLocalTeamName].efg,
        awayValue: fourFactors[ffAwayTeamName].efg,
        isReversed: false
      },
      {
        title: 'Porcentaje de pérdidas',
        localValue: fourFactors[ffLocalTeamName].tovPercentage,
        awayValue: fourFactors[ffAwayTeamName].tovPercentage,
        isReversed: true // Lower is better for turnovers
      },
      {
        title: 'Porcentaje de rebotes ofensivos capturados',
        localValue: fourFactors[ffLocalTeamName].rebPercentage,
        awayValue: fourFactors[ffAwayTeamName].rebPercentage,
        isReversed: false
      },
      {
        title: 'Factor de tiros libres',
        localValue: fourFactors[ffLocalTeamName].ftf,
        awayValue: fourFactors[ffAwayTeamName].ftf,
        isReversed: false
      }
    ];

    fourFactorsStats.forEach(stat => {
      // Add % sign to percentage values
      const localDisplayValue = stat.title.includes('Porcentaje') || stat.title.includes('Factor') ? `${stat.localValue}%` : stat.localValue;
      const awayDisplayValue = stat.title.includes('Porcentaje') || stat.title.includes('Factor') ? `${stat.awayValue}%` : stat.awayValue;
      
      const statElement = createComparisonStat(
        stat.title,
        ffLocalTeamName,
        ffAwayTeamName,
        localDisplayValue,
        awayDisplayValue,
        stat.isReversed
      );
      
      // Wrap in Bootstrap column
      const colWrapper = document.createElement('div');
      colWrapper.className = 'col-12 col-lg-6'; // Full width on mobile, half on large screens
      colWrapper.appendChild(statElement);
      fourFactorsContainer.appendChild(colWrapper);
    });

  } catch (error) {
    console.error('Error rendering comparativas:', error);
    const container = document.getElementById('comparativas-container');
    container.innerHTML = '<div class="alert alert-danger">Error cargando estadísticas comparativas</div>';
  }
}

// Initialize when the DOM is loaded
document.addEventListener('DOMContentLoaded', renderComparativas);
