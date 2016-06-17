var fs = require('fs');
var path = require('path');
var archiver = require('archiver');
var rmdir = require('rimraf');
var argv = require('optimist').argv;

var Pbic = (function(){
    //npm run index --name=name
    var visualName = argv.name || null;
    var sourceFolder = argv.source || null;
    //var sourceFolder = (typeof process.env.npm_config_source) != 'undefined' ? process.env.npm_config_source : null;;

    var tmpDir = 'tmp';
    var resourcesDir = 'resources';
    var allowedExt = ['.js', '.css', '', '.png', '' ,'.ts', '.json'];
    var packageJson = null;

    function init(){
        if (!sourceFolder) {
            console.log('You \'ve Missed a source folder! Use format: npm run index --name=name(optional if you have a package json) --source=path/to/source/folder');
            return false;
        }
        if(!visualName && sourceFolder){
            try{
                //reading package.json file
                var file = fs.readFileSync(sourceFolder + '/package.json');
                if(file){
                    packageJson = JSON.parse(file);
                    //Setting up name for visual
                    visualName = packageJson.visual.name;
                }
            } catch (e){
                console.log('There is no package.json in a source folder. So --name property is requred.')
                return false;
            }
        }

        return true;
    }

    function createDirectory(dirName) {
        if (!fs.existsSync(dirName)) {
            fs.mkdirSync(dirName);
        }
    }

    function createDirStructure() {
        createDirectory(tmpDir);
        createDirectory(tmpDir + '/' + resourcesDir);
    }

    function removeTmpDirectory() {
        rmdir(tmpDir, function (error) {
            if(error) console.log(error);
        });
    }

    function copyFileToFolder(file, isPackageJson) {
        fs.createReadStream(file)
            .pipe(fs.createWriteStream(tmpDir + '/' + (isPackageJson ? '' : resourcesDir + '/') + path.basename(file)));
    }

    function createVisual(visualName) {
        var output = fs.createWriteStream(visualName + '.pbiviz');
        var archive = archiver('zip');

        output.on('close', function () {
            console.log('Power Bi visual "' + visualName +'" was created successfully');
            console.log(visualName +'.pbiviz ' + archive.pointer() + ' total bytes');
            console.log('archiver has been finalized and the output file descriptor has closed.');


            removeTmpDirectory();
        });

        archive.on('error', function (err) {
            throw err;
        });

        archive.pipe(output);

        archive.bulk([
            {expand: true, cwd: tmpDir , src: ['**/*'], }
        ]);

        archive.finalize();
    }

    function createPackageJson(files){

        var settings = {
            "build": "1.0.0",
            "version": "1.0.0",
            "author": {
                "name": "Andy Cross",
                "email": "andy@elastacloud.com"
            },
            resources: [],
            "visual": {
                "name": visualName,
                "version": "0.0.1",
                "displayName": visualName,
                "guid": "",
                "description": visualName,
                "supportUrl": "http://www.elastacloud.com"
            },
            images: {
                "icon": {
                    "resourceId": ""
                }
            },
            "code": {
                "typeScript": {
                    "resourceId": ""
                },
                "javaScript": {
                    "resourceId": ""
                },
                "css": {
                    "resourceId": ""
                }
            }
        };
        settings.resources = createPackageJsonResources(files);

        settings.resources.forEach(function(resource){
            switch (resource.sourceType){
                case 0:
                    settings.code.javaScript.resourceId = resource.resourceId;
                    break;
                case 1:
                    settings.code.css.resourceId = resource.resourceId;
                    break;
                case 5:
                    settings.code.typeScript.resourceId = resource.resourceId;
                    break;
                case 3:
                    settings.images.icon.resourceId = resource.resourceId;
                    break;
            }
        });

        var outputFilename = 'tmp/package.json';

        fs.writeFile(outputFilename, JSON.stringify(settings, null, 4), function(err) {
            if(err) {
                console.log(err);
            } else {
                console.log("JSON created in " + outputFilename);
            }
        });
    }

    function createPackageJsonResources(files){
      var packageJsonResources = [];
       for(var i = 0; i < files.length; i++){
           packageJsonResources.push({
               "resourceId": "rId" + i,
               "sourceType": allowedExt.indexOf(path.extname(files[i])),
               "file": "resources/" + files[i]
           });
       }
        return packageJsonResources;
    }

    function copyFilesToFolder(files){

        var resourcesFiles = [];

        files.forEach(function(file){

            if(path.basename(file) == 'package.json'){
                copyFileToFolder(file, true);
            }else{
                copyFileToFolder(file, false);
                resourcesFiles.push(path.basename(file));
            }
            //console.log("%s (%s)", file, path.extname(file));
        });

        return resourcesFiles;
    }
    function filterFiles(files){

        if (files.length) {
            console.log("Files found: ");
            var filtered = [];
            files.map(function (file) {

                return path.join(sourceFolder, file);

            }).filter(function (file) {

                return fs.statSync(file).isFile();

            }).forEach(function (file) {

                if (allowedExt.indexOf(path.extname(file)) != -1) {
                    filtered.push(file);
                }
            });

            console.log(filtered);

            return filtered;
        }

        return false;
    }

    function getAllFiles(sourceFolder) {

        var files = fs.readdirSync(sourceFolder);

        if(files.length){
            return files;
        }

        return false;
    }

    function run(){

        if(!init()) {
            return;
        }

        //2 sync methods, should replace this with promises
        createDirStructure();

        //Getting all files, then filter them by extension
        var files = filterFiles(getAllFiles(sourceFolder));

        if(files){

            //copy filtered files to tmp or tmp/resources dir
            var resourcesList = copyFilesToFolder(files);

            if(visualName && sourceFolder && resourcesList.length){
                createPackageJson(resourcesList);
            }

            createVisual(visualName);
        }else{
            console.log('Empty source folder');
            return;
        }

    }

    return {
        run: run
    }
})();


Pbic.run(); //comment this if don't wan't execute from a CMD
exports.run = Pbic;