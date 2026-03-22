import { parseExpressionAt } from "acorn"

export interface TemplateExpressionSegment {
  type: "literal" | "expression"
  value: string
  start: number
  end: number
  closed?: boolean
}

export interface TemplateValidationError {
  message: string
  start: number
  end: number
}

export interface TemplateValidationResult {
  segments: TemplateExpressionSegment[]
  errors: TemplateValidationError[]
  valid: boolean
}

export function parseTemplateSegments(template: string): TemplateExpressionSegment[] {
  const segments: TemplateExpressionSegment[] = []
  let cursor = 0

  while (cursor < template.length) {
    const openIndex = template.indexOf("{{", cursor)
    if (openIndex === -1) {
      segments.push({
        type: "literal",
        value: template.slice(cursor),
        start: cursor,
        end: template.length,
      })
      break
    }

    if (openIndex > cursor) {
      segments.push({
        type: "literal",
        value: template.slice(cursor, openIndex),
        start: cursor,
        end: openIndex,
      })
    }

    const closeIndex = template.indexOf("}}", openIndex + 2)
    if (closeIndex === -1) {
      segments.push({
        type: "expression",
        value: template.slice(openIndex + 2),
        start: openIndex,
        end: template.length,
        closed: false,
      })
      break
    }

    segments.push({
      type: "expression",
      value: template.slice(openIndex + 2, closeIndex),
      start: openIndex,
      end: closeIndex + 2,
      closed: true,
    })
    cursor = closeIndex + 2
  }

  return segments
}

export function validateTemplateExpression(template: string): TemplateValidationResult {
  const segments = parseTemplateSegments(template)
  const errors: TemplateValidationError[] = []

  segments.forEach((segment) => {
    if (segment.type !== "expression") {
      return
    }

    const openingOffset = segment.start + 2
    if (segment.closed === false) {
      errors.push({
        message: "Missing closing braces for expression.",
        start: segment.start,
        end: segment.end,
      })
      return
    }

    const rawExpression = segment.value
    const expression = rawExpression.trim()
    if (!expression) {
      errors.push({
        message: "Expression cannot be empty.",
        start: segment.start,
        end: segment.end,
      })
      return
    }

    const leadingWhitespace = rawExpression.length - rawExpression.trimStart().length

    try {
      const astNode = parseExpressionAt(expression, 0, { ecmaVersion: "latest" })
      if (astNode.end !== expression.length) {
        errors.push({
          message: "Expression has unexpected trailing tokens.",
          start: openingOffset + leadingWhitespace + astNode.end,
          end: segment.end - 2,
        })
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Invalid expression."
      const parsedError = error as { pos?: number }
      const errorPos = typeof parsedError.pos === "number" ? parsedError.pos : 0
      errors.push({
        message,
        start: openingOffset + leadingWhitespace + errorPos,
        end: segment.end - 2,
      })
    }
  })

  return {
    segments,
    errors,
    valid: errors.length === 0,
  }
}

export function buildExpressionInsertion(expressionValue: string): string {
  return `{{ ${expressionValue} }}`
}
