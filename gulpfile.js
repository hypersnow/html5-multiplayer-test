var gulp = require('gulp');
var jshint = require('gulp-jshint');
var uglify = require('gulp-uglify');
var connect = require('gulp-connect');
var sourcemaps = require('gulp-sourcemaps');
var browserify = require('browserify');
var watchify = require('watchify');
var assign = require('lodash.assign');
var buffer = require('vinyl-buffer');
var source = require('vinyl-source-stream');

var paths = {
	entry: 'client/src/client.js',
	scripts: ['client/src/*.js', 'client/src/**/*.js'],
	dist: 'client/dist'
};

gulp.task('default', ['connect', 'lint', 'buildwatch', 'watch']);

gulp.task('noserver', ['lint', 'buildwatch', 'watch']);

gulp.task('lint', function() {
    return gulp.src(paths.scripts)
        .pipe(jshint())
        .pipe(jshint.reporter('default'));
});

gulp.task('buildwatch', function() {
  var customOpts = {
    entries: [paths.entry],
    debug: true
  };
  var opts = assign({}, watchify.args, customOpts);
  var b = watchify(browserify(opts)); 

  var bundle = function() {
    return b.bundle()
      .pipe(source('html5-multiplayer-test.min.js'))
      .pipe(buffer())
      .pipe(sourcemaps.init({loadMaps: true}))
          .pipe(uglify())
      .pipe(sourcemaps.write('./'))
      .pipe(connect.reload())
      .pipe(gulp.dest(paths.dist));
  }
  b.on('update', bundle);
  return bundle();
});

gulp.task('build', function() {
  var b = browserify({
    entries: paths.entry,
    debug: true
  });

  return b.bundle()
    .pipe(source('html5-multiplayer-test.min.js'))
    .pipe(buffer())
    .pipe(sourcemaps.init({loadMaps: true}))
        .pipe(uglify())
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest(paths.dist));
});

gulp.task('connect', function() {
	connect.server({
		root: [__dirname + '/client'],
		port: process.env.PORT,
		livereload: true
	});
});

gulp.task('reload', function () {
  gulp.src(paths.entry)
    .pipe(connect.reload());
});

gulp.task('watch', function() {
    gulp.watch(paths.scripts, ['build', 'reload']);
});