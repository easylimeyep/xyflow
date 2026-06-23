import { converter, formatHex, clampChroma } from "culori"

const toOklch = converter("oklch")
const STEPS = [100, 200, 300, 400, 500, 600, 700, 800, 900]

// целевые светлоты для определения «куда попал» цвет
const TARGET_L = {
  100: 0.95,
  200: 0.88,
  300: 0.79,
  400: 0.68,
  500: 0.57,
  600: 0.49,
  700: 0.41,
  800: 0.33,
  900: 0.24,
}

// 1. куда по светлоте ближе всего ввод
function detectStep(baseHex) {
  const { l } = toOklch(baseHex)
  let best = 500,
    bestDist = Infinity
  for (const step of STEPS) {
    const d = Math.abs(TARGET_L[step] - l)
    if (d < bestDist) {
      bestDist = d
      best = step
    }
  }
  return best
}

// 2. генерим шкалу, протягивая её ЧЕРЕЗ точный цвет пользователя
function generateScale(baseHex, anchorStep = detectStep(baseHex)) {
  const base = toOklch(baseHex)
  const anchorIdx = STEPS.indexOf(anchorStep)
  const anchorL = base.l // точная светлота ввода — не трогаем

  const L_LIGHT = 0.97 // около-белый конец, но в тон
  const L_DARK = 0.22 // около-чёрный конец

  const scale = {}
  STEPS.forEach((step, i) => {
    let L
    if (i === anchorIdx) {
      L = anchorL // якорь = ровно цвет юзера
    } else if (i < anchorIdx) {
      const t = i / anchorIdx // от светлого конца к якорю
      L = L_LIGHT + (anchorL - L_LIGHT) * t
    } else {
      const t = (i - anchorIdx) / (STEPS.length - 1 - anchorIdx)
      L = anchorL + (L_DARK - anchorL) * t // от якоря к тёмному концу
    }

    // chroma спадает к краям, иначе грязь и вылет из gamut
    const c = base.c * (1 - Math.abs(L - anchorL) * 0.6)

    scale[step] = formatHex(
      clampChroma(
        { mode: "oklch", l: L, c: Math.max(c, 0), h: base.h },
        "oklch"
      )
    )
  })
  return scale
}
