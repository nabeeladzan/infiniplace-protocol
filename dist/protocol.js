"use strict";
// packages/shared/src/protocol.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.isCompatible = exports.isValidColorIndex = exports.DEFAULT_BASELINE_PALETTE_ORDINAL = exports.DEFAULT_BASELINE_PALETTE_ID = exports.DEFAULT_BASELINE_COLOR_INDEX = exports.findColorIndex = exports.DEFAULT_PALETTE = exports.ordinalToPaletteId = exports.paletteIdToOrdinal = exports.getPaletteById = exports.PALETTE_SET = exports.SHADES_PALETTE = exports.EARTH_PALETTE = exports.CLASSIC_PALETTE = exports.WS = exports.tileKey = exports.toCenteredPixelCoord = exports.toPixelCoord = exports.toTileOffset = exports.toTileCoord = exports.PROTOCOL_VERSION = exports.TILE_SIZE = void 0;
// ---- Core constants ----
/**
 * Size of each tile in pixels (64x64).
 * This is a fundamental constant - changing it requires data migration
 * as it affects coordinate calculations and stored tile data.
 */
exports.TILE_SIZE = 64;
/**
 * Protocol version for compatibility checking between client and server.
 * Increment when making breaking changes to the wire protocol.
 */
exports.PROTOCOL_VERSION = 1;
/**
 * Coordinate conversion utilities - these are pure functions with no runtime dependencies.
 */
/**
 * Convert global pixel coordinates to tile coordinates.
 * Determines which tile contains the given pixel position.
 */
const toTileCoord = (x, y) => ({
    tx: Math.floor(x / exports.TILE_SIZE),
    ty: Math.floor(y / exports.TILE_SIZE),
});
exports.toTileCoord = toTileCoord;
/**
 * Convert global pixel coordinates to intra-tile offset.
 * Determines the pixel's position within its containing tile.
 * Handles negative coordinates correctly using modulo arithmetic.
 */
const toTileOffset = (x, y) => {
    const ox = ((x % exports.TILE_SIZE) + exports.TILE_SIZE) % exports.TILE_SIZE;
    const oy = ((y % exports.TILE_SIZE) + exports.TILE_SIZE) % exports.TILE_SIZE;
    return { ox: ox, oy: oy };
};
exports.toTileOffset = toTileOffset;
const toPixelCoord = (tx, ty) => ({
    x: (tx * exports.TILE_SIZE),
    y: (ty * exports.TILE_SIZE),
});
exports.toPixelCoord = toPixelCoord;
/**
 * Convert tile coordinates to the pixel coordinates of the tile's center.
 * Useful for centering the viewport on a specific tile.
 */
const toCenteredPixelCoord = (tx, ty) => ({
    x: (tx * exports.TILE_SIZE + exports.TILE_SIZE / 2),
    y: (ty * exports.TILE_SIZE + exports.TILE_SIZE / 2),
});
exports.toCenteredPixelCoord = toCenteredPixelCoord;
/**
 * Generate a unique string key for a tile coordinate.
 * Used for tile caching, lookup maps, and persistence keys.
 */
const tileKey = (tx, ty) => `${tx}:${ty}`;
exports.tileKey = tileKey;
// =======================================================
//           WebSocket Real-Time Communication Protocol
// =======================================================
/**
 * WebSocket event names for real-time canvas collaboration.
 *
 * Uses string constants to ensure compatibility with Socket.IO
 * or native WebSocket multiplexing libraries. Each event has
 * a strongly-typed payload defined below.
 *
 * The protocol follows a request-response pattern for some operations
 * and server-push for real-time updates.
 */
exports.WS = {
    // ---- Client -> Server Events ----
    SUB: 'SUB', // Subscribe to tile updates (viewport management)
    UNSUB: 'UNSUB', // Unsubscribe from tiles no longer in view
    PAINT: 'PAINT', // Paint a single pixel
    PING: 'PING', // Latency measurement and connection keepalive
    // ---- Server -> Client Events ----
    INIT_TILE: 'INIT_TILE', // Initial tile state on subscription
    DELTA: 'DELTA', // Incremental pixel changes
    ERROR: 'ERROR', // Error notifications
    RATE_LIMIT: 'RATE_LIMIT', // Rate limiting feedback
    POP: 'POP', // Presence updates (user counts)
    USER_COUNT: 'USER_COUNT', // Total connected user count
    PONG: 'PONG', // Ping response for RTT calculation
};
/**
 * Classic 16-color palette - the original InfiniPlace palette.
 *
 * Provides a balanced selection of colors including:
 * - Primary colors (red, green, blue)
 * - Secondary colors (cyan, magenta, yellow)
 * - Grayscale range (black, white)
 * - Earth tones and common UI colors
 *
 * This palette is designed for pixel art and collaborative drawing.
 */
exports.CLASSIC_PALETTE = {
    id: 'classic',
    name: 'Classic',
    version: 3,
    colors: [
        '#FFFFFFFF', // White
        '#FFAAFFFF', // Light Pink
        '#FF55FFFF', // Pink
        '#FF00FFFF', // Purple/Magenta
        '#FFFF00FF', // Yellow
        '#FFAA00FF', // Gold
        '#FF5500FF', // Orange
        '#FF0000FF', // Red
        '#00FFFFFF', // Cyan
        '#00AAFFFF', // Light Blue
        '#0055FFFF', // Blue
        '#0000FFFF', // Dark Blue
        '#00FF00FF', // Lime
        '#00AA00FF', // Green
        '#005500FF', // Dark Green
        '#000000FF', // Black
    ],
};
/**
 * Earth tones palette - perfect for landscapes and natural scenes.
 *
 * Features a range of browns, tans, and earth colors:
 * - Light creams and sands for highlights
 * - Warm tans and camels for midtones
 * - Rich browns and deep chocolates for shadows
 * - Near-black browns for darkest areas
 */
exports.EARTH_PALETTE = {
    id: 'earth',
    name: 'Earth Tones',
    version: 1,
    colors: [
        '#F3E5D0FF', // Light cream
        '#E9D5B3FF', // Sand
        '#DFC49AFF', // Beige tan
        '#D4B183FF', // Light camel
        '#C9A069FF', // Camel
        '#B78A56FF', // Warm tan
        '#A67845FF', // Golden brown
        '#946838FF', // Soft brown
        '#81572DFF', // Medium brown
        '#6D4824FF', // Rich brown
        '#5A3B1CFF', // Deep chestnut
        '#4A2E17FF', // Dark chocolate
        '#3B2312FF', // Espresso
        '#2D1A0EFF', // Dark coffee
        '#1F120AFF', // Very deep brown
        '#120A05FF', // Near-black brown
    ],
};
/**
 * Shades palette - grayscale tones for detailed shading and monochrome art.
 *
 * Provides a comprehensive range of grays from pure white to pure black:
 * - Light tones for highlights and details
 * - Mid-range grays for transitions
 * - Dark tones for shadows and depth
 * - Near-black for maximum contrast
 */
exports.SHADES_PALETTE = {
    id: 'shades',
    name: 'Shades',
    version: 1,
    colors: [
        '#FFFFFFFF', // Pure white
        '#F5F5F5FF', // Light gray 1
        '#EBEBEBFF', // Light gray 2
        '#E0E0E0FF', // Light gray 3
        '#D6D6D6FF', // Medium light gray
        '#CCCCCCFF', // Light medium gray
        '#C2C2C2FF', // Medium gray 1
        '#B8B8B8FF', // Medium gray 2
        '#ADADADFF', // Medium gray 3
        '#A3A3A3FF', // Dark medium gray
        '#999999FF', // Medium dark gray
        '#8F8F8FFF', // Dark gray 1
        '#858585FF', // Dark gray 2
        '#7A7A7AFF', // Dark gray 3
        '#707070FF', // Very dark gray
        '#000000FF', // Pure black
    ],
};
/**
 * Complete palette set containing all available palettes.
 */
exports.PALETTE_SET = {
    palettes: [exports.CLASSIC_PALETTE, exports.EARTH_PALETTE, exports.SHADES_PALETTE],
    defaultPaletteId: exports.CLASSIC_PALETTE.id,
};
/**
 * Get a palette by its ID.
 */
const getPaletteById = (id) => {
    return exports.PALETTE_SET.palettes.find((palette) => palette.id === id);
};
exports.getPaletteById = getPaletteById;
const PALETTE_INDEX_BY_ID = (() => {
    const map = {};
    exports.PALETTE_SET.palettes.forEach((pal, idx) => {
        map[pal.id] = idx;
    });
    return map;
})();
/** Resolve palette id to its ordinal within the palette set. */
const paletteIdToOrdinal = (id) => {
    const idx = PALETTE_INDEX_BY_ID[id];
    return Number.isInteger(idx) ? idx : PALETTE_INDEX_BY_ID[exports.DEFAULT_PALETTE.id];
};
exports.paletteIdToOrdinal = paletteIdToOrdinal;
/** Resolve ordinal back to palette id. */
const ordinalToPaletteId = (ordinal) => {
    const pal = exports.PALETTE_SET.palettes[ordinal];
    return pal ? pal.id : exports.DEFAULT_PALETTE.id;
};
exports.ordinalToPaletteId = ordinalToPaletteId;
/**
 * Get the default palette.
 */
exports.DEFAULT_PALETTE = exports.CLASSIC_PALETTE;
/** Resolve the index of a color string in a palette. Accepts #RRGGBB or #RRGGBBAA. */
const findColorIndex = (color, palette = exports.DEFAULT_PALETTE) => {
    const norm = (hex) => hex.length === 7 ? `${hex.toUpperCase()}FF` : hex.toUpperCase();
    const target = norm(color);
    return palette.colors.findIndex((c) => norm(c) === target);
};
exports.findColorIndex = findColorIndex;
/** Baseline background color index (white) for default tiles. */
exports.DEFAULT_BASELINE_COLOR_INDEX = (() => {
    const idx = (0, exports.findColorIndex)('#FFFFFF');
    return idx >= 0 ? idx : 0;
})();
/** Baseline palette id assigned to untouched pixels. */
exports.DEFAULT_BASELINE_PALETTE_ID = exports.DEFAULT_PALETTE.id;
/** Baseline palette ordinal, paired with DEFAULT_BASELINE_PALETTE_ID. */
exports.DEFAULT_BASELINE_PALETTE_ORDINAL = (0, exports.paletteIdToOrdinal)(exports.DEFAULT_BASELINE_PALETTE_ID);
/**
 * Runtime validation helper for color indices.
 *
 * Checks if a numeric value is a valid index into the given palette.
 * Useful for validating paint requests and preventing array bounds errors.
 */
const isValidColorIndex = (idx, palette = exports.DEFAULT_PALETTE) => Number.isInteger(idx) && idx >= 0 && idx < palette.colors.length;
exports.isValidColorIndex = isValidColorIndex;
/**
 * Compatibility checker for protocol handshake.
 *
 * Validates that server and client are using compatible versions.
 * Returns false if connection should be rejected due to version mismatch.
 *
 * In production, you might want more sophisticated compatibility logic
 * that allows minor version differences or provides upgrade guidance.
 */
const isCompatible = (server) => server.protocolVersion === exports.PROTOCOL_VERSION && server.tileSize === exports.TILE_SIZE;
exports.isCompatible = isCompatible;
//# sourceMappingURL=protocol.js.map