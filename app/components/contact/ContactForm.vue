<script setup lang="ts">
const form = reactive({ name: '', email: '', message: '', website: '' })
const status = ref<'idle' | 'loading' | 'success' | 'error'>('idle')

async function submit() {
  status.value = 'loading'
  try {
    await $fetch('/api/contact', { method: 'POST', body: form })
    status.value = 'success'
    Object.assign(form, { name: '', email: '', message: '', website: '' })
  } catch {
    status.value = 'error'
  }
}
</script>

<template>
  <form class="flex flex-col gap-4" @submit.prevent="submit">
    <input v-model="form.name" type="text" placeholder="Nom" required maxlength="100" />
    <input v-model="form.email" type="email" placeholder="Email" required maxlength="200" />
    <textarea v-model="form.message" placeholder="Ton message" required minlength="10" rows="6" />

    <!-- Honeypot : invisible pour les humains -->
    <input
      v-model="form.website"
      type="text"
      name="website"
      tabindex="-1"
      autocomplete="off"
      aria-hidden="true"
      class="absolute left-[-9999px]"
    />

    <button type="submit" :disabled="status === 'loading'">
      {{ status === 'loading' ? 'Envoi…' : 'Envoyer' }}
    </button>

    <p v-if="status === 'success'" role="status">Message envoyé, merci !</p>
    <p v-if="status === 'error'" role="alert">Une erreur est survenue, réessaie plus tard.</p>
  </form>
</template>