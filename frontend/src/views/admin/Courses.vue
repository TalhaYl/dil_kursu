<template>
  <admin-crud
    title="Kurs Yönetimi"
    :columns="columns"
    :items="courses"
    :form-fields="formFields"
    api-endpoint="/api/courses"
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
  name: 'CoursesView',
  components: {
    AdminCrud
  },
  setup() {
    const courses = ref([])
    const branches = ref([])
    const teachers = ref([])
    const classrooms = ref([])

    const columns = [
      { key: 'name', label: 'Kurs Adı' },
      { key: 'language', label: 'Dil' },
      { key: 'teacher_name', label: 'Öğretmen' },
      { key: 'branch_name', label: 'Şube' },
      { key: 'classroom_name', label: 'Sınıf' },
      { key: 'course_type', label: 'Kurs Tipi' },
      { key: 'start_date', label: 'Başlangıç' },
      { key: 'end_date', label: 'Bitiş' }
    ]

    const formFields = [
      { key: 'name', label: 'Kurs Adı', type: 'text', required: true },
      { key: 'language', label: 'Dil', type: 'text', required: true },
      {
        key: 'teacher_id',
        label: 'Öğretmen',
        type: 'select',
        required: true,
        options: []
      },
      {
        key: 'branch_id',
        label: 'Şube',
        type: 'select',
        required: true,
        options: []
      },
      {
        key: 'classroom_id',
        label: 'Sınıf',
        type: 'select',
        required: true,
        options: []
      },
      {
        key: 'course_type',
        label: 'Kurs Tipi',
        type: 'select',
        required: true,
        options: [
          { value: 'Physical', label: 'Yüz Yüze' },
          { value: 'Online', label: 'Online' }
        ]
      },
      { key: 'start_date', label: 'Başlangıç Tarihi', type: 'date', required: true },
      { key: 'end_date', label: 'Bitiş Tarihi', type: 'date', required: true },
      { key: 'schedule_time', label: 'Ders Saatleri', type: 'text', required: true }
    ]

    const fetchCourses = async () => {
      try {
        const response = await axios.get('/api/courses')
        courses.value = response.data
      } catch (error) {
        console.error('Error fetching courses:', error)
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

    const fetchTeachers = async () => {
      try {
        const response = await axios.get('/api/teachers')
        teachers.value = response.data
        formFields.find(field => field.key === 'teacher_id').options = teachers.value.map(teacher => ({
          value: teacher.id,
          label: teacher.name
        }))
      } catch (error) {
        console.error('Error fetching teachers:', error)
      }
    }

    const fetchClassrooms = async () => {
      try {
        const response = await axios.get('/api/classrooms')
        classrooms.value = response.data
        formFields.find(field => field.key === 'classroom_id').options = classrooms.value.map(classroom => ({
          value: classroom.id,
          label: classroom.name
        }))
      } catch (error) {
        console.error('Error fetching classrooms:', error)
      }
    }

    const handleCreate = async (data) => {
      try {
        await axios.post('/api/courses', data)
        await fetchCourses()
      } catch (error) {
        console.error('Error creating course:', error)
      }
    }

    const handleUpdate = async ({ id, data }) => {
      try {
        await axios.put(`/api/courses/${id}`, data)
        await fetchCourses()
      } catch (error) {
        console.error('Error updating course:', error)
      }
    }

    const handleDelete = async (id) => {
      try {
        await axios.delete(`/api/courses/${id}`)
        await fetchCourses()
      } catch (error) {
        console.error('Error deleting course:', error)
      }
    }

    onMounted(() => {
      fetchCourses()
      fetchBranches()
      fetchTeachers()
      fetchClassrooms()
    })

    return {
      courses,
      columns,
      formFields,
      handleCreate,
      handleUpdate,
      handleDelete
    }
  }
}
</script> 