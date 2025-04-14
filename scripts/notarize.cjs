const { notarize } = require('@electron/notarize');
const { build } = require('../package.json');

exports.default = async function notarizing(context) {
  const { electronPlatformName, appOutDir } = context;  
  if (electronPlatformName !== 'darwin') {
    console.log('Skipping notarization: not macOS platform');
    return;
  }

  // Vérifier que les variables d'environnement nécessaires sont définies
  const { APPLE_ID, APPLE_APP_SPECIFIC_PASSWORD, APPLE_TEAM_ID } = process.env;
  
  if (!APPLE_ID || !APPLE_APP_SPECIFIC_PASSWORD || !APPLE_TEAM_ID) {
    console.warn('⚠️ Notarization skipped: environment variables missing');
    console.warn('Set APPLE_ID, APPLE_APP_SPECIFIC_PASSWORD and APPLE_TEAM_ID');
    return;
  }
  
  const appName = context.packager.appInfo.productFilename;
  const appPath = `${appOutDir}/${appName}.app`;

  console.log(`🔐 Notarizing ${appPath} with Apple ID: ${APPLE_ID}`);
  console.log(`   Team ID: ${APPLE_TEAM_ID}`);
  console.log('   This process may take several minutes...');

  try {
    await notarize({
      appBundleId: build.appId,
      appPath,
      appleId: APPLE_ID,
      appleIdPassword: APPLE_APP_SPECIFIC_PASSWORD,
      teamId: APPLE_TEAM_ID,
    });
    
    console.log('✅ Notarization completed successfully');
    console.log(`   App: ${appName}`);
    console.log(`   Bundle ID: ${build.appId}`);
  } catch (error) {
    console.error('❌ Notarization failed:');
    console.error(`   ${error.message}`);
    console.error('   Check your Apple ID credentials and internet connection');
    throw error; // Important: propager l'erreur pour arrêter le build
  }
}; 