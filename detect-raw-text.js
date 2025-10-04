const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

const projectRoot = process.cwd();
const targetDir = path.join(projectRoot, 'app');

const allowedElements = new Set(['Text', 'Animated.Text']);

function elementName(node) {
  if (!node) return null;
  const nameNode = node.openingElement?.name;
  if (!nameNode) return null;
  if (nameNode.type === 'JSXIdentifier') {
    return nameNode.name;
  }
  if (nameNode.type === 'JSXMemberExpression') {
    const parts = [];
    let current = nameNode;
    while (current) {
      if (current.property) {
        parts.unshift(current.property.name);
      }
      if (current.object?.type === 'JSXIdentifier') {
        parts.unshift(current.object.name);
        break;
      }
      current = current.object;
    }
    return parts.join('.');
  }
  return null;
}

function isAllowedElement(node) {
  const name = elementName(node);
  if (!name) return false;
  if (allowedElements.has(name)) return true;
  if (/Text$/i.test(name)) return true;
  return false;
}

function nearestElement(path) {
  let current = path.parentPath;
  while (current) {
    const node = current.node;
    if (node.type === 'JSXElement') return node;
    current = current.parentPath;
  }
  return null;
}

function collectFiles(dir, acc) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      collectFiles(path.join(dir, entry.name), acc);
    } else if (/\.(tsx|jsx)$/.test(entry.name)) {
      acc.push(path.join(dir, entry.name));
    }
  }
}

function isRawStringNode(node) {
  if (!node) return false;
  if (node.type === 'StringLiteral') return true;
  if (node.type === 'TemplateLiteral' && node.expressions.length === 0) return true;
  return false;
}

const files = [];
collectFiles(targetDir, files);

const offenders = [];

for (const file of files) {
  const code = fs.readFileSync(file, 'utf8');
  let ast;
  try {
    ast = parser.parse(code, {
      sourceType: 'module',
      plugins: ['typescript', 'jsx'],
    });
  } catch (err) {
    console.error('Failed parsing', file, err.message);
    continue;
  }

  traverse(ast, {
    JSXExpressionContainer(path) {
      const parentEl = nearestElement(path);
      if (!parentEl || isAllowedElement(parentEl)) return;
      const expr = path.node.expression;
      if (!expr) return;

      const flag = (node, reason) => {
        offenders.push({
          file,
          loc: node?.loc,
          value: node?.type === 'TemplateLiteral' ? node.quasis.map(q => q.value.raw).join('') : node?.value ?? '[expression]',
          reason,
        });
      };

      if (isRawStringNode(expr)) {
        flag(expr, expr.type);
        return;
      }

      if (expr.type === 'Identifier') {
        const binding = path.scope.getBinding(expr.name);
        const init = binding?.path?.node?.init;
        if (isRawStringNode(init)) {
          flag(init, `Identifier:${expr.name}`);
          return;
        }
      }

      if (expr.type === 'ConditionalExpression') {
        const { consequent, alternate } = expr;
        if (isRawStringNode(consequent)) flag(consequent, 'ConditionalString');
        if (isRawStringNode(alternate)) flag(alternate, 'ConditionalString');
        return;
      }

      if (expr.type === 'LogicalExpression' && expr.operator === '&&') {
        if (isRawStringNode(expr.right)) flag(expr.right, 'LogicalString');
        return;
      }

      if (expr.type === 'ArrayExpression') {
        for (const element of expr.elements) {
          if (isRawStringNode(element)) flag(element, 'ArrayString');
        }
        return;
      }

      if (expr.type === 'CallExpression') {
        const callee = expr.callee;
        if (callee.type === 'Identifier') {
          const binding = path.scope.getBinding(callee.name);
          if (binding && binding.path.node.type === 'FunctionDeclaration') {
            binding.path.traverse({
              ReturnStatement(returnPath) {
                const arg = returnPath.node.argument;
                if (isRawStringNode(arg)) {
                  flag(arg, `Call:${callee.name}`);
                }
              }
            });
          }
        }
      }
    },
    JSXText(path) {
      const raw = path.node.value;
      if (!raw || /^[\s\n\r\t]*$/.test(raw)) return;
      const parentEl = nearestElement(path);
      if (parentEl && !isAllowedElement(parentEl)) {
        offenders.push({
          file,
          loc: path.node.loc,
          value: raw.trim(),
          reason: 'JSXText',
        });
      }
    },
  });
}

if (offenders.length) {
  for (const offender of offenders) {
    const locStr = offender.loc ? `${offender.loc.start.line}:${offender.loc.start.column}` : '?:?';
    console.log(`${path.relative(projectRoot, offender.file)}:${locStr} => ${offender.reason} => ${offender.value}`);
  }
} else {
  console.log('No offenders detected.');
}
