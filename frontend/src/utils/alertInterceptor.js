import toast from './toast'

class AlertInterceptor {
  constructor() {
    this.isEnabled = true
    this.originalAlert = window.alert
    this.originalConfirm = window.confirm
    this.alertCount = 0
    this.confirmQueue = []
    
    this.init()
  }

  init() {
    // Sayfa yüklenme durumu kontrolü
    let pageLoaded = false
    window.addEventListener('load', () => {
      pageLoaded = true
    })
    
    // Alert fonksiyonunu override et
    window.alert = (message) => {
      if (!this.isEnabled) {
        return this.originalAlert(message)
      }
      
      // Boş veya undefined mesaj kontrolü
      if (!message || message.toString().trim() === '') {
        console.warn('🚫 Empty alert intercepted and ignored')
        return undefined
      }
      
      // Sayfa yüklenme sırasında alert'leri engelle
      if (!pageLoaded) {
        console.warn('🚫 Alert during page load intercepted and ignored:', message)
        return undefined
      }
      
      this.alertCount++
      console.warn(`🚫 Alert #${this.alertCount} intercepted:`, message)
      
      // Toast olarak göster
      toast.error(message.toString(), 'Sistem Uyarısı', {
        duration: 6000 // Biraz daha uzun süre
      })
      
      return undefined
    }

    // Confirm fonksiyonunu override et
    window.confirm = (message) => {
      if (!this.isEnabled) {
        return this.originalConfirm(message)
      }
      
      // Boş veya undefined mesaj kontrolü
      if (!message || message.toString().trim() === '') {
        console.warn('🚫 Empty confirm intercepted and ignored')
        return false
      }
      
      console.warn('🚫 Confirm intercepted:', message)
      
      // Sync confirm'i async toast confirm'e çeviremeyiz
      // Bu durumda kullanıcıya bilgi verip false döneriz
      toast.warning(`${message.toString()}\n\n(Bu onay işlemi otomatik olarak iptal edildi. Lütfen sayfa üzerindeki butonları kullanın.)`, 'Onay Gerekiyor', {
        duration: 8000
      })
      
      return false
    }

    // Console'da bilgilendirme
    console.log('🛡️ Alert Interceptor aktif! Tüm alert/confirm çağrıları toast\'a dönüştürülecek.')
    
    // Global erişim için
    window.alertInterceptor = this
  }

  // Interceptor'ı geçici olarak devre dışı bırak
  disable() {
    this.isEnabled = false
    console.log('🔓 Alert Interceptor devre dışı bırakıldı')
  }

  // Interceptor'ı tekrar aktifleştir
  enable() {
    this.isEnabled = true
    console.log('🛡️ Alert Interceptor tekrar aktifleştirildi')
  }

  // Orijinal fonksiyonları geri yükle
  restore() {
    window.alert = this.originalAlert
    window.confirm = this.originalConfirm
    console.log('🔄 Orijinal alert/confirm fonksiyonları geri yüklendi')
  }

  // İstatistikler
  getStats() {
    return {
      interceptedAlerts: this.alertCount,
      isEnabled: this.isEnabled
    }
  }

  // Test fonksiyonu
  test() {
    console.log('🧪 Alert Interceptor test ediliyor...')
    alert('Bu bir test alert mesajıdır')
    confirm('Bu bir test confirm mesajıdır')
    console.log('✅ Test tamamlandı')
  }
}

// Singleton instance
const alertInterceptor = new AlertInterceptor()

export default alertInterceptor 