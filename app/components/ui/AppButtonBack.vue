<template>
    <UButton
        class="cursor-pointer"
        variant="subtle"
        color="neutral"
        label="Back"
        icon="i-lucide-arrow-left-from-line"
        @click="$router.back()"
    />
</template>

<script setup lang="ts">
    // This component is a simple back button that navigates to the previous page in the router history.
</script>