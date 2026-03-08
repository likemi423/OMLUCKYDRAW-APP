// === 请在这里粘贴你的 Supabase 项目 URL 和 anon_key ===
// ！！注意：如果直接上传到公开的 GitHub 仓库，你的 key 会被他人看到！！
// 如果需要在本机使用，可以在这里填写，并确保这个文件不要推送到公开仓库中（可以将其加入 .gitignore）。

const SUPABASE_URL = 'https://sfauzixrcrscsxpyglaj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmYXV6aXhyY3JzY3N4cHlnbGFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5MzA0MjQsImV4cCI6MjA4ODUwNjQyNH0.DMpfhk_wGBVX-CH2FUxl1u6bO-gy2uXKMmZx8eYlNo0';

// 初始化 Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const SupabaseAPI = {
    async recordWinners(theme, prizeName, winners) {
        if (SUPABASE_URL === 'YOUR_SUPABASE_URL') {
            console.warn('⚠️ Supabase 尚未配置，暂时只在本地保存中奖资料。');
            return;
        }

        const dataToInsert = winners.map(w => ({
            theme: theme,
            prize_name: prizeName,
            winner_id: w.id,
            winner_name: w.name,
            drawn_at: w.timestamp
        }));

        try {
            // 你需要在 Supabase 中创建一个名为 `lucky_draw_winners` 的数据表
            const { data, error } = await supabase
                .from('lucky_draw_winners')
                .insert(dataToInsert);

            if (error) {
                console.error('❌ 上传中奖数据到 Supabase 失败:', error);
            } else {
                console.log('✅ 成功将最新中奖数据上传到 Supabase:', dataToInsert);
            }
        } catch (err) {
            console.error('网络或未知错误:', err);
        }
    }
};

// 挂载到全局
window.SupabaseAPI = SupabaseAPI;
