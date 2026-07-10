import React, { createContext, useContext, useMemo, useState } from "react"

interface EnclosureExplodedViewContextType {
  exploded: boolean
  setExploded: (exploded: boolean) => void
}

const EnclosureExplodedViewContext = createContext<
  EnclosureExplodedViewContextType | undefined
>(undefined)

export const getEnclosureExplodeZOffset = (
  cadComponent: any,
  exploded: boolean,
): number => {
  if (!exploded) return 0
  const offset = cadComponent?.enclosure_explode_z_offset_mm
  return typeof offset === "number" && Number.isFinite(offset) ? offset : 0
}

export const EnclosureExplodedViewProvider: React.FC<{
  children: React.ReactNode
}> = ({ children }) => {
  const [exploded, setExploded] = useState(false)
  const value = useMemo(() => ({ exploded, setExploded }), [exploded])

  return (
    <EnclosureExplodedViewContext.Provider value={value}>
      {children}
    </EnclosureExplodedViewContext.Provider>
  )
}

export const useEnclosureExplodedView = () => {
  const context = useContext(EnclosureExplodedViewContext)
  if (!context) {
    throw new Error(
      "useEnclosureExplodedView must be used within an EnclosureExplodedViewProvider",
    )
  }
  return context
}
