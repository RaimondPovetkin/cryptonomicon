const API_KEY = "b9f11e3e45e948a1b60158d50b5c7ee1083347d6cb65fbeba2adce60edeec28f";

const tickersHandlers = new Map(); // тут будет храниться список ф-й, которые нам нужно вызвать при изменении определенного тикера

//TODO: refactor to use URLSearchParams
const loadTickers = () => {
    if (tickersHandlers.size === 0) {
        return;
    }

    console.log(tickersHandlers);

    fetch(
        `https://min-api.cryptocompare.com/data/pricemulti?fsyms=${[
            ...tickersHandlers.keys()
        ].join(",")}&tsyms=USD&api_key=${API_KEY}`
    )
        .then(r => r.json())
        .then(rawData => {
            const updatedPrices = Object.fromEntries(
                Object.entries(rawData).map(([key, value]) => [key, value.USD]) // {a:1 , b:2} => {['a',1], ['b',2]} => [['a',1],['b',0.5]] => {a:1 , b:0.5}
            );

            Object.entries(updatedPrices).forEach(([currency, newPrice]) => {
                const handlers = tickersHandlers.get(currency) ?? [];  // берем из map-а все функции
                handlers.forEach(fn => fn(newPrice)); // вызываем их
            });
        });
};

export const subscribeToTicker = (ticker, cb) => { // добавляем cb к тикеру
    const subscribers = tickersHandlers.get(ticker) || [];
    tickersHandlers.set(ticker, [...subscribers, cb]);
};

export const unsubscribeFromTicker = ticker => { // вытягиваем всех кто подписан на этот тикер и оставляем ф-ю отличную от этого колбэка (cb)
    tickersHandlers.delete(ticker);
};

setInterval(loadTickers, 5000); // каждые 5с обновляются только те тикеры, которые есть в списке

window.tickers = tickersHandlers;

// получить стоимость криптовалютных пар с АПИшки?
// получать ОБНОВЛЕНИЯ стоимости криптовалютных пар с АПИШки