<template>

  <div class="all">
    345343
    <input
        v-model="closeCode"
        type="text"
        name="wallet"
        id="wallet"
        class="block w-full pr-10 border-gray-300 text-gray-900 focus:outline-none focus:ring-gray-500 focus:border-gray-500 sm:text-sm rounded-md"
        placeholder="введите код"
    />
    <button
        :disabled="code !== closeCode"
        class="my-4 mx-2 inline-flex items-center py-2 px-4 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-full text-white bg-gray-600 hover:bg-gray-700 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
        @click="clickClose"
    >
      Ok
    </button>
  </div>
</template>

<script>
export default {
  name: "ModalCardBottom",
  data() {
    return {
      closeCode: null
    };
  },
  methods: {
    clickClose() {
      this.$emit("click-close");
    }
  },
  props: {
    code: {
      type: String,
      required: true
    }
  }
};
</script>

<style scoped>

</style>