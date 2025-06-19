<template>
  <Teleport to="body">
    <div class="toast-container">
      <Transition
        name="toast"
        enter-active-class="toast-enter-active"
        leave-active-class="toast-leave-active"
        enter-from-class="toast-enter-from"
        leave-to-class="toast-leave-to"
      >
        <div
          v-if="visible"
          :class="[
            'toast',
            `toast-${type}`,
            { 'toast-closable': closable }
          ]"
        >
          <div class="toast-icon">
            <i :class="iconClass"></i>
          </div>
          <div class="toast-content">
            <div v-if="title" class="toast-title">{{ title }}</div>
            <div class="toast-message">{{ message }}</div>
            <div v-if="showConfirmButton || showCancelButton" class="toast-actions">
              <button
                v-if="showConfirmButton"
                class="toast-btn toast-btn-confirm"
                @click="handleConfirm"
              >
                {{ confirmText }}
              </button>
              <button
                v-if="showCancelButton"
                class="toast-btn toast-btn-cancel"
                @click="handleCancel"
              >
                {{ cancelText }}
              </button>
            </div>
          </div>
          <button
            v-if="closable && !showConfirmButton && !showCancelButton"
            class="toast-close"
            @click="close"
          >
            <i class="fas fa-times"></i>
          </button>
        </div>
      </Transition>
    </div>
  </Teleport>
</template>

<script>
export default {
  name: 'ToastNotification',
  props: {
    message: {
      type: String,
      required: true,
      validator: (value) => value && value.trim() !== ''
    },
    title: {
      type: String,
      default: ''
    },
    type: {
      type: String,
      default: 'info',
      validator: (value) => ['success', 'error', 'warning', 'info'].includes(value)
    },
    duration: {
      type: Number,
      default: 4000
    },
    closable: {
      type: Boolean,
      default: true
    },
    showConfirmButton: {
      type: Boolean,
      default: false
    },
    showCancelButton: {
      type: Boolean,
      default: false
    },
    confirmText: {
      type: String,
      default: 'Evet'
    },
    cancelText: {
      type: String,
      default: 'Hayır'
    },
    onConfirm: {
      type: Function,
      default: null
    },
    onCancel: {
      type: Function,
      default: null
    }
  },
  data() {
    return {
      visible: false,
      timer: null
    }
  },
  computed: {
    iconClass() {
      const icons = {
        success: 'fas fa-check-circle',
        error: 'fas fa-exclamation-circle',
        warning: 'fas fa-exclamation-triangle',
        info: 'fas fa-info-circle'
      }
      return icons[this.type]
    }
  },
  mounted() {
    this.show()
  },
  beforeUnmount() {
    this.clearTimer()
  },
  methods: {
    show() {
      // Boş mesaj kontrolü
      if (!this.message || this.message.trim() === '') {
        console.warn('🚫 ToastNotification: Empty message, not showing toast')
        this.$emit('close')
        return
      }
      
      this.visible = true
      if (this.duration > 0) {
        this.timer = setTimeout(() => {
          this.close()
        }, this.duration)
      }
    },
    close() {
      this.visible = false
      this.clearTimer()
      this.$emit('close')
    },
    clearTimer() {
      if (this.timer) {
        clearTimeout(this.timer)
        this.timer = null
      }
    },
    handleConfirm() {
      if (this.onConfirm) {
        this.onConfirm()
      }
      this.close()
    },
    handleCancel() {
      if (this.onCancel) {
        this.onCancel()
      }
      this.close()
    }
  }
}
</script>

<style scoped>
.toast-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  pointer-events: none;
}

.toast {
  display: flex;
  align-items: flex-start;
  max-width: 400px;
  min-width: 300px;
  padding: 16px;
  margin-bottom: 12px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  border-left: 4px solid;
  pointer-events: all;
  backdrop-filter: blur(10px);
  position: relative;
  overflow: hidden;
}

.toast::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 100%;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
  pointer-events: none;
}

.toast-success {
  border-left-color: #10b981;
  background: linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%);
}

.toast-error {
  border-left-color: #ef4444;
  background: linear-gradient(135deg, #fef2f2 0%, #fef1f1 100%);
}

.toast-warning {
  border-left-color: #f59e0b;
  background: linear-gradient(135deg, #fefbeb 0%, #fef3c7 100%);
}

.toast-info {
  border-left-color: #3b82f6;
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
}

.toast-icon {
  flex-shrink: 0;
  margin-right: 12px;
  margin-top: 2px;
}

.toast-success .toast-icon {
  color: #10b981;
}

.toast-error .toast-icon {
  color: #ef4444;
}

.toast-warning .toast-icon {
  color: #f59e0b;
}

.toast-info .toast-icon {
  color: #3b82f6;
}

.toast-content {
  flex: 1;
  min-width: 0;
}

.toast-title {
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 4px;
  color: #374151;
}

.toast-message {
  font-size: 14px;
  line-height: 1.5;
  color: #6b7280;
}

.toast-close {
  flex-shrink: 0;
  margin-left: 12px;
  margin-top: 2px;
  background: none;
  border: none;
  cursor: pointer;
  color: #9ca3af;
  font-size: 14px;
  transition: color 0.2s ease;
}

.toast-close:hover {
  color: #6b7280;
}

.toast-actions {
  margin-top: 12px;
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.toast-btn {
  padding: 6px 16px;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 60px;
}

.toast-btn-confirm {
  background: #10b981;
  color: white;
}

.toast-btn-confirm:hover {
  background: #059669;
}

.toast-btn-cancel {
  background: #6b7280;
  color: white;
}

.toast-btn-cancel:hover {
  background: #4b5563;
}

/* Animasyonlar */
.toast-enter-active {
  transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

.toast-leave-active {
  transition: all 0.3s ease-in;
}

.toast-enter-from {
  transform: translateX(100%) translateY(-10px);
  opacity: 0;
}

.toast-leave-to {
  transform: translateX(100%) translateY(-10px);
  opacity: 0;
}

@media (max-width: 640px) {
  .toast-container {
    top: 10px;
    right: 10px;
    left: 10px;
  }
  
  .toast {
    min-width: unset;
    max-width: unset;
  }
}
</style> 