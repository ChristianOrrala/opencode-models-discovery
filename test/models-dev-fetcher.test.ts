import { describe, it, expect, beforeEach, vi } from 'vitest'
import { fetchModelsDevData, lookupModelsDevData, MODELS_DEV_CATALOG_URL, modelsDevTestUtils } from '../src/utils/models-dev-fetcher.ts'

describe('models.dev fetcher', () => {
  beforeEach(() => {
    modelsDevTestUtils.resetCache()
  })

  it('should parse provider-nested models.dev data', () => {
    const cache = modelsDevTestUtils.parseModelsDevData({
      openai: {
        models: {
          'gpt-4o': {
            id: 'gpt-4o',
            tool_call: true,
            limit: { context: 128000, output: 16384 }
          }
        }
      }
    })

    expect(cache.get('openai/gpt-4o')).toEqual(expect.objectContaining({
      id: 'openai/gpt-4o',
      tool_call: true,
      limit: { context: 128000, input: undefined, output: 16384 }
    }))
  })

  it('should parse flat models.dev data keyed by model id', () => {
    const cache = modelsDevTestUtils.parseModelsDevData({
      'openai/gpt-4o': {
        tool_call: true,
        limit: { context: 128000 }
      }
    })

    expect(cache.get('openai/gpt-4o')).toEqual(expect.objectContaining({
      id: 'openai/gpt-4o',
      tool_call: true,
      limit: { context: 128000, input: undefined, output: undefined }
    }))
  })

  it('should match exact and same-provider model variants', () => {
    const cache = modelsDevTestUtils.parseModelsDevData({
      openai: {
        models: {
          'gpt-4o': { id: 'gpt-4o', tool_call: true },
          'gpt-4o-mini': { id: 'gpt-4o-mini', tool_call: false }
        }
      },
      anthropic: {
        models: {
          'claude-3-5-sonnet': { id: 'claude-3-5-sonnet', reasoning: true }
        }
      }
    })

    expect(lookupModelsDevData('openai/gpt-4o-mini', cache)?.id).toBe('openai/gpt-4o-mini')
    expect(lookupModelsDevData('openai/gpt-4o-2024-11-20', cache)?.id).toBe('openai/gpt-4o')
  })

  it('should normalize gateway prefixes and provider variants before lookup', () => {
    const cache = modelsDevTestUtils.parseModelsDevData({
      'moonshotai/kimi-k2.6': {
        name: 'Kimi K2.6',
        modalities: { input: ['text', 'image'], output: ['text'] }
      },
      'deepseek/deepseek-v4-flash': {
        name: 'DeepSeek V4 Flash',
        reasoning: true
      }
    })

    expect(lookupModelsDevData('openrouter/moonshotai/kimi-k2.6:free', cache)?.id).toBe('moonshotai/kimi-k2.6')
    expect(lookupModelsDevData('gateway/deepseek/deepseek-v4-flash', cache)?.id).toBe('deepseek/deepseek-v4-flash')
  })

  it('should match model id segments without requiring the provider to match', () => {
    const cache = modelsDevTestUtils.parseModelsDevData({
      openai: {
        models: {
          'shared-model': { id: 'shared-model', tool_call: true }
        }
      }
    })

    expect(lookupModelsDevData('custom/shared-model', cache)?.id).toBe('openai/shared-model')
  })

  it('should not match ambiguous duplicate model id segments', () => {
    const cache = modelsDevTestUtils.parseModelsDevData({
      providerA: {
        models: {
          'shared-model': { id: 'shared-model', tool_call: true }
        }
      },
      providerB: {
        models: {
          'shared-model': { id: 'shared-model', tool_call: false }
        }
      }
    })

    expect(lookupModelsDevData('custom/shared-model', cache)).toBeUndefined()
  })

  it('should allow model-only matches when provider is absent', () => {
    const cache = modelsDevTestUtils.parseModelsDevData({
      openai: {
        models: {
          'gpt-4o': { id: 'gpt-4o', tool_call: true }
        }
      }
    })

    expect(lookupModelsDevData('gpt-4o', cache)?.id).toBe('openai/gpt-4o')
  })

  it('should require a strong prefix match', () => {
    const cache = modelsDevTestUtils.parseModelsDevData({
      openai: {
        models: {
          gpt: { id: 'gpt', tool_call: true }
        }
      }
    })

    expect(lookupModelsDevData('openai/gpt-4o-2024-11-20', cache)).toBeUndefined()
  })

  it('should not match ambiguous tied prefix candidates', () => {
    const cache = modelsDevTestUtils.parseModelsDevData({
      providerA: {
        models: {
          'shared-model-alpha': { id: 'shared-model-alpha', tool_call: true }
        }
      },
      providerB: {
        models: {
          'shared-model-beta': { id: 'shared-model-beta', tool_call: false }
        }
      }
    })

    expect(lookupModelsDevData('custom/shared-model', cache)).toBeUndefined()
  })

  it('should cache models.dev data separately for each URL', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
      const id = String(url).includes('mirror.example') ? 'mirror-model' : 'default-model'
      return new Response(JSON.stringify({ test: { models: { [id]: { id } } } }))
    })

    const defaultModels = await fetchModelsDevData()
    const mirrorModels = await fetchModelsDevData('https://mirror.example/models.json')
    await fetchModelsDevData('https://mirror.example/models.json')

    expect(defaultModels.has('test/default-model')).toBe(true)
    expect(mirrorModels.has('test/mirror-model')).toBe(true)
    // The default URL also reads api.json for effort levels; the second mirror call comes from the cache.
    expect(fetchMock).toHaveBeenCalledTimes(3)
    fetchMock.mockRestore()
  })

  describe('effort levels from api.json', () => {
    const levels = [{ type: 'effort', values: ['low', 'xhigh', 'max'] }]
    const flat = {
      'openai/gpt-6.1-terra': { id: 'openai/gpt-6.1-terra', reasoning: true, limit: { context: 1_050_000 } },
      'acme/other': { id: 'acme/other', reasoning: true },
    }
    const catalog = {
      openai: { models: { 'gpt-6.1-terra': { id: 'gpt-6.1-terra', reasoning_options: levels } } },
      // Other providers list the same model, some with other levels. These must not be used or added.
      azure: { models: { 'gpt-6.1-terra': { id: 'gpt-6.1-terra', reasoning_options: [{ type: 'effort', values: ['low'] }] } } },
      openrouter: { models: { 'openai/gpt-6.1-terra': { id: 'openai/gpt-6.1-terra', reasoning_options: [{ type: 'effort', values: ['high'] }] } } },
    }

    function mockFetch(catalogResponse: () => Promise<Response>) {
      return vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
        if (String(url) === MODELS_DEV_CATALOG_URL) return catalogResponse()
        return new Response(JSON.stringify(flat))
      })
    }

    it('adds prices by exact provider and model, with context tiers only', async () => {
      const cost = {
        input: 1,
        output: 5,
        cache_read: 0.05,
        cache_write: 1.25,
        tiers: [
          { input: 2, output: 7.5, cache_read: 0.1, cache_write: 2.5, tier: { type: 'context', size: 272_000 } },
          { input: 9, output: 9, tier: { type: 'service', size: 1 } },
          { input: 9, output: 9 },
        ],
        context_over_200k: { input: 2, output: 7.5 },
      }
      const priced = {
        openai: { models: { 'gpt-6.1-terra': { id: 'gpt-6.1-terra', cost } } },
        azure: { models: { 'gpt-6.1-terra': { id: 'gpt-6.1-terra', cost: { input: 99, output: 99 } } } },
      }
      const fetchMock = mockFetch(async () => new Response(JSON.stringify(priced)))

      const models = await fetchModelsDevData()

      expect(models.get('openai/gpt-6.1-terra')?.cost).toEqual({
        input: 1,
        output: 5,
        cache_read: 0.05,
        cache_write: 1.25,
        tiers: [{ input: 2, output: 7.5, cache_read: 0.1, cache_write: 2.5, tier: { type: 'context', size: 272_000 } }],
      })
      expect(models.get('acme/other')?.cost).toBeUndefined()
      fetchMock.mockRestore()
    })

    it('ignores a price without both input and output, or with a bad number', async () => {
      const priced = {
        openai: { models: { 'gpt-6.1-terra': { id: 'gpt-6.1-terra', cost: { input: 1, output: 'free' } } } },
      }
      const fetchMock = mockFetch(async () => new Response(JSON.stringify(priced)))

      expect((await fetchModelsDevData()).get('openai/gpt-6.1-terra')?.cost).toBeUndefined()
      fetchMock.mockRestore()
    })

    it('adds them by exact provider and model, without adding models', async () => {
      const fetchMock = mockFetch(async () => new Response(JSON.stringify(catalog)))

      const models = await fetchModelsDevData()

      expect(models.get('openai/gpt-6.1-terra')?.reasoning_options).toEqual(levels)
      expect(models.get('openai/gpt-6.1-terra')?.limit?.context).toBe(1_050_000)
      expect(models.get('acme/other')?.reasoning_options).toBeUndefined()
      expect(models.size).toBe(2)
      // A bare id from a gateway must stay unambiguous, which is why api.json does not replace models.json.
      expect(lookupModelsDevData('gpt-6.1-terra', models)?.reasoning_options).toEqual(levels)
      fetchMock.mockRestore()
    })

    it.each([
      ['fails', async () => { throw new Error('network down') }],
      ['returns an error', async () => new Response('', { status: 500 })],
      ['returns invalid JSON', async () => new Response('not json')],
    ])('keeps the models.json data when api.json %s', async (_name, catalogResponse) => {
      const fetchMock = mockFetch(catalogResponse)

      const models = await fetchModelsDevData()

      expect(models.get('openai/gpt-6.1-terra')?.limit?.context).toBe(1_050_000)
      expect(models.get('openai/gpt-6.1-terra')?.reasoning_options).toBeUndefined()
      fetchMock.mockRestore()
    })

    it('does not use an error response from api.json, even when its body is valid JSON', async () => {
      const fetchMock = mockFetch(async () => new Response(JSON.stringify(catalog), { status: 503 }))

      const models = await fetchModelsDevData()

      expect(models.get('openai/gpt-6.1-terra')?.limit?.context).toBe(1_050_000)
      expect(models.get('openai/gpt-6.1-terra')?.reasoning_options).toBeUndefined()
      fetchMock.mockRestore()
    })

    it('returns nothing, and does not cache it, when models.json returns an error', async () => {
      const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => (
        String(url) === MODELS_DEV_CATALOG_URL
          ? new Response(JSON.stringify(catalog))
          : new Response(JSON.stringify(flat), { status: 503 })
      ))

      expect((await fetchModelsDevData()).size).toBe(0)

      fetchMock.mockImplementation(async (url) => (
        new Response(JSON.stringify(String(url) === MODELS_DEV_CATALOG_URL ? catalog : flat))
      ))
      expect((await fetchModelsDevData()).size).toBe(2)
      fetchMock.mockRestore()
    })

    it('does not read api.json for a custom endpoint, and uses levels the endpoint provides', async () => {
      const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => new Response(JSON.stringify({
        'openai/mirrored': { id: 'openai/mirrored', reasoning_options: levels },
      })))

      const models = await fetchModelsDevData('https://mirror.example/models.json')

      expect(models.get('openai/mirrored')?.reasoning_options).toEqual(levels)
      expect(fetchMock).toHaveBeenCalledTimes(1)
      expect(fetchMock).not.toHaveBeenCalledWith(MODELS_DEV_CATALOG_URL, expect.anything())
      fetchMock.mockRestore()
    })

    it('ignores malformed reasoning options', () => {
      const cache = modelsDevTestUtils.parseModelsDevData({
        'a/one': { id: 'a/one', reasoning_options: 'high' },
        'a/two': { id: 'a/two', reasoning_options: [null, { values: ['low'] }, { type: 'effort', values: ['low', 7] }] },
      })

      expect(cache.get('a/one')?.reasoning_options).toBeUndefined()
      expect(cache.get('a/two')?.reasoning_options).toEqual([{ type: 'effort', values: ['low'] }])
    })
  })
})
