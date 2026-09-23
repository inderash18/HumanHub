/**
 * SSRF & Remote URL Validation Engine (OWASP ASVS V12.6.1 Compliant)
 * 
 * Prevents Server-Side Request Forgery by validating destination protocols,
 * resolving hostnames, and rejecting private, loopback, link-local, and cloud metadata IPs.
 */
import dns from 'node:dns/promises';
import net from 'node:net';

// Helper to convert IPv4 address to unsigned 32-bit integer
function ip4ToInt(ip) {
  return ip.split('.').reduce((acc, octet) => ((acc << 8) + parseInt(octet, 10)) >>> 0, 0);
}

// Check if an IPv4 address falls within a CIDR subnet
function isIpInSubnet(ip, subnet, maskBits) {
  const ipInt = ip4ToInt(ip);
  const subnetInt = ip4ToInt(subnet);
  const mask = maskBits === 0 ? 0 : (~0 << (32 - maskBits)) >>> 0;
  return (ipInt & mask) === (subnetInt & mask);
}

/**
 * Check if an IPv4 address is in a private, loopback, or metadata range.
 */
export function isPrivateOrReservedIPv4(ip) {
  // 0.0.0.0/8 (Current network)
  if (isIpInSubnet(ip, '0.0.0.0', 8)) return true;
  // 10.0.0.0/8 (Private)
  if (isIpInSubnet(ip, '10.0.0.0', 8)) return true;
  // 100.64.0.0/10 (Shared address space / Carrier NAT)
  if (isIpInSubnet(ip, '100.64.0.0', 10)) return true;
  // 127.0.0.0/8 (Loopback)
  if (isIpInSubnet(ip, '127.0.0.0', 8)) return true;
  // 169.254.0.0/16 (Link-local / Cloud metadata including 169.254.169.254)
  if (isIpInSubnet(ip, '169.254.0.0', 16)) return true;
  // 172.16.0.0/12 (Private)
  if (isIpInSubnet(ip, '172.16.0.0', 12)) return true;
  // 192.168.0.0/16 (Private)
  if (isIpInSubnet(ip, '192.168.0.0', 16)) return true;
  // 198.18.0.0/15 (Benchmarking)
  if (isIpInSubnet(ip, '198.18.0.0', 15)) return true;
  // 224.0.0.0/4 (Multicast)
  if (isIpInSubnet(ip, '224.0.0.0', 4)) return true;
  // 240.0.0.0/4 (Reserved)
  if (isIpInSubnet(ip, '240.0.0.0', 4)) return true;

  return false;
}

/**
 * Check if an IPv6 address is in a private, loopback, or link-local range.
 */
export function isPrivateOrReservedIPv6(ip) {
  const cleanIp = ip.toLowerCase();
  // Loopback
  if (cleanIp === '::1' || cleanIp === '0:0:0:0:0:0:0:1') return true;
  // Unspecified
  if (cleanIp === '::' || cleanIp === '0:0:0:0:0:0:0:0') return true;
  // Unique Local (fc00::/7 -> fc00 to fdff)
  if (/^f[cd][0-9a-f]{2}:/i.test(cleanIp)) return true;
  // Link-local (fe80::/10 -> fe80 to febf)
  if (/^fe[89ab][0-9a-f]:/i.test(cleanIp)) return true;
  // IPv4-mapped IPv6 (::ffff:127.0.0.1 or ::ffff:7f00:1)
  if (cleanIp.startsWith('::ffff:')) {
    const v4Part = cleanIp.slice(7);
    if (net.isIPv4(v4Part)) {
      return isPrivateOrReservedIPv4(v4Part);
    }
  }
  return false;
}

/**
 * Validate a target URL to ensure it does not resolve to private or internal infrastructure.
 * @param {string} urlString
 * @returns {Promise<{ isSafe: boolean, reason?: string, resolvedIp?: string, url?: URL }>}
 */
export async function validateSafeUrl(urlString) {
  let parsed;
  try {
    parsed = new URL(urlString);
  } catch {
    return { isSafe: false, reason: 'Malformed URL format' };
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { isSafe: false, reason: `Unsupported protocol ${parsed.protocol}. Only http and https allowed.` };
  }

  const hostname = parsed.hostname;

  // Direct IP address check
  if (net.isIPv4(hostname)) {
    if (isPrivateOrReservedIPv4(hostname)) {
      return { isSafe: false, reason: `Destination IP ${hostname} is in a private or reserved address range.` };
    }
    return { isSafe: true, resolvedIp: hostname, url: parsed };
  }

  if (net.isIPv6(hostname)) {
    if (isPrivateOrReservedIPv6(hostname)) {
      return { isSafe: false, reason: `Destination IPv6 ${hostname} is in a private or reserved range.` };
    }
    return { isSafe: true, resolvedIp: hostname, url: parsed };
  }

  // Reject obvious localhost aliases
  if (['localhost', 'local', 'internal', 'metadata.google.internal'].includes(hostname.toLowerCase()) || hostname.endsWith('.localhost') || hostname.endsWith('.internal')) {
    return { isSafe: false, reason: 'Localhost and internal domain names are forbidden.' };
  }

  // DNS Resolution check
  try {
    const addresses = await dns.lookup(hostname, { all: true });
    if (!addresses || addresses.length === 0) {
      return { isSafe: false, reason: 'Host could not be resolved via DNS' };
    }

    for (const addr of addresses) {
      if (addr.family === 4 && isPrivateOrReservedIPv4(addr.address)) {
        return { isSafe: false, reason: `Host ${hostname} resolves to private IP ${addr.address}` };
      }
      if (addr.family === 6 && isPrivateOrReservedIPv6(addr.address)) {
        return { isSafe: false, reason: `Host ${hostname} resolves to private IPv6 ${addr.address}` };
      }
    }

    return { isSafe: true, resolvedIp: addresses[0].address, url: parsed };
  } catch (err) {
    return { isSafe: false, reason: `DNS lookup failed for host ${hostname}: ${err.message}` };
  }
}

export function isPrivateIp(ip) {
  if (net.isIPv4(ip)) return isPrivateOrReservedIPv4(ip);
  if (net.isIPv6(ip)) return isPrivateOrReservedIPv6(ip);
  return true;
}

export default {
  validateSafeUrl,
  isPrivateOrReservedIPv4,
  isPrivateOrReservedIPv6,
  isPrivateIp
};
