<script>
export default {
  name: 'HealthCheck',
  data() {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString()
    }
  }
}
</script>

<template>
  <div class="health-check">
    {
      "status": "{{ status }}",
      "timestamp": "{{ timestamp }}"
    }
  </div>
</template>

<style scoped>
.health-check {
  font-family: monospace;
  white-space: pre;
  padding: 1rem;
}
</style> 