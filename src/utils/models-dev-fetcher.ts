export interface ModelsDevReasoningOption {
  type: string
  values?: string[]
}

export interface ModelsDevPrices {
  input?: number
  output?: number
  cache_read?: number
  cache_write?: number
}

export interface ModelsDevCost extends ModelsDevPrices {
  input: number
  output: number
  tiers?: Array<ModelsDevPrices & { tier: { type: 'context', size: number } }>
}

export interface ModelsDevModel {
  id: string
  name?: string
  attachment?: boolean
  reasoning?: boolean
  reasoning_options?: ModelsDevReasoningOption[]
  cost?: ModelsDevCost
  tool_call?: boolean
  structured_output?: boolean
  temperature?: boolean
  modalities?: {
    input?: string[]
    output?: string[]
  }
  limit?: {
    context?: number
    input?: number
    output?: number
  }
}

export const DEFAULT_MODELS_DEV_URL = 'https://models.dev/models.json'
// models.json says whether a model reasons, but not at which effort levels or prices; only api.json lists them.
// api.json can't replace it: many providers list the same model there, so a bare model id becomes ambiguous.
export const MODELS_DEV_CATALOG_URL = 'https://models.dev/api.json'
const MODELS_DEV_TIMEOUT_MS = 3000
// api.json is about ten times the size of models.json.
const MODELS_DEV_CATALOG_TIMEOUT_MS = 8000
const PREFIX_MATCH_MIN_SCORE = 70
const PREFIX_MATCH_MIN_SHARED_PARTS = 2

const modelsDevCaches = new Map<string, Map<string, ModelsDevModel>>()

function isObject(value: unknown): value is Record<string, any> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function toModelId(providerId: string | undefined, modelId: string): string {
  return providerId ? `${providerId}/${modelId}` : modelId
}

function parseReasoningOptions(value: unknown): ModelsDevReasoningOption[] | undefined {
  if (!Array.isArray(value)) {
    return undefined
  }

  const options = value
    .filter((option): option is Record<string, any> => isObject(option) && typeof option.type === 'string')
    .map((option): ModelsDevReasoningOption => ({
      type: option.type,
      ...(Array.isArray(option.values)
        ? { values: option.values.filter((item: unknown): item is string => typeof item === 'string') }
        : {}),
    }))

  return options.length > 0 ? options : undefined
}

function parsePrices(value: Record<string, any>): ModelsDevPrices {
  const prices: ModelsDevPrices = {}
  for (const key of ['input', 'output', 'cache_read', 'cache_write'] as const) {
    if (typeof value[key] === 'number' && Number.isFinite(value[key]) && value[key] >= 0) {
      prices[key] = value[key]
    }
  }
  return prices
}

function parseCost(value: unknown): ModelsDevCost | undefined {
  if (!isObject(value)) {
    return undefined
  }

  const { input, output, ...cache } = parsePrices(value)
  if (input === undefined || output === undefined) {
    return undefined
  }

  // Only context tiers: OpenCode's cost has no place for other conditions, such as the service tier.
  const tiers = (Array.isArray(value.tiers) ? value.tiers : []).flatMap((tier: unknown) => {
    if (!isObject(tier) || !isObject(tier.tier) || tier.tier.type !== 'context' || typeof tier.tier.size !== 'number') {
      return []
    }
    return [{ ...parsePrices(tier), tier: { type: 'context' as const, size: tier.tier.size } }]
  })

  return { input, output, ...cache, ...(tiers.length > 0 ? { tiers } : {}) }
}

function addModel(cache: Map<string, ModelsDevModel>, providerId: string | undefined, rawModel: Record<string, any>, fallbackModelId?: string): void {
  const rawId = typeof rawModel.id === 'string' && rawModel.id.length > 0 ? rawModel.id : fallbackModelId
  if (!rawId) {
    return
  }

  const id = rawId.includes('/') ? rawId : toModelId(providerId, rawId)
  cache.set(id, {
    id,
    name: typeof rawModel.name === 'string' ? rawModel.name : undefined,
    attachment: typeof rawModel.attachment === 'boolean' ? rawModel.attachment : undefined,
    reasoning: typeof rawModel.reasoning === 'boolean' ? rawModel.reasoning : undefined,
    reasoning_options: parseReasoningOptions(rawModel.reasoning_options),
    cost: parseCost(rawModel.cost),
    tool_call: typeof rawModel.tool_call === 'boolean' ? rawModel.tool_call : undefined,
    structured_output: typeof rawModel.structured_output === 'boolean' ? rawModel.structured_output : undefined,
    temperature: typeof rawModel.temperature === 'boolean' ? rawModel.temperature : undefined,
    modalities: isObject(rawModel.modalities) ? {
      input: Array.isArray(rawModel.modalities.input) ? rawModel.modalities.input.filter((item: unknown): item is string => typeof item === 'string') : undefined,
      output: Array.isArray(rawModel.modalities.output) ? rawModel.modalities.output.filter((item: unknown): item is string => typeof item === 'string') : undefined,
    } : undefined,
    limit: isObject(rawModel.limit) ? {
      context: typeof rawModel.limit.context === 'number' ? rawModel.limit.context : undefined,
      input: typeof rawModel.limit.input === 'number' ? rawModel.limit.input : undefined,
      output: typeof rawModel.limit.output === 'number' ? rawModel.limit.output : undefined,
    } : undefined,
  })
}

function parseModelsDevData(data: unknown): Map<string, ModelsDevModel> {
  const cache = new Map<string, ModelsDevModel>()

  if (!isObject(data)) {
    return cache
  }

  for (const [key, value] of Object.entries(data)) {
    if (!isObject(value)) {
      continue
    }

    if (isObject(value.models)) {
      for (const [modelId, model] of Object.entries(value.models)) {
        if (isObject(model)) {
          addModel(cache, key, model, modelId)
        }
      }
      continue
    }

    addModel(cache, undefined, value, key)
  }

  return cache
}

// Copies effort levels and prices onto models already in the index, using the provider that owns each model id.
function addCatalogDetails(models: Map<string, ModelsDevModel>, catalog: unknown): void {
  if (!isObject(catalog)) {
    return
  }

  for (const [id, model] of models) {
    const separator = id.indexOf('/')
    if (separator <= 0) {
      continue
    }

    const provider = catalog[id.slice(0, separator)]
    const entry = isObject(provider) && isObject(provider.models) ? provider.models[id.slice(separator + 1)] : undefined
    const options = isObject(entry) ? parseReasoningOptions(entry.reasoning_options) : undefined
    if (options) {
      model.reasoning_options = options
    }
    const cost = isObject(entry) ? parseCost(entry.cost) : undefined
    if (cost) {
      model.cost = cost
    }
  }
}

async function fetchJson(url: string, timeoutMs: number): Promise<unknown> {
  const response = await fetch(url, {
    method: 'GET',
    signal: AbortSignal.timeout(timeoutMs),
  })

  return response.ok ? response.json() : undefined
}

export async function fetchModelsDevData(url: string = DEFAULT_MODELS_DEV_URL): Promise<Map<string, ModelsDevModel>> {
  const cached = modelsDevCaches.get(url)
  if (cached) return cached

  try {
    const [data, catalog] = await Promise.all([
      fetchJson(url, MODELS_DEV_TIMEOUT_MS),
      // Effort levels and prices are extras: without them, models keep the rest of their metadata.
      url === DEFAULT_MODELS_DEV_URL
        ? fetchJson(MODELS_DEV_CATALOG_URL, MODELS_DEV_CATALOG_TIMEOUT_MS).catch(() => undefined)
        : undefined,
    ])

    if (data === undefined) {
      return new Map()
    }

    const models = parseModelsDevData(data)
    addCatalogDetails(models, catalog)
    modelsDevCaches.set(url, models)
    return models
  } catch {
    return new Map()
  }
}

function splitModelId(modelId: string): { provider?: string; model: string } {
  const parts = modelId.split('/')
  if (parts.length <= 1) {
    return { model: modelId }
  }

  return {
    provider: parts[0].toLowerCase(),
    model: parts.slice(1).join('/'),
  }
}

function calculatePrefixScore(modelA: string, modelB: string): number {
  const partsA = modelA.split('-')
  const partsB = modelB.split('-')
  const shorter = partsA.length <= partsB.length ? partsA : partsB
  const longer = partsA.length <= partsB.length ? partsB : partsA

  for (let i = 0; i < shorter.length; i++) {
    if (shorter[i] !== longer[i]) {
      return 0
    }
  }

  if (shorter.length < PREFIX_MATCH_MIN_SHARED_PARTS) {
    return 0
  }

  return Math.max(0, 100 - ((longer.length - shorter.length) * 10))
}

export function lookupModelsDevData(
  modelId: string,
  cache: Map<string, ModelsDevModel>
): ModelsDevModel | undefined {
  let cleanId = modelId.replace(/:[a-zA-Z0-9_-]+$/g, '')
  const parts = cleanId.split('/')
  if (parts.length > 2) {
    cleanId = parts.slice(-2).join('/')
  }

  const exactMatch = cache.get(cleanId) ?? cache.get(cleanId.toLowerCase())
  if (exactMatch) return exactMatch

  const requestedModelLower = splitModelId(cleanId).model.toLowerCase()
  const allCandidates: Array<[string, ModelsDevModel]> = []

  for (const [key, value] of cache.entries()) {
    const candidate = splitModelId(key)
    const candidateModelLower = candidate.model.toLowerCase()
    allCandidates.push([candidateModelLower, value])
  }

  const exactModelMatches = allCandidates.filter(([candidateModel]) => candidateModel === requestedModelLower)
  if (exactModelMatches.length === 1) return exactModelMatches[0]?.[1]
  if (exactModelMatches.length > 1) return undefined

  let bestMatch: ModelsDevModel | undefined
  let bestScore = 0
  let bestScoreMatches = 0

  for (const [candidateModel, value] of allCandidates) {
    const score = calculatePrefixScore(requestedModelLower, candidateModel)
    if (score >= PREFIX_MATCH_MIN_SCORE && score > bestScore) {
      bestScore = score
      bestMatch = value
      bestScoreMatches = 1
    } else if (score >= PREFIX_MATCH_MIN_SCORE && score === bestScore) {
      bestScoreMatches++
    }
  }

  return bestScoreMatches === 1 ? bestMatch : undefined
}

export const modelsDevTestUtils = {
  parseModelsDevData,
  resetCache(): void {
    modelsDevCaches.clear()
  },
}
