"use client"

import { useEffect, useMemo, useState } from "react"
import { toast } from "react-toastify"
import { api, type AdminListItem } from "@/lib/api"
import { useLocale } from "@/contexts/locale-context"
import { useTranslation } from "@/lib/i18n"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Trash2, Pencil, X, Save, RefreshCw } from "lucide-react"

type EditState = {
  id: number
  firstName: string
  lastName: string
  role: string
  password: string
}

export function AdminsTab() {
  const { locale } = useLocale()
  const { t } = useTranslation(locale)

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [role, setRole] = useState<"admin" | "superadmin">("admin")
  const [creating, setCreating] = useState(false)

  const [admins, setAdmins] = useState<AdminListItem[]>([])
  const [loadingList, setLoadingList] = useState(true)
  const [search, setSearch] = useState("")
  const [edit, setEdit] = useState<EditState | null>(null)

  const filteredAdmins = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return admins
    return admins.filter((a) => {
      const full = `${a.firstName ?? ""} ${a.lastName ?? ""} ${a.email ?? ""} ${a.role ?? ""}`.toLowerCase()
      return full.includes(q)
    })
  }, [admins, search])

  const loadAdmins = async () => {
    setLoadingList(true)
    try {
      const res = await api.getAdmins(1, 100, "")
      setAdmins(res.users || [])
    } catch (e: any) {
      toast.error(t("errAdminsLoad"))
    } finally {
      setLoadingList(false)
    }
  }

  useEffect(() => {
    loadAdmins()
  }, [])

  const submitCreate = async () => {
    const e = email.trim().toLowerCase()
    if (!e) return toast.error(t("errEmailRequired"))
    if (!password || password.length < 6) return toast.error(t("errPasswordTooShort"))

    setCreating(true)
    try {
      await api.adminSignup({
        email: e,
        password,
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
        role,
      })
      toast.success(t("adminCreated"))
      setEmail("")
      setPassword("")
      setFirstName("")
      setLastName("")
      setRole("admin")
      await loadAdmins()
    } catch (e: any) {
      toast.error(t("errGeneric"))
    } finally {
      setCreating(false)
    }
  }

  const startEdit = (a: AdminListItem) => {
    setEdit({
      id: a.id,
      firstName: a.firstName ?? "",
      lastName: a.lastName ?? "",
      role: (a.role ?? "admin") as string,
      password: "",
    })
  }

  const cancelEdit = () => setEdit(null)

  const saveEdit = async () => {
    if (!edit) return
    const payload: any = {
      firstName: edit.firstName.trim() || null,
      lastName: edit.lastName.trim() || null,
      role: edit.role,
    }
    if (edit.password.trim()) {
      if (edit.password.trim().length < 6) return toast.error(t("errPasswordTooShort"))
      payload.password = edit.password.trim()
    }

    try {
      const updated = await api.updateAdmin(edit.id, payload)
      toast.success(t("adminUpdated"))
      setAdmins((prev) => prev.map((x) => (x.id === edit.id ? { ...x, ...updated } : x)))
      setEdit(null)
    } catch {
      toast.error(t("errUpdateFailed"))
    }
  }

  const removeAdmin = async (id: number) => {
    if (!confirm(t("confirmDeleteAdmin"))) return
    try {
      await api.deleteAdmin(id)
      toast.success(t("adminDeleted"))
      setAdmins((prev) => prev.filter((x) => x.id !== id))
      if (edit?.id === id) setEdit(null)
    } catch {
      toast.error(t("errDeleteFailed"))
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("addAdminTitle")}</CardTitle>
          <CardDescription>{t("addAdminDesc")}</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label>{t("email")}</Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@mail.com" />
          </div>

          <div className="grid gap-2">
            <Label>{t("password")}</Label>
            <Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" />
          </div>

          <div className="grid gap-2 md:grid-cols-2">
            <div className="grid gap-2">
              <Label>{t("firstName")}</Label>
              <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>{t("lastName")}</Label>
              <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </div>
          </div>

          <div className="grid gap-2">
            <Label>{t("role")}</Label>
            <div className="flex gap-2">
              <Button type="button" variant={role === "admin" ? "default" : "outline"} onClick={() => setRole("admin")} className="flex-1">
                admin
              </Button>
              <Button type="button" variant={role === "superadmin" ? "default" : "outline"} onClick={() => setRole("superadmin")} className="flex-1">
                superadmin
              </Button>
            </div>
          </div>

          <Button disabled={creating} onClick={submitCreate} className="w-full">
            {creating ? t("creating") : t("createAdmin")}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{t("adminsTitle")}</CardTitle>
            <CardDescription>{t("adminsDesc")}</CardDescription>
          </div>

          <Button variant="outline" onClick={loadAdmins} disabled={loadingList} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            {t("refresh")}
          </Button>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label>{t("search")}</Label>
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("searchPlaceholder")} />
          </div>

          {loadingList ? (
            <div className="text-sm text-muted-foreground">{t("loading")}</div>
          ) : filteredAdmins.length === 0 ? (
            <div className="text-sm text-muted-foreground">{t("noAdminsFound")}</div>
          ) : (
            <div className="space-y-3">
              {filteredAdmins.map((a) => {
                const isEditing = edit?.id === a.id

                return (
                  <div key={a.id} className="rounded-xl border p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div className="space-y-1">
                        <div className="font-semibold">
                          {(a.firstName || a.lastName)
                            ? `${a.firstName ?? ""} ${a.lastName ?? ""}`.trim()
                            : t("noName")}
                        </div>
                        <div className="text-sm text-muted-foreground">{a.email}</div>
                        <div className="text-xs text-muted-foreground">
                          {t("role")}: {a.role ?? "admin"}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        {!isEditing ? (
                          <>
                            <Button variant="outline" onClick={() => startEdit(a)} className="gap-2">
                              <Pencil className="h-4 w-4" />
                              {t("edit")}
                            </Button>
                            <Button variant="destructive" onClick={() => removeAdmin(a.id)} className="gap-2">
                              <Trash2 className="h-4 w-4" />
                              {t("delete")}
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button onClick={saveEdit} className="gap-2">
                              <Save className="h-4 w-4" />
                              {t("save")}
                            </Button>
                            <Button variant="outline" onClick={cancelEdit} className="gap-2">
                              <X className="h-4 w-4" />
                              {t("cancel")}
                            </Button>
                          </>
                        )}
                      </div>
                    </div>

                    {isEditing && edit && (
                      <div className="mt-4 grid gap-3 md:grid-cols-2">
                        <div className="grid gap-2">
                          <Label>{t("firstName")}</Label>
                          <Input value={edit.firstName} onChange={(e) => setEdit({ ...edit, firstName: e.target.value })} />
                        </div>
                        <div className="grid gap-2">
                          <Label>{t("lastName")}</Label>
                          <Input value={edit.lastName} onChange={(e) => setEdit({ ...edit, lastName: e.target.value })} />
                        </div>

                        <div className="grid gap-2 md:col-span-2">
                          <Label>{t("role")}</Label>
                          <div className="flex gap-2">
                            <Button type="button" variant={edit.role === "admin" ? "default" : "outline"} onClick={() => setEdit({ ...edit, role: "admin" })} className="flex-1">
                              admin
                            </Button>
                            <Button type="button" variant={edit.role === "superadmin" ? "default" : "outline"} onClick={() => setEdit({ ...edit, role: "superadmin" })} className="flex-1">
                              superadmin
                            </Button>
                          </div>
                        </div>

                        <div className="grid gap-2 md:col-span-2">
                          <Label>{t("newPasswordOptional")}</Label>
                          <Input
                            value={edit.password}
                            onChange={(e) => setEdit({ ...edit, password: e.target.value })}
                            type="password"
                            placeholder={t("passwordOptionalHint")}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
