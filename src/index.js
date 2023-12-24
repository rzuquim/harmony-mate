/**
 * Creates a new harmony mate that changes the content of a pre tag with the chords
 * @param {Element} lyricsElement - The <pre> element holding the lyrics
 * @param {Element} chordsElement - The container element holding the chords
 * @param {Options} options - custom behavior
 * **/
let new_mate = (lyricsElement, chordsElement, options) => {
  if (lyricsElement.tagName !== 'PRE') {
    throw Error('Harmony mate must be bound to a <pre> element.')
  }

  let selectedChord = ''
  options ??= defaultOptions

  chordsElement.addEventListener('click', (evt) => {
    let clickedEl = evt.target
    if (!clickedEl.classList.contains('chord')) return

    selectedChord = clickedEl.textContent
    removeClassFromChildren(chordsElement, options.selectedChordClass)
    clickedEl.classList.add(options.selectedChordClass)
  })

  lyricsElement.addEventListener('click', (evt) => {
    if (!selectedChord) {
      if (options.verbose) console.log('no chord selected')
      return
    }

    let lines = lyricsElement.textContent.split('\n')
    let lyricsRect = lyricsElement.getBoundingClientRect()

    let [clickX, clickY] = [evt.clientX, evt.clientY]
    let [relativeX, relativeY] = [clickX - lyricsRect.x, clickY - lyricsRect.y]

    let hightPerLine = lyricsRect.height / lines.length
    let lineIdx = Math.floor(relativeY / hightPerLine)
    let clickedLine = lines[lineIdx]

    let [chordsLine, lyricsLine, writeIdx] = selectWriteLine(
      clickedLine,
      lineIdx,
      lines,
    )

    let lineWidth = calculateLineWidth(lyricsLine, lyricsElement) // assuming monospaced font here
    let singleCharWith = lineWidth / lyricsLine.length
    let charIdx = Math.floor(relativeX / singleCharWith)

    if (options.verbose)
      console.log({
        selectedChord,
        clickX,
        clickY,
        relativeX,
        relativeY,
        lineIdx,
        clickedLine,
        lineWidth,
        singleCharWith,
        charIdx,
      })

    chordsLine = addChord(chordsLine, charIdx, selectedChord)

    lines[writeIdx] = chordsLine
    lyricsElement.textContent = lines.join('\n')
  })
}

/**
 * Adds a chord into a the index of the line
 * @param {String} line
 * @param {Number} charIdx
 * @param {String} chord
 * @returns {String} The line with the chord on the correct position
 * **/
let addChord = (line, charIdx, chord) => {
  let missingSpaces = charIdx - line.length
  if (missingSpaces > 0) line += ' '.repeat(missingSpaces)

  let prefix = line.slice(0, charIdx)
  let rest = line.slice(charIdx)
  rest = rest.length > chord.length ? rest.slice(chord.length) : rest
  return prefix + chord + rest
}

/**
 * Returns the line where we should write the chord
 * @param {String} clickedLine
 * @param {number} clickedLineIdx
 * @param {Array} lines (might be mutated if lines are added)
 * @returns {Array} Tuple with the chords line, the lyrics line and the line index to write chord
 * **/
let selectWriteLine = (clickedLine, clickedLineIdx, lines) => {
  if (isBlankLine(clickedLine)) {
    lines.splice(clickedLineIdx, 0, '')
    return [clickedLine, lines[clickedLineIdx + 1], clickedLineIdx]
  }

  // already a chords line
  if (!isLyricsLine(clickedLine)) {
    let nextLine = clickedLineIdx + 1
    let lyricsLine = lines[nextLine]

    while (isBlankLine(lyricsLine) && ++nextLine < lines.length) {
      lyricsLine = lines[nextLine]
    }

    return [clickedLine, lyricsLine, clickedLineIdx]
  }

  // first line of the document
  if (clickedLineIdx === 0) {
    let newLine = ''
    lines.unshift(newLine)
    return [newLine, clickedLine, 0]
  }

  // previous line
  let chordsLineIdx = clickedLineIdx - 1
  let chordsLine = lines[chordsLineIdx]
  if (!isLyricsLine(chordsLine)) return [chordsLine, clickedLine, chordsLineIdx]

  let newLine = ''
  lines.splice(clickedLineIdx, 0, newLine)
  return [newLine, clickedLine, clickedLineIdx]
}

/**
 * Adds a hidden clone of the element to calculate the rendered width
 * @param {String} line
 * @param {Element} lyricsElement
 * @returns {number}
 * **/
let calculateLineWidth = (line, lyricsElement) => {
  let hiddenPre = document.createElement('pre')
  hiddenPre.style.position = 'absolute'
  hiddenPre.style.float = 'left'
  hiddenPre.style.whiteSpace = 'nowrap'
  hiddenPre.style.visibility = 'hidden'
  hiddenPre.style.font = lyricsElement.style.font
  hiddenPre.textContent = line
  document.body.appendChild(hiddenPre)

  let width = hiddenPre.offsetWidth
  document.body.removeChild(hiddenPre)

  return width
}

/**
 * Recursive function to remove the specified class from the given element and all its descendants
 * @param {Element} element
 * @param {String} className
 **/
let removeClassFromChildren = (element, className) => {
  element.classList.remove(className)
  var childElements = element.children
  for (var i = 0; i < childElements.length; i++) {
    removeClassFromChildren(childElements[i], className)
  }
}

/**
 * Checks if line is has lyrics (not chords)
 * @param {String} line
 * @returns {Boolean}
 **/
let isLyricsLine = (line) => /\w{3,}/.test(line) // has any word with 3 or more chars

/**
 * Checks if line is completly blank (we want to preserve this line)
 * @param {String} line
 * @returns {Boolean}
 **/
let isBlankLine = (line) => line.trim() === ''

/**
 * @typedef {Object} Options - options to fine tune the harmony mate behavior.
 * @property {boolean} verbose - should log the memory calculation
 * @property {String} selectedChordClass - the css class with the style of the selected chord
 */
let defaultOptions = {
  verbose: false,
  selectedChordClass: 'is-selected',
}

/**
 * Creates a new harmony mate that changes the content of the element with the id
 * @param {String} lyricsId - the id of the <pre> tag with the lyrics
 * @param {String} chordsId - the id of the element holding possible chords
 * @param {Options} options - custom behavior
 * **/
window.mate_by_id = (lyricsId, chordsId, options) => {
  let lyricsElements = document.getElementById(lyricsId)
  let chordsElements = document.getElementById(chordsId)

  return new_mate(lyricsElements, chordsElements, {
    ...defaultOptions,
    ...options,
  })
}
