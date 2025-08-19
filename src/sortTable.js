// sortTable.js
/**
 * Attach sorting to a table with data-sort-key ths.
 * @param {HTMLTableElement} table
 * @param {Object} options - { 
 *   defaultSort: { key, order: 'desc' | 'asc' },
 *   customCompare?: (rowA, rowB, key, order) => number | null 
 * }
 */
export function attachTableSort(table, options = {}) {
  const ths = table.querySelectorAll('th[data-sort-key]');
  const tbody = table.querySelector('tbody');
  if (!tbody) return;

  let currentSort = { key: options.defaultSort?.key || null, order: options.defaultSort?.order || 'desc', clickCount: 2 };

  ths.forEach(th => {
    th.style.cursor = 'pointer';
    th.addEventListener('click', () => {
      const key = th.getAttribute('data-sort-key');
      // Cycle: desc -> asc -> default
      if (currentSort.key === key) {
        currentSort.clickCount = (currentSort.clickCount + 1) % 3;
      } else {
        currentSort = { key, order: 'desc', clickCount: 0 };
      }

      if (currentSort.clickCount === 2) {
        // Default sort
        doDefaultSort();
        // After default, next click on same column should start at desc again
        currentSort = { key: options.defaultSort?.key || null, order: options.defaultSort?.order || 'desc', clickCount: 2 };
        return;
      }

      // Sort by selected column
      const order = currentSort.clickCount === 0 ? 'desc' : 'asc';
      sortByKey(key, order);
      setSortIndicators(key, order);
    });
  });

  // Initial default sort on load
  if (options.defaultSort?.key) {
    doDefaultSort();
    // Keep state such that next click on default column yields desc
    currentSort = { key: options.defaultSort.key, order: options.defaultSort.order || 'desc', clickCount: 2 };
  }

  function sortByKey(key, order) {
    const rows = Array.from(tbody.rows);
    const idx = Array.from(ths).findIndex(th => th.getAttribute('data-sort-key') === key);
    rows.sort((a, b) => {
      // Try custom compare first if provided
      if (options.customCompare) {
        const customResult = options.customCompare(a, b, key, order);
        if (customResult !== null) return customResult;
      }
      // Default comparison
      return compareCells(a.cells[idx], b.cells[idx], order);
    });
    tbody.innerHTML = '';
    rows.forEach(row => tbody.appendChild(row));
  }

  function doDefaultSort() {
    const defKey = options.defaultSort?.key;
    const defOrder = options.defaultSort?.order || 'desc';
    sortByKey(defKey, defOrder);
    // Default state should show no indicator
    setSortIndicators();
  }

  function compareCells(aCell, bCell, order) {
    // First try data-raw-value if available
    const aRaw = aCell?.getAttribute('data-raw-value');
    const bRaw = bCell?.getAttribute('data-raw-value');
    if (aRaw !== null && bRaw !== null) {
      const aNum = Number(aRaw);
      const bNum = Number(bRaw);
      if (!Number.isNaN(aNum) && !Number.isNaN(bNum)) {
        return order === 'desc' ? bNum - aNum : aNum - bNum;
      }
    }

    // Fallback to text content
    const aValRaw = (aCell?.textContent || '').trim();
    const bValRaw = (bCell?.textContent || '').trim();
    const aNum = Number(aValRaw);
    const bNum = Number(bValRaw);
    let cmp;
    if (!Number.isNaN(aNum) && !Number.isNaN(bNum)) {
      cmp = aNum - bNum;
    } else {
      cmp = String(aValRaw).localeCompare(String(bValRaw));
    }
    return order === 'desc' ? -cmp : cmp;
  }

  function setSortIndicators(activeKey, order) {
    ths.forEach(th => {
      th.classList.remove('table-sort-desc', 'table-sort-asc');
      if (activeKey && th.getAttribute('data-sort-key') === activeKey) {
        if (order === 'desc') th.classList.add('table-sort-desc');
        else if (order === 'asc') th.classList.add('table-sort-asc');
      }
    });
  }
}
