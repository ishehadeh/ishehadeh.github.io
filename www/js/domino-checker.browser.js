// @ts-check

(function () {
  "use strict";

  /** @typedef {"up" | "down" | "left" | "right"} Direction */
  /** @typedef {{ x: number, y: number }} Vec2 */
  /** @typedef {{ root: Vec2, direction: Direction }} DominoValue */
  /** @typedef {{ r: number, g: number, b: number, a: number }} RgbaColor */
  /** @typedef {(progress: SolveProgress) => void} ProgressCallback */

  /**
   * @typedef SolveOptions
   * @property {number | null | undefined} [targetCells]
   * @property {number | null | undefined} [maxStates]
   * @property {number | undefined} [yieldEvery]
   * @property {AbortSignal | null | undefined} [signal]
   * @property {ProgressCallback | undefined} [onProgress]
   */

  /**
   * @typedef SolveProgress
   * @property {number} seenStates
   * @property {number} queuedStates
   * @property {number} solutionCount
   */

  /**
   * @typedef SolveResult
   * @property {BlokusGame[]} solutions
   * @property {number} seenStates
   * @property {number} targetCells
   */

  /**
   * @typedef DominoCheckerApi
   * @property {{ Up: "up", Down: "down", Left: "left", Right: "right" }} Direction
   * @property {typeof Domino} Domino
   * @property {typeof BitGrid3D} BitGrid3D
   * @property {typeof BlokusContraption} BlokusContraption
   * @property {typeof BlokusGame} BlokusGame
   * @property {(contraption: BlokusContraption, options?: SolveOptions) => Promise<SolveResult>} solveContraption
   * @property {(file: File) => Promise<ImageData>} loadImageFile
   * @property {(imageData: ImageData) => BlokusContraption} contraptionFromImageData
   * @property {(baseImageData: ImageData, game: BlokusGame, color?: RgbaColor) => ImageData} renderSolutionImage
   * @property {(root?: HTMLElement) => HTMLElement} createApp
   */

  /** @type {{ Up: "up", Down: "down", Left: "left", Right: "right" }} */
  const Direction = Object.freeze({
    Up: "up",
    Down: "down",
    Left: "left",
    Right: "right",
  });

  const BLACK_KEY = "0,0,0,255";
  const WHITE_KEY = "255,255,255,255";
  const BLACK_Z_INDEX = 0;
  const WHITE_Z_INDEX = 1;

  class Domino {
    /**
     * @param {Vec2} root
     * @param {Direction} direction
     */
    constructor(root, direction) {
      /** @type {Vec2} */
      this.root = { x: root.x, y: root.y };
      /** @type {Direction} */
      this.direction = direction;
    }

    /**
     * @param {Vec2} root
     * @param {number} width
     * @param {number} height
     * @returns {Domino[]}
     */
    static allFromRoot(root, width, height) {
      /** @type {Domino[]} */
      const dominoes = [];
      if (root.x > 0) {
        dominoes.push(new Domino(root, Direction.Left));
      }
      if (root.x < width - 1) {
        dominoes.push(new Domino(root, Direction.Right));
      }
      if (root.y > 0) {
        dominoes.push(new Domino(root, Direction.Up));
      }
      if (root.y < height - 1) {
        dominoes.push(new Domino(root, Direction.Down));
      }
      return dominoes;
    }

    /** @returns {Vec2} */
    block1() {
      return { x: this.root.x, y: this.root.y };
    }

    /** @returns {Vec2} */
    block2() {
      if (this.direction === Direction.Up) {
        return { x: this.root.x, y: this.root.y - 1 };
      }
      if (this.direction === Direction.Down) {
        return { x: this.root.x, y: this.root.y + 1 };
      }
      if (this.direction === Direction.Left) {
        return { x: this.root.x - 1, y: this.root.y };
      }
      return { x: this.root.x + 1, y: this.root.y };
    }
  }

  class BitGrid3D {
    /**
     * @param {number} width
     * @param {number} height
     * @param {number} depth
     */
    constructor(width, height, depth) {
      assertWholeNumber(width, "width");
      assertWholeNumber(height, "height");
      assertWholeNumber(depth, "depth");

      /** @type {number} */
      this.width = width;
      /** @type {number} */
      this.height = height;
      /** @type {number} */
      this.depth = depth;
      /** @type {Uint8Array} */
      this.data = new Uint8Array(width * height * depth);
    }

    /**
     * @param {number} x
     * @param {number} y
     * @param {number} z
     * @returns {number}
     */
    index(x, y, z) {
      return z * this.width * this.height + y * this.width + x;
    }

    /**
     * @param {number} x
     * @param {number} y
     * @param {number} z
     * @returns {boolean}
     */
    get(x, y, z) {
      if (x < 0 || y < 0 || z < 0 || x >= this.width || y >= this.height || z >= this.depth) {
        return false;
      }
      return this.data[this.index(x, y, z)] === 1;
    }

    /**
     * @param {number} x
     * @param {number} y
     * @param {number} z
     * @returns {void}
     */
    set(x, y, z) {
      this.data[this.index(x, y, z)] = 1;
    }
  }

  class BlokusContraption {
    /**
     * @param {BitGrid3D} bitGrid
     * @param {Map<string, number>} colorIndices
     */
    constructor(bitGrid, colorIndices) {
      /** @type {BitGrid3D} */
      this.bitGrid = bitGrid;
      /** @type {Map<string, number>} */
      this.colorIndices = colorIndices;
    }

    /**
     * @param {ImageData} imageData
     * @returns {BlokusContraption}
     */
    static fromImageData(imageData) {
      /** @type {Set<string>} */
      const colors = new Set();
      const data = imageData.data;

      for (let offset = 0; offset < data.length; offset += 4) {
        const alpha = data[offset + 3];
        if (alpha !== 0) {
          colors.add(colorKey(data[offset], data[offset + 1], data[offset + 2], alpha));
        }
      }

      let nonSpecialColorCount = 0;
      colors.forEach((key) => {
        if (key !== BLACK_KEY && key !== WHITE_KEY) {
          nonSpecialColorCount += 1;
        }
      });

      const bitGrid = new BitGrid3D(imageData.width, imageData.height, nonSpecialColorCount + 2);
      /** @type {Map<string, number>} */
      const colorIndices = new Map([
        [BLACK_KEY, BLACK_Z_INDEX],
        [WHITE_KEY, WHITE_Z_INDEX],
      ]);

      for (let y = 0; y < imageData.height; y += 1) {
        for (let x = 0; x < imageData.width; x += 1) {
          const offset = imageOffset(imageData.width, x, y);
          const alpha = data[offset + 3];
          if (alpha === 0) {
            continue;
          }

          const key = colorKey(data[offset], data[offset + 1], data[offset + 2], alpha);
          if (!colorIndices.has(key)) {
            colorIndices.set(key, colorIndices.size);
          }

          const index = colorIndices.get(key);
          if (index === undefined) {
            throw new Error("Color index lookup failed.");
          }
          bitGrid.set(x, y, index);
        }
      }

      return new BlokusContraption(bitGrid, colorIndices);
    }

    /** @returns {number} */
    width() {
      return this.bitGrid.width;
    }

    /** @returns {number} */
    height() {
      return this.bitGrid.height;
    }

    /**
     * @param {number} x
     * @param {number} y
     * @returns {boolean}
     */
    isWall(x, y) {
      return this.bitGrid.get(x, y, BLACK_Z_INDEX);
    }

    /**
     * @param {number} x
     * @param {number} y
     * @returns {boolean}
     */
    isWire(x, y) {
      for (let z = 0; z < this.bitGrid.depth; z += 1) {
        if (z !== BLACK_Z_INDEX && z !== WHITE_Z_INDEX && this.bitGrid.get(x, y, z)) {
          return true;
        }
      }
      return false;
    }

    /** @returns {Vec2[]} */
    getStartingPositions() {
      /** @type {Vec2[]} */
      const positions = [];
      for (let y = 0; y < this.height(); y += 1) {
        for (let x = 0; x < this.width(); x += 1) {
          if (this.bitGrid.get(x, y, WHITE_Z_INDEX)) {
            positions.push({ x, y });
          }
        }
      }
      return positions;
    }

    /** @returns {string} */
    toText() {
      const symbols = "#$abcdefghijkmnopqrstuvwxyz";
      /** @type {string[]} */
      const rows = [];
      for (let y = 0; y < this.height(); y += 1) {
        let row = "";
        for (let x = 0; x < this.width(); x += 1) {
          let cell = " ";
          for (let z = 0; z < this.bitGrid.depth; z += 1) {
            if (this.bitGrid.get(x, y, z)) {
              cell = symbols[z] || "?";
              break;
            }
          }
          row += cell;
        }
        rows.push(row);
      }
      return rows.join("\n");
    }
  }

  class BlokusGame {
    /**
     * @param {BlokusContraption} contraption
     * @param {Set<string> | undefined} [placements]
     */
    constructor(contraption, placements) {
      /** @type {BlokusContraption} */
      this.contraption = contraption;
      /** @type {Set<string>} */
      this.placements = placements ? new Set(placements) : new Set();
    }

    /** @returns {BlokusGame} */
    clone() {
      return new BlokusGame(this.contraption, this.placements);
    }

    /** @returns {string} */
    stateKey() {
      return Array.from(this.placements).sort().join(";");
    }

    /**
     * @param {number} x
     * @param {number} y
     * @returns {boolean}
     */
    canPlaceAt(x, y) {
      if (x < 0 || y < 0 || x >= this.contraption.width() || y >= this.contraption.height()) {
        return false;
      }

      if (this.placements.has(positionKey(x, y))) {
        return false;
      }

      if (
        (x + 1 < this.contraption.width() && this.placements.has(positionKey(x + 1, y))) ||
        (x > 0 && this.placements.has(positionKey(x - 1, y))) ||
        (y + 1 < this.contraption.height() && this.placements.has(positionKey(x, y + 1))) ||
        (y > 0 && this.placements.has(positionKey(x, y - 1)))
      ) {
        return false;
      }

      return !this.contraption.isWall(x, y);
    }

    /**
     * @param {Domino} domino
     * @returns {void}
     */
    placeDomino(domino) {
      const block1 = domino.block1();
      const block2 = domino.block2();
      this.placements.add(positionKey(block1.x, block1.y));
      this.placements.add(positionKey(block2.x, block2.y));
    }

    /**
     * @param {Domino} domino
     * @returns {boolean}
     */
    canPlaceDomino(domino) {
      const block1 = domino.block1();
      const block2 = domino.block2();
      return this.canPlaceAt(block1.x, block1.y) && this.canPlaceAt(block2.x, block2.y);
    }

    /**
     * @param {number} x
     * @param {number} y
     * @returns {Vec2[]}
     */
    getOpenCornersFrom(x, y) {
      /** @type {Vec2[]} */
      const candidates = [];
      if (x + 1 < this.contraption.width() && y + 1 < this.contraption.height()) {
        candidates.push({ x: x + 1, y: y + 1 });
      }
      if (x + 1 < this.contraption.width() && y > 0) {
        candidates.push({ x: x + 1, y: y - 1 });
      }
      if (x > 0 && y > 0) {
        candidates.push({ x: x - 1, y: y - 1 });
      }
      if (x > 0 && y + 1 < this.contraption.height()) {
        candidates.push({ x: x - 1, y: y + 1 });
      }
      return candidates.filter((corner) => this.canPlaceAt(corner.x, corner.y));
    }

    /** @returns {Vec2[]} */
    getOpenCornersFromExistingDominoes() {
      /** @type {Vec2[]} */
      const corners = [];
      this.placements.forEach((key) => {
        const position = parsePositionKey(key);
        corners.push(...this.getOpenCornersFrom(position.x, position.y));
      });
      return corners;
    }

    /** @returns {Domino[]} */
    getLegalMoves() {
      /** @type {Domino[]} */
      const legalMoves = [];
      const corners = [
        ...this.contraption.getStartingPositions(),
        ...this.getOpenCornersFromExistingDominoes(),
      ];

      for (const corner of corners) {
        const dominoes = Domino.allFromRoot(corner, this.contraption.width(), this.contraption.height());
        for (const domino of dominoes) {
          if (this.canPlaceDomino(domino)) {
            legalMoves.push(domino);
          }
        }
      }

      return legalMoves;
    }

    /** @returns {BlokusGame[]} */
    directChildStates() {
      return this.getLegalMoves().map((domino) => {
        const child = this.clone();
        child.placeDomino(domino);
        return child;
      });
    }

    /** @returns {string} */
    toText() {
      const symbols = "#$abcdefghijkmnopqrstuvwxyz";
      /** @type {string[]} */
      const rows = [];
      for (let y = 0; y < this.contraption.height(); y += 1) {
        let row = "";
        for (let x = 0; x < this.contraption.width(); x += 1) {
          if (this.placements.has(positionKey(x, y))) {
            row += "X";
            continue;
          }

          let cell = " ";
          for (let z = 0; z < this.contraption.bitGrid.depth; z += 1) {
            if (this.contraption.bitGrid.get(x, y, z)) {
              cell = symbols[z] || "?";
              break;
            }
          }
          row += cell;
        }
        rows.push(row);
      }
      return rows.join("\n");
    }
  }

  /**
   * @param {BlokusContraption} contraption
   * @param {SolveOptions} [options]
   * @returns {Promise<SolveResult>}
   */
  async function solveContraption(contraption, options = {}) {
    const targetCells = options.targetCells ?? 18;
    const yieldEvery = options.yieldEvery ?? 500;
    const maxStates = options.maxStates ?? null;
    const signal = options.signal ?? null;
    const onProgress = options.onProgress;
    /** @type {Set<string>} */
    const seen = new Set();
    /** @type {BlokusGame[]} */
    const stack = [new BlokusGame(contraption)];
    /** @type {BlokusGame[]} */
    const solutions = [];
    let processedSinceYield = 0;

    while (stack.length > 0) {
      if (signal?.aborted) {
        throw new DOMException("Solve was aborted.", "AbortError");
      }

      const game = stack.pop();
      if (!game) {
        break;
      }

      const key = game.stateKey();
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);

      const childStates = game.directChildStates();
      if (childStates.length === 0 && game.placements.size === targetCells) {
        solutions.push(game);
      }

      for (let index = childStates.length - 1; index >= 0; index -= 1) {
        stack.push(childStates[index]);
      }

      if (maxStates !== null && seen.size >= maxStates) {
        throw new Error(`Stopped after ${maxStates} states.`);
      }

      processedSinceYield += 1;
      if (processedSinceYield >= yieldEvery) {
        processedSinceYield = 0;
        if (onProgress) {
          onProgress({
            seenStates: seen.size,
            queuedStates: stack.length,
            solutionCount: solutions.length,
          });
        }
        await waitForFrame();
      }
    }

    if (onProgress) {
      onProgress({
        seenStates: seen.size,
        queuedStates: 0,
        solutionCount: solutions.length,
      });
    }

    return {
      solutions,
      seenStates: seen.size,
      targetCells,
    };
  }

  /**
   * @param {File} file
   * @returns {Promise<ImageData>}
   */
  async function loadImageFile(file) {
    if ("createImageBitmap" in window) {
      try {
        const bitmap = await createImageBitmap(file);
        const imageData = canvasImageSourceToImageData(bitmap, bitmap.width, bitmap.height);
        bitmap.close();
        return imageData;
      } catch (_error) {
        // Fall through to the HTMLImageElement loader for browsers with partial bitmap support.
      }
    }

    const image = await loadImageElement(file);
    return canvasImageSourceToImageData(image, image.naturalWidth, image.naturalHeight);
  }

  /**
   * @param {CanvasImageSource} source
   * @param {number} width
   * @param {number} height
   * @returns {ImageData}
   */
  function canvasImageSourceToImageData(source, width, height) {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = getCanvasContext(canvas);
    context.drawImage(source, 0, 0);
    return context.getImageData(0, 0, canvas.width, canvas.height);
  }

  /**
   * @param {File} file
   * @returns {Promise<HTMLImageElement>}
   */
  function loadImageElement(file) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const image = new Image();
      image.onload = () => {
        URL.revokeObjectURL(url);
        resolve(image);
      };
      image.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Image could not be loaded."));
      };
      image.src = url;
    });
  }

  /**
   * @param {ImageData} imageData
   * @returns {BlokusContraption}
   */
  function contraptionFromImageData(imageData) {
    return BlokusContraption.fromImageData(imageData);
  }

  /**
   * @param {ImageData} baseImageData
   * @param {BlokusGame} game
   * @param {RgbaColor} [color]
   * @returns {ImageData}
   */
  function renderSolutionImage(baseImageData, game, color = { r: 127, g: 127, b: 127, a: 255 }) {
    const copy = new ImageData(
      new Uint8ClampedArray(baseImageData.data),
      baseImageData.width,
      baseImageData.height
    );
    game.placements.forEach((key) => {
      const position = parsePositionKey(key);
      const offset = imageOffset(copy.width, position.x, position.y);
      copy.data[offset] = color.r;
      copy.data[offset + 1] = color.g;
      copy.data[offset + 2] = color.b;
      copy.data[offset + 3] = color.a;
    });
    return copy;
  }

  /**
   * @param {HTMLElement} [root]
   * @returns {HTMLElement}
   */
  function createApp(root = document.body) {
    installStyles();

    /** @type {ImageData | null} */
    let currentImageData = null;
    /** @type {AbortController | null} */
    let abortController = null;

    const app = document.createElement("section");
    app.className = "dc-app";
    app.innerHTML = [
      '<header class="dc-header">',
      '<h1>Domino Checker</h1>',
      '<span class="dc-status" data-role="status">Choose an image</span>',
      "</header>",
      '<div class="dc-controls">',
      '<label class="dc-field">Image <input data-role="file" type="file" accept="image/png,image/*"></label>',
      '<label class="dc-field">Target cells <input data-role="target" type="number" min="0" step="2" value="18"></label>',
      '<button data-role="solve" type="button" disabled>Solve</button>',
      '<button data-role="stop" type="button" disabled>Stop</button>',
      "</div>",
      '<main class="dc-main">',
      '<canvas class="dc-preview" data-role="preview"></canvas>',
      '<pre class="dc-log" data-role="log"></pre>',
      "</main>",
      '<div class="dc-solutions" data-role="solutions"></div>',
    ].join("");
    root.appendChild(app);

    const fileInput = getRequiredElement(app, "file", HTMLInputElement);
    const targetInput = getRequiredElement(app, "target", HTMLInputElement);
    const solveButton = getRequiredElement(app, "solve", HTMLButtonElement);
    const stopButton = getRequiredElement(app, "stop", HTMLButtonElement);
    const previewCanvas = getRequiredElement(app, "preview", HTMLCanvasElement);
    const status = getRequiredElement(app, "status", HTMLElement);
    const log = getRequiredElement(app, "log", HTMLPreElement);
    const solutions = getRequiredElement(app, "solutions", HTMLElement);

    fileInput.addEventListener("change", () => {
      const file = fileInput.files?.[0];
      if (!file) {
        return;
      }

      setStatus(status, "Loading image");
      loadImageFile(file)
        .then((imageData) => {
          currentImageData = imageData;
          drawImageData(previewCanvas, imageData);
          const contraption = contraptionFromImageData(imageData);
          log.textContent = contraption.toText();
          solutions.textContent = "";
          solveButton.disabled = false;
          setStatus(status, `${imageData.width} x ${imageData.height}`);
        })
        .catch((error) => {
          solveButton.disabled = true;
          setStatus(status, errorMessage(error));
        });
    });

    solveButton.addEventListener("click", () => {
      if (!currentImageData) {
        return;
      }

      const targetCells = Number(targetInput.value);
      if (!Number.isFinite(targetCells) || targetCells < 0) {
        setStatus(status, "Invalid target");
        return;
      }

      abortController = new AbortController();
      solveButton.disabled = true;
      stopButton.disabled = false;
      solutions.textContent = "";
      setStatus(status, "Solving");

      const contraption = contraptionFromImageData(currentImageData);
      solveContraption(contraption, {
        targetCells,
        signal: abortController.signal,
        onProgress(progress) {
          setStatus(status, `${progress.seenStates} states, ${progress.solutionCount} finals`);
        },
      })
        .then((result) => {
          if (!currentImageData) {
            return;
          }
          setStatus(status, `Found ${result.solutions.length} final solutions from ${result.seenStates} states`);
          renderSolutions(solutions, currentImageData, result.solutions);
        })
        .catch((error) => {
          setStatus(status, errorMessage(error));
        })
        .finally(() => {
          solveButton.disabled = false;
          stopButton.disabled = true;
          abortController = null;
        });
    });

    stopButton.addEventListener("click", () => {
      abortController?.abort();
    });

    return app;
  }

  /**
   * @param {HTMLElement} container
   * @param {ImageData} baseImageData
   * @param {BlokusGame[]} games
   * @returns {void}
   */
  function renderSolutions(container, baseImageData, games) {
    container.textContent = "";
    games.forEach((game, index) => {
      const imageData = renderSolutionImage(baseImageData, game);
      const canvas = document.createElement("canvas");
      canvas.className = "dc-solution";
      drawImageData(canvas, imageData);

      const link = document.createElement("a");
      link.className = "dc-download";
      link.download = `solution_${index}.png`;
      link.href = canvas.toDataURL("image/png");
      link.textContent = `Solution ${index}`;
      link.appendChild(canvas);
      container.appendChild(link);
    });
  }

  /**
   * @param {HTMLCanvasElement} canvas
   * @param {ImageData} imageData
   * @returns {void}
   */
  function drawImageData(canvas, imageData) {
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    getCanvasContext(canvas).putImageData(imageData, 0, 0);
  }

  /** @returns {Promise<void>} */
  function waitForFrame() {
    return new Promise((resolve) => {
      requestAnimationFrame(() => resolve());
    });
  }

  /**
   * @param {number} width
   * @param {number} x
   * @param {number} y
   * @returns {number}
   */
  function imageOffset(width, x, y) {
    return (y * width + x) * 4;
  }

  /**
   * @param {number} r
   * @param {number} g
   * @param {number} b
   * @param {number} a
   * @returns {string}
   */
  function colorKey(r, g, b, a) {
    return `${r},${g},${b},${a}`;
  }

  /**
   * @param {number} x
   * @param {number} y
   * @returns {string}
   */
  function positionKey(x, y) {
    return `${x},${y}`;
  }

  /**
   * @param {string} key
   * @returns {Vec2}
   */
  function parsePositionKey(key) {
    const comma = key.indexOf(",");
    return {
      x: Number(key.slice(0, comma)),
      y: Number(key.slice(comma + 1)),
    };
  }

  /**
   * @param {HTMLCanvasElement} canvas
   * @returns {CanvasRenderingContext2D}
   */
  function getCanvasContext(canvas) {
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("2D canvas is unavailable.");
    }
    return context;
  }

  /**
   * @param {number} value
   * @param {string} name
   * @returns {void}
   */
  function assertWholeNumber(value, name) {
    if (!Number.isInteger(value) || value < 0) {
      throw new Error(`${name} must be a non-negative integer.`);
    }
  }

  /**
   * @param {HTMLElement} element
   * @param {string} message
   * @returns {void}
   */
  function setStatus(element, message) {
    element.textContent = message;
  }

  /**
   * @param {unknown} error
   * @returns {string}
   */
  function errorMessage(error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return "Stopped";
    }
    if (error instanceof Error) {
      return error.message;
    }
    return String(error);
  }

  /**
   * @template {HTMLElement} T
   * @param {HTMLElement} root
   * @param {string} role
   * @param {new (...args: any[]) => T} constructor
   * @returns {T}
   */
  function getRequiredElement(root, role, constructor) {
    const element = root.querySelector(`[data-role="${role}"]`);
    if (!(element instanceof constructor)) {
      throw new Error(`Missing ${role} element.`);
    }
    return element;
  }

  /** @returns {void} */
  function installStyles() {
    if (document.querySelector("style[data-domino-checker]")) {
      return;
    }
    const style = document.createElement("style");
    style.setAttribute("data-domino-checker", "true");
    style.textContent = `
.dc-app {
  color: #18201d;
  background: #f6f7f4;
  font: 14px/1.45 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  min-height: 100vh;
  padding: 18px;
}
.dc-header,
.dc-controls,
.dc-main,
.dc-solutions {
  max-width: 1100px;
  margin: 0 auto;
}
.dc-header {
  align-items: baseline;
  display: flex;
  gap: 16px;
  justify-content: space-between;
  margin-bottom: 14px;
}
.dc-header h1 {
  font-size: 24px;
  font-weight: 650;
  letter-spacing: 0;
  margin: 0;
}
.dc-status {
  color: #53615b;
  text-align: right;
}
.dc-controls {
  align-items: end;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 16px;
}
.dc-field {
  color: #344139;
  display: grid;
  font-size: 12px;
  gap: 4px;
}
.dc-field input,
.dc-controls button {
  border: 1px solid #b9c3be;
  border-radius: 6px;
  box-sizing: border-box;
  color: #18201d;
  font: inherit;
  min-height: 36px;
  padding: 7px 10px;
}
.dc-field input[type="number"] {
  width: 108px;
}
.dc-controls button {
  background: #1f6b52;
  color: #ffffff;
  cursor: pointer;
  min-width: 78px;
}
.dc-controls button:disabled {
  background: #d7ddda;
  color: #6c7872;
  cursor: default;
}
.dc-main {
  align-items: start;
  display: grid;
  gap: 16px;
  grid-template-columns: minmax(220px, 420px) 1fr;
}
.dc-preview,
.dc-solution {
  background: repeating-conic-gradient(#dce1de 0% 25%, #ffffff 0% 50%) 50% / 18px 18px;
  image-rendering: pixelated;
  max-width: 100%;
}
.dc-preview {
  border: 1px solid #b9c3be;
  min-height: 220px;
}
.dc-log {
  background: #ffffff;
  border: 1px solid #d2d9d5;
  border-radius: 6px;
  box-sizing: border-box;
  color: #18201d;
  margin: 0;
  min-height: 220px;
  overflow: auto;
  padding: 12px;
  white-space: pre;
}
.dc-solutions {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  margin-top: 16px;
}
.dc-download {
  color: #275143;
  display: grid;
  gap: 6px;
  text-decoration: none;
}
@media (max-width: 760px) {
  .dc-app {
    padding: 12px;
  }
  .dc-header {
    display: grid;
    gap: 6px;
  }
  .dc-status {
    text-align: left;
  }
  .dc-main {
    grid-template-columns: 1fr;
  }
}
`;
    document.head.appendChild(style);
  }

  /** @type {DominoCheckerApi} */
  const api = {
    Direction,
    Domino,
    BitGrid3D,
    BlokusContraption,
    BlokusGame,
    solveContraption,
    loadImageFile,
    contraptionFromImageData,
    renderSolutionImage,
    createApp,
  };

  /** @type {Window & { DominoChecker?: DominoCheckerApi }} */
  const targetWindow = window;
  targetWindow.DominoChecker = api;

  const script = document.currentScript;
  const autoApp = !(script instanceof HTMLScriptElement) || script.dataset.autoApp !== "false";
  if (autoApp) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => createApp());
    } else {
      createApp();
    }
  }
})();
