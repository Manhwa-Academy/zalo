/**
 * AI-Powered Smart Reply using Google Gemini API
 * Supports: Gemini 2.5 Flash Lite (faster, lighter, free)
 * Using official @google/generative-ai SDK
 */

import { GoogleGenerativeAI } from '@google/generative-ai'

interface AIReplyOptions {
  message: string
  senderName?: string
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>
  userContext?: {
    name?: string
    relationship?: string
    previousTopics?: string[]
  }
  personality?: string
  maxLength?: number
  presetMessages?: string[] // Preset messages to learn style from
}

interface AIReplyResult {
  reply: string
  error?: string
  model: string
  tokensUsed?: number
}

/**
 * Generate AI reply using Gemini 1.5 Flash
 */
export async function generateAIReply(options: AIReplyOptions): Promise<AIReplyResult> {
  const {
    message,
    senderName = 'Người dùng',
    conversationHistory = [],
    userContext = {},
    personality = 'friendly',
    maxLength = 200,
    presetMessages = [],
  } = options

  const apiKey = process.env.GEMINI_API_KEY
  
  if (!apiKey) {
    return {
      reply: 'Xin lỗi, AI Reply chưa được cấu hình. Vui lòng thêm GEMINI_API_KEY vào .env',
      error: 'GEMINI_API_KEY not configured',
      model: 'none',
    }
  }

  try {
    // Initialize Gemini AI with SDK (supports Auth Key AQ. format)
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-3.1-flash-lite' // Gemini 3.1 Flash Lite - available in v1beta
    })

    // Build system prompt with personality
    const systemPrompt = buildSystemPrompt(personality, userContext, maxLength, presetMessages)
    
    // Build conversation context
    const conversationContext = conversationHistory
      .slice(-5) // Last 5 messages for context
      .map(msg => `${msg.role === 'user' ? 'Họ' : 'Bạn'}: ${msg.content}`)
      .join('\n')

    // Build full prompt
    const fullPrompt = `${systemPrompt}

${conversationContext ? `📝 Lịch sử trò chuyện gần đây:\n${conversationContext}\n` : ''}
💬 Tin nhắn mới từ ${senderName}: "${message}"

Trả lời (${maxLength} ký tự):`

    // Generate content using SDK
    const result = await model.generateContent(fullPrompt)
    const response = await result.response
    const aiReply = response.text()
    
    if (!aiReply) {
      throw new Error('Empty response from Gemini')
    }

    // Clean up reply (remove quotes if wrapped)
    const cleanedReply = aiReply
      .trim()
      .replace(/^["']/, '')
      .replace(/["']$/, '')
      .substring(0, maxLength * 1.2) // Soft limit

    // Calculate approximate tokens used
    const tokensUsed = Math.ceil((fullPrompt.length + cleanedReply.length) / 4)

    console.log(`🤖 [AI Reply] Generated reply for "${message.slice(0, 30)}..." (${tokensUsed} tokens)`)

    return {
      reply: cleanedReply,
      model: 'gemini-3.1-flash-lite',
      tokensUsed,
    }
  } catch (error: any) {
    console.error('❌ [AI Reply] Error:', error)
    
    return {
      reply: 'Xin lỗi, tôi không thể trả lời lúc này. Vui lòng thử lại sau! 🙏',
      error: error.message,
      model: 'gemini-3.1-flash-lite',
    }
  }
}

/**
 * Build system prompt based on personality and context
 */
function buildSystemPrompt(
  personality: string,
  userContext: AIReplyOptions['userContext'],
  maxLength: number,
  presetMessages: string[] = []
): string {
  const personalities: Record<string, string> = {
    friendly: '🌟 Bạn là một trợ lý thân thiện, nhiệt tình và hữu ích. Luôn lịch sự, vui vẻ và tích cực.',
    professional: '💼 Bạn là một trợ lý chuyên nghiệp, lịch sự và chính xác. Trả lời ngắn gọn, đi thẳng vào vấn đề.',
    casual: '😊 Bạn là một người bạn thân thiết, thoải mái và gần gũi. Dùng ngôn ngữ đời thường, emoji phù hợp.',
    funny: '😄 Bạn là người hài hước, vui tươi, thích đùa giỡn nhưng vẫn giữ tôn trọng. Thêm chút hài hước vào câu trả lời.',
    supportive: '💙 Bạn là người hỗ trợ, đồng cảm và luôn lắng nghe. Thể hiện sự quan tâm và động viên.',
    cute: '🥺 Bạn là một trợ lý dễ thương, nhút nhát như Monica Everett. Dùng "E-Eto...", "U-Um...", "Fuee..." và emoji dễ thương.',
  }

  const basePrompt = personalities[personality] || personalities.friendly

  let contextInfo = ''
  if (userContext?.name) {
    contextInfo += `\n👤 Người nhắn: ${userContext.name}`
  }
  if (userContext?.relationship) {
    contextInfo += `\n💬 Mối quan hệ: ${userContext.relationship}`
  }
  if (userContext?.previousTopics && userContext.previousTopics.length > 0) {
    contextInfo += `\n📚 Chủ đề đã nói: ${userContext.previousTopics.join(', ')}`
  }

  // Add preset messages as style reference
  let styleReference = ''
  if (presetMessages.length > 0) {
    styleReference = `\n\n💬 PHONG CÁCH TRẢ LỜI CỦA BẠN (học từ tin nhắn soạn trước):
${presetMessages.map((msg, i) => `${i + 1}. "${msg}"`).join('\n')}

🎯 Hãy học cách nói chuyện, dùng từ, emoji và văn phong từ các tin nhắn trên.
✨ Tạo câu trả lời TỰ NHIÊN theo phong cách này, KHÔNG copy nguyên văn.
🔄 Có thể kết hợp nhiều ý từ các tin nhắn mẫu nếu phù hợp.`
  }

  return `${basePrompt}
${contextInfo}${styleReference}

📏 Giới hạn: Trả lời NGẮN GỌN trong khoảng ${maxLength} ký tự.
🇻🇳 Ngôn ngữ: Trả lời bằng Tiếng Việt tự nhiên, phù hợp với văn cảnh.
🎯 Mục tiêu: Trả lời chính xác, hữu ích, và phù hợp với phong cách đã cho.

⚠️ QUAN TRỌNG:
- Chỉ trả lời trực tiếp câu hỏi, KHÔNG giải thích thêm
- KHÔNG thêm "Bạn cần gì thêm không?" hay câu hỏi ngược
- KHÔNG viết dài dòng, chỉ cần đủ nghĩa
- KHÔNG copy nguyên văn tin nhắn mẫu, hãy sáng tạo dựa trên phong cách
- Dùng emoji phù hợp nhưng không quá nhiều (1-2 emoji)`
}

/**
 * Detect personality from bot settings
 */
export function detectPersonality(autoReplyMessage: string): string {
  const msg = autoReplyMessage.toLowerCase()
  
  if (msg.includes('eto') || msg.includes('um') || msg.includes('fuee') || msg.includes('monica')) {
    return 'cute'
  }
  if (msg.includes('😄') || msg.includes('🤣') || msg.includes('haha')) {
    return 'funny'
  }
  if (msg.includes('chuyên nghiệp') || msg.includes('công việc') || msg.includes('business')) {
    return 'professional'
  }
  if (msg.includes('💙') || msg.includes('hỗ trợ') || msg.includes('luôn bên bạn')) {
    return 'supportive'
  }
  if (msg.includes('bạn') || msg.includes('thoải mái') || msg.includes('😊')) {
    return 'casual'
  }
  
  return 'friendly'
}

/**
 * Extract conversation history from message logs
 */
export function buildConversationHistory(
  messageLogs: any[],
  threadId: string,
  maxMessages: number = 5
): Array<{ role: 'user' | 'assistant'; content: string }> {
  const threadMessages = messageLogs
    .filter(m => String(m.threadId) === String(threadId))
    .slice(0, maxMessages)
    .reverse() // Oldest first

  return threadMessages.map(m => ({
    role: m.isSelf || m.isSelfMessage ? 'assistant' : 'user',
    content: extractTextContent(m.content),
  }))
}

/**
 * Extract text content from message (handle stickers, images, etc.)
 */
function extractTextContent(content: string): string {
  if (!content) return '[tin nhắn trống]'
  
  try {
    const parsed = JSON.parse(content)
    if (parsed.type === 'sticker') return '[sticker]'
    if (parsed.type === 'image') return parsed.caption || '[hình ảnh]'
    if (parsed.type === 'file') return `[file: ${parsed.name}]`
    return content
  } catch {
    return content
  }
}

/**
 * Check if AI reply should be used (based on message content)
 */
export function shouldUseAIReply(message: string): boolean {
  const msg = message.toLowerCase().trim()
  
  // Don't use AI for very short messages
  if (msg.length < 3) return false
  
  // Don't use AI for stickers/images
  if (msg.startsWith('{') || msg.startsWith('[')) return false
  
  // Use AI for questions
  if (msg.includes('?') || msg.includes('sao') || msg.includes('như thế nào') || msg.includes('khi nào')) {
    return true
  }
  
  // Use AI for longer messages (>10 words)
  if (msg.split(/\s+/).length > 10) return true
  
  // Use AI for specific keywords
  const aiKeywords = ['giải thích', 'tại sao', 'làm sao', 'help', 'giúp', 'hướng dẫn', 'chi tiết', 'thông tin']
  if (aiKeywords.some(keyword => msg.includes(keyword))) {
    return true
  }
  
  return false
}
