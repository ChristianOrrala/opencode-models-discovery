var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// src/runtime.ts
import { Plugin as Plugin2 } from "@opencode/plugin";

// src/ui/toast-notifier.ts
var ToastNotifier = class {
  static {
    __name(this, "ToastNotifier");
  }
  client;
  // OpenCode client
  constructor(client) {
    this.client = client;
  }
  // Show success toast
  async success(message, title, duration) {
    try {
      if (!this.client?.tui?.showToast) {
        console.warn("[opencode-models-discovery] Toast API not available (client.tui.showToast missing)");
        return;
      }
      await this.client.tui.showToast({
        body: {
          title,
          message,
          variant: "success",
          duration: duration || 3e3
        }
      });
    } catch (error) {
      console.error(`[opencode-models-discovery] Failed to show success toast`, error);
    }
  }
  // Show error toast
  async error(message, title, duration) {
    try {
      if (!this.client?.tui?.showToast) {
        console.warn("[opencode-models-discovery] Toast API not available (client.tui.showToast missing)");
        return;
      }
      await this.client.tui.showToast({
        body: {
          title,
          message,
          variant: "error",
          duration: duration || 5e3
        }
      });
    } catch (error) {
      console.error(`[opencode-models-discovery] Failed to show error toast`, error);
    }
  }
  // Show warning toast
  async warning(message, title, duration) {
    try {
      if (!this.client?.tui?.showToast) {
        console.warn("[opencode-models-discovery] Toast API not available (client.tui.showToast missing)");
        return;
      }
      await this.client.tui.showToast({
        body: {
          title,
          message,
          variant: "warning",
          duration: duration || 4e3
        }
      });
    } catch (error) {
      console.error(`[opencode-models-discovery] Failed to show warning toast`, error);
    }
  }
  // Show info toast
  async info(message, title, duration) {
    try {
      if (!this.client?.tui?.showToast) {
        console.warn("[opencode-models-discovery] Toast API not available (client.tui.showToast missing)");
        return;
      }
      await this.client.tui.showToast({
        body: {
          title,
          message,
          variant: "info",
          duration: duration || 3e3
        }
      });
    } catch (error) {
      console.error(`[opencode-models-discovery] Failed to show info toast`, error);
    }
  }
  // Show loading toast with progress
  async progress(message, title, progress) {
    try {
      if (!this.client?.tui?.showToast) {
        console.warn("[opencode-models-discovery] Toast API not available (client.tui.showToast missing)");
        return;
      }
      await this.client.tui.showToast({
        body: {
          title,
          message: progress !== void 0 ? `${message} (${progress}%)` : message,
          variant: "info",
          duration: progress !== void 0 ? 0 : 2e3
          // No auto-dismiss if showing progress
        }
      });
    } catch (error) {
      console.error(`[opencode-models-discovery] Failed to show progress toast`, error);
    }
  }
  // Show detailed toast with actions
  async detailed(options) {
    try {
      if (!this.client?.tui?.showToast) {
        console.warn("[opencode-models-discovery] Toast API not available (client.tui.showToast missing)");
        return;
      }
      await this.client.tui.showToast({
        body: {
          title: options.title,
          message: options.message,
          variant: options.variant || "info",
          duration: options.duration
        }
      });
    } catch (error) {
      console.error(`[opencode-models-discovery] Failed to show detailed toast`, error);
    }
  }
};

// src/utils/openai-compatible-api.ts
import http from "node:http";
import https from "node:https";

// src/core/model-types.ts
var DEFAULT_OUTPUT_TOKEN_LIMIT = 32e3;
var DEFAULT_CONTEXT_TOKEN_LIMIT = 2e5;
function createModelLimits(context, explicitOutput, input) {
  if (typeof context !== "number" || !Number.isFinite(context) || context <= 0) return void 0;
  const output = typeof explicitOutput === "number" && Number.isFinite(explicitOutput) && explicitOutput > 0 ? Math.min(explicitOutput, context) : Math.min(context, DEFAULT_OUTPUT_TOKEN_LIMIT);
  return {
    context,
    output,
    ...typeof input === "number" && Number.isFinite(input) && input > 0 ? { input } : {}
  };
}
__name(createModelLimits, "createModelLimits");
function normalizeDiscoveredRawModel(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return void 0;
  const candidate = value;
  if (typeof candidate.id !== "string" || candidate.id.trim().length === 0) return void 0;
  return candidate;
}
__name(normalizeDiscoveredRawModel, "normalizeDiscoveredRawModel");
function isDiscoveredRawModel(value) {
  return normalizeDiscoveredRawModel(value) !== void 0;
}
__name(isDiscoveredRawModel, "isDiscoveredRawModel");

// src/utils/openai-compatible-api.ts
var OPENAI_COMPATIBLE_MODELS_ENDPOINT = "/v1/models";
var DEFAULT_REQUEST_TIMEOUT_MS = 3e3;
var REQUEST_USER_AGENT = "opencode-models-discovery";
function normalizeProviderOriginForCache(baseURL) {
  return new URL(baseURL).origin;
}
__name(normalizeProviderOriginForCache, "normalizeProviderOriginForCache");
function buildAPIURL(baseURL, endpoint = OPENAI_COMPATIBLE_MODELS_ENDPOINT) {
  return new URL(endpoint, new URL(baseURL).origin).toString();
}
__name(buildAPIURL, "buildAPIURL");
function requestJson(urlStr, headers, timeoutMs = DEFAULT_REQUEST_TIMEOUT_MS) {
  return new Promise((resolve) => {
    let settled = false;
    const finish = /* @__PURE__ */ __name((data) => {
      if (!settled) {
        settled = true;
        resolve(data);
      }
    }, "finish");
    const urlObj = new URL(urlStr);
    const mod = urlObj.protocol === "https:" ? https : http;
    const req = mod.get(urlObj, {
      headers: { "User-Agent": REQUEST_USER_AGENT, ...headers },
      timeout: timeoutMs
    }, (res) => {
      let data = "";
      res.setEncoding("utf8");
      res.on("data", (chunk) => data += chunk);
      res.on("end", () => {
        if (!res.statusCode || res.statusCode < 200 || res.statusCode >= 300) {
          finish(void 0);
          return;
        }
        try {
          finish(JSON.parse(data));
        } catch {
          finish(void 0);
        }
      });
      res.on("error", () => finish(void 0));
    });
    req.on("error", () => finish(void 0));
    req.on("timeout", () => {
      req.destroy();
      finish(void 0);
    });
  });
}
__name(requestJson, "requestJson");
async function discoverModelsFromProvider(baseURL, apiKey, endpoint = OPENAI_COMPATIBLE_MODELS_ENDPOINT, timeoutMs = DEFAULT_REQUEST_TIMEOUT_MS) {
  const url = buildAPIURL(baseURL, endpoint);
  const headers = {
    "Content-Type": "application/json"
  };
  if (apiKey) {
    headers["Authorization"] = `Bearer ${apiKey}`;
  }
  const data = await requestJson(url, headers, timeoutMs);
  return data ? { ok: true, models: data.data ?? [] } : { ok: false, models: [] };
}
__name(discoverModelsFromProvider, "discoverModelsFromProvider");
function isOpenAICompatibleProvider(provider) {
  return provider && typeof provider === "object" && provider.npm === "@ai-sdk/openai-compatible";
}
__name(isOpenAICompatibleProvider, "isOpenAICompatibleProvider");
function hasOpenAICompatibleURL(provider) {
  if (!provider || typeof provider !== "object") return false;
  const baseURL = provider.options?.baseURL || "";
  return /\/v1(\/|$)/.test(baseURL);
}
__name(hasOpenAICompatibleURL, "hasOpenAICompatibleURL");
function hasModelsDiscoveryEndpoint(provider) {
  if (!provider || typeof provider !== "object") return false;
  const endpoint = provider.options?.modelsDiscovery?.endpoint;
  return typeof endpoint === "string" && endpoint.length > 0;
}
__name(hasModelsDiscoveryEndpoint, "hasModelsDiscoveryEndpoint");
function canDiscoverModels(provider) {
  return isOpenAICompatibleProvider(provider) || hasOpenAICompatibleURL(provider) || hasModelsDiscoveryEndpoint(provider);
}
__name(canDiscoverModels, "canDiscoverModels");

// src/utils/validation/validate-config.ts
function validateConfig(config) {
  const errors = [];
  const warnings = [];
  if (!config || typeof config !== "object") {
    errors.push("Config must be an object");
    return { isValid: false, errors, warnings };
  }
  if (config.provider && typeof config.provider === "object") {
    for (const [providerName, providerConfig] of Object.entries(config.provider)) {
      const p = providerConfig;
      const forceDiscoveryEnabled = p.options?.modelsDiscovery?.enabled === true;
      const discoveryConfig = p.options?.modelsDiscovery;
      const discoveryModels = p.options?.modelsDiscovery?.models;
      if (forceDiscoveryEnabled || canDiscoverModels(p)) {
        if (!p.options?.baseURL) {
          warnings.push(`Provider '${providerName}' missing baseURL`);
        }
        if (p.models && typeof p.models !== "object") {
          errors.push(`Provider '${providerName}' models must be an object`);
        }
      }
      if (discoveryModels && typeof discoveryModels === "object") {
        validateModelFieldFilters(providerName, "includeBy", discoveryModels.includeBy, errors);
        validateModelFieldFilters(providerName, "excludeBy", discoveryModels.excludeBy, errors);
      }
      if (discoveryConfig && typeof discoveryConfig === "object") {
        warnMisplacedModelFieldFilters(providerName, discoveryConfig, warnings);
        validateDiscoveryEndpoint(providerName, discoveryConfig.endpoint, errors);
        validateTimeoutMs(providerName, discoveryConfig.timeoutMs, errors);
        validateCache(providerName, discoveryConfig.cache, errors);
      }
    }
  }
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}
__name(validateConfig, "validateConfig");
function validateDiscoveryEndpoint(providerName, value, errors) {
  if (value === void 0) {
    return;
  }
  if (typeof value !== "string" || !value.startsWith("/")) {
    errors.push(`Provider '${providerName}' modelsDiscovery.endpoint must be an origin-relative path starting with /`);
  }
}
__name(validateDiscoveryEndpoint, "validateDiscoveryEndpoint");
function validateTimeoutMs(providerName, value, errors) {
  if (value === void 0) {
    return;
  }
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    errors.push(`Provider '${providerName}' modelsDiscovery.timeoutMs must be a positive finite number`);
  }
}
__name(validateTimeoutMs, "validateTimeoutMs");
function validateCache(providerName, value, errors) {
  if (value === void 0) {
    return;
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    errors.push(`Provider '${providerName}' modelsDiscovery.cache must be an object`);
    return;
  }
  const cache = value;
  if (cache.enabled !== void 0 && typeof cache.enabled !== "boolean") {
    errors.push(`Provider '${providerName}' modelsDiscovery.cache.enabled must be a boolean`);
  }
  if (cache.ttlSeconds !== void 0 && (typeof cache.ttlSeconds !== "number" || !Number.isFinite(cache.ttlSeconds) || cache.ttlSeconds < 0)) {
    errors.push(`Provider '${providerName}' modelsDiscovery.cache.ttlSeconds must be a non-negative finite number`);
  }
}
__name(validateCache, "validateCache");
function warnMisplacedModelFieldFilters(providerName, discoveryConfig, warnings) {
  for (const key2 of ["includeBy", "excludeBy"]) {
    if (Object.prototype.hasOwnProperty.call(discoveryConfig, key2)) {
      warnings.push(`Provider '${providerName}' modelsDiscovery.${key2} is ignored; use modelsDiscovery.models.${key2} instead`);
    }
  }
}
__name(warnMisplacedModelFieldFilters, "warnMisplacedModelFieldFilters");
function validateModelFieldFilters(providerName, key2, value, errors) {
  if (value === void 0) {
    return;
  }
  if (!Array.isArray(value)) {
    errors.push(`Provider '${providerName}' modelsDiscovery.models.${key2} must be an array`);
    return;
  }
  value.forEach((rule, index) => {
    if (!rule || typeof rule !== "object" || Array.isArray(rule)) {
      errors.push(`Provider '${providerName}' modelsDiscovery.models.${key2}[${index}] must be an object`);
      return;
    }
    const field = rule.field;
    const hasEquals = Object.prototype.hasOwnProperty.call(rule, "equals");
    const hasMatch = Object.prototype.hasOwnProperty.call(rule, "match");
    const equals = rule.equals;
    const match = rule.match;
    if (typeof field !== "string" || field.length === 0) {
      errors.push(`Provider '${providerName}' modelsDiscovery.models.${key2}[${index}].field must be a non-empty string`);
    }
    if (hasEquals === hasMatch) {
      errors.push(`Provider '${providerName}' modelsDiscovery.models.${key2}[${index}] must include exactly one of equals or match`);
      return;
    }
    if (hasEquals && !(equals === null || ["string", "number", "boolean"].includes(typeof equals))) {
      errors.push(`Provider '${providerName}' modelsDiscovery.models.${key2}[${index}].equals must be a string, number, boolean, or null`);
    }
    if (hasMatch && typeof match !== "string") {
      errors.push(`Provider '${providerName}' modelsDiscovery.models.${key2}[${index}].match must be a string`);
    }
  });
}
__name(validateModelFieldFilters, "validateModelFieldFilters");

// src/utils/validation/validate-hook-input.ts
function validateHookInput(hookName, input) {
  const errors = [];
  const warnings = [];
  if (!input || typeof input !== "object") {
    errors.push(`${hookName}: Input must be an object`);
    return { isValid: false, errors, warnings };
  }
  switch (hookName) {
    case "config":
      break;
    case "event":
      if (!input.event || typeof input.event !== "object") {
        errors.push("event: event is required and must be an object");
      } else if (!input.event.type) {
        warnings.push("event: event.type is missing");
      }
      break;
  }
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}
__name(validateHookInput, "validateHookInput");

// src/plugin/enhance-config.ts
import { promises as fs2 } from "node:fs";
import path2 from "node:path";
import { xdgData as xdgData2 } from "xdg-basedir";

// src/types/plugin-config.ts
var ModelInfoFormat = /* @__PURE__ */ ((ModelInfoFormat2) => {
  ModelInfoFormat2["Bifrost"] = "bifrost";
  ModelInfoFormat2["LiteLLM"] = "litellm";
  ModelInfoFormat2["ModelsDev"] = "models.dev";
  ModelInfoFormat2["AIProxy"] = "aiproxy";
  ModelInfoFormat2["VLLM"] = "vllm";
  ModelInfoFormat2["LMStudio"] = "lmstudio";
  ModelInfoFormat2["LlamaSwap"] = "llama-swap";
  ModelInfoFormat2["OmniRoute"] = "omniroute";
  ModelInfoFormat2["OpenRouter"] = "openrouter";
  ModelInfoFormat2["Ollama"] = "ollama";
  return ModelInfoFormat2;
})(ModelInfoFormat || {});
var DEFAULT_CACHE_TTL_SECONDS = 86400;
var DEFAULT_DISCOVERY_CONFIG = {
  enabled: true
};
function getDefaultDiscoveryConfigFromEnv(logger) {
  const rawValue = process.env.OPENCODE_MODELS_DISCOVERY_DEFAULT_ENABLED;
  if (rawValue === void 0) {
    return DEFAULT_DISCOVERY_CONFIG;
  }
  const normalizedValue = rawValue.trim().toLowerCase();
  if (["true", "1", "yes", "on"].includes(normalizedValue)) {
    return { enabled: true };
  }
  if (["false", "0", "no", "off"].includes(normalizedValue)) {
    return { enabled: false };
  }
  if (logger) {
    logger.warn("Ignoring invalid OPENCODE_MODELS_DISCOVERY_DEFAULT_ENABLED value", {
      value: rawValue,
      fallback: DEFAULT_DISCOVERY_CONFIG.enabled
    });
  } else {
    console.warn(`[opencode-models-discovery] Ignoring invalid OPENCODE_MODELS_DISCOVERY_DEFAULT_ENABLED value: ${rawValue}`);
  }
  return DEFAULT_DISCOVERY_CONFIG;
}
__name(getDefaultDiscoveryConfigFromEnv, "getDefaultDiscoveryConfigFromEnv");
function hasLegacyGlobalDiscoveryConfig(config) {
  return config.discovery !== void 0 || config.providers !== void 0 || config.models !== void 0 || config.smartModelName !== void 0;
}
__name(hasLegacyGlobalDiscoveryConfig, "hasLegacyGlobalDiscoveryConfig");
function shouldDiscoverProviderWithOverride(defaultEnabled, providerConfig) {
  if (providerConfig.enabled === true) {
    return true;
  }
  if (providerConfig.enabled === false) {
    return false;
  }
  return defaultEnabled;
}
__name(shouldDiscoverProviderWithOverride, "shouldDiscoverProviderWithOverride");
function toRegExp(pattern, logger) {
  try {
    return new RegExp(pattern);
  } catch {
    if (logger) {
      logger.warn("Ignoring invalid model regex", { category: "filtering", pattern });
    } else {
      console.warn(`[opencode-models-discovery] Ignoring invalid model regex: ${pattern}`);
    }
    return null;
  }
}
__name(toRegExp, "toRegExp");
function getProviderModelRegexFilter(config, logger) {
  return {
    includeRegex: (config.models?.includeRegex || []).map((pattern) => toRegExp(pattern, logger)).filter((pattern) => pattern !== null),
    excludeRegex: (config.models?.excludeRegex || []).map((pattern) => toRegExp(pattern, logger)).filter((pattern) => pattern !== null)
  };
}
__name(getProviderModelRegexFilter, "getProviderModelRegexFilter");
function toModelFieldFilter(filter, logger) {
  if ("match" in filter) {
    try {
      return {
        field: filter.field,
        match: new RegExp(filter.match)
      };
    } catch {
      if (logger) {
        logger.warn("Ignoring invalid model field regex", { category: "filtering", field: filter.field, pattern: filter.match });
      } else {
        console.warn(`[opencode-models-discovery] Ignoring invalid model field regex for ${filter.field}: ${filter.match}`);
      }
      return null;
    }
  }
  return filter;
}
__name(toModelFieldFilter, "toModelFieldFilter");
function getProviderModelFieldFilters(config, logger) {
  return {
    includeBy: (config.models?.includeBy || []).map((filter) => toModelFieldFilter(filter, logger)).filter((filter) => filter !== null),
    excludeBy: (config.models?.excludeBy || []).map((filter) => toModelFieldFilter(filter, logger)).filter((filter) => filter !== null)
  };
}
__name(getProviderModelFieldFilters, "getProviderModelFieldFilters");
function parsePluginConfig(rawConfig) {
  if (!rawConfig) {
    return {};
  }
  if (Array.isArray(rawConfig)) {
    if (rawConfig.length >= 2 && typeof rawConfig[0] === "string") {
      const configObj = rawConfig[1];
      if (configObj && typeof configObj === "object") {
        return configObj;
      }
    }
    return {};
  }
  if (typeof rawConfig === "object") {
    return rawConfig;
  }
  return {};
}
__name(parsePluginConfig, "parsePluginConfig");

// src/plugin/provider-model-store.ts
import { promises as fs } from "node:fs";
import path from "node:path";
import { xdgData } from "xdg-basedir";

// src/core/discovery-cache.ts
function discoveryCacheKey(namespace, providerID) {
  return `${namespace}:provider:${encodeURIComponent(providerID)}`;
}
__name(discoveryCacheKey, "discoveryCacheKey");
function isDiscoveryCacheFresh(fetchedAt, ttlSeconds, now = Date.now()) {
  const timestamp = Date.parse(fetchedAt);
  return Number.isFinite(timestamp) && timestamp + ttlSeconds * 1e3 > now;
}
__name(isDiscoveryCacheFresh, "isDiscoveryCacheFresh");
function sameOptional(left, right) {
  return left === right;
}
__name(sameOptional, "sameOptional");
function parseDiscoveryCacheEntry(value, identity, ttlSeconds, now = Date.now()) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return void 0;
  const entry = value;
  if (entry.version !== 1 || !entry.identity || typeof entry.fetchedAt !== "string") return void 0;
  if (entry.identity.providerID !== identity.providerID || entry.identity.baseURL !== identity.baseURL || entry.identity.endpoint !== identity.endpoint || !sameOptional(entry.identity.modelInfoFormat, identity.modelInfoFormat) || !sameOptional(entry.identity.modelInfoEndpoint, identity.modelInfoEndpoint) || !isDiscoveryCacheFresh(entry.fetchedAt, ttlSeconds, now) || !Array.isArray(entry.rawModels) || !entry.enrichments || typeof entry.enrichments !== "object" || Array.isArray(entry.enrichments)) {
    return void 0;
  }
  return entry;
}
__name(parseDiscoveryCacheEntry, "parseDiscoveryCacheEntry");
function createDiscoveryCacheEntry(identity, rawModels, enrichments, fetchedAt = (/* @__PURE__ */ new Date()).toISOString()) {
  return {
    version: 1,
    identity,
    fetchedAt,
    rawModels: sanitizeSensitiveFields(rawModels),
    enrichments: sanitizeSensitiveFields(enrichments)
  };
}
__name(createDiscoveryCacheEntry, "createDiscoveryCacheEntry");
function sanitizeSensitiveFields(value) {
  if (Array.isArray(value)) {
    return value.map(sanitizeSensitiveFields);
  }
  if (!value || typeof value !== "object") {
    return value;
  }
  const cleaned = {};
  for (const [key2, child] of Object.entries(value)) {
    if (/^(api[-_]?key|authorization|token|password|secret|credentials?)$/i.test(key2)) {
      continue;
    }
    cleaned[key2] = sanitizeSensitiveFields(child);
  }
  return cleaned;
}
__name(sanitizeSensitiveFields, "sanitizeSensitiveFields");
async function readDiscoveryCache(backend, key2, identity, ttlSeconds) {
  try {
    return parseDiscoveryCacheEntry(await backend.get(key2), identity, ttlSeconds);
  } catch {
    return void 0;
  }
}
__name(readDiscoveryCache, "readDiscoveryCache");
async function writeDiscoveryCache(backend, key2, entry) {
  try {
    await backend.set(key2, entry);
    return true;
  } catch {
    return false;
  }
}
__name(writeDiscoveryCache, "writeDiscoveryCache");

// src/plugin/provider-model-store.ts
var STATE_VERSION = 2;
var PLUGIN_DATA_DIRECTORY = "opencode-models-discovery";
var PROVIDERS_DIRECTORY = "providers";
function isPlainObject(value) {
  return !!value && typeof value === "object" && !Array.isArray(value);
}
__name(isPlainObject, "isPlainObject");
function hasSameIdentity(actual, expected) {
  return actual.id === expected.id && actual.baseURL === expected.baseURL && actual.endpoint === expected.endpoint;
}
__name(hasSameIdentity, "hasSameIdentity");
function isIdentity(value) {
  return isPlainObject(value) && typeof value.id === "string" && typeof value.baseURL === "string" && typeof value.endpoint === "string";
}
__name(isIdentity, "isIdentity");
function isOverrides(value) {
  return isPlainObject(value) && Object.entries(value).every(([modelID, override]) => modelID.length > 0 && isPlainObject(override));
}
__name(isOverrides, "isOverrides");
function isProviderModelState(value) {
  if (!isPlainObject(value) || value.version !== STATE_VERSION || !isIdentity(value.provider) || typeof value.fetchedAt !== "string" || !Number.isFinite(Date.parse(value.fetchedAt)) || !isPlainObject(value.models) || !Object.entries(value.models).every(([modelID, model]) => modelID.length > 0 && isDiscoveredRawModel(model) && model.id === modelID)) {
    return false;
  }
  return (value.rawModels === void 0 || isPlainObject(value.rawModels) && Object.entries(value.rawModels).every(
    ([modelID, model]) => modelID.length > 0 && isDiscoveredRawModel(model) && model.id === modelID
  )) && (value.overrides === void 0 || isOverrides(value.overrides));
}
__name(isProviderModelState, "isProviderModelState");
function sanitizeModels(models) {
  return Object.fromEntries(Object.entries(models).map(([modelID, model]) => [
    modelID,
    sanitizeSensitiveFields(model)
  ]));
}
__name(sanitizeModels, "sanitizeModels");
function getProviderStateFileName(providerID) {
  return `provider-${encodeURIComponent(providerID)}.json`;
}
__name(getProviderStateFileName, "getProviderStateFileName");
function isInventoryFresh(state, ttlSeconds, now = Date.now()) {
  return Date.parse(state.fetchedAt) + ttlSeconds * 1e3 > now;
}
__name(isInventoryFresh, "isInventoryFresh");
var ProviderModelStore = class {
  static {
    __name(this, "ProviderModelStore");
  }
  providersDirectory;
  constructor(rootDirectory = xdgData) {
    this.providersDirectory = rootDirectory ? path.join(rootDirectory, PLUGIN_DATA_DIRECTORY, PROVIDERS_DIRECTORY) : void 0;
  }
  getStatePath(providerID) {
    return this.providersDirectory ? path.join(this.providersDirectory, getProviderStateFileName(providerID)) : void 0;
  }
  async read(identity) {
    const statePath = this.getStatePath(identity.id);
    if (!statePath) {
      return void 0;
    }
    try {
      const state = JSON.parse(await fs.readFile(statePath, "utf8"));
      return isProviderModelState(state) && hasSameIdentity(state.provider, identity) ? state : void 0;
    } catch {
      return void 0;
    }
  }
  async saveModels(identity, models, previousState, rawModels) {
    const statePath = this.getStatePath(identity.id);
    if (!statePath) {
      return false;
    }
    const state = {
      version: STATE_VERSION,
      provider: identity,
      fetchedAt: (/* @__PURE__ */ new Date()).toISOString(),
      models: sanitizeModels(models),
      ...rawModels ? { rawModels: sanitizeModels(rawModels) } : {},
      ...previousState?.overrides && Object.keys(previousState.overrides).length > 0 ? { overrides: previousState.overrides } : {}
    };
    const temporaryPath = path.join(path.dirname(statePath), `.${path.basename(statePath)}.${process.pid}.${Date.now()}.tmp`);
    try {
      await fs.mkdir(path.dirname(statePath), { recursive: true, mode: 448 });
      await fs.writeFile(temporaryPath, JSON.stringify(state, null, 2), { encoding: "utf8", mode: 384 });
      await fs.rename(temporaryPath, statePath);
      return true;
    } catch {
      try {
        await fs.unlink(temporaryPath);
      } catch {
      }
      return false;
    }
  }
};
function mergeModelOverride(base, override) {
  if (!override) {
    return base;
  }
  const merged = { ...base };
  for (const [key2, value] of Object.entries(override)) {
    if (key2 === "id") {
      continue;
    }
    const current = merged[key2];
    merged[key2] = isPlainObject(current) && isPlainObject(value) ? mergeModelOverride(current, value) : value;
  }
  return merged;
}
__name(mergeModelOverride, "mergeModelOverride");

// src/core/model-enrichment.ts
async function prepareModelEnricher(enricher, modelIds) {
  if (!enricher?.prepare) return;
  try {
    await enricher.prepare(modelIds);
  } catch {
  }
}
__name(prepareModelEnricher, "prepareModelEnricher");
function enrichModelDraft(draft, enricher, context = { filterNonChat: true }) {
  if (!enricher) return { draft, skipped: false };
  const result = enricher.enrich(draft.raw, context);
  if (result.skip) return { draft, skipped: true };
  return {
    skipped: false,
    metadataName: result.metadataName,
    draft: {
      ...draft,
      ...result.capabilities ? { capabilities: result.capabilities } : {},
      ...result.limit ? { limit: result.limit } : {},
      ...result.reasoning !== void 0 ? { reasoning: result.reasoning } : {},
      ...result.attachment !== void 0 ? { attachment: result.attachment } : {},
      ...result.toolCall !== void 0 ? { toolCall: result.toolCall } : {},
      ...result.structuredOutput !== void 0 ? { structuredOutput: result.structuredOutput } : {},
      ...result.temperature !== void 0 ? { temperature: result.temperature } : {},
      ...result.cost !== void 0 ? { cost: result.cost } : {},
      ...result.variants !== void 0 ? { variants: result.variants } : {},
      ...result.compatibility ? { compatibility: result.compatibility } : {},
      ...result.modalities ? { modalities: {
        ...result.modalities.input ? { input: [...result.modalities.input] } : {},
        ...result.modalities.output ? { output: [...result.modalities.output] } : {}
      } } : {}
    }
  };
}
__name(enrichModelDraft, "enrichModelDraft");

// src/core/model-filter.ts
function matchesField(model, filter) {
  if (!Object.prototype.hasOwnProperty.call(model, filter.field)) return false;
  const value = model[filter.field];
  if (filter.match) {
    filter.match.lastIndex = 0;
    return typeof value === "string" && filter.match.test(value);
  }
  return value === filter.equals;
}
__name(matchesField, "matchesField");
function matchesRegex(regex, value) {
  regex.lastIndex = 0;
  return regex.test(value);
}
__name(matchesRegex, "matchesRegex");
function matchesModelFilter(model, filter) {
  if (filter.excludeBy.some((entry) => matchesField(model, entry))) return false;
  if (filter.excludeRegex.some((regex) => matchesRegex(regex, model.id))) return false;
  if (filter.includeBy.length > 0 && !filter.includeBy.some((entry) => matchesField(model, entry))) return false;
  if (filter.includeRegex.length > 0 && !filter.includeRegex.some((regex) => matchesRegex(regex, model.id))) return false;
  return true;
}
__name(matchesModelFilter, "matchesModelFilter");

// src/utils/format-model-name.ts
function extractModelOwner(modelId) {
  const parts = modelId.split("/");
  if (parts.length > 1) {
    return parts[0];
  }
  return void 0;
}
__name(extractModelOwner, "extractModelOwner");
function formatModelName(model) {
  const { id } = model;
  const parts = id.split("/");
  const modelPart = parts.length > 1 ? parts[1] : parts[0];
  const acronyms = /* @__PURE__ */ new Set(["gpt", "oss", "api", "gguf", "ggml", "nomic", "vl", "it", "mlx"]);
  const tokens = modelPart.split(/[-_]/).filter(Boolean).map((token) => {
    const lowerToken = token.toLowerCase();
    if (acronyms.has(lowerToken)) {
      return token.toUpperCase();
    }
    if (/^\d+[bkmg]$/i.test(token)) {
      return token.toUpperCase();
    }
    if (/^q\d+$/i.test(token)) {
      return token.toUpperCase();
    }
    if (/^\d+\.\d+/.test(token)) {
      return token;
    }
    if (/^[a-z]\d+[a-z]$/i.test(token) || /^\d+[a-z]$/i.test(token)) {
      return token.toUpperCase();
    }
    return token.charAt(0).toUpperCase() + token.slice(1).toLowerCase();
  }).join(" ");
  return tokens;
}
__name(formatModelName, "formatModelName");

// src/core/model-naming.ts
function resolveModelOwner(model) {
  if (typeof model.raw?.owned_by === "string" && model.raw.owned_by.trim().length > 0) {
    return model.raw.owned_by.trim();
  }
  return extractModelOwner(model.id);
}
__name(resolveModelOwner, "resolveModelOwner");
function getOwnerLabel(model) {
  const rawOwner = resolveModelOwner(model);
  if (!rawOwner) return void 0;
  return rawOwner.split(/[-_]/).filter(Boolean).map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()).join(" ");
}
__name(getOwnerLabel, "getOwnerLabel");
function resolveModelDisplayName(model, smartModelName, metadataName) {
  if (!smartModelName) return model.id;
  if (typeof metadataName === "string" && metadataName.trim().length > 0) return metadataName.trim();
  return formatModelName(model) || model.id;
}
__name(resolveModelDisplayName, "resolveModelDisplayName");
function disambiguateModelNames(models) {
  const groups = /* @__PURE__ */ new Map();
  for (const model of models) {
    const group = groups.get(model.name) ?? [];
    group.push(model);
    groups.set(model.name, group);
  }
  for (const group of groups.values()) {
    if (group.length < 2) continue;
    const labels = group.map(getOwnerLabel);
    const uniqueLabels = labels.every((label, index) => label && labels.indexOf(label) === index);
    for (const [index, model] of group.entries()) {
      const suffix = uniqueLabels ? labels[index] : model.id;
      model.name = `${model.name} (${suffix ?? model.id})`;
    }
  }
}
__name(disambiguateModelNames, "disambiguateModelNames");

// src/core/discovery-pipeline.ts
function classifyDiscoveredModel(model) {
  const lowerId = model.id.toLowerCase();
  return lowerId.includes("embedding") || lowerId.includes("embed") ? "embedding" : "chat";
}
__name(classifyDiscoveredModel, "classifyDiscoveredModel");
function createInitialDraft(model, classification) {
  const owner = resolveModelOwner({ id: model.id, raw: model });
  return {
    id: model.id,
    name: model.id,
    raw: model,
    ...owner ? { organizationOwner: owner } : {},
    ...classification === "chat" ? { modalities: { input: ["text"], output: ["text"] } } : {}
  };
}
__name(createInitialDraft, "createInitialDraft");
function discoverModelDrafts(values, options) {
  const drafts = [];
  const classify = options.classify ?? classifyDiscoveredModel;
  for (const value of values) {
    const model = normalizeDiscoveredRawModel(value);
    if (!model || !matchesModelFilter(model, options.filter)) continue;
    const classification = classify(model);
    if (classification === "embedding") continue;
    const enriched = enrichModelDraft(createInitialDraft(model, classification), options.enricher, options.enrichmentContext);
    if (enriched.skipped) continue;
    drafts.push({
      ...enriched.draft,
      name: resolveModelDisplayName(model, options.smartModelName, enriched.metadataName)
    });
  }
  if (options.smartModelName) disambiguateModelNames(drafts);
  return drafts;
}
__name(discoverModelDrafts, "discoverModelDrafts");

// src/core/model-mapper.ts
function mapToV1Model(draft) {
  return {
    id: draft.id,
    name: draft.name,
    ...draft.organizationOwner ? { organizationOwner: draft.organizationOwner } : {},
    ...draft.modalities ? { modalities: draft.modalities } : {},
    ...draft.capabilities ? { capabilities: draft.capabilities } : {},
    ...draft.limit ? { limit: draft.limit } : {},
    ...draft.reasoning !== void 0 ? { reasoning: draft.reasoning } : {},
    ...draft.attachment !== void 0 ? { attachment: draft.attachment } : {},
    ...draft.toolCall !== void 0 ? { tool_call: draft.toolCall } : {},
    ...draft.structuredOutput !== void 0 ? { structured_output: draft.structuredOutput } : {},
    ...draft.temperature !== void 0 ? { temperature: draft.temperature } : {},
    ...draft.cost !== void 0 ? { cost: draft.cost } : {},
    ...draft.variants !== void 0 ? { variants: draft.variants } : {},
    ...draft.compatibility ? { compatibility: draft.compatibility } : {}
  };
}
__name(mapToV1Model, "mapToV1Model");
function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
__name(isRecord, "isRecord");
function mapV1Variant(id, value) {
  if (!isRecord(value)) return { id, settings: {} };
  const settings = {};
  for (const [key2, item] of Object.entries(value)) {
    if (key2 === "settings" || key2 === "body" || key2 === "headers") continue;
    settings[key2] = item;
  }
  if (isRecord(value.settings)) Object.assign(settings, value.settings);
  const headers = isRecord(value.headers) ? Object.fromEntries(
    Object.entries(value.headers).filter((entry) => typeof entry[1] === "string")
  ) : void 0;
  return {
    id,
    settings,
    ...isRecord(value.body) ? { body: value.body } : {},
    ...headers && Object.keys(headers).length > 0 ? { headers } : {}
  };
}
__name(mapV1Variant, "mapV1Variant");
function mapToDiscoveredV2Model(draft, options) {
  const resultDraft = draft;
  const rawModel = resultDraft.raw;
  const name = options.smartModelName ? resultDraft.name : resultDraft.id;
  const capabilities = {
    tools: resultDraft.toolCall !== false && resultDraft.capabilities?.tools !== false
  };
  const inputModalities = resultDraft.modalities?.input ?? resultDraft.capabilities?.input ?? ["text"];
  if (Array.isArray(inputModalities) && inputModalities.length > 0) {
    capabilities.input = inputModalities;
  }
  const outputModalities = resultDraft.modalities?.output ?? resultDraft.capabilities?.output ?? ["text"];
  if (Array.isArray(outputModalities) && outputModalities.length > 0) {
    capabilities.output = outputModalities;
  }
  const rawLimit = resultDraft.limit;
  const rawContext = typeof rawLimit?.context === "number" && rawLimit.context > 0 ? rawLimit.context : void 0;
  const rawOutput = typeof rawLimit?.output === "number" && rawLimit.output > 0 ? rawLimit.output : void 0;
  const rawInput = typeof rawLimit?.input === "number" && rawLimit.input > 0 ? rawLimit.input : void 0;
  const limit = createModelLimits(rawContext ?? DEFAULT_CONTEXT_TOKEN_LIMIT, rawOutput, rawInput);
  const mapped = {
    id: resultDraft.id,
    modelID: resultDraft.id,
    name,
    capabilities,
    limit
  };
  const isReasoning = typeof resultDraft.reasoning === "boolean" ? resultDraft.reasoning : rawModel.supports_reasoning === true || rawModel.capabilities && typeof rawModel.capabilities === "object" && rawModel.capabilities.reasoning === true;
  if (isReasoning) {
    mapped.reasoning = true;
    mapped.compatibility = {
      ...mapped.compatibility,
      reasoningField: "reasoning_content"
    };
  }
  if (Array.isArray(resultDraft.variants)) {
    mapped.variants = resultDraft.variants;
  } else if (resultDraft.variants && typeof resultDraft.variants === "object") {
    mapped.variants = Object.entries(resultDraft.variants).map(([id, value]) => mapV1Variant(id, value));
  } else if (isReasoning && !mapped.variants) {
    mapped.variants = [
      { id: "low", settings: { reasoningEffort: "low" } },
      { id: "medium", settings: { reasoningEffort: "medium" } },
      { id: "high", settings: { reasoningEffort: "high" } }
    ];
  }
  if (typeof resultDraft.attachment === "boolean") {
    mapped.attachment = resultDraft.attachment;
  }
  if (resultDraft.cost && typeof resultDraft.cost === "object") {
    if (Array.isArray(resultDraft.cost)) {
      mapped.cost = resultDraft.cost;
    } else {
      mapped.cost = [{
        input: resultDraft.cost.input ?? 0,
        output: resultDraft.cost.output ?? 0,
        cache: {
          read: resultDraft.cost.cache_read ?? resultDraft.cost.cache?.read ?? 0,
          write: resultDraft.cost.cache_write ?? resultDraft.cost.cache?.write ?? 0
        }
      }];
    }
  }
  return mapped;
}
__name(mapToDiscoveredV2Model, "mapToDiscoveredV2Model");

// src/utils/model-info/bifrost.ts
function hasUsableNumber(value) {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}
__name(hasUsableNumber, "hasUsableNumber");
function parseNonNegativeNumber(value) {
  if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
    return value;
  }
  if (typeof value !== "string" || value.trim() === "") {
    return void 0;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : void 0;
}
__name(parseNonNegativeNumber, "parseNonNegativeNumber");
function getModalities(value) {
  if (!Array.isArray(value)) return void 0;
  const supportedModalities = /* @__PURE__ */ new Set(["text", "audio", "image", "video", "pdf"]);
  const modalities2 = [...new Set(value.filter((modality) => typeof modality === "string").map((modality) => modality.trim().toLowerCase()).map((modality) => modality === "speech" ? "audio" : modality).filter((modality) => supportedModalities.has(modality)))];
  return modalities2.length > 0 ? modalities2 : void 0;
}
__name(getModalities, "getModalities");
var SUPPORTED_REASONING_TIERS = {
  none: true,
  minimal: true,
  low: true,
  medium: true,
  high: true,
  xhigh: true,
  max: true
};
function getReasoningVariants(rawModel) {
  const reasoning = rawModel.reasoning;
  if (!reasoning || typeof reasoning !== "object" || Array.isArray(reasoning)) return void 0;
  const block = reasoning;
  if (!Array.isArray(block.supported_efforts) || block.supported_efforts.length === 0) return void 0;
  const variants = {};
  for (const tier of block.supported_efforts) {
    if (typeof tier !== "string") continue;
    const normalized = tier.trim().toLowerCase();
    if (!SUPPORTED_REASONING_TIERS[normalized] || variants[normalized]) continue;
    variants[normalized] = { reasoningEffort: normalized };
  }
  return Object.keys(variants).length > 0 ? variants : void 0;
}
__name(getReasoningVariants, "getReasoningVariants");
function createBifrostEnricher(_data) {
  return {
    enrich(model) {
      const context = model.context_length;
      const input = model.max_input_tokens;
      const output = model.max_output_tokens;
      const result = {};
      if (hasUsableNumber(context)) {
        result.limit = {
          context,
          ...hasUsableNumber(input) ? { input } : {},
          ...hasUsableNumber(output) ? { output } : {}
        };
      }
      const name = model.normalized_name;
      if (typeof name === "string" && name.length > 0) result.metadataName = name;
      const architecture = model.architecture;
      if (architecture && typeof architecture === "object" && !Array.isArray(architecture)) {
        const inputModalities = getModalities(architecture.input_modalities);
        const outputModalities = getModalities(architecture.output_modalities);
        if (inputModalities || outputModalities) {
          result.modalities = {
            ...inputModalities ? { input: inputModalities } : {},
            ...outputModalities ? { output: outputModalities } : {}
          };
        }
      }
      const pricing = model.pricing;
      if (pricing && typeof pricing === "object" && !Array.isArray(pricing)) {
        const inputCost = parseNonNegativeNumber(pricing.prompt);
        const outputCost = parseNonNegativeNumber(pricing.completion);
        if (inputCost !== void 0 && outputCost !== void 0) {
          result.cost = { input: inputCost * 1e6, output: outputCost * 1e6 };
        }
      }
      const variants = getReasoningVariants(model);
      if (variants) {
        result.reasoning = true;
        result.variants = variants;
      }
      return result;
    }
  };
}
__name(createBifrostEnricher, "createBifrostEnricher");

// src/utils/model-info/litellm.ts
function hasUsableNumber2(value) {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}
__name(hasUsableNumber2, "hasUsableNumber");
function modelInfoScore(modelId, entry) {
  const info = entry.model_info ?? {};
  const modelIdLower = modelId.toLowerCase();
  let score = 0;
  if (entry.model_name === modelId) score += 8;
  if (info.key === modelId) score += 6;
  if (entry.litellm_params?.model === modelId) score += 4;
  if (entry.litellm_params?.model?.endsWith(`/${modelId}`)) score += 2;
  if (entry.model_name?.toLowerCase() === modelIdLower) score += 3;
  if (info.key?.toLowerCase() === modelIdLower) score += 2;
  if (entry.litellm_params?.model?.toLowerCase() === modelIdLower) score += 2;
  if (entry.litellm_params?.model?.toLowerCase().endsWith(`/${modelIdLower}`)) score += 1;
  if (info.mode === "chat") score += 5;
  if (hasUsableNumber2(info.max_input_tokens) || hasUsableNumber2(info.max_tokens)) score += 10;
  if (info.supports_reasoning === true) score += 4;
  return score;
}
__name(modelInfoScore, "modelInfoScore");
function buildModelInfoMap(entries) {
  const result = /* @__PURE__ */ new Map();
  for (const entry of entries) {
    const keys = /* @__PURE__ */ new Set();
    if (entry.model_name) keys.add(entry.model_name);
    if (entry.model_info?.key) keys.add(entry.model_info.key);
    if (entry.litellm_params?.model) {
      keys.add(entry.litellm_params.model);
      const parts = entry.litellm_params.model.split("/");
      if (parts.length > 1) keys.add(parts.slice(1).join("/"));
      keys.add(parts[parts.length - 1]);
    }
    for (const key2 of keys) {
      for (const lookupKey of /* @__PURE__ */ new Set([key2, key2.toLowerCase()])) {
        const existing = result.get(lookupKey);
        if (!existing || modelInfoScore(lookupKey, entry) > modelInfoScore(lookupKey, existing)) {
          result.set(lookupKey, entry);
        }
      }
    }
  }
  return result;
}
__name(buildModelInfoMap, "buildModelInfoMap");
function createReasoningVariants(info) {
  if (info.supports_reasoning !== true || !info.supported_openai_params?.includes("reasoning_effort")) {
    return void 0;
  }
  const variants = {};
  if (info.supports_none_reasoning_effort === true) variants.none = { reasoningEffort: "none" };
  if (info.supports_minimal_reasoning_effort === true) variants.minimal = { reasoningEffort: "minimal" };
  if (info.supports_low_reasoning_effort !== false) variants.low = { reasoningEffort: "low" };
  if (info.supports_medium_reasoning_effort !== false) variants.medium = { reasoningEffort: "medium" };
  if (info.supports_high_reasoning_effort !== false) variants.high = { reasoningEffort: "high" };
  if (info.supports_xhigh_reasoning_effort === true) variants.xhigh = { reasoningEffort: "xhigh" };
  if (info.supports_max_reasoning_effort === true) variants.max = { reasoningEffort: "max" };
  return Object.keys(variants).length > 0 ? variants : void 0;
}
__name(createReasoningVariants, "createReasoningVariants");
function getModalities2(value) {
  if (!Array.isArray(value)) return void 0;
  const supportedModalities = /* @__PURE__ */ new Set(["text", "audio", "image", "video", "pdf"]);
  const modalities2 = [...new Set(value.filter((item) => typeof item === "string").map((item) => item.trim().toLowerCase()).map((item) => item === "speech" ? "audio" : item).filter((item) => supportedModalities.has(item)))];
  return modalities2.length > 0 ? modalities2 : void 0;
}
__name(getModalities2, "getModalities");
function buildModalities(info) {
  const input = getModalities2(info.modalities?.input);
  const output = getModalities2(info.modalities?.output);
  const inputDeclared = Array.isArray(info.modalities?.input);
  const outputDeclared = Array.isArray(info.modalities?.output);
  if (inputDeclared && input === void 0 || outputDeclared && output === void 0) return void 0;
  if (input || output) {
    return { input: input ?? ["text"], output: output ?? ["text"] };
  }
  if (info.supports_vision === true || info.supports_video_input === true) {
    return {
      input: [
        "text",
        ...info.supports_vision === true ? ["image"] : [],
        ...info.supports_video_input === true ? ["video"] : []
      ],
      output: ["text"]
    };
  }
  return void 0;
}
__name(buildModalities, "buildModalities");
function nonNegativeCostPerMillion(value) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) return void 0;
  const perMillion = value * 1e6;
  return Number.isFinite(perMillion) ? perMillion : void 0;
}
__name(nonNegativeCostPerMillion, "nonNegativeCostPerMillion");
function positiveCostPerMillion(value) {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return void 0;
  const perMillion = value * 1e6;
  return Number.isFinite(perMillion) ? perMillion : void 0;
}
__name(positiveCostPerMillion, "positiveCostPerMillion");
function buildCost(info) {
  const input = nonNegativeCostPerMillion(info.input_cost_per_token);
  const output = nonNegativeCostPerMillion(info.output_cost_per_token);
  if (input === void 0 || output === void 0) return void 0;
  const cacheRead = positiveCostPerMillion(info.cache_read_input_token_cost);
  const cacheWrite = positiveCostPerMillion(info.cache_creation_input_token_cost);
  return {
    input,
    output,
    ...cacheRead !== void 0 ? { cache_read: cacheRead } : {},
    ...cacheWrite !== void 0 ? { cache_write: cacheWrite } : {}
  };
}
__name(buildCost, "buildCost");
function getExplicitOutputLimit(info, contextLimit) {
  if (hasUsableNumber2(info.max_output_tokens)) {
    return info.max_output_tokens;
  }
  if (hasUsableNumber2(info.max_tokens) && contextLimit !== void 0 && info.max_tokens < contextLimit) {
    return info.max_tokens;
  }
  return void 0;
}
__name(getExplicitOutputLimit, "getExplicitOutputLimit");
function getLiteLLMModelInfo(entry) {
  const info = entry?.model_info;
  if (!info) return {};
  const result = {};
  const modalities2 = buildModalities(info);
  if (modalities2) {
    result.modalities = modalities2;
  }
  const contextLimit = hasUsableNumber2(info.max_input_tokens) ? info.max_input_tokens : hasUsableNumber2(info.max_tokens) ? info.max_tokens : void 0;
  const inputLimit = hasUsableNumber2(info.max_input_tokens) ? info.max_input_tokens : void 0;
  const explicitOutput = getExplicitOutputLimit(info, contextLimit);
  const limits = createModelLimits(contextLimit, explicitOutput, inputLimit);
  if (limits) {
    result.limit = limits;
  }
  if (info.supports_reasoning === true) {
    result.reasoning = true;
  }
  const variants = createReasoningVariants(info);
  if (variants) {
    result.variants = variants;
  }
  const cost = buildCost(info);
  if (cost) {
    result.cost = cost;
  }
  if (typeof info.supports_function_calling === "boolean") {
    result.toolCall = info.supports_function_calling;
  }
  if (Array.isArray(info.supported_openai_params) && info.supported_openai_params.length > 0) {
    result.temperature = info.supported_openai_params.includes("temperature");
  }
  return result;
}
__name(getLiteLLMModelInfo, "getLiteLLMModelInfo");
function getModelInfo(modelInfoById, modelId) {
  return modelInfoById.get(modelId) ?? modelInfoById.get(modelId.toLowerCase());
}
__name(getModelInfo, "getModelInfo");
function createLiteLLMEnricher(data) {
  const response = data;
  const modelInfoById = buildModelInfoMap(Array.isArray(response?.data) ? response.data : []);
  return {
    enrich(model, context) {
      const entry = getModelInfo(modelInfoById, model.id);
      const mode = entry?.model_info?.mode;
      if (context.filterNonChat && typeof mode === "string" && mode.length > 0 && mode !== "chat") {
        return { skip: true };
      }
      return getLiteLLMModelInfo(entry);
    }
  };
}
__name(createLiteLLMEnricher, "createLiteLLMEnricher");

// src/utils/model-info/lmstudio.ts
function hasUsableNumber3(value) {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}
__name(hasUsableNumber3, "hasUsableNumber");
function getModelKey(model) {
  return typeof model.key === "string" && model.key.length > 0 ? model.key : void 0;
}
__name(getModelKey, "getModelKey");
function getLoadedContextLimit(model) {
  const limits = (model.loaded_instances ?? []).map((instance) => instance.config?.context_length).filter(hasUsableNumber3);
  return limits.length > 0 ? Math.max(...limits) : void 0;
}
__name(getLoadedContextLimit, "getLoadedContextLimit");
function getReasoningOptions(model) {
  return model.capabilities?.reasoning?.allowed_options ?? [];
}
__name(getReasoningOptions, "getReasoningOptions");
function getReasoningVariants2(options) {
  const reasoningEfforts = {
    off: "none",
    low: "low",
    medium: "medium",
    high: "high",
    xhigh: "xhigh"
  };
  const variants = {};
  for (const option of options) {
    const reasoningEffort = reasoningEfforts[option];
    if (reasoningEffort) variants[option] = { reasoningEffort };
  }
  return Object.keys(variants).length > 0 ? variants : void 0;
}
__name(getReasoningVariants2, "getReasoningVariants");
function createLMStudioEnricher(data) {
  const models = /* @__PURE__ */ new Map();
  const inventory = data;
  if (Array.isArray(inventory?.models)) {
    for (const model of inventory.models) {
      if (!model || typeof model !== "object") continue;
      const typedModel = model;
      const key2 = getModelKey(typedModel);
      if (key2) models.set(key2, typedModel);
    }
  }
  return {
    enrich(model) {
      const inventoryModel = models.get(model.id);
      if (!inventoryModel) return {};
      const result = {};
      const displayName = inventoryModel.display_name;
      if (typeof displayName === "string" && displayName.length > 0) result.metadataName = displayName;
      const contextLimit = getLoadedContextLimit(inventoryModel) ?? (hasUsableNumber3(inventoryModel.max_context_length) ? inventoryModel.max_context_length : void 0);
      const limits = createModelLimits(contextLimit);
      if (limits) {
        result.limit = limits;
      }
      const capabilities = inventoryModel.capabilities && typeof inventoryModel.capabilities === "object" ? inventoryModel.capabilities : void 0;
      if (capabilities?.vision === true) {
        result.modalities = { input: ["text", "image"], output: ["text"] };
      }
      if (capabilities?.trained_for_tool_use === true) result.toolCall = true;
      const reasoningOptions = getReasoningOptions(inventoryModel);
      if (reasoningOptions.length > 0) {
        result.reasoning = true;
        const variants = getReasoningVariants2(reasoningOptions);
        if (variants) result.variants = variants;
      }
      return result;
    }
  };
}
__name(createLMStudioEnricher, "createLMStudioEnricher");

// src/utils/model-info/llamaswap.ts
function hasUsableNumber4(value) {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}
__name(hasUsableNumber4, "hasUsableNumber");
function hasNonNegativeNumber(value) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}
__name(hasNonNegativeNumber, "hasNonNegativeNumber");
function getRecord(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : void 0;
}
__name(getRecord, "getRecord");
function getModalities3(value) {
  if (!Array.isArray(value)) return void 0;
  const supportedModalities = /* @__PURE__ */ new Set(["text", "audio", "image", "video", "pdf"]);
  const modalities2 = [...new Set(value.filter((modality) => typeof modality === "string").map((modality) => modality.trim().toLowerCase()).filter((modality) => supportedModalities.has(modality)))];
  return modalities2.length > 0 ? modalities2 : void 0;
}
__name(getModalities3, "getModalities");
function getLlamaSwapMetadata(rawModel) {
  return getRecord(getRecord(rawModel?.meta)?.llamaswap);
}
__name(getLlamaSwapMetadata, "getLlamaSwapMetadata");
function resolveContextLength(...declarations) {
  const declared = declarations.filter(hasUsableNumber4);
  return declared.length > 0 ? Math.min(...declared) : void 0;
}
__name(resolveContextLength, "resolveContextLength");
function createLlamaSwapEnricher(_data) {
  return {
    enrich(model) {
      const meta = getRecord(model.meta);
      const llamaSwapMetadata = getLlamaSwapMetadata(model);
      const context = resolveContextLength(model.context_length, meta?.n_ctx);
      const result = {};
      const name = model.name;
      if (typeof name === "string" && name.trim().length > 0) result.metadataName = name.trim();
      if (context) {
        const input = hasUsableNumber4(llamaSwapMetadata?.max_input_tokens) ? llamaSwapMetadata.max_input_tokens : void 0;
        const output = hasNonNegativeNumber(llamaSwapMetadata?.max_output_tokens) ? llamaSwapMetadata.max_output_tokens : void 0;
        result.limit = createModelLimits(context, output, input);
      }
      const architecture = getRecord(model.architecture);
      const inputModalities = getModalities3(architecture?.input_modalities);
      const outputModalities = getModalities3(architecture?.output_modalities);
      if (inputModalities || outputModalities) {
        result.modalities = {
          ...inputModalities ? { input: inputModalities } : {},
          ...outputModalities ? { output: outputModalities } : {}
        };
      }
      const capabilities = getRecord(model.capabilities);
      const supportedParameters = Array.isArray(model.supported_parameters) ? model.supported_parameters : [];
      if (capabilities?.function_calling === true || supportedParameters.includes("tools")) {
        result.toolCall = true;
      }
      return result;
    }
  };
}
__name(createLlamaSwapEnricher, "createLlamaSwapEnricher");

// src/utils/models-dev-fetcher.ts
var DEFAULT_MODELS_DEV_URL = "https://models.dev/models.json";
var MODELS_DEV_CATALOG_URL = "https://models.dev/api.json";
var MODELS_DEV_TIMEOUT_MS = 3e3;
var MODELS_DEV_CATALOG_TIMEOUT_MS = 8e3;
var PREFIX_MATCH_MIN_SCORE = 70;
var PREFIX_MATCH_MIN_SHARED_PARTS = 2;
var modelsDevCaches = /* @__PURE__ */ new Map();
function isObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
__name(isObject, "isObject");
function toModelId(providerId, modelId) {
  return providerId ? `${providerId}/${modelId}` : modelId;
}
__name(toModelId, "toModelId");
function parseReasoningOptions(value) {
  if (!Array.isArray(value)) {
    return void 0;
  }
  const options = value.filter((option) => isObject(option) && typeof option.type === "string").map((option) => ({
    type: option.type,
    ...Array.isArray(option.values) ? { values: option.values.filter((item) => typeof item === "string") } : {}
  }));
  return options.length > 0 ? options : void 0;
}
__name(parseReasoningOptions, "parseReasoningOptions");
function addModel(cache, providerId, rawModel, fallbackModelId) {
  const rawId = typeof rawModel.id === "string" && rawModel.id.length > 0 ? rawModel.id : fallbackModelId;
  if (!rawId) {
    return;
  }
  const id = rawId.includes("/") ? rawId : toModelId(providerId, rawId);
  cache.set(id, {
    id,
    name: typeof rawModel.name === "string" ? rawModel.name : void 0,
    attachment: typeof rawModel.attachment === "boolean" ? rawModel.attachment : void 0,
    reasoning: typeof rawModel.reasoning === "boolean" ? rawModel.reasoning : void 0,
    reasoning_options: parseReasoningOptions(rawModel.reasoning_options),
    tool_call: typeof rawModel.tool_call === "boolean" ? rawModel.tool_call : void 0,
    structured_output: typeof rawModel.structured_output === "boolean" ? rawModel.structured_output : void 0,
    temperature: typeof rawModel.temperature === "boolean" ? rawModel.temperature : void 0,
    modalities: isObject(rawModel.modalities) ? {
      input: Array.isArray(rawModel.modalities.input) ? rawModel.modalities.input.filter((item) => typeof item === "string") : void 0,
      output: Array.isArray(rawModel.modalities.output) ? rawModel.modalities.output.filter((item) => typeof item === "string") : void 0
    } : void 0,
    limit: isObject(rawModel.limit) ? {
      context: typeof rawModel.limit.context === "number" ? rawModel.limit.context : void 0,
      input: typeof rawModel.limit.input === "number" ? rawModel.limit.input : void 0,
      output: typeof rawModel.limit.output === "number" ? rawModel.limit.output : void 0
    } : void 0
  });
}
__name(addModel, "addModel");
function parseModelsDevData(data) {
  const cache = /* @__PURE__ */ new Map();
  if (!isObject(data)) {
    return cache;
  }
  for (const [key2, value] of Object.entries(data)) {
    if (!isObject(value)) {
      continue;
    }
    if (isObject(value.models)) {
      for (const [modelId, model] of Object.entries(value.models)) {
        if (isObject(model)) {
          addModel(cache, key2, model, modelId);
        }
      }
      continue;
    }
    addModel(cache, void 0, value, key2);
  }
  return cache;
}
__name(parseModelsDevData, "parseModelsDevData");
function addReasoningOptions(models, catalog) {
  if (!isObject(catalog)) {
    return;
  }
  for (const [id, model] of models) {
    const separator = id.indexOf("/");
    if (separator <= 0) {
      continue;
    }
    const provider = catalog[id.slice(0, separator)];
    const entry = isObject(provider) && isObject(provider.models) ? provider.models[id.slice(separator + 1)] : void 0;
    const options = isObject(entry) ? parseReasoningOptions(entry.reasoning_options) : void 0;
    if (options) {
      model.reasoning_options = options;
    }
  }
}
__name(addReasoningOptions, "addReasoningOptions");
async function fetchJson(url, timeoutMs) {
  const response = await fetch(url, {
    method: "GET",
    signal: AbortSignal.timeout(timeoutMs)
  });
  return response.ok ? response.json() : void 0;
}
__name(fetchJson, "fetchJson");
async function fetchModelsDevData(url = DEFAULT_MODELS_DEV_URL) {
  const cached = modelsDevCaches.get(url);
  if (cached) return cached;
  try {
    const [data, catalog] = await Promise.all([
      fetchJson(url, MODELS_DEV_TIMEOUT_MS),
      // Effort levels are an extra: without them, models keep the rest of their metadata.
      url === DEFAULT_MODELS_DEV_URL ? fetchJson(MODELS_DEV_CATALOG_URL, MODELS_DEV_CATALOG_TIMEOUT_MS).catch(() => void 0) : void 0
    ]);
    if (data === void 0) {
      return /* @__PURE__ */ new Map();
    }
    const models = parseModelsDevData(data);
    addReasoningOptions(models, catalog);
    modelsDevCaches.set(url, models);
    return models;
  } catch {
    return /* @__PURE__ */ new Map();
  }
}
__name(fetchModelsDevData, "fetchModelsDevData");
function splitModelId(modelId) {
  const parts = modelId.split("/");
  if (parts.length <= 1) {
    return { model: modelId };
  }
  return {
    provider: parts[0].toLowerCase(),
    model: parts.slice(1).join("/")
  };
}
__name(splitModelId, "splitModelId");
function calculatePrefixScore(modelA, modelB) {
  const partsA = modelA.split("-");
  const partsB = modelB.split("-");
  const shorter = partsA.length <= partsB.length ? partsA : partsB;
  const longer = partsA.length <= partsB.length ? partsB : partsA;
  for (let i = 0; i < shorter.length; i++) {
    if (shorter[i] !== longer[i]) {
      return 0;
    }
  }
  if (shorter.length < PREFIX_MATCH_MIN_SHARED_PARTS) {
    return 0;
  }
  return Math.max(0, 100 - (longer.length - shorter.length) * 10);
}
__name(calculatePrefixScore, "calculatePrefixScore");
function lookupModelsDevData(modelId, cache) {
  let cleanId = modelId.replace(/:[a-zA-Z0-9_-]+$/g, "");
  const parts = cleanId.split("/");
  if (parts.length > 2) {
    cleanId = parts.slice(-2).join("/");
  }
  const exactMatch = cache.get(cleanId) ?? cache.get(cleanId.toLowerCase());
  if (exactMatch) return exactMatch;
  const requestedModelLower = splitModelId(cleanId).model.toLowerCase();
  const allCandidates = [];
  for (const [key2, value] of cache.entries()) {
    const candidate = splitModelId(key2);
    const candidateModelLower = candidate.model.toLowerCase();
    allCandidates.push([candidateModelLower, value]);
  }
  const exactModelMatches = allCandidates.filter(([candidateModel]) => candidateModel === requestedModelLower);
  if (exactModelMatches.length === 1) return exactModelMatches[0]?.[1];
  if (exactModelMatches.length > 1) return void 0;
  let bestMatch;
  let bestScore = 0;
  let bestScoreMatches = 0;
  for (const [candidateModel, value] of allCandidates) {
    const score = calculatePrefixScore(requestedModelLower, candidateModel);
    if (score >= PREFIX_MATCH_MIN_SCORE && score > bestScore) {
      bestScore = score;
      bestMatch = value;
      bestScoreMatches = 1;
    } else if (score >= PREFIX_MATCH_MIN_SCORE && score === bestScore) {
      bestScoreMatches++;
    }
  }
  return bestScoreMatches === 1 ? bestMatch : void 0;
}
__name(lookupModelsDevData, "lookupModelsDevData");

// src/utils/model-info/models-dev.ts
function hasUsableNumber5(value) {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}
__name(hasUsableNumber5, "hasUsableNumber");
function getEffortVariants(info) {
  const efforts = (info?.reasoning_options ?? []).filter((option) => option.type === "effort").flatMap((option) => option.values ?? []).filter((effort) => effort !== "default");
  return efforts.length > 0 ? Object.fromEntries(efforts.map((effort) => [effort, { reasoningEffort: effort }])) : void 0;
}
__name(getEffortVariants, "getEffortVariants");
function createModelsDevEnricher(data) {
  const cache = data instanceof Map ? data : /* @__PURE__ */ new Map();
  return {
    enrich(model) {
      const info = lookupModelsDevData(model.id, cache);
      const contextLimit = hasUsableNumber5(info?.limit?.context) ? info?.limit?.context : info?.limit?.input;
      const limits = hasUsableNumber5(contextLimit) ? createModelLimits(contextLimit, info?.limit?.output, info?.limit?.input) : void 0;
      const variants = getEffortVariants(info);
      return {
        metadataName: info?.name,
        ...limits ? { limit: limits } : {},
        ...typeof info?.attachment === "boolean" ? { attachment: info.attachment } : {},
        ...typeof info?.reasoning === "boolean" ? { reasoning: info.reasoning } : {},
        ...typeof info?.tool_call === "boolean" ? { toolCall: info.tool_call } : {},
        ...typeof info?.structured_output === "boolean" ? { structuredOutput: info.structured_output } : {},
        ...typeof info?.temperature === "boolean" ? { temperature: info.temperature } : {},
        ...info?.modalities ? { modalities: info.modalities } : {},
        ...variants ? { variants } : {}
      };
    }
  };
}
__name(createModelsDevEnricher, "createModelsDevEnricher");

// src/utils/model-info/omniroute.ts
function hasUsableNumber6(value) {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}
__name(hasUsableNumber6, "hasUsableNumber");
function getModalities4(value) {
  if (!Array.isArray(value)) return void 0;
  const supportedModalities = /* @__PURE__ */ new Set(["text", "audio", "image", "video", "pdf"]);
  const modalities2 = [...new Set(value.filter((modality) => typeof modality === "string").map((modality) => modality.trim().toLowerCase()).map((modality) => modality === "speech" ? "audio" : modality).filter((modality) => supportedModalities.has(modality)))];
  return modalities2.length > 0 ? modalities2 : void 0;
}
__name(getModalities4, "getModalities");
function getCapabilities(rawModel) {
  const capabilities = rawModel.capabilities;
  return capabilities && typeof capabilities === "object" && !Array.isArray(capabilities) ? capabilities : void 0;
}
__name(getCapabilities, "getCapabilities");
function getReasoningVariants3(capabilities) {
  if (capabilities?.reasoning !== true || !Array.isArray(capabilities.effort_tiers)) return void 0;
  const supportedTiers = {
    none: true,
    minimal: true,
    low: true,
    medium: true,
    high: true,
    xhigh: true,
    max: true,
    ultra: true
  };
  const variants = Object.fromEntries(
    capabilities.effort_tiers.filter((tier) => typeof tier === "string").map((tier) => tier.trim().toLowerCase()).filter((tier) => supportedTiers[tier] === true).map((tier) => [tier, { reasoningEffort: tier }])
  );
  return Object.keys(variants).length > 0 ? variants : void 0;
}
__name(getReasoningVariants3, "getReasoningVariants");
function normalizeServiceTier(value) {
  if (typeof value !== "string") return void 0;
  const tier = value.trim().toLowerCase();
  if (tier === "priority" || tier === "fast") return "fast";
  if (tier === "flex") return "flex";
  return void 0;
}
__name(normalizeServiceTier, "normalizeServiceTier");
function getServiceTierVariants(rawModel, capabilities) {
  const tiers = /* @__PURE__ */ new Set();
  const addTier = /* @__PURE__ */ __name((value) => {
    const tier = normalizeServiceTier(value);
    if (tier) tiers.add(tier);
  }, "addTier");
  if (Array.isArray(capabilities?.service_tiers)) {
    capabilities.service_tiers.forEach(addTier);
  }
  if (Array.isArray(rawModel.service_tiers)) {
    for (const entry of rawModel.service_tiers) {
      if (typeof entry === "string") {
        addTier(entry);
      } else if (entry && typeof entry === "object" && !Array.isArray(entry)) {
        addTier(entry.id);
      }
    }
  }
  if (Array.isArray(rawModel.additional_speed_tiers)) {
    rawModel.additional_speed_tiers.forEach(addTier);
  }
  if (tiers.size === 0) return void 0;
  return Object.fromEntries(
    [...tiers].map((tier) => [tier, { body: { service_tier: tier } }])
  );
}
__name(getServiceTierVariants, "getServiceTierVariants");
function createOmniRouteEnricher(_data) {
  return {
    enrich(model) {
      const context = model.context_length;
      const inputLimit = model.max_input_tokens;
      const output = model.max_output_tokens;
      const result = {};
      if (hasUsableNumber6(context)) {
        result.limit = {
          context,
          ...hasUsableNumber6(inputLimit) ? { input: inputLimit } : {},
          ...hasUsableNumber6(output) ? { output } : {}
        };
      }
      const capabilities = getCapabilities(model);
      const inputModalities = getModalities4(model.input_modalities);
      const outputModalities = getModalities4(model.output_modalities);
      const input = inputModalities ?? (capabilities?.vision === true ? ["text", "image"] : void 0);
      if (input || outputModalities) {
        result.modalities = {
          ...input ? { input } : {},
          ...outputModalities ? { output: outputModalities } : {}
        };
      }
      if (typeof capabilities?.attachment === "boolean") result.attachment = capabilities.attachment;
      if (typeof capabilities?.reasoning === "boolean") result.reasoning = capabilities.reasoning;
      if (typeof capabilities?.tool_calling === "boolean") result.toolCall = capabilities.tool_calling;
      if (typeof capabilities?.structured_output === "boolean") result.structuredOutput = capabilities.structured_output;
      if (typeof capabilities?.temperature === "boolean") result.temperature = capabilities.temperature;
      const variants = {
        ...getReasoningVariants3(capabilities) ?? {},
        ...getServiceTierVariants(model, capabilities) ?? {}
      };
      if (Object.keys(variants).length > 0) result.variants = variants;
      return result;
    }
  };
}
__name(createOmniRouteEnricher, "createOmniRouteEnricher");

// src/utils/model-info/vllm.ts
function hasUsableNumber7(value) {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}
__name(hasUsableNumber7, "hasUsableNumber");
function createVLLMEnricher(_data) {
  return {
    enrich(model) {
      const maxModelLen = model.max_model_len;
      if (hasUsableNumber7(maxModelLen)) {
        const limits = createModelLimits(maxModelLen);
        if (limits) return { limit: limits };
      }
      return {};
    }
  };
}
__name(createVLLMEnricher, "createVLLMEnricher");

// src/utils/model-info/aiproxy.ts
var REASONING_EFFORTS = /* @__PURE__ */ new Set(["none", "minimal", "low", "medium", "high", "xhigh", "max"]);
function object(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : void 0;
}
__name(object, "object");
function positiveNumber(value) {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}
__name(positiveNumber, "positiveNumber");
function nonNegativeNumber(value) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}
__name(nonNegativeNumber, "nonNegativeNumber");
function reasoningVariants(value) {
  if (!Array.isArray(value)) return void 0;
  const variants = {};
  for (const tier of value) {
    if (typeof tier !== "string") continue;
    const effort = tier.trim().toLowerCase();
    if (REASONING_EFFORTS.has(effort)) variants[effort] = { reasoningEffort: effort };
  }
  return variants;
}
__name(reasoningVariants, "reasoningVariants");
function createAIProxyEnricher(data) {
  const modelsDevEnricher = createModelsDevEnricher(data);
  return {
    enrich(model, context) {
      const base = modelsDevEnricher.enrich(model, context);
      const result = {
        ...base,
        ...base.limit ? { limit: { ...base.limit } } : {},
        ...base.cost && typeof base.cost === "object" ? { cost: { ...base.cost } } : {}
      };
      const limits = object(model.limits);
      const inputLimit = limits?.max_input_tokens;
      const outputLimit = limits?.max_output_tokens;
      const existingLimit = result.limit;
      if (existingLimit && positiveNumber(existingLimit.context) && (positiveNumber(inputLimit) || positiveNumber(outputLimit))) {
        result.limit = {
          ...existingLimit,
          ...positiveNumber(inputLimit) ? { input: inputLimit } : {},
          ...positiveNumber(outputLimit) ? { output: outputLimit } : {}
        };
      }
      const pricing = object(model.pricing);
      if (pricing) {
        const input = pricing.input_per_1m_usd;
        const output = pricing.output_per_1m_usd;
        const cacheRead = pricing.cache_read_per_1m_usd;
        const updates = {
          ...nonNegativeNumber(input) ? { input } : {},
          ...nonNegativeNumber(output) ? { output } : {},
          ...nonNegativeNumber(cacheRead) ? { cache_read: cacheRead } : {}
        };
        if (Object.keys(updates).length > 0) {
          result.cost = { ...result.cost ?? {}, ...updates };
        }
      }
      const capabilities = object(model.capabilities);
      if (typeof capabilities?.reasoning === "boolean") {
        result.reasoning = capabilities.reasoning;
      }
      const variants = reasoningVariants(capabilities?.effort_tiers);
      if (variants) {
        result.variants = variants;
        if (Object.keys(variants).length > 0) result.reasoning = true;
      }
      return result;
    }
  };
}
__name(createAIProxyEnricher, "createAIProxyEnricher");

// src/utils/model-info/openrouter.ts
var SUPPORTED_MODALITIES = /* @__PURE__ */ new Set(["text", "audio", "image", "video", "pdf"]);
var SUPPORTED_REASONING_EFFORTS = /* @__PURE__ */ new Set(["none", "minimal", "low", "medium", "high", "xhigh", "max"]);
function record(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : void 0;
}
__name(record, "record");
function usableNumber(value) {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}
__name(usableNumber, "usableNumber");
function nonNegativeCostPerMillion2(value) {
  const parsed = typeof value === "number" ? value : typeof value === "string" && value.trim() !== "" ? Number(value) : void 0;
  if (typeof parsed !== "number" || !Number.isFinite(parsed) || parsed < 0) return void 0;
  const perMillion = parsed * 1e6;
  return Number.isFinite(perMillion) ? Number(perMillion.toPrecision(15)) : void 0;
}
__name(nonNegativeCostPerMillion2, "nonNegativeCostPerMillion");
function modalities(value) {
  if (!Array.isArray(value)) return void 0;
  const result = [...new Set(value.filter((item) => typeof item === "string").map((item) => item.trim().toLowerCase()).map((item) => item === "speech" ? "audio" : item).filter((item) => SUPPORTED_MODALITIES.has(item)))];
  return result.length > 0 ? result : void 0;
}
__name(modalities, "modalities");
function reasoningVariants2(value) {
  const reasoning = record(value);
  if (!Array.isArray(reasoning?.supported_efforts)) return void 0;
  const variants = {};
  for (const effort of reasoning.supported_efforts) {
    if (typeof effort !== "string") continue;
    const normalized = effort.trim().toLowerCase();
    if (SUPPORTED_REASONING_EFFORTS.has(normalized)) {
      variants[normalized] = { reasoningEffort: normalized };
    }
  }
  return Object.keys(variants).length > 0 ? variants : void 0;
}
__name(reasoningVariants2, "reasoningVariants");
function createOpenRouterEnricher(_data) {
  return {
    enrich(model) {
      const result = {};
      const name = model.name;
      if (typeof name === "string" && name.trim().length > 0) {
        result.metadataName = name.trim();
      }
      const context = usableNumber(model.context_length) ? model.context_length : void 0;
      const topProvider = record(model.top_provider);
      const output = usableNumber(topProvider?.max_completion_tokens) ? topProvider.max_completion_tokens : void 0;
      if (context) {
        result.limit = createModelLimits(context, output);
      }
      const architecture = record(model.architecture);
      const inputModalities = modalities(architecture?.input_modalities);
      const outputModalities = modalities(architecture?.output_modalities);
      if (inputModalities || outputModalities) {
        result.modalities = {
          ...inputModalities ? { input: inputModalities } : {},
          ...outputModalities ? { output: outputModalities } : {}
        };
      }
      const pricing = record(model.pricing);
      const input = nonNegativeCostPerMillion2(pricing?.prompt);
      const outputCost = nonNegativeCostPerMillion2(pricing?.completion);
      const cacheRead = nonNegativeCostPerMillion2(pricing?.input_cache_read);
      const cacheWrite = nonNegativeCostPerMillion2(pricing?.input_cache_write);
      if (input !== void 0 && outputCost !== void 0) {
        result.cost = {
          input,
          output: outputCost,
          ...cacheRead !== void 0 ? { cache_read: cacheRead } : {},
          ...cacheWrite !== void 0 ? { cache_write: cacheWrite } : {}
        };
      }
      const supportedParameters = Array.isArray(model.supported_parameters) ? model.supported_parameters.filter((item) => typeof item === "string") : [];
      if (supportedParameters.includes("tools") || supportedParameters.includes("tool_choice")) {
        result.toolCall = true;
      }
      if (supportedParameters.length > 0) {
        result.temperature = supportedParameters.includes("temperature");
      }
      const reasoning = record(model.reasoning);
      const variants = reasoningVariants2(reasoning);
      if (variants) result.variants = variants;
      if (reasoning?.mandatory === true || reasoning?.default_enabled === true || variants) {
        result.reasoning = true;
      }
      return result;
    }
  };
}
__name(createOpenRouterEnricher, "createOpenRouterEnricher");

// src/core/model-info-url.ts
function buildModelInfoURL(baseURL, endpoint) {
  if (/^https?:\/\//i.test(endpoint)) {
    return endpoint;
  }
  return endpoint.startsWith("/") ? new URL(endpoint, new URL(baseURL).origin).toString() : new URL(endpoint, baseURL.endsWith("/") ? baseURL : `${baseURL}/`).toString();
}
__name(buildModelInfoURL, "buildModelInfoURL");

// src/utils/model-info/ollama.ts
var DEFAULT_OLLAMA_ENDPOINT = "/api/show";
var DEFAULT_OLLAMA_CONCURRENCY = 4;
var DEFAULT_OLLAMA_TIMEOUT_MS = 5e3;
function isRecord2(value) {
  return !!value && typeof value === "object" && !Array.isArray(value);
}
__name(isRecord2, "isRecord");
function positiveNumber2(value) {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : void 0;
}
__name(positiveNumber2, "positiveNumber");
function parseCapabilities(value) {
  const capabilities = /* @__PURE__ */ new Set();
  if (!Array.isArray(value)) return capabilities;
  for (const entry of value) {
    if (typeof entry === "string" && entry.trim().length > 0) {
      capabilities.add(entry.trim().toLowerCase());
    }
  }
  return capabilities;
}
__name(parseCapabilities, "parseCapabilities");
function parseNumCtx(parameters) {
  if (isRecord2(parameters)) {
    return positiveNumber2(parameters.num_ctx);
  }
  if (typeof parameters !== "string") return void 0;
  const match = parameters.match(/(?:^|\n)\s*"?num_ctx"?\s*[:=]?\s*(\d+)\b/i);
  return match ? positiveNumber2(Number(match[1])) : void 0;
}
__name(parseNumCtx, "parseNumCtx");
function resolveContextLength2(show) {
  const numCtx = parseNumCtx(show.parameters);
  if (numCtx) return numCtx;
  const modelInfo = isRecord2(show.model_info) ? show.model_info : void 0;
  if (modelInfo) {
    const architecture = typeof modelInfo["general.architecture"] === "string" ? modelInfo["general.architecture"] : void 0;
    const family = isRecord2(show.details) && typeof show.details.family === "string" ? show.details.family : void 0;
    for (const name of [architecture, family]) {
      if (!name) continue;
      const value = positiveNumber2(modelInfo[`${name}.context_length`]);
      if (value) return value;
    }
    let fallback;
    for (const [key2, value] of Object.entries(modelInfo)) {
      if (!key2.endsWith(".context_length")) continue;
      const candidate = positiveNumber2(value);
      if (candidate && (fallback === void 0 || candidate > fallback)) {
        fallback = candidate;
      }
    }
    if (fallback) return fallback;
  }
  return positiveNumber2(show.context_length);
}
__name(resolveContextLength2, "resolveContextLength");
function parseShow(value) {
  if (!isRecord2(value)) return void 0;
  const capabilities = parseCapabilities(value.capabilities);
  const contextLength = resolveContextLength2(value);
  if (contextLength === void 0 && capabilities.size === 0) return void 0;
  return {
    ...contextLength !== void 0 ? { contextLength } : {},
    capabilities
  };
}
__name(parseShow, "parseShow");
function createOllamaEnricher(options) {
  const metadata = /* @__PURE__ */ new Map();
  const showUrl = buildModelInfoURL(options.baseURL, options.endpoint ?? DEFAULT_OLLAMA_ENDPOINT);
  const fetcher = options.fetcher ?? globalThis.fetch;
  const timeoutMs = options.timeoutMs ?? DEFAULT_OLLAMA_TIMEOUT_MS;
  const headers = new Headers({ accept: "application/json", "content-type": "application/json" });
  if (options.apiKey) headers.set("authorization", `Bearer ${options.apiKey}`);
  async function fetchShow(modelId) {
    try {
      const response = await fetcher(showUrl, {
        method: "POST",
        headers,
        body: JSON.stringify({ model: modelId }),
        signal: AbortSignal.timeout(timeoutMs)
      });
      if (!response.ok) {
        options.logger?.warn("Ollama model info discovery failed", {
          endpoint: showUrl,
          modelId,
          status: response.status
        });
        return void 0;
      }
      return parseShow(await response.json());
    } catch (error) {
      options.logger?.warn("Ollama model info discovery failed", {
        endpoint: showUrl,
        modelId,
        error: error instanceof Error ? error.message : String(error)
      });
      return void 0;
    }
  }
  __name(fetchShow, "fetchShow");
  return {
    async prepare(modelIds) {
      const ids = [...new Set(modelIds)].filter((id) => id.length > 0 && !metadata.has(id));
      let cursor = 0;
      const worker = /* @__PURE__ */ __name(async () => {
        while (cursor < ids.length) {
          const modelId = ids[cursor++];
          const parsed = await fetchShow(modelId);
          if (parsed) metadata.set(modelId, parsed);
        }
      }, "worker");
      await Promise.all(
        Array.from({ length: Math.min(DEFAULT_OLLAMA_CONCURRENCY, ids.length) }, () => worker())
      );
    },
    enrich(model, context) {
      const parsed = metadata.get(model.id);
      if (!parsed) return {};
      const capabilities = parsed.capabilities;
      if (context.filterNonChat && capabilities.has("embedding") && !capabilities.has("completion")) {
        return { skip: true };
      }
      const result = {};
      if (parsed.contextLength !== void 0) {
        const limits = createModelLimits(parsed.contextLength);
        if (limits) result.limit = limits;
      }
      const input = ["text"];
      if (capabilities.has("vision") || capabilities.has("images")) input.push("image");
      if (capabilities.has("audio")) input.push("audio");
      if (input.length > 1) result.modalities = { input, output: ["text"] };
      if (capabilities.has("thinking")) result.reasoning = true;
      if (capabilities.has("tools") || capabilities.has("function_calling") || capabilities.has("tool_calling")) {
        result.toolCall = true;
      }
      return result;
    }
  };
}
__name(createOllamaEnricher, "createOllamaEnricher");

// src/utils/model-info/index.ts
var MODEL_ENRICHERS = {
  ["models.dev" /* ModelsDev */]: (data) => createModelsDevEnricher(data),
  ["bifrost" /* Bifrost */]: (data) => createBifrostEnricher(data),
  ["vllm" /* VLLM */]: (data) => createVLLMEnricher(data),
  ["llama-swap" /* LlamaSwap */]: (data) => createLlamaSwapEnricher(data),
  ["omniroute" /* OmniRoute */]: (data) => createOmniRouteEnricher(data),
  ["lmstudio" /* LMStudio */]: (data) => createLMStudioEnricher(data),
  ["litellm" /* LiteLLM */]: (data) => createLiteLLMEnricher(data),
  ["aiproxy" /* AIProxy */]: (data) => createAIProxyEnricher(data),
  ["openrouter" /* OpenRouter */]: (data) => createOpenRouterEnricher(data)
};
var DEFERRED_MODEL_ENRICHERS = {
  ["ollama" /* Ollama */]: (context) => createOllamaEnricher(context)
};
function createModelEnricher(format, data, options) {
  return MODEL_ENRICHERS[format]?.(data, options);
}
__name(createModelEnricher, "createModelEnricher");
function createDeferredModelEnricher(format, context) {
  return DEFERRED_MODEL_ENRICHERS[format]?.(context);
}
__name(createDeferredModelEnricher, "createDeferredModelEnricher");
function isSupportedModelInfoFormat(format) {
  return MODEL_ENRICHERS[format] !== void 0 || DEFERRED_MODEL_ENRICHERS[format] !== void 0;
}
__name(isSupportedModelInfoFormat, "isSupportedModelInfoFormat");

// src/core/enricher-resolver.ts
var DEFAULT_LITELLM_ENDPOINT = "/v1/model/info";
var DEFAULT_LMSTUDIO_ENDPOINT = "/api/v1/models";
var DEFAULT_ENRICHER_TIMEOUT_MS = 5e3;
async function resolveModelInfoEnricher(context, options) {
  const rawFormat = options.format;
  if (!rawFormat) return void 0;
  const format = rawFormat;
  if (!isSupportedModelInfoFormat(format)) {
    context.logger?.warn("Unsupported provider model info format", {
      provider: context.providerName,
      format: rawFormat
    });
    return void 0;
  }
  const filterNonChat = options.filterNonChat !== false;
  if (format === "models.dev" /* ModelsDev */ || format === "aiproxy" /* AIProxy */) {
    const endpoint = options.endpoint ?? DEFAULT_MODELS_DEV_URL;
    const data = await fetchModelsDevData(endpoint);
    const enricher = createModelEnricher(format, data, { filterNonChat });
    context.logger?.info?.("Loaded models.dev data", {
      provider: context.providerName,
      endpoint,
      count: data.size
    });
    return enricher;
  }
  if (format === "bifrost" /* Bifrost */ || format === "vllm" /* VLLM */ || format === "llama-swap" /* LlamaSwap */ || format === "omniroute" /* OmniRoute */ || format === "openrouter" /* OpenRouter */) {
    return createModelEnricher(format, null);
  }
  const deferred = createDeferredModelEnricher(format, {
    baseURL: context.baseURL,
    apiKey: context.apiKey,
    endpoint: options.endpoint,
    timeoutMs: options.timeoutMs ?? DEFAULT_ENRICHER_TIMEOUT_MS,
    fetcher: context.fetcher,
    logger: context.logger
  });
  if (deferred) return deferred;
  if (format === "litellm" /* LiteLLM */ || format === "lmstudio" /* LMStudio */) {
    const defaultEndpoint = format === "litellm" /* LiteLLM */ ? DEFAULT_LITELLM_ENDPOINT : DEFAULT_LMSTUDIO_ENDPOINT;
    const targetEndpoint = options.endpoint ?? defaultEndpoint;
    const infoUrl = buildModelInfoURL(context.baseURL, targetEndpoint);
    const headers = new Headers({ accept: "application/json" });
    if (context.apiKey) {
      headers.set("authorization", `Bearer ${context.apiKey}`);
    }
    const fetcher = context.fetcher ?? globalThis.fetch;
    const timeoutMs = options.timeoutMs ?? DEFAULT_ENRICHER_TIMEOUT_MS;
    try {
      const res = await fetcher(infoUrl, {
        method: "GET",
        headers,
        signal: AbortSignal.timeout(timeoutMs)
      });
      if (res.ok) {
        const data = await res.json();
        return createModelEnricher(format, data, { filterNonChat });
      }
      context.logger?.warn("Provider model info discovery failed", {
        provider: context.providerName,
        baseURL: context.baseURL,
        endpoint: targetEndpoint,
        format,
        status: res.status
      });
      return void 0;
    } catch (error) {
      context.logger?.warn("Provider model info discovery failed", {
        provider: context.providerName,
        baseURL: context.baseURL,
        endpoint: targetEndpoint,
        format,
        error: error instanceof Error ? error.message : String(error)
      });
      return void 0;
    }
  }
  return void 0;
}
__name(resolveModelInfoEnricher, "resolveModelInfoEnricher");

// src/plugin/enhance-config.ts
var RESOLVED_PROVIDERS_TIMEOUT_MS = 250;
var defaultProviderModelStore = new ProviderModelStore();
var currentProviderModelStore = defaultProviderModelStore;
var injectedModelsByConfig = /* @__PURE__ */ new WeakMap();
function createCachedModelEnricher(models) {
  return {
    enrich(model) {
      const cached = models[model.id];
      if (!cached) return {};
      const limit = cached.limit;
      const modalities2 = cached.modalities;
      const capabilities = cached.capabilities;
      return {
        ...capabilities && typeof capabilities === "object" ? { capabilities } : {},
        ...limit && typeof limit === "object" && typeof limit.context === "number" && typeof limit.output === "number" ? { limit } : {},
        ...modalities2 && typeof modalities2 === "object" ? { modalities: modalities2 } : {},
        ...typeof cached.reasoning === "boolean" ? { reasoning: cached.reasoning } : {},
        ...typeof cached.attachment === "boolean" ? { attachment: cached.attachment } : {},
        ...typeof cached.tool_call === "boolean" ? { toolCall: cached.tool_call } : {},
        ...typeof cached.structured_output === "boolean" ? { structuredOutput: cached.structured_output } : {},
        ...typeof cached.temperature === "boolean" ? { temperature: cached.temperature } : {},
        ...cached.cost !== void 0 ? { cost: cached.cost } : {},
        ...cached.variants !== void 0 ? { variants: cached.variants } : {},
        ...cached.compatibility && typeof cached.compatibility === "object" ? { compatibility: cached.compatibility } : {}
      };
    }
  };
}
__name(createCachedModelEnricher, "createCachedModelEnricher");
function getInjectedModels(config, providerID) {
  return injectedModelsByConfig.get(config)?.get(providerID) ?? /* @__PURE__ */ new Map();
}
__name(getInjectedModels, "getInjectedModels");
function replaceInjectedModels(config, providerID, models) {
  let providers = injectedModelsByConfig.get(config);
  if (!providers) {
    providers = /* @__PURE__ */ new Map();
    injectedModelsByConfig.set(config, providers);
  }
  providers.set(providerID, new Map(Object.entries(models)));
}
__name(replaceInjectedModels, "replaceInjectedModels");
function getExplicitModels(config, providerID, models) {
  const injectedModels = getInjectedModels(config, providerID);
  return Object.fromEntries(Object.entries(models).filter(([modelID, model]) => injectedModels.get(modelID) !== model));
}
__name(getExplicitModels, "getExplicitModels");
async function getResolvedProvidersByID(client, logger, timeoutMs = RESOLVED_PROVIDERS_TIMEOUT_MS) {
  try {
    const loadProviders = client.config?.providers;
    if (typeof loadProviders !== "function") {
      return /* @__PURE__ */ new Map();
    }
    const result = await Promise.race([
      loadProviders.call(client.config),
      new Promise((resolve) => {
        setTimeout(() => resolve(void 0), timeoutMs);
      })
    ]);
    if (!result) {
      logger.debug("Timed out loading resolved providers");
      return /* @__PURE__ */ new Map();
    }
    const providers = result?.data?.providers;
    if (!Array.isArray(providers)) {
      return /* @__PURE__ */ new Map();
    }
    return new Map(
      providers.filter((provider) => typeof provider?.id === "string").map((provider) => [provider.id, provider])
    );
  } catch (error) {
    logger.debug("Could not load resolved providers", {
      error: error instanceof Error ? error.message : String(error)
    });
    return /* @__PURE__ */ new Map();
  }
}
__name(getResolvedProvidersByID, "getResolvedProvidersByID");
function detectHostClient() {
  if (process.env.OPENCODE === "1") {
    return "opencode";
  }
  if (process.env.MIMOCODE === "1") {
    return "mimocode";
  }
  return "opencode";
}
__name(detectHostClient, "detectHostClient");
function getHostAuthFile() {
  if (!xdgData2) {
    return void 0;
  }
  const hostClient = detectHostClient();
  return path2.join(xdgData2, hostClient, "auth.json");
}
__name(getHostAuthFile, "getHostAuthFile");
async function getOpenCodeAuth(providerName, logger) {
  const normalizedProviderName = providerName.replace(/\/+$/, "");
  try {
    if (process.env.OPENCODE_AUTH_CONTENT) {
      const auths = JSON.parse(process.env.OPENCODE_AUTH_CONTENT);
      return auths[providerName] ?? auths[normalizedProviderName] ?? auths[`${normalizedProviderName}/`];
    }
  } catch (error) {
    logger.debug("Could not parse OPENCODE_AUTH_CONTENT", {
      error: error instanceof Error ? error.message : String(error)
    });
  }
  const file = getHostAuthFile();
  if (file) {
    try {
      const auths = JSON.parse(await fs2.readFile(file, "utf8"));
      return auths[providerName] ?? auths[normalizedProviderName] ?? auths[`${normalizedProviderName}/`];
    } catch (error) {
      if (error?.code !== "ENOENT") {
        logger.debug("Could not read host auth store", {
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
  }
  return void 0;
}
__name(getOpenCodeAuth, "getOpenCodeAuth");
function getConfiguredApiKey(providerConfig) {
  const explicitApiKey = providerConfig.options?.apiKey;
  if (typeof explicitApiKey === "string" && explicitApiKey.trim().length > 0) {
    return explicitApiKey;
  }
  return void 0;
}
__name(getConfiguredApiKey, "getConfiguredApiKey");
async function getProviderApiKey(providerName, providerConfig, client, loader, logger) {
  const explicitApiKey = getConfiguredApiKey(providerConfig);
  if (explicitApiKey) {
    return explicitApiKey;
  }
  loader.promise ??= getResolvedProvidersByID(client, logger);
  const resolvedProvider = (await loader.promise).get(providerName);
  if (typeof resolvedProvider?.key === "string" && resolvedProvider.key.trim().length > 0) {
    return resolvedProvider.key;
  }
  const auth = await getOpenCodeAuth(providerName, logger);
  if (auth?.type === "api" && typeof auth.key === "string" && auth.key.trim().length > 0) {
    return auth.key;
  }
  return void 0;
}
__name(getProviderApiKey, "getProviderApiKey");
async function enhanceConfig(config, client, toastNotifier, pluginConfig, logger) {
  try {
    const providers = config.provider || {};
    const openAICompatibleProviders = [];
    const discoveryConfig = getDefaultDiscoveryConfigFromEnv(logger.child({ category: "config" }));
    const defaultDiscoveryEnabled = discoveryConfig.enabled;
    const resolvedProvidersLoader = {};
    for (const [providerName, providerConfig] of Object.entries(providers)) {
      const p = providerConfig;
      const providerDiscoveryConfig = p.options?.modelsDiscovery ?? {};
      const modelsEndpoint = providerDiscoveryConfig.endpoint ?? "/v1/models";
      const timeoutMs = providerDiscoveryConfig.timeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS;
      const modelInfoFormat = providerDiscoveryConfig.modelInfoFormat;
      const filterNonChat = providerDiscoveryConfig.filterNonChat !== false;
      const forceDiscoveryEnabled = providerDiscoveryConfig.enabled === true;
      if (!forceDiscoveryEnabled && !canDiscoverModels(p)) {
        continue;
      }
      if (!shouldDiscoverProviderWithOverride(defaultDiscoveryEnabled, providerDiscoveryConfig)) {
        logger.debug(`Provider ${providerName} model discovery disabled by configuration`);
        continue;
      }
      let baseURL;
      let displayName = providerName;
      if (p.options?.baseURL) {
        baseURL = normalizeProviderOriginForCache(p.options.baseURL);
      } else {
        continue;
      }
      const cacheConfig = providerDiscoveryConfig.cache;
      const cacheEnabled = cacheConfig?.enabled === true;
      const ttlSeconds = cacheConfig?.ttlSeconds ?? DEFAULT_CACHE_TTL_SECONDS;
      const cacheIdentity = {
        id: providerName,
        baseURL,
        endpoint: modelsEndpoint
      };
      let persistedState;
      let usingPersistedModels = false;
      let reprocessPersistedModels = false;
      let apiKey;
      let models = [];
      let discoveredModels = {};
      let cachedRawModels = {};
      if (cacheEnabled) {
        persistedState = await currentProviderModelStore.read(cacheIdentity);
        if (persistedState && isInventoryFresh(persistedState, ttlSeconds)) {
          discoveredModels = persistedState.models;
          if (persistedState.rawModels) {
            models = Object.values(persistedState.rawModels);
            discoveredModels = {};
            reprocessPersistedModels = true;
          }
          usingPersistedModels = true;
        } else {
          apiKey = await getProviderApiKey(providerName, p, client, resolvedProvidersLoader, logger);
          const discovery = await discoverModelsFromProvider(baseURL, apiKey, modelsEndpoint, timeoutMs);
          if (!discovery.ok) {
            const existingModels2 = getExplicitModels(config, providerName, p.models || {});
            p.models = existingModels2;
            replaceInjectedModels(config, providerName, {});
            logger.warn("Provider model discovery failed", {
              provider: providerName,
              baseURL,
              endpoint: modelsEndpoint
            });
            continue;
          }
          models = discovery.models.filter(isDiscoveredRawModel);
        }
      } else {
        apiKey = await getProviderApiKey(providerName, p, client, resolvedProvidersLoader, logger);
        const discovery = await discoverModelsFromProvider(baseURL, apiKey, modelsEndpoint, timeoutMs);
        if (!discovery.ok) {
          logger.warn("Provider model discovery failed", {
            provider: providerName,
            baseURL,
            endpoint: modelsEndpoint
          });
          continue;
        }
        models = discovery.models.filter(isDiscoveredRawModel);
      }
      let modelInfoEnricher;
      if (!usingPersistedModels) {
        modelInfoEnricher = await resolveModelInfoEnricher({
          baseURL,
          apiKey,
          providerName,
          logger: {
            warn: /* @__PURE__ */ __name((message, context) => logger.warn(message, context), "warn"),
            info: /* @__PURE__ */ __name((message, context) => logger.info(message, context), "info")
          }
        }, {
          format: modelInfoFormat,
          endpoint: providerDiscoveryConfig.modelInfoEndpoint,
          filterNonChat,
          timeoutMs
        });
      }
      if (reprocessPersistedModels) {
        modelInfoEnricher = createCachedModelEnricher(persistedState?.models ?? {});
      }
      if (!usingPersistedModels) {
        await prepareModelEnricher(
          modelInfoEnricher,
          models.filter(isDiscoveredRawModel).map((model) => model.id)
        );
      }
      const existingModels = getExplicitModels(config, providerName, p.models || {});
      const hasProviderModelRegexFilter = !!providerDiscoveryConfig.models?.includeRegex?.length || !!providerDiscoveryConfig.models?.excludeRegex?.length;
      const providerModelRegexFilter = getProviderModelRegexFilter(providerDiscoveryConfig, logger.child({ category: "filtering" }));
      const providerModelFieldFilters = getProviderModelFieldFilters(providerDiscoveryConfig, logger.child({ category: "filtering" }));
      const smartModelNameEnabled = providerDiscoveryConfig.smartModelName === true;
      if (!usingPersistedModels || reprocessPersistedModels) {
        const drafts = discoverModelDrafts(models, {
          filter: {
            includeBy: providerModelFieldFilters.includeBy,
            excludeBy: providerModelFieldFilters.excludeBy,
            includeRegex: hasProviderModelRegexFilter ? providerModelRegexFilter.includeRegex : [],
            excludeRegex: hasProviderModelRegexFilter ? providerModelRegexFilter.excludeRegex : []
          },
          smartModelName: smartModelNameEnabled,
          enricher: modelInfoEnricher,
          enrichmentContext: { filterNonChat }
        });
        for (const draft of drafts) {
          discoveredModels[draft.id] = mapToV1Model(draft);
          cachedRawModels[draft.id] = draft.raw;
        }
      }
      if (cacheEnabled && !usingPersistedModels && !await currentProviderModelStore.saveModels(cacheIdentity, discoveredModels, persistedState, cachedRawModels)) {
        logger.debug("Could not persist discovered provider models", { provider: providerName });
      }
      const modelsWithOverrides = Object.fromEntries(Object.entries(discoveredModels).map(([modelID, model]) => [
        modelID,
        mergeModelOverride(model, persistedState?.overrides?.[modelID])
      ]));
      const modelsWithExplicitConfig = Object.fromEntries(Object.entries(existingModels).map(([modelID, model]) => [
        modelID,
        modelID in modelsWithOverrides ? mergeModelOverride(modelsWithOverrides[modelID], model) : model
      ]));
      p.models = {
        ...modelsWithOverrides,
        ...modelsWithExplicitConfig
      };
      replaceInjectedModels(config, providerName, modelsWithOverrides);
      if (Object.keys(modelsWithOverrides).length > 0) {
        openAICompatibleProviders.push({
          name: displayName,
          baseURL,
          models: modelsWithOverrides
        });
      }
    }
    if (openAICompatibleProviders.length > 0) {
      const totalModels = openAICompatibleProviders.reduce((sum, p) => sum + Object.keys(p.models).length, 0);
      logger.info("Provider model discovery completed", {
        providerCount: openAICompatibleProviders.length,
        modelCount: totalModels
      });
    }
  } catch (error) {
    logger.error("Unexpected error in enhanceConfig", {
      error: error instanceof Error ? error.message : String(error)
    });
    toastNotifier.warning("Plugin configuration failed", "Configuration Error").catch(() => {
    });
  }
}
__name(enhanceConfig, "enhanceConfig");

// src/plugin/commands.ts
var MIGRATION_COMMAND_NAME = "models-discovery:migrate";
var CONFIG_COMMAND_NAME = "models-discovery:config";
var MIGRATION_COMMAND_TEMPLATE = `Use the customize-opencode skill.

Migrate opencode-models-discovery legacy global configuration to provider-level configuration.

Inspect both:
- the project OpenCode config: opencode.json, opencode.jsonc, or .opencode/opencode.json under the current project/worktree
- the user global OpenCode config: ~/.config/opencode/opencode.json

If OPENCODE_CONFIG is set and points to a file, inspect that custom config file too.

Do not edit managed or organization-controlled config unless the user explicitly asks for it. Managed config locations are platform-specific, including /Library/Application Support/opencode/ on macOS, /etc/opencode/ on Linux, and %ProgramData%\\opencode on Windows.

Find the OpenCode config file that declares the opencode-models-discovery plugin and also contains legacy plugin-level options for that plugin.

Legacy opencode-models-discovery options are:
- discovery.enabled
- providers.include
- providers.exclude
- models.includeRegex
- models.excludeRegex
- smartModelName

Move these settings into provider.<id>.options.modelsDiscovery where possible.

Field mapping:
- discovery.enabled -> provider.<id>.options.modelsDiscovery.enabled only when needed to preserve behavior
- models.includeRegex -> preferably provider.<id>.options.modelsDiscovery.models.includeBy with { "field": "id", "match": "..." }
- models.excludeRegex -> preferably provider.<id>.options.modelsDiscovery.models.excludeBy with { "field": "id", "match": "..." }
- smartModelName -> provider.<id>.options.modelsDiscovery.smartModelName
- providers.exclude -> provider.<id>.options.modelsDiscovery.enabled=false for excluded editable providers

Provider-level models.includeRegex and models.excludeRegex remain supported as id-only shortcuts, but prefer includeBy and excludeBy for migrated config because they support both id filters and provider-specific raw fields.

Preserve unrelated config fields and formatting as much as possible.
Do not modify files that do not declare this plugin.
Do not guess provider IDs that are not present in editable config.
Do not overwrite existing provider.<id>.options.modelsDiscovery fields unless the user explicitly asks you to.
If migration cannot be done safely, explain what blocked it and show the exact manual changes needed.

Explain the mechanism to the user before or after editing:
- OpenCode's provider config defines the provider id, npm package, baseURL, API key source, and built-in provider enablement.
- This plugin only discovers and injects models for providers; it does not enable a provider that OpenCode itself has disabled.
- OpenCode built-in enabled_providers and disabled_providers control provider availability, while modelsDiscovery controls only model discovery for an available provider.
- API keys can remain in provider.<id>.options.apiKey or in OpenCode /connect credentials; do not duplicate secrets unless the user asks.
- After v1.0.0, provider-level modelsDiscovery is the configuration boundary for this plugin.

For v1.0.0 behavior:
- plugin-level global discovery config is no longer applied
- discovery remains enabled by default
- provider.<id>.options.modelsDiscovery.enabled=false disables discovery for that provider
- OPENCODE_MODELS_DISCOVERY_DEFAULT_ENABLED=false can be used to make unspecified providers default to disabled

If providers.include is used, preserve the old opt-in behavior by either recommending OPENCODE_MODELS_DISCOVERY_DEFAULT_ENABLED=false with explicit enabled providers, or disabling known non-included editable providers with modelsDiscovery.enabled=false. Prefer explaining the environment variable approach instead of writing many disable entries unless the user asks for a pure config-only migration.

After editing config, remind the user to quit and restart opencode.`;
var CONFIG_COMMAND_TEMPLATE = `Use the customize-opencode skill.

Help configure opencode-models-discovery using the recommended provider-level configuration style.

Inspect both:
- the project OpenCode config: opencode.json, opencode.jsonc, or .opencode/opencode.json under the current project/worktree
- the user global OpenCode config: ~/.config/opencode/opencode.json

If OPENCODE_CONFIG is set and points to a file, inspect that custom config file too.

Do not edit managed or organization-controlled config unless the user explicitly asks for it. Managed config locations are platform-specific, including /Library/Application Support/opencode/ on macOS, /etc/opencode/ on Linux, and %ProgramData%\\opencode on Windows.

Find the OpenCode config file that declares the opencode-models-discovery plugin, or ask the user whether the plugin should be added to project or user global config if it is not configured yet.

Use provider-level configuration under provider.<id>.options.modelsDiscovery. Prefer this shape:

{
  "provider": {
    "<provider-id>": {
      "options": {
        "modelsDiscovery": {
          "enabled": true,
          "endpoint": "/v1/models",
          "models": {
            "includeBy": [{ "field": "id", "match": "^chat-" }],
            "excludeBy": [{ "field": "available", "equals": false }]
          },
          "smartModelName": true,
          "modelInfoFormat": "litellm",
          "filterNonChat": true,
          "cache": {
            "enabled": true,
            "ttlSeconds": 86400
          }
        }
      }
    }
  }
}

Only include fields the user needs. Do not add placeholder regex values.

Explain the mechanism to the user:
- OpenCode's provider config defines the provider id, npm package, baseURL, API key source, and built-in provider enablement.
- This plugin runs during OpenCode startup, queries a provider's models endpoint, and merges discovered models into the active config for the current session.
- OpenCode built-in enabled_providers and disabled_providers control whether providers are available at all.
- provider.<id>.options.modelsDiscovery controls only discovery behavior for that provider.
- API keys can be configured as provider.<id>.options.apiKey, but OpenCode /connect credentials can also be used for the same provider id. Do not duplicate secrets unless the user asks.
- Config changes require restarting OpenCode because config is loaded at startup.

Supported plugin options under provider.<id>.options.modelsDiscovery:
- enabled: force enable or disable discovery for this provider
- endpoint: provider-specific models endpoint as an origin-relative path beginning with /; it always uses the provider base URL origin and defaults to /v1/models
- modelInfoEndpoint: override the metadata endpoint; accepts either an origin-relative path or a complete URL for "litellm", "lmstudio", and "ollama", while "models.dev" requires a complete models.json URL
- modelInfoFormat="aiproxy": overlay inline AIProxy limits, pricing, and explicitly advertised effort tiers on models.dev metadata; modelInfoEndpoint optionally overrides the models.dev URL
- models.includeRegex: shortcut for model id regex allow-list; prefer models.includeBy with field="id" and match for new config
- models.excludeRegex: shortcut for model id regex deny-list; prefer models.excludeBy with field="id" and match for new config
- models.includeBy: allow-list for top-level raw fields returned in the provider's /v1/models response; each rule uses exactly one of equals or match
- models.excludeBy: deny-list for top-level raw fields returned in the provider's /v1/models response; each rule uses exactly one of equals or match
- smartModelName: use friendlier display names for discovered models
- modelInfoFormat="models.dev": enrich from the public models.dev index; modelInfoEndpoint optionally overrides the complete models.json URL
- modelInfoFormat="bifrost": read Bifrost's documented inline /v1/models limits, modalities, and base pricing without another request
- modelInfoFormat="litellm": enrich from a LiteLLM-compatible /v1/model/info endpoint; modelInfoEndpoint optionally overrides the path
- modelInfoFormat="vllm": for vLLM-compatible providers whose raw /v1/models entries include a positive numeric max_model_len; without another request, sets limit.context and bounds limit.output to the plugin's default output limit for matching discovered models
- modelInfoFormat="lmstudio": discover callable models through the normal /v1/models endpoint, then enrich exact model-id matches from LM Studio's /api/v1/models inventory
- modelInfoFormat="llama-swap": read llama-swap's inline /v1/models context, modalities, and function-calling metadata without another request
- modelInfoFormat="omniroute": read OmniRoute's documented inline /v1/models limits, modalities, and capabilities without another request
- modelInfoFormat="openrouter": read OpenRouter's inline /v1/models limits, modalities, pricing, capabilities, and reasoning metadata without another request
- modelInfoFormat="ollama": discover through the normal /v1/models endpoint, then read per-model context length and capabilities from Ollama's native POST /api/show endpoint
- filterNonChat: when LiteLLM model info is available, skip non-chat models by default
- cache.enabled: opt in to a provider-scoped persisted discovery cache of filtered and enriched model configurations; defaults to false
- cache.ttlSeconds: non-negative finite cache lifetime in seconds; defaults to 86400

Recommended defaults:
- omit modelsDiscovery.enabled when the user is fine with discovery defaulting on
- set modelsDiscovery.enabled=false to disable discovery for a specific provider
- omit endpoint when the provider uses the standard /v1/models endpoint
- prefer models.includeBy and models.excludeBy for model filtering
- use models.includeBy or models.excludeBy with field="id" and match for id/name regex filtering
- use models.includeBy or models.excludeBy with equals for strict equality on provider-specific top-level raw model fields
- use models.includeBy or models.excludeBy with match for regex matching on string top-level raw model fields
- treat models.includeRegex and models.excludeRegex as id-only shortcuts for includeBy/excludeBy; do not recommend them for new config unless the user asks for the shorter id-only syntax
- missing fields do not match includeBy or excludeBy rules
- includeBy and excludeBy are cumulative: a model must pass includeBy first, then excludeBy
- excludeBy wins over includeBy when both match the same model
- includeRegex and excludeRegex preserve legacy shortcut behavior: includeRegex takes precedence, so excludeRegex is only applied when includeRegex is not configured
- avoid configuring both includeBy field="id" match rules and includeRegex unless the user wants an intersection with legacy id-only shortcut behavior
- use smartModelName=true only when the user wants friendlier display names
- use modelInfoFormat="models.dev" for models.dev metadata enrichment; set modelInfoEndpoint to a complete mirror or proxy URL only when needed
- use modelInfoFormat="aiproxy" only when the provider's model-list entries use AIProxy's inline limits and pricing fields; it also composes models.dev and reads reasoning variants only from an explicit capabilities.effort_tiers list
- use modelInfoFormat="bifrost" only for Bifrost /v1/models responses; it is an explicit inline-metadata format and does not make another request
- use modelInfoFormat="litellm" for LiteLLM-compatible /v1/model/info; set modelInfoEndpoint only when the provider uses another path
- use modelInfoFormat="vllm" only when the provider's /v1/models response exposes max_model_len; it is not a standard OpenAI-compatible field, does not require modelInfoEndpoint, and does not infer other capabilities
- use modelInfoFormat="lmstudio" for LM Studio REST metadata enrichment; set modelInfoEndpoint only when LM Studio uses another inventory path
- use modelInfoFormat="llama-swap" only for llama-swap /v1/models responses; it is an explicit inline-metadata format and does not make another request
- use modelInfoFormat="omniroute" only for OmniRoute's documented /v1/models response; it is an explicit inline-metadata format and does not make another request
- use modelInfoFormat="openrouter" only for OpenRouter's /v1/models response; it is an explicit inline-metadata format and does not make another request
- use modelInfoFormat="ollama" for Ollama providers that expose the native /api/show endpoint; it makes one POST per discovered model, keeps going when individual models fail, and does not require modelInfoEndpoint unless Ollama is behind a non-standard path or proxy
- configure caching only when the user requests it; it is disabled by default
- the persisted discovery cache belongs to this plugin and is not a replacement for opencode.json

When the user asks to manage the persisted discovery cache:
- identify the selected provider from editable OpenCode configuration, then resolve the plugin data directory with xdg-basedir (XDG_DATA_HOME when set, otherwise its platform fallback) and inspect only opencode-models-discovery/providers/provider-<encoded-provider-id>.json beneath it
- before editing, show cached models, last successful fetch time, cache TTL validity, and existing overrides
- model overrides are provider-owned configuration fragments applied only while that model exists in the current valid cached model set; an override for a missing model remains saved but inactive until the provider returns it
- ask for confirmation before removing an override or invalidating/removing cached models
- for a force refresh, invalidate or remove only the cached discovered models and preserve overrides
- never edit OpenCode or Mimocode auth stores, API keys, authorization headers, or managed host configuration while managing saved state

Provider compatibility guidance:
- Discovery works for @ai-sdk/openai-compatible providers by default.
- Providers with a /v1 baseURL can often be discovered even when using another npm package.
- Providers with non-standard models paths should set modelsDiscovery.endpoint.
- modelsDiscovery.enabled=true can force discovery for a provider that does not match automatic compatibility detection.

Configuration compatibility boundary:
- v1.0.0 ignores plugin-level global discovery config at runtime.
- Recommended new config should use provider.<id>.options.modelsDiscovery.
- Discovery remains enabled by default unless a provider sets modelsDiscovery.enabled=false or OPENCODE_MODELS_DISCOVERY_DEFAULT_ENABLED=false is set for unspecified providers.

Preserve unrelated config fields and formatting as much as possible.
Do not overwrite existing provider.<id>.options.modelsDiscovery fields unless the user explicitly asks you to.
After editing config, remind the user to quit and restart opencode.`;
function ensureCommandConfig(config) {
  if (!config || typeof config !== "object") {
    return void 0;
  }
  if (!config.command || typeof config.command !== "object" || Array.isArray(config.command)) {
    config.command = {};
  }
  return config.command;
}
__name(ensureCommandConfig, "ensureCommandConfig");
function injectCommand(config, logger, commandName, command, existingMessage) {
  const commands = ensureCommandConfig(config);
  if (!commands) {
    return;
  }
  if (commands[commandName]) {
    logger.warn(existingMessage, {
      command: commandName
    });
    return;
  }
  commands[commandName] = command;
}
__name(injectCommand, "injectCommand");
function injectMigrationCommand(config, logger) {
  injectCommand(
    config,
    logger,
    MIGRATION_COMMAND_NAME,
    {
      description: "Migrate opencode-models-discovery config",
      agent: "build",
      template: MIGRATION_COMMAND_TEMPLATE
    },
    "Migration command already exists; leaving user-defined command unchanged"
  );
}
__name(injectMigrationCommand, "injectMigrationCommand");
function injectConfigCommand(config, logger) {
  injectCommand(
    config,
    logger,
    CONFIG_COMMAND_NAME,
    {
      description: "Configure opencode-models-discovery",
      agent: "build",
      template: CONFIG_COMMAND_TEMPLATE
    },
    "Config command already exists; leaving user-defined command unchanged"
  );
}
__name(injectConfigCommand, "injectConfigCommand");

// src/plugin/config-hook.ts
var DEFAULT_CONFIG_HOOK_TIMEOUT_MS = 5e3;
function getConfigHookTimeoutMs(config, logger) {
  const providerTimeouts = Object.values(config?.provider ?? {}).map((provider) => provider?.options?.modelsDiscovery?.timeoutMs).filter((timeoutMs2) => typeof timeoutMs2 === "number" && Number.isFinite(timeoutMs2) && timeoutMs2 > 0);
  const providerTimeoutMs = providerTimeouts.length > 0 ? Math.max(...providerTimeouts) : void 0;
  const timeoutMs = Math.max(DEFAULT_CONFIG_HOOK_TIMEOUT_MS, providerTimeoutMs ?? 0);
  logger.debug("Using config hook timeout", { timeoutMs, providerTimeoutMs });
  return timeoutMs;
}
__name(getConfigHookTimeoutMs, "getConfigHookTimeoutMs");
function createConfigHook(client, toastNotifier, pluginConfig, legacyGlobalConfigWarning, logger) {
  return async (config) => {
    if (config && (Object.isFrozen?.(config) || Object.isSealed?.(config))) {
      logger.warn("Config object is frozen or sealed; cannot modify directly");
      return;
    }
    const validation = validateConfig(config);
    if (!validation.isValid) {
      logger.error("Invalid config provided", { errors: validation.errors });
      toastNotifier.error("Plugin configuration is invalid", "Configuration Error").catch(() => {
      });
      return;
    }
    if (validation.warnings.length > 0) {
      logger.warn("Config warnings", { warnings: validation.warnings });
    }
    injectConfigCommand(config, logger);
    if (hasLegacyGlobalDiscoveryConfig(pluginConfig)) {
      legacyGlobalConfigWarning.markPending(logger);
      injectMigrationCommand(config, logger);
    }
    const discoveryPromise = enhanceConfig(
      config,
      client,
      toastNotifier,
      pluginConfig,
      logger.child({ category: "discovery" })
    );
    const timeoutMs = getConfigHookTimeoutMs(config, logger);
    try {
      await Promise.race([
        discoveryPromise,
        new Promise((resolve) => {
          setTimeout(() => resolve(), timeoutMs);
        })
      ]);
    } catch (error) {
      logger.error("Config enhancement failed", {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  };
}
__name(createConfigHook, "createConfigHook");

// src/plugin/legacy-config-warning.ts
var LEGACY_GLOBAL_CONFIG_WARNING = "Global opencode-models-discovery config is no longer applied in v1.0.0. Move settings to provider.<name>.options.modelsDiscovery or run /models-discovery:migrate.";
var TOAST_RETRY_DELAYS_MS = [500, 1500, 3e3, 5e3];
var TOAST_READY_EVENTS = /* @__PURE__ */ new Set([
  "server.connected",
  "workspace.ready",
  "worktree.ready",
  "reference.updated"
]);
function isToastReadyEvent(event) {
  return typeof event?.type === "string" && TOAST_READY_EVENTS.has(event.type);
}
__name(isToastReadyEvent, "isToastReadyEvent");
function createLegacyGlobalConfigWarningController() {
  let pending = false;
  let logged = false;
  let retryStarted = false;
  return {
    markPending(logger) {
      if (pending) {
        return;
      }
      pending = true;
      if (!logged) {
        logged = true;
        logger.warn("Legacy global opencode-models-discovery config was detected but is ignored in v1.0.0. Use provider.<name>.options.modelsDiscovery instead.", {
          migrationCommand: "/models-discovery:migrate",
          ignoredSince: "v1.0.0"
        });
      }
    },
    startRetries(toastNotifier) {
      if (!pending || retryStarted) {
        return;
      }
      retryStarted = true;
      const runAttempt = /* @__PURE__ */ __name((index) => {
        const delayMs = TOAST_RETRY_DELAYS_MS[index];
        const timer = setTimeout(() => {
          if (!pending) {
            return;
          }
          toastNotifier.warning(LEGACY_GLOBAL_CONFIG_WARNING, "Discovery Config Migration", 8e3).catch(() => {
          });
          if (index + 1 < TOAST_RETRY_DELAYS_MS.length) {
            runAttempt(index + 1);
            return;
          }
          pending = false;
        }, delayMs);
        timer.unref?.();
      }, "runAttempt");
      runAttempt(0);
    }
  };
}
__name(createLegacyGlobalConfigWarningController, "createLegacyGlobalConfigWarningController");

// src/plugin/event-hook.ts
function createEventHook(toastNotifier, legacyGlobalConfigWarning, logger) {
  return async ({ event }) => {
    const validation = validateHookInput("event", { event });
    if (!validation.isValid) {
      logger.error("Invalid event input", { errors: validation.errors });
      return;
    }
    if (isToastReadyEvent(event)) {
      legacyGlobalConfigWarning.startRetries(toastNotifier);
      return;
    }
    if (event.type === "session.created" || event.type === "session.updated") {
    }
  };
}
__name(createEventHook, "createEventHook");

// src/plugin/logger.ts
var SERVICE_NAME = "opencode-models-discovery";
function getConsoleMethod(level) {
  if (level === "error") {
    return console.error;
  }
  if (level === "warn") {
    return console.warn;
  }
  if (level === "debug") {
    return console.debug;
  }
  return console.info;
}
__name(getConsoleMethod, "getConsoleMethod");
function mergeExtra(baseExtra, extra) {
  const merged = {
    ...baseExtra,
    ...extra
  };
  return Object.keys(merged).length > 0 ? merged : void 0;
}
__name(mergeExtra, "mergeExtra");
function fallbackToConsole(level, message, extra) {
  const log = getConsoleMethod(level);
  const prefix = `[${SERVICE_NAME}] ${message}`;
  if (extra && Object.keys(extra).length > 0) {
    log(prefix, extra);
    return;
  }
  log(prefix);
}
__name(fallbackToConsole, "fallbackToConsole");
function createPluginLogger(client, baseExtra = {}) {
  const log = /* @__PURE__ */ __name((level, message, extra) => {
    const mergedExtra = mergeExtra(baseExtra, extra);
    try {
      if (client?.app?.log) {
        void client.app.log({
          body: {
            service: SERVICE_NAME,
            level,
            message,
            extra: mergedExtra
          }
        }).catch(() => {
          fallbackToConsole(level, message, mergedExtra);
        });
        return;
      }
    } catch {
    }
    fallbackToConsole(level, message, mergedExtra);
  }, "log");
  return {
    debug(message, extra) {
      log("debug", message, extra);
    },
    info(message, extra) {
      log("info", message, extra);
    },
    warn(message, extra) {
      log("warn", message, extra);
    },
    error(message, extra) {
      log("error", message, extra);
    },
    child(extra) {
      return createPluginLogger(client, mergeExtra(baseExtra, extra) || {});
    }
  };
}
__name(createPluginLogger, "createPluginLogger");

// src/plugin/index.ts
var ModelDiscoveryPlugin = /* @__PURE__ */ __name(async (input, options) => {
  const { client } = input;
  const logger = createPluginLogger(client, { category: "plugin" });
  if (!client || typeof client !== "object") {
    logger.error("Invalid client provided to plugin");
    return {
      config: /* @__PURE__ */ __name(async () => {
      }, "config"),
      event: /* @__PURE__ */ __name(async () => {
      }, "event")
    };
  }
  logger.info("Model discovery plugin initialized");
  logger.info("Running through the OpenCode v1 legacy adapter; OpenCode v2 is the primary supported integration.", {
    adapter: "v1-legacy",
    supportPolicy: "legacy"
  });
  const pluginConfig = parsePluginConfig(options || {});
  if (pluginConfig.discovery?.enabled === false) {
    logger.info("Discovery disabled by configuration", { category: "config" });
  }
  const toastNotifier = new ToastNotifier(client);
  const legacyGlobalConfigWarning = createLegacyGlobalConfigWarningController();
  return {
    config: createConfigHook(client, toastNotifier, pluginConfig, legacyGlobalConfigWarning, logger.child({ category: "config" })),
    event: createEventHook(toastNotifier, legacyGlobalConfigWarning, logger.child({ category: "event" }))
  };
}, "ModelDiscoveryPlugin");

// src/v2/index.ts
import { Plugin } from "@opencode/plugin";

// src/v2/catalog.ts
import { Model, Provider } from "@opencode/plugin";
function copyInventory(inventory) {
  return new Map([...inventory].map(([providerID, models]) => [providerID, new Map(models)]));
}
__name(copyInventory, "copyInventory");
function createProviderController(ctx, configured, integrationID2) {
  let inventory = /* @__PURE__ */ new Map();
  const transform = /* @__PURE__ */ __name((editor) => {
    for (const provider of configured) {
      const providerID = Provider.ID.make(provider.id);
      const targetIntegrationID = provider.settings.integrationID ?? integrationID2(provider.id);
      const current = editor.get(providerID);
      const authHeaders = provider.apiKey ? { authorization: `Bearer ${provider.apiKey}` } : void 0;
      if (!current) {
        editor.add({
          info: {
            ...Provider.Info.empty(providerID),
            name: provider.name ?? provider.id,
            package: provider.package,
            headers: authHeaders,
            integrationID: targetIntegrationID,
            activation: "enabled"
          },
          models: []
        });
      } else {
        const needsIntegration = !current.provider?.integrationID;
        const hasExistingAuthHeader = Boolean(current.provider?.headers?.authorization);
        const needsHeaders = Boolean(authHeaders) || hasExistingAuthHeader;
        if (needsIntegration || needsHeaders) {
          editor.update(providerID, (draft) => {
            if (needsIntegration) {
              draft.integrationID = targetIntegrationID;
            }
            if (authHeaders) {
              draft.headers = {
                ...draft.headers,
                ...authHeaders
              };
            } else if (draft.headers?.authorization) {
              const nextHeaders = { ...draft.headers };
              delete nextHeaders.authorization;
              draft.headers = nextHeaders;
            }
          });
        }
      }
      const models = inventory.get(provider.id);
      if (!models) continue;
      const source = editor.get(providerID);
      const existing = source ? [...source.models.values()] : [];
      const existingIDs = new Set(existing.map((model) => String(model.id)));
      editor.models.set(providerID, [
        ...existing,
        ...[...models.values()].filter((model) => !existingIDs.has(model.id)).map((model) => Object.assign(
          Model.Info.default(providerID, Model.ID.make(model.modelID)),
          model
        ))
      ]);
    }
  }, "transform");
  return {
    transform,
    async replaceInventory(next) {
      inventory = copyInventory(next);
      await ctx.provider.reload();
    },
    status() {
      return {
        providers: inventory.size,
        models: [...inventory.values()].reduce((total, models) => total + models.size, 0)
      };
    },
    getInventory() {
      return copyInventory(inventory);
    }
  };
}
__name(createProviderController, "createProviderController");

// src/v2/discovery.ts
var defaultLogger = {
  warn(message, context) {
    if (context && Object.keys(context).length > 0) {
      console.warn(`[opencode-models-discovery] ${message}`, context);
    } else {
      console.warn(`[opencode-models-discovery] ${message}`);
    }
  },
  info(message, context) {
    if (context && Object.keys(context).length > 0) {
      console.info(`[opencode-models-discovery] ${message}`, context);
    } else {
      console.info(`[opencode-models-discovery] ${message}`);
    }
  }
};
function cachedEnricher(enrichments) {
  return {
    enrich(model) {
      return enrichments[model.id] ?? {};
    }
  };
}
__name(cachedEnricher, "cachedEnricher");
async function discoverInventory(providers, discovery, fetcher = fetch, storage, options) {
  const inventory = /* @__PURE__ */ new Map();
  const logger = options?.logger ?? defaultLogger;
  await Promise.all(providers.map(async (provider) => {
    const config = discovery.get(provider.id);
    if (!config) return;
    const baseURL = typeof provider.settings.baseURL === "string" ? provider.settings.baseURL : void 0;
    if (!baseURL) {
      logger.warn(`Model discovery skipped for provider "${provider.id}": missing or invalid settings.baseURL`, {
        provider: provider.id
      });
      return;
    }
    const cacheConfig = config.cache;
    const cacheSupported = cacheConfig?.enabled === true && storage !== void 0;
    const cacheReadable = cacheSupported && options?.force !== true;
    const endpoint = config.endpoint;
    let cached;
    if (cacheReadable) {
      cached = await readDiscoveryCache(storage, discoveryCacheKey("opencode.models-discovery.v2", provider.id), {
        providerID: provider.id,
        baseURL,
        endpoint,
        modelInfoFormat: config.modelInfoFormat,
        modelInfoEndpoint: config.modelInfoEndpoint
      }, cacheConfig.ttlSeconds);
    }
    const resolvedApiKey = typeof provider.apiKey === "string" && provider.apiKey.trim().length > 0 ? provider.apiKey.trim() : typeof provider.settings.apiKey === "string" && provider.settings.apiKey.trim().length > 0 ? provider.settings.apiKey.trim() : void 0;
    const url = new URL(config.endpoint, new URL(baseURL).origin).toString();
    const headers = new Headers({ accept: "application/json" });
    if (resolvedApiKey) headers.set("authorization", `Bearer ${resolvedApiKey}`);
    try {
      let rawModels;
      let enricher;
      if (cached) {
        rawModels = cached.rawModels;
        enricher = cachedEnricher(cached.enrichments);
      } else {
        const [modelsResponse, resolvedEnricher] = await Promise.all([
          fetcher(url, {
            headers,
            signal: AbortSignal.timeout(config.timeoutMs)
          }),
          resolveModelInfoEnricher({
            baseURL,
            apiKey: resolvedApiKey,
            providerName: provider.id,
            fetcher,
            logger: {
              warn: /* @__PURE__ */ __name((message, context) => logger.warn(message, context), "warn"),
              info: /* @__PURE__ */ __name((message, context) => logger.info?.(message, context), "info")
            }
          }, {
            format: config.modelInfoFormat,
            endpoint: config.modelInfoEndpoint,
            filterNonChat: config.filterNonChat,
            timeoutMs: config.timeoutMs
          })
        ]);
        if (!modelsResponse.ok) {
          logger.warn(`Model discovery request failed for provider "${provider.id}"`, {
            provider: provider.id,
            url,
            status: modelsResponse.status,
            statusText: modelsResponse.statusText
          });
          return;
        }
        const payload = await modelsResponse.json();
        if (!Array.isArray(payload?.data)) {
          logger.warn(`Model discovery returned invalid payload for provider "${provider.id}": expected array in "data" property`, {
            provider: provider.id,
            url,
            payloadType: typeof payload,
            keys: payload && typeof payload === "object" && !Array.isArray(payload) ? Object.keys(payload) : void 0
          });
          return;
        }
        rawModels = payload.data;
        enricher = resolvedEnricher;
      }
      if (!cached) {
        await prepareModelEnricher(
          enricher,
          rawModels.filter(isDiscoveredRawModel).map((model) => model.id)
        );
      }
      const enrichments = {};
      const recordingEnricher = enricher ? { enrich(model, context) {
        const result = enricher.enrich(model, context);
        if (!cached) enrichments[model.id] = result;
        return result;
      } } : void 0;
      const drafts = discoverModelDrafts(rawModels, {
        filter: {
          includeBy: config.includeBy.map((filter) => ({ ...filter, match: filter.match ? new RegExp(filter.match) : void 0 })),
          excludeBy: config.excludeBy.map((filter) => ({ ...filter, match: filter.match ? new RegExp(filter.match) : void 0 })),
          includeRegex: config.includeRegex,
          excludeRegex: config.excludeRegex
        },
        smartModelName: config.smartModelName,
        enricher: recordingEnricher,
        enrichmentContext: { filterNonChat: config.filterNonChat }
      });
      const models = new Map(drafts.map((draft) => [draft.id, mapToDiscoveredV2Model(draft, config)]));
      inventory.set(provider.id, models);
      if (cacheSupported && !cached) {
        await writeDiscoveryCache(storage, discoveryCacheKey("opencode.models-discovery.v2", provider.id), createDiscoveryCacheEntry({
          providerID: provider.id,
          baseURL,
          endpoint,
          modelInfoFormat: config.modelInfoFormat,
          modelInfoEndpoint: config.modelInfoEndpoint
        }, rawModels.filter(
          (model) => !!model && typeof model === "object" && !Array.isArray(model) && typeof model.id === "string"
        ), enrichments));
      }
    } catch (error) {
      logger.warn(`Model discovery error for provider "${provider.id}"`, {
        provider: provider.id,
        url,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }));
  return inventory;
}
__name(discoverInventory, "discoverInventory");

// src/v2/provider-config.ts
function object2(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : void 0;
}
__name(object2, "object");
function regexes(value) {
  if (!Array.isArray(value)) return [];
  return value.flatMap((pattern) => {
    if (typeof pattern !== "string") return [];
    try {
      return [new RegExp(pattern)];
    } catch {
      return [];
    }
  });
}
__name(regexes, "regexes");
function filters(value) {
  if (!Array.isArray(value)) return [];
  const result = [];
  for (const filter of value) {
    const entry = object2(filter);
    if (!entry || typeof entry.field !== "string") continue;
    if (typeof entry.match === "string") {
      try {
        new RegExp(entry.match);
        result.push({ field: entry.field, match: entry.match });
      } catch {
        continue;
      }
      continue;
    }
    if (entry.equals === null || ["string", "number", "boolean"].includes(typeof entry.equals)) {
      result.push({ field: entry.field, equals: entry.equals });
    }
  }
  return result;
}
__name(filters, "filters");
function isModelInfoFormat(value) {
  return Object.values(ModelInfoFormat).includes(value);
}
__name(isModelInfoFormat, "isModelInfoFormat");
function parseProviderDiscoveryOptions(raw) {
  const value = object2(raw);
  if (!value) return void 0;
  if (value.enabled !== true) return void 0;
  const models = object2(value.models);
  const endpoint = typeof value.endpoint === "string" && value.endpoint.startsWith("/") ? value.endpoint : "/v1/models";
  const timeoutMs = typeof value.timeoutMs === "number" && Number.isFinite(value.timeoutMs) && value.timeoutMs > 0 ? Math.max(1e3, Math.floor(value.timeoutMs)) : 5e3;
  const modelInfoFormat = isModelInfoFormat(value.modelInfoFormat) ? value.modelInfoFormat : void 0;
  const modelInfoEndpoint = typeof value.modelInfoEndpoint === "string" && value.modelInfoEndpoint.trim().length > 0 ? value.modelInfoEndpoint.trim() : void 0;
  const filterNonChat = typeof value.filterNonChat === "boolean" ? value.filterNonChat : true;
  const cacheValue = object2(value.cache);
  const cache = cacheValue?.enabled === true ? {
    enabled: true,
    ttlSeconds: typeof cacheValue.ttlSeconds === "number" && Number.isFinite(cacheValue.ttlSeconds) && cacheValue.ttlSeconds > 0 ? cacheValue.ttlSeconds : 86400
  } : void 0;
  return {
    enabled: true,
    endpoint,
    timeoutMs,
    includeRegex: regexes(models?.includeRegex),
    excludeRegex: regexes(models?.excludeRegex),
    includeBy: filters(models?.includeBy),
    excludeBy: filters(models?.excludeBy),
    smartModelName: value.smartModelName === true,
    modelInfoFormat,
    modelInfoEndpoint,
    filterNonChat,
    cache
  };
}
__name(parseProviderDiscoveryOptions, "parseProviderDiscoveryOptions");

// src/v2/tools.ts
function formatRefreshResult(result) {
  return `Model discovery refreshed: discovered ${result.models} models from ${result.providers} providers.`;
}
__name(formatRefreshResult, "formatRefreshResult");
function formatRefreshFailure(error) {
  const message = error instanceof Error ? error.message : error && typeof error === "object" && "message" in error ? String(error.message) : String(error);
  return `Model discovery refresh failed: ${message}`;
}
__name(formatRefreshFailure, "formatRefreshFailure");
function formatStatusReport(providers, options) {
  const filtered = options?.providerID ? providers.filter((p) => p.id === options.providerID) : providers;
  const totalModels = filtered.reduce((sum, p) => sum + p.models.length, 0);
  const totalProviders = filtered.length;
  const lines = [
    `Current discovery inventory has ${totalModels} models from ${totalProviders} providers.`
  ];
  if (filtered.length === 0) {
    if (options?.providerID) {
      lines.push(`
Provider "${options.providerID}" not found in discovered inventory.`);
    }
    return lines.join("\n");
  }
  for (const provider of filtered) {
    lines.push(`
### Provider: \`${provider.id}\`${provider.name ? ` (${provider.name})` : ""}`);
    lines.push(`- Discovery: ${provider.enabled ? "enabled" : "disabled"}`);
    if (provider.cacheConfig?.enabled) {
      const cacheStatus = provider.storageCache?.exists ? `${provider.storageCache.fresh ? "fresh" : "expired"} (fetched at ${provider.storageCache.fetchedAt ?? "unknown"}, ${provider.storageCache.rawModelCount ?? 0} raw models)` : "no storage cache entry";
      lines.push(`- Cache: enabled (TTL: ${provider.cacheConfig.ttlSeconds}s) | Storage: ${cacheStatus}`);
    } else {
      lines.push(`- Cache: disabled`);
    }
    lines.push(`- Discovered models count: ${provider.models.length}`);
    const showDetails = options?.details === true || Boolean(options?.providerID);
    if (showDetails && provider.models.length > 0) {
      lines.push(`
  Models:`);
      for (const model of provider.models) {
        const contextStr = model.limit?.context ? model.limit.context.toLocaleString() : "unknown";
        const outputStr = model.limit?.output ? model.limit.output.toLocaleString() : "unknown";
        const toolsStr = model.capabilities?.tools ? "tools: yes" : "tools: no";
        const reasoningStr = model.reasoning ? ", reasoning: yes" : "";
        lines.push(`  - \`${model.id}\` (${model.name}): context limit: ${contextStr}, output limit: ${outputStr} (${toolsStr}${reasoningStr})`);
      }
    }
    if (options?.rawCache === true && provider.storageCache?.exists) {
      lines.push(`
  Storage Raw Cache:`);
      const rawPayload = {
        fetchedAt: provider.storageCache.fetchedAt,
        fresh: provider.storageCache.fresh,
        rawModels: provider.storageCache.rawModels,
        enrichments: provider.storageCache.enrichments
      };
      lines.push("```json");
      lines.push(JSON.stringify(rawPayload, null, 2));
      lines.push("```");
    }
  }
  return lines.join("\n");
}
__name(formatStatusReport, "formatStatusReport");
var statusInputSchema = {
  type: "object",
  properties: {
    providerID: {
      type: "string",
      description: "Optional provider ID to inspect a specific provider."
    },
    details: {
      type: "boolean",
      description: "Whether to list discovered models with their limits (context, output) and capabilities."
    },
    rawCache: {
      type: "boolean",
      description: "Whether to inspect raw cached models and enrichments from storage."
    }
  },
  additionalProperties: false
};
var noInput = {
  type: "object",
  properties: {},
  additionalProperties: false
};
async function registerDiscoveryTools(ctx, refresh, status) {
  await ctx.tool.transform((tools) => {
    tools.add({
      name: "models_discovery_refresh",
      description: "Refresh models discovered from configured OpenAI-compatible providers.",
      input: noInput,
      execute: /* @__PURE__ */ __name(async () => {
        try {
          const result = await refresh();
          return { content: formatRefreshResult(result) };
        } catch (error) {
          return { content: formatRefreshFailure(error) };
        }
      }, "execute")
    });
    tools.add({
      name: "models_discovery_status",
      description: "Show the current OpenAI-compatible model discovery inventory, with options to inspect limits and storage cache.",
      input: statusInputSchema,
      execute: /* @__PURE__ */ __name(async (input) => {
        const typedInput = input && typeof input === "object" ? input : void 0;
        const result = await status(typedInput);
        if (typeof result === "string") {
          return { content: result };
        }
        return { content: `Current discovery inventory has ${result.models} models from ${result.providers} providers.` };
      }, "execute")
    });
  });
}
__name(registerDiscoveryTools, "registerDiscoveryTools");

// src/v2/storage-cache.ts
function createV2StorageCache(storage) {
  return {
    get: storage.get,
    set: storage.set,
    remove: storage.remove
  };
}
__name(createV2StorageCache, "createV2StorageCache");

// src/v2/credential-resolver.ts
async function resolveProviderCredential(ctx, provider, defaultIntegrationID) {
  if (typeof provider.settings.apiKey === "string" && provider.settings.apiKey.trim().length > 0) {
    return provider.settings.apiKey.trim();
  }
  if (typeof provider.apiKey === "string" && provider.apiKey.trim().length > 0) {
    return provider.apiKey.trim();
  }
  const integration = ctx.integration;
  if (!integration?.connection?.active || !integration?.connection?.resolve) {
    return void 0;
  }
  const candidates = [];
  if (typeof provider.settings.integrationID === "string" && provider.settings.integrationID.trim().length > 0) {
    candidates.push(provider.settings.integrationID.trim());
  }
  if (defaultIntegrationID) {
    const defId = defaultIntegrationID(provider.id);
    if (!candidates.includes(defId)) candidates.push(defId);
  }
  if (!candidates.includes(provider.id)) {
    candidates.push(provider.id);
  }
  for (const id of candidates) {
    try {
      const connection = await integration.connection.active(id);
      if (!connection) continue;
      if (connection.type === "env" && typeof connection.name === "string") {
        const envVal = process.env[connection.name];
        if (typeof envVal === "string" && envVal.trim().length > 0) {
          return envVal.trim();
        }
      }
      const credential = await integration.connection.resolve(connection);
      if (credential?.type === "key" && typeof credential.key === "string" && credential.key.trim().length > 0) {
        return credential.key.trim();
      }
      if (credential?.type === "oauth" && typeof credential.access === "string" && credential.access.trim().length > 0) {
        return credential.access.trim();
      }
    } catch {
    }
  }
  return void 0;
}
__name(resolveProviderCredential, "resolveProviderCredential");

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

// src/v2/overrides.ts
var OVERRIDE_PREFIX = "overrides:";
var SENSITIVE_KEYS = /(?:api[_-]?key|authorization|headers?|token|password|secret|credential)/i;
function key(providerID, modelID) {
  return `${OVERRIDE_PREFIX}${providerID}:${modelID}`;
}
__name(key, "key");
function isRecord3(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
__name(isRecord3, "isRecord");
function assertNoSensitiveFields(value, path3) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoSensitiveFields(item, `${path3}[${index}]`));
    return;
  }
  if (!isRecord3(value)) return;
  for (const [field, child] of Object.entries(value)) {
    if (SENSITIVE_KEYS.test(field)) throw new Error(`Override field is not allowed: ${path3}.${field}`);
    assertNoSensitiveFields(child, `${path3}.${field}`);
  }
}
__name(assertNoSensitiveFields, "assertNoSensitiveFields");
function validatePatch(value, path3 = "patch") {
  if (!isRecord3(value) || Object.keys(value).length === 0) {
    throw new Error("Override patch must be a non-empty object");
  }
  assertNoSensitiveFields(value, path3);
  const allowed = /* @__PURE__ */ new Set(["name", "limit", "capabilities", "reasoning", "attachment", "cost", "compatibility", "variants"]);
  for (const [field, item] of Object.entries(value)) {
    if (!allowed.has(field)) throw new Error(`Unsupported override field: ${path3}.${field}`);
    if (["name"].includes(field) && typeof item !== "string") {
      throw new Error(`${path3}.${field} must be a string`);
    }
    if (["reasoning", "attachment"].includes(field) && typeof item !== "boolean") {
      throw new Error(`${path3}.${field} must be a boolean`);
    }
    if (["limit", "capabilities", "compatibility"].includes(field) && !isRecord3(item)) {
      throw new Error(`${path3}.${field} must be an object`);
    }
    if (field === "limit") {
      for (const [limitKey, limitValue] of Object.entries(item)) {
        if (!(limitKey === "context" || limitKey === "output" || limitKey === "input") || typeof limitValue !== "number" || !Number.isFinite(limitValue) || limitValue <= 0) {
          throw new Error(`${path3}.limit.${limitKey} must be a positive number`);
        }
      }
    }
    if (field === "capabilities") {
      for (const [capability, capabilityValue] of Object.entries(item)) {
        if (capability === "tools" && typeof capabilityValue !== "boolean") throw new Error(`${path3}.capabilities.tools must be a boolean`);
        if ((capability === "input" || capability === "output") && (!Array.isArray(capabilityValue) || !capabilityValue.every((entry) => typeof entry === "string"))) {
          throw new Error(`${path3}.capabilities.${capability} must be an array of strings`);
        }
        if (!(capability === "tools" || capability === "input" || capability === "output")) throw new Error(`${path3}.capabilities.${capability} is not supported`);
      }
    }
    if (field === "variants" && !Array.isArray(item)) throw new Error(`${path3}.variants must be an array`);
    if (field === "cost" && !Array.isArray(item) && !isRecord3(item)) throw new Error(`${path3}.cost must be an object or array`);
  }
  return structuredClone(value);
}
__name(validatePatch, "validatePatch");
function validStored(value) {
  if (!isRecord3(value) || value.version !== 1 || typeof value.providerID !== "string" || typeof value.modelID !== "string" || typeof value.enabled !== "boolean" || typeof value.updatedAt !== "string") return false;
  try {
    validatePatch(value.patch);
    return true;
  } catch {
    return false;
  }
}
__name(validStored, "validStored");
async function listModelOverrides(storage, providerID) {
  if (!storage || typeof storage.scan !== "function") return [];
  const result = await storage.scan({ prefix: providerID ? `${OVERRIDE_PREFIX}${providerID}:` : OVERRIDE_PREFIX });
  return result.entries.flatMap((entry) => validStored(entry.value) ? [entry.value] : []);
}
__name(listModelOverrides, "listModelOverrides");
async function setModelOverride(storage, input) {
  if (!storage) throw new Error("V2 storage is unavailable; model overrides cannot be persisted");
  if (!input.providerID || !input.modelID) throw new Error("providerID and modelID are required");
  const override = {
    version: 1,
    providerID: input.providerID,
    modelID: input.modelID,
    patch: validatePatch(input.patch),
    enabled: input.enabled ?? true,
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  await storage.set(key(input.providerID, input.modelID), override);
  return override;
}
__name(setModelOverride, "setModelOverride");
async function deleteModelOverride(storage, providerID, modelID) {
  if (!storage) throw new Error("V2 storage is unavailable; model overrides cannot be persisted");
  const storageKey = key(providerID, modelID);
  const existing = await storage.get(storageKey);
  await storage.remove(storageKey);
  return existing !== void 0;
}
__name(deleteModelOverride, "deleteModelOverride");
function mergeValue(base, patch) {
  if (!isRecord3(base) || !isRecord3(patch)) return structuredClone(patch);
  const result = { ...base };
  for (const [field, value] of Object.entries(patch)) result[field] = mergeValue(result[field], value);
  return result;
}
__name(mergeValue, "mergeValue");
function applyModelOverride(model, override) {
  if (!override?.enabled) return model;
  return mergeValue(model, override.patch);
}
__name(applyModelOverride, "applyModelOverride");

// src/v2/index.ts
function integrationID(providerID) {
  return providerID;
}
__name(integrationID, "integrationID");
function providerList(value) {
  const entries = Array.isArray(value) ? value : value && typeof value === "object" && Array.isArray(value.data) ? value.data : [];
  return entries.flatMap((entry) => {
    if (!entry || typeof entry !== "object") return [];
    const record2 = entry;
    const provider = record2.provider && typeof record2.provider === "object" ? record2.provider : entry;
    return [provider];
  });
}
__name(providerList, "providerList");
async function configuredProviders(ctx) {
  const fromList = /* @__PURE__ */ __name((listed) => {
    const providers = [];
    const discovery = /* @__PURE__ */ new Map();
    for (const entry of listed) {
      if (typeof entry.id !== "string" || typeof entry.package !== "string") continue;
      if (!entry.settings || typeof entry.settings !== "object" || Array.isArray(entry.settings)) continue;
      const settings = entry.settings;
      const parsed = parseProviderDiscoveryOptions(settings.modelsDiscovery);
      if (!parsed) continue;
      providers.push({
        id: entry.id,
        name: typeof entry.name === "string" ? entry.name : void 0,
        package: entry.package,
        settings
      });
      discovery.set(entry.id, parsed);
    }
    return { providers, discovery };
  }, "fromList");
  const listInput = ctx.location ? { location: ctx.location } : void 0;
  try {
    let configured = fromList(providerList(await ctx.provider.list(listInput)));
    if (configured.providers.length === 0) {
      await ctx.provider.reload();
      configured = fromList(providerList(await ctx.provider.list(listInput)));
    }
    if (configured.providers.length > 0) return configured;
  } catch {
  }
  return { providers: [], discovery: /* @__PURE__ */ new Map() };
}
__name(configuredProviders, "configuredProviders");
async function resolveProviderCredentials(ctx, providers) {
  return Promise.all(providers.map(async (provider) => {
    const apiKey = await resolveProviderCredential(ctx, provider, integrationID);
    return { ...provider, apiKey };
  }));
}
__name(resolveProviderCredentials, "resolveProviderCredentials");
async function setupV2(ctx) {
  const providers = [];
  const discovery = /* @__PURE__ */ new Map();
  const controller = createProviderController(ctx, providers, integrationID);
  let baselineInventory = /* @__PURE__ */ new Map();
  let transformsRegistration;
  const ensureTransformsRegistered = /* @__PURE__ */ __name(async () => {
    if (!transformsRegistration) {
      transformsRegistration = Promise.all([
        ctx.integration.transform((draft) => {
          for (const provider of providers) {
            const id = provider.settings.integrationID ?? integrationID(provider.id);
            if (!draft.get(id)) {
              draft.update(id, (current) => {
                current.id = id;
                current.name = provider.name ?? provider.id;
              });
            }
            draft.method.update({
              integrationID: id,
              method: { type: "key", label: "API key" }
            });
          }
        }),
        ctx.provider.transform(controller.transform)
      ]).then(async () => {
        try {
          await ctx.integration.reload();
        } catch {
        }
      });
    }
    await transformsRegistration;
  }, "ensureTransformsRegistered");
  const syncConfiguredProviders = /* @__PURE__ */ __name(async () => {
    const configured = await configuredProviders(ctx);
    providers.splice(0, providers.length, ...configured.providers);
    discovery.clear();
    for (const [id, options] of configured.discovery) discovery.set(id, options);
    await ensureTransformsRegistered();
    return configured.providers.length > 0;
  }, "syncConfiguredProviders");
  const refreshInventoryInternal = /* @__PURE__ */ __name(async (force) => {
    const resolved = await resolveProviderCredentials(ctx, providers);
    providers.splice(0, providers.length, ...resolved);
    const discoveredInventory = await discoverInventory(
      resolved,
      discovery,
      fetch,
      ctx.storage ? createV2StorageCache(ctx.storage) : void 0,
      { force }
    );
    const previousInventory = controller.getInventory();
    const inventory = /* @__PURE__ */ new Map();
    for (const provider of resolved) {
      const discovered = discoveredInventory.get(provider.id);
      if (discovered) {
        inventory.set(provider.id, discovered);
        baselineInventory.set(provider.id, new Map(discovered));
      } else {
        inventory.set(provider.id, previousInventory.get(provider.id) ?? /* @__PURE__ */ new Map());
      }
    }
    for (const providerID of [...baselineInventory.keys()]) {
      if (!resolved.some((provider) => provider.id === providerID)) baselineInventory.delete(providerID);
    }
    const storedOverrides = await listModelOverrides(ctx.storage);
    const overrideByModel = new Map(storedOverrides.map((override) => [`${override.providerID}:${override.modelID}`, override]));
    for (const [providerID, models] of inventory) {
      for (const [modelID, model] of models) {
        const override = overrideByModel.get(`${providerID}:${modelID}`) ?? overrideByModel.get(`${providerID}:${model.modelID}`);
        if (override) models.set(modelID, applyModelOverride(model, override));
      }
    }
    await controller.replaceInventory(inventory);
    return controller.status();
  }, "refreshInventoryInternal");
  let activeRefresh;
  let pendingRefreshForce = false;
  const refreshFromCurrentConfig = /* @__PURE__ */ __name((force, reloadProviderConfig = false) => {
    if (force) pendingRefreshForce = true;
    if (activeRefresh) {
      return activeRefresh.then(() => refreshFromCurrentConfig(pendingRefreshForce, reloadProviderConfig));
    }
    const runForce = force || pendingRefreshForce;
    pendingRefreshForce = false;
    activeRefresh = (async () => {
      try {
        if (reloadProviderConfig) await ctx.provider.reload();
        await syncConfiguredProviders();
        return await refreshInventoryInternal(runForce);
      } finally {
        activeRefresh = void 0;
      }
    })();
    return activeRefresh;
  }, "refreshFromCurrentConfig");
  const collectStatus = /* @__PURE__ */ __name(async (options) => {
    const inventory = controller.getInventory();
    const reports = [];
    const storageBackend = ctx.storage ? createV2StorageCache(ctx.storage) : void 0;
    for (const provider of providers) {
      const providerDiscoveryOptions = discovery.get(provider.id);
      const modelsMap = inventory.get(provider.id);
      const models = modelsMap ? [...modelsMap.values()] : [];
      const cacheConfig = providerDiscoveryOptions?.cache;
      let storageCacheInfo;
      if (storageBackend) {
        const cacheKey = discoveryCacheKey("opencode.models-discovery.v2", provider.id);
        try {
          const raw = await storageBackend.get(cacheKey);
          const entry = raw && typeof raw === "object" ? raw : void 0;
          if (entry && entry.version === 1) {
            const fetchedAt = typeof entry.fetchedAt === "string" ? entry.fetchedAt : void 0;
            const ttl = cacheConfig?.ttlSeconds ?? 86400;
            const fresh = fetchedAt ? isDiscoveryCacheFresh(fetchedAt, ttl) : false;
            const rawModels = Array.isArray(entry.rawModels) ? entry.rawModels : [];
            const enrichments = entry.enrichments && typeof entry.enrichments === "object" ? entry.enrichments : {};
            storageCacheInfo = {
              exists: true,
              fresh,
              fetchedAt,
              rawModelCount: rawModels.length,
              rawModels: options?.rawCache ? sanitizeSensitiveFields(rawModels) : void 0,
              enrichments: options?.rawCache ? sanitizeSensitiveFields(enrichments) : void 0
            };
          } else {
            storageCacheInfo = { exists: false, fresh: false };
          }
        } catch {
          storageCacheInfo = { exists: false, fresh: false };
        }
      }
      reports.push({
        id: provider.id,
        name: provider.name,
        enabled: providerDiscoveryOptions?.enabled ?? false,
        cacheConfig,
        storageCache: storageCacheInfo,
        models
      });
    }
    return options?.providerID ? reports.filter((provider) => provider.id === options.providerID) : reports;
  }, "collectStatus");
  const inspectStatus = /* @__PURE__ */ __name(async (options) => formatStatusReport(await collectStatus(options), options), "inspectStatus");
  await ensureTransformsRegistered();
  await registerDiscoveryTools(ctx, refreshFromCurrentConfig, inspectStatus);
  if (ctx.rpc && typeof ctx.rpc.register === "function") {
    await ctx.rpc.register(DiscoveryRpcDefinition, {
      status: /* @__PURE__ */ __name(async (rawInput) => {
        const input = rawInput;
        await syncConfiguredProviders();
        const reports = await collectStatus(input);
        const overrides = await listModelOverrides(ctx.storage, input?.providerID);
        const overrideByModel = new Map(overrides.map((override) => [`${override.providerID}:${override.modelID}`, override]));
        return {
          report: formatStatusReport(reports, input),
          providers: reports.map((provider) => ({
            id: provider.id,
            name: provider.name ?? provider.id,
            modelCount: provider.models.length,
            models: provider.models.map((model) => ({
              id: model.id,
              name: model.name,
              defaultValues: (() => {
                const baseline = baselineInventory.get(provider.id)?.get(model.id) ?? baselineInventory.get(provider.id)?.get(model.modelID);
                return baseline ? {
                  name: baseline.name,
                  limit: baseline.limit,
                  capabilities: baseline.capabilities,
                  ...baseline.reasoning !== void 0 ? { reasoning: baseline.reasoning } : {},
                  ...baseline.attachment !== void 0 ? { attachment: baseline.attachment } : {}
                } : void 0;
              })(),
              detail: [
                `Model: ${model.name}`,
                "",
                "Identity",
                `  Provider: ${provider.name ?? provider.id} (${provider.id})`,
                `  Model ID: ${model.id}`,
                `  API Model ID: ${model.modelID}`,
                "",
                "Limits",
                `  Context: ${model.limit.context.toLocaleString()}`,
                `  Output: ${model.limit.output.toLocaleString()}`,
                `  Input: ${model.limit.input?.toLocaleString() ?? "unknown"}`,
                "",
                "Capabilities",
                `  Tools: ${model.capabilities.tools ? "yes" : "no"}`,
                `  Reasoning: ${model.reasoning === void 0 ? "unknown" : model.reasoning ? "yes" : "no"}`,
                `  Attachments: ${model.attachment === void 0 ? "unknown" : model.attachment ? "yes" : "no"}`,
                `  Input: ${model.capabilities.input.join(", ") || "unknown"}`,
                `  Output: ${model.capabilities.output.join(", ") || "unknown"}`,
                `  Variants: ${model.variants?.map((variant) => variant.id).join(", ") || "none"}`,
                ...overrideByModel.has(`${provider.id}:${model.id}`) || overrideByModel.has(`${provider.id}:${model.modelID}`) ? ["", "Override", `  Updated: ${(overrideByModel.get(`${provider.id}:${model.id}`) ?? overrideByModel.get(`${provider.id}:${model.modelID}`))?.updatedAt ?? "unknown"}`, `  Fields: ${Object.keys((overrideByModel.get(`${provider.id}:${model.id}`) ?? overrideByModel.get(`${provider.id}:${model.modelID}`))?.patch ?? {}).join(", ")}`] : []
              ].join("\n"),
              ...overrideByModel.get(`${provider.id}:${model.id}`) ?? overrideByModel.get(`${provider.id}:${model.modelID}`) ? { override: overrideByModel.get(`${provider.id}:${model.id}`) ?? overrideByModel.get(`${provider.id}:${model.modelID}`) } : {}
            }))
          }))
        };
      }, "status"),
      refresh: /* @__PURE__ */ __name(async (rawInput) => {
        const input = rawInput;
        const result = await refreshFromCurrentConfig(input?.force === true);
        return { providers: result.providers, models: result.models };
      }, "refresh"),
      cacheInspect: /* @__PURE__ */ __name(async (rawInput) => {
        const input = rawInput;
        await syncConfiguredProviders();
        const storageBackend = ctx.storage ? createV2StorageCache(ctx.storage) : void 0;
        const targetProviders = input?.providerID ? providers.filter((p) => p.id === input.providerID) : providers;
        const entries = [];
        if (input?.providerID && targetProviders.length === 0) {
          if (storageBackend) {
            const cacheKey = discoveryCacheKey("opencode.models-discovery.v2", input.providerID);
            try {
              const raw = await storageBackend.get(cacheKey);
              const entry = raw && typeof raw === "object" ? raw : void 0;
              if (entry && entry.version === 1) {
                const fetchedAt = typeof entry.fetchedAt === "string" ? entry.fetchedAt : void 0;
                const rawModels = Array.isArray(entry.rawModels) ? entry.rawModels : [];
                entries.push({
                  providerID: input.providerID,
                  status: fetchedAt ? isDiscoveryCacheFresh(fetchedAt, 86400) ? "fresh" : "expired" : "expired",
                  fetchedAt,
                  ttlSeconds: 86400,
                  modelCount: rawModels.length
                });
              } else {
                entries.push({ providerID: input.providerID, status: entry ? "corrupt" : "empty" });
              }
            } catch {
              entries.push({ providerID: input.providerID, status: "corrupt" });
            }
          } else {
            entries.push({ providerID: input.providerID, status: "empty" });
          }
          return { entries };
        }
        for (const provider of targetProviders) {
          const providerDiscoveryOptions = discovery.get(provider.id);
          const cacheConfig = providerDiscoveryOptions?.cache;
          if (!storageBackend || !cacheConfig?.enabled) {
            entries.push({ providerID: provider.id, status: "empty" });
            continue;
          }
          const cacheKey = discoveryCacheKey("opencode.models-discovery.v2", provider.id);
          try {
            const raw = await storageBackend.get(cacheKey);
            const entry = raw && typeof raw === "object" ? raw : void 0;
            if (entry && entry.version === 1) {
              const fetchedAt = typeof entry.fetchedAt === "string" ? entry.fetchedAt : void 0;
              const ttl = cacheConfig.ttlSeconds ?? 86400;
              const fresh = fetchedAt ? isDiscoveryCacheFresh(fetchedAt, ttl) : false;
              const rawModels = Array.isArray(entry.rawModels) ? entry.rawModels : [];
              entries.push({
                providerID: provider.id,
                status: fresh ? "fresh" : "expired",
                fetchedAt,
                ttlSeconds: ttl,
                modelCount: rawModels.length
              });
            } else {
              entries.push({ providerID: provider.id, status: entry ? "corrupt" : "empty" });
            }
          } catch {
            entries.push({ providerID: provider.id, status: "corrupt" });
          }
        }
        return { entries };
      }, "cacheInspect"),
      cacheClear: /* @__PURE__ */ __name(async (rawInput) => {
        const input = rawInput;
        const storageBackend = ctx.storage ? createV2StorageCache(ctx.storage) : void 0;
        if (!storageBackend?.remove) return { cleared: 0 };
        await syncConfiguredProviders();
        let clearedCount = 0;
        const targetIDs = input?.providerID ? [input.providerID] : providers.map((p) => p.id);
        for (const providerID of targetIDs) {
          const cacheKey = discoveryCacheKey("opencode.models-discovery.v2", providerID);
          try {
            await storageBackend.remove(cacheKey);
            clearedCount++;
          } catch {
          }
        }
        return { cleared: clearedCount };
      }, "cacheClear"),
      overrideList: /* @__PURE__ */ __name(async (rawInput) => {
        const input = rawInput;
        return { overrides: await listModelOverrides(ctx.storage, input?.providerID) };
      }, "overrideList"),
      overrideSet: /* @__PURE__ */ __name(async (rawInput) => {
        const input = rawInput;
        const override = await setModelOverride(ctx.storage, input);
        await refreshFromCurrentConfig(true);
        return { success: true, override };
      }, "overrideSet"),
      overrideDelete: /* @__PURE__ */ __name(async (rawInput) => {
        const input = rawInput;
        const deleted = await deleteModelOverride(ctx.storage, input.providerID, input.modelID);
        await refreshFromCurrentConfig(true);
        return { success: deleted };
      }, "overrideDelete")
    });
  }
  await refreshFromCurrentConfig();
  const abort = new AbortController();
  if (providers.length === 0) {
    void (async () => {
      for (let attempt = 0; attempt < 10 && !abort.signal.aborted; attempt++) {
        await new Promise((resolve) => setTimeout(resolve, 250));
        const result = await refreshFromCurrentConfig();
        if (result.providers > 0) {
          break;
        }
      }
    })();
  }
  void (async () => {
    try {
      for await (const event of ctx.event.subscribe({ signal: abort.signal })) {
        if (event.type === "config.updated" || event.type === "credential.updated" || event.type === "credential.switched" || event.type === "integration.updated") {
          try {
            await refreshFromCurrentConfig(void 0, true);
          } catch {
            if (!abort.signal.aborted) {
            }
          }
        }
      }
    } catch {
      if (!abort.signal.aborted) {
      }
    }
  })();
  return () => abort.abort();
}
__name(setupV2, "setupV2");
var v2_default = Plugin.define({
  id: "opencode.models-discovery",
  setup: setupV2
});

// src/runtime.ts
var combinedPlugin = {
  ...Plugin2.define({
    id: "opencode.models-discovery",
    setup: setupV2
  }),
  server: ModelDiscoveryPlugin
};
export {
  ModelDiscoveryPlugin,
  combinedPlugin,
  setupV2
};
//# sourceMappingURL=runtime.js.map
