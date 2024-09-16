import ts from 'typescript';
import * as path from 'node:path';
import * as fs from 'node:fs';

type TransformerFactory = ts.TransformerFactory<ts.SourceFile>;

const consoleModifier_red = '\x1b[31m';
const consoleModifier_default = '\x1b[0m';

function createKeysOfTypeTransformer(program: ts.Program): TransformerFactory {
  return (context) => {
    const typeChecker = program.getTypeChecker();

    function isTypeCompatible(source: ts.Type, target: ts.Type): boolean {
      // Check if both types are functions
      const sourceSignatures = source.getCallSignatures();
      const targetSignatures = target.getCallSignatures();
      console.log('length', sourceSignatures.length, targetSignatures.length);

      if (sourceSignatures.length > 0 && targetSignatures.length > 0) {
        return sourceSignatures.some(sourceSignature =>
          targetSignatures.some(targetSignature =>
            areSignaturesCompatible(sourceSignature, targetSignature)
          )
        );
      }

      // For non-function types, compare structure
      return areTypesStructurallyCompatible(source, target);
    }

    function areSignaturesCompatible(source: ts.Signature, target: ts.Signature): boolean {
      // Compare return types
      const sourceReturnType = typeChecker.getReturnTypeOfSignature(source);
      const targetReturnType = typeChecker.getReturnTypeOfSignature(target);
      if (!areTypesStructurallyCompatible(sourceReturnType, targetReturnType)) {
        return false;
      }

      // Compare parameters
      const sourceParams = source.getParameters();
      const targetParams = target.getParameters();
      if (sourceParams.length !== targetParams.length) {
        return false;
      }

      for (let i = 0; i < sourceParams.length; i++) {
        const sourceParamType = typeChecker.getTypeOfSymbolAtLocation(sourceParams[i], source.declaration!);
        const targetParamType = typeChecker.getTypeOfSymbolAtLocation(targetParams[i], target.declaration!);
        if (!areTypesStructurallyCompatible(sourceParamType, targetParamType)) {
          return false;
        }
      }

      return true;
    }

    function areTypesStructurallyCompatible(source: ts.Type, target: ts.Type): boolean {
      if (source === target) {
        return true;
      }

      if (source.flags !== target.flags) {
        return false;
      }

      if (source.isUnion() && target.isUnion()) {
        const sourceTypes = source.types;
        const targetTypes = target.types;
        return sourceTypes.every(sourceType =>
          targetTypes.some(targetType => areTypesStructurallyCompatible(sourceType, targetType))
        );
      }

      if (source.isIntersection() && target.isIntersection()) {
        const sourceTypes = source.types;
        const targetTypes = target.types;
        return sourceTypes.every(sourceType =>
          targetTypes.some(targetType => areTypesStructurallyCompatible(sourceType, targetType))
        );
      }

      // Compare properties for object types
      if (source.getProperties().length > 0 || target.getProperties().length > 0) {
        const sourceProps = source.getProperties();
        const targetProps = target.getProperties();
        return sourceProps.every(sourceProp => {
          const targetProp = targetProps.find(p => p.name === sourceProp.name);
          if (!targetProp) {
            return false;
          }
          const sourcePropType = typeChecker.getTypeOfSymbolAtLocation(sourceProp, sourceProp.declarations![0]);
          const targetPropType = typeChecker.getTypeOfSymbolAtLocation(targetProp, targetProp.declarations![0]);
          return areTypesStructurallyCompatible(sourcePropType, targetPropType);
        });
      }

      return true;
    }

    const visit: ts.Visitor = (node) => {
      if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === 'getKeysOfType') {
        const typeArguments = node.typeArguments;

        if (typeArguments && typeArguments.length === 2) {
          const sourceType = typeChecker.getTypeFromTypeNode(typeArguments[0]);
          const targetSignature = typeChecker.getTypeFromTypeNode(typeArguments[1]);


          const matchingKeys = sourceType.getProperties()
            .filter(prop => {
              const propType = typeChecker.getTypeOfSymbolAtLocation(prop, node);
              // @ts-ignore
              return typeChecker.isTypeAssignableTo(propType, targetSignature);
              // const out = isTypeCompatible(propType, targetSignature);
              // process.exit(1);
              // return isTypeCompatible(propType, targetSignature);
            })
            .map(prop => prop.getName());

          // Create a new array literal expression with the matching keys
          return ts.factory.createArrayLiteralExpression(
            matchingKeys.map(key => ts.factory.createStringLiteral(key)),
            true
          );
        }
        else {
          const source = ts.isSourceFile(node) ? node : node.getSourceFile();
          const pos = source.getLineAndCharacterOfPosition(node.pos);
          const rootPath = fs.realpathSync(path.join(__dirname, '..'));
          console.error(`${source.fileName.substring(rootPath.length+1)}:${pos.line}:${pos.character} - ${consoleModifier_red}error${consoleModifier_default}`, 'getKeysOfType takes 2 type arguments');
        }
      }
      return ts.visitEachChild(node, visit, context);
    };
    return (sourceFile) => ts.visitNode(sourceFile, visit);
  };
}

// Example of how to use the transformer in your build process
function createProgram(rootNames: string[], options: ts.CompilerOptions): ts.Program {
  const compilerHost = ts.createCompilerHost(options);
  const program = ts.createProgram(rootNames, options, compilerHost);

  const transformers: ts.CustomTransformers = {
    before: [createKeysOfTypeTransformer(program)],
  };

  const { emitSkipped, diagnostics } = program.emit(
    undefined,
    undefined,
    undefined,
    false,
    transformers
  );

  if (emitSkipped) {
    throw new Error(ts.formatDiagnostics(diagnostics, compilerHost));
  }

  return program;
}

export default createKeysOfTypeTransformer;
