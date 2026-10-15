/**
 * Haven Multi-Provider Zero-Cost Configuration
 * Operates across permanent free flash and experiment-tier LLM endpoints.
 */

export interface ProviderEndpoint {
  id: string;
  name: string;
  baseUrl: string;
  models: string[];
  apiKeyEnvVar: string;
  rateLimitTier: 'unlimited_flash' | 'high_speed_rotation' | 'experiment_tier';
  currentModelIndex: number;
}

export interface ProviderConfig {
  providers: ProviderEndpoint[];
  offlineFallbackEnabled: boolean;
  requestTimeoutMs: number;
}

export function getDefaultProviders(): ProviderEndpoint[] {
  return [
    {
      id: 'groq',
      name: 'Groq Cloud',
      baseUrl: 'https://api.groq.com/openai/v1/chat/completions',
      models: [
        'qwen/qwen3.8-27b',
        'llama-3.3-70b-versatile',
        'llama-3.1-8b-instant',
        'qwen-2.5-32b',
      ],
      apiKeyEnvVar: 'GROQ_API_KEY',
      rateLimitTier: 'high_speed_rotation',
      currentModelIndex: 0,
    },
    {
      id: 'zai',
      name: 'Z.ai (Zhipu AI)',
      baseUrl: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
      models: ['glm-4.7-flash'],
      apiKeyEnvVar: 'ZAI_API_KEY',
      rateLimitTier: 'unlimited_flash',
      currentModelIndex: 0,
    },
    {
      id: 'mistral',
      name: 'Mistral La Plateforme',
      baseUrl: 'https://api.mistral.ai/v1/chat/completions',
      models: ['mistral-small-latest'],
      apiKeyEnvVar: 'MISTRAL_API_KEY',
      rateLimitTier: 'experiment_tier',
      currentModelIndex: 0,
    },
  ];
}

export const defaultConfig: ProviderConfig = {
  providers: getDefaultProviders(),
  offlineFallbackEnabled: true,
  requestTimeoutMs: 12000,
};
