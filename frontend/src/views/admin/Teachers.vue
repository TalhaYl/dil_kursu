<template>
  <div class="teachers-page">
    <div class="page-header">
      <h2>Öğretmenler</h2>
      <div class="header-actions">
        <button class="add-btn" @click="showAddModal = true">
          <i class="fas fa-plus"></i> Yeni Öğretmen
        </button>
        <button class="edit-btn" @click="editSelectedTeachers" :disabled="!hasSelectedTeachers">
          <i class="fas fa-edit"></i> Düzenle
        </button>
        <button class="delete-btn" @click="deleteSelectedTeachers" :disabled="!hasSelectedTeachers">
          <i class="fas fa-trash"></i> Sil
        </button>
      </div>
    </div>

    <!-- Öğretmen Listesi -->
    <div class="teachers-list">
      <table>
        <thead>
          <tr>
            <th>
              <input type="checkbox" v-model="selectAll" @change="toggleSelectAll">
            </th>
            <th>Fotoğraf</th>
            <th>Ad Soyad</th>
            <th>E-posta</th>
            <th>Telefon</th>
            <th>Şube</th>
            <th>Diller</th>
            <th>Müsait Günler</th>
            <th>Durum</th>
            <th>Kurslar</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="teacher in teachers" :key="teacher.id" 
              :class="{ 'selected': selectedTeachers.includes(teacher.id) }"
              @click="toggleTeacherSelection(teacher.id)">
            <td @click.stop>
              <input type="checkbox" v-model="selectedTeachers" :value="teacher.id">
            </td>
            <td>
              <div class="teacher-photo">
                <img 
                  v-if="teacher.image_path" 
                  :src="getImageUrl(teacher.image_path)" 
                  :alt="teacher.name"
                  class="teacher-avatar"
                />
                <div v-else class="no-photo">
                  <i class="fas fa-user"></i>
                </div>
              </div>
            </td>
            <td>{{ teacher.name }}</td>
            <td>{{ teacher.email }}</td>
            <td>{{ teacher.phone }}</td>
            <td>{{ teacher.branch_name }}</td>
            <td>
              <div class="languages-list">
                <template v-if="teacher.languages && Array.isArray(teacher.languages) && teacher.languages.length > 0">
                  <span v-for="lang in teacher.languages" :key="lang" class="language-tag">
                    {{ lang }}
                  </span>
                </template>
                <template v-else>
                  <span class="language-tag">Dil belirtilmemiş</span>
                </template>
              </div>
            </td>
            <td>
              <div class="working-days">
                <template v-if="teacher.working_days">
                  <span
                    v-for="day in filteredWorkingDays(teacher)"
                    :key="day"
                    class="day-schedule"
                  >
                    {{ day }}:
                    <template v-if="teacher.working_hours && teacher.working_hours[day] && teacher.working_hours[day].start && teacher.working_hours[day].end">
                      {{ teacher.working_hours[day].start }} - {{ teacher.working_hours[day].end }}
                    </template>
                    <template v-else>
                      Müsait
                    </template>
                  </span>
                </template>
                <span v-else>Belirtilmemiş</span>
              </div>
            </td>
            <td>
              <span :class="['status-badge', teacher.status]">
                {{ teacher.status === 'active' ? 'Aktif' : 'Pasif' }}
              </span>
            </td>
            <td>
              <div class="courses-list">
                <span v-for="course in teacher.courses" :key="course" class="course-tag">
                  {{ course }}
                </span>
                <span v-if="!teacher.courses || teacher.courses.length === 0">Kurs yok</span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Öğretmen Ekleme/Düzenleme Modal -->
    <div class="modal" v-if="showAddModal">
      <div class="modal-content">
        <h3>{{ editingTeacher ? 'Öğretmen Düzenle' : 'Yeni Öğretmen' }}</h3>
        <form @submit.prevent="saveTeacher">
          <div class="form-group">
            <label>Ad Soyad <span class="required">*</span></label>
            <input type="text" v-model="teacherForm.name" required>
          </div>

          <div class="form-group">
            <label>E-posta <span class="required">*</span></label>
            <input type="email" v-model="teacherForm.email" required>
          </div>

          <div class="form-group" v-if="!editingTeacher">
            <label>Şifre</label>
            <input type="password" v-model="teacherForm.password" placeholder="Boş bırakılırsa otomatik oluşturulur">
            <small class="help-text">
              <i class="fas fa-info-circle"></i>
              Şifre boş bırakılırsa varsayılan şifre "123456" olarak ayarlanır.
            </small>
          </div>
          
          <div class="form-group">
            <label>Telefon</label>
            <input type="tel" v-model="teacherForm.phone" pattern="[0-9]{10}" placeholder="5XX XXX XX XX">
          </div>

          <div class="form-group">
            <label>Şube <span class="required">*</span></label>
            <select v-model="teacherForm.branch_id" required>
              <option value="">Şube Seçin</option>
              <option v-for="branch in branches" :key="branch.id" :value="branch.id">
                {{ branch.name }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label>Diller <span class="required">*</span></label>
            <div class="languages-checkbox">
              <div v-for="lang in languageOptions" :key="lang" class="language-checkbox">
                <input 
                  type="checkbox" 
                  :id="'lang-' + lang" 
                  :value="lang" 
                  v-model="teacherForm.languages"
                >
                <label :for="'lang-' + lang">{{ lang }}</label>
              </div>
            </div>
          </div>

          <div class="form-group">
            <label>Müsait Günler ve Saatler</label>
            <div class="working-days-grid">
              <div v-for="day in weekDays" :key="day" class="day-column">
                <div class="day-header">
                  <input 
                    type="checkbox" 
                    :id="'day-' + day" 
                    :checked="teacherForm.working_days[day].length > 0"
                    @change="handleDayChange(day)"
                  >
                  <label :for="'day-' + day">{{ day }}</label>
                </div>
                <div class="time-inputs" v-if="teacherForm.working_days[day].length > 0">
                  <div class="time-range">
                    <input 
                      type="time" 
                      v-model="teacherForm.working_hours[day].start"
                      :disabled="!teacherForm.working_days[day].length"
                    >
                    <span>-</span>
                    <input 
                      type="time" 
                      v-model="teacherForm.working_hours[day].end"
                      :disabled="!teacherForm.working_days[day].length"
                    >
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="form-group" v-if="editingTeacher">
            <label>Durum</label>
            <select v-model="teacherForm.status">
              <option value="active">Aktif</option>
              <option value="inactive">Pasif</option>
            </select>
          </div>

          <div class="form-group" v-if="editingTeacher && editingTeacher.id">
            <label>Öğretmen Fotoğrafı</label>
            <div v-if="teacherForm.image_path" class="current-image">
              <img 
                :src="getImageUrl(teacherForm.image_path)" 
                :alt="teacherForm.name"
                class="current-teacher-image"
              />
              <p class="image-info">Mevcut fotoğraf</p>
            </div>
            <ImageUploader
              v-model="teacherForm.image_path"
              :upload-url="`/api/teachers/${editingTeacher.id}/image`"
              placeholder-text="Öğretmen fotoğrafını buraya sürükleyin veya tıklayın"
              @upload-success="handleImageUploadSuccess"
            />
          </div>

          <div class="form-actions">
            <button type="button" class="cancel-btn" @click="closeModal">İptal</button>
            <button type="submit" class="save-btn" :disabled="!isFormValid">Kaydet</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue'
import axios from 'axios'
import toast from '@/utils/toast'
import { useRouter } from 'vue-router'
import ImageUploader from '@/components/ImageUploader.vue'
import { getImageUrl } from '@/utils/config'

export default {
  name: 'TeachersView',
  components: {
    ImageUploader
  },
  setup() {
    const teachers = ref([])
    const branches = ref([])
    const showAddModal = ref(false)
    const editingTeacher = ref(null)
    const selectedTeachers = ref([])
    const selectAll = ref(false)
    const weekDays = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar']
    const router = useRouter()

    const teacherForm = ref({
      name: '',
      email: '',
      password: '',
      phone: '',
      branch_id: '',
      languages: [],
      working_days: {
        Pazartesi: [],
        Salı: [],
        Çarşamba: [],
        Perşembe: [],
        Cuma: [],
        Cumartesi: [],
        Pazar: []
      },
      working_hours: {
        Pazartesi: { start: '09:00', end: '17:00' },
        Salı: { start: '09:00', end: '17:00' },
        Çarşamba: { start: '09:00', end: '17:00' },
        Perşembe: { start: '09:00', end: '17:00' },
        Cuma: { start: '09:00', end: '17:00' },
        Cumartesi: { start: '09:00', end: '17:00' },
        Pazar: { start: '09:00', end: '17:00' }
      },
      status: 'active',
      image_path: ''
    })

    // Dil seçenekleri
    const languageOptions = [
      'Türkçe',
      'İngilizce',
      'Almanca',
      'Fransızca',
      'İspanyolca',
      'İtalyanca',
      'Rusça',
      'Arapça',
      'Çince',
      'Japonca'
    ]

    // Saat dilimleri
    const timeSlots = [
      '09:00-10:00',
      '10:00-11:00',
      '11:00-12:00',
      '12:00-13:00',
      '13:00-14:00',
      '14:00-15:00',
      '15:00-16:00',
      '16:00-17:00',
      '17:00-18:00',
      '18:00-19:00',
      '19:00-20:00'
    ]

    // Gün seçimi değiştiğinde
    const handleDayChange = (day) => {
      if (teacherForm.value.working_days[day].length === 0) {
        teacherForm.value.working_days[day] = ['selected']
      } else {
        teacherForm.value.working_days[day] = []
      }
    }

    // Saat seçimi değiştiğinde
    const handleTimeChange = (day, time) => {
      const index = teacherForm.value.working_days[day].indexOf(time)
      if (index === -1) {
        teacherForm.value.working_days[day].push(time)
      } else {
        teacherForm.value.working_days[day].splice(index, 1)
      }
    }

    // Bildirim fonksiyonları
    const showSuccess = (message) => {
      toast.success(message)
    }

    const showError = (message) => {
      toast.error(message)
    }

    // Seçili öğretmen var mı kontrolü
    const hasSelectedTeachers = computed(() => selectedTeachers.value.length > 0)

    // Image URL helper is now imported from config utility

    // Tümünü seç/kaldır
    const toggleSelectAll = () => {
      if (selectAll.value) {
        selectedTeachers.value = teachers.value.map(teacher => teacher.id)
      } else {
        selectedTeachers.value = []
      }
    }

    // Öğretmen seçimi toggle
    const toggleTeacherSelection = (teacherId) => {
      const index = selectedTeachers.value.indexOf(teacherId)
      if (index > -1) {
        selectedTeachers.value.splice(index, 1)
      } else {
        selectedTeachers.value.push(teacherId)
      }
    }

    // Seçili öğretmenleri düzenle
    const editSelectedTeachers = () => {
      if (selectedTeachers.value.length === 1) {
        const teacher = teachers.value.find(t => t.id === selectedTeachers.value[0])
        if (teacher) {
          editTeacher(teacher)
        }
      } else {
        showError('Lütfen sadece bir öğretmen seçin')
      }
    }

    // Seçili öğretmenleri sil
    const deleteSelectedTeachers = async () => {
      const confirmed = await toast.confirm(`${selectedTeachers.value.length} öğretmeni silmek istediğinizden emin misiniz?`, 'Öğretmen Silme')
      if (!confirmed) return

      try {
        for (const teacherId of selectedTeachers.value) {
          await axios.delete(`/api/teachers/${teacherId}`)
        }
        showSuccess('Seçili öğretmenler başarıyla silindi')
        selectedTeachers.value = []
        selectAll.value = false
        await fetchTeachers()
      } catch (error) {
        console.error('Error deleting teachers:', error)
        const errorMessage = error.response?.data?.error || 'Öğretmenler silinirken bir hata oluştu'
        showError(errorMessage)
      }
    }

    // Öğretmenleri getir
    const fetchTeachers = async () => {
      try {
        const response = await axios.get('/api/teachers')
        console.log('=== FETCH TEACHERS DEBUG ===');
        console.log('Raw response data:', response.data);
        
        teachers.value = response.data.map(teacher => {
          try {
            console.log(`Processing teacher ${teacher.id}:`, teacher);
            
            // Languages verisini işle
            let languages = [];
            if (teacher.languages) {
              console.log(`Teacher ${teacher.id} raw languages:`, teacher.languages, 'type:', typeof teacher.languages);
              
              if (typeof teacher.languages === 'string') {
                languages = teacher.languages.split(',').filter(lang => lang.trim());
              } else if (Array.isArray(teacher.languages)) {
                languages = teacher.languages;
              }
            }
            
            console.log(`Teacher ${teacher.id} processed languages:`, languages);

            // Working days verisini işle
            let workingDays = null;
            if (teacher.working_days) {
              try {
                workingDays = typeof teacher.working_days === 'string' 
                  ? JSON.parse(teacher.working_days) 
                  : teacher.working_days;
              } catch (e) {
                console.error('Error parsing working days:', e);
                workingDays = null;
              }
            }

            // Courses verisini işle
            let courses = [];
            if (teacher.courses) {
              if (typeof teacher.courses === 'string') {
                courses = teacher.courses.split(',').map(c => c.trim()).filter(c => c);
              } else if (Array.isArray(teacher.courses)) {
                courses = teacher.courses;
              }
            }

            const processedTeacher = {
              ...teacher,
              languages,
              working_days: workingDays,
              courses
            };
            
            console.log(`Teacher ${teacher.id} final processed:`, processedTeacher);
            console.log(`Teacher ${teacher.id} image_path:`, teacher.image_path);
            return processedTeacher;
          } catch (error) {
            console.error('Error parsing teacher data:', error, teacher)
            return {
              ...teacher,
              languages: [],
              working_days: null,
              courses: []
            }
          }
        })
        
        console.log('=== END FETCH TEACHERS DEBUG ===');
      } catch (error) {
        console.error('Error fetching teachers:', error)
        showError('Öğretmenler yüklenirken bir hata oluştu')
      }
    }

    // Şubeleri getir
    const fetchBranches = async () => {
      try {
        const response = await axios.get('/api/branches')
        branches.value = response.data
      } catch (error) {
        console.error('Error fetching branches:', error)
      }
    }

    // Öğretmen düzenleme
    const editTeacher = (teacher) => {
      try {
        console.log('=== EDIT TEACHER DEBUG ===');
        console.log('Original teacher object:', teacher);
        console.log('Teacher languages:', teacher.languages);
        console.log('Teacher languages type:', typeof teacher.languages);
        
        // Working days'i parse et
        let workingDays = {};
        if (teacher.working_days) {
          try {
            workingDays = typeof teacher.working_days === 'string' 
              ? JSON.parse(teacher.working_days) 
              : teacher.working_days;
          } catch (e) {
            console.error('Error parsing working days:', e);
            workingDays = {};
          }
        }

        // Working hours'i parse et
        let workingHours = {};
        if (teacher.working_hours) {
          try {
            workingHours = typeof teacher.working_hours === 'string'
              ? JSON.parse(teacher.working_hours)
              : teacher.working_hours;
          } catch (e) {
            console.error('Error parsing working hours:', e);
            workingHours = {};
          }
        }

        // Varsayılan günleri ve saatleri ayarla
        const defaultDays = {
          Pazartesi: [],
          Salı: [],
          Çarşamba: [],
          Perşembe: [],
          Cuma: [],
          Cumartesi: [],
          Pazar: []
        };

        const defaultHours = {
          Pazartesi: { start: '09:00', end: '17:00' },
          Salı: { start: '09:00', end: '17:00' },
          Çarşamba: { start: '09:00', end: '17:00' },
          Perşembe: { start: '09:00', end: '17:00' },
          Cuma: { start: '09:00', end: '17:00' },
          Cumartesi: { start: '09:00', end: '17:00' },
          Pazar: { start: '09:00', end: '17:00' }
        };

        // Her gün için working days ve hours'ı kontrol et
        const finalWorkingDays = { ...defaultDays };
        const finalWorkingHours = { ...defaultHours };

        Object.keys(defaultDays).forEach(day => {
          if (workingDays[day] && Array.isArray(workingDays[day])) {
            finalWorkingDays[day] = workingDays[day];
          }
          if (workingHours[day] && workingHours[day].start && workingHours[day].end) {
            finalWorkingHours[day] = workingHours[day];
          }
        });

        // Dilleri işle
        let processedLanguages = [];
        if (teacher.languages) {
          if (Array.isArray(teacher.languages)) {
            processedLanguages = [...teacher.languages];
          } else if (typeof teacher.languages === 'string') {
            // String ise virgülle ayrılmış olabilir
            processedLanguages = teacher.languages.split(',').map(lang => lang.trim()).filter(lang => lang);
          }
        }
        
        console.log('Processed languages:', processedLanguages);

        editingTeacher.value = teacher;
        teacherForm.value = {
          name: teacher.name || '',
          email: teacher.email || '',
          phone: teacher.phone || '',
          branch_id: teacher.branch_id || '',
          languages: processedLanguages,
          working_days: finalWorkingDays,
          working_hours: finalWorkingHours,
          status: teacher.status || 'active',
          image_path: teacher.image_path || ''
        };
        
        console.log('Form languages after setting:', teacherForm.value.languages);
        console.log('=== END EDIT TEACHER DEBUG ===');
        
        showAddModal.value = true;
      } catch (error) {
        console.error('Error in editTeacher:', error);
        showError('Öğretmen bilgileri yüklenirken bir hata oluştu');
      }
    }

    // Form validasyonu
    const isFormValid = computed(() => {
      return teacherForm.value.name && 
             teacherForm.value.email && 
             teacherForm.value.branch_id &&
             teacherForm.value.languages.length > 0 &&
             isValidEmail(teacherForm.value.email)
    })

    // E-posta validasyonu
    const isValidEmail = (email) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      return emailRegex.test(email)
    }

    // Öğretmen kaydetme
    const saveTeacher = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          toast.error('Oturum süresi dolmuş. Lütfen tekrar giriş yapın.')
          router.push('/login')
          return
        }

        // Proxy objelerini normal JavaScript objelerine dönüştür
        const normalizedWorkingDays = {};
        const normalizedWorkingHours = {};

        // Her gün için çalışma durumunu ve saatlerini kontrol et
        Object.keys(teacherForm.value.working_days).forEach(day => {
          // Çalışma günlerini normalize et
          normalizedWorkingDays[day] = [...teacherForm.value.working_days[day]];
          
          // Eğer gün seçili ise saatleri ekle
          if (teacherForm.value.working_days[day].includes("selected")) {
            normalizedWorkingHours[day] = {
              start: teacherForm.value.working_hours[day].start,
              end: teacherForm.value.working_hours[day].end
            };
          }
        });

        // Debug log
        console.log('Normalize edilmiş veriler:', {
          working_days: normalizedWorkingDays,
          working_hours: normalizedWorkingHours
        });

        const normalizedLanguages = Array.isArray(teacherForm.value.languages) 
          ? [...teacherForm.value.languages] 
          : [];

        const teacherData = {
          name: teacherForm.value.name,
          email: teacherForm.value.email,
          password: teacherForm.value.password || undefined, // Boşsa undefined gönder
          phone: teacherForm.value.phone,
          branch_id: teacherForm.value.branch_id,
          languages: normalizedLanguages,
          working_days: normalizedWorkingDays,
          working_hours: normalizedWorkingHours,
          status: teacherForm.value.status || 'active',
          image_path: teacherForm.value.image_path || ''
        }

        // Debug log - API'ye gönderilecek veri
        console.log('API\'ye gönderilecek veri:', JSON.stringify(teacherData, null, 2));

        const headers = {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }

        if (editingTeacher.value) {
          const response = await axios.put(`/api/teachers/${editingTeacher.value.id}`, teacherData, { headers })
          console.log('API güncelleme yanıtı:', response.data)
          toast.success('Öğretmen başarıyla güncellendi')
        } else {
          const response = await axios.post('/api/teachers', teacherData, { headers })
          console.log('API ekleme yanıtı:', response.data)
          
          // Varsayılan şifre bilgisi varsa göster
          if (response.data.temporaryPassword) {
            toast.success(`Öğretmen başarıyla eklendi. Şifre: ${response.data.temporaryPassword}`)
          } else {
            toast.success('Öğretmen başarıyla eklendi')
          }
        }

        showAddModal.value = false
        editingTeacher.value = null
        resetForm()
        fetchTeachers()
      } catch (error) {
        console.error('Öğretmen kaydetme hatası:', {
          error: error.message,
          response: error.response?.data,
          status: error.response?.status
        })
        
        if (error.response?.status === 403) {
          toast.error('Bu işlem için admin yetkisi gerekiyor')
        } else if (error.response?.data?.error) {
          toast.error(error.response.data.error)
        } else {
          toast.error('Öğretmen kaydedilirken bir hata oluştu')
        }
      }
    }

    const closeModal = () => {
      showAddModal.value = false
      editingTeacher.value = null
      resetForm()
    }

    // Form sıfırlama fonksiyonu
    const resetForm = () => {
      teacherForm.value = {
        name: '',
        email: '',
        password: '',
        phone: '',
        branch_id: '',
        languages: [],
        working_days: {
          Pazartesi: [],
          Salı: [],
          Çarşamba: [],
          Perşembe: [],
          Cuma: [],
          Cumartesi: [],
          Pazar: []
        },
        working_hours: {
          Pazartesi: { start: '09:00', end: '17:00' },
          Salı: { start: '09:00', end: '17:00' },
          Çarşamba: { start: '09:00', end: '17:00' },
          Perşembe: { start: '09:00', end: '17:00' },
          Cuma: { start: '09:00', end: '17:00' },
          Cumartesi: { start: '09:00', end: '17:00' },
          Pazar: { start: '09:00', end: '17:00' }
        },
        status: 'active',
        image_path: ''
      }
    }

    // Öğretmen silme
    const deleteTeacher = async (teacher) => {
      const confirmed = await toast.confirm('Bu öğretmeni silmek istediğinizden emin misiniz?', 'Öğretmen Silme')
      if (!confirmed) return
      
      try {
        await axios.delete(`/api/teachers/${teacher.id}`)
        showSuccess('Öğretmen başarıyla silindi')
        await fetchTeachers()
      } catch (error) {
        console.error('Error deleting teacher:', error)
        const errorMessage = error.response?.data?.error || 'Öğretmen silinirken bir hata oluştu'
        showError(errorMessage)
      }
    }

    // Sadece seçili günleri döndüren fonksiyon
    const filteredWorkingDays = (teacher) => {
      if (!teacher.working_days) return [];
      return Object.entries(teacher.working_days)
        .filter(([, hours]) => Array.isArray(hours) && hours.length > 0)
        .map(([day]) => day);
    };

    const handleImageUploadSuccess = (imagePath) => {
      console.log('=== FRONTEND RESİM YÜKLEME DEBUG ===');
      console.log('Upload imagePath:', imagePath);
      console.log('ImagePath type:', typeof imagePath);
      
      if (imagePath) {
        teacherForm.value.image_path = imagePath;
        console.log('Form image_path updated:', teacherForm.value.image_path);
        showSuccess('Resim başarıyla yüklendi');
        
        // Öğretmen listesini yeniden yükle
        fetchTeachers();
      } else {
        console.error('Invalid imagePath:', imagePath);
        showError('Resim yüklendi ama yol bilgisi alınamadı');
      }
    }

    onMounted(() => {
      fetchTeachers()
      fetchBranches()
    })

    return {
      teachers,
      branches,
      showAddModal,
      editingTeacher,
      selectedTeachers,
      selectAll,
      hasSelectedTeachers,
      toggleSelectAll,
      toggleTeacherSelection,
      editSelectedTeachers,
      deleteSelectedTeachers,
      editTeacher,
      saveTeacher,
      closeModal,
      deleteTeacher,
      showSuccess,
      showError,
      teacherForm,
      isFormValid,
      isValidEmail,
      languageOptions,
      weekDays,
      timeSlots,
      handleDayChange,
      handleTimeChange,
      resetForm,
      filteredWorkingDays,
      handleImageUploadSuccess,
      getImageUrl
    }
  }
}
</script>

<style scoped>
.teachers-page {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.header-actions button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  border: none;
  color: white;
}

.header-actions button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.header-actions .add-btn {
  background-color: #4CAF50;
}

.header-actions .edit-btn {
  background-color: #2196F3;
}

.header-actions .delete-btn {
  background-color: #f44336;
}

.teachers-list {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  overflow: hidden;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

th {
  background-color: #f8f9fa;
  font-weight: 600;
}

tr {
  cursor: pointer;
  transition: background-color 0.2s;
}

tr:hover {
  background-color: #f8f9fa;
}

tr.selected {
  background-color: #e3f2fd !important;
}

.edit-btn, .delete-btn {
  border: none;
  background: none;
  cursor: pointer;
  padding: 4px 8px;
  margin: 0 4px;
}

.edit-btn {
  color: #2196F3;
}

.delete-btn {
  color: #f44336;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal-content {
  background: white;
  padding: 20px;
  border-radius: 8px;
  width: 600px;
  max-width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
}

.form-group input,
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.cancel-btn,
.save-btn {
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

.cancel-btn {
  background-color: #f8f9fa;
  border: 1px solid #ddd;
}

.save-btn {
  background-color: #4CAF50;
  color: white;
  border: none;
}

.languages-list,
.courses-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.language-tag,
.course-tag {
  background-color: #e3f2fd;
  color: #1976d2;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.9em;
}

.working-days {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.day-schedule {
  font-size: 0.9em;
  color: #666;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.9em;
  font-weight: 500;
}

.status-badge.active {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.status-badge.inactive {
  background-color: #ffebee;
  color: #c62828;
}

.required {
  color: #f44336;
  margin-left: 4px;
}

.languages-checkbox {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 10px;
  margin-top: 10px;
}

.language-checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
}

.language-checkbox input[type="checkbox"] {
  width: auto;
  margin: 0;
}

.language-checkbox label {
  margin: 0;
  font-weight: normal;
  cursor: pointer;
}

.working-days-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-top: 10px;
}

.day-column {
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 10px;
}

.day-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}

.day-header input[type="checkbox"] {
  width: auto;
  margin: 0;
}

.day-header label {
  margin: 0;
  font-weight: 600;
  cursor: pointer;
}

.time-inputs {
  margin-top: 10px;
}

.time-range {
  display: flex;
  align-items: center;
  gap: 8px;
}

.time-range input[type="time"] {
  width: 120px;
  padding: 6px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.time-range input[type="time"]:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
}

.time-range span {
  color: #666;
}

.save-btn:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.teacher-photo {
  display: flex;
  justify-content: center;
  align-items: center;
}

.teacher-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #e0e0e0;
}

.no-photo {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: #f5f5f5;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #999;
  border: 2px solid #e0e0e0;
}

.current-image {
  margin-bottom: 15px;
  text-align: center;
}

.current-teacher-image {
  width: 120px;
  height: 120px;
  border-radius: 8px;
  object-fit: cover;
  border: 2px solid #ddd;
  margin-bottom: 8px;
}

.image-info {
  color: #666;
  font-size: 0.9em;
  margin: 0;
}

/* Mobil Responsive Tasarım */
@media (max-width: 768px) {
  .teachers-page {
    padding: 10px;
  }

  .page-header {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
  }

  .header-actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }

  .header-actions button {
    padding: 12px 16px;
    font-size: 14px;
    min-height: 44px;
  }

  /* Tablo mobil görünümü */
  .teachers-list {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  table {
    min-width: 800px;
    font-size: 12px;
  }

  th, td {
    padding: 8px 4px;
    min-width: 80px;
  }

  .teacher-avatar {
    width: 30px;
    height: 30px;
  }

  .no-photo {
    width: 30px;
    height: 30px;
  }

  /* Modal mobil optimizasyonu */
  .modal-content {
    width: 95% !important;
    max-width: 95% !important;
    margin: 10px;
    padding: 15px;
    max-height: 90vh;
    overflow-y: auto;
  }

  .modal-content h3 {
    font-size: 1.2rem;
    margin-bottom: 15px;
  }

  .form-group {
    margin-bottom: 12px;
  }

  .form-group label {
    font-size: 14px;
  }

  .form-group input,
  .form-group textarea,
  .form-group select {
    padding: 12px;
    font-size: 16px; /* iOS zoom'u engellemek için */
    border-radius: 6px;
  }

  .languages-checkbox {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 8px;
  }

  .working-days-grid {
    grid-template-columns: 1fr;
    gap: 15px;
  }

  .form-actions {
    flex-direction: column;
    gap: 10px;
  }

  .form-actions button {
    width: 100%;
    padding: 12px;
    font-size: 16px;
    min-height: 44px;
  }

  .help-text {
    font-size: 12px;
  }
}

@media (max-width: 480px) {
  .teachers-page {
    padding: 5px;
  }

  .page-header h2 {
    font-size: 1.5rem;
  }

  .header-actions {
    grid-template-columns: 1fr;
  }

  table {
    font-size: 11px;
    min-width: 600px;
  }

  th, td {
    padding: 6px 2px;
  }

  .modal-content {
    padding: 10px;
  }

  .languages-checkbox {
    grid-template-columns: 1fr;
  }

  .current-teacher-image {
    width: 80px;
    height: 80px;
  }
}
</style> 