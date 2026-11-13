import {
  SiAlibabacloud,
  SiAnthropic,
  SiClaude,
  SiDeepseek,
  SiGithubcopilot,
  SiGoogle,
  SiGooglegemini,
  SiHuggingface,
  SiLmstudio,
  SiMeta,
  SiMinimax,
  SiMistralai,
  SiMoonshotai,
  SiNvidia,
  SiOllama,
  SiOpenrouter,
  SiPerplexity,
  SiQwen,
  SiX
} from '@icons-pack/react-simple-icons'
import type { ComponentType, SVGProps } from 'react'

import cohereMark from '@/assets/provider-icons/cohere.svg?url'
import openaiMark from '@/assets/provider-icons/openai.svg?url'

type Brand = { color: string; icon: ComponentType<SVGProps<SVGSVGElement>> }

const BRANDS: Record<string, Brand> = {
  alibaba: { color: '#FF6A00', icon: SiAlibabacloud },
  anthropic: { color: '#D97757', icon: SiAnthropic },
  claude: { color: '#D97757', icon: SiClaude },
  deepseek: { color: '#4D6BFE', icon: SiDeepseek },
  githubcopilot: { color: '#8957E5', icon: SiGithubcopilot },
  gemini: { color: '#4285F4', icon: SiGooglegemini },
  google: { color: '#4285F4', icon: SiGoogle },
  huggingface: { color: '#FFD21E', icon: SiHuggingface },
  lmstudio: { color: '#5B67F1', icon: SiLmstudio },
  minimax: { color: '#615CED', icon: SiMinimax },
  meta: { color: '#0866FF', icon: SiMeta },
  mistral: { color: '#F26722', icon: SiMistralai },
  moonshot: { color: '#5A6CFF', icon: SiMoonshotai },
  nvidia: { color: '#76B900', icon: SiNvidia },
  ollama: { color: '#EDEDED', icon: SiOllama },
  openrouter: { color: '#6467F2', icon: SiOpenrouter },
  perplexity: { color: '#20B8CD', icon: SiPerplexity },
  qwen: { color: '#615CED', icon: SiQwen },
  xai: { color: '#D0D0D0', icon: SiX }
}

const IMAGE_MARKS: Record<string, string> = { cohere: cohereMark, openai: openaiMark }

const MODEL_BRANDS: [RegExp, string][] = [
  [/claude|anthropic/, 'anthropic'],
  [/gpt-|chatgpt|openai|\bo[134]-/, 'openai'],
  [/gemini|google/, 'gemini'],
  [/deepseek/, 'deepseek'],
  [/grok|xai/, 'xai'],
  [/mistral|codestral|ministral/, 'mistral'],
  [/qwen|qwq/, 'qwen'],
  [/kimi|moonshot/, 'moonshot'],
  [/llama|meta-llama/, 'meta'],
  [/sonar|perplexity/, 'perplexity'],
  [/minimax/, 'minimax'],
  [/command-r|cohere/, 'cohere']
]

function resolveBrandKey(provider: string, model: string): string | undefined {
  const modelName = model.toLowerCase()

  for (const [pattern, brand] of MODEL_BRANDS) {
    if (pattern.test(modelName)) {
      return BRANDS[brand] || IMAGE_MARKS[brand] ? brand : undefined
    }
  }

  const providerName = provider.toLowerCase().replace(/[^a-z0-9]/g, '')

  const providerKey = providerName.includes('huggingface') ? 'huggingface' : providerName

  return BRANDS[providerKey] || IMAGE_MARKS[providerKey] ? providerKey : undefined
}

/** Local provider/model mark for pickers and the composer. Unknown vendors get a legible monogram. */
export function ProviderMark({ className, model = '', provider }: { className?: string; model?: string; provider: string }) {

  const brandKey = resolveBrandKey(provider, model)
  const brand = brandKey ? BRANDS[brandKey] : undefined

  const fallback =
    provider.trim().slice(0, 1).toUpperCase() ||
    model.trim().slice(0, 1).toUpperCase() ||
    '•'

  return (
    <span
      aria-hidden="true"
      className={`grid size-4 shrink-0 place-items-center overflow-hidden ${className ?? ''}`}
      data-provider-mark={provider || 'model'}
    >
      {brand ? (
        <brand.icon className="size-full" style={{ color: brand.color }} />
      ) : brandKey && IMAGE_MARKS[brandKey] ? (
        <img alt="" className="size-full object-contain" src={IMAGE_MARKS[brandKey]} />
      ) : (
        <span
          className={`grid size-4 place-items-center rounded-full bg-(--ui-control-hover-background) text-[8px] font-semibold ${brandKey === 'openai' ? 'text-emerald-500' : 'text-(--ui-text-secondary)'}`}
        >
          {fallback}
        </span>
      )}
    </span>
  )
}
