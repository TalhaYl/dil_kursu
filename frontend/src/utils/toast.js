import { createApp } from 'vue'
import ToastNotification from '@/components/ToastNotification.vue'

class ToastService {
  constructor() {
    this.toasts = []
    this.container = null
    this.init()
  }

  init() {
    // Toast container'ı oluştur
    if (!this.container) {
      this.container = document.createElement('div')
      this.container.id = 'toast-container-root'
      document.body.appendChild(this.container)
    }
  }

  show(options) {
    // Boş mesaj kontrolü
    if (!options || !options.message || options.message.toString().trim() === '') {
      console.warn('🚫 Empty toast message ignored')
      return null
    }

    const toastId = Date.now() + Math.random()
    
    // Toast component'ini oluştur
    const toastDiv = document.createElement('div')
    this.container.appendChild(toastDiv)

    const toastApp = createApp(ToastNotification, {
      ...options,
      message: options.message.toString().trim(), // Mesajı temizle
      onClose: () => {
        this.remove(toastId, toastApp, toastDiv)
      }
    })

    toastApp.mount(toastDiv)

    // Toast'ı listeye ekle
    this.toasts.push({
      id: toastId,
      app: toastApp,
      element: toastDiv
    })

    return toastId
  }

  remove(toastId, app, element) {
    // App'i unmount et
    if (app) {
      app.unmount()
    }
    
    // Element'i DOM'dan kaldır
    if (element && element.parentNode) {
      element.parentNode.removeChild(element)
    }

    // Listeden kaldır
    this.toasts = this.toasts.filter(toast => toast.id !== toastId)
  }

  // Kolaylık metodları
  success(message, title = '', options = {}) {
    return this.show({
      message,
      title,
      type: 'success',
      ...options
    })
  }

  error(message, title = 'Hata', options = {}) {
    return this.show({
      message,
      title,
      type: 'error',
      ...options
    })
  }

  warning(message, title = 'Uyarı', options = {}) {
    return this.show({
      message,
      title,
      type: 'warning',
      ...options
    })
  }

  info(message, title = 'Bilgi', options = {}) {
    return this.show({
      message,
      title,
      type: 'info',
      ...options
    })
  }

  // Onay dialogu - Promise döner
  confirm(message, title = 'Onay', options = {}) {
    return new Promise((resolve) => {
      const confirmOptions = {
        message,
        title,
        type: 'warning',
        showConfirmButton: true,
        showCancelButton: true,
        confirmText: 'Evet',
        cancelText: 'Hayır',
        duration: 0, // Manuel kapanacak
        onConfirm: () => resolve(true),
        onCancel: () => resolve(false),
        ...options
      }
      
      this.show(confirmOptions)
    })
  }

  // Tüm toast'ları temizle
  clear() {
    this.toasts.forEach(toast => {
      this.remove(toast.id, toast.app, toast.element)
    })
  }
}

// Singleton instance
const toast = new ToastService()

export default toast 