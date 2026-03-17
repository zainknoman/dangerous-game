export const TILE_BEHAVIOR = {
  0: { solid: false },
  1: { solid: true },
  2: { solid: true },
  3: { solid: false, deadly: true },
  8: { solid: false, deadly: true },
  4: { collectible: 'trophy' },
  5: { collectible: 'key' },
  6: { collectible: 'door' },
  7: { collectible: 'gun' },
  14: { collectible: 'jetpack' },
  15: { collectible: 'life' },
};

export function isSolid(tileId) {
  return TILE_BEHAVIOR[tileId]?.solid || false;
}

export function isKill(tileId) {
  return TILE_BEHAVIOR[tileId]?.deadly || false;
}

