function validationError(msg) {
  const e = new Error(msg);
  e.code = 'validation';
  return e;
}

function validateAssetUrl(url, name = 'assetUrl') {
  if (!url || typeof url !== 'string' || !url.startsWith('/uploads/')) {
    throw validationError(`${name} должен быть путём вида /uploads/...`);
  }
}

const grid3x3 = {
  validate(payload) {
    if (!Array.isArray(payload?.tiles) || payload.tiles.length !== 9) {
      throw validationError('grid3x3: нужно ровно 9 tiles');
    }
    payload.tiles.forEach((t, i) => {
      validateAssetUrl(t?.assetUrl, `tiles[${i}].assetUrl`);
      if (typeof t.correct !== 'boolean') throw validationError(`tiles[${i}].correct должен быть boolean`);
    });
    if (!payload.tiles.some((t) => t.correct)) {
      throw validationError('grid3x3: хотя бы одна плитка должна быть correct:true');
    }
  },
  publicView(payload) {
    return { tiles: payload.tiles.map((t, i) => ({ index: i, assetUrl: t.assetUrl })) };
  },
};

const tiles = {
  validate(payload) {
    const { assetUrl, grid, correctCells } = payload ?? {};
    validateAssetUrl(assetUrl);
    const { cols, rows } = grid ?? {};
    if (!Number.isInteger(cols) || cols < 2 || cols > 6) throw validationError('tiles.grid.cols: 2-6');
    if (!Number.isInteger(rows) || rows < 2 || rows > 6) throw validationError('tiles.grid.rows: 2-6');
    if (!Array.isArray(correctCells) || correctCells.length === 0) {
      throw validationError('tiles.correctCells: непустой массив');
    }
    const max = cols * rows;
    correctCells.forEach((c) => {
      if (!Number.isInteger(c) || c < 0 || c >= max) throw validationError(`tiles.correctCells: индекс ${c} вне диапазона`);
    });
  },
  publicView(payload) {
    return { assetUrl: payload.assetUrl, grid: payload.grid };
  },
};

const slider = {
  validate(payload) {
    const { backgroundUrl, objectUrl, target, tolerance, axis } = payload ?? {};
    validateAssetUrl(backgroundUrl, 'backgroundUrl');
    validateAssetUrl(objectUrl, 'objectUrl');
    if (typeof target?.x !== 'number' || target.x < 0 || target.x > 1) throw validationError('slider.target.x: [0,1]');
    if (typeof target?.y !== 'number' || target.y < 0 || target.y > 1) throw validationError('slider.target.y: [0,1]');
    if (typeof tolerance !== 'number' || tolerance <= 0 || tolerance > 0.5) throw validationError('slider.tolerance: (0, 0.5]');
    if (!['both', 'x', 'y'].includes(axis)) throw validationError("slider.axis: 'both'|'x'|'y'");
  },
  publicView(payload) {
    // pieceY — высота скольжения (из target.y), не раскрывает target.x
    return {
      backgroundUrl: payload.backgroundUrl,
      objectUrl: payload.objectUrl,
      axis: payload.axis,
      pieceY: payload.target?.y ?? 0.5,
      objectWidth: payload.objectWidth ?? 56,
      objectHeight: payload.objectHeight ?? 56,
    };
  },
};

const audio = {
  validate(payload) {
    validateAssetUrl(payload?.audioUrl, 'audioUrl');
    if (!payload?.expected || typeof payload.expected !== 'string') {
      throw validationError('audio.expected: непустая строка');
    }
    if ((payload.matching?.maxDistance ?? 0) < 0) throw validationError('audio.maxDistance >= 0');
    if (payload.alternatives !== undefined) {
      if (!Array.isArray(payload.alternatives)) throw validationError('audio.alternatives: массив строк');
      payload.alternatives.forEach((a, i) => {
        if (typeof a !== 'string' || a.trim().length === 0) throw validationError(`audio.alternatives[${i}]: непустая строка`);
      });
    }
  },
  publicView(payload) {
    return { audioUrl: payload.audioUrl };
  },
};

const imageCode = {
  validate(payload) {
    validateAssetUrl(payload?.assetUrl);
    if (!payload?.expected || typeof payload.expected !== 'string') {
      throw validationError('imageCode.expected: непустая строка');
    }
    if ((payload.matching?.maxDistance ?? 0) < 0) throw validationError('imageCode.maxDistance >= 0');
  },
  publicView(payload) {
    return { assetUrl: payload.assetUrl };
  },
};

export const questionTypes = { grid3x3, tiles, slider, audio, imageCode };
