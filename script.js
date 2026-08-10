/*
 * Czech 2026 planning assumptions (ordinary OSVČ, main activity, full year):
 * Monthly planning model: the current month's income/profit is multiplied by 12.
 * - Health: annual premium = 13.5% × max(50% of annual tax profit,
 *   24,483.50 CZK × 12). 2026 minimum advance: 3,306 CZK/month.
 * - Social: annual premium = 29.2% × max(55% of annual tax profit,
 *   19,587 CZK × active months), capped at the 2,350,416 CZK annual base.
 *   2026 standard minimum advance: 5,720 CZK/month.
 * - 60% trade-expense lump sum is capped at 1,200,000 CZK expenses/year.
 * - Income tax: 15% up to the 2026 threshold of 1,762,812 CZK, 23% above it,
 *   less the basic annual taxpayer credit of 30,840 CZK.
 * - Not modeled: secondary activity, new-OSVČ relief/minimum, pensioner discount,
 *   sickness insurance, partial-year exceptions, tax on income, VAT, or paušální režim.
 * Sources: VZP, ČSSZ and Finanční správa (links are in README.md).
 */

const CZ_2026 = Object.freeze({
  healthRate: 0.135,
  healthProfitShare: 0.50,
  healthMinMonthly: 3306,
  socialRate: 0.292,
  socialProfitShare: 0.55,
  socialMinMonthly: 5720,
  socialMaxAnnualBase: 2350416,
  pausalRate: 0.60,
  pausalExpenseCap: 1200000,
  incomeTaxRate: 0.15,
  incomeTaxHigherRate: 0.23,
  incomeTaxHigherThreshold: 1762812,
  taxpayerCreditAnnual: 30840
});

const $ = (id) => document.getElementById(id);
const state = { country: 'ua', expenseMode: 'pausal', toastTimer: null };

function parseNumber(value) {
  const cleaned = String(value ?? '').replace(/\s/g, '').replace(',', '.').replace(/[^0-9.-]/g, '');
  return Math.max(0, Number.parseFloat(cleaned) || 0);
}

function formatMoney(value, locale = 'cs-CZ', digits = 0) {
  return Math.ceil(value).toLocaleString(locale, { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

function filterDecimalInput(event) {
  if (event.target.matches('input[inputmode="decimal"]')) event.target.value = event.target.value.replace(/[^0-9.,\s]/g, '');
}

document.addEventListener('input', filterDecimalInput);

function showToast(text) {
  clearTimeout(state.toastTimer);
  $('copyToast').textContent = text;
  $('copyToast').classList.add('visible');
  state.toastTimer = setTimeout(() => $('copyToast').classList.remove('visible'), 1800);
}

async function copyText(text, message) {
  try { await navigator.clipboard.writeText(text.replace(/\s/g, '')); showToast(message); }
  catch { showToast('Не вдалося скопіювати'); }
}

function switchCountry(country) {
  state.country = country;
  const isUa = country === 'ua';
  $('uaPanel').classList.toggle('hidden', !isUa);
  $('czPanel').classList.toggle('hidden', isUa);
  $('eyebrow').textContent = isUa ? 'Податки · Україна' : 'Страхові внески · Чехія · 2026';
  $('title').textContent = isUa ? 'Порахуємо, скільки цього місяця ти винен державі😉' : 'Скільки відкласти на податки';
  $('subtitle').textContent = 'Введи дохід за цей місяць — порахуємо рекомендовані внески OSVČ.';
  $('subtitle').classList.toggle('hidden', isUa);
  document.documentElement.lang = isUa ? 'uk' : 'cs';
}

$('countrySelect').addEventListener('change', (event) => switchCountry(event.target.value));

function addUaIncome() {
  const row = document.createElement('div');
  row.className = 'income-row';
  row.innerHTML = '<span class="input-wrapper"><input class="input income-input" type="text" placeholder="Дохід" inputmode="decimal"><span class="input-suffix">грн.</span></span><button class="remove-income" type="button" aria-label="Видалити дохід"><svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M5 5L15 15M15 5L5 15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button>';
  $('uaIncomeList').appendChild(row);
  row.querySelector('input').focus();
}

$('addUaIncome').addEventListener('click', addUaIncome);
$('uaIncomeList').addEventListener('click', (event) => event.target.closest('.remove-income')?.closest('.income-row')?.remove());

function calculateUa() {
  const total = [...document.querySelectorAll('#uaIncomeList .income-input')].reduce((sum, input) => sum + parseNumber(input.value), 0);
  const singleTax = total * 0.05;
  const military = total * 0.01;
  const esv = 1902.34;
  const taxTotal = singleTax + military + esv;
  const net = total - taxTotal;
  const fmt = (n) => `${n.toLocaleString('uk-UA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} грн.`;
  $('uaGross').textContent = fmt(total);
  $('uaSingleTax').textContent = fmt(singleTax);
  $('uaMilitary').textContent = fmt(military);
  $('uaEsv').textContent = fmt(esv);
  $('uaTaxTotal').textContent = fmt(taxTotal);
  $('uaNet').textContent = net.toLocaleString('uk-UA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  $('uaResults').classList.remove('hidden');
}

$('calculateUa').addEventListener('click', calculateUa);
$('copyUaNet').addEventListener('click', () => copyText($('uaNet').textContent, 'Загальну суму скопійовано'));

document.querySelectorAll('[data-expense-mode]').forEach((tab) => tab.addEventListener('click', () => {
  state.expenseMode = tab.dataset.expenseMode;
  document.querySelectorAll('[data-expense-mode]').forEach((item) => {
    const active = item === tab;
    item.classList.toggle('active', active);
    item.setAttribute('aria-selected', String(active));
  });
  $('actualExpensesField').classList.toggle('hidden', state.expenseMode !== 'actual');
}));

function syncCurrency() {
  const suffix = $('currencySelect').value === 'USD' ? '$' : 'Kč';
  $('czIncomeSuffix').textContent = suffix;
}

$('currencySelect').addEventListener('change', syncCurrency);

function removeIconSvg() {
  return '<svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M5 5L15 15M15 5L5 15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
}

function addCzExpense() {
  const row = document.createElement('div');
  row.className = 'expense-row';
  row.innerHTML = `
    <input class="input expense-input no-suffix" type="text" inputmode="decimal" placeholder="0" aria-label="Сума витрати">
    <span class="select-wrap expense-currency-wrap">
      <select class="control-select expense-currency" aria-label="Валюта витрати">
        <option value="CZK">CZK</option>
        <option value="USD">USD</option>
      </select>
    </span>
    <button class="remove-expense" type="button" aria-label="Видалити витрату">${removeIconSvg()}</button>`;
  $('czExpenseList').appendChild(row);
  row.querySelector('.expense-input').focus();
}

$('addCzExpense').addEventListener('click', addCzExpense);
$('czExpenseList').addEventListener('click', (event) => event.target.closest('.remove-expense')?.closest('.expense-row')?.remove());

function getMonthlyActualExpensesCzk(usdRate) {
  return [...document.querySelectorAll('#czExpenseList .expense-row')].reduce((sum, row) => {
    const amount = parseNumber(row.querySelector('.expense-input').value);
    const currency = row.querySelector('.expense-currency').value;
    return sum + amount * (currency === 'USD' ? usdRate : 1);
  }, 0);
}

async function loadCnbUsdRate() {
  const fallback = parseNumber($('usdRate').textContent) || 20.679;
  try {
    const response = await fetch('/api/rate', { cache: 'no-store' });
    if (!response.ok) throw new Error(`ČNB API: ${response.status}`);
    const data = await response.json();
    if (!data?.rate || !data?.validFor) throw new Error('USD rate missing');
    const ratePerUsd = data.rate;
    $('usdRate').textContent = ratePerUsd.toFixed(3);
    $('rateDate').textContent = `Актуально на ${new Date(data.validFor).toLocaleDateString('uk-UA')} · оновлюється щодня`;
    $('rateStatusDot').className = 'status-dot online';
    return ratePerUsd;
  } catch (error) {
    $('usdRate').textContent = fallback.toFixed(3);
    $('rateDate').textContent = location.protocol === 'file:'
      ? 'Для актуального курсу відкрий демо через локальний сервер'
      : 'Не вдалося оновити · використовується резервний курс';
    $('rateStatusDot').className = 'status-dot offline';
    console.warn('Не вдалося завантажити курс ČNB:', error);
    return fallback;
  }
}

function calculateCz() {
  const rate = parseNumber($('usdRate').textContent) || 1;
  const multiplier = $('currencySelect').value === 'USD' ? rate : 1;
  const monthlyIncome = parseNumber($('czIncome').value) * multiplier;
  const annualIncome = monthlyIncome * 12;
  const annualExpenses = state.expenseMode === 'pausal'
    ? Math.min(annualIncome * CZ_2026.pausalRate, CZ_2026.pausalExpenseCap)
    : Math.min(annualIncome, getMonthlyActualExpensesCzk(rate) * 12);
  const annualProfit = Math.max(0, annualIncome - annualExpenses);
  const monthlyProfit = annualProfit / 12;

  const healthAnnual = Math.max(
    annualProfit * CZ_2026.healthProfitShare * CZ_2026.healthRate,
    CZ_2026.healthMinMonthly * 12
  );
  const socialBase = Math.min(
    CZ_2026.socialMaxAnnualBase,
    Math.max(annualProfit * CZ_2026.socialProfitShare, CZ_2026.socialMinMonthly * 12 / CZ_2026.socialRate)
  );
  const socialAnnual = socialBase * CZ_2026.socialRate;
  // The annual personal income tax base is rounded down to whole hundreds.
  const roundedTaxBase = Math.floor(annualProfit / 100) * 100;
  const taxAtBasicRate = Math.min(roundedTaxBase, CZ_2026.incomeTaxHigherThreshold) * CZ_2026.incomeTaxRate;
  const taxAtHigherRate = Math.max(0, roundedTaxBase - CZ_2026.incomeTaxHigherThreshold) * CZ_2026.incomeTaxHigherRate;
  const incomeTaxAnnual = Math.max(0, Math.round(taxAtBasicRate + taxAtHigherRate - CZ_2026.taxpayerCreditAnnual));
  const healthMonthly = Math.ceil(healthAnnual / 12);
  const socialMonthly = Math.ceil(socialAnnual / 12);
  const incomeTaxMonthly = Math.ceil(incomeTaxAnnual / 12);
  const monthlyTotal = healthMonthly + socialMonthly + incomeTaxMonthly;
  const incomeShare = monthlyIncome > 0 ? monthlyTotal / monthlyIncome * 100 : 0;

  $('czIncomeCzk').textContent = `${formatMoney(monthlyIncome)} Kč`;
  $('czProfit').textContent = `${formatMoney(monthlyProfit)} Kč`;
  $('healthMonthly').textContent = `${formatMoney(healthMonthly)} Kč`;
  $('socialMonthly').textContent = `${formatMoney(socialMonthly)} Kč`;
  $('incomeTaxMonthly').textContent = `${formatMoney(incomeTaxMonthly)} Kč`;
  $('czMonthlyTotal').textContent = formatMoney(monthlyTotal);
  $('czIncomeShare').textContent = `це ${incomeShare.toLocaleString('uk-UA', { minimumFractionDigits: 0, maximumFractionDigits: 1 })} % від доходу`;
  $('czAnnualIncome').textContent = `${formatMoney(annualIncome)} Kč`;
  $('czAnnualProfit').textContent = `${formatMoney(annualProfit)} Kč`;
  $('czAnnualTax').textContent = `${formatMoney(incomeTaxAnnual)} Kč`;
  $('czResults').classList.remove('hidden');
}

$('calculateCz').addEventListener('click', calculateCz);
$('copyCzTotal').addEventListener('click', () => copyText($('czMonthlyTotal').textContent, 'Částka zkopírována'));

document.querySelectorAll('[data-details]').forEach((button) => button.addEventListener('click', () => {
  const target = $(button.dataset.details);
  const willOpen = target.classList.contains('hidden');
  target.classList.toggle('hidden');
  button.setAttribute('aria-expanded', String(willOpen));
}));

document.addEventListener('keydown', (event) => {
  if (event.key !== 'Enter') return;
  event.preventDefault();
  state.country === 'ua' ? calculateUa() : calculateCz();
});

switchCountry('ua');
syncCurrency();
loadCnbUsdRate();
