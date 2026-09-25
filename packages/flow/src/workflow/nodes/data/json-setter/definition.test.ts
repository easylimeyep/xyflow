import { describe, expect, it } from "vitest"

import { builtinBaseDefinitions } from "../../../node-registry/builtin-base-definitions"
import { createWorkflowNode } from "../../../node-registry/node-factory"
import {
  decodeNodeConfig,
  normalizeNodeConfig,
} from "../../../node-registry/node-config-normalization"
import { createNodeRegistry } from "../../../node-registry/registry"
import { jsonSetter } from "./definition"

const registry = createNodeRegistry(builtinBaseDefinitions)

const setterConfig = {
  variableName: "email",
  variableType: "value",
  valueExpression: "{{ email }}",
  clear: false,
}

describe("jsonSetter definition", () => {
  it("creates a JSON Setter with Setter defaults plus appendInput off", () => {
    const node = createWorkflowNode(registry, "jsonSetter", { x: 0, y: 0 })

    expect(node.type).toBe("jsonSetter")
    expect(node.data.label).toBe("JSON Setter")
    expect(node.data.config).toEqual({
      variableName: "",
      variableType: "value",
      valueExpression: "",
      clear: false,
      appendInput: false,
    })
  })

  it("normalizes a config without appendInput to false", () => {
    expect(
      normalizeNodeConfig(registry, "jsonSetter", setterConfig).appendInput
    ).toBe(false)
  })

  it("accepts a boolean appendInput", () => {
    expect(
      decodeNodeConfig(registry, "jsonSetter", {
        ...setterConfig,
        appendInput: true,
      }).success
    ).toBe(true)
  })

  it("rejects a non-boolean appendInput", () => {
    expect(
      decodeNodeConfig(registry, "jsonSetter", {
        ...setterConfig,
        appendInput: "yes",
      }).success
    ).toBe(false)
    expect(jsonSetter.validateConfigValue?.("appendInput", 1)).toBe(false)
  })

  it("rejects invalid Setter-equivalent config", () => {
    expect(jsonSetter.validateConfigValue?.("variableType", "string")).toBe(
      false
    )
    expect(jsonSetter.validateConfigValue?.("clear", "no")).toBe(false)
  })

  it("keeps appendInput off the plain Setter", () => {
    const setter = registry.get("setVariable")!

    expect(setter.buildDefaultConfig()).not.toHaveProperty("appendInput")
    expect(setter.validateConfigValue?.("appendInput", true)).toBe(false)
    expect(
      decodeNodeConfig(registry, "setVariable", {
        ...setterConfig,
        appendInput: true,
      }).success
    ).toBe(false)
  })

  it("declares its variable like the Setter", () => {
    const source = {
      id: "json-setter-1",
      label: "JSON Setter",
      config: { ...setterConfig, variableType: "array", appendInput: true },
    }

    expect(jsonSetter.variable?.(source)).toEqual({
      name: "email",
      type: "array",
    })
    expect(
      jsonSetter.variable?.({
        ...source,
        config: { ...source.config, variableName: "not valid" },
      })
    ).toBeNull()
    expect(jsonSetter.renameConfigKey).toBe("variableName")
    expect(jsonSetter.extraExpressionConfigKeys).toEqual(["valueExpression"])
  })
})
