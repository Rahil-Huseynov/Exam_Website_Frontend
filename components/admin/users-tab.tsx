import { useEffect, useRef, useState } from "react";
import { api, ApiUser } from "@/lib/api";
import { useLocale } from "@/contexts/locale-context";
import { useTranslation } from "@/lib/i18n";
import { Download, LoaderCircle } from "lucide-react";

type User = ApiUser;

export default function AdminUsersModern() {
    const [users, setUsers] = useState<User[]>([]);
    const [page, setPage] = useState<number>(1);
    const [limit] = useState<number>(50);
    const [totalPages, setTotalPages] = useState<number>(1);
    const [totalCount, setTotalCount] = useState<number>(0);
    const [search, setSearch] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [selectedUserFull, setSelectedUserFull] = useState<any | null>(null);
    const [showModal, setShowModal] = useState<boolean>(false);
    const [loadingDetails, setLoadingDetails] = useState<boolean>(false);
    const [activeTab, setActiveTab] = useState<string>("overview");
    const { locale } = useLocale();
    const { t } = useTranslation(locale);

    const debounceRef = useRef<number | null>(null);

    useEffect(() => {
        if (showModal) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "auto";
        }

        return () => {
            document.body.style.overflow = "auto";
        };
    }, [showModal]);

    useEffect(() => {
        loadUsers(page, limit, search);
    }, [page]);

    useEffect(() => {
        if (debounceRef.current) window.clearTimeout(debounceRef.current);
        debounceRef.current = window.setTimeout(() => {
            setPage(1);
            loadUsers(1, limit, search);
        }, 450) as unknown as number;
        return () => {
            if (debounceRef.current) window.clearTimeout(debounceRef.current);
        };
    }, [search]);

    async function loadUsers(p = 1, l = 50, q = "") {
        setLoading(true);
        setError(null);
        try {
            const data = await api.getUsers({ page: p, limit: l, search: q });
            setUsers(data.users || []);
            setTotalCount(data.totalCount ?? (data.users || []).length);
            setTotalPages(data.totalPages ?? Math.max(1, Math.ceil((data.totalCount ?? (data.users || []).length) / l)));
            setPage(data.currentPage ?? p);
        } catch (err: any) {
            console.error(err);
            setError(err?.message || t("errors.generic"));
        } finally {
            setLoading(false);
        }
    }

    function formatName(u: User) {
        return `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || "-";
    }

    function formatBalance(b?: string | number) {
        if (b === undefined || b === null) return "0.00";
        const n = Number(b);
        if (!Number.isFinite(n)) return "0.00";
        return n.toFixed(2);
    }

    function formatDate(d?: string | Date) {
        if (!d) return "-";
        const dt = typeof d === "string" ? new Date(d) : d;
        return dt.toLocaleString();
    }

    async function openUser(u: User) {
        setSelectedUser(u);
        setSelectedUserFull(null);
        setShowModal(true);
        setActiveTab("overview");
        setLoadingDetails(true);
        try {
            const full = await api.getUserFull(u.id);
            setSelectedUserFull(full);
        } catch (err: any) {
            console.error("Failed to load user full:", err);
            setSelectedUserFull({ error: err?.message || String(err) });
        } finally {
            setLoadingDetails(false);
        }
    }

    function closeModal() {
        setShowModal(false);
        setSelectedUser(null);
        setSelectedUserFull(null);
    }

    function exportCsv() {
        if (!users.length) return;
        const header = [t("csv.id"), t("csv.publicId"), t("csv.email"), t("csv.firstName"), t("csv.lastName"), t("csv.role"), t("csv.balance"), t("csv.createdAt")];
        const rows = users.map((u) => [
            u.id,
            u.publicId ?? "",
            u.email,
            u.firstName ?? "",
            u.lastName ?? "",
            u.role ?? "",
            formatBalance(u.balance),
            u.createdAt ?? "",
        ]);
        const csv = [header, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${t("csv.filenamePrefix")}_page_${page}_size_${limit}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    }

    const Spinner = () => (
        <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" aria-hidden>
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
        </svg>
    );

    return (
        <div className="min-h-screen bg-slate-50 p-6">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-semibold text-slate-800">{t("users.title")}</h1>
                        <p className="text-sm text-slate-500">{t("users.subtitle")}</p>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <div className="relative flex-1 sm:flex-none">
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder={t("users.searchPlaceholder")}
                                className="pl-10 pr-4 py-2 w-full rounded-lg shadow-sm border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                aria-label={t("users.searchAria")}
                            />
                            <svg className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M12.9 14.32a8 8 0 111.414-1.414l4.387 4.387-1.414 1.414-4.387-4.387zM8 14a6 6 0 100-12 6 6 0 000 12z" clipRule="evenodd" />
                            </svg>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => loadUsers(1, limit, search)}
                                className="inline-flex items-center gap-2 px-3 py-2 bg-white border rounded-lg shadow-sm text-sm hover:bg-gray-50"
                                title={t("buttons.reload")}>
                                <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path d="M4 4v5h.582A6 6 0 1110 16v-2a4 4 0 10-3.464-6H4z" /></svg>
                                {t("buttons.reload")}
                            </button>

                            <button
                                onClick={exportCsv}
                                className="inline-flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-lg shadow-sm text-sm hover:bg-indigo-700"
                                title={t("buttons.csv")}>
                                <Download className="w-5" />
                                {t("buttons.csv")}
                            </button>

                            <div className="px-3 py-2 bg-white border rounded-lg text-sm">
                                <div className="text-xs text-slate-400">{t("labels.pageSize")}</div>
                                <div className="font-medium">50</div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-2xl shadow p-4">
                    <div className="flex items-center justify-between mb-3">
                        <div className="text-sm text-slate-600">{t("labels.total")}: <span className="font-medium text-slate-800">{totalCount}</span> {t("labels.users")}</div>
                        <div className="hidden sm:flex items-center gap-2">
                            <div className="text-sm text-slate-500">{t("labels.page")}</div>
                            <div className="inline-flex items-center gap-2 px-3 py-2 bg-slate-100 rounded-lg text-sm">
                                <button
                                    onClick={() => setPage(1)}
                                    disabled={page <= 1}
                                    className="px-2 py-1 rounded disabled:opacity-50"
                                >«</button>
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page <= 1}
                                    className="px-2 py-1 rounded disabled:opacity-50"
                                >‹</button>
                                <div className="px-2 font-medium">{page}</div>
                                <div className="text-xs text-slate-400">/ {totalPages}</div>
                                <button
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page >= totalPages}
                                    className="px-2 py-1 rounded disabled:opacity-50"
                                >›</button>
                                <button
                                    onClick={() => setPage(totalPages)}
                                    disabled={page >= totalPages}
                                    className="px-2 py-1 rounded disabled:opacity-50"
                                >»</button>
                            </div>
                        </div>
                    </div>
                    <div className="w-full overflow-auto max-h-[66vh] border border-slate-100 rounded-lg">
                        <table className="min-w-[980px] w-full table-auto">
                            <thead className="bg-gradient-to-r from-slate-50 to-slate-50 sticky top-0 z-10">
                                <tr className="text-sm text-slate-600">
                                    <th className="px-4 py-3 text-center">№</th>
                                    <th className="px-4 py-3 text-center">{t("table.publicId")}</th>
                                    <th className="px-4 py-3 text-center">{t("table.email")}</th>
                                    <th className="px-4 py-3 text-center">{t("table.name")}</th>
                                    <th className="px-4 py-3 text-center">{t("table.role")}</th>
                                    <th className="px-4 py-3 text-center">{t("table.balance")}</th>
                                    <th className="px-4 py-3 text-center">{t("table.joined")}</th>
                                    <th className="px-4 py-3 text-center">{t("table.actions")}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    Array.from({ length: 8 }).map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td className="px-4 py-4"><div className="h-4 w-6 bg-slate-200 rounded" /></td>
                                            <td className="px-4 py-4"><div className="h-8 w-8 bg-slate-200 rounded" /></td>
                                            <td className="px-4 py-4"><div className="h-4 w-28 bg-slate-200 rounded" /></td>
                                            <td className="px-4 py-4"><div className="h-4 w-52 bg-slate-200 rounded" /></td>
                                            <td className="px-4 py-4"><div className="h-4 w-36 bg-slate-200 rounded" /></td>
                                            <td className="px-4 py-4"><div className="h-4 w-24 bg-slate-200 rounded" /></td>
                                            <td className="px-4 py-4 text-right"><div className="h-4 w-20 bg-slate-200 rounded ml-auto" /></td>
                                            <td className="px-4 py-4"><div className="h-4 w-32 bg-slate-200 rounded" /></td>
                                        </tr>
                                    ))
                                ) : error ? (
                                    <tr><td colSpan={8} className="p-6 text-center text-rose-600">{error}</td></tr>
                                ) : users.length === 0 ? (
                                    <tr><td colSpan={8} className="p-6 text-center text-slate-500">{t("messages.noUsers")}</td></tr>
                                ) : (
                                    users.map((u, idx) => (
                                        <tr key={u.id} className="hover:bg-slate-50 border-b last:border-b-0">
                                            <td className="px-4 py-3 text-sm text-slate-600">{(page - 1) * limit + idx + 1}</td>
                                            <td className="px-4 py-3 font-mono text-xs text-slate-700">{u.publicId ?? "-"}</td>
                                            <td className="px-4 py-3 text-slate-800">{u.email}</td>
                                            <td className="px-4 py-3 text-slate-700">{formatName(u)}</td>
                                            <td className="px-4 py-3 text-slate-600">{u.role ?? "-"}</td>
                                            <td className="px-4 py-3 text-right font-medium text-slate-800">{formatBalance(u.balance)} <span className="text-xs text-slate-400">AZN</span></td>
                                            <td className="px-4 py-3 text-slate-500">{formatDate(u.createdAt)}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex justify-center items-center gap-2">
                                                    <button
                                                        onClick={() => openUser(u)}
                                                        className="inline-flex items-center justify-center w-9 h-9 rounded-lg border hover:bg-slate-100"
                                                        title={t("buttons.view")}>
                                                        <svg className="w-4 h-4 text-slate-600" viewBox="0 0 24 24" fill="none"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="flex items-center justify-between mt-4 sm:hidden">
                        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="px-3 py-1 rounded border disabled:opacity-50">{t("buttons.prev")}</button>
                        <div className="text-sm">{page} / {totalPages}</div>
                        <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="px-3 py-1 rounded border disabled:opacity-50">{t("buttons.next")}</button>
                    </div>
                </div>
            </div>
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50" onClick={closeModal} />

                    <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden" style={{ maxHeight: "88vh" }}>
                        <div className="flex items-center justify-between gap-4 p-4 border-b">
                            <div>
                                <h3 className="text-lg font-semibold text-slate-800">{selectedUser?.email ?? selectedUserFull?.email}</h3>
                                <div className="text-sm text-slate-500">{selectedUser?.publicId ?? selectedUserFull?.publicId ?? ""}</div>
                            </div>

                            <div className="flex items-center gap-2">
                                <button onClick={closeModal} className="px-3 py-2 rounded-lg text-sm border hover:bg-slate-50">{t("buttons.close")}</button>
                            </div>
                        </div>

                        <div className="flex gap-6 p-4">
                            <div className="w-full">
                                <div className="flex items-center gap-2 mb-4">
                                    {["overview", "attempts", "payments", "transactions"].map((tkey) => (
                                        <button
                                            key={tkey}
                                            onClick={() => setActiveTab(tkey)}
                                            className={`px-3 py-1.5 rounded-lg text-sm ${activeTab === tkey ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-700"}`}
                                        >
                                            {tkey === "overview" && t("tabs.overview")}
                                            {tkey === "attempts" && `${t("tabs.attempts")} (${(selectedUserFull?.attempts || []).length})`}
                                            {tkey === "payments" && `${t("tabs.payments")} (${(selectedUserFull?.payments || []).length})`}
                                            {tkey === "transactions" && `${t("tabs.transactions")} (${(selectedUserFull?.balanceTransactions || []).length})`}
                                        </button>
                                    ))}
                                </div>

                                <div className="overflow-auto px-1" style={{ maxHeight: "64vh" }}>
                                    {loadingDetails ? (
                                        <div className="p-8 text-center">
                                            <div className="inline-flex items-center gap-2 bg-indigo-600 text-white rounded-full px-3 py-1"><LoaderCircle /></div>
                                        </div>
                                    ) : selectedUserFull?.error ? (
                                        <div className="p-6 text-center text-rose-600">{t("messages.error")}: {selectedUserFull.error}</div>
                                    ) : !selectedUserFull ? (
                                        <div className="p-6 text-slate-500">{t("messages.noData")}</div>
                                    ) : (
                                        <>
                                            {activeTab === "overview" && (
                                                <div className="grid grid-cols-2 gap-4 mb-6">
                                                    <div className="p-4 bg-slate-50 rounded-lg">
                                                        <div className="text-xs text-slate-400">{t("fields.id")}</div>
                                                        <div className="font-medium">{selectedUserFull.id}</div>
                                                    </div>
                                                    <div className="p-4 bg-slate-50 rounded-lg">
                                                        <div className="text-xs text-slate-400">{t("fields.publicId")}</div>
                                                        <div className="font-medium">{selectedUserFull.publicId ?? '-'}</div>
                                                    </div>

                                                    <div className="p-4 bg-slate-50 rounded-lg">
                                                        <div className="text-xs text-slate-400">{t("fields.name")}</div>
                                                        <div className="font-medium">{(selectedUserFull.firstName ?? "") + " " + (selectedUserFull.lastName ?? "")}</div>
                                                    </div>

                                                    <div className="p-4 bg-slate-50 rounded-lg">
                                                        <div className="text-xs text-slate-400">{t("fields.role")}</div>
                                                        <div className="font-medium">{selectedUserFull.role ?? "-"}</div>
                                                    </div>

                                                    <div className="p-4 bg-slate-50 rounded-lg">
                                                        <div className="text-xs text-slate-400">{t("fields.balance")}</div>
                                                        <div className="font-medium">{selectedUserFull.balance ?? "0.00"} AZN</div>
                                                    </div>

                                                    <div className="p-4 bg-slate-50 rounded-lg">
                                                        <div className="text-xs text-slate-400">{t("fields.verified")}</div>
                                                        <div className="font-medium">{selectedUserFull.isEmailVerified ? t("common.yes") : t("common.no")}</div>
                                                    </div>

                                                    <div className="p-4 bg-slate-50 rounded-lg">
                                                        <div className="text-xs text-slate-400">{t("fields.joined")}</div>
                                                        <div className="font-medium">{formatDate(selectedUserFull.createdAt)}</div>
                                                    </div>

                                                    <div className="p-4 bg-slate-50 rounded-lg">
                                                        <div className="text-xs text-slate-400">{t("fields.updated")}</div>
                                                        <div className="font-medium">{formatDate(selectedUserFull.updatedAt)}</div>
                                                    </div>
                                                </div>
                                            )}

                                            {activeTab === "attempts" && (
                                                <div className="space-y-3">
                                                    {selectedUserFull.attempts && selectedUserFull.attempts.length > 0 ? (
                                                        selectedUserFull.attempts.map((a: any) => (
                                                            <div key={a.id} className="p-3 bg-white border rounded-lg flex justify-between items-start">
                                                                <div>
                                                                    <div className="text-sm font-medium">{t("attempts.itemTitle")}: {a.id}</div>
                                                                    <div className="text-xs text-slate-500">{t("attempts.bank")}: {a.bankId} • {t("attempts.status")}: {a.status}</div>
                                                                    <div className="text-xs text-slate-400 mt-1">{formatDate(a.startedAt)} → {formatDate(a.finishedAt)}</div>
                                                                </div>
                                                                <div className="text-right">
                                                                    <div className="text-sm font-semibold">{a.score ?? 0} / {a.total ?? 0}</div>
                                                                    <div className="text-xs text-slate-400">{a.expiresAt ? formatDate(a.expiresAt) : ""}</div>
                                                                </div>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="p-4 text-sm text-slate-500">{t("messages.noAttempts")}</div>
                                                    )}
                                                </div>
                                            )}

                                            {activeTab === "payments" && (
                                                <div className="space-y-3">
                                                    {selectedUserFull.payments && selectedUserFull.payments.length > 0 ? (
                                                        selectedUserFull.payments.map((p: any) => (
                                                            <div key={p.id} className="p-3 bg-white border rounded-lg flex justify-between items-center">
                                                                <div>
                                                                    <div className="text-sm font-medium">{t("payments.order")}: {p.orderId}</div>
                                                                    <div className="text-xs text-slate-400">{formatDate(p.createdAt)}</div>
                                                                </div>
                                                                <div className="text-right">
                                                                    <div className="font-semibold">{p.amount} {p.currency}</div>
                                                                    <div className="text-xs text-slate-500">{p.status}</div>
                                                                </div>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="p-4 text-sm text-slate-500">{t("messages.noPayments")}</div>
                                                    )}
                                                </div>
                                            )}

                                            {activeTab === "transactions" && (
                                                <div className="space-y-3">
                                                    {selectedUserFull.balanceTransactions && selectedUserFull.balanceTransactions.length > 0 ? (
                                                        selectedUserFull.balanceTransactions.map((bt: any) => (
                                                            <div key={bt.id} className="p-3 bg-white border rounded-lg flex justify-between items-center">
                                                                <div>
                                                                    <div className="text-sm font-medium">{bt.type}</div>
                                                                    <div className="text-xs text-slate-400">{bt.note}</div>
                                                                </div>
                                                                <div className="text-right">
                                                                    <div className="font-semibold">{bt.amount} AZN</div>
                                                                    <div className="text-xs text-slate-500">{formatDate(bt.createdAt)}</div>
                                                                </div>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="p-4 text-sm text-slate-500">{t("messages.noTransactions")}</div>
                                                    )}
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
