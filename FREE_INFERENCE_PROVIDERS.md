# Comprehensive Free Inference Provider List
# For Smart Inference Router
# Last Updated: 2026-02-09

## TIER 1: GENEROUS FREE TIERS (Primary Targets)

### 1. Groq
- **Models:** Llama 3.1 8B/70B, Mixtral 8x7B, Gemma 2 9B
- **Free Tier:** 20 requests/minute, 1,000,000 tokens/day
- **Speed:** FASTEST ( Token/second)
- **Best For:** Quick responses, coding, general chat
- **Integration:** OpenAI-compatible API
- **Sign Up:** https://console.groq.com
- **Rate Limits:** 20 req/min, 1M tokens/day
- **Cost:** $0 (free tier)

### 2. Google Gemini
- **Models:** Gemini 1.5 Flash, Gemini 1.5 Pro
- **Free Tier:** 60 requests/minute, 1,000 requests/day
- **Strengths:** Multimodal, long context (1M tokens), Google integration
- **Best For:** Document analysis, long-form content, reasoning
- **Integration:** Google AI Studio API
- **Sign Up:** https://aistudio.google.com/app/apikey
- **Rate Limits:** 60 req/min, 1,000 req/day
- **Cost:** $0 (free tier)

### 3. OpenRouter
- **Models:** 100+ models including GPT-3.5, Claude Instant, Llama variants
- **Free Tier:** Various free models available (changes daily)
- **Strengths:** Aggregator - one API for many providers
- **Best For:** Fallback when other providers rate limit
- **Integration:** OpenAI-compatible API
- **Sign Up:** https://openrouter.ai/keys
- **Rate Limits:** Varies by model (typically 20 req/min for free)
- **Cost:** $0 (free models), pay-as-you-go for others

### 4. Mistral AI (Le Chat)
- **Models:** Mistral Small, Mistral Medium
- **Free Tier:** UNLIMITED (no signup required for basic)
- **Strengths:** No limits, good for coding
- **Best For:** High-volume simple queries
- **Integration:** API available
- **Sign Up:** https://mistral.ai (optional for higher tiers)
- **Rate Limits:** Unlimited on free tier
- **Cost:** $0

### 5. Meta AI
- **Models:** Llama 3 (various sizes)
- **Free Tier:** UNLIMITED
- **Strengths:** Completely free, no apparent limits
- **Best For:** General queries, content generation
- **Integration:** Limited API access
- **Sign Up:** https://ai.meta.com
- **Rate Limits:** None specified
- **Cost:** $0

### 6. DeepSeek
- **Models:** DeepSeek Chat, DeepSeek Coder
- **Free Tier:** Generous daily limits via web/app
- **Strengths:** Excellent for coding and math, very cheap API
- **Best For:** Code generation, technical tasks
- **Integration:** API available
- **Sign Up:** https://deepseek.com
- **Rate Limits:** Web: Generous; API: Pay-as-you-go (very cheap)
- **Cost:** $0 (web/app), ~$0.50/million tokens (API)

### 7. Together AI
- **Models:** Llama 3, Mixtral, Qwen, and many open models
- **Free Tier:** $5 initial credit, then pay-as-you-go (very cheap)
- **Strengths:** Fast inference, many open models
- **Best For:** Variety of models, cost-effective
- **Integration:** OpenAI-compatible API
- **Sign Up:** https://api.together.xyz
- **Rate Limits:** Based on credits
- **Cost:** $5 free credit, then ~$0.10-0.30/million tokens

## TIER 2: LIMITED FREE TIERS (Good for Fallback)

### 8. Anthropic Claude
- **Models:** Claude 3.5 Sonnet, Claude 3 Haiku
- **Free Tier:** Limited messages per day (resets daily, generous but unspecified)
- **Strengths:** Best reasoning, long-form writing, analysis
- **Best For:** Complex reasoning, creative writing
- **Integration:** Anthropic API
- **Sign Up:** https://console.anthropic.com
- **Rate Limits:** Message limits apply
- **Cost:** Free tier limited; Pro: $20/month

### 9. xAI Grok
- **Models:** Grok 2, Grok 3 (beta)
- **Free Tier:** Limited usage, resets daily
- **Strengths:** Real-time X data access, humor
- **Best For:** Trending topics, X integration
- **Integration:** Limited API access
- **Sign Up:** https://x.com/i/grok
- **Rate Limits:** Daily caps
- **Cost:** Free tier limited; Premium: $30/month

### 10. Perplexity AI
- **Models:** Perplexity models (various)
- **Free Tier:** ~5-10 Pro searches/day, unlimited basic
- **Strengths:** Web search integration, citations
- **Best For:** Research, fact-checking
- **Integration:** API available
- **Sign Up:** https://perplexity.ai
- **Rate Limits:** 5-10 searches/day for advanced
- **Cost:** Free tier limited; Pro: $20/month

### 11. Poe
- **Models:** Multiple (Claude, GPT, Llama, etc.)
- **Free Tier:** Daily points system for queries
- **Strengths:** Access to many models in one place
- **Best For:** Testing different models
- **Integration:** Limited
- **Sign Up:** https://poe.com
- **Rate Limits:** Daily points limit
- **Cost:** Free tier limited; Pro: $19.99/month

### 12. Cohere
- **Models:** Command R, Command R+
- **Free Tier:** Limited trial credits
- **Strengths:** Enterprise focus, RAG capabilities
- **Best For:** Business applications
- **Integration:** API available
- **Sign Up:** https://cohere.com
- **Rate Limits:** Trial credits
- **Cost:** Limited free trial

## TIER 3: OPEN SOURCE / SELF-HOSTED (Unlimited, Requires Setup)

### 13. Ollama (Local)
- **Models:** Llama 3, Mistral, Phi-3, Gemma, Qwen, and 100+ more
- **Cost:** $0 (runs locally)
- **Hardware Required:** GPU recommended (8GB+ VRAM for 7B models)
- **Best For:** Unlimited use, privacy, no internet required
- **Setup:** https://ollama.com
- **User's Setup:** RX 6600 8GB can run 3B-7B models easily

### 14. LM Studio (Local GUI)
- **Models:** Any GGUF model from Hugging Face
- **Cost:** $0 (runs locally)
- **Hardware Required:** GPU recommended
- **Best For:** Easy GUI for local models, AMD GPU support
- **Setup:** https://lmstudio.ai

### 15. Hugging Face Inference API
- **Models:** 100,000+ models
- **Free Tier:** Serverless inference (rate limited)
- **Cost:** $0 (with limits)
- **Best For:** Experimenting with latest models
- **Sign Up:** https://huggingface.co

### 16. vLLM (Self-Hosted)
- **Models:** Any compatible model
- **Cost:** $0 (bring your own hardware/cloud)
- **Best For:** High-throughput serving
- **Setup:** https://github.com/vllm-project/vllm

## TIER 4: CLOUD PROVIDERS WITH FREE TIERS

### 17. AWS Bedrock
- **Free Tier:** Limited free requests for 12 months
- **Models:** Claude, Llama, Titan
- **Best For:** Enterprise integration
- **Sign Up:** https://aws.amazon.com/bedrock

### 18. Azure OpenAI
- **Free Tier:** $200 credit for 30 days
- **Models:** GPT-3.5, GPT-4
- **Best For:** Microsoft ecosystem
- **Sign Up:** https://azure.microsoft.com

### 19. Google Cloud Vertex AI
- **Free Tier:** $300 credit for 90 days
- **Models:** Gemini, PaLM
- **Best For:** Google Cloud integration
- **Sign Up:** https://cloud.google.com/vertex-ai

### 20. Fireworks AI
- **Free Tier:** $1 credit + pay-as-you-go (cheap)
- **Models:** Llama 3, Mixtral, many open models
- **Best For:** Fast inference, cost-effective
- **Sign Up:** https://fireworks.ai

## TIER 5: SPECIALIZED PROVIDERS

### 21. AI21 Labs (Jamba)
- **Free Tier:** Limited trial
- **Strengths:** Long context window
- **Sign Up:** https://studio.ai21.com

### 22. Writer
- **Free Tier:** Limited trial
- **Strengths:** Enterprise writing
- **Sign Up:** https://writer.com

### 23. Stable Diffusion (Image Generation)
- **Free Options:** Hugging Face, Stability AI API
- **Local:** Run on your RX 6600
- **Best For:** Image generation

## RECOMMENDED INTEGRATION PRIORITY FOR ROUTER

### Primary (High Limits, Reliable):
1. **Groq** - 1M tokens/day, super fast
2. **Google Gemini** - 1,000 req/day, multimodal
3. **Mistral Le Chat** - Unlimited
4. **Meta AI** - Unlimited
5. **Together AI** - $5 free credit

### Secondary (Good Fallback):
6. **OpenRouter** - Aggregator, many options
7. **DeepSeek** - Excellent for code
8. **Anthropic Claude** - Best quality (limited free)
9. **xAI Grok** - X integration
10. **Perplexity** - Research

### Tertiary (Self-Hosted):
11. **Ollama Local** - Your RX 6600 runs 3B-7B models
12. **Hugging Face** - 100k+ models

### Final Fallback:
13. **Moonshot (Paid)** - Your $20/month subscription

## USAGE STRATEGY

### For Maximum Free Inference:
- **Simple queries (EASY):** Mistral, Meta AI, Groq
- **Coding (MEDIUM):** DeepSeek, Groq, Together AI
- **Complex reasoning (HARD):** Gemini, Claude (limited), then Moonshot

### Rate Limit Management:
- Rotate through providers when hitting limits
- Cache classifications to avoid redundant API calls
- Queue requests during peak times

### Expected Daily Capacity (All Free Tiers Combined):
- **Easy queries:** 5,000+ per day
- **Medium queries:** 2,000+ per day
- **Hard queries:** 100-200 per day (before hitting Moonshot)

---

## NEXT STEPS FOR SETUP

1. **Get API Keys (in order of priority):**
   - Groq (fast, high limits)
   - Google Gemini (multimodal)
   - Together AI ($5 free credit)
   - OpenRouter (aggregator)
   - Anthropic Claude (quality)

2. **Test Each Provider:**
   - Verify API keys work
   - Document actual rate limits
   - Test response quality

3. **Configure Router:**
   - Add all working providers to config
   - Set priority order
   - Test routing logic

4. **Monitor and Optimize:**
   - Track which providers handle which prompts best
   - Adjust routing rules based on performance
   - Scale up providers that work well

---

**Total Free Daily Capacity: ~7,000+ requests/day across all providers!**

With this setup, your $20/month Moonshot subscription becomes a safety net rather than your primary engine. 🚀
