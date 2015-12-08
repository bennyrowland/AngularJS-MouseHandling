/**
 * Created by ben on 08/12/15.
 */

var gulp = require('gulp');
var plugins = require('gulp-load-plugins')();
var mainBowerFiles = require('gulp-main-bower-files');
var es = require('event-stream');
var nodemon = require('gulp-nodemon');

var paths = {
    distBower: './ng-mouse-capture.js',
    distDemo: './build/demo',
    distLib: './build/lib',
    index: './src/demo/index.html',
    demoStyles: './src/demo/**/*.scss',
    libStyles: './src/lib/**/*.scss',
    libJs: './src/lib/**/*.js',
    demoJs: './src/demo/**/*.js'
};

var pipes = {};

pipes.builtAppScripts = function () {
    return gulp.src(paths.demoJs)
        .pipe(plugins.jshint())
        .pipe(plugins.jshint.reporter('jshint-stylish'))
        .pipe(gulp.dest(paths.distDemo));
};

pipes.builtExternalScripts = function() {
    return gulp.src('./bower.json')
        .pipe(mainBowerFiles({includeDev: true}))
        .pipe(gulp.dest(paths.distDemo))
};

pipes.builtLibScripts = function() {
    return gulp.src(paths.libJs)
        .pipe(plugins.jshint())
        .pipe(plugins.jshint.reporter('jshint-stylish'))
        .pipe(gulp.dest(paths.distLib))
};

pipes.builtLibStyles = function() {
    return gulp.src(paths.libStyles)
        .pipe(plugins.sass())
        .pipe(gulp.dest(paths.distLib))
};

pipes.builtDemoStyles = function() {
    return gulp.src(paths.demoStyles)
        .pipe(plugins.sass())
        .pipe(gulp.dest(paths.distDemo))
};

pipes.copiedStyles = function() {
    return pipes.builtLibStyles()
        .pipe(gulp.dest(paths.distDemo))
};

pipes.copiedLibScripts = function() {
    return pipes.builtLibScripts()
        .pipe(gulp.dest(paths.distDemo));
};

pipes.validatedIndex = function() {
    return gulp.src(paths.index)
        .pipe(plugins.htmlhint())
        .pipe(plugins.htmlhint.reporter());
};

pipes.builtIndex = function() {
    var externalScripts = pipes.builtExternalScripts();
    var orderedLibScripts = pipes.copiedLibScripts().pipe(plugins.angularFilesort());
    var libStyles = pipes.copiedStyles();
    var demoStyles = pipes.builtDemoStyles();
    var libInjections = es.merge(orderedLibScripts, libStyles);

    var appScripts = pipes.builtAppScripts();

    return pipes.validatedIndex()
        .pipe(gulp.dest(paths.distDemo))
        .pipe(plugins.inject(externalScripts, {relative: true, name: 'bower'}))
        .pipe(plugins.inject(libInjections, {relative: true}))
        .pipe(gulp.dest(paths.distDemo));
};

pipes.builtDemo = function() {
    return pipes.builtIndex();
};

pipes.builtDist = function() {
    return gulp.src(paths.libJs)
        .pipe(plugins.print())
        .pipe(plugins.concat('ng-mouse-capture.js'))
        .pipe(gulp.dest('.'));
};

gulp.task('build-dist', pipes.builtDist);

gulp.task('build-demo', pipes.builtDemo);

gulp.task('watch-demo', ['build-demo'], function() {
    // watch index
    gulp.watch(paths.demoJs, function() {
        return pipes.builtAppScripts()
            .pipe(plugins.print());
    });
    gulp.watch(paths.index, function() {
        return pipes.builtIndex();
    });
    gulp.watch(paths.libJs, function() {
        return pipes.copiedLibScripts();
    });
    gulp.watch(paths.libStyles, function() {
        return pipes.copiedStyles();
    });
    nodemon({
        exec: 'node ./node_modules/simplehttpserver/simplehttpserver.js build/demo',
        ext: 'js html json css',
        verbose: true,
        watch: 'build/demo'
    })
        .on('restart', function() { console.log('restarted'); })
});