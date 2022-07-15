<template>
  <div class="container mx-auto flex flex-col items-center bg-gray-100 p-4">
    <div class="container">
      <div class="w-full my-4"></div>
      <add-ticker @add-ticker="add" :disabled="tooManyTickersAdded"/>

      <template v-if="tickers.length">
        <hr class="w-full border-t border-gray-600 my-4"/>
        <div>
          <button
              class="my-4 mx-2 inline-flex items-center py-2 px-4 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-full text-white bg-gray-600 hover:bg-gray-700 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              v-if="page > 1"
              @click="page = page - 1"
          >
            Назад
          </button>
          <button
              class="my-4 mx-2 inline-flex items-center py-2 px-4 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-full text-white bg-gray-600 hover:bg-gray-700 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              @click="page = page + 1"
              v-if="hasNextPage"
          >
            Вперед
          </button>
          <div>Фильтр: <input v-model="filter"/></div>
        </div>
        <hr class="w-full border-t border-gray-600 my-4"/>
        <dl class="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div
              v-for="t in paginatedTickers"
              :key="t.name"
              @click="select(t)"
              :class="{
              'border-4': selectedTicker === t,
              'bg-white': !checkInvalid(t.name)
            }"
              class="overflow-hidden shadow rounded-lg border-purple-800 border-solid cursor-pointer"
          >
            <div class="px-4 py-5 sm:p-6 text-center">
              <dt class="text-sm font-medium text-gray-500 truncate">
                {{ t.name }} - USD
              </dt>
              <dd class="mt-1 text-3xl font-semibold text-gray-900">
                {{ formatPrice(t.price) }}
              </dd>
            </div>
            <div class="w-full border-t border-gray-200"></div>
            <button
                @click.stop="handleDelete(t)"
                class="flex items-center justify-center font-medium w-full bg-gray-100 px-4 py-4 sm:px-6 text-md text-gray-500 hover:text-gray-600 hover:bg-gray-200 hover:opacity-20 transition-all focus:outline-none"
            >
              <svg
                  class="h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="#718096"
                  aria-hidden="true"
              >
                <path
                    fill-rule="evenodd"
                    d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                    clip-rule="evenodd"
                ></path>
              </svg
              >
              Удалить
            </button>
          </div>
        </dl>
        <hr class="w-full border-t border-gray-600 my-4"/>
      </template>

      <tickers-graph v-if="selectedTicker" :graph="graph" :ticker-name="selectedTicker.name" @close-graph="selectedTicker = null">

      </tickers-graph>


    </div>
  </div>
</template>

<script>
// [x] 6. Наличие в состоянии ЗАВИСИМЫХ ДАННЫХ | Критичность: 5+
// [ ] 4. Запросы напрямую внутри компонента (???) | Критичность: 5
// [ ] 2. При удалении остается подписка на загрузку тикера | Критичность: 5
// [ ] 5. Обработка ошибок API | Критичность: 5
// [ ] 3. Количество запросов | Критичность: 4
// [x] 8. При удалении тикера не изменяется localStorage | Критичность: 4
// [x] 1. Одинаковый код в watch | Критичность: 3
// [ ] 9. localStorage и анонимные вкладки | Критичность: 3
// [ ] 7. График ужасно выглядит если будет много цен | Критичность: 2
// [ ] 10. Магические строки и числа (URL, 5000 миллисекунд задержки, ключ локал стораджа, количество на странице) |  Критичность: 1

// Параллельно
// [x] График сломан если везде одинаковые значения
// [x] При удалении тикера остается выбор

import {subscribeToTicker, unsubscribeFromTicker, returnInvalidTickers} from "./api";
import AddTicker from "@/components/AddTicker";
import TickersGraph from "@/components/TickersGraph";

export default {
  name: "App",
  components: {TickersGraph, AddTicker},
  data() {
    return {
      filter: "",
      invalidTickers: [],
      tickers: [],
      selectedTicker: null,
      graph: [],
      page: 1
    };
  },

  created() {

    window.addEventListener("resize", this.calculateMaxGraphElements);

    const windowData = Object.fromEntries(
        new URL(window.location).searchParams.entries()  // берем данные из адресной строки
    );

    const VALID_KEYS = ["filter", "page"];

    VALID_KEYS.forEach(key => {
      if (windowData[key]) {
        this[key] = windowData[key]; // установка данных из адресной строки
      }
    });

    const tickersData = localStorage.getItem("cryptonomicon-list"); // берем данные из localStorage

    if (tickersData) { // если там есть данные
      this.tickers = JSON.parse(tickersData);
      this.tickers.forEach(ticker => {
        subscribeToTicker(ticker.name, newPrice =>  // для каждого тикера вызываем subscribeToTicker
            this.updateTicker(ticker.name, newPrice)
        );
      });
    }
  },

  computed: {
    tooManyTickersAdded() {
      return this.tickers.length > 4
    },
    maxGraphElements() {
      return this.$refs.graph?.clientWidth / 38;
    },
    startIndex() {
      return (this.page - 1) * 6;
    },

    endIndex() {
      return this.page * 6;
    },

    filteredTickers() {
      return this.tickers.filter(ticker => ticker.name.includes(this.filter));
    },

    paginatedTickers() {
      return this.filteredTickers.slice(this.startIndex, this.endIndex);
    },

    hasNextPage() {
      return this.filteredTickers.length > this.endIndex;
    },

    normalizedGraph() {
      const maxValue = Math.max(...this.graph);
      const minValue = Math.min(...this.graph);

      if (maxValue === minValue) {
        return this.graph.map(() => 50);
      }

      return this.graph.map(
          price => 5 + ((price - minValue) * 95) / (maxValue - minValue)
      );
    },

    pageStateOptions() {
      return {
        filter: this.filter,
        page: this.page
      };
    }
  },

  methods: {
    calculateMaxGraphElements() {
      console.log("trx");
    },
    checkInvalid(tickerName) {
      return this.invalidTickers.find((i) => i === tickerName);
    },
    updateTicker(tickerName, price) {

      this.invalidTickers = returnInvalidTickers();
      console.log(this.$refs.graph?.clientWidth);
      this.tickers
          .filter(t => t.name === tickerName)
          .forEach(t => {
            if (t === this.selectedTicker) {
              this.graph.push(price);
              if (this.graph.length > this.maxGraphElements) {
                this.graph.shift();
              }
            }
            t.price = price;
          });
    },

    formatPrice(price) {
      if (price === "-") {
        return price;
      }
      return price > 1 ? price.toFixed(2) : price.toPrecision(2);
    },

    add(ticker) {
      const currentTicker = {
        name: ticker,
        price: "-"
      };

      this.tickers = [...this.tickers, currentTicker];
      this.filter = "";
      subscribeToTicker(currentTicker.name, newPrice =>
          this.updateTicker(currentTicker.name, newPrice)
      );
    },

    select(ticker) {
      this.selectedTicker = ticker;
    },

    handleDelete(tickerToRemove) {
      this.tickers = this.tickers.filter(t => t !== tickerToRemove);
      if (this.selectedTicker === tickerToRemove) {
        this.selectedTicker = null;
      }
      unsubscribeFromTicker(tickerToRemove.name);
    }
  },

  watch: {
    selectedTicker() {
      this.graph = [];
    },

    tickers(newValue, oldValue) {
      // Почему не сработал watch при добавлении?
      console.log(newValue === oldValue);
      localStorage.setItem("cryptonomicon-list", JSON.stringify(this.tickers));
    },

    paginatedTickers() {
      if (this.paginatedTickers.length === 0 && this.page > 1) {
        this.page -= 1;
      }
    },

    filter() {
      this.page = 1;
    },

    pageStateOptions(value) {
      window.history.pushState(
          null,
          document.title,
          `${window.location.pathname}?filter=${value.filter}&page=${value.page}`
      );
    }
  }
};
</script>