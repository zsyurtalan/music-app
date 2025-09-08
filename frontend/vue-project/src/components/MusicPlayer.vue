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
  <div class="music-player" v-if="currentVideo">
    <div class="player-info">
      <img :src="currentVideo.thumbnail" :alt="currentVideo.title" class="player-thumbnail">
      <div class="player-details">
        <h4 class="player-title">{{ currentVideo.title }}</h4>
        <p class="player-channel">{{ currentVideo.channel }}</p>
      </div>
    </div>
    
    <div class="player-controls">
      <button @click="togglePlay" class="control-btn">
        {{ isPlaying ? '⏸️' : '▶️' }}
      </button>
      <button @click="stop" class="control-btn">⏹️</button>
      
      <div class="time-info">
        <span>{{ Math.floor(currentTime / 60) }}:{{ (currentTime % 60).toString().padStart(2, '0') }}</span>
        <span>{{ Math.floor(duration / 60) }}:{{ (duration % 60).toString().padStart(2, '0') }}</span>
      </div>
      
      <div class="volume-control">
        <span>🔊</span>
        <input 
          type="range" 
          min="0" 
          max="100" 
          v-model="volume" 
          @input="setVolume"
          class="volume-slider"
        >
      </div>
    </div>
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
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  padding: 1rem 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  z-index: 1000;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.1);
}

.player-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
}

.player-thumbnail {
  width: 60px;
  height: 60px;
  border-radius: 10px;
  object-fit: cover;
}

.player-details {
  flex: 1;
}

.player-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.player-channel {
  margin: 0;
  font-size: 0.9rem;
  color: #666;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.player-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.control-btn {
  background: #ffd700;
  color: white;
  border: none;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  font-size: 1.2rem;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
}

.control-btn:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
}

.time-info {
  display: flex;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: #666;
}

.volume-control {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.volume-slider {
  width: 100px;
  height: 5px;
  border-radius: 5px;
  background: #ddd;
  outline: none;
  cursor: pointer;
}

.volume-slider::-webkit-slider-thumb {
  appearance: none;
  width: 15px;
  height: 15px;
  border-radius: 50%;
  background: #ffd700;
  cursor: pointer;
}

@media (max-width: 768px) {
  .music-player {
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
  }
  
  .player-info {
    width: 100%;
  }
  
  .player-controls {
    width: 100%;
    justify-content: center;
  }
}
</style>
