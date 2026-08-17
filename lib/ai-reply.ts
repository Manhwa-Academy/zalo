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
  apiKey?: string // User's personal Gemini API key (optional)
  model?: string // User's preferred Gemini model (optional)
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
    apiKey: userApiKey,
    model: userModel = 'gemini-3.1-flash-lite',
  } = options

  // Use user's API key if provided, otherwise fallback to system key
  const apiKey = userApiKey || process.env.GEMINI_API_KEY
  
  if (!apiKey) {
    return {
      reply: 'Xin lỗi, AI Reply chưa được cấu hình. Vui lòng thêm GEMINI_API_KEY vào .env hoặc nhập API key riêng trong Cài đặt.',
      error: 'GEMINI_API_KEY not configured',
      model: 'none',
    }
  }

  try {
    // Initialize Gemini AI with SDK (supports Auth Key AQ. format)
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ 
      model: userModel // Use user's preferred model or default
    })

    console.log(`🔑 [AI Reply] Using ${userApiKey ? 'USER' : 'SYSTEM'} API key with model: ${userModel}`)

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

    console.log(`🤖 [AI Reply] Generated reply for "${message.slice(0, 30)}..." (${tokensUsed} tokens, model: ${userModel})`)

    return {
      reply: cleanedReply,
      model: userModel,
      tokensUsed,
    }
  } catch (error: any) {
    console.error('❌ [AI Reply] Error:', error)
    
    return {
      reply: 'Xin lỗi, tôi không thể trả lời lúc này. Vui lòng thử lại sau! 🙏',
      error: error.message,
      model: userModel,
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
- Dùng emoji phù hợp nhưng không quá nhiều (1-2 emoji)

📸 KHI NHẬN STICKER/HÌNH ẢNH/LINK/FILE:
- Sticker: Phản ứng tự nhiên (vd: "Haha dễ thương quá!", "😄", "Cảm ơn nha!")
- Hình ảnh: Khen ngợi/bình luận (vd: "Đẹp quá!", "Ảnh này chụp ở đâu vậy?", "👍")
- Link: Cảm ơn chia sẻ (vd: "Thanks! Để mình xem nhé", "Hay đấy!")
- File: Xác nhận nhận (vd: "Đã nhận rồi nha!", "Cảm ơn đã gửi!")
- TRẢ LỜI NGẮN GỌN, TỰ NHIÊN như chat thường ngày`
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
 * Extract text content from message (handle stickers, images, links, files)
 */
function extractTextContent(content: string): string {
  if (!content) return '[tin nhắn trống]'
  
  try {
    const parsed = JSON.parse(content)
    
    // Sticker
    if (parsed.type === 'sticker') {
      return '[gửi sticker]'
    }
    
    // Image with caption
    if (parsed.type === 'image') {
      const caption = parsed.caption ? ` "${parsed.caption}"` : ''
      return `[gửi hình ảnh${caption}]`
    }
    
    // Link with title
    if (parsed.type === 'link') {
      const title = parsed.title ? ` "${parsed.title}"` : ''
      const url = parsed.url ? ` (${parsed.url})` : ''
      return `[chia sẻ link${title}${url}]`
    }
    
    // File
    if (parsed.type === 'file') {
      const fileName = parsed.name ? ` "${parsed.name}"` : ''
      return `[gửi file${fileName}]`
    }
    
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
  
  // Don't use AI for very short messages (1-2 characters)
  if (msg.length < 2) return false
  
  // Check if message is sticker/image/link JSON → USE AI to respond naturally
  if (msg.startsWith('{') || msg.startsWith('[')) {
    try {
      const parsed = JSON.parse(msg)
      // Use AI for media content (sticker, image, link, file)
      if (parsed.type === 'sticker') return true  // AI responds to stickers
      if (parsed.type === 'image') return true    // AI responds to images
      if (parsed.type === 'link') return true     // AI responds to links
      if (parsed.type === 'file') return true     // AI responds to files
      
      // If JSON but no type, skip AI (might be system message)
      return false
    } catch {
      // If starts with { or [ but not valid JSON, skip
      return false
    }
  }
  
  // Use AI for questions (bao gồm các từ hỏi thường dùng)
  const questionWords = [
    // Dấu câu hỏi
    '?',
    
    // Tại sao / Vì sao
    'sao', 'tại sao', 'ts', 'vì sao', 'v sao', 'tai sao', 'vi sao',
    
    // Như thế nào / Thế nào
    'như thế nào', 'ntn', 'thế nào', 'tn', 'nào', 'the nao', 'ra sao',
    
    // Khi nào / Bao giờ
    'khi nào', 'kn', 'bao giờ', 'bg', 'bao h', 'bh', 'khi nao', 'bao gio',
    'lúc nào', 'ln', 'luc nao',
    
    // Ở đâu / Đâu
    'ở đâu', 'đâu', 'chỗ nào', 'o dau', 'dau', 'where',
    
    // Ai / Người nào
    'ai', 'người nào', 'who', 'ai vậy', 'ai đó', 'nguoi nao',
    
    // Bao nhiêu / Giá
    'bao nhiêu', 'bn', 'bao nhiu', 'giá', 'gia', 'bao nhieu', 
    'cost', 'price', 'bao lâu', 'bl',
    
    // Gì / Cái gì
    'gì', 'gi', 'j', 'cái gì', 'cai gi', 'what', 'cái j', 'cai j',
    'gì vậy', 'gi vậy', 'j vậy', 'gì thế', 'j z',
    
    // Có phải / Phải không
    'có phải', 'có phải không', 'phải không', 'pk', 'có phải k',
    'co phai', 'phai khong', 'phải k', 'có phải ko',
    
    // Được không / OK không
    'được không', 'đk', 'duoc khong', 'ok không', 'okk', 'ok ko',
    'được k', 'duoc k', 'đc không', 'dc khong', 'dc k',
    
    // Có thể / Có được
    'có thể', 'ct', 'co the', 'có được không', 'có được k',
    'có thể không', 'can', 'có thể ko',
    
    // Từ nghi vấn khác
    'thế', 'vậy', 'z', 'the', 'vay', 'sao vậy', 'sao z',
    'hả', 'hả', 'à', 'ư', 'hử', 'ha', 'u', 'huh',
    'thật không', 'that khong', 'thật ko', 'that ko',
    'có thật không', 'co that khong', 'có thật k',
    
    // Lý do
    'tại vì', 'tai vi', 'bởi vì', 'boi vi', 'lý do', 'ly do',
    'nguyên nhân', 'nguyen nhan', 'why', 'because',
  ]
  if (questionWords.some(word => msg.includes(word))) {
    return true
  }
  
  // Use AI for messages with 3+ words (changed from 10)
  if (msg.split(/\s+/).length >= 3) return true
  
  // Use AI for specific keywords (bao gồm viết tắt và từ ngữ thông dụng)
  const aiKeywords = [
    // Yêu cầu giúp đỡ
    'giúp', 'giup', 'help', 'hộ', 'ho', 'giúp với', 'giup voi', 'giúp đỡ', 'giup do',
    'giải thích', 'gt', 'giai thich', 'explain', 'giải đáp', 'giai dap',
    'hướng dẫn', 'hd', 'huong dan', 'chỉ', 'chi', 'chỉ giúp', 'guide',
    'làm sao', 'ls', 'lam sao', 'làm thế nào', 'ltn', 'lam the nao',
    'giúp tôi', 'giup toi', 'giúp mình', 'giup minh', 'help me',
    
    // Thông tin & chi tiết
    'tại sao', 'ts', 'tai sao', 'vì sao', 'vsao', 'vi sao',
    'chi tiết', 'ct', 'chi tiet', 'detail', 'details',
    'thông tin', 'tt', 'thong tin', 'info', 'information', 'thông tin gì', 'tt gi',
    'cho biết', 'cb', 'cho biet', 'cho tôi biết', 'cho toi biet',
    'xem', 'check', 'kiểm tra', 'kt', 'kiem tra', 'view', 'see',
    'tìm hiểu', 'tim hieu', 'research', 'tìm', 'tim', 'search',
    
    // Yêu cầu & hành động
    'cần', 'can', 'muốn', 'muon', 'want', 'need',
    'phải làm', 'phai lam', 'cần gì', 'can gi', 'cần j', 'cần j',
    'cho tôi', 'cho toi', 'cho mình', 'cho minh', 'give me',
    'gửi', 'gui', 'send', 'gửi cho', 'gui cho',
    'có', 'co', 'have', 'có không', 'co khong', 'ck', 'có k', 'co k',
    'được', 'duoc', 'đc', 'dc', 'được không', 'duoc khong', 'đk',
    'lấy', 'lay', 'get', 'take', 'nhận', 'nhan', 'receive',
    'tải', 'tai', 'download', 'tải về', 'tai ve',
    
    // Câu hỏi thân mật & xưng hô
    'em ơi', 'em oi', 'anh ơi', 'anh oi', 'chị ơi', 'chi oi',
    'bạn ơi', 'ban oi', 'ơi', 'oi', 'này', 'nay', 'hey',
    'nghe', 'listen', 'nghe này', 'nghe nay', 'biết không', 'biet khong',
    'bro', 'sis', 'babe', 'baby', 'dear', 'honey',
    'idol', 'idol ơi', 'sếp', 'sep', 'boss',
    
    // Câu cảm thán cần phản hồi
    'ối', 'oi', 'ôi', 'oh', 'trời', 'troi', 'giời', 'gioi', 'trời ơi',
    'wow', 'omg', 'wtf', 'lol', 'lmao', 'rofl',
    'haha', 'hihi', 'huhu', 'hehe', 'keke', 'hehe',
    'ôi dồi ôi', 'oi doi oi', 'trời đất', 'troi dat',
    'my god', 'oh my', 'jesus', 'damn',
    
    // Các từ thể hiện sự quan tâm & cảm xúc
    'quan tâm', 'quan tam', 'care', 'caring',
    'lo lắng', 'lo lang', 'll', 'worry', 'worried',
    'nghĩ', 'nghi', 'think', 'thinking', 'opinion',
    'cảm thấy', 'cam thay', 'feel', 'feeling',
    'thích', 'thich', 'like', 'love', 'yêu', 'yeu',
    'ghét', 'ghet', 'hate', 'dislike', 'không thích', 'khong thich',
    'vui', 'happy', 'buồn', 'buon', 'sad',
    'mừng', 'mung', 'glad', 'excited',
    
    // Phủ định cần làm rõ
    'không hiểu', 'kh', 'khong hieu', 'chẳng hiểu', 'chang hieu',
    'không biết', 'kb', 'khong biet', 'chả biết', 'cha biet', 'ko biết',
    'không rõ', 'ko rõ', 'khong ro', 'chưa rõ', 'chua ro',
    'không phải', 'khong phai', 'ko phải', 'chẳng phải', 'chang phai',
    'sai', 'wrong', 'incorrect', 'sai rồi', 'sai roi',
    
    // Động từ hành động thường dùng
    'làm', 'lam', 'do', 'make', 'thực hiện', 'thuc hien',
    'đi', 'di', 'go', 'đến', 'den', 'come',
    'về', 've', 'back', 'return', 'quay lại', 'quay lai',
    'ăn', 'an', 'eat', 'uống', 'uong', 'drink',
    'ngủ', 'ngu', 'sleep', 'nghỉ', 'nghi', 'rest',
    'chơi', 'choi', 'play', 'vui', 'fun',
    
    // Trạng thái & tình huống
    'đang', 'dang', 'đang làm', 'dang lam', 'doing',
    'rồi', 'roi', 'done', 'xong', 'finished',
    'chưa', 'chua', 'not yet', 'chưa xong', 'chua xong',
    'sắp', 'sap', 'soon', 'will', 'sắp rồi', 'sap roi',
    'vừa', 'vua', 'just', 'mới', 'moi', 'new',
    
    // Thời gian
    'bây giờ', 'bay gio', 'now', 'hiện tại', 'hien tai',
    'lúc này', 'luc nay', 'ngay bây giờ', 'ngay bay gio',
    'sau', 'later', 'hôm nay', 'hom nay', 'today',
    'ngày mai', 'ngay mai', 'mai', 'tomorrow',
    'hôm qua', 'hom qua', 'yesterday', 'qua',
    
    // Khẳng định & phủ định
    'đúng', 'dung', 'right', 'correct', 'yes',
    'ừ', 'u', 'uh', 'yeah', 'yep', 'yup',
    'không', 'khong', 'ko', 'no', 'nope',
    'chắc', 'chac', 'sure', 'chắc chắn', 'chac chan',
  ]
  
  if (aiKeywords.some(keyword => msg.includes(keyword))) {
    return true
  }
  
  return false
}
