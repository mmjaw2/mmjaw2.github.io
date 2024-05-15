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
    return string.split('\n').map(line => {
      let destarred = line.replace(/^ *\* ?/, '');

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
    const lines = string.split('\n');

    // remove consecutive blank lines
    for (let i = lines.length - 1; i >= 1; i--) {
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
    let braceCount = 0;
    for (let i = 0; i < line.length; i++) {
      if (line[i] === '{') {
        braceCount++;
      } else if (line[i] === '}') {
        braceCount--;

        // If we have matched the first brace, parse the type, check for a name, and return the rest as a description.
        if (braceCount === 0) {
          const endOfType = i + 1;
          const type = line.slice(0, endOfType);
          const rest = line.slice(endOfType + 1);
          let name;
          let description;
          if (hasName) {
            const spaceIndex = rest.indexOf(' ');
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
          const result = {
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
    let result = {};
    const descriptionLines = [];
    const jsdocLines = [];
    const lines = string.split('\n');
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      if (line.charAt(0) === '@') {
        for (let j = i + 1; j < lines.length; j++) {
          const nextLine = lines[j];
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
    for (let k = jsdocLines.length - 1; k >= 0; k--) {
      const jsdocLine = jsdocLines[k];
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
    let visibility;

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
      const result = splitTypeDocLine(string, false);
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
    let lineComments = [];
    if (node.leadingComments) {
      const blockComments = node.leadingComments.filter(blockCommentFilter);
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
      const comment = lineComments[lineComments.length - 1];
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
    const doc = {};
    function parseTypeExpression(typeStatement, typeExpression, name, parentName) {
      const typeDoc = {
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
      const constructorStatements = typeExpression.body.body; // statements in the constructor function body
      constructorStatements.forEach(constructorStatement => {
        if (constructorStatement.type === 'ExpressionStatement') {
          if (isSimpleThisAssignment(constructorStatement.expression)) {
            const comment = extractDocFromNode(constructorStatement);
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
      const key = property.key.name;

      // TODO: support static constants? https://github.com/phetsims/chipper/issues/411
      if (property.value.type === 'FunctionExpression') {
        const staticDoc = extractDocFromNode(property);
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
      const supertype = expression.arguments[0].name;
      const subtype = expression.arguments[1].name;

      // If we haven't caught the constructor/type declaration, skip the inherit parsing
      if (!doc[subtype]) {
        return null;
      }

      // Assign the supertype on the subtype
      doc[subtype].supertype = supertype;

      // Instance (prototype) properties
      if (expression.arguments.length >= 3) {
        const instanceProperties = expression.arguments[2].properties;

        // For-iteration, so we can skip some items by incrementing i.
        for (let i = 0; i < instanceProperties.length; i++) {
          const property = instanceProperties[i];
          const key = property.key.name;
          if (property.value.type === 'FunctionExpression') {
            if (doc[subtype]) {
              const instanceDoc = extractDocFromNode(property);
              if (instanceDoc) {
                // Check to see if we have an ES5 getter/setter defined below
                if (i + 1 < instanceProperties.length) {
                  const nextProperty = instanceProperties[i + 1];
                  const nextExpression = nextProperty.value;
                  if (nextExpression.type === 'FunctionExpression') {
                    const nextKey = nextProperty.key.name;
                    const capitalizedNextName = capitalize(nextKey);
                    if (nextProperty.kind === 'get' && `get${capitalizedNextName}` === key || `is${capitalizedNextName}` === key) {
                      // Skip processing the ES5 getter next
                      i++;
                      instanceDoc.name = nextKey;
                      instanceDoc.explicitGetName = key;
                    } else if (nextProperty.kind === 'set' && `set${capitalizedNextName}` === key) {
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
        const staticProperties = expression.arguments[3].properties;
        staticProperties.forEach(property => {
          const staticDoc = parseStaticProperty(property);
          if (doc[subtype] && staticDoc) {
            doc[subtype].staticProperties.push(staticDoc);
          }
        });
      }
      return doc[subtype];
    }

    // Dig into require structure
    const mainStatements = program.body[0].expression.arguments[0].body.body;
    doc.topLevelComment = extractDocFromNode(program.body[0]);
    for (let i = 0; i < mainStatements.length; i++) {
      const topLevelStatement = mainStatements[i];

      // Top-level capitalized function declaration? Parse it as a Type
      if (topLevelStatement.type === 'FunctionDeclaration' && isCapitalized(topLevelStatement.id.name)) {
        const typeName = topLevelStatement.id.name;
        doc[typeName] = parseTypeExpression(topLevelStatement, topLevelStatement, typeName, null);
      } else if (topLevelStatement.type === 'ExpressionStatement') {
        const expression = topLevelStatement.expression;

        // Call to inherit()
        if (expression.type === 'CallExpression' && expression.callee.name === 'inherit') {
          parseInherit(expression);
        } else if (expression.type === 'AssignmentExpression' && expression.left.type === 'MemberExpression') {
          const comment = extractDocFromNode(topLevelStatement);
          if (comment && expression.left.object.type === 'Identifier' && expression.left.property.type === 'Identifier' && doc[expression.left.object.name]) {
            const innerName = expression.left.property.name;
            let type;

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
        const objectName = topLevelStatement.declarations[0].id.name;
        doc[objectName] = {
          comment: extractDocFromNode(topLevelStatement),
          // maybe not needed?
          properties: [],
          type: 'object',
          name: objectName
        };

        // Process properties in the object
        topLevelStatement.declarations[0].init.properties.forEach(property => {
          const staticDoc = parseStaticProperty(property);
          if (staticDoc) {
            doc[objectName].properties.push(staticDoc);
          }
        });
      }
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJkZXN0YXJCbG9ja0NvbW1lbnQiLCJzdHJpbmciLCJzcGxpdCIsIm1hcCIsImxpbmUiLCJkZXN0YXJyZWQiLCJyZXBsYWNlIiwibGVuZ3RoIiwiam9pbiIsInRyaW1MaW5lcyIsImxpbmVzIiwiaSIsInNwbGljZSIsInNoaWZ0IiwicG9wIiwicGFyc2VUeXBlIiwidHlwZVN0cmluZyIsInNsaWNlIiwic3BsaXRUeXBlRG9jTGluZSIsImhhc05hbWUiLCJicmFjZUNvdW50IiwiZW5kT2ZUeXBlIiwidHlwZSIsInJlc3QiLCJuYW1lIiwiZGVzY3JpcHRpb24iLCJzcGFjZUluZGV4IiwiaW5kZXhPZiIsInJlc3VsdCIsImNoYXJBdCIsIm9wdGlvbmFsIiwicGFyc2VCbG9ja0RvYyIsImRlc2NyaXB0aW9uTGluZXMiLCJqc2RvY0xpbmVzIiwiaiIsIm5leHRMaW5lIiwicHVzaCIsImsiLCJqc2RvY0xpbmUiLCJ2aXNpYmlsaXR5IiwicGFyYW1ldGVycyIsInVuc2hpZnQiLCJyZXR1cm5zIiwiY29uc3RhbnQiLCJjb25zdHJ1Y3RvciIsImpzZG9jIiwicGFyc2VMaW5lRG9jIiwidGVzdCIsImV4dHJhY3REb2NGcm9tTm9kZSIsIm5vZGUiLCJibG9ja0NvbW1lbnRGaWx0ZXIiLCJjb21tZW50IiwidmFsdWUiLCJsaW5lQ29tbWVudEZpbHRlciIsImxpbmVDb21tZW50cyIsImxlYWRpbmdDb21tZW50cyIsImJsb2NrQ29tbWVudHMiLCJmaWx0ZXIiLCJjb25jYXQiLCJpc0NhcGl0YWxpemVkIiwidG9VcHBlckNhc2UiLCJjYXBpdGFsaXplIiwiaXNTaW1wbGVUaGlzQXNzaWdubWVudCIsImV4cHIiLCJsZWZ0Iiwib2JqZWN0IiwicHJvcGVydHkiLCJleHRyYWN0RG9jdW1lbnRhdGlvbiIsInByb2dyYW0iLCJkb2MiLCJwYXJzZVR5cGVFeHByZXNzaW9uIiwidHlwZVN0YXRlbWVudCIsInR5cGVFeHByZXNzaW9uIiwicGFyZW50TmFtZSIsInR5cGVEb2MiLCJpbnN0YW5jZVByb3BlcnRpZXMiLCJzdGF0aWNQcm9wZXJ0aWVzIiwiY29uc3RydWN0b3JQcm9wZXJ0aWVzIiwic3VwZXJ0eXBlIiwiY29uc3RydWN0b3JTdGF0ZW1lbnRzIiwiYm9keSIsImZvckVhY2giLCJjb25zdHJ1Y3RvclN0YXRlbWVudCIsImV4cHJlc3Npb24iLCJwYXJzZVN0YXRpY1Byb3BlcnR5Iiwia2V5Iiwic3RhdGljRG9jIiwicGFyc2VJbmhlcml0IiwiYXJndW1lbnRzIiwic3VidHlwZSIsInByb3BlcnRpZXMiLCJpbnN0YW5jZURvYyIsIm5leHRQcm9wZXJ0eSIsIm5leHRFeHByZXNzaW9uIiwibmV4dEtleSIsImNhcGl0YWxpemVkTmV4dE5hbWUiLCJraW5kIiwiZXhwbGljaXRHZXROYW1lIiwiZXhwbGljaXRTZXROYW1lIiwibWFpblN0YXRlbWVudHMiLCJ0b3BMZXZlbENvbW1lbnQiLCJ0b3BMZXZlbFN0YXRlbWVudCIsImlkIiwidHlwZU5hbWUiLCJjYWxsZWUiLCJpbm5lck5hbWUiLCJyaWdodCIsImRlY2xhcmF0aW9ucyIsImluaXQiLCJvYmplY3ROYW1lIiwibW9kdWxlIiwiZXhwb3J0cyIsIndpbmRvdyJdLCJzb3VyY2VzIjpbImV4dHJhY3REb2N1bWVudGF0aW9uLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE1LTIwMjQsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuLyoqXHJcbiAqIEdpdmVuIHRoZSBBU1Qgb3V0cHV0IGZyb20gRXNwcmltYSBmb3IgYSBKUyBmaWxlIHRoYXQgY29uZm9ybXMgdG8gUGhFVCdzIHN0eWxlLCB0aGlzIGV4dHJhY3RzIHRoZSBkb2N1bWVudGF0aW9uIGFuZFxyXG4gKiByZXR1cm5zIGEgc3RydWN0dXJlZCBvYmplY3QgY29udGFpbmluZyBhbGwgb2YgdGhlIGRvY3VtZW50YXRpb24uXHJcbiAqXHJcbiAqIEBhdXRob3IgSm9uYXRoYW4gT2xzb24gPGpvbmF0aGFuLm9sc29uQGNvbG9yYWRvLmVkdT5cclxuICovXHJcblxyXG4vKiBlc2xpbnQtZW52IGJyb3dzZXIsIG5vZGUgKi9cclxuXHJcblxyXG4oIGZ1bmN0aW9uKCkge1xyXG5cclxuICAvKipcclxuICAgKiBHaXZlbiBlc3ByaW1hJ3MgYmxvY2sgY29tbWVudCBzdHJpbmcgdmFsdWUsIHN0cmlwIG9mZiB0aGUgbGVhZGluZyBzcGFjZXMsIGEgc3RhciwgYW5kIHVwIHRvIG9uZSBvdGhlciBzcGFjZS5cclxuICAgKiBAcHJpdmF0ZVxyXG4gICAqXHJcbiAgICogVGh1cyBnaXZlbiBpbnB1dDpcclxuICAgKiB2YXIgc3RyaW5nID0gJypcXG4nICsgLy8gbGVhZGluZyBzdGFyIGZyb20gdGhlIEpTRG9jIHN0eWxlXHJcbiAgICogICAgICAgICAgICAgICcgICAqIFNvbWUgY29kZTpcXG4nICtcclxuICAgKiAgICAgICAgICAgICAgJyAgICogZnVuY3Rpb24gc29tZXRoaW5nKCkge1xcbicgK1xyXG4gICAqICAgICAgICAgICAgICAnICAgKiAgIGNvbnNvbGUubG9nKCBib28gKTtcXG4nICtcclxuICAgKiAgICAgICAgICAgICAgJyAgICogfVxcbicgK1xyXG4gICAqICAgICAgICAgICAgICAnICAgJztcclxuICAgKlxyXG4gICAqIHdpbGwgaGF2ZSB0aGUgb3V0cHV0OlxyXG4gICAqIHZhciBvdXRwdXQgPSAnXFxuJyArXHJcbiAgICogICAgICAgICAgICAgICdTb21lIGNvZGU6XFxuJyArXHJcbiAgICogICAgICAgICAgICAgICdmdW5jdGlvbiBzb21ldGhpbmcoKSB7XFxuJyArXHJcbiAgICogICAgICAgICAgICAgICcgIGNvbnNvbGUubG9nKCBib28gKTtcXG4nICsgLy8ga2VlcHMgcmVtYWluaW5nIHNwYWNlcyBmb3IgaW5kZW50YXRpb25cclxuICAgKiAgICAgICAgICAgICAgJ31cXG4nICtcclxuICAgKiAgICAgICAgICAgICAgJycgK1xyXG4gICAqXHJcbiAgICogQHBhcmFtIHtzdHJpbmd9IHN0cmluZ1xyXG4gICAqIEByZXR1cm5zIHtzdHJpbmd9XHJcbiAgICovXHJcbiAgZnVuY3Rpb24gZGVzdGFyQmxvY2tDb21tZW50KCBzdHJpbmcgKSB7XHJcbiAgICByZXR1cm4gc3RyaW5nLnNwbGl0KCAnXFxuJyApLm1hcCggbGluZSA9PiB7XHJcbiAgICAgIGxldCBkZXN0YXJyZWQgPSBsaW5lLnJlcGxhY2UoIC9eICpcXCogPy8sICcnICk7XHJcblxyXG4gICAgICAvLyBJZiB0aGUgbGluZSBpcyBlZmZlY3RpdmVseSBlbXB0eSAoY29tcG9zZWQgb2Ygb25seSBzcGFjZXMpLCBzZXQgaXQgdG8gdGhlIGVtcHR5IHN0cmluZy5cclxuICAgICAgaWYgKCBkZXN0YXJyZWQucmVwbGFjZSggLyAvZywgJycgKS5sZW5ndGggPT09IDAgKSB7XHJcbiAgICAgICAgZGVzdGFycmVkID0gJyc7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIGRlc3RhcnJlZDtcclxuICAgIH0gKS5qb2luKCAnXFxuJyApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmVtb3ZlcyBsZWFkaW5nL3RyYWlsaW5nIGJsYW5rIGxpbmVzLCBhbmQgY29uc29saWRhdGVzIGNvbnNlY3V0aXZlIGJsYW5rIGxpbmVzIGludG8gb25lIGJsYW5rIGxpbmUuXHJcbiAgICogQHByaXZhdGVcclxuICAgKlxyXG4gICAqIFRodXMgZm9yIGlucHV0OiAnXFxuRm9vXFxuXFxuQmFyXFxuJywgdGhlIG91dHB1dCB3b3VsZCBiZSAnRm9vXFxuQmFyJ1xyXG4gICAqXHJcbiAgICogQHBhcmFtIHtzdHJpbmd9IHN0cmluZ1xyXG4gICAqIEByZXR1cm5zIHtzdHJpbmd9XHJcbiAgICovXHJcbiAgZnVuY3Rpb24gdHJpbUxpbmVzKCBzdHJpbmcgKSB7XHJcbiAgICBjb25zdCBsaW5lcyA9IHN0cmluZy5zcGxpdCggJ1xcbicgKTtcclxuXHJcbiAgICAvLyByZW1vdmUgY29uc2VjdXRpdmUgYmxhbmsgbGluZXNcclxuICAgIGZvciAoIGxldCBpID0gbGluZXMubGVuZ3RoIC0gMTsgaSA+PSAxOyBpLS0gKSB7XHJcbiAgICAgIGlmICggbGluZXNbIGkgXS5sZW5ndGggPT09IDAgJiYgbGluZXNbIGkgLSAxIF0ubGVuZ3RoID09PSAwICkge1xyXG4gICAgICAgIGxpbmVzLnNwbGljZSggaSwgMSApO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy8gcmVtb3ZlIGxlYWRpbmcgYmxhbmsgbGluZXNcclxuICAgIHdoaWxlICggbGluZXMubGVuZ3RoICYmIGxpbmVzWyAwIF0ubGVuZ3RoID09PSAwICkge1xyXG4gICAgICBsaW5lcy5zaGlmdCgpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIHJlbW92ZSB0cmFpbGluZyBibGFuayBsaW5lc1xyXG4gICAgd2hpbGUgKCBsaW5lcy5sZW5ndGggJiYgbGluZXNbIGxpbmVzLmxlbmd0aCAtIDEgXS5sZW5ndGggPT09IDAgKSB7XHJcbiAgICAgIGxpbmVzLnBvcCgpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIGxpbmVzLmpvaW4oICdcXG4nICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBHaXZlbiBhIHR5cGUgc3RyaW5nLCBlLmcuICd7bnVtYmVyfScsIHRoaXMgc2hvdWxkIGNvbnZlcnQgaXQgaW50byB0aGUgZGVzaXJlZCB0eXBlIGZvcm1hdC5cclxuICAgKiBAcHJpdmF0ZVxyXG4gICAqXHJcbiAgICogQHBhcmFtIHtzdHJpbmd9IHR5cGVTdHJpbmdcclxuICAgKiBAcmV0dXJucyB7P31cclxuICAgKi9cclxuICBmdW5jdGlvbiBwYXJzZVR5cGUoIHR5cGVTdHJpbmcgKSB7XHJcbiAgICAvLyBGb3Igbm93LCBnZXQgcmlkIG9mIHRoZSBicmFja2V0c1xyXG4gICAgdHlwZVN0cmluZyA9IHR5cGVTdHJpbmcuc2xpY2UoIDEsIHR5cGVTdHJpbmcubGVuZ3RoIC0gMSApO1xyXG5cclxuICAgIC8vIGZvciAoIHZhciBpID0gMDsgaSA8IGxpbmUubGVuZ3RoOyBpKysgKSB7XHJcbiAgICAvLyBUT0RPOiBoYW5kbGUgfCwge30sIGV0Yy4gaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL2NoaXBwZXIvaXNzdWVzLzQxMVxyXG4gICAgLy8gfVxyXG5cclxuICAgIHJldHVybiB0eXBlU3RyaW5nO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUGFyc2VzIHR5cGUtZG9jdW1lbnRhdGlvbiBsaW5lcyB0aGF0IHdvdWxkIGJlIHVzZWQgd2l0aCBqc2RvYyBwYXJhbXMsIGV0Yy4sIHN1Y2ggYXM6XHJcbiAgICogQHByaXZhdGVcclxuICAgKlxyXG4gICAqICd7bnVtYmVyfSByYXRpbyAtIFRoZSByYXRpbyBmb3Igc29tZXRoaW5nJyBwYXJzZXMgdG8gKHdpdGggaGFzTmFtZSA9IHRydWUpOlxyXG4gICAqIHtcclxuICAgKiAgIHR5cGU6ICdudW1iZXInLCAvLyByZXN1bHQgb2YgcGFyc2VUeXBlIG9uICd7bnVtYmVyfSdcclxuICAgKiAgIG5hbWU6ICdyYXRpbycsXHJcbiAgICogICBkZXNjcmlwdGlvbjogJ1RoZSByYXRpbyBmb3Igc29tZXRoaW5nJ1xyXG4gICAqIH1cclxuICAgKlxyXG4gICAqICd7bnVtYmVyfSBUaGUgcmF0aW8gZm9yIHNvbWV0aGluZycgcGFyc2VzIHRvICh3aXRoIGhhc05hbWUgPSBmYWxzZSk6XHJcbiAgICoge1xyXG4gICAqICAgdHlwZTogJ251bWJlcicsXHJcbiAgICogICBkZXNjcmlwdGlvbjogJ1RoZSByYXRpbyBmb3Igc29tZXRoaW5nJ1xyXG4gICAqIH1cclxuICAgKlxyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBsaW5lXHJcbiAgICogQHBhcmFtIHtib29sZWFufSBoYXNOYW1lXHJcbiAgICogQHJldHVybnMge09iamVjdH1cclxuICAgKi9cclxuICBmdW5jdGlvbiBzcGxpdFR5cGVEb2NMaW5lKCBsaW5lLCBoYXNOYW1lICkge1xyXG4gICAgbGV0IGJyYWNlQ291bnQgPSAwO1xyXG4gICAgZm9yICggbGV0IGkgPSAwOyBpIDwgbGluZS5sZW5ndGg7IGkrKyApIHtcclxuICAgICAgaWYgKCBsaW5lWyBpIF0gPT09ICd7JyApIHtcclxuICAgICAgICBicmFjZUNvdW50Kys7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSBpZiAoIGxpbmVbIGkgXSA9PT0gJ30nICkge1xyXG4gICAgICAgIGJyYWNlQ291bnQtLTtcclxuXHJcbiAgICAgICAgLy8gSWYgd2UgaGF2ZSBtYXRjaGVkIHRoZSBmaXJzdCBicmFjZSwgcGFyc2UgdGhlIHR5cGUsIGNoZWNrIGZvciBhIG5hbWUsIGFuZCByZXR1cm4gdGhlIHJlc3QgYXMgYSBkZXNjcmlwdGlvbi5cclxuICAgICAgICBpZiAoIGJyYWNlQ291bnQgPT09IDAgKSB7XHJcbiAgICAgICAgICBjb25zdCBlbmRPZlR5cGUgPSBpICsgMTtcclxuICAgICAgICAgIGNvbnN0IHR5cGUgPSBsaW5lLnNsaWNlKCAwLCBlbmRPZlR5cGUgKTtcclxuICAgICAgICAgIGNvbnN0IHJlc3QgPSBsaW5lLnNsaWNlKCBlbmRPZlR5cGUgKyAxICk7XHJcbiAgICAgICAgICBsZXQgbmFtZTtcclxuICAgICAgICAgIGxldCBkZXNjcmlwdGlvbjtcclxuICAgICAgICAgIGlmICggaGFzTmFtZSApIHtcclxuICAgICAgICAgICAgY29uc3Qgc3BhY2VJbmRleCA9IHJlc3QuaW5kZXhPZiggJyAnICk7XHJcbiAgICAgICAgICAgIGlmICggc3BhY2VJbmRleCA8IDAgKSB7XHJcbiAgICAgICAgICAgICAgLy8gYWxsIG5hbWVcclxuICAgICAgICAgICAgICBuYW1lID0gcmVzdDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAvLyBoYXMgYSBzcGFjZVxyXG4gICAgICAgICAgICAgIG5hbWUgPSByZXN0LnNsaWNlKCAwLCBzcGFjZUluZGV4ICk7XHJcbiAgICAgICAgICAgICAgZGVzY3JpcHRpb24gPSByZXN0LnNsaWNlKCBzcGFjZUluZGV4ICsgMSApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgZGVzY3JpcHRpb24gPSBsaW5lLnNsaWNlKCBlbmRPZlR5cGUgKyAxICk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBjb25zdCByZXN1bHQgPSB7XHJcbiAgICAgICAgICAgIHR5cGU6IHBhcnNlVHlwZSggdHlwZSApXHJcbiAgICAgICAgICB9O1xyXG4gICAgICAgICAgaWYgKCBuYW1lICkge1xyXG4gICAgICAgICAgICBpZiAoIG5hbWUuY2hhckF0KCAwICkgPT09ICdbJyApIHtcclxuICAgICAgICAgICAgICByZXN1bHQub3B0aW9uYWwgPSB0cnVlO1xyXG4gICAgICAgICAgICAgIG5hbWUgPSBuYW1lLnNsaWNlKCAxLCBuYW1lLmxlbmd0aCAtIDEgKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXN1bHQubmFtZSA9IG5hbWU7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBpZiAoIGRlc2NyaXB0aW9uICkge1xyXG4gICAgICAgICAgICByZXN1bHQuZGVzY3JpcHRpb24gPSBkZXNjcmlwdGlvbi5yZXBsYWNlKCAvXiAqKC0gKT8vLCAnJyApO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiB7XHJcbiAgICAgIHR5cGU6IHBhcnNlVHlwZSggbGluZSApXHJcbiAgICB9O1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUGFyc2VzIGEgZGUtc3RhcnJlZCBibG9jayBjb21tZW50IChkZXN0YXJCbG9ja0NvbW1lbnQgb3V0cHV0KSwgZXh0cmFjdGluZyBKU0RvYy1zdHlsZSB0YWdzLiBUaGUgcmVzdCBpcyBjYWxsZWQgdGhlXHJcbiAgICogZGVzY3JpcHRpb24sIHdoaWNoIGhhcyBibGFuayBsaW5rZXMgdHJpbW1lZC5cclxuICAgKiBAcHJpdmF0ZVxyXG4gICAqXHJcbiAgICogSWYgYSBsaW5lIGhhcyBhIEpTRG9jLXN0eWxlIHRhZywgY29uc2VjdXRpdmUgbGluZXMgYWZ0ZXJ3YXJkcyB0aGF0IGFyZSBpbmRlbnRlZCB3aWxsIGJlIGluY2x1ZGVkIGZvciB0aGF0IHRhZy5cclxuICAgKlxyXG4gICAqIFJldHVybnMgb2JqZWN0IGxpa2U6XHJcbiAgICoge1xyXG4gICAqICAgZGVzY3JpcHRpb246IHtzdHJpbmd9LCAvLyBldmVyeXRoaW5nIHRoYXQgaXNuJ3QgSlNEb2Mtc3R5bGUgdGFnc1xyXG4gICAqICAgW3Zpc2liaWxpdHldOiB7c3RyaW5nfSwgLy8gaWYgaXQgZXhpc3RzLCBvbmUgb2YgJ3B1YmxpYycsICdwcml2YXRlJyBvciAnaW50ZXJuYWwnXHJcbiAgICogICBbcGFyYW1ldGVyc106IHtBcnJheS48eyB0eXBlOiB7P30sIG5hbWU6IHtzdHJpbmd9LCBkZXNjcmlwdGlvbjoge3N0cmluZ30gfT59LCAvLyBhcnJheSBvZiBwYXJzZWQgcGFyYW1ldGVyc1xyXG4gICAqICAgW3JldHVybnNdOiB7IHR5cGU6IHs/fSwgZGVzY3JpcHRpb246IHtzdHJpbmd9IH0sIC8vIHJldHVybiB0YWdcclxuICAgKiAgIFtjb25zdGFudF06IHsgdHlwZTogez99LCBuYW1lOiB7c3RyaW5nfSwgZGVzY3JpcHRpb246IHtzdHJpbmd9IH0sIC8vIGNvbnN0YW50IHRhZ1xyXG4gICAqICAgW2NvbnN0cnVjdG9yXTogdHJ1ZSwgLy8gaWYgdGhlIGNvbnN0cnVjdG9yIHRhZyBpcyBpbmNsdWRlZFxyXG4gICAqICAgW2pzZG9jXToge0FycmF5LjxzdHJpbmc+fSAvLyBhbnkgdW5yZWNvZ25pemVkIGpzZG9jIHRhZyBsaW5lc1xyXG4gICAqIH1cclxuICAgKlxyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBzdHJpbmdcclxuICAgKiBAcmV0dXJucyB7T2JqZWN0fVxyXG4gICAqL1xyXG4gIGZ1bmN0aW9uIHBhcnNlQmxvY2tEb2MoIHN0cmluZyApIHtcclxuICAgIGxldCByZXN1bHQgPSB7fTtcclxuXHJcbiAgICBjb25zdCBkZXNjcmlwdGlvbkxpbmVzID0gW107XHJcbiAgICBjb25zdCBqc2RvY0xpbmVzID0gW107XHJcblxyXG4gICAgY29uc3QgbGluZXMgPSBzdHJpbmcuc3BsaXQoICdcXG4nICk7XHJcbiAgICBmb3IgKCBsZXQgaSA9IDA7IGkgPCBsaW5lcy5sZW5ndGg7IGkrKyApIHtcclxuICAgICAgbGV0IGxpbmUgPSBsaW5lc1sgaSBdO1xyXG4gICAgICBpZiAoIGxpbmUuY2hhckF0KCAwICkgPT09ICdAJyApIHtcclxuICAgICAgICBmb3IgKCBsZXQgaiA9IGkgKyAxOyBqIDwgbGluZXMubGVuZ3RoOyBqKysgKSB7XHJcbiAgICAgICAgICBjb25zdCBuZXh0TGluZSA9IGxpbmVzWyBqIF07XHJcbiAgICAgICAgICBpZiAoIG5leHRMaW5lLmNoYXJBdCggMCApID09PSAnICcgKSB7XHJcbiAgICAgICAgICAgIC8vIHN0cmlwIG91dCBhbGwgYnV0IG9uZSBzcGFjZSwgYW5kIGNvbmNhdGVuYXRlXHJcbiAgICAgICAgICAgIGxpbmUgPSBsaW5lICsgbmV4dExpbmUucmVwbGFjZSggL14gKy8sICcgJyApO1xyXG5cclxuICAgICAgICAgICAgLy8gd2UgaGFuZGxlZCB0aGUgbGluZVxyXG4gICAgICAgICAgICBpKys7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGpzZG9jTGluZXMucHVzaCggbGluZSApO1xyXG4gICAgICB9XHJcbiAgICAgIGVsc2Uge1xyXG4gICAgICAgIGRlc2NyaXB0aW9uTGluZXMucHVzaCggbGluZSApO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmVzdWx0ID0ge1xyXG4gICAgICBkZXNjcmlwdGlvbjogdHJpbUxpbmVzKCBkZXNjcmlwdGlvbkxpbmVzLmpvaW4oICdcXG4nICkgKVxyXG4gICAgfTtcclxuXHJcbiAgICBmb3IgKCBsZXQgayA9IGpzZG9jTGluZXMubGVuZ3RoIC0gMTsgayA+PSAwOyBrLS0gKSB7XHJcbiAgICAgIGNvbnN0IGpzZG9jTGluZSA9IGpzZG9jTGluZXNbIGsgXTtcclxuICAgICAgaWYgKCBqc2RvY0xpbmUuaW5kZXhPZiggJ0BwdWJsaWMnICkgPT09IDAgKSB7XHJcbiAgICAgICAgaWYgKCBqc2RvY0xpbmUuaW5kZXhPZiggJ2ludGVybmFsJyApID09PSAwICkge1xyXG4gICAgICAgICAgcmVzdWx0LnZpc2liaWxpdHkgPSAnaW50ZXJuYWwnO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgIHJlc3VsdC52aXNpYmlsaXR5ID0gJ3B1YmxpYyc7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGpzZG9jTGluZXMuc3BsaWNlKCBrLCAxICk7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSBpZiAoIGpzZG9jTGluZS5pbmRleE9mKCAnQHByaXZhdGUnICkgPT09IDAgKSB7XHJcbiAgICAgICAgcmVzdWx0LnZpc2liaWxpdHkgPSAncHJpdmF0ZSc7XHJcbiAgICAgICAganNkb2NMaW5lcy5zcGxpY2UoIGssIDEgKTtcclxuICAgICAgfVxyXG4gICAgICBlbHNlIGlmICgganNkb2NMaW5lLmluZGV4T2YoICdAcGFyYW0gJyApID09PSAwICkge1xyXG4gICAgICAgIHJlc3VsdC5wYXJhbWV0ZXJzID0gcmVzdWx0LnBhcmFtZXRlcnMgfHwgW107XHJcbiAgICAgICAgcmVzdWx0LnBhcmFtZXRlcnMudW5zaGlmdCggc3BsaXRUeXBlRG9jTGluZSgganNkb2NMaW5lLnNsaWNlKCAnQHBhcmFtICcubGVuZ3RoICksIHRydWUgKSApO1xyXG4gICAgICAgIGpzZG9jTGluZXMuc3BsaWNlKCBrLCAxICk7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSBpZiAoIGpzZG9jTGluZS5pbmRleE9mKCAnQHJldHVybnMgJyApID09PSAwICkge1xyXG4gICAgICAgIHJlc3VsdC5yZXR1cm5zID0gc3BsaXRUeXBlRG9jTGluZSgganNkb2NMaW5lLnNsaWNlKCAnQHJldHVybnMgJy5sZW5ndGggKSwgZmFsc2UgKTtcclxuICAgICAgICBqc2RvY0xpbmVzLnNwbGljZSggaywgMSApO1xyXG4gICAgICB9XHJcbiAgICAgIGVsc2UgaWYgKCBqc2RvY0xpbmUuaW5kZXhPZiggJ0Bjb25zdGFudCAnICkgPT09IDAgKSB7XHJcbiAgICAgICAgcmVzdWx0LmNvbnN0YW50ID0gc3BsaXRUeXBlRG9jTGluZSgganNkb2NMaW5lLnNsaWNlKCAnQGNvbnN0YW50ICcubGVuZ3RoICksIHRydWUgKTtcclxuICAgICAgICBqc2RvY0xpbmVzLnNwbGljZSggaywgMSApO1xyXG4gICAgICB9XHJcbiAgICAgIGVsc2UgaWYgKCBqc2RvY0xpbmUuaW5kZXhPZiggJ0Bjb25zdHJ1Y3RvcicgKSA9PT0gMCApIHtcclxuICAgICAgICByZXN1bHQuY29uc3RydWN0b3IgPSB0cnVlO1xyXG4gICAgICAgIGpzZG9jTGluZXMuc3BsaWNlKCBrLCAxICk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBpZiAoIGpzZG9jTGluZXMubGVuZ3RoICkge1xyXG4gICAgICByZXN1bHQuanNkb2MgPSBqc2RvY0xpbmVzO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiByZXN1bHQ7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTaW1pbGFyIHRvIHBhcnNlQmxvY2tEb2MsIGJ1dCBmb3IgbGluZSBjb21tZW50cy4gUmV0dXJucyBudWxsIGZvciBjb21tZW50cyB3aXRob3V0IHZpc2liaWxpdHkuXHJcbiAgICogQHByaXZhdGVcclxuICAgKlxyXG4gICAqIEEgZmV3IGxpbmUgc3R5bGVzIHRoYXQgYXJlIHN1cHBvcnRlZDpcclxuICAgKlxyXG4gICAqICVwdWJsaWMge251bWJlcn0gLSBTb21lIGNvbW1lbnRcclxuICAgKiBXaWxsIHBhcnNlIHRvOiB7IHZpc2liaWxpdHk6ICdwdWJsaWMnLCB0eXBlOiAnbnVtYmVyJywgZGVzY3JpcHRpb246ICdTb21lIGNvbW1lbnQnIH1cclxuICAgKlxyXG4gICAqICVwdWJsaWMgKGRvdC1pbnRlcm5hbCkgVGhpcyBoYXMgbm8gdHlwZSBvciBkYXNoXHJcbiAgICogV2lsbCBwYXJzZSB0bzogeyB2aXNpYmlsaXR5OiAnaW50ZXJuYWwnLCBkZXNjcmlwdGlvbjogJ1RoaXMgaGFzIG5vIHR5cGUgb3IgZGFzaCcgfVxyXG4gICAqXHJcbiAgICogQHBhcmFtIHtzdHJpbmd9IHN0cmluZ1xyXG4gICAqIEByZXR1cm5zIHtPYmplY3R9XHJcbiAgICovXHJcbiAgZnVuY3Rpb24gcGFyc2VMaW5lRG9jKCBzdHJpbmcgKSB7XHJcbiAgICBsZXQgdmlzaWJpbGl0eTtcclxuXHJcbiAgICAvLyBTdHJpcCB2aXNpYmlsaXR5IHRhZ3MsIHJlY29yZGluZyB0aGUgdmlzaWJpbGl0eVxyXG4gICAgaWYgKCBzdHJpbmcuaW5kZXhPZiggJ0BwdWJsaWMnICkgPj0gMCApIHtcclxuICAgICAgaWYgKCBzdHJpbmcuaW5kZXhPZiggJy1pbnRlcm5hbCknICkgPj0gMCApIHtcclxuICAgICAgICB2aXNpYmlsaXR5ID0gJ2ludGVybmFsJztcclxuICAgICAgICBzdHJpbmcgPSBzdHJpbmcucmVwbGFjZSggJy9AcHVibGljLiotaW50ZXJuYWwpJywgJycgKTtcclxuICAgICAgfVxyXG4gICAgICBlbHNlIHtcclxuICAgICAgICB2aXNpYmlsaXR5ID0gJ3B1YmxpYyc7XHJcbiAgICAgICAgc3RyaW5nID0gc3RyaW5nLnJlcGxhY2UoICdAcHVibGljJywgJycgKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgaWYgKCBzdHJpbmcuaW5kZXhPZiggJ0Bwcml2YXRlJyApID49IDAgKSB7XHJcbiAgICAgIHZpc2liaWxpdHkgPSAncHJpdmF0ZSc7XHJcbiAgICAgIHN0cmluZyA9IHN0cmluZy5yZXBsYWNlKCAnQHByaXZhdGUnLCAnJyApO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIFN0cmlwIGxlYWRpbmcgc3BhY2VzXHJcbiAgICBzdHJpbmcgPSBzdHJpbmcucmVwbGFjZSggL14gKy8sICcnICk7XHJcblxyXG4gICAgLy8gSWdub3JlIHRoaW5ncyB3aXRob3V0IHZpc2liaWxpdHlcclxuICAgIGlmICggIXZpc2liaWxpdHkgKSB7XHJcbiAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIEFzc3VtZSBsZWFkaW5nICd7JyBpcyBmb3IgYSB0eXBlXHJcbiAgICBpZiAoIC9eICp7Ly50ZXN0KCBzdHJpbmcgKSApIHtcclxuICAgICAgY29uc3QgcmVzdWx0ID0gc3BsaXRUeXBlRG9jTGluZSggc3RyaW5nLCBmYWxzZSApO1xyXG4gICAgICByZXN1bHQudmlzaWJpbGl0eSA9IHZpc2liaWxpdHk7XHJcbiAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgdmlzaWJpbGl0eTogdmlzaWJpbGl0eSxcclxuICAgICAgZGVzY3JpcHRpb246IHN0cmluZy5yZXBsYWNlKCAvXiAqLywgJycgKS5yZXBsYWNlKCAvICokLywgJycgKVxyXG4gICAgfTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEV4dHJhY3RzIGEgZG9jdW1lbnRhdGlvbiBvYmplY3QgKHBhcnNlTGluZURvYy9wYXJzZUJsb2NrRG9jKSBmcm9tIGFuIEVzcHJpbWEgQVNUIG5vZGUuIFR5cGljYWxseSBsb29rcyBhdCB0aGUgbGFzdFxyXG4gICAqIGxlYWRpbmcgYmxvY2sgY29tbWVudCBpZiBhdmFpbGFibGUsIHRoZW4gdGhlIGxhc3QgbGVhZGluZyBwdWJsaWMgbGluZSBjb21tZW50LlxyXG4gICAqIEBwcml2YXRlXHJcbiAgICpcclxuICAgKiBSZXR1cm5zIG51bGwgaWYgdGhlcmUgaXMgbm8gc3VpdGFibGUgZG9jdW1lbnRhdGlvbi5cclxuICAgKlxyXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBub2RlIC0gRnJvbSB0aGUgRXNwcmltYSBBU1RcclxuICAgKiBAcmV0dXJucyB7T2JqZWN0fSBTZWUgcGFyc2VMaW5lRG9jL3BhcnNlQmxvY2tEb2MgZm9yIHR5cGUgaW5mb3JtYXRpb24uXHJcbiAgICovXHJcbiAgZnVuY3Rpb24gZXh0cmFjdERvY0Zyb21Ob2RlKCBub2RlICkge1xyXG4gICAgZnVuY3Rpb24gYmxvY2tDb21tZW50RmlsdGVyKCBjb21tZW50ICkge1xyXG4gICAgICByZXR1cm4gY29tbWVudC50eXBlID09PSAnQmxvY2snICYmIGNvbW1lbnQudmFsdWUuY2hhckF0KCAwICkgPT09ICcqJztcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBsaW5lQ29tbWVudEZpbHRlciggY29tbWVudCApIHtcclxuICAgICAgcmV0dXJuIGNvbW1lbnQudHlwZSA9PT0gJ0xpbmUnICYmIGNvbW1lbnQudmFsdWUuaW5kZXhPZiggJ0BwdWJsaWMnICkgPj0gMDtcclxuICAgIH1cclxuXHJcbiAgICBsZXQgbGluZUNvbW1lbnRzID0gW107XHJcbiAgICBpZiAoIG5vZGUubGVhZGluZ0NvbW1lbnRzICkge1xyXG4gICAgICBjb25zdCBibG9ja0NvbW1lbnRzID0gbm9kZS5sZWFkaW5nQ29tbWVudHMuZmlsdGVyKCBibG9ja0NvbW1lbnRGaWx0ZXIgKTtcclxuICAgICAgaWYgKCBibG9ja0NvbW1lbnRzLmxlbmd0aCApIHtcclxuICAgICAgICByZXR1cm4gcGFyc2VCbG9ja0RvYyggZGVzdGFyQmxvY2tDb21tZW50KCBibG9ja0NvbW1lbnRzWyBibG9ja0NvbW1lbnRzLmxlbmd0aCAtIDEgXS52YWx1ZSApICk7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSB7XHJcbiAgICAgICAgbGluZUNvbW1lbnRzID0gbGluZUNvbW1lbnRzLmNvbmNhdCggbm9kZS5sZWFkaW5nQ29tbWVudHMuZmlsdGVyKCBsaW5lQ29tbWVudEZpbHRlciApICk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIC8vIE5PVEU6IHRyYWlsaW5nIGNvbW1lbnRzIHdlcmUgYWxzbyByZWNvZ25pemVkIGFzIGxlYWRpbmcgY29tbWVudHMgZm9yIGNvbnNlY3V0aXZlIHRoaXMuPHByb3A+IGRlZmluaXRpb25zLlxyXG4gICAgLy8gU3RyaXBwZWQgb3V0IGZvciBub3cuXHJcbiAgICAvLyBpZiAoIG5vZGUudHJhaWxpbmdDb21tZW50cyApIHtcclxuICAgIC8vICAgbGluZUNvbW1lbnRzID0gbGluZUNvbW1lbnRzLmNvbmNhdCggbm9kZS50cmFpbGluZ0NvbW1lbnRzLmZpbHRlciggbGluZUNvbW1lbnRGaWx0ZXIgKSApO1xyXG4gICAgLy8gfVxyXG4gICAgaWYgKCBsaW5lQ29tbWVudHMubGVuZ3RoICkge1xyXG4gICAgICBjb25zdCBjb21tZW50ID0gbGluZUNvbW1lbnRzWyBsaW5lQ29tbWVudHMubGVuZ3RoIC0gMSBdO1xyXG4gICAgICByZXR1cm4gcGFyc2VMaW5lRG9jKCBjb21tZW50LnZhbHVlLnJlcGxhY2UoIC9eIC8sICcnICkgKTsgLy8gc3RyaXAgb2ZmIGEgc2luZ2xlIGxlYWRpbmcgc3BhY2VcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gbnVsbDtcclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIGlzQ2FwaXRhbGl6ZWQoIHN0cmluZyApIHtcclxuICAgIHJldHVybiBzdHJpbmcuY2hhckF0KCAwICkgPT09IHN0cmluZy5jaGFyQXQoIDAgKS50b1VwcGVyQ2FzZSgpO1xyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24gY2FwaXRhbGl6ZSggc3RyaW5nICkge1xyXG4gICAgcmV0dXJuIHN0cmluZy5jaGFyQXQoIDAgKS50b1VwcGVyQ2FzZSgpICsgc3RyaW5nLnNsaWNlKCAxICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBXaGV0aGVyIGFuIGVzcHJpbWEtcGFyc2VkIEFTVCByZXByZXNlbnRzIGFuIGFzc2lnbWVudCB0byBhbiBpZGVudGlmaWVyIG9uICd0aGlzJywgZS5nLjpcclxuICAgKiB0aGlzLnNvbWV0aGluZyA9IC4uLjtcclxuICAgKiBAcHJpdmF0ZVxyXG4gICAqXHJcbiAgICogQHBhcmFtIHtPYmplY3R9IGV4cHJcclxuICAgKiBAcmV0dXJucyB7Ym9vbGVhbn1cclxuICAgKi9cclxuICBmdW5jdGlvbiBpc1NpbXBsZVRoaXNBc3NpZ25tZW50KCBleHByICkge1xyXG4gICAgcmV0dXJuIGV4cHIudHlwZSA9PT0gJ0Fzc2lnbm1lbnRFeHByZXNzaW9uJyAmJlxyXG4gICAgICAgICAgIGV4cHIubGVmdC50eXBlID09PSAnTWVtYmVyRXhwcmVzc2lvbicgJiZcclxuICAgICAgICAgICBleHByLmxlZnQub2JqZWN0LnR5cGUgPT09ICdUaGlzRXhwcmVzc2lvbicgJiZcclxuICAgICAgICAgICBleHByLmxlZnQucHJvcGVydHkudHlwZSA9PT0gJ0lkZW50aWZpZXInO1xyXG4gIH1cclxuXHJcbiAgLy8gZS5nLiBjb25zb2xlLmxvZyggSlNPTi5zdHJpbmdpZnkoIGV4dHJhY3REb2N1bWVudGF0aW9uKCBwcm9ncmFtICksIG51bGwsIDIgKSApO1xyXG4gIGZ1bmN0aW9uIGV4dHJhY3REb2N1bWVudGF0aW9uKCBwcm9ncmFtICkge1xyXG4gICAgY29uc3QgZG9jID0ge307XHJcblxyXG4gICAgZnVuY3Rpb24gcGFyc2VUeXBlRXhwcmVzc2lvbiggdHlwZVN0YXRlbWVudCwgdHlwZUV4cHJlc3Npb24sIG5hbWUsIHBhcmVudE5hbWUgKSB7XHJcbiAgICAgIGNvbnN0IHR5cGVEb2MgPSB7XHJcbiAgICAgICAgY29tbWVudDogZXh0cmFjdERvY0Zyb21Ob2RlKCB0eXBlU3RhdGVtZW50ICksXHJcbiAgICAgICAgaW5zdGFuY2VQcm9wZXJ0aWVzOiBbXSxcclxuICAgICAgICBzdGF0aWNQcm9wZXJ0aWVzOiBbXSxcclxuICAgICAgICBjb25zdHJ1Y3RvclByb3BlcnRpZXM6IFtdLFxyXG4gICAgICAgIHN1cGVydHlwZTogbnVsbCwgLy8gZmlsbGVkIGluIGJ5IGluaGVyaXRcclxuICAgICAgICB0eXBlOiAndHlwZScsXHJcbiAgICAgICAgbmFtZTogbmFtZVxyXG4gICAgICB9O1xyXG5cclxuICAgICAgaWYgKCBwYXJlbnROYW1lICkge1xyXG4gICAgICAgIHR5cGVEb2MucGFyZW50TmFtZSA9IHBhcmVudE5hbWU7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGNvbnN0IGNvbnN0cnVjdG9yU3RhdGVtZW50cyA9IHR5cGVFeHByZXNzaW9uLmJvZHkuYm9keTsgLy8gc3RhdGVtZW50cyBpbiB0aGUgY29uc3RydWN0b3IgZnVuY3Rpb24gYm9keVxyXG4gICAgICBjb25zdHJ1Y3RvclN0YXRlbWVudHMuZm9yRWFjaCggY29uc3RydWN0b3JTdGF0ZW1lbnQgPT4ge1xyXG4gICAgICAgIGlmICggY29uc3RydWN0b3JTdGF0ZW1lbnQudHlwZSA9PT0gJ0V4cHJlc3Npb25TdGF0ZW1lbnQnICkge1xyXG4gICAgICAgICAgaWYgKCBpc1NpbXBsZVRoaXNBc3NpZ25tZW50KCBjb25zdHJ1Y3RvclN0YXRlbWVudC5leHByZXNzaW9uICkgKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGNvbW1lbnQgPSBleHRyYWN0RG9jRnJvbU5vZGUoIGNvbnN0cnVjdG9yU3RhdGVtZW50ICk7XHJcbiAgICAgICAgICAgIGlmICggY29tbWVudCApIHtcclxuICAgICAgICAgICAgICBjb21tZW50Lm5hbWUgPSBjb25zdHJ1Y3RvclN0YXRlbWVudC5leHByZXNzaW9uLmxlZnQucHJvcGVydHkubmFtZTtcclxuICAgICAgICAgICAgICB0eXBlRG9jLmNvbnN0cnVjdG9yUHJvcGVydGllcy5wdXNoKCBjb21tZW50ICk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH0gKTtcclxuXHJcbiAgICAgIHJldHVybiB0eXBlRG9jO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIHBhcnNlU3RhdGljUHJvcGVydHkoIHByb3BlcnR5ICkge1xyXG4gICAgICBjb25zdCBrZXkgPSBwcm9wZXJ0eS5rZXkubmFtZTtcclxuXHJcbiAgICAgIC8vIFRPRE86IHN1cHBvcnQgc3RhdGljIGNvbnN0YW50cz8gaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL2NoaXBwZXIvaXNzdWVzLzQxMVxyXG4gICAgICBpZiAoIHByb3BlcnR5LnZhbHVlLnR5cGUgPT09ICdGdW5jdGlvbkV4cHJlc3Npb24nICkge1xyXG4gICAgICAgIGNvbnN0IHN0YXRpY0RvYyA9IGV4dHJhY3REb2NGcm9tTm9kZSggcHJvcGVydHkgKTtcclxuXHJcbiAgICAgICAgaWYgKCBzdGF0aWNEb2MgKSB7XHJcbiAgICAgICAgICBzdGF0aWNEb2MudHlwZSA9ICdmdW5jdGlvbic7XHJcbiAgICAgICAgICBzdGF0aWNEb2MubmFtZSA9IGtleTtcclxuICAgICAgICAgIHJldHVybiBzdGF0aWNEb2M7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQHBhcmFtIGV4cHJlc3Npb25cclxuICAgICAqIEByZXR1cm5zIHtudWxsfE9iamVjdH1cclxuICAgICAqL1xyXG4gICAgZnVuY3Rpb24gcGFyc2VJbmhlcml0KCBleHByZXNzaW9uICkge1xyXG4gICAgICBjb25zdCBzdXBlcnR5cGUgPSBleHByZXNzaW9uLmFyZ3VtZW50c1sgMCBdLm5hbWU7XHJcbiAgICAgIGNvbnN0IHN1YnR5cGUgPSBleHByZXNzaW9uLmFyZ3VtZW50c1sgMSBdLm5hbWU7XHJcblxyXG4gICAgICAvLyBJZiB3ZSBoYXZlbid0IGNhdWdodCB0aGUgY29uc3RydWN0b3IvdHlwZSBkZWNsYXJhdGlvbiwgc2tpcCB0aGUgaW5oZXJpdCBwYXJzaW5nXHJcbiAgICAgIGlmICggIWRvY1sgc3VidHlwZSBdICkge1xyXG4gICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBBc3NpZ24gdGhlIHN1cGVydHlwZSBvbiB0aGUgc3VidHlwZVxyXG4gICAgICBkb2NbIHN1YnR5cGUgXS5zdXBlcnR5cGUgPSBzdXBlcnR5cGU7XHJcblxyXG4gICAgICAvLyBJbnN0YW5jZSAocHJvdG90eXBlKSBwcm9wZXJ0aWVzXHJcbiAgICAgIGlmICggZXhwcmVzc2lvbi5hcmd1bWVudHMubGVuZ3RoID49IDMgKSB7XHJcbiAgICAgICAgY29uc3QgaW5zdGFuY2VQcm9wZXJ0aWVzID0gZXhwcmVzc2lvbi5hcmd1bWVudHNbIDIgXS5wcm9wZXJ0aWVzO1xyXG5cclxuICAgICAgICAvLyBGb3ItaXRlcmF0aW9uLCBzbyB3ZSBjYW4gc2tpcCBzb21lIGl0ZW1zIGJ5IGluY3JlbWVudGluZyBpLlxyXG4gICAgICAgIGZvciAoIGxldCBpID0gMDsgaSA8IGluc3RhbmNlUHJvcGVydGllcy5sZW5ndGg7IGkrKyApIHtcclxuICAgICAgICAgIGNvbnN0IHByb3BlcnR5ID0gaW5zdGFuY2VQcm9wZXJ0aWVzWyBpIF07XHJcbiAgICAgICAgICBjb25zdCBrZXkgPSBwcm9wZXJ0eS5rZXkubmFtZTtcclxuICAgICAgICAgIGlmICggcHJvcGVydHkudmFsdWUudHlwZSA9PT0gJ0Z1bmN0aW9uRXhwcmVzc2lvbicgKSB7XHJcbiAgICAgICAgICAgIGlmICggZG9jWyBzdWJ0eXBlIF0gKSB7XHJcbiAgICAgICAgICAgICAgY29uc3QgaW5zdGFuY2VEb2MgPSBleHRyYWN0RG9jRnJvbU5vZGUoIHByb3BlcnR5ICk7XHJcblxyXG4gICAgICAgICAgICAgIGlmICggaW5zdGFuY2VEb2MgKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBDaGVjayB0byBzZWUgaWYgd2UgaGF2ZSBhbiBFUzUgZ2V0dGVyL3NldHRlciBkZWZpbmVkIGJlbG93XHJcbiAgICAgICAgICAgICAgICBpZiAoIGkgKyAxIDwgaW5zdGFuY2VQcm9wZXJ0aWVzLmxlbmd0aCApIHtcclxuICAgICAgICAgICAgICAgICAgY29uc3QgbmV4dFByb3BlcnR5ID0gaW5zdGFuY2VQcm9wZXJ0aWVzWyBpICsgMSBdO1xyXG4gICAgICAgICAgICAgICAgICBjb25zdCBuZXh0RXhwcmVzc2lvbiA9IG5leHRQcm9wZXJ0eS52YWx1ZTtcclxuICAgICAgICAgICAgICAgICAgaWYgKCBuZXh0RXhwcmVzc2lvbi50eXBlID09PSAnRnVuY3Rpb25FeHByZXNzaW9uJyApIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBuZXh0S2V5ID0gbmV4dFByb3BlcnR5LmtleS5uYW1lO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGNhcGl0YWxpemVkTmV4dE5hbWUgPSBjYXBpdGFsaXplKCBuZXh0S2V5ICk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCBuZXh0UHJvcGVydHkua2luZCA9PT0gJ2dldCcgJiZcclxuICAgICAgICAgICAgICAgICAgICAgICAgICggYGdldCR7Y2FwaXRhbGl6ZWROZXh0TmFtZX1gID09PSBrZXkgKSB8fFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgKCBgaXMke2NhcGl0YWxpemVkTmV4dE5hbWV9YCA9PT0ga2V5ICkgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAvLyBTa2lwIHByb2Nlc3NpbmcgdGhlIEVTNSBnZXR0ZXIgbmV4dFxyXG4gICAgICAgICAgICAgICAgICAgICAgaSsrO1xyXG4gICAgICAgICAgICAgICAgICAgICAgaW5zdGFuY2VEb2MubmFtZSA9IG5leHRLZXk7XHJcbiAgICAgICAgICAgICAgICAgICAgICBpbnN0YW5jZURvYy5leHBsaWNpdEdldE5hbWUgPSBrZXk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKCBuZXh0UHJvcGVydHkua2luZCA9PT0gJ3NldCcgJiZcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYHNldCR7Y2FwaXRhbGl6ZWROZXh0TmFtZX1gID09PSBrZXkgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAvLyBTa2lwIHByb2Nlc3NpbmcgdGhlIEVTNSBzZXR0ZXIgbmV4dFxyXG4gICAgICAgICAgICAgICAgICAgICAgaSsrO1xyXG4gICAgICAgICAgICAgICAgICAgICAgaW5zdGFuY2VEb2MubmFtZSA9IG5leHRLZXk7XHJcbiAgICAgICAgICAgICAgICAgICAgICBpbnN0YW5jZURvYy5leHBsaWNpdFNldE5hbWUgPSBrZXk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpbnN0YW5jZURvYy50eXBlID0gJ2Z1bmN0aW9uJztcclxuICAgICAgICAgICAgICAgIGluc3RhbmNlRG9jLm5hbWUgPSBpbnN0YW5jZURvYy5uYW1lIHx8IGtleTtcclxuICAgICAgICAgICAgICAgIGRvY1sgc3VidHlwZSBdLmluc3RhbmNlUHJvcGVydGllcy5wdXNoKCBpbnN0YW5jZURvYyApO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gU3RhdGljIChjb25zdHJ1Y3RvcikgcHJvcGVydGllc1xyXG4gICAgICBpZiAoIGV4cHJlc3Npb24uYXJndW1lbnRzLmxlbmd0aCA+PSA0ICkge1xyXG4gICAgICAgIGNvbnN0IHN0YXRpY1Byb3BlcnRpZXMgPSBleHByZXNzaW9uLmFyZ3VtZW50c1sgMyBdLnByb3BlcnRpZXM7XHJcblxyXG4gICAgICAgIHN0YXRpY1Byb3BlcnRpZXMuZm9yRWFjaCggcHJvcGVydHkgPT4ge1xyXG4gICAgICAgICAgY29uc3Qgc3RhdGljRG9jID0gcGFyc2VTdGF0aWNQcm9wZXJ0eSggcHJvcGVydHkgKTtcclxuICAgICAgICAgIGlmICggZG9jWyBzdWJ0eXBlIF0gJiYgc3RhdGljRG9jICkge1xyXG4gICAgICAgICAgICBkb2NbIHN1YnR5cGUgXS5zdGF0aWNQcm9wZXJ0aWVzLnB1c2goIHN0YXRpY0RvYyApO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0gKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIGRvY1sgc3VidHlwZSBdO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIERpZyBpbnRvIHJlcXVpcmUgc3RydWN0dXJlXHJcbiAgICBjb25zdCBtYWluU3RhdGVtZW50cyA9IHByb2dyYW0uYm9keVsgMCBdLmV4cHJlc3Npb24uYXJndW1lbnRzWyAwIF0uYm9keS5ib2R5O1xyXG5cclxuICAgIGRvYy50b3BMZXZlbENvbW1lbnQgPSBleHRyYWN0RG9jRnJvbU5vZGUoIHByb2dyYW0uYm9keVsgMCBdICk7XHJcblxyXG4gICAgZm9yICggbGV0IGkgPSAwOyBpIDwgbWFpblN0YXRlbWVudHMubGVuZ3RoOyBpKysgKSB7XHJcbiAgICAgIGNvbnN0IHRvcExldmVsU3RhdGVtZW50ID0gbWFpblN0YXRlbWVudHNbIGkgXTtcclxuXHJcbiAgICAgIC8vIFRvcC1sZXZlbCBjYXBpdGFsaXplZCBmdW5jdGlvbiBkZWNsYXJhdGlvbj8gUGFyc2UgaXQgYXMgYSBUeXBlXHJcbiAgICAgIGlmICggdG9wTGV2ZWxTdGF0ZW1lbnQudHlwZSA9PT0gJ0Z1bmN0aW9uRGVjbGFyYXRpb24nICYmXHJcbiAgICAgICAgICAgaXNDYXBpdGFsaXplZCggdG9wTGV2ZWxTdGF0ZW1lbnQuaWQubmFtZSApICkge1xyXG4gICAgICAgIGNvbnN0IHR5cGVOYW1lID0gdG9wTGV2ZWxTdGF0ZW1lbnQuaWQubmFtZTtcclxuICAgICAgICBkb2NbIHR5cGVOYW1lIF0gPSBwYXJzZVR5cGVFeHByZXNzaW9uKCB0b3BMZXZlbFN0YXRlbWVudCwgdG9wTGV2ZWxTdGF0ZW1lbnQsIHR5cGVOYW1lLCBudWxsICk7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSBpZiAoIHRvcExldmVsU3RhdGVtZW50LnR5cGUgPT09ICdFeHByZXNzaW9uU3RhdGVtZW50JyApIHtcclxuICAgICAgICBjb25zdCBleHByZXNzaW9uID0gdG9wTGV2ZWxTdGF0ZW1lbnQuZXhwcmVzc2lvbjtcclxuXHJcbiAgICAgICAgLy8gQ2FsbCB0byBpbmhlcml0KClcclxuICAgICAgICBpZiAoIGV4cHJlc3Npb24udHlwZSA9PT0gJ0NhbGxFeHByZXNzaW9uJyAmJiBleHByZXNzaW9uLmNhbGxlZS5uYW1lID09PSAnaW5oZXJpdCcgKSB7XHJcbiAgICAgICAgICBwYXJzZUluaGVyaXQoIGV4cHJlc3Npb24gKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAoIGV4cHJlc3Npb24udHlwZSA9PT0gJ0Fzc2lnbm1lbnRFeHByZXNzaW9uJyAmJlxyXG4gICAgICAgICAgICAgICAgICBleHByZXNzaW9uLmxlZnQudHlwZSA9PT0gJ01lbWJlckV4cHJlc3Npb24nICkge1xyXG4gICAgICAgICAgY29uc3QgY29tbWVudCA9IGV4dHJhY3REb2NGcm9tTm9kZSggdG9wTGV2ZWxTdGF0ZW1lbnQgKTtcclxuICAgICAgICAgIGlmICggY29tbWVudCAmJlxyXG4gICAgICAgICAgICAgICBleHByZXNzaW9uLmxlZnQub2JqZWN0LnR5cGUgPT09ICdJZGVudGlmaWVyJyAmJlxyXG4gICAgICAgICAgICAgICBleHByZXNzaW9uLmxlZnQucHJvcGVydHkudHlwZSA9PT0gJ0lkZW50aWZpZXInICYmXHJcbiAgICAgICAgICAgICAgIGRvY1sgZXhwcmVzc2lvbi5sZWZ0Lm9iamVjdC5uYW1lIF0gKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGlubmVyTmFtZSA9IGV4cHJlc3Npb24ubGVmdC5wcm9wZXJ0eS5uYW1lO1xyXG4gICAgICAgICAgICBsZXQgdHlwZTtcclxuXHJcbiAgICAgICAgICAgIC8vIElubmVyIFR5cGUsIGUuZy4gQmluUGFja2VyLkJpbiA9IGZ1bmN0aW9uIEJpbiggLi4uICkgeyAuLi4gfTtcclxuICAgICAgICAgICAgaWYgKCBleHByZXNzaW9uLnJpZ2h0LnR5cGUgPT09ICdGdW5jdGlvbkV4cHJlc3Npb24nICYmXHJcbiAgICAgICAgICAgICAgICAgaXNDYXBpdGFsaXplZCggaW5uZXJOYW1lICkgKSB7XHJcbiAgICAgICAgICAgICAgZG9jWyBpbm5lck5hbWUgXSA9IHBhcnNlVHlwZUV4cHJlc3Npb24oIHRvcExldmVsU3RhdGVtZW50LCBleHByZXNzaW9uLnJpZ2h0LCBpbm5lck5hbWUsIGV4cHJlc3Npb24ubGVmdC5vYmplY3QubmFtZSApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIC8vIE90aGVyLCBlLmcuIFZlY3RvcjIuWkVSTyA9IC4uLjtcclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgaWYgKCBleHByZXNzaW9uLnJpZ2h0LnR5cGUgPT09ICdGdW5jdGlvbkV4cHJlc3Npb24nICkge1xyXG4gICAgICAgICAgICAgICAgdHlwZSA9ICdmdW5jdGlvbic7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdHlwZSA9ICdjb25zdGFudCc7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIGNvbW1lbnQudHlwZSA9IHR5cGU7XHJcbiAgICAgICAgICAgICAgY29tbWVudC5uYW1lID0gZXhwcmVzc2lvbi5sZWZ0LnByb3BlcnR5Lm5hbWU7XHJcbiAgICAgICAgICAgICAgZG9jWyBleHByZXNzaW9uLmxlZnQub2JqZWN0Lm5hbWUgXS5zdGF0aWNQcm9wZXJ0aWVzLnB1c2goIGNvbW1lbnQgKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgICAvLyBWYXJpYWJsZSBvYmplY3QgaW5pdGlhbGl6YXRpb246IGUuZy4gdmFyIFV0aWxzID0geyAuLi4gfTtcclxuICAgICAgZWxzZSBpZiAoIHRvcExldmVsU3RhdGVtZW50LnR5cGUgPT09ICdWYXJpYWJsZURlY2xhcmF0aW9uJyAmJlxyXG4gICAgICAgICAgICAgICAgdG9wTGV2ZWxTdGF0ZW1lbnQuZGVjbGFyYXRpb25zWyAwIF0udHlwZSA9PT0gJ1ZhcmlhYmxlRGVjbGFyYXRvcicgJiZcclxuICAgICAgICAgICAgICAgIHRvcExldmVsU3RhdGVtZW50LmRlY2xhcmF0aW9uc1sgMCBdLmluaXQgJiZcclxuICAgICAgICAgICAgICAgIHRvcExldmVsU3RhdGVtZW50LmRlY2xhcmF0aW9uc1sgMCBdLmluaXQudHlwZSA9PT0gJ09iamVjdEV4cHJlc3Npb24nICYmXHJcbiAgICAgICAgICAgICAgICBpc0NhcGl0YWxpemVkKCB0b3BMZXZlbFN0YXRlbWVudC5kZWNsYXJhdGlvbnNbIDAgXS5pZC5uYW1lICkgKSB7XHJcbiAgICAgICAgY29uc3Qgb2JqZWN0TmFtZSA9IHRvcExldmVsU3RhdGVtZW50LmRlY2xhcmF0aW9uc1sgMCBdLmlkLm5hbWU7XHJcbiAgICAgICAgZG9jWyBvYmplY3ROYW1lIF0gPSB7XHJcbiAgICAgICAgICBjb21tZW50OiBleHRyYWN0RG9jRnJvbU5vZGUoIHRvcExldmVsU3RhdGVtZW50ICksIC8vIG1heWJlIG5vdCBuZWVkZWQ/XHJcbiAgICAgICAgICBwcm9wZXJ0aWVzOiBbXSxcclxuICAgICAgICAgIHR5cGU6ICdvYmplY3QnLFxyXG4gICAgICAgICAgbmFtZTogb2JqZWN0TmFtZVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIC8vIFByb2Nlc3MgcHJvcGVydGllcyBpbiB0aGUgb2JqZWN0XHJcbiAgICAgICAgdG9wTGV2ZWxTdGF0ZW1lbnQuZGVjbGFyYXRpb25zWyAwIF0uaW5pdC5wcm9wZXJ0aWVzLmZvckVhY2goIHByb3BlcnR5ID0+IHtcclxuICAgICAgICAgIGNvbnN0IHN0YXRpY0RvYyA9IHBhcnNlU3RhdGljUHJvcGVydHkoIHByb3BlcnR5ICk7XHJcbiAgICAgICAgICBpZiAoIHN0YXRpY0RvYyApIHtcclxuICAgICAgICAgICAgZG9jWyBvYmplY3ROYW1lIF0ucHJvcGVydGllcy5wdXNoKCBzdGF0aWNEb2MgKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9ICk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiBkb2M7XHJcbiAgfVxyXG5cclxuICAvLyBOb2RlLmpzLWNvbXBhdGlibGUgZGVmaW5pdGlvblxyXG4gIGlmICggdHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgKSB7XHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IGV4dHJhY3REb2N1bWVudGF0aW9uO1xyXG4gIH1cclxuXHJcbiAgLy8gQnJvd3NlciBkaXJlY3QgZGVmaW5pdGlvbiAoZm9yIHRlc3RpbmcpXHJcbiAgaWYgKCB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyApIHtcclxuICAgIHdpbmRvdy5leHRyYWN0RG9jdW1lbnRhdGlvbiA9IGV4dHJhY3REb2N1bWVudGF0aW9uO1xyXG4gIH1cclxufSApKCk7Il0sIm1hcHBpbmdzIjoiQUFBQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7O0FBR0EsQ0FBRSxZQUFXO0VBRVg7QUFDRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtFQUNFLFNBQVNBLGtCQUFrQkEsQ0FBRUMsTUFBTSxFQUFHO0lBQ3BDLE9BQU9BLE1BQU0sQ0FBQ0MsS0FBSyxDQUFFLElBQUssQ0FBQyxDQUFDQyxHQUFHLENBQUVDLElBQUksSUFBSTtNQUN2QyxJQUFJQyxTQUFTLEdBQUdELElBQUksQ0FBQ0UsT0FBTyxDQUFFLFNBQVMsRUFBRSxFQUFHLENBQUM7O01BRTdDO01BQ0EsSUFBS0QsU0FBUyxDQUFDQyxPQUFPLENBQUUsSUFBSSxFQUFFLEVBQUcsQ0FBQyxDQUFDQyxNQUFNLEtBQUssQ0FBQyxFQUFHO1FBQ2hERixTQUFTLEdBQUcsRUFBRTtNQUNoQjtNQUNBLE9BQU9BLFNBQVM7SUFDbEIsQ0FBRSxDQUFDLENBQUNHLElBQUksQ0FBRSxJQUFLLENBQUM7RUFDbEI7O0VBRUE7QUFDRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0VBQ0UsU0FBU0MsU0FBU0EsQ0FBRVIsTUFBTSxFQUFHO0lBQzNCLE1BQU1TLEtBQUssR0FBR1QsTUFBTSxDQUFDQyxLQUFLLENBQUUsSUFBSyxDQUFD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