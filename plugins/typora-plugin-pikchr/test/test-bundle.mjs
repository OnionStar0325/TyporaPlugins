import PluginClass from '../main.js';
import assert from 'assert';

async function run() {
  console.log('🧪 Testing main.js ES Module bundle...');
  assert(typeof PluginClass === 'function', 'Default export should be a class');

  const plugin = new PluginClass();
  await plugin.onload();
  console.log('✅ onload() succeeded');

  const testCode = 'box "Input"; arrow; circle "Process";';
  const svg = plugin.renderer.render(testCode);
  assert(svg.includes('<svg'), 'Renderer should return valid SVG');
  assert(svg.includes('Input'), 'SVG should contain text "Input"');
  console.log('✅ Diagram rendered to SVG correctly');

  plugin.onunload();
  console.log('✅ onunload() succeeded');

  console.log('🎉 main.js verification PASSED!');
}

run().catch(err => {
  console.error('❌ Bundle test failed:', err);
  process.exit(1);
});
