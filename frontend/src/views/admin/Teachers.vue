<template>
  <admin-crud
    title="Öğretmen Yönetimi"
    :columns="columns"
    :items="teachers"
    :form-fields="formFields"
    api-endpoint="/teachers"
    @create="handleCreate"
    @update="handleUpdate"
    @delete="handleDelete"
  />
</template>

<script>
import { ref, onMounted } from 'vue'
import AdminCrud from '@/components/AdminCrud.vue'
import api from '@/services/api'

export default {
  name: 'TeachersView',
  components: {
    AdminCrud
  },
  setup() {
    const teachers = ref([])
    const branches = ref([])

    const columns = [
      { key: 'name', label: 'Ad Soyad' },
      { key: 'email', label: 'E-posta' },
      { key: 'phone', label: 'Telefon' },
      { key: 'branch_name', label: 'Şube' },
      { key: 'address', label: 'Adres' }
    ]

    const formFields = [
      { key: 'name', label: 'Ad Soyad', type: 'text', required: true },
      { key: 'email', label: 'E-posta', type: 'email', required: true },
      { key: 'password', label: 'Şifre', type: 'text', required: true },
      { key: 'phone', label: 'Telefon', type: 'text', required: true },
      { key: 'address', label: 'Adres', type: 'text', required: true },
      {
        key: 'branch_id',
        label: 'Şube',
        type: 'select',
        required: true,
        options: []
      }
    ]

    const fetchTeachers = async () => {
      try {
        const response = await api.get('/teachers')
        teachers.value = response.data
      } catch (error) {
        console.error('Error fetching teachers:', error)
      }
    }

    const fetchBranches = async () => {
      try {
        const response = await api.get('/branches')
        branches.value = response.data
        formFields.find(field => field.key === 'branch_id').options = branches.value.map(branch => ({
          value: branch.id,
          label: branch.name
        }))
      } catch (error) {
        console.error('Error fetching branches:', error)
      }
    }

    const handleCreate = async (data) => {
      try {
        await api.post('/teachers', data)
        await fetchTeachers()
      } catch (error) {
        console.error('Error creating teacher:', error)
      }
    }

    const handleUpdate = async ({ id, data }) => {
      try {
        await api.put(`/teachers/${id}`, data)
        await fetchTeachers()
      } catch (error) {
        console.error('Error updating teacher:', error)
      }
    }

    const handleDelete = async (id) => {
      try {
        await api.delete(`/teachers/${id}`)
        await fetchTeachers()
      } catch (error) {
        console.error('Error deleting teacher:', error)
      }
    }

    onMounted(() => {
      fetchTeachers()
      fetchBranches()
    })

    return {
      teachers,
      columns,
      formFields,
      handleCreate,
      handleUpdate,
      handleDelete
    }
  }
}
</script> 