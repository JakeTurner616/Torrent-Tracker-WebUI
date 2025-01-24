export const validateIp = (req, res, next) => {
    const ip = req.params.ip || req.query.host;
    console.log("Validating IP:", ip);

    // Regex to match valid IPv4 addresses
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;

    if (!ipv4Regex.test(ip)) {
        return res.status(400).json({ error: "Invalid IP address format." });
    }

    // Check that each segment is within 0-255
    const segments = ip.split(".");
    const isValidIp = segments.every(segment => {
        const num = parseInt(segment, 10);
        return num >= 0 && num <= 255;
    });

    if (!isValidIp) {
        return res.status(400).json({ error: "Invalid IP address format." });
    }

    next();
};