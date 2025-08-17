export default {
  async fetch(request, env, ctx) {
    return handleRequest(env);
  },

  async scheduled(event, env, ctx) {
    ctx.waitUntil(handleRequest(env));
  },
};

async function handleRequest(env) {
  const wsUrl      = 'Add the address you are using as the websocket HERE';
  const goldApiUrl = 'Add the address you are using as the API HERE';

  const tgBotToken = 'Paste your Telegram bot token HERE';
  const tgChannel  = 'Paste your telegram channel link HERE';

  const symbols = [
    { symbol: "EUR", title: "یورو", unit: "تومان", factor: 1 },
    { symbol: "IR_COIN_1G", title: "سکه یک گرمی", unit: "تومان", factor: 1 },
    { symbol: "IR_COIN_EMAMI", title: "سکه امامی", unit: "تومان", factor: 1 },
    { symbol: "IR_COIN_BAHAR", title: "سکه بهار آزادی", unit: "تومان", factor: 1 },
    { symbol: "USDTIRT", title: "دلار", unit: "تومن", factor: 0.1 },
    { symbol: "BTCIRT", title: "بیتکوین", unit: "تومن", factor: 0.1 },
    { symbol: "BTCUSDT", title: "بیتکوین", unit: "دلار", factor: 1 },
    { symbol: "XRPIRT", title: "ریپل", unit: "تومن", factor: 0.1 },
    { symbol: "TONIRT", title: "تون", unit: "تومن", factor: 0.1 },
  ];

  const savePriceToKV = async (key, price) => {
    await env.PRICE_link.put(key, price.toString());
  };

  const getLastPriceFromKV = async (key) => {
    const lastPrice = await env.PRICE_link.get(key);
    return lastPrice ? parseFloat(lastPrice) : null;
  };

  const messages = [];

  try {
    const goldResponse = await fetch(goldApiUrl);
    const goldData = await goldResponse.json();

    if (goldData.gold && Array.isArray(goldData.gold)) {
      for (const { symbol, title } of symbols) {
        const goldPrice = goldData.gold.find(g => g.symbol === symbol);
        if (goldPrice) {
          const price = goldPrice.price;
          const lastPrice = await getLastPriceFromKV(symbol);
          let trend = lastPrice !== null ? (price > lastPrice ? '🟢' : price < lastPrice ? '🔴' : '⚪️') : '';
          await savePriceToKV(symbol, price);
          messages.push(`${trend} ${title}: ${new Intl.NumberFormat('en-US').format(price)} تومان`);
        }
      }
    }
  } catch (error) {
    console.error("Error fetching gold price:", error);
  }

  for (const { symbol, title, unit, factor } of symbols) {
    await new Promise((resolve, reject) => {
      const ws = new WebSocket(wsUrl);
      let timeout;

      ws.onopen = () => {
        ws.send(JSON.stringify({ connect: { name: 'js' }, id: 3 }));
        ws.send(JSON.stringify({ subscribe: { channel: `public:orderbook-${symbol}`, recover: true, offset: 0, epoch: '0', delta: 'fossil' }, id: 4 }));

        timeout = setTimeout(() => {
          console.error(`Timeout: No data received for ${symbol}`);
          ws.close();
          resolve();
        }, 5000);
      };

      ws.onmessage = async (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.id === 4 && message.subscribe && message.subscribe.publications) {
            const publication = message.subscribe.publications[0];
            if (publication && publication.data) {
              const parsedData = JSON.parse(publication.data);
              if (parsedData.asks && parsedData.asks.length > 0) {
                let current_price = parsedData.asks[0][0] * factor;
                const lastPrice = await getLastPriceFromKV(symbol);
                let trend = lastPrice !== null ? (current_price > lastPrice ? '🟢' : current_price < lastPrice ? '🔴' : '⚪️') : '';
                await savePriceToKV(symbol, current_price);
                messages.push(`${trend} ${title}: ${new Intl.NumberFormat('en-US').format(current_price)} ${unit}`);
                clearTimeout(timeout);
                ws.close();
                resolve();
              }
            }
          }
        } catch (error) {
          console.error(`Error parsing message for ${symbol}:`, error);
          clearTimeout(timeout);
          ws.close();
          resolve();
        }
      };

      ws.onerror = (error) => {
        console.error(`WebSocket error for ${symbol}:`, error);
        clearTimeout(timeout);
        ws.close();
        resolve();
      };
    });
  }

  if (messages.length > 0) {
    const tgApiUrl = `https://api.telegram.org/bot${tgBotToken}/sendMessage`;
    const body = { chat_id: tgChannel, text: messages.join("\n") };
    try {
      const response = await fetch(tgApiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!response.ok) {
        console.error('Failed to send message to Telegram:', await response.text());
      }
    } catch (error) {
      console.error('Error sending message to Telegram:', error);
    }
  }

  return new Response(`Messages sent to Telegram for ${symbols.length} symbols.`);
}
