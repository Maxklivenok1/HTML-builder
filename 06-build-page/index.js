const path = require('path');
const fsPromises = require('fs/promises');
const fs = require('fs');

async function buildPage({
  toFolderPath,
  fromComponentsPath,
  fromCssPath,
  fromAssetsPath,
  toAssetsPath,
  templateHtmlFilePath,
  toHtmlFilePath,
  toCssFilePath,
}) {
  try {
    await fsPromises.rm(toFolderPath, { recursive: true, force: true });
    await fsPromises.mkdir(toFolderPath, { recursive: true });

    const components = await fsPromises.readdir(fromComponentsPath, { withFileTypes: true });
    let componentList = {};

    for (const component of components) {
      const componentFilePath = path.join(fromComponentsPath, component.name);
      const componentTemplateName = `{{${path.basename(component.name, '.html')}}}`;
      const componentMarkup = await fsPromises.readFile(componentFilePath, 'utf-8');

      componentList = {
        ...componentList, ...{
          [componentTemplateName]: componentMarkup,
        }
      };
    }

    let templateHtml = await fsPromises.readFile(templateHtmlFilePath, 'utf-8');
    templateHtml = templateHtml.replace(/{{\w+}}/ig, (template) => componentList[template]);
    await fsPromises.writeFile(toHtmlFilePath, templateHtml);

    mergeStyles(fromCssPath, toCssFilePath);
    copyFolder(fromAssetsPath, toAssetsPath);

  } catch (error) {
    console.log('error:', error);
  }
}

const toFolderPath = path.join(__dirname, 'project-dist');
const fromComponentsPath = path.join(__dirname, 'components');
const fromCssPath = path.join(__dirname, 'styles');
const fromAssetsPath = path.join(__dirname, 'assets');
const toAssetsPath = path.join(toFolderPath, 'assets');
const templateHtmlFilePath = path.join(__dirname, 'template.html');
const toHtmlFilePath = path.join(toFolderPath, 'index.html');
const toCssFilePath = path.join(toFolderPath, 'style.css');


buildPage({
  toFolderPath,
  fromComponentsPath,
  fromCssPath,
  fromAssetsPath,
  toAssetsPath,
  templateHtmlFilePath,
  toHtmlFilePath,
  toCssFilePath,
});

async function mergeStyles(fromFolderPath, toFilePath) {
  try {
    const folderItems = await fsPromises.readdir(fromFolderPath, { withFileTypes: true });
    const writableStream = fs.createWriteStream(toFilePath);
    for (let folderItem of folderItems) {
      if (folderItem.isFile() &&
                  path.extname(folderItem.name) === '.css'
      ) {
        const fromFilePath = path.join(fromFolderPath, folderItem.name);
        const readableStream = fs.createReadStream(fromFilePath, 'utf-8');
        readableStream.pipe(writableStream);
      }
    }
  }
  catch (error) {
    console.log('error:', error);
  }
}

async function copyFolder(fromFolderPath, toFolderPath) {
  try {
    await fsPromises.rm(toFolderPath, { recursive: true, force: true });
    await fsPromises.mkdir(toFolderPath, { recursive: true });
    const folderItems = await fsPromises.readdir(fromFolderPath, { withFileTypes: true });
  
    for (let folderItem of folderItems) {
      const fromItemPath = path.join(fromFolderPath, folderItem.name);
      const toItemPath = path.join(toFolderPath, folderItem.name);
  
      folderItem.isFile() ?
        fsPromises.copyFile(fromItemPath, toItemPath) :
        copyFolder(fromItemPath, toItemPath);
    }
  }
  catch (error) {
    console.log('error:', error);
  }
}