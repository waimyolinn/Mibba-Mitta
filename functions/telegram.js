// functions/telegram.js
export async function onRequest(context) {
    // CORS headers - Frontend ကနေ ခေါ်လို့ရအောင်
    const corsHeaders = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    };

    // Handle preflight request
    if (context.request.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    const BOT_TOKEN = context.env.BOT_TOKEN;
    const CHANNEL_USERNAME = "mibamittaa";
    const url = new URL(context.request.url);

    // ========== GET /telegram - ပုံစာရင်းယူမယ် ==========
    if (url.pathname === "/telegram" && context.request.method === "GET") {
        try {
            const fetchUrl = `https://api.telegram.org/bot${BOT_TOKEN}/getUpdates`;
            const res = await fetch(fetchUrl);
            const data = await res.json();
            
            const images = [];
            for (const update of data.result || []) {
                const msg = update.channel_post;
                if (msg && msg.chat && msg.chat.username === CHANNEL_USERNAME && msg.photo) {
                    images.push({
                        file_id: msg.photo[msg.photo.length - 1].file_id,
                        caption: msg.caption || "",
                        date: msg.date || 0
                    });
                }
            }
            // အသစ်ဆုံးပုံ အရင်ပြမယ်
            images.sort((a, b) => b.date - a.date);
            
            return new Response(JSON.stringify({ success: true, images }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        } catch (error) {
            return new Response(JSON.stringify({ success: false, error: error.message }), {
                status: 500,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }
    }

    // ========== POST /telegram/file - ပုံဖိုင်ယူမယ် ==========
    if (url.pathname === "/telegram/file" && context.request.method === "POST") {
        try {
            const { file_id } = await context.request.json();
            if (!file_id) {
                return new Response("Missing file_id", { status: 400, headers: corsHeaders });
            }
            
            // Get file path from Telegram
            const fileRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getFile?file_id=${file_id}`);
            const fileData = await fileRes.json();
            
            if (fileData.ok && fileData.result) {
                // Get actual image
                const imageUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${fileData.result.file_path}`;
                const image = await fetch(imageUrl);
                
                // Return image with no-cache headers
                return new Response(image.body, {
                    headers: {
                        ...corsHeaders,
                        "Content-Type": "image/jpeg",
                        "Cache-Control": "no-cache, no-store, must-revalidate",
                        "Pragma": "no-cache",
                        "Expires": "0"
                    }
                });
            }
            return new Response("File not found", { status: 404, headers: corsHeaders });
        } catch (error) {
            return new Response("Server error", { status: 500, headers: corsHeaders });
        }
    }

    return new Response("Not found", { status: 404, headers: corsHeaders });
}