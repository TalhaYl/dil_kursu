<template>
  <div class="courses-page">
    <div class="page-header">
      <div class="header-left">
        <h2>Kurslar</h2>
        <div v-if="selectedCourses.length > 0" class="selection-info">
          <i class="fas fa-info-circle"></i>
          {{ selectedCourses.length }} kurs seçili
        </div>
      </div>
      <div class="header-buttons">
        <button class="show-inactive-btn" @click="toggleShowInactive" :class="{ 'active': showInactive }">
          <i class="fas" :class="showInactive ? 'fa-eye-slash' : 'fa-eye'"></i>
          {{ showInactive ? 'Sadece Aktif Kursları Göster' : 'Tüm Kursları Göster (Tamamlanmış/İptal Dahil)' }}
        </button>
        <button class="add-btn" @click="showAddModal = true">
          <i class="fas fa-plus"></i> Yeni Kurs
        </button>
        <button class="edit-btn" @click="editCourse(selectedCourse)" :disabled="!selectedCourse">
          <i class="fas fa-edit"></i> 
          {{ selectedCourse ? 'Düzenle' : 'Düzenle (Kurs Seçin)' }}
        </button>
        <button class="delete-btn" @click="deleteCourse(selectedCourse?.id)" :disabled="!selectedCourse">
          <i class="fas fa-trash"></i> 
          {{ selectedCourse ? 'Sil' : 'Sil (Kurs Seçin)' }}
        </button>
      </div>
    </div>

    <!-- Kurs Listesi -->
    <div class="courses-list">
      <table>
        <thead>
          <tr>
            <th style="width: 50px;">
              <input type="checkbox" v-model="selectAll" @change="toggleSelectAll">
            </th>
            <th>Kurs Adı</th>
            <th>Dil</th>
            <th>Seviye</th>
            <th>Öğretmen</th>
            <th>Sınıf</th>
            <th>Şube</th>
            <th>Öğrenci Sayısı</th>
            <th>Başlangıç</th>
            <th>Bitiş</th>
            <th>Durum</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="course in courses" :key="course.id" 
              :class="{ 'selected': selectedCourses.includes(course.id) }"
              @click="toggleCourseSelection(course.id)">
            <td @click.stop>
              <input type="checkbox" v-model="selectedCourses" :value="course.id">
            </td>
            <td>{{ course.name }}</td>
            <td>{{ course.language }}</td>
            <td>{{ course.level || 'A1' }}</td>
            <td>{{ course.teacher_name || course.teacher?.name || 'Öğretmen bilgisi yok' }}</td>
            <td>{{ course.classroom_name }}</td>
            <td>{{ course.branch_name }}</td>
            <td>
              <div class="student-count">
                <span class="current-students">{{ course.current_students || 0 }}</span>
                <span class="separator">/</span>
                <span class="max-students">{{ course.max_students || 0 }}</span>
              </div>
              <div class="enrollment-bar">
                <div class="enrollment-fill" :style="{ width: getEnrollmentPercentage(course) + '%' }"></div>
              </div>
            </td>
            <td>{{ formatDate(course.start_date) }}</td>
            <td>{{ formatDate(course.end_date) }}</td>
            <td>
              <span :class="['status-badge', course.status]">
                {{ course.status === 'active' ? 'Aktif' : 
                   course.status === 'completed' ? 'Tamamlandı' : 'İptal Edildi' }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Kurs Ekleme/Düzenleme Modal -->
    <el-dialog
        v-model="showAddModal"
        :title="editingCourse ? 'Kurs Düzenle' : 'Yeni Kurs Ekle'"
        width="70%"
    >
        <el-form :model="form" label-width="120px">
            <el-form-item label="Kurs Adı">
                <el-input v-model="form.name" />
            </el-form-item>
            <el-form-item label="Dil">
                <el-select v-model="form.language" placeholder="Dil seçin" @change="filterTeachersByLanguage">
                    <el-option
                        v-for="lang in availableLanguages"
                        :key="lang"
                        :label="lang"
                        :value="lang"
                    />
                </el-select>
            </el-form-item>
            
            <el-form-item label="Seviye">
                <el-select v-model="form.level" placeholder="Seviye seçin">
                    <el-option label="A1" value="A1" />
                    <el-option label="A2" value="A2" />
                    <el-option label="B1" value="B1" />
                    <el-option label="B2" value="B2" />
                    <el-option label="C1" value="C1" />
                    <el-option label="C2" value="C2" />
                </el-select>
            </el-form-item>

            <el-form-item label="Başlangıç Tarihi">
                <el-date-picker v-model="form.start_date" type="date" />
            </el-form-item>
            <el-form-item label="Bitiş Tarihi">
                <el-date-picker v-model="form.end_date" type="date" />
            </el-form-item>
            <el-form-item label="Müsait Öğretmenler">
                <el-select v-model="form.teacher_id" placeholder="Öğretmen seçin">
                    <el-option
                        v-for="teacher in filteredTeachers"
                        :key="teacher.id"
                        :label="teacher.name"
                        :value="teacher.id"
                    >
                        <span>{{ teacher.name }}</span>
                        <span class="text-gray-500 ml-2" v-if="teacher.languages && Array.isArray(teacher.languages)">
                            ({{ teacher.languages.join(', ') }})
                        </span>
                        <span class="text-orange-500 ml-2" v-if="editingCourse && teacher.id === form.teacher_id && !teacher.languages?.includes(form.language)">
                            (Mevcut öğretmen - farklı dil)
                        </span>
                    </el-option>
                </el-select>
            </el-form-item>
            <el-form-item label="Müsait Sınıflar">
                <el-select v-model="form.classroom_id" placeholder="Sınıf seçin" @change="handleClassroomSelect">
                    <el-option
                        v-for="classroom in classrooms"
                        :key="classroom.id"
                        :label="classroom.name"
                        :value="classroom.id"
                    >
                        <span>{{ classroom.name }}</span>
                        <span class="text-gray-500 ml-2">
                            (Kapasite: {{ classroom.capacity }})
                        </span>
                    </el-option>
                </el-select>
            </el-form-item>
            <el-form-item label="Şube">
                <el-select v-model="form.branch_id" placeholder="Şube seçin">
                    <el-option
                        v-for="branch in branches"
                        :key="branch.id"
                        :label="branch.name"
                        :value="branch.id"
                    />
                </el-select>
            </el-form-item>
            <el-form-item label="Ders Programı">
                <div class="schedule-container">
                    <div class="days-selection">
                        <h4>Günleri Seçin:</h4>
                        <div class="days-grid">
                            <div v-for="day in weekDays" :key="day" class="day-item">
                                <el-checkbox 
                                    v-model="form.schedule[day].enabled"
                                    :disabled="!(selectedTeacher && selectedTeacher.working_days && selectedTeacher.working_days[day] && selectedTeacher.working_days[day].length > 0)"
                                    @change="onDayToggle(day)"
                                >
                                    {{ day }}
                                </el-checkbox>
                                <div v-if="selectedTeacher && selectedTeacher.working_hours && selectedTeacher.working_hours[day]" class="teacher-hours">
                                    ({{ selectedTeacher.working_hours[day].start }} - {{ selectedTeacher.working_hours[day].end }})
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div v-if="hasSelectedDays" class="time-slots-selection">
                        <h4>Ders Saatlerini Seçin:</h4>

                        <div class="time-slots-grid">
                            <el-checkbox-group 
                                v-model="form.selectedTimeSlots"
                                @change="onTimeSlotChange"
                                class="time-slots-group"
                            >
                                <el-checkbox 
                                    v-for="timeSlot in availableTimeSlots" 
                                    :key="timeSlot.value"
                                    :value="timeSlot.value"
                                    class="time-slot-item"
                                >
                                    {{ timeSlot.label }}
                                </el-checkbox>
                            </el-checkbox-group>
                        </div>
                    </div>
                    
                    <div v-if="hasSelectedDays && form.selectedTimeSlots.length > 0" class="schedule-preview">
                        <h4>Ders Programı Özeti:</h4>
                        <div class="schedule-summary">
                            <div v-for="day in enabledDays" :key="day" class="day-schedule">
                                <strong>{{ day }}:</strong>
                                <div class="day-schedule-details">
                                    <div class="time-range">
                                        <span v-if="form.schedule[day] && form.schedule[day].start && form.schedule[day].end">
                                            {{ form.schedule[day].start }} - {{ form.schedule[day].end }}
                                        </span>
                                    </div>
                                    <div class="time-slots">
                                        <span v-for="(timeSlot, index) in form.selectedTimeSlots" :key="index" class="time-slot-tag">
                                            {{ timeSlot }}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>


                    </div>
                </div>
            </el-form-item>
            <el-form-item label="Max Öğrenci">
                <el-input 
                    v-model="form.max_students" 
                    type="number"
                    :min="1"
                    :max="selectedClassroom?.capacity || 20"
                    @change="validateMaxStudents"
                />
                <span v-if="selectedClassroom" class="text-gray-500 text-sm">
                    Sınıf Kapasitesi: {{ selectedClassroom.capacity }}
                </span>
            </el-form-item>
            <el-form-item label="Kurs Resmi">
                <ImageUploader
                    v-model="form.image_path"
                    :upload-url="editingCourse && form.image_path ? `/api/courses/${editingCourse.id}/image` : '/api/courses/temp/image'"
                    placeholder-text="Kurs resmini buraya sürükleyin veya tıklayın"
                    @upload-success="handleImageUploadSuccess"
                />
                <el-button v-if="form.image_path" @click="form.image_path = ''" type="danger" size="small" style="margin-top: 10px;">Resmi Kaldır</el-button>
            </el-form-item>
            <el-form-item label="Durum">
                <el-select v-model="form.status">
                    <el-option value="active">Aktif</el-option>
                    <el-option value="completed">Tamamlandı</el-option>
                    <el-option value="cancelled">İptal Edildi</el-option>
                </el-select>
            </el-form-item>
            <el-form-item>
                <el-button type="primary" @click="saveCourse">Kaydet</el-button>
                <el-button @click="showAddModal = false">İptal</el-button>
            </el-form-item>
        </el-form>
    </el-dialog>
  </div>
</template>

<script>
import { ref, onMounted, watch, computed } from 'vue'
import axios from 'axios'
import toast from '@/utils/toast'
import ImageUploader from '@/components/ImageUploader.vue'

export default {
  name: 'CoursesView',
  components: { ImageUploader },
  setup() {
    const courses = ref([])
    const teachers = ref([])
    const branches = ref([])
    const classrooms = ref([])
    const showAddModal = ref(false)
    const editingCourse = ref(null)
    const selectedCourses = ref([])
    const selectAll = ref(false)
    const showInactive = ref(false)
    const availableLanguages = ['Türkçe', 'İngilizce', 'Almanca', 'Fransızca', 'İspanyolca', 'İtalyanca', 'Rusça', 'Arapça', 'Çince', 'Japonca']
    const weekDays = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar']
    
    const form = ref({
      name: '',
      description: '',
      teacher_id: '',
      classroom_id: '',
      branch_id: '',
      language: '',
      level: 'A1',
      start_date: '',
      end_date: '',
      schedule: weekDays.reduce((acc, day) => {
        acc[day] = { 
          enabled: false 
        };
        return acc;
      }, {}),
      selectedTimeSlots: [],
      max_students: 20,
      status: 'active',
      image_path: ''
    })

    const availableTeachers = ref([])
    const availableClassrooms = ref([])
    const filteredTeachers = ref([])
    const selectedTeacher = ref(null)
    const selectedClassroom = ref(null)
    
    // Saat slotları (1 saatlik bloklar)
    const availableTimeSlots = ref([
      { value: '09:00-10:00', label: '09:00 - 10:00' },
      { value: '10:00-11:00', label: '10:00 - 11:00' },
      { value: '11:00-12:00', label: '11:00 - 12:00' },
      { value: '12:00-13:00', label: '12:00 - 13:00' },
      { value: '13:00-14:00', label: '13:00 - 14:00' },
      { value: '14:00-15:00', label: '14:00 - 15:00' },
      { value: '15:00-16:00', label: '15:00 - 16:00' },
      { value: '16:00-17:00', label: '16:00 - 17:00' },
      { value: '17:00-18:00', label: '17:00 - 18:00' },
      { value: '18:00-19:00', label: '18:00 - 19:00' },
      { value: '19:00-20:00', label: '19:00 - 20:00' },
      { value: '20:00-21:00', label: '20:00 - 21:00' }
    ])
    
    // Computed properties
    const hasSelectedDays = computed(() => {
      return Object.values(form.value.schedule).some(day => day.enabled)
    })
    
    const enabledDays = computed(() => {
      return weekDays.filter(day => form.value.schedule[day].enabled)
    })

    // Seçili tek kurs
    const selectedCourse = computed(() => {
      if (selectedCourses.value.length === 1) {
        return courses.value.find(course => course.id === selectedCourses.value[0])
      }
      return null
    })

    // Tümünü seç/kaldır
    const toggleSelectAll = () => {
      if (selectAll.value) {
        selectedCourses.value = courses.value.map(course => course.id)
      } else {
        selectedCourses.value = []
      }
    }

    // Kurs seçimi toggle
    const toggleCourseSelection = (courseId) => {
      const index = selectedCourses.value.indexOf(courseId)
      if (index > -1) {
        selectedCourses.value.splice(index, 1)
      } else {
        selectedCourses.value.push(courseId)
      }
    }

    // Kursları getir
    const fetchCourses = async () => {
      try {
        const response = await axios.get('/api/courses', {
          params: {
            showInactive: showInactive.value
          }
        })
        courses.value = response.data
      } catch (error) {
        toast.error('Kurslar yüklenirken bir hata oluştu: ' + (error.response?.data?.error || error.message))
      }
    }

    // Öğretmenleri getir
    const fetchTeachers = async () => {
      try {
        const response = await axios.get('/api/teachers')
        teachers.value = response.data.map(teacher => ({
          id: teacher.id,
          name: teacher.name,
          languages: teacher.languages,
          working_days: typeof teacher.working_days === 'string' ? 
            JSON.parse(teacher.working_days) : teacher.working_days,
          working_hours: typeof teacher.working_hours === 'string' ? 
            JSON.parse(teacher.working_hours) : teacher.working_hours
        }))
        filteredTeachers.value = [...teachers.value]
      } catch (error) {
        toast.error('Öğretmenler yüklenirken bir hata oluştu')
      }
    }

    // Şubeleri getir
    const fetchBranches = async () => {
      try {
        const response = await axios.get('/api/branches')
        branches.value = response.data
      } catch (error) {
        toast.error('Şubeler yüklenirken bir hata oluştu')
      }
    }

    // Sınıfları getir
    const fetchClassrooms = async () => {
      try {
        // Eğer şube seçili ise sadece o şubenin sınıflarını getir
        if (form.value.branch_id) {
          await filterClassroomsByBranch(form.value.branch_id)
        } else {
          const response = await axios.get('/api/classrooms')
          classrooms.value = response.data.map(classroom => ({
            id: classroom.id,
            name: classroom.name,
            capacity: classroom.capacity
          }))
        }
      } catch (error) {
        toast.error('Sınıflar yüklenirken bir hata oluştu')
      }

    }

    // Kurs düzenleme
    const editCourse = async (course) => {
      editingCourse.value = course
      
      try {
        // Backend'den gelen course objesinde artık teacher bilgisi mevcut
        if (course.teacher && course.teacher.id) {
          selectedTeacher.value = {
            id: course.teacher.id,
            name: course.teacher.name,
            working_days: course.teacher.working_days || {},
            working_hours: course.teacher.working_hours || {}
          };
        } else if (course.teacher_id) {
          // Fallback: Eğer course.teacher yoksa ama teacher_id varsa, API'den getir
          const teacherResponse = await axios.get(`/api/courses/teacher-hours/${course.teacher_id}`);
          
          selectedTeacher.value = {
            id: course.teacher_id,
            name: course.teacher_name || 'Bilinmeyen Öğretmen',
            working_days: teacherResponse.data.working_days || {},
            working_hours: teacherResponse.data.available_hours || {}
          };
        } else {
          selectedTeacher.value = null;
        }
        
        // Form verilerini ayarla
        const schedule = course.schedule || {};
        const defaultSchedule = weekDays.reduce((acc, day) => {
          acc[day] = { enabled: false };
          return acc;
        }, {});

        let allSelectedTimeSlots = [];

        // Mevcut programı işle
        Object.entries(schedule).forEach(([day, times]) => {
          if (times && times.start && times.end) {
            defaultSchedule[day] = {
              start: times.start,
              end: times.end,
              enabled: true,
              slots: times.slots || []
            };
            
            // Eğer slots varsa, onları allSelectedTimeSlots'a ekle
            if (times.slots && times.slots.length > 0) {
              times.slots.forEach(slot => {
                if (!allSelectedTimeSlots.includes(slot)) {
                  allSelectedTimeSlots.push(slot);
                }
              });
            } else {
              // Eski format için saat aralığından slot oluştur
              const startHour = parseInt(times.start.split(':')[0]);
              const endHour = parseInt(times.end.split(':')[0]);
              for (let hour = startHour; hour < endHour; hour++) {
                const slotValue = `${hour.toString().padStart(2, '0')}:00-${(hour + 1).toString().padStart(2, '0')}:00`;
                if (!allSelectedTimeSlots.includes(slotValue)) {
                  allSelectedTimeSlots.push(slotValue);
                }
              }
            }
          }
        });

        form.value = {
          name: course.name,
          language: course.language,
          level: course.level || 'A1',
          teacher_id: course.teacher_id,
          branch_id: course.branch_id,
          classroom_id: course.classroom_id,
          start_date: course.start_date,
          end_date: course.end_date,
          schedule: defaultSchedule,
          selectedTimeSlots: allSelectedTimeSlots,
          max_students: course.max_students || 20,
          status: course.status || 'active',
          image_path: course.image_path || ''
        }

        // Şubeye göre sınıfları filtrele
        if (course.branch_id) {
          await filterClassroomsByBranch(course.branch_id);
        }

        // Dile göre öğretmenleri filtrele (teacher_id set edildikten sonra)
        if (course.language) {
          filterTeachersByLanguage();
        }

      } catch (error) {
        toast.error('Kurs bilgileri yüklenirken bir hata oluştu: ' + (error.response?.data?.error || error.message));
      }

      showAddModal.value = true
    }

    // Gün seçimi değiştiğinde
    const onDayToggle = () => {
      updateScheduleFromSelections()
    }
    
    // Saat slotu seçimi değiştiğinde
    const onTimeSlotChange = () => {
      updateScheduleFromSelections()
    }
    
    // Seçilen günler ve saatlerden schedule objesi oluştur
    const updateScheduleFromSelections = () => {
      weekDays.forEach(day => {
        if (form.value.schedule[day].enabled && form.value.selectedTimeSlots.length > 0) {
          // Seçilen saat slotlarını birleştir
          const timeSlots = form.value.selectedTimeSlots.map(slot => {
            const [start, end] = slot.split('-')
            return { start, end }
          })
          
          // İlk ve son saati al
          const startTime = timeSlots[0].start
          const endTime = timeSlots[timeSlots.length - 1].end
          
          form.value.schedule[day] = {
            enabled: true,
            start: startTime,
            end: endTime,
            slots: form.value.selectedTimeSlots
          }
        } else if (!form.value.schedule[day].enabled) {
          form.value.schedule[day] = { enabled: false }
        }
      })
    }

    // Kurs kaydetme
    const saveCourse = async () => {
      try {
        // Zorunlu alanların kontrolü
        const requiredFields = {
          'Kurs Adı': form.value.name,
          'Dil': form.value.language,
          'Öğretmen': form.value.teacher_id,
          'Sınıf': form.value.classroom_id,
          'Şube': form.value.branch_id,
          'Başlangıç Tarihi': form.value.start_date,
          'Bitiş Tarihi': form.value.end_date
        };

        const missingFields = Object.entries(requiredFields)
          .filter(([, value]) => !value)
          .map(([key]) => key);

        if (missingFields.length > 0) {
          toast.error(`Lütfen şu alanları doldurun: ${missingFields.join(', ')}`);
          return;
        }

        // Ders programı kontrolü
        const hasValidSchedule = Object.entries(form.value.schedule).some(([, dayData]) => {
          return dayData.enabled;
        });

        if (!hasValidSchedule) {
          toast.error('En az bir gün seçmelisiniz');
          return;
        }

        if (form.value.selectedTimeSlots.length === 0) {
          toast.error('En az bir saat dilimi seçmelisiniz');
          return;
        }

        const courseData = {
          name: form.value.name,
          language: form.value.language,
          level: form.value.level || 'A1',
          teacher_id: form.value.teacher_id,
          classroom_id: form.value.classroom_id,
          branch_id: form.value.branch_id,
          course_type: form.value.course_type || 'Physical',
          start_date: form.value.start_date ? new Date(form.value.start_date).toISOString().split('T')[0] : '',
          end_date: form.value.end_date ? new Date(form.value.end_date).toISOString().split('T')[0] : '',
          schedule: Object.entries(form.value.schedule).reduce((acc, [day, dayData]) => {
            if (dayData.enabled && dayData.start && dayData.end) {
              acc[day] = {
                start: dayData.start,
                end: dayData.end,
                slots: dayData.slots || []
              };
            }
            return acc;
          }, {}),
          status: form.value.status || 'active',
          image_path: form.value.image_path || ''
        };

        if (form.value.max_students) courseData.max_students = form.value.max_students;

        if (editingCourse.value) {
          await axios.put(`/api/courses/${editingCourse.value.id}`, courseData);
        } else {
          await axios.post('/api/courses', courseData);
        }
        
        showAddModal.value = false;
        editingCourse.value = null;
        form.value = {
          name: '',
          language: '',
          level: 'A1',
          teacher_id: '',
          branch_id: '',
          classroom_id: '',
          start_date: '',
          end_date: '',
          schedule: weekDays.reduce((acc, day) => {
            acc[day] = { enabled: false };
            return acc;
          }, {}),
          selectedTimeSlots: [],
          max_students: 20,
          status: 'active',
          image_path: ''
        };
        
        await fetchCourses();
                  toast.success('Kurs başarıyla kaydedildi!')
              } catch (error) {
          toast.error('Kurs kaydedilirken bir hata oluştu: ' + (error.response?.data?.error || error.message));
        }
    };

    // Kurs silme
    const deleteCourse = async (id) => {
      const confirmed = await toast.confirm('Bu kursu silmek istediğinizden emin misiniz?', 'Kurs Silme')
      if (confirmed) {
        try {
          await axios.delete(`/api/courses/${id}`)
          toast.success('Kurs başarıyla silindi')
          fetchCourses()
        } catch (error) {
          const errorMessage = error.response?.data?.error || 'Kurs silinirken bir hata oluştu'
          toast.error(errorMessage)
        }
      }
    }

    // Tarih formatla
    const formatDate = (date) => {
      if (!date) return '-'
      return new Date(date).toLocaleDateString('tr-TR')
    }

    // Kayıt yüzdesi hesapla
    const getEnrollmentPercentage = (course) => {
      if (!course.max_students || course.max_students === 0) return 0
      const percentage = ((course.current_students || 0) / course.max_students) * 100
      return Math.min(percentage, 100) // 100'ü geçmesin
    }

    // Seçilen dile göre öğretmenleri filtrele
    const filterTeachersByLanguage = () => {
      if (!form.value.language) {
        filteredTeachers.value = [...teachers.value]
        return
      }

      // Dile göre filtrele
      let filtered = teachers.value.filter(teacher => 
        teacher.languages && 
        Array.isArray(teacher.languages) && 
        teacher.languages.includes(form.value.language)
      )

      // Eğer kurs düzenleme modundaysa ve mevcut öğretmen listede yoksa, onu da ekle
      if (editingCourse.value && form.value.teacher_id) {
        const currentTeacher = teachers.value.find(t => t.id === form.value.teacher_id)
        const isCurrentTeacherInFiltered = filtered.some(t => t.id === form.value.teacher_id)
        
        if (currentTeacher && !isCurrentTeacherInFiltered) {
          filtered.unshift(currentTeacher) // Başa ekle
        }
      }

      filteredTeachers.value = filtered

      if (filteredTeachers.value.length === 0) {
        toast.warning('Seçilen dilde ders verebilecek öğretmen bulunamadı')
      }
    }

    // Öğretmen seçildiğinde
    const handleTeacherSelect = async (teacherId) => {
      try {
        // Öğretmenin müsait saatlerini getir
        const response = await axios.get(`/api/courses/teacher-hours/${teacherId}`);
        const teacherData = response.data;
        
        selectedTeacher.value = {
          id: teacherId,
          working_days: teacherData.working_days,
          working_hours: teacherData.available_hours
        };
        
        // Öğretmenin şubesini getir
        const teacherDetailsResponse = await axios.get(`/api/teachers/${teacherId}`);
        if (teacherDetailsResponse.data.branch_id) {
          form.value.branch_id = teacherDetailsResponse.data.branch_id;
          await filterClassroomsByBranch(teacherDetailsResponse.data.branch_id);
        }

        // Form'daki schedule'ı öğretmenin çalışma saatlerine göre sıfırla
        form.value.schedule = weekDays.reduce((acc, day) => {
          acc[day] = { enabled: false };
          return acc;
        }, {});
        
        // Saat seçimlerini de temizle
        form.value.selectedTimeSlots = [];

      } catch (error) {
        toast.error('Öğretmen bilgileri alınırken bir hata oluştu');
      }
    };

    // Şubeye göre sınıfları filtrele
    const filterClassroomsByBranch = async (branchId) => {
      try {
        const response = await axios.get(`/api/courses/classrooms/${branchId}`)
        classrooms.value = response.data.map(classroom => ({
          id: classroom.id,
          name: classroom.name,
          capacity: classroom.capacity
        }))
        
        // Eğer seçili bir sınıf varsa ve bu sınıf yeni şubede yoksa, seçimi temizle
        if (form.value.classroom_id) {
          const classroomExists = classrooms.value.some(c => c.id === form.value.classroom_id)
          if (!classroomExists) {
            form.value.classroom_id = ''
          }
        }
      } catch (error) {
        toast.error('Sınıflar yüklenirken bir hata oluştu')
      }

    }

    // Şube değiştiğinde sınıfları güncelle
    watch(() => form.value.branch_id, (newBranchId) => {
      if (newBranchId) {
        filterClassroomsByBranch(newBranchId)
      } else {
        classrooms.value = []
        form.value.classroom_id = ''
      }
    })

    // Dil değiştiğinde öğretmenleri filtrele
    watch(() => form.value.language, () => {
      const currentTeacherId = form.value.teacher_id
      filterTeachersByLanguage()
      
      // Eğer düzenleme modunda değilse teacher_id'yi temizle
      if (!editingCourse.value) {
        form.value.teacher_id = ''
        selectedTeacher.value = null
      } else {
        // Düzenleme modundaysa, mevcut öğretmen filtrelenmiş listede yoksa seçimi koru
        const isCurrentTeacherInFiltered = filteredTeachers.value.some(t => t.id === currentTeacherId)
        if (!isCurrentTeacherInFiltered && currentTeacherId) {
          // Öğretmen filtrelendi ama form'da kalması lazım
          form.value.teacher_id = currentTeacherId
        }
      }
    })

    // Öğretmen seçimi değiştiğinde
    watch(() => form.value.teacher_id, (newTeacherId) => {
      if (newTeacherId) {
        handleTeacherSelect(newTeacherId)
      }
    })

    const handleImageUploadSuccess = (imagePath) => {
      form.value.image_path = imagePath;
              toast.success('Resim başarıyla yüklendi');
    }

    // Tarihi geçmiş kursları göster/gizle
    const toggleShowInactive = () => {
      showInactive.value = !showInactive.value
      fetchCourses()
    }

    // Sınıf seçildiğinde
    const handleClassroomSelect = (classroomId) => {
      selectedClassroom.value = classrooms.value.find(c => c.id === classroomId);
      if (selectedClassroom.value) {
        // Maksimum öğrenci sayısını sınıf kapasitesine göre ayarla
        form.value.max_students = selectedClassroom.value.capacity;
      }
    }

    // Maksimum öğrenci sayısını doğrula
    const validateMaxStudents = (value) => {
      const numValue = parseInt(value);
      if (selectedClassroom.value && numValue > selectedClassroom.value.capacity) {
        form.value.max_students = selectedClassroom.value.capacity;
        toast.warning(`Maksimum öğrenci sayısı sınıf kapasitesini (${selectedClassroom.value.capacity}) geçemez`);
              } else if (numValue < 1) {
          form.value.max_students = 1;
          toast.warning('Maksimum öğrenci sayısı en az 1 olmalıdır');
      }
    }

    onMounted(() => {
      fetchCourses()
      fetchTeachers()
      fetchBranches()
      fetchClassrooms()
    })

    return {
      courses,
      teachers,
      branches,
      classrooms,
      showAddModal,
      editingCourse,
      selectedCourses,
      selectedCourse,
      selectAll,
      toggleSelectAll,
      toggleCourseSelection,
      showInactive,
      form,
      availableLanguages,
      weekDays,
      editCourse,
      saveCourse,
      deleteCourse,
      formatDate,
      availableTeachers,
      availableClassrooms,
      filteredTeachers,
      filterTeachersByLanguage,
      selectedTeacher,
      handleImageUploadSuccess,
      toggleShowInactive,
      handleClassroomSelect,
      validateMaxStudents,
      selectedClassroom,
      availableTimeSlots,
      hasSelectedDays,
      enabledDays,
      onDayToggle,
      onTimeSlotChange,
      updateScheduleFromSelections,
      getEnrollmentPercentage
    }
  }
}
</script>

<style scoped>
.courses-page {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.selection-info {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #e3f2fd;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  color: #1976d2;
  border: 1px solid #bbdefb;
}

.selection-info i {
  color: #2196F3;
}

.header-buttons {
  display: flex;
  gap: 10px;
}

.show-inactive-btn, .add-btn, .edit-btn, .delete-btn {
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.show-inactive-btn {
  background-color: #9e9e9e;
  color: white;
}

.show-inactive-btn:hover {
  background-color: #757575;
}

.show-inactive-btn.active {
  background-color: #616161;
}

.add-btn {
  background-color: #4CAF50;
  color: white;
}

.edit-btn {
  background-color: #2196F3;
  color: white;
}

.delete-btn {
  background-color: #f44336;
  color: white;
}

.add-btn:hover {
  background-color: #45a049;
}

.edit-btn:hover {
  background-color: #1976D2;
}

.delete-btn:hover {
  background-color: #D32F2F;
}

.add-btn:disabled, .edit-btn:disabled, .delete-btn:disabled {
  background-color: #cccccc !important;
  cursor: not-allowed;
  opacity: 0.6;
  color: #666 !important;
}

.edit-btn:disabled:hover, .delete-btn:disabled:hover {
  background-color: #cccccc !important;
  transform: none;
}

.courses-list {
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
  border-left: 4px solid #2196F3;
}

tr.selected td {
  font-weight: 500;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.status-badge.active {
  background-color: #4CAF50;
  color: white;
}

.status-badge.completed {
  background-color: #2196F3;
  color: white;
}

.status-badge.cancelled {
  background-color: #f44336;
  color: white;
}

input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
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
.form-group select {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.schedule-container {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.schedule-container h4 {
  margin: 0 0 15px 0;
  color: #495057;
  font-size: 16px;
  font-weight: 600;
}

.days-selection {
  margin-bottom: 25px;
}

.days-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
}

.day-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.teacher-hours {
  font-size: 12px;
  color: #6c757d;
  margin-left: 24px;
}

.time-slots-selection {
  margin-bottom: 25px;
}

.time-slots-grid {
  display: flex;
  flex-direction: column;
  max-height: 200px;
  overflow-y: auto;
  padding: 10px;
  background: white;
  border-radius: 6px;
  border: 1px solid #dee2e6;
}

.time-slots-group {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 10px;
}

.time-slot-item {
  display: flex;
  align-items: center;
}

.schedule-preview {
  background: white;
  padding: 15px;
  border-radius: 6px;
  border: 1px solid #dee2e6;
}

.schedule-summary {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.day-schedule {
  padding: 8px 12px;
  background: #e3f2fd;
  border-radius: 4px;
  border-left: 3px solid #2196F3;
}

.day-schedule strong {
  color: #1976d2;
  margin-right: 8px;
}

.day-schedule-details {
  margin-top: 5px;
}

.time-range {
  font-weight: 500;
  color: #1976d2;
  margin-bottom: 5px;
}

.time-slots {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.time-slot-tag {
  background: #ffffff;
  border: 1px solid #2196F3;
  border-radius: 12px;
  padding: 2px 8px;
  font-size: 11px;
  color: #1976d2;
}

.text-gray-500 {
  color: #666;
}

.ml-2 {
  margin-left: 0.5rem;
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

.busy-slots {
  margin-top: 5px;
  font-size: 0.9em;
  color: #f56c6c;
}

.student-count {
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 4px;
}

.current-students {
  color: #2196F3;
}

.separator {
  margin: 0 4px;
  color: #666;
}

.max-students {
  color: #666;
}

.enrollment-bar {
  width: 100%;
  height: 4px;
  background-color: #f0f0f0;
  border-radius: 2px;
  overflow: hidden;
}

.enrollment-fill {
  height: 100%;
  background-color: #4CAF50;
  border-radius: 2px;
  transition: width 0.3s ease;
}

.enrollment-fill[style*="100%"] {
  background-color: #FF9800;
}

.enrollment-fill[style*="width: 0%"] {
  background-color: #e0e0e0;
}

/* Mobil Responsive Tasarım */
@media (max-width: 768px) {
  .courses-page {
    padding: 10px;
  }

  .page-header {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
  }

  .header-left {
    align-items: flex-start;
  }

  .header-buttons {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }

  .header-buttons button {
    padding: 12px 16px;
    font-size: 14px;
    min-height: 44px;
    text-align: center;
  }

  /* Tablo mobil görünümü */
  .courses-list {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  table {
    min-width: 1000px;
    font-size: 12px;
  }

  th, td {
    padding: 8px 4px;
    min-width: 80px;
  }

  .student-count {
    font-size: 12px;
  }

  /* Modal mobil optimizasyonu */
  .el-dialog {
    width: 95% !important;
    margin: 10px !important;
  }

  .el-dialog__body {
    padding: 15px !important;
  }

  .el-form-item {
    margin-bottom: 15px;
  }

  .el-form-item__label {
    font-size: 14px !important;
  }

  .el-input__inner,
  .el-select .el-input__inner,
  .el-textarea__inner {
    padding: 12px !important;
    font-size: 16px !important; /* iOS zoom'u engellemek için */
  }

  /* Ders programı mobil optimizasyonu */
  .schedule-container {
    padding: 15px;
  }

  .days-grid {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .time-slots-group {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .time-slots-grid {
    max-height: 150px;
    padding: 8px;
  }

  .schedule-summary {
    gap: 6px;
  }

  .time-slots {
    gap: 2px;
  }

  .time-slot-tag {
    padding: 1px 6px;
    font-size: 10px;
  }

  /* Element Plus buton mobil optimizasyonu */
  .el-button {
    padding: 12px 20px !important;
    font-size: 14px !important;
    min-height: 44px !important;
  }

  .el-button--small {
    padding: 8px 15px !important;
    font-size: 12px !important;
    min-height: 36px !important;
  }
}

@media (max-width: 480px) {
  .courses-page {
    padding: 5px;
  }

  .page-header h2 {
    font-size: 1.5rem;
  }

  .header-buttons {
    grid-template-columns: 1fr;
  }

  table {
    font-size: 11px;
    min-width: 800px;
  }

  th, td {
    padding: 6px 2px;
  }

  .schedule-container {
    padding: 10px;
  }

  .schedule-container h4 {
    font-size: 14px;
  }

  .el-dialog {
    margin: 5px !important;
  }

  .el-dialog__body {
    padding: 10px !important;
  }

  .teacher-hours {
    font-size: 10px;
  }
}
</style> 