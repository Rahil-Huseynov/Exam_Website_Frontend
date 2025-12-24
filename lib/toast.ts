import { toast } from "react-toastify"

export const toastSuccess = (msg: string) => toast.success(msg)
export const toastError = (msg: string) => toast.error(msg)
export const toastInfo = (msg: string) => toast.info(msg)

export function toastConfirm(message: string, onYes: () => void) {
  const id = toast.info(message, {
    autoClose: false,
    closeOnClick: false,
    draggable: false,
    position: "top-right",
  })

  setTimeout(() => {
    const el = document.getElementById(String(id))
    if (!el) return

    if (el.querySelector("[data-toast-confirm-actions='1']")) return

    const wrap = document.createElement("div")
    wrap.setAttribute("data-toast-confirm-actions", "1")
    wrap.style.marginTop = "10px"
    wrap.style.display = "flex"
    wrap.style.justifyContent = "flex-end"
    wrap.style.gap = "8px"

    const cancelBtn = document.createElement("button")
    cancelBtn.innerText = "Cancel"
    cancelBtn.style.padding = "6px 10px"
    cancelBtn.style.border = "1px solid #ccc"
    cancelBtn.style.borderRadius = "6px"
    cancelBtn.style.background = "transparent"
    cancelBtn.style.cursor = "pointer"
    cancelBtn.onclick = () => toast.dismiss(id)

    const okBtn = document.createElement("button")
    okBtn.innerText = "Delete"
    okBtn.style.padding = "6px 10px"
    okBtn.style.border = "1px solid #dc2626"
    okBtn.style.borderRadius = "6px"
    okBtn.style.background = "#dc2626"
    okBtn.style.color = "#fff"
    okBtn.style.cursor = "pointer"
    okBtn.onclick = () => {
      toast.dismiss(id)
      onYes()
    }

    wrap.appendChild(cancelBtn)
    wrap.appendChild(okBtn)
    el.appendChild(wrap)
  }, 0)
}
