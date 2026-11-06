import { describe, expect, it } from 'vitest'
import { mapToDiscoveredV2Model, mapToV1Model } from '../../src/core/model-mapper'
import { createModelsDevEnricher } from '../../src/utils/model-info/models-dev'

function terra(reasoning_options?: Array<{ type: string, values?: string[] }>) {
  return createModelsDevEnricher(new Map([
    ['openai/gpt-6.1-terra', {
      id: 'openai/gpt-6.1-terra',
      name: 'GPT-6.1 Terra',
      reasoning: true,
      reasoning_options,
    }],
  ])).enrich({ id: 'gpt-6.1-terra' }, { filterNonChat: true })
}

describe('native models.dev enricher', () => {
  it('returns neutral metadata without a host-shaped config object', () => {
    const enricher = createModelsDevEnricher(new Map([
      ['openai/gpt-5', {
        id: 'openai/gpt-5',
        name: 'GPT 5',
        reasoning: true,
        tool_call: true,
        modalities: { input: ['text', 'image'] },
        limit: { context: 128_000, output: 16_384 },
      }],
    ]))

    expect(enricher.enrich({ id: 'openai/gpt-5' }, { filterNonChat: true })).toEqual({
      metadataName: 'GPT 5',
      limit: { context: 128_000, output: 16_384 },
      reasoning: true,
      toolCall: true,
      modalities: { input: ['text', 'image'] },
    })
  })

  it('makes a variant for each effort level the model lists', () => {
    const result = terra([
      { type: 'effort', values: ['none', 'low', 'medium', 'high', 'xhigh', 'max', 'default'] },
      { type: 'budget_tokens' },
    ])

    expect(result.variants).toEqual({
      none: { reasoningEffort: 'none' },
      low: { reasoningEffort: 'low' },
      medium: { reasoningEffort: 'medium' },
      high: { reasoningEffort: 'high' },
      xhigh: { reasoningEffort: 'xhigh' },
      max: { reasoningEffort: 'max' },
    })
  })

  it('adds no variants when the model lists no effort levels', () => {
    expect(terra()).not.toHaveProperty('variants')
    expect(terra([{ type: 'toggle' }])).not.toHaveProperty('variants')
    expect(terra([{ type: 'toggle', values: ['on', 'off'] }])).not.toHaveProperty('variants')
    expect(terra([{ type: 'effort', values: ['default'] }])).not.toHaveProperty('variants')
  })

  it('reaches OpenCode v2 with the listed levels instead of the low, medium and high fallback', () => {
    const result = terra([{ type: 'effort', values: ['low', 'xhigh', 'max'] }])
    const mapped = mapToDiscoveredV2Model(
      { id: 'gpt-6.1-terra', name: 'GPT-6.1 Terra', raw: { id: 'gpt-6.1-terra' }, ...result },
      { smartModelName: true },
    )

    expect(mapped.variants).toEqual([
      { id: 'low', settings: { reasoningEffort: 'low' } },
      { id: 'xhigh', settings: { reasoningEffort: 'xhigh' } },
      { id: 'max', settings: { reasoningEffort: 'max' } },
    ])
  })

  it('reaches OpenCode v1 in its object form', () => {
    const result = terra([{ type: 'effort', values: ['max'] }])
    const mapped = mapToV1Model({ id: 'gpt-6.1-terra', name: 'GPT-6.1 Terra', raw: { id: 'gpt-6.1-terra' }, ...result })

    expect(mapped.variants).toEqual({ max: { reasoningEffort: 'max' } })
  })
})
