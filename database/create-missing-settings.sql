-- Create user_settings for users that don't have one yet
INSERT INTO user_settings (user_id, ai_enabled, ai_personality, ai_max_length, ai_trigger_mode, gemini_model)
SELECT 
  u.id,
  true as ai_enabled,
  'cute' as ai_personality,
  500 as ai_max_length,
  'smart' as ai_trigger_mode,
  'gemini-3.1-flash-lite' as gemini_model
FROM users u
WHERE NOT EXISTS (
  SELECT 1 FROM user_settings us WHERE us.user_id = u.id
);

-- Create bot_settings for users that don't have one yet
INSERT INTO bot_settings (user_id, enabled, auto_reply_message, reply_delay, settings)
SELECT 
  u.id,
  true as enabled,
  'Xin chào! Đây là tin nhắn tự động.' as auto_reply_message,
  2000 as reply_delay,
  jsonb_build_object(
    'replyScope', 'all',
    'whitelist', '[]'::jsonb,
    'blacklist', '[]'::jsonb,
    'useRandomPreset', true,
    'presetMessages', jsonb_build_array(
      'E-Eto... tôi là Monica Everett... xin hãy chiếu cố cho tôi từ bây giờ nhé... 🌸✨🥺🤍',
      'U-Um... nếu tôi trốn sau cánh cửa thì xin đừng kéo tôi ra nhé... 🚪🥺💦',
      'Fuee... c-chuyện này khó quá đi mất... (՚﹏՚)💦',
      'A-Anou... đừng nói cho mọi người biết nhé... tôi tin bạn đó... 🥺🌸🤍✨',
      'S-Sono... nếu có thể giúp được mọi người thì tôi rất vui... 🍀🤍✨'
    )
  ) as settings
FROM users u
WHERE NOT EXISTS (
  SELECT 1 FROM bot_settings bs WHERE bs.user_id = u.id
);

-- Show results
SELECT 
  u.id as user_id,
  u.username,
  u.session_id,
  EXISTS(SELECT 1 FROM user_settings us WHERE us.user_id = u.id) as has_user_settings,
  EXISTS(SELECT 1 FROM bot_settings bs WHERE bs.user_id = u.id) as has_bot_settings
FROM users u
ORDER BY u.created_at DESC;
