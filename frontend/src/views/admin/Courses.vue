<template>
  <div class="courses-page">
    <div class="page-header">
      <h2>Kurslar</h2>
      <div class="header-buttons">
        <button class="show-inactive-btn" @click="toggleShowInactive" :class="{ 'active': showInactive }">
          <i class="fas" :class="showInactive ? 'fa-eye-slash' : 'fa-eye'"></i>
          {{ showInactive ? 'Sadece Aktif Kursları Göster' : 'Tüm Kursları Göster (Tamamlanmış/İptal Dahil)' }}
        </button>
        <button class="add-btn" @click="showAddModal = true">
          <i class="fas fa-plus"></i> Yeni Kurs
        </button>
        <button class="edit-btn" @click="editCourse(selectedCourse)" :disabled="!selectedCourse">
          <i class="fas fa-edit"></i> Düzenle
        </button>
        <button class="delete-btn" @click="deleteCourse(selectedCourse?.id)" :disabled="!selectedCourse">
          <i class="fas fa-trash"></i> Sil
        </button>
      </div>
    </div>

    <!-- Kurs Listesi -->
    <div class="courses-list">
      <table>
        <thead>
          <tr>
            <th style="width: 50px;">
              <input type="checkbox" 
                     :checked="selectedCourse !== null"
                     @change="selectedCourse = selectedCourse ? null : courses[0]">
            </th>
            <th>ID</th>
            <th>Kurs Adı</th>
            <th>Dil</th>
            <th>Öğretmen</th>
            <th>Sınıf</th>
            <th>Şube</th>
            <th>Başlangıç</th>
            <th>Bitiş</th>
            <th>Durum</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="course in courses" :key="course.id" 
              :class="{ 'selected': selectedCourse?.id === course.id }"
              @click="selectedCourse = course">
            <td>
              <input type="checkbox" 
                     :checked="selectedCourse?.id === course.id"
                     @click.stop="selectedCourse = selectedCourse?.id === course.id ? null : course">
            </td>
            <td>{{ course.id }}</td>
            <td>{{ course.name }}</td>
            <td>{{ course.language }}</td>
            <td>{{ course.teacher_name || course.teacher?.name || 'Öğretmen bilgisi yok' }}</td>
            <td>{{ course.classroom_name }}</td>
            <td>{{ course.branch_name }}</td>
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
                <div class="schedule-grid">
                    <div v-for="day in weekDays" :key="day" 
                         :class="['schedule-day', { 'disabled': !(selectedTeacher && selectedTeacher.working_days && selectedTeacher.working_days[day] && selectedTeacher.working_days[day].length > 0) }]">
                        <div class="day-header">
                            <el-checkbox 
                                v-model="form.schedule[day].enabled"
                                :disabled="!(selectedTeacher && selectedTeacher.working_days && selectedTeacher.working_days[day] && selectedTeacher.working_days[day].length > 0)"
                            >
                                {{ day }}
                            </el-checkbox>
                        </div>
                        <template v-if="selectedTeacher && selectedTeacher.working_days && selectedTeacher.working_days[day] && selectedTeacher.working_days[day].length > 0">
                            <el-time-select
                                v-model="form.schedule[day].start"
                                :max-time="form.schedule[day].end"
                                start="00:00"
                                end="23:59"
                                :step="'00:30'"
                                placeholder="Başlangıç"
                                :disabled="!form.schedule[day].enabled"
                                format="HH:mm"
                                @change="(val) => form.schedule[day].start = toTimeString(val)"
                            />
                            <el-time-select
                                v-model="form.schedule[day].end"
                                :min-time="form.schedule[day].start"
                                start="00:00"
                                end="23:59"
                                :step="'00:30'"
                                placeholder="Bitiş"
                                :disabled="!form.schedule[day].enabled"
                                format="HH:mm"
                                @change="(val) => form.schedule[day].end = toTimeString(val)"
                            />
                            <div class="available-hours" v-if="selectedTeacher.working_hours && selectedTeacher.working_hours[day]">
                                Müsait Saatler: {{ selectedTeacher.working_hours[day].start }} - {{ selectedTeacher.working_hours[day].end }}
                                <div v-if="selectedTeacher.working_hours[day].busy_slots && selectedTeacher.working_hours[day].busy_slots.length > 0" class="busy-slots">
                                    Dolu Saatler:
                                    <div v-for="(slot, index) in selectedTeacher.working_hours[day].busy_slots" :key="index">
                                        {{ slot.start }} - {{ slot.end }}
                                    </div>
                                </div>
                            </div>
                            <div class="no-hours-info" v-else>
                                Bu gün için çalışma saatleri tanımlanmamış - Manuel saat seçimi yapabilirsiniz
                            </div>
                        </template>
                        <div v-else class="not-available">
                            Bu gün için müsait değil
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
import { ref, onMounted, watch } from 'vue'
import axios from 'axios'
import { ElMessage } from 'element-plus'
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
    const selectedCourse = ref(null)
    const showInactive = ref(false)
    const availableLanguages = ['Türkçe', 'İngilizce', 'Almanca', 'Fransızca', 'İspanyolca', 'İtalyanca', 'Rusça', 'Arapça']
    const weekDays = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar']
    
    const form = ref({
      name: '',
      description: '',
      teacher_id: '',
      classroom_id: '',
      branch_id: '',
      language: '',
      start_date: '',
      end_date: '',
      schedule: weekDays.reduce((acc, day) => {
        acc[day] = { 
          start: '',
          end: '',
          enabled: false 
        };
        return acc;
      }, {}),
      max_students: 20,
      status: 'active',
      image_path: ''
    })

    const availableTeachers = ref([])
    const availableClassrooms = ref([])
    const filteredTeachers = ref([])
    const selectedTeacher = ref(null)
    const selectedClassroom = ref(null)

    // Kursları getir
    const fetchCourses = async () => {
      try {
        console.log('Fetching courses...');
        const response = await axios.get('/api/courses', {
          params: {
            showInactive: showInactive.value
          }
        })
        console.log('Courses fetched successfully:', response.data);
        courses.value = response.data
      } catch (error) {
        console.error('Error fetching courses:', error)
        console.error('Error details:', error.response?.data);
        ElMessage.error('Kurslar yüklenirken bir hata oluştu: ' + (error.response?.data?.error || error.message))
      }
    }

    // Öğretmenleri getir
    const fetchTeachers = async () => {
      try {
        const response = await axios.get('/api/teachers')
        console.log('Fetched teachers data:', response.data); // Debug log
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
        console.error('Error fetching teachers:', error)
        ElMessage.error('Öğretmenler yüklenirken bir hata oluştu')
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
        console.error('Error fetching classrooms:', error)
        ElMessage.error('Sınıflar yüklenirken bir hata oluştu')
      }
    }

    // Kurs düzenleme
    const editCourse = async (course) => {
      editingCourse.value = course
      console.log('=== EDITING COURSE DEBUG ===');
      console.log('Full course object:', JSON.stringify(course, null, 2));
      console.log('course.teacher_id:', course.teacher_id);
      console.log('course.teacher_name:', course.teacher_name);
      console.log('course.teacher object:', course.teacher);
      
      try {
        // Backend'den gelen course objesinde artık teacher bilgisi mevcut
        if (course.teacher && course.teacher.id) {
          selectedTeacher.value = {
            id: course.teacher.id,
            name: course.teacher.name,
            working_days: course.teacher.working_days || {},
            working_hours: course.teacher.working_hours || {}
          };
          console.log('Selected teacher from course.teacher:', selectedTeacher.value);
        } else if (course.teacher_id) {
          // Fallback: Eğer course.teacher yoksa ama teacher_id varsa, API'den getir
          console.log('Teacher object not found in course, fetching from API...');
          const teacherResponse = await axios.get(`/api/courses/teacher-hours/${course.teacher_id}`);
          console.log('Teacher API response:', teacherResponse.data);
          
          selectedTeacher.value = {
            id: course.teacher_id,
            name: course.teacher_name || 'Bilinmeyen Öğretmen',
            working_days: teacherResponse.data.working_days || {},
            working_hours: teacherResponse.data.available_hours || {}
          };
          console.log('Selected teacher from API fallback:', selectedTeacher.value);
        } else {
          console.warn('No teacher information found in course data');
          selectedTeacher.value = null;
        }
        
        // Form verilerini ayarla
        const schedule = course.schedule || {};
        const defaultSchedule = weekDays.reduce((acc, day) => {
          acc[day] = { 
            start: '',
            end: '',
            enabled: false 
          };
          return acc;
        }, {});

        // Mevcut programı işle
        Object.entries(schedule).forEach(([day, times]) => {
          if (times && times.start && times.end) {
            defaultSchedule[day] = {
              start: times.start, // String olarak kullan
              end: times.end,     // String olarak kullan
              enabled: true
            };
          }
        });

        form.value = {
          name: course.name,
          language: course.language,
          teacher_id: course.teacher_id,
          branch_id: course.branch_id,
          classroom_id: course.classroom_id,
          start_date: course.start_date,
          end_date: course.end_date,
          schedule: defaultSchedule,
          max_students: course.max_students || 20,
          status: course.status || 'active',
          image_path: course.image_path || ''
        }

        console.log('Form data set to:', form.value);
        console.log('=== END COURSE DEBUG ===');

        // Şubeye göre sınıfları filtrele
        if (course.branch_id) {
          console.log('Filtering classrooms for branch:', course.branch_id);
          await filterClassroomsByBranch(course.branch_id);
        }

        // Dile göre öğretmenleri filtrele
        if (course.language) {
          console.log('Filtering teachers for language:', course.language);
          filterTeachersByLanguage();
        }

      } catch (error) {
        console.error('Error loading course details:', error);
        console.error('Error details:', error.response?.data);
        ElMessage.error('Kurs bilgileri yüklenirken bir hata oluştu: ' + (error.response?.data?.error || error.message));
      }

      showAddModal.value = true
    }

    // Yardımcı fonksiyon: Her türlü saat değerini 'HH:mm' stringine çevirir
    function toTimeString(val) {
      console.log('toTimeString called with:', val, 'type:', typeof val);
      
      if (!val) {
        return '';
      }
      
      if (typeof val === 'string') {
        // Eğer zaten HH:mm formatındaysa
        if (/^\d{2}:\d{2}$/.test(val)) {
          return val;
        }
        // Eğer HH:mm:ss formatındaysa
        if (/^\d{2}:\d{2}:\d{2}$/.test(val)) {
          return val.slice(0, 5);
        }
        return val;
      }
      
      if (val instanceof Date) {
        return val.toTimeString().slice(0,5);
      }
      
      if (typeof val === 'object' && val !== null) {
        // Element Plus time-select object formatları
        if (val.hours !== undefined && val.minutes !== undefined) {
          return `${val.hours.toString().padStart(2, '0')}:${val.minutes.toString().padStart(2, '0')}`;
        }
        
        if (val.value && typeof val.value === 'string') {
          return val.value;
        }
        
        // Eğer object'in string representation'ı HH:mm formatındaysa
        const strVal = val.toString();
        if (/^\d{2}:\d{2}$/.test(strVal)) {
          return strVal;
        }
        
        console.error('Unrecognized time object format:', val);
        console.error('Object keys:', Object.keys(val));
        return '';
      }
      
      return '';
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
          ElMessage.error(`Lütfen şu alanları doldurun: ${missingFields.join(', ')}`);
          return;
        }

        // Ders programı kontrolü
        const hasValidSchedule = Object.entries(form.value.schedule).some(([day, times]) => {
          if (!times.enabled) return false;
          if (!times.start || !times.end) {
            ElMessage.error(`${day} günü için başlangıç ve bitiş saatlerini belirtmelisiniz`);
            return false;
          }
          return true;
        });

        if (!hasValidSchedule) {
          ElMessage.error('En az bir gün için geçerli bir ders programı belirlemelisiniz');
          return;
        }

        const courseData = {
          name: form.value.name,
          language: form.value.language,
          teacher_id: form.value.teacher_id,
          classroom_id: form.value.classroom_id,
          branch_id: form.value.branch_id,
          course_type: form.value.course_type || 'Physical',
          start_date: form.value.start_date ? new Date(form.value.start_date).toISOString().split('T')[0] : '',
          end_date: form.value.end_date ? new Date(form.value.end_date).toISOString().split('T')[0] : '',
          schedule: Object.entries(form.value.schedule).reduce((acc, [day, times]) => {
            console.log(`Processing day ${day}:`, times);
            
            if (times.enabled && times.start && times.end) {
              console.log(`${day} is enabled with times:`, { start: times.start, end: times.end });
              
              const startTime = toTimeString(times.start);
              const endTime = toTimeString(times.end);
              
              console.log(`${day} formatted times:`, { startTime, endTime });
              
              // Sadece geçerli saat değerleri varsa ekle
              if (startTime && endTime && startTime !== '' && endTime !== '') {
                acc[day] = {
                  start: startTime,
                  end: endTime
                };
                console.log(`${day} added to schedule:`, acc[day]);
              } else {
                console.warn(`Invalid time values for ${day}:`, { 
                  start: times.start, 
                  end: times.end,
                  startFormatted: startTime,
                  endFormatted: endTime
                });
              }
            } else {
              console.log(`${day} is disabled or missing times:`, times);
            }
            return acc;
          }, {}),
          status: form.value.status || 'active',
          image_path: form.value.image_path || ''
        };

        // Debug: Backend'e gönderilen veriyi kontrol et
        console.log('=== COURSE SAVE DEBUG ===');
        console.log('Form schedule before processing:', form.value.schedule);
        console.log('Sending course data:', courseData);
        console.log('Schedule data:', courseData.schedule);
        console.log('Schedule JSON:', JSON.stringify(courseData.schedule, null, 2));
        console.log('=== END DEBUG ===');

        if (form.value.max_students) courseData.max_students = form.value.max_students;

        if (editingCourse.value) {
          await axios.put(`/api/courses/${editingCourse.value.id}`, courseData);
          console.log('Course updated successfully');
        } else {
          const response = await axios.post('/api/courses', courseData);
          console.log('Course created successfully:', response.data);
        }
        
        console.log('Closing modal and resetting form...');
        showAddModal.value = false;
        editingCourse.value = null;
        form.value = {
          name: '',
          language: '',
          teacher_id: '',
          branch_id: '',
          classroom_id: '',
          start_date: '',
          end_date: '',
          schedule: weekDays.reduce((acc, day) => {
            acc[day] = { start: '', end: '', enabled: false };
            return acc;
          }, {}),
          max_students: 20,
          status: 'active',
          image_path: ''
        };
        
        console.log('Fetching updated courses list...');
        await fetchCourses();
        console.log('Course save process completed');
        ElMessage.success('Kurs başarıyla kaydedildi!');
      } catch (error) {
        console.error('Error saving course:', error);
        ElMessage.error('Kurs kaydedilirken bir hata oluştu: ' + (error.response?.data?.error || error.message));
      }
    };

    // Kurs silme
    const deleteCourse = async (id) => {
      if (confirm('Bu kursu silmek istediğinizden emin misiniz?')) {
        try {
          await axios.delete(`/api/courses/${id}`)
          ElMessage.success('Kurs başarıyla silindi')
          fetchCourses()
        } catch (error) {
          console.error('Error deleting course:', error)
          const errorMessage = error.response?.data?.error || 'Kurs silinirken bir hata oluştu'
          ElMessage.error(errorMessage)
        }
      }
    }

    // Tarih formatla
    const formatDate = (date) => {
      return new Date(date).toLocaleDateString('tr-TR')
    }

    // Seçilen dile göre öğretmenleri filtrele
    const filterTeachersByLanguage = () => {
      if (!form.value.language) {
        filteredTeachers.value = [...teachers.value]
        return
      }

      filteredTeachers.value = teachers.value.filter(teacher => 
        teacher.languages && 
        Array.isArray(teacher.languages) && 
        teacher.languages.includes(form.value.language)
      )

      if (filteredTeachers.value.length === 0) {
        ElMessage.warning('Seçilen dilde ders verebilecek öğretmen bulunamadı')
      }
    }

    // Öğretmen seçildiğinde
    const handleTeacherSelect = async (teacherId) => {
      try {
        console.log('Selecting teacher with ID:', teacherId);
        
        // Öğretmenin müsait saatlerini getir
        const response = await axios.get(`/api/courses/teacher-hours/${teacherId}`);
        const teacherData = response.data;
        
        console.log('Teacher hours response:', teacherData);
        console.log('Working days:', teacherData.working_days);
        console.log('Available hours:', teacherData.available_hours);
        
        selectedTeacher.value = {
          id: teacherId,
          working_days: teacherData.working_days,
          working_hours: teacherData.available_hours
        };
        
        console.log('Selected teacher object:', selectedTeacher.value);
        
        // Öğretmenin şubesini getir
        const teacherDetailsResponse = await axios.get(`/api/teachers/${teacherId}`);
        if (teacherDetailsResponse.data.branch_id) {
          form.value.branch_id = teacherDetailsResponse.data.branch_id;
          await filterClassroomsByBranch(teacherDetailsResponse.data.branch_id);
        }

        // Form'daki schedule'ı öğretmenin çalışma saatlerine göre sıfırla
        form.value.schedule = weekDays.reduce((acc, day) => {
          const hasWorkingHours = selectedTeacher.value.working_hours[day];
          console.log(`Day ${day} - hasWorkingHours:`, hasWorkingHours);
          
          acc[day] = {
            start: hasWorkingHours ? selectedTeacher.value.working_hours[day].start : '',
            end: hasWorkingHours ? selectedTeacher.value.working_hours[day].end : '',
            enabled: false
          };
          
          return acc;
        }, {});

        console.log('Teacher selected, form schedule updated:', form.value.schedule);

      } catch (error) {
        console.error('Error fetching teacher details:', error);
        ElMessage.error('Öğretmen bilgileri alınırken bir hata oluştu');
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
        console.error('Error fetching classrooms:', error)
        ElMessage.error('Sınıflar yüklenirken bir hata oluştu')
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
      filterTeachersByLanguage()
      form.value.teacher_id = ''
      selectedTeacher.value = null
    })

    // Öğretmen seçimi değiştiğinde
    watch(() => form.value.teacher_id, (newTeacherId) => {
      if (newTeacherId) {
        handleTeacherSelect(newTeacherId)
      }
    })

    const handleImageUploadSuccess = (imagePath) => {
      form.value.image_path = imagePath;
      ElMessage.success('Resim başarıyla yüklendi');
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
        ElMessage.warning(`Maksimum öğrenci sayısı sınıf kapasitesini (${selectedClassroom.value.capacity}) geçemez`);
      } else if (numValue < 1) {
        form.value.max_students = 1;
        ElMessage.warning('Maksimum öğrenci sayısı en az 1 olmalıdır');
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
      selectedCourse,
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
  background-color: #cccccc;
  cursor: not-allowed;
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

tr.selected {
  background-color: #e3f2fd;
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

.schedule-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 15px;
  margin-top: 10px;
}

.schedule-day {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px;
  border: 1px solid #eee;
  border-radius: 4px;
  background-color: #f8f9fa;
  transition: all 0.3s ease;
}

.day-header {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.day-header .el-checkbox {
  margin-right: 8px;
}

.schedule-day.disabled {
  opacity: 0.5;
  background-color: #f5f5f5;
  cursor: not-allowed;
  pointer-events: none;
}

.schedule-day.disabled .el-time-picker {
  pointer-events: none;
  background-color: #f5f5f5;
}

.schedule-day.disabled .el-input__wrapper {
  background-color: #f5f5f5;
  cursor: not-allowed;
}

.available-hours {
  font-size: 0.9em;
  color: #4CAF50;
  margin-top: 5px;
}

.no-hours-info {
  font-size: 0.9em;
  color: #f39c12;
  margin-top: 5px;
  font-style: italic;
}

.not-available {
  font-size: 0.9em;
  color: #f44336;
  margin-top: 5px;
}

.schedule-day .el-time-picker {
  width: 100%;
}

.schedule-day label {
  font-weight: 500;
  color: #606266;
  margin-bottom: 5px;
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
</style> 