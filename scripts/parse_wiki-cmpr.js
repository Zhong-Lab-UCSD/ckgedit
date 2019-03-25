function parse_wikitext (id) {
  if (ckgedit_dwedit_reject) {
    var dom = GetE('ebut_cancel')
    dom.click()
    return true
  }
  var useComplexTables = getComplexTables()

  function fontLinkReconcile () {
    // let regex = /<font\s*((?!>)[\s\S])*?>\s+(\*\*|__|\/\/|'')\s+_\s+\1\s+<\/font>/gm
    // activeResults = activeResults.replace(regex, function (m) {
    //   m = m.replace(/\s+/g, '')
    //   return m
    // })

    let promptFunction = (match, proposal) => {
      let val = window.prompt(LANG.plugins.ckgedit.font_err_1 + '\nFrom:\n' +
        match + '\nTo:\n' + proposal + '\n' + LANG.plugins.ckgedit.font_err_2)
      if (val == null) {
        if (ckgedit_to_dwedit) {
          ckgedit_to_dwedit = false
          return proposal
        } else throw new Error(LANG.plugins.ckgedit.font_err_throw)
      }
      if (val) return val
      return proposal
    }

    /**
     * NOTE: nested `<font> </font>`, `[[ ]]` and `{{ }}` is not considered
     * here.
     *
     * This matches if there are `<font> </font>` within links `[[ ]]`.
     */
    let regex = /\[\[((?:(?!]])[\s\S])*?)(<font\s*(?:(?!>)[\s\S])*?>)((?:(?!]])[\s\S])*?)<\/font>([\s\S]*?)]]/gim
    if (activeResults.match(regex)) {
      activeResults = activeResults.replace(
        regex, (match, linkToFont, fontStart, insideFont, fontToLink) => {
          return promptFunction(match,
            fontStart + '[[' + linkToFont + insideFont + fontToLink +
            ']]</font>'
          )
        }
      )
    }

    /**
     * This matches if there are `<font> </font>` within images (image captions)
     * or plugins `{{ }}`.
     */
    regex = /\{\{((?:(?!}})[\s\S])*?)(<font\s*(?:(?!>)[\s\S])*?>)((?:(?!}})[\s\S])*?)<\/font>([\s\S]*?)}}/gim
    if (activeResults.match(regex)) {
      activeResults = activeResults.replace(
        regex, (match, linkToFont, fontStart, insideFont, fontToLink) => {
          return promptFunction(match,
            fontStart + '{{' + linkToFont + insideFont + fontToLink +
            '}}</font>'
          )
        }
      )
    }

    /**
     * These matches if `<font> </font>` and links `[[ ]]` are interlaced.
     * (technically this should never happen)
     *
     * First `[[ <font> ]] </font>`
     */
    regex = /\[\[((?:(?!]])[\s\S])*?)(<font\s*(?:(?!>)[\s\S])*?>)((?:(?!<\/font>)[\s\S])*?]][\s\S]*?)<\/font>/gim
    if (activeResults.match(regex)) {
      activeResults = activeResults.replace(
        regex, (match, linkToFont, fontStart, insideFont) => {
          // Note that `]]` is within capture group `insideFont`
          return promptFunction(match,
            fontStart + '[[' + linkToFont + insideFont + '</font>'
          )
        }
      )
    }

    /**
     * Then `<font> [[ </font> ]]`
     */
    regex = /(<font\s*(?:(?!>)[\s\S])*?>)((?:(?!<\/font>)[\s\S])*?\[\[(?:(?!]])[\s\S])*?)<\/font>([\s\S]*?)]]/gim
    if (activeResults.match(regex)) {
      activeResults = activeResults.replace(
        regex, (match, fontStart, insideFont, fontToLink) => {
          // Note that `[[` is within capture group `insideFont`
          return promptFunction(match,
            fontStart + insideFont + fontToLink + ']]</font>'
          )
        }
      )
    }

    /**
     * These matches if `<font> </font>` and links `{{ }}` are interlaced.
     * (technically this should never happen)
     *
     * First `{{ <font> }} </font>`
     */
    regex = /\{\{((?:(?!}})[\s\S])*?)(<font\s*(?:(?!>)[\s\S])*?>)((?:(?!<\/font>)[\s\S])*?}}[\s\S]*?)<\/font>/gim
    if (activeResults.match(regex)) {
      activeResults = activeResults.replace(
        regex, (match, linkToFont, fontStart, insideFont) => {
          // Note that `}}` is within capture group `insideFont`
          return promptFunction(match,
            fontStart + '{{' + linkToFont + insideFont + '</font>'
          )
        }
      )
    }

    /**
     * Then `<font> {{ </font> }}`
     */
    regex = /(<font\s*(?:(?!>)[\s\S])*?>)((?:(?!<\/font>)[\s\S])*?\{\{(?:(?!}})[\s\S])*?)<\/font>([\s\S]*?)}}/gim
    if (activeResults.match(regex)) {
      activeResults = activeResults.replace(
        regex, (match, fontStart, insideFont, fontToLink) => {
          // Note that `{{` is within capture group `insideFont`
          return promptFunction(match,
            fontStart + insideFont + fontToLink + '}}</font>'
          )
        }
      )
    }
  }
  //   /**
  //      table debugging code;
  //   */
  // function check_rowspans (rows, start_row, ini) {
  //   var tmp = new Array()
  //   for (var i = start_row; i < rows.length; i++) {
  //     for (var col = 0; col < rows[i].length; col++) {
  //       if (rows[i][col].rowspan > 0) {
  //         var _text = rows[i][col].text
  //         tmp.push({ row: i, column: col, spans: rows[i][col].rowspan, text: _text })
  //         if (!ini) break
  //       }
  //     }
  //   }
  //   return tmp
  // }

  // function insert_rowspan (row, col, spans, rows, shift) {
  //   var prev_colspans = rows[row][col].colspan ? rows[row][col].colspan : 0
  //   rows[row][col].rowspan = 0
  //   for (i = 0; i < spans - 1; i++) {
  //           // debug_row(rows,row,col,"insert_rowspan start");
  //     rows[++row].splice(col, 0, { type: 'td', rowspan: 0, colspan: prev_colspans, prev_colspan: prev_colspans, text: ' ::: ' })
  //   }
  // }

  // function reorder_span_rows (rows) {
  //   var tmp_start = check_rowspans(rows, 0, true)
  //   var num_spans = tmp_start.length
  //   if (!num_spans) return false

  //   var row = tmp_start[0].row
  //   var col = tmp_start[0].column
  //   insert_rowspan(row, col, tmp_start[0].spans, rows)

  //   num_spans--
  //   for (var i = 0; i < num_spans; i++) {
  //     row++
  //     var tmp = check_rowspans(rows, row, false)
  //     if (tmp.length) {
  //       insert_rowspan(tmp[0].row, tmp[0].column, tmp[0].spans, rows)
  //     }
  //   }
  //   return true
  // }

  window.dwfckTextChanged = false
  if (id != 'bakup') draft_delete()
  var line_break = '__L_BR_K__'
  var markup = {
    'b': '**',
    'i': '//',
    'em': '//',
    'u': '__',
    'br': line_break + '\n',
    'br_same_line': line_break,
    'strike': '<del>',
    'del': '<del>',
    's': '<del>',
    'p': '\n\n',
    'a': '[[',
    'img': '\{\{',
    'strong': '**',
    'h1': '\n====== ',
    'h2': '\n===== ',
    'h3': '\n==== ',
    'h4': '\n=== ',
    'h5': '\n== ',
    'td': true,
    'th': true,
    'tr': true,
    'table': true,
    'ol': '  - ',
    'ul': '  * ',
    'li': '',
    'code': "\'\'",
    'pre': '\n<',
    'hr': '\n\n----\n\n',
    'sub': '<sub>',
    'font': '',
    'sup': '<sup>',
    'div': '\n\n',
    'span': '\n',
    'dl': '\n',
    'dd': '\n',
    'dt': '\n'
  }
  var markup_end = {
    'del': '</del>',
    's': '</del>',
    'strike': '</del>',
    'br': ' ',
    'a': ']]',
    'img': '\}\}',
    'h1': ' ======\n',
    'h2': ' =====\n',
    'h3': ' ====\n',
    'h4': ' ===\n',
    'h5': ' ==\n',
    'ol': ' ',
    'ul': ' ',
    'li': '\n',
    'pre': '\n</',
    'sub': '</sub>',
    'sup': '</sup> ',
    'div': '\n\n',
    'p': '\n\n',
    'font': '</font>',
    'span': ' '
  }

  markup['temp_u'] = 'CKGE_TMP_u'
  markup['temp_strong'] = 'CKGE_TMP_strong'
  markup['temp_em'] = 'CKGE_TMP_em'
  markup['temp_i'] = 'CKGE_TMP_i'
  markup['temp_b'] = 'CKGE_TMP_b'
  markup['temp_del'] = 'CKGE_TMP_del'
  markup['temp_strike'] = 'CKGE_TMP_strike'
  markup['temp_code'] = 'CKGE_TMP_code'
  markup['temp_sup'] = 'CKGE_TMP_sup'
  markup['temp_csup'] = 'CKGE_TMP_csup'
  markup['temp_sub'] = 'CKGE_TMP_sub'
  markup['temp_csub'] = 'CKGE_TMP_csub'
  markup['temp_del'] = 'CKGE_TMP_del'
  markup['temp_cdel'] = 'CKGE_TMP_cdel'
  markup['temp_strike'] = 'CKGE_TMP_del'
  markup['temp_cstrike'] = 'CKGE_TMP_cdel'
  markup['temp_s'] = 'CKGE_TMP_del'
  markup['temp_cs'] = 'CKGE_TMP_cdel'

  var $FORMAT_SUBST = {
    'CKGE_TMP_b': '**',
    'CKGE_TMP_strong': '**',
    'CKGE_TMP_em': '\/\/',
    'CKGE_TMP_u': '__',
    'CKGE_TMP_sup': '<sup>',
    'CKGE_TMP_sub': '<sub>',
    'CKGE_TMP_cdel': '</del>',
    'CKGE_TMP_csub': '</sub>',
    'CKGE_TMP_csup': '</sup>',
    'CKGE_TMP_del': '<del>',
    'CKGE_TMP_strike': '<del>',
    'CKGE_TMP_code': "\'\'"
  }

  markup['blank'] = ''
  markup['fn_start'] = '(('
  markup['fn_end'] = '))'
  markup['row_span'] = ':::'
  markup['p_insert'] = '_PARA__TABLE_INS_'
  markup['format_space'] = '_FORMAT_SPACE_'
  markup['pre_td'] = '<'  // removes newline from before < which corrupts table
  var format_chars = { 'strong': true, 'b': true, 'i': true, 'em': true, 'u': true, 'del': true, 'strike': true, 'code': true, 'sup': true, 'sub': true, 's': true }

  var rootLevelResultsCache = ''
  var activeResults = ''
  var HTMLParser_LBR = false
  var HTMLParser_PRE = false
  var HTMLParser_Geshi = false
  var HTMLParser_COLSPAN = false
  var HTMLParser_FORMAT_SPACE = false
  var HTMLParser_MULTI_LINE_PLUGIN = false
  var HTMLParser_NOWIKI = false
  var HTMLFormatInList = false
  var HTMLAcroInList = false
  var HTML_InterWiki = false
  var HTMLParserFont = false
  var HTMLLinkInList = false
  var HTMLLinkInCodeRemoved = false
  var HTMLFontInLinkMerged = false

  var HTMLParserTopNotes = new Array()
  var HTMLParserBottomNotes = new Array()
  var HTMLParserOpenAngleBracket = false
  var HTMLParserParaInsert = markup['p_insert']

  var geshi_classes = '(br|co|coMULTI|es|kw|me|nu|re|st|sy)[0-9]'
  String.prototype.splice = function (idx, rem, s) {
    return (this.slice(0, idx) + s + this.slice(idx + Math.abs(rem)))
  }
  String.frasl = new RegExp('⁄\|&frasl;\|&#8260;\|&#x2044;', 'g')
  geshi_classes = new RegExp(geshi_classes)

  /**
   * @class
   * TableObj - an object for a table instance
   * @property {string} prevText - previous Dokuwiki text, to be included when
   *    the Dokuwiki code for this table is generated.
   *    This is used to cache the converted Dokuwiki code so far to create
   *    an enclosed environment for the table content only. (`activeResults`
   *    will only include the contents within the table now.)
   * @property {Array<Array<TableCellObj|number>>} rows - the two-dimensional
   *    array of cell objects
   *    For the cell object, it will be either `TABLE_ROW_SPAN` ( = 1 ) for
   *    rowspan placeholders, `TABLE_COL_SPAN` ( = 2 ) for colspan
   *    placeholders, or a `TableCellObj` object.
   * @property {Array<number>} pendingRowSpans - an sparse array of pending
   *    number of rowspan cells from previous rows, for examples, if a
   *    cell from last row at column index 3 has rowspan = 5, then
   *    `pendingRowSpans[3] = 4` for the current row, when the rowspan
   *    placeholder is inserted into `rows[currRowIndex]`, the value will be
   *    decreased by 1, so `pendingRowSpans[3] = 3` for the next row.
   * @property {Array<boolean>} pendingRowSpanIsHeader - an sparse array
   *    indicating whether pending rowspan cell is from a `th` (`true`) or a
   *    `td`.
   *
   * @constructor
   * @param {string} prevText - previous Dokuwiki text, to be included when
   *    the Dokuwiki code for this table is generated.
   */
  var TableObj = class TableObj {
    constructor (prevText) {
      this.prevText = prevText
      this.rows = []
      this.pendingRowSpans = []
      this.pendingRowSpanIsHeader = []
    }

    /**
     * close the table and return the resulting Dokuwiki code up to the table
     * @param {string} activeResults - the remaining `activeResults` that is
     *    not processed (should not happen as there should be no valid text
     *    between the last `</tr>` and the `</table>`)
     */
    close (activeResults) {
      let tableResult = ''
      for (let i = 0; i < this.rows.length; i++) {
        let typeSeparator = null
        for (let col = 0; col < this.rows[i].length; col++) {
          let currCell = this.rows[i][col]
          if (currCell === this.constructor.TABLE_ROW_SPAN ||
            currCell === this.constructor.TABLE_ROW_SPAN_HEADER) {
            tableResult +=
              (currCell === this.constructor.TABLE_ROW_SPAN ? '|' : '^') +
              this.constructor.MARKUP_ROW_SPAN
          } else if (currCell === this.constructor.TABLE_COL_SPAN) {
            // TABLE_COL_SPAN is just a blank string
            // `type` is previous type
            tableResult += typeSeparator
          } else {
            typeSeparator = currCell.type === 'th' ? '^' : '|'
            tableResult += currCell.getText()
          }
        }
        tableResult += '|\n'
      }
      return this.prevText + '\n\n' + tableResult
    }

    startRow () {
      this.rows.push([])
      // insert all colspan placeholders at the beginning
      this.insertRowSpans()
    }

    /**
     * Insert row span element at the current location if needed
     */
    insertRowSpans () {
      let currentRow = this.rows[this.rows.length - 1]
      while (this.pendingRowSpans[currentRow.length] > 0) {
        this.pendingRowSpans[currentRow.length]--
        currentRow.push(this.pendingRowSpanIsHeader[currentRow.length]
          ? this.constructor.TABLE_ROW_SPAN_HEADER
          : this.constructor.TABLE_ROW_SPAN)
      }
    }

    startCell (tag) {
      this.rows[this.rows.length - 1].push(new TableCellObj(tag))
    }

    closeCell (activeResults) {
      let currentRow = this.rows[this.rows.length - 1]
      let currCell = this.getCurrentCell()
      currCell.close(activeResults)
      /** Insert col span placeholders */
      for (let col = 1; col < currCell.colSpan; col++) {
        currentRow.push(this.constructor.TABLE_COL_SPAN)
      }
      /** Extend row span placeholders */
      this.insertRowSpans()
    }

    getCurrentCell () {
      let currentRow = this.rows[this.rows.length - 1]
      return currentRow && currentRow[currentRow.length - 1]
    }

    setRowSpan (rowSpan) {
      let currentRow = this.rows[this.rows.length - 1]
      this.getCurrentCell().rowSpan = rowSpan
      this.pendingRowSpans[currentRow.length - 1] = rowSpan - 1
      this.extendRowSpans()
    }

    setColSpan (colSpan) {
      this.getCurrentCell().colSpan = colSpan
      this.extendRowSpans()
    }

    extendRowSpans () {
      let currentRow = this.rows[this.rows.length - 1]
      let currCell = this.getCurrentCell()
      for (let col = 1; col < currCell.colSpan; col++) {
        this.pendingRowSpans[currentRow.length - 1 + col] =
          currCell.rowSpan - 1
        this.pendingRowSpanIsHeader[currentRow.length - 1 + col] =
          (currCell.type === 'th')
      }
    }
  }

  TableObj.TABLE_ROW_SPAN = 1
  TableObj.TABLE_ROW_SPAN_HEADER = 2
  TableObj.TABLE_COL_SPAN = 10

  TableObj.MARKUP_ROW_SPAN = ':::'

  /**
   * TableCellObj - an object for table cell elements
   * @class
   * @property {string} type - the type of the table cell (`th` or `td`)
   * @property {string} text - the Dokuwiki text within the cell when it is
   *    closed
   * @property {string} [align] - align information for the cell
   * @property {number} [rowSpan] - row span information for the cell
   * @property {number} [colSpan] - col span information for the cell
   *
   * @constructor
   * @param {string} tag - HTML tag for the table cell (`th` or `td`)
   */
  var TableCellObj = class TableCellObj {
    constructor (tag) {
      this.type = tag
      this.text = ''
      this.align = null
    }

    /**
     * Close the cell, store the resulting Dokuwiki code in its `text`
     * @param {string} activeResults - the remaining `activeResults` that is
     *    not processed in the cell
     */
    close (activeResults) {
      if (activeResults.endsWith(markup_end['p'])) {
        activeResults = activeResults.substring(
          0, activeResults.length - markup_end['p'].length)
      }
      this.text = activeResults || ''
    }

    getText () {
      let result = (this.type === 'td') ? '|' : '^'
      if (this.text) {
        let align = this.align ? this.align : false
        if (align === 'center' || align === 'right') {
          result += '  '
        }
        if (this.text.match(/[\n|^]/)) {
          result += this.constructor.complexCellBegin +
            this.text + this.constructor.complexCellEnd
        } else {
          result += this.text
        }
        if (align === 'center' || align === 'left') {
          result += '  '
        }
      } else {
        result += ' '
      }
      return result
    }

    setAlign (attr) {
      if (attr.name === 'align') {
        this.align = attr.escaped
      } else if (attr.name === 'class') {
        let matches
        if ((matches = attr.value.match(/\s*(\w+)align/))) {
          this.align = matches[1]
        } else if ((matches = attr.value.match(/(left|center|right)/))) {
          this.align = matches[1]
        }
      }
    }
  }

  TableCellObj.complexCellBegin = '~~TABLE_CELL_WRAP_START~~<WRAP>\n'
  TableCellObj.complexCellEnd = '\n</WRAP>~~TABLE_CELL_WRAP_STOP~~'

  /**
   * @class
   * SpanObj - an object for `<span>` elements
   * This is mainly designed to process nested font tags created by CKEditor
   *
   * @property {string} prevText - previous Dokuwiki text, to be included when
   *    the Dokuwiki code for this span is generated.
   *    This is used to cache the converted Dokuwiki code so far to create
   *    an enclosed environment for the span content only. (`activeResults`
   *    will only include the contents within the span now.)
   * @property {object} attr - numerous attributes of the span
   * @property {object} [fontObj] - the font settings this span represents,
   *    including the following attributes.
   * @property {string} [fontObj.fontSize] - CSS `font-size` property
   * @property {string} [fontObj.fontWeight] - CSS `font-weight` property
   * @property {string} [fontObj.fontFamily] - CSS `font-family` property
   * @property {string} [fontObj.fontColor] - CSS `color` property
   * @property {string} [fontObj.fontBgcolor] - CSS `background-color` property
   *
   * @property {boolean} noBrTagOpen - `true` if no newline should be inserted
   *    before the final Dokuwiki code.
   * @property {boolean} noSpaceTagEnd - `true` if no space should be inserted
   *    after the final Dokuwiki code.
   *
   * @constructor
   * @param {string} prevText - previous Dokuwiki text, to be included when the
   *    Dokuwiki code is generated.
   */
  var SpanObj = class SpanObj {
    constructor (prevText, fontObj) {
      this.prevText = prevText
      this.attr = {}
      this.noBrTagOpen = !!fontObj
      this.noSpaceTagEnd = !!fontObj
      this.fontObj = fontObj || null
    }

    /**
     * close the span and return the resulting Dokuwiki code up to the span
     * @param {string} activeResults - the remaining `activeResults` that is
     *    not processed.
     */
    close (activeResults) {
      let parsedText
      if (this.fontObj) {
        parsedText = this.parseFontText(activeResults)
      } else {
        parsedText = this.parseText(activeResults)
      }
      return this.prevText + (this.noBrTagOpen ? '' : '\n') + parsedText +
        (this.noSpaceTagEnd ? '' : ' ')
    }

    mergeWithParentLink (activeResults, linkObj) {
      linkObj.addFont(this.fontObj)
      return this.prevText + activeResults
    }

    /**
     * parse the text of normal `<span>` without fonts.
     * @param {string} activeResults - the remaining `activeResults` that is
     *    not processed.
     */
    parseText (activeResults) {
      return activeResults
    }

    /**
     * Build the `<font></font>` tag representing the span
     * @param {string} activeResults - the remaining `activeResults` that is
     *    not processed.
     */
    parseFontText (activeResults) {
      let fontOpen = '<font ' +
        (this.fontObj.fontSize || 'inherit') + '/' +
        (this.fontObj.fontFamily || 'inherit') + ';;' +
        (this.fontObj.fontColor || 'inherit') + ';;' +
        (this.fontObj.fontBgcolor || 'inherit') + '>'
      let inherits = fontOpen.match(/inherit/g)
      HTMLParserFont = true
      return fontOpen + activeResults + '</font>'
    }

    /**
     * Set attributes of the span
     * @param {object} attr - the attribute object.
     * @param {object} attr.name - the name of the attribute.
     * @param {object} attr.value - the value of the attribute.
     * @param {object} parser - the `HTMLParser` object, to set some global
     *    flags
     */
    setAttr (attr, parser) {
      if (attr.name === 'class' && attr.value === 'np_break') {
        this.noBrTagOpen = true
      } else if (attr.name === 'class') {
        if (attr.value === 'curid') {
          this.curid = true
        } else if (attr.value === 'multi_p_open') {
          parser.in_multi_plugin = true
          HTMLParser_MULTI_LINE_PLUGIN = true
        } else if (attr.value === 'multi_p_close') {
          parser.in_multi_plugin = false
        } else if (attr.value.match(geshi_classes)) {
          this.noBrTagOpen = true
          this.geshi = true
        }
      } else if (!ckgedit_xcl_styles && attr.name === 'style') {
        this.noBrTagOpen = true
        this.noSpaceTagEnd = true
        this.setFontAttr(attr.value)
      }
    }

    /**
     * Set the font attribute value from the `styles` attribute
     * @param {object} fontAttrValue - the value of the `styles` attribute
     */
    setFontAttr (fontAttrValue) {
      this.fontObj = {}
      let matches = fontAttrValue.match(/font-family:\s*([^;]+);?/)
      if (matches) {
        this.fontObj.fontFamily = matches[1]
      }

      // matches = fontAttrValue.match(/font-size:\s*(\d+(\w+|%));?/);
      matches = fontAttrValue.match(/font-size:\s*([^;]+);?/)
      if (matches) {
        matches[1] = matches[1].replace(/;/, '')
        this.fontObj.fontSize = matches[1]
      }
      matches = fontAttrValue.match(/font-weight:\s*([^;]+);?/)
      if (matches) {
        this.fontObj.fontWeight = matches[1]
      }
      matches = fontAttrValue.match(/.*?color:\s*([^;]+);?/)
      let bgcolorFound = false
      if (matches) {
        if (matches[0].match(/background/)) {
          this.fontObj.fontBgcolor = matches[1]
        } else {
          this.fontObj.fontColor = matches[1]
        }
      }
      if (!bgcolorFound) {
        // catch MS Word which uses background:color-name instead of
        //    background-color:color-name
        matches = fontAttrValue.match(/background:\s*([^;]+);?/)
        if (matches && matches[0].match(/background/)) {
          this.fontObj.fontBgcolor = matches[1]
        }
      }
    }
  }

  /**
   * @class
   * LinkObj - an object for various link elements
   *
   * @property {string} prevText - previous Dokuwiki text, to be included when
   *    the Dokuwiki code for this span is generated.
   *    This is used to cache the converted Dokuwiki code so far to create
   *    an enclosed environment for the span content only. (`activeResults`
   *    will only include the contents within the span now.)
   * @property {object} attr - numerous attributes of the span
   * @property {object} [fontObj] - the font settings this span represents,
   *    including the following attributes.
   * @property {string} [fontObj.fontSize] - CSS `font-size` property
   * @property {string} [fontObj.fontWeight] - CSS `font-weight` property
   * @property {string} [fontObj.fontFamily] - CSS `font-family` property
   * @property {string} [fontObj.fontColor] - CSS `color` property
   * @property {string} [fontObj.fontBgcolor] - CSS `background-color` property
   *
   * @property {boolean} noBrTagOpen - `true` if no newline should be inserted
   *    before the final Dokuwiki code.
   * @property {boolean} noSpaceTagEnd - `true` if no space should be inserted
   *    after the final Dokuwiki code.
   *
   * @constructor
   * @param {string} prevText - previous Dokuwiki text, to be included when
   *    the Dokuwiki code is generated.
   * @param {object} parser - the `HTMLParser` object, to set some global
   *    flags
   * @param {LinkObj} oldLink - the old link object to copy attributes from
   */
  var LinkObj = class LinkObj {
    constructor (prevText, parser, oldLink) {
      this.fontObj = null
      this.formatTags = {}
      this.linkClass = null
      this.linkTitle = null
      this.mediaClass = null
      this.id = null
      this.type = null
      this.externalMime = false
      this.pendingAttrs = []
      this.linkPart = ''
      this.interwikiClass = null
      this.interwikiTitle = null
      this.localImage = true
      this.footnote = false
      this.bottomNote = false

      this.linkOnly = false

      parser.export_code = false
      parser.code_snippet = false
      parser.downloadable_file = ''
      parser.xcl_markup = false

      if (oldLink) {
        for (let key in oldLink) {
          if (oldLink.hasOwnProperty(key)) {
            this[key] = oldLink[key]
          }
        }
      }

      this.prevText = prevText

      this.interwiki = false
      this.bottom_url = false
    }

    isImageWrapper () {
      // return true if anything similar to `[[<whatever>|<whatever>]]` needs
      // to be returned for this link object
      return !!this.imgLinkType
    }

    /**
     * close the span and return the resulting Dokuwiki code up to the span
     * @param {string} activeResults - the remaining `activeResults` that is
     *    not processed.
     * @param {object} parser - the `HTMLParser` object, to set some global
     *    flags
     * @returns {string} parsed Dokuwiki code
     */
    close (activeResults, parser) {
      // Note: if an image is here with additional texts to the end,
      // the link will need to be broken into two consecutive parts
      let parsedText = ''

      // process footnote links first (footnote and bottomNote)
      if (this.footnote) {
        parsedText = '((#' + this.linkPart + '))'
        delete this.fontObj
      } else if (parser.footnoteObj && !parser.footnoteContentObj &&
        this.bottomNote
      ) {
        parser.footnoteObj.addLink(this)
      } else if (this.linkOnly ||
        (this.externalMime &&
          (parser.inFootnoteSection || this.mediaClass === 'mediafile')
        )
      ) {
        // then determine whether this link should use image tags
        // use img tags instead of link tags
        parsedText = '{{' + this.linkPart + '?linkOnly' +
          this.getLabelPartIfNeeded(activeResults) + '}}'
      } else {
        this.linkPart = this.linkPart.replace(/%7c/, '%257c')
        // The following part is to break the following pattern:
        // `<a ...> some text {{ some tag }} some other text </a>`
        // into `<a ...>some text</a> <a ...>{{ some tag }}</a> <a ...>some other text</a>`
        let match
        while ((match = activeResults.match(
          /^\s*((?:(?!{{)\S)*?)(\s*)({{(?:(?!}}).)*?}})(\s*)(\S*?)\s*$/m
        )) && (match[1] || match[5])) {
          let linkFrag = new LinkObj(this.prevText, parser, this)
          this.prevText = linkFrag.close(match[1], parser) +
            (match[2] ? ' ' : '')
          linkFrag = new LinkObj(this.prevText, parser, this)
          this.prevText = linkFrag.close(match[3], parser) +
            (match[4] ? ' ' : '')
          activeResults = match[5]
        }

        let labelPart = this.getLabelPartIfNeeded(activeResults)

        if (!this.isImageWrapper() && this.linkPart) {
          parsedText = this.getLinkTextWithFormatTags(this.linkPart, labelPart)
        } else {
          parsedText = activeResults
        }
      }

      if (this.fontObj) {
        let spanObj = new SpanObj(this.prevText, this.fontObj)
        parsedText = spanObj.close(parsedText)
      } else {
        parsedText = this.prevText + parsedText
      }

      return parsedText
    }

    getLabelPartIfNeeded (label) {
      label = label || ''
      if (this.interwikiClass) {
        this.linkPart = this.linkPart.replace(
          /^.*?oIWIKIo(.*?)cIWIKIc.*$/, '$1'
        )
        if (!this.linkPart) {
          this.linkPart = label.replace(/^.*?oIWIKIo(.*?)cIWIKIc.*$/, '$1')
          label = ''
        } else if (this.linkPart === label ||
          this.linkPart === label.replace(/\s/, '%20')
        ) {
          label = ''
        } else {
          label = '|' + label
        }
      }
      return label ? '|' + label : ''
    }

    getLinkTextWithFormatTags (linkPart, labelPart) {
      let result = '[[' + linkPart + labelPart + ']]'
      for (let key in this.formatTags) {
        if (this.formatTags.hasOwnProperty(key)) {
          result = markup[key] + result +
            (markup_end[key] ? markup_end[key] : markup[key])
        }
      }
      return result
    }

    /**
     * Set attributes of the span
     * @param {object} attr - the attribute object.
     * @param {object} attr.name - the name of the attribute.
     * @param {object} attr.value - the value of the attribute.
     * @param {object} parser - the `HTMLParser` object, to set some global
     *    flags
     */
    addAttr (attr, parser) {
      if (attr.name === 'class') {
        this.setClass(attr, parser)
      } else if (attr.name === 'id') {
        this.id = attr.value
      } else if (attr.name === 'type' || attr.value.match(/other_mime/)) {
        this.type = attr.value
      } else {
        this.pendingAttrs.push(attr)
      }
    }

    processAttrs (parser) {
      this.pendingAttrs.forEach(attr => {
        if (attr.name === 'title') {
          this.linkTitle = attr.escaped
          if (this.interwikiClass) {
            this.interwikiTitle = attr.escaped
          } else {
            this.linkTitle = this.linkTitle.replace(/\s+.*$/, '')
          }
        } else if (attr.name === 'href' && !parser.code_type) {
          this.processHref(attr, parser)
        }
      })
      this.pendingAttrs = []
      if (this.interwikiClass && this.interwikiTitle) {
        this.convertIWiki()
      }
    }

    processHref (hrefAttr, parser) {
      let qsSet = false
      let http = !!hrefAttr.escaped.match(/https?:\/\//)
      let savedUrl
      if (http) {
        savedUrl = hrefAttr.escaped
      }
      if (this.footnote || this.bottomNote) {
        this.linkPart = hrefAttr.escaped.replace('#', '')
        return
      }
      if (hrefAttr.escaped.match(/\/lib\/exe\/detail.php/)) {
        this.imgLinkType = 'detail'
      } else if (hrefAttr.escaped.match(/exe\/fetch.php/)) {
        this.imgLinkType = 'direct'
      }

      if (this.linkClass && this.linkClass.match(/media/) && !this.linkTitle) {
        let linkMatch = hrefAttr.escaped.match(/media=(.*)/)
        if (linkMatch) {
          this.linkTitle = linkMatch[1]
        }
      }
      // required to distinguish external images from external mime types
      // that are on the wiki which also use {{url}}
      let mediaType = hrefAttr.escaped.match(/fetch\.php.*?media=.*?\.(png|gif|jpg|jpeg)$/i)
      if (mediaType) {
        mediaType = mediaType[1]
      }

      this.localImage = false

      if (http) {
        this.linkPart = hrefAttr.escaped
      }

      let matches

      if (hrefAttr.escaped.match(/^(ftp|nntp):/)) {
        this.linkPart = hrefAttr.escaped
      } else if (hrefAttr.escaped.match(/do=export_code/)) {
        parser.export_code = true
        this.localImage = true
      } else if (hrefAttr.escaped.match(/^mailto:/)) {
        this.linkPart = hrefAttr.escaped.replace(/mailto:/, '')
      } else if (hrefAttr.escaped.match(/m-files/)) {
        this.linkPart = hrefAttr.escaped
        this.mfile = hrefAttr.escaped
      } else if (hrefAttr.escaped.match(/^file:/)) {  // samba share
        let url = hrefAttr.value.replace(/file:[\/]+/, '')
        url = url.replace(/[\/]/g, '\\')
        url = '\\\\' + url
        this.linkPart = url
      } else if (
        http && !mediaType &&
        (matches = hrefAttr.escaped.match(/fetch\.php(.*)/))
      ) {
        // external mime types after they've been saved first time
        if (matches[1].match(/media=/)) {
          let elems = matches[1].split(/=/)
          this.linkPart = elems[1]
        } else {   // nice urls
          matches[1] = matches[1].replace(/^\//, '')
          this.linkPart = matches[1]
        }

        if (typeof config_animal !== 'undefined') {
          let regex = new RegExp(config_animal + '/file/(.*)')
          matches = hrefAttr.escaped.match(regex)
          if (matches && matches[1]) {
            this.linkPart = matches[1]
          }
          if (this.linkPart) {
            this.linkPart = this.linkPart.replace(/\//g, ':')
          }
        }

        this.linkPart = decodeURIComponent
          ? decodeURIComponent(this.linkPart) : unescape(this.linkPart)
        if (!this.linkPart.match(/^:/)) {
          this.linkPart = ':' + this.linkPart
        }
        this.externalMime = true
      } else {
        matches = hrefAttr.escaped.match(/doku.php\?id=(.*)/)
        if (savedUrl) {
          let regex = DOKU_BASE + 'doku.php'
          if (!hrefAttr.escaped.match(regex)) {
            this.linkClass = 'urlextern'
            this.linkPart = savedUrl
            matches = null
          }
        }

        if (!matches) {
          matches = hrefAttr.escaped.match(/doku.php\/(.*)/)
        }
        /* previously saved internal link with query string
          requires initial ? to be recognized by DW. In Anteater and later */
        if (matches) {
          if (!matches[1].match(/\?/) && matches[1].match(/&amp;/)) {
            qsSet = true
            matches[1] = matches[1].replace(/&amp;/, '?')
          }
        }
        if (matches && matches[1]) {
          if (!matches[1].match(/^:/)) {
            this.linkPart = ':' + matches[1]
          } else {
            this.linkPart = matches[1]
          }

          if (this.linkPart.match(/\.\w+$/)) {  // external mime's first access
            if (this.type && this.type === 'other_mime') {
              this.externalMime = true
            }
          }
        } else {
          matches = hrefAttr.value.match(/\\\\/)   // Windows share
          if (matches) {
            this.linkPart = hrefAttr.escaped
          }
        }
      }

      if (this.linkClass === 'media') {
        if (hrefAttr.value.match(/https?:/)) {
          this.localImage = false
        }
      }

      if (!this.linkPart && this.linkTitle) {
        if ((matches = this.linkClass.match(/media(.*)/))) {
          this.linkTitle = decodeURIComponent(safe_convert(this.linkTitle))
          this.linkPart = this.linkTitle
          if (!this.linkPart.match(/^:/) &&
            !this.linkPart.match(/^https?:/)
          ) {
            this.linkPart = ':' + this.linkPart.replace(/^\s+/, '')
          }
          this.externalMime = true
          this.localImage = false
        }
      }

      if (this.linkPart.match && this.linkPart.match(/%[a-fA-F0-9]{2}/) &&
        (matches = this.linkPart.match(/userfiles\/file\/(.*)/))
      ) {
        matches[1] = matches[1].replace(/\//g, ':')
        if (!matches[1].match(/^:/)) {
          matches[1] = ':' + matches[1]
        }
        this.linkPart = decodeURIComponent
          ? decodeURIComponent(matches[1]) : unescape(matches[1])
        this.linkPart = decodeURIComponent
          ? decodeURIComponent(this.linkPart) : unescape(this.linkPart)
        this.externalMime = true
      } else if (this.linkPart && this.linkPart.match(/%[a-fA-F0-9]{2}/)) {
        this.linkPart = decodeURIComponent(this.linkPart)
        this.linkPart = decodeURIComponent(this.linkPart)
      }

      // alert('title: ' + this.linkTitle + '  class: ' + this.link_class + ' export: ' +this.export_code);
      if (this.linkTitle && this.linkTitle.match(/Snippet/)) {
        parser.code_snippet = true
      }

      /* anchors to current page without prefixing namespace:page */
      if (hrefAttr.value.match(/^#/) && this.linkClass.match(/wikilink/)) {
        this.linkPart = hrefAttr.value
        this.linkTitle = false
      }

      /* These two conditions catch user_rewrite not caught above */
      if (this.linkClass && this.linkClass.match(/wikilink/) && this.linkTitle) {
        this.externalMime = false
        if (!this.linkPart) {
          this.linkPart = this.linkTitle
        }
        if (!this.linkPart.match(/^:/)) {
          this.linkPart = ':' + this.linkPart
        }
        if (this.linkPart.match(/\?.*?=/)) {
          let elems = this.linkPart.split(/\?/)
          elems[0] = elems[0].replace(/\//g, ':')
          this.linkPart = elems[0] + '?' + elems[1]
        } else {
          this.linkPart = this.linkPart.replace(/\//g, ':')
        }

        /* catch query strings attached to internal links for .htacess nice urls  */
        if (!qsSet && hrefAttr.name == 'href') {
          if (!this.linkPart.match(/\?.*?=/) && !hrefAttr.value.match(/doku.php/)) {
            let qs = hrefAttr.value.match(/(\?.*)$/)
            if (qs && qs[1]) {
              this.linkPart += qs[1]
            }
          }
        }
      } else if (this.linkClass && this.linkClass.match(/mediafile/) && this.linkTitle && !this.linkPart) {
        this.linkPart = this.linkTitle
        this.externalMime = true

        if (!this.linkPart.match(/^:/)) {
          this.linkPart = ':' + this.linkPart
        }
      }

      if (this.linkClass === 'urlextern' && !this.mfile && savedUrl) {
        this.linkPart = savedUrl
        this.externalMime = false  // prevents external links to images from being converted to image links
      }
      // if (parser.in_endnotes) {
      //   if (this.linkTitle) {
      //     this.bottom_url = this.linkTitle  // save for bottom urls
      //   } else if (this.linkPart) {
      //     this.bottom_url = this.linkPart
      //   }
      // }
      this.linkTitle = null
      this.linkClass = null
    }

    setClass (attr, parser) {
      if (attr.value.match(/fn_top/)) {
        this.footnote = true
      } else if (attr.value.match(/fn_bot/)) {
        this.bottomNote = true
      } else if (attr.value.match(/mf_(png|gif|jpg|jpeg)/i)) {
        this.linkOnly = true
      } else if (attr.value.match(/interwiki/)) {
        attr.value = attr.value.replace(/\./g, '_')
        this.linkClass = attr.value
        return
      }

      this.linkClass = attr.escaped
      this.mediaClass = this.linkClass.match(/mediafile/)
      if (this.linkClass.match(/interwiki/)) {
        this.interwikiClass = this.linkClass
      }
    }

    addFontFromTag (tag) {
      if (!this.formatTags.hasOwnProperty(tag)) {
        this.formatTags[tag] = true
      }
    }

    addFont (fontObj) {
      this.fontObj = this.fontObj || {}
      for (let key in fontObj) {
        if (
          !this.fontObj.hasOwnProperty(key) &&
          fontObj.hasOwnProperty(key)
        ) {
          this.fontObj[key] = fontObj[key]
        }
      }
      HTMLFontInLinkMerged = true
    }

    convertIWiki () {
      let iwType = this.interwikiClass.match(/iw_(\w+\.?\w{0,12})/)
      let iwTitle = this.interwikiTitle.split(/\//)
      let iwLabel = iwTitle[iwTitle.length - 1]
      iwLabel = iwLabel.replace(String.frasl, '\/')
      if (!iwLabel.match(/oIWIKIo.*?cIWIKIc/)) {
        iwLabel = 'oIWIKIo' + iwLabel + 'cIWIKIc'
      }
      iwLabel = iwLabel.replace(/^.*?oIWIKIo/, 'oIWIKIo')
      iwLabel = iwLabel.replace(/cIWIKIc.*/, 'cIWIKIc')
      iwType[1] = iwType[1].replace(/_(\w{2})/g, '.' + '$1')
      this.linkPart = iwType[1] + '>' + decodeURIComponent(iwLabel)
    }
  }

  /**
   * Footnote object.
   * Corresponding to a `<div class="fn" ...></div>` element
   */
  var FootnoteObj = class FootnoteObj {
    constructor (prevText, parser) {
      this.linkedIds = []
      this.content = null
      this.prevText = prevText
    }

    /**
     * close the footnote object, replace the `((#<footnote_id>))` in previous
     * result with `((this.content))`
     */
    close (activeResults, parser) {
      this.linkedIds.forEach(id => {
        this.prevText =
          this.prevText.replace(
            '<sup>((#' + id + '))</sup>', '((' + this.content + '))')
      })
      return this.prevText
    }

    addContent (footnoteContent) {
      this.content = footnoteContent
    }

    addLink (linkObj) {
      this.linkedIds.push(linkObj.id)
    }
  }

  var FootnoteContentObj = class FootnoteContentObj {
    constructor (prevText, parser) {
      this.prevText = prevText
      this.divStack = []
    }

    close (activeResults, parser) {
      return activeResults
    }
  }

  var DivObj = class DivObj {
    constructor (prevText, parser) {
      this.prevText = prevText
    }

    close (activeResults, parser) {
      return this.prevText + '\n\n' + activeResults
    }
  }

  HTMLParser(CKEDITOR.instances.wiki__text.getData(), {
    attribute: '',
    link_title: '',
    link_class: '',
    image_link_type: '',
    in_td: false,
    /**
     * tableStack - an array of tables currently in the hierarchy.
     * @type {Array<TableObj>}
     */
    tableStack: [],
    /**
     * spanStack - an array of spans currently in the hierarchy.
     * @type {Array<SpanObj>}
     */
    spanStack: [],
    in_multi_plugin: false,
    is_rowspan: false,
    list_level: 0,
    prev_list_level: -1,
    list_started: false,
    xcl_markup: false,
    /**
     * linkObj - an object for the current link.
     * @type {LinkObj}
     */
    linkObj: null,
    last_tag: '',
    code_type: false,
    inFootnoteSection: false,
    // in_endnotes: false,
    footnoteObj: null,
    footnoteContentObj: null,
    is_smiley: false,
    geshi: false,
    downloadable_code: false,
    export_code: false,
    code_snippet: false,
    downloadable_file: '',
    externalMime: false,
    in_header: false,
    curid: false,
    format_in_list: false,
    prev_li: new Array(),
    link_only: false,
    in_font: false,
    interwiki: false,
    bottom_url: false,
    end_nested: false,
    mfile: false,

    backup: function (c1, c2) {
      var c1_inx = activeResults.lastIndexOf(c1)     // start position of chars to delete
      var c2_inx = activeResults.indexOf(c2, c1_inx)  // position of expected next character
      if (c1_inx == -1 || c2_inx == -1) return
      if (c1.length + c2_inx == c2_inx) {
        var left_side = activeResults.substring(0, c1_inx) // from 0 up to but not including c1
        var right_side = activeResults.substring(c2_inx)  // from c2 to end of string
        activeResults = left_side + right_side
        return true
      }
      return false
    },
    start: function (tag, attrs, unary) {
      /**   if table debugging code:
      this_debug = this.dbg;
      */
      if (markup[tag]) {
        if (format_chars[tag] && this.linkObj) {
          this.linkObj.addFontFromTag(tag)
          HTMLFontInLinkMerged = true
          tag = 'blank'
          return
        }
        if (format_chars[tag] && (this.in_font || this.in_header)) {
          activeResults += ' '
          var t = 'temp_' + tag
          activeResults += markup[t]
          activeResults += ' '
          return
        } else if (tag == 'acronym') {
          return
        }
        // if (format_chars[tag] && this.in_endnotes) {
        //   if (tag == 'sup') return
        // }
        if (tag == 'ol' || tag == 'ul') {
          if (this.tableStack.length > 0 && !this.list_level) {
            activeResults += '\n'
          }
          this.prev_list_level = this.list_level
          this.list_level++
          if (this.list_level == 1) this.list_started = false
          if (this.list_started) this.prev_li.push(markup['li'])
          markup['li'] = markup[tag]

          return
        } else if (!this.list_level) {
          markup['li'] = ''
          this.prev_li = new Array()
        }

        if (tag == 'img') {
          var img_size = '?'
          var width
          var height
          var style = false
          var img_align = ''
          var alt = ''
          var from_clipboard = false
          this.is_smiley = false
          if (this.linkObj && this.linkObj.imgLinkType) {
            this.image_link_type = this.linkObj.imgLinkType
          }
        }

        if (tag == 'p') {
          if (this.linkObj) {
            activeResults = this.linkObj.close(activeResults, this)
          }
          this.linkObj = null
          if (!activeResults || activeResults.endsWith[markup_end[tag]]) {
            tag = 'blank'
          }
        }

        if (tag === 'table') {
          this.tableStack.push(new TableObj(activeResults))
          activeResults = ''
          this.in_table = true
        } else if (tag === 'tr') {
          let currTable = this.tableStack[this.tableStack.length - 1]
          currTable.startRow()
        } else if (tag === 'td' || tag === 'th') {
          // all rowspan and colspan placeholders will be inserted after this
          //    cell is closed (or the line is closed)
          let currTable = this.tableStack[this.tableStack.length - 1]
          currTable.startCell(tag)
          activeResults = ''
          this.in_td = true
        }

        var matches
        this.attr = false
        this.format_tag = false

        if (format_chars[tag]) this.format_tag = true
        var dwfck_note = false

        if (tag === 'span') {
          this.spanStack.push(new SpanObj(activeResults))
          activeResults = ''
        }

        if (tag === 'a') {
          this.linkObj = new LinkObj(activeResults, this)
          activeResults = ''
        }

        for (var i = 0; i < attrs.length; i++) {
          // if(!confirm(tag + ' ' + attrs[i].name + '="' + attrs[i].escaped + '"')) exit;
          if (tag === 'td' || tag === 'th') {
            try {
              let currTable = this.tableStack[this.tableStack.length - 1]
              if (attrs[i].name === 'align' || attrs[i].name === 'class') {
                currTable.getCurrentCell().setAlign(attrs[i])
              } else if (attrs[i].name === 'colspan') {
                currTable.setColSpan(parseInt(attrs[i].value))
              } else if (attrs[i].name === 'rowspan') {
                currTable.setRowSpan(parseInt(attrs[i].value))
              }
            } catch (ignore) { }
          }
          if (attrs[i].escaped == 'u' && tag == 'em') {
            tag = 'u'
            this.attr = 'u'
            break
          }

          if (tag == 'div') {
            if (attrs[i].name == 'class' && attrs[i].value == 'footnotes') {
              tag = 'blank'
              this.inFootnoteSection = true
              // remove the horizontal line before the footnote section
              activeResults = activeResults.replace(/\s*----\s*$/, '')
            } else if (attrs[i].name == 'class' && attrs[i].value == 'fn') {
              tag = 'blank'
              this.footnoteObj = new FootnoteObj(activeResults, this)
              activeResults = ''
            } else if (this.footnoteObj && attrs[i].name == 'class' &&
              attrs[i].value == 'content'
            ) {
              tag = 'blank'
              this.footnoteContentObj =
                new FootnoteContentObj(activeResults, this)
              activeResults = ''
            }
            break
          }
          if (tag == 'dl' && attrs[i].name == 'class' && attrs[i].value == 'file') {
            this.downloadable_code = true
            HTMLParser_Geshi = true
            return
          }
          if (tag === 'span') {
            this.spanStack[this.spanStack.length - 1].setAttr(attrs[i], this)
          }

          if (tag === 'a') {
            this.linkObj.addAttr(attrs[i], this)
          }

          if (tag == 'sup') {
            if (attrs[i].name == 'class') {
              matches = attrs[i].value.split(/\s+/)
              if (matches[0] == 'dwfcknote') {
                this.attr = matches[0]
                tag = 'blank'
                if (oDokuWiki_FCKEditorInstance.oinsertHtmlCodeObj.notes[matches[1]]) {
                  dwfck_note = '((' + oDokuWiki_FCKEditorInstance.oinsertHtmlCodeObj.notes[matches[1]] + '))'
                }
                break
              }
            }
          }

          if (tag == 'pre') {
            if (attrs[i].name == 'class') {
              var elems = attrs[i].escaped.split(/\s+/)
              if (elems.length > 1) {
                this.attr = attrs[i].value
                this.code_type = elems[0]
              } else {
                this.attr = attrs[i].escaped
                this.code_type = this.attr
              }
              if (this.downloadable_code) {
                this.attr = this.attr.replace(/\s*code\s*/, '')
                this.code_type = 'file'
              }
              HTMLParser_PRE = true
              if (this.tableStack.length > 0) tag = 'pre_td'
              break
            }
          } else if (tag == 'img') {
            if (attrs[i].name == 'alt') {
              alt = attrs[i].value
            }
            if (attrs[i].name == 'type') {
              this.image_link_type = attrs[i].value
            }

            if (attrs[i].name == 'src') {
              //  alert(attrs[i].name + ' = ' + attrs[i].value + ',  fnencode=' + oDokuWiki_FCKEditorInstance.dwiki_fnencode);

              var src = ''
              // fetched by fetch.php
              if (matches = attrs[i].escaped.match(/fetch\.php.*?(media=.*)/)) {
                var elems = matches[1].split('=')
                src = elems[1]
                if (matches = attrs[i].escaped.match(/(media.*)/)) {
                  var elems = matches[1].split('=')
                  var uri = elems[1]
                  src = decodeURIComponent ? decodeURIComponent(uri) : unescape(uri)
                }
                if (!src.match(/https?:/) && !src.match(/^:/)) src = ':' + src
              } else if (attrs[i].escaped.match(/https?:\/\//)) {
                src = attrs[i].escaped
                src = src.replace(/\?.*?$/, '')
              }
              // url rewrite 1
              else if (matches = attrs[i].escaped.match(/\/_media\/(.*)/)) {
                var elems = matches[1].split(/\?/)
                src = elems[0]
                src = src.replace(/\//g, ':')
                if (!src.match(/^:/)) src = ':' + src
              }
              // url rewrite 2
              else if (matches = attrs[i].escaped.match(/\/lib\/exe\/fetch.php\/(.*)/)) {
                var elems = matches[1].split(/\?/)
                src = elems[0]
                if (!src.match(/^:/)) src = ':' + src
              } else {
                // first insertion from media mananger
                matches = attrs[i].escaped.match(/^.*?\/userfiles\/image\/(.*)/)
                if (!matches && typeof config_animal !== 'undefined') {
                  var regex = new RegExp(config_animal + '\/image\/(.*)$')
                  matches = attrs[i].escaped.match(regex)
                }
                if (!matches) {  // windows style
                  var regex = doku_base + 'data/media/'
                  regex = regex.replace(/([\/\\])/g, '\\$1')
                  regex = '^.*?' + regex + '(.*)'
                  regex = new RegExp(regex)
                  matches = attrs[i].escaped.match(regex)
                }
                if (matches && matches[1]) {
                  src = matches[1].replace(/\//g, ':')
                  src = ':' + src
                } else {
                  src = decodeURIComponent ? decodeURIComponent(attrs[i].escaped) : unescape(attrs[i].escaped)
                  if (src.search(/data:image.*?;base64/) > -1) {
                    from_clipboard = true
                  }
                }
              }
              if (src && src.match(/lib\/images\/smileys/)) {
                // src = 'http://' + window.location.host + src;
                this.is_smiley = true
              }
              this.attr = src
              if (this.attr && this.attr.match && this.attr.match(/%[a-fA-F0-9]{2}/)) {
                this.attr = decodeURIComponent(safe_convert(this.attr))
                this.attr = decodeURIComponent(safe_convert(this.attr))
              }
            }   // src end

            else if (attrs[i].name == 'width' && !style) {
              width = attrs[i].value
            } else if (attrs[i].name == 'height' && !style) {
              height = attrs[i].value
            } else if (attrs[i].name == 'style') {
              var match = attrs[i].escaped.match(/width:\s*(\d+)/)
              if (match) {
                width = match[1]
                var match = attrs[i].escaped.match(/height:\s*(\d+)/)
                if (match) height = match[1]
              }
            } else if (attrs[i].name == 'align' || attrs[i].name == 'class') {
              if (attrs[i].escaped.match(/(center|middle)/)) {
                img_align = 'center'
              } else if (attrs[i].escaped.match(/right/)) {
                img_align = 'right'
              } else if (attrs[i].escaped.match(/left/)) {
                img_align = 'left'
              } else {
                img_align = ''
              }
            }
          }   // End img
        }   // End Attributes Loop

        if (this.linkObj && tag === 'a') {
          this.linkObj.processAttrs(this)
          tag = 'blank'
        }

        if (tag === 'div' && this.footnoteContentObj) {
          this.footnoteContentObj.divStack.push(
            new DivObj(activeResults, this)
          )
          tag = 'blank'
        }

        if (this.is_smiley) {
          if (alt) {
            activeResults += alt + ' '
            alt = ''
          }
          this.is_smiley = false
          return
        }
        if (tag === 'br') {
          if (this.in_multi_plugin || this.code_type) {
            // These are the cases where a simple '\n'
            // (not a wiki line-break '\\\\\n') is needed.
            activeResults += '\n'
            return
          }

          HTMLParser_LBR = true
          if (this.tableStack.length > 0 || this.list_started) {
            // There are the cases where a '\n' is not supposed to appear
            // in the final wiki code.
            // Use `br_same_line` ('\\\\ ') instead
            tag = 'br_same_line'
          }
        } else if (tag.match(/^h(\d+|r)/)) {
          var str_len = activeResults.length
          if (tag.match(/h(\d+)/)) {
            this.in_header = true
          }
          if (str_len) {
            if (activeResults.charCodeAt(str_len - 1) == 32) {
              activeResults = activeResults.replace(/\x20+$/, '')
            }
          }
        } else if (dwfck_note) {
          activeResults += dwfck_note
          return
        }

        if (tag === 'b' || tag === 'i' && this.list_level) {
          if (activeResults.match(/(\/\/|\*)(\x20)+/)) {
            activeResults = activeResults.replace(/(\/\/|\*)(\x20+)\-/, '$1\n' + '$2-')
          }
        }

        if (tag == 'li' && this.list_level) {
          if (this.list_level == 1 & !this.list_started) {
            activeResults += '\n'
            this.list_started = true
          }
          activeResults = activeResults.replace(/[\x20]+$/, '')

          for (var s = 0; s < this.list_level; s++) {
            // this handles format characters at the ends of list lines
            if (activeResults.match(/_FORMAT_SPACE_\s*$/)) {
              activeResults = activeResults.replace(/_FORMAT_SPACE_\s*$/, '\n')
            }
            if (this.list_level > 1) {
              activeResults += '  '
            }
          }

          if (this.prev_list_level > 0 && markup['li'] == markup['ol']) {
            this.prev_list_level = -1
          }
        }
        // if (tag == 'a' && this.list_level) {
        //   HTMLLinkInList = true
        // }
        // if (tag == 'a' && local_image) {
        // //   this.xcl_markup = true
        // //   return
        // // } else if (tag === 'a' && (this.export_code || this.code_snippet)) {
        // //   return
        // } else if (tag === 'a' && this.footnote) {
        //   tag = 'fn_start'
        // } else if (tag == 'a' && bottom_note) {
        //   HTMLParserTopNotes.push(this.id)
        // // } else if (tag == 'a' && this.externalMime) {
        // //   if (this.in_endnotes) {
        // //     this.link_class = 'media'
        // //     return
        // //   }

        // //   if (media_class && media_class == 'mediafile') {
        // //     activeResults += markup['img']
        // //     activeResults += this.attr + '|'
        // //     this.is_mediafile = true
        // //   }

        // //   return
        // }

        // if (this.in_endnotes && tag == 'a') return
        if (tag === 'span') tag = 'blank'
        if (this.mfile && !this.attr) {
          this.attr = this.mfile
        }

        if (typeof markup[tag] === 'string') {
          activeResults += markup[tag]          // Set tag
        }

        if (tag == 'img') {
          var link_type = this.image_link_type
          this.image_link_type = ''
          if (this.link_only) link_type = 'link_only'
          if (!link_type || from_clipboard) {
            link_type = 'nolink'
          } else if (link_type == 'detail') {
            link_type = ''
          }

          if (link_type == 'link_only') {
            img_size = '?linkonly'
          } else if (link_type) {
            img_size += link_type + '&'
          }
          if (width && height) {
            img_size += width + 'x' + height
          } else if (width) {
            img_size += width
          } else if (!link_type) {
            img_size = ''
          }
          if (img_align && img_align != 'left') {
            activeResults += '  '
          }
          this.attr += img_size
          if (img_align == 'center' || img_align == 'left') {
            this.attr += '  '
          }
          if (alt) {
            activeResults += this.attr + '|' + alt + '}}'
          } else activeResults += this.attr + '}}'
          this.attr = 'src'
        } else if (tag == 'pre' || tag == 'pre_td') {
          if (this.downloadable_file) this.attr += ' ' + this.downloadable_file
          if (!this.attr) this.attr = 'code'
          activeResults += this.attr + '>'
          this.downloadable_file = ''
          this.downloadable_code = false
        }
      }   // if markup tag
    },

    end: function (tag) {
      if (format_chars[tag] && this.linkObj) {
        tag = 'blank'
      } else if (format_chars[tag] && this.in_header) {
        activeResults += ' '
        if (tag == 'sup' || tag == 'sub' || tag == 'del' || tag == 'strike' || tag == 's') {
          var t = 'temp_c' + tag
        } else var t = 'temp_' + tag
        activeResults += markup[t]
        activeResults += ' '
        return
      }
      // if (this.in_endnotes && tag == 'a') return
      if (tag === 'a' && this.linkObj) {
        activeResults = this.linkObj.close(activeResults, this)
        delete this.linkObj
        tag = 'blank'
      }
      // if (this.in_link && format_chars[current_tag] && this.link_formats.length) {
      //   return
      // } else if (tag == 'a' && !this.link_formats.length) this.in_link = false

      if (this.link_only) {
        this.link_only = false
        return
      }

      if (!markup[tag]) return

      if (tag == 'sup' && this.attr == 'dwfcknote') {
        return
      }
      if (this.is_smiley) {
        this.is_smiley = false
        if (tag != 'li') return
      }
      if (tag === 'span') {
        let currSpan = this.spanStack.pop()
        if (this.linkObj) {
          activeResults = currSpan.mergeWithParentLink(
            activeResults, this.linkObj)
        } else {
          activeResults = currSpan.close(activeResults)
        }
        tag = 'blank'
      }

      if (tag === 'div') {
        if (this.footnoteContentObj) {
          if (this.footnoteContentObj.divStack.length) {
            activeResults =
              this.footnoteContentObj.pop().close(activeResults, this)
          } else {
            // end of `<div class="content">` element
            this.footnoteObj.addContent(
              this.footnoteContentObj.close(activeResults)
            )
            delete this.footnoteContentObj
          }
          tag = 'blank'
        } else if (this.footnoteObj) {
          // end of `<div class="fn">` element
          activeResults = this.footnoteObj.close(activeResults)
          delete this.footnoteObj
          tag = 'blank'
        }
      }
      if (tag == 'dl' && this.downloadable_code) {
        this.downloadable_code = false
        return
      }
      if (tag == 'a' && (this.export_code || this.code_snippet)) {
        this.export_code = false
        this.code_snippet = false
        return
      }

      var current_tag = tag
      if (this.footnote) {
        tag = 'fn_end'
        this.footnote = false
      } else if (tag == 'a' && this.xcl_markup) {
        this.xcl_markup = false
        return
      } else if (tag === 'table') {
        let finishedTable = this.tableStack.pop()
        this.in_table = !!this.tableStack.length
        activeResults = finishedTable.close(activeResults)
        return
      }

      if (this.geshi) {
        this.geshi = false
        return
      }

      if (tag == 'code' && !this.list_started) {     // empty code markup corrupts activeResults
        if (activeResults.match(/''\s*$/m)) {
          activeResults = activeResults.replace(/''\s*$/, '\n')
          return
        }
      } else if (tag == 'a' && this.attr == 'src') {
        // if local image without link content, as in <a . . .></a>, delete link markup
        if (this.backup('\[\[', '\{')) return
      }

      if (this.end_nested) {
        this.end_nested = false
        return    // prevent newline from being inserted between end of nested list and return to previous nested level
      }

      if (tag == 'ol' || tag == 'ul') {
        this.list_level--
        if (!this.list_level) this.format_in_list = false
        if (this.prev_li.length) {
          markup['li'] = this.prev_li.pop()
          this.end_nested = true
          return
        }
        tag = '\n\n'
      } else if (tag == 'pre') {
        tag = markup_end[tag]
        if (this.code_type) {
          tag += this.code_type + '>'
        } else {
          var codeinx = activeResults.lastIndexOf('code')
          var fileinx = activeResults.lastIndexOf('file')
          if (fileinx > codeinx) {
            this.code_type = 'file'
          } else this.code_type = 'code'
          tag += this.code_type + '>'
        }
        this.code_type = false
      } else if (typeof markup_end[tag] === 'string' && markup_end[tag]) {
        tag = markup_end[tag]
      } else if (this.attr == 'u' && tag == 'em') {
        tag = 'u'
      } else if (tag == 'acronym') {
      } else {
        tag = markup[tag]
      }

      if (current_tag === 'td' || current_tag === 'th') {
        let currTable = this.tableStack[this.tableStack.length - 1]
        currTable.closeCell(activeResults)
        this.in_td = false
        activeResults = ''
        return
      } else if (current_tag.match(/h\d+/)) {
        this.in_header = false
      }

      if (markup['li']) {
        if (activeResults.match(/\n$/) && !this.list_level) {
          tag = ''
        }
      }

      if (typeof tag === 'string') {
        activeResults += tag
      }

      if (format_chars[current_tag]) {
        if (this.list_level) {
          this.format_in_list = true
          HTMLFormatInList = true
        }
        activeResults += markup['format_space']
        HTMLParser_FORMAT_SPACE = markup['format_space']
      }
      this.last_tag = current_tag
    },

    chars: function (text) {
      text = text.replace(/\t/g, '    ')

      if (text.match(/~~START_HTML_BLOCK~~/)) {
        text = text.replace(/~~START_HTML_BLOCK~~\n*/, '~~START_HTML_BLOCK~~\n<code>\n')
      }
      if (text.match(/~~CLOSE_HTML_BLOCK~~/)) {
        text = text.replace(/~~CLOSE_HTML_BLOCK~~\n*/gm, '\n</code>\n\n~~CLOSE_HTML_BLOCK~~\n\n')
      }

      if (this.interwiki) {
        text = text.replace(String.frasl, '\/')
      }
      if (this.interwiki && activeResults.match(/>\w+\s*\|$/)) {
        this.interwiki = false
        if (this.attr) {
          activeResults += text
        } else {
          activeResults = activeResults.replace(/>\w+\s*\|$/, '>' + text)
        }
        return
      }
      if (this.in_multi_plugin) {
        text = text.replace('&lt; ', '&lt;')
      }
      text = text.replace(/&#39;/g, "'")  // replace single quote entities with single quotes
      text = text.replace(/^(&gt;)+/, function (match, quotes) {
        return (match.replace(/(&gt;)/g, '\__QUOTE__'))
      })
      // adjust spacing on multi-formatted strings
      activeResults = activeResults.replace(/(?:(?:[\/\*_]{2})_FORMAT_SPACE_){2,}$/,
        match => {
          return match.replace(/_FORMAT_SPACE_/g, '') + '@@_SP_@@'
        })
      if (text.match(/^&\w+;/)) {
        activeResults = activeResults.replace(/_FORMAT_SPACE_\s*$/, '')   // remove unwanted space after character entity
      }

      if (this.link_only) {
        if (text) {
          replacement = '|' + text + '}} '
          activeResults = activeResults.replace(/\}\}\s*$/, replacement)
        }
        return
      }
      if (!this.code_type) {
        text = text.replace(/\x20{6,}/, '   ')
        if (this.in_td && !this.linkObj) {
          text = text.replace(/(&nbsp;)+\s*/, '~~CKG_TABLE_NBSP~~')
        } else {
          text = text.replace(/(&nbsp;)+/, ' ')
        }

        if (this.format_tag) {
          if (!this.list_started || this.in_table) text = text.replace(/^\s+/, '@@_SP_@@')
        } else if (this.last_tag == 'a') {
          text = text.replace(/^\s{2,}/, ' ')
        }

        if (text.match(/nowiki&gt;/)) {
          HTMLParser_NOWIKI = true
        }

        if (this.format_in_list || (HTMLParserFont && this.list_started)) {
          text = text.replace(/^[\n\s]+$/g, '')
          if (text.match(/\n{2,}\s{1,}/)) {
            text = text.replace(/\n{2,}/, '\n')
          }
        }

        // if (this.in_td && !text) {
        //   text = '_FCKG_BLANK_TD_'
        //   this.in_td = false
        // }
      } else {
        text = text.replace(/&lt;\s/g, '<')
        text = text.replace(/\s&gt;/g, '>')
        var geshi = text.match(/^\s*geshi:\s+(.*)$/m)
        if (geshi) {
          activeResults = activeResults.replace(/<(code|file)>\s*$/, '<' + '$1' + ' ' + geshi[1] + '>')
          text = text.replace(geshi[0], '')
        }
      }

      if (this.attr && this.attr == 'dwfcknote') {
        if (text.match(/fckgL\d+/)) {
          return
        }
        if (text.match(/^[\-,:;!_]/)) {
          activeResults += text
        } else {
          activeResults += ' ' + text
        }
        return
      }

      if (this.downloadable_code && (this.export_code || this.code_snippet)) {
        this.downloadable_file = text
        return
      }

      /* remove space between link end markup and following punctuation */
      if (this.last_tag == 'a' && text.match(/^[\.,;\:\!]/)) {
        activeResults = activeResults.replace(/\s$/, '')
      }

      if (this.in_header) {
        text = text.replace(/---/g, '&mdash;')
        text = text.replace(/--/g, '&ndash;')
      }
      if (this.list_started) {
        activeResults = activeResults.replace(/_LIST_EOFL_\s*__L_BR_K__\s*$/, '_LIST_EOFL_')
      }
      if (!this.code_type) {   // keep special character literals outside of code block
        // don't touch samba share or Windows path backslashes
        if (!activeResults.match(/\[\[\\\\.*?\|$/) && !text.match(/\w:(\\(\w?))+/)) {
          if (!text.match(/\\\\[\w\.\-\_]+\\[\w\.\-\_]+/)) {
            text = text.replace(/([\\])/g, '%%$1%%')
          }
          text = text.replace(/([\*])/g, '_CKG_ASTERISK_')
        }
      }

      // if (this.in_endnotes && HTMLParserTopNotes.length) {
      //   if (text.match(/\w/) && !text.match(/^\s*\d\)\s*$/)) {
      //     text = text.replace(/\)\s*$/, '_FN_PAREN_C_')
      //     var index = HTMLParserTopNotes.length - 1
      //     if (this.bottom_url) {
      //       if (this.link_class && this.link_class == 'media') {
      //         text = '{{' + this.bottom_url + '|' + text + '}}'
      //       } else text = '[[' + this.bottom_url + '|' + text + ']]'
      //     }
      //     if (HTMLParserBottomNotes[HTMLParserTopNotes[index]]) {
      //       text = text.replace('(', 'L_PARgr')
      //       text = text.replace(')', 'R_PARgr')
      //       HTMLParserBottomNotes[HTMLParserTopNotes[index]] += ' ' + text
      //     } else {
      //       text = text.replace('(', 'L_PARgr')
      //       text = text.replace(')', 'R_PARgr')
      //       HTMLParserBottomNotes[HTMLParserTopNotes[index]] = text
      //     }
      //   }
      //   this.bottom_url = false
      //   return
      // }

      if (text && text.length) {
        activeResults += text
      }
      // remove space between formatted character entity and following character string
      activeResults = activeResults.replace(/(&\w+;)\s*([\*\/_]{2})_FORMAT_SPACE_(\w+)/, '$1$2$3')

      if (this.list_level && this.list_level > 1) {
        activeResults = activeResults.replace(/(\[\[.*?\]\])([ ]+[\*\-].*)$/, ' $1\n$2')
      }

      try {    // in case regex throws error on dynamic regex creation
        var regex = new RegExp('([\*\/\_]{2,})_FORMAT_SPACE_([\*\/\_]{2,})(' + RegExp.escape(text) + ')$')
        if (activeResults.match(regex)) {
          // remove left-over space inside multiple format sequences
          activeResults = activeResults.replace(regex, '$1$2$3')
        }
      } catch (ex) { }

      if (!HTMLParserOpenAngleBracket) {
        if (text.match(/&lt;/)) {
          HTMLParserOpenAngleBracket = true
        }
      }
    },

    comment: function (text) {
      // activeResults += "<!--" + text + "-->";
    },

    dbg: function (text, heading) {
      if (text.replace) {
        text = text.replace(/^\s+/g, '')
        text = text.replace(/^\n$/g, '')
        text = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        if (!text) return
      }
      if (heading) {
        heading = '<b>' + heading + '</b>\n'
      }
      HTMLParser_DEBUG += heading + text + '\n__________\n'
    }

  })

  /*
    we allow escaping of troublesome characters in plugins by enclosing them withinback slashes, as in \*\
    the escapes are removed here together with any DW percent escapes
  */

  activeResults = activeResults.replace(/__TABLE_PLACEHOLDER__/g, '')
  activeResults = activeResults.replace(/(\[\[\\\\)(.*?)\]\]/gm, function (match, brackets, block) {
    block = block.replace(/\\/g, '_SMB_')
    return brackets + block + ']]'
  })

  activeResults = activeResults.replace(/%%\\%%/g, '_ESC_BKSLASH_')
  activeResults = activeResults.replace(/%*\\%*([^\w]{1})%*\\%*/g, '$1')

  activeResults = activeResults.replace(/_SMB_/g, '\\')

  activeResults = activeResults.replace(/(\s*={2,}).*?CKGE_TMP_(\w+)(.*?).*?CKGE_TMP_c?\2.*?\1/gm, function (m, tag) {   // remove formats from headers
    m = m.replace(/CKGE_TMP_\w+/gm, '')
    var v = jQuery('#formatdel').val()
    if (!v) {
      jQuery('#dw__editform').append('<input type="hidden" id="formatdel" name="formatdel" value="del" />')
    }
    return m
  })
  activeResults = activeResults.replace(/\s?(CKGE_TMP_\w+)\s?/gm, function (m, tag) {
    if ($FORMAT_SUBST[tag]) return $FORMAT_SUBST[tag]
    return m
  })

  activeResults = activeResults.replace(/(\s*={2,})(.*?)(\[\[|\{\{)(.*?)(\]\]|\}\})(.*?)\1/gm, function (m, h_markup, whatever, bracket_1, inner, bracket_2, end_str) {
    end_str = end_str.replace(/\[\[(.*?)\|(.*?)\]\]/g, '$2')
    end_str = end_str.replace(/\{\{(.*?)\|(.*?)\}\}/g, '$2')
    m = h_markup + ' ' + whatever + ' ' + inner.replace(/.*?\|(.*?)/, '$1') + ' ' + end_str + ' ' + h_markup
    var v = jQuery('#formatdel').val()
    if (!v) {
      jQuery('#dw__editform').append('<input type="hidden" id="formatdel" name="formatdel" value="del" />')
    }
    return m
  })

  if (id == 'test') {
    if (!HTMLParser_test_result(activeResults)) return
  }

  activeResults = activeResults.replace(/\{ \{ rss&gt;Feed:/mg, '{{rss&gt;http://')
  activeResults = activeResults.replace(/~ ~ (NOCACHE|NOTOC)~ ~/mg, '~~' + '$1' + '~~')

  if (HTMLParser_FORMAT_SPACE) {
    if (HTMLParser_COLSPAN) {
      activeResults = activeResults.replace(/\s*([\|\^]+)((\W\W_FORMAT_SPACE_)+)/gm, function (match, pipes, format) {
        format = format.replace(/_FORMAT_SPACE_/g, '')
        return (format + pipes)
      })
    }
    activeResults = activeResults.replace(/&quot;/g, '"')
    var regex = new RegExp(HTMLParser_FORMAT_SPACE + '([\\-]{2,})', 'g')
    activeResults = activeResults.replace(regex, ' $1')

    activeResults = activeResults.replace(/\]\](\*\*|\/\/|\'\'|__|<\/del>)_FORMAT_SPACE_/, ']]$1@@_SP_@@')

    var regex = new RegExp("(&amp;|\\W|\\w|\\d)(\\*\\*|\\/\\/|\\'\\'|__|<\/del>)+" + HTMLParser_FORMAT_SPACE + '(\\w|\\d)', 'g')
    activeResults = activeResults.replace(regex, '$1$2$3')

    var regex = new RegExp(HTMLParser_FORMAT_SPACE + '@@_SP_@@', 'g')
    activeResults = activeResults.replace(regex, ' ')

    // spacing around entities with double format characters
    activeResults = activeResults.replace(/([\*\/_]{2})@@_SP_@@(&\w+;)/g, '$1 $2')

    activeResults = activeResults.replace(/@@_SP_@@/g, ' ')
    var regex = new RegExp(HTMLParser_FORMAT_SPACE + '([^\\)\\]\\}\\{\\-\\.,;:\\!\?"\x94\x92\u201D\u2019' + "'" + '])', 'g')
    activeResults = activeResults.replace(regex, ' $1')
    regex = new RegExp(HTMLParser_FORMAT_SPACE, 'g')
    activeResults = activeResults.replace(regex, '')

    if (HTMLFormatInList) {
      /* removes extra newlines from lists */
      activeResults = activeResults.replace(/(\s+[\-\*_]\s*)([\*\/_\']{2})(.*?)(\2)([^\n]*)\n+/gm,
        function (match, list_type, format, text, list_type_close, rest) {
          return (list_type + format + text + list_type_close + rest + '\n')
        })
    }
  }

  // /* fix for links in lists, at ends of lines, which cause loss of line-feeds */
  // if (HTMLLinkInList) {
  //   activeResults = activeResults.replace(/(\]\]|\}\})(\s+)(\*|-)/mg,
  //     function (match, link, spaces, type) {
  //       spaces = spaces.replace(/\n/, '')
  //       return (link + '\n' + spaces + type)
  //     })
  // }

  var line_break_final = '\\\\ '
  if (HTMLParser_LBR) {
    activeResults = activeResults.replace(/(__L_BR_K__)+/g, line_break_final)
    activeResults = activeResults.replace(/__L_BR_K__/gm, line_break_final)
    activeResults = activeResults.replace(/(\\\\)\s+/gm, line_break_final)
  }

  if (HTMLParser_PRE) {
    activeResults = activeResults.replace(/\s+<\/(code|file)>/g, '\n</' + '$1' + '>')
    if (HTMLParser_Geshi) {
      activeResults = activeResults.replace(/\s+;/mg, ';')
      activeResults = activeResults.replace(/&lt;\s+/mg, '<')
      activeResults = activeResults.replace(/\s+&gt;/mg, '>')
    }
  }

  if (HTMLParserOpenAngleBracket) {
    activeResults = activeResults.replace(/\/\/&lt;\/\/\s*/g, '&lt;')
  }

  if (HTMLParserFont)   // HTMLParserFont start
  {
    fontLinkReconcile()

    var regex = /\>\s+(\*\*|__|\/\/|'')\s+_\s+\1\s+<\/font>/gm
    activeResults = activeResults.replace(regex, function (m) {
      m = m.replace(/\s+/g, '')
      return m
    })

    /** Remove font tag in headers */
    activeResults = activeResults.replace(/(\s*={2,})\s*(.*?)(<font[^\>]+>)(.*?)(<\/font>)(.*?)\s*\1/gm, function (match) {
      match = match.replace(/<\/font>/g, ' ')
      match = match.replace(/<font.*?>/g, ' ')
      var v = jQuery('#formatdel').val()
      if (!v) {
        jQuery('#dw__editform').append('<input type="hidden" id="formatdel" name="formatdel" value="del" />')
      }
      return match
    })
  }  // HTMLParserFont end

  if (HTMLFontInLinkMerged) {
    var v = jQuery('#fontMergedInLinks').val()
    if (!v) {
      jQuery('#dw__editform').append('<input type="hidden" id="fontMergedInLinks" name="fontMergedInLinks" value="del" />')
    }
  }

  if (HTMLParserTopNotes.length) {
    activeResults = activeResults.replace(/<sup>\(\(\){2,}\s*<\/sup>/g, '')
    activeResults = activeResults.replace(/\(\(+(\d+)\)\)+/, '(($1))')
    for (var i in HTMLParserBottomNotes) {  // re-insert DW's bottom notes at text level
      var matches = i.match(/_(\d+)/)
      var pattern = new RegExp('(\<sup\>)*[\(]+' + matches[1] + '[\)]+(<\/sup>)*')
      HTMLParserBottomNotes[i] = HTMLParserBottomNotes[i].replace(/(\d+)_FN_PAREN_C_/, '')
      activeResults = activeResults.replace(pattern, '((' + HTMLParserBottomNotes[i].replace(/_FN_PAREN_C_/g, ') ') + '))')
    }
    activeResults = activeResults.replace(/<sup><\/sup>/g, '')
    activeResults = activeResults.replace(/((<sup>\(\(\d+\)\)\)?<\/sup>))/mg, function (fn) {
      if (!fn.match(/p>\(\(\d+/)) {
        return ''
      }
      return fn
    }
    )
  }

  activeResults = activeResults.replace(/(={3,}.*?)(\{\{.*?\}\})(.*?={3,})/g, '$1$3\n\n$2')
  // remove any empty footnote markup left after section re-edits
  activeResults = activeResults.replace(/(<sup>)*\s*\[\[\s*\]\]\s*(<\/sup>)*\n*/g, '')
  // remove piled up sups with ((notes))

  activeResults = activeResults.replace(/<sup>\s*\(\(\d+\)\)\s*<\/sup>/mg, '')

  if (HTMLParser_MULTI_LINE_PLUGIN) {
    activeResults = activeResults.replace(/<\s+/g, '<')
    activeResults = activeResults.replace(/&lt;\s+/g, '<')
  }

  if (HTMLParser_NOWIKI) {
    /* any characters escaped by DW %%<char>%% are replaced by NOWIKI_<char>
       <char> is restored in save.php
   */
    var nowiki_escapes = '%'  // this technique allows for added chars to attach to NOWIKI_$1_
    var regex = new RegExp('([' + nowiki_escapes + '])', 'g')

    activeResults = activeResults.replace(/(&lt;nowiki&gt;)(.*?)(&lt;\/nowiki&gt;)/mg,
      function (all, start, mid, close) {
        mid = mid.replace(/%%(.)%%/mg, 'NOWIKI_$1_')
        return start + mid.replace(regex, 'NOWIKI_$1_') + close
      })
  }

  activeResults = activeResults.replace(/__SWF__(\s*)\[*/g, '{{$1')
  activeResults = activeResults.replace(/\|.*?\]*(\s*)__FWS__/g, '$1}}')
  activeResults = activeResults.replace(/(\s*)__FWS__/g, '$1}}')
  activeResults = activeResults.replace(/\n{3,}/g, '\n\n')

  if (useComplexTables) {
    if (activeResults.indexOf('~~COMPLEX_TABLES~~') == -1) {
      activeResults += '~~COMPLEX_TABLES~~\n'
    }
  }
  if (!useComplexTables) { activeResults = activeResults.replace(/~~COMPLEX_TABLES~~/gm, '') }
  activeResults = activeResults.replace(/_CKG_ASTERISK_/gm, '*')
  activeResults = activeResults.replace(/_ESC_BKSLASH_/g, '\\')
  activeResults = activeResults.replace(/divalNLine/gm, '\n')
  if (id == 'test') {
    if (HTMLParser_test_result(activeResults)) {
      alert(activeResults)
    }
    return
  }

  var dwform = GetE('dw__editform')
  dwform.elements.fck_wikitext.value = activeResults

  if (id == 'bakup') {
    return
  }
  if (id) {
    var dom = GetE(id)
    dom.click()
    return true
  }
}

jQuery(document).ready(function () {
  var edit__summary = false
  jQuery(document).on('keypress', 'input#edit__summary', function (e) {
    if (e.which == 13) {
      edit__summary = true
      jQuery('#save_button').trigger('mousedown')
    }
  })

  jQuery('#ebut_test').mousedown(function () {
    parse_wikitext('test')
  })

  jQuery('#ebtn__delete').click(function () {
    if (edit__summary) {
      edit__summary = false
      return
    }
    return confirm(JSINFO['confirm_delete'])
  })

  jQuery('#ebtn__delete').mouseup(function () {
    draft_delete()
  })

  jQuery('#ebtn__dwedit').click(function () {
    ckgedit_to_dwedit = true
    setDWEditCookie(2, this)
    parse_wikitext('edbtn__save')
    this.form.submit()
  })

  jQuery('#ebtn__fbswitch').click(function () {
    if (getCookie('ckgFbOpt') == 'dokuwiki') {
      document.cookie = 'ckgFbOpt=ckgedit;'
    } else {
      document.cookie = 'ckgFbOpt=dokuwiki;'
    }
    parse_wikitext('edbtn__save')
    this.form.submit()
  })

  jQuery('#ckgedit_draft_btn').click(function () {
    ckgedit_get_draft()
  })
  jQuery('#backup_button').click(function () {
    renewLock(true)
  })
  jQuery('#revert_to_prev_btn').click(function () {
    revert_to_prev()
  })

  jQuery('#no_styling_btn').click(function () {
    this.form.styling.value = 'no_styles'
    this.form.prefix.value = ''
    this.form.suffix.value = ''
    this.form.rev.value = ''
  })

  jQuery('#ebut_cancel').mouseup(function () {
    draft_delete()
  })
  jQuery('#save_button').mousedown(function () {
    if (this.form.template && this.form.template.value == 'tpl') window.dwfckTextChanged = true
    if (!window.dwfckTextChanged && !JSINFO['cg_rev']) {
      ckgedit_dwedit_reject = true
      parse_wikitext('ebut_cancel')
    } else {
      parse_wikitext('edbtn__save')
    }
  })
})
