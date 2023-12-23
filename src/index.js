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
  let lyrics_lines = lyricsElement.textContent.split('\n')

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

    // screen position
    let [clickX, clickY] = [evt.clientX, evt.clientY]

    let lyricsRect = lyricsElement.getBoundingClientRect()
    let hightPerLine = lyricsRect.height / lyrics_lines.length

    let [relativeX, relativeY] = [clickX - lyricsRect.x, clickY - lyricsRect.y]
    let lineIdx = Math.floor(relativeY / hightPerLine)
    let line = lyrics_lines[lineIdx]

    if (!isLyricsLine(line)) {
      if (options.verbose)
        console.log('clicked on a line that do not have lyrics')
      return
    }

    // assuming monospaced font here
    let lineWidth = calculateLineWidth(line, lyricsElement)
    let singleCharWith = lineWidth / line.length
    let charIdx = Math.floor(relativeX / singleCharWith)

    if (options.verbose)
      console.log({
        selectedChord,
        clickX,
        clickY,
        relativeX,
        relativeY,
        lineIdx,
        line,
        lineWidth,
        singleCharWith,
        charIdx,
      })

    let chordsLine = lineIdx === 0 ? '' : lyrics_lines[lineIdx - 1]
    if (isLyricsLine(chordsLine)) {
      if (options.verbose) console.log('line over click is not a chords line')
      chordsLine = ''
    }

    let isNewLine = chordsLine.length === 0
    chordsLine = addChord(chordsLine, charIdx, selectedChord)

    if (isNewLine) lyrics_lines.splice(lineIdx, 0, chordsLine)
    else lyrics_lines[lineIdx - 1] = chordsLine

    lyricsElement.textContent = lyrics_lines.join('\n')
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
function removeClassFromChildren(element, className) {
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
