"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discordJs = require("discord.js");
function isTextChannel(channel) {
    return channel.type === "text";
}
exports.isTextChannel = isTextChannel;
exports.Roles = {
    staff: "777842454401253377",
    mute: "815575253887615006"
};
exports.Channels = {
    obj: { botlog: null, release: null, schedule: null },
    schedule: "803360266854072372",
    botlog: "813148662707519549",
    release: "805919561064382495" // "777815091650232362"// 
};
exports.discordClient = new discordJs.Client();
//# sourceMappingURL=DiscordIDs.js.map