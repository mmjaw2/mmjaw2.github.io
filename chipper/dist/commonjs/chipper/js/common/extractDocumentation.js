"use strict";

// Copyright 2015-2024, University of Colorado Boulder

/**
 * Given the AST output from Esprima for a JS file that conforms to PhET's style, this extracts the documentation and
 * returns a structured object containing all of the documentation.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

/* eslint-env browser, node */

(function () {
  /**
   * Given esprima's block comment string value, strip off the leading spaces, a star, and up to one other space.
   * @private
   *
   * Thus given input:
   * var string = '*\n' + // leading star from the JSDoc style
   *              '   * Some code:\n' +
   *              '   * function something() {\n' +
   *              '   *   console.log( boo );\n' +
   *              '   * }\n' +
   *              '   ';
   *
   * will have the output:
   * var output = '\n' +
   *              'Some code:\n' +
   *              'function something() {\n' +
   *              '  console.log( boo );\n' + // keeps remaining spaces for indentation
   *              '}\n' +
   *              '' +
   *
   * @param {string} string
   * @returns {string}
   */
  function destarBlockComment(string) {
    return string.split('\n').map(function (line) {
      var destarred = line.replace(/^ *\* ?/, '');

      // If the line is effectively empty (composed of only spaces), set it to the empty string.
      if (destarred.replace(/ /g, '').length === 0) {
        destarred = '';
      }
      return destarred;
    }).join('\n');
  }

  /**
   * Removes leading/trailing blank lines, and consolidates consecutive blank lines into one blank line.
   * @private
   *
   * Thus for input: '\nFoo\n\nBar\n', the output would be 'Foo\nBar'
   *
   * @param {string} string
   * @returns {string}
   */
  function trimLines(string) {
    var lines = string.split('\n');

    // remove consecutive blank lines
    for (var i = lines.length - 1; i >= 1; i--) {
      if (lines[i].length === 0 && lines[i - 1].length === 0) {
        lines.splice(i, 1);
      }
    }

    // remove leading blank lines
    while (lines.length && lines[0].length === 0) {
      lines.shift();
    }

    // remove trailing blank lines
    while (lines.length && lines[lines.length - 1].length === 0) {
      lines.pop();
    }
    return lines.join('\n');
  }

  /**
   * Given a type string, e.g. '{number}', this should convert it into the desired type format.
   * @private
   *
   * @param {string} typeString
   * @returns {?}
   */
  function parseType(typeString) {
    // For now, get rid of the brackets
    typeString = typeString.slice(1, typeString.length - 1);

    // for ( var i = 0; i < line.length; i++ ) {
    // TODO: handle |, {}, etc. https://github.com/phetsims/chipper/issues/411
    // }

    return typeString;
  }

  /**
   * Parses type-documentation lines that would be used with jsdoc params, etc., such as:
   * @private
   *
   * '{number} ratio - The ratio for something' parses to (with hasName = true):
   * {
   *   type: 'number', // result of parseType on '{number}'
   *   name: 'ratio',
   *   description: 'The ratio for something'
   * }
   *
   * '{number} The ratio for something' parses to (with hasName = false):
   * {
   *   type: 'number',
   *   description: 'The ratio for something'
   * }
   *
   * @param {string} line
   * @param {boolean} hasName
   * @returns {Object}
   */
  function splitTypeDocLine(line, hasName) {
    var braceCount = 0;
    for (var i = 0; i < line.length; i++) {
      if (line[i] === '{') {
        braceCount++;
      } else if (line[i] === '}') {
        braceCount--;

        // If we have matched the first brace, parse the type, check for a name, and return the rest as a description.
        if (braceCount === 0) {
          var endOfType = i + 1;
          var type = line.slice(0, endOfType);
          var rest = line.slice(endOfType + 1);
          var name = void 0;
          var description = void 0;
          if (hasName) {
            var spaceIndex = rest.indexOf(' ');
            if (spaceIndex < 0) {
              // all name
              name = rest;
            } else {
              // has a space
              name = rest.slice(0, spaceIndex);
              description = rest.slice(spaceIndex + 1);
            }
          } else {
            description = line.slice(endOfType + 1);
          }
          var result = {
            type: parseType(type)
          };
          if (name) {
            if (name.charAt(0) === '[') {
              result.optional = true;
              name = name.slice(1, name.length - 1);
            }
            result.name = name;
          }
          if (description) {
            result.description = description.replace(/^ *(- )?/, '');
          }
          return result;
        }
      }
    }
    return {
      type: parseType(line)
    };
  }

  /**
   * Parses a de-starred block comment (destarBlockComment output), extracting JSDoc-style tags. The rest is called the
   * description, which has blank linkes trimmed.
   * @private
   *
   * If a line has a JSDoc-style tag, consecutive lines afterwards that are indented will be included for that tag.
   *
   * Returns object like:
   * {
   *   description: {string}, // everything that isn't JSDoc-style tags
   *   [visibility]: {string}, // if it exists, one of 'public', 'private' or 'internal'
   *   [parameters]: {Array.<{ type: {?}, name: {string}, description: {string} }>}, // array of parsed parameters
   *   [returns]: { type: {?}, description: {string} }, // return tag
   *   [constant]: { type: {?}, name: {string}, description: {string} }, // constant tag
   *   [constructor]: true, // if the constructor tag is included
   *   [jsdoc]: {Array.<string>} // any unrecognized jsdoc tag lines
   * }
   *
   * @param {string} string
   * @returns {Object}
   */
  function parseBlockDoc(string) {
    var result = {};
    var descriptionLines = [];
    var jsdocLines = [];
    var lines = string.split('\n');
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      if (line.charAt(0) === '@') {
        for (var j = i + 1; j < lines.length; j++) {
          var nextLine = lines[j];
          if (nextLine.charAt(0) === ' ') {
            // strip out all but one space, and concatenate
            line = line + nextLine.replace(/^ +/, ' ');

            // we handled the line
            i++;
          } else {
            break;
          }
        }
        jsdocLines.push(line);
      } else {
        descriptionLines.push(line);
      }
    }
    result = {
      description: trimLines(descriptionLines.join('\n'))
    };
    for (var k = jsdocLines.length - 1; k >= 0; k--) {
      var jsdocLine = jsdocLines[k];
      if (jsdocLine.indexOf('@public') === 0) {
        if (jsdocLine.indexOf('internal') === 0) {
          result.visibility = 'internal';
        } else {
          result.visibility = 'public';
        }
        jsdocLines.splice(k, 1);
      } else if (jsdocLine.indexOf('@private') === 0) {
        result.visibility = 'private';
        jsdocLines.splice(k, 1);
      } else if (jsdocLine.indexOf('@param ') === 0) {
        result.parameters = result.parameters || [];
        result.parameters.unshift(splitTypeDocLine(jsdocLine.slice('@param '.length), true));
        jsdocLines.splice(k, 1);
      } else if (jsdocLine.indexOf('@returns ') === 0) {
        result.returns = splitTypeDocLine(jsdocLine.slice('@returns '.length), false);
        jsdocLines.splice(k, 1);
      } else if (jsdocLine.indexOf('@constant ') === 0) {
        result.constant = splitTypeDocLine(jsdocLine.slice('@constant '.length), true);
        jsdocLines.splice(k, 1);
      } else if (jsdocLine.indexOf('@constructor') === 0) {
        result.constructor = true;
        jsdocLines.splice(k, 1);
      }
    }
    if (jsdocLines.length) {
      result.jsdoc = jsdocLines;
    }
    return result;
  }

  /**
   * Similar to parseBlockDoc, but for line comments. Returns null for comments without visibility.
   * @private
   *
   * A few line styles that are supported:
   *
   * %public {number} - Some comment
   * Will parse to: { visibility: 'public', type: 'number', description: 'Some comment' }
   *
   * %public (dot-internal) This has no type or dash
   * Will parse to: { visibility: 'internal', description: 'This has no type or dash' }
   *
   * @param {string} string
   * @returns {Object}
   */
  function parseLineDoc(string) {
    var visibility;

    // Strip visibility tags, recording the visibility
    if (string.indexOf('@public') >= 0) {
      if (string.indexOf('-internal)') >= 0) {
        visibility = 'internal';
        string = string.replace('/@public.*-internal)', '');
      } else {
        visibility = 'public';
        string = string.replace('@public', '');
      }
    }
    if (string.indexOf('@private') >= 0) {
      visibility = 'private';
      string = string.replace('@private', '');
    }

    // Strip leading spaces
    string = string.replace(/^ +/, '');

    // Ignore things without visibility
    if (!visibility) {
      return null;
    }

    // Assume leading '{' is for a type
    if (/^ *{/.test(string)) {
      var result = splitTypeDocLine(string, false);
      result.visibility = visibility;
      return result;
    }
    return {
      visibility: visibility,
      description: string.replace(/^ */, '').replace(/ *$/, '')
    };
  }

  /**
   * Extracts a documentation object (parseLineDoc/parseBlockDoc) from an Esprima AST node. Typically looks at the last
   * leading block comment if available, then the last leading public line comment.
   * @private
   *
   * Returns null if there is no suitable documentation.
   *
   * @param {Object} node - From the Esprima AST
   * @returns {Object} See parseLineDoc/parseBlockDoc for type information.
   */
  function extractDocFromNode(node) {
    function blockCommentFilter(comment) {
      return comment.type === 'Block' && comment.value.charAt(0) === '*';
    }
    function lineCommentFilter(comment) {
      return comment.type === 'Line' && comment.value.indexOf('@public') >= 0;
    }
    var lineComments = [];
    if (node.leadingComments) {
      var blockComments = node.leadingComments.filter(blockCommentFilter);
      if (blockComments.length) {
        return parseBlockDoc(destarBlockComment(blockComments[blockComments.length - 1].value));
      } else {
        lineComments = lineComments.concat(node.leadingComments.filter(lineCommentFilter));
      }
    }
    // NOTE: trailing comments were also recognized as leading comments for consecutive this.<prop> definitions.
    // Stripped out for now.
    // if ( node.trailingComments ) {
    //   lineComments = lineComments.concat( node.trailingComments.filter( lineCommentFilter ) );
    // }
    if (lineComments.length) {
      var comment = lineComments[lineComments.length - 1];
      return parseLineDoc(comment.value.replace(/^ /, '')); // strip off a single leading space
    }
    return null;
  }
  function isCapitalized(string) {
    return string.charAt(0) === string.charAt(0).toUpperCase();
  }
  function capitalize(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  /**
   * Whether an esprima-parsed AST represents an assigment to an identifier on 'this', e.g.:
   * this.something = ...;
   * @private
   *
   * @param {Object} expr
   * @returns {boolean}
   */
  function isSimpleThisAssignment(expr) {
    return expr.type === 'AssignmentExpression' && expr.left.type === 'MemberExpression' && expr.left.object.type === 'ThisExpression' && expr.left.property.type === 'Identifier';
  }

  // e.g. console.log( JSON.stringify( extractDocumentation( program ), null, 2 ) );
  function extractDocumentation(program) {
    var doc = {};
    function parseTypeExpression(typeStatement, typeExpression, name, parentName) {
      var typeDoc = {
        comment: extractDocFromNode(typeStatement),
        instanceProperties: [],
        staticProperties: [],
        constructorProperties: [],
        supertype: null,
        // filled in by inherit
        type: 'type',
        name: name
      };
      if (parentName) {
        typeDoc.parentName = parentName;
      }
      var constructorStatements = typeExpression.body.body; // statements in the constructor function body
      constructorStatements.forEach(function (constructorStatement) {
        if (constructorStatement.type === 'ExpressionStatement') {
          if (isSimpleThisAssignment(constructorStatement.expression)) {
            var comment = extractDocFromNode(constructorStatement);
            if (comment) {
              comment.name = constructorStatement.expression.left.property.name;
              typeDoc.constructorProperties.push(comment);
            }
          }
        }
      });
      return typeDoc;
    }
    function parseStaticProperty(property) {
      var key = property.key.name;

      // TODO: support static constants? https://github.com/phetsims/chipper/issues/411
      if (property.value.type === 'FunctionExpression') {
        var staticDoc = extractDocFromNode(property);
        if (staticDoc) {
          staticDoc.type = 'function';
          staticDoc.name = key;
          return staticDoc;
        }
      }
      return null;
    }

    /**
     * @param expression
     * @returns {null|Object}
     */
    function parseInherit(expression) {
      var supertype = expression.arguments[0].name;
      var subtype = expression.arguments[1].name;

      // If we haven't caught the constructor/type declaration, skip the inherit parsing
      if (!doc[subtype]) {
        return null;
      }

      // Assign the supertype on the subtype
      doc[subtype].supertype = supertype;

      // Instance (prototype) properties
      if (expression.arguments.length >= 3) {
        var instanceProperties = expression.arguments[2].properties;

        // For-iteration, so we can skip some items by incrementing i.
        for (var i = 0; i < instanceProperties.length; i++) {
          var property = instanceProperties[i];
          var key = property.key.name;
          if (property.value.type === 'FunctionExpression') {
            if (doc[subtype]) {
              var instanceDoc = extractDocFromNode(property);
              if (instanceDoc) {
                // Check to see if we have an ES5 getter/setter defined below
                if (i + 1 < instanceProperties.length) {
                  var nextProperty = instanceProperties[i + 1];
                  var nextExpression = nextProperty.value;
                  if (nextExpression.type === 'FunctionExpression') {
                    var nextKey = nextProperty.key.name;
                    var capitalizedNextName = capitalize(nextKey);
                    if (nextProperty.kind === 'get' && "get".concat(capitalizedNextName) === key || "is".concat(capitalizedNextName) === key) {
                      // Skip processing the ES5 getter next
                      i++;
                      instanceDoc.name = nextKey;
                      instanceDoc.explicitGetName = key;
                    } else if (nextProperty.kind === 'set' && "set".concat(capitalizedNextName) === key) {
                      // Skip processing the ES5 setter next
                      i++;
                      instanceDoc.name = nextKey;
                      instanceDoc.explicitSetName = key;
                    }
                  }
                }
                instanceDoc.type = 'function';
                instanceDoc.name = instanceDoc.name || key;
                doc[subtype].instanceProperties.push(instanceDoc);
              }
            }
          }
        }
      }

      // Static (constructor) properties
      if (expression.arguments.length >= 4) {
        var staticProperties = expression.arguments[3].properties;
        staticProperties.forEach(function (property) {
          var staticDoc = parseStaticProperty(property);
          if (doc[subtype] && staticDoc) {
            doc[subtype].staticProperties.push(staticDoc);
          }
        });
      }
      return doc[subtype];
    }

    // Dig into require structure
    var mainStatements = program.body[0].expression.arguments[0].body.body;
    doc.topLevelComment = extractDocFromNode(program.body[0]);
    var _loop = function _loop() {
      var topLevelStatement = mainStatements[i];

      // Top-level capitalized function declaration? Parse it as a Type
      if (topLevelStatement.type === 'FunctionDeclaration' && isCapitalized(topLevelStatement.id.name)) {
        var typeName = topLevelStatement.id.name;
        doc[typeName] = parseTypeExpression(topLevelStatement, topLevelStatement, typeName, null);
      } else if (topLevelStatement.type === 'ExpressionStatement') {
        var expression = topLevelStatement.expression;

        // Call to inherit()
        if (expression.type === 'CallExpression' && expression.callee.name === 'inherit') {
          parseInherit(expression);
        } else if (expression.type === 'AssignmentExpression' && expression.left.type === 'MemberExpression') {
          var comment = extractDocFromNode(topLevelStatement);
          if (comment && expression.left.object.type === 'Identifier' && expression.left.property.type === 'Identifier' && doc[expression.left.object.name]) {
            var innerName = expression.left.property.name;
            var type;

            // Inner Type, e.g. BinPacker.Bin = function Bin( ... ) { ... };
            if (expression.right.type === 'FunctionExpression' && isCapitalized(innerName)) {
              doc[innerName] = parseTypeExpression(topLevelStatement, expression.right, innerName, expression.left.object.name);
            }
            // Other, e.g. Vector2.ZERO = ...;
            else {
              if (expression.right.type === 'FunctionExpression') {
                type = 'function';
              } else {
                type = 'constant';
              }
              comment.type = type;
              comment.name = expression.left.property.name;
              doc[expression.left.object.name].staticProperties.push(comment);
            }
          }
        }
      }
      // Variable object initialization: e.g. var Utils = { ... };
      else if (topLevelStatement.type === 'VariableDeclaration' && topLevelStatement.declarations[0].type === 'VariableDeclarator' && topLevelStatement.declarations[0].init && topLevelStatement.declarations[0].init.type === 'ObjectExpression' && isCapitalized(topLevelStatement.declarations[0].id.name)) {
        var objectName = topLevelStatement.declarations[0].id.name;
        doc[objectName] = {
          comment: extractDocFromNode(topLevelStatement),
          // maybe not needed?
          properties: [],
          type: 'object',
          name: objectName
        };

        // Process properties in the object
        topLevelStatement.declarations[0].init.properties.forEach(function (property) {
          var staticDoc = parseStaticProperty(property);
          if (staticDoc) {
            doc[objectName].properties.push(staticDoc);
          }
        });
      }
    };
    for (var i = 0; i < mainStatements.length; i++) {
      _loop();
    }
    return doc;
  }

  // Node.js-compatible definition
  if (typeof module !== 'undefined') {
    module.exports = extractDocumentation;
  }

  // Browser direct definition (for testing)
  if (typeof window !== 'undefined') {
    window.extractDocumentation = extractDocumentation;
  }
})();
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJkZXN0YXJCbG9ja0NvbW1lbnQiLCJzdHJpbmciLCJzcGxpdCIsIm1hcCIsImxpbmUiLCJkZXN0YXJyZWQiLCJyZXBsYWNlIiwibGVuZ3RoIiwiam9pbiIsInRyaW1MaW5lcyIsImxpbmVzIiwiaSIsInNwbGljZSIsInNoaWZ0IiwicG9wIiwicGFyc2VUeXBlIiwidHlwZVN0cmluZyIsInNsaWNlIiwic3BsaXRUeXBlRG9jTGluZSIsImhhc05hbWUiLCJicmFjZUNvdW50IiwiZW5kT2ZUeXBlIiwidHlwZSIsInJlc3QiLCJuYW1lIiwiZGVzY3JpcHRpb24iLCJzcGFjZUluZGV4IiwiaW5kZXhPZiIsInJlc3VsdCIsImNoYXJBdCIsIm9wdGlvbmFsIiwicGFyc2VCbG9ja0RvYyIsImRlc2NyaXB0aW9uTGluZXMiLCJqc2RvY0xpbmVzIiwiaiIsIm5leHRMaW5lIiwicHVzaCIsImsiLCJqc2RvY0xpbmUiLCJ2aXNpYmlsaXR5IiwicGFyYW1ldGVycyIsInVuc2hpZnQiLCJyZXR1cm5zIiwiY29uc3RhbnQiLCJjb25zdHJ1Y3RvciIsImpzZG9jIiwicGFyc2VMaW5lRG9jIiwidGVzdCIsImV4dHJhY3REb2NGcm9tTm9kZSIsIm5vZGUiLCJibG9ja0NvbW1lbnRGaWx0ZXIiLCJjb21tZW50IiwidmFsdWUiLCJsaW5lQ29tbWVudEZpbHRlciIsImxpbmVDb21tZW50cyIsImxlYWRpbmdDb21tZW50cyIsImJsb2NrQ29tbWVudHMiLCJmaWx0ZXIiLCJjb25jYXQiLCJpc0NhcGl0YWxpemVkIiwidG9VcHBlckNhc2UiLCJjYXBpdGFsaXplIiwiaXNTaW1wbGVUaGlzQXNzaWdubWVudCIsImV4cHIiLCJsZWZ0Iiwib2JqZWN0IiwicHJvcGVydHkiLCJleHRyYWN0RG9jdW1lbnRhdGlvbiIsInByb2dyYW0iLCJkb2MiLCJwYXJzZVR5cGVFeHByZXNzaW9uIiwidHlwZVN0YXRlbWVudCIsInR5cGVFeHByZXNzaW9uIiwicGFyZW50TmFtZSIsInR5cGVEb2MiLCJpbnN0YW5jZVByb3BlcnRpZXMiLCJzdGF0aWNQcm9wZXJ0aWVzIiwiY29uc3RydWN0b3JQcm9wZXJ0aWVzIiwic3VwZXJ0eXBlIiwiY29uc3RydWN0b3JTdGF0ZW1lbnRzIiwiYm9keSIsImZvckVhY2giLCJjb25zdHJ1Y3RvclN0YXRlbWVudCIsImV4cHJlc3Npb24iLCJwYXJzZVN0YXRpY1Byb3BlcnR5Iiwia2V5Iiwic3RhdGljRG9jIiwicGFyc2VJbmhlcml0IiwiYXJndW1lbnRzIiwic3VidHlwZSIsInByb3BlcnRpZXMiLCJpbnN0YW5jZURvYyIsIm5leHRQcm9wZXJ0eSIsIm5leHRFeHByZXNzaW9uIiwibmV4dEtleSIsImNhcGl0YWxpemVkTmV4dE5hbWUiLCJraW5kIiwiZXhwbGljaXRHZXROYW1lIiwiZXhwbGljaXRTZXROYW1lIiwibWFpblN0YXRlbWVudHMiLCJ0b3BMZXZlbENvbW1lbnQiLCJfbG9vcCIsInRvcExldmVsU3RhdGVtZW50IiwiaWQiLCJ0eXBlTmFtZSIsImNhbGxlZSIsImlubmVyTmFtZSIsInJpZ2h0IiwiZGVjbGFyYXRpb25zIiwiaW5pdCIsIm9iamVjdE5hbWUiLCJtb2R1bGUiLCJleHBvcnRzIiwid2luZG93Il0sInNvdXJjZXMiOlsiZXh0cmFjdERvY3VtZW50YXRpb24uanMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTUtMjAyNCwgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogR2l2ZW4gdGhlIEFTVCBvdXRwdXQgZnJvbSBFc3ByaW1hIGZvciBhIEpTIGZpbGUgdGhhdCBjb25mb3JtcyB0byBQaEVUJ3Mgc3R5bGUsIHRoaXMgZXh0cmFjdHMgdGhlIGRvY3VtZW50YXRpb24gYW5kXHJcbiAqIHJldHVybnMgYSBzdHJ1Y3R1cmVkIG9iamVjdCBjb250YWluaW5nIGFsbCBvZiB0aGUgZG9jdW1lbnRhdGlvbi5cclxuICpcclxuICogQGF1dGhvciBKb25hdGhhbiBPbHNvbiA8am9uYXRoYW4ub2xzb25AY29sb3JhZG8uZWR1PlxyXG4gKi9cclxuXHJcbi8qIGVzbGludC1lbnYgYnJvd3Nlciwgbm9kZSAqL1xyXG5cclxuXHJcbiggZnVuY3Rpb24oKSB7XHJcblxyXG4gIC8qKlxyXG4gICAqIEdpdmVuIGVzcHJpbWEncyBibG9jayBjb21tZW50IHN0cmluZyB2YWx1ZSwgc3RyaXAgb2ZmIHRoZSBsZWFkaW5nIHNwYWNlcywgYSBzdGFyLCBhbmQgdXAgdG8gb25lIG90aGVyIHNwYWNlLlxyXG4gICAqIEBwcml2YXRlXHJcbiAgICpcclxuICAgKiBUaHVzIGdpdmVuIGlucHV0OlxyXG4gICAqIHZhciBzdHJpbmcgPSAnKlxcbicgKyAvLyBsZWFkaW5nIHN0YXIgZnJvbSB0aGUgSlNEb2Mgc3R5bGVcclxuICAgKiAgICAgICAgICAgICAgJyAgICogU29tZSBjb2RlOlxcbicgK1xyXG4gICAqICAgICAgICAgICAgICAnICAgKiBmdW5jdGlvbiBzb21ldGhpbmcoKSB7XFxuJyArXHJcbiAgICogICAgICAgICAgICAgICcgICAqICAgY29uc29sZS5sb2coIGJvbyApO1xcbicgK1xyXG4gICAqICAgICAgICAgICAgICAnICAgKiB9XFxuJyArXHJcbiAgICogICAgICAgICAgICAgICcgICAnO1xyXG4gICAqXHJcbiAgICogd2lsbCBoYXZlIHRoZSBvdXRwdXQ6XHJcbiAgICogdmFyIG91dHB1dCA9ICdcXG4nICtcclxuICAgKiAgICAgICAgICAgICAgJ1NvbWUgY29kZTpcXG4nICtcclxuICAgKiAgICAgICAgICAgICAgJ2Z1bmN0aW9uIHNvbWV0aGluZygpIHtcXG4nICtcclxuICAgKiAgICAgICAgICAgICAgJyAgY29uc29sZS5sb2coIGJvbyApO1xcbicgKyAvLyBrZWVwcyByZW1haW5pbmcgc3BhY2VzIGZvciBpbmRlbnRhdGlvblxyXG4gICAqICAgICAgICAgICAgICAnfVxcbicgK1xyXG4gICAqICAgICAgICAgICAgICAnJyArXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge3N0cmluZ30gc3RyaW5nXHJcbiAgICogQHJldHVybnMge3N0cmluZ31cclxuICAgKi9cclxuICBmdW5jdGlvbiBkZXN0YXJCbG9ja0NvbW1lbnQoIHN0cmluZyApIHtcclxuICAgIHJldHVybiBzdHJpbmcuc3BsaXQoICdcXG4nICkubWFwKCBsaW5lID0+IHtcclxuICAgICAgbGV0IGRlc3RhcnJlZCA9IGxpbmUucmVwbGFjZSggL14gKlxcKiA/LywgJycgKTtcclxuXHJcbiAgICAgIC8vIElmIHRoZSBsaW5lIGlzIGVmZmVjdGl2ZWx5IGVtcHR5IChjb21wb3NlZCBvZiBvbmx5IHNwYWNlcyksIHNldCBpdCB0byB0aGUgZW1wdHkgc3RyaW5nLlxyXG4gICAgICBpZiAoIGRlc3RhcnJlZC5yZXBsYWNlKCAvIC9nLCAnJyApLmxlbmd0aCA9PT0gMCApIHtcclxuICAgICAgICBkZXN0YXJyZWQgPSAnJztcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gZGVzdGFycmVkO1xyXG4gICAgfSApLmpvaW4oICdcXG4nICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZW1vdmVzIGxlYWRpbmcvdHJhaWxpbmcgYmxhbmsgbGluZXMsIGFuZCBjb25zb2xpZGF0ZXMgY29uc2VjdXRpdmUgYmxhbmsgbGluZXMgaW50byBvbmUgYmxhbmsgbGluZS5cclxuICAgKiBAcHJpdmF0ZVxyXG4gICAqXHJcbiAgICogVGh1cyBmb3IgaW5wdXQ6ICdcXG5Gb29cXG5cXG5CYXJcXG4nLCB0aGUgb3V0cHV0IHdvdWxkIGJlICdGb29cXG5CYXInXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge3N0cmluZ30gc3RyaW5nXHJcbiAgICogQHJldHVybnMge3N0cmluZ31cclxuICAgKi9cclxuICBmdW5jdGlvbiB0cmltTGluZXMoIHN0cmluZyApIHtcclxuICAgIGNvbnN0IGxpbmVzID0gc3RyaW5nLnNwbGl0KCAnXFxuJyApO1xyXG5cclxuICAgIC8vIHJlbW92ZSBjb25zZWN1dGl2ZSBibGFuayBsaW5lc1xyXG4gICAgZm9yICggbGV0IGkgPSBsaW5lcy5sZW5ndGggLSAxOyBpID49IDE7IGktLSApIHtcclxuICAgICAgaWYgKCBsaW5lc1sgaSBdLmxlbmd0aCA9PT0gMCAmJiBsaW5lc1sgaSAtIDEgXS5sZW5ndGggPT09IDAgKSB7XHJcbiAgICAgICAgbGluZXMuc3BsaWNlKCBpLCAxICk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvLyByZW1vdmUgbGVhZGluZyBibGFuayBsaW5lc1xyXG4gICAgd2hpbGUgKCBsaW5lcy5sZW5ndGggJiYgbGluZXNbIDAgXS5sZW5ndGggPT09IDAgKSB7XHJcbiAgICAgIGxpbmVzLnNoaWZ0KCk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gcmVtb3ZlIHRyYWlsaW5nIGJsYW5rIGxpbmVzXHJcbiAgICB3aGlsZSAoIGxpbmVzLmxlbmd0aCAmJiBsaW5lc1sgbGluZXMubGVuZ3RoIC0gMSBdLmxlbmd0aCA9PT0gMCApIHtcclxuICAgICAgbGluZXMucG9wKCk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gbGluZXMuam9pbiggJ1xcbicgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEdpdmVuIGEgdHlwZSBzdHJpbmcsIGUuZy4gJ3tudW1iZXJ9JywgdGhpcyBzaG91bGQgY29udmVydCBpdCBpbnRvIHRoZSBkZXNpcmVkIHR5cGUgZm9ybWF0LlxyXG4gICAqIEBwcml2YXRlXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge3N0cmluZ30gdHlwZVN0cmluZ1xyXG4gICAqIEByZXR1cm5zIHs/fVxyXG4gICAqL1xyXG4gIGZ1bmN0aW9uIHBhcnNlVHlwZSggdHlwZVN0cmluZyApIHtcclxuICAgIC8vIEZvciBub3csIGdldCByaWQgb2YgdGhlIGJyYWNrZXRzXHJcbiAgICB0eXBlU3RyaW5nID0gdHlwZVN0cmluZy5zbGljZSggMSwgdHlwZVN0cmluZy5sZW5ndGggLSAxICk7XHJcblxyXG4gICAgLy8gZm9yICggdmFyIGkgPSAwOyBpIDwgbGluZS5sZW5ndGg7IGkrKyApIHtcclxuICAgIC8vIFRPRE86IGhhbmRsZSB8LCB7fSwgZXRjLiBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvY2hpcHBlci9pc3N1ZXMvNDExXHJcbiAgICAvLyB9XHJcblxyXG4gICAgcmV0dXJuIHR5cGVTdHJpbmc7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBQYXJzZXMgdHlwZS1kb2N1bWVudGF0aW9uIGxpbmVzIHRoYXQgd291bGQgYmUgdXNlZCB3aXRoIGpzZG9jIHBhcmFtcywgZXRjLiwgc3VjaCBhczpcclxuICAgKiBAcHJpdmF0ZVxyXG4gICAqXHJcbiAgICogJ3tudW1iZXJ9IHJhdGlvIC0gVGhlIHJhdGlvIGZvciBzb21ldGhpbmcnIHBhcnNlcyB0byAod2l0aCBoYXNOYW1lID0gdHJ1ZSk6XHJcbiAgICoge1xyXG4gICAqICAgdHlwZTogJ251bWJlcicsIC8vIHJlc3VsdCBvZiBwYXJzZVR5cGUgb24gJ3tudW1iZXJ9J1xyXG4gICAqICAgbmFtZTogJ3JhdGlvJyxcclxuICAgKiAgIGRlc2NyaXB0aW9uOiAnVGhlIHJhdGlvIGZvciBzb21ldGhpbmcnXHJcbiAgICogfVxyXG4gICAqXHJcbiAgICogJ3tudW1iZXJ9IFRoZSByYXRpbyBmb3Igc29tZXRoaW5nJyBwYXJzZXMgdG8gKHdpdGggaGFzTmFtZSA9IGZhbHNlKTpcclxuICAgKiB7XHJcbiAgICogICB0eXBlOiAnbnVtYmVyJyxcclxuICAgKiAgIGRlc2NyaXB0aW9uOiAnVGhlIHJhdGlvIGZvciBzb21ldGhpbmcnXHJcbiAgICogfVxyXG4gICAqXHJcbiAgICogQHBhcmFtIHtzdHJpbmd9IGxpbmVcclxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IGhhc05hbWVcclxuICAgKiBAcmV0dXJucyB7T2JqZWN0fVxyXG4gICAqL1xyXG4gIGZ1bmN0aW9uIHNwbGl0VHlwZURvY0xpbmUoIGxpbmUsIGhhc05hbWUgKSB7XHJcbiAgICBsZXQgYnJhY2VDb3VudCA9IDA7XHJcbiAgICBmb3IgKCBsZXQgaSA9IDA7IGkgPCBsaW5lLmxlbmd0aDsgaSsrICkge1xyXG4gICAgICBpZiAoIGxpbmVbIGkgXSA9PT0gJ3snICkge1xyXG4gICAgICAgIGJyYWNlQ291bnQrKztcclxuICAgICAgfVxyXG4gICAgICBlbHNlIGlmICggbGluZVsgaSBdID09PSAnfScgKSB7XHJcbiAgICAgICAgYnJhY2VDb3VudC0tO1xyXG5cclxuICAgICAgICAvLyBJZiB3ZSBoYXZlIG1hdGNoZWQgdGhlIGZpcnN0IGJyYWNlLCBwYXJzZSB0aGUgdHlwZSwgY2hlY2sgZm9yIGEgbmFtZSwgYW5kIHJldHVybiB0aGUgcmVzdCBhcyBhIGRlc2NyaXB0aW9uLlxyXG4gICAgICAgIGlmICggYnJhY2VDb3VudCA9PT0gMCApIHtcclxuICAgICAgICAgIGNvbnN0IGVuZE9mVHlwZSA9IGkgKyAxO1xyXG4gICAgICAgICAgY29uc3QgdHlwZSA9IGxpbmUuc2xpY2UoIDAsIGVuZE9mVHlwZSApO1xyXG4gICAgICAgICAgY29uc3QgcmVzdCA9IGxpbmUuc2xpY2UoIGVuZE9mVHlwZSArIDEgKTtcclxuICAgICAgICAgIGxldCBuYW1lO1xyXG4gICAgICAgICAgbGV0IGRlc2NyaXB0aW9uO1xyXG4gICAgICAgICAgaWYgKCBoYXNOYW1lICkge1xyXG4gICAgICAgICAgICBjb25zdCBzcGFjZUluZGV4ID0gcmVzdC5pbmRleE9mKCAnICcgKTtcclxuICAgICAgICAgICAgaWYgKCBzcGFjZUluZGV4IDwgMCApIHtcclxuICAgICAgICAgICAgICAvLyBhbGwgbmFtZVxyXG4gICAgICAgICAgICAgIG5hbWUgPSByZXN0O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgIC8vIGhhcyBhIHNwYWNlXHJcbiAgICAgICAgICAgICAgbmFtZSA9IHJlc3Quc2xpY2UoIDAsIHNwYWNlSW5kZXggKTtcclxuICAgICAgICAgICAgICBkZXNjcmlwdGlvbiA9IHJlc3Quc2xpY2UoIHNwYWNlSW5kZXggKyAxICk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICBkZXNjcmlwdGlvbiA9IGxpbmUuc2xpY2UoIGVuZE9mVHlwZSArIDEgKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IHtcclxuICAgICAgICAgICAgdHlwZTogcGFyc2VUeXBlKCB0eXBlIClcclxuICAgICAgICAgIH07XHJcbiAgICAgICAgICBpZiAoIG5hbWUgKSB7XHJcbiAgICAgICAgICAgIGlmICggbmFtZS5jaGFyQXQoIDAgKSA9PT0gJ1snICkge1xyXG4gICAgICAgICAgICAgIHJlc3VsdC5vcHRpb25hbCA9IHRydWU7XHJcbiAgICAgICAgICAgICAgbmFtZSA9IG5hbWUuc2xpY2UoIDEsIG5hbWUubGVuZ3RoIC0gMSApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJlc3VsdC5uYW1lID0gbmFtZTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGlmICggZGVzY3JpcHRpb24gKSB7XHJcbiAgICAgICAgICAgIHJlc3VsdC5kZXNjcmlwdGlvbiA9IGRlc2NyaXB0aW9uLnJlcGxhY2UoIC9eICooLSApPy8sICcnICk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgdHlwZTogcGFyc2VUeXBlKCBsaW5lIClcclxuICAgIH07XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBQYXJzZXMgYSBkZS1zdGFycmVkIGJsb2NrIGNvbW1lbnQgKGRlc3RhckJsb2NrQ29tbWVudCBvdXRwdXQpLCBleHRyYWN0aW5nIEpTRG9jLXN0eWxlIHRhZ3MuIFRoZSByZXN0IGlzIGNhbGxlZCB0aGVcclxuICAgKiBkZXNjcmlwdGlvbiwgd2hpY2ggaGFzIGJsYW5rIGxpbmtlcyB0cmltbWVkLlxyXG4gICAqIEBwcml2YXRlXHJcbiAgICpcclxuICAgKiBJZiBhIGxpbmUgaGFzIGEgSlNEb2Mtc3R5bGUgdGFnLCBjb25zZWN1dGl2ZSBsaW5lcyBhZnRlcndhcmRzIHRoYXQgYXJlIGluZGVudGVkIHdpbGwgYmUgaW5jbHVkZWQgZm9yIHRoYXQgdGFnLlxyXG4gICAqXHJcbiAgICogUmV0dXJucyBvYmplY3QgbGlrZTpcclxuICAgKiB7XHJcbiAgICogICBkZXNjcmlwdGlvbjoge3N0cmluZ30sIC8vIGV2ZXJ5dGhpbmcgdGhhdCBpc24ndCBKU0RvYy1zdHlsZSB0YWdzXHJcbiAgICogICBbdmlzaWJpbGl0eV06IHtzdHJpbmd9LCAvLyBpZiBpdCBleGlzdHMsIG9uZSBvZiAncHVibGljJywgJ3ByaXZhdGUnIG9yICdpbnRlcm5hbCdcclxuICAgKiAgIFtwYXJhbWV0ZXJzXToge0FycmF5Ljx7IHR5cGU6IHs/fSwgbmFtZToge3N0cmluZ30sIGRlc2NyaXB0aW9uOiB7c3RyaW5nfSB9Pn0sIC8vIGFycmF5IG9mIHBhcnNlZCBwYXJhbWV0ZXJzXHJcbiAgICogICBbcmV0dXJuc106IHsgdHlwZTogez99LCBkZXNjcmlwdGlvbjoge3N0cmluZ30gfSwgLy8gcmV0dXJuIHRhZ1xyXG4gICAqICAgW2NvbnN0YW50XTogeyB0eXBlOiB7P30sIG5hbWU6IHtzdHJpbmd9LCBkZXNjcmlwdGlvbjoge3N0cmluZ30gfSwgLy8gY29uc3RhbnQgdGFnXHJcbiAgICogICBbY29uc3RydWN0b3JdOiB0cnVlLCAvLyBpZiB0aGUgY29uc3RydWN0b3IgdGFnIGlzIGluY2x1ZGVkXHJcbiAgICogICBbanNkb2NdOiB7QXJyYXkuPHN0cmluZz59IC8vIGFueSB1bnJlY29nbml6ZWQganNkb2MgdGFnIGxpbmVzXHJcbiAgICogfVxyXG4gICAqXHJcbiAgICogQHBhcmFtIHtzdHJpbmd9IHN0cmluZ1xyXG4gICAqIEByZXR1cm5zIHtPYmplY3R9XHJcbiAgICovXHJcbiAgZnVuY3Rpb24gcGFyc2VCbG9ja0RvYyggc3RyaW5nICkge1xyXG4gICAgbGV0IHJlc3VsdCA9IHt9O1xyXG5cclxuICAgIGNvbnN0IGRlc2NyaXB0aW9uTGluZXMgPSBbXTtcclxuICAgIGNvbnN0IGpzZG9jTGluZXMgPSBbXTtcclxuXHJcbiAgICBjb25zdCBsaW5lcyA9IHN0cmluZy5zcGxpdCggJ1xcbicgKTtcclxuICAgIGZvciAoIGxldCBpID0gMDsgaSA8IGxpbmVzLmxlbmd0aDsgaSsrICkge1xyXG4gICAgICBsZXQgbGluZSA9IGxpbmVzWyBpIF07XHJcbiAgICAgIGlmICggbGluZS5jaGFyQXQoIDAgKSA9PT0gJ0AnICkge1xyXG4gICAgICAgIGZvciAoIGxldCBqID0gaSArIDE7IGogPCBsaW5lcy5sZW5ndGg7IGorKyApIHtcclxuICAgICAgICAgIGNvbnN0IG5leHRMaW5lID0gbGluZXNbIGogXTtcclxuICAgICAgICAgIGlmICggbmV4dExpbmUuY2hhckF0KCAwICkgPT09ICcgJyApIHtcclxuICAgICAgICAgICAgLy8gc3RyaXAgb3V0IGFsbCBidXQgb25lIHNwYWNlLCBhbmQgY29uY2F0ZW5hdGVcclxuICAgICAgICAgICAgbGluZSA9IGxpbmUgKyBuZXh0TGluZS5yZXBsYWNlKCAvXiArLywgJyAnICk7XHJcblxyXG4gICAgICAgICAgICAvLyB3ZSBoYW5kbGVkIHRoZSBsaW5lXHJcbiAgICAgICAgICAgIGkrKztcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAganNkb2NMaW5lcy5wdXNoKCBsaW5lICk7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSB7XHJcbiAgICAgICAgZGVzY3JpcHRpb25MaW5lcy5wdXNoKCBsaW5lICk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXN1bHQgPSB7XHJcbiAgICAgIGRlc2NyaXB0aW9uOiB0cmltTGluZXMoIGRlc2NyaXB0aW9uTGluZXMuam9pbiggJ1xcbicgKSApXHJcbiAgICB9O1xyXG5cclxuICAgIGZvciAoIGxldCBrID0ganNkb2NMaW5lcy5sZW5ndGggLSAxOyBrID49IDA7IGstLSApIHtcclxuICAgICAgY29uc3QganNkb2NMaW5lID0ganNkb2NMaW5lc1sgayBdO1xyXG4gICAgICBpZiAoIGpzZG9jTGluZS5pbmRleE9mKCAnQHB1YmxpYycgKSA9PT0gMCApIHtcclxuICAgICAgICBpZiAoIGpzZG9jTGluZS5pbmRleE9mKCAnaW50ZXJuYWwnICkgPT09IDAgKSB7XHJcbiAgICAgICAgICByZXN1bHQudmlzaWJpbGl0eSA9ICdpbnRlcm5hbCc7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgcmVzdWx0LnZpc2liaWxpdHkgPSAncHVibGljJztcclxuICAgICAgICB9XHJcbiAgICAgICAganNkb2NMaW5lcy5zcGxpY2UoIGssIDEgKTtcclxuICAgICAgfVxyXG4gICAgICBlbHNlIGlmICgganNkb2NMaW5lLmluZGV4T2YoICdAcHJpdmF0ZScgKSA9PT0gMCApIHtcclxuICAgICAgICByZXN1bHQudmlzaWJpbGl0eSA9ICdwcml2YXRlJztcclxuICAgICAgICBqc2RvY0xpbmVzLnNwbGljZSggaywgMSApO1xyXG4gICAgICB9XHJcbiAgICAgIGVsc2UgaWYgKCBqc2RvY0xpbmUuaW5kZXhPZiggJ0BwYXJhbSAnICkgPT09IDAgKSB7XHJcbiAgICAgICAgcmVzdWx0LnBhcmFtZXRlcnMgPSByZXN1bHQucGFyYW1ldGVycyB8fCBbXTtcclxuICAgICAgICByZXN1bHQucGFyYW1ldGVycy51bnNoaWZ0KCBzcGxpdFR5cGVEb2NMaW5lKCBqc2RvY0xpbmUuc2xpY2UoICdAcGFyYW0gJy5sZW5ndGggKSwgdHJ1ZSApICk7XHJcbiAgICAgICAganNkb2NMaW5lcy5zcGxpY2UoIGssIDEgKTtcclxuICAgICAgfVxyXG4gICAgICBlbHNlIGlmICgganNkb2NMaW5lLmluZGV4T2YoICdAcmV0dXJucyAnICkgPT09IDAgKSB7XHJcbiAgICAgICAgcmVzdWx0LnJldHVybnMgPSBzcGxpdFR5cGVEb2NMaW5lKCBqc2RvY0xpbmUuc2xpY2UoICdAcmV0dXJucyAnLmxlbmd0aCApLCBmYWxzZSApO1xyXG4gICAgICAgIGpzZG9jTGluZXMuc3BsaWNlKCBrLCAxICk7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSBpZiAoIGpzZG9jTGluZS5pbmRleE9mKCAnQGNvbnN0YW50ICcgKSA9PT0gMCApIHtcclxuICAgICAgICByZXN1bHQuY29uc3RhbnQgPSBzcGxpdFR5cGVEb2NMaW5lKCBqc2RvY0xpbmUuc2xpY2UoICdAY29uc3RhbnQgJy5sZW5ndGggKSwgdHJ1ZSApO1xyXG4gICAgICAgIGpzZG9jTGluZXMuc3BsaWNlKCBrLCAxICk7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSBpZiAoIGpzZG9jTGluZS5pbmRleE9mKCAnQGNvbnN0cnVjdG9yJyApID09PSAwICkge1xyXG4gICAgICAgIHJlc3VsdC5jb25zdHJ1Y3RvciA9IHRydWU7XHJcbiAgICAgICAganNkb2NMaW5lcy5zcGxpY2UoIGssIDEgKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGlmICgganNkb2NMaW5lcy5sZW5ndGggKSB7XHJcbiAgICAgIHJlc3VsdC5qc2RvYyA9IGpzZG9jTGluZXM7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHJlc3VsdDtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNpbWlsYXIgdG8gcGFyc2VCbG9ja0RvYywgYnV0IGZvciBsaW5lIGNvbW1lbnRzLiBSZXR1cm5zIG51bGwgZm9yIGNvbW1lbnRzIHdpdGhvdXQgdmlzaWJpbGl0eS5cclxuICAgKiBAcHJpdmF0ZVxyXG4gICAqXHJcbiAgICogQSBmZXcgbGluZSBzdHlsZXMgdGhhdCBhcmUgc3VwcG9ydGVkOlxyXG4gICAqXHJcbiAgICogJXB1YmxpYyB7bnVtYmVyfSAtIFNvbWUgY29tbWVudFxyXG4gICAqIFdpbGwgcGFyc2UgdG86IHsgdmlzaWJpbGl0eTogJ3B1YmxpYycsIHR5cGU6ICdudW1iZXInLCBkZXNjcmlwdGlvbjogJ1NvbWUgY29tbWVudCcgfVxyXG4gICAqXHJcbiAgICogJXB1YmxpYyAoZG90LWludGVybmFsKSBUaGlzIGhhcyBubyB0eXBlIG9yIGRhc2hcclxuICAgKiBXaWxsIHBhcnNlIHRvOiB7IHZpc2liaWxpdHk6ICdpbnRlcm5hbCcsIGRlc2NyaXB0aW9uOiAnVGhpcyBoYXMgbm8gdHlwZSBvciBkYXNoJyB9XHJcbiAgICpcclxuICAgKiBAcGFyYW0ge3N0cmluZ30gc3RyaW5nXHJcbiAgICogQHJldHVybnMge09iamVjdH1cclxuICAgKi9cclxuICBmdW5jdGlvbiBwYXJzZUxpbmVEb2MoIHN0cmluZyApIHtcclxuICAgIGxldCB2aXNpYmlsaXR5O1xyXG5cclxuICAgIC8vIFN0cmlwIHZpc2liaWxpdHkgdGFncywgcmVjb3JkaW5nIHRoZSB2aXNpYmlsaXR5XHJcbiAgICBpZiAoIHN0cmluZy5pbmRleE9mKCAnQHB1YmxpYycgKSA+PSAwICkge1xyXG4gICAgICBpZiAoIHN0cmluZy5pbmRleE9mKCAnLWludGVybmFsKScgKSA+PSAwICkge1xyXG4gICAgICAgIHZpc2liaWxpdHkgPSAnaW50ZXJuYWwnO1xyXG4gICAgICAgIHN0cmluZyA9IHN0cmluZy5yZXBsYWNlKCAnL0BwdWJsaWMuKi1pbnRlcm5hbCknLCAnJyApO1xyXG4gICAgICB9XHJcbiAgICAgIGVsc2Uge1xyXG4gICAgICAgIHZpc2liaWxpdHkgPSAncHVibGljJztcclxuICAgICAgICBzdHJpbmcgPSBzdHJpbmcucmVwbGFjZSggJ0BwdWJsaWMnLCAnJyApO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICBpZiAoIHN0cmluZy5pbmRleE9mKCAnQHByaXZhdGUnICkgPj0gMCApIHtcclxuICAgICAgdmlzaWJpbGl0eSA9ICdwcml2YXRlJztcclxuICAgICAgc3RyaW5nID0gc3RyaW5nLnJlcGxhY2UoICdAcHJpdmF0ZScsICcnICk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gU3RyaXAgbGVhZGluZyBzcGFjZXNcclxuICAgIHN0cmluZyA9IHN0cmluZy5yZXBsYWNlKCAvXiArLywgJycgKTtcclxuXHJcbiAgICAvLyBJZ25vcmUgdGhpbmdzIHdpdGhvdXQgdmlzaWJpbGl0eVxyXG4gICAgaWYgKCAhdmlzaWJpbGl0eSApIHtcclxuICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gQXNzdW1lIGxlYWRpbmcgJ3snIGlzIGZvciBhIHR5cGVcclxuICAgIGlmICggL14gKnsvLnRlc3QoIHN0cmluZyApICkge1xyXG4gICAgICBjb25zdCByZXN1bHQgPSBzcGxpdFR5cGVEb2NMaW5lKCBzdHJpbmcsIGZhbHNlICk7XHJcbiAgICAgIHJlc3VsdC52aXNpYmlsaXR5ID0gdmlzaWJpbGl0eTtcclxuICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICB2aXNpYmlsaXR5OiB2aXNpYmlsaXR5LFxyXG4gICAgICBkZXNjcmlwdGlvbjogc3RyaW5nLnJlcGxhY2UoIC9eICovLCAnJyApLnJlcGxhY2UoIC8gKiQvLCAnJyApXHJcbiAgICB9O1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogRXh0cmFjdHMgYSBkb2N1bWVudGF0aW9uIG9iamVjdCAocGFyc2VMaW5lRG9jL3BhcnNlQmxvY2tEb2MpIGZyb20gYW4gRXNwcmltYSBBU1Qgbm9kZS4gVHlwaWNhbGx5IGxvb2tzIGF0IHRoZSBsYXN0XHJcbiAgICogbGVhZGluZyBibG9jayBjb21tZW50IGlmIGF2YWlsYWJsZSwgdGhlbiB0aGUgbGFzdCBsZWFkaW5nIHB1YmxpYyBsaW5lIGNvbW1lbnQuXHJcbiAgICogQHByaXZhdGVcclxuICAgKlxyXG4gICAqIFJldHVybnMgbnVsbCBpZiB0aGVyZSBpcyBubyBzdWl0YWJsZSBkb2N1bWVudGF0aW9uLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIHtPYmplY3R9IG5vZGUgLSBGcm9tIHRoZSBFc3ByaW1hIEFTVFxyXG4gICAqIEByZXR1cm5zIHtPYmplY3R9IFNlZSBwYXJzZUxpbmVEb2MvcGFyc2VCbG9ja0RvYyBmb3IgdHlwZSBpbmZvcm1hdGlvbi5cclxuICAgKi9cclxuICBmdW5jdGlvbiBleHRyYWN0RG9jRnJvbU5vZGUoIG5vZGUgKSB7XHJcbiAgICBmdW5jdGlvbiBibG9ja0NvbW1lbnRGaWx0ZXIoIGNvbW1lbnQgKSB7XHJcbiAgICAgIHJldHVybiBjb21tZW50LnR5cGUgPT09ICdCbG9jaycgJiYgY29tbWVudC52YWx1ZS5jaGFyQXQoIDAgKSA9PT0gJyonO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGxpbmVDb21tZW50RmlsdGVyKCBjb21tZW50ICkge1xyXG4gICAgICByZXR1cm4gY29tbWVudC50eXBlID09PSAnTGluZScgJiYgY29tbWVudC52YWx1ZS5pbmRleE9mKCAnQHB1YmxpYycgKSA+PSAwO1xyXG4gICAgfVxyXG5cclxuICAgIGxldCBsaW5lQ29tbWVudHMgPSBbXTtcclxuICAgIGlmICggbm9kZS5sZWFkaW5nQ29tbWVudHMgKSB7XHJcbiAgICAgIGNvbnN0IGJsb2NrQ29tbWVudHMgPSBub2RlLmxlYWRpbmdDb21tZW50cy5maWx0ZXIoIGJsb2NrQ29tbWVudEZpbHRlciApO1xyXG4gICAgICBpZiAoIGJsb2NrQ29tbWVudHMubGVuZ3RoICkge1xyXG4gICAgICAgIHJldHVybiBwYXJzZUJsb2NrRG9jKCBkZXN0YXJCbG9ja0NvbW1lbnQoIGJsb2NrQ29tbWVudHNbIGJsb2NrQ29tbWVudHMubGVuZ3RoIC0gMSBdLnZhbHVlICkgKTtcclxuICAgICAgfVxyXG4gICAgICBlbHNlIHtcclxuICAgICAgICBsaW5lQ29tbWVudHMgPSBsaW5lQ29tbWVudHMuY29uY2F0KCBub2RlLmxlYWRpbmdDb21tZW50cy5maWx0ZXIoIGxpbmVDb21tZW50RmlsdGVyICkgKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgLy8gTk9URTogdHJhaWxpbmcgY29tbWVudHMgd2VyZSBhbHNvIHJlY29nbml6ZWQgYXMgbGVhZGluZyBjb21tZW50cyBmb3IgY29uc2VjdXRpdmUgdGhpcy48cHJvcD4gZGVmaW5pdGlvbnMuXHJcbiAgICAvLyBTdHJpcHBlZCBvdXQgZm9yIG5vdy5cclxuICAgIC8vIGlmICggbm9kZS50cmFpbGluZ0NvbW1lbnRzICkge1xyXG4gICAgLy8gICBsaW5lQ29tbWVudHMgPSBsaW5lQ29tbWVudHMuY29uY2F0KCBub2RlLnRyYWlsaW5nQ29tbWVudHMuZmlsdGVyKCBsaW5lQ29tbWVudEZpbHRlciApICk7XHJcbiAgICAvLyB9XHJcbiAgICBpZiAoIGxpbmVDb21tZW50cy5sZW5ndGggKSB7XHJcbiAgICAgIGNvbnN0IGNvbW1lbnQgPSBsaW5lQ29tbWVudHNbIGxpbmVDb21tZW50cy5sZW5ndGggLSAxIF07XHJcbiAgICAgIHJldHVybiBwYXJzZUxpbmVEb2MoIGNvbW1lbnQudmFsdWUucmVwbGFjZSggL14gLywgJycgKSApOyAvLyBzdHJpcCBvZmYgYSBzaW5nbGUgbGVhZGluZyBzcGFjZVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBudWxsO1xyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24gaXNDYXBpdGFsaXplZCggc3RyaW5nICkge1xyXG4gICAgcmV0dXJuIHN0cmluZy5jaGFyQXQoIDAgKSA9PT0gc3RyaW5nLmNoYXJBdCggMCApLnRvVXBwZXJDYXNlKCk7XHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiBjYXBpdGFsaXplKCBzdHJpbmcgKSB7XHJcbiAgICByZXR1cm4gc3RyaW5nLmNoYXJBdCggMCApLnRvVXBwZXJDYXNlKCkgKyBzdHJpbmcuc2xpY2UoIDEgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFdoZXRoZXIgYW4gZXNwcmltYS1wYXJzZWQgQVNUIHJlcHJlc2VudHMgYW4gYXNzaWdtZW50IHRvIGFuIGlkZW50aWZpZXIgb24gJ3RoaXMnLCBlLmcuOlxyXG4gICAqIHRoaXMuc29tZXRoaW5nID0gLi4uO1xyXG4gICAqIEBwcml2YXRlXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge09iamVjdH0gZXhwclxyXG4gICAqIEByZXR1cm5zIHtib29sZWFufVxyXG4gICAqL1xyXG4gIGZ1bmN0aW9uIGlzU2ltcGxlVGhpc0Fzc2lnbm1lbnQoIGV4cHIgKSB7XHJcbiAgICByZXR1cm4gZXhwci50eXBlID09PSAnQXNzaWdubWVudEV4cHJlc3Npb24nICYmXHJcbiAgICAgICAgICAgZXhwci5sZWZ0LnR5cGUgPT09ICdNZW1iZXJFeHByZXNzaW9uJyAmJlxyXG4gICAgICAgICAgIGV4cHIubGVmdC5vYmplY3QudHlwZSA9PT0gJ1RoaXNFeHByZXNzaW9uJyAmJlxyXG4gICAgICAgICAgIGV4cHIubGVmdC5wcm9wZXJ0eS50eXBlID09PSAnSWRlbnRpZmllcic7XHJcbiAgfVxyXG5cclxuICAvLyBlLmcuIGNvbnNvbGUubG9nKCBKU09OLnN0cmluZ2lmeSggZXh0cmFjdERvY3VtZW50YXRpb24oIHByb2dyYW0gKSwgbnVsbCwgMiApICk7XHJcbiAgZnVuY3Rpb24gZXh0cmFjdERvY3VtZW50YXRpb24oIHByb2dyYW0gKSB7XHJcbiAgICBjb25zdCBkb2MgPSB7fTtcclxuXHJcbiAgICBmdW5jdGlvbiBwYXJzZVR5cGVFeHByZXNzaW9uKCB0eXBlU3RhdGVtZW50LCB0eXBlRXhwcmVzc2lvbiwgbmFtZSwgcGFyZW50TmFtZSApIHtcclxuICAgICAgY29uc3QgdHlwZURvYyA9IHtcclxuICAgICAgICBjb21tZW50OiBleHRyYWN0RG9jRnJvbU5vZGUoIHR5cGVTdGF0ZW1lbnQgKSxcclxuICAgICAgICBpbnN0YW5jZVByb3BlcnRpZXM6IFtdLFxyXG4gICAgICAgIHN0YXRpY1Byb3BlcnRpZXM6IFtdLFxyXG4gICAgICAgIGNvbnN0cnVjdG9yUHJvcGVydGllczogW10sXHJcbiAgICAgICAgc3VwZXJ0eXBlOiBudWxsLCAvLyBmaWxsZWQgaW4gYnkgaW5oZXJpdFxyXG4gICAgICAgIHR5cGU6ICd0eXBlJyxcclxuICAgICAgICBuYW1lOiBuYW1lXHJcbiAgICAgIH07XHJcblxyXG4gICAgICBpZiAoIHBhcmVudE5hbWUgKSB7XHJcbiAgICAgICAgdHlwZURvYy5wYXJlbnROYW1lID0gcGFyZW50TmFtZTtcclxuICAgICAgfVxyXG5cclxuICAgICAgY29uc3QgY29uc3RydWN0b3JTdGF0ZW1lbnRzID0gdHlwZUV4cHJlc3Npb24uYm9keS5ib2R5OyAvLyBzdGF0ZW1lbnRzIGluIHRoZSBjb25zdHJ1Y3RvciBmdW5jdGlvbiBib2R5XHJcbiAgICAgIGNvbnN0cnVjdG9yU3RhdGVtZW50cy5mb3JFYWNoKCBjb25zdHJ1Y3RvclN0YXRlbWVudCA9PiB7XHJcbiAgICAgICAgaWYgKCBjb25zdHJ1Y3RvclN0YXRlbWVudC50eXBlID09PSAnRXhwcmVzc2lvblN0YXRlbWVudCcgKSB7XHJcbiAgICAgICAgICBpZiAoIGlzU2ltcGxlVGhpc0Fzc2lnbm1lbnQoIGNvbnN0cnVjdG9yU3RhdGVtZW50LmV4cHJlc3Npb24gKSApIHtcclxuICAgICAgICAgICAgY29uc3QgY29tbWVudCA9IGV4dHJhY3REb2NGcm9tTm9kZSggY29uc3RydWN0b3JTdGF0ZW1lbnQgKTtcclxuICAgICAgICAgICAgaWYgKCBjb21tZW50ICkge1xyXG4gICAgICAgICAgICAgIGNvbW1lbnQubmFtZSA9IGNvbnN0cnVjdG9yU3RhdGVtZW50LmV4cHJlc3Npb24ubGVmdC5wcm9wZXJ0eS5uYW1lO1xyXG4gICAgICAgICAgICAgIHR5cGVEb2MuY29uc3RydWN0b3JQcm9wZXJ0aWVzLnB1c2goIGNvbW1lbnQgKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfSApO1xyXG5cclxuICAgICAgcmV0dXJuIHR5cGVEb2M7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gcGFyc2VTdGF0aWNQcm9wZXJ0eSggcHJvcGVydHkgKSB7XHJcbiAgICAgIGNvbnN0IGtleSA9IHByb3BlcnR5LmtleS5uYW1lO1xyXG5cclxuICAgICAgLy8gVE9ETzogc3VwcG9ydCBzdGF0aWMgY29uc3RhbnRzPyBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvY2hpcHBlci9pc3N1ZXMvNDExXHJcbiAgICAgIGlmICggcHJvcGVydHkudmFsdWUudHlwZSA9PT0gJ0Z1bmN0aW9uRXhwcmVzc2lvbicgKSB7XHJcbiAgICAgICAgY29uc3Qgc3RhdGljRG9jID0gZXh0cmFjdERvY0Zyb21Ob2RlKCBwcm9wZXJ0eSApO1xyXG5cclxuICAgICAgICBpZiAoIHN0YXRpY0RvYyApIHtcclxuICAgICAgICAgIHN0YXRpY0RvYy50eXBlID0gJ2Z1bmN0aW9uJztcclxuICAgICAgICAgIHN0YXRpY0RvYy5uYW1lID0ga2V5O1xyXG4gICAgICAgICAgcmV0dXJuIHN0YXRpY0RvYztcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBAcGFyYW0gZXhwcmVzc2lvblxyXG4gICAgICogQHJldHVybnMge251bGx8T2JqZWN0fVxyXG4gICAgICovXHJcbiAgICBmdW5jdGlvbiBwYXJzZUluaGVyaXQoIGV4cHJlc3Npb24gKSB7XHJcbiAgICAgIGNvbnN0IHN1cGVydHlwZSA9IGV4cHJlc3Npb24uYXJndW1lbnRzWyAwIF0ubmFtZTtcclxuICAgICAgY29uc3Qgc3VidHlwZSA9IGV4cHJlc3Npb24uYXJndW1lbnRzWyAxIF0ubmFtZTtcclxuXHJcbiAgICAgIC8vIElmIHdlIGhhdmVuJ3QgY2F1Z2h0IHRoZSBjb25zdHJ1Y3Rvci90eXBlIGRlY2xhcmF0aW9uLCBza2lwIHRoZSBpbmhlcml0IHBhcnNpbmdcclxuICAgICAgaWYgKCAhZG9jWyBzdWJ0eXBlIF0gKSB7XHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIEFzc2lnbiB0aGUgc3VwZXJ0eXBlIG9uIHRoZSBzdWJ0eXBlXHJcbiAgICAgIGRvY1sgc3VidHlwZSBdLnN1cGVydHlwZSA9IHN1cGVydHlwZTtcclxuXHJcbiAgICAgIC8vIEluc3RhbmNlIChwcm90b3R5cGUpIHByb3BlcnRpZXNcclxuICAgICAgaWYgKCBleHByZXNzaW9uLmFyZ3VtZW50cy5sZW5ndGggPj0gMyApIHtcclxuICAgICAgICBjb25zdCBpbnN0YW5jZVByb3BlcnRpZXMgPSBleHByZXNzaW9uLmFyZ3VtZW50c1sgMiBdLnByb3BlcnRpZXM7XHJcblxyXG4gICAgICAgIC8vIEZvci1pdGVyYXRpb24sIHNvIHdlIGNhbiBza2lwIHNvbWUgaXRlbXMgYnkgaW5jcmVtZW50aW5nIGkuXHJcbiAgICAgICAgZm9yICggbGV0IGkgPSAwOyBpIDwgaW5zdGFuY2VQcm9wZXJ0aWVzLmxlbmd0aDsgaSsrICkge1xyXG4gICAgICAgICAgY29uc3QgcHJvcGVydHkgPSBpbnN0YW5jZVByb3BlcnRpZXNbIGkgXTtcclxuICAgICAgICAgIGNvbnN0IGtleSA9IHByb3BlcnR5LmtleS5uYW1lO1xyXG4gICAgICAgICAgaWYgKCBwcm9wZXJ0eS52YWx1ZS50eXBlID09PSAnRnVuY3Rpb25FeHByZXNzaW9uJyApIHtcclxuICAgICAgICAgICAgaWYgKCBkb2NbIHN1YnR5cGUgXSApIHtcclxuICAgICAgICAgICAgICBjb25zdCBpbnN0YW5jZURvYyA9IGV4dHJhY3REb2NGcm9tTm9kZSggcHJvcGVydHkgKTtcclxuXHJcbiAgICAgICAgICAgICAgaWYgKCBpbnN0YW5jZURvYyApIHtcclxuICAgICAgICAgICAgICAgIC8vIENoZWNrIHRvIHNlZSBpZiB3ZSBoYXZlIGFuIEVTNSBnZXR0ZXIvc2V0dGVyIGRlZmluZWQgYmVsb3dcclxuICAgICAgICAgICAgICAgIGlmICggaSArIDEgPCBpbnN0YW5jZVByb3BlcnRpZXMubGVuZ3RoICkge1xyXG4gICAgICAgICAgICAgICAgICBjb25zdCBuZXh0UHJvcGVydHkgPSBpbnN0YW5jZVByb3BlcnRpZXNbIGkgKyAxIF07XHJcbiAgICAgICAgICAgICAgICAgIGNvbnN0IG5leHRFeHByZXNzaW9uID0gbmV4dFByb3BlcnR5LnZhbHVlO1xyXG4gICAgICAgICAgICAgICAgICBpZiAoIG5leHRFeHByZXNzaW9uLnR5cGUgPT09ICdGdW5jdGlvbkV4cHJlc3Npb24nICkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG5leHRLZXkgPSBuZXh0UHJvcGVydHkua2V5Lm5hbWU7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY2FwaXRhbGl6ZWROZXh0TmFtZSA9IGNhcGl0YWxpemUoIG5leHRLZXkgKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIG5leHRQcm9wZXJ0eS5raW5kID09PSAnZ2V0JyAmJlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgKCBgZ2V0JHtjYXBpdGFsaXplZE5leHROYW1lfWAgPT09IGtleSApIHx8XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAoIGBpcyR7Y2FwaXRhbGl6ZWROZXh0TmFtZX1gID09PSBrZXkgKSApIHtcclxuICAgICAgICAgICAgICAgICAgICAgIC8vIFNraXAgcHJvY2Vzc2luZyB0aGUgRVM1IGdldHRlciBuZXh0XHJcbiAgICAgICAgICAgICAgICAgICAgICBpKys7XHJcbiAgICAgICAgICAgICAgICAgICAgICBpbnN0YW5jZURvYy5uYW1lID0gbmV4dEtleTtcclxuICAgICAgICAgICAgICAgICAgICAgIGluc3RhbmNlRG9jLmV4cGxpY2l0R2V0TmFtZSA9IGtleTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoIG5leHRQcm9wZXJ0eS5raW5kID09PSAnc2V0JyAmJlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBgc2V0JHtjYXBpdGFsaXplZE5leHROYW1lfWAgPT09IGtleSApIHtcclxuICAgICAgICAgICAgICAgICAgICAgIC8vIFNraXAgcHJvY2Vzc2luZyB0aGUgRVM1IHNldHRlciBuZXh0XHJcbiAgICAgICAgICAgICAgICAgICAgICBpKys7XHJcbiAgICAgICAgICAgICAgICAgICAgICBpbnN0YW5jZURvYy5uYW1lID0gbmV4dEtleTtcclxuICAgICAgICAgICAgICAgICAgICAgIGluc3RhbmNlRG9jLmV4cGxpY2l0U2V0TmFtZSA9IGtleTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGluc3RhbmNlRG9jLnR5cGUgPSAnZnVuY3Rpb24nO1xyXG4gICAgICAgICAgICAgICAgaW5zdGFuY2VEb2MubmFtZSA9IGluc3RhbmNlRG9jLm5hbWUgfHwga2V5O1xyXG4gICAgICAgICAgICAgICAgZG9jWyBzdWJ0eXBlIF0uaW5zdGFuY2VQcm9wZXJ0aWVzLnB1c2goIGluc3RhbmNlRG9jICk7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBTdGF0aWMgKGNvbnN0cnVjdG9yKSBwcm9wZXJ0aWVzXHJcbiAgICAgIGlmICggZXhwcmVzc2lvbi5hcmd1bWVudHMubGVuZ3RoID49IDQgKSB7XHJcbiAgICAgICAgY29uc3Qgc3RhdGljUHJvcGVydGllcyA9IGV4cHJlc3Npb24uYXJndW1lbnRzWyAzIF0ucHJvcGVydGllcztcclxuXHJcbiAgICAgICAgc3RhdGljUHJvcGVydGllcy5mb3JFYWNoKCBwcm9wZXJ0eSA9PiB7XHJcbiAgICAgICAgICBjb25zdCBzdGF0aWNEb2MgPSBwYXJzZVN0YXRpY1Byb3BlcnR5KCBwcm9wZXJ0eSApO1xyXG4gICAgICAgICAgaWYgKCBkb2NbIHN1YnR5cGUgXSAmJiBzdGF0aWNEb2MgKSB7XHJcbiAgICAgICAgICAgIGRvY1sgc3VidHlwZSBdLnN0YXRpY1Byb3BlcnRpZXMucHVzaCggc3RhdGljRG9jICk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSApO1xyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gZG9jWyBzdWJ0eXBlIF07XHJcbiAgICB9XHJcblxyXG4gICAgLy8gRGlnIGludG8gcmVxdWlyZSBzdHJ1Y3R1cmVcclxuICAgIGNvbnN0IG1haW5TdGF0ZW1lbnRzID0gcHJvZ3JhbS5ib2R5WyAwIF0uZXhwcmVzc2lvbi5hcmd1bWVudHNbIDAgXS5ib2R5LmJvZHk7XHJcblxyXG4gICAgZG9jLnRvcExldmVsQ29tbWVudCA9IGV4dHJhY3REb2NGcm9tTm9kZSggcHJvZ3JhbS5ib2R5WyAwIF0gKTtcclxuXHJcbiAgICBmb3IgKCBsZXQgaSA9IDA7IGkgPCBtYWluU3RhdGVtZW50cy5sZW5ndGg7IGkrKyApIHtcclxuICAgICAgY29uc3QgdG9wTGV2ZWxTdGF0ZW1lbnQgPSBtYWluU3RhdGVtZW50c1sgaSBdO1xyXG5cclxuICAgICAgLy8gVG9wLWxldmVsIGNhcGl0YWxpemVkIGZ1bmN0aW9uIGRlY2xhcmF0aW9uPyBQYXJzZSBpdCBhcyBhIFR5cGVcclxuICAgICAgaWYgKCB0b3BMZXZlbFN0YXRlbWVudC50eXBlID09PSAnRnVuY3Rpb25EZWNsYXJhdGlvbicgJiZcclxuICAgICAgICAgICBpc0NhcGl0YWxpemVkKCB0b3BMZXZlbFN0YXRlbWVudC5pZC5uYW1lICkgKSB7XHJcbiAgICAgICAgY29uc3QgdHlwZU5hbWUgPSB0b3BMZXZlbFN0YXRlbWVudC5pZC5uYW1lO1xyXG4gICAgICAgIGRvY1sgdHlwZU5hbWUgXSA9IHBhcnNlVHlwZUV4cHJlc3Npb24oIHRvcExldmVsU3RhdGVtZW50LCB0b3BMZXZlbFN0YXRlbWVudCwgdHlwZU5hbWUsIG51bGwgKTtcclxuICAgICAgfVxyXG4gICAgICBlbHNlIGlmICggdG9wTGV2ZWxTdGF0ZW1lbnQudHlwZSA9PT0gJ0V4cHJlc3Npb25TdGF0ZW1lbnQnICkge1xyXG4gICAgICAgIGNvbnN0IGV4cHJlc3Npb24gPSB0b3BMZXZlbFN0YXRlbWVudC5leHByZXNzaW9uO1xyXG5cclxuICAgICAgICAvLyBDYWxsIHRvIGluaGVyaXQoKVxyXG4gICAgICAgIGlmICggZXhwcmVzc2lvbi50eXBlID09PSAnQ2FsbEV4cHJlc3Npb24nICYmIGV4cHJlc3Npb24uY2FsbGVlLm5hbWUgPT09ICdpbmhlcml0JyApIHtcclxuICAgICAgICAgIHBhcnNlSW5oZXJpdCggZXhwcmVzc2lvbiApO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmICggZXhwcmVzc2lvbi50eXBlID09PSAnQXNzaWdubWVudEV4cHJlc3Npb24nICYmXHJcbiAgICAgICAgICAgICAgICAgIGV4cHJlc3Npb24ubGVmdC50eXBlID09PSAnTWVtYmVyRXhwcmVzc2lvbicgKSB7XHJcbiAgICAgICAgICBjb25zdCBjb21tZW50ID0gZXh0cmFjdERvY0Zyb21Ob2RlKCB0b3BMZXZlbFN0YXRlbWVudCApO1xyXG4gICAgICAgICAgaWYgKCBjb21tZW50ICYmXHJcbiAgICAgICAgICAgICAgIGV4cHJlc3Npb24ubGVmdC5vYmplY3QudHlwZSA9PT0gJ0lkZW50aWZpZXInICYmXHJcbiAgICAgICAgICAgICAgIGV4cHJlc3Npb24ubGVmdC5wcm9wZXJ0eS50eXBlID09PSAnSWRlbnRpZmllcicgJiZcclxuICAgICAgICAgICAgICAgZG9jWyBleHByZXNzaW9uLmxlZnQub2JqZWN0Lm5hbWUgXSApIHtcclxuICAgICAgICAgICAgY29uc3QgaW5uZXJOYW1lID0gZXhwcmVzc2lvbi5sZWZ0LnByb3BlcnR5Lm5hbWU7XHJcbiAgICAgICAgICAgIGxldCB0eXBlO1xyXG5cclxuICAgICAgICAgICAgLy8gSW5uZXIgVHlwZSwgZS5nLiBCaW5QYWNrZXIuQmluID0gZnVuY3Rpb24gQmluKCAuLi4gKSB7IC4uLiB9O1xyXG4gICAgICAgICAgICBpZiAoIGV4cHJlc3Npb24ucmlnaHQudHlwZSA9PT0gJ0Z1bmN0aW9uRXhwcmVzc2lvbicgJiZcclxuICAgICAgICAgICAgICAgICBpc0NhcGl0YWxpemVkKCBpbm5lck5hbWUgKSApIHtcclxuICAgICAgICAgICAgICBkb2NbIGlubmVyTmFtZSBdID0gcGFyc2VUeXBlRXhwcmVzc2lvbiggdG9wTGV2ZWxTdGF0ZW1lbnQsIGV4cHJlc3Npb24ucmlnaHQsIGlubmVyTmFtZSwgZXhwcmVzc2lvbi5sZWZ0Lm9iamVjdC5uYW1lICk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgLy8gT3RoZXIsIGUuZy4gVmVjdG9yMi5aRVJPID0gLi4uO1xyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICBpZiAoIGV4cHJlc3Npb24ucmlnaHQudHlwZSA9PT0gJ0Z1bmN0aW9uRXhwcmVzc2lvbicgKSB7XHJcbiAgICAgICAgICAgICAgICB0eXBlID0gJ2Z1bmN0aW9uJztcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB0eXBlID0gJ2NvbnN0YW50JztcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgY29tbWVudC50eXBlID0gdHlwZTtcclxuICAgICAgICAgICAgICBjb21tZW50Lm5hbWUgPSBleHByZXNzaW9uLmxlZnQucHJvcGVydHkubmFtZTtcclxuICAgICAgICAgICAgICBkb2NbIGV4cHJlc3Npb24ubGVmdC5vYmplY3QubmFtZSBdLnN0YXRpY1Byb3BlcnRpZXMucHVzaCggY29tbWVudCApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICAgIC8vIFZhcmlhYmxlIG9iamVjdCBpbml0aWFsaXphdGlvbjogZS5nLiB2YXIgVXRpbHMgPSB7IC4uLiB9O1xyXG4gICAgICBlbHNlIGlmICggdG9wTGV2ZWxTdGF0ZW1lbnQudHlwZSA9PT0gJ1ZhcmlhYmxlRGVjbGFyYXRpb24nICYmXHJcbiAgICAgICAgICAgICAgICB0b3BMZXZlbFN0YXRlbWVudC5kZWNsYXJhdGlvbnNbIDAgXS50eXBlID09PSAnVmFyaWFibGVEZWNsYXJhdG9yJyAmJlxyXG4gICAgICAgICAgICAgICAgdG9wTGV2ZWxTdGF0ZW1lbnQuZGVjbGFyYXRpb25zWyAwIF0uaW5pdCAmJlxyXG4gICAgICAgICAgICAgICAgdG9wTGV2ZWxTdGF0ZW1lbnQuZGVjbGFyYXRpb25zWyAwIF0uaW5pdC50eXBlID09PSAnT2JqZWN0RXhwcmVzc2lvbicgJiZcclxuICAgICAgICAgICAgICAgIGlzQ2FwaXRhbGl6ZWQoIHRvcExldmVsU3RhdGVtZW50LmRlY2xhcmF0aW9uc1sgMCBdLmlkLm5hbWUgKSApIHtcclxuICAgICAgICBjb25zdCBvYmplY3ROYW1lID0gdG9wTGV2ZWxTdGF0ZW1lbnQuZGVjbGFyYXRpb25zWyAwIF0uaWQubmFtZTtcclxuICAgICAgICBkb2NbIG9iamVjdE5hbWUgXSA9IHtcclxuICAgICAgICAgIGNvbW1lbnQ6IGV4dHJhY3REb2NGcm9tTm9kZSggdG9wTGV2ZWxTdGF0ZW1lbnQgKSwgLy8gbWF5YmUgbm90IG5lZWRlZD9cclxuICAgICAgICAgIHByb3BlcnRpZXM6IFtdLFxyXG4gICAgICAgICAgdHlwZTogJ29iamVjdCcsXHJcbiAgICAgICAgICBuYW1lOiBvYmplY3ROYW1lXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgLy8gUHJvY2VzcyBwcm9wZXJ0aWVzIGluIHRoZSBvYmplY3RcclxuICAgICAgICB0b3BMZXZlbFN0YXRlbWVudC5kZWNsYXJhdGlvbnNbIDAgXS5pbml0LnByb3BlcnRpZXMuZm9yRWFjaCggcHJvcGVydHkgPT4ge1xyXG4gICAgICAgICAgY29uc3Qgc3RhdGljRG9jID0gcGFyc2VTdGF0aWNQcm9wZXJ0eSggcHJvcGVydHkgKTtcclxuICAgICAgICAgIGlmICggc3RhdGljRG9jICkge1xyXG4gICAgICAgICAgICBkb2NbIG9iamVjdE5hbWUgXS5wcm9wZXJ0aWVzLnB1c2goIHN0YXRpY0RvYyApO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0gKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIGRvYztcclxuICB9XHJcblxyXG4gIC8vIE5vZGUuanMtY29tcGF0aWJsZSBkZWZpbml0aW9uXHJcbiAgaWYgKCB0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyApIHtcclxuICAgIG1vZHVsZS5leHBvcnRzID0gZXh0cmFjdERvY3VtZW50YXRpb247XHJcbiAgfVxyXG5cclxuICAvLyBCcm93c2VyIGRpcmVjdCBkZWZpbml0aW9uIChmb3IgdGVzdGluZylcclxuICBpZiAoIHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnICkge1xyXG4gICAgd2luZG93LmV4dHJhY3REb2N1bWVudGF0aW9uID0gZXh0cmFjdERvY3VtZW50YXRpb247XHJcbiAgfVxyXG59ICkoKTsiXSwibWFwcGluZ3MiOiI7O0FBQUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBOztBQUdBLENBQUUsWUFBVztFQUVYO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7RUFDRSxTQUFTQSxrQkFBa0JBLENBQUVDLE1BQU0sRUFBRztJQUNwQyxPQUFPQSxNQUFNLENBQUNDLEtBQUssQ0FBRSxJQUFLLENBQUMsQ0FBQ0MsR0FBRyxDQUFFLFVBQUFDLElBQUksRUFBSTtNQUN2QyxJQUFJQyxTQUFTLEdBQUdELElBQUksQ0FBQ0UsT0FBTyxDQUFFLFNBQVMsRUFBRSxFQUFHLENBQUM7O01BRTdDO01BQ0EsSUFBS0QsU0FBUyxDQUFDQyxPQUFPLENBQUUsSUFBSSxFQUFFLEVBQUcsQ0FBQyxDQUFDQyxNQUFNLEtBQUssQ0FBQyxFQUFHO1FBQ2hERixTQUFTLEdBQUcsRUFBRTtNQUNoQjtNQUNBLE9BQU9BLFNBQVM7SUFDbEIsQ0FBRSxDQUFDLENBQUNHLElBQUksQ0FBRSxJQUFLLENBQUM7RUFDbEI7O0VBRUE7QUFDRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0VBQ0UsU0FBU0MsU0FBU0EsQ0FBRVIsTUFBTSxFQUFHO0lBQzNCLElBQU1TLEtBQUssR0FBR1QsTUFBTSxDQUFDQyxLQUFL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