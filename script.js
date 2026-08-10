const incomeList = document.getElementById('incomeList');
const addIncomeBtn = document.getElementById('addIncomeBtn');
const calculateBtn = document.getElementById('calculateBtn');
const copyToast = document.getElementById('copyToast');

let toastTimer;

// обработка ввода: только цифры, запятая, точка
function filterInput(event) {
  event.target.value = event.target.value.replace(/[^0-9.,]/g, '');
}

// подключаем фильтр ко всем текущим и будущим инпутам
incomeList.addEventListener('input', function (event) {
  if (event.target.classList.contains('income-input')) {
    filterInput(event);
  }
});

// формат чисел
function format(num) {
  return num.toLocaleString('uk-UA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).replace(/\s/g, ' ');
}

// превращаем содержимое инпута в число
function parseIncome(value) {
  return parseFloat(value.replace(',', '.')) || 0;
}

// добавить новый доход
function addIncome() {
  const wrapper = document.createElement('div');
  wrapper.className = 'input-wrapper';

  wrapper.innerHTML = `
    <input
      class="input income-input"
      type="text"
      placeholder="Дохід"
      inputmode="decimal"
      pattern="[0-9]*"
    />
    <span class="input-suffix">грн.</span>
  `;

  incomeList.appendChild(wrapper);

  const newInput = wrapper.querySelector('.income-input');
  newInput.focus();
}

addIncomeBtn.addEventListener('click', addIncome);

// функция расчёта
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

  const results = document.getElementById('results');

  results.classList.remove('hidden');

  requestAnimationFrame(() => {
    results.classList.add('visible');
  });
}

calculateBtn.addEventListener('click', calculate);

// toast после копирования
function showCopyToast() {
  clearTimeout(toastTimer);

  copyToast.classList.add('visible');

  toastTimer = setTimeout(() => {
    copyToast.classList.remove('visible');
  }, 1800);
}

// копирование нетто
async function copyNetto() {
  const displayed = document.getElementById('nettoAmount').textContent;

  // убираем разделители тысяч
  // запятую сохраняем только как десятичный разделитель
  let clean = displayed
    .replace(/[\s  ]/g, '')
    .replace('.', ',');

  // если копеек нет — копируем только целую сумму
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

// разворачивание / сворачивание налогов
function toggleTaxes() {
  const taxDetails = document.getElementById('taxDetails');
  const arrow = document.getElementById('arrow');

  const isOpen = taxDetails.classList.contains('open');

  if (isOpen) {
    taxDetails.style.maxHeight =
      taxDetails.scrollHeight + 'px';

    requestAnimationFrame(() => {
      taxDetails.style.maxHeight = '0';
    });

    setTimeout(() => {
      taxDetails.classList.remove('open');
      taxDetails.style.maxHeight = '';
    }, 300);
  } else {
    taxDetails.classList.add('open');

    taxDetails.style.maxHeight =
      taxDetails.scrollHeight + 'px';

    setTimeout(() => {
      taxDetails.style.maxHeight = '';
    }, 300);
  }

  arrow.classList.toggle('rotated');
}

// Enter = посчитать
document.addEventListener('keydown', function (event) {
  if (event.key === 'Enter') {
    event.preventDefault();
    calculate();
  }
});
