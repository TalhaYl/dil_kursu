<template>
  <admin-crud
    title="Öğrenci Yönetimi"
    :columns="columns"
    :items="students"
    :form-fields="formFields"
    api-endpoint="/api/students"
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
  name: 'StudentsView',
  components: {
    AdminCrud
  },
  setup() {
    const students = ref([])
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

    const fetchStudents = async () => {
      try {
        const response = await axios.get('/api/students')
        students.value = response.data
      } catch (error) {
        console.error('Error fetching students:', error)
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
        await axios.post('/api/students', data)
        await fetchStudents()
      } catch (error) {
        console.error('Error creating student:', error)
      }
    }

    const handleUpdate = async ({ id, data }) => {
      try {
        await axios.put(`/api/students/${id}`, data)
        await fetchStudents()
      } catch (error) {
        console.error('Error updating student:', error)
      }
    }

    const handleDelete = async (id) => {
      try {
        await axios.delete(`/api/students/${id}`)
        await fetchStudents()
      } catch (error) {
        console.error('Error deleting student:', error)
      }
    }

    onMounted(() => {
      fetchStudents()
      fetchBranches()
    })

    return {
      students,
      columns,
      formFields,
      handleCreate,
      handleUpdate,
      handleDelete
    }
  }
}
</script> 