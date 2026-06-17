import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Player, Question, AnswerRecord, GameRecord, Level, MemoryCard, OperationHistory } from '~/types'
import { levels, getLevelById, getUnlockedLevels } from '~/data/levels'
import { practicePacks, getPracticePackById } from '~/data/practicePacks'
import { getPlayer, createPlayer, savePlayer, saveGameRecord, updatePlayerStats, getGameRecords, getRanking } from '~/utils/storage'
import { calculateScore, analyzeErrorType, generateGameRecord, isLevelPassed, generateMemoryCards, generateListenQuestions } from '~/utils/gameLogic'

export const useGameStore = defineStore('game', () => {
  const player = ref<Player | null>(null)
  const currentLevel = ref<Level | null>(null)
  const currentQuestions = ref<Question[]>([])
  const currentIndex = ref(0)
  const answers = ref<AnswerRecord[]>([])
  const startTime = ref(0)
  const questionStartTime = ref(0)
  const timeRemaining = ref(0)
  const isPlaying = ref(false)
  const isPaused = ref(false)
  const operationHistory = ref<OperationHistory[]>([])
  const memoryCards = ref<MemoryCard[]>([])
  const listenQuestions = ref<Question[]>([])
  const currentListenIndex = ref(0)
  const showResult = ref(false)
  const gameResult = ref<{
    score: number
    passed: boolean
    correctCount: number
    wrongCount: number
    timeUsed: number
  } | null>(null)

  const currentQuestion = computed(() => currentQuestions.value[currentIndex.value] || null)
  const unlockedLevels = computed(() => getUnlockedLevels(player.value?.level || 1))
  const gameRecords = computed(() => getGameRecords())
  const ranking = computed(() => getRanking())

  function initPlayer() {
    const storedPlayer = getPlayer()
    if (storedPlayer) {
      player.value = storedPlayer
    } else {
      player.value = createPlayer('新手玩家')
    }
  }

  function setPlayerName(name: string) {
    if (player.value) {
      player.value.name = name
      player.value.updatedAt = new Date().toISOString()
      savePlayer(player.value)
    }
  }

  function startLevel(levelId: number) {
    const level = getLevelById(levelId)
    if (!level) return

    currentLevel.value = level
    currentQuestions.value = [...level.questions]
    currentIndex.value = 0
    answers.value = []
    startTime.value = Date.now()
    questionStartTime.value = Date.now()
    timeRemaining.value = level.timeLimit
    isPlaying.value = true
    isPaused.value = false
    showResult.value = false
    gameResult.value = null
    operationHistory.value = []
  }

  function startPractice(packId: string) {
    const pack = getPracticePackById(packId)
    if (!pack) return

    currentLevel.value = {
      id: 99,
      name: pack.name,
      description: pack.description,
      difficulty: 'easy',
      questions: pack.questions,
      requiredScore: 60,
      timeLimit: 300
    }
    currentQuestions.value = [...pack.questions]
    currentIndex.value = 0
    answers.value = []
    startTime.value = Date.now()
    questionStartTime.value = Date.now()
    timeRemaining.value = 300
    isPlaying.value = true
    isPaused.value = false
    showResult.value = false
    gameResult.value = null
    operationHistory.value = []
  }

  function startMemoryGame() {
    memoryCards.value = generateMemoryCards(8).map(card => ({
      ...card,
      isRevealed: false,
      isMatched: false
    }))
    isPlaying.value = true
    startTime.value = Date.now()
    showResult.value = false
    gameResult.value = null
  }

  function startListenGame() {
    listenQuestions.value = generateListenQuestions(5)
    currentListenIndex.value = 0
    answers.value = []
    startTime.value = Date.now()
    isPlaying.value = true
    showResult.value = false
    gameResult.value = null
  }

  function submitAnswer(playerAnswer: number) {
    if (!currentQuestion.value || !isPlaying.value) return

    const timeSpent = (Date.now() - questionStartTime.value) / 1000
    const isCorrect = Math.abs(playerAnswer - currentQuestion.value.answer) < 0.001
    
    const record: AnswerRecord = {
      questionId: currentQuestion.value.id,
      playerAnswer,
      correctAnswer: currentQuestion.value.answer,
      isCorrect,
      timeSpent
    }

    if (!isCorrect) {
      record.errorType = analyzeErrorType(playerAnswer, currentQuestion.value.answer)
    }

    answers.value.push(record)
    
    operationHistory.value.push({
      type: isCorrect ? 'add' : 'subtract',
      value: isCorrect ? calculateScore(record, currentQuestion.value.difficulty) : 0,
      timestamp: Date.now()
    })

    currentIndex.value++
    questionStartTime.value = Date.now()

    if (currentIndex.value >= currentQuestions.value.length) {
      endGame()
    }
  }

  function submitListenAnswer(playerAnswer: number) {
    if (!listenQuestions.value[currentListenIndex.value] || !isPlaying.value) return

    const question = listenQuestions.value[currentListenIndex.value]
    const timeSpent = 0
    const isCorrect = Math.abs(playerAnswer - question.answer) < 0.001

    const record: AnswerRecord = {
      questionId: question.id,
      playerAnswer,
      correctAnswer: question.answer,
      isCorrect,
      timeSpent
    }

    answers.value.push(record)
    currentListenIndex.value++

    if (currentListenIndex.value >= listenQuestions.value.length) {
      endListenGame()
    }
  }

  function flipMemoryCard(cardId: number) {
    const card = memoryCards.value.find(c => c.id === cardId)
    if (!card || card.isRevealed || card.isMatched) return

    card.isRevealed = true

    const revealedCards = memoryCards.value.filter(c => c.isRevealed && !c.isMatched)
    if (revealedCards.length === 2) {
      const [first, second] = revealedCards
      if (first.value === second.value) {
        first.isMatched = true
        second.isMatched = true
      } else {
        setTimeout(() => {
          first.isRevealed = false
          second.isRevealed = false
        }, 1000)
      }
    }

    const matchedCount = memoryCards.value.filter(c => c.isMatched).length
    if (matchedCount === memoryCards.value.length) {
      endMemoryGame()
    }
  }

  async function endGame() {
    if (!currentLevel.value || !player.value) return

    isPlaying.value = false
    const timeUsed = Math.round((Date.now() - startTime.value) / 1000)
    const correctCount = answers.value.filter(a => a.isCorrect).length
    const wrongCount = answers.value.filter(a => !a.isCorrect).length

    let score = 0
    try {
      const response = await fetch('/api/score', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          answers: answers.value,
          questions: currentQuestions.value
        })
      })
      const data = await response.json()
      if (data.success && data.data) {
        score = data.data.score
      } else {
        score = answers.value.filter(a => a.isCorrect).length * 10
      }
    } catch {
      score = answers.value.filter(a => a.isCorrect).length * 10
    }

    const passed = isLevelPassed(score, currentLevel.value)

    const record = generateGameRecord(
      player.value.id,
      currentLevel.value.id,
      answers.value,
      timeUsed,
      currentQuestions.value,
      operationHistory.value,
      score
    )
    saveGameRecord(record)

    if (currentLevel.value.id <= 8) {
      updatePlayerStats(player.value, score, currentLevel.value.id)
    }

    gameResult.value = {
      score,
      passed,
      correctCount,
      wrongCount,
      timeUsed
    }
    showResult.value = true
  }

  function endListenGame() {
    isPlaying.value = false
    const timeUsed = Math.round((Date.now() - startTime.value) / 1000)
    const correctCount = answers.value.filter(a => a.isCorrect).length
    const wrongCount = answers.value.filter(a => !a.isCorrect).length
    const score = correctCount * 20

    gameResult.value = {
      score,
      passed: correctCount >= 3,
      correctCount,
      wrongCount,
      timeUsed
    }
    showResult.value = true
  }

  function endMemoryGame() {
    isPlaying.value = false
    const timeUsed = Math.round((Date.now() - startTime.value) / 1000)
    const matchedPairs = memoryCards.value.length / 2
    const score = Math.max(0, Math.round((300 - timeUsed) * matchedPairs / 10))

    gameResult.value = {
      score,
      passed: score >= 50,
      correctCount: matchedPairs,
      wrongCount: 0,
      timeUsed
    }
    showResult.value = true
  }

  function pauseGame() {
    isPaused.value = true
  }

  function resumeGame() {
    isPaused.value = false
  }

  function undoLastOperation() {
    if (operationHistory.value.length === 0) return
    
    const last = operationHistory.value.pop()
    if (last && player.value) {
      player.value.totalScore -= last.value
    }
  }

  function redoOperation() {
  }

  function updateTimer() {
    if (isPlaying.value && !isPaused.value && timeRemaining.value > 0) {
      timeRemaining.value--
      if (timeRemaining.value <= 0) {
        endGame()
      }
    }
  }

  function resetGame() {
    isPlaying.value = false
    isPaused.value = false
    currentLevel.value = null
    currentQuestions.value = []
    currentIndex.value = 0
    answers.value = []
    startTime.value = 0
    questionStartTime.value = 0
    timeRemaining.value = 0
    operationHistory.value = []
    memoryCards.value = []
    listenQuestions.value = []
    currentListenIndex.value = 0
    showResult.value = false
    gameResult.value = null
  }

  return {
    player,
    currentLevel,
    currentQuestions,
    currentIndex,
    answers,
    startTime,
    questionStartTime,
    timeRemaining,
    isPlaying,
    isPaused,
    operationHistory,
    memoryCards,
    listenQuestions,
    currentListenIndex,
    showResult,
    gameResult,
    currentQuestion,
    unlockedLevels,
    gameRecords,
    ranking,
    initPlayer,
    setPlayerName,
    startLevel,
    startPractice,
    startMemoryGame,
    startListenGame,
    submitAnswer,
    submitListenAnswer,
    flipMemoryCard,
    endGame,
    pauseGame,
    resumeGame,
    undoLastOperation,
    redoOperation,
    updateTimer,
    resetGame
  }
})
