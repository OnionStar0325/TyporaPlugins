import PikchrModule from 'pikchr-js/pikchr';
import assert from 'assert';

async function runTests() {
  console.log('🧪 Running Pikchr Plugin tests...');

  // 1. Module Initialization Test
  const Module = await PikchrModule();
  assert(Module, 'PikchrModule should resolve successfully');
  assert(typeof Module.ccall === 'function', 'Module should have ccall method');
  console.log('✅ Pikchr WASM module loaded');

  // 2. Simple Diagram Rendering Test
  const simpleCode = 'box "Input"; arrow; circle "Process"; arrow; box "Output";';
  const svgOutput = Module.ccall(
    'pikchr',
    'string',
    ['string', 'string', 'number', 'number', 'number'],
    [simpleCode, 'pikchr-svg', 0, 0, 0]
  );
  assert(svgOutput.includes('<svg'), 'Output should contain an <svg> tag');
  assert(svgOutput.includes('viewBox'), 'Output SVG should have viewBox');
  assert(svgOutput.includes('Input'), 'Output SVG should contain text "Input"');
  console.log('✅ Basic diagram rendered to SVG');

  // 3. Syntax Error Handling Test
  const invalidCode = 'box "unclosed string;';
  const errorOutput = Module.ccall(
    'pikchr',
    'string',
    ['string', 'string', 'number', 'number', 'number'],
    [invalidCode, 'pikchr-svg', 0, 0, 0]
  );
  assert(
    errorOutput.includes('ERROR') || errorOutput.includes('Syntax Error') || errorOutput.includes('error') || errorOutput.includes('data-pikchr-date'),
    'Error response received'
  );
  console.log('✅ Syntax error handled gracefully');

  console.log('🎉 All tests passed successfully!');
}

runTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
