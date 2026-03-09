"use client"

import * as React from "react"

type Direction = "ltr" | "rtl"

type DirectionProviderProps = {
  children: React.ReactNode
  direction: Direction
}

const DirectionContext = React.createContext<Direction>("ltr")

export function DirectionProvider({ children, direction }: DirectionProviderProps) {
  return (
    <DirectionContext.Provider value={direction}>
      {children}
    </DirectionContext.Provider>
  )
}

export function useDirection() {
  return React.useContext(DirectionContext)
}
