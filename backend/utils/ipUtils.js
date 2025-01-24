export const isPublicIP = (ip) => {
    const privateRanges = [
        /^10\./, /^172\.(1[6-9]|2[0-9]|3[0-1])\./, /^192\.168\./, /^127\./, /^169\.254\./, /^::1$/, /^fc00:/, /^fe80:/,
    ];
    return !privateRanges.some((range) => range.test(ip));
};
