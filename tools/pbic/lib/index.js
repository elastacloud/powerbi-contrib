var fs = require('fs');
var path = require('path');
var archiver = require('archiver');
var rmdir = require('rimraf');

var Pbic = (function(){
    //npm run index --name=name
    var visualName = (typeof process.env.npm_config_name) != 'undefined' ? process.env.npm_config_name : null;
    var sourceFolder = (typeof process.env.npm_config_source) != 'undefined' ? process.env.npm_config_source : null;;

    var tmpDir = 'tmp';
    var resourcesDir = 'resources';
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

    function removeDirectory() {
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

            removeDirectory();
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

    function createPackageJson(){
        var settings = {
            "build": "",
            "version": "1.0.0",
            "author": {
                "name": "Andy Cross",
                "email": "andy@elastacloud.com"
            },
        }

        var outputFilename = 'tmp/package.json';

        fs.writeFile(outputFilename, JSON.stringify(settings, null, 4), function(err) {
            if(err) {
                console.log(err);
            } else {
                console.log("JSON created in " + outputFilename);
            }
        });
    }

    function filterFiles(files){

        var allowedExt = ['.css', '.js', '.ts', '.png'];

        if (files.length) {
            console.log("Files found: ");
            files.map(function (file) {
                return path.join(sourceFolder, file);
            }).filter(function (file) {
                return fs.statSync(file).isFile();
            }).forEach(function (file) {
                if (allowedExt.indexOf(path.extname(file)) != -1) {
                    copyFileToFolder(file, false);
                }

                if(path.basename(file) == 'package.json'){
                    copyFileToFolder(file, true);
                }
                console.log("%s (%s)", file, path.extname(file));
            });
        }
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

        var files = getAllFiles(sourceFolder);
        if(files){
            filterFiles(files);
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