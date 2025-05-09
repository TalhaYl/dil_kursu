<template>
  <admin-crud
    title="Sınıf Yönetimi"
    :columns="columns"
    :items="classrooms"
    :form-fields="formFields"
    api-endpoint="/api/classrooms"
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
  name: 'ClassroomsView',
  components: {
    AdminCrud
  },
  setup() {
    const classrooms = ref([])
    const branches = ref([])

    const columns = [
      { key: 'name', label: 'Sınıf Adı' },
      { key: 'capacity', label: 'Kapasite' },
      { key: 'branch_name', label: 'Şube' },
      { key: 'available_hours', label: 'Müsait Saatler' }
    ]

    const formFields = [
      { key: 'name', label: 'Sınıf Adı', type: 'text', required: true },
      { key: 'capacity', label: 'Kapasite', type: 'number', required: true },
      {
        key: 'branch_id',
        label: 'Şube',
        type: 'select',
        required: true,
        options: []
      },
      { key: 'available_hours', label: 'Müsait Saatler', type: 'text', required: true }
    ]

    const fetchClassrooms = async () => {
      try {
        const response = await axios.get('/api/classrooms')
        classrooms.value = response.data
      } catch (error) {
        console.error('Error fetching classrooms:', error)
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
        await axios.post('/api/classrooms', data)
        await fetchClassrooms()
      } catch (error) {
        console.error('Error creating classroom:', error)
      }
    }

    const handleUpdate = async ({ id, data }) => {
      try {
        await axios.put(`/api/classrooms/${id}`, data)
        await fetchClassrooms()
      } catch (error) {
        console.error('Error updating classroom:', error)
      }
    }

    const handleDelete = async (id) => {
      try {
        await axios.delete(`/api/classrooms/${id}`)
        await fetchClassrooms()
      } catch (error) {
        console.error('Error deleting classroom:', error)
      }
    }

    onMounted(() => {
      fetchClassrooms()
      fetchBranches()
    })

    return {
      classrooms,
      columns,
      formFields,
      handleCreate,
      handleUpdate,
      handleDelete
    }
  }
}
</script> 