var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// src/v2/rpc.ts
import { Rpc } from "@opencode/schema/rpc";
var DiscoveryRpcDefinition = Rpc.define({
  id: "opencode.models-discovery",
  methods: {
    status: {
      input: {
        type: "object",
        properties: {
          providerID: { type: "string" },
          details: { type: "boolean" },
          rawCache: { type: "boolean" }
        }
      },
      output: {
        type: "object",
        properties: {
          report: { type: "string" },
          providers: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                name: { type: "string" },
                modelCount: { type: "number" },
                models: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      id: { type: "string" },
                      name: { type: "string" },
                      detail: { type: "string" },
                      override: { type: "object" },
                      defaultValues: { type: "object" }
                    },
                    required: ["id", "name", "detail"]
                  }
                }
              },
              required: ["id", "name", "modelCount", "models"]
            }
          }
        },
        required: ["report", "providers"]
      }
    },
    refresh: {
      input: {
        type: "object",
        properties: {
          force: { type: "boolean" }
        }
      },
      output: {
        type: "object",
        properties: {
          providers: { type: "number" },
          models: { type: "number" }
        },
        required: ["providers", "models"]
      }
    },
    cacheInspect: {
      input: {
        type: "object",
        properties: {
          providerID: { type: "string" }
        }
      },
      output: {
        type: "object",
        properties: {
          entries: {
            type: "array",
            items: {
              type: "object",
              properties: {
                providerID: { type: "string" },
                status: { type: "string" },
                fetchedAt: { type: "string" },
                ttlSeconds: { type: "number" },
                modelCount: { type: "number" }
              },
              required: ["providerID", "status"]
            }
          }
        },
        required: ["entries"]
      }
    },
    cacheClear: {
      input: {
        type: "object",
        properties: {
          providerID: { type: "string" }
        }
      },
      output: {
        type: "object",
        properties: {
          cleared: { type: "number" }
        },
        required: ["cleared"]
      }
    },
    overrideList: {
      input: {
        type: "object",
        properties: {
          providerID: { type: "string" }
        }
      },
      output: {
        type: "object",
        properties: {
          overrides: {
            type: "array",
            items: {
              type: "object",
              properties: {
                providerID: { type: "string" },
                modelID: { type: "string" },
                patch: { type: "object" },
                enabled: { type: "boolean" },
                updatedAt: { type: "string" }
              },
              required: ["providerID", "modelID", "patch", "enabled", "updatedAt"]
            }
          }
        },
        required: ["overrides"]
      }
    },
    overrideSet: {
      input: {
        type: "object",
        properties: {
          providerID: { type: "string" },
          modelID: { type: "string" },
          patch: { type: "object" },
          enabled: { type: "boolean" }
        },
        required: ["providerID", "modelID", "patch"]
      },
      output: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          override: {
            type: "object",
            properties: {
              providerID: { type: "string" },
              modelID: { type: "string" },
              patch: { type: "object" },
              enabled: { type: "boolean" },
              updatedAt: { type: "string" }
            },
            required: ["providerID", "modelID", "patch", "enabled", "updatedAt"]
          }
        },
        required: ["success"]
      }
    },
    overrideDelete: {
      input: {
        type: "object",
        properties: {
          providerID: { type: "string" },
          modelID: { type: "string" }
        },
        required: ["providerID", "modelID"]
      },
      output: {
        type: "object",
        properties: {
          success: { type: "boolean" }
        },
        required: ["success"]
      }
    }
  },
  events: {}
});

// src/tui.ts
function defineTuiPlugin(plugin) {
  return plugin;
}
__name(defineTuiPlugin, "defineTuiPlugin");
function formatError(error) {
  return error instanceof Error ? error.message : typeof error === "object" && error !== null ? error.message ?? JSON.stringify(error) : String(error);
}
__name(formatError, "formatError");
async function editModelOverride(context, providerID, modelID, existing, defaults) {
  const current = existing?.patch;
  const hasOverride = /* @__PURE__ */ __name((field2) => {
    if (field2.startsWith("limit.")) {
      const key = field2.slice("limit.".length);
      return Object.prototype.hasOwnProperty.call(current?.limit ?? {}, key);
    }
    if (field2.startsWith("capabilities.")) {
      const key = field2.slice("capabilities.".length);
      return Object.prototype.hasOwnProperty.call(current?.capabilities ?? {}, key);
    }
    return Object.prototype.hasOwnProperty.call(current ?? {}, field2);
  }, "hasOverride");
  const valueFor = /* @__PURE__ */ __name((field2) => {
    if (field2 === "limit.context" || field2 === "limit.output" || field2 === "limit.input") {
      const key = field2.slice("limit.".length);
      return current?.limit?.[key] ?? defaults?.limit[key];
    }
    if (field2 === "capabilities.tools") return current?.capabilities?.tools ?? defaults?.capabilities.tools;
    return current?.[field2] ?? defaults?.[field2];
  }, "valueFor");
  const displayValue = /* @__PURE__ */ __name((field2) => {
    const value2 = valueFor(field2);
    if (value2 === void 0) return "unknown";
    if (typeof value2 === "boolean") return value2 ? "on" : "off";
    return String(value2);
  }, "displayValue");
  const fieldTitle = /* @__PURE__ */ __name((title, field2) => {
    return `${title}${hasOverride(field2) ? " *" : ""} \xB7 ${displayValue(field2)}`;
  }, "fieldTitle");
  const field = await context.ui.dialog.select({
    title: "Edit model override",
    placeholder: "Choose a field",
    options: [
      { title: fieldTitle("Display name", "name"), value: "name" },
      { title: fieldTitle("Context limit", "limit.context"), value: "limit.context" },
      { title: fieldTitle("Output limit", "limit.output"), value: "limit.output" },
      { title: fieldTitle("Input limit", "limit.input"), value: "limit.input" },
      { title: fieldTitle("Reasoning support", "reasoning"), value: "reasoning" },
      { title: fieldTitle("Tool support", "capabilities.tools"), value: "capabilities.tools" },
      { title: fieldTitle("Attachment support", "attachment"), value: "attachment" }
    ]
  });
  if (!field) return;
  const currentValue = valueFor(field);
  let raw;
  if (field === "reasoning" || field === "attachment" || field === "capabilities.tools") {
    const value2 = await context.ui.dialog.select({
      title: `Set ${field}`,
      current: currentValue,
      options: [
        { title: "Enabled", value: true },
        { title: "Disabled", value: false }
      ]
    });
    if (value2 === void 0) return;
    raw = String(value2);
  } else {
    raw = await context.ui.dialog.prompt({
      title: `Set ${field}`,
      value: currentValue === void 0 ? void 0 : String(currentValue),
      placeholder: field === "name" ? "Model display name" : "Positive number"
    });
    if (raw === void 0) return;
  }
  let value = raw;
  if (field === "reasoning" || field === "attachment" || field === "capabilities.tools") value = raw === "true";
  if (field.startsWith("limit.")) {
    const numericValue = Number(raw);
    value = numericValue;
    if (!Number.isFinite(numericValue) || numericValue <= 0) {
      await context.ui.dialog.alert({ title: "Invalid override", message: "Limit must be a positive number." });
      return;
    }
  }
  const patch = existing?.patch ? structuredClone(existing.patch) : {};
  if (field.startsWith("limit.")) {
    patch.limit = { ...patch.limit, [field.slice("limit.".length)]: value };
  } else if (field.startsWith("capabilities.")) {
    patch.capabilities = { ...patch.capabilities, [field.slice("capabilities.".length)]: value };
  } else {
    patch[field] = value;
  }
  const rpc = context.client.rpc(DiscoveryRpcDefinition);
  await rpc.overrideSet({ providerID, modelID, patch, enabled: true }, { location: context.location });
  context.ui.toast.show({ title: "Models Discovery", message: "Override saved and provider reloaded.", variant: "success" });
}
__name(editModelOverride, "editModelOverride");
var tui_default = defineTuiPlugin({
  id: "opencode.models-discovery",
  setup: /* @__PURE__ */ __name(async (context) => {
    const rpc = context.client.rpc(DiscoveryRpcDefinition);
    const getLocation = /* @__PURE__ */ __name(() => context.location ?? context.data?.location?.default(), "getLocation");
    context.keymap.layer(() => ({
      mode: "global",
      priority: 10,
      commands: [
        {
          id: "models-discovery.console",
          title: "Models Discovery: Console",
          description: "Browse models and manage discovery caches",
          slash: {
            name: "models-discovery-console",
            arguments: true
          },
          palette: true,
          run: /* @__PURE__ */ __name(async (input) => {
            const raw = typeof input === "string" ? input.trim() : "";
            const providerMatch = raw.match(/(?:^|\s)(?:--provider(?:-id)?|provider(?:-id)?)(?:=|\s+)([^\s]+)/i);
            const providerID = providerMatch?.[1];
            const browseMode = /^browse(?:\s|$)/i.test(raw);
            const statusMode = /^status(?:\s|$)/i.test(raw);
            const location = getLocation();
            try {
              if (!providerID && !statusMode && !browseMode) {
                const action = await context.ui.dialog.select({
                  title: "Models Discovery Console",
                  placeholder: "Choose an operation",
                  options: [
                    {
                      title: "Browse Models",
                      value: "browse",
                      description: "Browse providers, models, and resolved model details"
                    },
                    {
                      title: "Cache Operations",
                      value: "cache",
                      description: "Inspect, refresh, or clear discovery caches"
                    }
                  ]
                });
                if (action === void 0) return;
                if (action === "cache") {
                  await context.keymap.dispatch("models-discovery.cache", "");
                  return;
                }
              }
              let result = await rpc.status(
                { details: true, ...providerID ? { providerID } : {} },
                { location }
              );
              if (result.providers.length === 0) {
                await context.ui.dialog.alert({
                  title: "Models Discovery Console",
                  message: result.report
                });
                return;
              }
              const reloadStatus = /* @__PURE__ */ __name(async () => await rpc.status(
                { details: true, ...providerID ? { providerID } : {} },
                { location }
              ), "reloadStatus");
              while (true) {
                const selected = await context.ui.dialog.select({
                  title: "Models Discovery: Providers",
                  placeholder: "Select a provider",
                  options: result.providers.map((provider2) => ({
                    title: `${provider2.id} | ${provider2.name} | ${provider2.modelCount} models`,
                    value: provider2.id
                  }))
                });
                if (selected === void 0) return;
                let provider = result.providers.find((entry) => entry.id === selected);
                if (!provider) return;
                if (provider.models.length === 0) {
                  await context.ui.dialog.alert({ title: provider.name, message: "No discovered models for this provider." });
                  continue;
                }
                while (true) {
                  const modelIndex = await context.ui.dialog.select({
                    title: `${provider.id} | ${provider.name}: Models (* = overridden)`,
                    placeholder: "Select a model to inspect (* = overridden)",
                    options: [
                      { title: "\u2190 Back to providers", value: -1 },
                      ...provider.models.map((model2, index) => ({
                        title: `${model2.id}${model2.override ? " *" : ""} | ${model2.name}`,
                        value: index
                      }))
                    ]
                  });
                  if (modelIndex === void 0) return;
                  if (modelIndex === -1) break;
                  const model = provider.models[modelIndex];
                  if (!model) return;
                  const action = await context.ui.dialog.select({
                    title: `${provider.id} / ${model.id}`,
                    placeholder: "Choose a model operation",
                    options: [
                      { title: "View details", value: "details", description: "Show resolved model metadata" },
                      { title: "Edit override", value: "edit", description: "Change supported model metadata" },
                      ...model.override ? [{ title: "Delete override", value: "delete", description: "Restore discovered metadata" }] : [],
                      { title: "\u2190 Back to models", value: "back" }
                    ]
                  });
                  if (action === void 0 || action === "details" || action === -1) {
                    await context.ui.dialog.alert({
                      title: `${provider.id} / ${model.id}`,
                      message: model.detail
                    });
                  } else if (action === "edit") {
                    await editModelOverride({ ...context, location }, provider.id, model.id, model.override, model.defaultValues);
                    result = await reloadStatus();
                    provider = result.providers.find((entry) => entry.id === selected);
                    if (!provider) return;
                    continue;
                  } else if (action === "delete" && model.override) {
                    const confirmed = await context.ui.dialog.confirm({
                      title: "Delete model override?",
                      message: `Remove the override for ${provider.id}/${model.id}?`,
                      label: { confirm: "Delete", cancel: "Cancel" }
                    });
                    if (confirmed) {
                      await rpc.overrideDelete(
                        { providerID: provider.id, modelID: model.id },
                        { location }
                      );
                      context.ui.toast.show({ title: "Models Discovery", message: "Override deleted.", variant: "success" });
                      result = await reloadStatus();
                      provider = result.providers.find((entry) => entry.id === selected);
                      if (!provider) return;
                      continue;
                    }
                  }
                }
              }
            } catch (error) {
              context.ui.toast.show({
                title: "Models Discovery",
                message: `Status lookup failed: ${formatError(error)}`,
                variant: "error"
              });
            }
          }, "run")
        },
        {
          id: "models-discovery.refresh",
          title: "Models Discovery: Refresh",
          description: "Refresh models discovered from configured providers (optional: --force)",
          slash: {
            name: "models-discovery-refresh",
            arguments: true
          },
          palette: true,
          run: /* @__PURE__ */ __name(async (input) => {
            const raw = typeof input === "string" ? input.trim().toLowerCase() : "";
            const force = raw.includes("force");
            const location = getLocation();
            try {
              const result = await rpc.refresh({ force }, { location });
              context.ui.toast.show({
                title: "Models Discovery",
                message: `Discovered ${result.models} models across ${result.providers} providers${force ? " (bypassed cache)" : ""}.`,
                variant: "success"
              });
            } catch (error) {
              context.ui.toast.show({
                title: "Models Discovery",
                message: `Refresh failed: ${formatError(error)}`,
                variant: "error"
              });
            }
          }, "run")
        },
        {
          id: "models-discovery.cache",
          title: "Models Discovery: Cache Operations (internal)",
          description: "Inspect or clear discovery cache entries",
          run: /* @__PURE__ */ __name(async (input) => {
            const raw = typeof input === "string" ? input.trim().toLowerCase() : "";
            const location = getLocation();
            try {
              let action;
              if (raw.includes("inspect") || raw === "status") {
                action = "inspect";
              } else if (raw.includes("refresh") || raw.includes("force")) {
                action = "refresh";
              } else if (raw.includes("clear-all") || raw.includes("clear") && raw.includes("all")) {
                action = "clear-all";
              } else if (raw.includes("clear")) {
                action = "clear-one";
              } else if (context.ui?.dialog) {
                action = await context.ui.dialog.select({
                  title: "Models Discovery Cache",
                  placeholder: "Choose a cache action",
                  options: [
                    {
                      title: "Inspect Cache Status",
                      value: "inspect",
                      description: "View status, TTL, and cached models across configured providers"
                    },
                    {
                      title: "Force Refresh (Bypass Cache)",
                      value: "refresh",
                      description: "Trigger discovery refresh immediately and bypass all cached models"
                    },
                    {
                      title: "Clear Provider Cache",
                      value: "clear-one",
                      description: "Select a specific provider and remove its cached discovery records"
                    },
                    {
                      title: "Clear All Discovery Caches",
                      value: "clear-all",
                      description: "Clear discovery caches for all configured providers"
                    }
                  ]
                });
              }
              if (!action) return;
              if (action === "inspect") {
                const inspect = await rpc.cacheInspect({}, { location });
                if (inspect.entries.length === 0) {
                  if (context.ui?.dialog?.alert) {
                    await context.ui.dialog.alert({
                      title: "Discovery Cache Status",
                      message: "No configured discovery providers found."
                    });
                  } else {
                    context.ui.toast.show({
                      title: "Discovery Cache Status",
                      message: "No configured discovery providers found.",
                      variant: "info"
                    });
                  }
                  return;
                }
                const summary = inspect.entries.map((entry) => {
                  const parts = [
                    `Provider: ${entry.providerID}`,
                    `Status: ${entry.status}`,
                    entry.modelCount !== void 0 ? `Models: ${entry.modelCount}` : void 0,
                    entry.ttlSeconds !== void 0 ? `TTL: ${entry.ttlSeconds}s` : void 0,
                    entry.fetchedAt ? `Fetched: ${entry.fetchedAt}` : void 0
                  ].filter(Boolean);
                  return parts.join(" | ");
                }).join("\n");
                if (context.ui?.dialog?.alert) {
                  await context.ui.dialog.alert({
                    title: "Discovery Cache Status",
                    message: summary
                  });
                } else {
                  context.ui.toast.show({
                    title: "Discovery Cache Status",
                    message: summary,
                    variant: "info"
                  });
                }
              } else if (action === "refresh") {
                const result = await rpc.refresh({ force: true }, { location });
                context.ui.toast.show({
                  title: "Models Discovery",
                  message: `Discovered ${result.models} models across ${result.providers} providers (bypassed cache).`,
                  variant: "success"
                });
              } else if (action === "clear-one") {
                const inspect = await rpc.cacheInspect({}, { location });
                if (inspect.entries.length === 0) {
                  context.ui.toast.show({
                    title: "Models Discovery",
                    message: "No discovery providers available to clear.",
                    variant: "info"
                  });
                  return;
                }
                let selectedProvider;
                if (context.ui?.dialog?.select) {
                  selectedProvider = await context.ui.dialog.select({
                    title: "Clear Provider Cache",
                    placeholder: "Select provider to clear",
                    options: inspect.entries.map((e) => ({
                      title: e.providerID,
                      value: e.providerID,
                      description: `Status: ${e.status}${e.modelCount !== void 0 ? ` (${e.modelCount} models)` : ""}`
                    }))
                  });
                } else {
                  selectedProvider = inspect.entries[0]?.providerID;
                }
                if (!selectedProvider) return;
                if (context.ui?.dialog?.confirm) {
                  const confirmed = await context.ui.dialog.confirm({
                    title: "Clear Provider Cache",
                    message: `Are you sure you want to clear the discovery cache for provider "${selectedProvider}"?`,
                    label: { confirm: "Clear", cancel: "Cancel" }
                  });
                  if (!confirmed) return;
                }
                await rpc.cacheClear({ providerID: selectedProvider }, { location });
                context.ui.toast.show({
                  title: "Models Discovery",
                  message: `Cleared discovery cache for provider "${selectedProvider}".`,
                  variant: "success"
                });
              } else if (action === "clear-all") {
                if (context.ui?.dialog?.confirm) {
                  const confirmed = await context.ui.dialog.confirm({
                    title: "Clear All Discovery Caches",
                    message: "Are you sure you want to clear discovery caches for all configured providers?",
                    label: { confirm: "Clear All", cancel: "Cancel" }
                  });
                  if (!confirmed) return;
                }
                const result = await rpc.cacheClear({}, { location });
                context.ui.toast.show({
                  title: "Models Discovery",
                  message: `Cleared all discovery caches (${result.cleared} providers cleared).`,
                  variant: "success"
                });
              }
            } catch (error) {
              context.ui.toast.show({
                title: "Models Discovery",
                message: `Cache operation failed: ${formatError(error)}`,
                variant: "error"
              });
            }
          }, "run")
        }
      ]
    }));
  }, "setup")
});
export {
  tui_default as default,
  defineTuiPlugin
};
//# sourceMappingURL=tui.js.map
