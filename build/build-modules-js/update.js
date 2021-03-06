const Promise = require('bluebird');
const fs = require('fs');
const fsExtra = require('fs-extra');
const Path = require('path');
const copydir = require('copy-dir');
const UglifyJS = require('uglify-es');
const UglyCss = require('uglifycss');
const rootPath = require('./rootpath.js')._();

const xmlVersionStr = /(<version>)(\d+.\d+.\d+)(<\/version>)/;

// rm -rf media/vendor
const cleanVendors = () => {
  // Remove the vendor folder
  fsExtra.removeSync(Path.join(rootPath, 'media/vendor'));

  // eslint-disable-next-line no-console
  console.error('/media/vendor has been removed.');

  // Restore our code on the vendor folders
  fsExtra.copySync(Path.join(rootPath, 'build/media/vendor/tinymce/langs'), Path.join(rootPath, 'media/vendor/tinymce/langs'));
  fsExtra.copySync(Path.join(rootPath, 'build/media/vendor/tinymce/templates'), Path.join(rootPath, 'media/vendor/tinymce/templates'));
  fsExtra.copySync(Path.join(rootPath, 'build/media/vendor/jquery-ui'), Path.join(rootPath, 'media/vendor/jquery-ui'));

  // And here some assets from a PHP package
  // @todo Move it the 'right way' (tm)
  fsExtra.copySync(Path.join(rootPath, 'libraries/vendor/maximebf/debugbar/src/DebugBar/Resources'), Path.join(rootPath, 'media/vendor/debugbar'));
};

// Copies all the files from a directory
const copyAll = (dirName, name, type) => {
  const folderName = dirName === '/' ? '/' : `/${dirName}`;
  fsExtra.copySync(Path.join(rootPath, `node_modules/${name}/${folderName}`),
    Path.join(rootPath, `media/vendor/${name.replace(/.+\//, '')}/${type}`));
};

// Copies an array of files from a directory
const copyArrayFiles = (dirName, files, name, type) => {
  files.forEach((file) => {
    const folderName = dirName === '/' ? '/' : `/${dirName}/`;
    if (fsExtra.existsSync(`node_modules/${name}${folderName}${file}`)) {
      fsExtra.copySync(`node_modules/${name}${folderName}${file}`, `media/vendor/${name.replace(/.+\//, '')}${type ? `/${type}` : ''}/${file}`);
    }
  });
};
/**
 *
 * @param files   Object of files map, eg {"src.js": "js/src.js"}
 * @param srcDir  Package root dir
 * @param destDir Vendor destination dir
 *
 * @returns {Array}
 */
const copyFilesTo = (files, srcDir, destDir) => {
  const filesResult = [];

  // Copy each file
  // eslint-disable-next-line guard-for-in, no-restricted-syntax
  for (const srcFile in files) {
    const destFile = files[srcFile];
    const srcPath = Path.join(srcDir, srcFile);
    // stats    = fs.lstatSync(srcPath),
    const destPath = Path.join(destDir, destFile);

    fsExtra.copySync(srcPath, destPath);
    filesResult.push(destPath);
  }

  return filesResult;
};

// Concatenate some files
const concatFiles = (files, output) => {
  let tempMem = '';
  files.forEach((file) => {
    if (fsExtra.existsSync(`${rootPath}/${file}`)) {
      tempMem += fs.readFileSync(`${rootPath}/${file}`);
    }
  });

  fs.writeFileSync(`${rootPath}/${output}`, tempMem);
};

const copyFiles = (options) => {
  const mediaVendorPath = Path.join(rootPath, 'media/vendor');
  const registry = {
    name: options.name,
    version: options.version,
    description: options.description,
    license: options.license,
    assets: {},
  };

  if (!fsExtra.existsSync(mediaVendorPath)) {
    fsExtra.mkdirSync(mediaVendorPath);
  }

  // Loop to get some text for the packgage.json
  // eslint-disable-next-line guard-for-in, no-restricted-syntax
  for (const packageName in options.settings.vendors) {
    const vendor = options.settings.vendors[packageName];
    const vendorName = vendor.name || packageName;
    const modulePathJson = require.resolve(`${packageName}/package.json`);
    const modulePathRoot = Path.dirname(modulePathJson);
    // eslint-disable-next-line global-require, import/no-dynamic-require
    const moduleOptions = require(modulePathJson);

    if (packageName === 'codemirror') {
      const itemvendorPath = Path.join(rootPath, `media/vendor/${packageName}`);
      if (!fsExtra.existsSync(itemvendorPath)) {
        fsExtra.mkdirSync(itemvendorPath);
        fsExtra.mkdirSync(Path.join(itemvendorPath, 'addon'));
        fsExtra.mkdirSync(Path.join(itemvendorPath, 'lib'));
        fsExtra.mkdirSync(Path.join(itemvendorPath, 'mode'));
        fsExtra.mkdirSync(Path.join(itemvendorPath, 'keymap'));
        fsExtra.mkdirSync(Path.join(itemvendorPath, 'theme'));
      }

      copyAll('addon', 'codemirror', 'addon');
      copyAll('lib', 'codemirror', 'lib');
      copyAll('mode', 'codemirror', 'mode');
      copyAll('keymap', 'codemirror', 'keymap');
      copyAll('theme', 'codemirror', 'theme');

      concatFiles(
        [
          'media/vendor/codemirror/addon/display/fullscreen.js',
          'media/vendor/codemirror/addon/display/panel.js',
          'media/vendor/codemirror/addon/edit/closebrackets.js',
          'media/vendor/codemirror/addon/edit/closetag.js',
          'media/vendor/codemirror/addon/edit/matchbrackets.js',
          'media/vendor/codemirror/addon/edit/matchtags.js',
          'media/vendor/codemirror/addon/fold/brace-fold.js',
          'media/vendor/codemirror/addon/fold/foldcode.js',
          'media/vendor/codemirror/addon/fold/foldgutter.js',
          'media/vendor/codemirror/addon/fold/xml-fold.js',
          'media/vendor/codemirror/addon/mode/loadmode.js',
          'media/vendor/codemirror/addon/mode/multiplex.js',
          'media/vendor/codemirror/addon/scroll/annotatescrollbar.js',
          'media/vendor/codemirror/addon/scroll/simplescrollbars.js',
          'media/vendor/codemirror/addon/scroll/matchesonscrollbar.js',
          'media/vendor/codemirror/addon/scroll/match-highlighter.js',
          'media/vendor/codemirror/addon/scroll/searchcursor.js',
          'media/vendor/codemirror/addon/selection/active-line.js',
          'media/vendor/codemirror/keymap/vim.js',
          'media/vendor/codemirror/mode/meta.js',
        ],
        'media/vendor/codemirror/lib/addons.js');

      concatFiles([
        'media/vendor/codemirror/addon/display/fullscreen.css',
        'media/vendor/codemirror/addon/fold/foldgutter.css',
        'media/vendor/codemirror/addon/search/matchesonscrollbar.css',
        'media/vendor/codemirror/addon/scroll/simplescrollbars.css',
      ], 'media/vendor/codemirror/lib/addons.css');

      // Update the XML file for Codemirror
      let codemirrorXml = fs.readFileSync(`${rootPath}/plugins/editors/codemirror/codemirror.xml`, { encoding: 'UTF-8' });
      codemirrorXml = codemirrorXml.replace(xmlVersionStr, `$1${options.dependencies.codemirror}$3`);
      fs.writeFileSync(`${rootPath}/plugins/editors/codemirror/codemirror.xml`, codemirrorXml, { encoding: 'UTF-8' });
    } else if (packageName === 'tinymce') {
      const itemvendorPath = Path.join(rootPath, `media/vendor/${packageName}`);

      if (!fsExtra.existsSync(itemvendorPath)) {
        fsExtra.mkdirSync(itemvendorPath);
        fsExtra.mkdirSync(Path.join(itemvendorPath, 'plugins'));
        fsExtra.mkdirSync(Path.join(itemvendorPath, 'langs'));
        fsExtra.mkdirSync(Path.join(itemvendorPath, 'skins'));
        fsExtra.mkdirSync(Path.join(itemvendorPath, 'themes'));
        fsExtra.mkdirSync(Path.join(itemvendorPath, 'templates'));
      }

      copyAll('plugins', 'tinymce', 'plugins');
      copyAll('skins', 'tinymce', 'skins');
      copyAll('themes', 'tinymce', 'themes');

      copyArrayFiles('', ['tinymce.js', 'tinymce.min.js', 'changelog.txt', 'license.txt'], 'tinymce', '');

      // Update the XML file for tinyMCE
      let tinyXml = fs.readFileSync(`${rootPath}/plugins/editors/tinymce/tinymce.xml`, { encoding: 'UTF-8' });
      tinyXml = tinyXml.replace(xmlVersionStr, `$1${options.dependencies.tinymce}$3`);
      fs.writeFileSync(`${rootPath}/plugins/editors/tinymce/tinymce.xml`, tinyXml, { encoding: 'UTF-8' });

      // Remove that sourcemap...
      let tinyWrongMap = fs.readFileSync(`${rootPath}/media/vendor/tinymce/skins/lightgray/skin.min.css`, { encoding: 'UTF-8' });
      tinyWrongMap = tinyWrongMap.replace('/*# sourceMappingURL=skin.min.css.map */', '');
      fs.writeFileSync(`${rootPath}/media/vendor/tinymce/skins/lightgray/skin.min.css`, tinyWrongMap, { encoding: 'UTF-8' });
    } else {
      ['js', 'css', 'filesExtra'].forEach((type) => {
        if (!vendor[type]) return;

        const dest = Path.join(mediaVendorPath, vendorName);
        copyFilesTo(vendor[type], modulePathRoot, dest, type);
      });

      // Copy the license if exists
      if (options.settings.vendors[packageName].licenseFilename &&
     fs.existsSync(`${Path.join(rootPath, `node_modules/${packageName}`)}/${options.settings.vendors[packageName].licenseFilename}`)
      ) {
        const dest = Path.join(mediaVendorPath, vendorName);
        fsExtra.copySync(`${Path.join(rootPath, `node_modules/${packageName}`)}/${options.settings.vendors[packageName].licenseFilename}`, `${dest}/${options.settings.vendors[packageName].licenseFilename}`);
      }
    }

    // Joomla's hack to expose the chosen base classes so we can extend it ourselves (it was better than the
    // many hacks we had before. But I'm still ashamed of myself.
    if (packageName === 'chosen-js') {
      const dest = Path.join(mediaVendorPath, vendorName);
      const chosenPath = `${dest}/${options.settings.vendors[packageName].js['chosen.jquery.js']}`;
      let ChosenJs = fs.readFileSync(chosenPath, { encoding: 'UTF-8' });
      ChosenJs = ChosenJs.replace('}).call(this);', '  document.AbstractChosen = AbstractChosen;\n' +
          '  document.Chosen = Chosen;\n' +
          '}).call(this);');
      fs.writeFileSync(chosenPath, ChosenJs, { encoding: 'UTF-8' });
    }

    // Add provided Assets to a registry, if any
    if (vendor.provideAssets && vendor.provideAssets.length) {
      vendor.provideAssets.forEach((assetInfo) => {

        const registryItem = {
          package: packageName,
          name:    assetInfo.name || vendorName,
          version: moduleOptions.version,
          dependencies: assetInfo.dependencies || [],
          js:  [],
          css: [],
          attribute: {}
        };

        // Update path for JS and CSS files
        assetInfo.js && assetInfo.js.length && assetInfo.js.forEach((assetJS) => {
          let itemPath = assetJS;

          // Check for external path
          if (itemPath.indexOf('http://') !== 0 && itemPath.indexOf('https://') !== 0 && itemPath.indexOf('//') !== 0) {
            itemPath = `media/vendor/${vendorName}/js/${itemPath}`;
          }
          registryItem.js.push(itemPath);

          // Check if there are any attribute to this file, then update the path
          if (assetInfo.attribute && assetInfo.attribute[assetJS]) {
            registryItem.attribute[itemPath] = assetInfo.attribute[assetJS]
          }
        });
        assetInfo.css && assetInfo.css.length && assetInfo.css.forEach((assetCSS) => {
          let itemPath = assetCSS;

          // Check for external path
          if (itemPath.indexOf('http://') !== 0 && itemPath.indexOf('https://') !== 0 && itemPath.indexOf('//') !== 0) {
            itemPath = `media/vendor/${vendorName}/css/${itemPath}`;
          }
          registryItem.css.push(itemPath);

          // Check if there are any attribute to this file, then update the path
          if (assetInfo.attribute && assetInfo.attribute[assetCSS]) {
            registryItem.attribute[itemPath] = assetInfo.attribute[assetCSS]
          }
        });

        registry.assets[registryItem.name] = registryItem;
      });
    }

    // eslint-disable-next-line no-console
    console.log(`${packageName} was updated.`);
  }

  // Write assets registry
  fs.writeFileSync(
    Path.join(mediaVendorPath, 'joomla.asset.json'),
    JSON.stringify(registry, null, 2),
    {encoding: 'UTF-8'}
  );
};

const recreateMediaFolder = () => {
	// eslint-disable-next-line no-console
	console.log(`Recreating the media folder...`);

    copydir.sync(Path.join(rootPath, 'build/media'), Path.join(rootPath, 'media'), function(stat, filepath, filename){
        if (stat === 'directory' && (filename === 'webcomponents' || filename === 'scss')) {
            return false;
        }
        return true;
    }, function(err){
        if (!err) {
            console.log('Legacy media files restored');
        }
    });

    copydir.sync(Path.join(rootPath, 'build/media_src'), Path.join(rootPath, 'media'), function(stat, filepath, filename){
        if (stat === 'directory' && filename === 'scss') {
            return false;
        }
        return true;
    }, function(err){
        if (!err) {
            console.log('Media folder structure was created');
        }
    });
};

// List all files in a directory recursively in a synchronous fashion
const walkSync = function(dir, filelist) {
	const files = fs.readdirSync(dir);
	filelist = filelist || [];
	files.forEach(function(file) {
		if (fs.statSync(Path.join(dir, file)).isDirectory()) {
			filelist = walkSync(Path.join(dir, file), filelist);
		}
		else {
			filelist.push(Path.join(dir, file));
		}
	});
	return filelist;
};

const uglifyLegacyFiles = () => {
    // Minify the legacy files
    console.log('Minifying legacy stylesheets/scripts...');
	const files = walkSync(`${rootPath}/media`);

	if (files.length) {
		files.forEach(
			(file) => {
			    if (file.match('/vendor')) {
			        return;
                }
				if (file.match(/.js/) && !file.match(/.min.js/) && !file.toLowerCase().match(/license/)) {
					console.log(`Processing: ${file}`);
					// Create the minified file
					fs.writeFileSync(file.replace('.js', '.min.js'), UglifyJS.minify(fs.readFileSync(file, 'utf8')).code, {encoding: 'utf8'});
				}
				if (file.match(/\.css/) && !file.match(/\.min\.css/) && !file.match(/\.css\.map/) && !file.toLowerCase().match(/license/)) {
					console.log(`Processing: ${file}`);
					// Create the minified file
					fs.writeFileSync(
						file.replace('.css', '.min.css'),
						UglyCss.processFiles([file], { expandVars: false }),
						{ encoding: 'utf8' },
					);
				}
			});
	}
};

const copyAssets = (options) => {
  Promise.resolve()
    // Copy a fresh version of the files
    .then(cleanVendors())

    // Copy a fresh version of the files
    .then(recreateMediaFolder())

    // Copy a fresh version of the files
    .then(copyFiles(options))

    // Uglify the legacy css/js files
    .then(uglifyLegacyFiles(options))

    // Handle errors
    .catch((err) => {
      // eslint-disable-next-line no-console
      console.error(err);
      process.exit(-1);
    });
};

module.exports.copyAssets = copyAssets;
