<script setup lang="ts">
    const loadingValue = ref(null)
</script>

<template>
    <div class="grid text-center gap-3">
        <p>Loading...</p>
        <UProgress v-model="loadingValue" />
    </div>
</template>
