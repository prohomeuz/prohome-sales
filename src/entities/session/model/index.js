import { create } from "zustand"

export const useAppStore = create((set) => {
  return {
    user: JSON.parse(localStorage.getItem("user")),
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
  }
})
