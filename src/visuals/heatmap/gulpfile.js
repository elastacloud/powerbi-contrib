var gulp = require('gulp');
var typescript = require('gulp-typescript');
var browserSync = require('browser-sync');
var less = require('gulp-less');

gulp.task('ts', function() {
    return gulp.src(['./src/**/*.ts', 'typings/browser.d.ts'])
        .pipe(typescript({
            module: 'commonjs'
        }))
        .pipe(gulp.dest('./dist'));
});


gulp.task('watch-ts', function() {
    gulp.watch(['./src/**/*.ts'], ['ts']);
});

gulp.task('browserSync', function() {
    browserSync.init({
        server: './',
        index: './index.html',
        port: 3030,
        files: ['./dist/*.*', './index.html']
    });
});

gulp.task('watch', ['watch-ts', 'browserSync'], function() {

});