import { lookupModelsDevData, type ModelsDevModel } from '../models-dev-fetcher'
import type { ModelEnricher } from '../../core/model-enrichment'
import { createModelLimits } from '../../core/model-types'

function hasUsableNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
}

function getEffortVariants(info: ModelsDevModel | undefined): Record<string, { reasoningEffort: string }> | undefined {
  const efforts = (info?.reasoning_options ?? [])
    .filter(option => option.type === 'effort')
    .flatMap(option => option.values ?? [])
    // "default" means the provider's own default, which is what no variant already does.
    .filter(effort => effort !== 'default')

  return efforts.length > 0
    ? Object.fromEntries(efforts.map(effort => [effort, { reasoningEffort: effort }]))
    : undefined
}

export function createModelsDevEnricher(data: unknown): ModelEnricher {
  const cache = data instanceof Map ? data as Map<string, ModelsDevModel> : new Map<string, ModelsDevModel>()
  return {
    enrich(model) {
      const info = lookupModelsDevData(model.id, cache)
      const contextLimit = hasUsableNumber(info?.limit?.context) ? info?.limit?.context : info?.limit?.input
      const limits = hasUsableNumber(contextLimit)
        ? createModelLimits(contextLimit, info?.limit?.output, info?.limit?.input)
        : undefined
      const variants = getEffortVariants(info)
      return {
        metadataName: info?.name,
        ...(limits ? { limit: limits } : {}),
        ...(typeof info?.attachment === 'boolean' ? { attachment: info.attachment } : {}),
        ...(typeof info?.reasoning === 'boolean' ? { reasoning: info.reasoning } : {}),
        ...(typeof info?.tool_call === 'boolean' ? { toolCall: info.tool_call } : {}),
        ...(typeof info?.structured_output === 'boolean' ? { structuredOutput: info.structured_output } : {}),
        ...(typeof info?.temperature === 'boolean' ? { temperature: info.temperature } : {}),
        ...(info?.modalities ? { modalities: info.modalities } : {}),
        ...(variants ? { variants } : {}),
      }
    },
  }
}
