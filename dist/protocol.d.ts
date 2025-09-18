/**
 * TypeScript branded types pattern for compile-time safety.
 * Prevents mixing different coordinate systems or numeric types.
 * e.g., PixelX cannot be accidentally used where TileX is expected.
 */
type Brand<T, B extends string> = T & {
    readonly __brand: B;
};
/**
 * Size of each tile in pixels (64x64).
 * This is a fundamental constant - changing it requires data migration
 * as it affects coordinate calculations and stored tile data.
 */
export declare const TILE_SIZE: 64;
/**
 * Protocol version for compatibility checking between client and server.
 * Increment when making breaking changes to the wire protocol.
 */
export declare const PROTOCOL_VERSION: 1;
/**
 * Global pixel coordinates - can extend infinitely in all directions.
 * These are the "world coordinates" that users see and interact with.
 */
export type PixelX = Brand<number, 'PixelX'>;
export type PixelY = Brand<number, 'PixelY'>;
/**
 * Tile coordinates - which 256x256 tile a pixel belongs to.
 * Calculated by dividing pixel coordinates by TILE_SIZE.
 */
export type TileX = Brand<number, 'TileX'>;
export type TileY = Brand<number, 'TileY'>;
/**
 * A point in global pixel coordinate space.
 * This is what users interact with directly.
 */
export interface PixelCoord {
    x: PixelX;
    y: PixelY;
}
/**
 * A tile's position in the tile grid.
 * Each tile represents a 256x256 pixel region.
 */
export interface TileCoord {
    tx: TileX;
    ty: TileY;
}
/**
 * Position within a single tile (0 to TILE_SIZE-1).
 * Used for addressing individual pixels within a tile.
 */
export type OffsetX = Brand<number, 'OffsetX'>;
export type OffsetY = Brand<number, 'OffsetY'>;
/**
 * A pixel's position relative to its containing tile's top-left corner.
 */
export interface TileOffset {
    ox: OffsetX;
    oy: OffsetY;
}
/**
 * Coordinate conversion utilities - these are pure functions with no runtime dependencies.
 */
/**
 * Convert global pixel coordinates to tile coordinates.
 * Determines which tile contains the given pixel position.
 */
export declare const toTileCoord: (x: number, y: number) => TileCoord;
/**
 * Convert global pixel coordinates to intra-tile offset.
 * Determines the pixel's position within its containing tile.
 * Handles negative coordinates correctly using modulo arithmetic.
 */
export declare const toTileOffset: (x: number, y: number) => TileOffset;
export declare const toPixelCoord: (tx: number, ty: number) => PixelCoord;
/**
 * Convert tile coordinates to the pixel coordinates of the tile's center.
 * Useful for centering the viewport on a specific tile.
 */
export declare const toCenteredPixelCoord: (tx: number, ty: number) => PixelCoord;
/**
 * Generate a unique string key for a tile coordinate.
 * Used for tile caching, lookup maps, and persistence keys.
 */
export declare const tileKey: (tx: TileX | number, ty: TileY | number) => `${number}:${number}` | `${number}:${TileY}` | `${TileX}:${number}` | `${TileX}:${TileY}`;
/**
 * Palette-indexed color system for efficient network transmission.
 *
 * Instead of sending full RGBA values (32 bits per pixel), we use
 * palette indices (typically 5-6 bits) to reference a shared color palette.
 * This dramatically reduces bandwidth for pixel updates and ensures
 * color consistency across all clients.
 *
 * Example: Index 0 might be black, index 1 white, etc.
 * The palette is versioned to handle updates across deployments.
 */
export type ColorIndex = Brand<number, 'ColorIndex'>;
/**
 * Optional raw RGBA color representation for internal rendering.
 * Not transmitted over the wire - only used for local rendering after
 * palette lookup. Format depends on your graphics library (ABGR vs RGBA).
 */
export type RGBA = Brand<number, 'RGBA_u32'>;
/**
 * Per-tile monotonic sequence numbers for ordering updates.
 *
 * Each tile maintains its own sequence counter that increments
 * with every accepted change. This enables:
 * - Ordered delta application (apply seq 5 before seq 6)
 * - Gap detection (if client has seq 3 and receives seq 6, it knows seq 4-5 are missing)
 * - Conflict resolution (newer sequence wins)
 * - Efficient synchronization (client can request "all changes since seq X")
 */
export type TileSeq = Brand<number, 'TileSeq'>;
/**
 * Tile snapshot metadata for initial tile loading.
 *
 * When a client first subscribes to a tile, the server provides a snapshot
 * containing the current state. This includes a compressed image (PNG/WebP)
 * served via HTTP GET, along with metadata for caching and synchronization.
 *
 * Snapshots are generated periodically or after significant changes to
 * reduce the delta chain length and improve client sync performance.
 */
export interface TileSnapshotMeta {
    tx: TileX;
    ty: TileY;
    /**
     * Sequence number at the time this snapshot was generated.
     * Client can request deltas "since seq X" to get incremental updates.
     */
    seq: TileSeq;
    /**
     * HTTP URL where the compressed tile image can be downloaded.
     * Typically serves PNG or WebP format optimized for pixel art.
     */
    snapshotUrl: string;
    /**
     * Palette version this snapshot was rendered with.
     * Must match client palette version for correct color interpretation.
     */
    paletteVersion: number;
    /**
     * Optional palette identifier the tile/snapshot uses.
     * Clients should render this tile using this palette for correct colors.
     */
    paletteId?: string;
    /**
     * Optional HTTP ETag header value for efficient caching.
     * Allows client to use "If-None-Match" requests to avoid re-downloading unchanged snapshots.
     */
    etag?: string;
    /**
     * Optional HTTP Last-Modified timestamp (RFC 7231 format).
     * Enables conditional requests with "If-Modified-Since" header.
     */
    lastModified?: string;
}
/**
 * A single pixel change within a tile.
 * This is the atomic unit of canvas modification.
 */
export interface PixelChange {
    ox: OffsetX;
    oy: OffsetY;
    color: ColorIndex;
    paletteId: string;
}
/**
 * A batch of pixel changes for a specific tile.
 *
 * Delta updates are the core of the real-time collaboration system.
 * Instead of sending full tile images for every change, we send
 * only the modified pixels. This dramatically reduces bandwidth
 * and enables smooth real-time collaboration.
 *
 * Deltas must be applied in sequence order to maintain consistency.
 */
export interface TileDelta {
    tx: TileX;
    ty: TileY;
    seq: TileSeq;
    /**
     * List of pixel modifications in this delta.
     * Each change represents one user's paint action or one pixel
     * in a larger drawing operation.
     */
    changes: PixelChange[];
}
/**
 * Standard error codes for client-server communication.
 * These provide structured error handling and enable appropriate
 * client responses (retry, authentication, etc.).
 */
export type ErrorCode = 'BAD_REQUEST' | 'UNAUTHORIZED' | 'FORBIDDEN' | 'NOT_FOUND' | 'RATE_LIMIT' | 'VALIDATION' | 'INTERNAL';
/**
 * Structured error response frame.
 * Provides consistent error reporting across all protocol operations.
 */
export interface ErrorFrame {
    code: ErrorCode;
    message: string;
    /**
     * Optional additional context about the error.
     * Examples: { field: "color", reason: "index out of range" }
     */
    meta?: Record<string, unknown>;
}
/**
 * Rate limiting feedback for client throttling.
 *
 * When a client exceeds rate limits, the server provides guidance
 * for backing off gracefully instead of continuing to spam requests.
 * This implements token bucket or similar algorithms.
 */
export interface RateLimitHint {
    /**
     * How long the client should wait before retrying (milliseconds).
     * Client should implement exponential backoff based on this value.
     */
    retryAfterMs: number;
    /**
     * How many requests the client can make immediately.
     * Optional - only exposed if server wants to share bucket state.
     */
    tokensRemaining?: number;
    /**
     * Maximum requests allowed in the current time window.
     * Helps client understand the rate limit policy.
     */
    bucketSize?: number;
    /**
     * Rate at which the client earns new request tokens.
     * Expressed as tokens per second (e.g., 10 means 10 requests/sec).
     */
    refillPerSec?: number;
}
/**
 * Real-time presence information for a tile.
 *
 * Provides awareness of how many other users are currently
 * viewing or interacting with each tile. This can drive UI
 * features like "X users viewing" indicators or heat maps.
 */
export interface TilePresence {
    tx: TileX;
    ty: TileY;
    /**
     * Number of connected WebSocket clients currently subscribed to this tile.
     * Updated in real-time as users pan around the canvas.
     */
    count: number;
}
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
export declare const WS: {
    readonly SUB: "SUB";
    readonly UNSUB: "UNSUB";
    readonly PAINT: "PAINT";
    readonly PING: "PING";
    readonly INIT_TILE: "INIT_TILE";
    readonly DELTA: "DELTA";
    readonly ERROR: "ERROR";
    readonly RATE_LIMIT: "RATE_LIMIT";
    readonly POP: "POP";
    readonly USER_COUNT: "USER_COUNT";
    readonly PONG: "PONG";
};
/**
 * Union type of all client-to-server event names.
 * Used for type checking and event handler registration.
 */
export type WsClientEvent = typeof WS.SUB | typeof WS.UNSUB | typeof WS.PAINT | typeof WS.PING;
/**
 * Union type of all server-to-client event names.
 * Used for type checking and event handler registration.
 */
export type WsServerEvent = typeof WS.INIT_TILE | typeof WS.DELTA | typeof WS.ERROR | typeof WS.RATE_LIMIT | typeof WS.POP | typeof WS.USER_COUNT | typeof WS.PONG;
/**
 * Subscribe to real-time updates for a list of tiles.
 *
 * Sent when the client's viewport changes (pan/zoom) to establish
 * which tiles need real-time updates. The server responds with
 * INIT_TILE events containing current state.
 */
export interface SubPayload {
    /**
     * List of tile coordinates to subscribe to.
     * Typically represents the current viewport plus a buffer zone.
     */
    tiles: TileCoord[];
    /**
     * Optional: request deltas starting from a known sequence number.
     * Useful for reconnection - client can catch up on missed changes
     * instead of downloading full snapshots.
     */
    sinceSeq?: TileSeq;
    /**
     * Protocol version for compatibility checking.
     * Server rejects connections with incompatible versions.
     */
    protocol?: number;
}
/**
 * Unsubscribe from tiles that are no longer visible.
 *
 * Sent when tiles leave the viewport to reduce server load
 * and network traffic. Server stops sending updates for these tiles.
 */
export interface UnsubPayload {
    /** List of tile coordinates to stop receiving updates for. */
    tiles: TileCoord[];
}
/**
 * Paint a single pixel at global coordinates.
 *
 * The fundamental user interaction - placing a colored pixel on the canvas.
 * Server validates the request, converts to tile+offset coordinates,
 * and broadcasts the change to all subscribed clients.
 */
export interface PaintPayload {
    x: PixelX;
    y: PixelY;
    color: ColorIndex;
    paletteId?: string;
    /**
     * Optional idempotency key to prevent duplicate paints.
     * Useful for handling network retries or connection issues.
     * Server ignores paints with duplicate clientOpId within a time window.
     */
    clientOpId?: string;
}
/**
 * Ping request for latency measurement and connection keepalive.
 *
 * Used to measure round-trip time and detect connection issues.
 * Server responds with PONG containing the same timestamp.
 */
export interface PingPayload {
    ts: number;
}
/**
 * Initial tile state sent on subscription.
 *
 * When a client subscribes to a tile, the server sends this event
 * containing metadata for downloading the current tile snapshot.
 * This provides the baseline state before delta updates begin.
 */
export interface InitTilePayload extends TileSnapshotMeta {
}
/**
 * Incremental pixel changes for a tile.
 *
 * The core of real-time collaboration - broadcasts pixel changes
 * to all clients subscribed to the affected tile. Clients must
 * apply deltas in sequence order for consistency.
 */
export interface DeltaPayload extends TileDelta {
}
/**
 * Error notification from server.
 *
 * Sent when client requests fail validation or encounter server issues.
 * Client should handle errors appropriately (show user message, retry, etc.).
 */
export interface ErrorPayload extends ErrorFrame {
}
/**
 * Rate limiting guidance for client throttling.
 *
 * Sent when client exceeds rate limits. Client should implement
 * exponential backoff and respect the retry timing guidance.
 */
export interface RateLimitPayload extends RateLimitHint {
}
/**
 * Aggregate connected user count.
 *
 * Broadcast whenever the total number of connected clients changes so the
 * UI can show how many people are online.
 */
export interface UserCountPayload {
    count: number;
}
/**
 * Presence update notification.
 *
 * Optional server push indicating how many users are viewing each tile.
 * Can drive UI features like activity heat maps or "N users here" indicators.
 */
export interface PopPayload extends TilePresence {
}
/**
 * Pong response to client ping.
 *
 * Contains the original client timestamp plus server timestamp
 * for accurate round-trip time calculation and clock synchronization.
 */
export interface PongPayload {
    ts: number;
    serverTs: number;
}
/**
 * Type mapping for client-to-server events and their payloads.
 * Enables compile-time type checking for event handlers and emissions.
 */
export interface ClientToServerEvents {
    [WS.SUB]: (payload: SubPayload) => void;
    [WS.UNSUB]: (payload: UnsubPayload) => void;
    [WS.PAINT]: (payload: PaintPayload) => void;
    [WS.PING]: (payload: PingPayload) => void;
}
/**
 * Type mapping for server-to-client events and their payloads.
 * Enables compile-time type checking for event handlers and emissions.
 */
export interface ServerToClientEvents {
    [WS.INIT_TILE]: (payload: InitTilePayload) => void;
    [WS.DELTA]: (payload: DeltaPayload) => void;
    [WS.ERROR]: (payload: ErrorPayload) => void;
    [WS.RATE_LIMIT]: (payload: RateLimitPayload) => void;
    [WS.POP]: (payload: PopPayload) => void;
    [WS.USER_COUNT]: (payload: UserCountPayload) => void;
    [WS.PONG]: (payload: PongPayload) => void;
}
/**
 * Minimal user reference for event attribution.
 *
 * Represents a user in the context of canvas operations.
 * Kept lightweight to avoid bloating event records.
 */
export interface UserRef {
    id: string;
    handle?: string;
    flags?: number;
}
/**
 * Append-only audit log of individual paint actions.
 *
 * Stores every pixel paint for complete history tracking.
 * Useful for:
 * - Moderation and abuse detection
 * - Timelapse generation
 * - Analytics and user behavior analysis
 * - Rollback capabilities
 *
 * Uses ULID for natural time ordering in distributed systems.
 */
export interface PaintEvent {
    id: string;
    userId: string | null;
    x: PixelX;
    y: PixelY;
    color: ColorIndex;
    paletteId: string;
    createdAt: string;
}
/**
 * Batched delta records for efficient storage and transmission.
 *
 * Instead of storing individual pixel changes, group them into
 * logical batches (per tile, per time window, or per user session).
 * This reduces storage overhead and enables efficient delta streaming.
 *
 * The changes field can be stored as JSON, CBOR, MessagePack, or
 * any other compact serialization format.
 */
export interface TileDeltaRow {
    id: string;
    tx: TileX;
    ty: TileY;
    seq: TileSeq;
    /**
     * Compact encoded list of pixel changes in this batch.
     * Store as JSON for simplicity, or binary formats (CBOR/MessagePack) for efficiency.
     */
    changes: PixelChange[];
    createdAt: string;
}
/**
 * Tile snapshot registry for initial loading and delta compaction.
 *
 * Tracks metadata for pre-rendered tile images stored on disk or cloud storage.
 * Snapshots are periodically generated to:
 * - Reduce delta chain length for faster client synchronization
 * - Provide fallback when delta reconstruction fails
 * - Enable efficient HTTP caching with ETags
 */
export interface TileSnapshotRow {
    tx: TileX;
    ty: TileY;
    version: number;
    imageUrl: string;
    seq: TileSeq;
    paletteVersion: number;
    createdAt: string;
}
/**
 * Protected region definition for content moderation.
 *
 * Defines rectangular areas where painting is restricted or forbidden.
 * Used for:
 * - Preserving important artwork or logos
 * - Creating admin-only areas
 * - Temporary content moderation during events
 *
 * Server validates all paint requests against these regions.
 */
export interface ProtectedRegion {
    /** Left edge of protected rectangle (global pixel coordinates) */
    x1: PixelX;
    /** Top edge of protected rectangle (global pixel coordinates) */
    y1: PixelY;
    /** Right edge of protected rectangle (global pixel coordinates) */
    x2: PixelX;
    /** Bottom edge of protected rectangle (global pixel coordinates) */
    y2: PixelY;
    /** Optional human-readable explanation for why this area is protected */
    reason?: string;
}
/**
 * Server-side paint validation result.
 *
 * Represents the outcome of validating a paint request against
 * all server-side rules: rate limits, protected regions, user permissions, etc.
 */
export type PaintValidation = {
    ok: true;
} | {
    ok: false;
    error: ErrorFrame;
} | {
    ok: false;
    rateLimit: RateLimitHint;
};
/**
 * Versioned color palette definition.
 *
 * Defines the complete set of colors available for painting.
 * Versioning allows palette updates without breaking existing clients.
 * Colors can be specified as hex strings or numeric RGBA values.
 */
export interface Palette {
    id: string;
    name: string;
    version: number;
    /**
     * Array of available colors for painting.
     * Each index in this array corresponds to a ColorIndex value.
     * Hex colors must be CSS-compatible #RRGGBB or #RRGGBBAA (RGBA order).
     */
    colors: readonly string[];
}
/**
 * Collection of available palettes in the system.
 * Users can switch between palettes for different artistic styles.
 */
export interface PaletteSet {
    palettes: readonly Palette[];
    defaultPaletteId: string;
}
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
export declare const CLASSIC_PALETTE: Palette;
/**
 * Earth tones palette - perfect for landscapes and natural scenes.
 *
 * Features a range of browns, tans, and earth colors:
 * - Light creams and sands for highlights
 * - Warm tans and camels for midtones
 * - Rich browns and deep chocolates for shadows
 * - Near-black browns for darkest areas
 */
export declare const EARTH_PALETTE: Palette;
/**
 * Shades palette - grayscale tones for detailed shading and monochrome art.
 *
 * Provides a comprehensive range of grays from pure white to pure black:
 * - Light tones for highlights and details
 * - Mid-range grays for transitions
 * - Dark tones for shadows and depth
 * - Near-black for maximum contrast
 */
export declare const SHADES_PALETTE: Palette;
/**
 * Complete palette set containing all available palettes.
 */
export declare const PALETTE_SET: PaletteSet;
/**
 * Get a palette by its ID.
 */
export declare const getPaletteById: (id: string) => Palette | undefined;
/** Resolve palette id to its ordinal within the palette set. */
export declare const paletteIdToOrdinal: (id: string) => number;
/** Resolve ordinal back to palette id. */
export declare const ordinalToPaletteId: (ordinal: number) => string;
/**
 * Get the default palette.
 */
export declare const DEFAULT_PALETTE: Palette;
/** Resolve the index of a color string in a palette. Accepts #RRGGBB or #RRGGBBAA. */
export declare const findColorIndex: (color: string, palette?: Palette) => number;
/** Baseline background color index (white) for default tiles. */
export declare const DEFAULT_BASELINE_COLOR_INDEX: number;
/** Baseline palette id assigned to untouched pixels. */
export declare const DEFAULT_BASELINE_PALETTE_ID: string;
/** Baseline palette ordinal, paired with DEFAULT_BASELINE_PALETTE_ID. */
export declare const DEFAULT_BASELINE_PALETTE_ORDINAL: number;
/**
 * Runtime validation helper for color indices.
 *
 * Checks if a numeric value is a valid index into the given palette.
 * Useful for validating paint requests and preventing array bounds errors.
 */
export declare const isValidColorIndex: (idx: number, palette?: Palette) => idx is ColorIndex;
/**
 * Protocol handshake information for compatibility verification.
 *
 * Exchanged during connection establishment to ensure client and server
 * are using compatible protocol versions and configuration.
 */
export interface HandshakeInfo {
    protocolVersion: number;
    paletteVersion: number;
    tileSize: number;
}
/**
 * Compatibility checker for protocol handshake.
 *
 * Validates that server and client are using compatible versions.
 * Returns false if connection should be rejected due to version mismatch.
 *
 * In production, you might want more sophisticated compatibility logic
 * that allows minor version differences or provides upgrade guidance.
 */
export declare const isCompatible: (server: HandshakeInfo) => boolean;
export {};
//# sourceMappingURL=protocol.d.ts.map