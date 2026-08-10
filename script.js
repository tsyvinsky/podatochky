const incomeList = document.getElementById('incomeList');
const addIncomeBtn = document.getElementById('addIncomeBtn');
const calculateBtn = document.getElementById('calculateBtn');
const copyToast = document.getElementById('copyToast');

let toastTimer;

// === Ввод ===

// оставляем только цифры, точку и запятую
function filterInput(event) {
  event.target.value = event.target.value.replace(/[^0-9.,]/g, '');
}

// работает для первого и всех динамически добавленных инпутов
incomeList.addEventListener('input', function (event) {
  if (event.target.classList.contains('income-input')) {
    filterInput(event);
  }
});

// === Форматирование ===

function format(num) {
  return num.toLocaleString('uk-UA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).replace(/\s/g, ' ');
}

function parseIncome(value) {
  return parseFloat(value.replace(',', '.')) || 0;
}

// === Добавление дохода ===

function addIncome() {
  const row = document.createElement('div');
  row.className = 'income-row';

  row.innerHTML = `
    <div class="input-wrapper">
      <input
        class="input income-input"
        type="text"
        placeholder="Дохід"
        inputmode="decimal"
      />

      <span class="input-suffix">грн.</span>
    </div>

    <button
      class="remove-income"
      type="button"
      aria-label="Видалити дохід"
    >
      <svg
        viewBox="0 0 20 20"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M5 5L15 15M15 5L5 15"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
        />
      </svg>
    </button>
  `;

  incomeList.appendChild(row);

  // сразу ставим курсор в новый инпут
  row.querySelector('.income-input').focus();
}

addIncomeBtn.addEventListener('click', addIncome);

// === Удаление дополнительного дохода ===

incomeList.addEventListener('click', function (event) {
  const removeButton = event.target.closest('.remove-income');

  if (!removeButton) return;

  const row = removeButton.closest('.income-row');

  if (row) {
    row.remove();
  }
});

// === Расчёт ===

function calculate() {
  const incomeInputs = document.querySelectorAll('.income-input');

  const total = Array.from(incomeInputs).reduce((sum, input) => {
    return sum + parseIncome(input.value);
  }, 0);

  const tax5 = total * 0.05;
  const tax1 = total * 0.01;

  const esv = 1902.34;

  const taxTotal = tax5 + tax1 + esv;
  const netto = total - taxTotal;

  document.getElementById('bruttoAmount').textContent =
    `${format(total)} грн.`;

  document.getElementById('singleTax').textContent =
    `${format(tax5)} грн.`;

  document.getElementById('military').textContent =
    `${format(tax1)} грн.`;

  document.getElementById('esv').textContent =
    `${format(esv)} грн.`;

  document.getElementById('taxTotal').textContent =
    `${format(taxTotal)} грн.`;

  document.getElementById('nettoAmount').textContent =
    format(netto);

  // плавное появление результатов
  const results = document.getElementById('results');

  results.classList.remove('hidden');

  requestAnimationFrame(() => {
    results.classList.add('visible');
  });
}

calculateBtn.addEventListener('click', calculate);

// === Enter = Порахувати ===

document.addEventListener('keydown', function (event) {
  if (event.key === 'Enter') {
    event.preventDefault();
    calculate();
  }
});

// === Toast ===

function showCopyToast() {
  clearTimeout(toastTimer);

  copyToast.classList.add('visible');

  toastTimer = setTimeout(() => {
    copyToast.classList.remove('visible');
  }, 1800);
}

// === Копирование нетто ===

async function copyNetto() {
  const displayed =
    document.getElementById('nettoAmount').textContent;

  let clean = displayed
    .replace(/\s/g, '')
    .replace('.', ',');

  // если копеек нет:
  // 50 000,00 → 50000
  if (clean.endsWith(',00')) {
    clean = clean.slice(0, -3);
  }

  try {
    await navigator.clipboard.writeText(clean);
    showCopyToast();
  } catch (error) {
    console.error('Не вдалося скопіювати суму:', error);
  }
}

// === Податки ===

function toggleTaxes() {
  const taxDetails = document.getElementById('taxDetails');
  const arrow = document.getElementById('arrow');

  const isOpen = taxDetails.classList.contains('open');

  if (isOpen) {
    // фиксируем фактическую высоту
    taxDetails.style.maxHeight =
      taxDetails.scrollHeight + 'px';

    // схлопываем на следующем кадре
    requestAnimationFrame(() => {
      taxDetails.style.maxHeight = '0';
    });

    // после завершения анимации очищаем состояние
    setTimeout(() => {
      taxDetails.classList.remove('open');
      taxDetails.style.maxHeight = '';
    }, 300);

  } else {
    taxDetails.classList.add('open');

    taxDetails.style.maxHeight =
      taxDetails.scrollHeight + 'px';

    // после открытия убираем жёсткую высоту,
    // чтобы блок нормально реагировал на resize
    setTimeout(() => {
      taxDetails.style.maxHeight = '';
    }, 300);
  }

  arrow.classList.toggle('rotated');
}
