import { create } from "zustand"
import { apiRequest } from "@/shared/lib/api"

export const useAppStore = create((set) => {
  let currencyRequestId = 0

  return {
    user: JSON.parse(localStorage.getItem("user")),
    currencyUsd: null,
    currencyLoading: false,
    setUser(data) {
      return set(() => {
        if (data) {
          localStorage.setItem("user", JSON.stringify(data.user))
          localStorage.setItem("token", data.accessToken)
          return { user: data.user }
        } else {
          localStorage.removeItem("user")
          localStorage.removeItem("token")
          return { user: data }
        }
      })
    },
    setCurrencyUsd(data) {
      return set(() => ({ currencyUsd: data }))
    },
    async fetchCurrencyUsd() {
      const requestId = (currencyRequestId += 1)
      set(() => ({ currencyLoading: true }))
      try {
        const res = await apiRequest("/api/v1/currency/usd")
        if (res.ok) {
          const data = await res.json()
          if (requestId === currencyRequestId) {
            set(() => ({ currencyUsd: data }))
          }
        }
      } catch {
        // Currency is optional; ignore errors.
      } finally {
        if (requestId === currencyRequestId) {
          set(() => ({ currencyLoading: false }))
        }
      }
    },
  }
})
