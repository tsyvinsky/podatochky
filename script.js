// обработка ввода: только цифры, запятая, точка
function filterInput(event) {
  const val = event.target.value;
  event.target.value = val.replace(/[^0-9.,]/g, '');
}
document.getElementById('income1').addEventListener('input', filterInput);
document.getElementById('income2').addEventListener('input', filterInput);

// формат чисел: 123456.78 → 123 456.78
function format(num) {
  return num.toLocaleString('uk-UA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).replace(/\s/g, ' '); // неразрывный тонкий пробел
}

// функция расчета
function calculate() {
  const income1 = parseFloat(document.getElementById('income1').value.replace(',', '.')) || 0;
  const income2 = parseFloat(document.getElementById('income2').value.replace(',', '.')) || 0;
  const total = income1 + income2;

  const tax5 = total * 0.05;
  const tax1 = total * 0.01;
  const esv = 1760;
  const taxTotal = tax5 + tax1 + esv;
  const netto = total - taxTotal;

  document.getElementById('bruttoAmount').textContent = `${format(total)} грн`;
  document.getElementById('singleTax').textContent = `${format(tax5)} грн`;
  document.getElementById('military').textContent = `${format(tax1)} грн`;
  document.getElementById('esv').textContent = `${format(esv)} грн`;
  document.getElementById('taxTotal').textContent = `${format(taxTotal)} грн`;
  document.getElementById('nettoAmount').textContent = format(netto);

  // плавное появление блока результатов
  const results = document.getElementById('results');
  results.classList.remove('hidden');
  requestAnimationFrame(() => {
    results.classList.add('visible');
  });
}

// клик по кнопке
document.getElementById('calculateBtn').addEventListener('click', calculate);

// срабатывание по Enter
document.addEventListener('keydown', function (event) {
  if (event.key === 'Enter') {
    event.preventDefault();
    calculate();
  }
});

// копирование нетто по клику
function copyNetto() {
  const text = document.getElementById('nettoAmount').textContent.replace(/ /g, '');
  navigator.clipboard.writeText(text);
}

// разворачивание/сворачивание податків с плавной анимацией
function toggleTaxes() {
  const taxDetails = document.getElementById('taxDetails');
  const arrow = document.getElementById('arrow');
  const isOpen = taxDetails.classList.contains('open');

  if (isOpen) {
    // фиксируем текущую высоту
    taxDetails.style.maxHeight = taxDetails.scrollHeight + 'px';

    // запускаем анимацию схлопывания
    requestAnimationFrame(() => {
      taxDetails.style.maxHeight = '0';
    });

    // удаляем классы и очищаем maxHeight после анимации
    setTimeout(() => {
      taxDetails.classList.remove('open');
      taxDetails.style.maxHeight = '';
    }, 300);
  } else {
    // раскрытие
    taxDetails.classList.add('open');
    taxDetails.style.maxHeight = taxDetails.scrollHeight + 'px';

    // после завершения анимации — очищаем, чтобы не мешало resize
    setTimeout(() => {
      taxDetails.style.maxHeight = '';
    }, 300);
  }

  arrow.classList.toggle('rotated');
}