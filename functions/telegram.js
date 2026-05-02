// functions/telegram.js
export async function onRequest(context) {
    const corsHeaders = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    };

    if (context.request.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    const BOT_TOKEN = context.env.BOT_TOKEN;
    const CHANNEL_USERNAME = "mibamittaa";
    const url = new URL(context.request.url);

    // GET /telegram - get photos list
    if (url.pathname === "/telegram" && context.request.method === "GET") {
        const fetchUrl = `https://api.telegram.org/bot${BOT_TOKEN}/getUpdates`;
        const res = await fetch(fetchUrl);
        const data = await res.json();
        
        const images = [];
        for (const update of data.result || []) {
            const msg = update.channel_post;
            if (msg?.chat?.username === CHANNEL_USERNAME && msg?.photo) {
                images.push({
                    file_id: msg.photo[msg.photo.length - 1].file_id,
                    caption: msg.caption || "",
                    date: msg.date || 0
                });
            }
        }
        images.sort((a, b) => b.date - a.date);
        return new Response(JSON.stringify({ success: true, images }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
    }

    // POST /telegram/file - get image file
    if (url.pathname === "/telegram/file" && context.request.method === "POST") {
        const { file_id } = await context.request.json();
        const fileRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getFile?file_id=${file_id}`);
        const fileData = await fileRes.json();
        
        if (fileData.ok) {
            const imageUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${fileData.result.file_path}`;
            const image = await fetch(imageUrl);
            return new Response(image.body, {
                headers: { ...corsHeaders, "Content-Type": "image/jpeg" }
            });
        }
        return new Response("File not found", { status: 404, headers: corsHeaders });
    }

    return new Response("Not found", { status: 404, headers: corsHeaders });
}