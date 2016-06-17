var gulp = require('gulp');
var typescript = require('gulp-typescript');
var argv = require('optimist').argv;

var source = argv.source || 'source';
var out = argv.out || 'output.js';
var dest = argv.dest || 'dest/';

gulp.task('compile', function(){
    gulp.src([source + '/*.ts'])
        .pipe(typescript({
            noImplicitAny: true,
            out: out
        }))
        .pipe(gulp.dest(dest));
});

module.exports = gulp;

