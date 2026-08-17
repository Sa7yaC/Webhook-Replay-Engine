import dns from "node:dns/promises";
import net from "node:net";

const BLOCKED_HOSTNAMES = new Set([
    "localhost",
    "localhost.localdomain",
    "ip6-localhost",
    "ip6-loopback",
]);

const isPrivateIPv4 = (ip) => {
    const parts = ip.split(".").map(Number);

    if (parts.length !== 4 || parts.some(Number.isNaN)) {
        return false;
    }

    const [a, b] = parts;

    // 10.0.0.0/8
    if (a === 10) return true;

    // 127.0.0.0/8
    if (a === 127) return true;

    // 172.16.0.0/12
    if (a === 172 && b >= 16 && b <= 31) return true;

    // 192.168.0.0/16
    if (a === 192 && b === 168) return true;

    // 169.254.0.0/16 - link local
    if (a === 169 && b === 254) return true;

    // 0.0.0.0/8
    if (a === 0) return true;

    return false;
};

const isPrivateIPv6 = (ip) => {
    const normalized = ip.toLowerCase();

    // Loopback
    if (normalized === "::1") {
        return true;
    }

    // Unspecified
    if (normalized === "::") {
        return true;
    }

    // IPv4-mapped IPv6
    if (normalized.startsWith("::ffff:")) {
        const ipv4 = normalized.substring(7);

        if (net.isIP(ipv4) === 4) {
            return isPrivateIPv4(ipv4);
        }
    }

    // fc00::/7 - Unique Local Address
    if (
        normalized.startsWith("fc") ||
        normalized.startsWith("fd")
    ) {
        return true;
    }

    // fe80::/10 - Link Local
    if (
        normalized.startsWith("fe8") ||
        normalized.startsWith("fe9") ||
        normalized.startsWith("fea") ||
        normalized.startsWith("feb")
    ) {
        return true;
    }

    return false;
};

const isPrivateIP = (ip) => {
    const version = net.isIP(ip);

    if (version === 4) {
        return isPrivateIPv4(ip);
    }

    if (version === 6) {
        return isPrivateIPv6(ip);
    }

    return false;
};

export const validateTargetUrl = async (targetUrl) => {
    if (!targetUrl || typeof targetUrl !== "string") {
        throw new Error("Target URL is required");
    }

    let parsedUrl;

    try {
        parsedUrl = new URL(targetUrl);
    } catch {
        throw new Error("Invalid target URL");
    }

    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
        throw new Error("Only HTTP and HTTPS URLs are allowed");
    }

    if (parsedUrl.username || parsedUrl.password) {
        throw new Error("URLs containing credentials are not allowed");
    }

    const hostname = parsedUrl.hostname.toLowerCase();

    if (
        BLOCKED_HOSTNAMES.has(hostname) ||
        hostname.endsWith(".localhost")
    ) {
        throw new Error("Localhost URLs are not allowed");
    }

    if (net.isIP(hostname)) {
        if (isPrivateIP(hostname)) {
            throw new Error("Private or local IP addresses are not allowed");
        }

        return parsedUrl;
    }

    let addresses;

    try {
        addresses = await dns.lookup(hostname, {
            all: true,
            verbatim: true
        });
    } catch {
        throw new Error("Unable to resolve target hostname");
    }

    if (!addresses.length) {
        throw new Error("Target hostname did not resolve");
    }

    for (const address of addresses) {
        if (isPrivateIP(address.address)) {
            throw new Error(
                "Target hostname resolves to a private or local IP address"
            );
        }
    }

    return parsedUrl;
};