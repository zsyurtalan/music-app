<script setup>
import { ref, computed } from 'vue'

const isPlaying = ref(false)
const currentTime = ref(0)
const duration = ref(0)
const volume = ref(1)
const currentMusic = ref(null)

const audio = ref(null)

const playPause = () => {
  if (audio.value) {
    if (isPlaying.value) {
      audio.value.pause()
    } else {
      audio.value.play()
    }
    isPlaying.value = !isPlaying.value
  }
}

const formatTime = (time) => {
  const minutes = Math.floor(time / 60)
  const seconds = Math.floor(time % 60)
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}
</script>

<template>
  <div class="music-player" v-if="currentMusic">
    <div class="player-info">
      <h3>{{ currentMusic.title }}</h3>
    </div>
    
    <div class="player-controls">
      <button @click="playPause" class="play-btn">
        {{ isPlaying ? '⏸️' : '▶️' }}
      </button>
    </div>
    
    <div class="progress-bar">
      <span>{{ formatTime(currentTime) }}</span>
      <input 
        type="range" 
        min="0" 
        :max="duration" 
        v-model="currentTime"
        class="progress"
      />
      <span>{{ formatTime(duration) }}</span>
    </div>
    
    <audio 
      ref="audio"
      @timeupdate="currentTime = $event.target.currentTime"
      @loadedmetadata="duration = $event.target.duration"
      @ended="isPlaying = false"
    ></audio>
  </div>
</template>

<style scoped>
.music-player {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  padding: 1rem;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 1rem;
}

.player-info h3 {
  margin: 0;
  color: #333;
}

.play-btn {
  background: #667eea;
  border: none;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  font-size: 1.2rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.play-btn:hover {
  background: #e4b046;
  transform: scale(1.1);
}

.progress-bar {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.progress {
  flex: 1;
  height: 6px;
  border-radius: 3px;
  background: #ed8c32;
  outline: none;
}

.progress::-webkit-slider-thumb {
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #e2eb64;
  cursor: pointer;
}
</style>
