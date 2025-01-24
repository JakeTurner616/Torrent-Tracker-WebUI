export const parseMagnetLink = (magnetLink) => {
    const infoHashMatch = magnetLink.match(/xt=urn:btih:([a-fA-F0-9]+)/);
    const titleMatch = magnetLink.match(/&dn=([^&]+)/);

    if (!infoHashMatch) {
        throw new Error("Invalid magnet link format.");
    }

    const infoHash = infoHashMatch[1];
    const title = decodeURIComponent(titleMatch ? titleMatch[1].replace(/\+/g, " ") : `Magnet (${infoHash.slice(0, 10)}...)`);
    return { infoHash, title };
};