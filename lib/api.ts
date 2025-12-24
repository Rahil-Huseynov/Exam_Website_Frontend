const API_URL = process.env.NEXT_PUBLIC_API_URL

// ================== TYPES ==================
export interface User {
  id: number
  name: string
  email: string
  balance: number
  role: "user" | "admin" | "superadmin"
}

export type LoginResponse = {
  accessToken?: string
  access_token?: string
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
  id: string
  name: string
  nameAz?: string
  nameEn?: string
  nameRu?: string
  logo?: string | null
}

export interface Subject {
  id: string
  name: string
  nameAz?: string
  nameEn?: string
  nameRu?: string
}

export interface QuestionOption {
  id: string
  text: string
}

export interface Question {
  id: string
  text: string
  options: QuestionOption[]
}

export interface Exam {
  id: string
  title: string
  subject: Subject
  university: University
  year: number
  price: number
  questionCount: number
}

export type DraftOption = { tempOptionId: string; text: string }
export type DraftQuestion = { tempId: string; text: string; options: DraftOption[] }

export type ImportDirectPayload = {
  questions: Array<{
    text: string
    options: Array<{ text: string }>
    correctAnswerText?: string
  }>
}
export type AdminQuestion = {
  id: string
  text: string
  correctAnswerText?: string | null
  correctOptionId?: string | null
  options: { id: string; text: string }[]
}

export type ListBankQuestionsResponse = {
  bankId: string
  questions: AdminQuestion[]
}

export type UpdateQuestionPayload = {
  text?: string
  options?: Array<{ text: string }>
  correctAnswerText?: string
}

export type CreateQuestionPayload = {
  text: string
  options: Array<{ text: string }>
  correctAnswerText?: string
}

export type DeleteOkResponse = { ok: boolean }

export type CreateAttemptResponse = { attemptId: string }
export type AnswerResponse = { isCorrect: boolean; answerId: string }
export type FinishResponse = { attemptId: string; status: string; score: number; total: number }
export type UserAttemptsResponse = { attempts: any[] }

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

// ================== API CLIENT ==================
class ApiClient {
  private token: string | null = null

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
      credentials: "include",
    })

    if (!res.ok) {
      const contentType = res.headers.get("content-type") || ""
      const err =
        contentType.includes("application/json")
          ? await res.json().catch(() => ({ message: "Request failed" }))
          : { message: await res.text().catch(() => "Request failed") }

      throw new Error(`${err.message || "Request failed"} (Status: ${res.status})`)
    }

    const text = await res.text()
    return (text ? JSON.parse(text) : {}) as T
  }

  // ================== AUTH ==================
  async login(email: string, password: string) {
    const data = await this.request<LoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    })

    const token = data.accessToken || (data as any).access_token
    if (token) this.setToken(token)

    return data
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

  // ================== UNIVERSITIES ==================
  async getUniversities() {
    return this.request<University[]>("/questions/universities")
  }

  async createUniversity(name: string, nameAz?: string, nameEn?: string, nameRu?: string) {
    return this.request<University>("/questions/university", {
      method: "POST",
      body: JSON.stringify({ name, nameAz, nameEn, nameRu }),
    })
  }

  // ================== SUBJECTS ==================
  async getSubjects() {
    return this.request<Subject[]>("/questions/subjects")
  }

  async createSubject(name: string, nameAz?: string, nameEn?: string, nameRu?: string) {
    return this.request<Subject>("/questions/subject", {
      method: "POST",
      body: JSON.stringify({ name, nameAz, nameEn, nameRu }),
    })
  }

  // ================== EXAMS / QUESTIONS ==================
  async getExams() {
    return this.request<Exam[]>("/questions/exams")
  }

  async getExamsByFilter(universityId?: string, subjectId?: string, year?: number) {
    const params = new URLSearchParams()
    if (universityId) params.append("universityId", String(universityId))
    if (subjectId) params.append("subjectId", String(subjectId))
    if (year) params.append("year", String(year))
    const qs = params.toString()
    return this.request<Exam[]>(`/questions/exams${qs ? `?${qs}` : ""}`)
  }

  async createExam(data: { title: string; universityId: string; subjectId: string; year: number; price: number }) {
    return this.request<Exam>("/questions/exam", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async getExamQuestions(examId: string) {
    return this.request<Question[]>(`/questions/exam/${encodeURIComponent(examId)}`)
  }

  async importQuestionsDirect(bankId: string, payload: ImportDirectPayload) {
    return this.request<{ count: number; questions: { id: string }[] }>(
      `/banks/${encodeURIComponent(bankId)}/questions/import-direct`,
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
    )
  }

  // ================== ADMIN: QUESTIONS CRUD ==================
  async listBankQuestions(bankId: string) {
    return this.request<ListBankQuestionsResponse>(`/questions/bank/${encodeURIComponent(bankId)}/questions`)
  }

  async createQuestion(bankId: string, payload: CreateQuestionPayload) {
    return this.request<AdminQuestion>(`/questions/bank/${encodeURIComponent(bankId)}/question`, {
      method: "POST",
      body: JSON.stringify(payload),
    })
  }

  async updateQuestion(questionId: string, payload: UpdateQuestionPayload) {
    return this.request<AdminQuestion>(`/questions/question/${encodeURIComponent(questionId)}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    })
  }

  async deleteQuestion(questionId: string) {
    return this.request<DeleteOkResponse>(`/questions/question/${encodeURIComponent(questionId)}`, {
      method: "DELETE",
    })
  }

  async deleteBank(bankId: string) {
    return this.request<DeleteOkResponse>(`/questions/bank/${encodeURIComponent(bankId)}`, {
      method: "DELETE",
    })
  }

  // ================== ATTEMPTS (səndə varsa saxla) ==================
  async createAttempt(bankId: string, userId: number) {
    return this.request<CreateAttemptResponse>(`/banks/${encodeURIComponent(bankId)}/attempts`, {
      method: "POST",
      body: JSON.stringify({ userId }),
    })
  }

  async answerAttempt(attemptId: string, questionId: string, selectedOptionId: string) {
    return this.request<AnswerResponse>(`/attempts/${encodeURIComponent(attemptId)}/answer`, {
      method: "POST",
      body: JSON.stringify({ questionId, selectedOptionId }),
    })
  }

  async finishAttempt(attemptId: string) {
    return this.request<FinishResponse>(`/attempts/${encodeURIComponent(attemptId)}/finish`, {
      method: "POST",
    })
  }

  async getAttemptSummary(attemptId: string) {
    return this.request<AttemptSummary>(`/attempts/${encodeURIComponent(attemptId)}/summary`)
  }

  async getUserAttempts(userId: number) {
    return this.request<UserAttemptsResponse>(`/users/${userId}/attempts`)
  }

  async getAttemptAnswers(attemptId: string) {
    return this.request<{ answers: any[] }>(`/attempts/${encodeURIComponent(attemptId)}/answers`)
  }
}

export const api = new ApiClient()
