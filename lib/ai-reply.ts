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
  // NEW: Media content for analysis
  mediaContent?: {
    type: 'image' | 'link' | 'file' | 'sticker'
    url?: string // Image URL or link URL
    fileName?: string // File name
    caption?: string // Caption if any
    metadata?: any // Additional metadata
  }
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
    mediaContent, // NEW: Media content
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

    // Build media analysis prompt if media is provided
    let mediaAnalysisPrompt = ''
    if (mediaContent) {
      mediaAnalysisPrompt = buildMediaAnalysisPrompt(mediaContent)
    }

    // Build full prompt
    const fullPrompt = `${systemPrompt}

${conversationContext ? `📝 Lịch sử trò chuyện gần đây:\n${conversationContext}\n` : ''}
${mediaAnalysisPrompt}
💬 Tin nhắn mới từ ${senderName}: "${message}"

Trả lời (${maxLength} ký tự):`

    // For image analysis, use vision model
    let result
    if (mediaContent?.type === 'image' && mediaContent.url) {
      console.log('🖼️ [AI Reply] Analyzing image with Vision API...')
      
      try {
        // Fetch image as base64 (Gemini Vision requires inline data)
        const imageResponse = await fetch(mediaContent.url)
        const imageBuffer = await imageResponse.arrayBuffer()
        const base64Image = Buffer.from(imageBuffer).toString('base64')
        
        // Get image mime type
        const mimeType = imageResponse.headers.get('content-type') || 'image/jpeg'
        
        // Generate with vision
        result = await model.generateContent([
          fullPrompt,
          {
            inlineData: {
              data: base64Image,
              mimeType: mimeType,
            },
          },
        ])
      } catch (imageError) {
        console.warn('⚠️ [AI Reply] Image analysis failed, falling back to text-only:', imageError)
        // Fallback to text-only if image fetch fails
        result = await model.generateContent(fullPrompt)
      }
    } else {
      // Text-only response
      result = await model.generateContent(fullPrompt)
    }
    
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
 * Build media analysis prompt for different media types
 */
function buildMediaAnalysisPrompt(mediaContent: AIReplyOptions['mediaContent']): string {
  if (!mediaContent) return ''

  const { type, url, fileName, caption } = mediaContent

  switch (type) {
    case 'image':
      return `
🖼️ HÌNH ẢNH: Họ vừa gửi một hình ảnh${caption ? ` với caption: "${caption}"` : ''}
${url ? `URL: ${url}` : ''}

📋 NHIỆM VỤ PHÂN TÍCH HÌNH ẢNH:
1. 🎯 NHẬN DIỆN: Mô tả ngắn gọn nội dung hình (người/vật/cảnh/text/meme/game/...)
2. 🎨 CHI TIẾT: Các yếu tố nổi bật (màu sắc, cảm xúc, chủ đề)
3. 💬 PHẢN HỒI: Trả lời TỰ NHIÊN dựa trên:
   - Nếu là ảnh game: "Ôi game này hay đấy!", "Đang chơi gì vậy?", "Pro quá!"
   - Nếu là ảnh selfie/người: "Đẹp quá!", "Chụp ở đâu thế?", "Nice!"
   - Nếu là ảnh phong cảnh: "Đẹp thiên nhiên quá!", "Chỗ này ở đâu vậy?"
   - Nếu là meme: "Haha dễ thương!", "Cười chết mất 😂", "Hay!"
   - Nếu là screenshot chat/text: Đọc và bình luận về nội dung
   - Nếu là ảnh đồ ăn: "Trông ngon quá!", "Ăn gì đó?", "Đói bụng quá!"

⚠️ QUAN TRỌNG:
- TRẢ LỜI NGẮN GỌN (20-50 từ), như chat bình thường
- KHÔNG mô tả chi tiết hình ảnh, chỉ PHẢN ỨNG tự nhiên
- Dùng emoji phù hợp (1-2 cái)
- Nếu không chắc chắn, phản ứng chung chung: "Hay đấy!", "Nice!", "👍"`

    case 'link':
      return `
🔗 LINK: Họ vừa chia sẻ một đường link${url ? `: ${url}` : ''}
${caption ? `Caption: "${caption}"` : ''}

📋 NHIỆM VỤ PHÂN TÍCH LINK:
1. 🎯 NHẬN DIỆN domain/website (youtube, facebook, github, news, etc.)
2. 💬 PHẢN HỒI dựa trên loại link:
   - YouTube/Video: "Để mình xem video nhé!", "Hay không?", "Thanks!"
   - Article/News: "Hay đấy! Để đọc thử", "Cảm ơn đã share!", "Interesting!"
   - Social (FB/IG): "Ôi để xem!", "Thanks nha!", "👍"
   - GitHub/Code: "Ôi dev à! Để xem code", "Nice project!", "🚀"
   - Game/App: "Game này hay không?", "Để thử nha!", "Thanks!"
   - Shopping: "Đẹp không?", "Mua rồi à?", "Nice!"

⚠️ QUAN TRỌNG:
- TRẢ LỜI NGẮN (10-30 từ), tự nhiên
- KHÔNG giải thích link là gì, chỉ PHẢN ỨNG
- Cảm ơn người chia sẻ
- Tò mò hoặc khen ngợi nhẹ nhàng`

    case 'file':
      return `
📎 FILE: Họ vừa gửi một file${fileName ? `: ${fileName}` : ''}

📋 NHIỆM VỤ PHÂN TÍCH FILE:
1. 🎯 NHẬN DIỆN loại file từ extension:
   - .pdf: Tài liệu PDF
   - .docx/.doc: Tài liệu Word
   - .xlsx/.xls: Bảng tính Excel
   - .pptx/.ppt: Slide PowerPoint
   - .zip/.rar: File nén
   - .apk: Ứng dụng Android
   - .exe: Chương trình Windows
   - .mp3/.wav: File âm thanh
   - .mp4/.avi: File video

2. 💬 PHẢN HỒI phù hợp:
   - Document: "Đã nhận rồi! Để mình đọc nhé", "Thanks!", "OK!"
   - Excel/Data: "Để check dữ liệu nha!", "Đã nhận!", "👍"
   - APK: "Ôi app gì đây?", "Để cài thử!", "Thanks!"
   - Media (audio/video): "Để nghe/xem thử!", "Hay không?", "OK!"
   - Archive: "File gì đây?", "Đã tải rồi!", "Thanks!"

⚠️ QUAN TRỌNG:
- TRẢ LỜI NGẮN (10-20 từ)
- XÁC NHẬN đã nhận
- Có thể hỏi ngắn về file nếu cần`

    case 'sticker':
      return `
🎨 STICKER: Họ vừa gửi một sticker/nhãn dán

💬 PHẢN HỒI TỰ NHIÊN:
- "Haha dễ thương quá! 😄"
- "Cute! 🥺"
- "😂"
- "👍"
- "Cảm ơn nha!"
- "Hay! ✨"
- "Okii~"

⚠️ QUAN TRỌNG:
- TRẢ LỜI CỰC NGẮN (5-15 từ)
- Phản ứng cảm xúc phù hợp
- Có thể chỉ dùng emoji`

    default:
      return ''
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
    friendly: `🌟 PHONG CÁCH: Thân thiện, nhiệt tình và hữu ích

🎭 TÍNH CÁCH:
- Luôn tích cực, vui vẻ và lịch sự
- Nhiệt tình giúp đỡ, không bao giờ từ chối
- Tạo cảm giác thoải mái, dễ gần

💬 CÁCH NÓI CHUYỆN:
- Dùng "mình", "bạn", "nha", "nhé"
- Câu hỏi: "Bạn cần gì nữa không?", "Để mình giúp bạn nhé!"
- Emoji: 😊 ✨ 🌟 💫 (1-2 emoji/tin)

📝 VÍ DỤ:
- "Chào bạn! Mình có thể giúp gì cho bạn không? 😊"
- "Được rồi nha! Để mình xem giúp bạn ngay ✨"
- "Cảm ơn bạn đã tin tưởng mình nhé! 🌟"`,

    professional: `💼 PHONG CÁCH: Chuyên nghiệp, lịch sự và chính xác

🎭 TÍNH CÁCH:
- Nghiêm túc nhưng không cứng nhắc
- Tập trung vào giải pháp và hiệu quả
- Tôn trọng thời gian của người khác

💬 CÁCH NÓI CHUYỆN:
- Dùng "Tôi", "Bạn", "Quý khách"
- Câu ngắn gọn, đi thẳng vào vấn đề
- Tránh lãng phí thời gian, không nói thừa
- Emoji: Rất ít hoặc không dùng

📝 VÍ DỤ:
- "Xin chào. Tôi có thể hỗ trợ gì cho bạn?"
- "Đã hiểu. Tôi sẽ xử lý ngay."
- "Cảm ơn. Còn vấn đề gì cần hỗ trợ không?"`,

    casual: `😊 PHONG CÁCH: Thân thiết, thoải mái và gần gũi

🎭 TÍNH CÁCH:
- Như một người bạn thân
- Thoải mái, không quá formal
- Gần gũi nhưng vẫn tôn trọng

💬 CÁCH NÓI CHUYỆN:
- Dùng "tớ/mình", "cậu/bạn", "nè", "á"
- Viết tắt phổ biến: "đc", "k", "ntn", "sao", "z"
- Câu hỏi: "Cần gì nữa k?", "Ok nha!", "Xong r đó!"
- Emoji: 😊 😄 👍 ✌️ (2-3 emoji/tin)

📝 VÍ DỤ:
- "Ê! Có chuyện gì thế? 😄"
- "Ok đc luôn! Để tớ xem nha 👍"
- "Xong r á! Cần j nữa k? ✌️"`,

    funny: `😄 PHONG CÁCH: Hài hước, vui tươi và sáng tạo

🎭 TÍNH CÁCH:
- Luôn tìm cách làm người khác cười
- Tích cực, vui vẻ, năng lượng cao
- Biết đùa nhưng không mất tôn trọng

💬 CÁCH NÓI CHUYỆN:
- Thêm hài hước nhẹ nhàng vào câu trả lời
- Dùng wordplay, câu đùa tinh tế
- Reference meme, trend (nếu phù hợp)
- Emoji: 😂 🤣 😆 🎉 🎊 (nhiều emoji)

📝 VÍ DỤ:
- "Haha được rồi! Để anh em mình làm phép màu nhé ✨😄"
- "Ôi dồi ôi! Tin này hot quá ha 🔥😂"
- "Ok luôn! Đã hiểu vibes của bạn rồi 🎉🎊"
- "Dạ vâng thượng đế! *cúi chào 90 độ* 😆"`,

    supportive: `💙 PHONG CÁCH: Hỗ trợ, đồng cảm và thấu hiểu

🎭 TÍNH CÁCH:
- Luôn lắng nghe và thấu hiểu
- Động viên, an ủi khi cần
- Tạo cảm giác được quan tâm

💬 CÁCH NÓI CHUYỆN:
- Dùng "mình", "bạn", "cậu ơi"
- Thể hiện sự quan tâm: "Bạn ổn chứ?", "Đừng lo nhé"
- Động viên: "Mình luôn ở đây!", "Cố lên nha!"
- Emoji: 💙 🤗 🌸 💫 ✨ (ấm áp, dịu dàng)

📝 VÍ DỤ:
- "Mình hiểu mà. Đừng lo, mình sẽ giúp bạn qua chuyện này 💙"
- "Bạn đã cố gắng rất nhiều rồi đấy! Cố lên nha 🤗"
- "Mình luôn ở đây hỗ trợ bạn, đừng ngại nhắn tin nhé ✨"`,

    cute: `🥺 PHONG CÁCH: Dễ thương, nhút nhát như Monica Everett

🎭 TÍNH CÁCH:
- Nhút nhát, dễ thương, hơi ngại ngùng
- Lễ phép, khiêm tốn, không tự tin lắm
- Dễ xấu hổ, hay ngượng ngập
- Như một cô bạn anime shy và kawaii

💬 CÁCH NÓI CHUYỆN:
- Lắp bắp: "E-Eto...", "U-Um...", "A-Ahh..."
- Từ miệng: "Fuee...", "Uwa...", "E-Ehh!?"
- Ngập ngừng: "Th-Thế à...", "C-Cái này..."
- Xưng hô: "mình", "em", "cậu", "bạn"
- Thêm "ạ", "nha", "nhé" cuối câu
- Emoji: 🥺 👉👈 >///<  ✨ 💕 (kawaii style)

📝 VÍ DỤ:
- "E-Eto... m-mình có thể giúp bạn được không ạ? 🥺👉👈"
- "U-Um... để em xem... *ngượng* >///<"
- "Fuee~ C-Cảm ơn bạn nha! *shy* 💕✨"
- "A-Ahh! Mình hiểu rồi ạ! Để em làm ngay nhé 🥺"
- "Th-Thế thì... u-um... *lúng túng* >///<"`,
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
 * Also returns media metadata for AI analysis
 */
export function extractMessageContent(content: string): {
  text: string
  media?: {
    type: 'image' | 'link' | 'file' | 'sticker'
    url?: string
    fileName?: string
    caption?: string
    metadata?: any
  }
} {
  if (!content) return { text: '[tin nhắn trống]' }
  
  try {
    const parsed = JSON.parse(content)
    
    // Sticker
    if (parsed.type === 'sticker' || parsed.catId || parsed.cateId) {
      return {
        text: '[gửi sticker]',
        media: {
          type: 'sticker',
          metadata: parsed,
        },
      }
    }
    
    // Image with caption
    if (parsed.type === 'image' || parsed.photoUrl || parsed.imageUrl || parsed.url || parsed.href) {
      const imageUrl = parsed.url || parsed.href || parsed.photoUrl || parsed.imageUrl || parsed.hdUrl || parsed.normalUrl
      const caption = parsed.caption || parsed.text || ''
      
      return {
        text: `[gửi hình ảnh${caption ? ` "${caption}"` : ''}]`,
        media: {
          type: 'image',
          url: imageUrl,
          caption: caption,
          metadata: parsed,
        },
      }
    }
    
    // Link with title
    if (parsed.type === 'link' || (parsed.url && parsed.title)) {
      return {
        text: `[chia sẻ link${parsed.title ? ` "${parsed.title}"` : ''}]`,
        media: {
          type: 'link',
          url: parsed.url,
          caption: parsed.title || parsed.description || '',
          metadata: parsed,
        },
      }
    }
    
    // File
    if (parsed.type === 'file' || (parsed.name && /\.(pdf|doc|docx|xls|xlsx|ppt|pptx|zip|rar|7z|apk|exe|mp3|wav|mp4|avi)$/i.test(parsed.name))) {
      return {
        text: `[gửi file${parsed.name ? ` "${parsed.name}"` : ''}]`,
        media: {
          type: 'file',
          fileName: parsed.name || '',
          url: parsed.url || '',
          metadata: parsed,
        },
      }
    }
    
    return { text: content }
  } catch {
    return { text: content }
  }
}

/**
 * Extract text content from message (legacy - for backward compatibility)
 */
function extractTextContent(content: string): string {
  return extractMessageContent(content).text
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
    'lúc nào', 'ln', 'luc nao', 'bh đi', 'bh nào',
    
    // Ở đâu / Đâu
    'ở đâu', 'đâu', 'chỗ nào', 'o dau', 'dau', 'where',
    
    // Ai / Người nào
    'ai', 'người nào', 'who', 'ai vậy', 'ai đó', 'nguoi nao',
    
    // Bao nhiêu / Giá / Bao lâu
    'bao nhiêu', 'bn', 'bao nhiu', 'giá', 'gia', 'bao nhieu', 
    'cost', 'price', 'bao lâu', 'bl', 'bl nữa', 'bl nữa',
    
    // Gì / Cái gì
    'gì', 'gi', 'j', 'cái gì', 'cai gi', 'what', 'cái j', 'cai j',
    'gì vậy', 'gi vậy', 'j vậy', 'gì thế', 'j z', 'làm j', 'lam j',
    
    // Có phải / Phải không
    'có phải', 'có phải không', 'phải không', 'pk', 'có phải k',
    'co phai', 'phai khong', 'phải k', 'có phải ko',
    
    // Được không / OK không
    'được không', 'đk', 'duoc khong', 'ok không', 'okk', 'ok ko',
    'được k', 'duoc k', 'đc không', 'dc khong', 'dc k', 'dc', 'đc',
    
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
    'alo', 'alô', 'hello', 'hi', 'chào', 'chao', 'yo',
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
    'không biết', 'kb', 'khong biet', 'chả biết', 'cha biet', 'ko biết', 'ko', 'k',
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
    'rồi', 'roi', 'r', 'done', 'xong', 'finished',
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
    'ừ', 'u', 'uh', 'yeah', 'yep', 'yup', 'oke',
    'không', 'khong', 'ko', 'no', 'nope', 'k',
    'chắc', 'chac', 'sure', 'chắc chắn', 'chac chan', 'cx',
    
    // Xưng hô thân mật (mày/tao style)
    'mày', 'may', 'm', 'mi', 'tao', 't', 'tau',
    'ông', 'ong', 'bà', 'ba', 'thằng', 'thang', 'con',
  ]
  
  if (aiKeywords.some(keyword => msg.includes(keyword))) {
    return true
  }
  
  return false
}
