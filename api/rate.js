/* Vercel function: safely proxies the official daily USD/CZK rate from ČNB. */
const CNB_URL = 'https://api.cnb.cz/cnbapi/exrates/daily?lang=EN';

module.exports = async function rateHandler(request, response) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET');
    return response.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const cnbResponse = await fetch(CNB_URL, { headers: { Accept: 'application/json' } });
    if (!cnbResponse.ok) throw new Error(`ČNB returned ${cnbResponse.status}`);

    const data = await cnbResponse.json();
    const usd = data.rates?.find((item) => item.currencyCode === 'USD');
    if (!usd?.rate || !usd?.amount || !usd?.validFor) throw new Error('USD missing');

    response.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    return response.status(200).json({
      currency: 'USD',
      rate: usd.rate / usd.amount,
      validFor: usd.validFor,
      source: CNB_URL
    });
  } catch (error) {
    return response.status(502).json({ error: 'Не вдалося отримати курс ČNB' });
  }
};
