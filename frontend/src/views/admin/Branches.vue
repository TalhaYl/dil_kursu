<template>
  <div class="branches-view">
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
    <div v-if="loading" class="loading-overlay">
      <div class="loading-spinner"></div>
    </div>
  </div>
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
    const loading = ref(false)
    const error = ref(null)

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
      loading.value = true
      error.value = null
      try {
        const response = await axios.get('/api/branches')
        branches.value = response.data
      } catch (err) {
        error.value = err.response?.data?.message || 'Şubeler yüklenirken bir hata oluştu'
        console.error('Error fetching branches:', err)
      } finally {
        loading.value = false
      }
    }

    const handleCreate = async (data) => {
      loading.value = true
      error.value = null
      try {
        await axios.post('/api/branches', data)
        await fetchBranches()
        alert('Şube başarıyla eklendi')
      } catch (err) {
        error.value = err.response?.data?.message || 'Şube eklenirken bir hata oluştu'
        console.error('Error creating branch:', err)
        throw err // Re-throw to let the CRUD component handle the error
      } finally {
        loading.value = false
      }
    }

    const handleUpdate = async ({ id, data }) => {
      loading.value = true
      error.value = null
      try {
        await axios.put(`/api/branches/${id}`, data)
        await fetchBranches()
        alert('Şube başarıyla güncellendi')
      } catch (err) {
        error.value = err.response?.data?.message || 'Şube güncellenirken bir hata oluştu'
        console.error('Error updating branch:', err)
        throw err
      } finally {
        loading.value = false
      }
    }

    const handleDelete = async (id) => {
      loading.value = true
      error.value = null
      try {
        await axios.delete(`/api/branches/${id}`)
        await fetchBranches()
        alert('Şube başarıyla silindi')
      } catch (err) {
        error.value = err.response?.data?.message || 'Şube silinirken bir hata oluştu'
        console.error('Error deleting branch:', err)
        throw err
      } finally {
        loading.value = false
      }
    }

    onMounted(() => {
      fetchBranches()
    })

    return {
      branches,
      columns,
      formFields,
      loading,
      error,
      handleCreate,
      handleUpdate,
      handleDelete
    }
  }
}
</script>

<style scoped>
.branches-view {
  position: relative;
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 5px solid #f3f3f3;
  border-top: 5px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style> 