"use client"

import { toast } from "react-toastify"

const API_URL = process.env.NEXT_PUBLIC_API_URL

// ================== TYPES ==================
export interface User {
  id: number
  name: string
  email: string
  balance: number
  publicId: string
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

export type AttemptReviewItem = {
  answerId: string
  createdAt: string
  isCorrect: boolean
  question: {
    id: string
    text: string
    options: { id: string; text: string }[]
    correctOptionId: string | null
    correctOptionText: string | null
  }
  selected: { id: string; text: string }
}

export type ExamAttempt = {
  id: string
  status: "IN_PROGRESS" | "FINISHED"
  startedAt: string
  finishedAt?: string | null
  score: number
  total: number
  bank: {
    id: string
    title: string
    year: number
    price: number
    university: { id: string; name: string; nameAz?: string; nameEn?: string; nameRu?: string; logo?: string | null }
    subject: { id: string; name: string; nameAz?: string; nameEn?: string; nameRu?: string }
    topic?: any
  }
}


export type AttemptReviewResponse = {
  attempt: {
    id: string
    status: string
    startedAt: string
    finishedAt?: string | null
    score: number
    total: number
  }
  exam: any
  stats: { answered: number; correct: number; wrong: number }
  items: AttemptReviewItem[]
}

export interface QuestionOption {
  id: string
  text: string
}

export type ExamQuestion = {
  id: string
  text: string
  options: { id: string; text: string }[]
}

export interface Question {
  id: string
  text: string
  options: QuestionOption[]
}

export type AttemptAnswer = {
  id: string
  questionId: string
  selectedOptionId: string
  isCorrect: boolean
  createdAt: string
  question: {
    id: string
    text: string
    correctOptionId: string
    options: { id: string; text: string }[]
  }
  selectedOption: { id: string; text: string }
}

export type AdminListItem = {
  id: number
  email: string
  firstName?: string | null
  lastName?: string | null
  role?: string | null
}

export type AdminListResponse = {
  users: AdminListItem[]
  totalPages: number
}

export type UpdateAdminPayload = {
  firstName?: string
  lastName?: string
  role?: string
  password?: string
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

export type AdminTopUpByPublicIdResponse = {
  ok: true
  added: string
  user: { id: number; publicId: string; email: string; firstName?: string | null; lastName?: string | null; balance: string }
}

export type AdminSignupResponse = {
  ok: true
  admin: { id: number; email: string; firstName?: string | null; lastName?: string | null; role: string }
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


export type UpdateExamPayload = { title?: string; year?: number; price?: number }
export type DeleteOkResponse = { ok: boolean }
export type CreateExamTokenResponse = { ok: true; token: string; expiresAt: string }
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

export type AttemptQuestion = {
  id: string
  text: string
  options: { id: string; text: string }[]
}
export type AttemptQuestionsResponse = { questions: AttemptQuestion[] }

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

  // ------------------ helpers (locale) ------------------
  private getLocale(): "az" | "en" | "ru" {
    if (typeof window === "undefined") return "en"

    const ls =
      window.localStorage.getItem("locale") ||
      window.localStorage.getItem("lang") ||
      window.localStorage.getItem("NEXT_LOCALE")
    if (ls === "az" || ls === "en" || ls === "ru") return ls

    const cookie = document.cookie || ""
    const pick = (key: string) => {
      const m = cookie.match(new RegExp(`(?:^|; )${key}=([^;]*)`))
      return m ? decodeURIComponent(m[1]) : ""
    }
    const ck = pick("locale") || pick("lang") || pick("NEXT_LOCALE")
    if (ck === "az" || ck === "en" || ck === "ru") return ck

    return "en"
  }

  private pickLang(az: string, en: string, ru: string) {
    const l = this.getLocale()
    return l === "az" ? az : l === "ru" ? ru : en
  }

  private pickFrom3Lang(serverMsg: string) {
    const msg = String(serverMsg || "").trim()
    if (!msg) return ""

    const s = msg.replace(/\r/g, "")
    const hasMarkers = /AZ:\s*/i.test(s) && /EN:\s*/i.test(s) && /RU:\s*/i.test(s)
    if (!hasMarkers) return msg

    const extract = (tag: "AZ" | "EN" | "RU") => {
      const re = new RegExp(`${tag}:\\s*([\\s\\S]*?)(?=\\n(?:AZ|EN|RU):\\s*|$)`, "i")
      const m = s.match(re)
      return (m?.[1] || "").trim()
    }

    const az = extract("AZ")
    const en = extract("EN")
    const ru = extract("RU")

    return this.pickLang(az || msg, en || msg, ru || msg)
  }

  private getDefaultErrMsg(status: number, serverMsg?: string) {
    if (serverMsg && String(serverMsg).trim()) {
      return this.pickFrom3Lang(String(serverMsg).trim())
    }

    if (status === 0) {
      return this.pickLang(
        "Şəbəkə xətası. İnterneti yoxlayın.",
        "Network error. Check your internet connection.",
        "Ошибка сети. Проверьте интернет-соединение.",
      )
    }

    if (status === 400) {
      return this.pickLang("Göndərilən məlumat düzgün deyil.", "Invalid request data.", "Неверные данные запроса.")
    }

    if (status === 401) {
      return this.pickLang(
        "Sessiya bitib. Yenidən daxil olun.",
        "Session expired. Please log in again.",
        "Сессия истекла. Войдите снова.",
      )
    }

    if (status === 403) {
      return this.pickLang(
        "Bu əməliyyat üçün icazəniz yoxdur.",
        "You don’t have permission for this action.",
        "У вас нет прав на это действие.",
      )
    }

    if (status === 404) {
      return this.pickLang("Resurs tapılmadı.", "Resource not found.", "Ресурс не найден.")
    }

    if (status >= 500) {
      return this.pickLang(
        "Server xətası. Bir az sonra yenidən yoxlayın.",
        "Server error. Please try again later.",
        "Ошибка сервера. Попробуйте позже.",
      )
    }

    return this.pickLang("Xəta baş verdi.", "Something went wrong.", "Произошла ошибка.")
  }

  private toastRequestError(message: string, toastId: string) {
    toast.error(message, { toastId })
  }

  private async request<T>(
    endpoint: string,
    options: (Omit<RequestInit, "body"> & { body?: BodyInit | null; json?: any; skipToast?: boolean }) = {},
  ): Promise<T> {
    if (!API_URL) {
      const msg = this.pickLang(
        "NEXT_PUBLIC_API_URL tapılmadı. .env-də set et.",
        "NEXT_PUBLIC_API_URL is missing. Set it in .env.",
        "NEXT_PUBLIC_API_URL не найден. Укажите в .env.",
      )

      if (typeof window !== "undefined" && !options.skipToast) {
        const toastId = `reqerr:apiurl:${Date.now()}:${Math.random().toString(16).slice(2)}`
        this.toastRequestError(msg, toastId)
      }

      throw new Error("NEXT_PUBLIC_API_URL tapılmadı. .env-də set et.")
    }

    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string> | undefined),
    }

    const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData

    if (!isFormData) headers["Content-Type"] = headers["Content-Type"] ?? "application/json"

    if (process.env.NEXT_PUBLIC_API_KEY) headers["x-api-key"] = process.env.NEXT_PUBLIC_API_KEY
    if (this.token) headers["Authorization"] = `Bearer ${this.token}`

    const toastId = `reqerr:${endpoint}:${Date.now()}:${Math.random().toString(16).slice(2)}`

    const bodyToSend: BodyInit | null | undefined =
      options.json !== undefined ? JSON.stringify(options.json) : options.body

    let res: Response
    try {
      res = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
        body: bodyToSend,
        credentials: "include",
      })
    } catch {
      const message = this.getDefaultErrMsg(0)
      if (typeof window !== "undefined" && !options.skipToast) {
        this.toastRequestError(message, toastId)
      }
      throw new Error("Network error")
    }

    if (!res.ok) {
      const contentType = res.headers.get("content-type") || ""
      let serverMsg = ""

      try {
        if (contentType.includes("application/json")) {
          const j: any = await res.json()
          serverMsg = j?.message || j?.error || ""
        } else {
          serverMsg = await res.text()
        }
      } catch {
        serverMsg = ""
      }

      let message = serverMsg ? this.pickFrom3Lang(serverMsg) : this.getDefaultErrMsg(res.status)

      if (
        serverMsg &&
        serverMsg.toLowerCase().includes("balans") &&
        (serverMsg.toLowerCase().includes("kifayət") || serverMsg.toLowerCase().includes("kifayet"))
      ) {
        message = this.pickLang(
          "Balansda kifayət qədər vəsait yoxdur",
          "Insufficient balance",
          "Недостаточно средств на балансе",
        )
      }

      const publicNoAuthEndpoints = ["/", "/faq", "/contact-us"]

      const suppress401OnAuth =
        res.status === 401 &&
        (endpoint.startsWith("/auth/") || publicNoAuthEndpoints.some((p) => endpoint === p))

      const shouldToast = typeof window !== "undefined" && !options.skipToast && !suppress401OnAuth
      if (shouldToast) this.toastRequestError(message, toastId)

      throw new Error(`${message} (Status: ${res.status})`)
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

  async adminTopUpByPublicId(publicId: string, amount: number) {
    return this.request<AdminTopUpByPublicIdResponse>("/auth/admin/topup-by-publicid", {
      method: "POST",
      json: { publicId, amount },
    })
  }

  async adminSignup(payload: { email: string; password: string; firstName?: string; lastName?: string; role?: string }) {
    return this.request<AdminSignupResponse>("/auth/admin/signup", {
      method: "POST",
      json: payload,
    })
  }


  async register(email: string, password: string, firstName: string, lastName?: string) {
    return this.request<{ success: boolean; email?: string; error?: string }>("/auth/user/signup", {
      method: "POST",
      body: JSON.stringify({ email, password, firstName, lastName }),
    })
  }

  async getProfile() {
    return this.request<User>("/auth/me")
  }

  // ================== EMAIL VERIFY ==================
  async verifyEmail(email: string, code: string) {
    return this.request<{ success: boolean; error?: string }>("/auth/user/verify-email", {
      method: "POST",
      body: JSON.stringify({ email, code }),
    })
  }

  async resendVerificationCode(email: string) {
    return this.request<{ success: boolean; error?: string }>("/auth/user/resend-verification", {
      method: "POST",
      body: JSON.stringify({ email }),
    })
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

  async updateUniversity(
    universityId: string,
    data: { name?: string; nameAz?: string; nameEn?: string; nameRu?: string; logo?: string | null },
  ) {
    return this.request<University>(`/questions/university/${encodeURIComponent(universityId)}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    })
  }

  async deleteUniversity(universityId: string) {
    return this.request<DeleteOkResponse>(`/questions/university/${encodeURIComponent(universityId)}`, {
      method: "DELETE",
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

  async updateSubject(
    subjectId: string,
    data: { name?: string; nameAz?: string; nameEn?: string; nameRu?: string },
  ) {
    return this.request<Subject>(`/questions/subject/${encodeURIComponent(subjectId)}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    })
  }

  async deleteSubject(subjectId: string) {
    return this.request<DeleteOkResponse>(`/questions/subject/${encodeURIComponent(subjectId)}`, {
      method: "DELETE",
    })
  }

  // ================== EXAMS / QUESTIONS ==================
  async getExamsByFilter(universityId?: string, subjectId?: string, year?: number) {
    const params = new URLSearchParams()
    if (universityId) params.append("universityId", String(universityId))
    if (subjectId) params.append("subjectId", String(subjectId))
    if (year) params.append("year", String(year))
    const qs = params.toString()
    return this.request<Exam[]>(`/questions/exams${qs ? `?${qs}` : ""}`)
  }

  async updateExam(bankId: string, payload: UpdateExamPayload) {
    return this.request<Exam>(`/questions/bank/${encodeURIComponent(bankId)}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    })
  }

  async getUserExamAttempts(userId: number, status?: "FINISHED" | "IN_PROGRESS") {
    const qs = status ? `?status=${encodeURIComponent(status)}` : ""
    return this.request<{ attempts: any[] }>(`/users/${encodeURIComponent(String(userId))}/attempts${qs}`)
  }


  async getAttemptReview(attemptId: string, userId: number) {
    return this.request<AttemptReviewResponse>(
      `/attempts/${encodeURIComponent(attemptId)}/review?userId=${encodeURIComponent(String(userId))}`,
    )
  }
  async getExamYearsByUniversity(universityId: string) {
    const qs = new URLSearchParams({ universityId }).toString()
    const data = await this.request<{ years: number[] }>(`/questions/years?${qs}`)
    return Array.isArray(data?.years) ? data.years : []
  }

  async createExam(data: { title: string; universityId: string; subjectId: string; year: number; price: number }) {
    return this.request<Exam>("/questions/exam", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async getExamQuestions(examId: string) {
    if (!examId || examId === "NaN" || examId === "undefined" || examId === "null") {
      throw new Error(`Invalid examId: "${examId}"`)
    }
    return this.request<any>(`/questions/exam/${encodeURIComponent(examId)}`)
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

  // ================== ATTEMPTS ==================
  async createAttempt(bankId: string, userId: number, token: string) {
    return this.request<CreateAttemptResponse>(`/banks/${encodeURIComponent(bankId)}/attempts`, {
      method: "POST",
      json: { userId, token },
    })
  }

  async revokeExamToken(bankId: string, userId: number, token: string) {
    return this.request<{ ok: true; revoked: boolean }>(`/banks/${encodeURIComponent(bankId)}/exam/revoke`, {
      method: "POST",
      json: { userId, token },
    })
  }

  async getUserAttempts(userId: number) {
    return this.request<UserAttemptsResponse>(`/users/${userId}/attempts`)
  }

  async getExams(params?: { universityId?: string; subjectId?: string; year?: number }) {
    const sp = new URLSearchParams()
    if (params?.universityId) sp.set("universityId", params.universityId)
    if (params?.subjectId) sp.set("subjectId", params.subjectId)
    if (typeof params?.year === "number") sp.set("year", String(params.year))
    const q = sp.toString()
    return this.request<Exam[]>(`/questions/exams${q ? `?${q}` : ""}`)
  }

  async createExamToken(bankId: string, userId: number) {
    return this.request<CreateExamTokenResponse>(`/banks/${encodeURIComponent(bankId)}/exam-token`, {
      method: "POST",
      json: { userId },
    })
  }

  async createAttemptWithToken(bankId: string, userId: number, token: string) {
    return this.request<CreateAttemptResponse>(`/banks/${encodeURIComponent(bankId)}/attempts`, {
      method: "POST",
      json: { userId, token },
    })
  }

  async deleteExamToken(bankId: string, userId: number, token: string, keepalive = false) {
    return this.request<{ ok: true; deleted: boolean }>(`/banks/${encodeURIComponent(bankId)}/exam-token/delete`, {
      method: "POST",
      json: { userId, token },
      keepalive,
    })
  }

  async getAttemptQuestions(attemptId: string, userId: number) {
    return this.request<{ questions: ExamQuestion[] }>(
      `/attempts/${encodeURIComponent(attemptId)}/questions?userId=${encodeURIComponent(String(userId))}`,
    )
  }

  async answerAttempt(attemptId: string, questionId: string, selectedOptionId: string) {
    return this.request<{ isCorrect: boolean; answerId: string }>(`/attempts/${encodeURIComponent(attemptId)}/answer`, {
      method: "POST",
      json: { questionId, selectedOptionId },
    })
  }

  async finishAttempt(attemptId: string) {
    return this.request<{ attemptId: string; status: string; score: number; total: number }>(
      `/attempts/${encodeURIComponent(attemptId)}/finish`,
      { method: "POST" },
    )
  }

  async getAttemptSummary(attemptId: string) {
    return this.request<AttemptSummary>(`/attempts/${encodeURIComponent(attemptId)}/summary`)
  }

  async getAttemptAnswers(attemptId: string) {
    return this.request<{ answers: AttemptAnswer[] }>(`/attempts/${encodeURIComponent(attemptId)}/answers`)
  }

  async adminGetUserByPublicId(publicId: string) {
    const qs = new URLSearchParams({ publicId }).toString()
    return this.request<{ ok: true; user: any }>(`/auth/admin/user-by-publicid?${qs}`)
  }


  async getAdmins(page = 1, limit = 50, search = "") {
    const qs = new URLSearchParams({ page: String(page), limit: String(limit), search }).toString()
    return this.request<AdminListResponse>(`/auth/admins?${qs}`)
  }

  async updateAdmin(id: number, payload: UpdateAdminPayload) {
    return this.request<AdminListItem>(`/auth/admin/${id}`, {
      method: "PUT",
      json: payload,
    })
  }

  async deleteAdmin(id: number) {
    return this.request<{ ok?: boolean; message?: string }>(`/auth/admin/${id}`, {
      method: "DELETE",
    })
  }

}

export const api = new ApiClient()
