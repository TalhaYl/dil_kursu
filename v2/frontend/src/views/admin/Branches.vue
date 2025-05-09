<template>
  <admin-crud
    title="Şube Yönetimi"
    :columns="columns"
    :items="branches"
    :form-fields="formFields"
    api-endpoint="/api/branches"
    @create="handleCreate"
    @update="handleUpdate"
    @delete="handleDelete"
  />
</template>

<script>
import { ref, onMounted } from 'vue'
import AdminCrud from '@/components/AdminCrud.vue'
import axios from 'axios'

export default {
  name: 'BranchesView',
  components: {
    AdminCrud
  },
  setup() {
    const branches = ref([])

    const columns = [
      { key: 'name', label: 'Şube Adı' },
      { key: 'address', label: 'Adres' },
      { key: 'transport_info', label: 'Ulaşım Bilgisi' },
      { key: 'social_facilities', label: 'Sosyal İmkanlar' }
    ]

    const formFields = [
      { key: 'name', label: 'Şube Adı', type: 'text', required: true },
      { key: 'address', label: 'Adres', type: 'text', required: true },
      { key: 'transport_info', label: 'Ulaşım Bilgisi', type: 'text', required: true },
      { key: 'social_facilities', label: 'Sosyal İmkanlar', type: 'text', required: true }
    ]

    const fetchBranches = async () => {
      try {
        const response = await axios.get('/api/branches')
        branches.value = response.data
      } catch (error) {
        console.error('Error fetching branches:', error)
      }
    }

    const handleCreate = async (data) => {
      try {
        await axios.post('/api/branches', data)
        await fetchBranches()
      } catch (error) {
        console.error('Error creating branch:', error)
      }
    }

    const handleUpdate = async ({ id, data }) => {
      try {
        await axios.put(`/api/branches/${id}`, data)
        await fetchBranches()
      } catch (error) {
        console.error('Error updating branch:', error)
      }
    }

    const handleDelete = async (id) => {
      try {
        await axios.delete(`/api/branches/${id}`)
        await fetchBranches()
      } catch (error) {
        console.error('Error deleting branch:', error)
      }
    }

    onMounted(() => {
      fetchBranches()
    })

    return {
      branches,
      columns,
      formFields,
      handleCreate,
      handleUpdate,
      handleDelete
    }
  }
}
</script> 