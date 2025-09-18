// packages/shared/src/protocol.ts
// ---- Core constants ----
/**
 * Size of each tile in pixels (64x64).
 * This is a fundamental constant - changing it requires data migration
 * as it affects coordinate calculations and stored tile data.
 */
export const TILE_SIZE = 64;
/**
 * Protocol version for compatibility checking between client and server.
 * Increment when making breaking changes to the wire protocol.
 */
export const PROTOCOL_VERSION = 1;
/**
 * Coordinate conversion utilities - these are pure functions with no runtime dependencies.
 */
/**
 * Convert global pixel coordinates to tile coordinates.
 * Determines which tile contains the given pixel position.
 */
export const toTileCoord = (x, y) => ({
    tx: Math.floor(x / TILE_SIZE),
    ty: Math.floor(y / TILE_SIZE),
});
/**
 * Convert global pixel coordinates to intra-tile offset.
 * Determines the pixel's position within its containing tile.
 * Handles negative coordinates correctly using modulo arithmetic.
 */
export const toTileOffset = (x, y) => {
    const ox = ((x % TILE_SIZE) + TILE_SIZE) % TILE_SIZE;
    const oy = ((y % TILE_SIZE) + TILE_SIZE) % TILE_SIZE;
    return { ox: ox, oy: oy };
};
export const toPixelCoord = (tx, ty) => ({
    x: (tx * TILE_SIZE),
    y: (ty * TILE_SIZE),
});
/**
 * Convert tile coordinates to the pixel coordinates of the tile's center.
 * Useful for centering the viewport on a specific tile.
 */
export const toCenteredPixelCoord = (tx, ty) => ({
    x: (tx * TILE_SIZE + TILE_SIZE / 2),
    y: (ty * TILE_SIZE + TILE_SIZE / 2),
});
/**
 * Generate a unique string key for a tile coordinate.
 * Used for tile caching, lookup maps, and persistence keys.
 */
export const tileKey = (tx, ty) => `${tx}:${ty}`;
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
export const WS = {
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
export const CLASSIC_PALETTE = {
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
export const EARTH_PALETTE = {
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
export const SHADES_PALETTE = {
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
export const PALETTE_SET = {
    palettes: [CLASSIC_PALETTE, EARTH_PALETTE, SHADES_PALETTE],
    defaultPaletteId: CLASSIC_PALETTE.id,
};
/**
 * Get a palette by its ID.
 */
export const getPaletteById = (id) => {
    return PALETTE_SET.palettes.find((palette) => palette.id === id);
};
const PALETTE_INDEX_BY_ID = (() => {
    const map = {};
    PALETTE_SET.palettes.forEach((pal, idx) => {
        map[pal.id] = idx;
    });
    return map;
})();
/** Resolve palette id to its ordinal within the palette set. */
export const paletteIdToOrdinal = (id) => {
    const idx = PALETTE_INDEX_BY_ID[id];
    return Number.isInteger(idx) ? idx : PALETTE_INDEX_BY_ID[DEFAULT_PALETTE.id];
};
/** Resolve ordinal back to palette id. */
export const ordinalToPaletteId = (ordinal) => {
    const pal = PALETTE_SET.palettes[ordinal];
    return pal ? pal.id : DEFAULT_PALETTE.id;
};
/**
 * Get the default palette.
 */
export const DEFAULT_PALETTE = CLASSIC_PALETTE;
/** Resolve the index of a color string in a palette. Accepts #RRGGBB or #RRGGBBAA. */
export const findColorIndex = (color, palette = DEFAULT_PALETTE) => {
    const norm = (hex) => hex.length === 7 ? `${hex.toUpperCase()}FF` : hex.toUpperCase();
    const target = norm(color);
    return palette.colors.findIndex((c) => norm(c) === target);
};
/** Baseline background color index (white) for default tiles. */
export const DEFAULT_BASELINE_COLOR_INDEX = (() => {
    const idx = findColorIndex('#FFFFFF');
    return idx >= 0 ? idx : 0;
})();
/** Baseline palette id assigned to untouched pixels. */
export const DEFAULT_BASELINE_PALETTE_ID = DEFAULT_PALETTE.id;
/** Baseline palette ordinal, paired with DEFAULT_BASELINE_PALETTE_ID. */
export const DEFAULT_BASELINE_PALETTE_ORDINAL = paletteIdToOrdinal(DEFAULT_BASELINE_PALETTE_ID);
/**
 * Runtime validation helper for color indices.
 *
 * Checks if a numeric value is a valid index into the given palette.
 * Useful for validating paint requests and preventing array bounds errors.
 */
export const isValidColorIndex = (idx, palette = DEFAULT_PALETTE) => Number.isInteger(idx) && idx >= 0 && idx < palette.colors.length;
/**
 * Compatibility checker for protocol handshake.
 *
 * Validates that server and client are using compatible versions.
 * Returns false if connection should be rejected due to version mismatch.
 *
 * In production, you might want more sophisticated compatibility logic
 * that allows minor version differences or provides upgrade guidance.
 */
export const isCompatible = (server) => server.protocolVersion === PROTOCOL_VERSION && server.tileSize === TILE_SIZE;
//# sourceMappingURL=protocol.js.map