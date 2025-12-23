const API_URL = process.env.NEXT_PUBLIC_API_URL

export interface User {
  id: number
  name: string
  email: string
  balance: number
  role: "user" | "admin" | "superadmin"
}

export type LoginResponse = {
  accessToken?: string

  user?: User

  admin?: {
    id: number
    firstName: string
    lastName: string
    email: string
    role: string
  }
}

export interface University {
  id: number
  name: string
  nameAz?: string
  nameEn?: string
  nameRu?: string
}

export interface Subject {
  id: number
  name: string
  nameAz?: string
  nameEn?: string
  nameRu?: string
}

export type CreateAttemptResponse = { attemptId: string }
export type AnswerResponse = { isCorrect: boolean; answerId: string }
export type FinishResponse = { attemptId: string; status: string; score: number; total: number }
export type UserAttemptsResponse = {
  attempts: any[]
}

export type AttemptSummary = {
  attemptId: string
  status: string
  startedAt: string
  finishedAt?: string
  answered: number
  correct: number
  score?: number
  total?: number
}

export interface Question {
  id: number
  text: string
  options: string[]
  correctAnswer: number
  subject: Subject
  university: University
  year: number
}

export interface Exam {
  id: number
  title: string
  subject: Subject
  university: University
  year: number
  price: number
  questionCount: number
}

export interface ExamAttempt {
  id: number
  exam: Exam
  score: number
  totalQuestions: number
  startedAt: string
  completedAt?: string
}

class ApiClient {
  private token: string | null = null

  constructor() {
    if (typeof document !== "undefined") {
      this.token = this.readCookie("accessToken")
    }
  }

  private readCookie(name: string): string | null {
    if (typeof document === "undefined") return null
    const row = document.cookie.split("; ").find((r) => r.startsWith(`${name}=`))
    if (!row) return null
    return decodeURIComponent(row.split("=").slice(1).join("="))
  }

  setToken(token: string) {
    this.token = token
  }

  getToken() {
    return this.token
  }

  clearToken() {
    this.token = null
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    if (!API_URL) {
      throw new Error("NEXT_PUBLIC_API_URL tapılmadı. .env-də set et.")
    }

    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string> | undefined),
    }

    const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData
    if (!isFormData) {
      headers["Content-Type"] = headers["Content-Type"] ?? "application/json"
    }

    if (process.env.NEXT_PUBLIC_API_KEY) {
      headers["x-api-key"] = process.env.NEXT_PUBLIC_API_KEY
    }

    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`
    }

    const res = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: "Request failed" }))
      throw new Error(`${err.message || "Request failed"} (Status: ${res.status})`)
    }

    return res.json()
  }


  // ================== AUTH ==================
  async login(email: string, password: string) {
    return this.request<LoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    })
  }

  async register(email: string, password: string, firstName: string, lastName?: string) {
    return this.request("/auth/user/signup", {
      method: "POST",
      body: JSON.stringify({ email, password, firstName, lastName }),
    })
  }

  async getProfile() {
    return this.request<User>("/auth/me")
  }

  // ================== EXAMS / QUESTIONS ==================
  async getExams() {
    return this.request<Exam[]>("/questions/exams")
  }

  async getExamsByFilter(universityId?: number, subjectId?: number, year?: number) {
    const params = new URLSearchParams()
    if (universityId) params.append("universityId", String(universityId))
    if (subjectId) params.append("subjectId", String(subjectId))
    if (year) params.append("year", String(year))
    return this.request<Exam[]>(`/questions/exams?${params.toString()}`)
  }

  async getExamQuestions(examId: number) {
    return this.request<Question[]>(`/questions/exam/${examId}`)
  }

  async submitExam(examId: number, answers: Record<number, number>) {
    return this.request<{ score: number; totalQuestions: number }>(`/questions/exam/${examId}/submit`, {
      method: "POST",
      body: JSON.stringify({ answers }),
    })
  }

  // ================== ATTEMPTS ==================
  async answerAttempt(attemptId: string, questionId: string, selectedOptionId: string) {
    return this.request<AnswerResponse>(`/attempts/${encodeURIComponent(attemptId)}/answer`, {
      method: "POST",
      body: JSON.stringify({ questionId, selectedOptionId }),
    })
  }

  // POST /attempts/:attemptId/finish
  async finishAttempt(attemptId: string) {
    return this.request<FinishResponse>(`/attempts/${encodeURIComponent(attemptId)}/finish`, {
      method: "POST",
    })
  }

  // GET /attempts/:attemptId/summary
  async getAttemptSummary(attemptId: string) {
    return this.request<AttemptSummary>(`/attempts/${encodeURIComponent(attemptId)}/summary`)
  }

  // GET /users/:userId/attempts  -> { attempts: [...] }
  async getUserAttempts(userId: number) {
    return this.request<UserAttemptsResponse>(`/users/${userId}/attempts`)
  }

  // GET /attempts/:attemptId/answers -> { answers: [...] }
  async getAttemptAnswers(attemptId: string) {
    return this.request<{ answers: any[] }>(`/attempts/${encodeURIComponent(attemptId)}/answers`)
  }


  // ================== ADMIN ==================
  async uploadPDF(file: File) {
    const formData = new FormData()
    formData.append("file", file)

    const headers: HeadersInit = {}
    if (this.token) headers["Authorization"] = `Bearer ${this.token}`

    const res = await fetch(`${API_URL}/pdf/upload`, {
      method: "POST",
      headers,
      body: formData,
    })

    if (!res.ok) throw new Error("Failed to upload PDF")
    return res.json()
  }

  async createExam(data: {
    universityId: number
    subjectId: number
    year: number
    price: number
    questions: Array<{ text: string; options: string[]; correctAnswer: number }>
  }) {
    return this.request<Exam>("/questions/exam", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async getUniversities() {
    return this.request<University[]>("/questions/universities")
  }

  async createUniversity(name: string, nameAz?: string, nameEn?: string, nameRu?: string) {
    return this.request<University>("/questions/university", {
      method: "POST",
      body: JSON.stringify({ name, nameAz, nameEn, nameRu }),
    })
  }

  async getSubjects() {
    return this.request<Subject[]>("/questions/subjects")
  }

  async createSubject(name: string, nameAz?: string, nameEn?: string, nameRu?: string) {
    return this.request<Subject>("/questions/subject", {
      method: "POST",
      body: JSON.stringify({ name, nameAz, nameEn, nameRu }),
    })
  }
}

export const api = new ApiClient()
