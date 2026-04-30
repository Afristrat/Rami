"use client"

import { useState, useCallback } from "react"
import { StepBrief } from "./step-brief"
import { StepPlan } from "./step-plan"
import { StepStyle } from "./step-style"
import { StepResult } from "./step-result"
import {
  MOCK_SLIDES,
  MOCK_THEMES,
  type PresentationBrief,
  type PresentationState,
  type SlideItem,
} from "./presentation-types"

export function PresentationWizard() {
  const [state, setState] = useState<PresentationState>({
    step: 1,
    brief: {
      subject: "",
      audience: "",
      slideCount: 12,
      language: "fr",
    },
    slides: MOCK_SLIDES,
    selectedTheme: MOCK_THEMES[0].id,
  })

  const goToStep = useCallback((step: 1 | 2 | 3 | 4) => {
    setState((prev) => ({ ...prev, step }))
  }, [])

  const updateBrief = useCallback((brief: PresentationBrief) => {
    setState((prev) => ({ ...prev, brief }))
  }, [])

  const updateSlides = useCallback((slides: SlideItem[]) => {
    setState((prev) => ({ ...prev, slides }))
  }, [])

  const selectTheme = useCallback((themeId: string) => {
    setState((prev) => ({ ...prev, selectedTheme: themeId }))
  }, [])

  switch (state.step) {
    case 1:
      return (
        <StepBrief
          brief={state.brief}
          onUpdate={updateBrief}
          onNext={() => goToStep(2)}
        />
      )
    case 2:
      return (
        <StepPlan
          slides={state.slides}
          onUpdate={updateSlides}
          onNext={() => goToStep(3)}
          onBack={() => goToStep(1)}
        />
      )
    case 3:
      return (
        <StepStyle
          selectedTheme={state.selectedTheme}
          onSelectTheme={selectTheme}
          onNext={() => goToStep(4)}
          onBack={() => goToStep(2)}
        />
      )
    case 4:
      return (
        <StepResult
          totalSlides={state.brief.slideCount}
          onBack={() => goToStep(3)}
        />
      )
    default:
      return null
  }
}
