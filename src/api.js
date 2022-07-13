const API_KEY = "b9f11e3e45e948a1b60158d50b5c7ee1083347d6cb65fbeba2adce60edeec28f";

const tickersHandlers = new Map();
const invalidTickers = []

const socket = new WebSocket(
    `wss://streamer.cryptocompare.com/v2?api_key=${API_KEY}`
);

const AGGREGATE_INDEX = "5";

socket.addEventListener("message", e => {    // когда сокет получает сообщение

    const { TYPE: type, FROMSYMBOL: currency, PRICE: newPrice, MESSAGE: myMessage } = JSON.parse(   // берем данные которые нам нужны
        e.data
    );

    if(myMessage === "INVALID_SUB"){
        // console.log((JSON.parse( e.data)).PARAMETER.split('~')[2])
        const invalidTicker = (JSON.parse( e.data)).PARAMETER.split('~')[2]
        if (invalidTickers.find((i) => i === invalidTicker)){
            return;
        } else {
            invalidTickers.push(invalidTicker);
        }
    }
    if (type !== AGGREGATE_INDEX || newPrice === undefined) {
        return;
    }

    const handlers = tickersHandlers.get(currency) ?? []; // handlers хранит ф-ю (newPrice => this.updateTicker(ticker.name, newPrice))
    handlers.forEach(fn => fn(newPrice));// выполняется ф-я обновления цены
});

// 1. При каждом получении сообщения от WS для тикера этого сообщения запускается функция обновления цены
// 2. Все эти тикеры и функции их обновления вызываются при создании и добавлении в App.vue и параметрами передаются в api.js, где записываются в map

function sendToWebSocket(message) {
    const stringifiedMessage = JSON.stringify(message);

    if (socket.readyState === WebSocket.OPEN) { // если уже подключен
        socket.send(stringifiedMessage); // шлём сообщение
        return;
    }

    socket.addEventListener("open",() => // когда сокет откроется
        {
            socket.send(stringifiedMessage); // шлём сообщение
        },
        { once: true } //обработчик должен быть вызван не более одного раза после добавления. Если true, обработчик автоматически удаляется при вызове
    );
}

function subscribeToTickerOnWs(ticker) { // подписываемся на тикер при помощи cryptoCompare API
    sendToWebSocket({
        action: "SubAdd",
        subs: [`5~CCCAGG~${ticker}~USD`]
    });
}

function unsubscribeFromTickerOnWs(ticker) { // отписываемся от тикера при помощи cryptoCompare API
    sendToWebSocket({
        action: "SubRemove",
        subs: [`5~CCCAGG~${ticker}~USD`]
    });
}

export const subscribeToTicker = (ticker, cb) => { // добавляем cb к тикеру
    const subscribers = tickersHandlers.get(ticker) || [];
    tickersHandlers.set(ticker, [...subscribers, cb]);
    subscribeToTickerOnWs(ticker); // подписываемся на поток ws
};

export const unsubscribeFromTicker = ticker => { // удаляем тикер из map
    tickersHandlers.delete(ticker);
    unsubscribeFromTickerOnWs(ticker);// отписываемся от потока ws
};

export function returnInvalidTickers(){
    return invalidTickers
}