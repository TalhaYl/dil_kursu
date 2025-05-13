<template>
  <div class="admin-crud">
    <div class="header">
      <h2>{{ title }}</h2>
      <button class="add-btn" @click="openAddModal">Yeni Ekle</button>
    </div>

    <div class="search-bar">
      <input 
        type="text" 
        v-model="searchQuery" 
        :placeholder="'Ara...'"
        @input="handleSearch"
      >
    </div>

    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th v-for="column in columns" :key="column.key">
              {{ column.label }}
            </th>
            <th>İşlemler</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in filteredItems" :key="item.id">
            <td v-for="column in columns" :key="column.key">
              {{ item[column.key] }}
            </td>
            <td class="actions">
              <button class="edit-btn" @click="openEditModal(item)">Düzenle</button>
              <button class="delete-btn" @click="confirmDelete(item)">Sil</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Add/Edit Modal -->
    <div class="modal" v-if="showModal">
      <div class="modal-content">
        <h3>{{ isEditing ? 'Düzenle' : 'Yeni Ekle' }}</h3>
        <form @submit.prevent="handleSubmit">
          <div v-for="field in formFields" :key="field.key" class="form-group">
            <label :for="field.key">{{ field.label }}</label>
            <input
              v-if="field.type === 'text' || field.type === 'email' || field.type === 'number'"
              :type="field.type"
              :id="field.key"
              v-model="formData[field.key]"
              :required="field.required"
            >
            <select
              v-else-if="field.type === 'select'"
              :id="field.key"
              v-model="formData[field.key]"
              :required="field.required"
            >
              <option v-for="option in field.options" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </div>
          <div class="modal-actions">
            <button type="button" @click="closeModal">İptal</button>
            <button type="submit" class="submit-btn">{{ isEditing ? 'Güncelle' : 'Ekle' }}</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div class="modal" v-if="showDeleteModal">
      <div class="modal-content">
        <h3>Silme Onayı</h3>
        <p>Bu öğeyi silmek istediğinizden emin misiniz?</p>
        <div class="modal-actions">
          <button @click="showDeleteModal = false">İptal</button>
          <button class="delete-btn" @click="handleDelete">Sil</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'

export default {
  name: 'AdminCrud',
  props: {
    title: {
      type: String,
      required: true
    },
    columns: {
      type: Array,
      required: true
    },
    items: {
      type: Array,
      required: true
    },
    formFields: {
      type: Array,
      required: true
    },
    apiEndpoint: {
      type: String,
      required: true
    }
  },
  setup(props, { emit }) {
    const searchQuery = ref('')
    const showModal = ref(false)
    const showDeleteModal = ref(false)
    const isEditing = ref(false)
    const selectedItem = ref(null)
    const formData = ref({})

    const filteredItems = computed(() => {
      if (!searchQuery.value) return props.items
      return props.items.filter(item => 
        Object.values(item).some(value => 
          String(value).toLowerCase().includes(searchQuery.value.toLowerCase())
        )
      )
    })

    const resetForm = () => {
      formData.value = {}
      props.formFields.forEach(field => {
        formData.value[field.key] = ''
      })
    }

    const openAddModal = () => {
      isEditing.value = false
      resetForm()
      showModal.value = true
    }

    const openEditModal = (item) => {
      isEditing.value = true
      selectedItem.value = item
      formData.value = { ...item }
      showModal.value = true
    }

    const closeModal = () => {
      showModal.value = false
      resetForm()
    }

    const handleSubmit = async () => {
      try {
        if (isEditing.value) {
          await emit('update', { id: selectedItem.value.id, data: formData.value })
        } else {
          await emit('create', formData.value)
        }
        closeModal()
      } catch (error) {
        console.error('Error submitting form:', error)
      }
    }

    const confirmDelete = (item) => {
      selectedItem.value = item
      showDeleteModal.value = true
    }

    const handleDelete = async () => {
      try {
        await emit('delete', selectedItem.value.id)
        showDeleteModal.value = false
      } catch (error) {
        console.error('Error deleting item:', error)
      }
    }

    return {
      searchQuery,
      showModal,
      showDeleteModal,
      isEditing,
      formData,
      filteredItems,
      openAddModal,
      openEditModal,
      closeModal,
      handleSubmit,
      confirmDelete,
      handleDelete
    }
  }
}
</script>

<style scoped>
.admin-crud {
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.add-btn {
  background-color: #2ecc71;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
}

.search-bar {
  margin-bottom: 20px;
}

.search-bar input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
}

.table-container {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  background-color: white;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

th, td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #ddd;
}

th {
  background-color: #f8f9fa;
  font-weight: 600;
}

.actions {
  display: flex;
  gap: 10px;
}

.edit-btn, .delete-btn {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.edit-btn {
  background-color: #3498db;
  color: white;
}

.delete-btn {
  background-color: #e74c3c;
  color: white;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal-content {
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  width: 100%;
  max-width: 500px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.submit-btn {
  background-color: #2ecc71;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}
</style> 