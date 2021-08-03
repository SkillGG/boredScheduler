import * as discordJs from "discord.js"

export function isTextChannel(channel: discordJs.Channel): channel is discordJs.TextChannel {
    return channel.type === "text";
}

export const Roles = {
    staff: "777842454401253377",
    mute: "815575253887615006"
}

type ChannelObjectObjects = {
    botlog?: discordJs.TextChannel,
    release?: discordJs.TextChannel,
    schedule?: discordJs.TextChannel
}

type ChannelObject = {
    obj: ChannelObjectObjects,
    botlog: string,
    release: string,
    schedule: string
}

export const Channels: ChannelObject = {
    obj: { botlog: null, release: null, schedule: null },
    schedule: "803360266854072372",
    botlog: "813148662707519549",
    release: "777815091650232362"//"805919561064382495"//  
}

export const discordClient: discordJs.Client = new discordJs.Client();