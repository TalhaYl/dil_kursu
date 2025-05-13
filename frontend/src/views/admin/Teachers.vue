<template>
  <admin-crud
    title="Öğretmen Yönetimi"
    :columns="columns"
    :items="teachers"
    :form-fields="formFields"
    api-endpoint="/api/teachers"
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
      { key: 'languages', label: 'Diller' },
      { key: 'working_days', label: 'Çalışma Günleri' },
      { key: 'branch_name', label: 'Şube' }
    ]

    const formFields = [
      { key: 'name', label: 'Ad Soyad', type: 'text', required: true },
      { key: 'email', label: 'E-posta', type: 'email', required: true },
      { key: 'password', label: 'Şifre', type: 'text', required: true },
      { key: 'languages', label: 'Diller', type: 'text', required: true },
      { key: 'working_days', label: 'Çalışma Günleri', type: 'text', required: true },
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
        const response = await axios.get('/api/teachers')
        teachers.value = response.data
      } catch (error) {
        console.error('Error fetching teachers:', error)
      }
    }

    const fetchBranches = async () => {
      try {
        const response = await axios.get('/api/branches')
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
        await axios.post('/api/teachers', data)
        await fetchTeachers()
      } catch (error) {
        console.error('Error creating teacher:', error)
      }
    }

    const handleUpdate = async ({ id, data }) => {
      try {
        await axios.put(`/api/teachers/${id}`, data)
        await fetchTeachers()
      } catch (error) {
        console.error('Error updating teacher:', error)
      }
    }

    const handleDelete = async (id) => {
      try {
        await axios.delete(`/api/teachers/${id}`)
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